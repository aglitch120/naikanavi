# iwor PRO フリーミアム戦略

> 最終更新: 2026年3月16日
> 方針: PLG（Product-Led Growth）— LPを読ませるのではなく、体験しながらPROの価値に気づかせる

---

## 価格設計

### プラン構成（全機能共通・1プラン）

| プラン | 価格（税込） | 月額換算 | 割引率 | お得額 |
|--------|------------|---------|--------|--------|
| 1年パス | ¥9,800 | ¥817/月 | — | — |
| 2年パス | ¥15,800 | ¥658/月 | 19%OFF | ¥3,800お得 |
| 3年パス | ¥19,800 | ¥550/月 | 33%OFF | ¥9,600お得 |

### 価格設計の根拠

- **¥9,800/年**: Spotifyと同等。研修医の手取り月27-30万に対して月¥817は「コンビニ弁当1回分」
- **¥15,800/2年**: 研修医2年間をフルカバー。「初期研修の2年間これ1本」の訴求
- **¥19,800/3年**: 医学5年生→研修医1年目の黄金期間をカバー。「医学書1冊分で3年使える」
- **3年パスが1年×2の価格（¥19,800 ≈ ¥9,800×2）**: 心理的に「1年分タダ」感が強い
- **全ステージ同一価格**: 医学生の時に買った→研修医でもそのまま使い続けるのが自然

### 決済フロー

```
Phase 1（BOOTH）:
  - 1年パス ¥9,800 / 2年パス ¥15,800 / 3年パス ¥19,800
  - BOOTHの年間パス商品として販売（匿名維持）
  - 購入→アクティベーションコード→iwor.jpで入力→PRO有効化
  - BOOTH手数料: 5.6%（決済手数料込み）

Phase 2（Stripe移行 — PRO会員100人超）:
  - 合同会社設立後にStripe直接決済
  - 既存BOOTHユーザーは残り期間をStripe側に引き継ぎ
  - 自動更新（年額）対応
```

### 収益シミュレーション

| 時期 | ユーザー数 | 平均単価 | 年間収益 | 売却評価額（ARR×3-5x） |
|------|-----------|---------|---------|---------------------|
| 6ヶ月後 | 50人 | ¥12,000 | ¥60万 | ¥180-300万 |
| 1年後 | 200人 | ¥12,000 | ¥240万 | ¥720-1,200万 |
| 2年後 | 500人 | ¥13,000 | ¥650万 | ¥1,950-3,250万 |

※平均単価は1年/2年/3年の加重平均（2年・3年が多いほど上がる）

---

## PRO機能 — セグメント別の「見え方」

### 全部入り1プラン。見せ方だけセグメント別に変える。

**医学5-6年生に訴求:**
- マッチング対策ツール（プロフィール→履歴書自動生成→おすすめ病院→アンマッチ確率→AI面接シミュレーション）
- 専門科診断結果の詳細レポート
- 臨床ツールのPRO解釈セクション

**初期研修医に訴求:**
- 病棟stat tracker（疾患dropdownで記録→経験症例の棒グラフ・円グラフ→EPOC連携用）
- 病棟TODO（データ永続化）
- 論文フィード全アーカイブ + ブックマーク
- 臨床ツールのPRO解釈セクション

**専攻医に訴求:**
- J-OSLER症例管理 + 進捗トラッキング
- 病棟stat tracker（→J-OSLER提出用にそのまま使える）
- 論文フィード全アーカイブ + ブックマーク

---

## PRO機能 — 新規プロダクト詳細

### マッチング対策ツール（/matching/）

| 機能 | FREE / PRO |
|------|-----------|
| プロフィール入力（基本情報・志望科・希望地域） | FREE |
| 履歴書の基本テンプレート表示 | FREE |
| 履歴書自動生成（入力情報から整形済みPDF出力） | **PRO** |
| おすすめ病院リスト（条件マッチング） | FREE（上位3件） / **PRO（全件＋詳細）** |
| マッチング順位並び替えシミュレーション | **PRO** |
| アンマッチ確率計算（過去データベース） | **PRO** |
| 病院別AI面接シミュレーション（マイク入力対応） | **PRO** |
| 病院ごとの特徴・口コミ・研修プログラム情報 | FREE（概要） / **PRO（詳細）** |

**データ設計:**
- 保存するのはユーザーのプロフィール・志望・ランキング順位のみ（患者データゼロ）
- 集合知: ユーザーが増えるほど「この成績帯でこの病院にマッチした」データが蓄積
- AI面接: 病院の公開情報を事前読み込み → ユーザーの履歴書と組み合わせて質問生成

### 病棟stat tracker（/dashboard/stats/）

| 機能 | FREE / PRO |
|------|-----------|
| 疾患入力UI（dropdownで選択） | FREE |
| 直近7日間の記録閲覧 | FREE |
| 全期間の記録 + 棒グラフ・円グラフ | **PRO** |
| 診療科別・疾患別の経験症例分布 | **PRO** |
| J-OSLER / EPOC 用エクスポート | **PRO** |
| 音声入力ショートカット（「肺炎2、心不全1」） | **PRO** |
| 月次レポート自動生成 | **PRO** |

**データ設計:**
- 保存: 日付 + 疾患カテゴリ + 件数のみ（患者名・詳細なし = 個人情報に該当しない）
- クラウド同期OK（Supabase）
- 2年分の蓄積 = J-OSLER提出時にそのまま使える実績データ

### 1. 全ツールのUI/操作は完全公開

インタラクティブコンテンツにフルでアクセスできる。入力も操作もすべてFREE。
これにより:
- SEOクロール範囲が最大化（滞在時間＋操作性でランキング向上）
- HOKUTOがアプリ内に閉じている空白地帯をWebで丸ごと獲れる
- ユーザーが「使ってみたら便利だった」体験を経てからPRO訴求できる

### 2. 安全性ファースト — 緊急ツールは全公開

**計算結果、ER/ICUの判断フロー、緊急対応は絶対にゲートしない。**

患者安全に関わる情報を有料化することは:
- 医療情報サイトとしての信頼を破壊する
- 法的リスクを生む
- 医師コミュニティからの信頼を失う

ゲート対象は「解釈」「推奨アクション」「学習補助」など、臨床判断の補助にとどまる部分のみ。

---

## 基本原則

### 1. 全ツールのUI/操作は完全公開

インタラクティブコンテンツにフルでアクセスできる。入力も操作もすべてFREE。
これにより:
- SEOクロール範囲が最大化（滞在時間＋操作性でランキング向上）
- HOKUTOがアプリ内に閉じている空白地帯をWebで丸ごと獲れる
- ユーザーが「使ってみたら便利だった」体験を経てからPRO訴求できる

### 2. 安全性ファースト — 緊急ツールは全公開

**計算結果、ER/ICUの判断フロー、緊急対応は絶対にゲートしない。**

患者安全に関わる情報を有料化することは:
- 医療情報サイトとしての信頼を破壊する
- 法的リスクを生む
- 医師コミュニティからの信頼を失う

ゲート対象は「解釈」「推奨アクション」「学習補助」など、臨床判断の補助にとどまる部分のみ。

### 3. キャリアデータのロックイン

PROの真の価値は「使うほど溜まるキャリアデータ」。
退会 = キャリアデータ消失。年額¥9,800を払い続ける理由を作る。

**ロックイン要素（患者データゼロ）:**
- マッチングプロフィール＋順位データ＋AI面接履歴
- 病棟stat tracker（経験疾患の分布グラフ — 2年分の蓄積）
- J-OSLER症例カウント＋進捗
- 論文ブックマーク＋メモ
- お気に入りツールリスト
- 専門科診断結果

**ユーザーライフサイクル:**
```
医学5-6年生（マッチング対策）
  ↓ そのまま継続
初期研修医（病棟stat tracker + TODO）
  ↓ そのまま継続
専攻医（J-OSLER + stat tracker）
```
1人のユーザーが3-5年使い続ける設計。LTV = ¥9,800 × 3-5年。

---

## ツール種別ごとのゲート設計

### 計算ツール（/tools/calc/ — 70個）

| 要素 | FREE / PRO |
|------|-----------|
| 入力フォーム | FREE |
| 計算実行＋結果表示 | FREE |
| リスク分類表示 | FREE |
| 解釈セクション（「この結果の意味」） | **PRO（モザイク）** |
| 推奨アクション（「次にすべきこと」） | **PRO（モザイク）** |
| お気に入り保存 | **PRO** |
| 計算履歴保存 | **PRO（将来）** |

**注意**: 計算値そのものは他サイトでも出せるので隠す意味が薄い。「だから何をすべきか」に価値がある。

### ER対応ツリー（/tools/er/ — 6本）

| 要素 | FREE / PRO |
|------|-----------|
| 全ステップ・全分岐 | FREE |
| 結果ノードの対応指示 | FREE（緊急性あり、全公開） |
| お気に入り保存 | **PRO** |

**ER/ICU系は緊急ツールにつき全公開。ゲートなし。**

### 検査読影（/tools/interpret/ — 血ガス等）

| 要素 | FREE / PRO |
|------|-----------|
| フロー操作（全ステップ） | FREE |
| 途中の判定表示 | FREE |
| 最終結果「総合解釈＋鑑別疾患リスト」 | **PRO（モザイク）** |
| お気に入り保存 | **PRO** |

### 生活習慣病ツール（/tools/lifestyle/）

| 要素 | FREE / PRO |
|------|-----------|
| 全入力＋判定結果 | FREE |
| リスク分類（CVDリスク等） | FREE |
| アクションプラン一覧 | **PRO（モザイク）** |
| お気に入り保存 | **PRO** |

### J-OSLER（/josler/ — 将来）

| 要素 | FREE / PRO |
|------|-----------|
| ダッシュボードUI（見るだけ） | FREE |
| 症例テンプレート（見本表示） | FREE |
| 症例データの保存・編集 | **PRO** |
| 進捗トラッキング | **PRO** |
| エクスポート | **PRO** |

### 病棟TODO（/dashboard/ — 将来）

| 要素 | FREE / PRO |
|------|-----------|
| UI操作（入力・チェック） | FREE |
| データ永続化（次回ログイン時に残る） | **PRO** |

### 論文フィード（/journal/ — 将来）

| 要素 | FREE / PRO |
|------|-----------|
| 最新3件の要約 | FREE |
| 全アーカイブ閲覧 | **PRO** |
| ブックマーク＋メモ | **PRO** |

### 専門科診断（/diagnosis/specialty/ — 将来）

| 要素 | FREE / PRO |
|------|-----------|
| 20問クリック式診断 | FREE |
| 結果＋詳細レポート | **PRO** |

---

## インタラクティブPRO発見（PLGタッチポイント）

### 方針
LPを読ませるのではなく、ユーザーが操作する中で自然にPROの価値に気づく仕組み。

### タッチポイント一覧

| トリガー | 表示内容 | 表示方法 | 回数制限 |
|---------|---------|---------|---------|
| 初回ツール利用時 | お気に入りボタンがパルスアニメーション＋ツールチップ「よく使うツールを保存 →」 | ボタンハイライト | 1回のみ |
| お気に入りボタンクリック（未PRO） | PROモーダル（お気に入り機能の説明） | モーダル | 毎回 |
| 解釈セクションのモザイク部分タップ | PROモーダル（「解釈を読むにはPRO」） | モーダル | 毎回 |
| 3回目のツール利用 | 「よく使うツールをお気に入りに保存できます」バナー | インラインバナー | 1回のみ |
| 結果コピー時（将来） | 「PROなら電カルに貼れるフォーマットで出力」 | トースト | 1回のみ |
| J-OSLER症例2件目入力時（将来） | 「PROなら無制限に保存＋進捗トラッキング」 | インラインバナー | 1回のみ |

### お気に入りパルスアニメーション仕様

- 対象: FavoriteButton コンポーネント
- 発火条件: ユーザーが初めてツールページを開いた時（localStorage `iwor_fav_hint_shown` で制御）
- アニメーション: ボタン周囲にリングが広がるパルス（2回繰り返し）
- ツールチップ: ボタン横に「お気に入りに保存 →」テキスト（3秒後にフェードアウト）
- 1度表示したら二度と表示しない

---

## データベース設計（BOOTH→Stripe移行対応）

### 基本方針
認証と課金状態を分離する。決済手段が変わっても、ユーザーデータは一切影響を受けない。

### テーブル設計（Supabase PostgreSQL）

```sql
-- ユーザープロフィール（auth.usersの拡張）
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  segment TEXT CHECK (segment IN ('student', 'resident', 'fellow', 'attending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- サブスクリプション管理
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled', 'grace_period')),
  plan TEXT NOT NULL CHECK (plan IN ('pro_1y', 'pro_2y', 'pro_3y')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('booth', 'stripe')),
  booth_code TEXT,                    -- BOOTH時代のアクティベーションコード
  stripe_subscription_id TEXT,        -- Stripe移行後のサブスクID
  stripe_customer_id TEXT,            -- Stripe顧客ID
  amount_paid INTEGER NOT NULL,       -- 支払額（円）: 9800 / 15800 / 19800
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,    -- 1y: +1年 / 2y: +2年 / 3y: +3年
  cancelled_at TIMESTAMPTZ,
  grace_period_ends_at TIMESTAMPTZ,   -- 退会後30日の猶予期間
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)                     -- 1ユーザー1サブスクリプション
);

-- お気に入り
CREATE TABLE favorites (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, tool_slug)
);

-- J-OSLER症例データ（将来）
CREATE TABLE josler_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  disease_name TEXT NOT NULL,
  summary TEXT,
  status TEXT CHECK (status IN ('draft', 'submitted', 'approved')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 論文ブックマーク（将来）
CREATE TABLE journal_bookmarks (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  article_id TEXT NOT NULL,
  memo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, article_id)
);

-- マッチング対策プロフィール
CREATE TABLE matching_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  graduation_year INTEGER,
  university TEXT,
  preferred_specialty TEXT,
  preferred_regions TEXT[],           -- 希望地域（配列）
  strengths TEXT,
  experiences TEXT,
  rank_order JSONB,                   -- マッチング順位: [{hospital_id, rank}]
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 病棟stat tracker（経験疾患記録）
CREATE TABLE ward_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  department TEXT NOT NULL,           -- 診療科カテゴリ
  disease_category TEXT NOT NULL,     -- 疾患カテゴリ（dropdown選択）
  count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, recorded_date, department, disease_category)
);
-- ※患者名・ID・検査値等は一切保存しない。疾患カテゴリと件数のみ。
```

### BOOTH→Stripe移行フロー

```
Phase 1（BOOTH）:
  ユーザー → BOOTH購入 → アクティベーションコード取得
  → iwor.jpでコード入力 → Supabase Auth登録 + subscription作成
  → payment_method: 'booth', booth_code: 'XXXX'

Phase 2（Stripe移行）:
  既存BOOTHユーザー → 「Stripeに移行」ボタン
  → Stripe Checkout → 同じuser_idのsubscriptionを更新
  → payment_method: 'stripe', stripe_subscription_id: 'sub_XXX'
  → BOOTHの残り期間はStripe側の開始日に反映
```

### 退会時のデータ処理

```
退会リクエスト
  → status: 'cancelled', cancelled_at: NOW()
  → grace_period_ends_at: NOW() + 30日
  → 猶予期間中: 「今すぐ再開すればデータ復元」バナー表示
  → 猶予期間後: 全ユーザーデータを物理削除（GDPR準拠）
```

---

## ProGate コンポーネント設計

### 概要
全ツール共通の「PROゲート」ラッパーコンポーネント。childrenをモザイク化してPRO誘導する。

### 使用方法

```tsx
// 計算ツールでの使用例
<ProGate feature="interpretation" toolSlug="cha2ds2-vasc">
  <div className="interpretation-section">
    <h3>解釈</h3>
    <p>CHA₂DS₂-VAScスコア 3点は年間脳卒中リスク3.2%に相当し...</p>
    <h3>推奨アクション</h3>
    <p>抗凝固療法の開始を検討してください...</p>
  </div>
</ProGate>
```

### Props

```typescript
interface ProGateProps {
  children: React.ReactNode
  feature: 'interpretation' | 'action_plan' | 'favorites' | 'save' | 'result' | 'full_access'
  toolSlug?: string         // トリガー分析用
  blurIntensity?: number    // モザイク強度（デフォルト: 8）
  previewLines?: number     // モザイク前に見せる行数（デフォルト: 2）
}
```

### 表示パターン

1. **モザイク型**（interpretation, action_plan, result）
   - childrenの最初のpreviewLines行はクリアに表示
   - 残りはCSSブラー（filter: blur）でモザイク
   - モザイク上に「PRO会員で全文を読む」オーバーレイ
   - タップでPROモーダル表示

2. **ロック型**（favorites, save）
   - アクション試行時にPROモーダルをポップ
   - ボタン自体は表示されているが、クリックでモーダル

3. **プレビュー型**（full_access）
   - UIは全部見える＋操作できる
   - データ保存時のみPROモーダル

### PRO判定フロー

```
Phase 1（認証なし）:
  localStorage 'iwor_pro_user' === 'true' → PRO
  それ以外 → FREE（常にゲート表示）

Phase 2（Supabase Auth導入後）:
  Supabase session存在 → subscriptions.status === 'active' → PRO
  未ログイン or status !== 'active' → FREE
```

Phase 1ではlocalStorage判定のまま。Phase 2でSupabase Auth導入時に判定関数を差し替えるだけ。

---

## 実装ロードマップ

### Phase 1: SEO集客基盤 + PROゲートUI（現在〜）
- [x] 臨床ツール79種完成（SEO集客装置）
- [x] ER対応6本 + ACLS/BLS 4本 + ICU 4本 + 検査読影5本
- [x] 薬剤比較25カテゴリ
- [ ] ProGate コンポーネント全ツール展開
- [ ] /pro/ ランディングページ作成（3プラン表示）
- [ ] GSC登録 → PV計測開始

### Phase 2: BOOTH販売開始 + マッチング対策ツール
- [ ] BOOTH商品ページ作成（1年/2年/3年パス）
- [ ] Supabase Auth セットアップ
- [ ] DBテーブル作成（profiles, subscriptions, matching_profiles, ward_stats）
- [ ] BOOTHアクティベーションコードフロー
- [ ] マッチング対策ツール MVP
  - [ ] プロフィール入力UI
  - [ ] 履歴書自動生成（PDF出力）
  - [ ] おすすめ病院リスト（条件マッチング）
  - [ ] アンマッチ確率計算
  - [ ] AI面接シミュレーション（マイク入力）

### Phase 3: 病棟stat tracker + J-OSLER
- [ ] 病棟stat tracker
  - [ ] 疾患dropdown入力UI
  - [ ] 棒グラフ・円グラフ（経験症例分布）
  - [ ] 音声入力ショートカット
  - [ ] J-OSLER/EPOC用エクスポート
- [ ] J-OSLER進捗トラッキング
- [ ] 論文フィード + ブックマーク

### Phase 4: Stripe移行 + 拡張（PRO会員100人超）
- [ ] 合同会社設立
- [ ] Stripe決済組み込み
- [ ] 既存BOOTHユーザー移行フロー
- [ ] サブスク自動更新
- [ ] 集合知機能（匿名操作パターン分析）

---

## やらないことリスト

> 詳細な理由は docs/STRATEGIC_DECISIONS.md を参照

- ❌ 患者データの保存・送信（法的リスク）
- ❌ On-device AI でのカルテ処理（時期尚早）
- ❌ 病院口コミ機能（HOKUTOが先行、収集モチベ問題）
- ❌ Anki型適応学習（医師に需要なし）
- ❌ B2B2C営業（今の段階では非現実的）

---

*四半期ごとに見直し。次回: 2026年6月*
