import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import { mapPrismaWriteError } from '../database/prisma-error.mapper.js';
import { ResourceNotFoundException } from '../common/resource.exceptions.js';
import { pageOf, paginationOf, type Page } from '../common/pagination.dto.js';
import { AdminAuditService, auditMetadata } from '../audit/audit.service.js';
import { AuthorizationService } from '../auth/authorization.service.js';
import type { AuthContext } from '../auth/auth.types.js';
import {
  CreateOrganizationDto,
  OrganizationListQueryDto,
  OrganizationResponseDto,
  UpdateOrganizationDto,
} from './dto/organization.dto.js';

@Injectable()
export class OrganizationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly authorization: AuthorizationService,
  ) {}

  async create(
    dto: CreateOrganizationDto,
    context: AuthContext,
    correlationId?: string,
  ): Promise<OrganizationResponseDto> {
    try {
      const organization = await this.prisma.$transaction(async (tx) => {
        const created = await tx.organization.create({
          data: { name: dto.name.trim() },
        });
        await this.audit.record(tx, {
          organizationId: created.id,
          resourceType: 'ORGANIZATION',
          resourceId: created.id,
          action: 'CREATE',
          actorUserId: context.userId,
          correlationId,
          metadata: auditMetadata(),
        });
        return created;
      });
      return new OrganizationResponseDto(organization);
    } catch (error: unknown) {
      return mapPrismaWriteError(error);
    }
  }

  async list(query: OrganizationListQueryDto): Promise<Page<OrganizationResponseDto>> {
    const where = query.active === undefined ? {} : { active: query.active };
    const { page, pageSize } = paginationOf(query);
    const skip = (page - 1) * pageSize;
    const [organizations, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        orderBy: { name: 'asc' },
        skip,
        take: pageSize,
        where,
      }),
      this.prisma.organization.count({ where }),
    ]);

    return pageOf(
      organizations.map((organization) => new OrganizationResponseDto(organization)),
      page,
      pageSize,
      total,
    );
  }

  async get(id: string, context: AuthContext): Promise<OrganizationResponseDto> {
    this.authorization.assertOrganization(context, id);
    const organization = await this.prisma.organization.findUnique({ where: { id } });
    if (organization === null) {
      throw new ResourceNotFoundException('Organization');
    }
    return new OrganizationResponseDto(organization);
  }

  async update(
    id: string,
    dto: UpdateOrganizationDto,
    context: AuthContext,
    correlationId?: string,
  ): Promise<OrganizationResponseDto> {
    this.authorization.assertOrganization(context, id);
    const current = await this.prisma.organization.findUnique({ where: { id } });
    if (current === null) {
      throw new ResourceNotFoundException('Organization');
    }

    try {
      const changedFields = [
        ...(dto.name === undefined ? [] : ['name']),
        ...(dto.active === undefined ? [] : ['active']),
      ];
      const action =
        changedFields.length === 1 && dto.active !== undefined && dto.active !== current.active
          ? dto.active
            ? 'ENABLE'
            : 'DISABLE'
          : 'UPDATE';
      const organization = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.organization.update({
          data: {
            ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
            ...(dto.active === undefined ? {} : { active: dto.active }),
          },
          where: { id },
        });
        await this.audit.record(tx, {
          organizationId: updated.id,
          resourceType: 'ORGANIZATION',
          resourceId: updated.id,
          action,
          actorUserId: context.userId,
          correlationId,
          metadata: auditMetadata(changedFields),
        });
        return updated;
      });
      return new OrganizationResponseDto(organization);
    } catch (error: unknown) {
      return mapPrismaWriteError(error);
    }
  }
}
