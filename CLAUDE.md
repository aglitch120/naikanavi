# CLAUDE.md

このファイルはClaude（claude.ai/Claude Code）がこのリポジトリで作業する際のガイドラインです。

---

## GitHub認証情報

```bash
# リポジトリクローン後、最初に実行
git remote set-url origin https://TOKEN@github.com/aglitch120/iwor.git
git config user.email "aglitch120@users.noreply.github.com"
git config user.name "aglitch120"
```

**注意**: トークンはセキュリティのためここには記載しない。会話開始時にユーザーから受け取ること。

---

## 作業ルール

### 1. 作業開始時に必ず行うこと
- リポジトリをcloneして最新状態を確認する
- `docs/` フォルダ内の以下のガイドラインを読み、内容に従うこと：
  - `docs/BUSINESS_OVERVIEW.md` — ビジネス概要・収益モデル・3セグメント商品設計
  - `docs/PRO_STRATEGY.md` — PLGフリーミアム戦略・ProGate設計・DB設計・ゲート基準
  - `docs/EXIT_STRATEGY.md` — EXIT戦略・ロードマップ
  - `docs/EXIT_TODO.md` — TODOトラッカー（WS0〜WS4）
  - `docs/DESIGN_SYSTEM.md` — カラー・タイポグラフィ・コンポーネント規約
  - `docs/SEO_GUIDELINE.md` — 記事作成ルール・KW設計・メタデータ
  - `docs/IMPLEMENTATION_GUIDE.md` — 技術実装・フォルダ構成・デプロイ手順

### 2. コミットルール
- 小さなタスク（1ファイル、1機能）ごとにコミット
- コミット後は必ずプッシュ
- `git add -A` 禁止 → `git add <ファイル名>` で個別指定
- `node_modules/` は絶対にコミットしない
- コミットメッセージは日本語OK、プレフィックス付き（docs:, feat:, fix:, refactor:）

### 3. タスク管理
- `docs/EXIT_TODO.md` をタスク完了ごとに更新してpush
- 長い作業は途中で進捗報告

### 4. コードスタイル
- TypeScript + Next.js 14 App Router
- Tailwind CSS でスタイリング（カスタムCSSは最小限）
- コンポーネントは `components/` に配置
- MDX記事は `content/blog/` に配置

---

## プロジェクト概要

**iwor（イウォル）** — 医師の臨床とキャリアを支える恵みの地

- ドメイン: iwor.jp
- 旧サイト: naikanavi.com（→ iwor.jpに301リダイレクト予定）
- 技術: Next.js 14 + MDX + Tailwind + Cloudflare Pages / Workers / KV

### サイト構造
```
iwor.jp/
├── /tools/        ← 臨床計算ツール群（無料）
├── /compare/      ← 薬剤比較（無料）
├── /blog/         ← SEOコンテンツ（173記事＋新規）
├── /josler/       ← J-OSLER対策（PRO）
├── /interpret/    ← 検査読影インタラクティブ（将来）
├── /emergency/    ← ACLS・緊急対応（将来）
├── /er/           ← 主訴別ER対応（将来）
├── /icu/          ← ICU管理ツール（将来）
├── /dashboard/    ← 病棟管理ダッシュボード（将来・PRO）
├── /journal/      ← 論文フィード（将来・PRO）
├── /matching/     ← マッチング対策（将来・PRO）
├── /specialist/   ← 他科専門医対策（将来）
└── /hospitals/    ← 病院DB（将来）
```

### ビジネスモデル（PLGフリーミアム）
- 無料: 全ツールのUI/操作（入力＋計算＋結果）＋ER/ICU/ACLS全公開 → SEO集客＋信頼構築
- PROゲート: 解釈セクション（モザイク）＋データ永続化＋お気に入り → PROモーダル誘導
- 有料: iwor PRO 年額9,800円 → 解釈閲覧・データ保存・パーソナライズ
- 安全性ファースト: 緊急ツール（ER/ICU/ACLS/計算結果）は絶対にゲートしない

詳細は `docs/BUSINESS_OVERVIEW.md` および `docs/PRO_STRATEGY.md` を参照。

---

## 注意事項

- ソースコード内に `naikanavi` の参照が多数残っている（移行中）
- 本番ドメインは iwor.jp に移行予定（Cloudflare接続後）
- naikanavi.com からの301リダイレクトを設定予定
