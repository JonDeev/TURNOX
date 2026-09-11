import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';

import { DatabaseReadinessService } from '../database/database-readiness.service.js';

@Controller('health')
export class HealthController {
  constructor(private readonly database: DatabaseReadinessService) {}

  @Get('live')
  liveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  async readiness(): Promise<{ status: 'ok'; checks: { process: 'up'; database: 'up' } }> {
    try {
      if (!(await this.database.isReady())) throw new Error('database unavailable');
      return { status: 'ok', checks: { process: 'up', database: 'up' } };
    } catch {
      throw new ServiceUnavailableException({
        code: 'DATABASE_UNAVAILABLE',
        message: 'Database is not ready',
      });
    }
  }
}
