import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { TodosService } from './todos.service';
import {
  CreateTodoRequestDto,
  UpdateTodoRequestDto,
  CreateTodoResponseDto,
  FindAllTodosResponseDto,
  FindOneTodoResponseDto,
  UpdateTodoResponseDto,
} from './dto/controller';
import { CreateTodoServiceDto, UpdateTodoServiceDto } from './dto/service';

@ApiTags('todos')
@Controller('todos')
export class TodosController {
  constructor(private readonly todosService: TodosService) {}

  @Post()
  @ApiOperation({ summary: 'TODOを作成' })
  @ApiResponse({
    status: 201,
    description: 'TODOが正常に作成されました',
    type: CreateTodoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  async create(
    @Body() createTodoDto: CreateTodoRequestDto,
  ): Promise<CreateTodoResponseDto> {
    const serviceDto = plainToInstance(CreateTodoServiceDto, createTodoDto);
    const result = await this.todosService.create(serviceDto);
    return plainToInstance(CreateTodoResponseDto, result);
  }

  @Get()
  @ApiOperation({ summary: 'すべてのTODOを取得' })
  @ApiResponse({
    status: 200,
    description: 'TODOリストを返します',
    type: [FindAllTodosResponseDto],
  })
  async findAll(): Promise<FindAllTodosResponseDto[]> {
    const results = await this.todosService.findAll();
    return results.map((result) =>
      plainToInstance(FindAllTodosResponseDto, result),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: '指定したIDのTODOを取得' })
  @ApiParam({ name: 'id', description: 'TODO ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'TODOを返します',
    type: FindOneTodoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'TODOが見つかりません' })
  async findOne(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<FindOneTodoResponseDto> {
    const result = await this.todosService.findOne(id);
    return plainToInstance(FindOneTodoResponseDto, result);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'TODOを更新' })
  @ApiParam({ name: 'id', description: 'TODO ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'TODOが正常に更新されました',
    type: UpdateTodoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'TODOが見つかりません' })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTodoDto: UpdateTodoRequestDto,
  ): Promise<UpdateTodoResponseDto> {
    const serviceDto = plainToInstance(UpdateTodoServiceDto, updateTodoDto);
    const result = await this.todosService.update(id, serviceDto);
    return plainToInstance(UpdateTodoResponseDto, result);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'TODOを削除' })
  @ApiParam({ name: 'id', description: 'TODO ID', type: Number })
  @ApiResponse({ status: 204, description: 'TODOが正常に削除されました' })
  @ApiResponse({ status: 404, description: 'TODOが見つかりません' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.todosService.remove(id);
  }
}
