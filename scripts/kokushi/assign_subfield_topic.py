#!/usr/bin/env python3
"""
assign_subfield_topic.py
119A.json / 119B.json の各問題に subfield と topic を割り当て、disease フィールドを削除する。
タクソノミーから exact topic string を取得して設定する。
"""

import json
import sys
from pathlib import Path

# ── パス ──────────────────────────────────────────────────────────────────────
REPO = Path(__file__).resolve().parents[2]
TAXONOMY_PATH = REPO / "docs/source-data/iwor-theme-taxonomy.json"
JSON_119A     = REPO / "data/questions/119/119A.json"
JSON_119B     = REPO / "data/questions/119/119B.json"


# ── タクソノミー読み込み ────────────────────────────────────────────────────────
with open(TAXONOMY_PATH, encoding="utf-8") as f:
    taxonomy = json.load(f)

def get_topics(subfield_code: str) -> list[str]:
    """指定サブフィールドのトピック一覧を返す"""
    for cat in taxonomy["categories"].values():
        for sub_code, sub in cat["subcategories"].items():
            if sub_code == subfield_code:
                return sub["topics"]
    return []

def find_topic(subfield_code: str, keyword: str) -> str:
    """
    subfield の topics リストから keyword を含む最初のトピックを返す。
    見つからなければ topics[0] を返す。
    """
    topics = get_topics(subfield_code)
    if not topics:
        raise ValueError(f"Subfield {subfield_code} not found in taxonomy")
    # 完全一致
    for t in topics:
        if t == keyword:
            return t
    # 部分一致
    for t in topics:
        if keyword in t:
            return t
    # フォールバック: 先頭
    print(f"  [WARN] '{keyword}' not found in {subfield_code}, using '{topics[0]}'", file=sys.stderr)
    return topics[0]

def exact_topic(subfield_code: str, exact: str) -> str:
    """exact が topics に含まれることを確認して返す。含まれなければ例外。"""
    topics = get_topics(subfield_code)
    if exact in topics:
        return exact
    # 部分一致で一番近いものを探す
    for t in topics:
        if exact in t or t in exact:
            print(f"  [INFO] '{exact}' -> '{t}' in {subfield_code}", file=sys.stderr)
            return t
    raise ValueError(f"'{exact}' not found in {subfield_code} topics: {topics[:5]}...")


# ── 自動マッピング: disease → (subfield, topic) ────────────────────────────────
# disease の代表文字列からサブフィールドとトピックを決定
# キーは disease リストの[0]文字列
AUTO_MAP: dict[str, tuple[str, str]] = {
    # 119A
    "自己免疫性膵炎":               ("A3-04", "自己免疫性膵炎"),
    "頸肩腕障害":                   ("D2-21", "頸肩腕症候群"),
    "潰瘍性大腸炎":                 ("A2-04", "潰瘍性大腸炎"),
    "肩関節脱臼":                   ("B1-02", "反復性肩関節脱臼"),
    "異所性妊娠":                   ("C1-02", "異所性妊娠"),
    "Brugada症候群":                ("A1-02", "Brugada症候群"),
    "下垂体腺腫":                   ("A6-02", "下垂体腺腫"),
    "Wilson病":                     ("A6-10", "Wilson病"),
    "卵巣腫瘍":                     ("C2-08", "卵巣腫瘍〈総論〉"),
    "上咽頭癌":                     ("B5-08", "上咽頭癌"),
    "IgA腎症":                      ("A5-02", "IgA腎症"),
    "全身性強皮症":                  ("A10-04", "強皮症（SSc）"),
    "むずむず脚症候群":              ("A8-10", "むずむず脚症候群"),
    "結節性硬化症":                  ("A8-11", "結節性硬化症"),
    "アトピー性皮膚炎":              ("B2-01", "アトピー性皮膚炎"),
    "急性膵炎":                     ("A3-04", "急性膵炎"),
    "Wernicke脳症":                 ("A6-13", "ビタミンB1欠乏症"),
    "未熟児無呼吸発作":             ("C3-05", "未熟児無呼吸発作"),
    "低血糖症":                     ("A6-07", "低血糖症"),
    "大腸癌":                       ("A2-04", "大腸癌〈総論〉"),
    "肺アスペルギルス症":           ("A4-03", "肺アスペルギルス症"),
    "化膿性股関節炎":               ("B1-06", "化膿性関節炎"),
    "僧帽弁狭窄症":                 ("A1-04", "僧帽弁狭窄症（MS）"),
    "クレチン症":                   ("C3-10", "クレチン症"),
    "食道静脈瘤":                   ("A2-02", "食道静脈瘤"),
    "機能性ディスペプシア":          ("A2-03", "機能性ディスペプシア"),
    "心不全":                       ("A1-01", "心不全〈総論〉"),
    "双極性障害":                   ("B3-03", "双極性障害"),
    "Fisher症候群":                 ("A8-09", "Fisher症候群"),
    "骨髄異形成症候群":             ("A7-03", "骨髄異形成症候群（MDS）"),
    "双胎間輸血症候群":             ("C1-02", "双胎間輸血症候群"),
    "遺伝性球状赤血球症":           ("A7-02", "遺伝性球状赤血球症"),
    "腎梗塞":                       ("A5-07", "腎梗塞"),
    "原発性副甲状腺機能亢進症":     ("A6-04", "原発性副甲状腺機能亢進症"),
    "子宮頸癌":                     ("C2-08", "子宮頸癌"),
    "血栓性血小板減少性紫斑病":     ("A7-04", "血栓性血小板減少性紫斑病（TTP）"),
    "冠攣縮性狭心症":               ("A1-03", "冠攣縮性狭心症"),
    "慢性膵炎":                     ("A3-04", "慢性膵炎〈総論〉"),
    "骨腫瘍":                       ("B1-09", "骨腫瘍〈総論〉"),
    "Kaposi水痘様発疹症":           ("B2-06", "Kaposi水痘様発疹症"),
    "乾癬":                         ("B2-09", "尋常性乾癬"),
    "閉塞性動脈硬化症":             ("A1-07", "閉塞性動脈硬化症（ASO）"),
    "クループ症候群":               ("B5-08", "クループ症候群"),
    "腸重積症":                     ("C3-01", "腸重積症"),
    "重症筋無力症":                 ("A8-08", "重症筋無力症"),
    "網膜色素変性症":               ("B4-06", "網膜色素変性症"),
    # 119B
    "EBM":                          ("D2-02", "EBM（根拠に基づいた医療）"),
    "在宅医療":                     ("D2-14", "在宅医療〈総論〉"),
    "老人性難聴":                   ("B5-02", "老人性難聴"),
    "地域包括支援センター":          ("D2-14", "地域包括支援センター"),
    "大動脈弁狭窄症":               ("A1-04", "大動脈弁狭窄症（AS）"),
    "チアノーゼ":                   ("A1-01", "チアノーゼ"),
    "脊柱側弯症":                   ("B1-03", "脊柱側弯症"),
    "急性中耳炎":                   ("B5-03", "急性中耳炎"),
    "めまい":                       ("B5-02", "良性発作性頭位眩暈症"),
    "糖尿病合併妊娠":               ("C1-03", "糖尿病合併妊娠"),
    "敗血症性ショック":             ("D1-07", "敗血症性ショック"),
    "肺水腫":                       ("A4-09", "心原性肺水腫"),
    "急性虫垂炎":                   ("A2-04", "急性虫垂炎"),
    "水腎症":                       ("A5-08", "水腎症"),
    "脂質異常症":                   ("A6-08", "脂質異常症（高脂血症）"),
    "アルコール性肝障害":           ("A3-02", "アルコール性肝障害〈総論〉"),
    "アルコール依存症":             ("B3-04", "アルコール依存症〈総論〉"),
    "統合失調症":                   ("B3-03", "統合失調症"),
}

# B4-06, B4-07, B2-10, B2-11, B1-07 などは存在確認が必要なので先に検証
# 実際のタクソノミーから確認済み

# ── 手動マッピング: ID → (field, subfield, topic) ───────────────────────────────
# field の修正が必要なもの、またはAUTO_MAPに無いもの
MANUAL_MAP = {  # dict[str, tuple[Optional[str], str, str]]
    # format: "119AXX": (new_field_or_None, subfield, topic_keyword_for_find_topic)
    # None = field を変更しない

    # 119A
    "119A3":  (None,  "A8-03", "脳出血〈総論〉"),
    "119A4":  (None,  "B2-14", "皮膚の解剖〈総論〉"),   # 皮膚科疾患と好発部位 → 皮膚の解剖/構造
    "119A5":  (None,  "A1-09", "高血圧症"),              # 家庭血圧測定 → A1-09の高血圧症〈総論〉
    "119A8":  (None,  "A5-13", "腎・尿路結石"),
    "119A10": (None,  "A5-01", "尿の生成"),              # 尿細管機能
    "119A12": (None,  "A6-07", "糖尿病（DM）〈総論〉"),
    "119A14": (None,  "D2-17", "予防接種（定期・臨時・任意）"),
    "119A19": (None,  "A9-02", "結核菌感染症（TB）"),
    "119A20": (None,  "B2-13", "薬疹〈総論〉"),
    "119A22": (None,  "A10-04", "強皮症（SSc）"),
    "119A25": (None,  "C3-14", "百日咳"),               # C3-14に新生児髄膜炎はない → 最近接
    "119A28": ("A4",  "A4-03", "市中肺炎"),              # field A9→A4, インフルエンザ後肺炎
    "119A31": (None,  "A1-03", "急性心筋梗塞（AMI）"),
    "119A32": ("A7",  "A7-03", "悪性リンパ腫〈総論〉"),   # field A3→A7
    "119A37": (None,  "A4-07", "肺小細胞癌"),
    "119A39": (None,  "B1-04", "Quervain病"),              # de Quervain病
    "119A40": (None,  "D3-05", "輸液〈総論〉"),
    "119A42": ("A9",  "A9-02", "淋菌"),                  # field A5→A9
    "119A43": (None,  "B1-06", "化膿性関節炎"),
    "119A48": (None,  "A4-02", "肺瘻"),                  # 皮下気腫 → 胸部術後合併症
    "119A50": (None,  "A8-06", "MSA-C"),
    "119A53": (None,  "A5-05", "尿細管・間質性腎炎"),
    "119A59": (None,  "A3-03", "胆囊癌"),
    "119A62": (None,  "A4-07", "原発性肺癌"),
    "119A66": ("C1",  "C1-02", "常位胎盤早期剝離"),       # field C2→C1, C1-02に存在（剝離の字体注意）
    "119A68": (None,  "B3-06", "自閉症"),
    "119A70": (None,  "A4-09", "慢性肺血栓塞栓症"),
    "119A71": (None,  "A9-07", "水痘・帯状疱疹"),
    "119A72": (None,  "A4-04", "慢性閉塞性肺疾患（COPD）"),
    "119A74": (None,  "A1-01", "心不全〈総論〉"),
    "119A75": (None,  "D3-05", "輸液〈総論〉"),

    # 119B
    "119B1":  ("B2",  "B2-09", "乾癬〈総論〉"),           # field B5→B2, 鶏眼は角化→乾癬が最近接
    "119B6":  ("A8",  "A8-04", "認知症〈総論〉"),          # field A10→A8
    "119B7":  ("D2",  "D2-04", "医療面接"),               # field D3→D2
    "119B8":  ("D2",  "D2-08", "医療安全管理"),           # field D3→D2, 細菌培養検査 → 医療安全
    "119B10": ("D2",  "D2-10", "医療保険"),               # field D3→D2
    "119B13": ("C2",  "C2-01", "月経"),                   # field C1→C2, 思春期
    "119B14": ("D2",  "D2-14", "介護保険法〈総論〉"),      # field D3→D2
    "119B15": ("A2",  "A2-01", "消化管の内視鏡検査"),     # field A3→A2
    "119B17": (None,  "A5-01", "慢性腎臓病（CKD）〈総論〉"),
    "119B18": ("D3",  "D3-06", "穿刺"),                   # 動脈採血
    "119B20": (None,  "C1-01", "胎児心拍数モニタリング"),  # 胎動
    "119B21": ("C2",  "C2-02", "無月経〈総論〉"),          # field C1→C2
    "119B22": ("D2",  "D2-04", "患者情報の保護（個人情報保護法）"),  # field D3→D2
    "119B23": ("C3",  "C3-03", "小児のバイタルサイン"),    # field C2→C3
    "119B24": ("D2",  "D2-07", "臓器移植法"),             # field D3→D2
    "119B25": ("D2",  "D2-05", "医師法〈総論〉"),          # field D3→D2, 保険医登録取消
    "119B26": (None,  "D1-07", "心停止（CPA）〈総論〉"),   # 心肺停止
    "119B27": ("C3",  "C3-03", "精神運動発達"),           # field C2→C3
    "119B28": ("A4",  "A4-04", "慢性閉塞性肺疾患（COPD）"),  # field A2→A4
    "119B31": (None,  "A6-07", "低血糖症"),
    "119B33": ("D2",  "D2-21", "労働者災害補償保険法"),    # field D3→D2
    "119B34": ("D2",  "D2-04", "患者医師関係"),           # field D3→D2
    "119B36": ("D2",  "D2-08", "クリニカルパス"),          # field D3→D2, NST → 医療の質
    "119B38": (None,  "D3-04", "高齢者の転倒"),
    "119B39": ("D2",  "D2-07", "緩和ケアの概念"),         # field D3→D2
    "119B40": ("A4",  "A4-13", "縦隔腫瘍〈総論〉"),        # field A2→A4
    "119B42": ("D2",  "D2-12", "健康増進法"),             # field D3→D2, 行動変容
    "119B43": ("A8",  "A8-03", "一過性脳虚血発作（TIA）"),  # field A10→A8
    "119B44": ("A8",  "A8-03", "一過性脳虚血発作（TIA）"),  # field A10→A8
    "119B45": ("D2",  "D2-04", "医療面接"),               # field A3→D2
    "119B46": ("A2",  "A2-03", "胃・十二指腸潰瘍〈総論〉"),  # field A3→A2
}

# ── B2-11 (アトピー性皮膚炎), B2-10 (カポジ), B4-06, B4-07 存在確認 ─────────────
def check_subfield_exists(code: str) -> bool:
    for cat in taxonomy["categories"].values():
        if code in cat["subcategories"]:
            return True
    return False

# B2-10, B2-11 が存在しない場合の fallback
def safe_auto_map(disease: str, proposed_subfield: str, topic_kw: str) -> tuple[str, str]:
    if check_subfield_exists(proposed_subfield):
        topics = get_topics(proposed_subfield)
        for t in topics:
            if topic_kw in t:
                return (proposed_subfield, t)
        return (proposed_subfield, topics[0])
    else:
        # Fallback to parent category or neighboring subfield
        print(f"  [WARN] Subfield {proposed_subfield} not in taxonomy, searching for '{topic_kw}'", file=sys.stderr)
        # Search all topics
        for cat in taxonomy["categories"].values():
            for sc, sv in cat["subcategories"].items():
                for t in sv["topics"]:
                    if topic_kw in t:
                        print(f"  [INFO] Found '{t}' in {sc}", file=sys.stderr)
                        return (sc, t)
        raise ValueError(f"Cannot find topic '{topic_kw}' anywhere in taxonomy")


# ── メイン処理 ────────────────────────────────────────────────────────────────
def process_file(path: Path) -> dict:
    with open(path, encoding="utf-8") as f:
        data = json.load(f)

    assigned = 0
    manual = 0
    auto = 0
    errors = []

    for q in data["questions"]:
        qid = q["id"]
        disease_list = q.get("disease") or []
        disease = disease_list[0] if disease_list else ""

        if qid in MANUAL_MAP:
            new_field, subfield, topic_kw = MANUAL_MAP[qid]
            # field 修正
            if new_field is not None:
                q["field"] = new_field
            # topic 検索
            topic = find_topic(subfield, topic_kw)
            q["subfield"] = subfield
            q["topic"] = topic
            manual += 1
            assigned += 1
        elif disease in AUTO_MAP:
            subfield, topic_kw = AUTO_MAP[disease]
            # safe_auto_map で実在確認
            subfield, topic = safe_auto_map(disease, subfield, topic_kw)
            q["subfield"] = subfield
            q["topic"] = topic
            auto += 1
            assigned += 1
        else:
            errors.append(f"  [UNMATCHED] {qid}: disease={disease!r}")
            q["subfield"] = None
            q["topic"] = None

        # disease フィールドを削除
        if "disease" in q:
            del q["disease"]

    print(f"{path.name}: assigned={assigned} (auto={auto}, manual={manual}), errors={len(errors)}")
    for e in errors:
        print(e)

    return data


def write_json(path: Path, data: dict):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  Written: {path}")


if __name__ == "__main__":
    print("=== Processing 119A.json ===")
    data_a = process_file(JSON_119A)
    write_json(JSON_119A, data_a)

    print()
    print("=== Processing 119B.json ===")
    data_b = process_file(JSON_119B)
    write_json(JSON_119B, data_b)

    print()
    print("Done.")
