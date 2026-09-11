import { Controller, Get } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { afterEach, describe, expect, it } from 'vitest';

import { AppModule } from './app.module.js';
import { configureApplication } from './app.factory.js';
import { DatabaseReadinessService } from './database/database-readiness.service.js';
import { REDACTED_LOG_PATHS } from './logging/structured-logger.js';

@Controller('__test')
class UnexpectedErrorController {
  @Get('unexpected')
  throwUnexpectedError(): never {
    throw new Error('sensitive stack marker');
  }
}

describe('API bootstrap', () => {
  let app: NestExpressApplication | undefined;

  afterEach(async () => {
    await app?.close();
    app = undefined;
  });

  async function createTestApplication(databaseAvailable = true): Promise<NestExpressApplication> {
    process.env.DATABASE_URL ??= 'postgresql://turnox:turnox_test@localhost:5432/turnox';
    const database = { isReady: async () => databaseAvailable };
    const module = await Test.createTestingModule({
      controllers: [UnexpectedErrorController],
      imports: [AppModule],
    })
      .overrideProvider(DatabaseReadinessService)
      .useValue(database)
      .compile();

    app = module.createNestApplication<NestExpressApplication>();
    configureApplication(app);
    await app.init();
    return app;
  }

  function httpRequest(testApp: NestExpressApplication) {
    return request(testApp.getHttpAdapter().getInstance());
  }

  it('keeps liveness independent and reports database readiness', async () => {
    const testApp = await createTestApplication();

    await httpRequest(testApp).get('/health/live').expect(200, { status: 'ok' });
    await httpRequest(testApp)
      .get('/health/ready')
      .expect(200, { status: 'ok', checks: { process: 'up', database: 'up' } });
  });

  it('reports not ready when the database check fails while liveness stays up', async () => {
    const testApp = await createTestApplication(false);

    await httpRequest(testApp).get('/health/live').expect(200, { status: 'ok' });
    const response = await httpRequest(testApp).get('/health/ready').expect(503);
    expect(response.body).toMatchObject({
      code: 'DATABASE_UNAVAILABLE',
      message: 'Database is not ready',
      statusCode: 503,
    });
  });

  it('generates and propagates a bounded correlation id', async () => {
    const testApp = await createTestApplication();
    const generated = await httpRequest(testApp).get('/health/live').expect(200);
    const generatedId = generated.headers['x-correlation-id'];

    expect(generatedId).toMatch(/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/);

    const propagated = await httpRequest(testApp)
      .get('/health/live')
      .set('X-Correlation-Id', 'client-request-42')
      .expect(200);

    expect(propagated.headers['x-correlation-id']).toBe('client-request-42');
  });

  it('returns a consistent error contract without leaking unexpected details', async () => {
    const testApp = await createTestApplication();
    const notFound = await httpRequest(testApp)
      .get('/not-a-real-route')
      .set('X-Correlation-Id', 'error-test-1')
      .expect(404);

    expect(notFound.body).toMatchObject({
      code: 'HTTP_404',
      correlationId: 'error-test-1',
      message: 'Cannot GET /not-a-real-route',
      statusCode: 404,
    });

    const unexpected = await httpRequest(testApp).get('/__test/unexpected').expect(500);

    expect(unexpected.body).toMatchObject({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'Internal server error',
      statusCode: 500,
    });
    expect(JSON.stringify(unexpected.body)).not.toContain('sensitive stack marker');
    expect(JSON.stringify(unexpected.body)).not.toContain('stack');
    expect(unexpected.headers['x-correlation-id']).toBeDefined();
  });

  it('applies essential security headers and keeps sensitive log fields redacted', async () => {
    const testApp = await createTestApplication();
    const response = await httpRequest(testApp)
      .get('/health/live')
      .set('Origin', 'http://localhost:5173')
      .expect(200);

    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(REDACTED_LOG_PATHS).toEqual(
      expect.arrayContaining(['authorization', 'cookie', 'password', 'token', 'secret']),
    );
  });
});
