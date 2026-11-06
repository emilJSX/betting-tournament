import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';

import type { AppConfig } from '../config/configuration';
import { Bet } from './entities/bet.entity';
import { PlayerScore } from './entities/player-score.entity';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const db = config.getOrThrow<AppConfig['database']>('database');

        return {
          type: 'postgres' as const,
          ...db,
          entities: [Bet, PlayerScore],
          migrations: [__dirname + '/migrations/*{.ts,.js}'],
          migrationsRun: process.env.DATABASE_RUN_MIGRATIONS !== 'false',
          synchronize: false,
        };
      },
    }),
  ],
})
export class DatabaseModule {}
