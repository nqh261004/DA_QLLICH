import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { NguoiDung } from './entities/nguoi_dung.entity';
import { PhongBan } from './entities/phong_ban.entity';
import { DuAn } from './entities/du_an.entity';
import { CongViec } from './entities/cong_viec.entity';
import { AuthModule } from './auth/auth.module';
import { DuAnModule } from './du_an/du_an.module';
import { CongViecModule } from './cong_viec/cong_viec.module';
import { NguoiDungModule } from './nguoi_dung/nguoi_dung.module';
import { MailerModule } from './mailer/mailer.module';
import { SchedulerModule } from './scheduler/scheduler.module';
import { BullModule } from '@nestjs/bull';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { FileDinhKem } from './entities/file_dinh_kem.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: parseInt(configService.get<string>('DB_PORT', '5432'), 10),
        username: configService.get<string>('DB_USERNAME', 'postgres'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        entities: [NguoiDung, PhongBan, DuAn, CongViec, FileDinhKem],
        synchronize: true,
      }),
    }),
    BullModule.forRoot({
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            maxRetriesPerRequest: 5,
            enableReadyCheck: false,
        },
    }),
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads', 
    }),
    
    AuthModule,
    DuAnModule,
    CongViecModule,
    NguoiDungModule,
    MailerModule,
    SchedulerModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}