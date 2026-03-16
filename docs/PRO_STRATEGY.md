# iwor PRO フリーミアム戦略

> 最終更新: 2026年3月16日
> 方針: PLG（Product-Led Growth）— LPを読ませるのではなく、体験しながらPROの価値に気づかせる

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

### 3. データロックインで退会障壁を作る

PROの真の価値は「使うほど溜まるパーソナルデータ」。
退会 = 全データ消失。年額9,800円を払い続ける理由を作る。

ロックイン要素:
- お気に入りツールリスト
- J-OSLER症例データ＋進捗
- 病棟TODOの蓄積
- 学習進捗ダッシュボード
- 論文ブックマーク＋メモ
- 専門科診断結果

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
  plan TEXT NOT NULL DEFAULT 'pro_annual',
  payment_method TEXT NOT NULL CHECK (payment_method IN ('booth', 'stripe')),
  booth_code TEXT,                    -- BOOTH時代のアクティベーションコード
  stripe_subscription_id TEXT,        -- Stripe移行後のサブスクID
  stripe_customer_id TEXT,            -- Stripe顧客ID
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
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

### Phase 1: PROゲートUI（今）
- [ ] ProGate コンポーネント作成
- [ ] ProModal 共通化（FavoriteButton.tsxから抽出）
- [ ] useProStatus フック作成（PRO判定の一元管理）
- [ ] お気に入りパルスアニメーション
- [ ] 計算ツール1つにProGate組み込み（プロトタイプ）
- [ ] 全計算ツールの解釈セクションにProGate適用
- [ ] 検査読影・生活習慣病ツールにProGate適用
- [ ] /pro/ ランディングページ作成

### Phase 2: 認証＋BOOTH決済（PRO会員販売開始時）
- [ ] Supabase Auth セットアップ
- [ ] DBテーブル作成（profiles, subscriptions, favorites）
- [ ] BOOTHアクティベーションコードフロー
- [ ] お気に入りをSupabaseに移行（localStorage → DB）
- [ ] ログイン/ログアウトUI

### Phase 3: Stripe移行（100人超）
- [ ] 合同会社設立
- [ ] Stripe決済組み込み
- [ ] 既存BOOTHユーザー移行フロー
- [ ] サブスク自動更新

---

*四半期ごとに見直し。次回: 2026年6月*
