import { Injectable } from '@nestjs/common';

import { pageOf, paginationOf, type Page } from '../common/pagination.dto.js';
import {
  InvalidRelationshipException,
  ResourceNotFoundException,
} from '../common/resource.exceptions.js';
import { mapPrismaWriteError } from '../database/prisma-error.mapper.js';
import { PrismaService } from '../database/prisma.service.js';
import { AdminAuditService, auditMetadata } from '../audit/audit.service.js';
import { AuthorizationService } from '../auth/authorization.service.js';
import type { AuthContext } from '../auth/auth.types.js';
import {
  CounterListQueryDto,
  CounterResponseDto,
  CreateCounterDto,
  UpdateCounterDto,
} from './dto/counter.dto.js';

@Injectable()
export class CounterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly authorization: AuthorizationService,
  ) {}

  async create(
    organizationId: string,
    dto: CreateCounterDto,
    context: AuthContext,
    correlationId?: string,
  ): Promise<CounterResponseDto> {
    this.authorization.assertSite(context, organizationId, dto.siteId);
    await this.ensureSite(organizationId, dto.siteId);
    if (dto.roomId !== undefined) await this.ensureRoom(organizationId, dto.siteId, dto.roomId);
    try {
      const counter = await this.prisma.$transaction(async (tx) => {
        const created = await tx.counter.create({
          data: { organizationId, siteId: dto.siteId, roomId: dto.roomId, name: dto.name.trim() },
        });
        await this.audit.record(tx, {
          organizationId,
          siteId: created.siteId,
          resourceType: 'COUNTER',
          resourceId: created.id,
          action: 'CREATE',
          actorUserId: context.userId,
          correlationId,
          metadata: auditMetadata(),
        });
        return created;
      });
      return new CounterResponseDto(counter);
    } catch (error: unknown) {
      return mapPrismaWriteError(error);
    }
  }

  async list(
    organizationId: string,
    query: CounterListQueryDto,
    context: AuthContext,
  ): Promise<Page<CounterResponseDto>> {
    this.authorization.assertOrganization(context, organizationId);
    await this.ensureOrganization(organizationId);
    const where = {
      organizationId,
      ...(query.siteId === undefined ? {} : { siteId: query.siteId }),
      ...this.authorization.siteFilter(context),
      ...(query.active === undefined ? {} : { active: query.active }),
    };
    const { page, pageSize } = paginationOf(query);
    const skip = (page - 1) * pageSize;
    const [counters, total] = await this.prisma.$transaction([
      this.prisma.counter.findMany({ orderBy: { name: 'asc' }, skip, take: pageSize, where }),
      this.prisma.counter.count({ where }),
    ]);
    return pageOf(
      counters.map((counter) => new CounterResponseDto(counter)),
      page,
      pageSize,
      total,
    );
  }

  async get(organizationId: string, id: string, context: AuthContext): Promise<CounterResponseDto> {
    const counter = await this.prisma.counter.findFirst({
      where: { id, organizationId, ...this.authorization.siteFilter(context) },
    });
    if (counter === null) throw new ResourceNotFoundException('Counter');
    return new CounterResponseDto(counter);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateCounterDto,
    context: AuthContext,
    correlationId?: string,
  ): Promise<CounterResponseDto> {
    const current = await this.get(organizationId, id, context);
    if (dto.roomId !== undefined) await this.ensureRoom(organizationId, current.siteId, dto.roomId);
    try {
      const changedFields = [
        ...(dto.roomId === undefined ? [] : ['roomId']),
        ...(dto.name === undefined ? [] : ['name']),
        ...(dto.active === undefined ? [] : ['active']),
      ];
      const action =
        changedFields.length === 1 && dto.active !== undefined && dto.active !== current.active
          ? dto.active
            ? 'ENABLE'
            : 'DISABLE'
          : 'UPDATE';
      const counter = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.counter.update({
          data: {
            ...(dto.roomId === undefined ? {} : { roomId: dto.roomId }),
            ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
            ...(dto.active === undefined ? {} : { active: dto.active }),
          },
          where: { id },
        });
        await this.audit.record(tx, {
          organizationId,
          siteId: updated.siteId,
          resourceType: 'COUNTER',
          resourceId: updated.id,
          action,
          actorUserId: context.userId,
          correlationId,
          metadata: auditMetadata(changedFields),
        });
        return updated;
      });
      return new CounterResponseDto(counter);
    } catch (error: unknown) {
      return mapPrismaWriteError(error);
    }
  }

  private async ensureOrganization(id: string): Promise<void> {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      select: { id: true },
    });
    if (organization === null)
      throw new InvalidRelationshipException('Organization does not exist');
  }

  private async ensureSite(organizationId: string, siteId: string): Promise<void> {
    const site = await this.prisma.site.findFirst({
      where: { id: siteId, organizationId },
      select: { id: true },
    });
    if (site === null)
      throw new InvalidRelationshipException('Site does not belong to the organization');
  }

  private async ensureRoom(organizationId: string, siteId: string, roomId: string): Promise<void> {
    const room = await this.prisma.room.findFirst({
      where: { id: roomId, siteId, organizationId },
      select: { id: true },
    });
    if (room === null)
      throw new InvalidRelationshipException('Room does not belong to the organization site');
  }
}
