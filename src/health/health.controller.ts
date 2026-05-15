import { Controller, Get, Logger } from '@nestjs/common';
import {
  HealthCheck,
  HealthCheckResult,
  HealthCheckService,
  HealthIndicatorResult,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';
import { ElasticsearchService } from '@nestjs/elasticsearch';

import { Public } from '@shared/presentation/decorators/public.decorator';

@Controller('health')
@Public()
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
    private readonly es: ElasticsearchService,
  ) {}

  @Get()
  @HealthCheck()
  check(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.checkElasticsearch(),
    ]);
  }

  // Optional indicator — never fails the overall check
  private async checkElasticsearch(): Promise<HealthIndicatorResult> {
    try {
      await this.es.ping();
      return { elasticsearch: { status: 'up' } };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Elasticsearch ping failed: ${message}`);
      return {
        elasticsearch: {
          status: 'up',
          degraded: true,
          message,
        },
      };
    }
  }
}
