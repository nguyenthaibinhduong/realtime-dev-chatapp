import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RefreshToken } from './refresh_token.entity';

export enum UserRole {
  USER = 'user',
  MODERATOR = 'moderator',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true, nullable: true })
  email: string | null; // Địa chỉ email (unique)

  @Column({ length: 255 })
  username: string;

  @Column({ length: 255, nullable: true })
  fullname: string | null;

  @Column({ nullable: true })
  birth_date: Date | null;

  @Column({ default: '' })
  address?: string;

  @Column({ length: 255, nullable: true })
  phone: string; // Số điện thoại (unique)

  @Column()
  @Exclude()
  password: string; // Mật khẩu (lưu trữ sau khi mã hóa)

  @Column({ length: 255, nullable: true })
  avatar: string;

  @Column({ type: 'enum', enum: UserRole })
  role: UserRole;

  @OneToMany(() => RefreshToken, (refreshToken) => refreshToken.user, {
    cascade: true,
  })
  refreshTokens: RefreshToken[];
  @CreateDateColumn()
  created_at: Date; // Ngày tạo tài khoản

  @UpdateDateColumn()
  updated_at: Date; // Ngày cập nhật thông tin người dùng

  @Column({ default: true })
  active: boolean;

  @Column({ default: false })
  is_master: boolean;
}
