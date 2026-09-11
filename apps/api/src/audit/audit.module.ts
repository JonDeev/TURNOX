import { Global, Module } from '@nestjs/common';

import { AdminAuditService } from './audit.service.js';

@Global()
@Module({
  providers: [AdminAuditService],
  exports: [AdminAuditService],
})
export class AuditModule {}
