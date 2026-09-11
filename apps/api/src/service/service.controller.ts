import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Req } from '@nestjs/common';
import type { CorrelatedRequest } from '../http/correlation-id.middleware.js';

import {
  CreateServiceDto,
  ServiceListQueryDto,
  ServiceResponseDto,
  UpdateServiceDto,
} from './dto/service.dto.js';
import { ServiceService } from './service.service.js';

@Controller('organizations/:organizationId/services')
export class ServiceController {
  constructor(private readonly services: ServiceService) {}

  @Post()
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateServiceDto,
    @Req() request: CorrelatedRequest,
  ): Promise<ServiceResponseDto> {
    return this.services.create(organizationId, dto, request.correlationId);
  }

  @Get()
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() query: ServiceListQueryDto,
  ) {
    return this.services.list(organizationId, query);
  }

  @Get(':serviceId')
  get(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
  ): Promise<ServiceResponseDto> {
    return this.services.get(organizationId, serviceId);
  }

  @Patch(':serviceId')
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('serviceId', ParseUUIDPipe) serviceId: string,
    @Body() dto: UpdateServiceDto,
    @Req() request: CorrelatedRequest,
  ): Promise<ServiceResponseDto> {
    return this.services.update(organizationId, serviceId, dto, request.correlationId);
  }
}
