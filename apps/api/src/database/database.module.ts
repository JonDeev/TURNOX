import { Global, Module } from '@nestjs/common';

import { PrismaService } from './prisma.service.js';
import { DatabaseReadinessService } from './database-readiness.service.js';

@Global()
@Module({
  providers: [PrismaService, DatabaseReadinessService],
  exports: [PrismaService, DatabaseReadinessService],
})
export class DatabaseModule {}
