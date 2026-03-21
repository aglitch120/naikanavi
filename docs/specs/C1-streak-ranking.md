# C1: ストリーク全国ランキング 実装仕様書

> 作成: 2026-03-20
> ステータス: 設計確定 → 実装待ち
> 関連: FEATURE_REQUESTS_v6.md C-10, C-11 / TODO.md Phase C1

---

## 概要

Study のストリーク（連続学習日数）をサーバー同期し、全国ランキングを表示する。
PRO転換の主要ドライバー（ソーシャルプルーフ + 損失回避）。

---

## 1. Worker API（workers/api.js に追加）

### PUT /api/streak — ストリーク同期

```
認証: sessionToken必須（authenticate関数使用、checkExpiry: false）
※ FREE/PRO両方が送信可能（閲覧時にPROゲート）

リクエストBody:
{
  "count": number,      // 現在のストリーク日数
  "best": number,       // 自己ベスト
  "lastDate": "YYYY-MM-DD",
  "displayName": string  // 表示名（8文字以内）
}

サーバー側バリデーション:
1. lastDate === 今日の日付（UTC+9）でなければ拒否
2. KV既存値を取得（streak:{email}）
3. 既存値がある場合:
   - count は既存count+1 以下（1日1増加制限）
   - count が既存値より小さい場合は既存値を維持（リセットはクライアント判定に委ねる）
4. displayName は sanitize（HTMLタグ除去、8文字truncate）

KV書き込み:
- streak:{email} → { count, best, lastDate, displayName, updatedAt }

leaderboard更新:
- streak:leaderboard を GET → JSON配列
- 該当ユーザーを upsert → count降順ソート → 上位200件で truncate → PUT
- leaderboard書き込みは KV の eventually consistent で OK

レスポンス:
{ "ok": true, "rank": number, "totalUsers": number }
```

### GET /api/streak/ranking — ランキング取得

```
認証: 任意（Authorization ヘッダーがあれば認証試行）

処理:
1. streak:leaderboard を GET → JSON配列
2. 認証あり → session.email で自分の順位を特定

レスポンス（認証あり & PRO有効期限内）:
{
  "leaderboard": [{ displayName, count, rank }],  // top 50
  "myRank": number | null,
  "myStreak": number,
  "totalUsers": number,
  "isPro": true
}

レスポンス（認証なし or FREE）:
{
  "leaderboard": [{ displayName, count, rank }],  // top 3のみ
  "myRank": number | null,
  "myStreak": number,
  "totalUsers": number,
  "isPro": false
}
```

---

## 2. フロントエンド（app/study/StudyApp.tsx）

### 2a. ストリーク同期（セッション完了時）

```
場所: updateStreak() 呼び出し後

条件: localStorage に sessionToken が存在する場合のみ
処理:
1. updateStreak() の戻り値を取得
2. PUT /api/streak に送信（fire-and-forget、失敗しても学習体験は壊さない）
3. レスポンスの rank を終了カードに表示（任意）

displayName の取得:
- localStorage の iwor_user から name フィールドを取得
- なければ「匿名医師」をデフォルト
```

### 2b. ランキングUI

```
場所: Studyページ内に「ランキング」タブ or セクション追加
（デッキ選択画面にタブとして追加が自然）

構成:
┌──────────────────────────────┐
│  🏆 ストリークランキング      │
│                              │
│  1. DrTanaka   🔥 42日       │
│  2. MedStudent 🔥 38日       │
│  3. Intern2026 🔥 35日       │
│  ─────────────────────────── │
│  [FREE] 4位以降はぼかし表示   │
│  [PRO]  4〜50位を表示        │
│  ─────────────────────────── │
│  あなた: 12位 / 全国○人中    │
│  🔥 7日連続                  │
└──────────────────────────────┘

FREEユーザー:
- top3 + 自分の順位のみ明確表示
- 4位以降はブラー + ProGateモーダル
- → components/pro/ProGate パターン使用

PROユーザー:
- top50 全表示
- 自分の行をハイライト
```

### 2c. ProGateトリガー（PRODUCT.md 既定）

```
条件: ストリーク7日達成 && PROでない && 未表示（localStorage フラグ）
表示: 「全国○位！ランキングを見る」PROモーダル
回数: 1回のみ（localStorage に streak_promo_shown フラグ）
```

---

## 3. KVキー設計

```
streak:{email}       → ユーザー個別ストリーク（JSON）
streak:leaderboard   → ソート済みランキング配列（JSON、最大200件）
```

---

## 4. 実装順序（コミット単位）

1. `feat: Worker API - PUT /api/streak エンドポイント追加`
2. `feat: Worker API - GET /api/streak/ranking エンドポイント追加`
3. `feat: Study - セッション完了時にストリークをサーバー同期`
4. `feat: Study - ランキングUIをデッキ選択画面に追加`
5. `feat: Study - FREEユーザーにProGateブラー + 7日達成モーダル`
6. `docs: TODO.md, FEATURE_REQUESTS_v6.md 更新`

各コミット後に push。Worker変更は `cd workers && npx wrangler deploy`。

---

## 5. セキュリティ考慮

- displayName の XSS 対策: HTMLタグ除去 + 文字数制限
- レート制限: PUT /api/streak は既存のレート制限に準拠
- count 改竄: サーバー側で +1 制限を検証（完全防止は不可、金銭利益なしのため許容）
- leaderboard 競合: last-write-wins（KV特性）、初期規模では問題なし

---

## 6. 将来拡張（今回は実装しない）

- C-11 ストリーク凍結権（PRO）: C1完了後に追加
- D1 SQLite 移行: ユーザー1,000超で検討
- Study データ全体のサーバー同期: Phase E で検討
