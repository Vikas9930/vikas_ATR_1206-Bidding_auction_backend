import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult, HealthCheckError } from '@nestjs/terminus';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(
    @InjectQueue('auction-settlement') private settlementQueue: Queue,
  ) {
    super();
  }

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    try {
      // Check Redis connection via BullMQ queue
      const client = (this.settlementQueue as any).client;
      if (client && client.ping) {
        await client.ping();
      } else {
        // Fallback: try to get queue info
        await this.settlementQueue.getWaitingCount();
      }
      return this.getStatus(key, true);
    } catch (error) {
      throw new HealthCheckError('Redis check failed', this.getStatus(key, false));
    }
  }
}

