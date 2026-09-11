import { Transform } from 'class-transformer';
import { IsBoolean, IsEnum, IsObject, IsOptional, IsString, IsUUID, Length } from 'class-validator';
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
    Object.assign(this, record);
  }
}
