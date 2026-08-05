import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UsersModule } from '../users/users.module';
import { WaitlistEntry } from '../users/entities/waitlist.entity';

@Module({
  imports: [
    UsersModule,
    TypeOrmModule.forFeature([WaitlistEntry]),
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule { }
