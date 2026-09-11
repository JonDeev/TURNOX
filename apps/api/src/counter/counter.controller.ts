import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';
import { Req } from '@nestjs/common';
import type { CorrelatedRequest } from '../http/correlation-id.middleware.js';

import {
  CounterListQueryDto,
  CounterResponseDto,
  CreateCounterDto,
  UpdateCounterDto,
} from './dto/counter.dto.js';
import { CounterService } from './counter.service.js';

@Controller('organizations/:organizationId/counters')
export class CounterController {
  constructor(private readonly counters: CounterService) {}

  @Post()
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateCounterDto,
    @Req() request: CorrelatedRequest,
  ): Promise<CounterResponseDto> {
    return this.counters.create(organizationId, dto, request.correlationId);
  }

  @Get()
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() query: CounterListQueryDto,
  ) {
    return this.counters.list(organizationId, query);
  }

  @Get(':counterId')
  get(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('counterId', ParseUUIDPipe) counterId: string,
  ): Promise<CounterResponseDto> {
    return this.counters.get(organizationId, counterId);
  }

  @Patch(':counterId')
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('counterId', ParseUUIDPipe) counterId: string,
    @Body() dto: UpdateCounterDto,
    @Req() request: CorrelatedRequest,
  ): Promise<CounterResponseDto> {
    return this.counters.update(organizationId, counterId, dto, request.correlationId);
  }
}
