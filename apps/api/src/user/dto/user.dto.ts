import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import { AUTH_ROLES, type AuthRole } from '../../auth/roles.js';
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
  @Matches(/\S/)
  fullName!: string;

  @IsIn(AUTH_ROLES)
  role!: AuthRole;

  @IsString()
  @Length(8, 256)
  password!: string;
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
  @Matches(/\S/)
  fullName?: string;

  @IsOptional()
  @IsIn(AUTH_ROLES)
  role?: AuthRole;

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
  readonly role!: AuthRole;
  readonly active!: boolean;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  constructor(record: UserResponseDto) {
    this.id = record.id;
    this.organizationId = record.organizationId;
    this.siteId = record.siteId;
    this.email = record.email;
    this.fullName = record.fullName;
    this.role = record.role;
    this.active = record.active;
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
  }
}
