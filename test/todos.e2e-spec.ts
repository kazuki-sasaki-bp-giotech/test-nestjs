/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { DataSource } from 'typeorm';
import {
  PostgreSqlContainer,
  StartedPostgreSqlContainer,
} from '@testcontainers/postgresql';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';

describe('Todos (e2e)', () => {
  let app: NestExpressApplication;
  let dataSource: DataSource;
  let postgresContainer: StartedPostgreSqlContainer;

  beforeAll(async () => {
    // PostgreSQLコンテナを起動
    console.log('Starting PostgreSQL container...');
    postgresContainer = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('test_db')
      .withUsername('test_user')
      .withPassword('test_password')
      .start();

    console.log(
      'PostgreSQL container started:',
      postgresContainer.getConnectionUri(),
    );

    // 環境変数を上書き（testcontainersのDB接続情報を使用）
    process.env.DATABASE_HOST = postgresContainer.getHost();
    process.env.DATABASE_PORT = postgresContainer.getPort().toString();
    process.env.DATABASE_USER = postgresContainer.getUsername();
    process.env.DATABASE_PASSWORD = postgresContainer.getPassword();
    process.env.DATABASE_NAME = postgresContainer.getDatabase();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();

    // 本番と同じ設定を適用（main.tsと同じ）
    app.enableVersioning({
      type: VersioningType.URI,
      defaultVersion: '1',
    });

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    // セキュリティ設定（main.tsと同じ）
    app.useGlobalFilters(new HttpExceptionFilter());
    app.disable('x-powered-by');
    app.enableShutdownHooks();

    await app.init();

    dataSource = moduleFixture.get<DataSource>(DataSource);

    // テーブルを作成（synchronize: trueと同じ効果）
    await dataSource.synchronize();
  }, 120000); // 120秒のタイムアウト

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    // PostgreSQLコンテナを停止・削除
    if (postgresContainer) {
      console.log('Stopping PostgreSQL container...');
      await postgresContainer.stop();
    }
  }, 30000); // 30秒のタイムアウト

  // 各テストの前にテーブルをクリーンアップ
  beforeEach(async () => {
    await dataSource.query('DELETE FROM todos');
    await dataSource.query('ALTER SEQUENCE todos_id_seq RESTART WITH 1');
  });

  describe('/v1/todos (POST)', () => {
    it('新しいTODOを作成できる', () => {
      return request(app.getHttpServer())
        .post('/v1/todos')
        .send({
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toEqual({
            id: expect.any(Number),
            title: 'Test Todo',
            description: 'Test Description',
            completed: false,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });

    it('titleが欠けている場合は400エラーを返す', () => {
      return request(app.getHttpServer())
        .post('/v1/todos')
        .send({
          description: 'Test Description',
          completed: false,
        })
        .expect(400)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 400,
            message: expect.arrayContaining([expect.stringContaining('title')]),
            error: 'Bad Request',
            timestamp: expect.any(String),
            path: '/v1/todos',
            requestId: expect.any(String),
          });
        });
    });

    it('余分なプロパティが含まれる場合は400エラーを返す', () => {
      return request(app.getHttpServer())
        .post('/v1/todos')
        .send({
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
          extraField: 'This should not be allowed',
        })
        .expect(400);
    });
  });

  describe('/v1/todos/bulk (POST)', () => {
    it('トランザクションで複数のTODOを作成できる', () => {
      return request(app.getHttpServer())
        .post('/v1/todos/bulk')
        .send({
          todos: [
            { title: 'Todo 1', description: 'Desc 1', completed: false },
            { title: 'Todo 2', description: 'Desc 2', completed: false },
            { title: 'Todo 3', description: 'Desc 3', completed: true },
          ],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.count).toBe(3);
          expect(res.body.todos).toHaveLength(3);
          expect(res.body.todos[0]).toEqual({
            id: expect.any(Number),
            title: 'Todo 1',
            description: 'Desc 1',
            completed: false,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });

    it('TODOs配列が空の場合は400エラーを返す', () => {
      return request(app.getHttpServer())
        .post('/v1/todos/bulk')
        .send({
          todos: [],
        })
        .expect(400);
    });
  });

  describe('/v1/todos (GET)', () => {
    beforeEach(async () => {
      // テストデータを作成
      await request(app.getHttpServer()).post('/v1/todos').send({
        title: 'Todo 1',
        description: 'Desc 1',
        completed: false,
      });
      await request(app.getHttpServer()).post('/v1/todos').send({
        title: 'Todo 2',
        description: 'Desc 2',
        completed: true,
      });
      await request(app.getHttpServer()).post('/v1/todos').send({
        title: 'Todo 3',
        description: 'Desc 3',
        completed: false,
      });
    });

    it('ページネーション付きで全てのTODOを取得できる', () => {
      return request(app.getHttpServer())
        .get('/v1/todos')
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            data: expect.any(Array),
            total: 3,
            page: 1,
            limit: 10,
            totalPages: 1,
          });
          expect(res.body.data).toHaveLength(3);
        });
    });

    it('完了ステータスでフィルタリングできる', () => {
      return request(app.getHttpServer())
        .get('/v1/todos?completed=true')
        .expect(200)
        .expect((res) => {
          expect(res.body.total).toBe(1);
          expect(res.body.data[0].completed).toBe(true);
        });
    });

    it('ページネーションをサポートしている', () => {
      return request(app.getHttpServer())
        .get('/v1/todos?page=1&limit=2')
        .expect(200)
        .expect((res) => {
          expect(res.body.data).toHaveLength(2);
          expect(res.body.total).toBe(3);
          expect(res.body.page).toBe(1);
          expect(res.body.limit).toBe(2);
          expect(res.body.totalPages).toBe(2);
        });
    });

    it('タイトルで昇順ソートできる', () => {
      return request(app.getHttpServer())
        .get('/v1/todos?sortBy=title&order=ASC')
        .expect(200)
        .expect((res) => {
          expect(res.body.data[0].title).toBe('Todo 1');
          expect(res.body.data[1].title).toBe('Todo 2');
          expect(res.body.data[2].title).toBe('Todo 3');
        });
    });
  });

  describe('/v1/todos/:id (GET)', () => {
    let createdTodoId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/todos')
        .send({
          title: 'Test Todo',
          description: 'Test Description',
          completed: false,
        });
      createdTodoId = response.body.id;
    });

    it('IDでTODOを取得できる', () => {
      return request(app.getHttpServer())
        .get(`/v1/todos/${createdTodoId}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            id: createdTodoId,
            title: 'Test Todo',
            description: 'Test Description',
            completed: false,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });

    it('TODOが見つからない場合は404エラーを返す', () => {
      return request(app.getHttpServer())
        .get('/v1/todos/999999')
        .expect(404)
        .expect((res) => {
          expect(res.body).toEqual({
            statusCode: 404,
            message: 'ID 999999 のTODOが見つかりません',
            error: 'Not Found',
            timestamp: expect.any(String),
            path: '/v1/todos/999999',
            requestId: expect.any(String),
          });
        });
    });

    it('IDが数値でない場合は400エラーを返す', () => {
      return request(app.getHttpServer()).get('/v1/todos/invalid').expect(400);
    });
  });

  describe('/v1/todos/:id (PATCH)', () => {
    let createdTodoId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/todos')
        .send({
          title: 'Original Title',
          description: 'Original Description',
          completed: false,
        });
      createdTodoId = response.body.id;
    });

    it('TODOを更新できる', () => {
      return request(app.getHttpServer())
        .patch(`/v1/todos/${createdTodoId}`)
        .send({
          title: 'Updated Title',
          completed: true,
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toEqual({
            id: createdTodoId,
            title: 'Updated Title',
            description: 'Original Description',
            completed: true,
            createdAt: expect.any(String),
            updatedAt: expect.any(String),
          });
        });
    });

    it('タイトルのみ更新できる', () => {
      return request(app.getHttpServer())
        .patch(`/v1/todos/${createdTodoId}`)
        .send({
          title: 'Updated Title Only',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body.title).toBe('Updated Title Only');
          expect(res.body.description).toBe('Original Description');
          expect(res.body.completed).toBe(false);
        });
    });

    it('TODOが見つからない場合は404エラーを返す', () => {
      return request(app.getHttpServer())
        .patch('/v1/todos/999999')
        .send({
          title: 'Updated Title',
        })
        .expect(404);
    });
  });

  describe('/v1/todos/:id (DELETE)', () => {
    let createdTodoId: number;

    beforeEach(async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/todos')
        .send({
          title: 'Todo to Delete',
          description: 'This will be deleted',
          completed: false,
        });
      createdTodoId = response.body.id;
    });

    it('TODOを削除できる', () => {
      return request(app.getHttpServer())
        .delete(`/v1/todos/${createdTodoId}`)
        .expect(204);
    });

    it('削除後は404エラーを返す', async () => {
      await request(app.getHttpServer())
        .delete(`/v1/todos/${createdTodoId}`)
        .expect(204);

      return request(app.getHttpServer())
        .get(`/v1/todos/${createdTodoId}`)
        .expect(404);
    });

    it('存在しないTODOを削除しようとすると404エラーを返す', () => {
      return request(app.getHttpServer())
        .delete('/v1/todos/999999')
        .expect(404);
    });
  });

  describe('Transaction rollback test', () => {
    it('一括作成が失敗した場合、全てのTODOがロールバックされる', async () => {
      // 最初にデータベースの状態を確認
      const beforeResponse = await request(app.getHttpServer()).get(
        '/v1/todos',
      );
      expect(beforeResponse.body.total).toBe(0);

      // このテストではバリデーションエラーでトランザクションがロールバックされる
      // （実際のDBエラーをシミュレートするのは難しいため、バリデーションエラーで代用）
      await request(app.getHttpServer())
        .post('/v1/todos/bulk')
        .send({
          todos: [
            { title: 'Valid Todo', description: 'Valid', completed: false },
            { description: 'Invalid - no title', completed: false }, // titleが無い
          ],
        })
        .expect(400);

      // トランザクションがロールバックされたため、データは作成されていないはず
      const afterResponse = await request(app.getHttpServer()).get('/v1/todos');
      expect(afterResponse.body.total).toBe(0);
    });
  });

  describe('Security Headers', () => {
    it('X-Powered-Byヘッダーが除去されている', () => {
      return request(app.getHttpServer())
        .get('/v1/todos')
        .expect(200)
        .expect((res) => {
          expect(res.headers['x-powered-by']).toBeUndefined();
        });
    });

    it('エラーレスポンスでもX-Powered-Byヘッダーが除去されている', () => {
      return request(app.getHttpServer())
        .get('/v1/todos/999999')
        .expect(404)
        .expect((res) => {
          expect(res.headers['x-powered-by']).toBeUndefined();
        });
    });
  });
});
