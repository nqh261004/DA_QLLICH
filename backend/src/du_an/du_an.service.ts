import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { DuAn, TrangThaiDuAn } from 'src/entities/du_an.entity';
import { NguoiDung, VaiTro } from 'src/entities/nguoi_dung.entity';
import { TaoDuAnDto } from './dto/tao_du_an.dto';
import { CapNhatDuAnDto } from './dto/cap_nhat_du_an.dto';
import { CongViec, TrangThaiCongViec } from 'src/entities/cong_viec.entity';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class DuAnService {
  constructor(
    @InjectRepository(DuAn)
    private duAnRepository: Repository<DuAn>,
    @InjectRepository(NguoiDung)
    private nguoiDungRepository: Repository<NguoiDung>,
    @InjectRepository(CongViec)
    private congViecRepository: Repository<CongViec>,
    @InjectQueue('task_reminder') private taskReminderQueue: Queue,
  ) {}

  /** 1. TẠO DỰ ÁN */
  async taoDuAn(idNguoiTao: string, taoDuAnDto: TaoDuAnDto): Promise<DuAn> {
    const nguoiTao = await this.nguoiDungRepository.findOne({
      where: { id: idNguoiTao },
      relations: ['phong_ban'],
    });

    if (!nguoiTao) {
        throw new NotFoundException('Nguoi dung tao du an khong ton tai.');
    }

    if (nguoiTao.vai_tro !== VaiTro.QUAN_LY) {
      throw new ForbiddenException('Chi Quan ly moi duoc phep tao Du an.'); 
    }

    if (!nguoiTao.phong_ban) {
      throw new ForbiddenException('Quan ly chua duoc gan vao Phong ban nao.');
    }

    const duAnMoi = this.duAnRepository.create({
      ...taoDuAnDto,
      nguoi_quan_ly: { id: nguoiTao.id },
      phong_ban: { id: nguoiTao.phong_ban.id }, 
    } as unknown as DuAn); 

    return this.duAnRepository.save(duAnMoi);
  }

 /** 2. LẤY TẤT CẢ DỰ ÁN */
  async layTatCaDuAn(idNguoiDung: string): Promise<DuAn[]> {
    const nguoiDung = await this.nguoiDungRepository.findOne({
      where: { id: idNguoiDung },
    });

    const idPhongBan = nguoiDung?.phongBanId;

    // Nếu không tìm thấy người dùng HOẶC ID khóa ngoại bị null, trả về mảng rỗng.
    if (!idPhongBan) {
      return [];
    }

    return this.duAnRepository.find({
      // Lọc theo ID phòng ban (Dùng quan hệ để lọc)
      where: { phong_ban: { id: idPhongBan } }, 
      relations: ['nguoi_quan_ly', 'phong_ban'], 
    });
  }

  /** 3. LẤY CHI TIẾT DỰ ÁN */
  async layChiTietDuAn(idNguoiDung: string, idDuAn: string): Promise<DuAn> {
    const duAn = await this.duAnRepository.findOne({
      where: { id: idDuAn },
      relations: ['nguoi_quan_ly', 'phong_ban'],
    });

    if (!duAn) {
      throw new NotFoundException('Du an khong ton tai');
    }
    
    const nguoiDung = await this.nguoiDungRepository.findOne({
        where: { id: idNguoiDung },
        relations: ['phong_ban'],
    });
    
    if (!nguoiDung) {
        throw new NotFoundException('Nguoi dung khong ton tai.');
    }

    if (!nguoiDung.phong_ban || nguoiDung.phong_ban.id !== duAn.phong_ban.id) {
        throw new ForbiddenException('Ban khong co quyen truy cap du an nay.');
    }

    return duAn;
  }

async capNhatDuAn(idNguoiDung: string, idDuAn: string, capNhatDuAnDto: CapNhatDuAnDto): Promise<DuAn> {
    const nguoiDung = await this.nguoiDungRepository.findOne({
        where: { id: idNguoiDung },
        relations: ['phong_ban'],
    });

    if (!nguoiDung || nguoiDung.vai_tro !== VaiTro.QUAN_LY) {
        throw new ForbiddenException('Bạn không có quyền cập nhật Dự án. Chỉ Quản lý mới được phép.');
    }

    const duAn = await this.duAnRepository.findOne({
        where: { id: idDuAn },
        relations: ['phong_ban', 'cong_viec', 'cong_viec.nguoi_thuc_hien'],
    });

    if (!duAn) { throw new NotFoundException('Dự án không tồn tại'); }

    if (duAn.phong_ban.id !== nguoiDung.phong_ban.id) {
        throw new ForbiddenException('Bạn không có quyền cập nhật Dự án của phòng ban khác.');
    }

    const trangThaiHienTai = duAn.trang_thai;
    const trangThaiMoi = capNhatDuAnDto.trang_thai;

    // Logic Khóa Dự án khi đã ở trạng thái cuối cùng
    if (trangThaiHienTai === TrangThaiDuAn.HOAN_THANH || trangThaiHienTai === TrangThaiDuAn.HUY) {
        if (trangThaiMoi !== undefined) {
             throw new ForbiddenException(`Du an da o trang thai ${trangThaiHienTai} va khong the thay doi trang thai.`);
        }
    }

    // Logic Task-based Integrity
    const trangThaiHoanThanh = TrangThaiDuAn.HOAN_THANH;
    if (trangThaiMoi && trangThaiMoi === trangThaiHoanThanh) {
        const congViecChuaHoanThanh = duAn.cong_viec.filter(
            cv => cv.trang_thai !== TrangThaiCongViec.PHE_DUYET
        );

        if (congViecChuaHoanThanh.length > 0) {
            throw new ForbiddenException(
                `Khong the chuyen sang trang thai HOAN THÀNH. Còn ${congViecChuaHoanThanh.length} công việc chưa được PHE DUYET cuoi cung.`
            );
        }
    }

    // --- LOGIC CASCADING KHI CHUYỂN SANG HUY & GỬI EMAIL ---
    if (trangThaiMoi && trangThaiMoi === TrangThaiDuAn.HUY) {
        const activeTasks = duAn.cong_viec.filter(
            cv => cv.trang_thai !== TrangThaiCongViec.PHE_DUYET && cv.trang_thai !== TrangThaiCongViec.BI_HUY
        );

        const tasksToUpdate = activeTasks.map(task => {
            task.trang_thai = TrangThaiCongViec.BI_HUY;
            return task;
        });

        if (tasksToUpdate.length > 0) {
            await this.congViecRepository.save(tasksToUpdate);
        }

        // Gửi email cho tất cả người thực hiện công việc
        const uniqueRecipients = new Set(duAn.cong_viec.map(cv => cv.nguoi_thuc_hien?.email));
        for (const email of uniqueRecipients) {
            if (email) {
                await this.taskReminderQueue.add('send_project_cancellation_email', {
                  to: email,
                  subject: 'Dự án đã huỷ',
                  template: 'project-cancellation',
                  context: {
                    ho_ten: duAn.cong_viec.find(cv => cv.nguoi_thuc_hien?.email === email)?.nguoi_thuc_hien.ho_ten,
                    ten_du_an: duAn.ten_du_an,
                  },
                });
            }
        }
    }

    Object.assign(duAn, capNhatDuAnDto);
    return this.duAnRepository.save(duAn);
}
  
  /** 5. XÓA DỰ ÁN */
  async xoaDuAn(idNguoiDung: string, idDuAn: string): Promise<DeleteResult> {
    const nguoiDung = await this.nguoiDungRepository.findOne({
        where: { id: idNguoiDung },
        relations: ['phong_ban'],
    });

    if (!nguoiDung) {
        throw new NotFoundException('Nguoi dung khong ton tai.');
    }
    
    if (nguoiDung.vai_tro !== VaiTro.QUAN_LY) {
        throw new ForbiddenException('Ban khong co quyen xoa Du an. Chi Quan ly moi duoc phep.');
    }

    const duAn = await this.duAnRepository.findOne({
        where: { id: idDuAn },
        relations: ['phong_ban', 'cong_viec', 'cong_viec.nguoi_thuc_hien'],
    });

    if (!duAn) {
        throw new NotFoundException('Du an khong ton tai');
    }

    if (!nguoiDung.phong_ban || duAn.phong_ban.id !== nguoiDung.phong_ban.id) {
        throw new ForbiddenException('Ban khong co quyen xoa Du an cua phong ban khac.');
    }

    const uniqueRecipients = new Set(duAn.cong_viec.map(cv => cv.nguoi_thuc_hien?.email));
    for (const email of uniqueRecipients) {
      if (email) {
        await this.taskReminderQueue.add('send_project_cancellation_email', {
          to: email,
          subject: `Dự án đã bị xóa`,
          template: 'project-cancellation',
          context: {
            ho_ten: duAn.cong_viec.find(cv => cv.nguoi_thuc_hien?.email === email)?.nguoi_thuc_hien.ho_ten,
            ten_du_an: duAn.ten_du_an,
          },
        });
      }
    }

    const ketQua = await this.duAnRepository.delete(idDuAn);
    return ketQua;
  }
}