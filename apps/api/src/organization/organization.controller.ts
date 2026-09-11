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
  CreateOrganizationDto,
  OrganizationListQueryDto,
  OrganizationResponseDto,
  UpdateOrganizationDto,
} from './dto/organization.dto.js';
import { OrganizationService } from './organization.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AuthorizationGuard } from '../auth/authorization.guard.js';
import { CsrfGuard } from '../auth/csrf.guard.js';
import { CurrentUser, RequirePermission } from '../auth/auth.decorators.js';
import { PERMISSIONS } from '../auth/permissions.js';
import type { AuthContext } from '../auth/auth.types.js';

@Controller('organizations')
@UseGuards(AuthGuard, CsrfGuard, AuthorizationGuard)
export class OrganizationController {
  constructor(private readonly organizations: OrganizationService) {}

  @Post()
  @RequirePermission(PERMISSIONS.ORGANIZATION_MANAGE)
  create(
    @Body() dto: CreateOrganizationDto,
    @Req() request: CorrelatedRequest,
    @CurrentUser() context: AuthContext,
  ): Promise<OrganizationResponseDto> {
    return this.organizations.create(dto, context, request.correlationId);
  }

  @Get()
  @RequirePermission(PERMISSIONS.ORGANIZATION_READ)
  list(@Query() query: OrganizationListQueryDto) {
    return this.organizations.list(query);
  }

  @Get(':organizationId')
  @RequirePermission(PERMISSIONS.ORGANIZATION_READ)
  get(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @CurrentUser() context: AuthContext,
  ): Promise<OrganizationResponseDto> {
    return this.organizations.get(organizationId, context);
  }

  @Patch(':organizationId')
  @RequirePermission(PERMISSIONS.ORGANIZATION_MANAGE)
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: UpdateOrganizationDto,
    @Req() request: CorrelatedRequest,
    @CurrentUser() context: AuthContext,
  ): Promise<OrganizationResponseDto> {
    return this.organizations.update(organizationId, dto, context, request.correlationId);
  }
}
