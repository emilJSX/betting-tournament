import { Controller, Get, Headers } from '@nestjs/common';

import { LeaderboardService, type LeaderboardResponse } from './leaderboard.service';

@Controller('leaderboard')
export class LeaderboardController {
  constructor(private readonly leaderboard: LeaderboardService) {}

  @Get()
  async getLeaderboard(@Headers('x-player-id') playerId?: string): Promise<LeaderboardResponse> {
    return this.leaderboard.getLeaderboard(playerId?.trim() || undefined);
  }
}
