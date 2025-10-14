import { IsEnum, IsNotEmpty } from 'class-validator';
import { TrangThaiCongViec } from 'src/entities/cong_viec.entity';

// DTO này CHỈ CHỨA trạng thái mới và không kế thừa, loại bỏ xung đột
export class CapNhatTrangThaiDto {
  @IsNotEmpty({ message: 'Trạng thái công việc không được để trống.' })
  @IsEnum(TrangThaiCongViec, { message: 'Trạng thái công việc không hợp lệ.' })
  trang_thai: TrangThaiCongViec;
}