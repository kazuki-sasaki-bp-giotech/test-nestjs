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
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiQuery,
} from '@nestjs/swagger';
import { TodosService } from './todos.service';
import { TodoMapper } from './mappers/todo.mapper';
import {
  CreateTodoRequestDto,
  UpdateTodoRequestDto,
  CreateTodoResponseDto,
  FindOneTodoResponseDto,
  UpdateTodoResponseDto,
  FindAllTodosQueryDto,
  PaginatedTodosResponseDto,
} from './dto/controller';

@ApiTags('todos')
@Controller('todos')
export class TodosController {
  constructor(
    private readonly todosService: TodosService,
    private readonly todoMapper: TodoMapper,
  ) {}

  @Post()
  @ApiOperation({ summary: 'TODOを作成' })
  @ApiBody({ type: CreateTodoRequestDto })
  @ApiResponse({
    status: 201,
    description: 'TODOが正常に作成されました',
    type: CreateTodoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'バリデーションエラー' })
  async create(
    @Body() createTodoDto: CreateTodoRequestDto,
  ): Promise<CreateTodoResponseDto> {
    const serviceDto = this.todoMapper.toCreateServiceDto(createTodoDto);
    const result = await this.todosService.create(serviceDto);
    return this.todoMapper.toCreateResponseDto(result);
  }

  @Get()
  @ApiOperation({ summary: 'すべてのTODOを取得（ページネーション対応）' })
  @ApiQuery({ type: FindAllTodosQueryDto })
  @ApiResponse({
    status: 200,
    description: 'TODOリストを返します',
    type: PaginatedTodosResponseDto,
  })
  async findAll(
    @Query() query: FindAllTodosQueryDto,
  ): Promise<PaginatedTodosResponseDto> {
    const result = await this.todosService.findAll(query);
    return {
      data: this.todoMapper.toFindAllResponseDtos(result.data),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: Math.ceil(result.total / result.limit),
    };
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
    return this.todoMapper.toFindOneResponseDto(result);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'TODOを更新' })
  @ApiParam({ name: 'id', description: 'TODO ID', type: Number })
  @ApiBody({ type: UpdateTodoRequestDto })
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
    const serviceDto = this.todoMapper.toUpdateServiceDto(updateTodoDto);
    const result = await this.todosService.update(id, serviceDto);
    return this.todoMapper.toUpdateResponseDto(result);
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
