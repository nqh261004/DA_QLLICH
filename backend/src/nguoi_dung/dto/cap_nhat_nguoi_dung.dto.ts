// src/nguoi_dung/dto/cap_nhat_nguoi_dung.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { TaoNguoiDungDto } from './tao_nguoi_dung.dto';
import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';

export class CapNhatNguoiDungDto extends PartialType(TaoNguoiDungDto) {
    @IsOptional()
    @IsBoolean({ message: 'Trang thai hoat dong phai la boolean.' })
    trang_thai_hoat_dong?: boolean;

    @IsOptional()
    @IsString({ message: 'Duong dan Avatar phai la chuoi.' })
    avatar?: string;

    @IsOptional()
    @IsUUID('4', { message: 'ID phong ban moi khong hop le.' })
    phongBanId?: string;
}