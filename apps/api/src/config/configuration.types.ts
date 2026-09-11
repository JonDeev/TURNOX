export const NODE_ENV_VALUES = ['development', 'test', 'production'] as const;
export type NodeEnvironment = (typeof NODE_ENV_VALUES)[number];

export const LOG_LEVEL_VALUES = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;
export type LogLevel = (typeof LOG_LEVEL_VALUES)[number];

export const COOKIE_SAME_SITE_VALUES = ['strict', 'lax', 'none'] as const;
export type CookieSameSite = (typeof COOKIE_SAME_SITE_VALUES)[number];

export interface AppConfiguration {
  readonly databaseUrl: string;
  readonly nodeEnv: NodeEnvironment;
  readonly port: number;
  readonly host: string;
  readonly logLevel: LogLevel;
  readonly corsOrigins: readonly string[];
  readonly bodyLimit: string;
  readonly trustProxy: boolean;
  readonly authCookieName: string;
  readonly csrfCookieName: string;
  readonly authCookiePath: string;
  readonly authCookieSecure: boolean;
  readonly authCookieSameSite: CookieSameSite;
  readonly sessionTtlSeconds: number;
}

export interface ConfigurationRoot {
  readonly app: AppConfiguration;
}
