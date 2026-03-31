#!/usr/bin/env python3
"""
参考メタデータの「テーマ」→ iwor taxonomy topicへのマッチング

マッチング戦略:
1. テーマ文からキー疾患名/概念を抽出
2. taxonomy topicリストから最もマッチするものを選択
3. 科目情報でfield/subfieldを絞り込み
"""

import json
import re
import os
from pathlib import Path
from difflib import SequenceMatcher

REPO = Path(__file__).resolve().parents[2]

# ── taxonomy読み込み ──
def load_taxonomy():
    tax = json.load(open(REPO / "docs/source-data/iwor-theme-taxonomy.json"))
    topics = []  # [(topic_name, field_code, subfield_code)]
    for code, cat in tax["categories"].items():
        for scode, sub in cat.get("subcategories", {}).items():
            for t in sub.get("topics", []):
                topics.append((t, code, scode))
    return topics

# ── 科目→field マッピング ──
SUBJECT_TO_FIELDS = {
    "01.腎": ["A5"],
    "02.内分泌代謝": ["A8"],
    "03.血液": ["A7"],
    "04.免疫": ["A9"],
    "05.感染症": ["A10"],
    "06.呼吸器": ["A4"],
    "07.循環器": ["A1"],
    "08.消化管": ["A2"],
    "09.肝胆膵": ["A3"],
    "10.神経": ["A6"],
    "11.産婦人科": ["C1", "C2"],
    "12.小児科": ["C3"],
    "13.泌尿器科": ["A5"],
    "14.整形外科": ["B2"],
    "15.眼科": ["B4"],
    "16.耳鼻咽喉科": ["B5"],
    "17.皮膚科": ["B3"],
    "18.精神科": ["B6"],
    "19.放射線科": ["D2"],
    "20.麻酔科": ["D2"],
    "21.救急": ["D2"],
    "22.中毒": ["D2"],
    "23.法医学": ["D3"],
    "24.公衆衛生": ["D1"],
    "25.医学総論": ["D1", "D2"],
    "26.その他": [],
    # external_refの科目番号なしのケースにも対応
    "腎": ["A5"],
    "内分泌代謝": ["A8"],
    "血液": ["A7"],
    "免疫": ["A9"],
    "感染症": ["A10"],
    "呼吸器": ["A4"],
    "循環器": ["A1"],
    "消化管": ["A2"],
    "肝胆膵": ["A3"],
    "神経": ["A6"],
    "産婦人科": ["C1", "C2"],
    "小児科": ["C3"],
    "泌尿器科": ["A5"],
    "整形外科": ["B2"],
    "眼科": ["B4"],
    "耳鼻咽喉科": ["B5"],
    "皮膚科": ["B3"],
    "精神科": ["B6"],
    "放射線科": ["D2"],
    "麻酔科": ["D2"],
    "救急": ["D2"],
    "中毒": ["D2"],
    "法医学": ["D3"],
    "公衆衛生": ["D1"],
    "医学総論": ["D1", "D2"],
}


def normalize(text):
    """正規化: 末尾の修飾語除去"""
    t = text.strip()
    t = re.sub(r'(について|の特徴|の所見|の病態|の診断|の治療|の原因|の合併症|の検査|の症状|の誘因|の分類)$', '', t)
    t = t.strip()
    return t


def extract_key_terms(theme, stem=""):
    """テーマ文+問題文から疾患名/キーワードを抽出"""
    terms = []

    # 〈〉内の略称を抽出 — これが最も信頼性が高い
    abbrs = re.findall(r'〈([^〉]+)〉', theme)
    terms.extend(abbrs)

    # （）内の疾患名
    parens = re.findall(r'（([^）]+)）', theme)
    terms.extend(parens)
    parens2 = re.findall(r'\(([^)]+)\)', theme)
    terms.extend(parens2)

    # 「〜による」「〜に伴う」の前の疾患名
    for pat in [r'^(.+?)による', r'^(.+?)に伴う', r'^(.+?)をきたす',
                r'^(.+?)で', r'^(.+?)への']:
        m = re.match(pat, theme)
        if m and len(m.group(1)) >= 3:
            terms.append(m.group(1))

    # 「〜の〜」の前半（疾患名として）
    m = re.match(r'^(.+?)の', theme)
    if m and 3 <= len(m.group(1)) <= 20:
        terms.append(m.group(1))

    # テーマ全体（正規化済み）
    terms.append(normalize(theme))

    # 略称除去版も追加
    theme_no_abbr = re.sub(r'〈[^〉]+〉', '', theme).strip()
    theme_no_abbr = re.sub(r'（[^）]+）', '', theme_no_abbr).strip()
    if theme_no_abbr != theme:
        terms.append(normalize(theme_no_abbr))

    # stem（問題文）からも疾患名を抽出（あれば）
    if stem:
        # 「〜と診断された」「〜の診断で」パターン
        for pat in [r'(.{3,20}?)と診断', r'(.{3,20}?)の診断で']:
            ms = re.findall(pat, stem)
            terms.extend(ms)

    return [t for t in terms if t and len(t) >= 2]


def find_best_topic(theme, subject, stem, all_topics):
    """テーマ→最適topic決定→topicからfield/subfield確定"""
    if not theme:
        return None, None, None, 0.0

    key_terms = extract_key_terms(theme, stem)
    normalized_theme = normalize(theme)

    # 科目からfieldを絞り込み（ヒント用、必須ではない）
    preferred_fields = set()
    for subj_key, fields in SUBJECT_TO_FIELDS.items():
        if subject and (subj_key in subject or subject in subj_key):
            preferred_fields.update(fields)

    best_topic = None
    best_field = None
    best_subfield = None
    best_score = 0.0

    for topic_name, field_code, subfield_code in all_topics:
        score = _score_match(normalized_theme, key_terms, topic_name)

        # 科目一致でボーナス（決定要因ではなくタイブレーク用）
        if field_code in preferred_fields and score > 0.1:
            score = min(score * 1.15, 1.0)

        if score > best_score:
            best_score = score
            best_topic = topic_name
            best_field = field_code
            best_subfield = subfield_code

    return best_topic, best_field, best_subfield, best_score


def _score_match(normalized_theme, key_terms, topic_name):
    """テーマとtopicの類似度スコアを算出"""
    topic_norm = normalize(topic_name)
    # topic名から〈〉や（）を取った版も用意
    topic_clean = re.sub(r'〈[^〉]*〉', '', topic_name).strip()
    topic_clean = re.sub(r'（[^）]*）', '', topic_clean).strip()
    # topic名の略称も抽出
    topic_abbrs = re.findall(r'[〈（(]([^〉）)]+)[〉）)]', topic_name)

    score = 0.0

    # 1. 完全一致（正規化後）
    if normalized_theme == topic_norm or normalized_theme == topic_clean:
        return 1.0

    # 2. テーマ内にtopicが含まれる（例: 「糖尿病性腎症であることを示唆する所見」に「糖尿病性腎症」）
    if topic_clean in normalized_theme and len(topic_clean) >= 3:
        score = max(score, 0.5 + 0.4 * len(topic_clean) / len(normalized_theme))

    # 3. topic内にテーマが含まれる
    if normalized_theme in topic_clean and len(normalized_theme) >= 3:
        score = max(score, 0.5 + 0.3 * len(normalized_theme) / len(topic_clean))

    # 4. 抽出キーワードとtopic名のマッチ
    for term in key_terms:
        if len(term) < 2:
            continue
        # term がtopicに含まれる
        if term in topic_clean or term in topic_name:
            s = 0.5 + 0.4 * len(term) / max(len(topic_clean), len(term))
            score = max(score, min(s, 0.95))
        # topicがtermに含まれる
        if topic_clean in term and len(topic_clean) >= 3:
            s = 0.4 + 0.3 * len(topic_clean) / len(term)
            score = max(score, s)
        # 略称マッチ（3文字以上の略称のみ）
        for abbr in topic_abbrs:
            if len(abbr) < 3:
                continue  # 「症」「型」等の1文字略称は誤マッチの温床
            if abbr == term or abbr in term or term in abbr:
                score = max(score, 0.7)

    # 5. ファジーマッチ（最後の手段）
    if score < 0.4:
        ratio = SequenceMatcher(None, normalized_theme, topic_clean).ratio()
        if ratio > 0.6:
            score = max(score, ratio * 0.5)

    return score


def parse_reference_meta(filepath):
    """参考メタデータをパース"""
    text = open(filepath).read()
    lines = text.split('\n')
    results = {}
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        m = re.match(r'^(\d{3})([A-F])(\d{1,2})$', line)
        if m:
            year, block, num = int(m.group(1)), m.group(2), int(m.group(3))
            qid = f"{year}{block}{num}"
            meta = {"形式": None, "科目": None, "テーマ": None}
            i += 1
            while i < len(lines):
                l = lines[i].strip()
                if re.match(r'^\d{3}[A-F]\d{1,2}$', l):
                    break
                if l == '形式':
                    i += 1
                    if i < len(lines):
                        meta["形式"] = lines[i].strip()
                elif l == '科目':
                    i += 1
                    if i < len(lines):
                        meta["科目"] = lines[i].strip()
                elif l == 'テーマ':
                    i += 1
                    if i < len(lines):
                        meta["テーマ"] = lines[i].strip()
                i += 1
            results[qid] = meta
        else:
            i += 1
    return results


def parse_format(fmt_str):
    """「一般 x 各論」→ type1, type2"""
    if not fmt_str:
        return None, None
    parts = [p.strip() for p in fmt_str.split('x')]
    type1 = parts[0] if parts else None
    type2 = parts[1] if len(parts) > 1 else None
    return type1, type2


META_FILES = {
    109: "109メタデータ参考",
    110: "110メタデータ参考",
    111: "111メタデータ参考",
    112: "112メタデータ参考",
    113: "113メタデータ参考",
    114: "114メタデータ参考",
    115: "115メタデータ参考",
    116: "116参考メタデータ.txt",
    117: "117_メタデータ参考.txt",
    118: "118メタデータ参考.txt",
}


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('year', type=int)
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--verbose', action='store_true')
    args = parser.parse_args()

    year = args.year

    # Load taxonomy
    all_topics = load_taxonomy()
    print(f"Taxonomy: {len(all_topics)} topics loaded")

    # Load metadata
    meta_file = META_FILES.get(year)
    if not meta_file:
        print(f"No metadata file for year {year}")
        return

    meta_path = Path(f"/Users/tasuku/Downloads/医師国家試験過去問/{year}/{meta_file}")
    if not meta_path.exists():
        print(f"File not found: {meta_path}")
        return

    meta = parse_reference_meta(str(meta_path))
    print(f"Metadata: {len(meta)} questions loaded")

    # Process each block
    stats = {"high": 0, "medium": 0, "low": 0, "none": 0}
    low_confidence = []

    for block in "ABCDEF":
        json_path = REPO / f"data/questions/{year}/{year}{block}.json"
        if not json_path.exists():
            print(f"  {year}{block}: JSON not found, skipping")
            continue

        data = json.load(open(json_path))
        updated = 0

        for q in data["questions"]:
            qid = q["id"]
            m = meta.get(qid, {})
            theme = m.get("テーマ")
            subject = m.get("科目")
            fmt = m.get("形式")

            if not theme:
                stats["none"] += 1
                continue

            # type1/type2を付与（nullの場合のみ）
            if fmt and not q["format"].get("type1"):
                type1, type2 = parse_format(fmt)
                q["format"]["type1"] = type1
                q["format"]["type2"] = type2

            # topic決定 → field/subfield確定
            best_topic, best_field, best_subfield, score = find_best_topic(
                theme, subject, q.get("stem", ""), all_topics)

            if score >= 0.5:
                # 高信頼: taxonomy topicを使用
                stats["high"] += 1
                q["topic"] = best_topic
                q["field"] = best_field
                q["subfield"] = best_subfield
            elif score >= 0.3:
                # 中信頼: taxonomy topicを使用するが要注意
                stats["medium"] += 1
                q["topic"] = best_topic
                q["field"] = best_field
                q["subfield"] = best_subfield
                if args.verbose:
                    print(f"  {qid}: [中] 「{theme}」→「{best_topic}」({score:.2f})")
            else:
                # 低信頼: メタデータのテーマをそのまま使用
                # field/subfieldは科目からマッピング
                stats["low"] += 1
                q["topic"] = normalize(theme)
                # 科目→fieldの最初のものを使用
                fallback_field = None
                fallback_subfield = None
                for subj_key, fields in SUBJECT_TO_FIELDS.items():
                    if subject and (subj_key in subject or subject in subj_key):
                        if fields:
                            fallback_field = fields[0]
                            # subfieldはfieldの01（総論）をデフォルト
                            fallback_subfield = f"{fallback_field}-01"
                        break
                q["field"] = fallback_field
                q["subfield"] = fallback_subfield
                low_confidence.append((qid, theme, best_topic, f"{score:.2f}"))
                if args.verbose:
                    print(f"  {qid}: [低] 「{theme}」→ テーマそのまま使用")

            updated += 1

        if not args.dry_run:
            with open(json_path, 'w') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)

        print(f"  {year}{block}: {updated}問更新")

    print(f"\n=== 統計 ===")
    print(f"  高信頼(>=0.5): {stats['high']}")
    print(f"  中信頼(0.3-0.5): {stats['medium']}")
    print(f"  低信頼(<0.3): {stats['low']}")
    print(f"  テーマなし: {stats['none']}")

    if low_confidence:
        print(f"\n=== 低信頼マッチ (要確認) ===")
        for qid, theme, topic, score in low_confidence[:20]:
            print(f"  {qid}: 「{theme}」→「{topic}」({score})")
        if len(low_confidence) > 20:
            print(f"  ... 他{len(low_confidence)-20}問")


if __name__ == "__main__":
    main()
