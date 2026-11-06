import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class BetRollbackDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  betId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  playerId?: string;
}
