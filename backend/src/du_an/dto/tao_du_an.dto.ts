// src/du-an/dto/tao-du-an.dto.ts
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class TaoDuAnDto {
  @IsString({ message: 'Tên dự án phải là chuỗi.' })
  @IsNotEmpty({ message: 'Tên dự án không được để trống.' })
  @MaxLength(100, { message: 'Tên dự án tối đa 100 ký tự.' })
  ten_du_an: string;

  @IsString({ message: 'Mô tả phải là chuỗi.' })
  @IsNotEmpty({ message: 'Mô tả không được để trống.' })
  mo_ta: string;
}