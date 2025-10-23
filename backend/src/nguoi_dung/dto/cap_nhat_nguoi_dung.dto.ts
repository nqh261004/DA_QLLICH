import { PartialType } from '@nestjs/mapped-types';
import { TaoNguoiDungDto } from './tao_nguoi_dung.dto';
import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CapNhatNguoiDungDto extends PartialType(TaoNguoiDungDto) {
    @IsOptional()
    @IsBoolean({ message: 'Trạng thái hoạt động phải là boolean' })
    trang_thai_hoat_dong?: boolean;

    @IsOptional()
    @IsString({ message: 'Đường dẫn avatar không hợp lệ' })
    avatar?: string;

    @IsOptional()
    @IsUUID('4', { message: 'ID phòng ban không hợp lệ' })
    phongBanId?: string;
}