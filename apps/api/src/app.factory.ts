import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import helmet from 'helmet';
import type { NestExpressApplication } from '@nestjs/platform-express';

import { AppModule } from './app.module.js';
import type { ConfigurationRoot } from './config/configuration.types.js';
import {
  CORRELATION_ID_HEADER,
  requestLoggingMiddleware,
} from './http/correlation-id.middleware.js';
import { HttpExceptionFilter } from './http/http-exception.filter.js';
import { StructuredLogger } from './logging/structured-logger.js';

export async function createApplication(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bodyParser: false,
    bufferLogs: true,
  });

  configureApplication(app);
  return app;
}

export function configureApplication(app: NestExpressApplication): void {
  const configService = app.get(ConfigService<ConfigurationRoot>);
  const configuration = configService.getOrThrow('app');
  const logger = app.get(StructuredLogger);
  const httpServer = app.getHttpAdapter().getInstance();

  app.useLogger(logger);
  app.enableShutdownHooks(['SIGTERM', 'SIGINT']);

  httpServer.use(requestLoggingMiddleware(logger));
  httpServer.use(helmet());
  app.useBodyParser('json', { limit: configuration.bodyLimit });
  app.useBodyParser('urlencoded', {
    extended: false,
    limit: configuration.bodyLimit,
  });

  if (configuration.trustProxy) {
    httpServer.set('trust proxy', true);
  }

  httpServer.disable('x-powered-by');
  app.enableCors({
    allowedHeaders: ['Accept', 'Content-Type', CORRELATION_ID_HEADER],
    exposedHeaders: [CORRELATION_ID_HEADER],
    methods: ['DELETE', 'GET', 'HEAD', 'OPTIONS', 'PATCH', 'POST', 'PUT'],
    origin: [...configuration.corsOrigins],
  });
  app.useGlobalPipes(
    new ValidationPipe({
      exceptionFactory: () =>
        new BadRequestException({
          code: 'VALIDATION_ERROR',
          message: 'Request validation failed',
        }),
      forbidNonWhitelisted: true,
      transform: true,
      whitelist: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter(logger));
}
