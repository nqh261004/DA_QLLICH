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
        entities: [NguoiDung, PhongBan, DuAn, CongViec],
        synchronize: true,
      }),
    }),
    AuthModule,
    DuAnModule,
    CongViecModule,
    NguoiDungModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}