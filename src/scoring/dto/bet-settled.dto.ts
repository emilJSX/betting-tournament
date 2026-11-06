import { Transform } from 'class-transformer';
import { IsISO8601, IsNotEmpty, IsNumberString, IsString, MaxLength } from 'class-validator';

export class BetSettledDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  betId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  playerId!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : value,
  )
  @IsString()
  @IsNotEmpty()
  @MaxLength(16)
  currency!: string;

  @Transform(({ value }: { value: unknown }) => String(value))
  @IsNumberString()
  stake!: string;

  @Transform(({ value }: { value: unknown }) => String(value))
  @IsNumberString()
  winAmount!: string;

  @IsISO8601({ strict: true })
  settledAt!: string;
}
