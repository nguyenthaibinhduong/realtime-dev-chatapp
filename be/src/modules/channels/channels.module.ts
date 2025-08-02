import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChannelsService } from './channels.service';
import { ChannelsController } from './channels.controller';
import { Channel } from './entities/channel.entity';
import { ChannelMember } from './entities/channel-member.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Channel, ChannelMember])],
  controllers: [ChannelsController],
  providers: [ChannelsService],
  exports: [ChannelsService],
})
export class ChannelsModule {}
