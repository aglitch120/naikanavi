#!/usr/bin/env python3
"""
Comprehensive validator for iwor kokushi question database.
Checks stems, choices, encoding, and structural integrity for years 112-119.
"""

import json
import re
import os
from collections import defaultdict, Counter
from pathlib import Path

BASE = Path("/Users/tasuku/Desktop/iwor/data/questions")
YEARS = range(112, 120)
BLOCKS = ["A", "B", "C", "D", "E", "F"]

issues = defaultdict(list)  # severity -> list of (id, message)
stats = {"total": 0, "files": 0, "deleted": 0, "calc": 0, "image": 0}

# Control characters (excluding \n \r \t which are normal)
CONTROL_CHARS = re.compile(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]')
# Valid endings: Japanese punctuation, English ?, ), ], brackets, or answer format markers
VALID_ENDINGS = re.compile(r'[。？！）\)」』】〉〕\]?]$')
# Calculation answer format ending
CALC_ENDING = re.compile(r'(mL|mg|kg|mEq|kcal|mmol|cm|%|点|個|日|歳|回|本|分|秒|時間|単位)/?[^。]*$')
# Short "connected question" stems
CONNECTED_STEM_PATTERN = re.compile(r'^(診断|治療|検査|原因|病態|合併症|予後|所見|病変部位|疾患|次に行う|まず行う|行うべき)')
# Number prefix matching question number
NUM_PREFIX = re.compile(r'^(\d{1,3})[\s　\u3000]')
# Fullwidth choice letters in stem
FULLWIDTH_CHOICE_LINE = re.compile(r'^[ａｂｃｄｅ][\s　．.、]')
# Choices embedded as newline-separated items in stem (5+ items after question mark)
EMBEDDED_CHOICES = re.compile(r'[。？\?]\n[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+\n[^\n]+$')


def check_encoding(text, qid, field_name):
    """Check for control characters and mojibake."""
    if not text:
        return
    matches = list(CONTROL_CHARS.finditer(text))
    if matches:
        chars_found = set()
        for m in matches:
            char = m.group()
            if ord(char) not in chars_found:
                chars_found.add(ord(char))
                pos = m.start()
                ctx = text[max(0, pos-15):pos+15].replace('\n', '\\n')
                issues["critical"].append((
                    qid,
                    f"Control char U+{ord(char):04X} in {field_name}: '...{ctx}...'"
                ))
    if '\ufffd' in text:
        issues["critical"].append((qid, f"Replacement char U+FFFD in {field_name}"))


def check_stem(q):
    """Validate question stem."""
    qid = q["id"]
    stem = q.get("stem", "")
    fmt = q.get("format", {})
    is_deleted = fmt.get("is_deleted", False)
    is_calc = fmt.get("is_calculation", False)

    if not stem or not stem.strip():
        if not is_deleted:
            issues["critical"].append((qid, "Empty stem"))
        return

    # 1. Number prefix matching question number
    m = NUM_PREFIX.match(stem)
    if m and int(m.group(1)) == q.get("num", -1):
        issues["warning"].append((qid, f"Stem starts with question number '{m.group(0).strip()}'"))

    # 2. Stem truncation
    stripped = stem.rstrip()
    last_line = stripped.split('\n')[-1].strip()
    if not is_deleted:
        if not VALID_ENDINGS.search(stripped):
            # Exclude: calculation answer format, table data, English questions ending with ?
            if stripped.endswith('?'):
                pass  # English question — OK
            elif is_calc and (CALC_ENDING.search(stripped) or re.search(r'①|②|解答', stripped)):
                pass  # Calculation answer format — OK
            elif re.search(r'\d\s*\u3000\s*\d', last_line):
                pass  # Table data — OK
            else:
                last20 = stripped[-30:].replace('\n', '\\n')
                issues["warning"].append((qid, f"Stem may be truncated: '...{last20}'"))

    # 3. Choices embedded in stem (newline-separated list after the question)
    if EMBEDDED_CHOICES.search(stem):
        # Check if actual choices dict is empty — if so, this is a structural issue
        choices = q.get("choices", {})
        if not choices or len(choices) == 0:
            issues["critical"].append((qid, "Choices appear embedded in stem (no separate choices dict)"))
        else:
            issues["warning"].append((qid, "Stem may contain embedded choice-like lines after question"))

    # 4. Fullwidth choice letters in stem lines
    for line in stem.split('\n'):
        if FULLWIDTH_CHOICE_LINE.match(line.strip()):
            issues["critical"].append((qid, f"Stem has fullwidth choice letter line: '{line.strip()[:40]}'"))
            break

    # 5. Connected question (very short stem)
    if len(stem) < 30 and not is_deleted:
        if CONNECTED_STEM_PATTERN.search(stem):
            issues["info"].append((qid, f"Short stem ({len(stem)}ch, likely renmon): '{stem.strip()}'"))

    # 6. Very long stem
    if len(stem) > 3000:
        issues["info"].append((qid, f"Very long stem ({len(stem)} chars)"))

    check_encoding(stem, qid, "stem")


def check_choices(q):
    """Validate choices."""
    qid = q["id"]
    choices = q.get("choices", {})
    fmt = q.get("format", {})
    is_deleted = fmt.get("is_deleted", False)
    is_calc = fmt.get("is_calculation", False)
    has_image = fmt.get("has_image", False)

    if is_deleted:
        return

    expected_keys = {"a", "b", "c", "d", "e"}
    actual_keys = set(choices.keys())

    # 1. Missing choices entirely
    if len(choices) == 0:
        issues["critical"].append((qid, "No choices at all"))
        return

    # 2. Key mismatch
    if actual_keys != expected_keys:
        missing = sorted(expected_keys - actual_keys)
        extra = sorted(actual_keys - expected_keys)
        parts = []
        if missing:
            parts.append(f"missing {missing}")
        if extra:
            parts.append(f"extra {extra}")
        issues["critical"].append((qid, f"Choice keys: {', '.join(parts)} (has {sorted(actual_keys)})"))

    # 3. Individual choice checks
    choice_texts = []
    circled_count = 0
    for key in sorted(choices.keys()):
        text = choices[key]
        if text is None:
            issues["critical"].append((qid, f"Choice '{key}' is null"))
            continue

        t = text.strip()

        # Circled numbers (image-reference choices)
        if t in ('①', '②', '③', '④', '⑤'):
            circled_count += 1

        # Very short (but not circled numbers, not single letters for matching)
        if len(t) < 2 and t not in ('①', '②', '③', '④', '⑤') and not is_calc:
            issues["warning"].append((qid, f"Choice '{key}' very short: '{t}'"))

        check_encoding(text, qid, f"choice_{key}")
        choice_texts.append((key, t))

    # Flag circled-number choices without has_image
    if circled_count >= 3 and not has_image:
        issues["warning"].append((qid, f"Has {circled_count} circled-number choices but has_image=False"))

    # 4. Duplicate choices
    seen = {}
    for key, text in choice_texts:
        if text in seen and len(text) > 0:
            issues["critical"].append((qid, f"Duplicate: '{seen[text]}' and '{key}' = '{text[:50]}'"))
        else:
            seen[text] = key

    # 5. Answer references valid choice
    answer = q.get("answer", "")
    if answer:
        if isinstance(answer, list):
            ans_keys = answer
        elif isinstance(answer, str):
            ans_keys = list(answer)
        else:
            ans_keys = []
        for ak in ans_keys:
            if isinstance(ak, str) and ak not in choices and ak.strip():
                issues["critical"].append((qid, f"Answer '{ak}' not in choices"))


def check_format(q):
    """Validate format metadata."""
    qid = q["id"]
    fmt = q.get("format", {})

    required = {"type1", "type2", "num_answers", "has_image", "is_calculation", "has_kinki", "is_deleted"}
    missing = required - set(fmt.keys())
    if missing:
        issues["warning"].append((qid, f"Format missing: {sorted(missing)}"))

    t1 = fmt.get("type1", "")
    if t1 and t1 not in ("一般", "臨床", "長文"):
        issues["warning"].append((qid, f"Unexpected type1: '{t1}'"))

    t2 = fmt.get("type2", "")
    if t2 and t2 not in ("必修", "総論", "各論"):
        issues["warning"].append((qid, f"Unexpected type2: '{t2}'"))

    na = fmt.get("num_answers")
    if na is not None and na not in (1, 2, 3):
        issues["warning"].append((qid, f"Unusual num_answers: {na}"))


def validate_file(filepath):
    """Validate a single JSON file."""
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except (json.JSONDecodeError, Exception) as e:
        issues["critical"].append((str(filepath), f"File error: {e}"))
        return

    stats["files"] += 1
    questions = data.get("questions", [])
    declared = data.get("total_questions", 0)
    block_id = f"{data.get('exam_year', '?')}{data.get('block', '?')}"

    if len(questions) != declared:
        issues["warning"].append((block_id, f"total_questions={declared} but actual={len(questions)}"))

    for q in questions:
        stats["total"] += 1
        fmt = q.get("format", {})
        if fmt.get("is_deleted"):
            stats["deleted"] += 1
        if fmt.get("is_calculation"):
            stats["calc"] += 1
        if fmt.get("has_image"):
            stats["image"] += 1

        check_stem(q)
        check_choices(q)
        check_format(q)


def main():
    print("=" * 80)
    print("iwor Kokushi DB Validator — Years 112-119")
    print("=" * 80)

    for year in YEARS:
        for block in BLOCKS:
            fp = BASE / str(year) / f"{year}{block}.json"
            if fp.exists():
                validate_file(fp)
            else:
                issues["critical"].append((f"{year}{block}", f"File not found"))

    print(f"\nScanned: {stats['files']} files, {stats['total']} questions")
    print(f"  deleted={stats['deleted']}, calculation={stats['calc']}, has_image={stats['image']}")

    grand_total = 0
    for severity in ["critical", "warning", "info"]:
        items = issues[severity]
        grand_total += len(items)
        if not items:
            print(f"\n[{severity.upper()}] — 0 issues")
            continue

        print(f"\n{'='*70}")
        print(f"[{severity.upper()}] — {len(items)} issues")
        print(f"{'='*70}")

        # Group by year
        by_year = defaultdict(list)
        for qid, msg in items:
            m = re.match(r'(\d{3})', str(qid))
            yr = m.group(1) if m else "???"
            by_year[yr].append((qid, msg))

        for yr in sorted(by_year.keys()):
            print(f"\n  --- Year {yr} ({len(by_year[yr])} issues) ---")
            for qid, msg in by_year[yr]:
                print(f"  [{qid}] {msg}")

    # Summary table by year
    print(f"\n{'='*70}")
    print("ISSUE COUNT BY YEAR")
    print(f"{'='*70}")
    for severity in ["critical", "warning", "info"]:
        year_counts = Counter()
        for qid, msg in issues[severity]:
            m = re.match(r'(\d{3})', str(qid))
            yr = m.group(1) if m else "???"
            year_counts[yr] += 1
        print(f"\n  [{severity.upper()}]")
        for yr in sorted(year_counts.keys()):
            print(f"    {yr}: {year_counts[yr]}")

    # Category breakdown
    print(f"\n{'='*70}")
    print("ISSUE CATEGORY BREAKDOWN")
    print(f"{'='*70}")
    for severity in ["critical", "warning", "info"]:
        cats = Counter()
        for qid, msg in issues[severity]:
            if "Control char" in msg:
                cats["Control characters"] += 1
            elif "Replacement char" in msg:
                cats["Replacement characters"] += 1
            elif "Duplicate" in msg:
                cats["Duplicate choices"] += 1
            elif "No choices" in msg:
                cats["No choices at all"] += 1
            elif "Choice keys" in msg:
                cats["Wrong choice keys"] += 1
            elif "null" in msg.lower():
                cats["Null choice"] += 1
            elif "embedded" in msg.lower():
                cats["Choices embedded in stem"] += 1
            elif "fullwidth" in msg.lower():
                cats["Fullwidth choice in stem"] += 1
            elif "Empty stem" in msg:
                cats["Empty stem"] += 1
            elif "truncated" in msg:
                cats["Stem truncation"] += 1
            elif "question number" in msg:
                cats["Stem has Q number"] += 1
            elif "very short" in msg:
                cats["Short choice text"] += 1
            elif "circled" in msg:
                cats["Circled nums, no has_image"] += 1
            elif "Answer" in msg:
                cats["Bad answer reference"] += 1
            elif "type1" in msg or "type2" in msg:
                cats["Unexpected format type"] += 1
            elif "Format missing" in msg:
                cats["Missing format keys"] += 1
            elif "total_questions" in msg:
                cats["Total count mismatch"] += 1
            elif "Short stem" in msg:
                cats["Short stem (renmon)"] += 1
            elif "Very long" in msg:
                cats["Very long stem"] += 1
            elif "File" in msg:
                cats["File not found"] += 1
            else:
                cats[msg[:40]] += 1

        if cats:
            print(f"\n  [{severity.upper()}]")
            for cat, cnt in cats.most_common():
                print(f"    {cnt:5d}  {cat}")

    crit = len(issues["critical"])
    warn = len(issues["warning"])
    info = len(issues["info"])
    print(f"\n{'='*70}")
    print(f"TOTAL: {grand_total} issues ({crit} critical, {warn} warning, {info} info)")
    print(f"{'='*70}")


if __name__ == "__main__":
    main()
