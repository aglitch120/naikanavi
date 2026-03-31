#!/usr/bin/env python3
"""
汎用ブロック抽出スクリプト
厚労省PDF → JSON（問題文・選択肢・正解）

使い方:
  python3 scripts/kokushi/extract_block.py 117 A
  python3 scripts/kokushi/extract_block.py 118 B
  python3 scripts/kokushi/extract_block.py 117 A --dry-run   # 書き込みなし
  python3 scripts/kokushi/extract_block.py 117 A --merge      # 既存メタデータ保持

ハルシネーション防止: PDFテキストの転記のみ。AI生成なし。
"""

import json
import re
import sys
import argparse
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]

# ── PDF命名規則 ──
# 117: tp220502-01{block_letter}_01.pdf / tp220502-01seitou.pdf
# 118: tp240424-01{block_letter}_01.pdf / tp240424-01seitou.pdf
# 119: tp250428-01{block_letter}_01.pdf / tp250428-01seitou.pdf
PDF_PREFIXES = {
    117: "tp220502-01",
    118: "tp240424-01",
    119: "tp250428-01",
}

BLOCK_LETTERS = {
    "A": "a", "B": "b", "C": "c", "D": "d", "E": "e", "F": "f",
}

BLOCK_SIZES = {"A": 75, "B": 50, "C": 75, "D": 75, "E": 50, "F": 75}

ANSWER_HEADER_KEYWORDS = {
    117: ('第117回', '医師国家試験', '正答値表', '問№', '正答１', '正答２', '正答３'),
    118: ('第118回', '医師国家試験', '正答値表', '問№', '正答１', '正答２', '正答３'),
    119: ('第119回', '医師国家試験', '正答値表', '問№', '正答１', '正答２', '正答３'),
}

PDF_BASE = Path("/Users/tasuku/Downloads/医師国家試験過去問")


def get_pdf_paths(year, block):
    prefix = PDF_PREFIXES[year]
    letter = BLOCK_LETTERS[block]
    base = PDF_BASE / str(year)
    q_pdf = base / f"{prefix}{letter}_01.pdf"
    a_pdf = base / f"{prefix}seitou.pdf"
    if not q_pdf.exists():
        raise FileNotFoundError(f"問題PDF not found: {q_pdf}")
    if not a_pdf.exists():
        raise FileNotFoundError(f"正解PDF not found: {a_pdf}")
    return q_pdf, a_pdf


def parse_answers(pdf_path, year):
    """正解PDFから全ブロックの正解を抽出"""
    import fitz
    doc = fitz.open(str(pdf_path))
    answers = {}

    header_kw = ANSWER_HEADER_KEYWORDS.get(year, ANSWER_HEADER_KEYWORDS[119])

    for page in doc:
        text = page.get_text()
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        i = 0
        while i < len(lines):
            m = re.match(r'^([A-F])(\d{3})$', lines[i])
            if m:
                block_letter, num = m.group(1), int(m.group(2))
                key = f"{block_letter}{num:03d}"
                ans_parts = []
                i += 1
                while i < len(lines):
                    nxt = lines[i]
                    # 次の問題番号に到達
                    if re.match(r'^[A-F]\d{3}$', nxt):
                        break
                    # ヘッダー行はスキップ
                    if nxt in header_kw:
                        i += 1
                        continue
                    ans_parts.append(nxt)
                    i += 1
                raw_ans = ''.join(ans_parts).strip()
                answers[key] = raw_ans
            else:
                i += 1
    doc.close()
    return answers


def parse_answer_value(raw_ans, num_answers):
    """正解の生テキストをパースして正規化"""
    if not raw_ans:
        return None

    # 数値回答（計算問題）: 数字のみ or 小数
    if re.match(r'^[\d.]+$', raw_ans):
        # 単一選択で1文字の場合はありえない（a-eのはず）
        # 2桁以上の数字 or 小数は計算問題の回答
        if len(raw_ans) > 1 or '.' in raw_ans:
            return raw_ans

    # 空欄（採点除外問題）
    if raw_ans in ('', '—', '－', '-', '―'):
        return None

    # a-j のアルファベット回答（6択以上の問題はf-j）
    raw_lower = raw_ans.lower()
    # "ABE" -> ["a","b","e"] or "H" -> "h"
    letters = [c for c in raw_lower if c in 'abcdefghij']

    if len(letters) == 0:
        # 数値回答の可能性
        return raw_ans

    if len(letters) == 1:
        return letters[0]
    else:
        return letters


def clean_pdf_text(doc, year):
    """PDFの全問題ページからクリーンなテキストを生成"""
    header_prefix = "DKIX"

    # 問題開始ページを自動検出:
    # 「1」+全角/半角スペース+テキスト の後に選択肢(ａ-ｅ)が続くページ
    # 注意書きページの例題を誤検出しないよう、選択肢の存在で判定
    start_page = 0
    for i in range(len(doc)):
        text = doc[i].get_text()
        # 問題番号1があり、かつ選択肢パターン(ａ　or a  )もある
        has_q1 = re.search(r'(?:^|\n)\s*1[\u3000\s]', text)
        has_choices = re.search(r'(?:^|\n)[ａｂｃｄｅ][\u3000\s]', text)
        # 例題ページを除外: "(例" が含まれるページはスキップ
        is_example = '（例' in text or '(例' in text
        if has_q1 and has_choices and not is_example:
            start_page = i
            break

    full_text = ""
    for i in range(start_page, len(doc)):
        page_text = doc[i].get_text()
        lines = page_text.split('\n')
        cleaned = []
        skip_next_blank = False
        after_header = False

        for line in lines:
            s = line.strip()

            # ページヘッダー除去 (DKIX...)
            if s.startswith(header_prefix):
                after_header = True
                continue

            # ヘッダー直後のゴミ除去
            if after_header:
                # 全角スペースのみの行
                if re.match(r'^[\u3000\s]*$', s):
                    continue
                # ページ通し番号（単独数字行）
                if re.match(r'^\d{1,3}$', s):
                    after_header = False
                    continue
                after_header = False

            # 全角スペース4つで始まるページ番号行
            if line.startswith('\u3000\u3000\u3000\u3000') and re.match(r'^[\u3000\s]*\d{1,3}[\u3000\s]*$', s):
                continue

            # 空白のみの行はスキップ
            if not s:
                continue

            cleaned.append(s)

        full_text += '\n'.join(cleaned) + '\n'

    return full_text


def is_table_data_line(full_text, match_start):
    """マッチ位置がテーブルデータ内の数字行かどうかを判定"""
    # 前の数行を見て、短い数字のみの行が連続していたらテーブル
    before = full_text[max(0, match_start - 100):match_start]
    lines = before.split('\n')
    # 直前の行が短い数字行ならテーブルデータ
    short_num_lines = 0
    for l in reversed(lines[-3:]):
        s = l.strip()
        if re.match(r'^[\d.,]+$', s) and len(s) <= 6:
            short_num_lines += 1
    return short_num_lines >= 2


def find_question_boundaries(full_text, total_q):
    """問題番号の位置を検出し、テキストを問題ごとに分割"""

    # 問題番号候補: 行頭の数字 + 全角or半角スペース + 何らかのテキスト
    pattern = re.compile(
        r'^(\d{1,2})[\u3000\s]+(\S)',
        re.MULTILINE
    )

    all_matches = []
    for m in pattern.finditer(full_text):
        num = int(m.group(1))
        if 1 <= num <= total_q:
            # テーブルデータ内の数字行を除外
            if is_table_data_line(full_text, m.start()):
                continue
            text_start = m.start() + len(m.group(1))
            all_matches.append((num, m.start(), text_start))

    # 位置順にソート
    all_matches.sort(key=lambda x: x[1])

    # シーケンシャルにフィルタ: 1→2→3...の順で、位置が昇順のもののみ採用
    valid = []
    last_pos = -1
    for target_num in range(1, total_q + 1):
        candidates = [(num, s, e) for num, s, e in all_matches
                       if num == target_num and s > last_pos]
        if candidates:
            _, s, e = candidates[0]
            valid.append((target_num, s, e))
            last_pos = s
        else:
            print(f"  ⚠️ Q{target_num}: 問題番号が見つからない")

    return valid


def parse_questions(pdf_path, year, block):
    """問題PDFから問題を抽出"""
    import fitz
    doc = fitz.open(str(pdf_path))
    total_q = BLOCK_SIZES[block]

    full_text = clean_pdf_text(doc, year)
    doc.close()

    boundaries = find_question_boundaries(full_text, total_q)

    questions = []
    for idx, (num, start, text_start) in enumerate(boundaries):
        if idx + 1 < len(boundaries):
            next_start = boundaries[idx + 1][1]
            q_text = full_text[text_start:next_start]
        else:
            q_text = full_text[text_start:]

        q = parse_single_question(num, q_text, year, block)
        questions.append(q)

    return questions


def parse_single_question(num, raw_text, year, block):
    """1問分のテキストから問題文・選択肢を分離"""
    lines = [l for l in raw_text.split('\n')]

    stem_parts = []
    choices = {}
    has_image = False
    num_answers = 1
    is_calculation = False
    has_kinki = False

    full = ' '.join(l.strip() for l in lines)

    if '2 つ選べ' in full or '2つ選べ' in full:
        num_answers = 2
    if '3 つ選べ' in full or '3つ選べ' in full:
        num_answers = 3
    if '別冊' in full or '別　冊' in full:
        has_image = True
    if '求めよ' in full or '算出せよ' in full:
        is_calculation = True
    if '禁忌' in full:
        has_kinki = True

    for line in lines:
        s = line.strip()
        if not s:
            continue

        # 選択肢: ａ　テキスト（全角a-e）
        choice_m = re.match(r'^([ａ-ｅ])\s+(.+)', s)
        if choice_m:
            letter = choice_m.group(1).translate(str.maketrans('ａｂｃｄｅ', 'abcde'))
            choices[letter] = choice_m.group(2).strip()
            continue

        # 選択肢: a テキスト（半角、まれ）
        choice_m2 = re.match(r'^([a-e])\s{2,}(.+)', s)
        if choice_m2:
            letter = choice_m2.group(1)
            choices[letter] = choice_m2.group(2).strip()
            continue

        # 選択肢: a〜eが6個以上ある問題（f, g, h...）
        choice_m3 = re.match(r'^([ｆ-ｊ])\s+(.+)', s)
        if choice_m3:
            letter = choice_m3.group(1).translate(
                str.maketrans('ｆｇｈｉｊ', 'fghij'))
            choices[letter] = choice_m3.group(2).strip()
            continue

        choice_m4 = re.match(r'^([f-j])\s{2,}(.+)', s)
        if choice_m4:
            choices[choice_m4.group(1)] = choice_m4.group(2).strip()
            continue

        # 別冊参照行はstemに含めない（ただしhas_imageフラグは立てる）
        if re.match(r'^別\s*冊', s):
            has_image = True
            continue
        if re.match(r'^No\.\s+\d+', s):
            continue

        # それ以外は問題文
        stem_parts.append(s)

    stem = '\n'.join(stem_parts).strip()
    # 連続空行を1つに
    stem = re.sub(r'\n{2,}', '\n', stem)
    # stemの先頭に問題番号が残っている場合は除去
    stem = re.sub(r'^' + str(num) + r'\s+', '', stem)
    stem = re.sub(r'^' + str(num) + r'\u3000+', '', stem)

    return {
        'num': num,
        'id': f"{year}{block}{num}",
        'exam_year': year,
        'block': block,
        'stem': stem,
        'choices': choices,
        'answer': None,
        'format': {
            'type1': None,
            'type2': None,
            'num_answers': num_answers,
            'has_image': has_image,
            'is_calculation': is_calculation,
            'has_kinki': has_kinki,
            'is_deleted': False,
        },
        'field': None,
        'subfield': None,
        'topic': None,
        'action': None,
        'knowledge_type': None,
        'explanation': {
            'summary': None,
            'choices': {},
            'background': None,
            'key_point': None,
        },
    }


def merge_metadata(new_questions, existing_path):
    """既存JSONからfield/subfield/topic/type1/type2/is_deletedを引き継ぐ"""
    if not existing_path.exists():
        print(f"  既存ファイルなし: {existing_path}")
        return new_questions

    existing = json.load(open(existing_path))
    old_qs = {q['id']: q for q in existing.get('questions', existing)}

    merged_count = 0
    for q in new_questions:
        old = old_qs.get(q['id'])
        if old:
            # メタデータのみ引き継ぎ
            for key in ('field', 'subfield', 'topic', 'action', 'knowledge_type'):
                if old.get(key):
                    q[key] = old[key]
            # format内のtype1/type2/is_deleted/has_kinkiも引き継ぎ
            old_fmt = old.get('format', {})
            for key in ('type1', 'type2', 'is_deleted', 'has_kinki'):
                if old_fmt.get(key) is not None:
                    q['format'][key] = old_fmt[key]
            # explanationも引き継ぎ
            if old.get('explanation'):
                q['explanation'] = old['explanation']
            merged_count += 1

    print(f"  メタデータ引き継ぎ: {merged_count}/{len(new_questions)}問")
    return new_questions


def validate_questions(questions, block, answers_for_block):
    """抽出結果を検証"""
    total = BLOCK_SIZES[block]
    issues = []

    if len(questions) != total:
        issues.append(f"問題数: {len(questions)}/{total}")

    missing_nums = set(range(1, total + 1)) - {q['num'] for q in questions}
    if missing_nums:
        issues.append(f"欠番: {sorted(missing_nums)}")

    for q in questions:
        qid = q['id']
        # stem
        if not q['stem'] or len(q['stem'].strip()) < 5:
            issues.append(f"{qid}: stem欠損")

        # choices (計算問題以外)
        if not q['choices'] and not q['format']['is_calculation']:
            issues.append(f"{qid}: 選択肢なし")

        # answer
        if not q.get('answer'):
            if q['format'].get('is_deleted'):
                pass  # 採点除外はOK
            else:
                issues.append(f"{qid}: 正解なし")
        elif q['choices'] and not q['format']['is_calculation']:
            ans = q['answer']
            if isinstance(ans, list):
                for a in ans:
                    if a not in q['choices']:
                        issues.append(f"{qid}: 正解'{a}'が選択肢にない")
            elif isinstance(ans, str) and ans not in q['choices']:
                issues.append(f"{qid}: 正解'{ans}'が選択肢にない")

    return issues


def main():
    parser = argparse.ArgumentParser(description='国試PDFから問題を抽出')
    parser.add_argument('year', type=int, help='回数 (117, 118, 119)')
    parser.add_argument('block', type=str, help='ブロック (A-F)')
    parser.add_argument('--dry-run', action='store_true', help='書き込みなし')
    parser.add_argument('--merge', action='store_true', help='既存メタデータを保持')
    args = parser.parse_args()

    year = args.year
    block = args.block.upper()

    if year not in PDF_PREFIXES:
        print(f"未対応の回数: {year}")
        sys.exit(1)
    if block not in BLOCK_SIZES:
        print(f"無効なブロック: {block}")
        sys.exit(1)

    print(f"=== {year}回 {block}ブロック ({BLOCK_SIZES[block]}問) ===\n")

    q_pdf, a_pdf = get_pdf_paths(year, block)
    print(f"問題PDF: {q_pdf}")
    print(f"正解PDF: {a_pdf}")

    # 正解抽出
    print(f"\n--- 正解抽出 ---")
    all_answers = parse_answers(a_pdf, year)
    block_answers = {k: v for k, v in all_answers.items() if k.startswith(block)}
    print(f"  {block}ブロック正解: {len(block_answers)}問")

    # サンプル表示
    sample_keys = sorted(block_answers.keys())[:5]
    for k in sample_keys:
        print(f"    {k}: {block_answers[k]}")

    # 問題抽出
    print(f"\n--- 問題抽出 ---")
    questions = parse_questions(q_pdf, year, block)
    print(f"  抽出問題数: {len(questions)}")

    # 正解マージ
    print(f"\n--- 正解マージ ---")
    for q in questions:
        key = f"{block}{q['num']:03d}"
        raw_ans = block_answers.get(key, '')
        q['answer'] = parse_answer_value(raw_ans, q['format']['num_answers'])

        # 採点除外判定
        if not raw_ans or raw_ans in ('', '—', '－', '-'):
            q['format']['is_deleted'] = True

    # メタデータマージ
    if args.merge:
        print(f"\n--- メタデータマージ ---")
        existing_path = REPO / f"data/questions/{year}/{year}{block}.json"
        questions = merge_metadata(questions, existing_path)

    # 検証
    print(f"\n--- 検証 ---")
    issues = validate_questions(questions, block, block_answers)
    if issues:
        print(f"  ⚠️ {len(issues)}件の問題:")
        for issue in issues:
            print(f"    {issue}")
    else:
        print(f"  ✅ 問題なし")

    # 統計
    print(f"\n--- 統計 ---")
    print(f"  total:        {len(questions)}")
    print(f"  with stem:    {sum(1 for q in questions if q['stem'] and len(q['stem']) >= 5)}")
    print(f"  with choices: {sum(1 for q in questions if len(q.get('choices', {})) >= 2)}")
    print(f"  with answer:  {sum(1 for q in questions if q.get('answer'))}")
    print(f"  multi-select: {sum(1 for q in questions if q['format']['num_answers'] > 1)}")
    print(f"  has_image:    {sum(1 for q in questions if q['format']['has_image'])}")
    print(f"  calculation:  {sum(1 for q in questions if q['format']['is_calculation'])}")
    print(f"  deleted:      {sum(1 for q in questions if q['format']['is_deleted'])}")

    # サンプル
    print(f"\n--- サンプル (最初の3問) ---")
    for q in questions[:3]:
        print(f"\n  [{q['id']}] answer={q['answer']} sel={q['format']['num_answers']}")
        stem_preview = q['stem'].replace('\n', ' ')[:100]
        print(f"    Q: {stem_preview}")
        for k, v in sorted(q['choices'].items()):
            print(f"    {k}: {v[:60]}")

    # 書き込み
    if not args.dry_run:
        output_dir = REPO / f"data/questions/{year}"
        output_dir.mkdir(parents=True, exist_ok=True)
        output_path = output_dir / f"{year}{block}.json"

        output = {
            'exam_year': year,
            'block': block,
            'total_questions': len(questions),
            'source': f'厚生労働省 第{year}回医師国家試験',
            'questions': questions,
        }

        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(output, f, ensure_ascii=False, indent=2)

        print(f"\n✅ 保存: {output_path}")
    else:
        print(f"\n[dry-run] 書き込みスキップ")


if __name__ == '__main__':
    main()
