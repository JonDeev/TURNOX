import { Transform } from 'class-transformer';
import { IsBoolean, IsEmail, IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { PaginationQueryDto, parseBooleanQuery } from '../../common/pagination.dto.js';

export class CreateUserDto {
  @IsOptional()
  @IsUUID('4')
  siteId?: string;

  @IsEmail()
  @Length(3, 320)
  email!: string;

  @IsString()
  @Length(1, 160)
  fullName!: string;
}

export class UpdateUserDto {
  @IsOptional()
  @IsUUID('4')
  siteId?: string | null;

  @IsOptional()
  @IsEmail()
  @Length(3, 320)
  email?: string;

  @IsOptional()
  @IsString()
  @Length(1, 160)
  fullName?: string;

  @IsOptional()
  @Transform(({ value }) => parseBooleanQuery(value))
  @IsBoolean()
  active?: boolean;
}

export class UserListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4')
  siteId?: string;

  @IsOptional()
  @Transform(({ value }) => parseBooleanQuery(value))
  @IsBoolean()
  active?: boolean;
}

export class UserResponseDto {
  readonly id!: string;
  readonly organizationId!: string;
  readonly siteId!: string | null;
  readonly email!: string;
  readonly fullName!: string;
  readonly active!: boolean;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  constructor(record: UserResponseDto) {
    Object.assign(this, record);
  }
}
