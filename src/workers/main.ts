import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { Logger } from 'nestjs-pino';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });

  const logger = app.get(Logger);
  logger.log('BullMQ workers started');

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    logger.log('SIGTERM received, shutting down workers...');
    await app.close();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    logger.log('SIGINT received, shutting down workers...');
    await app.close();
    process.exit(0);
  });
}

bootstrap();

