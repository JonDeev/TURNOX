import {
  LOG_LEVEL_VALUES,
  NODE_ENV_VALUES,
  type AppConfiguration,
  type LogLevel,
  type NodeEnvironment,
} from './configuration.types.js';

const DEFAULT_CORS_ORIGINS = ['http://localhost:5173', 'http://localhost:5174'];
const DEFAULTS = {
  bodyLimit: '1mb',
  host: '127.0.0.1',
  logLevel: 'info',
  nodeEnv: 'development',
  port: 3000,
  trustProxy: false,
} as const;

function getOptionalString(input: Record<string, unknown>, key: string): string | undefined {
  const value = input[key];

  if (value === undefined) {
    return undefined;
  }

  if (typeof value !== 'string') {
    throw new Error(`Environment variable ${key} must be a string`);
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function parseNodeEnvironment(value: string | undefined): NodeEnvironment {
  const candidate = value ?? DEFAULTS.nodeEnv;

  if (!NODE_ENV_VALUES.includes(candidate as NodeEnvironment)) {
    throw new Error(`NODE_ENV must be one of: ${NODE_ENV_VALUES.join(', ')}`);
  }

  return candidate as NodeEnvironment;
}

function parsePort(value: string | undefined): number {
  const candidate = value ?? String(DEFAULTS.port);
  const port = Number(candidate);

  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be an integer between 1 and 65535');
  }

  return port;
}

function parseHost(value: string | undefined): string {
  const host = value ?? DEFAULTS.host;

  if (host.length > 253 || /\s/.test(host)) {
    throw new Error('HOST must be a non-empty hostname or IP address without whitespace');
  }

  return host;
}

function parseLogLevel(value: string | undefined): LogLevel {
  const candidate = value ?? DEFAULTS.logLevel;

  if (!LOG_LEVEL_VALUES.includes(candidate as LogLevel)) {
    throw new Error(`LOG_LEVEL must be one of: ${LOG_LEVEL_VALUES.join(', ')}`);
  }

  return candidate as LogLevel;
}

function parseBodyLimit(value: string | undefined): string {
  const bodyLimit = value ?? DEFAULTS.bodyLimit;

  if (!/^\d+(?:b|kb|mb)$/i.test(bodyLimit)) {
    throw new Error('BODY_LIMIT must use bytes, kilobytes, or megabytes (for example: 1mb)');
  }

  const amount = Number.parseInt(bodyLimit, 10);
  const unit = bodyLimit.slice(String(amount).length).toLowerCase();
  const bytes = amount * (unit === 'mb' ? 1_000_000 : unit === 'kb' ? 1_000 : 1);

  if (bytes < 1 || bytes > 10_000_000) {
    throw new Error('BODY_LIMIT must be between 1 byte and 10mb');
  }

  return bodyLimit;
}

function parseBoolean(value: string | undefined, key: string, defaultValue: boolean): boolean {
  const candidate = value ?? String(defaultValue);

  if (candidate !== 'true' && candidate !== 'false') {
    throw new Error(`${key} must be either true or false`);
  }

  return candidate === 'true';
}

function parseCorsOrigins(value: string | undefined, nodeEnv: NodeEnvironment): readonly string[] {
  if (value === undefined) {
    if (nodeEnv === 'production') {
      throw new Error('CORS_ORIGINS is required when NODE_ENV is production');
    }

    return DEFAULT_CORS_ORIGINS;
  }

  const origins = value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (origins.length === 0) {
    throw new Error('CORS_ORIGINS must contain at least one origin');
  }

  return origins.map((origin) => {
    let parsed: URL;

    try {
      parsed = new URL(origin);
    } catch {
      throw new Error('CORS_ORIGINS contains an invalid URL');
    }

    if (
      !['http:', 'https:'].includes(parsed.protocol) ||
      parsed.username !== '' ||
      parsed.password !== '' ||
      parsed.pathname !== '/' ||
      parsed.search !== '' ||
      parsed.hash !== '' ||
      origin.includes('*')
    ) {
      throw new Error('CORS_ORIGINS must contain explicit HTTP(S) origins without wildcards');
    }

    return parsed.origin;
  });
}

export function parseAppConfiguration(input: Record<string, unknown>): AppConfiguration {
  const nodeEnv = parseNodeEnvironment(getOptionalString(input, 'NODE_ENV'));

  return {
    nodeEnv,
    port: parsePort(getOptionalString(input, 'PORT')),
    host: parseHost(getOptionalString(input, 'HOST')),
    logLevel: parseLogLevel(getOptionalString(input, 'LOG_LEVEL')),
    corsOrigins: parseCorsOrigins(getOptionalString(input, 'CORS_ORIGINS'), nodeEnv),
    bodyLimit: parseBodyLimit(getOptionalString(input, 'BODY_LIMIT')),
    trustProxy: parseBoolean(
      getOptionalString(input, 'TRUST_PROXY'),
      'TRUST_PROXY',
      DEFAULTS.trustProxy,
    ),
  };
}

export function validateEnvironment(input: Record<string, unknown>): Record<string, unknown> {
  const configuration = parseAppConfiguration(input);

  return {
    ...input,
    NODE_ENV: configuration.nodeEnv,
    PORT: String(configuration.port),
    HOST: configuration.host,
    LOG_LEVEL: configuration.logLevel,
    CORS_ORIGINS: configuration.corsOrigins.join(','),
    BODY_LIMIT: configuration.bodyLimit,
    TRUST_PROXY: String(configuration.trustProxy),
  };
}
