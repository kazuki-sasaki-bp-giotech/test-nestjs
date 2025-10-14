import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
  ) {}

  async create(
    createTodoDto: CreateTodoServiceDto,
  ): Promise<TodoServiceResultDto> {
    const todo = this.todoRepository.create(createTodoDto);
    const savedTodo = await this.todoRepository.save(todo);
    return plainToInstance(TodoServiceResultDto, savedTodo);
  }

  async findAll(): Promise<TodoServiceResultDto[]> {
    const todos = await this.todoRepository.find({
      order: { createdAt: 'DESC' },
    });
    return todos.map((todo) => plainToInstance(TodoServiceResultDto, todo));
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
}
