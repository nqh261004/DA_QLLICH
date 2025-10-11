// src/auth/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { NguoiDung } from 'src/entities/nguoi_dung.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(NguoiDung)
    private nguoiDungRepository: Repository<NguoiDung>,
    private configService: ConfigService,
  ) {
    // Đã dùng dấu ! để báo cho TypeScript rằng giá trị là string (khắc phục lỗi cũ)
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET')!,
    });
  }

  // HÀM VALIDATE ĐÚNG CÚ PHÁP
  async validate(payload: { id: string; email: string; vai_tro: string }) {
    // Lấy thông tin người dùng từ DB để xác nhận tồn tại (Bảo mật)
    const nguoiDung = await this.nguoiDungRepository.findOneBy({ id: payload.id });

    if (!nguoiDung) {
      // Nếu không tìm thấy, từ chối xác thực (Gây lỗi 401)
      throw new UnauthorizedException('Token không hợp lệ.');
    }
    
    // Trả về các thuộc tính cần thiết cho req.user
    return { 
        id: nguoiDung.id, 
        email: nguoiDung.email, 
        vai_tro: nguoiDung.vai_tro,
    };
  }
} // Dấu đóng ngoặc nhọn cuối cùng