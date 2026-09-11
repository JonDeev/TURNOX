import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Req } from '@nestjs/common';
import type { CorrelatedRequest } from '../http/correlation-id.middleware.js';

import {
  CreateDeviceDto,
  DeviceListQueryDto,
  DeviceResponseDto,
  UpdateDeviceDto,
} from './dto/device.dto.js';
import { DeviceService } from './device.service.js';

@Controller('organizations/:organizationId/devices')
export class DeviceController {
  constructor(private readonly devices: DeviceService) {}

  @Post()
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateDeviceDto,
    @Req() request: CorrelatedRequest,
  ): Promise<DeviceResponseDto> {
    return this.devices.create(organizationId, dto, request.correlationId);
  }

  @Get()
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() query: DeviceListQueryDto,
  ) {
    return this.devices.list(organizationId, query);
  }

  @Get(':deviceId')
  get(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
  ): Promise<DeviceResponseDto> {
    return this.devices.get(organizationId, deviceId);
  }

  @Patch(':deviceId')
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Body() dto: UpdateDeviceDto,
    @Req() request: CorrelatedRequest,
  ): Promise<DeviceResponseDto> {
    return this.devices.update(organizationId, deviceId, dto, request.correlationId);
  }
}
