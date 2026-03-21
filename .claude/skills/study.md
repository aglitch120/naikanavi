---
name: study
description: Study機能（FSRS暗記カード）の実装・改修・デッキ追加時に使う。
---

# Study スキル

## 対象ファイル
- `app/study/StudyApp.tsx` — メインクライアントコンポーネント（全UI＋状態管理）
- `app/study/page.tsx` — SSRメタデータ
- `app/study/fsrs.ts` — FSRSアルゴリズム（間隔計算・4段階評価）
- `app/study/decks.ts` — デッキ定義・管理ロジック
- `app/study/cbt-cards.ts` — デフォルトカードデータ

## アーキテクチャ
- 全データはlocalStorage保存（`iwor-study-*` キー）
- FSRSパラメータ: w=[0.4,0.6,2.4,5.8,...], requestRetention=0.9
- カードID: string型（`{deckId}-{index}`）
- 画面遷移: deck → session → result（`screen` state）
- ストリーク: 日付ベース（JST midnight判定）

## 実装ルール
- `'use client'` 必須（全てクライアントサイド）
- カードの追加・削除はdecks.tsのCRUD関数経由
- デフォルトデッキ変更時はcbt-cards.tsを編集
- FSRSの評価は Again(1)/Hard(2)/Good(3)/Easy(4) の4段階
- 結果画面にはSNSシェアボタンあり（X/LINE/コピー）

## デザイントークン
- MC: `#1B4F3A`（メインカラー）
- MCL: `#E8F0EC`（ライトバリアント）
