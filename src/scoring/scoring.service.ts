import { Injectable, Logger } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import Decimal from 'decimal.js';
import { DataSource, type EntityManager } from 'typeorm';

import { BetStatus } from '../database/entities/bet.entity';
import type { BetRollbackDto } from './dto/bet-rollback.dto';
import type { BetSettledDto } from './dto/bet-settled.dto';
import { PointsCalculator } from './points.calculator';

@Injectable()
export class ScoringService {
  private readonly logger = new Logger(ScoringService.name);

  constructor(
    @InjectDataSource() private readonly dataSource: DataSource,
    private readonly calculator: PointsCalculator,
  ) {}

  async applySettlement(event: BetSettledDto): Promise<void> {
    const points = this.calculator.pointsFor(event.winAmount, event.currency);

    await this.dataSource.transaction(async (manager) => {
      const inserted = await manager.query<unknown[]>(
        `INSERT INTO bets (bet_id, player_id, currency, stake, win_amount, settled_at, points, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (bet_id) DO NOTHING
         RETURNING bet_id`,
        [
          event.betId,
          event.playerId,
          event.currency,
          event.stake,
          event.winAmount,
          new Date(event.settledAt),
          points,
          BetStatus.SETTLED,
        ],
      );

      if (inserted.length === 0) {
        this.logger.debug(`Bet ${event.betId} already processed`);
        return;
      }

      if (new Decimal(points).greaterThan(0)) {
        await this.addPoints(manager, event.playerId, points);
      }
    });
  }

  async applyRollback(event: BetRollbackDto): Promise<void> {
    await this.dataSource.transaction(async (manager) => {
      const rows = await manager.query<Array<{ player_id: string; points: string }>>(
        `SELECT player_id, points
           FROM bets
          WHERE bet_id = $1 AND status = $2
            FOR UPDATE`,
        [event.betId, BetStatus.SETTLED],
      );

      if (rows.length === 0) {
        this.logger.warn(`Rollback for bet ${event.betId}: nothing to reverse`);
        return;
      }

      await manager.query(`UPDATE bets SET status = $2 WHERE bet_id = $1`, [
        event.betId,
        BetStatus.ROLLED_BACK,
      ]);

      if (new Decimal(rows[0].points).greaterThan(0)) {
        await this.subtractPoints(manager, rows[0].player_id, rows[0].points);
      }
    });
  }

  private async addPoints(manager: EntityManager, playerId: string, points: string): Promise<void> {
    await manager.query(
      `INSERT INTO player_scores (player_id, points, updated_at)
       VALUES ($1, $2, now())
       ON CONFLICT (player_id) DO UPDATE
         SET points = player_scores.points + EXCLUDED.points, updated_at = now()`,
      [playerId, points],
    );
  }

  private async subtractPoints(
    manager: EntityManager,
    playerId: string,
    points: string,
  ): Promise<void> {
    await manager.query(
      `UPDATE player_scores
          SET points = points - $2, updated_at = now()
        WHERE player_id = $1`,
      [playerId, points],
    );
  }
}
