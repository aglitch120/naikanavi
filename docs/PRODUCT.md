# iwor PRO プロダクト仕様

> 最終更新: 2026年3月20日
> 役割: プロダクトの「何を作るか」を定義。価格・ロードマップ・競合分析は STRATEGY.md を参照。

---

## 価格設計

→ **STRATEGY.md** を参照（価格の単一ソース）

---

## サービス構造（10サービス）

→ サービス一覧・ホーム画面レイアウト・URL構造は **STRATEGY.md** を参照

---

## PRO機能 — セグメント別の「見え方」

### 全部入り1プラン。見せ方だけセグメント別に変える。

**医学5-6年生に訴求:**
- マッチング対策（志望リスト、マッチ確率、履歴書生成）
- iwor Study（コミュニティデッキ、AI生成）

**初期研修医に訴求:**
- 研修記録（EPOC管理）
- 症例ログ（ドロップダウン選択）
- 論文フィード全アーカイブ + ブックマーク
- iwor Study

**専攻医に訴求:**
- J-OSLER症例管理 + 進捗トラッキング
- 専門医単位カウンター
- 論文フィード全アーカイブ + ブックマーク
- 学会カレンダー（無制限 + 通知）

---

## 各サービスの詳細仕様

### 1. 臨床ツール（/tools/, /compare/）— FREE

以下を「臨床ツール」1アイコンに統合:
- 計算ツール 152種+追加予定（/tools/calc/[slug]）
- 生活習慣病 総合管理（/tools/lifestyle/）
- 薬剤ガイド（/tools/drugs/）
- 薬剤比較 24カテゴリ 155薬剤（/compare/[slug]）
- 手技ガイド 15本（/tools/procedures/）
- 基準値早見表（/tools/interpret/lab-values）
- γ計算（/tools/icu/gamma）— 純粋な計算機能のみ

**法務対策**: 全数式の出典照合、「推奨」→「参照」表現改修、出典明記、更新日表示、誤り報告ボタン

### 2. 研修記録（/record/）— PRO

**EPOC管理（初期研修医向け）:**
- EPOC連携・進捗管理ダッシュボード

**J-OSLER管理（内科専攻医向け）:**
- 症例登録・進捗ダッシュボード（70疾患群）
- 病歴生成（疾患選択→テキストコピー）
- 提出状況管理（draft/submitted/approved）
- **同期ベンチマーク（PRO）**: 同学年の平均提出数・分布・上位○%表示（匿名集計）
- **自由テキスト排除**（法務リスク対策）

**EPOC管理も同構造で同期ベンチマーク対応予定**

**症例ログ（統合）:**
- ドロップダウン選択のみ（自由テキスト廃止）
- 日付 + 疾患カテゴリ + 件数
- EPOC連携エクスポート

### 3. 専門医単位（/credits/）— PRO（新規）

- 自己入力型カウンター（ユーザーが取得単位を記録）
- 学会要件はLLM自動収集で「参考情報」として表示
- 免責: 「公式サイトでご確認ください」

### 4. 学会カレンダー（/conferences/）— FREEMIUM（新規）

- **学会DB**: 専門医機構認定の基本領域19学会 + サブスペシャルティ24学会 = 必須掲載
- カレンダービュー（月/週）+ リスト表示切替
- 「参加予定」マイリスト登録
- LLM自動収集（月2回cron + Claude Haiku）→ 管理者承認フロー
- 地方会・支部会は対象外
- FREE: DB閲覧 + 3学会マイリスト + 「参加予定」登録 / PRO: 無制限 + 全通知 + iCalエクスポート + **参加予定者数の表示**

### 5. マッチング・転職対策（/matching/）— FREEMIUM

- **モード切替**: 医学生モード / それ以外モード
- **タブ構成**:
  1. プロフィール → 履歴書自動生成
  2. 書類・メール生成
  3. 病院検索 45病院
  4. 志望リスト（PRO）→ マッチ確率計算（最大99%）
- **「気になる」機能（FOMO型PROゲート）**:
  - 病院検索の各病院に「気になる」ボタン（FREE — データ蓄積目的）
  - 「気になる」した病院 → 志望リストに自動追加（PRO）
  - 人気病院ランキング（気になる数TOP） → **PRO限定**
  - 「この病院を気になるした人は〇〇人」の数字表示 → **PRO限定**
  - マッチング時期（5-6年生の春〜夏）にFOMO効果でPRO転換を狙う
- **見学準備コンテンツ**: 持ち物チェックリスト / 聞くべきことリスト / 総合評価テンプレート
- **AI面接は削除済み**（法務リスク）
- コンテンツ素材: → MATCHING_CONTENT.md 参照

### 6. 論文フィード（/journal/）— FREEMIUM

- 最新3件=FREE、全アーカイブ+ブックマーク=PRO
- PubMed API → 日本語/英語切替対応予定
- 診療科別IF top 5〜10雑誌表示予定
- **サーバーサイドデータキャッシュ（Worker/KV）** — 最優先
- 「ここからプレゼン資料を作成」→ /presenter/ 連携

### 7. プレゼン資料生成（/presenter/）— PRO

- 学会・カンファ・コンサル用のプレゼン資料生成
- 出力形式: スライド / ポスター / 抄録 / A4資料
- 論文ブックマークからのインポート対応
- Phase 1は汎用テンプレート生成に留める（患者情報の法的リスク回避）

### 8. 当直シフト作成（/shift/）— FREE（バイラルマーケティング装置・新規）

- ステップウィザード: グループ作成→月選択→医師登録→シフト枠設定→ルール設定→希望日入力→AI自動割当→結果・手動調整→印刷・共有
- 共有: メール/LINEリンク送信、パスワード設定、回答期限
- 参加者の回答画面にiworのさりげないCTA
- FREE理由: ユーザーがリンクを広める→無料マーケティング

### 9. マネー（/money/）— FREEMIUM（既存+拡張中）

- **概算ツール4種（既存・FREE）**: ふるさと納税/手取り/NISA/確定申告
- **医師おすすめランキング（拡張）**: upvote（いいね）ベースの人気順表示
  - カテゴリ: ふるさと納税返礼品 / クレジットカード / NISA銘柄 / バイト会社
  - 各項目にアフィリエイトリンク（楽天/A8/証券口座/バイト紹介サイト）
  - 「周りの医師が勧めている」FOMO効果でCVR向上
- **FREE**: 概算ツール全機能 + ランキング閲覧 + アフィリエイトリンク
- **PRO**: upvote投稿（ランキングに影響を与える権利）
- DB: Phase 1はWorker KV、Phase 2でSupabase移行

### Study. iwor Study（/study/）— FREEMIUM（ボトムナビ独立）

→ 詳細仕様は **STRATEGY.md**「新コアプロダクト: iwor Study」を参照

---

## フリーミアム設計

### 常に無料
- 臨床ツール全種の計算結果
- 薬剤ガイド・薬剤比較・手技ガイド・基準値早見表: 全公開
- γ計算（純粋な計算機能）
- 当直シフト作成（全機能）
- ブログ全記事
- 論文フィード最新3件
- 学会DB閲覧 + 3学会マイリスト
- Study: 自作デッキ+FSRS+デフォルト3デッキ
- マネー: 概算ツール全機能 + おすすめランキング閲覧 + アフィリエイトリンク
- マッチング: 病院検索 + 「気になる」ボタン
- PRO系サービスの美しいデモ（操作可、保存不可）

### PRO限定
- 研修記録（EPOC + J-OSLER）— データ保存
- 専門医単位カウンター
- マッチング（志望リスト、マッチ確率、人気病院ランキング、「気になる」数表示）
- 論文フィード全アーカイブ + ブックマーク
- プレゼン資料生成
- 学会スケジュール無制限 + 全通知 + iCalエクスポート
- Study: コミュニティデッキ + AI生成 + 詳細統計 + ゲーミフィケーション
- マネー: おすすめランキングへのupvote投稿
- お気に入りツール保存
- 症例ログ（ドロップダウン選択のみ）

### 原則
- **計算・緊急 = 無料**（信頼構築・SEO集客）
- **保存・蓄積・深掘り・AI・コミュニティ = PRO**（課金ポイント）
- **PRO系サービスは非ログイン者にも美しいデモを見せる**（操作可、保存不可）
- **ソーシャルプルーフゲート**: 自分のアクション=FREE、みんなのアクション集計=PRO（全サービス共通設計原則）

### ソーシャルプルーフゲート設計（全サービス共通）

「周りと同じことをしたい」心理を活用。個人のアクションは無料で蓄積させ、集計データの閲覧をPROゲートにする。

| サービス | FREE（自分のアクション） | PRO（みんなの集計） |
|---------|------------------------|-------------------|
| マッチング | 「気になる」ボタン | 人気病院ランキング + 気になる数表示 |
| マネー | ランキング閲覧 | upvote投稿 |
| J-OSLER/研修記録 | 自分の症例登録 | 同期ベンチマーク（平均提出数・分布・上位○%） |
| Study | デッキで学習 | 人気デッキランキング + 学習者数 + 平均正答率 |
| 学会カレンダー | 「参加予定」登録 | 参加予定者数の表示 |

---

## PLGタッチポイント（インタラクティブPRO発見）

| トリガー | 表示内容 | 回数制限 |
|---------|---------|---------|
| 初回ツール利用時 | お気に入りボタン パルスアニメーション | 1回のみ |
| お気に入りクリック（未PRO） | PROモーダル | 毎回 |
| 3回目のツール利用 | 「お気に入りに保存できます」バナー | 1回のみ |
| Study 5回目のレビュー後 | 「コミュニティデッキでもっと効率的に」バナー | 1回のみ |
| マッチング病院検索で「気になる」3回目 | 「人気ランキングを見る」PROモーダル | 1回のみ |
| マネーランキング閲覧時 | 「あなたのおすすめを投票しませんか？」PROバナー | 1回のみ |
| J-OSLER症例5件登録後 | 「同期の平均提出数を確認する」PROバナー | 1回のみ |
| Study 10回目のレビュー後 | 「このデッキを○人が学習中」PROバッジ | 1回のみ |
| 学会「参加予定」登録後 | 「○人が参加予定 — PROで確認」PROバナー | 1回のみ |

---

## 認証・決済フロー

### Phase 1（現在 → Paddle移行中）

**現行（BOOTH — 強制非公開予定）:**
- BOOTH購入 → GAS → Worker → KV保存
- /pro/activate → 注文番号 + メール → Worker → PW自動生成
- ログイン: メール + PW → Worker → localStorage にPRO状態 + sessionToken

**移行先（Paddle）:**
- Paddle Checkout → Webhook → Worker → KV保存
- 特商法の省略表示方式で実名非公開可
- 代替: LemonSqueezy（Paddle審査落ちた場合）

### Phase 2（100人超）

合同会社設立 + Supabase Auth + PostgreSQL

---

## データベース設計（Supabase — Phase 2）

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  display_name TEXT,
  segment TEXT CHECK (segment IN ('student', 'resident', 'fellow', 'attending')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'cancelled', 'grace_period')),
  plan TEXT NOT NULL CHECK (plan IN ('pro_monthly', 'pro_annual')),
  payment_method TEXT NOT NULL CHECK (payment_method IN ('paddle', 'stripe')),
  paddle_subscription_id TEXT,
  amount_paid INTEGER NOT NULL,
  activated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  UNIQUE(user_id)
);

CREATE TABLE favorites (
  user_id UUID NOT NULL REFERENCES profiles(id),
  tool_slug TEXT NOT NULL,
  PRIMARY KEY (user_id, tool_slug)
);

CREATE TABLE josler_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  disease_name TEXT NOT NULL,
  status TEXT CHECK (status IN ('draft', 'submitted', 'approved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE journal_bookmarks (
  user_id UUID NOT NULL REFERENCES profiles(id),
  article_id TEXT NOT NULL,
  memo TEXT,
  PRIMARY KEY (user_id, article_id)
);

CREATE TABLE matching_profiles (
  user_id UUID PRIMARY KEY REFERENCES profiles(id),
  graduation_year INTEGER,
  university TEXT,
  preferred_specialty TEXT,
  preferred_regions TEXT[],
  rank_order JSONB
);

CREATE TABLE case_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  recorded_date DATE NOT NULL DEFAULT CURRENT_DATE,
  department TEXT NOT NULL,
  disease_category TEXT NOT NULL,
  count INTEGER NOT NULL DEFAULT 1,
  UNIQUE(user_id, recorded_date, department, disease_category)
);
-- ※ 自由テキストなし。ドロップダウン選択のみ。

CREATE TABLE study_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  deck_id UUID NOT NULL,
  front TEXT NOT NULL,
  back TEXT NOT NULL,
  fsrs_state JSONB,
  next_review TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE study_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  title TEXT NOT NULL,
  is_community BOOLEAN DEFAULT FALSE,
  card_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## ProGate コンポーネント設計

### 概要
全ツール共通の「PROゲート」ラッパーコンポーネント。childrenをモザイク化してPRO誘導する。

### Props

```typescript
interface ProGateProps {
  children: React.ReactNode
  feature: 'favorites' | 'save' | 'full_access' | 'social_proof' | 'first_taste'
  toolSlug?: string
  blurIntensity?: number    // デフォルト: 8
  previewLines?: number     // デフォルト: 2
}
```

**注意**: `interpretation` / `action_plan` featureは削除済み（SaMDリスク）

### 表示パターン

1. **ロック型**（favorites, save）— アクション試行時にPROモーダルをポップ
2. **プレビュー型**（full_access）— UIは全部見える+操作できる、データ保存時のみPROモーダル
3. **ソーシャルプルーフ型**（social_proof）— 集計データをブラー表示、PRO解除で数字が見える
4. **ファーストテイスト型**（first_taste）— 初回1回だけ無料閲覧可、2回目以降はPROモーダル

### PROモーダル内の損失回避カウンター

解約画面・PROモーダルにユーザーの蓄積データ量を表示:
- 「あなたのデータ: Study ○枚 / J-OSLER ○症例 / ブックマーク ○件」
- 解約時: 「30日後にすべて消失します」+ データ一覧

### PRO判定フロー

```
Phase 1（現在）:
  localStorage 'iwor_pro_user' === 'true' → PRO
  それ以外 → FREE

Phase 2（Supabase Auth導入後）:
  Supabase session → subscriptions.status === 'active' → PRO
```

---

## 免責・法的対応

- ツール初回利用時ポップアップ（1回のみ）: 医師/医学生確認 + 患者個人情報入力禁止 + 免責事項 + 間違い発見時の連絡促し
- 会員登録時: 利用規約・プライバシーポリシー同意チェック
- ホーム画面免責文言にも「患者個人情報を入力しないでください」

---

## やらないことリスト

→ **STRATEGY.md**「確定事項・却下仮説」を参照

---

*四半期ごとに見直し。次回: 2026年6月*
