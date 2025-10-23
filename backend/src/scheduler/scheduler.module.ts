// src/scheduler/scheduler.module.ts
import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MailerModule } from 'src/mailer/mailer.module';
import { TaskConsumer } from './consumer.service';
import { SchedulerService } from './scheduler.service';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CongViec } from 'src/entities/cong_viec.entity';
import { NguoiDung } from 'src/entities/nguoi_dung.entity';
import { DuAn } from 'src/entities/du_an.entity';
import { CongViecService } from 'src/cong_viec/cong_viec.service';
import { DuAnModule } from 'src/du_an/du_an.module';
import { NguoiDungModule } from 'src/nguoi_dung/nguoi_dung.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    BullModule.registerQueue({
      name: 'task_reminder',
    }),
    MailerModule,
    TypeOrmModule.forFeature([CongViec, NguoiDung, DuAn]),
    DuAnModule,
    NguoiDungModule,
  ],
  providers: [TaskConsumer, SchedulerService, CongViecService],
})
export class SchedulerModule {}