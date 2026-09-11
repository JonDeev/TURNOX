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
  CreateServiceDto,
  ServiceListQueryDto,
  ServiceResponseDto,
  UpdateServiceDto,
} from './dto/service.dto.js';

@Injectable()
export class ServiceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly authorization: AuthorizationService,
  ) {}

  async create(
    organizationId: string,
    dto: CreateServiceDto,
    context: AuthContext,
    correlationId?: string,
  ): Promise<ServiceResponseDto> {
    this.authorization.assertSite(context, organizationId, dto.siteId);
    await this.ensureSite(organizationId, dto.siteId);
    try {
      const service = await this.prisma.$transaction(async (tx) => {
        const created = await tx.service.create({
          data: { organizationId, siteId: dto.siteId, name: dto.name.trim() },
        });
        await this.audit.record(tx, {
          organizationId,
          siteId: created.siteId,
          resourceType: 'SERVICE',
          resourceId: created.id,
          action: 'CREATE',
          actorUserId: context.userId,
          correlationId,
          metadata: auditMetadata(),
        });
        return created;
      });
      return new ServiceResponseDto(service);
    } catch (error: unknown) {
      return mapPrismaWriteError(error);
    }
  }

  async list(
    organizationId: string,
    query: ServiceListQueryDto,
    context: AuthContext,
  ): Promise<Page<ServiceResponseDto>> {
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
    const [services, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({ orderBy: { name: 'asc' }, skip, take: pageSize, where }),
      this.prisma.service.count({ where }),
    ]);
    return pageOf(
      services.map((service) => new ServiceResponseDto(service)),
      page,
      pageSize,
      total,
    );
  }

  async get(organizationId: string, id: string, context: AuthContext): Promise<ServiceResponseDto> {
    const service = await this.prisma.service.findFirst({
      where: { id, organizationId, ...this.authorization.siteFilter(context) },
    });
    if (service === null) throw new ResourceNotFoundException('Service');
    return new ServiceResponseDto(service);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateServiceDto,
    context: AuthContext,
    correlationId?: string,
  ): Promise<ServiceResponseDto> {
    const current = await this.get(organizationId, id, context);
    if (dto.siteId !== undefined) {
      await this.ensureSite(organizationId, dto.siteId);
      this.authorization.assertSite(context, organizationId, dto.siteId);
    }
    try {
      const changedFields = [
        ...(dto.siteId === undefined ? [] : ['siteId']),
        ...(dto.name === undefined ? [] : ['name']),
        ...(dto.active === undefined ? [] : ['active']),
      ];
      const action =
        changedFields.length === 1 && dto.active !== undefined && dto.active !== current.active
          ? dto.active
            ? 'ENABLE'
            : 'DISABLE'
          : 'UPDATE';
      const service = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.service.update({
          data: {
            ...(dto.siteId === undefined ? {} : { siteId: dto.siteId }),
            ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
            ...(dto.active === undefined ? {} : { active: dto.active }),
          },
          where: { id },
        });
        await this.audit.record(tx, {
          organizationId,
          siteId: updated.siteId,
          resourceType: 'SERVICE',
          resourceId: updated.id,
          action,
          actorUserId: context.userId,
          correlationId,
          metadata: auditMetadata(changedFields),
        });
        return updated;
      });
      return new ServiceResponseDto(service);
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
}
