# CBTデッキ 進捗サマリー

## 完成分: 400枚（15デッキ）

| # | デッキ | 枚数 | 目標 | 達成率 |
|---|--------|------|------|--------|
| 1 | cbt-professional | 18 | 30 | 60% |
| 2 | cbt-statistics-ebm | 17 | 35 | 49% |
| 3 | cbt-epidemiology | 19 | 50 | 38% |
| 4 | cbt-health-system | 19 | 55 | 35% |
| 5 | cbt-cell-genetics | 18 | 45 | 40% |
| 6 | cbt-histology-embryology | 14 | 45 | 31% |
| 7 | cbt-physiology | 17 | 45 | 38% |
| 8 | cbt-biochemistry | 17 | 45 | 38% |
| 9 | cbt-microbiology | 37 | 65 | 57% |
| 10 | cbt-immunology | 12 | 40 | 30% |
| 11 | cbt-pharmacology-pathology | 14 | 45 | 31% |
| 12 | cbt-behavioral-science | 11 | 30 | 37% |
| 13 | cbt-clinical-core | 140 | 180 | 78% |
| 14 | cbt-systemic-disease | 17 | 70 | 24% |
| 15 | cbt-clinical-reasoning | 30 | 45 | 67% |
| | **合計** | **400** | **~850** | **47%** |

## 含まれるもの
- 通常カード: 387枚（全カードにsource_code紐付き済み）
- 4段階ステップカード: 7症例（SLE、SAH、狭心症、肺炎、痛風、DKA、異所性妊娠、大動脈解離、腎盂腎炎、Basedow、化膿性関節炎、川崎病、膵癌）
- 全15デッキのJSONファイル

## Claude Codeでの残作業（約450枚追加）

### 優先度高（大きなギャップ）
1. **cbt-systemic-disease** (+53): E領域の腫瘍各論（消化器癌・泌尿器癌の詳細）、小児疾患、老年医学
2. **cbt-clinical-core** (+40): D領域の残りⅠ群/Ⅱ群疾患
3. **cbt-microbiology** (+28): 個別菌の1菌1カード完遂
4. **cbt-epidemiology** (+31): 各法規の詳細カード
5. **cbt-health-system** (+36): 制度の詳細

### 優先度中
6. **cbt-histology-embryology** (+31): C-2-2, C-2-4の残り
7. **cbt-cell-genetics** (+27): C-1の残り
8. **cbt-physiology** (+28): 臓器別生理学
9. **cbt-biochemistry** (+28): 代謝経路の詳細
10. **cbt-immunology** (+28): C-3-2の残り
11. **cbt-pharmacology-pathology** (+31): C-3-3+C-4の残り

### 優先度低（デッキが小さい）
12. **cbt-behavioral-science** (+19): C-5の残り
13. **cbt-professional** (+12): 残りA領域
14. **cbt-statistics-ebm** (+18): 計算問題の追加
15. **cbt-clinical-reasoning** (+15): 追加ステップカード症例

### 作業手順
```bash
cd iwor
# 1. CBTデッキファイルをリポジトリに配置
cp cbt-decks/*.json public/data/decks/

# 2. 出題基準PDFをダウンロード・パース
curl -o cbt_r7.pdf https://www.cato.or.jp/pdf/cbt_igakuR7.pdf
# pdfplumberで全学修目標を抽出 → 未カバー項目を特定

# 3. 未カバー項目に対してカード生成
# 既存カードのsource_codeをチェックし、まだカードがない出題基準項目を特定
# → AIバッチ生成で残り450枚を追加

# 4. ステップカードUIの実装（新規Reactコンポーネント）
# 5. docs/TODO.md更新 → コミット＆プッシュ
```
