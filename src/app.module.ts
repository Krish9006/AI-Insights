import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { Account } from './users/entities/account.entity';
import { GrowthEngineModule } from './growth-engine/growth-engine.module';

import { DailyMoodCheckin } from './users/entities/daily-mood-checkin.entity';
import { ChatSession } from './users/entities/chat-session.entity';
import { Pathway } from './users/entities/pathway.entity';
import { DirectMessage } from './users/entities/direct-message.entity';
import { GrowthStory } from './users/entities/growth-story.entity';
import { WaitlistEntry } from './users/entities/waitlist.entity';

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
          entities: [Account, DailyMoodCheckin, ChatSession, Pathway, DirectMessage, GrowthStory, WaitlistEntry],
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
    GrowthEngineModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
