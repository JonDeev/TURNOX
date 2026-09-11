import { Injectable } from '@nestjs/common';

import { PrismaService } from '../database/prisma.service.js';
import { mapPrismaWriteError } from '../database/prisma-error.mapper.js';
import { ResourceNotFoundException } from '../common/resource.exceptions.js';
import { pageOf, type Page } from '../common/pagination.dto.js';
import {
  CreateOrganizationDto,
  OrganizationListQueryDto,
  OrganizationResponseDto,
  UpdateOrganizationDto,
} from './dto/organization.dto.js';

@Injectable()
export class OrganizationService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateOrganizationDto): Promise<OrganizationResponseDto> {
    try {
      const organization = await this.prisma.organization.create({
        data: { name: dto.name.trim() },
      });
      return new OrganizationResponseDto(organization);
    } catch (error: unknown) {
      return mapPrismaWriteError(error);
    }
  }

  async list(query: OrganizationListQueryDto): Promise<Page<OrganizationResponseDto>> {
    const where = query.active === undefined ? {} : { active: query.active };
    const skip = (query.page - 1) * query.pageSize;
    const [organizations, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        orderBy: { name: 'asc' },
        skip,
        take: query.pageSize,
        where,
      }),
      this.prisma.organization.count({ where }),
    ]);

    return pageOf(
      organizations.map((organization) => new OrganizationResponseDto(organization)),
      query.page,
      query.pageSize,
      total,
    );
  }

  async get(id: string): Promise<OrganizationResponseDto> {
    const organization = await this.prisma.organization.findUnique({ where: { id } });
    if (organization === null) {
      throw new ResourceNotFoundException('Organization');
    }
    return new OrganizationResponseDto(organization);
  }

  async update(id: string, dto: UpdateOrganizationDto): Promise<OrganizationResponseDto> {
    const current = await this.prisma.organization.findUnique({ where: { id } });
    if (current === null) {
      throw new ResourceNotFoundException('Organization');
    }

    try {
      const organization = await this.prisma.organization.update({
        data: {
          ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
          ...(dto.active === undefined ? {} : { active: dto.active }),
        },
        where: { id },
      });
      return new OrganizationResponseDto(organization);
    } catch (error: unknown) {
      return mapPrismaWriteError(error);
    }
  }
}
