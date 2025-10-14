// src/cong_viec/cong_viec.service.ts (CODE HOÀN CHỈNH ĐÃ SỬA LỖI BẢO MẬT)

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import { TaoCongViecDto } from './dto/tao_cong_viec.dto';
import { CapNhatCongViecDto } from './dto/cap_nhat_cong_viec.dto';
import { CongViec, TrangThaiCongViec } from 'src/entities/cong_viec.entity';
import { NguoiDung, VaiTro } from 'src/entities/nguoi_dung.entity';
import { DuAn, TrangThaiDuAn } from 'src/entities/du_an.entity';

@Injectable()
export class CongViecService {
  constructor(
    @InjectRepository(CongViec)
    private congViecRepository: Repository<CongViec>,
    @InjectRepository(NguoiDung)
    private nguoiDungRepository: Repository<NguoiDung>,
    @InjectRepository(DuAn)
    private duAnRepository: Repository<DuAn>,
  ) {}

  /**
   * 1. TẠO CÔNG VIỆC (CHỈ QUẢN LÝ)
   */
  async taoCongViec(idNguoiTao: string, taoCongViecDto: TaoCongViecDto): Promise<CongViec> {
    const { id_du_an, id_nguoi_thuc_hien, ...rest } = taoCongViecDto;

    const nguoiGiaoViec = await this.nguoiDungRepository.findOne({
      where: { id: idNguoiTao },
      relations: ['phong_ban'],
    });

    // VÁ LỖ HỔNG BẢO MẬT: KIỂM TRA VAI TRÒ DỨT ĐIỂM
    if (!nguoiGiaoViec || nguoiGiaoViec.vai_tro !== VaiTro.QUAN_LY) {
      throw new ForbiddenException('Chi Quan ly moi co quyen giao viec.');
    }
    
    // KIỂM TRA PHÒNG BAN: Nếu Quản lý không có phòng ban, chặn luôn.
    if (!nguoiGiaoViec.phong_ban) {
      throw new ForbiddenException('Quan ly chua duoc gan vao phong ban nao.');
    }
    const idPhongBanQuanLy = nguoiGiaoViec.phong_ban.id;

    const duAn = await this.duAnRepository.findOne({ 
        where: { id: id_du_an }, 
        relations: ['phong_ban'] 
    });
    const nhanVien = await this.nguoiDungRepository.findOneBy({ id: id_nguoi_thuc_hien });

    if (!duAn) { throw new NotFoundException('Du an khong ton tai.'); }
    if (!nhanVien) { throw new NotFoundException('Nguoi thuc hien khong ton tai.'); }

    if (duAn.trang_thai === TrangThaiDuAn.HOAN_THANH || duAn.trang_thai === TrangThaiDuAn.HUY) {
        throw new ForbiddenException(`Khong the giao viec cho du an da o trang thai ${duAn.trang_thai}.`);
    }

    if (nhanVien.trang_thai_hoat_dong === false) {
      throw new ForbiddenException('Khong the giao viec cho tai khoan khong hoat dong.');
    }

    if (duAn.phong_ban.id !== idPhongBanQuanLy) { throw new ForbiddenException('Du an khong thuoc phong ban cua ban.'); }
    if (nhanVien.phongBanId !== idPhongBanQuanLy) { throw new ForbiddenException('Nhan vien khong thuoc phong ban cua ban.'); }
    
    const congViecMoi = this.congViecRepository.create({
      ...rest,
      duAnId: id_du_an,
      nguoiThucHienId: id_nguoi_thuc_hien,
      nguoiGiaoViecId: idNguoiTao,
    } as unknown as CongViec); 

    return this.congViecRepository.save(congViecMoi);
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
    const { trang_thai: trangThaiMoi, id_du_an, id_nguoi_thuc_hien, ...rest } = capNhatCongViecDto;

    const nguoiDung = await this.nguoiDungRepository.findOneBy({ id: idNguoiDung });
    if (!nguoiDung) { throw new NotFoundException('Nguoi dung khong ton tai.'); }
    
    const congViec = await this.congViecRepository.findOneBy({ id: idCongViec });
    if (!congViec) { throw new NotFoundException('Cong viec khong ton tai.'); }

    // --- A. KIỂM TRA QUYỀN SỬA NỘI DUNG (BLOCK 403) ---
    const restrictedFields = ['tieu_de', 'mo_ta', 'muc_do_uu_tien', 'han_chot', 'id_du_an', 'id_nguoi_thuc_hien'];
    
    // Kiểm tra nếu DTO chứa bất kỳ trường nội dung bị cấm nào
    const containsIllegalContent = restrictedFields.some(
        field => capNhatCongViecDto[field] !== undefined
    );
    
    if (containsIllegalContent && nguoiDung.vai_tro !== VaiTro.QUAN_LY) {
        throw new ForbiddenException('Chi Quan ly moi co quyen chinh sua tieu de, mo ta hoac muc do uu tien.');
    }
    // --- KẾT THÚC KIỂM TRA CONTENT ---

    // 1. KIỂM TRA CHUYỂN TRẠNG THÁI (Nếu có trạng thái mới được gửi)
    if (trangThaiMoi) {
        this.kiemTraChuyenTrangThaiHopLe(nguoiDung, congViec, trangThaiMoi); 
    }
    
    // 2. XỬ LÝ CẬP NHẬT
    Object.assign(congViec, capNhatCongViecDto); 

    // Cập nhật Khóa ngoại
    if (id_du_an) congViec.duAnId = id_du_an;
    if (id_nguoi_thuc_hien) congViec.nguoiThucHienId = id_nguoi_thuc_hien;
    
    // Cập nhật trạng thái
    if (trangThaiMoi) congViec.trang_thai = trangThaiMoi;

    return this.congViecRepository.save(congViec);
  }

  /**
   * 5. XÓA CÔNG VIỆC (CHỈ QUẢN LÝ)
   */
  async remove(idNguoiDung: string, idCongViec: string): Promise<DeleteResult> {
    const nguoiDung = await this.nguoiDungRepository.findOneBy({ id: idNguoiDung });
    
    if (nguoiDung?.vai_tro !== VaiTro.QUAN_LY) {
        throw new ForbiddenException('Chi Quan ly moi co quyen xoa cong viec.');
    }
    
    const congViec = await this.congViecRepository.findOneBy({ id: idCongViec });
    
    if (!congViec) { throw new NotFoundException('Cong viec khong ton tai.'); }
    
    const ketQua = await this.congViecRepository.delete(idCongViec);
    return ketQua;
  }
}