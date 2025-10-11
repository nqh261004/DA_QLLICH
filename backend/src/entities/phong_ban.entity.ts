// src/entities/phong_ban.entity.ts
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  OneToMany, 
  CreateDateColumn, 
  UpdateDateColumn 
} from 'typeorm';
import { NguoiDung } from './nguoi_dung.entity';
import { DuAn } from './du_an.entity';

@Entity('phong_ban')
export class PhongBan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100, unique: true })
  ten_phong_ban: string;

  @CreateDateColumn()
  ngay_tao: Date;

  @UpdateDateColumn()
  ngay_cap_nhat: Date;

  // --- CÁC MỐI QUAN HỆ ---
  // Một phòng ban có nhiều thành viên (NguoiDung)
  @OneToMany(() => NguoiDung, (nguoiDung) => nguoiDung.phong_ban)
  thanh_vien: NguoiDung[];

  // Một phòng ban có nhiều dự án (DuAn)
  @OneToMany(() => DuAn, (duAn) => duAn.phong_ban)
  du_an: DuAn[];
}