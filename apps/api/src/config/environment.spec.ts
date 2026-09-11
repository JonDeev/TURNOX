import { describe, expect, it } from 'vitest';

import { parseAppConfiguration, validateEnvironment } from './environment.js';

describe('API environment configuration', () => {
  it('parses valid values into typed configuration', () => {
    const configuration = parseAppConfiguration({
      BODY_LIMIT: '2mb',
      CORS_ORIGINS: 'https://console.example.test,https://kiosk.example.test',
      HOST: '0.0.0.0',
      LOG_LEVEL: 'debug',
      NODE_ENV: 'production',
      PORT: '8080',
      TRUST_PROXY: 'true',
    });

    expect(configuration).toEqual({
      bodyLimit: '2mb',
      corsOrigins: ['https://console.example.test', 'https://kiosk.example.test'],
      host: '0.0.0.0',
      logLevel: 'debug',
      nodeEnv: 'production',
      port: 8080,
      trustProxy: true,
    });
  });

  it('fails fast for invalid values and missing production CORS origins', () => {
    expect(() => validateEnvironment({ PORT: 'not-a-port' })).toThrow(/PORT/);
    expect(() => validateEnvironment({ NODE_ENV: 'production' })).toThrow(/CORS_ORIGINS/);
    expect(() => validateEnvironment({ CORS_ORIGINS: '*' })).toThrow(/CORS_ORIGINS/);
  });

  it('uses safe local defaults outside production', () => {
    expect(parseAppConfiguration({}).corsOrigins).toEqual([
      'http://localhost:5173',
      'http://localhost:5174',
    ]);
  });
});
