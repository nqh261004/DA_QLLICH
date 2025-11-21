import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { InjectRepository } from '@nestjs/typeorm';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { NguoiDung, VaiTro } from 'src/entities/nguoi_dung.entity';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(NguoiDung)
    private nguoiDungRepository: Repository<NguoiDung>,
    private configService: ConfigService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error('Cấu hình lỗi: JWT_SECRET không được định nghĩa trong .env');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: { sub: string; email: string; vai_tro: VaiTro }) {
    // console.log('--- Bắt đầu xác thực Token ---');
    // console.log('Payload nhận được:', payload);

    const nguoiDung = await this.nguoiDungRepository.findOne({
      where: { id: payload.sub },
      select: ['id', 'email', 'ho_ten', 'vai_tro', 'trang_thai_hoat_dong'],
    });

    // console.log('Người dùng tìm thấy từ DB:', nguoiDung);
    // console.log('--- Kết thúc xác thực Token ---');

    if (!nguoiDung) {
      throw new UnauthorizedException('Token không hợp lệ.');
    }

    return nguoiDung;
  }
}