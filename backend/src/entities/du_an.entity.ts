// src/entities/du_an.entity.ts
import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn
} from 'typeorm';
import { PhongBan } from './phong_ban.entity';
import { CongViec } from './cong_viec.entity';
import { NguoiDung } from './nguoi_dung.entity';

export enum TrangThaiDuAn {
  SAP_BAT_DAU = 'sap_bat_dau',
  DANG_TIEN_HANH = 'dang_tien_hanh',
  TAM_DUNG = 'tam_dung',
  HOAN_THANH = 'hoan_thanh',
  HUY = 'huy',
}


@Entity('du_an')
export class DuAn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  ten_du_an: string;

  @Column('text', { nullable: true })
  mo_ta: string;

  // Bổ sung: Cột Trạng thái
  @Column({
    type: 'enum',
    enum: TrangThaiDuAn,
    default: TrangThaiDuAn.SAP_BAT_DAU,
  })
  trang_thai: TrangThaiDuAn;
  
  @CreateDateColumn()
  ngay_tao: Date;

  @UpdateDateColumn()
  ngay_cap_nhat: Date;

    // BỔ SUNG: NGƯỜI QUẢN LÝ (MANAGER) ĐÃ TẠO RA DỰ ÁN
  @ManyToOne(() => NguoiDung, { onDelete: 'SET NULL' }) 
  nguoi_quan_ly: NguoiDung; // Dòng này là nguyên nhân của lỗi trước đó

  // --- CÁC MỐI QUAN HỆ ---
  // Nhiều dự án thuộc về một phòng ban
  @ManyToOne(() => PhongBan, (phongBan) => phongBan.du_an)
  phong_ban: PhongBan;

  // Một dự án có nhiều công việc
  @OneToMany(() => CongViec, (congViec) => congViec.du_an)
  cong_viec: CongViec[];
}