# 内科ナビ SEOブログ 実装ガイド

## 📁 プロジェクト構成

```
naikanavi.com/
├── app/
│   ├── layout.tsx                 # ルートレイアウト（グローバルメタデータ）
│   ├── page.tsx                   # 既存のアプリ（/）
│   ├── blog/
│   │   ├── page.tsx               # ブログ一覧（/blog）
│   │   ├── [slug]/
│   │   │   └── page.tsx           # 記事詳細（/blog/xxx）
│   │   └── category/
│   │       └── [category]/
│   │           └── page.tsx       # カテゴリ別（/blog/category/xxx）
│   ├── admin/                     # 管理画面（Phase 2）
│   │   ├── page.tsx               # ダッシュボード
│   │   ├── articles/page.tsx      # 記事管理
│   │   ├── seo-health/page.tsx    # SEOヘルスチェック
│   │   └── generate/page.tsx      # Claude API連携記事生成
│   ├── sitemap.ts                 # 動的サイトマップ
│   └── robots.ts                  # robots.txt
├── content/
│   └── blog/
│       ├── b01-josler-byoreki-youyaku-kakikata.mdx
│       └── ...                    # 240記事
├── components/
│   ├── blog/
│   │   ├── ArticleCard.tsx        # 記事カード
│   │   ├── ArticleHeader.tsx      # 記事ヘッダー
│   │   ├── TableOfContents.tsx    # 目次（スクロール追従）
│   │   ├── RelatedPosts.tsx       # 関連記事
│   │   ├── CTABanner.tsx          # CTA共通コンポーネント
│   │   ├── Breadcrumb.tsx         # パンくずリスト
│   │   └── ShareButtons.tsx       # SNSシェアボタン
│   └── seo/
│       ├── ArticleJsonLd.tsx      # Article構造化データ
│       ├── BreadcrumbJsonLd.tsx   # パンくず構造化データ
│       └── OrganizationJsonLd.tsx # 組織構造化データ
├── lib/
│   ├── mdx.ts                     # MDXパーサー・取得関数
│   ├── seo.ts                     # メタデータビルダー
│   └── blog-config.ts             # ブログ設定（カテゴリ・CTA等）
├── public/
│   ├── og/                        # OGP画像
│   └── blog/                      # ブログ用アセット
└── styles/
    └── blog.css                   # ブログ専用スタイル
```

## 🎨 デザインシステム

### カラーパレット（既存アプリと統一）
```css
:root {
  --bg: #F5F4F0;      /* ページ背景 */
  --s0: #FEFEFC;      /* カード表面 */
  --s1: #F0EDE7;      /* ネスト背景 */
  --br: #DDD9D2;      /* ボーダー */
  --tx: #1A1917;      /* メインテキスト */
  --m: #6B6760;       /* ミュートテキスト */
  --ac: #1B4F3A;      /* グリーンアクセント */
  --acl: #E8F0EC;     /* アクセント薄 */
}
```

### クラスターカラー
| クラスター | 背景色 | 用途 |
|-----------|--------|------|
| A: J-OSLER基礎 | `#1E3A5F` | 信頼感（ネイビー） |
| B: 症例登録 | `#3D5A80` | 実務（ブルー） |
| C: 病歴要約 | `#1B4F3A` | ブランドカラー（グリーン） |
| D: 疾患別病歴要約 | `#2D6A4F` | 効率（ティール） |
| E: 進捗管理 | `#0D7377` | 管理（ダークシアン） |
| F: JMECC・講習 | `#4A5568` | 講習（グレー） |
| G: 内科専門医試験 | `#7F1D1D` | 緊急（レッド） |
| H: 試験領域別 | `#9B2C2C` | 試験（ダークレッド） |
| I: 総合内科専門医 | `#B7410E` | 上級（オレンジレッド） |
| J: AI・ツール | `#4338CA` | テック（インディゴ） |
| K: メンタル・生活 | `#134E4A` | 癒し（ダークティール） |
| L: バイト・収入 | `#4C1D95` | 副収入（パープル） |
| M: 税金・節税 | `#92400E` | お金（オレンジ） |
| N: キャリア | `#2B6CB0` | 成長（ブルー） |
| O: 学会・論文 | `#6D28D9` | 学術（バイオレット） |
| P: 結婚・出産 | `#9D174D` | ライフ（ピンク） |
| Q: サブスペJ-OSLER | `#5B6ABF` | サブスペ（スレートブルー） |
| R: その他 | `#6B6760` | その他（グレー） |

## 📊 トピッククラスター設計

### ピラーページ（4個）
1. **J-OSLER完全攻略ガイド** (`/blog/josler-complete-guide`)
   - クラスター: A + B + C + D + E + F（J-OSLER基礎・症例登録・病歴要約・疾患別・進捗管理・JMECC）
   - ターゲットKW: 「J-OSLER」「内科専門医」「病歴要約」

2. **内科専門医試験対策ガイド** (`/blog/exam-preparation-guide`)
   - クラスター: G + H + I（内科専門医試験・試験領域別・総合内科専門医）
   - ターゲットKW: 「内科専門医試験」「筆記試験対策」

3. **内科専攻医の効率化ガイド** (`/blog/efficiency-guide`)
   - クラスター: J（AI・ツール）
   - ターゲットKW: 「J-OSLER AI」「医師 効率化ツール」

4. **内科専攻医のお金とキャリア** (`/blog/money-career-guide`)
   - クラスター: K + L + M + N + O + P（メンタル・バイト・税金・キャリア・学会・結婚）
   - ターゲットKW: 「医師バイト」「確定申告 医師」「内科専門医 キャリア」

### 内部リンク構造
```
ピラーページ
├── クラスターA記事1 ←→ クラスターA記事2
├── クラスターA記事2 ←→ クラスターA記事3
└── 全クラスター記事 → ピラーページへリンク
```

## 🔧 技術実装詳細

### 1. MDXセットアップ

```bash
# 必要パッケージ
npm install @next/mdx @mdx-js/loader @mdx-js/react
npm install gray-matter reading-time
npm install rehype-slug rehype-autolink-headings
npm install remark-gfm
```

### 2. next.config.js
```javascript
import createMDX from '@next/mdx'

const withMDX = createMDX({
  options: {
    remarkPlugins: [],
    rehypePlugins: [],
  },
})

export default withMDX({
  pageExtensions: ['js', 'jsx', 'mdx', 'ts', 'tsx'],
})
```

### 3. MDXフロントマター仕様
```yaml
---
title: "【J-OSLER】病歴要約の書き方完全ガイド"
description: "J-OSLERの病歴要約を効率的に書く方法を徹底解説"
date: "2026-03-10"
updated: "2026-03-10"
author: "内科ナビ編集部"
category: "josler-basics"       # カテゴリSlug
cluster: "B"                     # クラスターID
pillar: "josler-complete-guide"  # 所属ピラーSlug
tags: ["J-OSLER", "病歴要約", "内科専門医"]
cta_type: "template"             # template | progress | quiz | checklist | general
reading_time: 8                  # 分
status: "published"              # draft | published | needs_review
seo_score: null                  # 自動計算
---
```

## 📈 SEO自動チェック項目

### 記事公開前チェック
- [ ] タイトル40文字以内
- [ ] メタディスクリプション120文字以内
- [ ] H1が1つのみ
- [ ] H2が3〜7個
- [ ] 本文2000文字以上
- [ ] 内部リンク3本以上
- [ ] ピラーページへのリンクあり
- [ ] CTA設置（冒頭・中間・末尾）
- [ ] OGP画像設定済み
- [ ] 構造化データ有効

### 定期リライトチェック（月次）
- [ ] 情報の鮮度（6ヶ月以上未更新→要確認）
- [ ] 検索順位変動
- [ ] CTR変化
- [ ] 競合記事との差分

## 🚀 デプロイフロー

```
1. MDXファイル作成/編集
   ↓
2. git push（GitHub）
   ↓
3. Cloudflare Pages 自動ビルド
   ↓
4. 本番反映（約1分）
```

## 📊 管理画面機能（Phase 2）

### /admin ダッシュボード
- 記事数・公開数・下書き数
- 今週の投稿予定
- SEOスコア警告（低スコア記事一覧）
- クラスター別進捗

### /admin/articles
- 全記事一覧（フィルタ・ソート）
- ステータス変更
- 一括編集
- Notion同期

### /admin/seo-health
- Core Web Vitalsスコア
- 構造化データ検証結果
- 内部リンク密度マップ
- 孤立ページ検出

### /admin/generate
- Claude API連携
- キーワード入力 → 記事自動生成
- 過去記事のリライト提案
- 競合分析

## 🔑 環境変数

```env
# Cloudflare
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_ZONE_ID=

# Analytics
NEXT_PUBLIC_GA_ID=
GSC_PROPERTY_URL=

# Claude API（記事生成用）
ANTHROPIC_API_KEY=

# Notion（進捗同期用）
NOTION_API_KEY=
NOTION_DATABASE_ID=31c08315-9502-805c-af3b-e3552f26d9fb
```

## 📅 実装スケジュール

### Phase 1: ブログ基本構築（今回）
- [x] SEO調査
- [ ] ディレクトリ構造作成
- [ ] MDXセットアップ
- [ ] コンポーネント実装
- [ ] sitemap.ts / robots.ts
- [ ] JSON-LD構造化データ
- [ ] サンプル記事移植（b01〜b03）

### Phase 2: 管理機能
- [ ] 管理画面基本UI
- [ ] 記事一覧・編集
- [ ] SEOヘルスチェック
- [ ] Notion同期

### Phase 3: 自動化
- [ ] Claude API連携（記事生成）
- [ ] 自動リライト提案
- [ ] 定期SEO監査

---

## ⚠️ 既知の問題・再発防止メモ

### Cloudflare Pages + esbuild 日本語キーエラー（2026-03-09 発生・解決済）

**症状**: `@cloudflare/next-on-pages` のビルドで `Unexpected character '・' (23:50999)` エラー。Next.jsビルド自体は成功するが、esbuildバンドリング段階で失敗。

**原因**: Edge Runtime (`export const runtime = 'edge'`) を使用するファイル（`opengraph-image.tsx`）内で、TypeScriptオブジェクトのキーに日本語（特に中黒 `・`）を使用していた。esbuildがUnicodeリテラルをオブジェクトキーとしてパースできなかった。

**対策**: Edge Runtimeファイル内では、オブジェクトキーに必ずASCII文字のみを使用する。日本語の表示が必要な場合は、ASCIIキー → 日本語値のマッピング関数を別途用意する。

**ルール**:
- `app/blog/[slug]/opengraph-image.tsx` 等の `runtime = 'edge'` ファイルでは、オブジェクトキーにASCIIのみ使用
- 値（value）に日本語を使うのはOK（title, subtitle等）
- 新たにEdge Runtimeファイルを作成する場合も同様のルールを適用

