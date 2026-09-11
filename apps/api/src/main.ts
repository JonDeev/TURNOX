import 'reflect-metadata';

import { createApplication } from './app.factory.js';
import type { ConfigurationRoot } from './config/configuration.types.js';
import { ConfigService } from '@nestjs/config';

async function bootstrap(): Promise<void> {
  const app = await createApplication();
  const configuration = app.get(ConfigService<ConfigurationRoot>).getOrThrow('app');

  await app.listen(configuration.port, configuration.host);
}

void bootstrap().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown bootstrap error';
  process.stderr.write(
    `${JSON.stringify({ level: 'fatal', message: 'API bootstrap failed', error: message, service: 'turnox-api' })}\n`,
  );
  process.exitCode = 1;
});
