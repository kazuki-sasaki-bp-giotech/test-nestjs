import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request, Response } from 'express';
import { LoggerUtil, RequestLog, ResponseLog } from '../utils/logger.util';

// Requestオブジェクトを拡張してrequestIdとstartTimeを保持
interface RequestWithTracking extends Request {
  requestId: string;
  startTime: number;
}

/**
 * リクエスト/レスポンスのログを記録するインターセプター
 * - リクエスト受信時: Request ID生成 + リクエストログ
 * - レスポンス成功時: レスポンスログ
 * - エラー時: ExceptionFilterに任せる（ログの二重出力を防ぐ）
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<RequestWithTracking>();
    const method = request.method;
    const url = request.url;
    const body = request.body as unknown;
    const query = request.query as unknown;
    const params = request.params as unknown;

    // Request IDを生成してリクエストオブジェクトに保存
    const requestId = LoggerUtil.generateRequestId();
    request.requestId = requestId;

    // 開始時刻を保存（レスポンスタイム計算用）
    const startTime = Date.now();
    request.startTime = startTime;

    const timestamp = new Date().toISOString();

    // リクエストログ（構造化ログ：JSON形式）
    const requestLog: RequestLog = {
      type: 'request',
      requestId,
      timestamp,
      method,
      url,
      body: this.sanitizeBody(body), // センシティブ情報を除外
      query,
      params,
    };
    this.logger.log(LoggerUtil.formatLog(requestLog));

    return next.handle().pipe(
      tap({
        // 成功時のみログ出力
        next: () => {
          const responseTime = Date.now() - startTime;
          const response = context.switchToHttp().getResponse<Response>();

          // レスポンスログ（成功時）
          const successLog: ResponseLog = {
            type: 'response',
            requestId,
            timestamp: new Date().toISOString(),
            method,
            url,
            statusCode: response.statusCode,
            responseTime,
          };
          this.logger.log(LoggerUtil.formatLog(successLog));
        },
        // エラー時はExceptionFilterに任せる（ログの二重出力を防ぐ）
        // ExceptionFilterでrequestIdとstartTimeを使用して完全なエラーログを出力
      }),
    );
  }

  /**
   * センシティブ情報（password等）をログから除外
   */
  private sanitizeBody(body: unknown): unknown {
    if (!body || typeof body !== 'object') return body;

    const sanitized = { ...(body as Record<string, unknown>) };
    const sensitiveFields = ['password', 'token', 'secret', 'apiKey'];

    for (const field of sensitiveFields) {
      if (field in sanitized) {
        sanitized[field] = '[REDACTED]';
      }
    }

    return sanitized;
  }
}
