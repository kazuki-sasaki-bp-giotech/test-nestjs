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

    // リクエストログ
    this.logger.log(
      `[Request] ${method} ${url} - Body: ${JSON.stringify(body)} - Query: ${JSON.stringify(query)} - Params: ${JSON.stringify(params)}`,
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const responseTime = Date.now() - startTime;
          // レスポンスログ（成功時）
          this.logger.log(
            `[Response] ${method} ${url} - ${responseTime}ms - Status: Success`,
          );
        },
        error: (error: Error) => {
          const responseTime = Date.now() - startTime;
          // レスポンスログ（エラー時）
          this.logger.error(
            `[Response] ${method} ${url} - ${responseTime}ms - Status: Error - Message: ${error.message}`,
          );
        },
      }),
    );
  }
}
