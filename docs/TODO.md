# iwor.jp 売却準備 TODO

> 作成日: 2026-03-15 / 更新: 2026-03-16（検査読影SVG模式図追加）
> 方針: 自走メイン、売却は保険。プロダクト価値を上げつつ売却可能な状態を整える。

---

## WS0: ドメイン移行・基盤構築

### A. iwor.jp セットアップ
- [x] iwor.jp ドメイン取得（Xserverドメイン、2026-03-15）
- [x] Xserverドメインのネームサーバーを Cloudflare に変更（2026-03-15）
- [x] Cloudflare で iwor.jp をサイト追加・DNS設定（2026-03-15）
- [x] iwor.jp で Next.js プロジェクト初期デプロイ確認（2026-03-15、Cloudflare Pages "iwor"）

### B. naikanavi.com → iwor.jp 移植
- [x] 173記事の移植（MDXそのまま、ソースコード内naikanavi→iwor.jp置換済み 2026-03-15）
- [x] naikanavi.com から iwor.jp への 301リダイレクト設定 → 不要（naikanavi.com開設数日、SEO資産なし）
- [x] GSC で iwor.jp を登録・サイトマップ送信（2026-03-15、ドメインプロパティ）
- [x] GA4 を iwor.jp に設定（2026-03-15、G-VTCJT6XFHG）
- [x] naikanavi.com DNS削除（重複コンテンツ防止、2026-03-15）

### C. tellmedu.com 整理
- [ ] tellmedu.com の note販売停止判断
- [ ] 必要なコンテンツの抽出・保存
- [ ] 将来の /matching/ 統合に向けた設計メモ作成

---

## WS1: プロダクト価値向上

### A. 臨床計算ツール群（/tools/）
- [x] 共通Calculatorコンポーネント設計・実装
- [x] /tools/ 一覧ページ作成（検索窓付き）
- [x] Tier1: CHA2DS2-VASc
- [x] Tier1: CHADS2
- [x] Tier1: HAS-BLED
- [x] Tier1: Child-Pugh
- [x] Tier1: MELD
- [x] Tier1: CURB-65
- [x] Tier1: A-DROP
- [x] Tier1: Wells PE
- [x] Tier1: Wells DVT
- [x] Tier1: GRACE
- [x] Tier1: qSOFA
- [x] Tier1: SOFA
- [x] Tier1: FIB-4
- [x] Tier1: eGFR（CKD-EPI）
- [x] Tier1: 補正Ca
- [x] Tier1: A-aDO2
- [x] Tier2: BMI, BSA, Cockcroft-Gault, GCS, RCRI, AG, ABCD2, mRS, ECOG, Karnofsky（2026-03-15）
- [x] Tier2残: NIHSS, APACHE II（2026-03-15）
- [x] Tier3: 10種（GBS, AIMS65, HEART, TIMI, NEWS2, Charlson, Centor, Caprini, Padua, MASCC）（2026-03-15）
- [x] Tier3残: 10種（Alvarado, PERC, Ottawa Ankle, Rockall, sPESI, PHQ-9, GAD-7, ISTH DIC, Light基準）（2026-03-15）
- [x] 追加12種: QTc, MAP, FENa, 浸透圧Gap, Winters式, 補正PHT, IBW/ABW, ANC, MELD-Na, Ranson, BISAP, AUDIT（2026-03-16）→ **67ツール完成**
- [x] 追加3種: LDL-C Friedewald, γ計算, Parkland式（2026-03-16）→ **70 calcツール**
- [x] 生活習慣病 総合管理ツール /tools/lifestyle/（2026-03-16）高血圧/DM/脂質/CKD/肝障害/尿酸/肥満 7疾患一括評価
- [x] お気に入り機能（FavoriteButton + PROモーダル + FavoritesBar）全70ツール対応（2026-03-16）
- [x] /tools/ ページを内科外来/ER・救急/病棟業務の3軸に再構成（2026-03-16）
- [x] /tools/ ページ再整理: 生活習慣病ヒーロー + 全13カテゴリカード復活（2026-03-16）
- [x] ヘッダー「計算ツール」→「ツール」に変更、パンくず修正（2026-03-16）
- [x] 主要12ツールにデフォルト値設定（2026-03-16）
- [x] 血ガス解釈インタラクティブフロー /tools/interpret/blood-gas/（2026-03-16）
- [x] 検査読影ハブ /tools/interpret/ 作成（2026-03-16）
- [x] /tools/interpret/ 全5本完成: 血ガス・心電図・胸部X線・腹部エコー・体液検査（2026-03-16）
- [x] 検査読影ツールにインタラクティブ模式図SVG追加（胸部X線・心電図・腹部エコー）（2026-03-16）
- [x] 生活習慣病ツールにデフォルト値設定（2026-03-16）
- [x] 各ツールにSEO解説セクション追加
- [x] 既存173記事との相互内部リンク（2026-03-15、63記事にツールリンクボックス挿入）
- [x] 構造化データ（MedicalWebPage + FAQPage）

### B. 抗菌薬 腎機能別用量調整ツール
- [x] eGFR/CrCl自動計算（2026-03-15、renal-dose-abxに統合）
- [x] 主要20薬剤の腎機能別投与量テーブル（2026-03-15）
- [x] 免責表示（2026-03-15）

### B2. インスリンスライディングスケール
- [x] 3段階スケール（低・標準・高用量）実装（2026-03-15）

### C. 輸液・電解質補正計算群
- [x] 維持輸液計算（4-2-1ルール）（2026-03-15）
- [x] Na欠乏量・自由水欠乏量計算（2026-03-15）
- [x] Na補正速度計算（2026-03-15）
- [x] KCL補正計算（2026-03-15）
- [x] ステロイド換算ツール（2026-03-15）

### E. ER主訴別対応ツリー（/tools/er/）

### E2. 薬剤比較表（/compare/）
- [x] DrugCompareLayout共通コンポーネント（ソート・ハイライト・免責）（2026-03-16）
- [x] /compare/ ハブページ作成（7領域25カテゴリ構成）（2026-03-16）
- [x] 全25カテゴリ完成（計155薬剤）: DOAC, スタチン, PPI, ARB, SGLT2i, DPP-4i, NSAIDs, CCB, β遮断薬, 抗ヒスタミン薬, 睡眠薬, SSRI/SNRI, 利尿薬, ステロイド, 便秘薬, 抗血小板薬, BZD, GLP-1RA, 尿酸降下薬, キノロン系, セフェム系, 抗てんかん薬, 吸入薬, 鉄剤, 抗血小板薬（2026-03-16）
- [x] ERDisclaimerコンポーネント（冒頭バナー+末尾免責+結果ノード注意書き）（2026-03-16）
- [x] /tools/er/ ハブページ（2026-03-16）
- [x] /tools/er/chest-pain/ 胸痛対応ツリー（16ノード。Killer 5疾患系統的除外）（2026-03-16）
- [x] /tools/er/altered-consciousness/ 意識障害対応ツリー（15ノード。AIUEOTIPS）（2026-03-16）
- [x] /tools/er/abdominal-pain/ 腹痛対応ツリー（17ノード。部位別鑑別+緊急手術適応）（2026-03-16）
- [x] 全ERツールから具体的薬剤用量を削除 → 「施設プロトコル参照」に統一（2026-03-16）
- [x] 失神ER対応ツリー（2026-03-16）
- [x] 発熱ER対応ツリー（2026-03-16）
- [x] 呼吸困難ER対応ツリー（2026-03-16）

### D. テンプレ出力品質強化

### D2. ACLS / BLS フロー（/tools/acls/）
- [x] /tools/acls/ ハブページ（2026-03-16）
- [x] /tools/acls/bls/ 成人BLS（14ノード。反応確認→119番→CPR→AED→ROSC）（2026-03-16）
- [x] /tools/acls/cardiac-arrest/ 心停止（15ノード。VF/pVT + Asystole/PEA + 5H/5T + ROSC後管理）（2026-03-16）
- [x] /tools/acls/tachycardia/ 頻脈（18ノード。SVT・AF・VT・WPW+AF・Torsades）（2026-03-16）
- [x] /tools/acls/bradycardia/ 徐脈（12ノード。アトロピン→TCP→PM適応）（2026-03-16）

### D3. ICU管理ツール（/tools/icu/）
- [x] /tools/icu/ ハブページ（2026-03-16）
- [x] /tools/icu/ventilator/ 人工呼吸器初期設定（IBW→病態別推奨、ARDSNet FiO₂/PEEP表）（2026-03-16）
- [x] /tools/icu/vasopressor/ 昇圧剤選択ガイド（7薬剤比較、ショック5分類別フロー）（2026-03-16）
- [x] /tools/icu/nutrition/ ICU栄養計算（ESPEN/ASPEN準拠、製剤9種比較、refeeding risk）（2026-03-16）
- [x] /tools/icu/sedation/ 鎮静・鎮痛・せん妄（RASS/CAM-ICU/BPS/CPOT）（2026-03-16）

### D4. テンプレ出力品質強化
- [ ] 文字数カウンター
- [ ] 検査値自動挿入テンプレ
- [ ] 考察テンプレート強化
- [ ] 推奨参考文献の自動出力

### F. PROゲート＋PLG基盤（★最優先 — 収益化の前提）
- [ ] ProGate コンポーネント作成（モザイク/ロック/プレビュー3パターン）
- [ ] ProModal 共通化（FavoriteButton.tsxから抽出→components/pro/に移動）
- [ ] useProStatus フック作成（PRO判定の一元管理、Phase1: localStorage、Phase2: Supabase）
- [ ] お気に入りパルスアニメーション（初回のみ、1回限り）
- [ ] 計算ツール1つにProGate組み込み（プロトタイプ検証）
- [ ] 全計算ツールの解釈セクションにProGate適用
- [ ] 検査読影（血ガス等）にProGate適用
- [ ] 生活習慣病ツールのアクションプランにProGate適用
- [ ] /pro/ ランディングページ作成
- [ ] PLGタッチポイント: 3回目利用バナー（1回のみ表示）
- [x] docs/PRODUCT.md 作成（2026-03-16）

---

## WS2: 数字を残す（売却額に直結）

### A. アクセス解析（★最優先 — データは過去に遡れない）
- [x] GA4 を iwor.jp に設置（2026-03-15、G-VTCJT6XFHG）
- [x] GSC で iwor.jp を登録・サイトマップ送信（2026-03-15）
- [x] 月次PVレポート体制構築（2026-03-15、docs/OPERATIONS_MANUAL.md + docs/analytics/）
- [ ] GA4 コンバージョン設定（PRO登録、BOOTH遷移）

### B. 売上記録
- [ ] BOOTH売上画面を毎月スクショ → docs/revenue/ に保存
- [x] コスト記録スプレッドシート作成（2026-03-15、docs/COST_RECORD.md）
- [x] 月次P/L（売上−コスト＝利益）の記録開始（2026-03-15、docs/COST_RECORD.md）

### C. BOOTH売上
- [ ] iwor PRO 年間パス商品設計（¥9,800/年）
- [ ] BOOTH商品ページ最適化（iworブランドで）
- [ ] 購入→アクティベーションコード発行フロー構築

### D. アフィリエイト
- [ ] 医師転職サイトとのアフィリエイト提携
- [ ] キャリア記事にCTA設置

---

## WS3: コードの清潔さ（買い手のエンジニアが30分で動かせる状態）

### A. リポジトリ整備
- [x] README.md にプロジェクト概要・セットアップ手順
- [x] .env.example 作成（必要な環境変数一覧）（2026-03-15）
- [x] 依存パッケージのライセンス確認（2026-03-15、GPL混入なし。docs/LICENSE_AUDIT.md）
- [x] テストを最低1つ書く（2026-03-15、eGFR/FIB-4/補正Ca/A-aDO2 13テスト。tests/calc-logic.test.mjs）
- [x] ソースコード内 naikanavi 参照の一括置換（2026-03-15、37ファイル99箇所。BOOTH/email除く）

### B. 技術資産ドキュメント
- [x] アーキテクチャ図（2026-03-15、docs/ARCHITECTURE.md）
- [x] インフラ構成図（2026-03-15、ARCHITECTURE.mdに統合）
- [x] 依存サービス一覧（2026-03-15、docs/SERVICE_DEPENDENCIES.md）

### C. 運営マニュアル（属人性を下げる）
- [x] コンテンツ更新手順書（2026-03-15、docs/CONTENT_UPDATE_GUIDE.md）
- [x] 定常作業一覧と自動化状況（2026-03-15、docs/OPERATIONS_MANUAL.md）
- [ ] 論文フィード更新の自動化（n8n + PubMed API + Claude API）
- [x] バックアップ手順（2026-03-15、docs/OPERATIONS_MANUAL.md）

### D. 事業概要書（IM）
- [x] エグゼクティブサマリー（2026-03-15、docs/STRATEGY.md）
- [x] 事業内容・プロダクト説明（同上）
- [x] 市場分析（TAM/SAM/SOM）（同上）
- [x] 競合優位性（同上）
- [x] 成長戦略（同上）
- [x] 財務サマリー（月次P/L推移）（同上 + docs/COST_RECORD.md）

---

## WS4: 法務・インフラ整備

### A. 法的リスクゼロ化（★今すぐやるべき）
- [x] 医療情報免責表示を全ページフッターに設置（2026-03-15）
- [x] 全ツールに出典明記の確認（2026-03-15、36ツール全て確認済み）
- [x] 利用規約にデータ利用条項追加（第7条データの利用・第8条事業譲渡）（2026-03-15）
- [x] プライバシーポリシーにデータ第三者提供条項追加（第6条事業譲渡時のデータ移転）（2026-03-15）
- [x] 利用規約の最新版確認（2026-03-15、iwor全体対応に全面改訂）
- [x] プライバシーポリシーの最新版確認（2026-03-15、GA4・Cookie・事業譲渡追加）

### B. アカウント・ドメイン整理
- [x] 新ドメイン iwor.jp 取得（Xserverドメイン）
- [ ] Xserverドメイン自動更新ON（失効防止）
- [x] 全アカウント一覧表作成（2026-03-15、docs/ACCOUNT_LIST.md）
- [ ] iwor関連アカウントを専用メールに統一（将来 info@iwor.jp）
- [ ] naikanavi.com の管理・リダイレクト維持
- [ ] Cloudflareアカウント整理（iwor.jp追加）

### C. 法人化（PRO会員100人超えたら）
- [ ] 合同会社設立（freee会社設立）
- [ ] バーチャルオフィス契約
- [ ] 法人口座開設
- [ ] 特商法表記の法人名義化
- [ ] Stripe導入

---

## 進捗サマリー

| WS | 完了 | 残り | 進捗率 |
|----|------|------|--------|
| WS0: ドメイン移行 | 9 | 3 | 75% |
| WS1: プロダクト | 68 | 14 | 83% |
| WS2: 数字を残す | 5 | 7 | 42% |
| WS3: コード清潔さ | 18 | 1 | 95% |
| WS4: 法務・インフラ | 8 | 9 | 47% |
| **合計** | **108** | **34** | **76%** |

---

*タスク完了ごとに更新。次回レビュー: 2026年4月*
