import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsBoolean, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class FindAllTodosQueryDto {
  @ApiProperty({
    description: '完了状態でフィルタリング',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  completed?: boolean;

  @ApiProperty({
    description: 'ページ番号（1から開始）',
    example: 1,
    minimum: 1,
    default: 1,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    description: '1ページあたりの件数',
    example: 10,
    minimum: 1,
    maximum: 100,
    default: 10,
    required: false,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({
    description: 'ソート順（createdAt, updatedAt, title）',
    example: 'createdAt',
    enum: ['createdAt', 'updatedAt', 'title'],
    default: 'createdAt',
    required: false,
  })
  @IsOptional()
  sortBy?: 'createdAt' | 'updatedAt' | 'title' = 'createdAt';

  @ApiProperty({
    description: 'ソート方向',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
    required: false,
  })
  @IsOptional()
  order?: 'ASC' | 'DESC' = 'DESC';
}
