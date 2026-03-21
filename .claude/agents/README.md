# iwor.jp Virtual Executive Team — Claude Code Sub-Agents

Google・Apple・Netflix・Stripe・Spotifyの組織構造を参考に構築された51名の専門家チーム。
さらにVoltAgentコミュニティの127+エージェントにオンデマンドでアクセス可能。

## 使い方

Claude Codeが**タスクの内容に応じて自動的に適切なエージェントを選択・起動**する。
手動で呼び出す場合は `/agents` コマンドまたは直接指定。

```bash
# 自動委譲（Claude Codeが判断）
claude "このAPIのセキュリティをレビューして"  # → ciso が自動起動

# 手動指定
claude --agent seo "このページのSEOを最適化して"
claude --agent medical-compliance "この文言は医療広告ガイドラインに抵触しない？"
```

## 部門構成（46名）

| 部門 | エージェント |
|------|-------------|
| **C-Suite (4)** | ceo, coo, cfo, cro |
| **プロダクト (6)** | cpo, ux-researcher, content-strategist, accessibility, i18n, product-analytics |
| **デザイン (3)** | cdo, ui-designer, interaction-designer |
| **エンジニアリング (7)** | cto, frontend, backend, sre, qa, performance, dx |
| **セキュリティ&コンプラ (3)** | ciso, privacy, medical-compliance |
| **法務 (3)** | clo, ip-lawyer, contract |
| **マーケ&グロース (6)** | cmo, seo, growth, content-marketing, sns, copywriter |
| **セールス&CS (3)** | sales, cs, support |
| **人事 (1)** | chro |
| **広報 (1)** | pr |
| **データ (2)** | data-engineer, data-scientist |
| **AI (2)** | ai-lead, ai-ux |
| **医療ドメイン (2)** | medical-advisor, hospital-it |
| **BizOps (2)** | pricing, bizops |
| **開発ワークフロー (4)** | code-reviewer, debugger, refactor, tdd-coach |
| **メタ (1)** | voltagent-installer |
| **その他 (1)** | sustainability |

## ツール権限

| タイプ | 権限 | 用途 |
|--------|------|------|
| Read-only | Read, Grep, Glob | レビュー・監査系（ciso, clo等） |
| Read + Web | Read, Grep, Glob, WebFetch, WebSearch | リサーチ系（ceo, cmo, legal等） |
| Read + Write | Read, Edit, Grep, Glob, Bash | 実装系（frontend, backend, seo等） |

## Claude.aiとの連携

同じ専門家チームがClaude.aiでも利用可能：
- **Custom Instructions（第1層）**: Claudeが自動的に専門家視点を付記
- **APIアーティファクト（第2層）**: 独立したエージェントに深掘り相談

詳細は `iwor-custom-instructions.md` を参照。

## コミュニティエージェントの追加（VoltAgent）

`voltagent-installer` エージェントを使えば、127+のコミュニティ製エージェントをブラウズ・インストールできる。

```bash
# Claude Code内で
"agent-installerを使って利用可能なカテゴリを見せて"
"Python専門エージェントをインストールして"
"セキュリティ監査エージェントを探して"
```

カテゴリ: Core Development, Language Specialists, Infrastructure, Quality & Security, Data & AI, Developer Experience, Specialized Domains, Business & Product, Meta Orchestration, Research & Analysis
