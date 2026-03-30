import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { Account } from './users/entities/account.entity';

import { EmployeeProfile } from './users/entities/employee-profile.entity';
import { DailyMoodCheckin } from './users/entities/daily-mood-checkin.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const useSsl = configService.get<string>('DATABASE_SSL') !== 'false';
        const synchronize =
          configService.get<string>('DATABASE_SYNCHRONIZE') !== 'false';
        return {
          type: 'postgres' as const,
          url: configService.get<string>('DATABASE_URL'),
          entities: [Account, EmployeeProfile, DailyMoodCheckin],
          synchronize,
          ...(useSsl
            ? {
                ssl: true,
                extra: {
                  ssl: {
                    rejectUnauthorized: false,
                  },
                },
              }
            : {}),
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
