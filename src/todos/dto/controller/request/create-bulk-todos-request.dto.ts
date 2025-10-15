import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, ValidateNested, ArrayMinSize } from 'class-validator';
import { CreateTodoRequestDto } from './create-todo-request.dto';

export class CreateBulkTodosRequestDto {
  @ApiProperty({
    description: 'TODOのリスト',
    type: [CreateTodoRequestDto],
    example: [
      { title: 'TODO1', description: '説明1' },
      { title: 'TODO2', description: '説明2' },
    ],
  })
  @IsArray()
  @ArrayMinSize(1, { message: '最低1件のTODOが必要です' })
  @ValidateNested({ each: true })
  @Type(() => CreateTodoRequestDto)
  todos: CreateTodoRequestDto[];
}
