import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Chỉ chấp nhận các thuộc tính đã định nghĩa trong DTO
    transform: true, // Tự động chuyển đổi kiểu dữ liệu DTO
  }));
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
