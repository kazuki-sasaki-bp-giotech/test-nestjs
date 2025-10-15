import { Test, TestingModule } from '@nestjs/testing';
import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';

interface MockRequest {
  method: string;
  url: string;
  requestId?: string;
  startTime?: number;
}

interface MockResponse {
  status: jest.Mock;
  json: jest.Mock;
}

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockArgumentsHost: ArgumentsHost;
  let mockRequest: MockRequest;
  let mockResponse: MockResponse;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HttpExceptionFilter],
    }).compile();

    filter = module.get<HttpExceptionFilter>(HttpExceptionFilter);

    // Mockレスポンス
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    // Mockリクエスト
    mockRequest = {
      method: 'GET',
      url: '/api/v1/todos/999',
      requestId: 'test-request-id',
      startTime: Date.now() - 100, // 100ms前に開始
    };

    // MockArgumentsHost
    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ArgumentsHost;
  });

  it('正しく定義されている', () => {
    expect(filter).toBeDefined();
  });

  describe('HttpException処理', () => {
    it('NotFoundExceptionを適切に処理する', () => {
      const exception = new HttpException(
        'ID 999 のTODOが見つかりません',
        HttpStatus.NOT_FOUND,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 404,
          message: 'ID 999 のTODOが見つかりません',
          path: '/api/v1/todos/999',
          requestId: 'test-request-id',
          timestamp: expect.any(String) as unknown as string,
        }),
      );
    });

    it('BadRequestExceptionを適切に処理する', () => {
      const exceptionResponse = {
        message: ['title should not be empty'],
        error: 'Bad Request',
        statusCode: 400,
      };
      const exception = new HttpException(
        exceptionResponse,
        HttpStatus.BAD_REQUEST,
      );

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 400,
          message: ['title should not be empty'],
          error: 'Bad Request',
          timestamp: expect.any(String) as unknown as string,
          path: '/api/v1/todos/999',
          requestId: 'test-request-id',
        }),
      );
    });
  });

  describe('一般エラー処理', () => {
    it('本番環境では汎用メッセージを返す', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const exception = new Error('Cannot read property "id" of undefined');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'サーバーエラーが発生しました',
          path: '/api/v1/todos/999',
          requestId: 'test-request-id',
        }),
      );

      // レスポンスにスタックトレースが含まれないことを確認
      const calls = mockResponse.json.mock.calls as Array<
        Array<Record<string, unknown>>
      >;
      const jsonCall = calls[0]?.[0];
      expect(jsonCall?.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('開発環境では詳細なエラーメッセージとスタックトレースを返す', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const exception = new Error('Detailed error message');

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);

      const calls = mockResponse.json.mock.calls as Array<
        Array<Record<string, unknown>>
      >;
      const jsonCall = calls[0]?.[0];
      expect(jsonCall?.message).toBe('Detailed error message');
      expect(jsonCall?.stack).toBeDefined();
      expect(typeof jsonCall?.stack === 'string' && jsonCall.stack).toContain(
        'Error: Detailed error message',
      );

      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('ログ出力', () => {
    it('エラーログを構造化ログ形式で出力する', () => {
      const errorSpy = jest.spyOn(filter['logger'], 'error');
      const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"type":"error"'),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"requestId":"test-request-id"'),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"statusCode":400'),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"errorName":"HttpException"'),
      );
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"errorMessage":"Test error"'),
      );
    });

    it('responseTimeを計算してログに含める', () => {
      const errorSpy = jest.spyOn(filter['logger'], 'error');
      mockRequest.startTime = Date.now() - 250; // 250ms前に開始

      const exception = new Error('Test error');

      filter.catch(exception, mockArgumentsHost);

      const errorCalls = errorSpy.mock.calls as Array<[string]>;
      const errorLog = errorCalls[0]?.[0];
      expect(errorLog).toBeDefined();
      expect(typeof errorLog).toBe('string');
      if (typeof errorLog === 'string') {
        const logData = JSON.parse(errorLog) as Record<string, unknown>;
        expect(typeof logData.responseTime).toBe('number');
        expect(logData.responseTime as number).toBeGreaterThanOrEqual(0);
        expect(logData.responseTime as number).toBeLessThanOrEqual(1000); // 1秒以内
      }
    });

    it('Request IDがない場合はunknownを使用する', () => {
      const errorSpy = jest.spyOn(filter['logger'], 'error');
      mockRequest.requestId = undefined;

      const exception = new Error('Test error');

      filter.catch(exception, mockArgumentsHost);

      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('"requestId":"unknown"'),
      );
    });
  });

  describe('エラーレスポンス形式', () => {
    it('必須フィールドをすべて含む', () => {
      const exception = new HttpException('Test', HttpStatus.BAD_REQUEST);

      filter.catch(exception, mockArgumentsHost);

      const calls = mockResponse.json.mock.calls as Array<
        Array<Record<string, unknown>>
      >;
      const jsonCall = calls[0]?.[0];
      expect(jsonCall).toHaveProperty('statusCode');
      expect(jsonCall).toHaveProperty('message');
      expect(jsonCall).toHaveProperty('timestamp');
      expect(jsonCall).toHaveProperty('path');
      expect(jsonCall).toHaveProperty('requestId');
    });

    it('timestampがISO 8601形式である', () => {
      const exception = new Error('Test');

      filter.catch(exception, mockArgumentsHost);

      const calls = mockResponse.json.mock.calls as Array<
        Array<Record<string, unknown>>
      >;
      const jsonCall = calls[0]?.[0];
      expect(jsonCall?.timestamp).toMatch(
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
      );
    });
  });

  describe('未知のエラータイプ', () => {
    it('ErrorでもHttpExceptionでもないエラーを処理する', () => {
      const exception = 'string error';

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
          message: 'サーバーエラーが発生しました',
        }),
      );
    });

    it('nullエラーを処理する', () => {
      const exception = null;

      filter.catch(exception, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          statusCode: 500,
        }),
      );
    });
  });
});
