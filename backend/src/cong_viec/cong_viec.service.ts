import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult, Between, In, LessThan } from 'typeorm';
import { TaoCongViecDto } from './dto/tao_cong_viec.dto';
import { CapNhatCongViecDto } from './dto/cap_nhat_cong_viec.dto';
import { CongViec, TrangThaiCongViec } from 'src/entities/cong_viec.entity';
import { NguoiDung, VaiTro } from 'src/entities/nguoi_dung.entity';
import { DuAn, TrangThaiDuAn } from 'src/entities/du_an.entity';
import { FileDinhKem } from 'src/entities/file_dinh_kem.entity';
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
    @InjectRepository(FileDinhKem)
    private fileRepository: Repository<FileDinhKem>,
    @InjectQueue('task_reminder') private taskReminderQueue: Queue,
  ) {}

  /**
   * 1. TẠO CÔNG VIỆC
   */
async taoCongViec(
    dto: TaoCongViecDto,
    idNguoiGiaoViec: string,
): Promise<CongViec[]> {
    const { id_du_an, id_nguoi_thuc_hien, ...rest } = dto;

    const nguoiGiaoViec = await this.nguoiDungRepository.findOne({
        where: { id: idNguoiGiaoViec },
        relations: ['phong_ban'],
    });

    if (!nguoiGiaoViec || nguoiGiaoViec.vai_tro !== VaiTro.QUAN_LY || !nguoiGiaoViec.phong_ban) {
        throw new ForbiddenException('Chỉ Quản lý mới có quyền giao việc và bạn phải thuộc một phòng ban.');
    }
    const idPhongBanQuanLy = nguoiGiaoViec.phong_ban.id;
    
    const duAn = await this.duAnRepository.findOne({ 
        where: { id: id_du_an }, 
        relations: ['phong_ban'] 
    });
    if (!duAn) { throw new NotFoundException('Dự án không tồn tại.'); }
    if (duAn.phong_ban.id !== idPhongBanQuanLy) { throw new ForbiddenException('Dự án không thuộc phòng ban của bạn.'); }

    if (dto.han_chot && duAn.ngay_bat_dau && duAn.ngay_ket_thuc_du_kien) {
        
        const taskDeadline = new Date(dto.han_chot);
        const projectStart = new Date(duAn.ngay_bat_dau);
        const projectEnd = new Date(duAn.ngay_ket_thuc_du_kien);

        const deadlineDateOnly = startOfDay(taskDeadline);
        const projectStartDateOnly = startOfDay(projectStart);
        const projectEndDateOnly = startOfDay(projectEnd);

        if (isBefore(deadlineDateOnly, startOfDay(duAn.ngay_tao))) {
            throw new ForbiddenException('Hạn chót của công việc không thể sớm hơn ngày tạo dự án.');
        }

        if (isBefore(deadlineDateOnly, projectStartDateOnly)) {
            throw new BadRequestException(`Hạn chót công việc (${format(taskDeadline, 'dd/MM/yyyy')}) không được trước ngày bắt đầu dự án (${format(projectStart, 'dd/MM/yyyy')}).`);
        }

        if (isAfter(deadlineDateOnly, projectEndDateOnly)) { 
            throw new BadRequestException(`Hạn chót công việc (${format(taskDeadline, 'dd/MM/yyyy')}) không được sau ngày kết thúc dự án (${format(projectEnd, 'dd/MM/yyyy')}).`);
        }
    }

    let danhSachIdNguoiNhan: string[] = [];
    let nhanVienDuyNhat: NguoiDung | null = null; 

    if (id_nguoi_thuc_hien === 'ALL') {
        const allNhanVien = await this.nguoiDungRepository.find({
            where: { 
                phongBanId: idPhongBanQuanLy, 
                vai_tro: VaiTro.NHAN_VIEN,
                trang_thai_hoat_dong: true,
            },
        });
        danhSachIdNguoiNhan = allNhanVien
            .map(nv => nv.id)
            .filter(id => id !== idNguoiGiaoViec); 

        if (danhSachIdNguoiNhan.length === 0) {
             throw new BadRequestException('Không tìm thấy Nhân viên đang hoạt động nào trong phòng ban để giao việc.');
        }

    } else {
        nhanVienDuyNhat = await this.nguoiDungRepository.findOneBy({ id: id_nguoi_thuc_hien });
        
        if (!nhanVienDuyNhat) { throw new NotFoundException('Người thực hiện không tồn tại.'); }
        if (nhanVienDuyNhat.trang_thai_hoat_dong === false) {
             throw new ForbiddenException('Không thể giao việc cho tài khoản không hoạt động.');
        }
        if (nhanVienDuyNhat.phongBanId !== idPhongBanQuanLy) { throw new ForbiddenException('Nhân viên không thuộc phòng ban của bạn.'); }

        danhSachIdNguoiNhan = [id_nguoi_thuc_hien];
    }
    const tasksToCreate = danhSachIdNguoiNhan.map(idNhanVien => {
        const newTask = this.congViecRepository.create({
            ...rest,
            duAnId: id_du_an,
            nguoiThucHienId: idNhanVien, 
            nguoiGiaoViecId: nguoiGiaoViec.id,
            trang_thai: TrangThaiCongViec.CAN_LAM,
        } as unknown as CongViec); 
        
        return newTask;
    });

    const newTasks = await this.congViecRepository.save(tasksToCreate); 

    for (const task of newTasks) {
        const nguoiThucHien = await this.nguoiDungRepository.findOneBy({ id: task.nguoiThucHienId });
        if (nguoiThucHien && nguoiThucHien.email) {
            await this.taskReminderQueue.add('send_new_task_email', {
                to: nguoiThucHien.email,
                subject: `[CÔNG VIỆC MỚI] Bạn được giao công việc: ${task.tieu_de}`,
                template: 'new-task', 
                context: {
                    ho_ten: nguoiThucHien.ho_ten,
                    tieu_de: task.tieu_de,
                    han_chot: task.han_chot ? format(task.han_chot, 'dd/MM/yyyy') : 'Chưa thiết lập', 
                },
            });
        }
    }
  return newTasks;
}

  /**
   * 2. XEM TẤT CẢ
   */
async findAll(
    idNguoiDung: string,
    vaiTro: VaiTro,
    trangThai?: string,
    page: number = 1, 
    limit: number = 5 
): Promise<CongViec[]> {
    const nguoiDung = await this.nguoiDungRepository.findOne({
      where: { id: idNguoiDung },
      relations: ['phong_ban'],
    });

    if (!nguoiDung) { throw new NotFoundException('Người dùng không tồn tại'); }

    const dieuKienTimKiem: any = {};

    if (vaiTro === VaiTro.QUAN_LY && nguoiDung.phong_ban) {
      dieuKienTimKiem.du_an = {
        phong_ban: {
          id: nguoiDung.phong_ban.id,
        },
      };
    } 
    else if (vaiTro === VaiTro.NHAN_VIEN) {
      dieuKienTimKiem.nguoi_thuc_hien = {
        id: idNguoiDung,
      };
    } 
    else {
      return [];
    }

    if (trangThai && trangThai !== 'TAT_CA') {
      dieuKienTimKiem.trang_thai = trangThai.toLowerCase();
    }

    const take = limit > 0 ? limit : 5;
    const skip = (page > 0 ? page - 1 : 0) * take; 

    return this.congViecRepository.find({
      where: dieuKienTimKiem,
      relations: ['du_an', 'nguoi_thuc_hien', 'nguoi_giao_viec'],
      order: {
        ngay_tao: 'DESC',
      },
      take: take, 
      skip: skip, 
    });
  }

  /**
   * 3. XEM CHI TIẾT CÔNG VIỆC
   */
  async findOne(idNguoiDung: string, idCongViec: string): Promise<CongViec> {
    const congViec = await this.congViecRepository.findOne({
      where: { id: idCongViec },
      relations: ['du_an', 'nguoi_thuc_hien', 'nguoi_giao_viec', 'files'],
    });

    if (!congViec) { throw new NotFoundException('Công việc không tồn tại.'); }
    
    const nguoiDung = await this.nguoiDungRepository.findOneBy({ id: idNguoiDung });

    if (nguoiDung?.vai_tro === VaiTro.QUAN_LY) {
        return congViec; 
    }
    
    if (congViec.nguoiThucHienId === idNguoiDung) {
        return congViec;
    }
    
    throw new ForbiddenException('Không có quyền xem công việc này.');
  }

  async nopBai(idNguoiDung: string, idCongViec: string, files: Array<Express.Multer.File>) {
    const congViec = await this.congViecRepository.findOne({ where: { id: idCongViec } });
    
    if (!congViec) throw new NotFoundException('Công việc không tồn tại');

    congViec.trang_thai = TrangThaiCongViec.CHO_DUYET;
    await this.congViecRepository.save(congViec);

    if (files && files.length > 0) {
        const fileEntities = files.map(file => {
            return this.fileRepository.create({
                ten_file_goc: file.originalname,
                ten_file_luu: file.filename,
                duong_dan: file.path,
                kich_thuoc: file.size,
                mimetype: file.mimetype,
                cong_viec: congViec
            });
        });
        await this.fileRepository.save(fileEntities);
    }

    return { message: 'Nộp bài thành công', congViec };
}

  private kiemTraChuyenTrangThaiHopLe(
    nguoiDung: NguoiDung,
    congViecHienTai: CongViec,
    trangThaiMoi: TrangThaiCongViec,
  ): void {
    const vaiTro = nguoiDung.vai_tro;
    const trangThaiCu = congViecHienTai.trang_thai;
    
    if (trangThaiCu === TrangThaiCongViec.PHE_DUYET) {
      throw new ForbiddenException('Không thể thay đổi trạng thái của công việc đã được phê duyệt.');
    }

    if (vaiTro === VaiTro.QUAN_LY) {
      return; 
    }

    if (vaiTro === VaiTro.NHAN_VIEN) {
      if (congViecHienTai.nguoiThucHienId !== nguoiDung.id) {
        throw new ForbiddenException('Bạn không phải người thực hiện công việc.');
      }

      const chuyenHopLe = (trangThaiCu === TrangThaiCongViec.CAN_LAM && trangThaiMoi === TrangThaiCongViec.DANG_LAM) ||
                        (trangThaiCu === TrangThaiCongViec.CAN_LAM && trangThaiMoi === TrangThaiCongViec.CHO_DUYET) || 
                        (trangThaiCu === TrangThaiCongViec.DANG_LAM && trangThaiMoi === TrangThaiCongViec.CHO_DUYET) ||
                        (trangThaiCu === TrangThaiCongViec.CAN_SUA && trangThaiMoi === TrangThaiCongViec.DANG_LAM);

      if (!chuyenHopLe) {
        throw new ForbiddenException(`Nhân việc không được phép chuyển trạng thái từ '${trangThaiCu}' sang '${trangThaiMoi}'.`);
      }
    }
  }

  async capNhatTrangThaiNhanVien(idNguoiDung: string, idCongViec: string, trangThaiMoi: TrangThaiCongViec): Promise<CongViec> {
    
    const nguoiDung = await this.nguoiDungRepository.findOneBy({ id: idNguoiDung });
    if (!nguoiDung) { throw new NotFoundException('Người dùng không tồn tại.'); }

    const congViec = await this.congViecRepository.findOne({
        where: { id: idCongViec },
        relations: ['du_an', 'nguoi_thuc_hien', 'nguoi_giao_viec'],
    });

    if (!congViec) { throw new NotFoundException('Công việc không tồn tại.'); }

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
      if (activeStatuses.includes(trangThaiMoi)) {
        result.du_an.trang_thai = TrangThaiDuAn.DANG_TIEN_HANH;
        await this.duAnRepository.save(result.du_an); 
      }
    }

    if (trangThaiMoi === TrangThaiCongViec.CHO_DUYET) {
        
        const nguoiGiaoViec = result.nguoi_giao_viec;
        const nguoiThucHien = result.nguoi_thuc_hien;

        if (nguoiGiaoViec && nguoiGiaoViec.email) {
            await this.taskReminderQueue.add('task_pending_approval_email', {
                to: nguoiGiaoViec.email,
                subject: `[CẦN DUYỆT] Công việc "${result.tieu_de}" đang chờ phê duyệt.`,
                template: 'task-pending-approval', 
                context: {
                    ho_ten: nguoiGiaoViec.ho_ten,
                    ho_ten_nguoi_lam: nguoiThucHien?.ho_ten || 'N/A',
                    ten_cong_viec: result.tieu_de,
                    ten_du_an: result.du_an?.ten_du_an || 'N/A',
                },
            });
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
    if (!nguoiDung) { throw new NotFoundException('Người dùng không tồn tại.'); }
    
    const congViec = await this.congViecRepository.findOne({
      where: { id: idCongViec },
      relations: ['du_an', 'nguoi_thuc_hien'],
    });
    if (!congViec) { throw new NotFoundException('Công việc không tồn tại.'); }

    const trangThaiCu = congViec.trang_thai;
    let duAnHienTai = congViec.du_an; 
    const nguoiThucHienCuId = congViec.nguoiThucHienId;
    const isReassigned = id_nguoi_thuc_hien && id_nguoi_thuc_hien !== nguoiThucHienCuId;
    let trangThaiMoiSauGan = trangThaiMoi;

if (congViec.trang_thai === TrangThaiCongViec.PHE_DUYET || congViec.trang_thai === TrangThaiCongViec.BI_HUY) {
        if (Object.keys(capNhatCongViecDto).length > 0) { 
            throw new ForbiddenException(`Không thể chỉnh sửa công việc ở trạng thái ${congViec.trang_thai}.`);
        }
    }

    if (id_du_an && id_du_an !== congViec.duAnId) {
        const duAnMoi = await this.duAnRepository.findOne({
            where: { id: id_du_an },
            select: ['id', 'ngay_tao', 'ngay_bat_dau', 'ngay_ket_thuc_du_kien', 'trang_thai'],
        });
        if (!duAnMoi) {
            throw new NotFoundException('Dự án mới không tồn tại.');
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

        if (isBefore(deadlineDateOnly, startOfDay(duAnHienTai.ngay_tao))) {
            throw new BadRequestException('Hạn chót công việc không thể sớm hơn ngày tạo dự án.');
        }

        if (isBefore(deadlineDateOnly, projectStartDateOnly)) {
            throw new BadRequestException(`Hạn chót công việc không được trước ngày bắt đầu dự án.`);
        }

        if (isAfter(deadlineDateOnly, projectEndDateOnly)) { 
            throw new BadRequestException(`Hạn chót công việc không được sau ngày kết thúc dự án.`);
        }
    }
    
    if (trangThaiMoi) { 
        this.kiemTraChuyenTrangThaiHopLe(nguoiDung, congViec, trangThaiMoi); 
    }
    
    Object.assign(congViec, capNhatCongViecDto); 
    
    if (id_du_an) congViec.duAnId = id_du_an;
    if (id_nguoi_thuc_hien) { 
        congViec.nguoiThucHienId = id_nguoi_thuc_hien;
        congViec.nguoi_thuc_hien = null as any; 

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

        if (activeStatuses.includes(trangThaiMoi as TrangThaiCongViec)) {
            result.du_an.trang_thai = TrangThaiDuAn.DANG_TIEN_HANH;
            await this.duAnRepository.save(result.du_an); 
            console.log(`Dự án ${result.duAnId} chuyển sang đang tiến hành.`);
        }
    }

    if (isReassigned) {
        const nguoiCu = await this.nguoiDungRepository.findOneBy({ id: nguoiThucHienCuId });
        const nguoiMoi = await this.nguoiDungRepository.findOneBy({ id: id_nguoi_thuc_hien });

        if (nguoiCu && nguoiCu.email) {
            await this.taskReminderQueue.add('send_task_cancellation_email', { 
                to: nguoiCu.email,
                subject: `[THÔNG BÁO] Công việc "${result.tieu_de}" đã được chuyển giao`, 
                template: 'task-cancellation', 
                context: {
                    ho_ten: nguoiCu.ho_ten,
                    tieu_de: result.tieu_de, 
                    ten_du_an: result.du_an.ten_du_an, 
                    reason: `đã được Quản lý chuyển giao cho ${nguoiMoi ? nguoiMoi.ho_ten : 'người khác'}`,
                },
            });
        }

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
      throw new ForbiddenException('Chỉ quản lý mới có quyền xoá.');
    }
    
    const congViec = await this.congViecRepository.findOne({
      where: { id: idCongViec },
      relations: ['du_an', 'nguoi_thuc_hien'], 
    });
    
    if (!congViec) { throw new NotFoundException('Công việc không tồn tại.'); }
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