// src/nguoi_dung/nguoi_dung.controller.ts
import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req, Delete } from '@nestjs/common';
import { NguoiDungService } from './nguoi_dung.service';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { TaoNguoiDungDto } from './dto/tao_nguoi_dung.dto';
import { CapNhatNguoiDungDto } from './dto/cap_nhat_nguoi_dung.dto';
import { VaiTro } from 'src/entities/nguoi_dung.entity';

@UseGuards(JwtAuthGuard)
@Controller('nguoi-dung')
export class NguoiDungController {
  constructor(private readonly nguoiDungService: NguoiDungService) {}
  
  @Get()
  findAll(@Req() req: any) {
    const idNguoiDung = req.user.id;
    return this.nguoiDungService.layTatCaNguoiDung(idNguoiDung); 
  }
  
  @Post()
  taoNhanVien(@Req() req: any, @Body() taoNguoiDungDto: TaoNguoiDungDto) {
    const idNguoiTao = req.user.id;
    return this.nguoiDungService.taoTaiKhoanNhanVien(idNguoiTao, taoNguoiDungDto);
  }
  
  @Get('profile')
  getProfile(@Req() req: any) {
    return this.nguoiDungService.layThongTinCaNhan(req.user.id);
  }

  @Patch(':id')
  update(
    @Req() req: any,
    @Param('id') idNguoiDungCanSua: string,
    @Body() capNhatNguoiDungDto: CapNhatNguoiDungDto,
  ) {
    const vaiTroNguoiDangNhap = req.user.vai_tro;
    const idNguoiDangNhap = req.user.id;
    
    return this.nguoiDungService.capNhatThongTin(
        idNguoiDangNhap,
        vaiTroNguoiDangNhap,
        idNguoiDungCanSua,
        capNhatNguoiDungDto,
    );
  }

  @Delete(':id')
  remove(
    @Req() req: any,
    @Param('id') idNguoiDungCanXoa: string,
  ) {
    const idNguoiDangNhap = req.user.id;
    return this.nguoiDungService.xoaNguoiDung(idNguoiDangNhap, idNguoiDungCanXoa);
  }
}