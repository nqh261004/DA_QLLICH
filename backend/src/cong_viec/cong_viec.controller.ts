// src/cong_viec/cong_viec.controller.ts (CODE HOÀN CHỈNH)
import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { CongViecService } from './cong_viec.service';
import { TaoCongViecDto } from './dto/tao_cong_viec.dto';
import { CapNhatCongViecDto } from './dto/cap_nhat_cong_viec.dto';
import { CapNhatTrangThaiDto } from './dto/cap_nhat_trang_thai.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';

@UseGuards(JwtAuthGuard)
@Controller('cong-viec')
export class CongViecController {
  constructor(private readonly congViecService: CongViecService) {}

  @Post()
  create(@Req() req: any, @Body() taoCongViecDto: TaoCongViecDto) {
    const idNguoiTao = req.user.id;
    return this.congViecService.taoCongViec(idNguoiTao, taoCongViecDto);
  }
  
  @Get()
  findAll(@Req() req: any) {
    const idNguoiDung = req.user.id;
    return this.congViecService.findAll(idNguoiDung); 
  }
  
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const idNguoiDung = req.user.id;
    return this.congViecService.findOne(idNguoiDung, id); 
  }

  // 4A. CẬP NHẬT TRẠNG THÁI RIÊNG BIỆT (PATCH /:id/trang-thai) - Dùng cho NHÂN VIÊN
  @Patch(':id/trang-thai')
  updateStatus(
    @Req() req: any, 
    @Param('id') id: string, 
    @Body() capNhatTrangThaiDto: CapNhatTrangThaiDto 
  ) {
    const idNguoiDung = req.user.id;
    // Gọi hàm chuyên biệt
    return this.congViecService.capNhatTrangThaiNhanVien(
        idNguoiDung, 
        id, 
        capNhatTrangThaiDto.trang_thai 
    );
  }

  // 4B. CẬP NHẬT CHUNG (PATCH /:id) - Dùng cho QUẢN LÝ (để sửa nội dung)
  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() capNhatCongViecDto: CapNhatCongViecDto) {
    const idNguoiDung = req.user.id;
    return this.congViecService.update(idNguoiDung, id, capNhatCongViecDto);
  }
  
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const idNguoiDung = req.user.id;
    return this.congViecService.remove(idNguoiDung, id);
  }
}