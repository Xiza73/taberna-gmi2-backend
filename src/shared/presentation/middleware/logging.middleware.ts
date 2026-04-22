import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';
import { type Request, type Response, type NextFunction } from 'express';

import { type AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  private readonly logger = new Logger(LoggingMiddleware.name);

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  use(req: Request, res: Response, next: NextFunction): void {
    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      const user = (req as Request & { user?: AuthenticatedUser }).user;

      const logEntry = {
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
