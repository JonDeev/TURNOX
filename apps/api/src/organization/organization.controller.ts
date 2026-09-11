import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Req } from '@nestjs/common';
import type { CorrelatedRequest } from '../http/correlation-id.middleware.js';

import {
  CreateOrganizationDto,
  OrganizationListQueryDto,
  OrganizationResponseDto,
  UpdateOrganizationDto,
} from './dto/organization.dto.js';
import { OrganizationService } from './organization.service.js';

@Controller('organizations')
export class OrganizationController {
  constructor(private readonly organizations: OrganizationService) {}

  @Post()
  create(
    @Body() dto: CreateOrganizationDto,
    @Req() request: CorrelatedRequest,
  ): Promise<OrganizationResponseDto> {
    return this.organizations.create(dto, request.correlationId);
  }

  @Get()
  list(@Query() query: OrganizationListQueryDto) {
    return this.organizations.list(query);
  }

  @Get(':organizationId')
  get(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
  ): Promise<OrganizationResponseDto> {
    return this.organizations.get(organizationId);
  }

  @Patch(':organizationId')
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: UpdateOrganizationDto,
    @Req() request: CorrelatedRequest,
  ): Promise<OrganizationResponseDto> {
    return this.organizations.update(organizationId, dto, request.correlationId);
  }
}
