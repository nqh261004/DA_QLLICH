import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, Query } from '@nestjs/common';
import { CongViecService } from './cong_viec.service';
import { TaoCongViecDto } from './dto/tao_cong_viec.dto';
import { CapNhatCongViecDto } from './dto/cap_nhat_cong_viec.dto';
import { CapNhatTrangThaiDto } from './dto/cap_nhat_trang_thai.dto';
import { JwtAuthGuard } from 'src/auth/jwt/jwt.guard';
import { UseInterceptors, UploadedFiles } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@UseGuards(JwtAuthGuard)
@Controller('cong-viec')
export class CongViecController {
  constructor(private readonly congViecService: CongViecService) {}

  @Post()
  create(@Req() req: any, @Body() taoCongViecDto: TaoCongViecDto) {
    const idNguoiTao = req.user.id;
    return this.congViecService.taoCongViec(taoCongViecDto, idNguoiTao);
  }
  
@Get()
  async findAll(@Req() req: any, @Query('trang_thai') trangThai: string, @Query('page') page: number = 1, @Query('limit') limit: number = 5) {
    const idNguoiDung = req.user.id;
    const vaiTro = req.user.vai_tro;

    return this.congViecService.findAll(
      idNguoiDung,
      vaiTro,
      trangThai,
      page,
      limit
    ); 
  }
  
  @Get(':id')
  findOne(@Req() req: any, @Param('id') id: string) {
    const idNguoiDung = req.user.id;
    return this.congViecService.findOne(idNguoiDung, id); 
  }

  @Patch(':id/trang-thai')
  updateStatus(
    @Req() req: any, 
    @Param('id') id: string, 
    @Body() capNhatTrangThaiDto: CapNhatTrangThaiDto 
  ) {
    const idNguoiDung = req.user.id;
    return this.congViecService.capNhatTrangThaiNhanVien(
        idNguoiDung, 
        id, 
        capNhatTrangThaiDto.trang_thai 
    );
  }

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

  @Post(':id/nop-bai')
  @UseInterceptors(FilesInterceptor('files', 5, {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const randomName = Array(32).fill(null).map(() => (Math.round(Math.random() * 16)).toString(16)).join('');
        cb(null, `${randomName}${extname(file.originalname)}`);
      },
    }),
    limits: {
      fileSize: 5 * 1024 * 1024,
    },
  }))
  async nopBai(
    @Req() req: any,
    @Param('id') id: string,
    @UploadedFiles() files: Array<Express.Multer.File>
  ) {
    return this.congViecService.nopBai(req.user.id, id, files);
  }
}