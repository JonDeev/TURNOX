import { Injectable } from '@nestjs/common';

import { pageOf, paginationOf, type Page } from '../common/pagination.dto.js';
import {
  InvalidRelationshipException,
  ResourceNotFoundException,
} from '../common/resource.exceptions.js';
import { mapPrismaWriteError } from '../database/prisma-error.mapper.js';
import { PrismaService } from '../database/prisma.service.js';
import { AdminAuditService, auditMetadata } from '../audit/audit.service.js';
import {
  CreateDeviceDto,
  DeviceListQueryDto,
  DeviceResponseDto,
  UpdateDeviceDto,
} from './dto/device.dto.js';

@Injectable()
export class DeviceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
  ) {}

  async create(
    organizationId: string,
    dto: CreateDeviceDto,
    correlationId?: string,
  ): Promise<DeviceResponseDto> {
    await this.ensureSite(organizationId, dto.siteId);
    if (dto.roomId !== undefined) await this.ensureRoom(organizationId, dto.siteId, dto.roomId);
    try {
      const device = await this.prisma.$transaction(async (tx) => {
        const created = await tx.device.create({
          data: {
            organizationId,
            siteId: dto.siteId,
            roomId: dto.roomId,
            name: dto.name.trim(),
            type: dto.type,
            metadata: dto.metadata ?? {},
          },
        });
        await this.audit.record(tx, {
          organizationId,
          siteId: created.siteId,
          resourceType: 'DEVICE',
          resourceId: created.id,
          action: 'CREATE',
          correlationId,
          metadata: auditMetadata(),
        });
        return created;
      });
      return new DeviceResponseDto(device);
    } catch (error: unknown) {
      return mapPrismaWriteError(error);
    }
  }

  async list(organizationId: string, query: DeviceListQueryDto): Promise<Page<DeviceResponseDto>> {
    await this.ensureOrganization(organizationId);
    const where = {
      organizationId,
      ...(query.siteId === undefined ? {} : { siteId: query.siteId }),
      ...(query.type === undefined ? {} : { type: query.type }),
      ...(query.enabled === undefined ? {} : { enabled: query.enabled }),
    };
    const { page, pageSize } = paginationOf(query);
    const skip = (page - 1) * pageSize;
    const [devices, total] = await this.prisma.$transaction([
      this.prisma.device.findMany({ orderBy: { name: 'asc' }, skip, take: pageSize, where }),
      this.prisma.device.count({ where }),
    ]);
    return pageOf(
      devices.map((device) => new DeviceResponseDto(device)),
      page,
      pageSize,
      total,
    );
  }

  async get(organizationId: string, id: string): Promise<DeviceResponseDto> {
    const device = await this.prisma.device.findFirst({ where: { id, organizationId } });
    if (device === null) throw new ResourceNotFoundException('Device');
    return new DeviceResponseDto(device);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateDeviceDto,
    correlationId?: string,
  ): Promise<DeviceResponseDto> {
    const current = await this.get(organizationId, id);
    if (dto.roomId !== undefined && dto.roomId !== null)
      await this.ensureRoom(organizationId, current.siteId, dto.roomId);
    try {
      const changedFields = [
        ...(dto.roomId === undefined ? [] : ['roomId']),
        ...(dto.name === undefined ? [] : ['name']),
        ...(dto.type === undefined ? [] : ['type']),
        ...(dto.enabled === undefined ? [] : ['enabled']),
        ...(dto.metadata === undefined ? [] : ['metadata']),
      ];
      const action =
        changedFields.length === 1 && dto.enabled !== undefined && dto.enabled !== current.enabled
          ? dto.enabled
            ? 'ENABLE'
            : 'DISABLE'
          : 'UPDATE';
      const device = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.device.update({
          data: {
            ...(dto.roomId === undefined ? {} : { roomId: dto.roomId }),
            ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
            ...(dto.type === undefined ? {} : { type: dto.type }),
            ...(dto.enabled === undefined ? {} : { enabled: dto.enabled }),
            ...(dto.metadata === undefined ? {} : { metadata: dto.metadata }),
          },
          where: { id },
        });
        await this.audit.record(tx, {
          organizationId,
          siteId: updated.siteId,
          resourceType: 'DEVICE',
          resourceId: updated.id,
          action,
          correlationId,
          metadata: auditMetadata(changedFields),
        });
        return updated;
      });
      return new DeviceResponseDto(device);
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
