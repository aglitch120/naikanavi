# iwor.jp プロジェクト Custom Instructions v3

> 最終更新: 2026-03-16

## プロジェクト概要

**iwor（イウォル）** — 医師の臨床とキャリアを支える恵みの地

- ブランド名: iwor（アイヌ語で「恵みの地」）
- ドメイン: iwor.jp（Xserverドメイン → Cloudflare DNS）
- 方針: 自走メイン、売却は保険。月収100万超→自走、頭打ち→売却
- 売却先候補: m3、メドレー、メドピア、ケアネット、EdTech企業
- 収益: BOOTH初売上 ¥100 達成（2026-03-16）

## 7つのサービス構造

サイトは7つの独立サービスで構成。ホームページからカード形式でアクセス。

### 1. 臨床ツール（/tools/, /compare/）— FREE
- 臨床計算ツール 79種（/tools/calc/[slug]）
- 生活習慣病 総合管理（/tools/lifestyle/）
- ER主訴別対応ツリー 6本（/tools/er/[slug]）
- ACLS/BLS フロー 4本（/tools/acls/[slug]）
- ICU管理ツール 4本（/tools/icu/[slug]）
- 検査読影 5本（/tools/interpret/[slug]）
- 抗菌薬 腎機能別用量（/tools/renal-dose-abx/）
- 薬剤比較 25カテゴリ 155薬剤（/compare/[slug]）
- **FREE/PRO線引き**: 計算・操作=FREE、解釈・アクションプラン=PRO（モザイク）

### 2. 病棟TODO & 症例ログ（/dashboard/）— PRO
- 患者ごとのタスク管理（Things 3風、チェックで完了→ログ）
- 退院→自動アーカイブ（入院中の患者のみ表示）
- 症例ポチポチメモ（タップで日々の疾患記録）
- Stat tracker（統計・検索・編集・削除）
- EPOC連携エクスポート

### 3. 学習（/learning/）— PRO
- 内科専門医試験対策（/learning/naika-exam/）← 旧quiz機能移植先
- 拡張可能な講座プラットフォーム（エコー講座、輸液講座など順次追加）
- 将来: 国家試験、外科専門医など

### 4. J-OSLER管理（/josler/）— PRO
- 症例登録・進捗ダッシュボード（70疾患群）
- 病歴要約AI生成（旧naikanavi app機能の移植先）
- 提出状況管理（draft/submitted/approved）
- 病棟TODO症例ログからの自動連携

### 5. マッチング対策（/matching/）— PRO
- プロフィール入力 → 履歴書自動生成
- 病院DB・検索（マッチング倍率・研修プログラム）
- AI面接練習（病院別質問生成）
- 対象: 医学生（症例データ不要）

### 6. 論文フィード（/journal/）— FREEMIUM
- 最新3件=FREE、全アーカイブ+ブックマーク=PRO
- PubMed API → Claude API → 日本語要約自動生成（将来）

### 7. ブログ（/blog/）— FREE
- 173記事（J-OSLER対策、キャリア、試験、医師の生活）
- SEO集客装置 → ツール → PRO conversion funnel

## フリーミアムモデル

### 無料（SEO集客 + 信頼構築）
- 臨床ツール全種の操作・計算結果
- ER/ACLS/ICU フロー全公開（緊急ツールは永久無料）
- 薬剤比較全公開
- ブログ全記事
- 論文フィード最新3件
- PRO系サービスの美しいデモ（操作可、保存不可）

### PRO（¥9,800/年〜）
- 臨床ツールの解釈・アクションプラン
- 病棟TODO & 症例ログ（データ保存）
- 学習（問題演習・講座）
- J-OSLER管理
- マッチング対策
- 論文フィード全アーカイブ + ブックマーク
- お気に入りツール保存

### 価格
- 1年パス ¥9,800 / 2年パス ¥15,800（19%OFF）/ 3年パス ¥19,800（33%OFF）

## 認証・決済フロー

### Phase 1（現在）: BOOTH + Cloudflare Worker
```
購入フロー:
  BOOTH購入 → 注文メール(Gmail) → GAS(1分ごと) → Worker /api/store-order → KV保存

会員登録:
  /pro/activate → 注文番号 + メールアドレス入力 → Worker /api/register → パスワード自動生成・表示
  ※注文番号は1回限り使用

ログイン:
  /pro/activate → メール + パスワード → Worker /api/login → localStorage にPRO状態保存
```

### Phase 2（100人超）: 合同会社 + Stripe

## インフラ構成

| コンポーネント | 技術 | URL/設定 |
|-------------|------|---------|
| フロントエンド | Next.js 14 + Cloudflare Pages | iwor.jp |
| API | Cloudflare Worker (iwor-api) | iwor-api.mightyaddnine.workers.dev |
| KV | Cloudflare KV (IWOR_KV) | ID: 4af092a9ddd243f09a0f6d2f1979dc6e |
| 注文取込 | Google Apps Script | tellmedu.info@gmail.com + naikanavi.info@gmail.com |
| BOOTH | iwor.booth.pm | 商品: /items/8087647（1年パス） |
| DNS | Cloudflare | iwor.jp |
| 計測 | GA4 + GSC | G-VTCJT6XFHG |

### Worker Secrets
- ADMIN_KEY: wV3&7Np9Mv5bAXT%oP&o
- GAS_KEY: yC1&W1vuH2r&TPH87TmP

### Worker API エンドポイント
- POST /api/store-order — GASから注文保存
- POST /api/register — 注文番号+メールで会員登録
- POST /api/login — メール+パスワードでログイン
- GET /api/admin/orders — 管理者: 注文一覧
- GET /api/admin/users — 管理者: ユーザー一覧
- POST /api/admin/add-order — 管理者: 手動注文追加
- DELETE /api/admin/order — 管理者: 注文削除

## 旧サイトの扱い

- naikanavi.com → 全記事iwor.jpに移植済み、DNS削除済み
- tellmedu.com → 閉鎖。iwor.jpの/matching/として再構築
- 旧worker.js → 旧naikanaviアプリ用。iwor-api(workers/api.js)が後継
- 旧public/app.html → J-OSLER機能を/josler/に、Quiz機能を/learning/に移植予定

## GitHubリポジトリ

https://github.com/aglitch120/iwor

## 作業時のルール

1. 作業開始時は必ず aglitch120/iwor をcloneし、docs/ フォルダを確認する
2. **docs/README.md を最初に読む**（どのファイルが何の情報を持つかの定義）
3. 戦略・方針・価格・ロードマップは docs/STRATEGY.md に従う
4. プロダクト仕様・ゲート設計・DB設計は docs/PRODUCT.md に従う
5. デザインは docs/DESIGN_SYSTEM.md に従う
6. 記事作成・SEOは docs/CONTENT_GUIDE.md に従う
7. 技術実装は docs/IMPLEMENTATION.md に従う
8. タスク管理は docs/TODO.md を参照し、完了タスクはステータス更新してpush
9. Github access token: → プロジェクトのCustom Instructions参照（リポジトリにはコミットしない）
10. 作業完了時は必ず git push する

## セッション継続性

- 小タスクごとにコミット＆プッシュ
- git add -A 禁止 → git add <ファイル名> で個別指定
- node_modules/ は絶対にコミットしない
- docs/TODO.md をタスク完了ごとに更新
- 長い作業は途中で進捗報告、返答は簡潔に

## 技術スタック

- Next.js 14 + MDX + Tailwind CSS + Cloudflare Pages
- Cloudflare Workers + KV（PRO API）
- Google Apps Script（BOOTH注文取込）
- Supabase（Auth + PostgreSQL）← Phase 2
- DNS: Cloudflare
- 決済Phase 1: BOOTH → Phase 2: Stripe

## docs/ 構成（9ファイル、MECE）

| ファイル | 役割 |
|---------|------|
| README.md | インデックス。どのファイルが何を持つかの定義 |
| STRATEGY.md | 経営判断の全て（価格/ロードマップ/競合/売却/確定事項/却下仮説） |
| PRODUCT.md | プロダクト仕様（ゲート設計/機能仕様/DB設計/URL構造） |
| IMPLEMENTATION.md | コードの書き方（技術スタック/アーキテクチャ/依存/ライセンス） |
| DESIGN_SYSTEM.md | 見た目の定義（色/フォント/コンポーネント） |
| CONTENT_GUIDE.md | 記事の書き方（SEO/品質基準/更新手順） |
| JOSLER_GUIDE.md | J-OSLER医学リファレンス |
| OPERATIONS.md | 運用（アカウント/コスト/定常作業） |
| TODO.md | タスクトラッカー |

## 開発ロードマップ

1. ✅ Phase 1: SEOツール群（79calc + ER + ACLS + ICU + 読影 + 薬剤比較）
2. ✅ Phase 1.5: PRO基盤（ProGate + 認証 + BOOTH + Worker + GAS）
3. 🔜 Phase 2: ホームページ7アプリ構造反映 + マッチング対策MVP
4. Phase 3: 病棟TODO & 症例ログ
5. Phase 4: J-OSLER管理（旧app移植）
6. Phase 5: 学習プラットフォーム（旧quiz移植 + 講座追加）
7. Phase 6: 論文フィード自動化

## 現状サマリー（2026年3月16日時点）

- ドメイン: iwor.jp 稼働中
- 記事: 173本移植済み
- 臨床ツール: 123個完成（79calc + ER6 + ACLS4 + ICU4 + 読影5 + 薬剤比較25）
- PRO基盤: Worker API + GAS + BOOTH連携 + register/login 全稼働
- ホームページ: 7アプリ構造にリデザイン済み
- BOOTH: iwor.booth.pm 商品登録済み（1年パス ¥100テスト中）
- 収益: ¥100（テスト購入）
- 次タスク: Worker再デプロイ(register/login)、docs更新、マッチングMVP着手

## デプロイ方法

```bash
# フロントエンド（自動: git push → Cloudflare Pages）
git push origin main

# Worker API
cd workers && npx wrangler deploy
```
