import { randomUUID } from 'crypto';

export interface BaseLog {
  requestId: string;
  timestamp: string;
  method: string;
  url: string;
}

export interface RequestLog extends BaseLog {
  type: 'request';
  body?: unknown;
  query?: unknown;
  params?: unknown;
}

export interface ResponseLog extends BaseLog {
  type: 'response';
  responseTime: number;
  statusCode: number;
}

export interface ErrorLog extends BaseLog {
  type: 'error';
  responseTime: number;
  statusCode: number;
  errorName: string;
  errorMessage: string;
  stack?: string;
  // 将来的に追加
  userId?: string;
  context?: Record<string, unknown>;
}

export class LoggerUtil {
  static generateRequestId(): string {
    return randomUUID();
  }

  static formatLog(log: RequestLog | ResponseLog | ErrorLog): string {
    return JSON.stringify(log);
  }
}
