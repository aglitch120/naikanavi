# 定常作業一覧・バックアップ手順

> 最終更新日: 2026-03-15

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
| 記事公開（1-2本/週目標） | MDX作成 → git push | 30-60分/本 | SEO効果は月単位で発現 |
| GSC パフォーマンス確認 | GSC管理画面 | 5分 | クリック数・表示回数・CTR |

### 月次（手動）
| 作業 | 手段 | 所要時間 | 備考 |
|------|------|---------|------|
| GA4 月次レポートスクショ | GA4管理画面 → docs/analytics/ | 10分 | 売却時のエビデンス |
| BOOTH売上スクショ | BOOTH管理画面 → docs/revenue/ | 5分 | |
| コスト記録更新 | docs/COST_RECORD.md | 5分 | |
| 依存パッケージ更新確認 | `npm outdated` | 15分 | セキュリティパッチ優先 |
| サイトマップ再送信 | GSC管理画面 | 2分 | 大量記事追加時のみ |

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
| 論文フィード更新 | n8n + PubMed API + Claude API | Phase 2 |
| 月次PVレポート自動生成 | GA4 API + スクリプト | PRO会員50人超 |
| バックアップ | GitHub Actions + Supabase backup | Phase 2 |

---

## 2. バックアップ手順

### 2.1 ソースコード（最重要）

**保管先:** GitHub (aglitch120/iwor)
**頻度:** 毎コミット（自動）
**復元:** `git clone` で即時復元可能

```bash
# 別マシンへのバックアップ
git clone https://github.com/aglitch120/iwor.git
```

### 2.2 ブログ記事・コンテンツ

**保管先:** GitHubリポジトリ内 (`content/blog/`)
**形式:** MDXファイル（プレーンテキスト）
**復元:** git cloneに含まれる

記事はすべてGitで管理されているため、GitHub自体がバックアップ。
追加保険として、ローカルPCにもcloneを保持すること。

### 2.3 GA4・GSCデータ

**保管先:** Google Cloud
**バックアップ:**
- GA4: 月次スクショを `docs/analytics/` に保存
- GSC: 月次スクショを `docs/analytics/` に保存
- GA4 データエクスポート: BigQuery連携（将来）

```bash
mkdir -p docs/analytics
# 毎月1日に GA4 > レポート > スナップショット をスクショ保存
# ファイル名: ga4_YYYY-MM.png
```

### 2.4 Supabase データ（Phase 2以降）

**対象:** ユーザーデータ、症例データ、進捗データ
**手段:** Supabase Dashboard > Database > Backups
**頻度:** 日次（Supabase自動バックアップ + 週次手動エクスポート）

```bash
# 週次手動バックアップ（Phase 2以降）
# Supabase CLI
supabase db dump -f backup_$(date +%Y%m%d).sql
```

### 2.5 ドメイン・DNS

**iwor.jp:**
- Registrar: Xserverドメイン
- DNS: Cloudflare
- バックアップ: DNS設定をスクショ or エクスポート

**復元手順:**
1. 新しいCloudflareアカウントにドメイン追加
2. Xserverでネームサーバーを新Cloudflareに変更
3. DNS レコードを再設定（Cloudflare Pages CNAMEのみ）

### 2.6 災害復旧シナリオ

| シナリオ | 復旧手順 | RTO |
|---------|---------|-----|
| Cloudflare Pages障害 | 待機（通常数時間で復旧） | 数時間 |
| GitHubリポジトリ消失 | ローカルcloneからpush | 30分 |
| ドメイン失効 | Xserverで復活（猶予期間あり） | 1-3日 |
| Supabase障害（Phase 2） | バックアップSQLから復元 | 1-2時間 |
| 全データ喪失 | ローカルclone + Supabaseバックアップから再構築 | 半日 |
