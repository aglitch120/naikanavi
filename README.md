# iwor

医師の臨床とキャリアを、ずっと身近に支える。

**iwor（イウォール）** — アイヌ語で「恵みの地」

## ドメイン

- 本番: https://iwor.jp
- 旧サイト: https://naikanavi.com（→ iwor.jp に301リダイレクト予定）

## 技術スタック

- Next.js 14 + MDX + Tailwind CSS
- Cloudflare Pages / Workers / KV
- DNS: Cloudflare（Xserverドメインからネームサーバー変更）

## クイックスタート

```bash
npm install
npm run dev

# デプロイ
npx wrangler deploy
```

## プロジェクト構成

```
iwor/
├── app/                    # Next.js App Router
│   ├── about/              # iworについて
│   ├── admin/              # 管理画面（SEOヘルスチェック等）
│   ├── blog/               # SEOブログ（173記事）
│   ├── compare/            # 薬剤比較（25カテゴリ）
│   ├── contact/
│   ├── privacy/
│   ├── terms/
│   ├── tokushoho/
│   └── tools/              # 臨床ツール群
│       ├── calc/           #   計算ツール（79個）
│       ├── er/             #   ER主訴別対応ツリー（6本）
│       ├── acls/           #   ACLS/BLS フロー（4本）
│       ├── icu/            #   ICU管理ツール（4本）
│       ├── interpret/      #   検査読影（5本、SVG模式図付き）
│       └── lifestyle/      #   生活習慣病総合管理
├── components/             # 共通コンポーネント
│   ├── blog/               #   ブログ用
│   ├── compare/            #   薬剤比較用
│   ├── pro/                #   ProGate/ProModal/useProStatus
│   └── tools/              #   ツール共通（CalculatorLayout等）
│       └── interpret/      #     検査読影SVG（胸部X線/心電図/腹部エコー）
├── content/blog/           # MDX記事ファイル
├── docs/                   # プロジェクトドキュメント（→ docs/README.md 参照）
├── lib/                    # ユーティリティ・設定
├── public/                 # 静的アセット
├── scripts/                # ビルド・品質チェック
├── tests/                  # テスト
└── worker.js               # Cloudflare Workers API
```

## ドキュメント

docs/ 内の9ファイルはMECE構成。詳細は [docs/README.md](docs/README.md) を参照。

| ファイル | 役割 |
|---------|------|
| [README.md](docs/README.md) | インデックス。どのファイルが何を持つかの定義 |
| [STRATEGY.md](docs/STRATEGY.md) | 経営判断の全て（価格/ロードマップ/競合/売却） |
| [PRODUCT.md](docs/PRODUCT.md) | プロダクト仕様（ゲート設計/機能仕様/DB設計） |
| [IMPLEMENTATION.md](docs/IMPLEMENTATION.md) | コードの書き方（技術スタック/アーキテクチャ） |
| [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | 見た目の定義（色/フォント/コンポーネント） |
| [CONTENT_GUIDE.md](docs/CONTENT_GUIDE.md) | 記事の書き方（SEO/品質基準/更新手順） |
| [JOSLER_GUIDE.md](docs/JOSLER_GUIDE.md) | J-OSLER医学リファレンス |
| [OPERATIONS.md](docs/OPERATIONS.md) | 運用（アカウント/コスト/定常作業） |
| [TODO.md](docs/TODO.md) | タスクトラッカー |
