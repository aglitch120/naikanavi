#!/usr/bin/env python3
"""
extract_118_all.py
第118回医師国家試験 全6ブロック（A-F）の問題データを生成する。
"""

import json
import re
import sys
from pathlib import Path

# ── パス設定 ──────────────────────────────────────────────────────────────────
REPO = Path(__file__).resolve().parents[2]
TAXONOMY_PATH = REPO / "docs/source-data/iwor-theme-taxonomy.json"
ANSWERS_PATH  = Path("/tmp/118_answers.json")
META_PATH     = Path("/tmp/118_medu4_meta.json")
TEXT_PATHS = {
    "A": Path("/tmp/118a_text.txt"),
    "B": Path("/tmp/118b_text.txt"),
    "C": Path("/tmp/118c_text.txt"),
    "D": Path("/tmp/118d_text.txt"),
    "E": Path("/tmp/118e_text.txt"),
    "F": Path("/tmp/118f_text.txt"),
}
OUTPUT_DIR = REPO / "data/questions/118"
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
# topic_string → (subfield_code, topic_string)
TOPIC_LOOKUP: dict[str, tuple[str, str]] = {}
# base名（括弧除去）→ (subfield_code, topic_string)
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
    # 1. theme中の〈...〉内容を抽出してキーワードにする
    angle_match = re.findall(r'〈([^〉]+)〉', theme)
    
    # 2. 完全一致
    if theme in TOPIC_LOOKUP:
        sub, t = TOPIC_LOOKUP[theme]
        field = sub.split('-')[0]
        return field, sub, t
    
    # 3. base名で完全一致
    base_theme = strip_parens(theme)
    if base_theme in BASE_LOOKUP:
        sub, t = BASE_LOOKUP[base_theme]
        field = sub.split('-')[0]
        return field, sub, t
    
    # 4. topic名がthemeに含まれる（expected_fieldを優先）
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
    
    # 5. themeの単語がtopicに含まれる（expected_field限定）
    for topic, (sub, t) in TOPIC_LOOKUP.items():
        fld = sub.split('-')[0]
        if fld == expected_field:
            for kw in angle_match:
                if kw in topic or topic in kw:
                    return fld, sub, t
    
    # 6. themeの先頭20文字で検索
    head = theme[:20]
    for topic, (sub, t) in TOPIC_LOOKUP.items():
        if any(c in topic for c in head if len(c) > 1):
            pass  # Too broad, skip
    
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
    "11.産婦人科":     "C1",   # C1 or C2 depending on context
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
    "24.公衆衛生":     "D2",
    "25.総論的事項":   "D3",
    "26.必修的事項":   "D2",
    "27.基礎医学":     "D3",
}

# ── 答え変換 ──────────────────────────────────────────────────────────────────
def convert_answer(raw: str):
    """
    'B' → 'b'
    'BE' → ['b','e']
    '600' → '600'
    '9.6' → '9.6'
    """
    if not raw:
        return None
    # 数値答え
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
    """
    'ａ　テキスト' → ('a', 'テキスト')
    """
    line = line.translate(FULLWIDTH_MAP)
    m = re.match(r'^([abcde])[　\s]+(.+)', line.strip())
    if m:
        return m.group(1), m.group(2).strip()
    return None, None

def parse_block_text(text: str, block: str, num_questions: int) -> list[dict]:
    """
    ブロックテキストを問題リストに変換。
    各問題: {num, stem, choices, has_image}
    """
    lines = text.splitlines()
    
    # ページヘッダーを除去し、空行を整理
    # 試験本文の開始ラインを推定: 連続する空白DKIXページ(ページ間隔≤3)の後から始まる
    clean_lines = []
    dkix_after_clean: list[int] = []  # DKIX除去後のclean_lines長リスト

    for line in lines:
        stripped = line.strip()
        if PAGE_HEADER_RE.match(stripped):
            dkix_after_clean.append(len(clean_lines))
            continue
        if re.match(r'^\d{3}$', stripped):  # standalone 3-digit numbers (page markers)
            continue
        clean_lines.append(stripped)

    # 試験本文開始インデックスを特定:
    # 「連続する2枚の空白DKIXページ（clean_lines上で間隔が3以下）」の後に来る位置
    exam_start_clean_idx = 0
    for k in range(len(dkix_after_clean) - 2):
        gap1 = dkix_after_clean[k+1] - dkix_after_clean[k]
        gap2 = dkix_after_clean[k+2] - dkix_after_clean[k+1]
        if gap1 <= 3 and gap2 <= 3:
            # k番目のDKIXの後が試験開始付近
            exam_start_clean_idx = dkix_after_clean[k]
            break
    
    # 問題の開始を探す
    # パターン: 行頭に問題番号 (standalone or inline)
    questions = []
    
    # 全テキストを結合して正規表現で問題を抽出
    full_text = '\n'.join(clean_lines)
    
    # 問題番号パターン: 行頭または行中の番号
    # " 1 " or "\n1\n" or "  1 無症状..."
    # 問題区切りは番号1-numで探す
    
    # 問題テキストを抽出するためのアプローチ:
    # 各問題番号の位置を特定してスライスする
    
    # 問題番号の位置を探す — 全候補を収集し、選択肢(ａ〜ｅ)が後続する行を優先
    # (試験問題より前の説明文に同じ数字が出るため)
    CHOICE_CHARS = set('abcde')  # 全角ａｂｃｄｅ正規化後
    full_clean = '\n'.join(clean_lines)

    def has_choices_nearby(line_idx: int, window: int = 20) -> bool:
        """line_idx以降window行内に選択肢行(a/b/c/d/eで始まる行)があるか"""
        count = 0
        for j in range(line_idx, min(line_idx + window, len(clean_lines))):
            ln = clean_lines[j].translate(FULLWIDTH_MAP)
            if re.match(r'^[abcde][　\s]', ln):
                count += 1
        return count >= 2  # 少なくとも2つの選択肢

    q_positions_all: dict[int, list[tuple[int, bool]]] = {}  # num → [(line_idx, inline)]

    # 測定値・単位で始まる行は問題番号行ではない
    # 注: 「正常の〜」のような日本語説明文は除外しない
    UNIT_START_RE = re.compile(
        r'^(?:mm|cm|mg|mL|μg|μL|μm|ng|pg|kg|g/|dL|U/L|%|×|＋|－|±|SD）|'
        r'以下）|以上）|未満）|超）|SpO2|℃|/分|\d+\.\d+|\d+,\d+|\d+（|\d+　)'
    )

    # 年齢・期間で始まるパターン（「19 歳の」など）は問題番号行ではない
    AGE_START_RE = re.compile(r'^\d+\s*(?:歳|か月|週|日|分|秒|時間)(?:の|。|、|，)')

    for i, line in enumerate(clean_lines):
        # 単独の問題番号行 → has_choices_nearbyで本物か確認
        if re.match(r'^\d+$', line):
            num = int(line)
            if 1 <= num <= num_questions:
                # 選択肢が後続する場合のみ採用（テーブル値等を除外）
                # window=25: 長い臨床問題でも選択肢は25行以内に現れる
                if has_choices_nearby(i, window=25):
                    q_positions_all.setdefault(num, []).append((i, False))
        # "N 問題文..." の形式 (番号+スペース+テキスト)
        m = re.match(r'^(\d+)\s+(.+)', line)
        if m:
            num = int(m.group(1))
            rest = m.group(2)
            if 1 <= num <= num_questions and not UNIT_START_RE.match(rest):
                # 年齢パターン（「19 歳の」等）は除外
                full_rest = f'{num} {rest}'
                if AGE_START_RE.match(full_rest):
                    continue
                q_positions_all.setdefault(num, []).append((i, True))

    # 各番号について、exam_start_clean_idx以降で選択肢が後続する候補を優先
    q_positions = []
    for num in range(1, num_questions + 1):
        if num in q_positions_all:
            candidates = q_positions_all[num]
            # まず試験開始位置以降の候補だけ抽出
            after_start = [(li, inl) for (li, inl) in candidates if li >= exam_start_clean_idx]
            search_pool = after_start if after_start else candidates
            # 選択肢が後続する最初の候補を探す
            best = None
            for (line_idx, inline) in search_pool:
                if has_choices_nearby(line_idx):
                    best = (line_idx, inline)
                    break
            # 見つからなければ試験開始以降の最初の候補
            if best is None:
                best = search_pool[0]
            q_positions.append((best[0], num, best[1]))

    q_positions.sort(key=lambda x: x[0])

    # 後処理: スパンが短すぎる（< 5行）問題は複数候補から次の候補に切り替える
    # これによりテーブル内の数値が問題番号と誤検出されるケースを修正
    changed = True
    while changed:
        changed = False
        for idx in range(len(q_positions) - 1):
            pos, num, inline = q_positions[idx]
            next_pos = q_positions[idx+1][0]
            span = next_pos - pos
            if span < 5:
                # このnumの次の候補を探す
                candidates = q_positions_all.get(num, [])
                after_start = [(li, inl) for (li, inl) in candidates if li >= exam_start_clean_idx]
                search_pool = after_start if after_start else candidates
                # 現在のposより後でhas_choices_nearbyな候補
                better = None
                for (line_idx, inl2) in search_pool:
                    if line_idx > pos and has_choices_nearby(line_idx):
                        better = (line_idx, inl2)
                        break
                if better:
                    q_positions[idx] = (better[0], num, better[1])
                    q_positions.sort(key=lambda x: x[0])
                    changed = True
                    break  # restart loop

    # 各問題を抽出
    for idx, (pos, num, inline) in enumerate(q_positions):
        end_pos = q_positions[idx+1][0] if idx+1 < len(q_positions) else len(clean_lines)
        
        # この問題の行を取得
        q_lines = clean_lines[pos:end_pos]
        
        # 番号行を除去
        if not inline:
            q_lines = q_lines[1:]  # 番号行をスキップ
        else:
            # 番号を除去
            q_lines[0] = re.sub(r'^\d+\s+', '', q_lines[0])
        
        # 選択肢を分離
        choices = {}
        stem_lines = []
        has_image = False
        choice_started = False
        
        i2 = 0
        while i2 < len(q_lines):
            line = q_lines[i2]
            
            # 別冊参照
            if '別冊' in line and 'No.' in line:
                has_image = True
                i2 += 1
                continue
            
            # 空行スキップ（選択肢終了後）
            if not line:
                i2 += 1
                continue
            
            # 選択肢チェック
            letter, choice_text = normalize_choice_line(line)
            if letter and letter in 'abcde':
                choice_started = True
                # 次の行が選択肢の続きの場合（改行された選択肢）
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
        
        # stem構築
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
# themeからの自動マッピングが難しいもの / 完全に確定できるもの
MANUAL_TOPIC_MAP: dict[str, tuple[str, str, str]] = {
    # 118A — correct subfield/topic per taxonomy
    "118A1":  ("A1", "A1-07", "大動脈瘤"),
    "118A2":  ("D3", "D3-04", "高齢者の生理〈総論〉"),  # 入浴事故予防 → 老年医学総論
    "118A3":  ("A6", "A6-13", "ビタミンD欠乏症"),
    "118A4":  ("A1", "A1-03", "冠攣縮性狭心症"),
    "118A5":  ("A4", "A4-05", "特発性肺線維症（IPF）"),
    "118A6":  ("A3", "A3-02", "肝細胞癌〈総論〉"),
    "118A7":  ("D2", "D2-12", "たばこ対策"),
    "118A8":  ("A2", "A2-04", "肛門周囲膿瘍"),
    "118A9":  ("A6", "A6-13", "神経性過食症"),
    "118A10": ("A9", "A9-03", "梅毒"),
    "118A11": ("C2", "C2-07", "腹圧性尿失禁"),
    "118A12": ("B5", "B5-02", "難聴〈総論〉"),
    "118A13": ("A2", "A2-04", "イレウス〈総論〉"),
    "118A14": ("A10", "A10-04", "関節リウマチ（RA）"),  # 関節外病変
    "118A15": ("A7", "A7-03", "急性白血病〈総論〉"),
    "118A16": ("A5", "A5-12", "精巣腫瘍"),
    "118A17": ("B2", "B2-06", "Kaposi水痘様発疹症"),  # B2-06に含まれる
    "118A18": ("B4", "B4-06", "網膜中心動脈閉塞症"),
    "118A19": ("A4", "A4-09", "肺血栓塞栓症（PTE）"),
    "118A20": ("B2", "B2-11", "悪性黒色腫"),
    "118A21": ("A4", "A4-14", "胸膜炎〈総論〉"),  # 横隔膜弛緩症→A2-05にあるが主題はA4-14
    "118A22": ("A1", "A1-06", "感染性心内膜炎（IE）"),
    "118A23": ("A6", "A6-04", "原発性副甲状腺機能亢進症"),
    "118A24": ("A3", "A3-03", "胆石症"),  # 胆嚢ポリープはA3-03胆石症に含まれる
    "118A25": ("C1", "C1-03", "合併症妊娠〈総論〉"),  # 母子感染
    "118A26": ("C2", "C2-08", "子宮腺筋症"),
    "118A27": ("A4", "A4-07", "Pancoast症候群"),
    "118A28": ("A2", "A2-05", "食道裂孔ヘルニア"),
    "118A29": ("C2", "C2-04", "子宮の炎症〈総論〉"),  # 卵管炎=骨盤内炎症性疾患
    "118A30": ("B3", "B3-04", "アルコール依存症〈総論〉"),
    "118A31": ("D2", "D2-09", "チーム医療〈総論〉"),
    "118A32": ("A7", "A7-02", "再生不良性貧血（AA）"),
    "118A33": ("B5", "B5-07", "Warthin腫瘍"),
    "118A34": ("B4", "B4-05", "ぶどう膜炎〈総論〉"),  # 裂孔原性網膜剥離→B4-05に最近接
    "118A35": ("A3", "A3-02", "C型肝炎〈総論〉"),
    "118A36": ("A6", "A6-11", "高カリウム血症"),
    "118A37": ("D1", "D1-08", "コンパートメント症候群"),
    "118A38": ("B4", "B4-04", "結膜炎〈総論〉"),  # 結膜下出血
    "118A39": ("D3", "D3-04", "高齢者の病態〈総論〉"),
    "118A40": ("A4", "A4-15", "乳癌"),
    "118A41": ("C2", "C2-08", "子宮肉腫"),
    "118A42": ("A8", "A8-12", "髄膜腫"),
    "118A43": ("B5", "B5-06", "アレルギー性鼻炎"),
    "118A44": ("A5", "A5-02", "糸球体腎炎〈総論〉"),
    "118A45": ("B2", "B2-05", "掌蹠膿疱症"),
    "118A46": ("A4", "A4-14", "胸膜中皮腫"),
    "118A47": ("B3", "B3-05", "レム睡眠行動障害"),
    "118A48": ("A9", "A9-08", "マラリア"),
    "118A49": ("A2", "A2-02", "食道アカラシア"),  # Boerhaave症候群→食道破裂→A2-02最近接
    "118A50": ("B1", "B1-07", "総腓骨神経麻痺"),
    "118A51": ("A1", "A1-02", "発作性上室頻拍（PSVT）"),
    "118A52": ("A6", "A6-12", "Marfan症候群"),
    "118A53": ("A4", "A4-15", "乳癌"),
    "118A54": ("C3", "C3-12", "川崎病（MCLS）"),
    "118A55": ("A8", "A8-07", "結核性髄膜炎"),
    "118A56": ("A1", "A1-07", "慢性動脈閉塞症〈総論〉"),
    "118A57": ("A2", "A2-03", "急性胃粘膜病変"),  # 消化管穿孔
    "118A58": ("C3", "C3-16", "Werdnig-Hoffmann病"),
    "118A59": ("A7", "A7-04", "特発性血小板減少性紫斑病（ITP）"),
    "118A60": ("A1", "A1-09", "高血圧緊急症"),
    "118A61": ("C1", "C1-01", "妊娠徴候・妊娠反応"),
    "118A62": ("A8", "A8-10", "West症候群"),
    "118A63": ("C3", "C3-14", "百日咳"),  # 百日咳=小児感染症
    "118A64": ("A5", "A5-01", "乏尿"),  # 急性腎障害の鑑別
    "118A65": ("B1", "B1-12", "リハビリテーション〈総論〉"),
    "118A66": ("A8", "A8-06", "Parkinson病"),  # ALS → 変性疾患
    "118A67": ("C1", "C1-01", "胎児超音波"),  # 胎児心拍数モニタリング
    "118A68": ("C3", "C3-07", "先天性十二指腸閉鎖症・狭窄症"),  # 漏斗胸→C3-07最近接
    "118A69": ("A3", "A3-03", "胆石症"),
    "118A70": ("A6", "A6-03", "Basedow病"),
    "118A71": ("A9", "A9-06", "カンジダ症〈総論〉"),
    "118A72": ("B2", "B2-03", "結節性紅斑"),
    "118A73": ("A6", "A6-02", "視床下部疾患-下垂体疾患〈総論〉"),  # 高プロラクチン血症
    "118A74": ("A9", "A9-07", "伝染性単核症"),  # EBウイルス感染症
    "118A75": ("D2", "D2-12", "たばこ対策"),

    # 118B
    "118B1":  ("D2", "D2-05", "医師法〈総論〉"),
    "118B2":  ("A5", "A5-09", "泌尿器の解剖〈総論〉"),  # 腹部骨盤部触診
    "118B3":  ("A8", "A8-10", "熱性けいれん"),  # 2歳児けいれん
    "118B4":  ("A2", "A2-05", "腹膜炎〈総論〉"),
    "118B5":  ("D3", "D3-06", "身体診察〈総論〉"),
    "118B6":  ("D2", "D2-08", "医療安全管理"),
    "118B7":  ("B1", "B1-01", "骨折〈総論〉"),  # 膝関節MRI
    "118B8":  ("D3", "D3-06", "頭頸部診察"),
    "118B9":  ("D2", "D2-02", "介入研究"),  # RCT → 介入研究
    "118B10": ("B1", "B1-12", "リハビリテーション〈総論〉"),  # B10 リハビリ
    "118B11": ("D2", "D2-02", "疫学的因果関係"),
    "118B12": ("A4", "A4-04", "慢性閉塞性肺疾患（COPD）"),
    "118B13": ("D1", "D1-08", "熱傷〈総論〉"),
    "118B14": ("A6", "A6-08", "脂質異常症（高脂血症）"),
    "118B15": ("D3", "D3-04", "高齢者の病態〈総論〉"),
    "118B16": ("C3", "C3-03", "体液区分"),
    "118B17": ("D2", "D2-02", "感度・特異度・尤度比"),
    "118B18": ("D2", "D2-06", "死亡診断書・死体検案書"),
    "118B19": ("D2", "D2-04", "患者医師関係"),
    "118B20": ("B3", "B3-03", "統合失調症"),
    "118B21": ("D3", "D3-05", "輸液〈総論〉"),  # 術前診察 → 輸液/周術期
    "118B22": ("A8", "A8-01", "脳脊髄の構造"),  # 身体診察所見と疾患
    "118B23": ("D2", "D2-08", "医療安全管理"),
    "118B24": ("B3", "B3-02", "社会不安障害"),
    "118B25": ("D2", "D2-04", "インフォームド・コンセント"),
    "118B26": ("D2", "D2-04", "患者医師関係"),
    "118B27": ("D2", "D2-07", "緩和ケアの概念"),
    "118B28": ("D2", "D2-04", "患者医師関係"),
    "118B29": ("A9", "A9-02", "結核菌"),
    "118B30": ("D2", "D2-01", "行動変容・意識変容"),
    "118B31": ("C3", "C3-05", "正常新生児"),
    "118B32": ("D3", "D3-04", "フレイル"),
    "118B33": ("D3", "D3-06", "診察のあり方"),  # 経管栄養管理
    "118B34": ("B4", "B4-09", "閉塞隅角緑内障"),
    "118B35": ("A4", "A4-13", "縦隔炎"),  # 気胸への直接治療
    "118B36": ("D3", "D3-06", "診察のあり方"),  # 創縫合
    "118B37": ("A9", "A9-03", "梅毒"),
    "118B38": ("D2", "D2-15", "国際生活機能分類（ICF）"),
    "118B39": ("A5", "A5-03", "原発性ネフローゼ症候群〈総論〉"),
    "118B40": ("C1", "C1-04", "正常分娩"),  # HELLP症候群
    "118B41": ("A3", "A3-02", "ウイルス性肝炎〈総論〉"),  # 肝性脳症
    "118B42": ("A3", "A3-02", "ウイルス性肝炎〈総論〉"),  # 肝性脳症治療
    "118B43": ("A8", "A8-03", "脳血管障害"),  # 急性硬膜下血腫
    "118B44": ("A8", "A8-03", "脳出血〈総論〉"),  # 急性硬膜下血腫確定
    "118B45": ("A1", "A1-07", "大動脈解離"),
    "118B46": ("A1", "A1-07", "大動脈解離"),
    "118B47": ("D2", "D2-09", "医療法〈総論〉"),
    "118B48": ("D2", "D2-09", "チーム医療〈総論〉"),
    "118B49": ("A6", "A6-11", "高カルシウム血症"),
    "118B50": ("A6", "A6-11", "高カルシウム血症"),

    # 118C
    "118C1":  ("B6", "B6-01", "放射線総論"),  # 好酸球増加 → 放射線総論（科目medu4は放射線）
    "118C2":  ("D2", "D2-07", "緩和ケアの概念"),
    "118C3":  ("C1", "C1-01", "正常妊娠"),
    "118C4":  ("D2", "D2-09", "医療法〈総論〉"),
    "118C5":  ("D2", "D2-06", "死産証書・死胎検案書"),
    "118C6":  ("A2", "A2-01", "消化管の解剖〈総論〉"),
    "118C7":  ("A3", "A3-01", "肝・胆・膵の検査〈総論〉"),  # 脾腫の原因
    "118C8":  ("D2", "D2-21", "振動障害"),
    "118C9":  ("D2", "D2-21", "産業医"),  # 在宅勤務
    "118C10": ("D2", "D2-15", "ノーマライゼーションの概念〈総論〉"),  # 特別支援学校
    "118C11": ("D2", "D2-12", "健康増進法"),
    "118C12": ("A8", "A8-01", "神経病巣"),
    "118C13": ("B3", "B3-03", "統合失調症"),
    "118C14": ("C3", "C3-03", "精神運動発達"),
    "118C15": ("D2", "D2-09", "特定機能病院・地域医療支援病院"),
    "118C16": ("C2", "C2-08", "子宮頸部上皮内腫瘍"),  # ワクチン予防の癌
    "118C17": ("A2", "A2-01", "消化管の内視鏡検査"),
    "118C18": ("D3", "D3-04", "高齢者総合機能評価（CGA）"),
    "118C19": ("D2", "D2-14", "介護保険の居宅サービス（介護予防サービス）"),  # 訪問診療
    "118C20": ("D2", "D2-20", "学校での健康診断"),  # 職業性白内障
    "118C21": ("B5", "B5-01", "内耳の解剖"),  # カロリックテスト
    "118C22": ("D2", "D2-03", "標準化死亡比（SMR）"),
    "118C23": ("A4", "A4-01", "スパイロメトリ"),  # 肺気量→スパイロメトリ
    "118C24": ("D2", "D2-16", "精神保健福祉法"),  # 医療保護入院
    "118C25": ("A6", "A6-02", "視床下部疾患-下垂体疾患〈総論〉"),  # 乳汁分泌
    "118C26": ("C3", "C3-06", "染色体異常〈総論〉"),
    "118C27": ("D2", "D2-04", "患者医師関係"),
    "118C28": ("A6", "A6-07", "糖尿病（DM）〈総論〉"),
    "118C29": ("A7", "A7-01", "骨髄，リンパ組織，脾臓"),  # 性差がある基準値
    "118C30": ("D2", "D2-17", "感染症法〈総論〉"),  # ワクチン延期
    "118C31": ("D2", "D2-14", "要介護認定"),
    "118C32": ("C1", "C1-01", "羊水検査，出生前診断"),
    "118C33": ("D2", "D2-13", "新生児マススクリーニング"),
    "118C34": ("A4", "A4-01", "呼吸器の症候〈総論〉"),
    "118C35": ("A5", "A5-13", "尿路結石〈総論〉"),
    "118C36": ("A5", "A5-12", "膀胱腫瘍"),
    "118C37": ("A4", "A4-11", "睡眠時無呼吸症候群（SAS）"),  # 人工呼吸器 → SAS(A4-11)
    "118C38": ("C3", "C3-05", "新生児黄疸"),
    "118C39": ("A7", "A7-02", "鉄欠乏性貧血（IDA）"),
    "118C40": ("D2", "D2-09", "チーム医療〈総論〉"),  # トリアージ → D2-09
    "118C41": ("D2", "D2-17", "感染症サーベイランス〈総論〉"),
    "118C42": ("A6", "A6-13", "神経性食思不振症"),
    "118C43": ("C1", "C1-04", "正常分娩"),  # 子宮破裂
    "118C44": ("A4", "A4-03", "インフルエンザ〈総論〉"),  # インフルエンザ感染症
    "118C45": ("C1", "C1-04", "正常分娩"),  # 妊娠高血圧腎症
    "118C46": ("A4", "A4-11", "睡眠時無呼吸症候群（SAS）"),
    "118C47": ("A4", "A4-07", "原発性肺癌"),
    "118C48": ("D2", "D2-21", "産業医"),
    "118C49": ("A6", "A6-07", "糖尿病（DM）〈総論〉"),
    "118C50": ("D1", "D1-08", "腎外傷"),
    "118C51": ("B3", "B3-06", "学習障害（LD）"),
    "118C52": ("D2", "D2-01", "予防医学（一次・二次・三次）"),
    "118C53": ("D2", "D2-02", "疫学的因果関係"),
    "118C54": ("C2", "C2-05", "腟トリコモナス症"),
    "118C55": ("C1", "C1-04", "正常分娩"),
    "118C56": ("D2", "D2-22", "水質汚濁"),
    "118C57": ("D2", "D2-06", "診療録（カルテ）"),  # 解剖の種類
    "118C58": ("C3", "C3-13", "ビタミンK欠乏症"),
    "118C59": ("D1", "D1-08", "熱傷〈総論〉"),  # 熱中症
    "118C60": ("A4", "A4-07", "原発性肺癌"),
    "118C61": ("A4", "A4-11", "睡眠時無呼吸症候群（SAS）"),  # 人工呼吸器長期
    "118C62": ("D2", "D2-07", "緩和ケアの概念"),
    "118C63": ("D2", "D2-02", "尤度比，前後確率"),
    "118C64": ("A2", "A2-01", "消化管の内視鏡検査"),
    "118C65": ("A2", "A2-01", "消化管の内視鏡検査"),
    "118C66": ("D1", "D1-08", "腹腔内出血"),
    "118C67": ("D1", "D1-08", "脾破裂"),
    "118C68": ("D1", "D1-08", "腹部外傷〈総論〉"),
    "118C69": ("A8", "A8-04", "Lewy小体型認知症"),
    "118C70": ("A8", "A8-04", "Lewy小体型認知症"),
    "118C71": ("D2", "D2-07", "緩和ケアの概念"),  # ACP
    "118C72": ("A6", "A6-07", "高浸透圧高血糖症候群"),
    "118C73": ("A6", "A6-07", "糖尿病（DM）〈総論〉"),
    "118C74": ("A6", "A6-07", "高浸透圧高血糖症候群"),
    "118C75": ("A5", "A5-01", "腎・泌尿器の解剖〈総論〉"),  # CCr計算

    # 118D
    "118D1":  ("B5", "B5-02", "前庭神経炎"),
    "118D2":  ("A9", "A9-05", "リケッチア感染症〈総論〉"),  # エボラ→A9-05（出血熱）
    "118D3":  ("D1", "D1-01", "食中毒〈総論〉"),  # 除細動 → D1-01
    "118D4":  ("B3", "B3-06", "チック〈総論〉"),
    "118D5":  ("A2", "A2-05", "ヘルニア〈総論〉"),
    "118D6":  ("A5", "A5-14", "膀胱炎"),  # 尿路感染症
    "118D7":  ("A5", "A5-01", "腎・泌尿器の解剖〈総論〉"),  # 透析
    "118D8":  ("A4", "A4-11", "睡眠時無呼吸症候群（SAS）"),  # ARDS → A4-11最近接
    "118D9":  ("A3", "A3-03", "胆石症"),  # PSC
    "118D10": ("B4", "B4-04", "角結膜障害"),  # 眼窩吹き抜け骨折
    "118D11": ("A10", "A10-02", "重症複合型免疫不全症（SCID）"),  # SCID
    "118D12": ("A5", "A5-01", "乏尿"),  # CKD重症度分類
    "118D13": ("A1", "A1-03", "急性心筋梗塞（AMI）"),
    "118D14": ("A5", "A5-12", "前立腺癌"),
    "118D15": ("D3", "D3-04", "加齢変化"),  # 骨粗鬆症骨折
    "118D16": ("A8", "A8-03", "くも膜下出血"),
    "118D17": ("A2", "A2-05", "食道裂孔ヘルニア"),
    "118D18": ("A6", "A6-02", "視床下部疾患-下垂体疾患〈総論〉"),  # プロラクチノーマ
    "118D19": ("A10", "A10-04", "多発性筋炎・皮膚筋炎（PM／DM）"),
    "118D20": ("A2", "A2-04", "炎症性腸疾患〈総論〉"),  # 偽膜性腸炎
    "118D21": ("B2", "B2-05", "掌蹠膿疱症"),  # 尋常性痤瘡→膿疱症(B2-05)に最近接
    "118D22": ("A3", "A3-02", "肝細胞癌〈総論〉"),
    "118D23": ("B5", "B5-06", "急性副鼻腔炎"),
    "118D24": ("A2", "A2-03", "機能性ディスペプシア"),
    "118D25": ("A1", "A1-09", "高血圧緊急症"),
    "118D26": ("A5", "A5-13", "尿路結石〈総論〉"),  # 膀胱結石
    "118D27": ("A7", "A7-03", "悪性リンパ腫〈総論〉"),
    "118D28": ("A4", "A4-13", "縦隔気腫"),  # 気胸→縦隔疾患
    "118D29": ("C1", "C1-04", "正常分娩"),  # 前置胎盤
    "118D30": ("A3", "A3-04", "膵管内乳頭粘液性腫瘍（IPMN）"),
    "118D31": ("A1", "A1-02", "心室頻拍（VT）"),
    "118D32": ("A1", "A1-01", "慢性心不全"),
    "118D33": ("B3", "B3-02", "適応障害"),
    "118D34": ("B1", "B1-07", "総腓骨神経麻痺"),  # L5/S1椎間板ヘルニア
    "118D35": ("C3", "C3-07", "肥厚性幽門狭窄症"),
    "118D36": ("A6", "A6-03", "甲状腺機能亢進症〈総論〉"),
    "118D37": ("B1", "B1-02", "反復性肩関節脱臼"),  # 腱板断裂
    "118D38": ("A10", "A10-04", "線維筋痛症"),
    "118D39": ("D1", "D1-08", "コンパートメント症候群"),  # 誤飲
    "118D40": ("A5", "A5-03", "続発性ネフローゼ症候群"),  # 膜性腎症
    "118D41": ("A8", "A8-07", "単純ヘルペス脳炎"),
    "118D42": ("A4", "A4-13", "縦隔腫瘍〈総論〉"),
    "118D43": ("C1", "C1-02", "流産〈総論〉"),  # 前期破水
    "118D44": ("A8", "A8-04", "Alzheimer型認知症"),
    "118D45": ("A8", "A8-02", "頭蓋内圧亢進"),  # 不随意運動
    "118D46": ("A6", "A6-07", "糖尿病性昏睡"),  # 腎機能低下抑制
    "118D47": ("A4", "A4-13", "神経原性腫瘍"),
    "118D48": ("C3", "C3-09", "心房中隔欠損症（ASD）"),
    "118D49": ("C2", "C2-06", "卵巣過剰刺激症候群（OHSS）"),
    "118D50": ("A4", "A4-08", "気管支喘息"),
    "118D51": ("C2", "C2-08", "子宮頸部上皮内腫瘍"),
    "118D52": ("A9", "A9-07", "伝染性単核症"),
    "118D53": ("A4", "A4-08", "サルコイドーシス"),
    "118D54": ("A8", "A8-08", "筋強直性ジストロフィー"),  # 顔面神経麻痺→A8-08
    "118D55": ("A9", "A9-01", "感染症総論〈総論〉"),  # 感染対策
    "118D56": ("A8", "A8-06", "球脊髄性筋萎縮症"),
    "118D57": ("A8", "A8-03", "脳血管障害"),  # 慢性硬膜下血腫
    "118D58": ("A3", "A3-04", "慢性膵炎〈総論〉"),
    "118D59": ("B3", "B3-05", "睡眠障害〈総論〉"),  # パーソナリティ障害→B3-05最近接
    "118D60": ("A10", "A10-04", "関節リウマチ（RA）"),  # 強皮症
    "118D61": ("B5", "B5-07", "扁桃周囲炎・周囲膿瘍"),
    "118D62": ("A3", "A3-04", "急性膵炎"),  # WON
    "118D63": ("C3", "C3-05", "新生児の生理学的特徴"),  # アセトン血性嘔吐症
    "118D64": ("A4", "A4-05", "間質性肺炎〈総論〉"),  # 過敏性肺炎
    "118D65": ("A9", "A9-02", "グラム陽性球菌"),  # 猩紅熱
    "118D66": ("A2", "A2-04", "Meckel憩室"),
    "118D67": ("B4", "B4-09", "緑内障〈総論〉"),
    "118D68": ("A6", "A6-03", "甲状腺機能亢進症〈総論〉"),  # Cushing
    "118D69": ("A1", "A1-02", "心房細動（AF）"),
    "118D70": ("A6", "A6-07", "糖尿病ケトアシドーシス（DKA）"),
    "118D71": ("A10", "A10-04", "顕微鏡的多発血管炎（MPA）"),
    "118D72": ("B6", "B6-01", "放射線総論"),
    "118D73": ("A8", "A8-09", "糖尿病性ニューロパチー"),
    "118D74": ("B1", "B1-05", "変形性膝関節症"),
    "118D75": ("D3", "D3-05", "輸液〈総論〉"),

    # 118E
    "118E1":  ("B1", "B1-10", "褥瘡"),
    "118E2":  ("D2", "D2-02", "メタアナリシス（メタ分析）"),
    "118E3":  ("A9", "A9-01", "感染症総論〈総論〉"),  # 感染対策
    "118E4":  ("D2", "D2-12", "たばこ対策"),  # 癌リスク因子
    "118E5":  ("D2", "D2-07", "緩和ケアの概念"),
    "118E6":  ("D2", "D2-03", "患者調査〈総論〉"),  # 患者調査
    "118E7":  ("D3", "D3-06", "頭頸部診察"),
    "118E8":  ("A9", "A9-01", "感染症総論〈総論〉"),  # 感染対策
    "118E9":  ("A3", "A3-03", "胆石症"),  # 閉塞性黄疸
    "118E10": ("D3", "D3-01", "吸入麻酔〈総論〉"),  # ノーベル賞
    "118E11": ("D2", "D2-12", "健康増進法"),  # NCDs
    "118E12": ("D3", "D3-06", "診察のあり方"),  # 腰椎穿刺
    "118E13": ("D2", "D2-04", "インフォームド・コンセント"),
    "118E14": ("A4", "A4-01", "呼吸器の症候〈総論〉"),
    "118E15": ("D2", "D2-05", "医師法〈総論〉"),
    "118E16": ("A4", "A4-15", "乳癌"),
    "118E17": ("A5", "A5-01", "腎・泌尿器の解剖〈総論〉"),
    "118E18": ("D2", "D2-04", "患者医師関係"),
    "118E19": ("B3", "B3-02", "パニック障害"),
    "118E20": ("D3", "D3-06", "身体診察〈総論〉"),
    "118E21": ("D3", "D3-06", "診察のあり方"),
    "118E22": ("D2", "D2-06", "死亡診断書・死体検案書"),
    "118E23": ("D1", "D1-01", "食中毒〈総論〉"),  # CPR
    "118E24": ("A6", "A6-13", "ビタミン欠乏症〈総論〉"),
    "118E25": ("D1", "D1-08", "コンパートメント症候群"),  # 中毒
    "118E26": ("A1", "A1-09", "高血圧緊急症"),
    "118E27": ("C1", "C1-04", "正常分娩"),  # HDP
    "118E28": ("D2", "D2-04", "患者医師関係"),
    "118E29": ("A4", "A4-05", "間質性肺炎〈総論〉"),
    "118E30": ("D1", "D1-01", "食中毒〈総論〉"),  # 蘇生後ケア
    "118E31": ("D2", "D2-04", "患者医師関係"),
    "118E32": ("A1", "A1-03", "急性心筋梗塞（AMI）"),
    "118E33": ("A5", "A5-02", "糸球体腎炎〈総論〉"),  # IgA腎症
    "118E34": ("A4", "A4-13", "胸腺腫"),
    "118E35": ("B1", "B1-12", "言語聴覚士"),
    "118E36": ("D2", "D2-04", "患者医師関係"),
    "118E37": ("A8", "A8-06", "Parkinson病"),
    "118E38": ("A3", "A3-03", "胆石症"),  # 胆囊癌
    "118E39": ("A9", "A9-08", "疥癬"),
    "118E40": ("A8", "A8-10", "てんかん〈総論〉"),
    "118E41": ("A3", "A3-02", "原発性胆汁性胆管炎（PBC）"),
    "118E42": ("B1", "B1-01", "骨折〈総論〉"),
    "118E43": ("A9", "A9-07", "水痘・帯状疱疹"),
    "118E44": ("A1", "A1-04", "僧帽弁狭窄症（MS）"),  # 弁膜症
    "118E45": ("C1", "C1-03", "合併症妊娠〈総論〉"),  # 早産
    "118E46": ("B1", "B1-07", "腕神経叢麻痺"),  # 頸椎症性神経根症
    "118E47": ("A2", "A2-04", "急性虫垂炎"),
    "118E48": ("A4", "A4-13", "胸腺腫"),
    "118E49": ("C3", "C3-09", "Fallot四徴症"),
    "118E50": ("A4", "A4-15", "乳癌"),

    # 118F
    "118F1":  ("A1", "A1-01", "心不全〈総論〉"),
    "118F2":  ("B1", "B1-05", "変形性股関節症"),
    "118F3":  ("A9", "A9-07", "水痘・帯状疱疹"),
    "118F4":  ("A5", "A5-07", "腎梗塞"),  # 腎動脈閉塞→腎梗塞
    "118F5":  ("A6", "A6-07", "糖尿病（DM）〈総論〉"),
    "118F6":  ("D2", "D2-01", "予防医学（一次・二次・三次）"),
    "118F7":  ("A6", "A6-03", "甲状腺機能低下症〈総論〉"),
    "118F8":  ("D3", "D3-05", "輸液〈総論〉"),  # 輸血
    "118F9":  ("A5", "A5-01", "腎・泌尿器の解剖〈総論〉"),
    "118F10": ("A2", "A2-04", "大腸癌〈総論〉"),
    "118F11": ("A3", "A3-01", "肝・胆・膵の検査〈総論〉"),
    "118F12": ("B3", "B3-04", "アルコール依存症〈総論〉"),
    "118F13": ("B6", "B6-03", "放射線治療〈総論〉"),
    "118F14": ("A5", "A5-01", "乏尿"),  # AKI
    "118F15": ("C3", "C3-14", "麻疹"),
    "118F16": ("A2", "A2-02", "胃食道逆流症（GERD）"),
    "118F17": ("A6", "A6-03", "橋本病（Hashimoto病）"),
    "118F18": ("A3", "A3-02", "B型肝炎〈総論〉"),
    "118F19": ("A1", "A1-03", "急性心筋梗塞（AMI）"),
    "118F20": ("A2", "A2-04", "潰瘍性大腸炎"),
    "118F21": ("A8", "A8-05", "多発性硬化症（MS）"),
    "118F22": ("A3", "A3-03", "胆石症"),  # 総胆管結石
    "118F23": ("D2", "D2-06", "死亡診断書・死体検案書"),
    "118F24": ("A9", "A9-02", "非結核性抗酸菌（NTM）"),
    "118F25": ("C3", "C3-14", "百日咳"),
    "118F26": ("D1", "D1-07", "敗血症性ショック"),
    "118F27": ("B5", "B5-06", "慢性副鼻腔炎"),
    "118F28": ("A8", "A8-04", "Alzheimer型認知症"),
    "118F29": ("A4", "A4-07", "肺腺癌"),
    "118F30": ("A2", "A2-03", "急性胃粘膜病変"),
    "118F31": ("A1", "A1-04", "僧帽弁逸脱症（MVP）"),
    "118F32": ("A10", "A10-04", "全身性エリテマトーデス（SLE）"),
    "118F33": ("B2", "B2-01", "アトピー性皮膚炎"),
    "118F34": ("A4", "A4-09", "肺血栓塞栓症（PTE）"),
    "118F35": ("C1", "C1-02", "流産〈総論〉"),
    "118F36": ("A6", "A6-05", "原発性アルドステロン症"),
    "118F37": ("A8", "A8-03", "脳出血〈総論〉"),
    "118F38": ("D1", "D1-07", "敗血症性ショック"),  # 敗血症
    "118F39": ("A8", "A8-09", "Guillain-Barré症候群〈総論〉"),
    "118F40": ("A5", "A5-03", "膜性増殖性腎炎（MPGN）"),
    "118F41": ("A6", "A6-04", "副甲状腺機能亢進症〈総論〉"),
    "118F42": ("B2", "B2-02", "蕁麻疹"),  # 蕁麻疹はB2-02
    "118F43": ("A3", "A3-04", "急性膵炎"),
    "118F44": ("D1", "D1-08", "熱傷〈総論〉"),  # 溺水
    "118F45": ("C3", "C3-12", "川崎病（MCLS）"),
    "118F46": ("A6", "A6-07", "糖尿病性昏睡"),  # 糖尿病性網膜症
    "118F47": ("D1", "D1-07", "敗血症性ショック"),
    "118F48": ("A1", "A1-06", "感染性心内膜炎（IE）"),
    "118F49": ("D1", "D1-07", "敗血症性ショック"),
    "118F50": ("D1", "D1-07", "敗血症性ショック"),
    "118F51": ("A2", "A2-04", "結腸憩室症"),  # 大腸ポリープ
    "118F52": ("A2", "A2-04", "Crohn病"),
    "118F53": ("A4", "A4-05", "特発性肺線維症（IPF）"),
    "118F54": ("B3", "B3-03", "うつ病"),
    "118F55": ("B3", "B3-03", "うつ病"),
    "118F56": ("A3", "A3-02", "非アルコール性脂肪性肝炎（NASH）"),
    "118F57": ("A1", "A1-09", "本態性高血圧症"),
    "118F58": ("A4", "A4-08", "気管支喘息"),
    "118F59": ("A3", "A3-04", "急性膵炎"),
    "118F60": ("A4", "A4-07", "原発性肺癌"),
    "118F61": ("A2", "A2-03", "GIST"),  # GIST → A2-03
    "118F62": ("A1", "A1-10", "心臓腫瘍"),
    "118F63": ("A5", "A5-07", "腎血管性高血圧症〈総論〉"),  # 腎血管筋脂肪腫
    "118F64": ("A6", "A6-03", "甲状腺機能亢進症〈総論〉"),  # 甲状腺腫瘍
    "118F65": ("A8", "A8-05", "多発性硬化症（MS）"),
    "118F66": ("A8", "A8-03", "脳梗塞"),
    "118F67": ("A3", "A3-04", "膵癌"),
    "118F68": ("C2", "C2-08", "子宮内膜症"),
    "118F69": ("A3", "A3-02", "肝細胞癌〈総論〉"),
    "118F70": ("A6", "A6-09", "フェニルケトン尿症"),  # 先天代謝異常
    "118F71": ("A8", "A8-10", "熱性けいれん"),
    "118F72": ("A2", "A2-04", "直腸癌"),
    "118F73": ("A1", "A1-03", "急性冠症候群（ACS）〈総論〉"),
    "118F74": ("A4", "A4-05", "間質性肺炎〈総論〉"),
    "118F75": ("A4", "A4-15", "乳癌"),
}


# ── トピック検証 ──────────────────────────────────────────────────────────────
def validate_topic(field: str, subfield: str, topic: str) -> tuple[str, str, str]:
    """
    (field, subfield, topic) の有効性を検証し、修正版を返す。
    topicがタクソノミーに存在しない場合は最近接topicに差し替える。
    """
    if not subfield or not topic:
        return field, subfield, topic
    
    # subfieldの存在確認
    sub_found = False
    for cat_code, cat in taxonomy["categories"].items():
        if subfield in cat["subcategories"]:
            sub_found = True
            topics = cat["subcategories"][subfield]["topics"]
            # topicの存在確認
            if topic in topics:
                return field, subfield, topic
            # 部分一致で最近接
            base = strip_parens(topic)
            for t in topics:
                if base in t or t in topic or strip_parens(t) == base:
                    return field, subfield, t
            # 先頭topicをフォールバック
            print(f"  [WARN] topic '{topic}' not in {subfield}, using '{topics[0]}'", file=sys.stderr)
            return field, subfield, topics[0]
    
    if not sub_found:
        print(f"  [WARN] subfield '{subfield}' not found in taxonomy", file=sys.stderr)
        # fieldのデフォルトsubfieldを探す
        for cat_code, cat in taxonomy["categories"].items():
            if cat_code == field:
                first_sub = list(cat["subcategories"].keys())[0]
                first_topic = cat["subcategories"][first_sub]["topics"][0]
                return field, first_sub, first_topic
    
    return field, subfield, topic


# ── フォーマットパース ─────────────────────────────────────────────────────────
def parse_format(fmt_str: str, answer) -> dict:
    """
    "一般 x 各論" → {type1: "一般", type2: "各論", ...}
    """
    parts = [p.strip() for p in re.split(r'[x×]', fmt_str)]
    type1 = parts[0] if len(parts) > 0 else "一般"
    type2 = parts[1] if len(parts) > 1 else "各論"
    
    ans = convert_answer(answer)
    num_ans = num_answers_from(ans)
    
    # 計算問題の検出
    is_calc = False
    if isinstance(ans, str) and re.match(r'^[\d.]+$', ans) and not ans.isalpha():
        is_calc = True
    
    return {
        "type1": type1,
        "type2": type2,
        "num_answers": num_ans,
        "has_image": False,  # テキストパース時に設定
        "is_calculation": is_calc,
        "has_kinki": False,
        "is_deleted": False,
    }


# ── 答えキー変換 ───────────────────────────────────────────────────────────────
def answer_key(block: str, num: int) -> str:
    """118A1 → "A001" """
    return f"{block}{num:03d}"


# ── メイン処理 ────────────────────────────────────────────────────────────────
def process_block(block: str) -> dict:
    num_q = BLOCK_SIZES[block]
    text_path = TEXT_PATHS[block]
    
    print(f"\n=== Block {block} ({num_q} questions) ===")
    
    # テキスト読み込み
    with open(text_path, encoding="utf-8") as f:
        text = f.read()
    
    # 問題テキストパース
    parsed = parse_block_text(text, block, num_q)
    parsed_by_num = {q["num"]: q for q in parsed}
    
    print(f"  Parsed {len(parsed)} questions from text")
    
    questions = []
    errors = []
    
    for num in range(1, num_q + 1):
        qid = f"118{block}{num}"
        ans_key = answer_key(block, num)
        raw_answer = answers_raw.get(ans_key, "")
        answer = convert_answer(raw_answer)
        
        meta = meta_raw.get(qid, {})
        fmt_str = meta.get("format", "一般 x 各論")
        subject = meta.get("subject", "25.総論的事項")
        theme = meta.get("theme", "")
        
        expected_field = SUBJECT_TO_FIELD.get(subject, "D3")
        
        # テキストから問題を取得
        pq = parsed_by_num.get(num, {})
        stem = pq.get("stem", "")
        choices = pq.get("choices", {})
        has_image = pq.get("has_image", False)
        
        # 英語問題検出
        is_english = False
        if stem and re.search(r'[A-Za-z]{3,}', stem) and len(re.findall(r'[A-Za-z]', stem)) > len(stem) * 0.3:
            is_english = True
        # テーマに「英語問題」が含まれる
        if '英語問題' in theme:
            is_english = True
        
        # フォーマット
        fmt = parse_format(fmt_str, raw_answer)
        fmt["has_image"] = has_image
        
        # 手動マッピングで field/subfield/topic を決定
        if qid in MANUAL_TOPIC_MAP:
            field, subfield, topic_kw = MANUAL_TOPIC_MAP[qid]
            field, subfield, topic = validate_topic(field, subfield, topic_kw)
        else:
            field = expected_field
            subfield = None
            topic = None
            errors.append(f"  [UNMAPPED] {qid}: {theme}")
        
        if not stem and num <= num_q:
            errors.append(f"  [NO_STEM] {qid}")
        
        # 選択肢の確認
        if len(choices) < 5 and not fmt["is_calculation"]:
            errors.append(f"  [FEW_CHOICES] {qid}: {len(choices)} choices")
        
        q = {
            "num": num,
            "id": qid,
            "exam_year": 118,
            "block": block,
            "stem": stem,
            "choices": choices,
            "answer": answer,
            "format": fmt,
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
    
    # エラー出力
    for e in errors:
        print(e, file=sys.stderr)
    
    return {
        "exam_year": 118,
        "block": block,
        "total_questions": num_q,
        "source": "厚生労働省 第118回医師国家試験",
        "questions": questions,
    }


def validate_block(data: dict) -> list[str]:
    """ブロックデータを検証してエラーリストを返す"""
    errs = []
    block = data["block"]
    expected = BLOCK_SIZES[block]
    
    if len(data["questions"]) != expected:
        errs.append(f"[ERROR] {block}: expected {expected} questions, got {len(data['questions'])}")
    
    for q in data["questions"]:
        qid = q["id"]
        num = q["num"]
        ans_key = answer_key(block, num)
        
        # 答え検証
        raw = answers_raw.get(ans_key)
        if raw is None:
            errs.append(f"[ERROR] {qid}: answer key {ans_key} not found")
        
        # subfield/topic 検証
        sub = q.get("subfield")
        topic = q.get("topic")
        field = q.get("field")
        
        if sub is None:
            errs.append(f"[WARN] {qid}: subfield is None")
            continue
        
        # subfieldがtaxonomyに存在するか
        found_sub = False
        for cat_code, cat in taxonomy["categories"].items():
            if sub in cat["subcategories"]:
                found_sub = True
                if topic and topic not in cat["subcategories"][sub]["topics"]:
                    errs.append(f"[ERROR] {qid}: topic '{topic}' not in {sub}")
                break
        
        if not found_sub:
            errs.append(f"[ERROR] {qid}: subfield '{sub}' not in taxonomy")
        
        # field == subfield prefix
        if sub and field:
            expected_field = sub.split('-')[0]
            if field != expected_field:
                errs.append(f"[WARN] {qid}: field={field} but subfield prefix={expected_field}")
    
    return errs


# ── 実行 ─────────────────────────────────────────────────────────────────────
all_errors = []

for block in ["A", "B", "C", "D", "E", "F"]:
    data = process_block(block)
    
    # 検証
    errs = validate_block(data)
    if errs:
        all_errors.extend(errs)
        for e in errs:
            print(f"  {e}", file=sys.stderr)
    
    # 出力
    out_path = OUTPUT_DIR / f"118{block}.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"  Written: {out_path} ({len(data['questions'])} questions)")

print(f"\n=== Summary ===")
print(f"Total errors/warnings: {len(all_errors)}")
for e in all_errors:
    print(f"  {e}")

if not all_errors:
    print("ALL CHECKS PASSED")
else:
    crit = [e for e in all_errors if '[ERROR]' in e]
    warn = [e for e in all_errors if '[WARN]' in e]
    print(f"  Critical errors: {len(crit)}, Warnings: {len(warn)}")
