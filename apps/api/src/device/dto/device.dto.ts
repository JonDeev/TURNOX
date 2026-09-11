import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
} from 'class-validator';
import { PaginationQueryDto, parseBooleanQuery } from '../../common/pagination.dto.js';
import type { InputJsonObject, JsonValue } from '@prisma/client/runtime/client';

export const DEVICE_TYPE_VALUES = ['KIOSK', 'PRINT_AGENT', 'DISPLAY'] as const;
export type DeviceType = (typeof DEVICE_TYPE_VALUES)[number];

export class CreateDeviceDto {
  @IsUUID('4')
  siteId!: string;

  @IsOptional()
  @IsUUID('4')
  roomId?: string;

  @IsString()
  @Length(1, 120)
  @Matches(/\S/)
  name!: string;

  @IsEnum(DEVICE_TYPE_VALUES)
  type!: DeviceType;

  @IsOptional()
  @IsObject()
  metadata?: InputJsonObject;
}

export class UpdateDeviceDto {
  @IsOptional()
  @IsUUID('4')
  roomId?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  @Matches(/\S/)
  name?: string;

  @IsOptional()
  @IsEnum(DEVICE_TYPE_VALUES)
  type?: DeviceType;

  @IsOptional()
  @Transform(({ value }) => parseBooleanQuery(value))
  @IsBoolean()
  enabled?: boolean;

  @IsOptional()
  @IsObject()
  metadata?: InputJsonObject;
}

export class DeviceListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4')
  siteId?: string;

  @IsOptional()
  @IsEnum(DEVICE_TYPE_VALUES)
  type?: DeviceType;

  @IsOptional()
  @Transform(({ value }) => parseBooleanQuery(value))
  @IsBoolean()
  enabled?: boolean;
}

export class DeviceResponseDto {
  readonly id!: string;
  readonly organizationId!: string;
  readonly siteId!: string;
  readonly roomId!: string | null;
  readonly name!: string;
  readonly type!: DeviceType;
  readonly enabled!: boolean;
  readonly metadata!: JsonValue;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  constructor(record: DeviceResponseDto) {
    this.id = record.id;
    this.organizationId = record.organizationId;
    this.siteId = record.siteId;
    this.roomId = record.roomId;
    this.name = record.name;
    this.type = record.type;
    this.enabled = record.enabled;
    this.metadata = record.metadata;
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
  }
}
