import { Column, CreateDateColumn, Entity, Index, PrimaryColumn } from 'typeorm';

export enum BetStatus {
  SETTLED = 'settled',
  ROLLED_BACK = 'rolled_back',
}

@Entity('bets')
@Index('idx_bets_player_id', ['playerId'])
export class Bet {
  @PrimaryColumn({ name: 'bet_id', type: 'varchar', length: 64 })
  betId!: string;

  @Column({ name: 'player_id', type: 'varchar', length: 64 })
  playerId!: string;

  @Column({ name: 'currency', type: 'varchar', length: 16 })
  currency!: string;

  @Column({ name: 'stake', type: 'numeric', precision: 30, scale: 8 })
  stake!: string;

  @Column({ name: 'win_amount', type: 'numeric', precision: 30, scale: 8 })
  winAmount!: string;

  @Column({ name: 'settled_at', type: 'timestamptz' })
  settledAt!: Date;

  @Column({ name: 'points', type: 'numeric', precision: 30, scale: 8, default: 0 })
  points!: string;

  @Column({ name: 'status', type: 'varchar', length: 16 })
  status!: BetStatus;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
