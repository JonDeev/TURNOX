import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

export const DEFAULT_PAGE_SIZE = 25;

export function parseBooleanQuery(value: unknown): unknown {
  if (value === 'true') return true;
  if (value === 'false') return false;
  return value;
}

export class PaginationQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  pageSize = DEFAULT_PAGE_SIZE;
}

export interface Page<T> {
  readonly items: readonly T[];
  readonly page: number;
  readonly pageSize: number;
  readonly total: number;
}

export function paginationOf(query: Partial<PaginationQueryDto>): {
  readonly page: number;
  readonly pageSize: number;
} {
  return {
    page: query.page ?? 1,
    pageSize: query.pageSize ?? DEFAULT_PAGE_SIZE,
  };
}

export function pageOf<T>(
  items: readonly T[],
  page: number,
  pageSize: number,
  total: number,
): Page<T> {
  return { items, page, pageSize, total };
}
