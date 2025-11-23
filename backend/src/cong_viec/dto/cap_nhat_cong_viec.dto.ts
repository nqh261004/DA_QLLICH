import { PartialType } from '@nestjs/mapped-types';
import { TaoCongViecDto } from './tao_cong_viec.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { TrangThaiCongViec } from 'src/entities/cong_viec.entity';

export class CapNhatCongViecDto extends PartialType(TaoCongViecDto) {
  @IsOptional()
  @IsEnum(TrangThaiCongViec, { message: 'Trạng thái công việc không hợp lệ.' })
  trang_thai?: TrangThaiCongViec;
}