import { NestFactory } from '@nestjs/core';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { json } from 'express';

import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService);

  // Validate critical secrets at startup
  const jwtSecret = configService.getOrThrow('JWT_SECRET');
  if (jwtSecret.length < 32 || jwtSecret.includes('CHANGE-ME')) {
    throw new Error('JWT_SECRET must be at least 32 characters and not a placeholder');
  }
  configService.getOrThrow('DB_PASSWORD');
  configService.getOrThrow('MERCADOPAGO_ACCESS_TOKEN');
  configService.getOrThrow('MERCADOPAGO_WEBHOOK_SECRET');

  // Graceful shutdown
  app.enableShutdownHooks();

  // Security
  app.use(helmet());
  app.enableCors({
    origin: configService.get<string>('FRONTEND_URL', 'http://localhost:3000'),
    credentials: true,
  });

  // Body size limit
  app.use(json({ limit: '1mb' }));

  // API prefix
  app.setGlobalPrefix('api/v1');

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      exceptionFactory: (errors) => {
        const messages = errors.flatMap((e) => Object.values(e.constraints || {}));
        throw new BadRequestException(messages);
      },
    }),
  );

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}
bootstrap();
