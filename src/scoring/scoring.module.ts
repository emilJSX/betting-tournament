import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Bet } from '../database/entities/bet.entity';
import { PlayerScore } from '../database/entities/player-score.entity';
import { PointsCalculator } from './points.calculator';
import { ScoringService } from './scoring.service';

@Module({
  imports: [TypeOrmModule.forFeature([Bet, PlayerScore])],
  providers: [PointsCalculator, ScoringService],
  exports: [ScoringService],
})
export class ScoringModule {}
