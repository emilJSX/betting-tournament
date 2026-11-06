export interface AppConfig {
  port: number;
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    database: string;
  };
  rabbitmq: {
    url: string;
    exchange: string;
    queue: string;
    deadLetterExchange: string;
    deadLetterQueue: string;
    prefetch: number;
  };
  rates: Record<string, string>;
}

function parseRates(): Record<string, string> {
  const raw = JSON.parse(process.env.EXCHANGE_RATES ?? '{"USD":1}') as Record<string, unknown>;
  const rates: Record<string, string> = {};

  for (const [currency, rate] of Object.entries(raw)) {
    if (!(Number(rate) > 0)) {
      throw new Error(`EXCHANGE_RATES: rate for ${currency} must be a positive number`);
    }
    rates[currency.toUpperCase()] = String(rate);
  }

  if (!rates.USD) {
    throw new Error('EXCHANGE_RATES must contain USD');
  }

  return rates;
}

export function configuration(): AppConfig {
  const exchange = process.env.RABBITMQ_EXCHANGE ?? 'bets';
  const queue = process.env.RABBITMQ_QUEUE ?? 'bets.events';

  return {
    port: parseInt(process.env.PORT ?? '3000', 10),
    database: {
      host: process.env.DATABASE_HOST ?? 'localhost',
      port: parseInt(process.env.DATABASE_PORT ?? '5432', 10),
      username: process.env.DATABASE_USER ?? 'tournament',
      password: process.env.DATABASE_PASSWORD ?? 'tournament',
      database: process.env.DATABASE_NAME ?? 'tournament',
    },
    rabbitmq: {
      url: process.env.RABBITMQ_URL ?? 'amqp://tournament:tournament@localhost:5672',
      exchange,
      queue,
      deadLetterExchange: `${exchange}.dlx`,
      deadLetterQueue: `${queue}.dlq`,
      prefetch: parseInt(process.env.RABBITMQ_PREFETCH ?? '1', 10),
    },
    rates: parseRates(),
  };
}
