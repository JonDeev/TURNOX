import { Controller, Delete, Get, Param, ParseUUIDPipe, Post, UseGuards } from '@nestjs/common';
import { Req } from '@nestjs/common';
import type { CorrelatedRequest } from '../http/correlation-id.middleware.js';

import { ServiceAssignmentResponseDto } from './dto/service-assignment.dto.js';
import { ServiceAssignmentService } from './service-assignment.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AuthorizationGuard } from '../auth/authorization.guard.js';
import { CsrfGuard } from '../auth/csrf.guard.js';
import { CurrentUser, RequirePermission } from '../auth/auth.decorators.js';
import { PERMISSIONS } from '../auth/permissions.js';
import type { AuthContext } from '../auth/auth.types.js';

@Controller('organizations/:organizationId/users/:userId/services')
@UseGuards(AuthGuard, CsrfGuard, AuthorizationGuard)
export class ServiceAssignmentController {
  constructor(private readonly assignments: ServiceAssignmentService) {}

  @Get()
  @RequirePermission(PERMISSIONS.ASSIGNMENT_READ)
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() context: AuthContext,
  ): Promise<readonly ServiceAssignmentResponseDto[]> {
    return this.assignments.listForUser(organizationId, userId, context);
  }

  @Post(':serviceId')
  @RequirePermission(PERMISSIONS.ASSIGNMENT_MANAGE)
  assign(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Req() request: CorrelatedRequest,
    @CurrentUser() context: AuthContext,
  ): Promise<ServiceAssignmentResponseDto> {
    return this.assignments.assign(
      organizationId,
      userId,
      serviceId,
      context,
      request.correlationId,
    );
  }

  @Delete(':serviceId')
  @RequirePermission(PERMISSIONS.ASSIGNMENT_MANAGE)
  async remove(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Req() request: CorrelatedRequest,
    @CurrentUser() context: AuthContext,
  ): Promise<void> {
    await this.assignments.remove(
      organizationId,
      userId,
      serviceId,
      context,
      request.correlationId,
    );
  }
}
