import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('channels')
export class Channel {
  @PrimaryGeneratedColumn('uuid')
  id: string;
}
