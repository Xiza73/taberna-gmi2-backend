import { Global, MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { UNIT_OF_WORK } from './domain/interfaces/unit-of-work.interface.js';
import { TypeOrmUnitOfWork } from './infrastructure/typeorm-unit-of-work.js';
import { LoggingMiddleware } from './presentation/middleware/logging.middleware.js';

@Global()
@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        node: config.get<string>('ELASTICSEARCH_NODE', 'http://localhost:9200'),
      }),
    }),
  ],
  providers: [
    // Infrastructure
    { provide: UNIT_OF_WORK, useClass: TypeOrmUnitOfWork },
  ],
  exports: [UNIT_OF_WORK, ElasticsearchModule],
})
export class SharedModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(LoggingMiddleware).forRoutes('*');
  }
}
