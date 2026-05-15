import { NestFactory } from '@nestjs/core';
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import helmet from 'helmet';
import { json } from 'express';

import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService);
  const bootstrapLogger = new Logger('Bootstrap');

  // Validate critical secrets at startup (skip in development)
  const nodeEnv = configService.get<string>('NODE_ENV', 'development');
  const isProduction = nodeEnv === 'production';
  if (isProduction) {
    const jwtSecret = configService.getOrThrow<string>('JWT_SECRET');
    if (jwtSecret.length < 32 || jwtSecret.includes('CHANGE-ME')) {
      throw new Error(
        'JWT_SECRET must be at least 32 characters and not a placeholder',
      );
    }
    configService.getOrThrow('MERCADOPAGO_ACCESS_TOKEN');
    configService.getOrThrow('MERCADOPAGO_WEBHOOK_SECRET');
  }
  configService.getOrThrow('DB_PASSWORD');

  // Extra env validation (warns in dev, throws in production)
  const fail = (msg: string): void => {
    if (isProduction) {
      throw new Error(msg);
    }
    bootstrapLogger.warn(msg);
  };

  const jwtExpirationRaw = configService.get<string>('JWT_EXPIRATION');
  if (jwtExpirationRaw !== undefined) {
    const jwtExpiration = Number(jwtExpirationRaw);
    if (
      !Number.isFinite(jwtExpiration) ||
      jwtExpiration < 60 ||
      jwtExpiration > 3600
    ) {
      fail(
        `JWT_EXPIRATION must be a number between 60 and 3600 seconds (got '${jwtExpirationRaw}')`,
      );
    }
  } else if (isProduction) {
    fail('JWT_EXPIRATION is not set');
  }

  const smtpVars = ['SMTP_HOST', 'SMTP_USER', 'SMTP_PASS', 'EMAIL_FROM'];
  for (const v of smtpVars) {
    const value = configService.get<string>(v);
    if (!value || value.trim() === '') {
      fail(`${v} must not be empty`);
    }
  }

  const googleClientId = configService.get<string>('GOOGLE_CLIENT_ID');
  if (googleClientId && !googleClientId.endsWith('.apps.googleusercontent.com')) {
    fail(
      'GOOGLE_CLIENT_ID must end with .apps.googleusercontent.com',
    );
  }

  const orderExpRaw = configService.get<string>('ORDER_EXPIRATION_HOURS');
  if (orderExpRaw !== undefined) {
    const orderExp = Number(orderExpRaw);
    if (!Number.isFinite(orderExp) || orderExp < 1 || orderExp > 72) {
      fail(
        `ORDER_EXPIRATION_HOURS must be a number between 1 and 72 (got '${orderExpRaw}')`,
      );
    }
  } else if (isProduction) {
    fail('ORDER_EXPIRATION_HOURS is not set');
  }

  // Graceful shutdown
  app.enableShutdownHooks();

  // Security
  app.use(helmet());
  app.enableCors({
    origin: [
      configService.get<string>('ECOMMERCE_URL', 'http://localhost:5173'),
      configService.get<string>('BACKOFFICE_URL', 'http://localhost:5174'),
      configService.get<string>('POS_URL', 'http://localhost:5175'),
    ],
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
        const messages = errors.flatMap((e) =>
          Object.values(e.constraints || {}),
        );
        throw new BadRequestException(messages);
      },
    }),
  );

  const port = configService.get<number>('PORT', 3000);
  await app.listen(port);
}
void bootstrap();
