import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { appConfiguration } from './config/app.configuration.js';
import { validateEnvironment } from './config/environment.js';
import { HealthModule } from './health/health.module.js';
import { StructuredLogger } from './logging/structured-logger.js';
import { DatabaseModule } from './database/database.module.js';
import { OrganizationModule } from './organization/organization.module.js';
import { SiteModule } from './site/site.module.js';
import { ServiceModule } from './service/service.module.js';
import { RoomModule } from './room/room.module.js';
import { CounterModule } from './counter/counter.module.js';
import { UserModule } from './user/user.module.js';
import { ServiceAssignmentModule } from './service-assignment/service-assignment.module.js';
import { DeviceModule } from './device/device.module.js';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';

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
    DatabaseModule,
    AuditModule,
    AuthModule,
    OrganizationModule,
    SiteModule,
    ServiceModule,
    RoomModule,
    CounterModule,
    UserModule,
    ServiceAssignmentModule,
    DeviceModule,
  ],
  providers: [StructuredLogger],
  exports: [StructuredLogger],
})
export class AppModule {}
