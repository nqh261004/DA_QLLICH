import { IsNotEmpty, IsString, IsUUID, IsNumber, IsOptional, IsDateString, Min, Max } from 'class-validator';

export class TaoCongViecDto {
  @IsString({ message: 'Tiêu đề phải là chuỗi.' })
  @IsNotEmpty({ message: 'Tiêu đề không được để trống.' })
  tieu_de: string;

  @IsString({ message: 'Mô tả phải là chuỗi.' })
  @IsOptional()
  mo_ta?: string;

  @IsNumber({}, { message: 'Mức độ ưu tiên phải là số.' })
  @IsOptional()
  @Min(0, { message: 'Mức độ ưu tiên tối thiểu là 0.' })
  @Max(5, { message: 'Mức độ ưu tiên tối đa là 5.' })
  muc_do_uu_tien?: number = 0;

  @IsDateString({}, { message: 'Hạn chót phải là định dạng ngày tháng hợp lệ.' })
  @IsOptional()
  han_chot?: Date;

  // ID DỰ ÁN (Bắt buộc)
  @IsUUID('4', { message: 'ID dự án không hợp lệ.' })
  @IsNotEmpty({ message: 'Cần chỉ định ID dự án.' })
  id_du_an: string;

  // ID NGƯỜI THỰC HIỆN (Bắt buộc)
  @IsUUID('4', { message: 'ID người thực hiện không hợp lệ.' })
  @IsNotEmpty({ message: 'Cần chỉ định người thực hiện.' })
  id_nguoi_thuc_hien: string;
}