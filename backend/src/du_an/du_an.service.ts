import { ForbiddenException, Injectable, NotFoundException, BadRequestException, Query } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository} from 'typeorm';
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
        throw new NotFoundException('Người tạo không tồn tại.');
    }

    if (nguoiTao.vai_tro !== VaiTro.QUAN_LY) {
      throw new ForbiddenException('Chỉ Quản lý mới được phép tạo Dự án.'); 
    }

    if (!nguoiTao.phong_ban) {
      throw new ForbiddenException('Quản lý phải thuộc một Phòng ban để tạo Dự án.');
    }

    const startDate = new Date(taoDuAnDto.ngay_bat_dau);
    const endDate = new Date(taoDuAnDto.ngay_ket_thuc_du_kien);

    if (startDate > endDate) {
        throw new BadRequestException('Ngày bắt đầu không được sau ngày kết thúc dự kiến.');
    }

    const duAnMoi = this.duAnRepository.create({
      ...taoDuAnDto,
      nguoi_quan_ly: { id: nguoiTao.id },
      phong_ban: { id: nguoiTao.phong_ban.id }, 
    } as unknown as DuAn); 

    return this.duAnRepository.save(duAnMoi);
  }

 /** 2. LẤY TẤT CẢ DỰ ÁN */
async layTatCaDuAn(idNguoiDung: string, trangThai?: string, page: number = 1, limit: number = 5): Promise<DuAn[]> {
    const nguoiDung = await this.nguoiDungRepository.findOne({
      where: { id: idNguoiDung },
      relations: ['phong_ban'], 
    });

    if (!nguoiDung) { throw new NotFoundException('Nguoi dung khong ton tai.'); }

    if (!nguoiDung.phong_ban) {
      return [];
    }

    const dieuKienTimKiem: any = {
      phong_ban: { 
          id: nguoiDung.phong_ban.id 
      }
    };

    if (trangThai && trangThai.toLowerCase() !== 'tat_ca') {
      const statusToFilter = trangThai.toLowerCase();
      dieuKienTimKiem.trang_thai = statusToFilter;
    }

    const take = limit > 0 ? limit : 5;
    const skip = (page > 0 ? page - 1 : 0) * take;
    
    return this.duAnRepository.find({
      where: dieuKienTimKiem,
      relations: ['nguoi_quan_ly', 'phong_ban'], 
      order: {
        ngay_tao: 'DESC',
      },
      take: take, 
      skip: skip,
    });
  }
  
  /** 3. LẤY CHI TIẾT DỰ ÁN */
async layChiTietDuAn(idNguoiDung: string, idDuAn: string): Promise<DuAn> {
    const duAn = await this.duAnRepository.createQueryBuilder('duAn')
        .leftJoinAndSelect('duAn.nguoi_quan_ly', 'nguoi_quan_ly')   
        .leftJoinAndSelect('duAn.phong_ban', 'phong_ban')         
        
        .leftJoinAndSelect('duAn.cong_viec', 'cong_viec')        
        .leftJoinAndSelect('cong_viec.nguoi_thuc_hien', 'nguoi_thuc_hien') 
        .leftJoinAndSelect('cong_viec.nguoi_giao_viec', 'nguoi_giao_viec')
        
        .where('duAn.id = :idDuAn', { idDuAn })
        .getOne();

    if (!duAn) {
        throw new NotFoundException('Dự án không tồn tại.');
    }
    
    const nguoiDung = await this.nguoiDungRepository.findOne({
        where: { id: idNguoiDung },
        relations: ['phong_ban'],
    });
    
    if (!nguoiDung) {
        throw new NotFoundException('Người dùng không tồn tại.');
    }

    if (!nguoiDung.phong_ban || nguoiDung.phong_ban.id !== duAn.phong_ban.id) {
        throw new ForbiddenException('Bạn không có quyền truy cập Dự án của phòng ban khác.');
    }

    return duAn;
}

  /** 4. CẬP NHẬT DỰ ÁN */
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

    if (duAn.trang_thai === TrangThaiDuAn.HOAN_THANH || duAn.trang_thai === TrangThaiDuAn.HUY) {

        if (Object.keys(capNhatDuAnDto).length > 0) {
             throw new ForbiddenException(`Không thể chỉnh sửa dự án ở trạng thái ${duAn.trang_thai}.`);
        }
    }

    if (duAn.phong_ban.id !== nguoiDung.phong_ban.id) {
        throw new ForbiddenException('Bạn không có quyền cập nhật Dự án của phòng ban khác.');
    }

    if (capNhatDuAnDto.ngay_bat_dau || capNhatDuAnDto.ngay_ket_thuc_du_kien) {
        const startDate = capNhatDuAnDto.ngay_bat_dau 
                             ? new Date(capNhatDuAnDto.ngay_bat_dau) 
                             : new Date(duAn.ngay_bat_dau);
        const endDate = capNhatDuAnDto.ngay_ket_thuc_du_kien 
                          ? new Date(capNhatDuAnDto.ngay_ket_thuc_du_kien) 
                          : new Date(duAn.ngay_ket_thuc_du_kien);

        if (startDate > endDate) {
            throw new BadRequestException('Ngày bắt đầu không được sau ngày kết thúc dự kiến.');
        }
    }

    const trangThaiMoi = capNhatDuAnDto.trang_thai;
    const trangThaiHoanThanh = TrangThaiDuAn.HOAN_THANH;

    if (trangThaiMoi && trangThaiMoi === trangThaiHoanThanh) {
        const congViecChuaHoanThanh = duAn.cong_viec.filter(
            cv => cv.trang_thai !== TrangThaiCongViec.PHE_DUYET
        );

        if (congViecChuaHoanThanh.length > 0) { 
            throw new ForbiddenException(
                `Không thể chuyển trạng thái thành HOÀN THÀNH. Còn ${congViecChuaHoanThanh.length} công việc chưa được PHÊ DUYỆT.`
            );
        }
    }

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
        throw new NotFoundException('Người dùng không tồn tại.');
    }
    
    if (nguoiDung.vai_tro !== VaiTro.QUAN_LY) {
        throw new ForbiddenException('Bạn không có quyền xóa Dự án. Chỉ Quản lý mới được phép.');
    }

    const duAn = await this.duAnRepository.findOne({
        where: { id: idDuAn },
        relations: ['phong_ban', 'cong_viec', 'cong_viec.nguoi_thuc_hien'],
    });

    if (!duAn) {
        throw new NotFoundException('Dự án không tồn tại.');
    }

    if (!nguoiDung.phong_ban || duAn.phong_ban.id !== nguoiDung.phong_ban.id) {
        throw new ForbiddenException('Bạn không có quyền xóa Dự án của phòng ban khác.');
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