import 'reflect-metadata';

import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();

  const port = app.get(ConfigService).getOrThrow<number>('port');
  await app.listen(port);

  new Logger('Bootstrap').log(`Listening on http://localhost:${port}`);
}

void bootstrap();
