import { Injectable } from '@nestjs/common';

import { PrismaService } from './prisma.service.js';

@Injectable()
export class DatabaseReadinessService {
  constructor(private readonly prisma: PrismaService) {}

  async isReady(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
