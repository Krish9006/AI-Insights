import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { Account } from './entities/account.entity';
import { UsersController } from './users.controller';
import { EmployeeProfile } from './entities/employee-profile.entity';
import { DailyMoodCheckin } from './entities/daily-mood-checkin.entity';
import { ChatSession } from './entities/chat-session.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Account, EmployeeProfile, DailyMoodCheckin, ChatSession])],
  providers: [UsersService],
  exports: [UsersService],
  controllers: [UsersController],
})
export class UsersModule { }
