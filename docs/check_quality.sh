#!/usr/bin/env bash
# 内科ナビ 記事品質チェックスクリプト
# 使い方: bash docs/check_quality.sh content/blog/ARTICLE_SLUG.mdx
# 全項目✅になってからコミットすること

set -euo pipefail

FILE="${1:-}"

if [ -z "$FILE" ]; then
  echo "使い方: bash docs/check_quality.sh content/blog/ARTICLE_SLUG.mdx"
  exit 1
fi

if [ ! -f "$FILE" ]; then
  echo "❌ ファイルが見つかりません: $FILE"
  exit 1
fi

echo "=== 内科ナビ 記事品質チェック ==="
echo "対象: $FILE"
echo ""

PASS=0
FAIL=0

check() {
  local label="$1"
  local result="$2"  # 0=pass, 1=fail
  local msg="$3"
  if [ "$result" -eq 0 ]; then
    echo "✅ $label: $msg"
    PASS=$((PASS + 1))
  else
    echo "❌ $label: $msg"
    FAIL=$((FAIL + 1))
  fi
}

warn() {
  local label="$1"
  local msg="$2"
  echo "⚠️  $label: $msg"
}

# 1. SVG数（2個以上）
svg_count=$(grep -c '<svg' "$FILE" || true)
check "SVG数" "$([ "$svg_count" -ge 2 ] && echo 0 || echo 1)" "${svg_count}個（最低2個必要）"

# 2. CTA数（2箇所以上 — booth.pm リンク）
cta_count=$(grep -c 'booth\.pm' "$FILE" || true)
check "CTA数" "$([ "$cta_count" -ge 2 ] && echo 0 || echo 1)" "${cta_count}箇所（最低2箇所必要）"

# 3. 内部リンク数（3本以上）
links_rel=$(grep -oE '\(/blog/[^)#[:space:]"]+\)' "$FILE" | wc -l || true)
links_abs=$(grep -oE 'naikanavi\.com/blog/' "$FILE" | wc -l || true)
links=$((links_rel + links_abs))
check "内部リンク数" "$([ "$links" -ge 3 ] && echo 0 || echo 1)" "${links}本（最低3本必要）"

# 4. よくある失敗セクション
fail_count=$(grep -c 'よくある失敗' "$FILE" || true)
check "失敗パターン" "$([ "$fail_count" -ge 1 ] && echo 0 || echo 1)" "$([ "$fail_count" -ge 1 ] && echo 'あり' || echo 'なし（必須）')"

# 5. FAQセクション
faq_count=$(grep -cE '^## (よくある質問|FAQ)' "$FILE" || true)
check "FAQセクション" "$([ "$faq_count" -ge 1 ] && echo 0 || echo 1)" "$([ "$faq_count" -ge 1 ] && echo 'あり' || echo 'なし（必須）')"

# 6. ファイルサイズ（12000バイト以上）
bytes=$(wc -c < "$FILE")
check "ファイルサイズ" "$([ "$bytes" -ge 12000 ] && echo 0 || echo 1)" "${bytes}バイト（最低12,000バイト必要）"

# 7. H2見出し数（5個以上）
h2_count=$(grep -c '^## ' "$FILE" || true)
check "H2見出し数" "$([ "$h2_count" -ge 5 ] && echo 0 || echo 1)" "${h2_count}個（最低5個必要）"

# 8. 太字内の全角括弧チェック
bad_bold=$(grep -cP '\*\*[^*]*[（）][^*]*\*\*' "$FILE" || true)
check "太字内の全角括弧" "$([ "$bad_bold" -eq 0 ] && echo 0 || echo 1)" "$([ "$bad_bold" -eq 0 ] && echo '問題なし' || echo "${bad_bold}箇所あり（括弧は**の外に出す）")"

# 9. 内部リンク404チェック（実ファイル存在確認）
echo ""
echo "--- 内部リンク404チェック ---"
python3 - "$FILE" <<'PYEOF'
import os, re, sys
blog_dir = "content/blog"
existing = set(f.replace(".mdx", "") for f in os.listdir(blog_dir) if f.endswith(".mdx"))
target = sys.argv[1]
with open(target) as f:
    content = f.read()
pattern = re.compile(r'\]\(/blog/([^)\s#"]+)')
slugs = pattern.findall(content)
broken = [s for s in slugs if s not in existing]
if broken:
    print(f"❌ 存在しない内部リンク: {broken}")
    print("   → 該当リンクを削除し、テキストのみにしてください")
    sys.exit(1)
else:
    print(f"✅ 内部リンク404なし（{len(slugs)}本チェック済み）")
PYEOF

# 10. cta_type の有効値チェック
echo ""
echo "--- cta_type チェック ---"
cta_type=$(grep '^cta_type:' "$FILE" | awk '{print $2}' | tr -d '"' || true)
valid_types="template progress quiz checklist general"
if echo "$valid_types" | grep -qw "$cta_type"; then
  echo "✅ cta_type: ${cta_type}（有効値）"
  PASS=$((PASS + 1))
else
  echo "❌ cta_type: ${cta_type}（無効値。template/progress/quiz/checklist/general のいずれかにする）"
  FAIL=$((FAIL + 1))
fi

# 11. タグ登録チェック
echo ""
echo "--- タグ404チェック ---"
python3 - "$FILE" <<'PYEOF'
import re, sys

REGISTERED_TAGS = {
    'J-OSLER','修了要件','内科専門医','症例登録','病歴要約','書き方','テンプレート',
    '内科専攻医','効率化','疾患群','自己省察','コピペ','総合考察','全人的視点',
    '差し戻し','Accept','160症例','120症例','29症例','7期生','選び方',
}

with open(sys.argv[1]) as f:
    content = f.read()

m = re.search(r'^tags:\s*\[([^\]]+)\]', content, re.MULTILINE)
if not m:
    print("⚠️  tagsが見つかりません（フロントマターを確認）")
    sys.exit(0)

tags = [t.strip().strip('"').strip("'") for t in m.group(1).split(',')]
unregistered = [t for t in tags if t and t not in REGISTERED_TAGS]
if unregistered:
    print(f"⚠️  未登録タグ（タグページが404になる可能性）: {unregistered}")
    print("   → lib/blog-config.ts の tagSlugMap に追加してください")
else:
    print(f"✅ 全タグ登録済み: {tags}")
PYEOF

# 12. 著作権フッターチェック
echo ""
echo "--- SVG品質チェック ---"
footer=$(grep -c '内科ナビ naikanavi.com' "$FILE" || true)
svg_actual=$(grep -c '<svg' "$FILE" || true)
if [ "$svg_actual" -gt 0 ]; then
  check "著作権フッター" "$([ "$footer" -ge 1 ] && echo 0 || echo 1)" "$([ "$footer" -ge 1 ] && echo "${footer}個のSVGで確認" || echo 'なし（全SVGに必須）')"
else
  warn "著作権フッター" "SVGがないためスキップ"
fi

# 13. H2直後の箇条書きチェック（散文ファースト違反）
echo ""
echo "--- 散文ファーストチェック ---"
bad_h2=$(awk '/^## /{found=1; next} found && /^[- *]/{print NR": "$0; found=0; count++} found && /^[^[:space:]]/{found=0} END{print count+0 " 件"}' "$FILE" | tail -1)
if [ "$bad_h2" = "0 件" ]; then
  echo "✅ H2直後の箇条書きなし"
  PASS=$((PASS + 1))
else
  echo "⚠️  H2直後に箇条書きが ${bad_h2}（散文を先に書く）"
fi

# --- 結果サマリー ---
echo ""
echo "=================================="
echo "チェック完了: ✅ ${PASS}項目 / ❌ ${FAIL}項目"
if [ "$FAIL" -eq 0 ]; then
  echo "🎉 全項目✅ — コミットしてOKです"
else
  echo "🛑 ${FAIL}項目が未達 — 修正してから再チェックしてください"
  exit 1
fi
