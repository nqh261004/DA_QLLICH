import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, Between, In, LessThan } from 'typeorm';
import { TaoCongViecDto } from './dto/tao_cong_viec.dto';
import { CapNhatCongViecDto } from './dto/cap_nhat_cong_viec.dto';
import { CongViec, TrangThaiCongViec } from 'src/entities/cong_viec.entity';
import { NguoiDung, VaiTro } from 'src/entities/nguoi_dung.entity';
import { DuAn, TrangThaiDuAn } from 'src/entities/du_an.entity';
import { format, startOfDay, addDays, endOfDay, isBefore, isAfter} from 'date-fns';
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

    if (!duAn) { throw new NotFoundException('Du an khong ton tai.'); }
    if (!nhanVien) { throw new NotFoundException('Nguoi thuc hien khong ton tai.'); }

    if (nhanVien.trang_thai_hoat_dong === false) {
      throw new ForbiddenException('Khong the giao viec cho tai khoan khong hoat dong.');
    }

    if (taoCongViecDto.han_chot && duAn.ngay_bat_dau && duAn.ngay_ket_thuc_du_kien) {
        
        const taskDeadline = new Date(taoCongViecDto.han_chot);
        const projectStart = new Date(duAn.ngay_bat_dau);
        const projectEnd = new Date(duAn.ngay_ket_thuc_du_kien);

        const deadlineDateOnly = startOfDay(taskDeadline);
        const projectStartDateOnly = startOfDay(projectStart);
        const projectEndDateOnly = startOfDay(projectEnd);

        // 1. Công việc không được có hạn chót trước ngày tạo dự án
        if (isBefore(deadlineDateOnly, startOfDay(duAn.ngay_tao))) {
        throw new ForbiddenException('Han chot cua cong viec khong the som hon ngay tao du an.');
        }

        // 2. Công việc không được có hạn chót trước ngày BẮT ĐẦU dự án
        if (isBefore(deadlineDateOnly, projectStartDateOnly)) {
            throw new BadRequestException(`Han chot cong viec (${format(taskDeadline, 'dd/MM/yyyy')}) khong duoc truoc ngay bat dau du an (${format(projectStart, 'dd/MM/yyyy')}).`);
        }

        // 3. Công việc không được có hạn chót sau ngày KẾT THÚC dự án
        // Sử dụng isAfter() để kiểm tra nghiêm ngặt: KHÔNG ĐƯỢC SAU.
        if (isAfter(deadlineDateOnly, projectEndDateOnly)) { // 🔥 SỬ DỤNG isAfter ĐỂ SO SÁNH NGÀY
            throw new BadRequestException(`Han chot cong viec (${format(taskDeadline, 'dd/MM/yyyy')}) khong duoc sau ngay ket thuc du an (${format(projectEnd, 'dd/MM/yyyy')}).`);
        }
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
async findAll(
    idNguoiDung: string,
    vaiTro: VaiTro,
    trangThai?: string,
    page: number = 1, 
    limit: number = 5 // Giả định Controller gửi số
): Promise<CongViec[]> {
    const nguoiDung = await this.nguoiDungRepository.findOne({
      where: { id: idNguoiDung },
      relations: ['phong_ban'],
    });

    if (!nguoiDung) { throw new NotFoundException('Nguoi dung khong ton tai.'); }

    // Dùng TypeORM's find() thay vì QueryBuilder để đơn giản hóa
    const dieuKienTimKiem: any = {};

    // 1. PHÂN QUYỀN CƠ SỞ (Lớp bảo vệ)
    if (vaiTro === VaiTro.QUAN_LY && nguoiDung.phong_ban) {
      // QL: Lọc Task theo Phòng ban của họ
      dieuKienTimKiem.du_an = {
        phong_ban: {
          id: nguoiDung.phong_ban.id,
        },
      };
    } 
    else if (vaiTro === VaiTro.NHAN_VIEN) {
      // NV: Chỉ xem Task được gán cho chính mình
      dieuKienTimKiem.nguoi_thuc_hien = {
        id: idNguoiDung,
      };
    } 
    else {
      return [];
    }
    
    // 2. BỔ SUNG LỌC THEO TRẠNG THÁI (Lọc cơ sở)
    if (trangThai && trangThai !== 'TAT_CA') {
      dieuKienTimKiem.trang_thai = trangThai.toLowerCase();
    }
    
    // ----------------------------------------------------
    // 🔥 FIX: ÁP DỤNG LOGIC PAGINATION (skip/take) 🔥
    // ----------------------------------------------------
    const take = limit > 0 ? limit : 5;
    const skip = (page > 0 ? page - 1 : 0) * take; 

    return this.congViecRepository.find({
      where: dieuKienTimKiem,
      relations: ['du_an', 'nguoi_thuc_hien', 'nguoi_giao_viec'],
      order: {
        ngay_tao: 'DESC',
      },
      take: take, // <<< SỬ DỤNG TAKE (LIMIT)
      skip: skip, // <<< SỬ DỤNG SKIP (OFFSET)
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

  private kiemTraChuyenTrangThaiHopLe(
    nguoiDung: NguoiDung,
    congViecHienTai: CongViec,
    trangThaiMoi: TrangThaiCongViec,
  ): void {
    const vaiTro = nguoiDung.vai_tro;
    const trangThaiCu = congViecHienTai.trang_thai;
    
    if (trangThaiCu === TrangThaiCongViec.PHE_DUYET) {
      throw new ForbiddenException('Khong the thay doi cong viec da duoc Phe Duyet cuoi cung.');
    }

    if (vaiTro === VaiTro.QUAN_LY) {
      return; 
    }

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

  async capNhatTrangThaiNhanVien(idNguoiDung: string, idCongViec: string, trangThaiMoi: TrangThaiCongViec): Promise<CongViec> {
    
    const nguoiDung = await this.nguoiDungRepository.findOneBy({ id: idNguoiDung });
    if (!nguoiDung) { throw new NotFoundException('Nguoi dung khong ton tai.'); }

    const congViec = await this.congViecRepository.findOne({
        where: { id: idCongViec },
        relations: ['du_an', 'nguoi_thuc_hien'],
    });

    if (!congViec) { throw new NotFoundException('Cong viec khong ton tai.'); }

    const trangThaiCu = congViec.trang_thai;

    this.kiemTraChuyenTrangThaiHopLe(nguoiDung, congViec, trangThaiMoi); 

    congViec.trang_thai = trangThaiMoi;

    const result = await this.congViecRepository.save(congViec);

    if (result.du_an.trang_thai === TrangThaiDuAn.SAP_BAT_DAU) {
        
        const activeStatuses = [
            TrangThaiCongViec.DANG_LAM,
            TrangThaiCongViec.CHO_DUYET,
            TrangThaiCongViec.CAN_SUA,
        ];
        
        // Nếu trạng thái công việc MỚI là một trạng thái hoạt động
        if (activeStatuses.includes(trangThaiMoi)) {
            
            // Chuyển dự án sang trạng thái ĐANG_TIEN_HANH
            result.du_an.trang_thai = TrangThaiDuAn.DANG_TIEN_HANH;
            await this.duAnRepository.save(result.du_an); 
            console.log(`[CASCADING] Dự án ${result.duAnId} chuyển sang ĐANG_TIEN_HANH do Task ${result.id} bắt đầu.`);
        }
    }

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

    // LOGIC YÊU CẦU SỬA (CHO_DUYET -> CAN_SUA)
    if (trangThaiCu === TrangThaiCongViec.CHO_DUYET && trangThaiMoi === TrangThaiCongViec.CAN_SUA) {
        if (congViec.nguoi_thuc_hien && congViec.nguoi_thuc_hien.email) {
            await this.taskReminderQueue.add('send_task_rejection_email', {
              to: congViec.nguoi_thuc_hien.email,
              subject: 'Công việc của bạn cần sửa lại',
              template: 'task-rejection',
              context: {
                ho_ten: congViec.nguoi_thuc_hien.ho_ten,
                tieu_de: congViec.tieu_de,
                ten_du_an: congViec.du_an.ten_du_an,
                mo_ta: congViec.mo_ta,
              }
            });
        }
    }

    return this.congViecRepository.save(congViec);
  }

  /**
   * 4. CẬP NHẬT CÔNG VIỆC CHUNG (CHỦ YẾU DÙNG CHO QUẢN LÝ SỬA CONTENT)
   */
  async update(idNguoiDung: string, idCongViec: string, capNhatCongViecDto: CapNhatCongViecDto): Promise<CongViec> {
    const { trang_thai: trangThaiMoi, id_du_an, id_nguoi_thuc_hien, han_chot: hanChotMoi } = capNhatCongViecDto;

    const nguoiDung = await this.nguoiDungRepository.findOneBy({ id: idNguoiDung });
    if (!nguoiDung) { throw new NotFoundException('Nguoi dung khong ton tai.'); }
    
    const congViec = await this.congViecRepository.findOne({
      where: { id: idCongViec },
      relations: ['du_an', 'nguoi_thuc_hien'],
    });
    if (!congViec) { throw new NotFoundException('Cong viec khong ton tai.'); }

    const trangThaiCu = congViec.trang_thai;
    let duAnHienTai = congViec.du_an; 
    const nguoiThucHienCuId = congViec.nguoiThucHienId;
    const isReassigned = id_nguoi_thuc_hien && id_nguoi_thuc_hien !== nguoiThucHienCuId;
    let trangThaiMoiSauGan = trangThaiMoi;

if (congViec.trang_thai === TrangThaiCongViec.PHE_DUYET || congViec.trang_thai === TrangThaiCongViec.BI_HUY) {
        if (Object.keys(capNhatCongViecDto).length > 0) { // Nếu DTO không rỗng, chặn sửa
            throw new ForbiddenException(`Khong the chinh sua cong viec da o trang thai ${congViec.trang_thai}.`);
        }
    }
    



    // Nếu có ID dự án mới được gửi từ DTO
    if (id_du_an && id_du_an !== congViec.duAnId) {
        const duAnMoi = await this.duAnRepository.findOne({
            where: { id: id_du_an },
            select: ['id', 'ngay_tao', 'ngay_bat_dau', 'ngay_ket_thuc_du_kien', 'trang_thai'],
        });
        if (!duAnMoi) {
            throw new NotFoundException('Du an moi khong ton tai.');
        }
        duAnHienTai = duAnMoi;
    }

    const currentDeadline = hanChotMoi ? new Date(hanChotMoi) : congViec.han_chot;

    if (currentDeadline && duAnHienTai.ngay_bat_dau && duAnHienTai.ngay_ket_thuc_du_kien) {
        
        const projectStart = new Date(duAnHienTai.ngay_bat_dau);
        const projectEnd = new Date(duAnHienTai.ngay_ket_thuc_du_kien);

        const deadlineDateOnly = startOfDay(currentDeadline);
        const projectStartDateOnly = startOfDay(projectStart);
        const projectEndDateOnly = startOfDay(projectEnd);
        
        // 1. Kiểm tra hạn chót so với ngày tạo dự án (Logic cũ)
        if (isBefore(deadlineDateOnly, startOfDay(duAnHienTai.ngay_tao))) {
            throw new BadRequestException('Han chot cua cong viec khong the som hon ngay tao du an.');
        }

        // 2. Công việc không được có hạn chót trước ngày BẮT ĐẦU dự án
        if (isBefore(deadlineDateOnly, projectStartDateOnly)) {
            throw new BadRequestException(`Han chot cong viec khong duoc truoc ngay bat dau du an.`);
        }

        // 3. Công việc không được có hạn chót sau ngày KẾT THÚC dự án
        if (isAfter(deadlineDateOnly, projectEndDateOnly)) { // 🔥 SỬ DỤNG isAfter ĐỂ SO SÁNH NGÀY
            throw new BadRequestException(`Han chot cong viec khong duoc sau ngay ket thuc du an.`);
        }
    }
    
    if (trangThaiMoi) { 
        this.kiemTraChuyenTrangThaiHopLe(nguoiDung, congViec, trangThaiMoi); 
    }
    
    Object.assign(congViec, capNhatCongViecDto); 
    
    if (id_du_an) congViec.duAnId = id_du_an;
    if (id_nguoi_thuc_hien) { 
        // a) Gán ID mới
        congViec.nguoiThucHienId = id_nguoi_thuc_hien;
        congViec.nguoi_thuc_hien = null as any; 

        // 🔥 FIX 2: LOGIC TỰ ĐỘNG THAY ĐỔI TRẠNG THÁI KHI CHUYỂN GIAO
        if (id_nguoi_thuc_hien !== nguoiThucHienCuId) {
             const trangThaiCanThayDoi = [
                TrangThaiCongViec.CHO_DUYET, 
                TrangThaiCongViec.PHE_DUYET, 
                TrangThaiCongViec.BI_HUY,
                TrangThaiCongViec.DANG_LAM, 
                TrangThaiCongViec.CAN_SUA,
             ];

             if (trangThaiCanThayDoi.includes(trangThaiCu as TrangThaiCongViec)) {
                trangThaiMoiSauGan = TrangThaiCongViec.CAN_LAM; 
             }
        }
    }

    if (trangThaiMoiSauGan) congViec.trang_thai = trangThaiMoiSauGan;
    else if (trangThaiMoi) congViec.trang_thai = trangThaiMoi;

    if (hanChotMoi) {
        congViec.han_chot = new Date(hanChotMoi); 
    }

    const result = await this.congViecRepository.save(congViec);

    if (result.du_an.trang_thai === TrangThaiDuAn.SAP_BAT_DAU) {
        const activeStatuses = [
            TrangThaiCongViec.DANG_LAM, 
            TrangThaiCongViec.CHO_DUYET, 
            TrangThaiCongViec.CAN_SUA
        ];

        // Nếu Task chuyển sang bất kỳ trạng thái hoạt động nào
        if (activeStatuses.includes(trangThaiMoi as TrangThaiCongViec)) {
            result.du_an.trang_thai = TrangThaiDuAn.DANG_TIEN_HANH;
            await this.duAnRepository.save(result.du_an); // Lưu thay đổi trạng thái Dự án
            console.log(`[CASCADING] Dự án ${result.duAnId} chuyển sang ĐANG_TIEN_HANH.`);
        }
    }

    if (isReassigned) {
        // Tải thông tin người dùng (Đảm bảo có email và tên)
        const nguoiCu = await this.nguoiDungRepository.findOneBy({ id: nguoiThucHienCuId });
        const nguoiMoi = await this.nguoiDungRepository.findOneBy({ id: id_nguoi_thuc_hien });

        // A. Gửi mail cho NGƯỜI CŨ (Task bị gỡ) - TÁI SỬ DỤNG TEMPLATE CANCEL
        if (nguoiCu && nguoiCu.email) {
            await this.taskReminderQueue.add('send_task_cancellation_email', { 
                to: nguoiCu.email,
                subject: `[THÔNG BÁO] Công việc "${result.tieu_de}" đã được chuyển giao`, 
                template: 'task-cancellation', 
                context: {
                    ho_ten: nguoiCu.ho_ten,
                    tieu_de: result.tieu_de, // Dùng tieu_de thay vì taskName
                    ten_du_an: result.du_an.ten_du_an, // Dùng ten_du_an thay vì projectName
                    reason: `đã được Quản lý chuyển giao cho ${nguoiMoi ? nguoiMoi.ho_ten : 'người khác'}`,
                },
            });
        }

        // B. Gửi mail cho NGƯỜI MỚI (Task được giao) - TÁI SỬ DỤNG TEMPLATE NEW TASK
        if (nguoiMoi && nguoiMoi.email) {
            await this.taskReminderQueue.add('send_new_task_email', { 
                to: nguoiMoi.email,
                subject: `[CÔNG VIỆC MỚI] Bạn được giao công việc: ${result.tieu_de}`,
                template: 'new-task', 
                context: {
                    ho_ten: nguoiMoi.ho_ten,
                    tieu_de: result.tieu_de,
                    han_chot: result.han_chot ? format(result.han_chot, 'dd/MM/yyyy') : 'Chưa thiết lập', 
                },
            });
        }
    }
    return result;
  }

  /**
   * 5. XÓA CÔNG VIỆC 
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