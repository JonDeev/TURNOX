import { Injectable, type LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import pino, { type Logger } from 'pino';

import type { ConfigurationRoot } from '../config/configuration.types.js';

export const REDACTED_LOG_PATHS = [
  'authorization',
  'cookie',
  'password',
  'token',
  'accessToken',
  'refreshToken',
  'secret',
  'req.headers.authorization',
  'req.headers.cookie',
] as const;

export interface RequestLogFields {
  readonly correlationId: string;
  readonly method: string;
  readonly path: string;
  readonly statusCode: number;
  readonly durationMs: number;
}

@Injectable()
export class StructuredLogger implements LoggerService {
  private readonly logger: Logger;

  constructor(configService: ConfigService<ConfigurationRoot>) {
    const configuration = configService.getOrThrow('app');
    const options: pino.LoggerOptions = {
      level: configuration.logLevel,
      base: {
        service: 'turnox-api',
        environment: configuration.nodeEnv,
      },
      redact: {
        paths: [...REDACTED_LOG_PATHS],
        censor: '[REDACTED]',
      },
      timestamp: pino.stdTimeFunctions.isoTime,
    };

    if (configuration.nodeEnv === 'development') {
      options.transport = {
        target: 'pino-pretty',
        options: {
          colorize: false,
          singleLine: true,
          translateTime: 'SYS:standard',
        },
      };
    }

    this.logger = pino(options);
  }

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('info', message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write('error', message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('warn', message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write('debug', message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write('trace', message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.write('fatal', message, optionalParams);
  }

  logRequest(fields: RequestLogFields): void {
    this.logger.info(fields, 'http_request');
  }

  logExpectedHttpError(fields: RequestLogFields & { readonly errorCode: string }): void {
    this.logger.warn(fields, 'http_error');
  }

  logUnexpectedHttpError(fields: RequestLogFields, error: unknown): void {
    this.logger.error({ ...fields, err: error }, 'http_error');
  }

  private write(
    level: 'debug' | 'error' | 'fatal' | 'info' | 'trace' | 'warn',
    message: unknown,
    params: unknown[],
  ): void {
    const context = [...params].reverse().find((param) => typeof param === 'string');
    const fields = context === undefined ? undefined : { context };

    if (typeof message === 'string') {
      this.logger[level](fields ?? {}, message);
      return;
    }

    this.logger[level]({ ...fields, message });
  }
}
