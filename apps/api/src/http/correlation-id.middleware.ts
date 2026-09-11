import type { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'node:crypto';
import { performance } from 'node:perf_hooks';

import { StructuredLogger } from '../logging/structured-logger.js';

export const CORRELATION_ID_HEADER = 'X-Correlation-Id';
const CORRELATION_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/;

function getCorrelationId(request: Request): string {
  const candidate = request.header(CORRELATION_ID_HEADER);
  return candidate !== undefined && CORRELATION_ID_PATTERN.test(candidate)
    ? candidate
    : randomUUID();
}

export function requestLoggingMiddleware(logger: StructuredLogger) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const correlationId = getCorrelationId(request);
    const startedAt = performance.now();
    let completed = false;

    response.setHeader(CORRELATION_ID_HEADER, correlationId);

    const logRequest = (statusCode: number): void => {
      if (completed) {
        return;
      }

      completed = true;
      logger.logRequest({
        correlationId,
        method: request.method,
        path: request.path,
        statusCode,
        durationMs: Math.max(0, Math.round(performance.now() - startedAt)),
      });
    };

    response.once('finish', () => logRequest(response.statusCode));
    response.once('close', () =>
      logRequest(response.statusCode === 200 ? 499 : response.statusCode),
    );

    next();
  };
}
