#!/usr/bin/env python3
"""
119回A問題 抽出スクリプト
厚労省PDF → JSON（問題文・選択肢・正解）

ハルシネーション防止: PDFテキストの転記のみ。AI生成なし。
"""

import json
import re
import fitz  # pymupdf

Q_PDF = "/Users/tasuku/Downloads/医師国家試験過去問/119/tp250428-01a_01.pdf"
A_PDF = "/Users/tasuku/Downloads/医師国家試験過去問/119/tp250428-01seitou.pdf"
OUTPUT = "/Users/tasuku/Desktop/iwor/data/questions/119/119A.json"

QUESTION_START_PAGE = 6  # 0-indexed, page 7 in PDF (after instructions)
TOTAL_QUESTIONS = 75


def parse_answers(pdf_path):
    """正解PDFから全ブロックの正解を抽出"""
    doc = fitz.open(pdf_path)
    answers = {}
    for page in doc:
        text = page.get_text()
        lines = [l.strip() for l in text.split('\n') if l.strip()]
        i = 0
        while i < len(lines):
            m = re.match(r'^([A-F])(\d{3})$', lines[i])
            if m:
                block, num = m.group(1), int(m.group(2))
                key = f"{block}{num:03d}"
                ans_parts = []
                i += 1
                while i < len(lines):
                    nxt = lines[i]
                    if re.match(r'^[A-F]\d{3}$', nxt):
                        break
                    if nxt in ('問№', '正答１', '正答２', '正答３', '第119回', '医師国家試験', '正答値表'):
                        i += 1
                        continue
                    ans_parts.append(nxt)
                    i += 1
                answers[key] = ''.join(ans_parts).strip().lower()
            else:
                i += 1
    doc.close()
    return answers


def parse_questions(pdf_path):
    """問題PDFからA問題75問を抽出"""
    doc = fitz.open(pdf_path)

    # 問題ページのみ連結（注意書きページをスキップ）
    full_text = ""
    for i in range(QUESTION_START_PAGE, len(doc)):
        page_text = doc[i].get_text()
        lines = page_text.split('\n')
        cleaned = []
        for line in lines:
            s = line.strip()
            # ページヘッダー(DKIX...)を除去
            if s.startswith('DKIX'):
                continue
            # ページ通し番号（全角スペース+数字のみ、問題番号ではない）
            # ページ通し番号は4つの全角スペースで始まる
            if line.startswith('\u3000\u3000\u3000\u3000') and re.match(r'^[\u3000\s]*\d{1,2}[\u3000\s]*$', s):
                continue
            cleaned.append(line)
        full_text += '\n'.join(cleaned) + '\n'
    doc.close()

    # 問題を分割: "N " or "N\n" パターンで問題番号を検出
    questions = []
    # Pattern A: "N テキスト" (番号+空白+テキスト) — 通常パターン
    # Pattern B: "N \n" (番号のみの行) — 長文問題で番号が独立行のパターン
    pattern = re.compile(r'(?:^|\n)\s*(\d{1,2})\s*(?=\n|\s+\S)', re.MULTILINE)

    matches = list(pattern.finditer(full_text))
    valid_matches = []
    for m in matches:
        num = int(m.group(1))
        if 1 <= num <= TOTAL_QUESTIONS:
            valid_matches.append((num, m.start(), m.end()))

    # Deduplicate: keep only the first occurrence of each number
    seen = set()
    unique_matches = []
    for num, start, end in valid_matches:
        if num not in seen:
            seen.add(num)
            unique_matches.append((num, start, end))

    # Sort by position
    unique_matches.sort(key=lambda x: x[1])

    for idx, (num, start, end) in enumerate(unique_matches):
        # Text from end of number match to start of next question
        if idx + 1 < len(unique_matches):
            next_start = unique_matches[idx + 1][1]
            q_text = full_text[end:next_start]
        else:
            q_text = full_text[end:]

        q = parse_single_question(num, q_text)
        questions.append(q)

    return questions


def parse_single_question(num, raw_text):
    """1問分のテキストから問題文・選択肢を分離"""
    lines = [l.strip() for l in raw_text.strip().split('\n') if l.strip()]

    stem_parts = []
    choices = {}
    has_image = False
    num_answers = 1
    is_calculation = False

    full = ' '.join(lines)
    if '2 つ選べ' in full or '2つ選べ' in full:
        num_answers = 2
    if '3 つ選べ' in full or '3つ選べ' in full:
        num_answers = 3
    if '別冊' in full or '別　冊' in full:
        has_image = True
    if '求めよ' in full or '算出せよ' in full:
        is_calculation = True

    for line in lines:
        # 選択肢: ａ　テキスト（全角a-e）
        choice_m = re.match(r'^([ａ-ｅ])\s+(.+)', line)
        if choice_m:
            letter = choice_m.group(1).translate(str.maketrans('ａｂｃｄｅ', 'abcde'))
            choices[letter] = choice_m.group(2).strip()
            continue

        # 選択肢: a テキスト（半角、まれ）
        choice_m2 = re.match(r'^([a-e])\s{2,}(.+)', line)
        if choice_m2:
            choices[choice_m2.group(1)] = choice_m2.group(2).strip()
            continue

        # 別冊参照行はスキップ
        if line.startswith('別') and ('冊' in line or 'No.' in line):
            has_image = True
            continue
        if re.match(r'^No\.\s+\d+', line):
            continue

        # それ以外は問題文
        stem_parts.append(line)

    stem = '\n'.join(stem_parts).strip()
    # 末尾の余分な空行を除去
    stem = re.sub(r'\n{2,}', '\n', stem)

    return {
        'num': num,
        'id': f"119A{num}",
        'exam_year': 119,
        'block': 'A',
        'stem': stem,
        'choices': choices,
        'answer': None,  # 後で紐付け
        'format': {
            'type1': None,  # 後で分類
            'type2': None,
            'num_answers': num_answers,
            'has_image': has_image,
            'is_calculation': is_calculation,
            'has_kinki': False,  # 後で判定
            'is_deleted': False,
        },
        'field': None,
        'subfield': None,
        'disease': [],
    }


def main():
    print("=== Parsing answer key ===")
    all_answers = parse_answers(A_PDF)
    a_answers = {k: v for k, v in all_answers.items() if k.startswith('A')}
    print(f"  A block answers: {len(a_answers)}")

    print("\n=== Parsing questions ===")
    questions = parse_questions(Q_PDF)
    print(f"  Questions found: {len(questions)}")

    if len(questions) != TOTAL_QUESTIONS:
        print(f"  ⚠️ WARNING: Expected {TOTAL_QUESTIONS}, got {len(questions)}")
        missing = set(range(1, TOTAL_QUESTIONS + 1)) - {q['num'] for q in questions}
        if missing:
            print(f"  Missing: {sorted(missing)}")

    print("\n=== Merging answers ===")
    for q in questions:
        key = f"A{q['num']:03d}"
        if key in a_answers:
            q['answer'] = a_answers[key]
        else:
            print(f"  WARNING: No answer for {key}")

    output = {
        'exam_year': 119,
        'block': 'A',
        'total_questions': len(questions),
        'source': '厚生労働省 第119回医師国家試験',
        'questions': questions,
    }

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    # 検証
    print(f"\n=== Verification ===")
    print(f"  Total: {len(questions)}")
    print(f"  With answer: {sum(1 for q in questions if q.get('answer'))}")
    print(f"  With choices (>=2): {sum(1 for q in questions if len(q.get('choices', {})) >= 2)}")
    print(f"  Multi-select (2+): {sum(1 for q in questions if q['format']['num_answers'] > 1)}")
    print(f"  Has image: {sum(1 for q in questions if q['format']['has_image'])}")
    print(f"  Calculation: {sum(1 for q in questions if q['format']['is_calculation'])}")

    # 最初の5問を表示
    print(f"\n=== Sample ===")
    for q in questions[:5]:
        print(f"\n  [{q['id']}] answer={q['answer']} sel={q['format']['num_answers']}")
        stem_preview = q['stem'].replace('\n', ' ')[:100]
        print(f"    Q: {stem_preview}")
        for k, v in q['choices'].items():
            print(f"    {k}: {v}")

    # 正解一致チェック: 選択数と正解文字数が合うか
    print(f"\n=== Answer consistency ===")
    issues = 0
    for q in questions:
        ans = q.get('answer', '')
        if not ans:
            continue
        # 計算問題は数値なのでスキップ
        if q['format']['is_calculation']:
            continue
        expected_len = q['format']['num_answers']
        actual_len = len(ans)
        if expected_len != actual_len:
            print(f"  ⚠️ {q['id']}: num_answers={expected_len} but answer='{ans}' (len={actual_len})")
            issues += 1
    if issues == 0:
        print("  ✅ All consistent")
    else:
        print(f"  ⚠️ {issues} issues found")


if __name__ == '__main__':
    main()
