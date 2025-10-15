import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { Todo } from '../entities/todo.entity';
import {
  CreateTodoServiceDto,
  UpdateTodoServiceDto,
  TodoServiceResultDto,
} from './dto/service';

@Injectable()
export class TodosService {
  constructor(
    @InjectRepository(Todo)
    private readonly todoRepository: Repository<Todo>,
    private readonly dataSource: DataSource,
  ) {}

  async create(
    createTodoDto: CreateTodoServiceDto,
  ): Promise<TodoServiceResultDto> {
    const todo = this.todoRepository.create(createTodoDto);
    const savedTodo = await this.todoRepository.save(todo);
    return plainToInstance(TodoServiceResultDto, savedTodo);
  }

  async findAll(options?: {
    completed?: boolean;
    page?: number;
    limit?: number;
    sortBy?: 'createdAt' | 'updatedAt' | 'title';
    order?: 'ASC' | 'DESC';
  }): Promise<{
    data: TodoServiceResultDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const {
      completed,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      order = 'DESC',
    } = options || {};

    const where = completed !== undefined ? { completed } : {};
    const skip = (page - 1) * limit;

    const [todos, total] = await this.todoRepository.findAndCount({
      where,
      order: { [sortBy]: order },
      skip,
      take: limit,
    });

    return {
      data: todos.map((todo) => plainToInstance(TodoServiceResultDto, todo)),
      total,
      page,
      limit,
    };
  }

  async findOne(id: number): Promise<TodoServiceResultDto> {
    const todo = await this.todoRepository.findOne({ where: { id } });
    if (!todo) {
      throw new NotFoundException(`ID ${id} のTODOが見つかりません`);
    }
    return plainToInstance(TodoServiceResultDto, todo);
  }

  async update(
    id: number,
    updateTodoDto: UpdateTodoServiceDto,
  ): Promise<TodoServiceResultDto> {
    const todo = await this.todoRepository.findOne({ where: { id } });
    if (!todo) {
      throw new NotFoundException(`ID ${id} のTODOが見つかりません`);
    }
    Object.assign(todo, updateTodoDto);
    const savedTodo = await this.todoRepository.save(todo);
    return plainToInstance(TodoServiceResultDto, savedTodo);
  }

  async remove(id: number): Promise<void> {
    const todo = await this.todoRepository.findOne({ where: { id } });
    if (!todo) {
      throw new NotFoundException(`ID ${id} のTODOが見つかりません`);
    }
    await this.todoRepository.remove(todo);
  }

  /**
   * トランザクションを使用した一括作成の例
   * 複数のTODOを作成し、1つでも失敗したら全てロールバック
   */
  async createBulk(
    createTodoDtos: CreateTodoServiceDto[],
  ): Promise<TodoServiceResultDto[]> {
    // QueryRunnerを作成
    const queryRunner = this.dataSource.createQueryRunner();

    // データベース接続を確立
    await queryRunner.connect();

    // トランザクション開始
    await queryRunner.startTransaction();

    try {
      const results: TodoServiceResultDto[] = [];

      // トランザクション内で複数のTODOを作成
      for (const dto of createTodoDtos) {
        // トランザクションのmanagerを使用（重要！）
        const todo = queryRunner.manager.create(Todo, dto);
        const savedTodo = await queryRunner.manager.save(todo);
        results.push(plainToInstance(TodoServiceResultDto, savedTodo));
      }

      // 全て成功したらコミット
      await queryRunner.commitTransaction();

      return results;
    } catch (error: unknown) {
      // エラーが発生したらロールバック
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // 必ず接続を解放（重要！コネクションプールに返却）
      await queryRunner.release();
    }
  }
}
