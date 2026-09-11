import { Injectable } from '@nestjs/common';

import { pageOf, type Page } from '../common/pagination.dto.js';
import {
  InvalidRelationshipException,
  ResourceNotFoundException,
} from '../common/resource.exceptions.js';
import { mapPrismaWriteError } from '../database/prisma-error.mapper.js';
import { PrismaService } from '../database/prisma.service.js';
import { CreateSiteDto, SiteListQueryDto, SiteResponseDto, UpdateSiteDto } from './dto/site.dto.js';

@Injectable()
export class SiteService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateSiteDto): Promise<SiteResponseDto> {
    await this.ensureOrganization(organizationId);
    try {
      const site = await this.prisma.site.create({
        data: { organizationId, name: dto.name.trim() },
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
    const skip = (query.page - 1) * query.pageSize;
    const [sites, total] = await this.prisma.$transaction([
      this.prisma.site.findMany({ orderBy: { name: 'asc' }, skip, take: query.pageSize, where }),
      this.prisma.site.count({ where }),
    ]);
    return pageOf(
      sites.map((site) => new SiteResponseDto(site)),
      query.page,
      query.pageSize,
      total,
    );
  }

  async get(organizationId: string, id: string): Promise<SiteResponseDto> {
    const site = await this.prisma.site.findFirst({ where: { id, organizationId } });
    if (site === null) throw new ResourceNotFoundException('Site');
    return new SiteResponseDto(site);
  }

  async update(organizationId: string, id: string, dto: UpdateSiteDto): Promise<SiteResponseDto> {
    await this.get(organizationId, id);
    try {
      const site = await this.prisma.site.update({
        data: {
          ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
          ...(dto.active === undefined ? {} : { active: dto.active }),
        },
        where: { id },
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
