#!/usr/bin/env python3
"""
iwor独自テーマ分類体系を4グループ階層コードに再構築

旧: 01-22 (数字のみ、QBと類似)
新: A1-A10, B1-B6, C1-C3, D1-D3 (4グループ階層、iwor独自順序)
"""

import json

INPUT = "/Users/tasuku/Desktop/iwor/docs/source-data/iwor-theme-taxonomy.json"
OUTPUT = "/Users/tasuku/Desktop/iwor/docs/source-data/iwor-theme-taxonomy.json"

# iwor独自の4グループ階層 + 科目順序
# グループ内の科目順序がQBと異なる（iwor独自）
GROUPS = {
    "A": {
        "name": "内科系",
        "categories": [
            # iwor順: 循環器→消化管→肝胆膵→呼吸器→腎臓泌尿器→内分泌代謝→血液→神経→感染症→免疫膠原病
            ("A1",  "循環器",               "03"),
            ("A2",  "消化管",               "01"),
            ("A3",  "肝胆膵",               "02"),
            ("A4",  "呼吸器・乳腺",          "04"),
            ("A5",  "腎臓・泌尿器",          "05"),
            ("A6",  "内分泌・代謝",          "06"),
            ("A7",  "血液",                 "07"),
            ("A8",  "神経",                 "10"),
            ("A9",  "感染症",               "09"),
            ("A10", "免疫・膠原病・アレルギー", "08"),
        ],
    },
    "B": {
        "name": "外科系・専門科",
        "categories": [
            ("B1", "整形外科・リハビリ", "15"),
            ("B2", "皮膚科",           "18"),
            ("B3", "精神科",           "11"),
            ("B4", "眼科",            "16"),
            ("B5", "耳鼻咽喉科",       "17"),
            ("B6", "放射線科",         "21"),
        ],
    },
    "C": {
        "name": "周産期・小児",
        "categories": [
            ("C1", "産科",    "13"),
            ("C2", "婦人科",  "14"),
            ("C3", "小児科",  "12"),
        ],
    },
    "D": {
        "name": "横断領域",
        "categories": [
            ("D1", "救急・中毒",           "19"),
            ("D2", "公衆衛生・社会医学",     "22"),
            ("D3", "麻酔・周術期・医学総論",  "20"),
        ],
    },
}


def main():
    with open(INPUT, 'r', encoding='utf-8') as f:
        old_data = json.load(f)

    old_cats = old_data['categories']

    # 旧コード→新コードのマッピング表を作成
    old_to_new = {}  # "03" -> "A1"

    new_taxonomy = {
        "version": "2.0",
        "created": "2026-03-31",
        "description": "iwor Study テーマ分類体系（4グループ階層）",
        "groups": {},
        "categories": {},
        "code_mapping": {},  # 旧コード→新コードの対応表
    }

    # グループ情報
    for gid, ginfo in GROUPS.items():
        new_taxonomy["groups"][gid] = {"name": ginfo["name"]}

    total_subs = 0
    total_topics = 0

    for gid, ginfo in GROUPS.items():
        for new_code, new_name, old_code in ginfo["categories"]:
            old_to_new[old_code] = new_code

            if old_code not in old_cats:
                print(f"  WARNING: old code {old_code} not found")
                continue

            old_cat = old_cats[old_code]

            # サブカテゴリのコードをリナンバー
            new_subs = {}
            old_subs_sorted = sorted(old_cat['subcategories'].items())

            for idx, (old_sub_code, sub_data) in enumerate(old_subs_sorted, 1):
                new_sub_code = f"{new_code}-{idx:02d}"
                new_subs[new_sub_code] = {
                    "name": sub_data["name"],
                    "topics": sub_data["topics"],
                }
                total_subs += 1
                total_topics += len(sub_data["topics"])

            new_taxonomy["categories"][new_code] = {
                "name": new_name,
                "group": gid,
                "subcategories": new_subs,
            }

            new_taxonomy["code_mapping"][old_code] = new_code

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(new_taxonomy, f, ensure_ascii=False, indent=2)

    # 検証
    print("=== Rebuild complete ===")
    print(f"  Groups: {len(new_taxonomy['groups'])}")
    print(f"  Categories: {len(new_taxonomy['categories'])}")
    print(f"  Subcategories: {total_subs}")
    print(f"  Topics: {total_topics}")

    print(f"\n=== New structure ===")
    for gid, ginfo in GROUPS.items():
        print(f"\n  {gid} {ginfo['name']}")
        for new_code, new_name, old_code in ginfo["categories"]:
            cat = new_taxonomy["categories"].get(new_code, {})
            nsubs = len(cat.get("subcategories", {}))
            ntopics = sum(len(s["topics"]) for s in cat.get("subcategories", {}).values())
            print(f"    {new_code} {new_name:25s} {nsubs:3d} subs {ntopics:4d} topics  (旧{old_code})")

    print(f"\n=== Code mapping (for 119A update) ===")
    for old, new in sorted(new_taxonomy["code_mapping"].items()):
        print(f"  {old} → {new}")


if __name__ == '__main__':
    main()
