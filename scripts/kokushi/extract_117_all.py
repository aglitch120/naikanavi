#!/usr/bin/env python3
"""
extract_117_all.py
第117回医師国家試験 全6ブロック（A-F）の問題データを生成する。
"""

import json
import re
import sys
from pathlib import Path

# ── パス設定 ──────────────────────────────────────────────────────────────────
REPO = Path(__file__).resolve().parents[2]
TAXONOMY_PATH = REPO / "docs/source-data/iwor-theme-taxonomy.json"
ANSWERS_PATH  = Path("/tmp/117_answers.json")
META_PATH     = Path("/tmp/117_medu4_meta.json")
TEXT_PATHS = {
    "A": Path("/tmp/117a_text.txt"),
    "B": Path("/tmp/117b_text.txt"),
    "C": Path("/tmp/117c_text.txt"),
    "D": Path("/tmp/117d_text.txt"),
    "E": Path("/tmp/117e_text.txt"),
    "F": Path("/tmp/117f_text.txt"),
}
OUTPUT_DIR = REPO / "data/questions/117"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

BLOCK_SIZES = {"A": 75, "B": 50, "C": 75, "D": 75, "E": 50, "F": 75}

# ── データ読み込み ──────────────────────────────────────────────────────────────
with open(TAXONOMY_PATH, encoding="utf-8") as f:
    taxonomy = json.load(f)
with open(ANSWERS_PATH, encoding="utf-8") as f:
    answers_raw = json.load(f)
with open(META_PATH, encoding="utf-8") as f:
    meta_raw = json.load(f)

# ── タクソノミーインデックス構築 ────────────────────────────────────────────────
TOPIC_LOOKUP: dict[str, tuple[str, str]] = {}
BASE_LOOKUP: dict[str, tuple[str, str]] = {}

def strip_parens(s: str) -> str:
    """〈...〉（...）を除去してbase名を得る"""
    s = re.sub(r'〈[^〉]*〉', '', s)
    s = re.sub(r'（[^）]*）', '', s)
    s = re.sub(r'\([^)]*\)', '', s)
    return s.strip()

for cat_code, cat in taxonomy["categories"].items():
    for sub_code, sub in cat["subcategories"].items():
        for topic in sub["topics"]:
            TOPIC_LOOKUP[topic] = (sub_code, topic)
            base = strip_parens(topic)
            if base and base not in BASE_LOOKUP:
                BASE_LOOKUP[base] = (sub_code, topic)

def find_best_topic(theme: str, expected_field: str) -> tuple[str, str, str]:
    """
    themeからタクソノミーのトピックを検索。
    Returns: (field, subfield, topic)
    """
    angle_match = re.findall(r'〈([^〉]+)〉', theme)
    
    # 1. 完全一致
    if theme in TOPIC_LOOKUP:
        sub, t = TOPIC_LOOKUP[theme]
        field = sub.split('-')[0]
        return field, sub, t
    
    # 2. base名で完全一致
    base_theme = strip_parens(theme)
    if base_theme in BASE_LOOKUP:
        sub, t = BASE_LOOKUP[base_theme]
        field = sub.split('-')[0]
        return field, sub, t
    
    # 3. topic名がthemeに含まれる（expected_fieldを優先）
    candidates = []
    for topic, (sub, t) in TOPIC_LOOKUP.items():
        fld = sub.split('-')[0]
        score = 0
        if topic in theme:
            score += len(topic) * 2
        if strip_parens(topic) in theme:
            score += len(strip_parens(topic))
        if base_theme in topic:
            score += len(base_theme)
        if fld == expected_field:
            score += 100
        if score > 0:
            candidates.append((score, sub, t))
    
    if candidates:
        candidates.sort(key=lambda x: -x[0])
        _, sub, t = candidates[0]
        field = sub.split('-')[0]
        return field, sub, t
    
    # 4. themeの単語がtopicに含まれる（expected_field限定）
    for topic, (sub, t) in TOPIC_LOOKUP.items():
        fld = sub.split('-')[0]
        if fld == expected_field:
            for kw in angle_match:
                if kw in topic or topic in kw:
                    return fld, sub, t
    
    return expected_field, None, None


# ── medu4 subject → iwor field マッピング ──────────────────────────────────────
SUBJECT_TO_FIELD = {
    "01.腎":           "A5",
    "02.内分泌代謝":   "A6",
    "03.血液":         "A7",
    "04.免疫":         "A10",
    "05.感染症":       "A9",
    "06.呼吸器":       "A4",
    "07.循環器":       "A1",
    "08.消化管":       "A2",
    "09.肝胆膵":       "A3",
    "10.神経":         "A8",
    "11.産婦人科":     "C1",
    "12.小児科":       "C3",
    "13.加齢老年学":   "D3",
    "14.整形外科":     "B1",
    "15.眼科":         "B4",
    "16.耳鼻咽喉科":   "B5",
    "17.泌尿器科":     "A5",
    "18.精神科":       "B3",
    "19.皮膚科":       "B2",
    "20.放射線科":     "B6",
    "21.救急":         "D1",
    "22.中毒":         "D1",
    "23.麻酔":         "D3",
    "24.公衆衛生":     "D2",
    "25.総論的事項":   "D3",
    "26.必修的事項":   "D2",
    "27.基礎医学":     "D3",
}

# ── 答え変換 ──────────────────────────────────────────────────────────────────
def convert_answer(raw: str):
    if not raw:
        return None
    try:
        float(raw)
        return raw
    except ValueError:
        pass
    letters = [c for c in raw if c.isalpha()]
    if len(letters) == 1:
        return letters[0].lower()
    elif len(letters) > 1:
        return [c.lower() for c in letters]
    return raw

def num_answers_from(answer):
    if isinstance(answer, list):
        return len(answer)
    return 1

# ── テキストパーサー ───────────────────────────────────────────────────────────
FULLWIDTH_MAP = str.maketrans('ａｂｃｄｅ', 'abcde')
PAGE_HEADER_RE = re.compile(r'^DKIX-\S+$')

def normalize_choice_line(line: str) -> tuple[str, str]:
    line = line.translate(FULLWIDTH_MAP)
    m = re.match(r'^([abcde])[　\s]+(.+)', line.strip())
    if m:
        return m.group(1), m.group(2).strip()
    return None, None

def parse_block_text(text: str, block: str, num_questions: int) -> list[dict]:
    lines = text.splitlines()
    
    clean_lines = []
    dkix_after_clean: list[int] = []

    for line in lines:
        stripped = line.strip()
        if PAGE_HEADER_RE.match(stripped):
            dkix_after_clean.append(len(clean_lines))
            continue
        if re.match(r'^\d{3}$', stripped):
            continue
        clean_lines.append(stripped)

    exam_start_clean_idx = 0
    for k in range(len(dkix_after_clean) - 2):
        gap1 = dkix_after_clean[k+1] - dkix_after_clean[k]
        gap2 = dkix_after_clean[k+2] - dkix_after_clean[k+1]
        if gap1 <= 3 and gap2 <= 3:
            exam_start_clean_idx = dkix_after_clean[k]
            break
    
    CHOICE_CHARS = set('abcde')
    full_clean = '\n'.join(clean_lines)

    def has_choices_nearby(line_idx: int, window: int = 20) -> bool:
        count = 0
        for j in range(line_idx, min(line_idx + window, len(clean_lines))):
            ln = clean_lines[j].translate(FULLWIDTH_MAP)
            if re.match(r'^[abcde][　\s]', ln):
                count += 1
        return count >= 2

    q_positions_all: dict[int, list[tuple[int, bool]]] = {}

    UNIT_START_RE = re.compile(
        r'^(?:mm|cm|mg|mL|μg|μL|μm|ng|pg|kg|g/|dL|U/L|%|×|＋|－|±|SD）|'
        r'以下）|以上）|未満）|超）|SpO2|℃|/分|\d+\.\d+|\d+,\d+|\d+（|\d+　)'
    )
    AGE_START_RE = re.compile(r'^\d+\s*(?:歳|か月|週|日|分|秒|時間)(?:の|。|、|，)')

    for i, line in enumerate(clean_lines):
        if re.match(r'^\d+$', line):
            num = int(line)
            if 1 <= num <= num_questions:
                if has_choices_nearby(i, window=25):
                    q_positions_all.setdefault(num, []).append((i, False))
        m = re.match(r'^(\d+)\s+(.+)', line)
        if m:
            num = int(m.group(1))
            rest = m.group(2)
            if 1 <= num <= num_questions and not UNIT_START_RE.match(rest):
                full_rest = f'{num} {rest}'
                if AGE_START_RE.match(full_rest):
                    continue
                q_positions_all.setdefault(num, []).append((i, True))

    q_positions = []
    for num in range(1, num_questions + 1):
        if num in q_positions_all:
            candidates = q_positions_all[num]
            after_start = [(li, inl) for (li, inl) in candidates if li >= exam_start_clean_idx]
            search_pool = after_start if after_start else candidates
            best = None
            for (line_idx, inline) in search_pool:
                if has_choices_nearby(line_idx):
                    best = (line_idx, inline)
                    break
            if best is None:
                best = search_pool[0]
            q_positions.append((best[0], num, best[1]))

    q_positions.sort(key=lambda x: x[0])

    changed = True
    while changed:
        changed = False
        for idx in range(len(q_positions) - 1):
            pos, num, inline = q_positions[idx]
            next_pos = q_positions[idx+1][0]
            span = next_pos - pos
            if span < 5:
                candidates = q_positions_all.get(num, [])
                after_start = [(li, inl) for (li, inl) in candidates if li >= exam_start_clean_idx]
                search_pool = after_start if after_start else candidates
                better = None
                for (line_idx, inl2) in search_pool:
                    if line_idx > pos and has_choices_nearby(line_idx):
                        better = (line_idx, inl2)
                        break
                if better:
                    q_positions[idx] = (better[0], num, better[1])
                    q_positions.sort(key=lambda x: x[0])
                    changed = True
                    break

    questions = []
    for idx, (pos, num, inline) in enumerate(q_positions):
        end_pos = q_positions[idx+1][0] if idx+1 < len(q_positions) else len(clean_lines)
        
        q_lines = clean_lines[pos:end_pos]
        
        if not inline:
            q_lines = q_lines[1:]
        else:
            q_lines[0] = re.sub(r'^\d+\s+', '', q_lines[0])
        
        choices = {}
        stem_lines = []
        has_image = False
        choice_started = False
        
        i2 = 0
        while i2 < len(q_lines):
            line = q_lines[i2]
            
            if '別冊' in line and 'No.' in line:
                has_image = True
                i2 += 1
                continue
            
            if not line:
                i2 += 1
                continue
            
            letter, choice_text = normalize_choice_line(line)
            if letter and letter in 'abcde':
                choice_started = True
                j = i2 + 1
                while j < len(q_lines):
                    next_line = q_lines[j]
                    if not next_line:
                        break
                    nl, _ = normalize_choice_line(next_line)
                    if nl and nl in 'abcde':
                        break
                    if '別冊' in next_line:
                        break
                    choice_text += next_line
                    j += 1
                choices[letter] = choice_text.strip()
                i2 = j
            elif not choice_started:
                if line:
                    stem_lines.append(line)
                i2 += 1
            else:
                i2 += 1
        
        stem = '\n'.join(stem_lines).strip()
        stem = re.sub(r'\n+', '\n', stem)
        
        questions.append({
            "num": num,
            "stem": stem,
            "choices": choices,
            "has_image": has_image,
        })
    
    return questions


# ── 手動マッピング: qid → (field, subfield, topic) ───────────────────────────
MANUAL_TOPIC_MAP: dict[str, tuple[str, str, str]] = {
    # 117A
    "117A1":  ("C1", "C1-03", "合併症妊娠〈総論〉"),
    "117A2":  ("A10", "A10-01", "IgE，特異的IgE検査"),
    "117A3":  ("A2", "A2-03", "胃切除後症候群〈総論〉"),
    "117A4":  ("A4", "A4-08", "急性好酸球性肺炎"),
    "117A5":  ("B3", "B3-01", "精神科の症候〈総論〉"),
    "117A6":  ("A7", "A7-04", "溶血性尿毒症症候群（HUS）"),
    "117A7":  ("A2", "A2-03", "慢性胃炎"),
    "117A8":  ("D2", "D2-12", "がん対策（がん検診・がん登録）"),
    "117A9":  ("A3", "A3-02", "肝硬変〈総論〉"),
    "117A10": ("A1", "A1-08", "深部静脈血栓症"),
    "117A11": ("A4", "A4-08", "気管支喘息"),
    "117A12": ("A9", "A9-03", "梅毒"),
    "117A13": ("A6", "A6-13", "ビタミン欠乏症〈総論〉"),
    "117A14": ("A2", "A2-02", "胃食道逆流症（GERD）〈総論〉"),
    "117A15": ("B2", "B2-04", "水疱性類天疱瘡"),
    "117A16": ("A1", "A1-01", "慢性心不全"),
    "117A17": ("C1", "C1-02", "双胎間輸血症候群"),
    "117A18": ("B3", "B3-02", "選択緘黙"),
    "117A19": ("B5", "B5-02", "Meniere病"),
    "117A20": ("D2", "D2-04", "患者医師関係"),
    "117A21": ("B4", "B4-04", "細菌性（匐行性）角膜潰瘍"),
    "117A22": ("C3", "C3-07", "先天性食道閉鎖症"),
    "117A23": ("A1", "A1-06", "たこつぼ心筋症"),
    "117A24": ("B4", "B4-04", "ウイルス性結膜炎"),
    "117A25": ("B4", "B4-01", "細隙灯顕微鏡検査"),
    "117A26": ("A1", "A1-07", "大動脈炎症候群"),
    "117A27": ("A1", "A1-01", "心電図"),
    "117A28": ("A8", "A8-09", "Ramsay-Hunt症候群"),
    "117A29": ("A1", "A1-03", "乳頭筋断裂"),
    "117A30": ("C1", "C1-05", "羊水塞栓症"),
    "117A31": ("B2", "B2-06", "尋常性白斑"),
    "117A32": ("A4", "A4-04", "慢性閉塞性肺疾患（COPD）"),
    "117A33": ("A8", "A8-10", "むずむず脚症候群"),
    "117A34": ("B3", "B3-06", "注意欠陥多動性障害（ADHD）"),
    "117A35": ("A4", "A4-14", "乳び胸"),
    "117A36": ("A2", "A2-04", "結腸憩室症"),
    "117A37": ("B2", "B2-11", "基底細胞癌"),
    "117A38": ("A8", "A8-08", "重症筋無力症（MG）"),
    "117A39": ("B2", "B2-11", "悪性黒色腫"),
    "117A40": ("A6", "A6-03", "甲状腺悪性腫瘍〈総論〉"),
    "117A41": ("A4", "A4-13", "縦隔腫瘍〈総論〉"),
    "117A42": ("A2", "A2-04", "潰瘍性大腸炎"),
    "117A43": ("A9", "A9-03", "梅毒"),
    "117A44": ("C1", "C1-03", "妊娠糖尿病"),
    "117A45": ("A7", "A7-02", "遺伝性球状赤血球症（HS）"),
    "117A46": ("A4", "A4-13", "縦隔気腫"),
    "117A47": ("B4", "B4-07", "視神経炎"),
    "117A48": ("A4", "A4-14", "胸膜中皮腫"),
    "117A49": ("D2", "D2-14", "介護保険法〈総論〉"),
    "117A50": ("B5", "B5-03", "真珠腫性中耳炎"),
    "117A51": ("D3", "D3-05", "輸液〈総論〉"),
    "117A52": ("B5", "B5-06", "慢性副鼻腔炎"),
    "117A53": ("B5", "B5-07", "扁桃周囲炎・周囲膿瘍"),
    "117A54": ("A2", "A2-05", "腹膜炎〈総論〉"),
    "117A55": ("A4", "A4-14", "胸郭の異常〈総論〉"),
    "117A56": ("A2", "A2-04", "大腸癌〈総論〉"),
    "117A57": ("A1", "A1-03", "冠攣縮性狭心症"),
    "117A58": ("A2", "A2-02", "食道癌"),
    "117A59": ("B3", "B3-02", "強迫性障害"),
    "117A60": ("A1", "A1-06", "心臓粘液腫"),
    "117A61": ("B2", "B2-03", "多形滲出性紅斑"),
    "117A62": ("A2", "A2-02", "好酸球性食道炎"),
    "117A63": ("A9", "A9-07", "デング熱"),
    "117A64": ("A3", "A3-04", "膵癌"),
    "117A65": ("A2", "A2-03", "GIST"),
    "117A66": ("C3", "C3-07", "腸回転異常症"),
    "117A67": ("A9", "A9-08", "疥癬"),
    "117A68": ("A1", "A1-06", "感染性心内膜炎（IE）"),
    "117A69": ("A6", "A6-05", "原発性アルドステロン症"),
    "117A70": ("C3", "C3-05", "呼吸窮迫症候群（RDS)"),
    "117A71": ("A1", "A1-02", "QT延長症候群"),
    "117A72": ("C3", "C3-06", "染色体異常〈総論〉"),
    "117A73": ("C3", "C3-06", "遺伝形式〈総論〉"),
    "117A74": ("A2", "A2-05", "鼠径ヘルニア〈総論〉"),
    "117A75": ("A4", "A4-01", "動脈血液ガス分析"),

    # 117B
    "117B1":  ("D2", "D2-08", "インシデント（ヒヤリ・ハット）"),
    "117B2":  ("A4", "A4-01", "喀血"),
    "117B3":  ("D2", "D2-04", "医師の職業倫理指針"),
    "117B4":  ("C3", "C3-05", "胎児循環・新生児循環"),
    "117B5":  ("D2", "D2-06", "叙述的記録の記載方法（SOAP）"),
    "117B6":  ("A1", "A1-06", "感染性心内膜炎（IE）"),
    "117B7":  ("D3", "D3-04", "高齢者総合機能評価（CGA）"),
    "117B8":  ("A9", "A9-01", "空気感染"),
    "117B9":  ("C1", "C1-02", "妊娠高血圧症候群（PIH）"),
    "117B10": ("D2", "D2-03", "有訴者率"),
    "117B11": ("B3", "B3-03", "うつ病"),
    "117B12": ("D2", "D2-06", "処方箋"),
    "117B13": ("A1", "A1-09", "本態性高血圧症"),
    "117B14": ("D2", "D2-14", "介護保険法〈総論〉"),
    "117B15": ("B2", "B2-01", "湿疹"),
    "117B16": ("A4", "A4-13", "緊張性気胸"),
    "117B17": ("D2", "D2-04", "医療面接"),
    "117B18": ("D3", "D3-04", "高齢者の薬物治療"),
    "117B19": ("C3", "C3-07", "先天性食道閉鎖症"),
    "117B20": ("A8", "A8-02", "失神〈総論〉"),
    "117B21": ("D2", "D2-10", "医療保険"),
    "117B22": ("D2", "D2-04", "ヘルシンキ宣言"),
    "117B23": ("A5", "A5-01", "腎・泌尿器の検査〈総論〉"),
    "117B24": ("C2", "C2-01", "月経"),
    "117B25": ("D2", "D2-04", "リスボン宣言"),
    "117B26": ("D2", "D2-04", "患者医師関係"),
    "117B27": ("A5", "A5-01", "横紋筋融解症"),
    "117B28": ("D2", "D2-04", "インフォームド・コンセント"),
    "117B29": ("A1", "A1-01", "急性心不全"),
    "117B30": ("D2", "D2-04", "患者医師関係"),
    "117B31": ("A9", "A9-02", "丹毒"),
    "117B32": ("B5", "B5-01", "鼻出血"),
    "117B33": ("C3", "C3-06", "家系図"),
    "117B34": ("D2", "D2-08", "医療安全管理"),
    "117B35": ("D3", "D3-06", "徒手筋力テスト"),
    "117B36": ("A8", "A8-10", "てんかん〈総論〉"),
    "117B37": ("A4", "A4-11", "過換気症候群"),
    "117B38": ("D2", "D2-04", "患者医師関係"),
    "117B39": ("A8", "A8-03", "脳動脈瘤"),
    "117B40": ("D2", "D2-06", "死亡診断書・死体検案書"),
    "117B41": ("D2", "D2-02", "感度・特異度"),
    "117B42": ("A9", "A9-01", "針刺し事故"),
    "117B43": ("D2", "D2-04", "患者医師関係"),
    "117B44": ("D2", "D2-10", "公費医療"),
    "117B45": ("A3", "A3-01", "肝・胆・膵の検査〈総論〉"),
    "117B46": ("A3", "A3-02", "肝膿瘍"),
    "117B47": ("D2", "D2-02", "尤度比"),
    "117B48": ("A7", "A7-02", "鉄欠乏性貧血"),
    "117B49": ("A4", "A4-13", "気胸〈総論〉"),
    "117B50": ("A4", "A4-09", "急性肺血栓塞栓症"),

    # 117C
    "117C1":  ("D3", "D3-06", "腹部診察"),
    "117C2":  ("D2", "D2-14", "地域包括ケアシステム"),
    "117C3":  ("D2", "D2-02", "系統誤差（バイアス）"),
    "117C4":  ("D2", "D2-09", "災害医療"),
    "117C5":  ("D2", "D2-09", "病床"),
    "117C6":  ("D2", "D2-10", "社会保障制度"),
    "117C7":  ("D2", "D2-21", "産業医"),
    "117C8":  ("A1", "A1-01", "心エコー"),
    "117C9":  ("D2", "D2-17", "感染症サーベイランス〈総論〉"),
    "117C10": ("B2", "B2-01", "湿疹"),
    "117C11": ("A2", "A2-01", "消化管の解剖〈総論〉"),
    "117C12": ("D2", "D2-03", "出生数・出生率"),
    "117C13": ("D2", "D2-14", "介護保険法〈総論〉"),
    "117C14": ("D2", "D2-13", "新生児マススクリーニング"),
    "117C15": ("D2", "D2-14", "在宅医療〈総論〉"),
    "117C16": ("D2", "D2-02", "コホート研究"),
    "117C17": ("D2", "D2-17", "予防接種（定期・臨時・任意）"),
    "117C18": ("D2", "D2-03", "人口静態統計〈総論〉"),
    "117C19": ("D2", "D2-14", "介護保険法〈総論〉"),
    "117C20": ("D2", "D2-15", "国際生活機能分類（ICF）"),
    "117C21": ("D2", "D2-09", "チーム医療〈総論〉"),
    "117C22": ("D2", "D2-14", "要介護認定"),
    "117C23": ("B5", "B5-01", "耳鼻咽喉の解剖〈総論〉"),
    "117C24": ("D2", "D2-08", "医療安全支援センター"),
    "117C25": ("D2", "D2-09", "へき地医療"),
    "117C26": ("A9", "A9-01", "空気感染"),
    "117C27": ("D2", "D2-20", "学校感染症"),
    "117C28": ("D3", "D3-04", "日常生活動作（ADL）"),
    "117C29": ("D2", "D2-03", "死因統計〈総論〉"),
    "117C30": ("D2", "D2-21", "労働基準法〈総論〉"),
    "117C31": ("D2", "D2-09", "医療法〈総論〉"),
    "117C32": ("D2", "D2-12", "特定健康診査・特定保健指導"),
    "117C33": ("D2", "D2-16", "精神保健福祉センター"),
    "117C34": ("D2", "D2-13", "母子保健法〈総論〉"),
    "117C35": ("D2", "D2-12", "がん対策（がん検診・がん登録）"),
    "117C36": ("D2", "D2-07", "司法解剖・行政解剖・病理解剖・系統解剖"),
    "117C37": ("A9", "A9-01", "感染症総論〈総論〉"),
    "117C38": ("D2", "D2-21", "産業医"),
    "117C39": ("D2", "D2-12", "生活習慣病のリスク因子"),
    "117C40": ("D2", "D2-03", "人口ピラミッド"),
    "117C41": ("A1", "A1-01", "心電図"),
    "117C42": ("A9", "A9-07", "ヒト免疫不全ウイルス（HIV）感染症"),
    "117C43": ("A6", "A6-07", "糖尿病（DM）〈総論〉"),
    "117C44": ("A4", "A4-08", "過敏性肺（臓）炎"),
    "117C45": ("A8", "A8-05", "多発性硬化症（MS）"),
    "117C46": ("A3", "A3-02", "アルコール性肝炎"),
    "117C47": ("A5", "A5-02", "IgA腎症"),
    "117C48": ("A7", "A7-03", "急性骨髄性白血病（AML）"),
    "117C49": ("A4", "A4-08", "気管支喘息"),
    "117C50": ("B1", "B1-03", "腰椎椎間板ヘルニア"),
    "117C51": ("A5", "A5-06", "糖尿病性腎症"),
    "117C52": ("A6", "A6-03", "Basedow病"),
    "117C53": ("A2", "A2-04", "イレウス〈総論〉"),
    "117C54": ("C2", "C2-08", "子宮頸癌"),
    "117C55": ("B1", "B1-01", "廃用症候群"),
    "117C56": ("A9", "A9-02", "蜂窩織炎"),
    "117C57": ("A8", "A8-06", "脊髄性進行性筋萎縮症"),
    "117C58": ("A6", "A6-07", "低血糖症"),
    "117C59": ("A5", "A5-01", "慢性腎不全（CRF）"),
    "117C60": ("D2", "D2-08", "医療安全管理"),
    "117C61": ("A9", "A9-07", "水痘・帯状疱疹"),
    "117C62": ("D2", "D2-13", "乳幼児健康診査"),
    "117C63": ("A7", "A7-04", "血栓性血小板減少性紫斑病（TTP）"),
    "117C64": ("A3", "A3-04", "急性膵炎"),
    "117C65": ("B1", "B1-03", "頸部脊椎症"),
    "117C66": ("A2", "A2-04", "大腸癌〈総論〉"),
    "117C67": ("A1", "A1-06", "感染性心内膜炎（IE）"),
    "117C68": ("A3", "A3-03", "原発性硬化性胆管炎（PSC）"),
    "117C69": ("A8", "A8-04", "Alzheimer型認知症"),
    "117C70": ("C2", "C2-07", "子宮脱"),
    "117C71": ("A8", "A8-03", "脳出血〈総論〉"),
    "117C72": ("A5", "A5-03", "原発性ネフローゼ症候群〈総論〉"),
    "117C73": ("A4", "A4-05", "特発性肺線維症（IPF）"),
    "117C74": ("C3", "C3-07", "先天性食道閉鎖症"),
    "117C75": ("A1", "A1-07", "閉塞性動脈硬化症（ASO）"),

    # 117D
    "117D1":  ("B6", "B6-01", "放射線総論"),
    "117D2":  ("D2", "D2-10", "国民医療費"),
    "117D3":  ("D3", "D3-01", "吸入麻酔〈総論〉"),
    "117D4":  ("D2", "D2-04", "インフォームド・コンセント"),
    "117D5":  ("D2", "D2-13", "周産期死亡"),
    "117D6":  ("D3", "D3-06", "身体診察〈総論〉"),
    "117D7":  ("A3", "A3-01", "肝・胆・膵の検査〈総論〉"),
    "117D8":  ("A9", "A9-01", "日和見感染"),
    "117D9":  ("D2", "D2-21", "産業医"),
    "117D10": ("A8", "A8-01", "脳神経とその障害〈総論〉"),
    "117D11": ("D2", "D2-13", "新生児死亡・乳児死亡"),
    "117D12": ("D2", "D2-08", "アクシデント（医療事故）"),
    "117D13": ("A6", "A6-01", "内分泌の症候〈総論〉"),
    "117D14": ("D2", "D2-02", "正規分布・標準偏差"),
    "117D15": ("D2", "D2-12", "特定健康診査・特定保健指導"),
    "117D16": ("A5", "A5-01", "腎・泌尿器の解剖〈総論〉"),
    "117D17": ("D2", "D2-21", "職業癌"),
    "117D18": ("D2", "D2-07", "緩和ケアの概念"),
    "117D19": ("A9", "A9-02", "結核菌感染症（TB）"),
    "117D20": ("D2", "D2-21", "放射線障害の管理"),
    "117D21": ("A2", "A2-01", "消化管ホルモン"),
    "117D22": ("D2", "D2-05", "薬剤師法〈総論〉"),
    "117D23": ("A6", "A6-07", "糖尿病（DM）〈総論〉"),
    "117D24": ("A1", "A1-01", "循環器の生理〈総論〉"),
    "117D25": ("D2", "D2-05", "医師法〈総論〉"),
    "117D26": ("A8", "A8-01", "大脳皮質障害"),
    "117D27": ("A9", "A9-01", "感染症の治療〈総論〉"),
    "117D28": ("C1", "C1-01", "胎児付属物"),
    "117D29": ("A4", "A4-01", "呼吸器の生理〈総論〉"),
    "117D30": ("D2", "D2-10", "社会保障制度"),
    "117D31": ("D2", "D2-02", "スクリーニング"),
    "117D32": ("D2", "D2-17", "ワクチンの種類"),
    "117D33": ("A2", "A2-01", "消化管の解剖〈総論〉"),
    "117D34": ("D2", "D2-02", "コホート研究"),
    "117D35": ("A8", "A8-01", "伝導路"),
    "117D36": ("D3", "D3-01", "周術期管理〈総論〉"),
    "117D37": ("A1", "A1-01", "循環器の生理〈総論〉"),
    "117D38": ("A4", "A4-01", "動脈血液ガス分析"),
    "117D39": ("A9", "A9-01", "院内感染症"),
    "117D40": ("A3", "A3-01", "肝・胆・膵の生理〈総論〉"),
    "117D41": ("A8", "A8-01", "脊髄障害〈総論〉"),
    "117D42": ("D3", "D3-01", "静脈麻酔〈総論〉"),
    "117D43": ("A8", "A8-10", "熱性けいれん"),
    "117D44": ("A5", "A5-01", "蛋白尿"),
    "117D45": ("D3", "D3-01", "筋弛緩薬〈総論〉"),
    "117D46": ("A4", "A4-01", "スパイロメトリ"),
    "117D47": ("A8", "A8-01", "脳神経とその障害〈総論〉"),
    "117D48": ("D2", "D2-03", "死亡数・粗死亡率"),
    "117D49": ("A1", "A1-01", "心臓の解剖"),
    "117D50": ("A8", "A8-01", "伝導路"),
    "117D51": ("A8", "A8-02", "脳死"),
    "117D52": ("D3", "D3-05", "輸液〈総論〉"),
    "117D53": ("A6", "A6-07", "糖尿病（DM）〈総論〉"),
    "117D54": ("A10", "A10-01", "免疫グロブリン大量療法"),
    "117D55": ("A4", "A4-01", "呼吸器の生理〈総論〉"),
    "117D56": ("B3", "B3-03", "統合失調症"),
    "117D57": ("A1", "A1-01", "循環器の生理〈総論〉"),
    "117D58": ("A5", "A5-06", "電解質代謝異常と腎障害"),
    "117D59": ("A3", "A3-02", "ウイルス性肝炎〈総論〉"),
    "117D60": ("D3", "D3-01", "吸入麻酔薬〈総論〉"),
    "117D61": ("A8", "A8-01", "伝導路"),
    "117D62": ("A4", "A4-01", "呼吸器の解剖〈総論〉"),
    "117D63": ("A9", "A9-01", "感染症の治療〈総論〉"),
    "117D64": ("D3", "D3-01", "吸入麻酔薬〈総論〉"),
    "117D65": ("A1", "A1-01", "循環器の解剖〈総論〉"),
    "117D66": ("A6", "A6-01", "ホルモン作用機序"),
    "117D67": ("D3", "D3-01", "吸入麻酔〈総論〉"),
    "117D68": ("A2", "A2-01", "消化管の解剖〈総論〉"),
    "117D69": ("A5", "A5-01", "腎・泌尿器の解剖〈総論〉"),
    "117D70": ("A10", "A10-01", "免疫の機能〈総論〉"),
    "117D71": ("A8", "A8-01", "大脳皮質障害"),
    "117D72": ("A6", "A6-01", "ホルモン合成，ホルモン分泌"),
    "117D73": ("A2", "A2-01", "消化吸収"),
    "117D74": ("A4", "A4-01", "呼吸器の解剖〈総論〉"),
    "117D75": ("B1", "B1-01", "骨折〈総論〉"),

    # 117E
    "117E1":  ("D2", "D2-05", "医師法〈総論〉"),
    "117E2":  ("D2", "D2-10", "医療保険"),
    "117E3":  ("A1", "A1-06", "感染性心内膜炎（IE）"),
    "117E4":  ("A4", "A4-13", "気胸〈総論〉"),
    "117E5":  ("D2", "D2-03", "出生数・出生率"),
    "117E6":  ("D2", "D2-04", "医療面接"),
    "117E7":  ("A5", "A5-01", "急性腎障害（AKI）〈総論〉"),
    "117E8":  ("D2", "D2-21", "振動障害"),
    "117E9":  ("D2", "D2-05", "異状死体の届出義務"),
    "117E10": ("D2", "D2-14", "介護保険法〈総論〉"),
    "117E11": ("A9", "A9-01", "感染症総論〈総論〉"),
    "117E12": ("D2", "D2-08", "アクシデント（医療事故）"),
    "117E13": ("D2", "D2-09", "病院・診療所"),
    "117E14": ("D2", "D2-04", "インフォームド・コンセント"),
    "117E15": ("D2", "D2-05", "診断書の交付義務"),
    "117E16": ("D2", "D2-12", "健康増進法"),
    "117E17": ("D2", "D2-09", "特定機能病院・地域医療支援病院"),
    "117E18": ("D2", "D2-14", "訪問看護制度"),
    "117E19": ("D2", "D2-04", "告知，SPIKES"),
    "117E20": ("D2", "D2-07", "緩和ケアの概念"),
    "117E21": ("A1", "A1-06", "感染性心内膜炎（IE）"),
    "117E22": ("A4", "A4-03", "肺結核症"),
    "117E23": ("B2", "B2-01", "アトピー性皮膚炎"),
    "117E24": ("A8", "A8-11", "結節性硬化症"),
    "117E25": ("A7", "A7-03", "悪性リンパ腫〈総論〉"),
    "117E26": ("A5", "A5-02", "IgA腎症"),
    "117E27": ("A6", "A6-06", "膵ラ島に由来するホルモン産生腫瘍〈総論〉"),
    "117E28": ("A6", "A6-05", "副腎皮質機能低下症〈総論〉"),
    "117E29": ("B1", "B1-03", "変形性脊椎症"),
    "117E30": ("A2", "A2-04", "Crohn病"),
    "117E31": ("B3", "B3-03", "うつ病"),
    "117E32": ("C1", "C1-02", "常位胎盤早期剝離"),
    "117E33": ("A8", "A8-06", "Parkinson病"),
    "117E34": ("A2", "A2-02", "食道癌"),
    "117E35": ("A1", "A1-03", "急性心筋梗塞（AMI）"),
    "117E36": ("C3", "C3-14", "麻疹"),
    "117E37": ("A8", "A8-03", "脳梗塞"),
    "117E38": ("A3", "A3-03", "急性胆囊炎"),
    "117E39": ("A5", "A5-08", "腎盂腎炎"),
    "117E40": ("C3", "C3-12", "川崎病（MCLS）"),
    "117E41": ("A4", "A4-04", "慢性閉塞性肺疾患（COPD）"),
    "117E42": ("A1", "A1-09", "高血圧症〈総論〉"),
    "117E43": ("A9", "A9-02", "結核菌感染症（TB）"),
    "117E44": ("A3", "A3-02", "肝細胞癌（HCC）"),
    "117E45": ("B1", "B1-01", "骨折〈総論〉"),
    "117E46": ("B2", "B2-03", "多形滲出性紅斑"),
    "117E47": ("C1", "C1-01", "妊娠徴候・妊娠反応"),
    "117E48": ("A6", "A6-07", "2型糖尿病"),
    "117E49": ("A2", "A2-04", "直腸癌"),
    "117E50": ("B5", "B5-03", "急性中耳炎"),

    # 117F
    "117F1":  ("C3", "C3-06", "染色体異常〈総論〉"),
    "117F2":  ("A9", "A9-07", "ウイルス性下痢症"),
    "117F3":  ("A6", "A6-03", "慢性甲状腺炎（橋本病）"),
    "117F4":  ("A8", "A8-06", "筋萎縮性側索硬化症（ALS）"),
    "117F5":  ("B2", "B2-04", "天疱瘡〈総論〉"),
    "117F6":  ("A4", "A4-08", "サルコイドーシス"),
    "117F7":  ("B4", "B4-09", "開放隅角緑内障"),
    "117F8":  ("A7", "A7-03", "多発性骨髄腫（MM）"),
    "117F9":  ("B1", "B1-05", "大腿骨壊死症〈総論〉"),
    "117F10": ("A4", "A4-07", "原発性肺癌"),
    "117F11": ("B3", "B3-03", "統合失調症"),
    "117F12": ("A3", "A3-04", "急性膵炎"),
    "117F13": ("A1", "A1-07", "大動脈解離"),
    "117F14": ("A6", "A6-03", "甲状腺機能亢進症〈総論〉"),
    "117F15": ("C3", "C3-14", "麻疹"),
    "117F16": ("C2", "C2-08", "子宮内膜症"),
    "117F17": ("A5", "A5-08", "腎細胞癌（RCC）"),
    "117F18": ("A2", "A2-04", "虚血性大腸炎"),
    "117F19": ("A8", "A8-07", "髄膜炎〈総論〉"),
    "117F20": ("B1", "B1-06", "化膿性関節炎"),
    "117F21": ("A7", "A7-03", "悪性リンパ腫〈総論〉"),
    "117F22": ("A5", "A5-12", "前立腺癌"),
    "117F23": ("B5", "B5-06", "アレルギー性鼻炎"),
    "117F24": ("C1", "C1-05", "弛緩出血"),
    "117F25": ("B1", "B1-05", "変形性股関節症"),
    "117F26": ("A9", "A9-05", "ツツガムシ病"),
    "117F27": ("A1", "A1-03", "狭心症（AP）〈総論〉"),
    "117F28": ("A2", "A2-03", "胃癌〈総論〉"),
    "117F29": ("B4", "B4-06", "網膜剝離〈総論〉"),
    "117F30": ("A6", "A6-07", "2型糖尿病"),
    "117F31": ("C3", "C3-07", "先天性食道閉鎖症"),
    "117F32": ("A3", "A3-03", "急性胆管炎"),
    "117F33": ("A4", "A4-08", "気管支喘息"),
    "117F34": ("A8", "A8-06", "Parkinson病"),
    "117F35": ("A9", "A9-02", "非結核性抗酸菌症"),
    "117F36": ("A6", "A6-07", "1型糖尿病"),
    "117F37": ("B1", "B1-06", "化膿性関節炎"),
    "117F38": ("A8", "A8-03", "くも膜下出血〈総論〉"),
    "117F39": ("A2", "A2-04", "大腸ポリープ"),
    "117F40": ("A5", "A5-12", "膀胱腫瘍"),
    "117F41": ("A3", "A3-04", "囊胞性膵疾患〈総論〉"),
    "117F42": ("D1", "D1-08", "熱傷〈総論〉"),
    "117F43": ("C2", "C2-08", "卵巣腫瘍〈総論〉"),
    "117F44": ("B3", "B3-05", "睡眠障害〈総論〉"),
    "117F45": ("A1", "A1-08", "深部静脈血栓症"),
    "117F46": ("A2", "A2-02", "食道静脈瘤"),
    "117F47": ("A6", "A6-03", "甲状腺良性腫瘍〈総論〉"),
    "117F48": ("B1", "B1-09", "骨腫瘍〈総論〉"),
    "117F49": ("A2", "A2-04", "感染性腸炎"),
    "117F50": ("A4", "A4-08", "気管支喘息"),
    "117F51": ("A3", "A3-02", "B型肝炎"),
    "117F52": ("C3", "C3-07", "Hirschsprung病"),
    "117F53": ("B1", "B1-09", "骨腫瘍〈総論〉"),
    "117F54": ("A7", "A7-04", "血栓性血小板減少性紫斑病（TTP）"),
    "117F55": ("A8", "A8-03", "脳血管障害"),
    "117F56": ("C1", "C1-02", "妊娠高血圧症候群（PIH）"),
    "117F57": ("A4", "A4-05", "間質性肺炎〈総論〉"),
    "117F58": ("A2", "A2-04", "イレウス〈総論〉"),
    "117F59": ("A6", "A6-05", "原発性アルドステロン症"),
    "117F60": ("B2", "B2-11", "悪性黒色腫"),
    "117F61": ("A3", "A3-02", "ウイルス性肝炎〈総論〉"),
    "117F62": ("A9", "A9-05", "ツツガムシ病"),
    "117F63": ("A5", "A5-02", "糸球体腎炎〈総論〉"),
    "117F64": ("C3", "C3-06", "染色体異常〈総論〉"),
    "117F65": ("A2", "A2-03", "胃潰瘍"),
    "117F66": ("A8", "A8-03", "脳出血〈総論〉"),
    "117F67": ("A1", "A1-09", "高血圧症〈総論〉"),
    "117F68": ("C2", "C2-05", "外陰腟カンジダ症"),
    "117F69": ("A7", "A7-02", "再生不良性貧血（AA）"),
    "117F70": ("A8", "A8-06", "筋萎縮性側索硬化症（ALS）"),
    "117F71": ("A4", "A4-04", "慢性閉塞性肺疾患（COPD）"),
    "117F72": ("C1", "C1-02", "異所性妊娠"),
    "117F73": ("B1", "B1-08", "偽痛風"),
    "117F74": ("A3", "A3-03", "急性胆囊炎"),
    "117F75": ("A5", "A5-12", "前立腺肥大症〈BPH〉"),
}


# ── 削除問題 ──────────────────────────────────────────────────────────────────
DELETED_QIDS = {"117A075", "117C015", "117C060", "117D038", "117D053", "117F042"}

def normalize_qid(block: str, num: int) -> str:
    return f"117{block}{num:03d}"

def is_deleted(block: str, num: int) -> bool:
    return normalize_qid(block, num) in DELETED_QIDS


# ── 解答キー変換 ──────────────────────────────────────────────────────────────
def get_answer_key(block: str, num: int) -> str:
    """解答JSONのキー: "A001" 形式"""
    return f"{block}{num:03d}"

def parse_format(format_str: str) -> tuple[str, str]:
    """'一般 x 各論' → ('一般', '各論')"""
    parts = format_str.split(' x ')
    if len(parts) == 2:
        return parts[0].strip(), parts[1].strip()
    return format_str.strip(), ""


# ── メインビルド ──────────────────────────────────────────────────────────────
def build_block(block: str) -> dict:
    num_questions = BLOCK_SIZES[block]
    text_path = TEXT_PATHS[block]
    
    with open(text_path, encoding="utf-8") as f:
        text = f.read()
    
    # テキストパース
    parsed_questions = parse_block_text(text, block, num_questions)
    
    # 番号→パース結果のマップ
    parsed_map: dict[int, dict] = {q["num"]: q for q in parsed_questions}
    
    questions = []
    for num in range(1, num_questions + 1):
        qid = f"117{block}{num}"
        ans_key = get_answer_key(block, num)
        meta = meta_raw.get(qid, {})
        
        # 解答
        raw_ans = answers_raw.get(ans_key, "")
        deleted = (raw_ans == "DELETED")
        answer = None if deleted else convert_answer(raw_ans)
        
        # フォーマット
        fmt_str = meta.get("format", "")
        type1, type2 = parse_format(fmt_str)
        
        # 問題テキスト
        parsed = parsed_map.get(num, {})
        stem = parsed.get("stem", "")
        choices = parsed.get("choices", {})
        has_image = parsed.get("has_image", False)
        
        # 答え数
        n_ans = num_answers_from(answer)
        
        # フィールドマッピング
        subject = meta.get("subject", "")
        expected_field = SUBJECT_TO_FIELD.get(subject, "D2")
        
        # 手動マッピングを優先
        if qid in MANUAL_TOPIC_MAP:
            field, subfield, topic = MANUAL_TOPIC_MAP[qid]
        else:
            field, subfield, topic = find_best_topic(meta.get("theme", ""), expected_field)
        
        # topicがNoneの場合はサブフィールドのfallback
        if topic is None:
            subfield = f"{expected_field}-01"
            field = expected_field
            topic = None
        
        q = {
            "num": num,
            "id": qid,
            "exam_year": 117,
            "block": block,
            "stem": stem,
            "choices": choices,
            "answer": answer,
            "format": {
                "type1": type1,
                "type2": type2,
                "num_answers": n_ans,
                "has_image": has_image,
                "is_calculation": False,
                "has_kinki": False,
                "is_deleted": deleted,
            },
            "field": field,
            "subfield": subfield,
            "topic": topic,
            "action": None,
            "knowledge_type": None,
            "explanation": {
                "summary": None,
                "choices": {},
                "background": None,
                "key_point": None,
            }
        }
        questions.append(q)
    
    return {
        "exam_year": 117,
        "block": block,
        "total_questions": num_questions,
        "source": "厚生労働省 第117回医師国家試験",
        "questions": questions,
    }


# ── バリデーション ────────────────────────────────────────────────────────────
def validate(block_data: dict) -> list[str]:
    errors = []
    block = block_data["block"]
    expected = BLOCK_SIZES[block]
    questions = block_data["questions"]
    
    # 1. 問題数チェック
    if len(questions) != expected:
        errors.append(f"Block {block}: {len(questions)} questions (expected {expected})")
    
    # 2. 解答チェック
    for q in questions:
        num = q["num"]
        qid_short = f"117{block}{num}"
        ans_key = get_answer_key(block, num)
        raw_ans = answers_raw.get(ans_key, "")
        if raw_ans == "DELETED":
            if not q["format"]["is_deleted"]:
                errors.append(f"{qid_short}: should be deleted")
            if q["answer"] is not None:
                errors.append(f"{qid_short}: deleted question should have null answer")
        else:
            expected_ans = convert_answer(raw_ans)
            if q["answer"] != expected_ans:
                errors.append(f"{qid_short}: answer mismatch: {q['answer']} != {expected_ans}")
    
    # 3. subfield/topicバリデーション
    for q in questions:
        if q["format"]["is_deleted"]:
            continue
        sub = q["subfield"]
        topic = q["topic"]
        if sub and topic:
            # subがtaxonomyに存在するか
            field_from_sub = sub.split('-')[0]
            cat = taxonomy["categories"].get(field_from_sub)
            if cat is None:
                errors.append(f"117{block}{q['num']}: field {field_from_sub} not in taxonomy")
                continue
            sub_data = cat["subcategories"].get(sub)
            if sub_data is None:
                errors.append(f"117{block}{q['num']}: subfield {sub} not in taxonomy")
                continue
            if topic not in sub_data["topics"]:
                errors.append(f"117{block}{q['num']}: topic '{topic}' not in {sub}")
        # 4. field == subfield prefix
        if sub:
            expected_field = sub.split('-')[0]
            if q["field"] != expected_field:
                errors.append(f"117{block}{q['num']}: field {q['field']} != subfield prefix {expected_field}")
    
    return errors


# ── エントリーポイント ─────────────────────────────────────────────────────────
all_errors = []
for block in "ABCDEF":
    print(f"Building block {block}...", flush=True)
    data = build_block(block)
    
    # バリデーション
    errs = validate(data)
    if errs:
        print(f"  ERRORS in block {block}:")
        for e in errs:
            print(f"    {e}")
        all_errors.extend(errs)
    else:
        print(f"  OK ({data['total_questions']} questions)")
    
    # 出力
    out_path = OUTPUT_DIR / f"117{block}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  Written: {out_path}")

print("\n" + "="*60)
if all_errors:
    print(f"FAILED: {len(all_errors)} error(s)")
    for e in all_errors:
        print(f"  {e}")
    sys.exit(1)
else:
    print("ALL BLOCKS: PASSED")
