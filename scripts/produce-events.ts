import * as amqp from 'amqplib';
import { config as loadEnv } from 'dotenv';

loadEnv();

const URL = process.env.RABBITMQ_URL ?? 'amqp://tournament:tournament@localhost:5672';
const EXCHANGE = process.env.RABBITMQ_EXCHANGE ?? 'bets';
const SETTLED = 'bet.settled';
const ROLLBACK = 'bet.rollback';

const args = process.argv.slice(2);
const bets = args.includes('--bets') ? parseInt(args[args.indexOf('--bets') + 1], 10) : 200;
const players = args.includes('--players') ? parseInt(args[args.indexOf('--players') + 1], 10) : 20;

let channel: amqp.Channel;

function send(routingKey: string, payload: unknown): void {
  channel.publish(EXCHANGE, routingKey, Buffer.from(JSON.stringify(payload)), {
    persistent: true,
    contentType: 'application/json',
  });
}

function settled(betId: string, playerId: string, winAmount: number, currency = 'USD') {
  return {
    betId,
    playerId,
    currency,
    stake: 10,
    winAmount,
    settledAt: new Date().toISOString(),
  };
}

function checks(): void {
  const stamp = Date.now();

  send(SETTLED, settled(`chk-${stamp}-usd`, 'check-usd', 25.5));
  send(SETTLED, settled(`chk-${stamp}-eur`, 'check-eur', 100, 'EUR'));
  send(SETTLED, settled(`chk-${stamp}-loss`, 'check-loss', 0));

  const duplicate = settled(`chk-${stamp}-dup`, 'check-duplicate', 70);
  send(SETTLED, duplicate);
  send(SETTLED, duplicate);

  const cancelled = settled(`chk-${stamp}-rollback`, 'check-rollback', 500);
  send(SETTLED, cancelled);
  send(ROLLBACK, { betId: cancelled.betId, playerId: cancelled.playerId });

  send(SETTLED, settled(`chk-${stamp}-xyz`, 'check-unknown-currency', 10, 'XYZ'));

  console.log(`
Ожидаемый результат:
  check-usd          25.5   выиграно 25.50 USD
  check-eur          109    100 EUR по курсу 1.09
  check-loss         нет    проигрыш, очки не начисляются
  check-duplicate    70     дубль bet.settled не удваивает очки
  check-rollback     0      ставка отменена, очки списаны
  check-unknown-currency  нет, сообщение уходит в bets.events.dlq
`);
}

function load(): void {
  const currencies = ['USD', 'EUR', 'GBP', 'TRY', 'AZN'];
  const stamp = Date.now();

  for (let i = 0; i < bets; i += 1) {
    const betId = `bet-${stamp}-${i}`;
    const playerId = `player-${String(i % players).padStart(3, '0')}`;
    const stake = Math.round((Math.random() * 190 + 10) * 100) / 100;
    const won = Math.random() < 0.34;
    const winAmount = won ? Math.round(stake * (1 + Math.random() * 3) * 100) / 100 : 0;

    send(SETTLED, {
      betId,
      playerId,
      currency: currencies[i % currencies.length],
      stake,
      winAmount,
      settledAt: new Date().toISOString(),
    });

    if (won && Math.random() < 0.02) {
      send(ROLLBACK, { betId, playerId });
    }
  }

  console.log(`Отправлено ${bets} ставок по ${players} игрокам.`);
}

async function main(): Promise<void> {
  const connection = await amqp.connect(URL);
  channel = await connection.createChannel();
  await channel.assertExchange(EXCHANGE, 'topic', { durable: true });

  checks();

  if (!args.includes('--checks')) {
    load();
  }

  await channel.close();
  await connection.close();
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
