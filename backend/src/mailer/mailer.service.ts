// src/mailer/mailer.service.ts
import { Injectable } from '@nestjs/common';
import { MailerService as NestMailerService } from '@nestjs-modules/mailer';

@Injectable()
export class MailerService {
  constructor(private readonly mailerService: NestMailerService) {}

  async sendTaskReminder(
    to: string,
    subject: string,
    templateName: string,
    context: any,
  ): Promise<void> {
    await this.mailerService.sendMail({
      to,
      subject,
      template: `./${templateName}`,
      context,
    });
  }
}