import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { VaiTro } from 'src/entities/nguoi_dung.entity';

export class TaoNguoiDungDto {
  @IsString({ message: 'Họ tên phải là chuỗi.' })
  @IsNotEmpty({ message: 'Họ tên không được để trống.' })
  ho_ten: string;

  @IsEmail({}, { message: 'Email không đúng định dạng.' })
  @IsNotEmpty({ message: 'Email không được để trống.' })
  email: string;

  @IsString({ message: 'Mật khẩu phải là một chuỗi.' })
  @IsNotEmpty({ message: 'Mật khẩu không được để tróng.' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự.' })
  mat_khau: string;

  @IsOptional()
  @IsIn([VaiTro.NHAN_VIEN, VaiTro.QUAN_LY])
  vai_tro?: VaiTro; 
}