import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MaxLength } from 'class-validator';

export class CreateTodoRequestDto {
  @ApiProperty({
    description: 'タイトル',
    example: '買い物に行く',
    maxLength: 255,
  })
  @IsString()
  @MaxLength(255)
  title: string;

  @ApiProperty({
    description: '説明',
    example: 'スーパーで野菜を買う',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: '完了状態',
    example: false,
    default: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  completed?: boolean;
}
