# CLAUDE.md — iwor Agent Operating Manual

## Identity

iwor（イウォール）— 医師のためのワークスペース。iwor.jp。個人開発SaaS。

## First Steps (every session)

```bash
# 1. Read docs/README.md FIRST — it defines which file owns what info
cat docs/README.md
# 2. Read the specific docs relevant to your task
# 3. After docs/ changes, ALWAYS run:
bash scripts/docs-check.sh  # must pass with 0 errors before push
```

## Git Rules — IMPORTANT

- `git push origin main` で直接プッシュ（CIが自動で走る）
- `git add -A` is FORBIDDEN. Use `git add <file>` individually
- NEVER commit node_modules/
- Small commits: 1 task = 1 commit with prefix (feat:, fix:, docs:, refactor:, style:)
- ALWAYS push after commit. Work is not done until pushed
- docs/ changes require `bash scripts/docs-check.sh` pass before push
- Commit messages: Japanese OK

## Docs Structure (SSOT — Single Source of Truth)

Each piece of info lives in exactly ONE file. Check docs/README.md for ownership.

| File | Owns | Does NOT own |
|------|------|-------------|
| STRATEGY.md | Price, roadmap, competitors, brand, business model | Product specs, code |
| PRODUCT.md | Feature specs, PRO/FREE gates, DB schema, PLG design | Price, roadmap |
| IMPLEMENTATION.md | Tech stack, coding rules, SEO implementation | Product specs |
| DESIGN_SYSTEM.md | Colors, fonts, spacing, component styles | Code logic |
| TODO.md | Tasks, progress, completion dates | Strategy reasoning |
| FEATURE_REQUESTS_v6.md | Feature backlog with priority (🔴🟠🟡🟢) | Implementation details |

When adding info: find the owner in docs/README.md → write there ONLY.
When referencing: don't copy, write "→ STRATEGY.md 参照".

## Tech Stack

- Next.js 14 App Router + TypeScript + Tailwind CSS
- Cloudflare Pages (frontend) + Workers + KV (API/data)
- MDX for blog (content/blog/)
- No external UI library — custom components only

## Code Style

- Functional React components only (no class components)
- Server Components by default, 'use client' only when needed
- Tailwind utilities, minimal custom CSS
- Design tokens: → DESIGN_SYSTEM.md (colors, spacing, typography)
- Components in components/, pages in app/, data/config in lib/
- Japanese comments OK, English variable/function names

## Key Files

- `lib/tools-config.ts` — all 166 calculator tool definitions
- `components/pro/` — ProGate, ProModal, useProStatus (PRO gating system)
- `app/study/` — iwor Study (FSRS flashcards, core product)
- `app/page.tsx` — home screen (10 icon grid + search bar)
- `workers/api.js` — Worker API (auth, PRO validation, journal cache)

## Deploy

```bash
# Frontend: push to main triggers Cloudflare Pages auto-build
git push origin main
# Worker API:
cd workers && npx wrangler deploy
# Worker local test:
cd workers && npx wrangler dev
```

## Current State (2026-03-21)

- 10 services on home screen (tools, record, credits, conferences, matching, journal, presenter, shift, study, money)
- BottomNav: Study / ツール / キャリア / マイページ (4-tab layout)
- 166 clinical calculators + drug guides + procedure guides
- Study: FSRS MVP with 3 default decks (150 cards) + custom deck CRUD + streak ranking
- Journal: EN 28 journals + JA 10 journals with lang toggle
- PRO: Worker API + BOOTH(非公開済み) → Creem移行準備中 (Paddle並行申請)
- Price: Monthly ¥980 / 6mo ¥5,400 (decoy) / Annual ¥9,800
- Blog: 173 articles
- Hero Product: Study (全ユーザーをStudyに誘導する3層戦略)

See TODO.md for current priorities.

## Gotchas — Claude's Known Failure Points

1. **Overwrites entire files**: When editing large files, use targeted edits (str_replace), not full rewrites
2. **Ignores DESIGN_SYSTEM.md colors**: ALWAYS check DESIGN_SYSTEM.md before writing any color/style. The palette uses CSS custom properties (--bg, --fg, etc.)
3. **Duplicates info across docs**: Before writing to any doc, check docs/README.md for the correct owner file
4. **Forgets ProGate pattern**: PRO features use ProGate wrapper component. Check components/pro/ before implementing any PRO feature
5. **Creates unnecessary API calls**: Frontend is static-first (Cloudflare Pages). Use localStorage/KV, not database calls, unless specifically needed
6. **Blog MDX format errors**: Check content/blog/ for existing examples before creating new articles. Frontmatter must match lib/blog-config.ts categories
7. **Breaks search index**: After adding/removing tools, regenerate with `node scripts/generate-search-index.mjs`
8. **Context drift in long sessions**: At 50% context usage, run /compact. For new tasks, prefer /clear and restart

## What NOT to do

- Do NOT create patient data features (legal risk — SaMD)
- Do NOT add pharmaceutical ads (brand promise: 製薬・医療広告ゼロ)
- Do NOT use free-text input for clinical data (dropdown only)
- Do NOT reference deleted services: ER actions, imaging interpretation, ward TODO, AI interview, ACLS/BLS
- Do NOT change prices without explicit CEO approval

## Virtual Executive Team（サブエージェント）

`.claude/agents/` に50名の専門家エージェントを配置済み。タスクに応じて自動委譲される。

### 主要エージェント

| 分野 | エージェント | 自動起動条件 |
|------|-------------|-------------|
| セキュリティ | ciso | 認証/API/データ処理のコード変更時 |
| SEO | seo | 公開ページの作成・変更時 |
| 医療コンプラ | medical-compliance | 医療関連コンテンツ・機能追加時 |
| コードレビュー | code-reviewer | PRレビュー・大きなコード変更時 |
| QA | qa | テスト作成・品質チェック時 |
| フロントエンド | frontend | React/Next.js実装時 |
| バックエンド | backend | Workers/KV/D1実装時 |
| デバッグ | debugger | バグ修正時 |

### コミュニティエージェント追加

```bash
# VoltAgent（127+のコミュニティエージェント）からブラウズ・インストール
# Claude Code内で agent-installer を呼び出す
"agent-installerを使ってTypeScript専門エージェントを探して"
```

全エージェント一覧: `.claude/agents/README.md`
