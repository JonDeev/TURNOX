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

import { CreateRoomDto, RoomListQueryDto, RoomResponseDto, UpdateRoomDto } from './dto/room.dto.js';
import { RoomService } from './room.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AuthorizationGuard } from '../auth/authorization.guard.js';
import { CsrfGuard } from '../auth/csrf.guard.js';
import { CurrentUser, RequirePermission } from '../auth/auth.decorators.js';
import { PERMISSIONS } from '../auth/permissions.js';
import type { AuthContext } from '../auth/auth.types.js';

@Controller('organizations/:organizationId/rooms')
@UseGuards(AuthGuard, CsrfGuard, AuthorizationGuard)
export class RoomController {
  constructor(private readonly rooms: RoomService) {}

  @Post()
  @RequirePermission(PERMISSIONS.ROOM_MANAGE)
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateRoomDto,
    @Req() request: CorrelatedRequest,
    @CurrentUser() context: AuthContext,
  ): Promise<RoomResponseDto> {
    return this.rooms.create(organizationId, dto, context, request.correlationId);
  }

  @Get()
  @RequirePermission(PERMISSIONS.ROOM_READ)
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() query: RoomListQueryDto,
    @CurrentUser() context: AuthContext,
  ) {
    return this.rooms.list(organizationId, query, context);
  }

  @Get(':roomId')
  @RequirePermission(PERMISSIONS.ROOM_READ)
  get(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @CurrentUser() context: AuthContext,
  ): Promise<RoomResponseDto> {
    return this.rooms.get(organizationId, roomId, context);
  }

  @Patch(':roomId')
  @RequirePermission(PERMISSIONS.ROOM_MANAGE)
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: UpdateRoomDto,
    @Req() request: CorrelatedRequest,
    @CurrentUser() context: AuthContext,
  ): Promise<RoomResponseDto> {
    return this.rooms.update(organizationId, roomId, dto, context, request.correlationId);
  }
}
