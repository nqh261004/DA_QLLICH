// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common'; // Thêm UseGuards, Get, Request
import { AuthService } from './auth.service';
import { DangKyDto } from './dto/dang-ky.dto';
import { DangNhapDto } from './dto/dang-nhap.dto';
import { JwtAuthGuard } from './jwt/jwt.guard'; // Thêm vào

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('dang-ky')
  dangKy(@Body() dangKyDto: DangKyDto) {
    return this.authService.dangKy(dangKyDto);
  }

  @Post('dang-nhap')
  dangNhap(@Body() dangNhapDto: DangNhapDto) {
    return this.authService.dangNhap(dangNhapDto);
  }

  // --- TẠO API ĐƯỢC BẢO VỆ ---
  @UseGuards(JwtAuthGuard) // Dòng này đặt "người gác cổng" trước API
  @Get('profile')
  getProfile(@Request() req) {
    // req.user được tạo ra bởi JwtStrategy sau khi xác thực token thành công
    return req.user;
  }
}