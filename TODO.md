# TODO: セキュリティ強化とCI/CD実装

## ✅ 実装完了サマリー

**Phase 1B: アプリケーション層セキュリティ（完了）**
- ✅ グローバルExceptionFilter（エラーハンドリング統一、Request ID追跡）
- ✅ X-Powered-Byヘッダー除去（フレームワーク情報隠蔽）
- ✅ Request ID追跡（UUID v4、全ログ・レスポンスに含む）
- ✅ Graceful Shutdown（`enableShutdownHooks()`）
- ✅ 構造化ログ（JSON形式、CloudWatch Logs対応）
- ✅ E2Eテスト（22テスト全てパス、TestContainers使用）
- ✅ ユニットテスト（52テスト全てパス）

**テスト状況:**
- ユニットテスト: 52/52 ✓
- E2Eテスト: 22/22 ✓
- Lintエラー: 0 ✓

---

## 📝 Note: BFF経由JSON APIサーバーのセキュリティ方針

このAPIサーバーはBFF経由でのみアクセスされ、直接ブラウザにHTMLをレンダリングしないため、
Helmet等のブラウザ向けセキュリティヘッダー（CSP, X-Frame-Options等）は不要と判断しました。

Rate Limitingはインフラ層（AWS WAF）で実装し、アプリケーション層の負荷を削減します。

## 🛡️ インフラ層セキュリティ（AWS）

### 1. AWS WAF Rate Limiting - **最優先**
- [ ] Web ACLの作成（Terraform/CloudFormation）
- [ ] Rate-based Ruleの設定
  - [ ] グローバルIP単位の制限（例：5分間で1000リクエスト）
  - [ ] URI別の制限（例：`/api/v1/todos/bulk`は5分間で100リクエスト）
  - [ ] 評価ウィンドウの設定（1分/5分/10分）
- [ ] ALBとの関連付け
- [ ] CloudWatch Logsの設定（ブロックログ記録）
- [ ] アラート設定（Rate Limit超過時）

### 2. ALB設定
- [ ] アクセスログ有効化（S3）
- [ ] Connection Draining設定
- [ ] ヘルスチェック最適化

## 🔒 アプリケーション層セキュリティ

### 3. グローバルExceptionFilter - ✅ **完了**
- [x] `src/common/filters/http-exception.filter.ts`を作成
- [x] エラーレスポンスの標準化（エラーコード、メッセージ、タイムスタンプ）
- [x] 本番環境でのスタックトレース非表示
- [x] エラーログ出力（構造化ログ）
- [x] `main.ts`でグローバルフィルターを登録
- [x] Request ID追跡の統合
- [x] NestJS標準エラー形式との互換性確保
- [x] ユニットテスト作成（12テスト）
- [x] E2Eテスト追加（Security Headers）

### 4. CORS設定
- [ ] 本番環境用のCORS設定を追加
- [ ] 環境変数でallowedOriginsを管理（BFFのURLのみ許可）
- [ ] credentialsオプションの設定

### 5. リクエストボディサイズ制限
- [ ] JSONボディサイズの制限設定（デフォルト1MB推奨）
- [ ] 一括作成エンドポイント用のサイズ制限調整
- [ ] ファイルアップロードサイズの制限（将来的に必要な場合）

### 6. X-Powered-By ヘッダー除去 - ✅ **完了**
- [x] `main.ts`で`app.disable('x-powered-by')`を追加
- [x] フレームワーク情報を隠蔽
- [x] E2Eテストで検証（正常系・エラー系両方）

### 7. Request ID追跡 - ✅ **完了**
- [x] UUID v4形式のRequest ID生成（`LoggerUtil.generateRequestId()`）
- [x] LoggingInterceptorでRequest ID生成・リクエストに保存
- [x] 全ログにRequest ID含める（リクエスト・レスポンス・エラー）
- [x] クライアントレスポンスにRequest ID含める（`requestId`フィールド）
- [x] 同一Request IDでリクエスト全体を追跡可能

## 🔐 認証・認可（オプション）

### 8. BFF-API間の認証（将来的に実装）
- [ ] API Keyベースの認証、またはJWT検証
- [ ] BFFからのリクエストに認証ヘッダー追加
- [ ] カスタムGuardの実装
- [ ] 認証失敗時のエラーハンドリング

### 9. JWT認証（エンドユーザー認証が必要な場合）
- [ ] `@nestjs/passport`と`@nestjs/jwt`をインストール
- [ ] AuthModuleの作成
- [ ] JWTストラテジーの実装
- [ ] AuthGuardの実装
- [ ] ユーザーエンティティの追加

## 🧪 テスト実装

### 10. E2Eテストの実装 - ✅ **完了**
- [x] `test/todos.e2e-spec.ts`の完全実装
- [x] TestContainersを使った実PostgreSQL環境でのテスト
- [x] 全エンドポイントのE2Eテスト（CRUD + 一括作成）
- [x] エラーケースのテスト（404, 400等）
- [x] Security Headersのテスト（X-Powered-By除去）
- [x] トランザクションロールバックのテスト

### 11. テストカバレッジ向上 - ✅ **部分完了**
- [x] Interceptorのテスト追加（LoggingInterceptor: 11テスト）
- [x] ExceptionFilterのテスト追加（HttpExceptionFilter: 12テスト）
- [x] LoggerUtilのテスト追加（6テスト）
- [ ] カバレッジ目標：80%以上（現状確認が必要）
- [ ] Mapperのテスト追加

## 🚀 CI/CD

### 12. GitHub Actions設定
- [ ] `.github/workflows/ci.yml`作成
  - [ ] Lint実行
  - [ ] ユニットテスト実行
  - [ ] E2Eテスト実行（TestContainers使用）
  - [ ] テストカバレッジレポート
  - [ ] ビルド確認
- [ ] `.github/workflows/docker-build.yml`作成
  - [ ] Dockerイメージビルド
  - [ ] イメージのタグ付け（バージョン、latest）
  - [ ] ECRへのプッシュ

## 📦 本番運用対応

### 13. Graceful Shutdown - ✅ **完了**
- [x] `main.ts`で`app.enableShutdownHooks()`を追加
- [x] NestJSライフサイクルフックによるシグナルハンドリング（SIGTERM, SIGINT）
- [x] データベース接続のクリーンアップ（自動）
- [x] 進行中のリクエストの完了待機（自動）
- [ ] ECS Fargate terminationGracePeriodSecondsと連携（インフラ設定時）

### 14. docker-compose（本番用）
- [ ] `docker-compose.prod.yml`作成
- [ ] アプリケーション + PostgreSQL構成
- [ ] ボリューム設定（データ永続化）
- [ ] ヘルスチェック設定
- [ ] リソース制限設定

### 15. 環境変数の整理
- [ ] 必須環境変数のバリデーション追加（@nestjs/config）
- [ ] `.env.development`、`.env.production`のテンプレート作成
- [ ] ECS Task Definitionの環境変数マッピング

## 🛠️ 開発体験向上

### 16. Git Hooks（Husky）
- [ ] Huskyのインストール
- [ ] pre-commitフック（lint + format）
- [ ] commit-msgフック（Commitlint）

### 17. Commitlint
- [ ] Commitlintのインストール
- [ ] コミットメッセージ規約の設定（日本語対応）
- [ ] 設定ファイル作成

## 📊 モニタリング（将来的に実装）

### 18. ヘルスチェック強化
- [ ] データベース接続チェック
- [ ] メモリ使用量チェック
- [ ] ディスク使用量チェック

### 19. CloudWatch統合
- [ ] アプリケーションログのCloudWatch Logs転送
- [ ] カスタムメトリクスの送信
- [ ] アラーム設定（エラー率、レスポンスタイム等）

### 20. メトリクス（オプション）
- [ ] Prometheusメトリクス追加
- [ ] `/metrics`エンドポイント

## 優先順位

### 🔴 Phase 1A: インフラ層セキュリティ（AWS） - **未実装**
1. **AWS WAF Rate Limiting** - DDoS対策、API乱用防止（最優先）
2. **ALB設定** - アクセスログ、Connection Draining

### ✅ Phase 1B: アプリケーション層セキュリティ - **完了**
3. ✅ **グローバルExceptionFilter** - エラー情報漏洩防止、Request ID追跡
4. **CORS設定** - BFFのみからのアクセス許可（未実装）
5. **リクエストボディサイズ制限** - DoS攻撃防止（未実装）
6. ✅ **X-Powered-By除去** - フレームワーク情報の隠蔽
7. ✅ **Graceful Shutdown** - ECS Fargate対応
8. ✅ **構造化ログ（JSON形式）** - CloudWatch Logs対応

### 🟡 Phase 2: テストとCI/CD - **部分完了**
9. ✅ **E2Eテスト完全実装**（TestContainers使用） - 22テスト全てパス
10. **GitHub Actions（CI/CD）** - 未実装
11. **ECRへのDockerイメージプッシュ** - 未実装

### 🟢 Phase 3: 本番運用準備 - **部分完了**
12. ✅ **Graceful Shutdown**（ECS Fargate対応）
13. **環境変数バリデーション** - 未実装
14. **CloudWatch統合**（ログ・メトリクス・アラーム） - ログ形式は準備完了、転送設定は未実装
15. **docker-compose.prod.yml**（ローカル検証用） - 未実装

### 🟢 Phase 4: 開発体験向上 - **未実装**
16. **Husky + Commitlint** - 未実装
17. **テストカバレッジ80%達成** - 現状確認が必要

### 🔵 Phase 5: 将来的な拡張
18. **BFF-API間の認証**（API Key/JWT） - 未実装
19. ✅ **Request ID追跡** - 完了（Phase 1Bで実装済み）
20. **Prometheusメトリクス** - 未実装
