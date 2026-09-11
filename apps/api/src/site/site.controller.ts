import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Req } from '@nestjs/common';
import type { CorrelatedRequest } from '../http/correlation-id.middleware.js';

import { CreateSiteDto, SiteListQueryDto, SiteResponseDto, UpdateSiteDto } from './dto/site.dto.js';
import { SiteService } from './site.service.js';

@Controller('organizations/:organizationId/sites')
export class SiteController {
  constructor(private readonly sites: SiteService) {}

  @Post()
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateSiteDto,
    @Req() request: CorrelatedRequest,
  ): Promise<SiteResponseDto> {
    return this.sites.create(organizationId, dto, request.correlationId);
  }

  @Get()
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() query: SiteListQueryDto,
  ) {
    return this.sites.list(organizationId, query);
  }

  @Get(':siteId')
  get(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('siteId', ParseUUIDPipe) siteId: string,
  ): Promise<SiteResponseDto> {
    return this.sites.get(organizationId, siteId);
  }

  @Patch(':siteId')
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('siteId', ParseUUIDPipe) siteId: string,
    @Body() dto: UpdateSiteDto,
    @Req() request: CorrelatedRequest,
  ): Promise<SiteResponseDto> {
    return this.sites.update(organizationId, siteId, dto, request.correlationId);
  }
}
