// src/auth/dto/dang-nhap.dto.ts
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class DangNhapDto {
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  mat_khau: string;
}