// src/nguoi_dung/nguoi_dung.module.ts
import { Module } from '@nestjs/common';
import { NguoiDungService } from './nguoi_dung.service';
import { NguoiDungController } from './nguoi_dung.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NguoiDung } from 'src/entities/nguoi_dung.entity';
import { PhongBan } from 'src/entities/phong_ban.entity';
import { AuthModule } from 'src/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    TypeOrmModule.forFeature([NguoiDung, PhongBan]),
    AuthModule,
  ],
  controllers: [NguoiDungController],
  providers: [
    NguoiDungService,
  ],
  exports: [NguoiDungService],
})
export class NguoiDungModule {}