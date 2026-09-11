import { registerAs } from '@nestjs/config';

import { parseAppConfiguration } from './environment.js';
import type { AppConfiguration } from './configuration.types.js';

export const appConfiguration = registerAs<AppConfiguration>('app', () =>
  parseAppConfiguration(process.env),
);
