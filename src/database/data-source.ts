import { config as loadEnv } from 'dotenv';
import { DataSource } from 'typeorm';

import { Bet } from './entities/bet.entity';
import { PlayerScore } from './entities/player-score.entity';

loadEnv();

export default new DataSource({
  type: 'postgres',
  host: process.env.DATABASE_HOST ?? 'localhost',
  port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
  username: process.env.DATABASE_USER ?? 'tournament',
  password: process.env.DATABASE_PASSWORD ?? 'tournament',
  database: process.env.DATABASE_NAME ?? 'tournament',
  entities: [Bet, PlayerScore],
  migrations: [__dirname + '/migrations/*{.ts,.js}'],
  synchronize: false,
});
