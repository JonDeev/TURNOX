import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { appConfiguration } from './config/app.configuration.js';
import { validateEnvironment } from './config/environment.js';
import { HealthModule } from './health/health.module.js';
import { StructuredLogger } from './logging/structured-logger.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      cache: true,
      envFilePath: ['.env.local', '.env'],
      isGlobal: true,
      load: [appConfiguration],
      validate: validateEnvironment,
    }),
    HealthModule,
  ],
  providers: [StructuredLogger],
  exports: [StructuredLogger],
})
export class AppModule {}
