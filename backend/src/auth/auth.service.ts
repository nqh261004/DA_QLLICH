// src/auth/auth.service.ts
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { NguoiDung, VaiTro } from 'src/entities/nguoi_dung.entity';
import { Repository } from 'typeorm';
import { DangKyDto } from './dto/dang-ky.dto';
import * as bcrypt from 'bcrypt';
import { DangNhapDto } from './dto/dang-nhap.dto';
import { JwtService } from '@nestjs/jwt'; // Thêm vào

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(NguoiDung)
    private nguoiDungRepository: Repository<NguoiDung>,
    private jwtService: JwtService, // Thêm vào
  ) {}

  // --- HÀM ĐĂNG KÝ (GIỮ NGUYÊN) ---
  async dangKy(dangKyDto: DangKyDto) {
    // ... (logic hàm này giữ nguyên như cũ)
    const soLuongNguoiDung = await this.nguoiDungRepository.count();
    if (soLuongNguoiDung > 0) {
      throw new ConflictException(
        'Hệ thống đã có quản lý. Không thể tự đăng ký.',
      );
    }
    const nguoiDungDaTonTai = await this.nguoiDungRepository.findOneBy({
      email: dangKyDto.email,
    });
    if (nguoiDungDaTonTai) {
      throw new ConflictException('Email đã được sử dụng');
    }
    const salt = await bcrypt.genSalt();
    const matKhauMaHoa = await bcrypt.hash(dangKyDto.mat_khau, salt);
    const nguoiDungMoi = this.nguoiDungRepository.create({
      ...dangKyDto,
      mat_khau: matKhauMaHoa,
      vai_tro: VaiTro.QUAN_LY,
    });
    const savedUser = await this.nguoiDungRepository.save(nguoiDungMoi);
    const { mat_khau, ...result } = savedUser;
    return result;
  }

  // --- HÀM ĐĂNG NHẬP MỚI ---
  async dangNhap(dangNhapDto: DangNhapDto) {
    // 1. Tìm người dùng theo email
    const nguoiDung = await this.nguoiDungRepository.findOneBy({
      email: dangNhapDto.email,
    });

    // Nếu không tìm thấy người dùng, hoặc mật khẩu không khớp -> báo lỗi
    if (!nguoiDung || !(await bcrypt.compare(dangNhapDto.mat_khau, nguoiDung.mat_khau))) {
      throw new UnauthorizedException('Email hoặc mật khẩu không chính xác.');
    }

    // 2. Tạo payload cho JWT (thông tin muốn lưu trong token)
    const payload = { 
      id: nguoiDung.id, 
      email: nguoiDung.email,
      vai_tro: nguoiDung.vai_tro 
    };

    // 3. Tạo access_token
    const accessToken = await this.jwtService.signAsync(payload);

    // 4. Trả về token cho client
    return {
      access_token: accessToken,
    };
  }
}