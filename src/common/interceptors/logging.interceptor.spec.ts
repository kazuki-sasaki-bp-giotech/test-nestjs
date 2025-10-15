import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';
import { LoggingInterceptor } from './logging.interceptor';
import { LoggerUtil } from '../utils/logger.util';

interface MockRequest {
  method: string;
  url: string;
  body?: unknown;
  query?: unknown;
  params?: unknown;
  requestId?: string;
  startTime?: number;
}

interface MockResponse {
  statusCode: number;
}

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: MockRequest;
  let mockResponse: MockResponse;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggingInterceptor],
    }).compile();

    interceptor = module.get<LoggingInterceptor>(LoggingInterceptor);

    // Mockリクエスト
    mockRequest = {
      method: 'GET',
      url: '/api/v1/todos',
      body: { title: 'Test Todo' },
      query: { page: '1' },
      params: { id: '123' },
    };

    // Mockレスポンス
    mockResponse = {
      statusCode: 200,
    };

    // MockExecutionContext
    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue(mockRequest),
        getResponse: jest.fn().mockReturnValue(mockResponse),
      }),
    } as unknown as ExecutionContext;

    // MockCallHandler
    mockCallHandler = {
      handle: jest.fn(),
    } as unknown as CallHandler;
  });

  it('正しく定義されている', () => {
    expect(interceptor).toBeDefined();
  });

  describe('リクエスト処理', () => {
    it('Request IDを生成してリクエストオブジェクトに保存する', (done) => {
      jest.spyOn(LoggerUtil, 'generateRequestId').mockReturnValue('test-uuid');
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(mockRequest.requestId).toBe('test-uuid');
          expect(mockRequest.startTime).toBeDefined();
          done();
        },
      });
    });

    it('リクエストログを出力する', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining('"type":"request"'),
          );
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining('"method":"GET"'),
          );
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining('"/api/v1/todos"'),
          );
          done();
        },
      });
    });
  });

  describe('成功レスポンス処理', () => {
    it('成功時にレスポンスログを出力する', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');
      mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        next: () => {
          // レスポンスログが出力される
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining('"type":"response"'),
          );
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining('"statusCode":200'),
          );
          expect(logSpy).toHaveBeenCalledWith(
            expect.stringContaining('"responseTime"'),
          );
        },
        complete: done,
      });
    });

    it('レスポンスタイムを計算する', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      // 処理時間を測定できるように少し遅延
      setTimeout(() => {
        interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
          complete: () => {
            const calls = logSpy.mock.calls as Array<[string]>;
            const logCalls = calls.find((call) =>
              call[0].includes('"type":"response"'),
            );
            expect(logCalls).toBeDefined();
            if (logCalls) {
              const logData = JSON.parse(logCalls[0]) as Record<
                string,
                unknown
              >;
              expect(typeof logData.responseTime).toBe('number');
              expect(logData.responseTime as number).toBeGreaterThanOrEqual(0);
            }
            done();
          },
        });
      }, 10);
    });
  });

  describe('エラー処理', () => {
    it('エラー時はログを出力しない（ExceptionFilterに任せる）', (done) => {
      const errorSpy = jest.spyOn(interceptor['logger'], 'error');
      const testError = new Error('Test error');
      mockCallHandler.handle = jest
        .fn()
        .mockReturnValue(throwError(() => testError));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        error: () => {
          // エラーログは出力されない（ExceptionFilterに任せる）
          expect(errorSpy).not.toHaveBeenCalled();
          done();
        },
      });
    });
  });

  describe('センシティブ情報の除外', () => {
    it('passwordフィールドを[REDACTED]に置き換える', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');
      mockRequest.body = {
        username: 'user@example.com',
        password: 'secret123',
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          const calls = logSpy.mock.calls as Array<[string]>;
          const requestLogCall = calls.find((call) =>
            call[0].includes('"type":"request"'),
          );
          expect(requestLogCall).toBeDefined();
          if (requestLogCall) {
            expect(requestLogCall[0]).toContain('[REDACTED]');
            expect(requestLogCall[0]).not.toContain('secret123');
            expect(requestLogCall[0]).toContain('user@example.com');
          }
          done();
        },
      });
    });

    it('tokenフィールドを[REDACTED]に置き換える', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');
      mockRequest.body = {
        data: 'test data',
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          const calls = logSpy.mock.calls as Array<[string]>;
          const requestLogCall = calls.find((call) =>
            call[0].includes('"type":"request"'),
          );
          expect(requestLogCall).toBeDefined();
          if (requestLogCall) {
            expect(requestLogCall[0]).toContain('[REDACTED]');
            expect(requestLogCall[0]).not.toContain(
              'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9',
            );
          }
          done();
        },
      });
    });

    it('secretとapiKeyフィールドも除外する', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');
      mockRequest.body = {
        secret: 'my-secret',
        apiKey: 'api-key-12345',
      };
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          const calls = logSpy.mock.calls as Array<[string]>;
          const requestLogCall = calls.find((call) =>
            call[0].includes('"type":"request"'),
          );
          expect(requestLogCall).toBeDefined();
          if (requestLogCall) {
            const logContent = requestLogCall[0];
            expect(logContent).not.toContain('my-secret');
            expect(logContent).not.toContain('api-key-12345');
          }
          done();
        },
      });
    });

    it('bodyがnullの場合はそのまま返す', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');
      mockRequest.body = null;
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          const calls = logSpy.mock.calls as Array<[string]>;
          const requestLogCall = calls.find((call) =>
            call[0].includes('"type":"request"'),
          );
          expect(requestLogCall).toBeDefined();
          done();
        },
      });
    });

    it('bodyがオブジェクトでない場合はそのまま返す', (done) => {
      const logSpy = jest.spyOn(interceptor['logger'], 'log');
      mockRequest.body = 'plain string';
      mockCallHandler.handle = jest.fn().mockReturnValue(of({}));

      interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
        complete: () => {
          const calls = logSpy.mock.calls as Array<[string]>;
          const requestLogCall = calls.find((call) =>
            call[0].includes('"type":"request"'),
          );
          expect(requestLogCall).toBeDefined();
          if (requestLogCall) {
            expect(requestLogCall[0]).toContain('plain string');
          }
          done();
        },
      });
    });
  });
});
