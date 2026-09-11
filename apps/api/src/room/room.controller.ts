import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Req } from '@nestjs/common';
import type { CorrelatedRequest } from '../http/correlation-id.middleware.js';

import { CreateRoomDto, RoomListQueryDto, RoomResponseDto, UpdateRoomDto } from './dto/room.dto.js';
import { RoomService } from './room.service.js';

@Controller('organizations/:organizationId/rooms')
export class RoomController {
  constructor(private readonly rooms: RoomService) {}

  @Post()
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateRoomDto,
    @Req() request: CorrelatedRequest,
  ): Promise<RoomResponseDto> {
    return this.rooms.create(organizationId, dto, request.correlationId);
  }

  @Get()
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() query: RoomListQueryDto,
  ) {
    return this.rooms.list(organizationId, query);
  }

  @Get(':roomId')
  get(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('roomId', ParseUUIDPipe) roomId: string,
  ): Promise<RoomResponseDto> {
    return this.rooms.get(organizationId, roomId);
  }

  @Patch(':roomId')
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('roomId', ParseUUIDPipe) roomId: string,
    @Body() dto: UpdateRoomDto,
    @Req() request: CorrelatedRequest,
  ): Promise<RoomResponseDto> {
    return this.rooms.update(organizationId, roomId, dto, request.correlationId);
  }
}
