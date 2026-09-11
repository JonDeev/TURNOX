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

import { CreateUserDto, UpdateUserDto, UserListQueryDto, UserResponseDto } from './dto/user.dto.js';
import { UserService } from './user.service.js';
import { AuthGuard } from '../auth/auth.guard.js';
import { AuthorizationGuard } from '../auth/authorization.guard.js';
import { CsrfGuard } from '../auth/csrf.guard.js';
import { CurrentUser, RequirePermission } from '../auth/auth.decorators.js';
import { PERMISSIONS } from '../auth/permissions.js';
import type { AuthContext } from '../auth/auth.types.js';

@Controller('organizations/:organizationId/users')
@UseGuards(AuthGuard, CsrfGuard, AuthorizationGuard)
export class UserController {
  constructor(private readonly users: UserService) {}

  @Post()
  @RequirePermission(PERMISSIONS.USER_MANAGE)
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateUserDto,
    @Req() request: CorrelatedRequest,
    @CurrentUser() context: AuthContext,
  ): Promise<UserResponseDto> {
    return this.users.create(organizationId, dto, context, request.correlationId);
  }

  @Get()
  @RequirePermission(PERMISSIONS.USER_READ)
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() query: UserListQueryDto,
    @CurrentUser() context: AuthContext,
  ) {
    return this.users.list(organizationId, query, context);
  }

  @Get(':userId')
  @RequirePermission(PERMISSIONS.USER_READ)
  get(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @CurrentUser() context: AuthContext,
  ): Promise<UserResponseDto> {
    return this.users.get(organizationId, userId, context);
  }

  @Patch(':userId')
  @RequirePermission(PERMISSIONS.USER_MANAGE)
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserDto,
    @Req() request: CorrelatedRequest,
    @CurrentUser() context: AuthContext,
  ): Promise<UserResponseDto> {
    return this.users.update(organizationId, userId, dto, context, request.correlationId);
  }
}
