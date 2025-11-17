import { ForbiddenException, Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DeleteResult } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { NguoiDung, VaiTro } from 'src/entities/nguoi_dung.entity';
import { PhongBan } from 'src/entities/phong_ban.entity'; 
import { TaoNguoiDungDto } from './dto/tao_nguoi_dung.dto';
import { CapNhatNguoiDungDto } from './dto/cap_nhat_nguoi_dung.dto';
import { InjectQueue } from '@nestjs/bull';
import type { Queue } from 'bull';
import { format } from 'date-fns';

@Injectable()
export class NguoiDungService {
  constructor(
    @InjectRepository(NguoiDung)
    private nguoiDungRepository: Repository<NguoiDung>,
    @InjectRepository(PhongBan)
    private phongBanRepository: Repository<PhongBan>,
    @InjectQueue('task_reminder') private taskReminderQueue: Queue,
  ) {}

    /** 1 LẤY THÔNG TIN TÀI KHOẢN **/
  async layThongTinCaNhan(id: string): Promise<NguoiDung> {
    const user = await this.nguoiDungRepository.findOne({
      where: { id },
      relations: ['phong_ban'],
      select: ['id', 'ho_ten', 'email', 'vai_tro', 'trang_thai_hoat_dong', 'phong_ban', 'ngay_tao'],
    });
    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại.');
    }
    return user;
  }

  /** 2 TẠO TÀI KHOẢN NHÂN VIÊN **/
  async taoTaiKhoanNhanVien(idNguoiTao: string, taoNguoiDungDto: TaoNguoiDungDto): Promise<NguoiDung> {
    const quanLy = await this.nguoiDungRepository.findOne({
      where: { id: idNguoiTao },
      relations: ['phong_ban'],
    });

    if (!quanLy || quanLy.vai_tro !== VaiTro.QUAN_LY || !quanLy.phong_ban) {
      throw new ForbiddenException('Chi Quản lý có phòng ban mới được phép tạo tài khoản nhân viên.');
    }

    const tonTai = await this.nguoiDungRepository.findOneBy({ email: taoNguoiDungDto.email });
    if (tonTai) {
      throw new ForbiddenException('Email đã được sử dụng cho tài khoản khác.');
    }

    const salt = await bcrypt.genSalt();
    const mat_khau_hash = await bcrypt.hash(taoNguoiDungDto.mat_khau, salt);

    const nhanVienMoi = this.nguoiDungRepository.create({
      ho_ten: taoNguoiDungDto.ho_ten,
      email: taoNguoiDungDto.email,
      mat_khau: mat_khau_hash,
      vai_tro: taoNguoiDungDto.vai_tro || VaiTro.NHAN_VIEN,
      phongBanId: quanLy.phongBanId,
    } as unknown as NguoiDung);

    const result = await this.nguoiDungRepository.save(nhanVienMoi);
    try {
        await this.taskReminderQueue.add('send_welcome_email', {
          to: result.email,
          subject: 'Chào mừng bạn đến với hệ thống!',
          template: 'welcome',
          context: {
            ho_ten: result.ho_ten,
            email: result.email,
            mat_khau: taoNguoiDungDto.mat_khau,
            vai_tro: result.vai_tro,
          },
        });
    } catch (error) {
        console.error('Lỗi khi thêm job vào queue:', error);
    }

    delete (result as NguoiDung).mat_khau;
    return result;
  }

  /** 3. CẬP NHẬT THÔNG TIN NGƯỜI DÙNG **/
  async capNhatThongTin(
    idNguoiDangNhap: string,
    vaiTroNguoiDangNhap: VaiTro,
    idNguoiDungCanSua: string,
    capNhatNguoiDungDto: CapNhatNguoiDungDto,
  ): Promise<NguoiDung> {
    const isSelfUpdate = idNguoiDangNhap === idNguoiDungCanSua;
    const isManager = vaiTroNguoiDangNhap === VaiTro.QUAN_LY;
    
    const nguoiDungCanSua = await this.nguoiDungRepository.findOne({
        where: { id: idNguoiDungCanSua },
        relations: ['phong_ban'],
    });

    if (!nguoiDungCanSua) {
      throw new NotFoundException('Tài khoản người dùng không tồn tại.');
    }
    
    if (!isManager && !isSelfUpdate) {
        throw new ForbiddenException('Bạn không có quyền cập nhật thông tin người dùng khác.');
    }

    const trangThaiHoatDongCu = nguoiDungCanSua.trang_thai_hoat_dong;
    const isPasswordBeingChanged = !!capNhatNguoiDungDto.mat_khau;

    if (!isManager) { 
        if (capNhatNguoiDungDto.trang_thai_hoat_dong !== undefined) {
             throw new ForbiddenException('Nhân viên không được phép thay đổi trạng thái hoạt động.');
        }
        if (capNhatNguoiDungDto.phongBanId !== undefined) {
            throw new ForbiddenException('Nhân viên không được phép thay đổi phòng ban.');
        }
    }

    if (capNhatNguoiDungDto.mat_khau) {
      if (capNhatNguoiDungDto.mat_khau.length < 6) { 
        throw new BadRequestException('Mật khẩu phải chứa ít nhất 6 ký tự.');
      }
      const salt = await bcrypt.genSalt();
      capNhatNguoiDungDto.mat_khau = await bcrypt.hash(capNhatNguoiDungDto.mat_khau, salt);
    }

    Object.assign(nguoiDungCanSua, capNhatNguoiDungDto);
    
    if (capNhatNguoiDungDto.phongBanId && isManager) {
        nguoiDungCanSua.phongBanId = capNhatNguoiDungDto.phongBanId;
    }

    const result = await this.nguoiDungRepository.save(nguoiDungCanSua);

    if (capNhatNguoiDungDto.trang_thai_hoat_dong !== undefined && trangThaiHoatDongCu !== capNhatNguoiDungDto.trang_thai_hoat_dong) {
        await this.taskReminderQueue.add('send_account_status_email', {
            to: result.email,
            subject: 'Thông báo: Trạng thái tài khoản của bạn đã thay đổi',
            template: 'account-status',
            context: {
                ho_ten: result.ho_ten,
                trang_thai_moi: capNhatNguoiDungDto.trang_thai_hoat_dong ? 'Đã kích hoạt' : 'Đã vô hiệu hóa',
                is_locked: !capNhatNguoiDungDto.trang_thai_hoat_dong,
            },
        });
    }

    if (isPasswordBeingChanged) {
      await this.taskReminderQueue.add('send_password_changed_email', {
          to: result.email,
          subject: 'THÔNG BÁO BẢO MẬT: Mật khẩu tài khoản đã thay đổi',
          template: 'password-changed',
          context: {
              ho_ten: result.ho_ten,
              thoi_gian: format(new Date(), 'HH:mm:ss dd/MM/yyyy'),
          },
      });
    }

    delete result.mat_khau;
    return result;
  }

  /** 4. LẤY DANH SÁCH NGƯỜI DÙNG TRONG PHÒNG BAN (CHỈ QUẢN LÝ MỚI ĐƯỢC XEM) **/
  async layTatCaNguoiDung(idNguoiDung: string): Promise<NguoiDung[]> {
    const nguoiDangNhap = await this.nguoiDungRepository.findOne({
      where: { id: idNguoiDung },
      relations: ['phong_ban'],
    });
    if (nguoiDangNhap?.vai_tro !== VaiTro.QUAN_LY) {
      throw new ForbiddenException('Chi Quản lý mới có quyền xem danh sách người dùng trong phòng ban.');
    }

    if (!nguoiDangNhap.phongBanId) {
      return []; 
    }

    return this.nguoiDungRepository.find({
      where: { phongBanId: nguoiDangNhap.phongBanId },
      select: ['id', 'ho_ten', 'email', 'vai_tro', 'trang_thai_hoat_dong'],
      relations: ['phong_ban'],
      order: {
        ho_ten: 'ASC',
      },
    });
  }

  /** 5. XÓA NGƯỜI DÙNG (CHỈ QUẢN LÝ MỚI ĐƯỢC XÓA) **/
  async xoaNguoiDung(idNguoiDangNhap: string, idNguoiDungCanXoa: string): Promise<DeleteResult> {
    const isSelfDelete = idNguoiDangNhap === idNguoiDungCanXoa;
    
    if (isSelfDelete) {
        throw new ForbiddenException('Bạn không thể xóa chính tài khoản của mình.');
    }
    
    const nguoiDangNhap = await this.nguoiDungRepository.findOneBy({ id: idNguoiDangNhap });

    if (nguoiDangNhap?.vai_tro !== VaiTro.QUAN_LY) {
        throw new ForbiddenException('Chi Quản lý mới có quyền xóa người dùng.');
    }

    const nguoiDungCanXoa = await this.nguoiDungRepository.findOneBy({ id: idNguoiDungCanXoa });

    if (!nguoiDungCanXoa) {
        throw new NotFoundException('Tài khoản người dùng cần xóa không tồn tại.');
    }

    if (nguoiDungCanXoa.phongBanId !== nguoiDangNhap.phongBanId) {
        throw new ForbiddenException('Bạn không có quyền xóa người dùng từ phòng ban khác.');
    }

    const ketQua = await this.nguoiDungRepository.delete(idNguoiDungCanXoa);
    return ketQua;
  }
}