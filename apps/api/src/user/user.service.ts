import { Injectable } from '@nestjs/common';

import { pageOf, paginationOf, type Page } from '../common/pagination.dto.js';
import {
  InvalidRelationshipException,
  ResourceNotFoundException,
} from '../common/resource.exceptions.js';
import { mapPrismaWriteError } from '../database/prisma-error.mapper.js';
import { PrismaService } from '../database/prisma.service.js';
import { AdminAuditService, auditMetadata } from '../audit/audit.service.js';
import { CreateUserDto, UpdateUserDto, UserListQueryDto, UserResponseDto } from './dto/user.dto.js';

@Injectable()
export class UserService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async create(
    organizationId: string,
    dto: CreateUserDto,
    correlationId?: string,
  ): Promise<UserResponseDto> {
    await this.ensureOrganization(organizationId);
    if (dto.siteId !== undefined) await this.ensureSite(organizationId, dto.siteId);
    try {
      const user = await this.prisma.$transaction(async (tx) => {
        const created = await tx.user.create({
          data: {
            organizationId,
            siteId: dto.siteId,
            email: dto.email.trim().toLowerCase(),
            fullName: dto.fullName.trim(),
          },
        });
        await this.audit.record(tx, {
          organizationId,
          siteId: created.siteId,
          resourceType: 'USER',
          resourceId: created.id,
          action: 'CREATE',
          correlationId,
          metadata: auditMetadata(),
        });
        return created;
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
    const { page, pageSize } = paginationOf(query);
    const skip = (page - 1) * pageSize;
    const [users, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        orderBy: { fullName: 'asc' },
        skip,
        take: pageSize,
        where,
      }),
      this.prisma.user.count({ where }),
    ]);
    return pageOf(
      users.map((user) => new UserResponseDto(user)),
      page,
      pageSize,
      total,
    );
  }

  async get(organizationId: string, id: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findFirst({ where: { id, organizationId } });
    if (user === null) throw new ResourceNotFoundException('User');
    return new UserResponseDto(user);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateUserDto,
    correlationId?: string,
  ): Promise<UserResponseDto> {
    const current = await this.get(organizationId, id);
    if (dto.siteId !== undefined && dto.siteId !== null)
      await this.ensureSite(organizationId, dto.siteId);
    try {
      const changedFields = [
        ...(dto.siteId === undefined ? [] : ['siteId']),
        ...(dto.email === undefined ? [] : ['email']),
        ...(dto.fullName === undefined ? [] : ['fullName']),
        ...(dto.active === undefined ? [] : ['active']),
      ];
      const action =
        changedFields.length === 1 && dto.active !== undefined && dto.active !== current.active
          ? dto.active
            ? 'ENABLE'
            : 'DISABLE'
          : 'UPDATE';
      const user = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.user.update({
          data: {
            ...(dto.siteId === undefined ? {} : { siteId: dto.siteId }),
            ...(dto.email === undefined ? {} : { email: dto.email.trim().toLowerCase() }),
            ...(dto.fullName === undefined ? {} : { fullName: dto.fullName.trim() }),
            ...(dto.active === undefined ? {} : { active: dto.active }),
          },
          where: { id },
        });
        await this.audit.record(tx, {
          organizationId,
          siteId: updated.siteId,
          resourceType: 'USER',
          resourceId: updated.id,
          action,
          correlationId,
          metadata: auditMetadata(changedFields),
        });
        return updated;
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
