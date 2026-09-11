import { Injectable } from '@nestjs/common';

import {
  InvalidRelationshipException,
  ResourceNotFoundException,
} from '../common/resource.exceptions.js';
import { mapPrismaWriteError } from '../database/prisma-error.mapper.js';
import { PrismaService } from '../database/prisma.service.js';
import { ServiceAssignmentResponseDto } from './dto/service-assignment.dto.js';

@Injectable()
export class ServiceAssignmentService {
  constructor(private readonly prisma: PrismaService) {}

  async listForUser(
    organizationId: string,
    userId: string,
  ): Promise<readonly ServiceAssignmentResponseDto[]> {
    await this.ensureUser(organizationId, userId);
    const assignments = await this.prisma.serviceAssignment.findMany({
      orderBy: { createdAt: 'asc' },
      where: { organizationId, userId },
    });
    return assignments.map((assignment) => new ServiceAssignmentResponseDto(assignment));
  }

  async assign(
    organizationId: string,
    userId: string,
    serviceId: string,
  ): Promise<ServiceAssignmentResponseDto> {
    await this.ensureUser(organizationId, userId);
    await this.ensureService(organizationId, serviceId);
    try {
      const assignment = await this.prisma.serviceAssignment.create({
        data: { organizationId, userId, serviceId },
      });
      return new ServiceAssignmentResponseDto(assignment);
    } catch (error: unknown) {
      return mapPrismaWriteError(error);
    }
  }

  async remove(organizationId: string, userId: string, serviceId: string): Promise<void> {
    const deleted = await this.prisma.serviceAssignment.deleteMany({
      where: { organizationId, userId, serviceId },
    });
    if (deleted.count === 0) throw new ResourceNotFoundException('Service assignment');
  }

  private async ensureUser(organizationId: string, userId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId },
      select: { id: true },
    });
    if (user === null)
      throw new InvalidRelationshipException('User does not belong to the organization');
  }

  private async ensureService(organizationId: string, serviceId: string): Promise<void> {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, organizationId },
      select: { id: true },
    });
    if (service === null)
      throw new InvalidRelationshipException('Service does not belong to the organization');
  }
}
