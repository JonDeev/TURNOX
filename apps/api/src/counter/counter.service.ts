import { Injectable } from '@nestjs/common';

import { pageOf, type Page } from '../common/pagination.dto.js';
import {
  InvalidRelationshipException,
  ResourceNotFoundException,
} from '../common/resource.exceptions.js';
import { mapPrismaWriteError } from '../database/prisma-error.mapper.js';
import { PrismaService } from '../database/prisma.service.js';
import {
  CounterListQueryDto,
  CounterResponseDto,
  CreateCounterDto,
  UpdateCounterDto,
} from './dto/counter.dto.js';

@Injectable()
export class CounterService {
  constructor(private readonly prisma: PrismaService) {}

  async create(organizationId: string, dto: CreateCounterDto): Promise<CounterResponseDto> {
    await this.ensureSite(organizationId, dto.siteId);
    if (dto.roomId !== undefined) await this.ensureRoom(organizationId, dto.siteId, dto.roomId);
    try {
      const counter = await this.prisma.counter.create({
        data: { organizationId, siteId: dto.siteId, roomId: dto.roomId, name: dto.name.trim() },
      });
      return new CounterResponseDto(counter);
    } catch (error: unknown) {
      return mapPrismaWriteError(error);
    }
  }

  async list(
    organizationId: string,
    query: CounterListQueryDto,
  ): Promise<Page<CounterResponseDto>> {
    await this.ensureOrganization(organizationId);
    const where = {
      organizationId,
      ...(query.siteId === undefined ? {} : { siteId: query.siteId }),
      ...(query.active === undefined ? {} : { active: query.active }),
    };
    const skip = (query.page - 1) * query.pageSize;
    const [counters, total] = await this.prisma.$transaction([
      this.prisma.counter.findMany({ orderBy: { name: 'asc' }, skip, take: query.pageSize, where }),
      this.prisma.counter.count({ where }),
    ]);
    return pageOf(
      counters.map((counter) => new CounterResponseDto(counter)),
      query.page,
      query.pageSize,
      total,
    );
  }

  async get(organizationId: string, id: string): Promise<CounterResponseDto> {
    const counter = await this.prisma.counter.findFirst({ where: { id, organizationId } });
    if (counter === null) throw new ResourceNotFoundException('Counter');
    return new CounterResponseDto(counter);
  }

  async update(
    organizationId: string,
    id: string,
    dto: UpdateCounterDto,
  ): Promise<CounterResponseDto> {
    const current = await this.get(organizationId, id);
    if (dto.roomId !== undefined) await this.ensureRoom(organizationId, current.siteId, dto.roomId);
    try {
      const counter = await this.prisma.counter.update({
        data: {
          ...(dto.roomId === undefined ? {} : { roomId: dto.roomId }),
          ...(dto.name === undefined ? {} : { name: dto.name.trim() }),
          ...(dto.active === undefined ? {} : { active: dto.active }),
        },
        where: { id },
      });
      return new CounterResponseDto(counter);
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
