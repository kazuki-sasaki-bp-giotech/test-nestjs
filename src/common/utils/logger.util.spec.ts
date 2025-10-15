import { LoggerUtil, RequestLog, ResponseLog, ErrorLog } from './logger.util';

describe('LoggerUtil', () => {
  describe('generateRequestId', () => {
    it('UUID形式のリクエストIDを生成する', () => {
      const requestId = LoggerUtil.generateRequestId();

      // UUID v4形式をチェック (xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(requestId).toMatch(uuidRegex);
    });

    it('呼び出すたびに異なるリクエストIDを生成する', () => {
      const requestId1 = LoggerUtil.generateRequestId();
      const requestId2 = LoggerUtil.generateRequestId();

      expect(requestId1).not.toBe(requestId2);
    });
  });

  describe('formatLog', () => {
    it('RequestLogをJSON文字列にフォーマットする', () => {
      const requestLog: RequestLog = {
        type: 'request',
        requestId: 'test-request-id',
        timestamp: '2025-10-15T12:34:56.789Z',
        method: 'GET',
        url: '/api/v1/todos',
        body: { title: 'Test' },
        query: { page: '1' },
        params: {},
      };

      const formatted = LoggerUtil.formatLog(requestLog);
      const parsed = JSON.parse(formatted) as RequestLog;

      expect(parsed).toEqual(requestLog);
      expect(parsed.type).toBe('request');
      expect(parsed.requestId).toBe('test-request-id');
    });

    it('ResponseLogをJSON文字列にフォーマットする', () => {
      const responseLog: ResponseLog = {
        type: 'response',
        requestId: 'test-request-id',
        timestamp: '2025-10-15T12:34:56.889Z',
        method: 'GET',
        url: '/api/v1/todos',
        statusCode: 200,
        responseTime: 100,
      };

      const formatted = LoggerUtil.formatLog(responseLog);
      const parsed = JSON.parse(formatted) as ResponseLog;

      expect(parsed).toEqual(responseLog);
      expect(parsed.type).toBe('response');
      expect(parsed.responseTime).toBe(100);
    });

    it('ErrorLogをJSON文字列にフォーマットする', () => {
      const errorLog: ErrorLog = {
        type: 'error',
        requestId: 'test-request-id',
        timestamp: '2025-10-15T12:34:56.889Z',
        method: 'GET',
        url: '/api/v1/todos/999',
        responseTime: 50,
        statusCode: 404,
        errorName: 'NotFoundException',
        errorMessage: 'ID 999 のTODOが見つかりません',
        stack: 'Error: ID 999 のTODOが見つかりません\n    at ...',
      };

      const formatted = LoggerUtil.formatLog(errorLog);
      const parsed = JSON.parse(formatted) as ErrorLog;

      expect(parsed).toEqual(errorLog);
      expect(parsed.type).toBe('error');
      expect(parsed.statusCode).toBe(404);
      expect(parsed.errorName).toBe('NotFoundException');
    });

    it('stackプロパティがundefinedでもフォーマットできる', () => {
      const errorLog: ErrorLog = {
        type: 'error',
        requestId: 'test-request-id',
        timestamp: '2025-10-15T12:34:56.889Z',
        method: 'POST',
        url: '/api/v1/todos',
        responseTime: 50,
        statusCode: 500,
        errorName: 'InternalServerError',
        errorMessage: 'Server error',
        stack: undefined,
      };

      const formatted = LoggerUtil.formatLog(errorLog);
      const parsed = JSON.parse(formatted) as ErrorLog;

      expect(parsed).toEqual(errorLog);
      expect(parsed.stack).toBeUndefined();
    });
  });
});
