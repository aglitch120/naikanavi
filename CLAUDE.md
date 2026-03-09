# CLAUDE.md

このファイルはClaude（claude.ai）がこのリポジトリで作業する際のガイドラインです。

## ⚠️ 重要: セッション継続性の確保

会話が途中で切れても作業を継続できるよう、以下を必ず守ること：

### 1. こまめにコミット＆プッシュ
- 小さなタスク（1機能、1修正）ごとにコミット
- コミット後は必ずプッシュ
- 長時間作業は30分ごとに中間コミット

### 2. IMPROVEMENT_ROADMAP.md を常に更新
- 作業開始時に `docs/IMPROVEMENT_ROADMAP.md` を確認
- タスク完了ごとにチェックマークを更新（[ ] → [x]）
- 「次のアクション」セクションを最新状態に保つ

### 3. 進捗報告
- 長い作業（10分以上）は途中で進捗を報告
- 「現在○○を実行中」のように状況を伝える

## GitHub認証情報

```bash
# リポジトリクローン後、最初に実行
git remote set-url origin https://TOKEN@github.com/aglitch120/naikanavi.git
git config user.email "claude@anthropic.com"
git config user.name "Claude"
```

**注意**: トークンはセキュリティのためここには記載しない。会話内で都度確認すること。

## クイックコマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# Cloudflare Workers起動
npx wrangler dev
```

## プロジェクト構成

```
naikanavi/
├── app/                    # Next.js App Router
│   ├── blog/[slug]/       # 記事ページ
│   └── layout.tsx         # 共通レイアウト
├── content/articles/       # MDX記事
├── components/             # UIコンポーネント
├── docs/                   # ドキュメント
│   ├── IMPROVEMENT_ROADMAP.md  # 改善計画（最重要）
│   └── ...
├── demo_v14_app.html       # メインアプリ（単一HTML）
└── worker.js               # Cloudflare Workers API
```

## 現在の優先タスク

`docs/IMPROVEMENT_ROADMAP.md` の「次のアクション」セクションを参照。

## 重要な注意事項

1. **MDX記事**: `content/articles/` に配置
2. **構造化データ**: 各記事に JSON-LD を設定
3. **デプロイ**: `git push` で Cloudflare Pages に自動デプロイ
