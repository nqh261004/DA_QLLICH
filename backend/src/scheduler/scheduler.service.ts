// src/scheduler/scheduler.service.ts
import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import type { Queue } from 'bull';
import { CongViecService } from 'src/cong_viec/cong_viec.service';
import { CongViec } from 'src/entities/cong_viec.entity';
import { addDays, format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { DuAnService } from 'src/du_an/du_an.service'; // Thêm import
import { NguoiDungService } from 'src/nguoi_dung/nguoi_dung.service'; // Thêm import

@Injectable()
export class SchedulerService {
  constructor(
    @InjectQueue('task_reminder') private taskReminderQueue: Queue,
    private readonly congViecService: CongViecService,
    private readonly duAnService: DuAnService,
    private readonly nguoiDungService: NguoiDungService,
  ) {}

@Cron(CronExpression.EVERY_DAY_AT_7AM, { timeZone: 'Asia/Ho_Chi_Minh' })
  async handleDailyReminders() {
    try {
        console.log('Chạy Cron Job nhắc nhở công việc hàng ngày.');
        
        const today = new Date();
        const tasksDueSoon = await this.congViecService.findTasksDueSoon(today);
        const overdueTasks = await this.congViecService.findOverdueTasks();
        const pendingTasks = await this.congViecService.findPendingTasks();
        
        console.log('Tìm thấy công việc sắp đến hạn:', tasksDueSoon); 

        if (tasksDueSoon.length > 0) {
            await this.addRemindersToQueue(tasksDueSoon, 'Sắp đến hạn');
        }
        if (overdueTasks.length > 0) {
            await this.addRemindersToQueue(overdueTasks, 'Quá hạn');
        }
        if (pendingTasks.length > 0) {
            await this.addRemindersToQueue(pendingTasks, 'Chưa hoàn thành');
        }
    } catch (error) {
        console.error('Lỗi khi chạy Cron Job:', error);
    }
  }

  // --- HÀM THÊM JOBS VÀO HÀNG ĐỢI ---
  private async addRemindersToQueue(tasks: CongViec[], type: string) {
    console.log(`Bắt đầu xử lý công việc và thêm vào hàng đợi. Loại: ${type}`);

    const tasksByUser = tasks.reduce((acc, task) => {
      const nguoiThucHien = task.nguoi_thuc_hien;
      if (nguoiThucHien && nguoiThucHien.email) {
        if (!acc[nguoiThucHien.email]) {
          acc[nguoiThucHien.email] = {
            ho_ten: nguoiThucHien.ho_ten,
            email: nguoiThucHien.email,
            tasks: [],
          };
        }
        acc[nguoiThucHien.email].tasks.push({
          ten_du_an: task.du_an.ten_du_an,
          tieu_de: task.tieu_de,
          han_chot: format(toZonedTime(task.han_chot, 'Asia/Ho_Chi_Minh'), 'dd/MM/yyyy HH:mm'),
        });
      }
      return acc;
    }, {});

    for (const userEmail in tasksByUser) {
      const userTaskData = tasksByUser[userEmail];
      const jobData = {
        to: userEmail,
        subject: `Nhắc nhở Công việc ${type}`,
        template: 'task-reminder', 
        context: {
          ho_ten: userTaskData.ho_ten,
          tasks: userTaskData.tasks,
        },
      };

      console.log('Đang thêm job vào hàng đợi với dữ liệu:', jobData); 
      await this.taskReminderQueue.add('send_reminder_email', jobData);
    }
    console.log(`Hoàn thành việc thêm các job vào hàng đợi. Loại: ${type}`); 
}
}