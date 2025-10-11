import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { DuAnService } from './du_an.service';
import { TaoDuAnDto } from './dto/tao_du_an.dto';
import { CapNhatDuAnDto } from './dto/cap_nhat_du_an.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';

// Áp dụng Guard cho toàn bộ Controller
@UseGuards(JwtAuthGuard) 
@Controller('du-an') // Đường dẫn URL của API là /du-an
export class DuAnController {
  constructor(private readonly duAnService: DuAnService) {}

  // 1. TẠO DỰ ÁN (Chỉ Quản lý) - POST /du-an
  @Post()
  async create(@Req() req: any, @Body() taoDuAnDto: TaoDuAnDto) {
    // Lấy ID người dùng (idNguoiTao) từ payload JWT đã được JwtAuthGuard gán vào req.user
    const idNguoiDung = req.user.id; 
    return this.duAnService.taoDuAn(idNguoiDung, taoDuAnDto);
  }

  // 2. LẤY TẤT CẢ DỰ ÁN (Cho cả Quản lý và Nhân viên) - GET /du-an
  @Get()
  findAll(@Req() req: any) {
    const idNguoiDung = req.user.id;
    return this.duAnService.layTatCaDuAn(idNguoiDung);
  }

  // 3. LẤY CHI TIẾT DỰ ÁN - GET /du-an/:id
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const idNguoiDung = req.user.id;
    return this.duAnService.layChiTietDuAn(idNguoiDung, id);
  }

  // 4. CẬP NHẬT DỰ ÁN (Chỉ Quản lý) - PATCH /du-an/:id
  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() capNhatDuAnDto: CapNhatDuAnDto) {
    const idNguoiDung = req.user.id;
    return this.duAnService.capNhatDuAn(idNguoiDung, id, capNhatDuAnDto);
  }

  // 5. XÓA DỰ ÁN (Chỉ Quản lý) - DELETE /du-an/:id
  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const idNguoiDung = req.user.id;
    return this.duAnService.xoaDuAn(idNguoiDung, id);
  }
}