import { ApiProperty } from '@nestjs/swagger';
import { CreateTodoResponseDto } from './create-todo-response.dto';

export class CreateBulkTodosResponseDto {
  @ApiProperty({
    description: '作成されたTODOのリスト',
    type: [CreateTodoResponseDto],
  })
  todos: CreateTodoResponseDto[];

  @ApiProperty({ description: '作成件数', example: 3 })
  count: number;
}
