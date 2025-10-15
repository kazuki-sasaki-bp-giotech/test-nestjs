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
  ApiParam,
  ApiBody,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiBadRequestResponse,
  ApiNotFoundResponse,
} from '@nestjs/swagger';
import {
  BadRequestErrorResponseDto,
  NotFoundErrorResponseDto,
} from '../common/dto';
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
  CreateBulkTodosRequestDto,
  CreateBulkTodosResponseDto,
} from './dto/controller';

@ApiTags('todos')
@Controller({
  path: 'todos',
  version: '1', // APIバージョンv1
})
export class TodosController {
  constructor(
    private readonly todosService: TodosService,
    private readonly todoMapper: TodoMapper,
  ) {}

  @Post()
  @ApiOperation({ summary: 'TODOを作成' })
  @ApiBody({ type: CreateTodoRequestDto })
  @ApiCreatedResponse({
    description: 'TODOが正常に作成されました',
    type: CreateTodoResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'バリデーションエラー',
    type: BadRequestErrorResponseDto,
  })
  async create(
    @Body() createTodoDto: CreateTodoRequestDto,
  ): Promise<CreateTodoResponseDto> {
    const serviceDto = this.todoMapper.toCreateServiceDto(createTodoDto);
    const result = await this.todosService.create(serviceDto);
    return this.todoMapper.toCreateResponseDto(result);
  }

  @Post('bulk')
  @ApiOperation({ summary: '複数のTODOを一括作成（トランザクション）' })
  @ApiBody({ type: CreateBulkTodosRequestDto })
  @ApiCreatedResponse({
    description: '全てのTODOが正常に作成されました',
    type: CreateBulkTodosResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'バリデーションエラー',
    type: BadRequestErrorResponseDto,
  })
  async createBulk(
    @Body() createBulkTodosDto: CreateBulkTodosRequestDto,
  ): Promise<CreateBulkTodosResponseDto> {
    const serviceDtos = this.todoMapper.toCreateServiceDtos(createBulkTodosDto);
    const results = await this.todosService.createBulk(serviceDtos);
    return this.todoMapper.toCreateBulkResponseDto(results);
  }

  @Get()
  @ApiOperation({ summary: 'すべてのTODOを取得（ページネーション対応）' })
  @ApiQuery({ type: FindAllTodosQueryDto })
  @ApiOkResponse({
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
  @ApiOkResponse({
    description: 'TODOを返します',
    type: FindOneTodoResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'TODOが見つかりません',
    type: NotFoundErrorResponseDto,
  })
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
  @ApiOkResponse({
    description: 'TODOが正常に更新されました',
    type: UpdateTodoResponseDto,
  })
  @ApiNotFoundResponse({
    description: 'TODOが見つかりません',
    type: NotFoundErrorResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'バリデーションエラー',
    type: BadRequestErrorResponseDto,
  })
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
  @ApiNoContentResponse({ description: 'TODOが正常に削除されました' })
  @ApiNotFoundResponse({
    description: 'TODOが見つかりません',
    type: NotFoundErrorResponseDto,
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.todosService.remove(id);
  }
}
