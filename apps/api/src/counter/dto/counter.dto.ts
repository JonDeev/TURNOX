import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { PaginationQueryDto, parseBooleanQuery } from '../../common/pagination.dto.js';

export class CreateCounterDto {
  @IsUUID('4')
  siteId!: string;

  @IsOptional()
  @IsUUID('4')
  roomId?: string;

  @IsString()
  @Length(1, 120)
  @Matches(/\S/)
  name!: string;
}

export class UpdateCounterDto {
  @IsOptional()
  @IsUUID('4')
  roomId?: string;

  @IsOptional()
  @IsString()
  @Length(1, 120)
  @Matches(/\S/)
  name?: string;

  @IsOptional()
  @Transform(({ value }) => parseBooleanQuery(value))
  @IsBoolean()
  active?: boolean;
}

export class CounterListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4')
  siteId?: string;

  @IsOptional()
  @Transform(({ value }) => parseBooleanQuery(value))
  @IsBoolean()
  active?: boolean;
}

export class CounterResponseDto {
  readonly id!: string;
  readonly organizationId!: string;
  readonly siteId!: string;
  readonly roomId!: string | null;
  readonly name!: string;
  readonly active!: boolean;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  constructor(record: CounterResponseDto) {
    this.id = record.id;
    this.organizationId = record.organizationId;
    this.siteId = record.siteId;
    this.roomId = record.roomId;
    this.name = record.name;
    this.active = record.active;
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
  }
}
