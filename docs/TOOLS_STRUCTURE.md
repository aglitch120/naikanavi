# iwor.jp /tools/ 構造定義

> 最終更新: 2026-03-15
> /tools/ は臨床医が必要なものがすべて揃うハブ

---

## URL構造

```
/tools/                    ← カテゴリ別ハブ（全カテゴリへの入口）
/tools/calc/               ← 臨床計算ツール一覧
/tools/calc/[slug]         ← 個別計算ツール（67個）
/tools/antibiotics/        ← 抗菌薬 腎機能別用量調整
/tools/interpret/          ← 検査読影インタラクティブ一覧
/tools/interpret/[slug]    ← 個別（血ガス・心電図・画像・エコー等）
/tools/acls/               ← ACLS/BLS 緊急対応フロー
/tools/er/                 ← 主訴別ER対応ツリー
/tools/icu/                ← ICU管理ツール群
/tools/ward/               ← 病棟管理ダッシュボード
/tools/journal/            ← 論文フィード
/tools/study/              ← 臨床トレーニング
/tools/josler/             ← J-OSLER症例管理
/tools/diagnosis/          ← 専門科診断
/tools/matching/           ← マッチング対策
/tools/matching/hospitals/ ← 病院DB
/tools/matching/odds/      ← 倍率表
/tools/matching/interview/ ← 面接対策
/tools/matching/resume/    ← 履歴書生成
/tools/specialist/         ← 他科専門医対策
```

## フリーミアム設計

### 常に無料（緊急・計算・判断系）
- calc/ — 臨床計算ツール全機能
- antibiotics/ — 抗菌薬調整全機能
- acls/ — ACLS/BLS（一刻も争う系）
- er/ — 主訴別ER対応（一刻も争う系）
- icu/ — ICU管理（一刻も争う系）

### フリーミアム（体験無料 → 保存・深掘りPRO）
- interpret/ — フロー体験無料、詳細解説・学習履歴PRO
- ward/ — 閲覧・入力無料、データ保存・同期PRO
- journal/ — 最新3件無料、全アーカイブ・ブックマークPRO
- study/ — 項目一覧無料、進捗管理・メモPRO
- josler/ — 閲覧無料、症例保存・進捗管理PRO
- diagnosis/ — 20問体験無料、結果・詳細PRO
- matching/ — 一部無料、詳細・生成機能PRO
- specialist/ — 一部無料、詳細PRO

### 原則
- **計算・判断・緊急 = 無料**（信頼構築・SEO集客）
- **保存・蓄積・深掘り = PRO**（課金ポイント）
