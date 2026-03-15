# iwor

医師の臨床とキャリアを、ずっと身近に支える。

**iwor（イウォル）** — アイヌ語に由来

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
├── app/                 # Next.js App Router
│   ├── blog/            # SEOブログ（173記事）
│   ├── tools/           # 臨床計算ツール群
│   ├── contact/
│   ├── privacy/
│   ├── terms/
│   └── tokushoho/
├── components/          # 共通コンポーネント
├── content/blog/        # MDX記事ファイル
├── docs/                # プロジェクトドキュメント
├── lib/                 # ユーティリティ・設定
├── public/              # 静的アセット
├── scripts/             # ビルド・品質チェック
└── worker.js            # Cloudflare Workers API
```

## ドキュメント

| ファイル | 内容 |
|---------|------|
| [BUSINESS_OVERVIEW.md](docs/BUSINESS_OVERVIEW.md) | ビジネス概要・収益モデル・競合分析 |
| [EXIT_STRATEGY.md](docs/EXIT_STRATEGY.md) | EXIT戦略・ロードマップ |
| [EXIT_TODO.md](docs/EXIT_TODO.md) | TODOトラッカー（WS0〜WS4） |
| [SEO_GUIDELINE.md](docs/SEO_GUIDELINE.md) | SEO・記事作成ルール |
| [IMPLEMENTATION_GUIDE.md](docs/IMPLEMENTATION_GUIDE.md) | 技術実装ガイド |
| [DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | デザインシステム |
