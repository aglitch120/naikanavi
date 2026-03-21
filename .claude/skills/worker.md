---
name: worker
description: Cloudflare Worker API（認証・データ同期・AI面接・論文フィード）の実装・修正時に使う。
---

# Worker スキル

## 対象ファイル
- `workers/api.js` — メインWorker API（全エンドポイント）
- `workers/wrangler.toml` — Wrangler設定

## KVバインディング
- `IWOR_KV` — メインKVストア
- キープレフィックス: `order:`, `user:`, `session:`, `dashboard:`, `josler:`, `matching-profile:`, `rate:`, `journal:`

## Secrets
- `ADMIN_KEY` — 管理者API認証
- `GAS_KEY` — GAS連携認証

## エンドポイント一覧
- `POST /api/store-order` — GAS→注文保存（X-Api-Key認証）
- `POST /api/register` — 会員登録
- `POST /api/login` — ログイン（IP単位レート制限: 10回/15分）
- `POST /api/reset-password` — パスワードリセット
- `PUT /api/profile` — プロフィール更新（Bearer認証+期限チェック）
- `PUT/GET /api/dashboard` — ダッシュボード（Bearer認証+期限チェック）
- `PUT/GET /api/josler` — J-OSLER（Bearer認証+期限チェック）
- `PUT/GET /api/matching-profile` — マッチング（Bearer認証+期限チェック）
- `POST /api/interview-feedback` — AI面接（PRO: 無制限 / FREE: 5回/日IP制限）
- `GET /api/journal` — 論文フィード（PubMedキャッシュ1時間）
- Admin系: `GET /api/admin/orders`, `GET /api/admin/users`, `POST /api/admin/add-order`, `DELETE /api/admin/order`（全てX-Admin-Key認証）

## セキュリティ実装済み
- `authenticate()` ヘルパー: セッション認証+プラン有効期限チェック
- `parseBody()`: 安全なJSONパース（SyntaxError防止）
- `checkPayloadSize()`: 1MB上限
- ログインレート制限: IP単位10回/15分
- systemPromptサーバー固定（プロンプトインジェクション対策）
- Cache-Control: no-store

## 未着手セキュリティ
- パスワードハッシュ: SHA-256→PBKDF2移行（既存ユーザー移行必要）
- SALT: ハードコード→ユーザーごとランダム化

## デプロイ
```bash
cd workers && npx wrangler deploy
```
