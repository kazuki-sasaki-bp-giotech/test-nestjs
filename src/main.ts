import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // グローバルExceptionFilterの登録（セキュリティ強化）
  app.useGlobalFilters(new HttpExceptionFilter());

  // X-Powered-Byヘッダーを除去（フレームワーク情報の隠蔽）
  app.disable('x-powered-by');

  // Graceful Shutdownを有効化（ECS Fargate対応）
  app.enableShutdownHooks();

  // APIバージョニング設定（URI方式）
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1', // デフォルトバージョン
  });

  // グローバルValidationPipeを設定
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // DTOに定義されていないプロパティを自動削除
      forbidNonWhitelisted: true, // 余分なプロパティがあればエラー
      transform: true, // プレーンオブジェクトをDTOインスタンスに自動変換
      transformOptions: {
        enableImplicitConversion: true, // 型の暗黙的変換を有効化
      },
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('NestJS TODO API')
    .setDescription('NestJS TODO API ドキュメント')
    .setVersion('1.0')
    .addTag('todos', 'TODO操作')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const port = process.env.PORT ?? 3001;
  await app.listen(Number(port));
}
bootstrap().catch((err) => {
  console.error('Failed to start application:', err);
  process.exit(1);
});
