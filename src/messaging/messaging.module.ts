import { Module } from '@nestjs/common';

import { ScoringModule } from '../scoring/scoring.module';
import { BetEventsConsumer } from './bet-events.consumer';
import { RabbitMqService } from './rabbitmq.service';

@Module({
  imports: [ScoringModule],
  providers: [RabbitMqService, BetEventsConsumer],
})
export class MessagingModule {}
