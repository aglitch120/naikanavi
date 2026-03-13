# CLAUDE.md

このファイルはClaude（claude.ai/Claude Code）がこのリポジトリで作業する際のガイドラインです。

---

## GitHub認証情報

```bash
# リポジトリクローン後、最初に実行
git remote set-url origin https://TOKEN@github.com/aglitch120/naikanavi.git
git config user.email "claude@anthropic.com"
git config user.name "Claude"
```

**注意**: トークンはセキュリティのためここには記載しない。会話開始時にユーザーから受け取ること。

---

## 作業ルール

### 1. 作業開始時に必ず行うこと
- リポジトリをcloneして最新状態を確認する
- `docs/` フォルダ内の以下のガイドラインを読み、内容に従うこと：
  - `docs/DESIGN_SYSTEM.md` — カラー・タイポグラフィ・コンポーネント規約
  - `docs/SEO_GUIDELINE.md` — 記事作成ルール・KW設計・メタデータ
  - `docs/IMPLEMENTATION_GUIDE.md` — 技術実装・フォルダ構成・デプロイ手順
  - `docs/IMPROVEMENT_ROADMAP.md` — 改善計画・タスク進捗管理
  - `docs/BUSINESS_OVERVIEW.md` — ビジネスモデル・ターゲット

### 2. 作業中のルール
- 小さなタスク（1機能、1修正）ごとにコミットする
- 長時間作業は30分ごとに中間コミットする
- 長い作業（10分以上）は途中で進捗を報告する

### 3. タスク完了時に必ず行うこと
- `docs/IMPROVEMENT_ROADMAP.md` のチェックマークを更新する（`[ ]` → `[x]`）
- 「次のアクション」セクションを最新状態に保つ
- **必ず `git push` する**（pushしないと作業が反映されない）

---

## Git ルール（厳守）

### 禁止事項
- **`git add -A` 禁止** — 意図しないファイル（.env、credentials、巨大バイナリ等）がコミットされるリスクがあるため、必ずファイルを個別に指定して `git add` すること
- **`node_modules/` のコミット禁止** — `.gitignore` に含まれているが、万が一追跡対象になっていないか注意すること
- **秘密情報（トークン、APIキー、パスワード等）をコミットしない**

### コミットメッセージ
- 変更内容が分かる簡潔な日本語または英語で記述
- 例: `Add D15: ○○の記事`, `Fix: MDXレンダリングの修正`, `Update keyword list`

---

## クイックコマンド

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# Cloudflare Workers起動
npx wrangler dev

# デプロイ（git pushで Cloudflare Pages に自動デプロイ）
git push
```

---

## プロジェクト構成

```
naikanavi/
├── app/                        # Next.js App Router
│   ├── blog/[slug]/            # 記事ページ
│   ├── layout.tsx              # 共通レイアウト
│   ├── sitemap.ts              # 動的サイトマップ
│   └── robots.ts               # robots.txt
├── content/articles/            # MDX記事
├── components/                  # UIコンポーネント
│   ├── blog/                   # ブログ関連（ArticleCard, TOC, CTA等）
│   └── seo/                    # 構造化データ（JSON-LD）
├── lib/                        # ユーティリティ（mdx.ts, seo.ts等）
├── docs/                       # ドキュメント（ガイドライン・ロードマップ）
│   ├── DESIGN_SYSTEM.md
│   ├── SEO_GUIDELINE.md
│   ├── IMPLEMENTATION_GUIDE.md
│   ├── IMPROVEMENT_ROADMAP.md
│   ├── BUSINESS_OVERVIEW.md
│   └── keywords/               # キーワードリスト
├── public/                     # 静的アセット
├── demo_v14_app.html           # メインアプリ（単一HTML）
└── worker.js                   # Cloudflare Workers API
```

---

## 重要な注意事項

1. **MDX記事**: `content/articles/` に配置。SEOガイドラインに従って作成すること
2. **構造化データ**: 各記事に JSON-LD を設定（Article, FAQ, Breadcrumb等）
3. **デザイン**: `docs/DESIGN_SYSTEM.md` のカラーパレット・コンポーネント規約に従う
4. **デプロイ**: `git push` で Cloudflare Pages に自動デプロイ
5. **本番URL**: https://naikanavi.com
