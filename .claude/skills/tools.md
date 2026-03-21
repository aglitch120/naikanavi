---
name: tools
description: 臨床計算ツール・薬剤ガイド・手技ガイドの追加・修正時に使う。
---

# Tools スキル

## 対象ディレクトリ
- `app/tools/calc/` — 臨床計算ツール（166種）各ツールは独立ページ
- `app/tools/drugs/` — 薬剤ガイド（抗菌薬・ステロイド・オピオイド等）
- `app/tools/procedures/` — 手技ガイド
- `app/tools/interpret/` — 基準値早見表
- `app/tools/icu/gamma/` — γ計算ツール
- `app/compare/` — 薬剤比較（24カテゴリ155薬剤）

## 実装ルール
- 計算結果は絶対にPROゲートしない（安全性ファースト）
- 全ツールに更新日表示 + 誤り報告ボタン必須
- 表現は「推奨」ではなく「参照」を使う
- 出典（ガイドライン・論文）を明記する
- `'use client'` で入力→計算→結果表示のインタラクティブUI
- 免責ポップアップが初回アクセス時に表示される

## 新ツール追加手順
1. `app/tools/calc/{tool-name}/page.tsx` を作成
2. CalcToolコンポーネントパターンに従う（入力フィールド→計算ロジック→結果表示→出典）
3. ツール一覧ページ（`app/tools/page.tsx`）に追加
4. サイトマップに自動反映（`app/sitemap.ts`）
