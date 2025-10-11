// src/du-an/du_an.service.ts

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DeleteResult, Repository } from 'typeorm';
import { DuAn } from 'src/entities/du_an.entity';
import { NguoiDung, VaiTro } from 'src/entities/nguoi_dung.entity';
import { TaoDuAnDto } from './dto/tao_du_an.dto';
import { CapNhatDuAnDto } from './dto/cap_nhat_du_an.dto';

@Injectable()
export class DuAnService {
  constructor(
    @InjectRepository(DuAn)
    private duAnRepository: Repository<DuAn>,
    @InjectRepository(NguoiDung)
    private nguoiDungRepository: Repository<NguoiDung>,
  ) {}

  /** 1. TẠO DỰ ÁN */
  async taoDuAn(idNguoiTao: string, taoDuAnDto: TaoDuAnDto): Promise<DuAn> {
    const nguoiTao = await this.nguoiDungRepository.findOne({
      where: { id: idNguoiTao },
      relations: ['phong_ban'],
    });

    if (!nguoiTao) {
        throw new NotFoundException('Nguoi dung tao du an khong ton tai.');
    }

    if (nguoiTao.vai_tro !== VaiTro.QUAN_LY) {
      throw new ForbiddenException('Chi Quan ly moi duoc phep tao Du an.'); 
    }

    if (!nguoiTao.phong_ban) {
      throw new ForbiddenException('Quan ly chua duoc gan vao Phong ban nao.');
    }

    // ĐÃ SỬA LỖI CUỐI CÙNG (TS2769 & TS2740)
    const duAnMoi = this.duAnRepository.create({
      ...taoDuAnDto,
      nguoi_quan_ly: { id: nguoiTao.id },
      phong_ban: { id: nguoiTao.phong_ban.id }, 
    } as unknown as DuAn); // Ép kiểu thành DuAn

    return this.duAnRepository.save(duAnMoi);
  }

 /** 2. LẤY TẤT CẢ DỰ ÁN */
  async layTatCaDuAn(idNguoiDung: string): Promise<DuAn[]> {
    const nguoiDung = await this.nguoiDungRepository.findOne({
      where: { id: idNguoiDung },
      // KHÔNG CẦN TẢI RELATION NỮA!
      // relations: ['phong_ban'], 
    });

    // Lấy ID khóa ngoại: an toàn hơn vì nó là thuộc tính trên Entity
    const idPhongBan = nguoiDung?.phongBanId;

    // Nếu không tìm thấy người dùng HOẶC ID khóa ngoại bị null, trả về mảng rỗng.
    if (!idPhongBan) {
      return [];
    }

    return this.duAnRepository.find({
      // Lọc theo ID phòng ban (Dùng quan hệ để lọc)
      where: { phong_ban: { id: idPhongBan } }, 
      relations: ['nguoi_quan_ly', 'phong_ban'], 
    });
  }

  /** 3. LẤY CHI TIẾT DỰ ÁN */
  async layChiTietDuAn(idNguoiDung: string, idDuAn: string): Promise<DuAn> {
    const duAn = await this.duAnRepository.findOne({
      where: { id: idDuAn },
      relations: ['nguoi_quan_ly', 'phong_ban'],
    });

    if (!duAn) {
      throw new NotFoundException('Du an khong ton tai');
    }
    
    const nguoiDung = await this.nguoiDungRepository.findOne({
        where: { id: idNguoiDung },
        relations: ['phong_ban'],
    });
    
    if (!nguoiDung) {
        throw new NotFoundException('Nguoi dung khong ton tai.');
    }

    if (!nguoiDung.phong_ban || nguoiDung.phong_ban.id !== duAn.phong_ban.id) {
        throw new ForbiddenException('Ban khong co quyen truy cap du an nay.');
    }

    return duAn;
  }

  /** 4. CẬP NHẬT DỰ ÁN */
  async capNhatDuAn(idNguoiDung: string, idDuAn: string, capNhatDuAnDto: CapNhatDuAnDto): Promise<DuAn> {
    const nguoiDung = await this.nguoiDungRepository.findOne({
        where: { id: idNguoiDung },
        relations: ['phong_ban'],
    });

    if (!nguoiDung) {
        throw new NotFoundException('Nguoi dung khong ton tai.');
    }

    if (nguoiDung.vai_tro !== VaiTro.QUAN_LY) {
        throw new ForbiddenException('Ban khong co quyen cap nhat Du an. Chi Quan ly moi duoc phep.');
    }

    const duAn = await this.duAnRepository.findOne({
      where: { id: idDuAn },
      relations: ['phong_ban'],
    });

    if (!duAn) {
      throw new NotFoundException('Du an khong ton tai');
    }

    if (!nguoiDung.phong_ban || duAn.phong_ban.id !== nguoiDung.phong_ban.id) {
        throw new ForbiddenException('Ban khong co quyen cap nhat Du an cua phong ban khac.');
    }

    Object.assign(duAn, capNhatDuAnDto);
    return this.duAnRepository.save(duAn);
  }
  
  /** 5. XÓA DỰ ÁN */
  async xoaDuAn(idNguoiDung: string, idDuAn: string): Promise<DeleteResult> {
    const nguoiDung = await this.nguoiDungRepository.findOne({
        where: { id: idNguoiDung },
        relations: ['phong_ban'],
    });

    if (!nguoiDung) {
        throw new NotFoundException('Nguoi dung khong ton tai.');
    }
    
    if (nguoiDung.vai_tro !== VaiTro.QUAN_LY) {
        throw new ForbiddenException('Ban khong co quyen xoa Du an. Chi Quan ly moi duoc phep.');
    }

    const duAn = await this.duAnRepository.findOne({
        where: { id: idDuAn },
        relations: ['phong_ban'],
    });

    if (!duAn) {
        throw new NotFoundException('Du an khong ton tai');
    }

    if (!nguoiDung.phong_ban || duAn.phong_ban.id !== nguoiDung.phong_ban.id) {
        throw new ForbiddenException('Ban khong co quyen xoa Du an cua phong ban khac.');
    }

    const ketQua = await this.duAnRepository.delete(idDuAn);
    return ketQua;
  }
}