import { Injectable, Logger, type OnApplicationShutdown, type OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as amqp from 'amqplib';

import type { AppConfig } from '../config/configuration';

export const BET_SETTLED = 'bet.settled';
export const BET_ROLLBACK = 'bet.rollback';

export type MessageHandler = (message: amqp.ConsumeMessage) => Promise<void>;

@Injectable()
export class RabbitMqService implements OnModuleInit, OnApplicationShutdown {
  private readonly logger = new Logger(RabbitMqService.name);
  private readonly config: AppConfig['rabbitmq'];

  private connection: amqp.ChannelModel | null = null;
  private channel: amqp.Channel | null = null;

  constructor(config: ConfigService) {
    this.config = config.getOrThrow<AppConfig['rabbitmq']>('rabbitmq');
  }

  async onModuleInit(): Promise<void> {
    const { url, exchange, queue, deadLetterExchange, deadLetterQueue, prefetch } = this.config;

    this.connection = await amqp.connect(url);
    this.channel = await this.connection.createChannel();
    await this.channel.prefetch(prefetch);

    await this.channel.assertExchange(exchange, 'topic', { durable: true });
    await this.channel.assertExchange(deadLetterExchange, 'fanout', { durable: true });

    await this.channel.assertQueue(queue, {
      durable: true,
      arguments: { 'x-dead-letter-exchange': deadLetterExchange },
    });
    await this.channel.bindQueue(queue, exchange, BET_SETTLED);
    await this.channel.bindQueue(queue, exchange, BET_ROLLBACK);

    await this.channel.assertQueue(deadLetterQueue, { durable: true });
    await this.channel.bindQueue(deadLetterQueue, deadLetterExchange, '');

    this.logger.log(`Connected to RabbitMQ, prefetch=${prefetch}`);
  }

  async onApplicationShutdown(): Promise<void> {
    await this.channel?.close();
    await this.connection?.close();
  }

  async consume(handler: MessageHandler): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ channel is not ready');
    }

    await this.channel.consume(
      this.config.queue,
      (message) => {
        if (message) {
          void handler(message);
        }
      },
      { noAck: false },
    );

    this.logger.log(`Consuming ${this.config.queue}`);
  }

  ack(message: amqp.ConsumeMessage): void {
    this.channel?.ack(message);
  }

  reject(message: amqp.ConsumeMessage): void {
    this.channel?.nack(message, false, false);
  }
}
