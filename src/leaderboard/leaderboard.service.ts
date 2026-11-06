import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import Decimal from 'decimal.js';
import { DataSource } from 'typeorm';

export interface LeaderboardEntry {
  rank: number;
  playerId: string;
  points: string;
}

export interface PlayerPosition {
  playerId: string;
  points: string;
  rank: number;
}

export interface LeaderboardResponse {
  top: LeaderboardEntry[];
  player: PlayerPosition | null;
}

const TOP_SIZE = 100;

@Injectable()
export class LeaderboardService {
  constructor(@InjectDataSource() private readonly dataSource: DataSource) {}

  async getLeaderboard(playerId?: string): Promise<LeaderboardResponse> {
    const top = await this.getTop();
    const player = playerId ? await this.getPlayerPosition(playerId) : null;

    return { top, player };
  }

  private async getTop(): Promise<LeaderboardEntry[]> {
    const rows = await this.dataSource.query<Array<{ player_id: string; points: string }>>(
      `SELECT player_id, points
         FROM player_scores
        ORDER BY points DESC, player_id ASC
        LIMIT $1`,
      [TOP_SIZE],
    );

    let rank = 0;
    let previous: Decimal | null = null;

    return rows.map((row, index) => {
      const points = new Decimal(row.points);

      if (previous === null || !points.equals(previous)) {
        rank = index + 1;
        previous = points;
      }

      return { rank, playerId: row.player_id, points: points.toFixed() };
    });
  }

  private async getPlayerPosition(playerId: string): Promise<PlayerPosition> {
    const rows = await this.dataSource.query<Array<{ points: string }>>(
      `SELECT points FROM player_scores WHERE player_id = $1`,
      [playerId],
    );

    const points = new Decimal(rows.length > 0 ? rows[0].points : 0);

    const ahead = await this.dataSource.query<Array<{ count: string }>>(
      `SELECT COUNT(*)::text AS count FROM player_scores WHERE points > $1`,
      [points.toFixed()],
    );

    return {
      playerId,
      points: points.toFixed(),
      rank: parseInt(ahead[0].count, 10) + 1,
    };
  }
}
