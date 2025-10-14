# Claude Code 開発ガイドライン

## コミットメッセージ
- コミットメッセージは日本語で記述すること
- 変更内容を簡潔に説明する

## コード品質
- コードを修正した場合は、必ず `npm run lint` でlintチェックを実行すること
- lintエラーがある場合は修正してからコミットすること

## Dev Container
- 開発に新しい依存関係（npm パッケージ、グローバルツールなど）が必要になった場合は、`.devcontainer/` の設定も更新すること
- VSCode 拡張機能が必要な場合は `devcontainer.json` の `extensions` に追加すること
- セットアップスクリプトの変更が必要な場合は `.devcontainer/post-create.sh` を更新すること
