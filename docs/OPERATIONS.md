# 定常作業一覧・バックアップ手順

> 最終更新日: 2026-03-19（戦略ピボット対応）

---

## 1. 定常作業一覧

### 日次（自動）
| 作業 | 手段 | 自動化状況 |
|------|------|-----------|
| Cloudflare Pages ビルド | git push → 自動ビルド | ✅ 完全自動 |
| GA4 データ収集 | GA4タグ | ✅ 完全自動 |
| GSC クロール | Google Bot | ✅ 完全自動 |

### 週次（手動）
| 作業 | 手段 | 所要時間 | 備考 |
|------|------|---------|------|
| 記事公開（1-2本/週目標） | MDX作成 → git push | 30-60分/本 | 臨床系記事は避ける（法務リスク） |
| GSC パフォーマンス確認 | GSC管理画面 | 5分 | クリック数・表示回数・CTR |

### 月次（手動）
| 作業 | 手段 | 所要時間 |
|------|------|---------|
| GA4 月次レポートスクショ | GA4管理画面 → docs/analytics/ | 10分 |
| Paddle売上確認 | Paddle管理画面 → docs/revenue/ | 5分 |
| コスト記録更新 | 本ファイルのP/Lセクション | 5分 |
| 依存パッケージ更新確認 | `npm outdated` | 15分 |

### 四半期（手動）
| 作業 | 手段 | 所要時間 |
|------|------|---------|
| SSL証明書確認 | Cloudflare（自動更新だが確認） | 2分 |
| ドメイン更新確認 | Xserver管理画面 | 2分 |
| 利用規約・プライバシーポリシーレビュー | 法改正チェック | 30分 |
| 競合サイト動向チェック | HOKUTO, m3, メドピア | 30分 |

### 将来自動化予定
| 作業 | 自動化手段 | 導入時期 |
|------|-----------|---------|
| 論文フィードキャッシュ更新 | Worker cron + PubMed API | Step 1 |
| 学会情報自動収集 | Worker cron + Claude Haiku | Step 4 |
| バックアップ | GitHub Actions + Supabase backup | Phase 2 |

---

## 2. バックアップ手順

### 2.1 ソースコード
**保管先:** GitHub (aglitch120/iwor)
**復元:** `git clone` で即時復元

### 2.2 ブログ記事・コンテンツ
GitHubリポジトリ内 (`content/blog/`) のMDXファイル。git cloneに含まれる。

### 2.3 GA4・GSCデータ
月次スクショを `docs/analytics/` に保存。

### 2.4 Supabase データ（Phase 2以降）
日次自動バックアップ + 週次手動エクスポート。

### 2.5 ドメイン・DNS
- iwor.jp: Xserverドメイン → Cloudflare DNS
- 復元: 新Cloudflareアカウントにドメイン追加 → ネームサーバー変更

---

## 3. アカウント一覧

> ⚠ パスワードは記載しない。パスワードマネージャーで管理。

### 本番サービス
| サービス | アカウント/ID | 用途 |
|---------|-------------|------|
| **GitHub** | aglitch120 | ソースコード管理 |
| **Cloudflare** | (要記入) | DNS・Pages・Workers |
| **Xserverドメイン** | (要記入) | ドメイン registrar |
| **GA4** | (要記入) | アクセス解析 (G-VTCJT6XFHG) |
| **GSC** | (同上) | SEO・インデックス管理 |

### 決済（移行中）
| サービス | 状態 | 用途 |
|---------|------|------|
| **BOOTH** | ⚠ 非公開予定 | 旧決済Phase 1（役務提供に該当するため移行） |
| **Paddle** | 申請中 | 新決済（MoRモデル、実名非公開可） |

### 将来導入予定
| サービス | 導入時期 | 用途 |
|---------|---------|------|
| **Supabase** | Phase 2（100人超） | Auth + DB |
| **Claude API** | 学会情報自動収集時 | LLM構造化抽出 |

### 旧サイト
| サイト | 状態 |
|--------|------|
| naikanavi.com | DNS削除済み |
| tellmedu.com | 閉鎖予定 |

---

## 4. インフラ構成

### Cloudflare Worker API (iwor-api)
- URL: https://iwor-api.mightyaddnine.workers.dev
- KV: IWOR_KV (ID: 4af092a9ddd243f09a0f6d2f1979dc6e)
- デプロイ: `cd workers && npx wrangler deploy`

### Google Apps Script（BOOTH注文取込 — 非公開後は停止予定）
- tellmedu.info@gmail.com / naikanavi.info@gmail.com
- 1分ごとにcheckBoothOrders()実行
- Paddle移行後は停止

### BOOTH（非公開予定）
- ショップ: https://iwor.booth.pm
- 商品: /items/8087647（1年）/items/8092008（2年）/items/8092010（3年）
- **強制非公開予定** — 役務提供に該当するため

---

## 5. 事業譲渡時の移転チェックリスト

- [ ] GitHub リポジトリ Transfer
- [ ] Cloudflare ゾーン移管
- [ ] Xserver ドメイン移管
- [ ] GA4/GSC オーナー権限移管
- [ ] Paddle アカウント引継ぎ
- [ ] Supabase プロジェクト移管（Phase 2以降）
- [ ] Worker Secrets 引き渡し

---

## 6. 月次コスト・P/L

### 固定費
| 項目 | 月額 | 年額 |
|------|------|------|
| iwor.jp ドメイン | ¥108 | ¥1,298 |
| Cloudflare Pages/Workers | ¥0 | ¥0 |
| GitHub | ¥0 | ¥0 |
| **固定費合計** | **¥108** | **¥1,298** |

### 変動費（将来）
| 項目 | 想定月額 | 導入条件 |
|------|---------|---------|
| Supabase | ¥0〜¥3,750 | Phase 2 |
| Claude API | ¥25〜¥500 | 学会情報自動収集時 |
| Paddle手数料 | 売上の5%+$0.50 | Paddle移行後 |

### 2026年 月次P/L

| 月 | 売上 | コスト | 利益 | PV | PRO会員 | 備考 |
|----|------|--------|------|-----|---------|------|
| 3月 | ¥100 | ¥108 | -¥8 | — | 1(テスト) | サイト構築中 |
| 4月 | | | | | | |
