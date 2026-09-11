import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, IsUUID, Length, Matches } from 'class-validator';
import { PaginationQueryDto, parseBooleanQuery } from '../../common/pagination.dto.js';

export class CreateServiceDto {
  @IsUUID('4')
  siteId!: string;

  @IsString()
  @Length(1, 160)
  @Matches(/\S/)
  name!: string;
}

export class UpdateServiceDto {
  @IsOptional()
  @IsUUID('4')
  siteId?: string;

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

export class ServiceListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @IsUUID('4')
  siteId?: string;

  @IsOptional()
  @Transform(({ value }) => parseBooleanQuery(value))
  @IsBoolean()
  active?: boolean;
}

export class ServiceResponseDto {
  readonly id!: string;
  readonly organizationId!: string;
  readonly siteId!: string;
  readonly name!: string;
  readonly active!: boolean;
  readonly createdAt!: Date;
  readonly updatedAt!: Date;

  constructor(record: ServiceResponseDto) {
    this.id = record.id;
    this.organizationId = record.organizationId;
    this.siteId = record.siteId;
    this.name = record.name;
    this.active = record.active;
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
  }
}
