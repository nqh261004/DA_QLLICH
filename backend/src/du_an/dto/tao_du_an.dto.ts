import { IsNotEmpty, IsString, MaxLength, IsDateString} from 'class-validator';

export class TaoDuAnDto {
  @IsString({ message: 'Tên dự án phải là chuỗi.' })
  @IsNotEmpty({ message: 'Tên dự án không được để trống.' })
  @MaxLength(100, { message: 'Tên dự án tối đa 100 ký tự.' })
  ten_du_an: string;

  @IsString({ message: 'Mô tả phải là chuỗi.' })
  @IsNotEmpty({ message: 'Mô tả không được để trống.' })
  mo_ta: string;

  @IsDateString()
  @IsNotEmpty()
  ngay_bat_dau: Date;

  @IsDateString()
  @IsNotEmpty()
  ngay_ket_thuc_du_kien: Date;
}