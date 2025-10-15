import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerUtil, ErrorLog } from '../utils/logger.util';

interface RequestWithTracking extends Request {
  requestId?: string;
  startTime?: number;
}

/**
 * グローバルExceptionFilter
 * - すべての例外をキャッチしてエラーレスポンスを統一
 * - 本番環境ではスタックトレースをレスポンスに含めない
 * - 詳細なエラーログをサーバー側に記録（CloudWatch用）
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithTracking>();

    // Request IDと処理時間を取得（LoggingInterceptorで設定済み）
    const requestId = request.requestId || 'unknown';
    const startTime = request.startTime || Date.now();
    const responseTime = Date.now() - startTime;

    // ステータスコードの決定
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // HttpExceptionの場合、NestJSの標準レスポンス形式を取得
    let errorResponse: Record<string, unknown>;

    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      // NestJSのHttpExceptionは通常オブジェクトで返される
      if (typeof exceptionResponse === 'object') {
        errorResponse = {
          ...(exceptionResponse as Record<string, unknown>),
          timestamp: new Date().toISOString(),
          path: request.url,
          requestId, // フロントエンドがサポートに問い合わせる際に使用
        };
      } else {
        // 文字列の場合（まれなケース）
        errorResponse = {
          statusCode: status,
          message: exceptionResponse,
          timestamp: new Date().toISOString(),
          path: request.url,
          requestId,
        };
      }
    } else if (exception instanceof Error) {
      // 一般的なErrorの場合
      const message =
        process.env.NODE_ENV === 'production'
          ? 'サーバーエラーが発生しました'
          : exception.message;

      errorResponse = {
        statusCode: status,
        message,
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId,
      };

      // 開発環境のみスタックトレースをレスポンスに含める
      if (process.env.NODE_ENV !== 'production') {
        errorResponse.stack = exception.stack;
      }
    } else {
      // 未知のエラータイプ
      errorResponse = {
        statusCode: status,
        message: 'サーバーエラーが発生しました',
        timestamp: new Date().toISOString(),
        path: request.url,
        requestId,
      };
    }

    // 詳細エラーログ（構造化ログ：CloudWatch用）
    const errorLog: ErrorLog = {
      type: 'error',
      requestId,
      timestamp: new Date().toISOString(),
      method: request.method,
      url: request.url,
      responseTime,
      statusCode: status,
      errorName: exception instanceof Error ? exception.name : 'UnknownError',
      errorMessage:
        exception instanceof Error ? exception.message : 'Unknown error',
      stack: exception instanceof Error ? exception.stack : undefined,
      // 将来的にユーザー情報を追加
      // userId: request.user?.id,
    };

    // サーバー側のログ出力（スタックトレース含む）
    this.logger.error(LoggerUtil.formatLog(errorLog));

    response.status(status).json(errorResponse);
  }
}
