---
name: matching
description: マッチング対策機能（病院DB・志望リスト・履歴書PDF・プロフィール）の実装・改修時に使う。
---

# Matching スキル

## 対象ファイル
- `app/matching/page.tsx` — SSRメタデータ
- `app/matching/MatchingApp.tsx` — メインクライアントコンポーネント
- `app/matching/hospitals.ts` — 病院データベース
- Worker API:
  - `PUT /api/matching-profile` — プロフィール保存（sessionToken認証）
  - `GET /api/matching-profile` — プロフィール読み込み

## 機能
- 病院検索・フィルタリング（地域・診療科・研修タイプ）
- 志望リスト管理（追加・削除・順位変更）
- 履歴書PDF生成
- プロフィール（志望科・大学・強み・志望動機）
- PRO: クラウド同期（Worker KV経由）

## 実装ルール
- AI面接は法務対応で削除済み（復活させない）
- 病院データはstatic（hospitals.ts内）
- 志望リストはlocalStorage + PRO時KV同期
- 個人情報の取り扱いに注意（免責ポップアップ必須）
