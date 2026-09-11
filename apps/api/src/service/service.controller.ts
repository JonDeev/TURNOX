import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Req } from '@nestjs/common';
import type { CorrelatedRequest } from '../http/correlation-id.middleware.js';

import {
  CreateServiceDto,
  ServiceListQueryDto,
  ServiceResponseDto,
  UpdateServiceDto,
} from './dto/service.dto.js';
import { ServiceService } from './service.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AuthorizationGuard } from '../auth/authorization.guard.js';
import { CsrfGuard } from '../auth/csrf.guard.js';
import { CurrentUser, RequirePermission } from '../auth/auth.decorators.js';
import { PERMISSIONS } from '../auth/permissions.js';
import type { AuthContext } from '../auth/auth.types.js';

@Controller('organizations/:organizationId/services')
@UseGuards(AuthGuard, CsrfGuard, AuthorizationGuard)
export class ServiceController {
  constructor(private readonly services: ServiceService) {}

  @Post()
  @RequirePermission(PERMISSIONS.SERVICE_MANAGE)
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateServiceDto,
    @Req() request: CorrelatedRequest,
    @CurrentUser() context: AuthContext,
  ): Promise<ServiceResponseDto> {
    return this.services.create(organizationId, dto, context, request.correlationId);
  }

  @Get()
  @RequirePermission(PERMISSIONS.SERVICE_READ)
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() query: ServiceListQueryDto,
    @CurrentUser() context: AuthContext,
  ) {
    return this.services.list(organizationId, query, context);
  }

  @Get(':serviceId')
  @RequirePermission(PERMISSIONS.SERVICE_READ)
  get(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @CurrentUser() context: AuthContext,
  ): Promise<ServiceResponseDto> {
    return this.services.get(organizationId, serviceId, context);
  }

  @Patch(':serviceId')
  @RequirePermission(PERMISSIONS.SERVICE_MANAGE)
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body() dto: UpdateServiceDto,
    @Req() request: CorrelatedRequest,
    @CurrentUser() context: AuthContext,
  ): Promise<ServiceResponseDto> {
    return this.services.update(organizationId, serviceId, dto, context, request.correlationId);
  }
}
