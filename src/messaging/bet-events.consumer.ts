import { Injectable, Logger, type OnApplicationBootstrap } from '@nestjs/common';
import type * as amqp from 'amqplib';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';

import { BetRollbackDto } from '../scoring/dto/bet-rollback.dto';
import { BetSettledDto } from '../scoring/dto/bet-settled.dto';
import { ScoringService } from '../scoring/scoring.service';
import { BET_ROLLBACK, BET_SETTLED, RabbitMqService } from './rabbitmq.service';

@Injectable()
export class BetEventsConsumer implements OnApplicationBootstrap {
  private readonly logger = new Logger(BetEventsConsumer.name);

  constructor(
    private readonly rabbit: RabbitMqService,
    private readonly scoring: ScoringService,
  ) {}

  async onApplicationBootstrap(): Promise<void> {
    await this.rabbit.consume((message) => this.handle(message));
  }

  async handle(message: amqp.ConsumeMessage): Promise<void> {
    const routingKey = message.fields.routingKey;

    try {
      const payload: unknown = JSON.parse(message.content.toString('utf8'));

      if (routingKey === BET_SETTLED) {
        const event = await this.toDto(BetSettledDto, payload);
        await this.scoring.applySettlement(event);
        this.logger.log(`${BET_SETTLED} ${event.betId} ${event.winAmount} ${event.currency}`);
      } else if (routingKey === BET_ROLLBACK) {
        const event = await this.toDto(BetRollbackDto, payload);
        await this.scoring.applyRollback(event);
        this.logger.log(`${BET_ROLLBACK} ${event.betId}`);
      } else {
        throw new Error(`Unsupported routing key ${routingKey}`);
      }

      this.rabbit.ack(message);
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      this.logger.error(`Rejected to DLQ: ${reason}`);
      this.rabbit.reject(message);
    }
  }

  private async toDto<T extends object>(cls: new () => T, payload: unknown): Promise<T> {
    if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
      throw new Error('Payload must be a JSON object');
    }

    const dto = plainToInstance(cls, payload);
    const errors = await validate(dto, { whitelist: true });

    if (errors.length > 0) {
      const details = errors
        .map((e) => `${e.property}: ${Object.values(e.constraints ?? {}).join(', ')}`)
        .join('; ');
      throw new Error(`Validation failed - ${details}`);
    }

    return dto;
  }
}
