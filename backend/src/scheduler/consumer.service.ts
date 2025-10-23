import { Logger } from '@nestjs/common';
import { Processor, Process } from '@nestjs/bull';
import type { Job } from 'bull';
import { MailerService } from '../mailer/mailer.service';

@Processor('task_reminder')
export class TaskConsumer {
  private readonly logger = new Logger(TaskConsumer.name);
  constructor(private readonly mailerService: MailerService) {}

  @Process('send_welcome_email')
  async sendWelcomeEmail(job: Job<any>) {
    const { to, subject, template, context } = job.data;
    console.log(`Đã gửi email tạo tài khoản tới ${to} với tiêu đề: ${subject}`);
    await this.mailerService.sendTaskReminder(to, subject, template, context);
  }

  @Process('send_new_task_email')
  async handleSendNewTaskEmail(job: Job) {
    this.logger.debug('Bắt đầu gửi việc mới qua email');
    const { to, subject, template, context } = job.data;
    try {
      await this.mailerService.sendTaskReminder(to, subject, template, context);
      this.logger.debug('Mail đã được gửi');
    } catch (error) {
      this.logger.error('Gửi thất bại', error.stack);
    }
  }

  @Process('send_task_approval_email') 
  async handleSendTaskApprovalEmail(job: Job) {
    this.logger.debug('Bắt đầu gửi email phê duyệt công việc');
    const { to, subject, template, context } = job.data;
    try {
      await this.mailerService.sendTaskReminder(to, subject, template, context);
      this.logger.debug('Mail đã được gửi');
    } catch (error) {
      this.logger.error('Gửi thất bại', error.stack);
    }
  }

  @Process('send_task_rejection_email')
  async handleSendTaskRejectionEmail(job: Job) {
    this.logger.debug('Bắt đầu gửi mail cần sửa đổi công việc');
    const { to, subject, template, context } = job.data;
    try {
      await this.mailerService.sendTaskReminder(to,subject,template, context);
      this.logger.debug('Mail đã được gửi');
    } catch (error) {
      this.logger.error('Gửi thất bại', error.stack);
    }
  }

  @Process('send_task_cancellation_email')
  async handleSendTaskCancellationEmail(job: Job) {
    this.logger.debug('Bắt đầu gửi mail xoá công việc');
    const { to, subject, template, context } = job.data;
    try {
      await this.mailerService.sendTaskReminder(to,subject,template, context);
      this.logger.debug('Mail đã được gửi');
    } catch (error) {
      this.logger.error('Gửi thất bại', error.stack);
    }
  }

  @Process('send_project_cancellation_email')
  async handleSendProjectCancellationEmail(job: Job) {
    this.logger.debug('Bắt đầu gửi mail xoá công việc');
    const { to, subject, template, context } = job.data;
    try {
      await this.mailerService.sendTaskReminder(to,subject,template, context);
      this.logger.debug('Mail đã được gửi');
    } catch (error) {
      this.logger.error('Gửi thất bại', error.stack);
    }
  }

  @Process('send_reminder_email')
  async handleSendReminderEmail(job: Job) {
    this.logger.debug('Bắt đầu gửi email nhắc nhở công việc');
    const { to, subject, template, context } = job.data;
    try {
      await this.mailerService.sendTaskReminder(to, subject, template, context);
      this.logger.debug('Mail đã được gửi');
    } catch (error) {
      this.logger.error('Gửi thất bại', error.stack);
    }
  }

  @Process('send_account_status_email')
  async handleAccountStatusEmail(job: Job) {
    this.logger.debug('Bắt đầu gửi email trạng thái tài khoản');
    const { to, subject, template, context } = job.data;
    try {
      await this.mailerService.sendTaskReminder(to, subject, template, context);
      this.logger.debug('Mail đã được gửi');
    } catch (error) {
      this.logger.error('Gửi thất bại', error.stack);
    }
  }

  @Process('send_password_changed_email') 
  async handlePasswordChangedEmail(job: Job) {
    this.logger.debug('Bắt đầu gửi email thay đổi mật khẩu');
    const { to, subject, template, context } = job.data;
    try {
      await this.mailerService.sendTaskReminder(to, subject, template, context);
      this.logger.debug('Mail đã được gửi');
    } catch (error) {
      this.logger.error('Gửi thất bại', error.stack);
    }
  }

}