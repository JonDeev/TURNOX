import { describe, expect, it } from 'vitest';

import { parseAppConfiguration, validateEnvironment } from './environment.js';

describe('API environment configuration', () => {
  it('parses valid values into typed configuration', () => {
    const configuration = parseAppConfiguration({
      BODY_LIMIT: '2mb',
      DATABASE_URL: 'postgresql://turnox:secret@localhost:5432/turnox',
      CORS_ORIGINS: 'https://console.example.test,https://kiosk.example.test',
      HOST: '0.0.0.0',
      LOG_LEVEL: 'debug',
      NODE_ENV: 'production',
      PORT: '8080',
      TRUST_PROXY: 'true',
    });

    expect(configuration).toEqual({
      bodyLimit: '2mb',
      databaseUrl: 'postgresql://turnox:secret@localhost:5432/turnox',
      corsOrigins: ['https://console.example.test', 'https://kiosk.example.test'],
      host: '0.0.0.0',
      logLevel: 'debug',
      nodeEnv: 'production',
      port: 8080,
      trustProxy: true,
    });
  });

  it('fails fast for invalid values and missing production CORS origins', () => {
    expect(() =>
      validateEnvironment({ PORT: 'not-a-port', DATABASE_URL: 'postgresql://localhost/db' }),
    ).toThrow(/PORT/);
    expect(() => validateEnvironment({})).toThrow(/DATABASE_URL/);
    expect(() =>
      validateEnvironment({ NODE_ENV: 'production', DATABASE_URL: 'postgresql://localhost/db' }),
    ).toThrow(/CORS_ORIGINS/);
    expect(() =>
      validateEnvironment({ CORS_ORIGINS: '*', DATABASE_URL: 'postgresql://localhost/db' }),
    ).toThrow(/CORS_ORIGINS/);
  });

  it('uses safe local defaults outside production', () => {
    expect(
      parseAppConfiguration({ DATABASE_URL: 'postgresql://localhost/db' }).corsOrigins,
    ).toEqual(['http://localhost:5173', 'http://localhost:5174']);
  });
});
