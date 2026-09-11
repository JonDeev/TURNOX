import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, Query } from '@nestjs/common';

import { CreateUserDto, UpdateUserDto, UserListQueryDto, UserResponseDto } from './dto/user.dto.js';
import { UserService } from './user.service.js';

@Controller('organizations/:organizationId/users')
export class UserController {
  constructor(private readonly users: UserService) {}

  @Post()
  create(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Body() dto: CreateUserDto,
  ): Promise<UserResponseDto> {
    return this.users.create(organizationId, dto);
  }

  @Get()
  list(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Query() query: UserListQueryDto,
  ) {
    return this.users.list(organizationId, query);
  }

  @Get(':userId')
  get(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
  ): Promise<UserResponseDto> {
    return this.users.get(organizationId, userId);
  }

  @Patch(':userId')
  update(
    @Param('organizationId', ParseUUIDPipe) organizationId: string,
    @Param('userId', ParseUUIDPipe) userId: string,
    @Body() dto: UpdateUserDto,
  ): Promise<UserResponseDto> {
    return this.users.update(organizationId, userId, dto);
  }
}
