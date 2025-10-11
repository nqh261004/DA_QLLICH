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

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      // Sửa đổi nằm ở đây
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'), // Thêm giá trị mặc định
        port: parseInt(configService.get<string>('DB_PORT', '5432'), 10), // Thêm giá trị mặc định
        username: configService.get<string>('DB_USERNAME', 'postgres'), // Thêm giá trị mặc định
        password: configService.get<string>('DB_PASSWORD'), // Password thì không nên có mặc định
        database: configService.get<string>('DB_DATABASE'),
        entities: [NguoiDung, PhongBan, DuAn, CongViec],
        synchronize: true,
      }),
    }),
    AuthModule,
    DuAnModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}