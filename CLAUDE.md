# CLAUDE.md — 内科ナビ 作業ガイド

このファイルはClaude（claude.ai/Claude Code）がこのリポジトリで作業する際の**唯一のエントリーポイント**。
作業開始時は必ずこのファイルを読み、指定されたガイドを参照すること。

---

## GitHub認証情報

```bash
# リポジトリクローン後、最初に実行
git remote set-url origin https://TOKEN@github.com/aglitch120/naikanavi.git
git config user.email "claude@anthropic.com"
git config user.name "Claude"
```

トークンはセキュリティのためここには記載しない。会話開始時にユーザーから受け取ること。

---

## docs/ フォルダのファイル一覧と役割

| ファイル | 役割 | 参照タイミング |
|---------|------|--------------|
| **ARTICLE_QUALITY_GUIDE.md** | 記事品質の唯一の基準（統合版v2.0）散文・SVG・CTA・リンク・チェック方法 | **記事を書くとき必ず読む** |
| SEO_GUIDELINE.md | キーワード設計・メタデータ・記事作成ルール | 記事を書くとき |
| DESIGN_SYSTEM.md | カラーパレット・SVG仕様・コンポーネント規約 | SVG・UI作成時 |
| IMPLEMENTATION_GUIDE.md | 技術実装・フォルダ構成・デプロイ手順 | 技術的変更時 |
| IMPROVEMENT_ROADMAP.md | 改善計画・タスク進捗管理 | 作業開始・完了時 |
| BUSINESS_OVERVIEW.md | ビジネスモデル・ターゲット・競合 | 戦略判断時 |
| JOSLER_BYOREKI_GUIDELINE.md | 病歴要約・症例登録の例文ルール | 病歴要約記事作成時 |
| keywords/naikanavi_keyword_list.xlsx | キーワードリスト・優先度 | 次の記事を決めるとき |
| check_quality.sh | **廃止** → scripts/check_article_quality_v2.sh を使うこと | 使わない |
| BLOG_CONTENT_GUIDELINE.md | **廃止** → ARTICLE_QUALITY_GUIDE.md に統合済み | 使わない |
| CLAUDE_CODE_QUALITY_GUIDE.md | **廃止** → ARTICLE_QUALITY_GUIDE.md に統合済み | 使わない |

---

## 記事品質チェックスクリプト（唯一の正規スクリプト）

```bash
# リポジトリルートから実行（コミット前に必ず実行）
bash scripts/check_article_quality_v2.sh content/blog/ARTICLE_SLUG.mdx
```

- **不合格（🔴）のままコミット禁止**
- スクリプトを実行せずにコミットすることも禁止
- `./check_article_quality.sh`（ルート）と`docs/check_quality.sh`は旧スクリプトのため使わない

---

## 記事作業フロー（全ステップ必須）

```
1. docs/ARTICLE_QUALITY_GUIDE.md を全文読む
2. docs/SEO_GUIDELINE.md §2, §11 を確認
3. 同クラスターの既存記事を1本通読（内部リンク先把握）
4. Web検索リサーチ（執筆前に必ず実施）
5. 記事執筆（ARTICLE_QUALITY_GUIDE.md の全ルール適用）
6. bash scripts/check_article_quality_v2.sh content/blog/ARTICLE.mdx
7. 全項目✅になるまで修正→再チェックを繰り返す
8. git add <ファイル名>（git add -A 禁止）
9. git commit && git push
10. docs/IMPROVEMENT_ROADMAP.md の [x] を更新してpush
```

---

## リンク切れ予防ルール（最重要）

### 内部リンク（/blog/slug）
リンクを書く前に必ず存在確認：
```bash
ls content/blog/ | grep "スラッグ名"
```
**存在しない記事へのリンクは書かない。テキストのみにする。**

### cta_type（フロントマター）
有効値のみ使用：`template` / `progress` / `quiz` / `checklist` / `general`

### タグ
`lib/blog-config.ts` の `tagSlugMap` に登録済みのタグのみ使用。
未登録タグを使う場合は先に `tagSlugMap` に追加してコミットする。

---

## Git ルール（厳守）

- `git add -A` **禁止** — 必ずファイルを個別指定
- `node_modules/` のコミット **禁止**
- 秘密情報（トークン・APIキー）のコミット **禁止**
- コミット後は必ず **git push**（ローカルだけで終わらせない）

---

## プロジェクト構成

```
naikanavi/
├── CLAUDE.md                    ← このファイル（エントリーポイント）
├── app/                         # Next.js App Router
│   ├── blog/[slug]/page.tsx     # 記事ページ（CTAバナー自動挿入あり）
│   ├── layout.tsx
│   ├── sitemap.ts
│   └── robots.ts
├── content/blog/                # MDX記事（A〜Nクラスター）
├── components/blog/             # UIコンポーネント（CTA・TOC・ShareButtons等）
├── lib/
│   ├── blog-config.ts           # カテゴリ・CTA・タグスラッグ定義（リンク切れの根源）
│   ├── mdx.ts                   # MDXパース
│   └── seo.ts                   # SEOメタデータ生成
├── docs/                        # ガイドライン（ARTICLE_QUALITY_GUIDE.md が中心）
├── scripts/
│   └── check_article_quality_v2.sh  ← 唯一の正規チェックスクリプト
└── public/images/blog/          # 記事内SVG画像
```

---

## クイックコマンド

```bash
npm run dev        # 開発サーバー起動
npm run build      # 本番ビルド
git push           # Cloudflare Pagesに自動デプロイ
```

本番URL: https://naikanavi.com

---

## モデル選択ガイド

通常の記事作成・バグ修正は **Sonnet** で十分。以下の場合は **Opus を推奨**：
- アーキテクチャ設計・大規模リファクタリング
- SEO戦略の立案・競合分析
- 難解なバグ調査（複数ファイルにまたがる）
- ピラー記事（5000字以上の新規作成）
