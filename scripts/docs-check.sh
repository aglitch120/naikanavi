#!/bin/bash
# docs-check.sh — docs/ の整合性チェック
# push前に実行: bash scripts/docs-check.sh

set -euo pipefail
ERRORS=0
WARNINGS=0

red()    { echo -e "\033[31m✗ $1\033[0m"; }
yellow() { echo -e "\033[33m⚠ $1\033[0m"; }
green()  { echo -e "\033[32m✓ $1\033[0m"; }

echo "=== docs/ 整合性チェック ==="
echo ""

# 1. README.md に全 docs/*.md が載っているか
echo "--- ファイル一覧チェック ---"
for f in docs/*.md; do
  basename=$(basename "$f")
  [ "$basename" = "README.md" ] && continue
  if ! grep -q "$basename" docs/README.md; then
    red "$basename が docs/README.md のファイル一覧にない"
    ERRORS=$((ERRORS + 1))
  fi
done

# README.md に載っているが実在しないファイル
for name in $(grep -oP '\*\*[A-Z_]+(?:_v\d+)?\.md\*\*' docs/README.md | tr -d '*'); do
  if [ ! -f "docs/$name" ]; then
    red "README.md に記載の $name が存在しない"
    ERRORS=$((ERRORS + 1))
  fi
done
[ $ERRORS -eq 0 ] && green "ファイル一覧: OK"

# 2. BACKLOG.md の完了数カウント
echo ""
echo "--- BACKLOG 完了状況 ---"
BACKLOG_DONE=$(grep -c '✅' docs/BACKLOG.md 2>/dev/null || echo 0)
BACKLOG_TODO=$(grep -cE '🔴|🟠|🟡|🟢' docs/BACKLOG.md 2>/dev/null || echo 0)
green "BACKLOG.md 完了: $BACKLOG_DONE 項目 / 残: $BACKLOG_TODO 項目"

# 3. 古い注釈が残っていないか
echo ""
echo "--- 古い注釈チェック ---"
STALE_PATTERNS=("← 新規" "← 既存" "削除予定")
for pattern in "${STALE_PATTERNS[@]}"; do
  hits=$(grep -rn "$pattern" docs/*.md --include="*.md" | grep -v "README.md" | grep -v "BACKLOG" || true)
  if [ -n "$hits" ]; then
    yellow "「$pattern」が残っている:"
    echo "$hits" | head -3
    WARNINGS=$((WARNINGS + 1))
  fi
done
[ $WARNINGS -eq 0 ] && green "古い注釈: なし"

# 4. サービス数の一貫性
echo ""
echo "--- サービス数チェック ---"
# STRATEGY.mdのホームタブテーブルの実データ行数（ヘッダー行を除外）
STRATEGY_COUNT=$(sed -n '/^### ホームタブ/,/^###/{/| .* | .* | FREE\|PRO\|FREEMIUM/p}' docs/STRATEGY.md | grep -cv '^|.*サービス名\|^|.*---' 2>/dev/null || echo 0)
# app/page.tsxのapps配列のアイコン数（stats用ラベルを除外）
HOME_APPS=$(grep "label:" app/page.tsx | grep -v "計算ツール\|薬剤比較\|ブログ記事\|手技ガイド" | wc -l)
echo "  STRATEGY.md ホームタブ: $STRATEGY_COUNT サービス"
echo "  app/page.tsx ホームアイコン: $HOME_APPS サービス"
if [ "$STRATEGY_COUNT" -ne "$HOME_APPS" ] 2>/dev/null; then
  yellow "STRATEGY.md($STRATEGY_COUNT) と app/page.tsx($HOME_APPS) のサービス数が不一致"
  WARNINGS=$((WARNINGS + 1))
fi

# 5. 重複コンテンツの検出（カラーパレットが複数箇所にないか）
echo ""
echo "--- 重複検出 ---"
PALETTE_FILES=$(grep -rl "#F5F4F0" docs/*.md 2>/dev/null | grep -v REF_BLOG | wc -l)
if [ "$PALETTE_FILES" -gt 1 ]; then
  yellow "カラーパレット(#F5F4F0)が docs/ 内の $PALETTE_FILES ファイルに存在（DESIGN_SYSTEM.md のみであるべき）"
  grep -rl "#F5F4F0" docs/*.md | grep -v REF_BLOG
  WARNINGS=$((WARNINGS + 1))
else
  green "カラーパレット: 重複なし"
fi

# 6. 参照先が存在するか（「→ XXX.md 参照」のチェック）
echo ""
echo "--- 参照リンクチェック ---"
REF_ERRORS=0
for ref in $(grep -ohP '→\s*\S+\.md' docs/*.md | grep -oP '[A-Z_]+\.md'); do
  if [ ! -f "docs/$ref" ]; then
    red "参照先 docs/$ref が存在しない"
    REF_ERRORS=$((REF_ERRORS + 1))
  fi
done
[ $REF_ERRORS -eq 0 ] && green "参照リンク: 全て有効"
ERRORS=$((ERRORS + REF_ERRORS))

# サマリー
echo ""
echo "==========================="
if [ $ERRORS -gt 0 ]; then
  red "エラー: $ERRORS 件（修正必須）"
fi
if [ $WARNINGS -gt 0 ]; then
  yellow "警告: $WARNINGS 件（要確認）"
fi
if [ $ERRORS -eq 0 ] && [ $WARNINGS -eq 0 ]; then
  green "全チェック通過"
fi
exit $ERRORS
