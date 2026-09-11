import { Injectable } from '@nestjs/common';

import {
  InvalidRelationshipException,
  ResourceNotFoundException,
} from '../common/resource.exceptions.js';
import { mapPrismaWriteError } from '../database/prisma-error.mapper.js';
import { PrismaService } from '../database/prisma.service.js';
import { AdminAuditService, auditMetadata } from '../audit/audit.service.js';
import { AuthorizationService } from '../auth/authorization.service.js';
import type { AuthContext } from '../auth/auth.types.js';
import { ServiceAssignmentResponseDto } from './dto/service-assignment.dto.js';

@Injectable()
export class ServiceAssignmentService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AdminAuditService,
    private readonly authorization: AuthorizationService,
  ) {}

  async listForUser(
    organizationId: string,
    userId: string,
    context: AuthContext,
  ): Promise<readonly ServiceAssignmentResponseDto[]> {
    await this.ensureUser(organizationId, userId, context);
    const assignments = await this.prisma.serviceAssignment.findMany({
      orderBy: { createdAt: 'asc' },
      where: {
        organizationId,
        userId,
        ...(context.siteId === null || context.role === 'SUPERADMINISTRADOR'
          ? {}
          : { service: { siteId: context.siteId } }),
      },
    });
    return assignments.map((assignment) => new ServiceAssignmentResponseDto(assignment));
  }

  async assign(
    organizationId: string,
    userId: string,
    serviceId: string,
    context: AuthContext,
    correlationId?: string,
  ): Promise<ServiceAssignmentResponseDto> {
    await this.ensureUser(organizationId, userId, context);
    await this.ensureService(organizationId, serviceId, context);
    try {
      const assignment = await this.prisma.$transaction(async (tx) => {
        const created = await tx.serviceAssignment.create({
          data: { organizationId, userId, serviceId },
        });
        const service = await tx.service.findUniqueOrThrow({
          where: { id: serviceId },
          select: { siteId: true },
        });
        await this.audit.record(tx, {
          organizationId,
          siteId: service.siteId,
          resourceType: 'SERVICE_ASSIGNMENT',
          resourceId: `${userId}:${serviceId}`,
          action: 'ASSIGN',
          actorUserId: context.userId,
          correlationId,
          metadata: auditMetadata(['userId', 'serviceId']),
        });
        return created;
      });
      return new ServiceAssignmentResponseDto(assignment);
    } catch (error: unknown) {
      return mapPrismaWriteError(error);
    }
  }

  async remove(
    organizationId: string,
    userId: string,
    serviceId: string,
    context: AuthContext,
    correlationId?: string,
  ): Promise<void> {
    await this.ensureUser(organizationId, userId, context);
    try {
      await this.prisma.$transaction(async (tx) => {
        const service = await tx.service.findFirst({
          where: { id: serviceId, organizationId },
          select: { siteId: true },
        });
        if (service === null) throw new ResourceNotFoundException('Service assignment');
        this.authorization.assertSite(context, organizationId, service.siteId);

        const deleted = await tx.serviceAssignment.deleteMany({
          where: { organizationId, userId, serviceId },
        });
        if (deleted.count === 0) throw new ResourceNotFoundException('Service assignment');

        await this.audit.record(tx, {
          organizationId,
          siteId: service.siteId,
          resourceType: 'SERVICE_ASSIGNMENT',
          resourceId: `${userId}:${serviceId}`,
          action: 'UNASSIGN',
          actorUserId: context.userId,
          correlationId,
          metadata: auditMetadata(['userId', 'serviceId']),
        });
      });
    } catch (error: unknown) {
      if (error instanceof ResourceNotFoundException) throw error;
      return mapPrismaWriteError(error);
    }
  }

  private async ensureUser(
    organizationId: string,
    userId: string,
    context: AuthContext,
  ): Promise<void> {
    this.authorization.assertOrganization(context, organizationId);
    const user = await this.prisma.user.findFirst({
      where: { id: userId, organizationId, ...this.authorization.siteFilter(context) },
      select: { id: true },
    });
    if (user === null)
      throw new InvalidRelationshipException('User does not belong to the organization');
  }

  private async ensureService(
    organizationId: string,
    serviceId: string,
    context: AuthContext,
  ): Promise<void> {
    const service = await this.prisma.service.findFirst({
      where: { id: serviceId, organizationId },
      select: { id: true },
    });
    if (service === null)
      throw new InvalidRelationshipException('Service does not belong to the organization');
    const scopedService = await this.prisma.service.findFirst({
      where: { id: serviceId, organizationId, ...this.authorization.siteFilter(context) },
      select: { id: true },
    });
    if (scopedService === null)
      throw new InvalidRelationshipException('Service is outside the site scope');
  }
}
