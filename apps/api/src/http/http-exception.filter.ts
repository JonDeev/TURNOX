import { ArgumentsHost, Catch, HttpException, HttpStatus } from '@nestjs/common';
import type { Request, Response } from 'express';

import { CORRELATION_ID_HEADER } from './correlation-id.middleware.js';
import { StructuredLogger, type RequestLogFields } from '../logging/structured-logger.js';

interface ErrorResponse {
  readonly statusCode: number;
  readonly code: string;
  readonly message: string | readonly string[];
  readonly correlationId: string;
  readonly timestamp: string;
}

interface ExceptionResponseBody {
  readonly code?: unknown;
  readonly message?: unknown;
}

function isRecord(value: unknown): value is ExceptionResponseBody {
  return typeof value === 'object' && value !== null;
}

function getHeaderValue(response: Response, request: Request): string {
  const responseHeader = response.getHeader(CORRELATION_ID_HEADER);

  if (typeof responseHeader === 'string') {
    return responseHeader;
  }

  return request.header(CORRELATION_ID_HEADER) ?? 'unknown';
}

function getRequestLogFields(
  request: Request,
  correlationId: string,
  statusCode: number,
): RequestLogFields {
  return {
    correlationId,
    method: request.method,
    path: request.path,
    statusCode,
    durationMs: 0,
  };
}

@Catch()
export class HttpExceptionFilter {
  constructor(private readonly logger: StructuredLogger) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();
    const request = http.getRequest<Request>();
    const response = http.getResponse<Response>();
    const correlationId = getHeaderValue(response, request);
    const isExpected = exception instanceof HttpException && exception.getStatus() < 500;
    const statusCode =
      exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const errorResponse = this.createErrorResponse(
      exception,
      statusCode,
      correlationId,
      isExpected,
    );
    const fields = getRequestLogFields(request, correlationId, statusCode);

    if (isExpected) {
      this.logger.logExpectedHttpError({ ...fields, errorCode: errorResponse.code });
    } else {
      this.logger.logUnexpectedHttpError(fields, exception);
    }

    response.status(statusCode).json(errorResponse);
  }

  private createErrorResponse(
    exception: unknown,
    statusCode: number,
    correlationId: string,
    isExpected: boolean,
  ): ErrorResponse {
    if (!isExpected || !(exception instanceof HttpException)) {
      return {
        statusCode,
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Internal server error',
        correlationId,
        timestamp: new Date().toISOString(),
      };
    }

    const exceptionResponse = exception.getResponse();
    const responseBody = isRecord(exceptionResponse) ? exceptionResponse : undefined;
    const code = this.readCode(responseBody?.code) ?? `HTTP_${statusCode}`;
    const message = this.readMessage(responseBody?.message) ?? exception.message;

    return {
      statusCode,
      code,
      message,
      correlationId,
      timestamp: new Date().toISOString(),
    };
  }

  private readCode(value: unknown): string | undefined {
    return typeof value === 'string' && /^[A-Z0-9_]+$/.test(value) ? value : undefined;
  }

  private readMessage(value: unknown): string | readonly string[] | undefined {
    if (typeof value === 'string') {
      return value;
    }

    if (Array.isArray(value) && value.every((item): item is string => typeof item === 'string')) {
      return value;
    }

    return undefined;
  }
}
