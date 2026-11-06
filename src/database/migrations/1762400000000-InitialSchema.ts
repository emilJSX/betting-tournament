import { MigrationInterface, QueryRunner } from 'typeorm';

export class InitialSchema1762400000000 implements MigrationInterface {
  name = 'InitialSchema1762400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "bets" (
        "bet_id"     varchar(64)   NOT NULL,
        "player_id"  varchar(64)   NOT NULL,
        "currency"   varchar(16)   NOT NULL,
        "stake"      numeric(30,8) NOT NULL,
        "win_amount" numeric(30,8) NOT NULL,
        "settled_at" timestamptz   NOT NULL,
        "points"     numeric(30,8) NOT NULL DEFAULT 0,
        "status"     varchar(16)   NOT NULL,
        "created_at" timestamptz   NOT NULL DEFAULT now(),
        CONSTRAINT "pk_bets" PRIMARY KEY ("bet_id"),
        CONSTRAINT "chk_bets_status" CHECK ("status" IN ('settled', 'rolled_back'))
      )
    `);

    await queryRunner.query(`CREATE INDEX "idx_bets_player_id" ON "bets" ("player_id")`);

    await queryRunner.query(`
      CREATE TABLE "player_scores" (
        "player_id"  varchar(64)   NOT NULL,
        "points"     numeric(30,8) NOT NULL DEFAULT 0,
        "updated_at" timestamptz   NOT NULL DEFAULT now(),
        CONSTRAINT "pk_player_scores" PRIMARY KEY ("player_id")
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_player_scores_leaderboard"
        ON "player_scores" ("points" DESC, "player_id" ASC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_player_scores_leaderboard"`);
    await queryRunner.query(`DROP TABLE "player_scores"`);
    await queryRunner.query(`DROP INDEX "idx_bets_player_id"`);
    await queryRunner.query(`DROP TABLE "bets"`);
  }
}
