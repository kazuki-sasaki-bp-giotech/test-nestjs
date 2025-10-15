import { Test, TestingModule } from '@nestjs/testing';
import { TodosController } from './todos.controller';
import { TodosService } from './todos.service';
import { TodoMapper } from './mappers/todo.mapper';
import {
  CreateTodoRequestDto,
  UpdateTodoRequestDto,
  FindAllTodosQueryDto,
  CreateBulkTodosRequestDto,
} from './dto/controller';
import { TodoServiceResultDto } from './dto/service';

describe('TodosController', () => {
  let controller: TodosController;

  // モックデータ
  const mockTodoResult: TodoServiceResultDto = {
    id: 1,
    title: 'Test Todo',
    description: 'Test Description',
    completed: false,
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  const mockTodosService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createBulk: jest.fn(),
  };

  const mockTodoMapper = {
    toCreateServiceDto: jest.fn(),
    toUpdateServiceDto: jest.fn(),
    toCreateResponseDto: jest.fn(),
    toFindAllResponseDtos: jest.fn(),
    toFindOneResponseDto: jest.fn(),
    toUpdateResponseDto: jest.fn(),
    toCreateServiceDtos: jest.fn(),
    toCreateBulkResponseDto: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TodosController],
      providers: [
        {
          provide: TodosService,
          useValue: mockTodosService,
        },
        {
          provide: TodoMapper,
          useValue: mockTodoMapper,
        },
      ],
    }).compile();

    controller = module.get<TodosController>(TodosController);

    // モックをクリア
    jest.clearAllMocks();
  });

  it('正しく定義されている', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('新しいTODOを作成できる', async () => {
      const createDto: CreateTodoRequestDto = {
        title: 'New Todo',
        description: 'New Description',
        completed: false,
      };

      const serviceDto = { ...createDto };
      const responseDto = {
        id: 1,
        title: 'New Todo',
        description: 'New Description',
        completed: false,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      mockTodoMapper.toCreateServiceDto.mockReturnValue(serviceDto);
      mockTodosService.create.mockResolvedValue(mockTodoResult);
      mockTodoMapper.toCreateResponseDto.mockReturnValue(responseDto);

      const result = await controller.create(createDto);

      expect(mockTodoMapper.toCreateServiceDto).toHaveBeenCalledWith(createDto);
      expect(mockTodosService.create).toHaveBeenCalledWith(serviceDto);
      expect(mockTodoMapper.toCreateResponseDto).toHaveBeenCalledWith(
        mockTodoResult,
      );
      expect(result).toEqual(responseDto);
    });
  });

  describe('createBulk', () => {
    it('複数のTODOを一括作成できる', async () => {
      const createBulkDto: CreateBulkTodosRequestDto = {
        todos: [
          { title: 'Todo 1', description: 'Desc 1', completed: false },
          { title: 'Todo 2', description: 'Desc 2', completed: false },
        ],
      };

      const serviceDtos = [
        { title: 'Todo 1', description: 'Desc 1', completed: false },
        { title: 'Todo 2', description: 'Desc 2', completed: false },
      ];

      const serviceResults = [
        { ...mockTodoResult, id: 1, title: 'Todo 1' },
        { ...mockTodoResult, id: 2, title: 'Todo 2' },
      ];

      const bulkResponseDto = {
        todos: [
          {
            id: 1,
            title: 'Todo 1',
            description: 'Desc 1',
            completed: false,
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
          },
          {
            id: 2,
            title: 'Todo 2',
            description: 'Desc 2',
            completed: false,
            createdAt: new Date('2025-01-01'),
            updatedAt: new Date('2025-01-01'),
          },
        ],
        count: 2,
      };

      mockTodoMapper.toCreateServiceDtos.mockReturnValue(serviceDtos);
      mockTodosService.createBulk.mockResolvedValue(serviceResults);
      mockTodoMapper.toCreateBulkResponseDto.mockReturnValue(bulkResponseDto);

      const result = await controller.createBulk(createBulkDto);

      expect(mockTodoMapper.toCreateServiceDtos).toHaveBeenCalledWith(
        createBulkDto,
      );
      expect(mockTodosService.createBulk).toHaveBeenCalledWith(serviceDtos);
      expect(mockTodoMapper.toCreateBulkResponseDto).toHaveBeenCalledWith(
        serviceResults,
      );
      expect(result).toEqual(bulkResponseDto);
      expect(result.count).toBe(2);
    });
  });

  describe('findAll', () => {
    it('ページネーション付きでTODOsを返す', async () => {
      const query: FindAllTodosQueryDto = {
        page: 1,
        limit: 10,
      };

      const serviceResult = {
        data: [mockTodoResult],
        total: 1,
        page: 1,
        limit: 10,
      };

      const mappedData = [
        {
          id: 1,
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          createdAt: new Date('2025-01-01'),
          updatedAt: new Date('2025-01-01'),
        },
      ];

      mockTodosService.findAll.mockResolvedValue(serviceResult);
      mockTodoMapper.toFindAllResponseDtos.mockReturnValue(mappedData);

      const result = await controller.findAll(query);

      expect(mockTodosService.findAll).toHaveBeenCalledWith(query);
      expect(mockTodoMapper.toFindAllResponseDtos).toHaveBeenCalledWith(
        serviceResult.data,
      );
      expect(result).toEqual({
        data: mappedData,
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
    });

    it('総ページ数を正しく計算する', async () => {
      const query: FindAllTodosQueryDto = {
        page: 1,
        limit: 10,
      };

      const serviceResult = {
        data: [mockTodoResult],
        total: 25, // 25件のデータがある場合
        page: 1,
        limit: 10,
      };

      mockTodosService.findAll.mockResolvedValue(serviceResult);
      mockTodoMapper.toFindAllResponseDtos.mockReturnValue([mockTodoResult]);

      const result = await controller.findAll(query);

      expect(result.totalPages).toBe(3); // 25 / 10 = 3ページ
    });
  });

  describe('findOne', () => {
    it('単一のTODOを返す', async () => {
      const todoId = 1;

      const responseDto = {
        id: 1,
        title: 'Test Todo',
        description: 'Test Description',
        completed: false,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      mockTodosService.findOne.mockResolvedValue(mockTodoResult);
      mockTodoMapper.toFindOneResponseDto.mockReturnValue(responseDto);

      const result = await controller.findOne(todoId);

      expect(mockTodosService.findOne).toHaveBeenCalledWith(todoId);
      expect(mockTodoMapper.toFindOneResponseDto).toHaveBeenCalledWith(
        mockTodoResult,
      );
      expect(result).toEqual(responseDto);
    });
  });

  describe('update', () => {
    it('TODOを更新できる', async () => {
      const todoId = 1;
      const updateDto: UpdateTodoRequestDto = {
        title: 'Updated Title',
        completed: true,
      };

      const serviceDto = { ...updateDto };
      const updatedResult = {
        ...mockTodoResult,
        title: 'Updated Title',
        completed: true,
      };
      const responseDto = {
        id: 1,
        title: 'Updated Title',
        description: 'Test Description',
        completed: true,
        createdAt: new Date('2025-01-01'),
        updatedAt: new Date('2025-01-01'),
      };

      mockTodoMapper.toUpdateServiceDto.mockReturnValue(serviceDto);
      mockTodosService.update.mockResolvedValue(updatedResult);
      mockTodoMapper.toUpdateResponseDto.mockReturnValue(responseDto);

      const result = await controller.update(todoId, updateDto);

      expect(mockTodoMapper.toUpdateServiceDto).toHaveBeenCalledWith(updateDto);
      expect(mockTodosService.update).toHaveBeenCalledWith(todoId, serviceDto);
      expect(mockTodoMapper.toUpdateResponseDto).toHaveBeenCalledWith(
        updatedResult,
      );
      expect(result).toEqual(responseDto);
    });
  });

  describe('remove', () => {
    it('TODOを削除できる', async () => {
      const todoId = 1;

      mockTodosService.remove.mockResolvedValue(undefined);

      const result = await controller.remove(todoId);

      expect(mockTodosService.remove).toHaveBeenCalledWith(todoId);
      expect(result).toBeUndefined();
    });
  });
});
