import { Injectable } from '@nestjs/common';

import { pageOf, paginationOf, type Page } from '../common/pagination.dto.js';
import {
  InvalidRelationshipException,
  ResourceNotFoundException,
} from '../common/resource.exceptions.js';
import { mapPrismaWriteError } from '../database/prisma-error.mapper.js';
import { PrismaService } from '../database/prisma.service.js';
import { AdminAuditService, auditMetadata } from '../audit/audit.service.js';
import { CreateRoomDto, RoomListQueryDto, RoomResponseDto, UpdateRoomDto } from './dto/room.dto.js';

@Injectable()
export class RoomService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async create(
    organizationId: string,
    dto: CreateRoomDto,
    correlationId?: string,
  ): Promise<RoomResponseDto> {
    await this.ensureSite(organizationId, dto.siteId);
    try {
      const room = await this.prisma.$transaction(async (tx) => {
        const created = await tx.room.create({
          data: { organizationId, siteId: dto.siteId, name: dto.name.trim() },
        });
        await this.audit.record(tx, {
          organizationId,
          siteId: created.siteId,
          resourceType: 'ROOM',
          resourceId: created.id,
          action: 'CREATE',
          correlationId,
          metadata: auditMetadata(),
        });
        return created;
      });
      return new RoomResponseDto(room);
    } catch (error: unknown) {
      return mapPrismaWriteError(error);
    }
  }

  async list(organizationId: string, query: RoomListQueryDto): Promise<Page<RoomResponseDto>> {
    await this.ensureOrganization(organizationId);
    const where = {
      organizationId,
      ...(query.siteId === undefined ? {} : { siteId: query.siteId }),
      ...(query.active === undefined ? {} : { active: query.active }),
    };
    const { page, pageSize } = paginationOf(query);
    const skip = (page - 1) * pageSize;
    const [rooms, total] = await this.prisma.$transaction([
      this.prisma.room.findMany({ orderBy: { name: 'asc' }, skip, take: pageSize, where }),
      this.prisma.room.count({ where }),
    ]);
    return pageOf(
      rooms.map((room) => new RoomResponseDto(room)),
      page,
      pageSize,
      total,
    );
  }

  async get(organizationId: string, id: string): Promise<RoomResponseDto> {
    const room = await this.prisma.room.findFirst({ where: { id, organizationId } });
    if (room === null) throw new ResourceNotFoundException('Room');
    return new RoomResponseDto(room);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateRoomDto,
    correlationId?: string,
  ): Promise<RoomResponseDto> {
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
      const room = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.room.update({
          data: {
            ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
            ...(dto.active === undefined ? {} : { active: dto.active }),
          },
          where: { id },
        });
        await this.audit.record(tx, {
          organizationId,
          siteId: updated.siteId,
          resourceType: 'ROOM',
          resourceId: updated.id,
          action,
          correlationId,
          metadata: auditMetadata(changedFields),
        });
        return updated;
      });
      return new RoomResponseDto(room);
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
