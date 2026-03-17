# iwor.jp TODO

> 更新: 2026-03-17（認証UX改善、デザイン統一、検査読影ProGate強化、マッチング大幅改善）
> 方針: 自走メイン、売却は保険。7つのサービスを段階的に構築。

---

## Phase 0: 基盤（✅完了）

- [x] iwor.jp ドメイン取得・Cloudflare DNS・Pages稼働
- [x] naikanavi.com 173記事移植
- [x] GSC登録・GA4設置（G-VTCJT6XFHG）
- [x] 利用規約・プライバシーポリシー・特商法表記
- [x] 医療情報免責表示フッター設置
- [x] リポジトリ整備（README, .env.example, テスト, ライセンス監査）
- [x] docs/ 9ファイルMECE体制

## Phase 1: 臨床ツール群 — SEO集客装置（✅完了）

- [x] 臨床計算ツール 79種
- [x] 生活習慣病 総合管理ツール
- [x] ER主訴別対応ツリー 6本
- [x] ACLS/BLS フロー 4本
- [x] ICU管理ツール 4本
- [x] 検査読影インタラクティブ 5本（SVG模式図付き）
- [x] 抗菌薬 腎機能別用量調整
- [x] 薬剤比較 25カテゴリ 155薬剤
- [x] 共通コンポーネント（Calculator, DrugCompare, ERDisclaimer等）
- [x] 全ツール構造化データ（MedicalWebPage + FAQPage）
- [x] 既存173記事との相互内部リンク

## Phase 1.5: PRO基盤 + 収益化（✅完了）

- [x] ProGate コンポーネント（モザイク/ロック/プレビュー）
- [x] ProModal + useProStatus（有効期限チェック＋refresh）
- [x] 全ツールにProGate適用（解釈セクション）
- [x] PLGタッチポイント（3回目利用バナー、お気に入りパルス）
- [x] /pro/ ランディングページ（セグメント別タブ+3プラン+比較表+FAQ）
- [x] Worker API デプロイ（iwor-api.mightyaddnine.workers.dev）
  - [x] POST /api/store-order（GASから注文保存）
  - [x] POST /api/register（注文番号+メールで会員登録）
  - [x] POST /api/login（メール+パスワードでログイン）
  - [x] 管理者API（orders, users, add-order, delete）
- [x] GAS設置（tellmedu + naikanavi 両Gmail、1分ごとBOOTHメールチェック）
- [x] BOOTH商品登録（iwor.booth.pm/items/8087647）
- [x] テスト購入→GAS→Worker→アクティベーション 全フロー動作確認
- [x] /pro/activate 会員登録+ログインUI
- [x] ヘッダーログインボタン→/pro/activate
- [x] CSP connect-src にWorker URL追加
- [x] ホームページ 7アプリ構造にリデザイン

### 残タスク
- [x] **Worker再デプロイ**（register/login対応版 — 2026-03-16 デプロイ完了）
- [x] **デザイン統一** — ガラスモーフィズム廃止→フラットデザイン統一（2026-03-16）
  - [x] Hero: テキスト→mockup縦配置（中央、PC/スマホ共通）
  - [x] サービスカード: bg-s0 border-br フラット化
  - [x] CTA: blur-xlシャドウ+shadow-2xl+装飾円で立体感
  - [x] 比較表: PRO列 -translate-y-2 shadow-lg で浮き上がり
  - [x] 価格: 月あたり表記（¥820）、1日あたり廃止
  - [x] ブログカード: OGPサムネ廃止→テキストベースフラット統一
  - [x] About: iwor幾何学イラスト背景追加（森・山・川SVG）
- [x] **/app ハブページ新設** — 7サービス一覧（/tools redirectではない）（2026-03-16）
- [x] **/tools 整理** — 臨床ツールのみ（病棟管理等の非臨床カテゴリ削除、生活習慣病バナー削除）（2026-03-16）
- [ ] BOOTH商品価格を本番価格（¥9,800）に変更
- [ ] BOOTH 2年パス・3年パス商品追加
- [x] BOOTHサムネイル画像作成（booth-thumbnail.html / .svg / .png）
- [x] **認証UX改善**（2026-03-17）
  - [x] Chromeパスワード保存対応（form + type=password + autocomplete）
  - [x] パスワードリセット機能（Worker POST /api/reset-password + UI）
  - [x] ヘッダー「ログイン」→ PRO時「マイページ」表示
  - [x] /pro ページ購入後案内CTA強化（料金セクション+最終CTA）
- [x] **デザイン統一 v2**（2026-03-17）
  - [x] 全臨床ツールページ グリーンフラット化（tools/calc/er/acls/icu/interpret/compare）
  - [x] マッチング対策 ピンク→グリーン統一
  - [x] 病棟TODO ヘッダー重複修正 + PC幅720px対応
- [x] **構造変更**（2026-03-17）
  - [x] ACLS/BLS → ER主訴の一セクションとして統合
  - [x] 検査読影: 結果全体にProGate + 検査結果/アクション 2タブUI化
  - [x] 生活習慣病: 疾患別評価・優先アクション削除、全アクション(PRO)のみ
- [x] **PRO誘導強化**（2026-03-17）
  - [x] FREE用ダミーマッチ確率モザイク（93%表示）
  - [x] FREE用ダミーAI面接フィードバック表示
  - [x] 穴場→おすすめ表現変更
  - [x] 倍率推移グラフ/おすすめ理由モザイク透過修正（bg-s0/95）
- [x] **UX改善**（2026-03-17）
  - [x] マッチング プロフィール折りたたみアコーディオン
  - [x] AI面接 詳細設定トグル（1スクロールで開始ボタン到達）

---

## Phase 2: マッチング対策（✅ MVP完了 2026-03-17）

- [x] /matching/ ページ作成（4タブ構成）
- [x] プロフィール入力フォーム（FREE操作、PRO保存）
- [x] 履歴書プレビュー＆PRO blurゲート
- [x] 病院DB 20病院（FREE: 3件、PRO: 全件）
- [x] AI面接練習（ローカルフィードバック版）
- [x] AI面接をWorkers AI化（Llama 3.1-8b、ローカルフォールバック付き）
- [x] **Worker再デプロイ完了**（dashboard API + AI面接 — 2026-03-17）
- [x] **病院DB v2**: 45病院、拡張フィールド（倍率数値/推移/忙しさ/ER型/年収/診療科規模/穴場/理念）
- [x] **病院検索強化**: 地域/タイプ/診療科/倍率/年収/忙しさ/ER型/診療科規模 フィルタ＆ソート
- [x] **気になる/志望リスト**: PRO限定、並び替え可能、サブタブUI
- [x] **マッチ確率計算**: 志望リストから95%マッチ確率推定アルゴリズム
- [x] **穴場病院テイザー**: 倍率低下傾向の病院をモザイク付きでPRO誘導
- [x] **倍率推移グラフ**: 過去3年推移をPROモザイク
- [x] **AI面接リニューアル**: チャット形式/音声形式選択、病院別パーソナライズ、圧迫度/時間設定、面接全体フィードバック
- [x] コンポーネント分割（hospitals-data.ts, match-calc.ts, HospitalSection.tsx, InterviewSection.tsx）
- [x] **CORS修正**: Authorizationヘッダー許可（AI不通の根本原因）
- [x] **FREE/PRO線引き**: IP制限5ラリー/日、超過→PRO誘導で面接停止
- [x] **IME対応**: isComposingチェックで日本語変換中Enter送信防止
- [x] **スクロール修正**: メッセージ追加時のみスクロール（入力中ジャンプ防止）
- [ ] 病院DBデータ拡充（→100病院）
- [ ] 履歴書PDF出力機能（PRO）
- [ ] マッチングプロフィールのクラウド保存（Supabase）

## Phase 3: 病棟TODO & 症例ログ（✅ MVP完了 2026-03-17）

- [x] /dashboard/ MVP実装（DashboardApp.tsx）
- [x] lib/josler-data.ts — J-OSLER 17領域・70疾患群の共通データ
- [x] 患者カード（病室/ID/年代/性別/領域/疾患群/診断名）
- [x] カスタマイズ可能タスクボタン（デフォルト5 + 候補19 + カスタム自由追加）
- [x] 退院→症例ログ自動アーカイブ（確認ポップアップ付き）
- [x] 症例ログ（検索/領域別統計/ログ編集/入退院日変更）
- [x] CSVエクスポート（BOM付きUTF-8）→ PRO限定
- [x] カスタム記録項目（自由追加→CSV出力時カラム追加）
- [x] J-OSLER準拠 領域→疾患群→病名 3段階ドロップダウン
- [x] ProGate適用（3人目以上=PRO、CSV=PRO）
- [x] localStorage永続化（全ユーザー、ブラウザ閉じても維持）
- [x] クラウド同期（PRO: Worker API + KV、30秒自動保存 + beforeunload）
- [x] 保存インジケーター（✓保存済み/⟳保存中…/✕エラー）
- [x] Worker API: PUT/GET /api/dashboard + sessionToken認証
- [x] **Worker再デプロイ完了**（2026-03-17）
- [ ] EPOC連携エクスポート

## Phase 4: J-OSLER管理

- [x] /josler/ ティーザーLP
- [x] 旧app.html からOverview/Cases/Summaries機能を移植
- [x] 進捗ダッシュボード（70疾患群）
- [ ] 病歴要約AI生成（旧テンプレート機能移植）
- [x] 病棟TODO症例ログからの自動連携
- [x] クラウド同期（Worker API /api/josler）

## Phase 5: 学習プラットフォーム

- [x] /learning/ ティーザーLP
- [ ] /learning/naika-exam/ 内科専門医試験（旧Quiz機能移植、370疾患）
- [ ] 講座追加基盤（エコー、輸液など）

## Phase 6: 論文フィード自動化

- [x] /journal/ 基本UI
- [ ] PubMed API + Claude API 自動要約パイプライン
- [ ] 最新3件FREE / 全アーカイブPRO

---

## 継続タスク（優先度低）

### コード品質
- [ ] 論文フィード更新の自動化
- [x] GA4 コンバージョン設定（PRO登録、BOOTH遷移、ツール閲覧、お気に入り、ProModal表示）

### 法務
- [ ] Xserverドメイン自動更新ON
- [ ] 合同会社設立（PRO会員100人超えたら）
- [ ] Stripe導入（法人化後）

### 旧資産整理
- [x] 旧worker.js 整理（iwor-apiが後継）→ 削除済み
- [x] 旧public/app.html 削除（Phase 4-5で機能移植完了後）→ 削除済み
- [x] 旧demo_v14_app.html 削除 → 削除済み

---

## 完了サマリー

| Phase | 状態 |
|-------|------|
| Phase 0: 基盤 | ✅ 完了 |
| Phase 1: 臨床ツール（123個） | ✅ 完了 |
| Phase 1.5: PRO基盤 + 収益化 | ✅ 完了（BOOTH価格変更・商品追加残） |
| デザイン統一 v1+v2 | ✅ 完了（グリーンフラット全ページ統一） |
| 認証UX改善 | ✅ 完了（Chrome PW保存、リセット、マイページ） |
| Phase 2: マッチング | ✅ MVP完了＋改善済（折りたたみ、ダミーモザイク、おすすめ表現） |
| Phase 3: 病棟TODO | ✅ 完了（ヘッダー修正済） |
| Phase 4: J-OSLER | ✅ MVP完了（Overview/Cases/Summaries/Other/Guide移植済） |
| Phase 5: 学習 | ティーザーLP完了 |
| Phase 6: 論文フィード | ティーザーLP完了 |

## 次期タスク（優先順）

- [x] **病棟TODO オンボーディングチュートリアル**（ハイライト形式）
- [x] **ICU γ計算アプリ**（15薬剤、5カテゴリ、γ⇔mL/h双方向計算）
- [x] **ER主訴追加 20本完成**（けいれん・めまい・頭痛・腰背部痛・吐血下血・動悸・悪心嘔吐・咽頭痛・喀血・麻痺脱力・咳喀痰・下痢・しびれ・院内発熱）
- [x] **検査読影追加**（心エコー・胸部CT・頭部CT・血液検査・尿検査・頸動脈エコー 6本追加、計11本）
- [x] **薬剤ガイド（旧 抗菌薬ガイド）**（抗菌薬スペクトラム18薬剤 + エンピリック7カテゴリ → 薬剤ハブに拡張）
- [x] **Hokuto掲載計算ツール152個完成**（79→152。Tier1全22+Tier2全40+Tier3全20+プレースホルダー5）
- [x] **サインアップ時ユーザー情報収集**（卒業大学、免許取得年、勤務先病院 — 任意フィールド）
- [x] **お気に入り画面多階層化**（calc/interpret/er/icu/acls/compare/drugs カテゴリフィルタ）
- [x] **マッチング チュートリアル**（5ステップオーバーレイ + ヘルプボタン）
