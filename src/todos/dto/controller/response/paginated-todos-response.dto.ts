import { ApiProperty } from '@nestjs/swagger';
import { FindAllTodosResponseDto } from './find-all-todos-response.dto';

export class PaginatedTodosResponseDto {
  @ApiProperty({ description: 'TODOリスト', type: [FindAllTodosResponseDto] })
  data: FindAllTodosResponseDto[];

  @ApiProperty({ description: '総件数', example: 100 })
  total: number;

  @ApiProperty({ description: '現在のページ', example: 1 })
  page: number;

  @ApiProperty({ description: '1ページあたりの件数', example: 10 })
  limit: number;

  @ApiProperty({ description: '総ページ数', example: 10 })
  totalPages: number;
}
