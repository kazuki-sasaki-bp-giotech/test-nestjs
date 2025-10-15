import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

interface RequestWithDetails {
  method: string;
  url: string;
  body: unknown;
  query: unknown;
  params: unknown;
}

interface RequestLog {
  type: 'request';
  timestamp: string;
  method: string;
  url: string;
  body: unknown;
  query: unknown;
  params: unknown;
}

interface ResponseLog {
  type: 'response';
  timestamp: string;
  method: string;
  url: string;
  responseTime: number;
  status: 'success' | 'error';
  statusCode?: number;
  error?: {
    message: string;
    name: string;
  };
}

/**
 * リクエスト/レスポンスのログを記録するインターセプター
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithDetails>();
    const { method, url, body, query, params } = request;
    const startTime = Date.now();
    const timestamp = new Date().toISOString();

    // リクエストログ（構造化ログ：JSON形式）
    const requestLog: RequestLog = {
      type: 'request',
      timestamp,
      method,
      url,
      body,
      query,
      params,
    };
    this.logger.log(JSON.stringify(requestLog));

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          const response = context
            .switchToHttp()
            .getResponse<{ statusCode: number }>();

          // レスポンスログ（成功時）
          const successLog: ResponseLog = {
            type: 'response',
            timestamp: new Date().toISOString(),
            method,
            url,
            statusCode: response.statusCode,
            responseTime,
            status: 'success',
          };
          this.logger.log(JSON.stringify(successLog));
        },
        error: (error: Error) => {
          const responseTime = Date.now() - startTime;

          // レスポンスログ（エラー時）
          const errorLog: ResponseLog = {
            type: 'response',
            timestamp: new Date().toISOString(),
            method,
            url,
            responseTime,
            status: 'error',
            error: {
              message: error.message,
              name: error.name,
            },
          };
          this.logger.error(JSON.stringify(errorLog));
        },
      }),
    );
  }
}
