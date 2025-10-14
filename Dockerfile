# ビルドステージ
FROM node:20-alpine AS builder

WORKDIR /app

# 依存関係のインストール
COPY package*.json ./
RUN npm ci --only=production && \
    npm cache clean --force

# ソースコードのコピーとビルド
COPY . .
RUN npm run build

# 本番ステージ
FROM node:20-alpine

WORKDIR /app

# 非rootユーザーの作成
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

# ビルド成果物と依存関係のコピー
COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/package*.json ./

# 非rootユーザーに切り替え
USER nestjs

# ポート公開
EXPOSE 3001

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# アプリケーション起動
CMD ["node", "dist/main"]
