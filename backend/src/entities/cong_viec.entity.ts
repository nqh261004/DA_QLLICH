import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { DuAn } from './du_an.entity'; 
import { NguoiDung } from './nguoi_dung.entity'; 

export enum TrangThaiCongViec {
  CAN_LAM = 'can_lam', 
  DANG_LAM = 'dang_lam',
  CHO_DUYET = 'cho_duyet', 
  CAN_SUA = 'can_sua', 
  PHE_DUYET = 'phe_duyet',
  BI_HUY = 'bi_huy',
}

@Entity('cong_viec')
export class CongViec {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 255 })
  tieu_de: string;

  @Column('text', { nullable: true })
  mo_ta: string;
  
  @Column({
    type: 'enum',
    enum: TrangThaiCongViec,
    default: TrangThaiCongViec.CAN_LAM,
  })
  trang_thai: TrangThaiCongViec;
  
  @Column({ default: 0 })
  muc_do_uu_tien: number;

  @CreateDateColumn()
  ngay_tao: Date;

  @UpdateDateColumn()
  ngay_cap_nhat: Date;
  
  @Column({ type: 'timestamp', nullable: true })
  han_chot: Date;

  // --- CÁC MỐI QUAN HỆ VÀ ID KHÓA NGOẠI ---
  
  @ManyToOne(() => DuAn, (duAn) => duAn.cong_viec, { onDelete: 'CASCADE' })
  du_an: DuAn;
  @Column({ type: 'uuid', nullable: false })
  duAnId: string; // Khóa ngoại ID

  @ManyToOne(() => NguoiDung, (nguoiDung) => nguoiDung.cong_viec, { onDelete: 'SET NULL' })
  nguoi_thuc_hien: NguoiDung;
  @Column({ type: 'uuid', nullable: true })
  nguoiThucHienId: string;

  @ManyToOne(() => NguoiDung, { onDelete: 'SET NULL' }) 
  nguoi_giao_viec: NguoiDung;
  @Column({ type: 'uuid', nullable: true })
  nguoiGiaoViecId: string;
}