import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get('live')
  liveness(): { status: 'ok' } {
    return { status: 'ok' };
  }

  @Get('ready')
  readiness(): { status: 'ok'; checks: { process: 'up' } } {
    return { status: 'ok', checks: { process: 'up' } };
  }
}
