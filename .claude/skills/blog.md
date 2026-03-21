---
name: blog
description: MDXブログ記事の作成・編集・SEO最適化時に使う。
---

# Blog スキル

## 対象ディレクトリ
- `content/blog/` — MDX記事ファイル（173本+）
- `app/blog/` — ブログページコンポーネント
- `components/blog/` — ShareButtons等の共通コンポーネント

## 記事作成ルール
- フォーマット: MDX（frontmatter + Markdown + JSXコンポーネント）
- frontmatter必須フィールド: title, description, date, category, tags
- カテゴリ: 試験対策 / 医師お金 / 臨床 / キャリア 等
- 画像: `public/images/blog/` に配置、WebP推奨

## SEO要件（YMYL医療系）
- title: 30〜60文字、主要KWを前方配置
- description: 120〜160文字
- h2/h3で構造化、1記事1KWフォーカス
- E-E-A-T: 出典明記、「現役医師が解説」等の権威性
- 内部リンク: 関連ツール・関連記事を本文中に挿入
- 構造化データ: Article schema自動付与

## 注意
- 医療情報は出典必須（ガイドライン・論文）
- 「推奨」「すべき」→「参考」「一つの選択肢」に言い換え
- 個別の診断・治療アドバイスは書かない
