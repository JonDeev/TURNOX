import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { PaginationQueryDto, parseBooleanQuery } from '../../common/pagination.dto.js';

export class CreateRoomDto {
  @IsUUID('4')
  siteId!: string;

  @IsString()
  @Length(1, 160)
  @Matches(/\S/)
  name!: string;
}

export class UpdateRoomDto {
  @IsOptional()
  @IsString()
  @Length(1, 160)
  @Matches(/\S/)
  name?: string;

  @IsOptional()
  @Transform(({ value }) => parseBooleanQuery(value))
  @IsBoolean()
  active?: boolean;
}

export class RoomListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4')
  siteId?: string;

  @IsOptional()
  @Transform(({ value }) => parseBooleanQuery(value))
  @IsBoolean()
  active?: boolean;
}

export class RoomResponseDto {
  readonly id!: string;
  readonly organizationId!: string;
  readonly siteId!: string;
  readonly name!: string;
  readonly active!: boolean;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  constructor(record: RoomResponseDto) {
    this.id = record.id;
    this.organizationId = record.organizationId;
    this.siteId = record.siteId;
    this.name = record.name;
    this.active = record.active;
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
  }
}
