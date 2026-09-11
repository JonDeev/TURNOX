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
  CreateDeviceDto,
  DeviceListQueryDto,
  DeviceResponseDto,
  UpdateDeviceDto,
} from './dto/device.dto.js';
import { DeviceService } from './device.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AuthorizationGuard } from '../auth/authorization.guard.js';
import { CsrfGuard } from '../auth/csrf.guard.js';
import { CurrentUser, RequirePermission } from '../auth/auth.decorators.js';
import { PERMISSIONS } from '../auth/permissions.js';
import type { AuthContext } from '../auth/auth.types.js';

@Controller('organizations/:organizationId/devices')
@UseGuards(AuthGuard, CsrfGuard, AuthorizationGuard)
export class DeviceController {
  constructor(private readonly devices: DeviceService) {}

  @Post()
  @RequirePermission(PERMISSIONS.DEVICE_MANAGE)
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateDeviceDto,
    @Req() request: CorrelatedRequest,
    @CurrentUser() context: AuthContext,
  ): Promise<DeviceResponseDto> {
    return this.devices.create(organizationId, dto, context, request.correlationId);
  }

  @Get()
  @RequirePermission(PERMISSIONS.DEVICE_READ)
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() query: DeviceListQueryDto,
    @CurrentUser() context: AuthContext,
  ) {
    return this.devices.list(organizationId, query, context);
  }

  @Get(':deviceId')
  @RequirePermission(PERMISSIONS.DEVICE_READ)
  get(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @CurrentUser() context: AuthContext,
  ): Promise<DeviceResponseDto> {
    return this.devices.get(organizationId, deviceId, context);
  }

  @Patch(':deviceId')
  @RequirePermission(PERMISSIONS.DEVICE_MANAGE)
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('deviceId', ParseUUIDPipe) deviceId: string,
    @Body() dto: UpdateDeviceDto,
    @Req() request: CorrelatedRequest,
    @CurrentUser() context: AuthContext,
  ): Promise<DeviceResponseDto> {
    return this.devices.update(organizationId, deviceId, dto, context, request.correlationId);
  }
}
