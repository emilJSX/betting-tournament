import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { configuration } from './config/configuration';
import { DatabaseModule } from './database/database.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';
import { MessagingModule } from './messaging/messaging.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    DatabaseModule,
    MessagingModule,
    LeaderboardModule,
  ],
})
export class AppModule {}
