# 競合ツールデータベース

> 最終更新: 2026-03-20
> 用途: SEO戦略・機能開発の優先順位決定

## 競合サマリー

| 競合 | ツール数 | 特徴 | iwor差別化 |
|------|---------|------|-----------|
| HOKUTO | 180+ | 臨床スコア+薬剤+γ計算。アプリ中心 | 薬剤比較24種/手技15種/Web+PWA |
| MSD Manual | 222 | MDCalcベース学習用。英語出典 | 日本語特化。日本独自スコア充実 |
| MedicPulse | 30+ | 主要スコアのみ。多言語 | ツール数で圧倒。日本医学教育対応 |
| Calc4Lab | 60+ | 検査値計算特化 | 臨床スコア・薬剤系が充実 |
| m3 | 20程度 | 簡易計算のみ | ツール数・深さで圧倒 |
| MDCalc（英語） | 700+ | 世界最大。日本独自なし | 日本語。国試対応。薬剤比較 |

## iwor独自ツール（競合になし）

- 薬剤比較表 24カテゴリ 155薬剤（/compare/）
- 手技ガイド 15手技（/tools/procedures/）
- 点滴速度計算（drip-rate）
- 輸液製剤一覧（infusion-list）
- 術前休薬一覧（preop-drugs）
- FiO2換算表（fio2-table）
- 腎機能別抗菌薬用量（renal-dose-abx）
- 簡易懸濁可否（tube-admin）
- 配合錠リスト（combination）

## 法務リスク分類（2026-03-20確定）

### 即削除済み（4ツール）
- lifestyle: CDSS該当（治療推奨自動生成）
- insulin-sliding: 用量出力→低血糖死亡リスク
- rtpa-checklist: 投与可否判定→SaMDリスク
- kcl-correction: 投与速度→心停止リスク

### 要改修（9ツール）→出典転記+SourceCitation
- γ計算（gamma）: notes内「第一選択」等
- 腎機能別抗菌薬用量（renal-dose-abx）
- エンピリック治療（antibiotics内）
- 抗菌薬スペクトラム（antibiotics内）
- ステロイドカバー（steroid-cover）
- 術前休薬（preop-drugs）
- Na補正速度（na-correction-rate）
- オピオイド換算（opioid-conversion）
- FiO2換算表（fio2-table）

### 法務リスク低（149ツール）
純粋計算・分類表示のみ。改修不要。
