import { ApiProperty } from '@nestjs/swagger';

/**
 * 400 Bad Request エラーレスポンス
 */
export class BadRequestErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({
    example: ['title must be a string', 'title should not be empty'],
    description: 'バリデーションエラーメッセージの配列',
  })
  message: string | string[];

  @ApiProperty({ example: 'Bad Request' })
  error: string;
}

/**
 * 404 Not Found エラーレスポンス
 */
export class NotFoundErrorResponseDto {
  @ApiProperty({ example: 404 })
  statusCode: number;

  @ApiProperty({ example: 'ID 123 のTODOが見つかりませんでした' })
  message: string;

  @ApiProperty({ example: 'Not Found' })
  error: string;
}

/**
 * 500 Internal Server Error エラーレスポンス
 */
export class InternalServerErrorResponseDto {
  @ApiProperty({ example: 500 })
  statusCode: number;

  @ApiProperty({ example: 'Internal server error' })
  message: string;

  @ApiProperty({ example: 'Internal Server Error' })
  error: string;
}
