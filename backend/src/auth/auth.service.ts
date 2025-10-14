import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { NguoiDung, VaiTro } from 'src/entities/nguoi_dung.entity';
import { DangNhapDto } from './dto/dang-nhap.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(NguoiDung)
    private nguoiDungRepository: Repository<NguoiDung>,
    private jwtService: JwtService,
  ) {}

  async dangNhap(dangNhapDto: DangNhapDto): Promise<{ accessToken: string }> {
    const nguoiDung = await this.nguoiDungRepository.findOne({
      where: { email: dangNhapDto.email },
      select: ['id', 'email', 'mat_khau', 'vai_tro', 'trang_thai_hoat_dong'],
    });

    if (!nguoiDung || !nguoiDung.mat_khau || !(await bcrypt.compare(dangNhapDto.mat_khau, nguoiDung.mat_khau))) {
      throw new UnauthorizedException('Sai thong tin dang nhap');
    }

    if (nguoiDung.trang_thai_hoat_dong === false) {
      throw new ForbiddenException('Tai khoan cua ban da bi vo hieu hoa. Vui long lien he quan ly.');
    }

    const payload = {
      sub: nguoiDung.id,
      email: nguoiDung.email,
      vai_tro: nguoiDung.vai_tro,
    };

    return {
      accessToken: await this.jwtService.signAsync(payload),
    };
  }
}