#!/usr/bin/env python3
"""
本冊PDF内のインライン図表を検出するスクリプト

別冊ではなく問題文中に埋め込まれた表・グラフ・イラスト・図を
PyMuPDFのベクター描画解析で検出する。

検出対象:
  - 表（bordered tables with horizontal/vertical rules）
  - 図・グラフ（curves, circles, axes）
  - イラスト（visual field diagrams, flowcharts）

除外対象:
  - 注意事項ページ（⑴⑵⑶⑷の回答形式例 → curves多数だが装飾）
  - 組合せ問題の接続線（D=6,L=7パターン → 選択肢の"——"フォーマット）
  - ページ罫線・マージン装飾（D=1-2,L=2 → ベースライン）

Usage:
  python3 scripts/kokushi/detect_inline_images.py --year 106
  python3 scripts/kokushi/detect_inline_images.py --year 106 --render
  python3 scripts/kokushi/detect_inline_images.py --year 106 --block B
"""
import json, re, os, argparse
from pathlib import Path

try:
    import fitz
except ImportError:
    print("PyMuPDF (fitz) required: pip install PyMuPDF")
    exit(1)

PDF_DIR = Path("/Users/tasuku/Downloads/医師国家試験過去問")
REPO = Path(__file__).resolve().parents[2]
DATA_DIR = REPO / "data/questions"

# ─── 検出閾値 ───
# ベースライン（テキストのみ）: D=0-2, L=0-2, C=0
# 組合せ接続線（偽陽性）:       D=6,   L=7,   C=0   ← 除外する
# 実際の表:                     D=6+,  L=10+, C=0   ← 検出する
# 実際の図:                     D=10+, L=*,   C=10+ ← 検出する
MIN_LINES_FOR_TABLE = 10     # 組合せ接続線(L=7)を超える閾値
MIN_CURVES_FOR_DIAGRAM = 10  # 図・グラフの曲線要素
MIN_TOTAL_ITEMS = 15         # lines+curves+rectsの合計


def find_main_pdfs(year):
    """本冊PDFを検出してブロック名→パスの辞書を返す"""
    year_dir = PDF_DIR / str(year)
    if not year_dir.exists():
        return {}

    results = {}
    pdfs = sorted(year_dir.glob("*.pdf"))

    for pdf in pdfs:
        name = pdf.name.lower()

        # 109+: tp...-01{block}_01.pdf
        m = re.match(r'.*-01([a-i])_01\.pdf$', name)
        if m:
            results[m.group(1).upper()] = pdf
            continue

        # 105-108: tp_siken_{year}_ishi_{block}1.pdf
        m = re.match(rf'tp_siken_{year}_ishi_([a-i])1\.pdf$', name)
        if m:
            results[m.group(1).upper()] = pdf
            continue

        # 100-104: tp_siken_{year}_ishi_XX.pdf (odd=本冊)
        m = re.match(rf'tp_siken_{year}_ishi_(\d+)\.pdf$', name)
        if m:
            num = int(m.group(1))
            if num % 2 == 1:
                block_idx = (num - 1) // 2
                block_letter = chr(ord('A') + block_idx)
                results[block_letter] = pdf
            continue

        # 107-108: tp{date}-01{block}.pdf (単一ファイル、本冊+別冊混合)
        m = re.match(r'tp\d+-01([a-i])\.pdf$', name)
        if m:
            block = m.group(1).upper()
            if block not in results:
                results[block] = pdf
            continue

    return results


def extract_question_mapping(doc):
    """ページ→問題番号のマッピングを構築

    旧回(~108): ページ先頭に問題番号が直接記載（例: "16\\n頭部MRI..."）
    新回(109+): "問題XX" 形式
    """
    page_to_questions = {}

    for i in range(len(doc)):
        page = doc[i]
        text = page.get_text()
        flat = re.sub(r'\s+', '', text)
        lines = text.strip().split('\n')

        questions = set()

        # Pattern 1: "問題XX" (新回)
        for m in re.findall(r'問題(\d+)', flat):
            questions.add(int(m))

        # Pattern 2: ページ先頭の裸の番号 (旧回)
        # 問題番号はページの最初の数行に出現する（深い位置の裸数字は無視）
        if not questions and lines:
            checked = 0
            for line in lines:
                clean = line.strip()
                if not clean:
                    continue
                checked += 1
                if checked > 20:  # 1ページに複数問題ある場合を考慮
                    break
                if re.match(r'^\d{1,3}$', clean):
                    num = int(clean)
                    if 1 <= num <= 80:  # 1ブロック最大80問
                        questions.add(num)

        if questions:
            page_to_questions[i] = sorted(questions)

    return page_to_questions


def analyze_page_drawings(page):
    """ページの描画要素を分析して統計を返す

    線の長さ（幅）も計測して組合せ接続線と表罫線を区別する:
      - 組合せ接続線: 短い水平線（max ~100px）
      - 表の水平罫線: 長い水平線（200px+）
    """
    drawings = page.get_drawings()
    stats = {'total': len(drawings), 'lines': 0, 'curves': 0, 'rects': 0,
             'max_h_line_width': 0, 'wide_h_lines': 0}

    for d in drawings:
        for item in d.get('items', []):
            t = item[0]
            if t == 'l':
                stats['lines'] += 1
                p1, p2 = item[1], item[2]
                dy = abs(p2.y - p1.y)
                if dy < 2:  # horizontal line
                    width = abs(p2.x - p1.x)
                    stats['max_h_line_width'] = max(stats['max_h_line_width'], width)
                    if width > 150:  # 表罫線の閾値
                        stats['wide_h_lines'] += 1
            elif t == 'c':
                stats['curves'] += 1
            elif t == 're':
                stats['rects'] += 1

    stats['items_total'] = stats['lines'] + stats['curves'] + stats['rects']
    return stats


def is_skip_page(text):
    """スキップすべきページを判定（注意事項・回答形式例・空白）"""
    flat = re.sub(r'\s+', '', text)
    # 注意事項ページ
    if '注意事項' in flat or '試験問題の数は' in flat:
        return True
    # 回答形式例ページ（⑴⑵⑶⑷ etc.）
    if re.match(r'^[⑴⑵⑶⑷（]', flat):
        return True
    # 空白・コードのみ
    if len(flat) < 15:
        return True
    # DKIXコードのみのページ
    if re.match(r'^DKIX', flat):
        return True
    return False


def compute_baseline(doc):
    """全ページのdrawings統計からベースライン（テンプレート装飾の最小値）を計算

    109回+のPDFは全ページにテンプレート装飾があり D=54,L=335,C=250程度。
    106回以前はベースライン D=0-2,L=0-2,C=0。
    テキストの少ない空白ページ or 最小drawingsのページからベースラインを推定。
    """
    all_stats = []
    for i in range(len(doc)):
        page = doc[i]
        text = page.get_text()
        if is_skip_page(text):
            continue
        stats = analyze_page_drawings(page)
        all_stats.append(stats)

    if not all_stats:
        return {'lines': 0, 'curves': 0, 'rects': 0, 'wide_h_lines': 0}

    # ベースライン = 各指標の最小値（装飾テンプレートは全ページに存在するため）
    return {
        'lines': min(s['lines'] for s in all_stats),
        'curves': min(s['curves'] for s in all_stats),
        'rects': min(s['rects'] for s in all_stats),
        'wide_h_lines': min(s['wide_h_lines'] for s in all_stats),
    }


def classify_content(stats, baseline):
    """描画統計とベースラインの差分からコンテンツ種別を推定

    ベースライン（テンプレート装飾）を差し引いた後の追加描画要素で判定する。

    Returns:
      'table'          — 表（ bordered rows/columns）
      'diagram'        — 図・グラフ・イラスト
      'diagram+table'  — 複合
      None             — テキストのみ or 組合せ接続線（偽陽性）
    """
    # ベースライン差分
    lines = stats['lines'] - baseline['lines']
    curves = stats['curves'] - baseline['curves']
    rects = stats['rects'] - baseline['rects']
    wide = stats.get('wide_h_lines', 0) - baseline.get('wide_h_lines', 0)
    total = lines + curves + rects
    max_w = stats.get('max_h_line_width', 0)

    # ─── 偽陽性フィルタ ───

    # ベースライン以下: テキストのみ
    if total <= 3:
        return None

    # 組合せ接続線パターン: 短い水平線のみ（max_width <= 150px）、曲線なし
    if curves <= 0 and rects <= 0 and max_w <= 150 and lines <= 12:
        return None

    # ─── 検出ロジック ───

    # 図: 曲線要素が多い（ベースラインからの増分）
    if curves >= MIN_CURVES_FOR_DIAGRAM:
        if lines >= MIN_LINES_FOR_TABLE or wide >= 3:
            return 'diagram+table'
        return 'diagram'

    # 表: 長い水平罫線がある（幅150px超がベースラインから3本以上増加）
    if wide >= 3:
        return 'table'

    # 表: 直線がベースラインから10本以上増加
    if lines >= MIN_LINES_FOR_TABLE:
        return 'table'

    # 矩形ベースの表
    if rects >= 4:
        return 'table'

    # 合計要素数による検出
    if total >= MIN_TOTAL_ITEMS:
        if curves > lines:
            return 'diagram'
        return 'table'

    return None


def check_json_coverage(year, block, detected_questions):
    """JSONのhas_imageフラグと検出結果を比較"""
    json_path = DATA_DIR / str(year) / f"{year}{block}.json"
    if not json_path.exists():
        return []

    with open(json_path) as f:
        data = json.load(f)

    gaps = []
    for q in data['questions']:
        qnum = q['num']
        has_image = q.get('format', {}).get('has_image', False)
        has_betsu = '別に示す' in q['stem']

        if qnum in detected_questions:
            content_type = detected_questions[qnum]
            if not has_image and not has_betsu:
                gaps.append({
                    'qid': f"{year}{block}{qnum}",
                    'type': content_type,
                    'issue': 'MISSING',
                    'action': 'NEEDS_SCREENSHOT'
                })
            elif has_image and has_betsu:
                gaps.append({
                    'qid': f"{year}{block}{qnum}",
                    'type': content_type,
                    'issue': 'ADDITIONAL',
                    'action': 'NEEDS_ADDITIONAL_SCREENSHOT'
                })

    return gaps


def process_block(year, block, pdf_path, render=False, render_dir=None):
    """1ブロックの本冊PDFを解析"""
    try:
        doc = fitz.open(str(pdf_path))
    except Exception as e:
        print(f"  ❌ {year}{block}: PDF open failed: {e}")
        return {}, []

    # テキストレイヤー確認
    has_text = False
    for check_idx in [6, 8, 10, 12, 4, 2]:
        if check_idx < len(doc):
            sample = doc[check_idx].get_text().strip()
            if len(sample) > 50:
                has_text = True
                break

    if not has_text:
        print(f"  ⚠️ {year}{block}: テキストレイヤーなし → レンダリング目視が必要")
        doc.close()
        return {}, []

    page_questions = extract_question_mapping(doc)

    # ベースライン計算（テンプレート装飾の最小値）
    baseline = compute_baseline(doc)
    bl_total = baseline['lines'] + baseline['curves'] + baseline['rects']
    if bl_total > 100:
        # 109回以降: 全ページにテンプレート装飾（L=300+, C=200+）
        # → 描画解析では検出精度が低い。Step 2.5（キーワードスキャン）を推奨
        print(f"    ⚠️ テンプレート装飾が大きい (baseline L={baseline['lines']} C={baseline['curves']})")
        print(f"    → この回は描画解析の精度が低いため、Step 2.5のキーワードスキャンを優先してください")
        doc.close()
        return {}, []
    elif bl_total > 10:
        print(f"    ベースライン: L={baseline['lines']} C={baseline['curves']} R={baseline['rects']} (テンプレート装飾)")

    detected = {}  # qnum -> content_type

    for i in range(len(doc)):
        page = doc[i]
        text = page.get_text()

        if is_skip_page(text):
            continue

        stats = analyze_page_drawings(page)
        content_type = classify_content(stats, baseline)

        if content_type:
            # このページの問題番号を特定
            qs = page_questions.get(i, [])
            if not qs:
                # 前のページの問題の続きの可能性
                for j in range(i-1, max(i-3, -1), -1):
                    if j in page_questions:
                        qs = page_questions[j]
                        break

            for qnum in qs:
                if qnum not in detected:
                    detected[qnum] = content_type

            # レンダリング
            if render and render_dir and qs:
                out_path = render_dir / f"{year}{block}_p{i+1:02d}.png"
                if not out_path.exists():
                    pix = page.get_pixmap(dpi=150)
                    pix.save(str(out_path))

    doc.close()
    gaps = check_json_coverage(year, block, detected)
    return detected, gaps


def detect_tabular_choices(year, block_filter=None):
    """方式D: JSON選択肢のテーブルパターン検出

    選択肢が表の行として構造化されている問題を検出する。
    PDF解析不要で全回対応。

    検出パターン:
      1. 全選択肢が同じ数の数値/ラベルを含む（表の列構造）
      2. 選択肢に「高値/正常/低値」等の構造化ラベル
      3. stem内に表のヘッダーを示す語句（曜日、基準値行等）

    Returns: list of {qid, type, issue, action}
    """
    year_dir = DATA_DIR / str(year)
    if not year_dir.exists():
        return []

    gaps = []
    json_files = sorted(year_dir.glob(f"{year}*.json"))

    for jf in json_files:
        block = jf.stem.replace(str(year), '')
        if block_filter and block != block_filter.upper():
            continue

        with open(jf) as f:
            data = json.load(f)

        for q in data['questions']:
            has_image = q.get('format', {}).get('has_image', False)
            has_betsu = '別に示す' in q['stem']

            # 既にhas_image=Trueの問題は別冊画像と本冊表が両方ある可能性
            # has_image=Falseの問題が本来のターゲット

            choices = q.get('choices', [])
            if len(choices) < 3:
                continue

            detected_type = _analyze_choices_for_table(choices, q['stem'])
            if detected_type:
                img_dir = REPO / "public/images/kokushi" / str(year)
                pattern = re.compile(rf'^{year}{block}{q["num"]}(?:_\d+)?\.png$')
                has_file = any(pattern.match(f.name) for f in img_dir.iterdir()) if img_dir.exists() else False

                if not has_image and not has_file:
                    gaps.append({
                        'qid': f"{year}{block}{q['num']}",
                        'type': f'choice-table ({detected_type})',
                        'issue': 'MISSING',
                        'action': 'NEEDS_SCREENSHOT'
                    })
                elif has_image and has_betsu and not has_file:
                    # 別冊画像あり + 本冊にも表がある可能性
                    gaps.append({
                        'qid': f"{year}{block}{q['num']}",
                        'type': f'choice-table ({detected_type})',
                        'issue': 'ADDITIONAL',
                        'action': 'NEEDS_ADDITIONAL_SCREENSHOT'
                    })

    return gaps


def _analyze_choices_for_table(choices, stem):
    """選択肢が表形式かどうかを判定

    Returns: 検出パターン名 or None
    """
    # パターン1: 各選択肢に複数の数値がある（表の行 = 数値列）
    # 例: "1,600  3  20" → 3列の数値表
    num_counts = []
    for c in choices:
        # 数値（整数・小数・カンマ付き）をカウント
        nums = re.findall(r'\d[\d,.]*\d|\d', c)
        num_counts.append(len(nums))

    if num_counts:
        min_nums = min(num_counts)
        max_nums = max(num_counts)
        # 全選択肢が2列以上の数値を持ち、列数が揃っている
        if min_nums >= 2 and max_nums - min_nums <= 1:
            return f'{min_nums}col-numeric'

    # パターン2: 構造化ラベル（高値/正常/低値、陽性/陰性 等）
    label_patterns = [
        (r'(高値|正常|低値)', 'pressure-grade'),
        (r'(陽性|陰性|弱陽性)', 'pos-neg'),
        (r'(増加|減少|不変|正常)', 'change-pattern'),
        (r'(上昇|低下|正常)', 'up-down'),
    ]
    for pattern, name in label_patterns:
        match_counts = [len(re.findall(pattern, c)) for c in choices]
        if min(match_counts) >= 2:
            return name

    # パターン3: stem内の表ヘッダーキーワード（表がstemに埋め込まれている場合）
    stem_table_keywords = [
        '曜日', '曜　日',
        '測定結果', '測定値',
        '基準値', '基　準',
        '組成',
        '以下の表', '下表',
        '結果を表に', '表を示す', '表に示す',
        '血圧測定', '検査結果を以下に',
    ]
    for kw in stem_table_keywords:
        if kw in stem:
            # stem内にキーワードがあり、選択肢も構造化されている場合
            if num_counts and min(num_counts) >= 1 and max(num_counts) - min(num_counts) <= 1:
                return f'stem-keyword({kw})'

    return None


def main():
    parser = argparse.ArgumentParser(description='本冊PDF内のインライン図表を検出')
    parser.add_argument('--year', type=int, required=True, help='回数')
    parser.add_argument('--block', type=str, help='特定ブロックのみ (e.g., B)')
    parser.add_argument('--render', action='store_true',
                        help='検出ページをレンダリングして保存')
    parser.add_argument('--json-scan', action='store_true',
                        help='JSON選択肢パターン解析のみ（PDF不要）')
    args = parser.parse_args()

    # ─── 方式D: JSON選択肢パターン解析（PDF不要）───
    if args.json_scan:
        print(f"\n{'='*60}")
        print(f"  {args.year}回 選択肢テーブルパターン検出（方式D）")
        print(f"{'='*60}\n")

        json_gaps = detect_tabular_choices(args.year, args.block)

        if json_gaps:
            needs_ss = [g for g in json_gaps if g['action'] == 'NEEDS_SCREENSHOT']
            needs_add = [g for g in json_gaps if g['action'] == 'NEEDS_ADDITIONAL_SCREENSHOT']

            if needs_ss:
                print(f"  ❌ has_image=False + 選択肢テーブル検出: {len(needs_ss)}件")
                for g in needs_ss:
                    print(f"    {g['qid']}: {g['type']} → 本冊PDF目視 + スクショ")

            if needs_add:
                print(f"\n  ⚠️ 別冊画像あり + 選択肢テーブル: {len(needs_add)}件")
                for g in needs_add:
                    print(f"    {g['qid']}: {g['type']} → 追加スクショ確認")
        else:
            print(f"  ✅ 選択肢テーブルパターンなし")

        print()
        return

    # ─── 方式A: PDF描画解析 ───
    main_pdfs = find_main_pdfs(args.year)
    if not main_pdfs:
        print(f"❌ {args.year}回の本冊PDFが見つかりません")
        return

    if args.block:
        main_pdfs = {k: v for k, v in main_pdfs.items() if k == args.block.upper()}

    render_dir = None
    if args.render:
        render_dir = PDF_DIR / "回数別画像ファイル" / str(args.year) / "inline_candidates"
        render_dir.mkdir(parents=True, exist_ok=True)

    all_detected = {}
    all_gaps = []

    print(f"\n{'='*60}")
    print(f"  {args.year}回 本冊インライン図表検出（方式A: 描画解析）")
    print(f"  閾値: L>={MIN_LINES_FOR_TABLE}, C>={MIN_CURVES_FOR_DIAGRAM}")
    print(f"{'='*60}\n")

    for block in sorted(main_pdfs.keys()):
        pdf_path = main_pdfs[block]
        print(f"📄 {args.year}{block} ({pdf_path.name})")

        detected, gaps = process_block(
            args.year, block, pdf_path, args.render, render_dir)

        if detected:
            for qnum, ctype in sorted(detected.items()):
                is_gap = any(g['qid'] == f"{args.year}{block}{qnum}" for g in gaps)
                marker = "⭐" if is_gap else "  "
                print(f"  {marker} {args.year}{block}{qnum}: {ctype}")

        all_detected[block] = detected
        all_gaps.extend(gaps)

    # ─── 方式Dも自動実行（PDF解析の補完）───
    json_gaps = detect_tabular_choices(args.year, args.block)
    # PDF解析で既に検出済みの問題は除外
    detected_qids = set()
    for block, det in all_detected.items():
        for qnum in det:
            detected_qids.add(f"{args.year}{block}{qnum}")
    json_only_gaps = [g for g in json_gaps if g['qid'] not in detected_qids]
    all_gaps.extend(json_only_gaps)

    total_detected = sum(len(d) for d in all_detected.values())
    print(f"\n{'='*60}")
    print(f"  検出結果: {total_detected}問にインライン図表あり（方式A）")
    if json_only_gaps:
        print(f"  + {len(json_only_gaps)}問の選択肢テーブル候補（方式D）")
    print(f"{'='*60}")

    if all_gaps:
        needs_ss = [g for g in all_gaps if g['action'] == 'NEEDS_SCREENSHOT']
        needs_add = [g for g in all_gaps if g['action'] == 'NEEDS_ADDITIONAL_SCREENSHOT']

        if needs_ss:
            print(f"\n  ❌ has_image=False なのに図表検出: {len(needs_ss)}件")
            for g in needs_ss:
                print(f"    {g['qid']}: {g['type']} → スクショ + has_image=true")

        if needs_add:
            print(f"\n  ⚠️ 別冊画像 + 本冊にも図表: {len(needs_add)}件")
            for g in needs_add:
                print(f"    {g['qid']}: {g['type']} → 追加スクショ必要")
    else:
        print(f"\n  ✅ has_image不整合なし")

    if args.render and render_dir:
        rendered = list(render_dir.glob("*.png"))
        if rendered:
            print(f"\n  📸 レンダリング済み: {len(rendered)}ページ → {render_dir}")


if __name__ == '__main__':
    main()
