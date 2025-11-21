import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { DuAnService } from './du_an.service';
import { TaoDuAnDto } from './dto/tao_du_an.dto';
import { CapNhatDuAnDto } from './dto/cap_nhat_du_an.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';

@UseGuards(JwtAuthGuard) 
@Controller('du-an') 
export class DuAnController {
  constructor(private readonly duAnService: DuAnService) {}

  @Post()
  async create(@Req() req: any, @Body() taoDuAnDto: TaoDuAnDto) {
    const idNguoiDung = req.user.id; 
    return this.duAnService.taoDuAn(idNguoiDung, taoDuAnDto);
  }

@Get()
  findAll(@Req() req: any, @Query('trang_thai') trangThai?: string, @Query('page') page: number = 1, @Query('limit') limit: number = 5) {
    const idNguoiDung = req.user.id;
    return this.duAnService.layTatCaDuAn(idNguoiDung, trangThai, page, limit); 
  }

  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const idNguoiDung = req.user.id;
    return this.duAnService.layChiTietDuAn(idNguoiDung, id);
  }

  @Patch(':id')
  update(@Req() req: any, @Param('id') id: string, @Body() capNhatDuAnDto: CapNhatDuAnDto) {
    const idNguoiDung = req.user.id;
    return this.duAnService.capNhatDuAn(idNguoiDung, id, capNhatDuAnDto);
  }

  @Delete(':id')
  remove(@Req() req: any, @Param('id') id: string) {
    const idNguoiDung = req.user.id;
    return this.duAnService.xoaDuAn(idNguoiDung, id);
  }
}