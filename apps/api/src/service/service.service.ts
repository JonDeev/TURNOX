import { Injectable } from '@nestjs/common';

import { pageOf, type Page } from '../common/pagination.dto.js';
import {
  InvalidRelationshipException,
  ResourceNotFoundException,
} from '../common/resource.exceptions.js';
import { mapPrismaWriteError } from '../database/prisma-error.mapper.js';
import { PrismaService } from '../database/prisma.service.js';
import {
  CreateServiceDto,
  ServiceListQueryDto,
  ServiceResponseDto,
  UpdateServiceDto,
} from './dto/service.dto.js';

@Injectable()
export class ServiceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateServiceDto): Promise<ServiceResponseDto> {
    await this.ensureSite(organizationId, dto.siteId);
    try {
      const service = await this.prisma.service.create({
        data: { organizationId, siteId: dto.siteId, name: dto.name.trim() },
      });
      return new ServiceResponseDto(service);
    } catch (error: unknown) {
      return mapPrismaWriteError(error);
    }
  }

  async list(
    organizationId: string,
    query: ServiceListQueryDto,
  ): Promise<Page<ServiceResponseDto>> {
    await this.ensureOrganization(organizationId);
    const where = {
      organizationId,
      ...(query.siteId === undefined ? {} : { siteId: query.siteId }),
      ...(query.active === undefined ? {} : { active: query.active }),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [services, total] = await this.prisma.$transaction([
      this.prisma.service.findMany({ orderBy: { name: 'asc' }, skip, take: query.pageSize, where }),
      this.prisma.service.count({ where }),
    ]);
    return pageOf(
      services.map((service) => new ServiceResponseDto(service)),
      query.page,
      query.pageSize,
      total,
    );
  }

  async get(organizationId: string, id: string): Promise<ServiceResponseDto> {
    const service = await this.prisma.service.findFirst({ where: { id, organizationId } });
    if (service === null) throw new ResourceNotFoundException('Service');
    return new ServiceResponseDto(service);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateServiceDto,
  ): Promise<ServiceResponseDto> {
    await this.get(organizationId, id);
    if (dto.siteId !== undefined) await this.ensureSite(organizationId, dto.siteId);
    try {
      const service = await this.prisma.service.update({
        data: {
          ...(dto.siteId === undefined ? {} : { siteId: dto.siteId }),
          ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
          ...(dto.active === undefined ? {} : { active: dto.active }),
        },
        where: { id },
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
