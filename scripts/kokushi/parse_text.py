#!/usr/bin/env python3
"""
手打ちテキスト → 公開JSON + ローカル解説リファレンス

使い方:
  python3 scripts/kokushi/parse_text.py /path/to/118A.txt
  python3 scripts/kokushi/parse_text.py /path/to/118A.txt --dry-run

出力:
  data/questions/{year}/{year}{block}.json  — 公開用（stem/choices/answer/format）
  data/.local/explanations/{year}{block}.json — ローカル専用（解説リファレンス）

公開JSONには解説・正答率を絶対に含めない。
"""

import json
import re
import sys
import argparse
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
BLOCK_SIZES = {"A": 75, "B": 50, "C": 75, "D": 75, "E": 50, "F": 75, "G": 75, "H": 50, "I": 75}

# UI要素のスキップリスト
SKIP_LINES = {
    'マーク', '無印', 'Previous', 'Next', '詳細を隠す', '詳細を表示',
    'ログアウト', '0', '',
    'All Right Reserved.',
}


def parse_text_file(filepath):
    """手打ちテキストをパースして(公開データ, 解説データ)のリストを返す"""
    text = Path(filepath).read_text(encoding='utf-8')

    # 問題IDで分割
    pattern = re.compile(r'^(\d{3}[A-F]\d{1,2})\s*$', re.MULTILINE)
    splits = list(pattern.finditer(text))

    public_questions = []
    local_explanations = []
    seen_ids = set()

    for i, m in enumerate(splits):
        qid = m.group(1)

        # 重複ID除去（手打ち時の重複対策、最初の出現を採用）
        if qid in seen_ids:
            continue
        seen_ids.add(qid)

        start = m.end()
        # 次の問題の開始位置を探す（重複含む全splitから）
        end = len(text)
        for j in range(i + 1, len(splits)):
            if splits[j].group(1) != qid:  # 同じIDの重複はスキップ
                end = splits[j].start()
                break

        block_text = text[start:end].strip()

        pub, expl = parse_single(qid, block_text)
        if pub:
            public_questions.append(pub)
        if expl:
            local_explanations.append(expl)

    return public_questions, local_explanations


def should_skip(line):
    """UIゴミ行かどうか"""
    s = line.strip()
    if s in SKIP_LINES:
        return True
    if 'ようこそ' in s:
        return True
    if 'ミッション' in s and '利用規約' in s:
        return True
    if s.startswith('©') or 'All Right' in s:
        return True
    return False


def parse_single(qid, block_text):
    """1問分をパースして(公開データdict, 解説dict)を返す"""
    lines = block_text.split('\n')

    stem_lines = []
    choices = {}
    answer = None
    theme = None
    subject = None
    accuracy = None
    expl_summary_lines = []
    choice_expls = {}

    phase = "stem"
    cur_choice_key = None

    for line in lines:
        s = line.strip()
        if should_skip(s):
            continue

        # 正解行 → 以降は解説セクション
        if s.startswith('正解：') or s.startswith('正解:'):
            phase = "meta"
            raw = s.split('：')[-1].split(':')[-1].strip().lower()
            letters = [c for c in raw.replace(',', '').replace('、', '').replace(' ', '')
                       if c in 'abcdefghij']
            answer = letters[0] if len(letters) == 1 else (letters if letters else None)
            continue

        if s.startswith('正答率：') or s.startswith('正答率:'):
            raw_rate = re.search(r'(\d+)', s)
            accuracy = int(raw_rate.group(1)) if raw_rate else None
            continue

        if s.startswith('科目名：') or s.startswith('科目名:'):
            subject = s.split('：')[-1].split(':')[-1].strip()
            continue

        if s.startswith('テーマ：') or s.startswith('テーマ:'):
            theme = s.split('：')[-1].split(':')[-1].strip()
            phase = "explanation"
            continue

        if phase == "stem":
            # 選択肢: "a テキスト"
            cm = re.match(r'^([a-j])\s+(.+)', s)
            if cm:
                choices[cm.group(1)] = cm.group(2).strip()
                continue
            stem_lines.append(s)

        elif phase == "meta":
            # テーマ行がまだ来ていない場合のメタデータ行
            pass

        elif phase == "explanation":
            # 選択肢解説: "  a テキスト" (インデント付き)
            em = re.match(r'^\s+([a-j])\s+(.+)', s)
            if em:
                cur_choice_key = em.group(1)
                choice_expls[cur_choice_key] = em.group(2).strip()
                continue

            # 解説の続き行
            if cur_choice_key and s and not re.match(r'^\s+[a-j]\s', s):
                choice_expls[cur_choice_key] = choice_expls.get(cur_choice_key, '') + '\n' + s
                continue

            if s:
                expl_summary_lines.append(s)
                cur_choice_key = None

    # Parse qid
    m = re.match(r'(\d{3})([A-F])(\d+)', qid)
    if not m:
        return None, None

    year = int(m.group(1))
    block = m.group(2)
    num = int(m.group(3))
    stem = '\n'.join(stem_lines).strip()
    num_answers = len(answer) if isinstance(answer, list) else (1 if answer else 0)

    # 画像参照の検出
    has_image = '別冊' in stem or '写真' in stem or '画像' in stem

    # 計算問題の検出
    is_calculation = '求めよ' in stem or '算出せよ' in stem

    # --- 公開データ（解説なし） ---
    pub = {
        'num': num,
        'id': qid,
        'exam_year': year,
        'block': block,
        'stem': stem,
        'choices': choices,
        'answer': answer,
        'format': {
            'type1': None,
            'type2': None,
            'num_answers': num_answers,
            'has_image': has_image,
            'is_calculation': is_calculation,
            'has_kinki': False,
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

    # --- ローカル解説リファレンス ---
    expl = {
        'id': qid,
        'theme': theme,
        'subject': subject,
        'accuracy': accuracy,
        'explanation_summary': '\n'.join(expl_summary_lines).strip() or None,
        'choice_explanations': choice_expls if choice_expls else None,
    }

    return pub, expl


def main():
    parser = argparse.ArgumentParser(description='手打ちテキスト → JSON変換')
    parser.add_argument('input', help='テキストファイルパス')
    parser.add_argument('--dry-run', action='store_true')
    args = parser.parse_args()

    pub_qs, expl_qs = parse_text_file(args.input)

    if not pub_qs:
        print("パース結果0問。ファイル形式を確認してください。")
        sys.exit(1)

    # Determine year/block from first question
    first = pub_qs[0]
    year = first['exam_year']
    block = first['block']
    expected = BLOCK_SIZES.get(block, 75)

    print(f"=== {year}回 {block}ブロック ===")
    print(f"  パース: {len(pub_qs)}問 (期待: {expected})")

    # Validation
    issues = 0
    for q in pub_qs:
        if not q['stem'] or len(q['stem']) < 5:
            print(f"  ⚠️ {q['id']}: stem短い")
            issues += 1
        if not q['choices'] and not q['format']['is_calculation']:
            print(f"  ⚠️ {q['id']}: 選択肢なし")
            issues += 1
        if not q['answer']:
            print(f"  ⚠️ {q['id']}: 正解なし")
            issues += 1

    if issues:
        print(f"  ⚠️ {issues}件の問題あり")
    else:
        print(f"  ✅ 全問OK")

    # Sample
    for q in pub_qs[:2]:
        print(f"\n  [{q['id']}] answer={q['answer']}")
        print(f"  stem: {q['stem'][:60]}")
        print(f"  choices: {len(q['choices'])}個")

    if args.dry_run:
        print(f"\n[dry-run] 書き込みスキップ")
        return

    # --- 公開JSON保存 ---
    pub_dir = REPO / f"data/questions/{year}"
    pub_dir.mkdir(parents=True, exist_ok=True)
    pub_path = pub_dir / f"{year}{block}.json"

    output = {
        'exam_year': year,
        'block': block,
        'total_questions': len(pub_qs),
        'source': f'厚生労働省 第{year}回医師国家試験',
        'questions': pub_qs,
    }

    with open(pub_path, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\n✅ 公開JSON: {pub_path}")

    # --- ローカル解説保存 ---
    local_dir = REPO / "data/.local/explanations"
    local_dir.mkdir(parents=True, exist_ok=True)
    local_path = local_dir / f"{year}{block}.json"

    with open(local_path, 'w', encoding='utf-8') as f:
        json.dump(expl_qs, f, ensure_ascii=False, indent=2)
    print(f"✅ 解説リファレンス: {local_path} (ローカル専用)")


if __name__ == '__main__':
    main()
