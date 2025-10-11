// src/du-an/du-an.module.ts
import { Module } from '@nestjs/common';
import { DuAnService } from './du_an.service';
import { DuAnController } from './du_an.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DuAn } from 'src/entities/du_an.entity';
import { NguoiDung } from 'src/entities/nguoi_dung.entity'; // Thêm để kiểm tra quyền và lấy thông tin phòng ban
import { AuthModule } from 'src/auth/auth.module'; 

@Module({
  imports: [
    TypeOrmModule.forFeature([DuAn, NguoiDung]), // Đăng ký 2 entities cần dùng
    AuthModule, 
  ],
  controllers: [DuAnController],
  providers: [DuAnService],
})
export class DuAnModule {}