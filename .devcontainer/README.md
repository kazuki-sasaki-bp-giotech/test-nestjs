# Dev Container 環境構築

このプロジェクトは、Dev Container を使用してローカル開発環境を構築します。

## 構成

- **Backend**: NestJS アプリケーション (Node.js 22)
- **Database**: PostgreSQL 16

## 起動方法

1. VSCode で Dev Container を開く
   - コマンドパレット (`Cmd/Ctrl + Shift + P`) から `Dev Containers: Reopen in Container` を選択

2. Dev Container が起動すると、自動的に以下が実行されます:
   - PostgreSQL コンテナの起動
   - 依存パッケージのインストール (`npm install`)
   - データベースの初期化

## PostgreSQL 接続情報

### Dev Container 内から接続

```bash
# psql コマンドで接続
docker exec -it $(docker ps -qf "name=postgres") psql -U nestjs -d nestjs_dev

# または環境変数経由で接続
psql -h postgres -U nestjs -d nestjs_dev
```

### ホストマシンから接続

**PostgreSQL:**
```
Host: localhost
Port: 5432
Database: nestjs_dev
User: nestjs
Password: nestjs_dev_password
```

**NestJS Backend:**
```
URL: http://localhost:3001
```

### VSCode PostgreSQL 拡張機能

Dev Container には `ckolkman.vscode-postgres` 拡張機能がインストールされます。

接続設定:
- Host: `postgres`
- Port: `5432`
- Database: `nestjs_dev`
- User: `nestjs`
- Password: `nestjs_dev_password`

## 環境変数

環境変数は以下のファイルで管理されています:

- `.env.local`: ローカル開発用の実際の値
- `.env.example`: 環境変数のテンプレート

Dev Container 起動時、以下の環境変数が自動的に設定されます:

```
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USER=nestjs
DATABASE_PASSWORD=nestjs_dev_password
DATABASE_NAME=nestjs_dev
```

## トラブルシューティング

### PostgreSQL に接続できない場合

1. PostgreSQL コンテナが起動しているか確認
   ```bash
   docker ps | grep postgres
   ```

2. ヘルスチェックの状態を確認
   ```bash
   docker ps --format "table {{.Names}}\t{{.Status}}"
   ```

3. PostgreSQL のログを確認
   ```bash
   docker logs $(docker ps -qf "name=postgres")
   ```

### データをリセットしたい場合

```bash
docker-compose -f .devcontainer/docker-compose.yml down -v
```

その後、Dev Container を再起動してください。
