// src/nguoi_dung/nguoi_dung.service.ts
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { NguoiDung, VaiTro } from 'src/entities/nguoi_dung.entity';
import { PhongBan } from 'src/entities/phong_ban.entity'; 
import { TaoNguoiDungDto } from './dto/tao_nguoi_dung.dto';
import { CapNhatNguoiDungDto } from './dto/cap_nhat_nguoi_dung.dto';

@Injectable()
export class NguoiDungService {
  constructor(
    @InjectRepository(NguoiDung)
    private nguoiDungRepository: Repository<NguoiDung>,
    @InjectRepository(PhongBan)
    private phongBanRepository: Repository<PhongBan>,
  ) {}

  // Hàm 1: Lấy thông tin cá nhân (Profile)
  async layThongTinCaNhan(id: string): Promise<NguoiDung> {
    const user = await this.nguoiDungRepository.findOne({
      where: { id },
      relations: ['phong_ban'],
      select: ['id', 'ho_ten', 'email', 'vai_tro', 'phong_ban', 'ngay_tao'],
    });
    if (!user) {
      throw new NotFoundException('Nguoi dung khong ton tai');
    }
    return user;
  }

  // Hàm 2: Trưởng phòng tạo tài khoản Nhân viên (Đã triển khai)
  async taoTaiKhoanNhanVien(idNguoiTao: string, taoNguoiDungDto: TaoNguoiDungDto): Promise<NguoiDung> {
    const quanLy = await this.nguoiDungRepository.findOne({
      where: { id: idNguoiTao },
      relations: ['phong_ban'],
    });

    if (!quanLy || quanLy.vai_tro !== VaiTro.QUAN_LY || !quanLy.phong_ban) {
      throw new ForbiddenException('Chi Quan ly thuoc phong ban moi co quyen tao tai khoan nhan vien.');
    }

    const tonTai = await this.nguoiDungRepository.findOneBy({ email: taoNguoiDungDto.email });
    if (tonTai) {
      throw new ForbiddenException('Email da duoc su dung.');
    }

    const salt = await bcrypt.genSalt();
    const mat_khau_hash = await bcrypt.hash(taoNguoiDungDto.mat_khau, salt);

    const nhanVienMoi = this.nguoiDungRepository.create({
      ho_ten: taoNguoiDungDto.ho_ten,
      email: taoNguoiDungDto.email,
      mat_khau: mat_khau_hash,
      vai_tro: taoNguoiDungDto.vai_tro || VaiTro.NHAN_VIEN, 
      phongBanId: quanLy.phongBanId, 
    } as unknown as NguoiDung);

    const result = await this.nguoiDungRepository.save(nhanVienMoi);
    delete result.mat_khau;
    return result;
  }

  // Hàm 3: Cập nhật thông tin (Profile Update/Admin Update)
  async capNhatThongTin(
    idNguoiDangNhap: string,
    vaiTroNguoiDangNhap: VaiTro,
    idNguoiDungCanSua: string,
    capNhatNguoiDungDto: CapNhatNguoiDungDto,
  ): Promise<NguoiDung> {
    const isSelfUpdate = idNguoiDangNhap === idNguoiDungCanSua;
    const isManager = vaiTroNguoiDangNhap === VaiTro.QUAN_LY;
    
    // 1. Tải dữ liệu người dùng cần sửa
    const nguoiDungCanSua = await this.nguoiDungRepository.findOne({
        where: { id: idNguoiDungCanSua },
        relations: ['phong_ban'],
    });

    if (!nguoiDungCanSua) {
      throw new NotFoundException('Tai khoan can cap nhat khong ton tai.');
    }
    
    // 2. LOGIC KIỂM TRA QUYỀN: CẤM NẾU KHÔNG PHẢI QUẢN LÝ VÀ KHÔNG PHẢI TỰ SỬA
    if (!isManager && !isSelfUpdate) {
        throw new ForbiddenException('Ban chi co the cap nhat ho so cua chinh minh.');
    }

    if (!isManager) { 
        // 1. CHẶN TRẠNG THÁI HOẠT ĐỘNG
        if (capNhatNguoiDungDto.trang_thai_hoat_dong !== undefined) {
             throw new ForbiddenException('Nhan vien khong duoc phep thay doi trang thai hoat dong.');
        }
        // 2. CHẶN CHUYỂN PHÒNG BAN
        if (capNhatNguoiDungDto.phongBanId !== undefined) {
            throw new ForbiddenException('Nhan vien khong duoc phep thay doi phong ban.');
        }
    }

    // // 3. KIỂM TRA MẬT KHẨU & CÁC TRƯỜNG CẤM THAY ĐỔI
    // if (capNhatNguoiDungDto.email || (capNhatNguoiDungDto as any).vai_tro) {
    //     throw new ForbiddenException('Khong the thay doi Email hoac Vai tro nguoi dung.');
    // }
    
    // 4. KIỂM TRA VÀ GÁN MẬT KHẨU MỚI (Nếu có)
    if (capNhatNguoiDungDto.mat_khau) {
        const salt = await bcrypt.genSalt();
        capNhatNguoiDungDto.mat_khau = await bcrypt.hash(capNhatNguoiDungDto.mat_khau, salt);
    }
    
    // 5. CẬP NHẬT VÀ LƯU
    Object.assign(nguoiDungCanSua, capNhatNguoiDungDto);
    
    // Xử lý đổi phòng ban (Chỉ dành cho Quản lý)
    if (capNhatNguoiDungDto.phongBanId && isManager) {
        nguoiDungCanSua.phongBanId = capNhatNguoiDungDto.phongBanId;
    }

    const result = await this.nguoiDungRepository.save(nguoiDungCanSua);
    delete result.mat_khau;
    return result;
  }

  /**
   * 4. LẤY TẤT CẢ NGƯỜI DÙNG (CHỈ QUẢN LÝ CÙNG PHÒNG BAN)
   */
  async layTatCaNguoiDung(idNguoiDung: string): Promise<NguoiDung[]> {
    const nguoiDangNhap = await this.nguoiDungRepository.findOne({
      where: { id: idNguoiDung },
      relations: ['phong_ban'],
    });

    // 1. Kiểm tra quyền (CHỈ QUẢN LÝ)
    if (nguoiDangNhap?.vai_tro !== VaiTro.QUAN_LY) {
      throw new ForbiddenException('Chi Quan ly moi duoc phep xem danh sach nguoi dung.');
    }

    // 2. Kiểm tra Phòng ban
    if (!nguoiDangNhap.phongBanId) {
      return []; // Nếu Quản lý chưa có phòng ban, trả về mảng rỗng
    }

    // 3. Lấy tất cả người dùng có cùng phongBanId
    return this.nguoiDungRepository.find({
      where: { phongBanId: nguoiDangNhap.phongBanId },
      select: ['id', 'ho_ten', 'email', 'vai_tro', 'trang_thai_hoat_dong'], // Loại bỏ mật khẩu
      relations: ['phong_ban'],
      order: {
        ho_ten: 'ASC',
      },
    });
  }

  /**
   * 5. XÓA NGƯỜI DÙNG (CHỈ QUẢN LÝ VÀ KHÔNG ĐƯỢC TỰ XÓA)
   */
  async xoaNguoiDung(idNguoiDangNhap: string, idNguoiDungCanXoa: string): Promise<DeleteResult> {
    const isSelfDelete = idNguoiDangNhap === idNguoiDungCanXoa;
    
    // 1. Kiểm tra quyền và logic tự xóa
    if (isSelfDelete) {
        throw new ForbiddenException('Ban khong duoc phep tu xoa tai khoan cua chinh minh.');
    }
    
    const nguoiDangNhap = await this.nguoiDungRepository.findOneBy({ id: idNguoiDangNhap });
    
    // 2. Kiểm tra vai trò
    if (nguoiDangNhap?.vai_tro !== VaiTro.QUAN_LY) {
        throw new ForbiddenException('Chi Quan ly moi co quyen xoa tai khoan nguoi dung.');
    }

    const nguoiDungCanXoa = await this.nguoiDungRepository.findOneBy({ id: idNguoiDungCanXoa });

    if (!nguoiDungCanXoa) {
        throw new NotFoundException('Tai khoan can xoa khong ton tai.');
    }
    
    // 3. Kiểm tra Phòng ban (QL chỉ được xóa người dùng trong phòng ban mình)
    if (nguoiDungCanXoa.phongBanId !== nguoiDangNhap.phongBanId) {
        throw new ForbiddenException('Ban chi duoc xoa nguoi dung trong phong ban cua minh.');
    }
    
    // 4. Xóa
    const ketQua = await this.nguoiDungRepository.delete(idNguoiDungCanXoa);
    return ketQua;
  }
}