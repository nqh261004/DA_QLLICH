// src/auth/dto/dang-ky.dto.ts
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class DangKyDto {
  @IsNotEmpty({ message: 'Họ tên không được để trống' })
  @IsString()
  ho_ten: string;

  @IsEmail({}, { message: 'Email không đúng định dạng' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @IsNotEmpty({ message: 'Mật khẩu không được để trống' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  mat_khau: string;
}