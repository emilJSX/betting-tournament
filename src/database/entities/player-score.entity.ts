import { Column, Entity, PrimaryColumn, UpdateDateColumn } from 'typeorm';

@Entity('player_scores')
export class PlayerScore {
  @PrimaryColumn({ name: 'player_id', type: 'varchar', length: 64 })
  playerId!: string;

  @Column({ name: 'points', type: 'numeric', precision: 30, scale: 8, default: 0 })
  points!: string;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
