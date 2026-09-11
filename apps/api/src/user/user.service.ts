import { Injectable } from '@nestjs/common';

import { pageOf, type Page } from '../common/pagination.dto.js';
import {
  InvalidRelationshipException,
  ResourceNotFoundException,
} from '../common/resource.exceptions.js';
import { mapPrismaWriteError } from '../database/prisma-error.mapper.js';
import { PrismaService } from '../database/prisma.service.js';
import { CreateUserDto, UpdateUserDto, UserListQueryDto, UserResponseDto } from './dto/user.dto.js';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateUserDto): Promise<UserResponseDto> {
    await this.ensureOrganization(organizationId);
    if (dto.siteId !== undefined) await this.ensureSite(organizationId, dto.siteId);
    try {
      const user = await this.prisma.user.create({
        data: {
          organizationId,
          siteId: dto.siteId,
          email: dto.email.trim().toLowerCase(),
          fullName: dto.fullName.trim(),
        },
      });
      return new UserResponseDto(user);
    } catch (error: unknown) {
      return mapPrismaWriteError(error);
    }
  }

  async list(organizationId: string, query: UserListQueryDto): Promise<Page<UserResponseDto>> {
    await this.ensureOrganization(organizationId);
    const where = {
      organizationId,
      ...(query.siteId === undefined ? {} : { siteId: query.siteId }),
      ...(query.active === undefined ? {} : { active: query.active }),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        orderBy: { fullName: 'asc' },
        skip,
        take: query.pageSize,
        where,
      }),
      this.prisma.user.count({ where }),
    ]);
    return pageOf(
      users.map((user) => new UserResponseDto(user)),
      query.page,
      query.pageSize,
      total,
    );
  }

  async get(organizationId: string, id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({ where: { id, organizationId } });
    if (user === null) throw new ResourceNotFoundException('User');
    return new UserResponseDto(user);
  }

  async update(organizationId: string, id: string, dto: UpdateUserDto): Promise<UserResponseDto> {
    await this.get(organizationId, id);
    if (dto.siteId !== undefined && dto.siteId !== null)
      await this.ensureSite(organizationId, dto.siteId);
    try {
      const user = await this.prisma.user.update({
        data: {
          ...(dto.siteId === undefined ? {} : { siteId: dto.siteId }),
          ...(dto.email === undefined ? {} : { email: dto.email.trim().toLowerCase() }),
          ...(dto.fullName === undefined ? {} : { fullName: dto.fullName.trim() }),
          ...(dto.active === undefined ? {} : { active: dto.active }),
        },
        where: { id },
      });
      return new UserResponseDto(user);
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
