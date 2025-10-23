// src/cong_viec/cong_viec.module.ts
import { Module } from '@nestjs/common';
import { CongViecService } from './cong_viec.service'; 
import { CongViecController } from './cong_viec.controller'; 
import { TypeOrmModule } from '@nestjs/typeorm';
import { CongViec } from 'src/entities/cong_viec.entity';
import { DuAn } from 'src/entities/du_an.entity'; 
import { NguoiDung } from 'src/entities/nguoi_dung.entity'; 
import { AuthModule } from 'src/auth/auth.module'; 
import { BullModule } from '@nestjs/bull';
import { MailerModule } from 'src/mailer/mailer.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CongViec, DuAn, NguoiDung]), 
    AuthModule, 
    BullModule.registerQueue({
      name: 'task_reminder',
    }),
    MailerModule,
  ],
  controllers: [CongViecController],
  providers: [CongViecService],
})
export class CongViecModule {}