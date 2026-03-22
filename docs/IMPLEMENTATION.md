# iwor.jp 実装ガイド

## 📁 プロジェクト構成

→ root README.md に正確なディレクトリツリーあり。以下は実装上の補足のみ。

### 主要ディレクトリ

- `app/` — Next.js App Router。ページコンポーネント
- `app/tools/calc/` — 152個の臨床計算ツール（CalculatorLayout共通レイアウト）
- `app/tools/icu/gamma` — γ計算（純粋な計算機能のみ）
- `app/tools/procedures/` — 手技ガイド15本
- `app/tools/drugs/` — 薬剤ガイド
- `app/tools/interpret/lab-values` — 基準値早見表
- `app/compare/` — 薬剤比較24カテゴリ
- `app/study/` — iwor Study（フラッシュカード）
- `components/pro/` — ProGate, ProModal, useProStatus, ProPulseHint
- `components/tools/` — CalculatorLayout等の共通コンポーネント
- `content/blog/` — MDX記事
- `lib/tools-config.ts` — ツール一覧・メタデータ定義
- `lib/tools-metadata.ts` — SEO用メタデータ生成

## 🎨 デザインシステム

→ **DESIGN_SYSTEM.md** を参照（カラーパレット、クラスターカラー、タイポグラフィ、コンポーネントスタイルの単一ソース）

## 📊 トピッククラスター設計

### ピラーページ（4個）
1. **J-OSLER完全攻略ガイド** (`/blog/josler-complete-guide`)
   - クラスター: A + B + C + D + E + F（J-OSLER基礎・症例登録・病歴要約・疾患別・進捗管理・JMECC）
   - ターゲットKW: 「J-OSLER」「内科専門医」「病歴要約」

2. **内科専門医試験対策ガイド** (`/blog/exam-preparation-guide`)
   - クラスター: G + H + I（内科専門医試験・試験領域別・総合内科専門医）
   - ターゲットKW: 「内科専門医試験」「筆記試験対策」

3. **医師の効率化ガイド** (`/blog/efficiency-guide`)
   - クラスター: J（AI・ツール）
   - ターゲットKW: 「J-OSLER AI」「医師 効率化ツール」

4. **医師のお金とキャリア** (`/blog/money-career-guide`)
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
author: "iwor編集部"
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

## 🏥 臨床計算ツール 実装ルール

### ⚠️ 最重要：エビデンス必須（人命に関わるツール）

**全ての臨床ツールはエビデンスに基づいて実装すること。根拠のない数値は絶対に表示しない。**

1. **参考文献（References）**
   - 各ツールに最低3本の査読付き文献（PubMed indexed）を掲載
   - 必ず PMID を明記し、PubMedへのリンクを付与
   - 原著論文（スコア開発論文）を必ず含める
   - ガイドライン（ESC, AHA, AASLD等）があれば追加

2. **インライン出典**
   - 死亡率・生存率・感度・特異度などの数値データは、表示箇所の直下に出典を明記
   - 形式: `出典: 著者名, et al. ジャーナル名 年; PMID: XXXXXXXX`
   - 数値の出所が不明な場合は表示しない

3. **計算式の検証**
   - 原著論文の計算式と実装が一致していることを確認
   - カットオフ値・クランプ値・特殊条件（透析患者等）を原著に準拠
   - 既知のバリアント（MELD 3.0等）がある場合は明記

4. **免責表示**
   - CalculatorLayout に共通免責が組み込み済み（変更不要）
   - 「医療従事者の臨床判断を補助する目的」と明示

### 🔍 ツールページ SEO最適化（被リンク獲得が目的）

**ツールの存在意義: Google検索から直接流入 → 使いやすさで被リンク＆リピート → ドメイン全体の評価向上**

1. **検索流入の最大化**
   - 各ツールに `layout.tsx` で metadata（title / description / OGP / canonical）を設定
   - `lib/tools-metadata.ts` の `generateToolMetadata()` を使用
   - title形式: `{ツール名}（{英名}）— 無料オンライン計算ツール | iwor`
   - 構造化データ: MedicalWebPage + BreadcrumbList + FAQPage（3問以上）

2. **ユーザビリティ最優先（＝SEO最重要因子）**
   - モバイルファースト：片手操作で完結
   - 入力 → 結果がリアルタイム表示（ページ遷移なし）
   - 結果に臨床的解釈を添える（スコアだけでなく「次に何をすべきか」）
   - 関連ツールへの導線（Child-Pugh → MELD等）

3. **SEOコンテンツ（解説セクション）**
   - explanation prop に 1000文字以上の解説を記載
   - H2/H3の見出し構造で整理
   - 「よくある質問」セクション（FAQPage schema と連動）
   - 内部リンク: 関連ブログ記事への自然な誘導

4. **CTA配置**
   - CalculatorLayout 末尾に自動で large CTA バナーが表示される（共通実装済み）
   - 各ツールページで個別のCTA設定は不要

5. **新規ツール追加時のチェックリスト**
   - [ ] `app/tools/{slug}/page.tsx` 作成
   - [ ] `app/tools/{slug}/layout.tsx` 作成（`generateToolMetadata(slug)` 使用）
   - [ ] `lib/tools-config.ts` の `implementedTools` に slug 追加
   - [ ] 構造化データ: MedicalWebPage + BreadcrumbList + FAQPage（3問以上）
   - [ ] 参考文献: PMID付き3本以上
   - [ ] 数値データのインライン出典
   - [ ] explanation: 1000文字以上、FAQ含む
   - [ ] 型チェック通過（`npx tsc --noEmit`）
   - [ ] コミット → プッシュ
   - [ ] BACKLOG.md 更新

---

## 🔒 ProGate（PROゲート）実装ガイド

### 基本方針

全ツールのUI/操作は完全公開。ゲート対象は「データ永続化」「お気に入り保存」のみ。
**計算結果は絶対にゲートしない。**
**注意**: `interpretation` / `action_plan` featureは削除済み（SaMDリスク — STRATEGY.md参照）

詳細な戦略は `docs/PRODUCT.md` を参照。

### コンポーネント構成

```
components/
├── pro/
│   ├── ProGate.tsx          # ロックラッパー（全ツール共通）
│   ├── ProModal.tsx         # PRO誘導モーダル（共通）
│   ├── useProStatus.ts      # PRO判定フック（localStorage → Supabase切替対応）
│   └── ProPulseHint.tsx     # お気に入りパルスアニメーション
```

### ProGate 使い方

```tsx
import { ProGate } from '@/components/pro/ProGate'

// お気に入り保存: ロック型
<ProGate feature="favorites">
  <FavoriteButton />
</ProGate>

// データ保存: プレビュー型（UI操作可、保存時にモーダル）
<ProGate feature="save">
  <SaveDataButton />
</ProGate>
```

### PRO判定（Phase対応）

```typescript
// hooks/useProStatus.ts
// Phase 1: localStorage判定
// Phase 2: Supabase Auth + subscriptions テーブル判定
// 判定関数を1箇所で管理し、Phase切替時に差し替えるだけ
```

### DB設計（Supabase PostgreSQL）

認証と課金状態を分離。決済手段（BOOTH→Paddle）が変わってもユーザーデータに影響なし。
テーブル設計の詳細は `docs/PRODUCT.md` を参照。

### 新規ツール作成時のPROゲートチェックリスト

- [ ] 計算結果は全公開になっているか（ゲート禁止）
- [ ] 解釈・推奨アクションのProGateがないか（SaMDリスク — 禁止）
- [ ] お気に入りボタンにProGate連携があるか

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


---

# アーキテクチャ・インフラ・依存サービス

→ インフラ構成、依存サービス、コスト、アカウント一覧は **OPERATIONS.md** を参照

## 技術スタック（概要）

| レイヤー | 技術 |
|---------|------|
| フロントエンド | Next.js 14 + React 18 + Tailwind CSS 3.4 |
| コンテンツ | MDX (next-mdx-remote) |
| ホスティング | Cloudflare Pages (SSG, Git連携自動デプロイ) |
| API | Cloudflare Workers + KV |
| DB [Phase 2] | Supabase PostgreSQL + Auth |
| 決済 [移行中] | Paddle (MoR) |

## 依存パッケージ ライセンス

> 最終確認日: 2026-03-15

**GPL混入なし。** 全パッケージがMITまたはMPL-2.0で、商用利用・事業譲渡に問題なし。
唯一のコピーレフト: next-mdx-remote（MPL-2.0）— ファイルレベルのみ。プロジェクト全体には波及しない。
