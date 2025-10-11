// src/du-an/dto/cap-nhat-du-an.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { TaoDuAnDto } from './tao_du_an.dto';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TrangThaiDuAn } from 'src/entities/du_an.entity';

// Sử dụng PartialType để tất cả các trường trong TaoDuAnDto là optional
export class CapNhatDuAnDto extends PartialType(TaoDuAnDto) {
  @IsOptional()
  @IsEnum(TrangThaiDuAn, { message: 'Trạng thái không hợp lệ.' })
  trang_thai?: TrangThaiDuAn;
}