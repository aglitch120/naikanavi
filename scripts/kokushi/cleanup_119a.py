#!/usr/bin/env python3
"""
119A 抽出データのクリーンアップ + メタデータ付与
"""

import json
import re

INPUT = "/Users/tasuku/Desktop/iwor/data/questions/119/119A.json"
OUTPUT = "/Users/tasuku/Desktop/iwor/data/questions/119/119A.json"

# medu4参照メタデータ（形式・科目は公知情報として参考利用。正答率は使用しない）
# 科目番号をiwor分類コードにマッピング
MEDU4_FIELD_TO_IWOR = {
    "01.腎": "05",           # 腎臓・泌尿器
    "02.内分泌代謝": "06",    # 内分泌・代謝
    "03.血液": "07",         # 血液
    "04.免疫": "08",         # 免疫・膠原病・アレルギー
    "05.感染症": "09",       # 感染症
    "06.呼吸器": "04",       # 呼吸器・乳腺
    "07.循環器": "03",       # 循環器
    "08.消化管": "01",       # 消化管
    "09.肝胆膵": "02",       # 肝胆膵
    "10.神経": "10",         # 神経
    "11.産婦人科": "14",      # 婦人科（産科はQ→13）
    "12.小児科": "12",       # 小児科
    "13.加齢老年学": "20",    # 麻酔・周術期・医学総論
    "14.整形外科": "15",      # 整形外科・リハビリ
    "15.眼科": "16",         # 眼科
    "16.耳鼻咽喉科": "17",   # 耳鼻咽喉科
    "17.泌尿器科": "05",     # 腎臓・泌尿器
    "18.精神科": "11",       # 精神科
    "19.皮膚科": "18",       # 皮膚科
    "21.救急": "19",         # 救急・中毒
    "22.中毒": "19",         # 救急・中毒
    "24.公衆衛生": "22",     # 公衆衛生・社会医学
    "25.総論的事項": "20",    # 麻酔・周術期・医学総論
    "26.必修的事項": "20",    # 麻酔・周術期・医学総論
}

# medu4メタデータ（119A1-A75）形式とテーマ
META = {
    1:  {"type1": "一般", "type2": "各論", "field_ref": "09.肝胆膵", "theme": "自己免疫性膵炎"},
    2:  {"type1": "一般", "type2": "各論", "field_ref": "14.整形外科", "theme": "頸肩腕障害"},
    3:  {"type1": "一般", "type2": "各論", "field_ref": "10.神経", "theme": "高血圧性脳出血"},
    4:  {"type1": "一般", "type2": "各論", "field_ref": "19.皮膚科", "theme": "皮膚科疾患と好発部位"},
    5:  {"type1": "一般", "type2": "各論", "field_ref": "07.循環器", "theme": "家庭血圧測定"},
    6:  {"type1": "一般", "type2": "各論", "field_ref": "18.精神科", "theme": "むずむず脚症候群"},
    7:  {"type1": "一般", "type2": "各論", "field_ref": "08.消化管", "theme": "潰瘍性大腸炎"},
    8:  {"type1": "一般", "type2": "各論", "field_ref": "17.泌尿器科", "theme": "尿路結石症の予防"},
    9:  {"type1": "一般", "type2": "各論", "field_ref": "14.整形外科", "theme": "肩関節脱臼"},
    10: {"type1": "一般", "type2": "各論", "field_ref": "01.腎", "theme": "利尿薬と尿細管作用部位"},
    11: {"type1": "一般", "type2": "各論", "field_ref": "11.産婦人科", "theme": "異所性妊娠"},
    12: {"type1": "一般", "type2": "各論", "field_ref": "02.内分泌代謝", "theme": "糖尿病の診断基準"},
    13: {"type1": "一般", "type2": "各論", "field_ref": "07.循環器", "theme": "Brugada症候群"},
    14: {"type1": "一般", "type2": "各論", "field_ref": "24.公衆衛生", "theme": "65歳以上の定期接種ワクチン"},
    15: {"type1": "臨床", "type2": "各論", "field_ref": "10.神経", "theme": "下垂体腺腫"},
    16: {"type1": "臨床", "type2": "各論", "field_ref": "02.内分泌代謝", "theme": "Wilson病"},
    17: {"type1": "臨床", "type2": "各論", "field_ref": "11.産婦人科", "theme": "卵巣腫瘍"},
    18: {"type1": "臨床", "type2": "各論", "field_ref": "16.耳鼻咽喉科", "theme": "上咽頭癌"},
    19: {"type1": "臨床", "type2": "各論", "field_ref": "05.感染症", "theme": "結核の対応"},
    20: {"type1": "臨床", "type2": "各論", "field_ref": "19.皮膚科", "theme": "固定薬疹"},
    21: {"type1": "臨床", "type2": "各論", "field_ref": "01.腎", "theme": "IgA腎症"},
    22: {"type1": "臨床", "type2": "各論", "field_ref": "04.免疫", "theme": "全身性強皮症"},
    23: {"type1": "臨床", "type2": "各論", "field_ref": "19.皮膚科", "theme": "結節性硬化症"},
    24: {"type1": "臨床", "type2": "各論", "field_ref": "19.皮膚科", "theme": "アトピー性皮膚炎"},
    25: {"type1": "臨床", "type2": "各論", "field_ref": "12.小児科", "theme": "新生児髄膜炎"},
    26: {"type1": "臨床", "type2": "各論", "field_ref": "09.肝胆膵", "theme": "急性膵炎"},
    27: {"type1": "臨床", "type2": "各論", "field_ref": "02.内分泌代謝", "theme": "Wernicke脳症"},
    28: {"type1": "臨床", "type2": "各論", "field_ref": "05.感染症", "theme": "インフルエンザ後肺炎"},
    29: {"type1": "臨床", "type2": "各論", "field_ref": "12.小児科", "theme": "未熟児無呼吸発作"},
    30: {"type1": "臨床", "type2": "各論", "field_ref": "02.内分泌代謝", "theme": "低血糖症"},
    31: {"type1": "臨床", "type2": "各論", "field_ref": "07.循環器", "theme": "心筋梗塞"},
    32: {"type1": "臨床", "type2": "各論", "field_ref": "09.肝胆膵", "theme": "リンパ腫の検査"},
    33: {"type1": "臨床", "type2": "各論", "field_ref": "08.消化管", "theme": "大腸癌"},
    34: {"type1": "臨床", "type2": "各論", "field_ref": "05.感染症", "theme": "肺アスペルギルス症"},
    35: {"type1": "臨床", "type2": "各論", "field_ref": "07.循環器", "theme": "僧帽弁狭窄症"},
    36: {"type1": "臨床", "type2": "各論", "field_ref": "12.小児科", "theme": "クレチン症"},
    37: {"type1": "臨床", "type2": "各論", "field_ref": "06.呼吸器", "theme": "小細胞肺癌"},
    38: {"type1": "臨床", "type2": "各論", "field_ref": "08.消化管", "theme": "食道静脈瘤"},
    39: {"type1": "臨床", "type2": "各論", "field_ref": "14.整形外科", "theme": "de Quervain病"},
    40: {"type1": "臨床", "type2": "各論", "field_ref": "25.総論的事項", "theme": "輸液の組成"},
    41: {"type1": "臨床", "type2": "各論", "field_ref": "08.消化管", "theme": "機能性ディスペプシア"},
    42: {"type1": "臨床", "type2": "各論", "field_ref": "17.泌尿器科", "theme": "淋菌感染症"},
    43: {"type1": "臨床", "type2": "各論", "field_ref": "14.整形外科", "theme": "化膿性股関節炎"},
    44: {"type1": "臨床", "type2": "各論", "field_ref": "07.循環器", "theme": "心不全"},
    45: {"type1": "臨床", "type2": "各論", "field_ref": "18.精神科", "theme": "双極性障害"},
    46: {"type1": "臨床", "type2": "各論", "field_ref": "10.神経", "theme": "Fisher症候群"},
    47: {"type1": "臨床", "type2": "各論", "field_ref": "03.血液", "theme": "骨髄異形成症候群"},
    48: {"type1": "臨床", "type2": "各論", "field_ref": "06.呼吸器", "theme": "肺癌術後の皮下気腫"},
    49: {"type1": "臨床", "type2": "各論", "field_ref": "11.産婦人科", "theme": "双胎間輸血症候群"},
    50: {"type1": "臨床", "type2": "各論", "field_ref": "10.神経", "theme": "MSA-C（オリーブ橋小脳萎縮症）"},
    51: {"type1": "臨床", "type2": "各論", "field_ref": "03.血液", "theme": "遺伝性球状赤血球症"},
    52: {"type1": "臨床", "type2": "各論", "field_ref": "17.泌尿器科", "theme": "腎梗塞"},
    53: {"type1": "臨床", "type2": "各論", "field_ref": "01.腎", "theme": "急性間質性腎炎"},
    54: {"type1": "臨床", "type2": "各論", "field_ref": "02.内分泌代謝", "theme": "原発性副甲状腺機能亢進症"},
    55: {"type1": "臨床", "type2": "各論", "field_ref": "11.産婦人科", "theme": "子宮頸癌"},
    56: {"type1": "臨床", "type2": "各論", "field_ref": "03.血液", "theme": "血栓性血小板減少性紫斑病"},
    57: {"type1": "臨床", "type2": "各論", "field_ref": "07.循環器", "theme": "冠攣縮性狭心症"},
    58: {"type1": "臨床", "type2": "各論", "field_ref": "09.肝胆膵", "theme": "慢性膵炎"},
    59: {"type1": "臨床", "type2": "各論", "field_ref": "09.肝胆膵", "theme": "胆嚢癌"},
    60: {"type1": "臨床", "type2": "各論", "field_ref": "14.整形外科", "theme": "骨腫瘍"},
    61: {"type1": "臨床", "type2": "各論", "field_ref": "05.感染症", "theme": "Kaposi水痘様発疹症"},
    62: {"type1": "臨床", "type2": "各論", "field_ref": "06.呼吸器", "theme": "肺癌"},
    63: {"type1": "臨床", "type2": "各論", "field_ref": "19.皮膚科", "theme": "乾癬"},
    64: {"type1": "臨床", "type2": "各論", "field_ref": "07.循環器", "theme": "閉塞性動脈硬化症"},
    65: {"type1": "臨床", "type2": "各論", "field_ref": "12.小児科", "theme": "クループ症候群"},
    66: {"type1": "臨床", "type2": "各論", "field_ref": "11.産婦人科", "theme": "常位胎盤早期剥離"},
    67: {"type1": "臨床", "type2": "各論", "field_ref": "12.小児科", "theme": "腸重積症"},
    68: {"type1": "臨床", "type2": "各論", "field_ref": "18.精神科", "theme": "自閉スペクトラム症"},
    69: {"type1": "臨床", "type2": "各論", "field_ref": "10.神経", "theme": "重症筋無力症"},
    70: {"type1": "臨床", "type2": "各論", "field_ref": "06.呼吸器", "theme": "慢性血栓閉塞性肺高血圧症"},
    71: {"type1": "臨床", "type2": "各論", "field_ref": "05.感染症", "theme": "帯状疱疹"},
    72: {"type1": "臨床", "type2": "各論", "field_ref": "06.呼吸器", "theme": "COPD"},
    73: {"type1": "臨床", "type2": "各論", "field_ref": "15.眼科", "theme": "網膜色素変性症"},
    74: {"type1": "臨床", "type2": "各論", "field_ref": "07.循環器", "theme": "心不全の血行動態"},
    75: {"type1": "臨床", "type2": "各論", "field_ref": "25.総論的事項", "theme": "水分出納バランス"},
}


def clean_stem(stem, num):
    """stemから問題番号の残り・ページ番号等を除去"""
    # 先頭の問題番号を除去: "1 自己免疫性..." → "自己免疫性..."
    stem = re.sub(rf'^{num}\s+', '', stem)
    # stemの途中にある孤立したページ番号を除去（行頭に数字1-2桁のみ）
    stem = re.sub(r'\n\d{1,2}\n', '\n', stem)
    # 末尾のページ番号
    stem = re.sub(r'\n\d{1,2}$', '', stem)
    # 先頭のページ番号
    stem = re.sub(r'^\d{1,2}\n', '', stem)
    # 連続改行を1つに
    stem = re.sub(r'\n{2,}', '\n', stem)
    return stem.strip()


def main():
    with open(INPUT, 'r', encoding='utf-8') as f:
        data = json.load(f)

    questions = data['questions']
    issues = []

    for q in questions:
        num = q['num']

        # 1. stem クリーンアップ
        q['stem'] = clean_stem(q['stem'], num)

        # 2. メタデータ付与
        if num in META:
            m = META[num]
            q['format']['type1'] = m['type1']
            q['format']['type2'] = m['type2']
            q['field'] = MEDU4_FIELD_TO_IWOR.get(m['field_ref'], None)
            q['disease'] = [m['theme']]
        else:
            issues.append(f"No metadata for {q['id']}")

        # 3. 選択肢不足の問題にフラグ
        if len(q['choices']) < 2:
            q['_needs_manual_review'] = True
            issues.append(f"{q['id']}: choices={len(q['choices'])} — needs manual fix")

    data['questions'] = questions

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"=== Cleanup complete ===")
    print(f"  Total: {len(questions)}")
    print(f"  With metadata: {sum(1 for q in questions if q['format']['type1'])}")
    print(f"  With field: {sum(1 for q in questions if q['field'])}")
    print(f"  Needs manual review: {sum(1 for q in questions if q.get('_needs_manual_review'))}")

    if issues:
        print(f"\n=== Issues ({len(issues)}) ===")
        for i in issues:
            print(f"  {i}")

    # サンプル表示
    print(f"\n=== Sample (A1, A15, A75) ===")
    for num in [1, 15, 75]:
        q = next(qx for qx in questions if qx['num'] == num)
        print(f"\n  [{q['id']}]")
        print(f"    field={q['field']} disease={q['disease']}")
        print(f"    format={q['format']}")
        print(f"    stem: {q['stem'][:80]}...")
        print(f"    answer: {q['answer']}")


if __name__ == '__main__':
    main()
