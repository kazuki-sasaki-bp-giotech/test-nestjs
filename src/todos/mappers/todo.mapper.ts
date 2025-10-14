import { Injectable } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  CreateTodoRequestDto,
  UpdateTodoRequestDto,
  CreateTodoResponseDto,
  FindAllTodosResponseDto,
  FindOneTodoResponseDto,
  UpdateTodoResponseDto,
} from '../dto/controller';
import {
  CreateTodoServiceDto,
  UpdateTodoServiceDto,
  TodoServiceResultDto,
} from '../dto/service';

@Injectable()
export class TodoMapper {
  // Controller → Service のマッピング
  toCreateServiceDto(dto: CreateTodoRequestDto): CreateTodoServiceDto {
    return plainToInstance(CreateTodoServiceDto, dto);
  }

  toUpdateServiceDto(dto: UpdateTodoRequestDto): UpdateTodoServiceDto {
    return plainToInstance(UpdateTodoServiceDto, dto);
  }

  // Service → Controller のマッピング
  toCreateResponseDto(
    serviceResult: TodoServiceResultDto,
  ): CreateTodoResponseDto {
    return plainToInstance(CreateTodoResponseDto, serviceResult, {
      excludeExtraneousValues: true,
    });
  }

  toFindAllResponseDto(
    serviceResult: TodoServiceResultDto,
  ): FindAllTodosResponseDto {
    return plainToInstance(FindAllTodosResponseDto, serviceResult, {
      excludeExtraneousValues: true,
    });
  }

  toFindAllResponseDtos(
    serviceResults: TodoServiceResultDto[],
  ): FindAllTodosResponseDto[] {
    return serviceResults.map((result) => this.toFindAllResponseDto(result));
  }

  toFindOneResponseDto(
    serviceResult: TodoServiceResultDto,
  ): FindOneTodoResponseDto {
    return plainToInstance(FindOneTodoResponseDto, serviceResult, {
      excludeExtraneousValues: true,
    });
  }

  toUpdateResponseDto(
    serviceResult: TodoServiceResultDto,
  ): UpdateTodoResponseDto {
    return plainToInstance(UpdateTodoResponseDto, serviceResult, {
      excludeExtraneousValues: true,
    });
  }
}
