import { Injectable, Logger, NestMiddleware, OnModuleInit } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { ConfigService } from '@nestjs/config';
import { type Request, type Response, type NextFunction } from 'express';
import * as geoip from 'geoip-lite';

import { type AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class LoggingMiddleware implements NestMiddleware, OnModuleInit {
  private readonly logger = new Logger(LoggingMiddleware.name);

  constructor(
    private readonly elasticsearchService: ElasticsearchService,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      await this.elasticsearchService.indices.putIndexTemplate({
        name: 'ecommerce-logs-template',
        index_patterns: ['ecommerce-logs-*'],
        template: {
          mappings: {
            properties: {
              timestamp: { type: 'date' },
              method: { type: 'keyword' },
              path: { type: 'text', fields: { keyword: { type: 'keyword' } } },
              statusCode: { type: 'integer' },
              duration: { type: 'integer' },
              userId: { type: 'keyword' },
              ip: { type: 'ip' },
              userAgent: { type: 'text' },
              error: { type: 'text' },
              location: { type: 'geo_point' },
              city: { type: 'keyword' },
              region: { type: 'keyword' },
              country: { type: 'keyword' },
            },
          },
        },
      });
      this.logger.log('Elasticsearch index template created');
    } catch (err: unknown) {
      this.logger.warn(
        `Failed to create index template: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const user = (req as Request & { user?: AuthenticatedUser }).user;

      const logEntry: Record<string, unknown> = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        duration,
        userId: user?.id ?? null,
        ip: req.ip,
        userAgent: req.get('user-agent') ?? null,
        error: null,
      };

      const clientIp = req.ip?.replace('::ffff:', '') ?? null;
      if (clientIp) {
        const geo = geoip.lookup(clientIp);
        if (geo?.ll) {
          logEntry.location = { lat: geo.ll[0], lon: geo.ll[1] };
          logEntry.city = geo.city || null;
          logEntry.region = geo.region || null;
          logEntry.country = geo.country || null;
        }
      }

      const now = new Date();
      const index = `ecommerce-logs-${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

      this.elasticsearchService
        .index({ index, document: logEntry })
        .catch((err: unknown) => {
          this.logger.warn(
            `Failed to index log entry: ${err instanceof Error ? err.message : String(err)}`,
          );
        });
    });

    next();
  }
}
