import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { UserRole } from '../../../common/decorators/roles.decorator';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['username'], { unique: true })
export class User {
  @ApiProperty({ description: 'User ID' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ description: 'Username' })
  @Column({ unique: true, length: 50 })
  username: string;

  @ApiProperty({ description: 'Email address' })
  @Column({ unique: true, length: 255 })
  email: string;

  @Exclude({ toPlainOnly: true })
  @Column({ length: 255 })
  password: string;

  @ApiProperty({ description: 'Display name' })
  @Column({ length: 100, nullable: true })
  displayName?: string;

  @ApiProperty({ description: 'Profile picture URL' })
  @Column({ length: 500, nullable: true })
  profilePicture?: string;

  @ApiProperty({ description: 'User role', enum: UserRole })
  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @ApiProperty({ description: 'Whether 2FA is enabled' })
  @Column({ default: false })
  is2faEnabled: boolean;

  @Exclude({ toPlainOnly: true })
  @Column({ nullable: true })
  twoFactorSecret?: string;

  @ApiProperty({ description: 'Whether user is active' })
  @Column({ default: true })
  isActive: boolean;

  @ApiProperty({ description: 'Last login timestamp' })
  @Column({ type: 'timestamp', nullable: true })
  lastLogin?: Date;

  @ApiProperty({ description: 'User creation timestamp' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ description: 'User last update timestamp' })
  @UpdateDateColumn()
  updatedAt: Date;
}
