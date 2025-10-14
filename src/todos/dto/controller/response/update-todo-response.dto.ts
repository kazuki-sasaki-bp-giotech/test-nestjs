import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class UpdateTodoResponseDto {
  @ApiProperty({ description: 'TODO ID', example: 1 })
  @Expose()
  id: number;

  @ApiProperty({ description: 'タイトル', example: '買い物に行く' })
  @Expose()
  title: string;

  @ApiProperty({
    description: '説明',
    example: 'スーパーで野菜を買う',
    required: false,
  })
  @Expose()
  description?: string;

  @ApiProperty({ description: '完了状態', example: false })
  @Expose()
  completed: boolean;

  @ApiProperty({ description: '作成日時', example: '2025-10-14T12:00:00.000Z' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: '更新日時', example: '2025-10-14T12:00:00.000Z' })
  @Expose()
  updatedAt: Date;
}
