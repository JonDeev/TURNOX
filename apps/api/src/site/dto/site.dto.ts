import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsString, Length } from 'class-validator';
import { PaginationQueryDto, parseBooleanQuery } from '../../common/pagination.dto.js';

export class CreateSiteDto {
  @IsString()
  @Length(1, 160)
  name!: string;
}

export class UpdateSiteDto {
  @IsOptional()
  @IsString()
  @Length(1, 160)
  name?: string;

  @IsOptional()
  @Transform(({ value }) => parseBooleanQuery(value))
  @IsBoolean()
  active?: boolean;
}

export class SiteListQueryDto extends PaginationQueryDto {
  @IsOptional()
  @Transform(({ value }) => parseBooleanQuery(value))
  @IsBoolean()
  active?: boolean;
}

export class SiteResponseDto {
  readonly id: string;
  readonly organizationId: string;
  readonly name: string;
  readonly active: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;

  constructor(record: SiteResponseDto) {
    this.id = record.id;
    this.organizationId = record.organizationId;
    this.name = record.name;
    this.active = record.active;
    this.createdAt = record.createdAt;
    this.updatedAt = record.updatedAt;
  }
}
