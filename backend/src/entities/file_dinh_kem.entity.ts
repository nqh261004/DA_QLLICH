import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { CongViec } from './cong_viec.entity';

@Entity('file_dinh_kem')
export class FileDinhKem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  ten_file_goc: string;

  @Column()
  ten_file_luu: string; 

  @Column()
  duong_dan: string;

  @Column()
  kich_thuoc: number;

  @Column()
  mimetype: string;

  @CreateDateColumn()
  ngay_tao: Date;

  @ManyToOne(() => CongViec, (congViec) => congViec.files, { onDelete: 'CASCADE' })
  cong_viec: CongViec;
}