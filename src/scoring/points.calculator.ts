import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Decimal from 'decimal.js';

export const POINTS_SCALE = 8;

@Injectable()
export class PointsCalculator {
  private readonly rates: Record<string, Decimal>;

  constructor(config: ConfigService) {
    const rates = config.getOrThrow<Record<string, string>>('rates');

    this.rates = Object.fromEntries(
      Object.entries(rates).map(([currency, rate]) => [currency, new Decimal(rate)]),
    );
  }

  pointsFor(winAmount: string, currency: string): string {
    const rate = this.rates[currency.trim().toUpperCase()];

    if (!rate) {
      throw new Error(`No exchange rate configured for ${currency}`);
    }

    const usd = new Decimal(winAmount).times(rate);

    if (usd.lessThanOrEqualTo(0)) {
      return new Decimal(0).toFixed(POINTS_SCALE);
    }

    return usd.toDecimalPlaces(POINTS_SCALE, Decimal.ROUND_DOWN).toFixed(POINTS_SCALE);
  }
}
