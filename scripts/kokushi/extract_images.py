#!/usr/bin/env python3
"""
別冊PDF → 問題別画像抽出スクリプト

Usage:
  python3 scripts/kokushi/extract_images.py
  python3 scripts/kokushi/extract_images.py --year 118
  python3 scripts/kokushi/extract_images.py --dry-run
"""
import json, re, os, subprocess, argparse
from pathlib import Path
from collections import defaultdict

try:
    import fitz  # PyMuPDF
    HAS_FITZ = True
except ImportError:
    HAS_FITZ = False

try:
    from PIL import Image
    HAS_PIL = True
except ImportError:
    HAS_PIL = False

try:
    import numpy as np
    HAS_NUMPY = True
except ImportError:
    HAS_NUMPY = False

PDF_DIR = Path("/Users/tasuku/Downloads/医師国家試験過去問")
REPO = Path(__file__).resolve().parents[2]
DATA_DIR = REPO / "data/questions"
IMG_DIR = PDF_DIR / "回数別画像ファイル"

# PDF naming patterns per era
# Returns list of (block, booklet_pdf_path) tuples
def find_booklet_pdfs(year):
    year_dir = PDF_DIR / str(year)
    if not year_dir.exists():
        return []

    results = []
    pdfs = sorted(year_dir.glob("*.pdf"))

    for pdf in pdfs:
        name = pdf.name.lower()
        # Pattern 1: 100回 "tp0419-1a-betu.pdf"
        m = re.match(r'.*-(\w)-betu\.pdf$', name)
        if m:
            block = m.group(1).upper()
            results.append((block, pdf))
            continue
        # Pattern 2: 104-105回 "tp_siken_10X_ishi_02.pdf" (single booklet for all blocks)
        # Skip - these are combined and harder to split
        # Pattern 3: 109+ "tp...-01X_02.pdf" or "tp...-01X_02_01.pdf"
        m = re.match(r'.*-01([a-i])_02(?:_\d+)?\.pdf$', name)
        if m:
            block = m.group(1).upper()
            if (block, pdf) not in results:
                # Merge multiple _02_01, _02_02 etc for same block
                existing = [r for r in results if r[0] == block]
                if not existing:
                    results.append((block, pdf))
                # else already have this block
            continue

    return results


def extract_page_mapping(pdf_path, block):
    """Extract page -> question number mapping from booklet PDF text."""
    result = subprocess.run(
        ['pdftotext', '-layout', str(pdf_path), '-'],
        capture_output=True, text=True
    )
    if result.returncode != 0:
        return {}

    pages = result.stdout.split('\f')
    page_to_qnums = {}

    # Block letter: match both half-width (A) and full-width (Ａ)
    hw = block  # e.g. "A"
    fw = chr(ord('Ａ') + ord(block) - ord('A'))  # e.g. "Ａ"
    block_pat = f'[{hw}{fw}]'

    for i, page_text in enumerate(pages, 1):
        flat = re.sub(r'\s+', ' ', page_text)

        # Match "（A 問題 15）" patterns (flexible whitespace, multi-line flattened)
        matches = set()
        # Standard: （A 問題 15） — half/full-width block letter and parens
        for m in re.findall(rf'[（(]\s*{block_pat}\s+問題\s*(\d+)\s*[）)]?', flat):
            matches.add(int(m))
        # Reversed: 問題 51 ） （A  — happens when text wraps
        for m in re.findall(rf'問題\s*(\d+)\s*[）)]\s*[（(]?\s*{block_pat}', flat):
            matches.add(int(m))
        # No-paren format: "A 問題 18" or "問題 18 A" (115回等)
        if not matches:
            for m in re.findall(rf'{block_pat}\s+問題\s*(\d+)', flat):
                matches.add(int(m))
            for m in re.findall(rf'問題\s*(\d+)\s+{block_pat}', flat):
                matches.add(int(m))
        # Fallback: 問題 XX with block letter somewhere on same page
        if not matches:
            has_block = re.search(rf'[（(]?\s*{block_pat}', flat)
            if has_block:
                for m in re.findall(r'問題\s*(\d+)', flat):
                    matches.add(int(m))

        for qnum in matches:
            if qnum not in page_to_qnums:
                page_to_qnums[qnum] = []
            if i not in page_to_qnums[qnum]:
                page_to_qnums[qnum].append(i)

    return page_to_qnums


def detect_rotated_pages(pdf_path):
    """Detect pages where content is rotated 90° CCW using 'No.' text x-coordinate.

    Normal pages: 'No.' appears at top center (x > 200)
    Rotated pages: 'No.' appears at left side (x < 200)
    Returns set of 1-based page numbers that need 90° CW rotation.
    """
    if not HAS_FITZ:
        return set()

    rotated = set()
    try:
        pdf = fitz.open(str(pdf_path))
        for page_num in range(len(pdf)):
            page = pdf[page_num]
            blocks = page.get_text('dict')['blocks']
            for block in blocks:
                if 'lines' not in block:
                    continue
                found = False
                for line in block['lines']:
                    for span in line['spans']:
                        if 'No.' in span['text']:
                            if span['bbox'][0] < 200:
                                rotated.add(page_num + 1)
                            found = True
                            break
                    if found:
                        break
                if found:
                    break
        pdf.close()
    except Exception:
        pass
    return rotated


def rotate_image_cw90(img_path):
    """Rotate a PNG image 90° clockwise using PIL."""
    if not HAS_PIL:
        return False
    try:
        img = Image.open(img_path)
        rotated = img.rotate(-90, expand=True)
        rotated.save(img_path)
        return True
    except Exception:
        return False


def smart_trim(img_path, is_rotated=False, padding=10, header_pct=0.12, footer_pct=0.13):
    """Remove header/footer and trim whitespace from extracted page image.

    Header: "No. X （A 問題XX）" occupies top ~6-8% of the page.
    Footer: "— XX —" + DKIX code occupies bottom ~10-13%.

    For rotated pages (originally landscape, rotated 90° CW to portrait):
    - Original bottom (footer) → LEFT edge after rotation
    - Original left (No. header) → TOP after rotation
    So we remove TOP (header) and LEFT (footer).
    """
    if not HAS_PIL or not HAS_NUMPY:
        return False

    try:
        img = Image.open(img_path)
        w, h = img.size
        arr = np.array(img)

        if is_rotated:
            # After 90° CW rotation of landscape page:
            # - No. header (original left) → now at TOP
            # - Footer/page num (original bottom) → now at LEFT edge
            # Rotated pages need wider header strip (No. text at ~15% from edge)
            rot_header_pct = max(header_pct, 0.18)
            header_h = int(h * rot_header_pct)
            footer_w = int(w * footer_pct)
            arr[:header_h, :] = 255   # Remove header from top
            arr[:, :footer_w] = 255   # Remove footer from left edge
        else:
            # Normal portrait: header at top, footer at bottom
            header_h = int(h * header_pct)
            footer_h = int(h * footer_pct)
            arr[:header_h, :] = 255
            arr[h - footer_h:, :] = 255

        img = Image.fromarray(arr)

        # Detect content bounds with tight threshold
        gray = np.array(img.convert('L'))
        mask = gray < 245
        rows = np.any(mask, axis=1)
        cols = np.any(mask, axis=0)

        if not rows.any():
            return False

        rmin, rmax = np.where(rows)[0][[0, -1]]
        cmin, cmax = np.where(cols)[0][[0, -1]]

        top = max(0, rmin - padding)
        bottom = min(h, rmax + padding)
        left = max(0, cmin - padding)
        right = min(w, cmax + padding)

        cropped = img.crop((left, top, right, bottom))
        cropped.save(img_path)
        return True
    except Exception:
        return False


def find_multi_part_booklets(year, block):
    """Find all _02_01, _02_02 etc booklet parts for a block."""
    year_dir = PDF_DIR / str(year)
    parts = []
    for pdf in sorted(year_dir.glob("*.pdf")):
        name = pdf.name.lower()
        m = re.match(rf'.*-01{block.lower()}_02(?:_(\d+))?\.pdf$', name)
        if m:
            parts.append(pdf)
    return parts


def render_pages(pdf_path, page_nums, out_dir, prefix):
    """Render specific pages from PDF to PNG."""
    rendered = []
    for page in page_nums:
        out_path = out_dir / f"{prefix}_p{page}.png"
        if out_path.exists():
            rendered.append(out_path)
            continue
        subprocess.run(
            ['pdftoppm', '-png', '-r', '200', '-f', str(page), '-l', str(page),
             '-cropbox', str(pdf_path), str(out_path).replace('.png', '')],
            capture_output=True
        )
        # pdftoppm adds page number suffix
        actual = out_path.parent / f"{prefix}_p{page}-{page:02d}.png"
        if not actual.exists():
            actual = out_path.parent / f"{prefix}_p{page}-{page}.png"
        if actual.exists():
            actual.rename(out_path)
            rendered.append(out_path)
        else:
            # Try finding the file
            for f in out_path.parent.glob(f"{prefix}_p{page}*.png"):
                f.rename(out_path)
                rendered.append(out_path)
                break
    return rendered


def process_year(year, dry_run=False, force=False):
    """Process all blocks for a given year."""
    booklets = find_booklet_pdfs(year)
    if not booklets:
        return 0, 0, []

    year_img_dir = IMG_DIR / str(year)
    total_extracted = 0
    total_questions = 0
    issues = []

    for block, pdf_path in booklets:
        # Load JSON to find which questions have images
        json_path = DATA_DIR / str(year) / f"{year}{block}.json"
        if not json_path.exists():
            issues.append(f"{year}{block}: JSONなし")
            continue

        with open(json_path) as f:
            data = json.load(f)

        # Real image questions: "別に示す" in stem
        real_img_qs = {q['num']: q for q in data['questions'] if '別に示す' in q['stem']}

        if not real_img_qs:
            continue

        # Check for multi-part booklets
        parts = find_multi_part_booklets(year, block)
        if len(parts) > 1:
            # Merge mappings from all parts
            page_map = {}
            for part in parts:
                pm = extract_page_mapping(part, block)
                # Offset page numbers for subsequent parts... actually each part
                # has its own page numbering in pdftotext. We handle them separately.
                for qnum, pages in pm.items():
                    if qnum not in page_map:
                        page_map[qnum] = (part, pages)
        else:
            pm = extract_page_mapping(pdf_path, block)
            page_map = {qnum: (pdf_path, pages) for qnum, pages in pm.items()}

        mapped = set(page_map.keys())
        expected = set(real_img_qs.keys())
        missing = expected - mapped

        if missing:
            issues.append(f"{year}{block}: 別冊マッピング漏れ {sorted(missing)}")

        # Detect rotated pages per PDF
        rotated_pages_map = {}  # pdf_path -> set of rotated page numbers
        if len(parts) > 1:
            for part in parts:
                rotated_pages_map[str(part)] = detect_rotated_pages(part)
        else:
            rotated_pages_map[str(pdf_path)] = detect_rotated_pages(pdf_path)

        total_rotated = sum(len(v) for v in rotated_pages_map.values())

        if dry_run:
            print(f"  {year}{block}: 画像{len(real_img_qs)}問, マッピング{len(mapped)}問, 漏れ{len(missing)}, 回転{total_rotated}p")
            total_questions += len(real_img_qs)
            total_extracted += len(mapped)
            continue

        # Extract images
        year_img_dir.mkdir(parents=True, exist_ok=True)

        for qnum in sorted(mapped & expected):
            pdf_for_q, page_list = page_map[qnum]
            qid = f"{year}{block}{qnum}"
            rotated_set = rotated_pages_map.get(str(pdf_for_q), set())

            for idx, page in enumerate(page_list):
                if len(page_list) == 1:
                    out_path = year_img_dir / f"{qid}.png"
                else:
                    out_path = year_img_dir / f"{qid}_{idx+1}.png"

                if out_path.exists() and not force:
                    total_extracted += 1
                    continue

                subprocess.run(
                    ['pdftoppm', '-png', '-r', '200', '-f', str(page), '-l', str(page),
                     '-cropbox', str(pdf_for_q), str(out_path).replace('.png', '')],
                    capture_output=True
                )
                # Rename pdftoppm output
                for f in out_path.parent.glob(f"{out_path.stem}*.png"):
                    if f != out_path:
                        f.rename(out_path)
                        break

                # Auto-rotate if page is detected as rotated
                is_rotated = page in rotated_set
                if out_path.exists() and is_rotated:
                    rotate_image_cw90(out_path)

                # Trim: remove footer + whitespace
                if out_path.exists():
                    smart_trim(out_path, is_rotated=is_rotated)

                if out_path.exists():
                    total_extracted += 1

            total_questions += 1

    return total_questions, total_extracted, issues


def main():
    parser = argparse.ArgumentParser(description='別冊PDF → 問題別画像抽出')
    parser.add_argument('--year', type=int, help='特定の回のみ処理')
    parser.add_argument('--dry-run', action='store_true', help='抽出せず確認のみ')
    parser.add_argument('--force', action='store_true', help='既存ファイルを上書きして再抽出')
    args = parser.parse_args()

    years = [args.year] if args.year else list(range(100, 121))

    grand_total_q = 0
    grand_total_img = 0
    all_issues = []

    for year in years:
        nq, ni, issues = process_year(year, args.dry_run, getattr(args, 'force', False))
        if nq > 0:
            print(f"  {year}回: {nq}問 → {ni}画像{'(dry-run)' if args.dry_run else ''}")
        grand_total_q += nq
        grand_total_img += ni
        all_issues.extend(issues)

    print(f"\n{'='*50}")
    print(f"合計: {grand_total_q}問, {grand_total_img}画像")

    if all_issues:
        print(f"\n⚠️ 問題 ({len(all_issues)}件):")
        for iss in all_issues:
            print(f"  {iss}")
    else:
        print("✅ 問題なし")


if __name__ == '__main__':
    main()
