import { Injectable } from '@nestjs/common';

import { Prisma, type PrismaClient } from '../generated/prisma/client.js';

export type AdminAuditResourceType =
  | 'ORGANIZATION'
  | 'SITE'
  | 'SERVICE'
  | 'ROOM'
  | 'COUNTER'
  | 'USER'
  | 'SERVICE_ASSIGNMENT'
  | 'DEVICE';

export type AdminAuditAction = 'CREATE' | 'UPDATE' | 'ENABLE' | 'DISABLE' | 'ASSIGN' | 'UNASSIGN';

export interface AdminAuditEntry {
  readonly organizationId: string;
  readonly siteId?: string | null;
  readonly resourceType: AdminAuditResourceType;
  readonly resourceId: string;
  readonly action: AdminAuditAction;
  readonly correlationId?: string;
  readonly metadata?: Prisma.InputJsonObject;
}

export function auditMetadata(changedFields: readonly string[] = []): Prisma.InputJsonObject {
  return { changedFields: [...changedFields] };
}

type TransactionClient = Prisma.TransactionClient;

@Injectable()
export class AdminAuditService {
  async record(prisma: TransactionClient | PrismaClient, entry: AdminAuditEntry): Promise<void> {
    await prisma.adminAuditLog.create({
      data: {
        organizationId: entry.organizationId,
        siteId: entry.siteId ?? null,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        action: entry.action,
        actorUserId: null,
        actorType: 'UNAUTHENTICATED',
        correlationId: entry.correlationId ?? null,
        metadata: entry.metadata ?? {},
      },
    });
  }
}
