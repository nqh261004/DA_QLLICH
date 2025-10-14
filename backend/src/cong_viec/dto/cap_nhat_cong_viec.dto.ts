// src/cong_viec/dto/cap_nhat_cong_viec.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { TaoCongViecDto } from './tao_cong_viec.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { TrangThaiCongViec } from 'src/entities/cong_viec.entity';

// CapNhatCongViecDto mở rộng từ TaoCongViecDto và làm cho tất cả các trường là optional
export class CapNhatCongViecDto extends PartialType(TaoCongViecDto) {
  
  // TRẠNG THÁI (Chỉ Quản lý/Nhân viên hợp lệ được phép thay đổi)
  @IsOptional()
  @IsEnum(TrangThaiCongViec, { message: 'Trạng thái công việc không hợp lệ.' })
  trang_thai?: TrangThaiCongViec;
}