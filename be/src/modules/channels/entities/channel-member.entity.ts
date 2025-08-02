import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('channel_members')
export class ChannelMember {
  @PrimaryGeneratedColumn('uuid')
  id: string;
}
