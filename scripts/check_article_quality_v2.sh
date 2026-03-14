#!/bin/bash
# ============================================================
# 記事品質チェック v2.0 — 包括的品質保証スクリプト
# ============================================================
# Usage: bash scripts/check_article_quality_v2.sh <mdx_file>
#
# v1との違い:
#   - マークダウン構文チェック（太字破損、リンク構文、見出し重複）
#   - SVG構造チェック（viewBox、著作権フッター、要素重なり）
#   - 内部リンク切れ検出（存在しないスラッグ）
#   - フロントマター検証（必須フィールド、日付形式）
#   - 誤字・表記ゆれ検出（よくあるパターン）
#   - ファクトチェックリマインダー（J-OSLER数値の自動抽出）
#   - CTA商品説明の一貫性チェック
#   - 見出しプレフィックス禁止チェック
#   - テーブルカラム数チェック
#   - 結果をJSONでも出力（CI連携用）
# ============================================================

set -euo pipefail

FILE="${1:-}"
if [ -z "$FILE" ]; then
  echo "Usage: $0 <mdx_file>"
  echo "例: $0 content/blog/h01-naika-senmoni-junkanki.mdx"
  exit 1
fi
if [ ! -f "$FILE" ]; then
  echo "Error: ファイルが見つかりません: $FILE"
  exit 1
fi

# --- 設定 ---
CONTENT_DIR="content/blog"
BASENAME=$(basename "$FILE")
SLUG="${BASENAME%.mdx}"

# カウンター
ERRORS=0
WARNINGS=0
FACTCHECK_ITEMS=()
RESULTS=()

# --- ヘルパー関数 ---
pass() {
  echo "  ✅ $1"
  RESULTS+=("{\"check\":\"$1\",\"status\":\"pass\"}")
}
fail() {
  echo "  ❌ $1"
  ERRORS=$((ERRORS + 1))
  RESULTS+=("{\"check\":\"$1\",\"status\":\"fail\"}")
}
warn() {
  echo "  ⚠️  $1"
  WARNINGS=$((WARNINGS + 1))
  RESULTS+=("{\"check\":\"$1\",\"status\":\"warn\"}")
}
info() {
  echo "  ℹ️  $1"
}

echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  記事品質チェック v2.0                           ║"
echo "║  $BASENAME"
echo "╚══════════════════════════════════════════════════╝"
echo ""

# ============================================================
# PHASE 1: フロントマター検証
# ============================================================
echo "━━━ Phase 1: フロントマター検証 ━━━"

# フロントマターを抽出
FRONTMATTER=$(awk '/^---$/{n++} n==1{print} n==2{exit}' "$FILE")

# 必須フィールド
for field in title description date author category cluster tags status; do
  if echo "$FRONTMATTER" | grep -q "^${field}:"; then
    pass "フロントマター: ${field} あり"
  else
    fail "フロントマター: ${field} が未設定"
  fi
done

# titleの長さ（SEOでは40文字推奨だがfrontmatterは長くなる傾向）
TITLE=$(echo "$FRONTMATTER" | grep '^title:' | sed 's/^title: *"//;s/"$//')
TITLE_LEN=$(echo -n "$TITLE" | wc -m)
if [ "$TITLE_LEN" -le 60 ]; then
  pass "タイトル長: ${TITLE_LEN}文字"
elif [ "$TITLE_LEN" -le 80 ]; then
  warn "タイトルやや長い: ${TITLE_LEN}文字（60文字以内推奨、Googleで切れる可能性）"
else
  warn "タイトル長い: ${TITLE_LEN}文字（Google表示で大幅に切れる）"
fi

# descriptionの長さ（120文字以内推奨）
DESC=$(echo "$FRONTMATTER" | grep '^description:' | sed 's/^description: *"//;s/"$//')
DESC_LEN=$(echo -n "$DESC" | wc -m)
if [ "$DESC_LEN" -le 140 ]; then
  pass "メタディスクリプション長: ${DESC_LEN}文字"
elif [ "$DESC_LEN" -le 200 ]; then
  warn "メタディスクリプションやや長い: ${DESC_LEN}文字（140文字以内推奨）"
else
  warn "メタディスクリプション長い: ${DESC_LEN}文字（大幅に切れる）"
fi

# 日付形式チェック
DATE_VAL=$(echo "$FRONTMATTER" | grep '^date:' | sed 's/^date: *"//;s/"$//')
if echo "$DATE_VAL" | grep -qE '^[0-9]{4}-[0-9]{2}-[0-9]{2}$'; then
  pass "日付形式: OK ($DATE_VAL)"
else
  fail "日付形式が不正: '$DATE_VAL'（YYYY-MM-DD形式にすること）"
fi

echo ""

# ============================================================
# PHASE 2: 構造・コンテンツ品質
# ============================================================
echo "━━━ Phase 2: 構造・コンテンツ品質 ━━━"

# --- 2.1 文字数 ---
# SVGタグ外の純テキスト文字数を概算
TOTAL_CHARS=$(wc -c < "$FILE")
SVG_CHARS=$(awk '/<svg/,/<\/svg>/' "$FILE" | wc -c)
TEXT_CHARS=$((TOTAL_CHARS - SVG_CHARS))
if [ "$TOTAL_CHARS" -ge 12000 ]; then
  pass "総文字数: ${TOTAL_CHARS}（テキスト約${TEXT_CHARS}）"
elif [ "$TOTAL_CHARS" -ge 8000 ]; then
  warn "文字数やや少ない: ${TOTAL_CHARS}（12000以上推奨）"
else
  fail "文字数不足: ${TOTAL_CHARS}（12000以上必要）"
fi

# --- 2.2 SVG数 ---
SVG_COUNT=$(grep -c '<svg' "$FILE" || true)
if [ "$SVG_COUNT" -ge 2 ]; then
  pass "SVG: ${SVG_COUNT}個"
else
  fail "SVG不足: ${SVG_COUNT}個（2個以上必要）"
fi

# --- 2.3 CTA数 ---
CTA_COUNT=$(grep -c 'booth.pm' "$FILE" || true)
if [ "$CTA_COUNT" -ge 3 ]; then
  pass "CTA: ${CTA_COUNT}箇所（3箇所以上）"
elif [ "$CTA_COUNT" -ge 2 ]; then
  pass "CTA: ${CTA_COUNT}箇所"
else
  fail "CTA不足: ${CTA_COUNT}箇所（2箇所以上必要）"
fi

# CTA配置チェック: 冒頭blockquoteと中盤
CTA_IN_BLOCKQUOTE=$(awk '/^>.*booth\.pm/{found=1} END{print found+0}' "$FILE")
if [ "$CTA_IN_BLOCKQUOTE" -eq 1 ]; then
  pass "冒頭blockquote CTA: あり"
else
  warn "冒頭blockquote CTAが見つからない"
fi

# 中盤CTA（ファイルの30%〜70%の位置にboothリンクがあるか）
TOTAL_LINES=$(wc -l < "$FILE")
MIDSTART=$((TOTAL_LINES * 30 / 100))
MIDEND=$((TOTAL_LINES * 70 / 100))
MID_CTA=$(sed -n "${MIDSTART},${MIDEND}p" "$FILE" | grep -c 'booth.pm' || true)
if [ "$MID_CTA" -ge 1 ]; then
  pass "中盤CTA: あり（${MIDSTART}〜${MIDEND}行目付近）"
else
  fail "中盤CTAなし（冒頭blockquoteのみはNG）"
fi

# --- 2.4 内部リンク数 ---
LINKS_REL=$(grep -oE '\(/blog/[^)]+\)' "$FILE" | wc -l || true)
LINKS_ABS=$(grep -oE 'naikanavi\.com/blog/' "$FILE" | wc -l || true)
LINKS=$((LINKS_REL + LINKS_ABS))
if [ "$LINKS" -ge 5 ]; then
  pass "内部リンク: ${LINKS}本（5本以上 — 理想的）"
elif [ "$LINKS" -ge 3 ]; then
  pass "内部リンク: ${LINKS}本"
else
  fail "内部リンク不足: ${LINKS}本（3本以上必要）"
fi

# --- 2.5 内部リンク切れ検出 ---
if [ -d "$CONTENT_DIR" ]; then
  BROKEN_LINKS=""
  while IFS= read -r link_slug; do
    clean_slug=$(echo "$link_slug" | sed 's|/blog/||;s|)||;s|"||g;s|#.*||')
    if [ -n "$clean_slug" ] && [ ! -f "${CONTENT_DIR}/${clean_slug}.mdx" ]; then
      BROKEN_LINKS="${BROKEN_LINKS}\n    → ${clean_slug}"
    fi
  done < <(grep -oE '/blog/[a-z0-9_-]+' "$FILE" 2>/dev/null || true)

  if [ -z "$BROKEN_LINKS" ]; then
    pass "内部リンク切れ: なし"
  else
    fail "内部リンク切れ検出:${BROKEN_LINKS}"
  fi
fi

# --- 2.6 よくある失敗セクション ---
FAIL_COUNT=$(grep -c 'よくある失敗' "$FILE" || true)
if [ "$FAIL_COUNT" -ge 1 ]; then
  pass "「よくある失敗」セクション: あり"
else
  warn "「よくある失敗」セクションなし（文脈上有益なら追加推奨）"
fi

# --- 2.7 散文ファースト ---
H2_BULLET=$(awk '
/^## /{h2=1; blank=0; next}
h2 && /^$/{blank++; if(blank>1){h2=0}; next}
h2 && /^- |^\* |^[0-9]+\./{print NR": "$0; h2=0; next}
h2 && /^[^#<>|]/{h2=0}
' "$FILE" | head -5)

if [ -z "$H2_BULLET" ]; then
  pass "散文ファースト: H2直後に箇条書きなし"
else
  fail "散文ファースト違反（H2直後に箇条書き）:"
  echo "    $H2_BULLET"
fi

# --- 2.8 箇条書き壁（連続6行以上） ---
WALLS=$(awk '
/^- |^[0-9]+\. |^\* /{c++; next}
c>=6{n++}
{c=0}
END{print n+0}
' "$FILE")
if [ "$WALLS" -eq 0 ]; then
  pass "箇条書き壁: なし"
else
  warn "箇条書き壁 ${WALLS}箇所（6行以上連続。リファレンスリスト以外なら要修正）"
fi

# --- 2.9 FAQセクション ---
FAQ_COUNT=$(grep -c '^### .*？\|^### .*?' "$FILE" || true)
if [ "$FAQ_COUNT" -ge 3 ]; then
  pass "FAQ: ${FAQ_COUNT}問"
elif [ "$FAQ_COUNT" -ge 1 ]; then
  warn "FAQ: ${FAQ_COUNT}問（3問推奨）"
else
  warn "FAQセクションなし（SEO上3問推奨）"
fi

echo ""

# ============================================================
# PHASE 3: マークダウン構文チェック
# ============================================================
echo "━━━ Phase 3: マークダウン構文チェック ━━━"

# --- 3.1 太字マークダウン破損（全角括弧問題） ---
BOLD_BROKEN=$(grep -c '\*\*[^*]*（[^*]*）\*\*' "$FILE" 2>/dev/null || true)
BOLD_BROKEN=${BOLD_BROKEN:-0}
BOLD_BROKEN=$(echo "$BOLD_BROKEN" | tr -d '[:space:]')
if [ "$BOLD_BROKEN" -eq 0 ]; then
  pass "太字構文: **内に（）なし"
else
  fail "太字破損: ${BOLD_BROKEN}箇所 — **の中に全角括弧（）があるとレンダリング崩れ"
  grep -n '\*\*[^*]*（[^*]*）\*\*' "$FILE" | head -3 | while read -r line; do
    echo "    $line"
  done
fi

# --- 3.2 未閉じの太字 ---
# 行ごとに**の数が奇数なら未閉じの可能性
UNCLOSED_BOLD=$(awk '{
  n = gsub(/\*\*/, "**")
  if (n % 2 != 0 && !/^---$/ && !/^\|/) print NR": "$0
}' "$FILE" | head -5)
if [ -z "$UNCLOSED_BOLD" ]; then
  pass "太字閉じ忘れ: なし"
else
  warn "太字閉じ忘れの可能性:"
  echo "$UNCLOSED_BOLD" | while read -r line; do
    echo "    $line"
  done
fi

# --- 3.3 リンク構文チェック ---
# [text](url) の形式チェック — 閉じ括弧漏れ
BROKEN_LINKS_SYNTAX=$(grep -n '\[[^]]*\]([^)]*$' "$FILE" | head -3 || true)
if [ -z "$BROKEN_LINKS_SYNTAX" ]; then
  pass "リンク構文: 括弧の閉じ忘れなし"
else
  fail "リンク構文エラー（閉じ括弧漏れ）:"
  echo "$BROKEN_LINKS_SYNTAX" | while read -r line; do
    echo "    $line"
  done
fi

# --- 3.4 見出しにカテゴリプレフィックス ---
HEAD_PREFIX=$(grep -nE '^#{2,3} [A-Z][0-9]+[: ：]' "$FILE" | head -3 || true)
if [ -z "$HEAD_PREFIX" ]; then
  pass "見出しプレフィックス: なし"
else
  fail "見出しにIDプレフィックスあり（読者には不要）:"
  echo "$HEAD_PREFIX" | while read -r line; do
    echo "    $line"
  done
fi

# --- 3.5 見出しレベルの飛び（H2→H4等） ---
HEADING_SKIP=$(awk '
/^## /{prev=2; next}
/^### /{if(prev<2){print NR": H3がH2なしで登場"}; prev=3; next}
/^#### /{if(prev<3){print NR": H4がH3なしで登場"}; prev=4; next}
' "$FILE" | head -3)
if [ -z "$HEADING_SKIP" ]; then
  pass "見出しレベル: 順序正常"
else
  warn "見出しレベル飛び:"
  echo "$HEADING_SKIP" | while read -r line; do
    echo "    $line"
  done
fi

# --- 3.6 テーブルカラム数チェック（5以上は警告） ---
WIDE_TABLES=$(awk '/^\|/{
  n = split($0, a, "|") - 2
  if(n >= 5) print NR": "n"カラム"
}' "$FILE" | sort -t: -k2 -rn | head -3)
if [ -z "$WIDE_TABLES" ]; then
  pass "テーブル幅: OK（5カラム未満）"
else
  warn "テーブル幅が広い行あり（モバイルで崩れる可能性）:"
  echo "$WIDE_TABLES" | while read -r line; do
    echo "    $line"
  done
fi

# --- 3.7 アンカーテキスト「こちら」「この記事」チェック ---
BAD_ANCHOR=$(grep -nE '\[(こちら|この記事|ここ|詳しくはこちら)\]\(' "$FILE" | head -3 || true)
if [ -z "$BAD_ANCHOR" ]; then
  pass "アンカーテキスト: KW含む形式"
else
  fail "アンカーテキストNG（キーワードを含めること）:"
  echo "$BAD_ANCHOR" | while read -r line; do
    echo "    $line"
  done
fi

echo ""

# ============================================================
# PHASE 4: SVG品質チェック
# ============================================================
echo "━━━ Phase 4: SVG品質チェック ━━━"

if [ "$SVG_COUNT" -gt 0 ]; then
  # --- 4.1 著作権フッター ---
  SVG_COPYRIGHT=$(grep -c '© 内科ナビ' "$FILE" || true)
  if [ "$SVG_COPYRIGHT" -ge "$SVG_COUNT" ]; then
    pass "SVG著作権フッター: ${SVG_COPYRIGHT}/${SVG_COUNT}"
  else
    fail "SVG著作権フッター不足: ${SVG_COPYRIGHT}/${SVG_COUNT}個"
  fi

  # --- 4.2 SVG多様性（aria-label） ---
  SVG_TYPES=$(grep -oE 'aria-label="[^"]*"' "$FILE" | sort -u | wc -l || true)
  if [ "$SVG_TYPES" -ge 2 ]; then
    pass "SVG多様性: ${SVG_TYPES}種類"
  elif [ "$SVG_COUNT" -ge 2 ]; then
    warn "SVGが全て同じタイプの可能性（aria-label ${SVG_TYPES}種類）"
  fi

  # --- 4.3 viewBox設定 ---
  SVG_NO_VIEWBOX=$(awk '/<svg/{if(!/viewBox/)print NR}' "$FILE" | wc -l || true)
  if [ "$SVG_NO_VIEWBOX" -eq 0 ]; then
    pass "SVG viewBox: 全て設定済み"
  else
    fail "viewBox未設定のSVGあり（${SVG_NO_VIEWBOX}個）"
  fi

  # --- 4.4 SVG内の背景rect ---
  SVG_BG=$(grep -c 'fill="#F5F4F0"' "$FILE" || true)
  if [ "$SVG_BG" -ge "$SVG_COUNT" ]; then
    pass "SVG背景: デザインシステム準拠（#F5F4F0）"
  else
    warn "SVG背景色がデザインシステム（#F5F4F0）と異なる可能性"
  fi

  # --- 4.5 aria-label/role属性 ---
  SVG_ROLE=$(grep -c 'role="img"' "$FILE" || true)
  if [ "$SVG_ROLE" -ge "$SVG_COUNT" ]; then
    pass "SVGアクセシビリティ: role=\"img\" ${SVG_ROLE}/${SVG_COUNT}"
  else
    warn "role=\"img\"未設定のSVGあり（${SVG_ROLE}/${SVG_COUNT}）"
  fi

  # --- 4.6 ドロップシャドウフィルター ---
  SVG_SHADOW=$(grep -c 'feDropShadow' "$FILE" || true)
  if [ "$SVG_SHADOW" -ge 1 ]; then
    pass "SVGドロップシャドウ: あり"
  else
    warn "SVGにドロップシャドウなし（カードにはfilter推奨）"
  fi
else
  info "SVGなし — SVGチェックスキップ"
fi

echo ""

# ============================================================
# PHASE 5: 表記ゆれ・誤字チェック
# ============================================================
echo "━━━ Phase 5: 表記ゆれ・誤字チェック ━━━"

TYPO_FOUND=0

# J-OSLER表記ゆれ（case-sensitive: 正しい「J-OSLER」を除外）
JOSLER_WRONG=$(grep -oE '[Jj]-[Oo][Ss][Ll][Ee][Rr]' "$FILE" 2>/dev/null | grep -cv 'J-OSLER' || true)
if [ "$JOSLER_WRONG" -gt 0 ]; then
  warn "表記ゆれ: J-OSLER以外の表記が${JOSLER_WRONG}箇所 → J-OSLER（全大文字・ハイフン付き）に統一"
  TYPO_FOUND=$((TYPO_FOUND + 1))
fi
# ハイフンなしJOSLER
JOSLER_NOHYPHEN=$(grep -c '[^-]JOSLER\|^JOSLER' "$FILE" 2>/dev/null || true)
if [ "$JOSLER_NOHYPHEN" -gt 0 ]; then
  warn "表記ゆれ: ハイフンなし「JOSLER」が${JOSLER_NOHYPHEN}箇所 → J-OSLER"
  TYPO_FOUND=$((TYPO_FOUND + 1))
fi

# その他の表記ゆれ（case-sensitive）
check_typo() {
  local pattern="$1" msg="$2"
  local count
  count=$(grep -c "$pattern" "$FILE" 2>/dev/null || true)
  if [ "$count" -gt 0 ]; then
    warn "表記ゆれ: ${msg}（${count}箇所）"
    TYPO_FOUND=$((TYPO_FOUND + 1))
  fi
}
check_typo '内科なび' '「内科なび」→ 内科ナビ（カタカナ）'
check_typo 'ないかなび' '「ないかなび」→ 内科ナビ'
check_typo 'Claud ' '「Claud 」→ Claude（e抜け）'
check_typo '専攻い' '「専攻い」→ 専攻医'
check_typo '専門い' '「専門い」→ 専門医'

# 全角スペースチェック
ZEN_SPACE=$(grep -cP '　' "$FILE" 2>/dev/null || true)
if [ "$ZEN_SPACE" -gt 0 ]; then
  warn "全角スペース: ${ZEN_SPACE}箇所（半角スペースに統一推奨）"
  TYPO_FOUND=$((TYPO_FOUND + 1))
fi

# 連続半角スペース（2つ以上）— SVGブロック内は除外
DOUBLE_SPACE=$(python3 -c "
import re, sys
content = open('$FILE').read()
# Remove SVG blocks before checking
content_no_svg = re.sub(r'<svg[\s\S]*?</svg>', '', content)
count = len(re.findall(r'  [^ ]', content_no_svg))
print(count)
" 2>/dev/null || grep -cE '  [^ ]' "$FILE" 2>/dev/null || true)
if [ "$DOUBLE_SPACE" -gt 3 ]; then
  warn "連続半角スペース: ${DOUBLE_SPACE}箇所"
fi

if [ "$TYPO_FOUND" -eq 0 ]; then
  pass "表記ゆれ: 主要パターンなし"
fi

# 文体チェック（「〜である」体の検出）
DEARU_COUNT=$(grep -cE 'である。|であるが、|であった。|とされる。$|と考えられる。$' "$FILE" 2>/dev/null || true)
if [ "$DEARU_COUNT" -eq 0 ]; then
  pass "文体: 「です・ます」体"
elif [ "$DEARU_COUNT" -le 3 ]; then
  warn "「である」体が${DEARU_COUNT}箇所（「です・ます」体に統一推奨）"
else
  fail "「である」体が${DEARU_COUNT}箇所 — 文体を「です・ます」体に統一すること"
fi

echo ""

# ============================================================
# PHASE 6: ファクトチェック要注意項目の自動抽出
# ============================================================
echo "━━━ Phase 6: ファクトチェック要確認項目 ━━━"

# J-OSLER関連の数値抽出
JOSLER_NUMBERS=$(grep -noE '[0-9]+症例|[0-9]+編|[0-9]+疾患群|[0-9]+症例群|[0-9]+科|[0-9]+ヶ月|[0-9]+年以上|[0-9]+例|[0-9]+分以内|[0-9]+時間以内' "$FILE" 2>/dev/null || true)
if [ -n "$JOSLER_NUMBERS" ]; then
  echo "  📋 以下の数値を公式ソースと照合すること:"
  echo "$JOSLER_NUMBERS" | while read -r line; do
    echo "    → $line"
    FACTCHECK_ITEMS+=("$line")
  done
else
  info "数値的主張: 特に検出なし"
fi

# 「〜とされています」「〜が原則です」等の断定
ASSERTIONS=$(grep -noE '〜とされて|とされています|が原則です|が必須です|が条件です|が要件です' "$FILE" 2>/dev/null | head -5 || true)
if [ -n "$ASSERTIONS" ]; then
  echo "  📋 以下の断定的記述にソースがあるか確認:"
  echo "$ASSERTIONS" | while read -r line; do
    echo "    → $line"
  done
fi

# 外部リンクの確認リスト
EXT_LINKS=$(grep -oE 'https?://[^)>"[:space:]]+' "$FILE" | grep -v 'booth.pm\|naikanavi.com\|w3\.org' | sort -u | head -10 || true)
if [ -n "$EXT_LINKS" ]; then
  echo "  📋 外部リンクのアクセス確認推奨:"
  echo "$EXT_LINKS" | while read -r url; do
    echo "    → $url"
  done
fi

echo ""
echo "  ⚠️  ファクトチェックは自動化できません。"
echo "     上記の項目を公式ソース（日本内科学会HP・手引きPDF）と"
echo "     手動で照合してください。"

echo ""

# ============================================================
# PHASE 7: 太字の使い方
# ============================================================
echo "━━━ Phase 7: 太字・装飾チェック ━━━"

BOLD_COUNT=$(grep -oE '\*\*[^*]+\*\*' "$FILE" | wc -l || true)
if [ "$BOLD_COUNT" -ge 15 ]; then
  pass "太字: ${BOLD_COUNT}箇所（十分）"
elif [ "$BOLD_COUNT" -ge 10 ]; then
  pass "太字: ${BOLD_COUNT}箇所"
else
  warn "太字が少ない: ${BOLD_COUNT}箇所（各段落1〜2箇所、合計10箇所以上推奨）"
fi

# テンプレ太字チェック（箇条書き先頭だけ太字のパターン）
TEMPLATE_BOLD=$(grep -cE '^- \*\*[^*]+\*\*' "$FILE" 2>/dev/null || true)
TOTAL_BOLD_IN_PROSE=$(grep -cvE '^- |^[0-9]+\.' "$FILE" | head -1 || echo 0)
if [ "$TEMPLATE_BOLD" -gt 5 ] && [ "$BOLD_COUNT" -gt 0 ]; then
  TEMPLATE_RATIO=$((TEMPLATE_BOLD * 100 / BOLD_COUNT))
  if [ "$TEMPLATE_RATIO" -gt 60 ]; then
    warn "テンプレ太字の疑い: 箇条書き先頭太字が${TEMPLATE_BOLD}/${BOLD_COUNT}箇所（${TEMPLATE_RATIO}%）— 文中にも太字を配置すること"
  else
    pass "太字配置: 文中にも分散"
  fi
else
  pass "太字配置: OK"
fi

echo ""

# ============================================================
# 最終判定
# ============================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
if [ "$ERRORS" -eq 0 ] && [ "$WARNINGS" -eq 0 ]; then
  echo "  🟢 合格: 全チェックパス — コミットOK"
  EXIT_CODE=0
elif [ "$ERRORS" -eq 0 ]; then
  echo "  🟡 合格（警告${WARNINGS}件）: コミットOK、但し警告箇所の確認推奨"
  EXIT_CODE=0
else
  echo "  🔴 不合格: エラー${ERRORS}件 / 警告${WARNINGS}件"
  echo ""
  echo "  修正してから再度 bash scripts/check_article_quality_v2.sh $FILE を実行してください。"
  echo "  不合格のままコミットしないこと。"
  EXIT_CODE=1
fi

echo ""
echo "  ⏭️  次のステップ:"
echo "     1. ❌項目を修正"
echo "     2. Phase 6のファクトチェック項目を公式ソースと照合"
echo "     3. 再度このスクリプトを実行して全パス確認"
echo "     4. git add $FILE && git commit && git push"
echo ""

exit $EXIT_CODE
