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

import { CreateSiteDto, SiteListQueryDto, SiteResponseDto, UpdateSiteDto } from './dto/site.dto.js';
import { SiteService } from './site.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AuthorizationGuard } from '../auth/authorization.guard.js';
import { CsrfGuard } from '../auth/csrf.guard.js';
import { CurrentUser, RequirePermission } from '../auth/auth.decorators.js';
import { PERMISSIONS } from '../auth/permissions.js';
import type { AuthContext } from '../auth/auth.types.js';

@Controller('organizations/:organizationId/sites')
@UseGuards(AuthGuard, CsrfGuard, AuthorizationGuard)
export class SiteController {
  constructor(private readonly sites: SiteService) {}

  @Post()
  @RequirePermission(PERMISSIONS.SITE_MANAGE)
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateSiteDto,
    @Req() request: CorrelatedRequest,
    @CurrentUser() context: AuthContext,
  ): Promise<SiteResponseDto> {
    return this.sites.create(organizationId, dto, context, request.correlationId);
  }

  @Get()
  @RequirePermission(PERMISSIONS.SITE_READ)
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() query: SiteListQueryDto,
    @CurrentUser() context: AuthContext,
  ) {
    return this.sites.list(organizationId, query, context);
  }

  @Get(':siteId')
  @RequirePermission(PERMISSIONS.SITE_READ)
  get(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @CurrentUser() context: AuthContext,
  ): Promise<SiteResponseDto> {
    return this.sites.get(organizationId, siteId, context);
  }

  @Patch(':siteId')
  @RequirePermission(PERMISSIONS.SITE_MANAGE)
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: UpdateSiteDto,
    @Req() request: CorrelatedRequest,
    @CurrentUser() context: AuthContext,
  ): Promise<SiteResponseDto> {
    return this.sites.update(organizationId, siteId, dto, context, request.correlationId);
  }
}
