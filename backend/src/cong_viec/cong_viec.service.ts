import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, Between, In, LessThan } from 'typeorm';
import { TaoCongViecDto } from './dto/tao_cong_viec.dto';
import { CapNhatCongViecDto } from './dto/cap_nhat_cong_viec.dto';
import { CongViec, TrangThaiCongViec } from 'src/entities/cong_viec.entity';
import { NguoiDung, VaiTro } from 'src/entities/nguoi_dung.entity';
import { DuAn, TrangThaiDuAn } from 'src/entities/du_an.entity';
import { format, startOfDay, addDays, endOfDay} from 'date-fns';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';

@Injectable()
export class CongViecService {
  constructor(
    @InjectRepository(CongViec)
    private congViecRepository: Repository<CongViec>,
    @InjectRepository(NguoiDung)
    private nguoiDungRepository: Repository<NguoiDung>,
    @InjectRepository(DuAn)
    private duAnRepository: Repository<DuAn>,
    @InjectQueue('task_reminder') private taskReminderQueue: Queue,
  ) {}

  /**
   * 1. TẠO CÔNG VIỆC
   */
  async taoCongViec(idNguoiTao: string, taoCongViecDto: TaoCongViecDto): Promise<CongViec> {
    const { id_du_an, id_nguoi_thuc_hien, ...rest } = taoCongViecDto;

    const nguoiTao = await this.nguoiDungRepository.findOne({
      where: { id: idNguoiTao },
      relations: ['phong_ban'],
    });

    if (!nguoiTao || nguoiTao.vai_tro !== VaiTro.QUAN_LY || !nguoiTao.phong_ban) {
      throw new ForbiddenException('Chi Quan ly moi co quyen giao viec va ban phai thuoc mot phong ban.');
    }
    const idPhongBanQuanLy = nguoiTao.phong_ban.id;

    const duAn = await this.duAnRepository.findOne({ 
        where: { id: id_du_an }, 
        relations: ['phong_ban'] 
    });
    const nhanVien = await this.nguoiDungRepository.findOneBy({ id: id_nguoi_thuc_hien });

    // SỬA LỖI: Bổ sung null check
    if (!duAn) { throw new NotFoundException('Du an khong ton tai.'); }
    if (!nhanVien) { throw new NotFoundException('Nguoi thuc hien khong ton tai.'); }

    if (nhanVien.trang_thai_hoat_dong === false) {
      throw new ForbiddenException('Khong the giao viec cho tai khoan khong hoat dong.');
    }

    if (taoCongViecDto.han_chot && new Date(taoCongViecDto.han_chot) < duAn.ngay_tao) {
        throw new ForbiddenException('Han chot cua cong viec khong the som hon ngay tao du an.');
    }


    if (duAn.phong_ban.id !== idPhongBanQuanLy) { throw new ForbiddenException('Du an khong thuoc phong ban cua ban.'); }
    if (nhanVien.phongBanId !== idPhongBanQuanLy) { throw new ForbiddenException('Nhan vien khong thuoc phong ban cua ban.'); }
    
    const congViecMoi = this.congViecRepository.create({
      ...rest,
      duAnId: id_du_an,
      nguoiThucHienId: id_nguoi_thuc_hien,
      nguoiGiaoViecId: idNguoiTao,
    } as unknown as CongViec); 

    const result = await this.congViecRepository.save(congViecMoi);

    // BỔ SUNG LOGIC GỬI EMAIL
    if (nhanVien.email) {
      await this.taskReminderQueue.add('send_new_task_email', {
        to: nhanVien.email,
        subject: 'Bạn có một công việc mới được giao',
        template: 'new-task',
        context: {
          ho_ten: nhanVien.ho_ten,
          tieu_de: congViecMoi.tieu_de,
          han_chot: format(congViecMoi.han_chot, 'dd/MM/yyyy'),
        }
      });
    }
    return result;
}

  /**
   * 2. XEM TẤT CẢ
   */
  async findAll(idNguoiDung: string): Promise<CongViec[]> {
    const nguoiDung = await this.nguoiDungRepository.findOne({
      where: { id: idNguoiDung },
      relations: ['phong_ban'],
    });

    if (!nguoiDung) { throw new NotFoundException('Nguoi dung khong ton tai.'); }

    let dieuKienTimKiem: any = {};

    if (nguoiDung.vai_tro === VaiTro.QUAN_LY && nguoiDung.phong_ban) {
      dieuKienTimKiem = {
        du_an: {
          phong_ban: {
            id: nguoiDung.phong_ban.id,
          },
        },
      };
    } 
    else if (nguoiDung.vai_tro === VaiTro.NHAN_VIEN) {
      dieuKienTimKiem = {
        nguoi_thuc_hien: {
          id: idNguoiDung,
        },
      };
    } 
    else {
      return [];
    }

    return this.congViecRepository.find({
      where: dieuKienTimKiem,
      relations: ['du_an', 'nguoi_thuc_hien', 'nguoi_giao_viec'],
      order: {
        ngay_tao: 'DESC',
      },
    });
  }

  /**
   * 3. XEM CHI TIẾT CÔNG VIỆC
   */
  async findOne(idNguoiDung: string, idCongViec: string): Promise<CongViec> {
    const congViec = await this.congViecRepository.findOne({
      where: { id: idCongViec },
      relations: ['du_an', 'nguoi_thuc_hien', 'nguoi_giao_viec'],
    });

    if (!congViec) { throw new NotFoundException('Cong viec khong ton tai.'); }
    
    const nguoiDung = await this.nguoiDungRepository.findOneBy({ id: idNguoiDung });

    if (nguoiDung?.vai_tro === VaiTro.QUAN_LY) {
        return congViec; 
    }
    
    if (congViec.nguoiThucHienId === idNguoiDung) {
        return congViec;
    }
    
    throw new ForbiddenException('Ban khong co quyen truy cap cong viec nay.');
  }

  /**
   * HÀM NỘI BỘ: Kiểm tra quy tắc chuyển trạng thái (REVIEW WORKFLOW)
   */
  private kiemTraChuyenTrangThaiHopLe(
    nguoiDung: NguoiDung,
    congViecHienTai: CongViec,
    trangThaiMoi: TrangThaiCongViec, // Chỉ chấp nhận trạng thái mới
  ): void {
    const vaiTro = nguoiDung.vai_tro;
    const trangThaiCu = congViecHienTai.trang_thai;
    
    if (trangThaiCu === TrangThaiCongViec.PHE_DUYET) {
      throw new ForbiddenException('Khong the thay doi cong viec da duoc Phe Duyet cuoi cung.');
    }

    if (vaiTro === VaiTro.QUAN_LY) {
      return; 
    }

    // NHÂN VIÊN: Chỉ được phép chuyển đổi theo luồng đã định
    if (vaiTro === VaiTro.NHAN_VIEN) {
      if (congViecHienTai.nguoiThucHienId !== nguoiDung.id) {
        throw new ForbiddenException('Ban khong phai nguoi thuc hien cong viec nay.');
      }

      const chuyenHopLe = (trangThaiCu === TrangThaiCongViec.CAN_LAM && trangThaiMoi === TrangThaiCongViec.DANG_LAM) ||
                        (trangThaiCu === TrangThaiCongViec.CAN_LAM && trangThaiMoi === TrangThaiCongViec.CHO_DUYET) || 
                        (trangThaiCu === TrangThaiCongViec.DANG_LAM && trangThaiMoi === TrangThaiCongViec.CHO_DUYET) ||
                        (trangThaiCu === TrangThaiCongViec.CAN_SUA && trangThaiMoi === TrangThaiCongViec.DANG_LAM);

      if (!chuyenHopLe) {
        throw new ForbiddenException(`Nhan vien khong duoc phep chuyen trang thai tu '${trangThaiCu}' sang '${trangThaiMoi}'.`);
      }
    }
  }

  /**
   * 4A. HÀM MỚI: CHUYÊN BIỆT CẬP NHẬT TRẠNG THÁI (CHỈ CHO NHÂN VIÊN)
   */
  async capNhatTrangThaiNhanVien(idNguoiDung: string, idCongViec: string, trangThaiMoi: TrangThaiCongViec): Promise<CongViec> {
    
    const nguoiDung = await this.nguoiDungRepository.findOneBy({ id: idNguoiDung });
    if (!nguoiDung) { throw new NotFoundException('Nguoi dung khong ton tai.'); }
    
    const congViec = await this.congViecRepository.findOneBy({ id: idCongViec });
    if (!congViec) { throw new NotFoundException('Cong viec khong ton tai.'); }

    // Chỉ kiểm tra luồng trạng thái
    this.kiemTraChuyenTrangThaiHopLe(nguoiDung, congViec, trangThaiMoi); 
    
    // Cập nhật trạng thái
    congViec.trang_thai = trangThaiMoi;

    return this.congViecRepository.save(congViec);
  }

  /**
   * 4. CẬP NHẬT CÔNG VIỆC CHUNG (CHỦ YẾU DÙNG CHO QUẢN LÝ SỬA CONTENT)
   */
  async update(idNguoiDung: string, idCongViec: string, capNhatCongViecDto: CapNhatCongViecDto): Promise<CongViec> {
    const { trang_thai: trangThaiMoi, id_du_an, id_nguoi_thuc_hien } = capNhatCongViecDto;

    const nguoiDung = await this.nguoiDungRepository.findOneBy({ id: idNguoiDung });
    if (!nguoiDung) { throw new NotFoundException('Nguoi dung khong ton tai.'); }
    
    const congViec = await this.congViecRepository.findOne({
      where: { id: idCongViec },
      relations: ['du_an', 'nguoi_thuc_hien'],
    });
    if (!congViec) { throw new NotFoundException('Cong viec khong ton tai.'); }
    
    const trangThaiCu = congViec.trang_thai;
    
    if (trangThaiMoi) { 
        this.kiemTraChuyenTrangThaiHopLe(nguoiDung, congViec, trangThaiMoi); 
    }
    
    Object.assign(congViec, capNhatCongViecDto); 
    
    if (id_du_an) congViec.duAnId = id_du_an;
    if (id_nguoi_thuc_hien) congViec.nguoiThucHienId = id_nguoi_thuc_hien;

    if (trangThaiMoi) congViec.trang_thai = trangThaiMoi;

    const result = await this.congViecRepository.save(congViec);

    console.log(`Đang kiểm tra: Trạng thái CŨ: ${trangThaiCu}, Trạng thái MỚI: ${trangThaiMoi}`);
    // --- LOGIC MỚI: GỬI EMAIL THÔNG BÁO PHÊ DUYỆT ---
    if (trangThaiCu === TrangThaiCongViec.CHO_DUYET && trangThaiMoi === TrangThaiCongViec.PHE_DUYET) {
        if (congViec.nguoi_thuc_hien && congViec.nguoi_thuc_hien.email) {
            await this.taskReminderQueue.add('send_task_approval_email', {
              to: congViec.nguoi_thuc_hien.email,
              subject: 'Công việc của bạn đã được phê duyệt',
              template: 'task-approval',
              context: {
                ho_ten: congViec.nguoi_thuc_hien.ho_ten,
                tieu_de: result.tieu_de,
                ten_du_an: congViec.du_an.ten_du_an,
              }
            });
        }
    }

    // --- LOGIC MỚI: GỬI EMAIL THÔNG BÁO CẦN SỬA ---
    if (trangThaiCu === TrangThaiCongViec.CHO_DUYET && trangThaiMoi === TrangThaiCongViec.CAN_SUA) {
        if (congViec.nguoi_thuc_hien && congViec.nguoi_thuc_hien.email) {
            await this.taskReminderQueue.add('send_task_rejection_email', {
              to: congViec.nguoi_thuc_hien.email,
              subject: 'Công việc của bạn cần sửa lại',
              template: 'task-rejection',
              context: {
                ho_ten: congViec.nguoi_thuc_hien.ho_ten,
                tieu_de: result.tieu_de,
                ten_du_an: congViec.du_an.ten_du_an,
                mo_ta: result.mo_ta,
              }
            });
        }
    }
    return result;
  }

  /**
   * 5. XÓA CÔNG VIỆC (CHỈ QUẢN LÝ)
   */
  async remove(idNguoiDung: string, idCongViec: string): Promise<DeleteResult> {
    const nguoiDung = await this.nguoiDungRepository.findOne({
      where: { id: idNguoiDung },
      relations: ['phong_ban'],
    });
    
    if (!nguoiDung || nguoiDung.vai_tro !== VaiTro.QUAN_LY) {
      throw new ForbiddenException('Chi Quan ly moi co quyen xoa cong viec.');
    }
    
    const congViec = await this.congViecRepository.findOne({
      where: { id: idCongViec },
      relations: ['du_an', 'nguoi_thuc_hien'], 
    });
    
    if (!congViec) { throw new NotFoundException('Cong viec khong ton tai.'); }
    
    // --- LOGIC GỬI EMAIL THÔNG BÁO HỦY CÔNG VIỆC ---
    if (congViec.nguoi_thuc_hien && congViec.nguoi_thuc_hien.email) {
        await this.taskReminderQueue.add('send_task_cancellation_email', {
            to: congViec.nguoi_thuc_hien.email,
            subject: 'Công việc của bạn đã bị hủy',
            template: 'task-cancellation', 
            context: {
                ho_ten: congViec.nguoi_thuc_hien.ho_ten,
                tieu_de: congViec.tieu_de,
                ten_du_an: congViec.du_an.ten_du_an,
            },
        });
    }

    const ketQua = await this.congViecRepository.delete(idCongViec);
    return ketQua;
  }

  /**
   * HÀM MỚI: TÌM CÔNG VIỆC SẮP ĐẾN HẠN
   */
  async findTasksDueSoon(date: Date): Promise<CongViec[]> {
      const today = new Date();
      const tomorrow = addDays(startOfDay(today), 1);
      const dayAfterTomorrow = addDays(endOfDay(today), 2);

      return this.congViecRepository.find({
          where: {
              trang_thai: In([
                  TrangThaiCongViec.CAN_LAM,
                  TrangThaiCongViec.DANG_LAM,
                  TrangThaiCongViec.CHO_DUYET,
                  TrangThaiCongViec.CAN_SUA,
              ]),
              han_chot: Between(tomorrow, dayAfterTomorrow),
          },
          relations: ['nguoi_thuc_hien', 'du_an'],
      });
  }

  /**
   * HÀM MỚI: TÌM CÔNG VIỆC QUÁ HẠN
   */
  async findOverdueTasks(): Promise<CongViec[]> {
      const now = new Date();
      return this.congViecRepository.find({
          where: {
              trang_thai: In([
                  TrangThaiCongViec.CAN_LAM,
                  TrangThaiCongViec.DANG_LAM,
                  TrangThaiCongViec.CHO_DUYET,
                  TrangThaiCongViec.CAN_SUA,
              ]),
              han_chot: LessThan(now), 
          },
          relations: ['nguoi_thuc_hien', 'du_an'],
      });
  }

  async findPendingTasks(): Promise<CongViec[]> {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return this.congViecRepository.find({
    where: [
      { trang_thai: TrangThaiCongViec.CAN_LAM },
      { trang_thai: TrangThaiCongViec.DANG_LAM },
    ],
    relations: ['nguoi_thuc_hien', 'du_an'],
  });
}

}