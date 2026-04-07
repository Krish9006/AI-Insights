import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { Account } from './entities/account.entity';
import { UsersController } from './users.controller';
import { DailyMoodCheckin } from './entities/daily-mood-checkin.entity';
import { ChatSession } from './entities/chat-session.entity';
import { Pathway } from './entities/pathway.entity';
import { DirectMessage } from './entities/direct-message.entity';
import { GrowthStory } from './entities/growth-story.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account, DailyMoodCheckin, ChatSession, Pathway, DirectMessage, GrowthStory])],


  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule { }
