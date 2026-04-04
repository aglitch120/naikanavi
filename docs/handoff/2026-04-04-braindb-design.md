# 引き継ぎ: brainDB設計セッション（2026-04-04）

## 概要

iwor Study の「リファレンス」機能 = **iwor版イヤーノート**の設計を行った。国試過去問から知識を抽出し、疾患/テーマごとに体系化するbrainDBの構造を確定した。

## 最重要ファイル（忘れるな）

| ファイル | 内容 |
|---------|------|
| `docs/source-data/iwor-theme-taxonomy.json` | **全分類体系（4,372行）。22 field × 217 subfield × 3,111 topic。これがbrainDBの箱** |
| `docs/source-data/source-theme-reference.txt` | 上記の元データ（medu4/QBのテーマ分類をiwor流に再編したもの） |
| `docs/REF_STUDY_QB.md` | QB構築方針、法務リスク、データパイプライン、課金モデル |
| `docs/IMPL_KOKUSHI.md` | 国試演習システムの実装仕様（UI/タブ構成/コンポーネント） |
| `scripts/kokushi/parse_text.py` | 手打ちテキスト→JSON変換パーサー |
| `data/questions/118/118A.json` | 既存の公開問題JSON（118A 75問分） |
| `lib/josler-data.ts` | J-OSLER疾患分類（内科のみ、324疾患。brainDBとは別物） |

## 確定した設計

### 1. データ3層構造

```
data/questions/{year}/{block}.json  ← 公開: 問題文+選択肢+正答
data/.local/explanations/{block}.json  ← ローカル: medu4解説リファレンス（gitignored）
data/.local/brain/{field}/{topic}.json  ← NEW: brainDB（gitignored、AI解説のRAGソース）
```

### 2. brainDBの型定義

```typescript
interface BrainEntry {
  tag: string                    // "fsgs"（iwor-theme-taxonomy.jsonのtopic）
  label: string                  // "巣状分節性糸球体硬化症〈FSGS〉"
  aliases: string[]
  fieldId: string                // "A5"
  subfieldId: string             // "A5-03"（iwor-theme-taxonomy.jsonのsubcategory）
  entryType: 'disease' | 'syndrome' | 'procedure' | 'concept' | 'drug_class' | 'examination'

  // イヤーノート型8セクション
  concept: Fact[]
  epidemiology: Fact[]
  etiology: Fact[]        // 因果の流れをorder付きで記述
  symptoms: Fact[]
  examination: Fact[]
  diagnosis: Fact[]
  treatment: Fact[]
  prognosis: Fact[]

  // ネットワーク
  relatedTopics: { topicId: string, relation: string }[]
  questionIds: { asMain: string[], asSub: string[] }
  examPattern: { total: number, years: number[], avgAccuracy: number }
}

interface Fact {
  text: string                   // "蛋白選択性は低い"
  source: string                 // "110A52-c" | "ai_inferred" | "stem"
  tested: boolean
  testedYears?: number[]
  contrast?: { tag: string, text: string }  // 鑑別対比
  order?: number                 // etiologyセクション内の因果順序
}
```

### 3. 知識抽出パイプライン（1問あたり）

```
問題JSON + ローカル解説 → Claude API → 出力:
  - mainTag: メインタグ（1つ）
  - subTags: サブタグ（複数）
  - facts: 各セクションに分類された知識（平均15-20件/問）
    - 正解からの知識 → mainTagに格納
    - ✕選択肢からの知識 → 各subTagにも分配
    - 問題文（stem）からの知識 → 関連タグに分配
    - 鑑別の対比（contrast）付き
```

### 4. リファレンスページ（公開）

```
iwor.jp/study/kokushi/reference/           → 全field一覧
iwor.jp/study/kokushi/reference/A5         → 腎・電解質（subfield一覧）
iwor.jp/study/kokushi/reference/A5/E3      → ネフローゼ症候群（topic一覧）
iwor.jp/study/kokushi/reference/A5/E3/fsgs → FSGS（brainDBの1エントリ）
```

パンくず: Study > リファレンス > A5 腎・電解質 > ネフローゼ症候群 > FSGS

各topicページに📎マークで関連問題へのリンク。SSG生成で約3,000ページ。

### 5. タブ配置変更

```
旧: ダッシュボード | 演習 | 暗記カード | 統計 | iwor AI | ノート
新: ダッシュボード | 演習 | リファレンス📖 | 暗記カード | 統計 | iwor AI
```

ノートタブ → リファレンスに置き換え。ノート機能はtopicページ内の「自分のメモ」に統合。

## parse_text.pyのバグ（未修正 2件）

1. **正規表現 `[A-F]` → `[A-I]` に修正必要** — G/H/Iブロックが消失。BLOCK_SIZESは修正済みだが正規表現は未修正
2. **計算問題のanswer** — 数値正解（"19.5"等）を扱うロジックが未実装
3. **連問の自動検出** — テーマの「【長文1/3】」マーカーからlinked_group/linked_order付与

## 調査結果サマリー

### イヤーノートの構造
- 1疾患 = 見開き2ページ。`[概念]〜[治療]・[予後]`の8セクション
- 国試既出 = 青字、直近3回 = 青下線、重要 = 太字
- 内科外科1,700疾患。全シリーズで約3,200疾患

### Q-Assistの特徴
- 動画1本 = 1疾患単位。疾患別にピンポイント復習可能
- 病態→症状→検査→治療の流れで丁寧に解説
- サブプリント（穴埋め式）で復習
- Quick Check: QBの選択肢を○×形式で確認

### medu4の特徴
- 穴埋め形式テキスト。1疾患1ページ + 例題1ページ
- 国試合格に必要な最小限知識に絞る（オーバーワーク防止）
- 究極MAP: 1科目の全出題知識をA4 1枚に凝縮（24枚で全範囲）
- デジタル板書前提の設計

### iworの差別化
- 8セクション知識 + 出典トレーサビリティ（問題ID+選択肢） + 鑑別対比 + ネットワーク
- 全部無料
- 問題⇔リファレンスの双方向リンク
- AI解説のRAGソースとして機能

## 次のアクション

1. **CLAUDE.mdにiwor-theme-taxonomy.jsonの存在を明記**（今回の忘却防止）
2. parse_text.pyの正規表現バグ修正（`[A-F]` → `[A-I]`）
3. 110Aブロックの手打ちデータでパース→Claude APIでtopic抽出→brainDB生成の実験
4. topicページのUI実装（SSG + パンくず + 問題リンク）
