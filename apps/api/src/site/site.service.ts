import { Injectable } from '@nestjs/common';

import { pageOf, paginationOf, type Page } from '../common/pagination.dto.js';
import {
  InvalidRelationshipException,
  ResourceNotFoundException,
} from '../common/resource.exceptions.js';
import { mapPrismaWriteError } from '../database/prisma-error.mapper.js';
import { PrismaService } from '../database/prisma.service.js';
import { AdminAuditService, auditMetadata } from '../audit/audit.service.js';
import { CreateSiteDto, SiteListQueryDto, SiteResponseDto, UpdateSiteDto } from './dto/site.dto.js';

@Injectable()
export class SiteService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async create(
    organizationId: string,
    dto: CreateSiteDto,
    correlationId?: string,
  ): Promise<SiteResponseDto> {
    await this.ensureOrganization(organizationId);
    try {
      const site = await this.prisma.$transaction(async (tx) => {
        const created = await tx.site.create({
          data: { organizationId, name: dto.name.trim() },
        });
        await this.audit.record(tx, {
          organizationId,
          siteId: created.id,
          resourceType: 'SITE',
          resourceId: created.id,
          action: 'CREATE',
          correlationId,
          metadata: auditMetadata(),
        });
        return created;
      });
      return new SiteResponseDto(site);
    } catch (error: unknown) {
      return mapPrismaWriteError(error);
    }
  }

  async list(organizationId: string, query: SiteListQueryDto): Promise<Page<SiteResponseDto>> {
    await this.ensureOrganization(organizationId);
    const where = {
      organizationId,
      ...(query.active === undefined ? {} : { active: query.active }),
    };
    const { page, pageSize } = paginationOf(query);
    const skip = (page - 1) * pageSize;
    const [sites, total] = await this.prisma.$transaction([
      this.prisma.site.findMany({ orderBy: { name: 'asc' }, skip, take: pageSize, where }),
      this.prisma.site.count({ where }),
    ]);
    return pageOf(
      sites.map((site) => new SiteResponseDto(site)),
      page,
      pageSize,
      total,
    );
  }

  async get(organizationId: string, id: string): Promise<SiteResponseDto> {
    const site = await this.prisma.site.findFirst({ where: { id, organizationId } });
    if (site === null) throw new ResourceNotFoundException('Site');
    return new SiteResponseDto(site);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateSiteDto,
    correlationId?: string,
  ): Promise<SiteResponseDto> {
    const current = await this.get(organizationId, id);
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
      const site = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.site.update({
          data: {
            ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
            ...(dto.active === undefined ? {} : { active: dto.active }),
          },
          where: { id },
        });
        await this.audit.record(tx, {
          organizationId,
          siteId: updated.id,
          resourceType: 'SITE',
          resourceId: updated.id,
          action,
          correlationId,
          metadata: auditMetadata(changedFields),
        });
        return updated;
      });
      return new SiteResponseDto(site);
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
}
