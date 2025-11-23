import { Controller, Post, Body, UseGuards, Get, Request } from '@nestjs/common'; 
import { AuthService } from './auth.service';
import { DangNhapDto } from './dto/dang-nhap.dto';
import { JwtAuthGuard } from './jwt/jwt.guard'; 

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('dang-nhap')
  dangNhap(@Body() dangNhapDto: DangNhapDto) {
    return this.authService.dangNhap(dangNhapDto);
  }

  @UseGuards(JwtAuthGuard) 
  @Get('profile')
  getProfile(@Request() req) {
    return req.user;
  }
}