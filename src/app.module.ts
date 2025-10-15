import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { HealthModule } from './modules/health/health.module';
import { Todo } from './entities/todo.entity';
import { TodosModule } from './todos/todos.module';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      ...(process.env.NODE_ENV === 'local' || !process.env.NODE_ENV
        ? { envFilePath: '.env.local' }
        : { ignoreEnvFile: true }),
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DATABASE_HOST'),
        port: configService.get<number>('DATABASE_PORT'),
        username: configService.get('DATABASE_USER'),
        password: configService.get('DATABASE_PASSWORD'),
        database: configService.get('DATABASE_NAME'),
        entities: [Todo],
        synchronize: false,
        logging: process.env.NODE_ENV === 'local',
        // コネクションプール設定
        extra: {
          max: configService.get<number>('DB_POOL_MAX', 20), // 最大コネクション数
          min: configService.get<number>('DB_POOL_MIN', 2), // 最小コネクション数
          idleTimeoutMillis: configService.get<number>(
            'DB_POOL_IDLE_TIMEOUT',
            30000,
          ), // アイドル接続のタイムアウト
          connectionTimeoutMillis: configService.get<number>(
            'DB_POOL_CONNECTION_TIMEOUT',
            2000,
          ), // 接続タイムアウト
        },
      }),
    }),
    HealthModule,
    TodosModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
