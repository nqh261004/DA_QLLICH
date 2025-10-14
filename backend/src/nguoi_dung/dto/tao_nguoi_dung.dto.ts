import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional, IsIn } from 'class-validator';
import { VaiTro } from 'src/entities/nguoi_dung.entity';

export class TaoNguoiDungDto {
  @IsString({ message: 'Ho ten phai la chuoi.' })
  @IsNotEmpty({ message: 'Ho ten khong duoc de trong.' })
  ho_ten: string;

  @IsEmail({}, { message: 'Email khong dung dinh dang.' })
  @IsNotEmpty({ message: 'Email khong duoc de trong.' })
  email: string;

  @IsString({ message: 'Mat khau phai la chuoi.' })
  @IsNotEmpty({ message: 'Mat khau khong duoc de trong.' })
  @MinLength(6, { message: 'Mat khau phai co it nhat 6 ky tu.' })
  mat_khau: string;


  // ĐÃ SỬA: Bổ sung vai_tro (optional)
  @IsOptional()
  @IsIn([VaiTro.NHAN_VIEN, VaiTro.QUAN_LY])
  vai_tro?: VaiTro; 
}