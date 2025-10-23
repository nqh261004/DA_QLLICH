import { IsEnum, IsNotEmpty } from 'class-validator';
import { TrangThaiCongViec } from 'src/entities/cong_viec.entity';

export class CapNhatTrangThaiDto {
  @IsNotEmpty({ message: 'Trạng thái công việc không được để trống.' })
  @IsEnum(TrangThaiCongViec, { message: 'Trạng thái công việc không hợp lệ.' })
  trang_thai: TrangThaiCongViec;
}