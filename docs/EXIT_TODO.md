# iwor.jp 売却準備 TODO

> 作成日: 2026-03-15 / 更新: 2026-03-16（67ツール完成）
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

### D. テンプレ出力品質強化
- [ ] 文字数カウンター
- [ ] 検査値自動挿入テンプレ
- [ ] 考察テンプレート強化
- [ ] 推奨参考文献の自動出力

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
- [x] エグゼクティブサマリー（2026-03-15、docs/INFORMATION_MEMORANDUM.md）
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
| WS1: プロダクト | 37 | 3 | 93% |
| WS2: 数字を残す | 5 | 7 | 42% |
| WS3: コード清潔さ | 18 | 1 | 95% |
| WS4: 法務・インフラ | 8 | 9 | 47% |
| **合計** | **77** | **23** | **77%** |

---

*タスク完了ごとに更新。次回レビュー: 2026年4月*
