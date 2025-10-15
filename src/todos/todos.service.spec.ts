import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TodosService } from './todos.service';
import { Todo } from '../entities/todo.entity';
import { CreateTodoServiceDto, UpdateTodoServiceDto } from './dto/service';

describe('TodosService', () => {
  let service: TodosService;

  // モックデータ
  const mockTodo: Todo = {
    id: 1,
    title: 'Test Todo',
    description: 'Test Description',
    completed: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockTodoRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findAndCount: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
    merge: jest.fn(
      (target: Todo, source: Partial<Todo>) =>
        ({ ...target, ...source }) as Todo,
    ),
  };

  const mockQueryRunner = {
    connect: jest.fn(),
    startTransaction: jest.fn(),
    commitTransaction: jest.fn(),
    rollbackTransaction: jest.fn(),
    release: jest.fn(),
    manager: {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    },
  };

  const mockDataSource = {
    createQueryRunner: jest.fn(() => mockQueryRunner),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TodosService,
        {
          provide: getRepositoryToken(Todo),
          useValue: mockTodoRepository,
        },
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    service = module.get<TodosService>(TodosService);

    // モックをクリア
    jest.clearAllMocks();
  });

  it('正しく定義されている', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('新しいTODOを作成できる', async () => {
      const createDto: CreateTodoServiceDto = {
        title: 'New Todo',
        description: 'New Description',
        completed: false,
      };

      mockTodoRepository.create.mockReturnValue(mockTodo);
      mockTodoRepository.save.mockResolvedValue(mockTodo);

      const result = await service.create(createDto);

      expect(mockTodoRepository.create).toHaveBeenCalledWith(createDto);
      expect(mockTodoRepository.save).toHaveBeenCalledWith(mockTodo);
      expect(result).toEqual(
        expect.objectContaining({
          id: mockTodo.id,
          title: mockTodo.title,
        }),
      );
    });
  });

  describe('findAll', () => {
    it('ページネーション付きでTODOsを返す', async () => {
      const mockTodos = [mockTodo];
      const total = 1;

      mockTodoRepository.findAndCount.mockResolvedValue([mockTodos, total]);

      const result = await service.findAll({ page: 1, limit: 10 });

      expect(mockTodoRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
      expect(result).toEqual({
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        data: expect.arrayContaining([
          expect.objectContaining({ id: mockTodo.id }),
        ]),
        total: 1,
        page: 1,
        limit: 10,
      });
    });

    it('完了ステータスでフィルタリングできる', async () => {
      const mockTodos = [mockTodo];
      const total = 1;

      mockTodoRepository.findAndCount.mockResolvedValue([mockTodos, total]);

      await service.findAll({ completed: true, page: 1, limit: 10 });

      expect(mockTodoRepository.findAndCount).toHaveBeenCalledWith({
        where: { completed: true },
        order: { createdAt: 'DESC' },
        skip: 0,
        take: 10,
      });
    });

    it('カスタムソートをサポートしている', async () => {
      const mockTodos = [mockTodo];
      const total = 1;

      mockTodoRepository.findAndCount.mockResolvedValue([mockTodos, total]);

      await service.findAll({
        page: 1,
        limit: 10,
        sortBy: 'title',
        order: 'ASC',
      });

      expect(mockTodoRepository.findAndCount).toHaveBeenCalledWith({
        where: {},
        order: { title: 'ASC' },
        skip: 0,
        take: 10,
      });
    });
  });

  describe('findOne', () => {
    it('IDでTODOを返す', async () => {
      mockTodoRepository.findOne.mockResolvedValue(mockTodo);

      const result = await service.findOne(1);

      expect(mockTodoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(expect.objectContaining({ id: mockTodo.id }));
    });

    it('TODOが見つからない場合はNotFoundExceptionをスローする', async () => {
      mockTodoRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'ID 999 のTODOが見つかりません',
      );
    });
  });

  describe('update', () => {
    it('TODOを更新できる', async () => {
      const updateDto: UpdateTodoServiceDto = {
        title: 'Updated Title',
        completed: true,
      };

      const updatedTodo = { ...mockTodo, ...updateDto };

      mockTodoRepository.findOne.mockResolvedValue(mockTodo);
      mockTodoRepository.save.mockResolvedValue(updatedTodo);

      const result = await service.update(1, updateDto);

      expect(mockTodoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockTodoRepository.save).toHaveBeenCalled();
      expect(result).toEqual(
        expect.objectContaining({
          title: 'Updated Title',
          completed: true,
        }),
      );
    });

    it('TODOが見つからない場合はNotFoundExceptionをスローする', async () => {
      mockTodoRepository.findOne.mockResolvedValue(null);

      const updateDto: UpdateTodoServiceDto = { title: 'Updated' };

      await expect(service.update(999, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('TODOを削除できる', async () => {
      mockTodoRepository.findOne.mockResolvedValue(mockTodo);
      mockTodoRepository.remove.mockResolvedValue(mockTodo);

      await service.remove(1);

      expect(mockTodoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(mockTodoRepository.remove).toHaveBeenCalledWith(mockTodo);
    });

    it('TODOが見つからない場合はNotFoundExceptionをスローする', async () => {
      mockTodoRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('createBulk (with transaction)', () => {
    it('トランザクションで複数のTODOを作成できる', async () => {
      const createDtos: CreateTodoServiceDto[] = [
        { title: 'Todo 1', description: 'Desc 1', completed: false },
        { title: 'Todo 2', description: 'Desc 2', completed: false },
      ];

      const mockTodo1 = { ...mockTodo, id: 1, title: 'Todo 1' };
      const mockTodo2 = { ...mockTodo, id: 2, title: 'Todo 2' };

      mockQueryRunner.manager.create
        .mockReturnValueOnce(mockTodo1)
        .mockReturnValueOnce(mockTodo2);
      mockQueryRunner.manager.save
        .mockResolvedValueOnce(mockTodo1)
        .mockResolvedValueOnce(mockTodo2);

      const result = await service.createBulk(createDtos);

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.manager.create).toHaveBeenCalledTimes(2);
      expect(mockQueryRunner.manager.save).toHaveBeenCalledTimes(2);
      expect(mockQueryRunner.commitTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(result).toHaveLength(2);
      expect(result[0]).toEqual(expect.objectContaining({ title: 'Todo 1' }));
      expect(result[1]).toEqual(expect.objectContaining({ title: 'Todo 2' }));
    });

    it('エラー時にトランザクションをロールバックする', async () => {
      const createDtos: CreateTodoServiceDto[] = [
        { title: 'Todo 1', description: 'Desc 1', completed: false },
      ];

      const error = new Error('Database error');
      mockQueryRunner.manager.save.mockRejectedValue(error);

      await expect(service.createBulk(createDtos)).rejects.toThrow(
        'Database error',
      );

      expect(mockQueryRunner.connect).toHaveBeenCalled();
      expect(mockQueryRunner.startTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.rollbackTransaction).toHaveBeenCalled();
      expect(mockQueryRunner.release).toHaveBeenCalled();
      expect(mockQueryRunner.commitTransaction).not.toHaveBeenCalled();
    });

    it('エラー時でも必ずコネクションを解放する', async () => {
      const createDtos: CreateTodoServiceDto[] = [
        { title: 'Todo 1', description: 'Desc 1', completed: false },
      ];

      mockQueryRunner.manager.save.mockRejectedValue(new Error('DB error'));

      await expect(service.createBulk(createDtos)).rejects.toThrow();

      // releaseが必ず呼ばれることを確認（コネクションリーク防止）
      expect(mockQueryRunner.release).toHaveBeenCalled();
    });
  });
});
