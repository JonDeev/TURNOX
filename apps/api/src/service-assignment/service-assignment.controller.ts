import { Controller, Delete, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import { Req } from '@nestjs/common';
import type { CorrelatedRequest } from '../http/correlation-id.middleware.js';

import { ServiceAssignmentResponseDto } from './dto/service-assignment.dto.js';
import { ServiceAssignmentService } from './service-assignment.service.js';

@Controller('organizations/:organizationId/users/:userId/services')
export class ServiceAssignmentController {
  constructor(private readonly assignments: ServiceAssignmentService) {}

  @Get()
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<readonly ServiceAssignmentResponseDto[]> {
    return this.assignments.listForUser(organizationId, userId);
  }

  @Post(':serviceId')
  assign(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Req() request: CorrelatedRequest,
  ): Promise<ServiceAssignmentResponseDto> {
    return this.assignments.assign(organizationId, userId, serviceId, request.correlationId);
  }

  @Delete(':serviceId')
  async remove(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Req() request: CorrelatedRequest,
  ): Promise<void> {
    await this.assignments.remove(organizationId, userId, serviceId, request.correlationId);
  }
}
