export const NODE_ENV_VALUES = ['development', 'test', 'production'] as const;
export type NodeEnvironment = (typeof NODE_ENV_VALUES)[number];

export const LOG_LEVEL_VALUES = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'] as const;
export type LogLevel = (typeof LOG_LEVEL_VALUES)[number];

export interface AppConfiguration {
  readonly databaseUrl: string;
  readonly nodeEnv: NodeEnvironment;
  readonly port: number;
  readonly host: string;
  readonly logLevel: LogLevel;
  readonly corsOrigins: readonly string[];
  readonly bodyLimit: string;
  readonly trustProxy: boolean;
}

export interface ConfigurationRoot {
  readonly app: AppConfiguration;
}
