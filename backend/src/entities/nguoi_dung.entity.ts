import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne,CreateDateColumn, UpdateDateColumn} from 'typeorm';
import { PhongBan } from './phong_ban.entity';
import { CongViec } from './cong_viec.entity';

export enum VaiTro {
  QUAN_LY = 'quan_ly',    
  NHAN_VIEN = 'nhan_vien', 
}

@Entity('nguoi_dung')
export class NguoiDung {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 100 })
  ho_ten: string;

  @Column({ unique: true })
  email: string;

  @Column()
  mat_khau?: string;

  @Column({
    type: 'enum',
    enum: VaiTro,
    default: VaiTro.NHAN_VIEN,
  })
  vai_tro: VaiTro;

  @Column({ type: 'boolean', default: true }) 
  trang_thai_hoat_dong: boolean;
  
  @CreateDateColumn()
  ngay_tao: Date;

  @UpdateDateColumn()
  ngay_cap_nhat: Date;

  // --- CÁC MỐI QUAN HỆ ---

  @Column({ type: 'uuid', nullable: true })
  phongBanId: string;

  @ManyToOne(() => PhongBan, (phongBan) => phongBan.thanh_vien)
  phong_ban: PhongBan;

  @OneToMany(() => CongViec, (congViec) => congViec.nguoi_thuc_hien)
  cong_viec: CongViec[];
}