// src/entities/cong_viec.entity.ts
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { DuAn } from './du_an.entity';
import { NguoiDung } from './nguoi_dung.entity';

export enum TrangThaiCongViec {
  CAN_LAM = 'can_lam',
  DANG_LAM = 'dang_lam',
  DA_XONG = 'da_xong',
}

@Entity('cong_viec')
export class CongViec {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 200 })
  tieu_de: string;

  @Column({ type: 'text', nullable: true })
  mo_ta: string;

  @Column({
    type: 'enum',
    enum: TrangThaiCongViec,
    default: TrangThaiCongViec.CAN_LAM,
  })
  trang_thai: TrangThaiCongViec;

  @Column({ type: 'timestamp', nullable: true })
  ngay_het_han: Date;
  
  @CreateDateColumn()
  ngay_tao: Date;

  @UpdateDateColumn()
  ngay_cap_nhat: Date;

  // --- CÁC MỐI QUAN HỆ ---
  // Nhiều công việc thuộc về một dự án
  @ManyToOne(() => DuAn, (duAn) => duAn.cong_viec)
  du_an: DuAn;
  
  // Nhiều công việc được giao cho một người thực hiện
  @ManyToOne(() => NguoiDung, (nguoiDung) => nguoiDung.cong_viec)
  nguoi_thuc_hien: NguoiDung;
}