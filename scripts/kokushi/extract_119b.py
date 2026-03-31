#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
119B ブロック 50問のデータベース構築
- 問題文・選択肢: 厚労省PDF (tp250428-01b_01.pdf)
- 正答: 厚労省PDF (tp250428-01seitou.pdf)
- format (type1/type2), field: medu4目視確認データ
"""

import json
import re

# ── 正答表 (厚労省公式) ──
ANSWERS = {
    1: "a", 2: "e", 3: "a", 4: "b", 5: "e",
    6: "e", 7: "e", 8: "e", 9: "a", 10: "a",
    11: "e", 12: "b", 13: "d", 14: "a", 15: "e",
    16: "c", 17: "e", 18: "d", 19: "d", 20: "c",
    21: "e", 22: "a", 23: "b", 24: "b", 25: "b",
    26: "a", 27: "d", 28: "d", 29: "e", 30: "c",
    31: "a", 32: "b", 33: "e", 34: "e", 35: "a",
    36: "b", 37: "c", 38: "e", 39: "e", 40: "a",
    41: "b", 42: "c", 43: "b", 44: "d", 45: "e",
    46: "e", 47: "b", 48: "e", 49: "b", 50: "b",
}

# ── medu4メタデータ (目視確認) ──
# format: (type1, type2)
# field mapping: medu4科目 → iwor分類コード
MEDU4_META = {
    1:  {"type1": "一般", "type2": "必修", "field": "B5", "disease": ["鶏眼"]},
    2:  {"type1": "一般", "type2": "必修", "field": "D3", "disease": ["EBM"]},
    3:  {"type1": "一般", "type2": "必修", "field": "D3", "disease": ["在宅医療"]},
    4:  {"type1": "一般", "type2": "必修", "field": "B3", "disease": ["老人性難聴"]},
    5:  {"type1": "一般", "type2": "必修", "field": "D3", "disease": ["地域包括支援センター"]},
    6:  {"type1": "一般", "type2": "必修", "field": "A10", "disease": ["改訂長谷川式簡易知能評価スケール"]},
    7:  {"type1": "一般", "type2": "必修", "field": "D3", "disease": ["共感的対応"]},
    8:  {"type1": "一般", "type2": "必修", "field": "D3", "disease": ["細菌培養検査"]},
    9:  {"type1": "一般", "type2": "必修", "field": "A1", "disease": ["大動脈弁狭窄症"]},
    10: {"type1": "一般", "type2": "必修", "field": "D3", "disease": ["医療保険制度"]},
    11: {"type1": "一般", "type2": "必修", "field": "A7", "disease": ["チアノーゼ"]},
    12: {"type1": "一般", "type2": "必修", "field": "B1", "disease": ["脊柱側弯症"]},
    13: {"type1": "一般", "type2": "必修", "field": "C1", "disease": ["思春期"]},
    14: {"type1": "一般", "type2": "必修", "field": "D3", "disease": ["在宅医療・介護サービス"]},
    15: {"type1": "一般", "type2": "必修", "field": "A3", "disease": ["上部内視鏡検査"]},
    16: {"type1": "一般", "type2": "必修", "field": "B3", "disease": ["急性中耳炎"]},
    17: {"type1": "一般", "type2": "必修", "field": "A5", "disease": ["末期腎不全"]},
    18: {"type1": "一般", "type2": "必修", "field": "D3", "disease": ["動脈採血"]},
    19: {"type1": "一般", "type2": "必修", "field": "B3", "disease": ["めまい"]},
    20: {"type1": "一般", "type2": "必修", "field": "C1", "disease": ["胎動"]},
    21: {"type1": "一般", "type2": "必修", "field": "C1", "disease": ["続発性無月経"]},
    22: {"type1": "一般", "type2": "必修", "field": "D3", "disease": ["個人情報保護"]},
    23: {"type1": "一般", "type2": "必修", "field": "C2", "disease": ["乳児バイタルサイン"]},
    24: {"type1": "一般", "type2": "必修", "field": "D3", "disease": ["臓器移植"]},
    25: {"type1": "一般", "type2": "必修", "field": "D3", "disease": ["保険医登録取消"]},
    26: {"type1": "臨床", "type2": "必修", "field": "D1", "disease": ["心肺停止"]},
    27: {"type1": "臨床", "type2": "必修", "field": "C2", "disease": ["発達評価"]},
    28: {"type1": "臨床", "type2": "必修", "field": "A2", "disease": ["COPD急性増悪"]},
    29: {"type1": "臨床", "type2": "必修", "field": "C1", "disease": ["糖尿病合併妊娠"]},
    30: {"type1": "臨床", "type2": "必修", "field": "D1", "disease": ["敗血症性ショック"]},
    31: {"type1": "臨床", "type2": "必修", "field": "A6", "disease": ["低血糖"]},
    32: {"type1": "臨床", "type2": "必修", "field": "D3", "disease": ["肺水腫"]},
    33: {"type1": "臨床", "type2": "必修", "field": "D3", "disease": ["労働災害"]},
    34: {"type1": "臨床", "type2": "必修", "field": "D3", "disease": ["患者中心性"]},
    35: {"type1": "臨床", "type2": "必修", "field": "A3", "disease": ["急性虫垂炎"]},
    36: {"type1": "臨床", "type2": "必修", "field": "D3", "disease": ["NST"]},
    37: {"type1": "臨床", "type2": "必修", "field": "B4", "disease": ["水腎症"]},
    38: {"type1": "臨床", "type2": "必修", "field": "D3", "disease": ["転倒リスク"]},
    39: {"type1": "臨床", "type2": "必修", "field": "D3", "disease": ["終末期ケア"]},
    40: {"type1": "臨床", "type2": "必修", "field": "A2", "disease": ["上縦隔腫瘍"]},
    41: {"type1": "長文", "type2": "必修", "field": "D3", "disease": ["脂質異常症"]},
    42: {"type1": "長文", "type2": "必修", "field": "D3", "disease": ["行動変容ステージ"]},
    43: {"type1": "長文", "type2": "必修", "field": "A10", "disease": ["頸動脈狭窄"]},
    44: {"type1": "長文", "type2": "必修", "field": "A10", "disease": ["頸動脈狭窄"]},
    45: {"type1": "長文", "type2": "必修", "field": "A3", "disease": ["解釈モデル"]},
    46: {"type1": "長文", "type2": "必修", "field": "A3", "disease": ["消化性潰瘍"]},
    47: {"type1": "長文", "type2": "必修", "field": "B6", "disease": ["アルコール性肝障害"]},
    48: {"type1": "長文", "type2": "必修", "field": "B6", "disease": ["アルコール依存症"]},
    49: {"type1": "長文", "type2": "必修", "field": "B6", "disease": ["統合失調症"]},
    50: {"type1": "長文", "type2": "必修", "field": "B6", "disease": ["統合失調症"]},
}

# ── 問題テキスト (厚労省PDFから転記) ──
QUESTIONS = {
    1: {
        "stem": "疾患とその俗称の組合せで正しいのはどれか。",
        "choices": {
            "a": "鶏眼 — うおのめ",
            "b": "色素性母斑 — とびひ",
            "c": "水痘 — みずいぼ",
            "d": "麦粒腫 — そばかす",
            "e": "風疹 — はしか"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    2: {
        "stem": "根拠に基づいた医療〈EBM〉を実践する過程に含まれないのはどれか。",
        "choices": {
            "a": "患者への適用",
            "b": "文献情報の収集",
            "c": "文献の批判的吟味",
            "d": "患者の問題の定式化",
            "e": "個人の経験に依存した判断"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    3: {
        "stem": "在宅医療で正しいのはどれか。",
        "choices": {
            "a": "緩和ケアは在宅医療の中で実施できる。",
            "b": "緊急時に行う在宅医療は訪問診療と呼ばれる。",
            "c": "使用した注射針は一般廃棄物として処理する。",
            "d": "我が国では病院よりも在宅で死亡する場合が多い。",
            "e": "訪問看護を利用する場合は介護保険よりも医療保険が優先される。"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    4: {
        "stem": "老人性難聴で正しいのはどれか。",
        "choices": {
            "a": "耳鳴は伴わないことが多い。",
            "b": "聴力低下は高音から始まる。",
            "c": "伝音難聴を示すことが多い。",
            "d": "補聴器の使用は極力避ける。",
            "e": "純音聴力検査で左右非対称性の難聴を示す。"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    5: {
        "stem": "都道府県が設置主体でないのはどれか。",
        "choices": {
            "a": "児童相談所",
            "b": "医療安全支援センター",
            "c": "精神保健福祉センター",
            "d": "地域医療支援センター",
            "e": "地域包括支援センター"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    6: {
        "stem": "改訂長谷川式簡易知能評価スケールの項目に含まれないのはどれか。",
        "choices": {
            "a": "計算",
            "b": "見当識",
            "c": "物品記銘",
            "d": "数字の逆唱",
            "e": "立方体の模写"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    7: {
        "stem": "医師の言葉がけで最も共感的なのはどれか。",
        "choices": {
            "a": "「夜は眠れていますか」",
            "b": "「元気を出してくださいよ」",
            "c": "「痛み止めを処方しますね」",
            "d": "「私がなんとかしましょう」",
            "e": "「心身ともにおつらいですね」"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    8: {
        "stem": "細菌培養検査の検体に適さないのはどれか。",
        "choices": {
            "a": "中間尿",
            "b": "尿道分泌物",
            "c": "導尿で採取した尿",
            "d": "腎瘻造設時に採取した尿",
            "e": "尿道留置カテーテルの集尿袋内の尿"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    9: {
        "stem": "胸部の模式図（別冊No. 1）を別に示す。\n大動脈弁狭窄症で聴取される収縮期雑音の最強点はどれか。",
        "choices": {
            "a": "①",
            "b": "②",
            "c": "③",
            "d": "④",
            "e": "⑤"
        },
        "has_image": True, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    10: {
        "stem": "我が国の医療保険制度で正しいのはどれか。",
        "choices": {
            "a": "外国籍でも加入できる。",
            "b": "財源は保険料より公費が多い。",
            "c": "療養の給付は現金給付である。",
            "d": "予防接種は保険給付の対象である。",
            "e": "保険医療機関は調剤を行う院外薬局を指定する。"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    11: {
        "stem": "毛細血管内血液の還元ヘモグロビン濃度が5 g/dL以上になると出現し、皮膚や粘膜が暗紫色になるのはどれか。",
        "choices": {
            "a": "黄疸",
            "b": "紅斑",
            "c": "紫斑",
            "d": "網状皮斑",
            "e": "チアノーゼ"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    12: {
        "stem": "思春期の脊柱側弯症の身体診察でみられないのはどれか。",
        "choices": {
            "a": "肋骨隆起",
            "b": "胸椎の叩打痛",
            "c": "片側肩甲骨の突出",
            "d": "肩の高さの左右差",
            "e": "ウエストラインの非対称"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    13: {
        "stem": "女子の思春期で正しいのはどれか。",
        "choices": {
            "a": "初経は排卵性の月経である。",
            "b": "思春期まで卵胞数は増加する。",
            "c": "初経前にゴナドトロピンは低下する。",
            "d": "大量のエストロゲンは骨端線を閉鎖させる。",
            "e": "二次性徴は陰毛発育、乳房発育、初経の順に進む。"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    14: {
        "stem": "在宅医療・介護のサービスで医師の指示が必要でないのはどれか。",
        "choices": {
            "a": "訪問介護",
            "b": "訪問看護",
            "c": "訪問栄養指導",
            "d": "訪問薬剤管理指導",
            "e": "訪問リハビリテーション"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    15: {
        "stem": "消化管位置異常のない患者で上部内視鏡検査を開始する際にとらせる体位はどれか。",
        "choices": {
            "a": "右側臥位",
            "b": "起座位",
            "c": "仰臥位",
            "d": "砕石位",
            "e": "左側臥位"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    16: {
        "stem": "急性中耳炎の症状で緊急に画像検査が必要なのはどれか。",
        "choices": {
            "a": "耳痛",
            "b": "耳漏",
            "c": "頭痛",
            "d": "難聴",
            "e": "発熱"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    17: {
        "stem": "透析導入されていない保存期末期腎不全患者の食事療法で制限が必要ないのはどれか。",
        "choices": {
            "a": "リン",
            "b": "食塩",
            "c": "蛋白質",
            "d": "カリウム",
            "e": "エネルギー"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    18: {
        "stem": "動脈採血に最も適しているのはどれか。",
        "choices": {
            "a": "総頸動脈",
            "b": "鎖骨下動脈",
            "c": "尺骨動脈",
            "d": "大腿動脈",
            "e": "膝窩動脈"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    19: {
        "stem": "めまいを呈する疾患とその特徴の組合せで誤っているのはどれか。",
        "choices": {
            "a": "Ménière病 — 難聴",
            "b": "小脳梗塞 — 運動失調",
            "c": "聴神経腫瘍 — 聴力低下",
            "d": "脳幹出血 — 視力低下",
            "e": "パニック症 — 動悸"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    20: {
        "stem": "妊婦が胎動を感じ始める妊娠週数はどれか。",
        "choices": {
            "a": "4",
            "b": "12",
            "c": "20",
            "d": "28",
            "e": "36"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    21: {
        "stem": "血中FSH 54 mIU/mL（基準5.2〜14.4）、血中エストラジオール10 pg/mL（基準25〜75）の場合、続発性無月経の原因部位はどれか。",
        "choices": {
            "a": "視床",
            "b": "視床下部",
            "c": "下垂体",
            "d": "副腎",
            "e": "卵巣"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    22: {
        "stem": "個人情報の医療機関から第三者への提供で、本人の同意が必要なのはどれか。",
        "choices": {
            "a": "患者の職場からの照会への回答",
            "b": "調剤薬局からの疑義照会への回答",
            "c": "健康保険の審査支払機関からの照会への回答",
            "d": "市役所からの生活保護受給者に係る病状調査への回答",
            "e": "医療事故発生時の医療事故調査・支援センターへの報告"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    23: {
        "stem": "乳児で緊急処置を要するバイタルサインはどれか。",
        "choices": {
            "a": "体温 38.0℃",
            "b": "脈拍 52/分",
            "c": "血圧 76/52 mmHg",
            "d": "呼吸数 36/分",
            "e": "SpO2 96%（room air）"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    24: {
        "stem": "我が国で心臓死の後に移植で提供できる臓器はどれか。",
        "choices": {
            "a": "肺",
            "b": "角膜",
            "c": "肝臓",
            "d": "小腸",
            "e": "心臓"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    25: {
        "stem": "診療所長の医師が、実際には行っていない従業員への診療の報酬を繰り返し請求していたことが発覚した。厚生労働大臣はこの医師の保険医登録を取り消す処分を行った。\n処分にあたって最も問題とされたのはどれか。",
        "choices": {
            "a": "情報開示",
            "b": "法の遵守",
            "c": "労働者保護",
            "d": "経営の健全性",
            "e": "情報セキュリティ"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    26: {
        "stem": "65歳の男性。糖尿病のため教育入院中である。医師が病棟の廊下を歩いているときに、病室内から大きな音が聞こえた。急いで病室へ駆けつけると、患者がベッドサイドに倒れており、呼びかけに対して反応がない。\nまず行うべき対応はどれか。",
        "choices": {
            "a": "応援を呼ぶ。",
            "b": "頸椎を固定する。",
            "c": "胸骨圧迫を開始する。",
            "d": "呼吸の有無を確認する。",
            "e": "頸動脈の拍動を確認する。"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    27: {
        "stem": "9か月の男児。9〜10か月健康診査のために両親に連れられて来院した。在胎38週、体重2,890 g、頭位自然分娩で出生した。身長72.2 cm、体重8,520 g。座位は安定しているが、①座った状態から立位への移行はできない。つかまり立ちはできるが、②独りで歩けない。小さな玩具をつまむことができるが、③積み木を積むことはできない。自分の手を見つめるが、④視線が合わない。「アー」「ウー」などの発声はあるが、⑤「ママ」「パパ」などの意味のある言葉は言わない。\n下線部のうち、発達の遅れが考えられるのはどれか。",
        "choices": {
            "a": "①",
            "b": "②",
            "c": "③",
            "d": "④",
            "e": "⑤"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    28: {
        "stem": "78歳の男性。安静時の強い呼吸困難のため、家族とともに救急外来を受診した。呼吸困難のため本人からは病歴の情報を十分に得ることができない。家族によると、昨日から体動時の呼吸困難を訴えていた。慢性閉塞性肺疾患のため5年前から自宅近くの診療所で在宅酸素療法（1 L/分）が導入され、来院時は、1 L/分の酸素を吸入している。意識は清明。体温36.8℃。脈拍96/分、整。血圧130/80 mmHg。呼吸数28/分。SpO2 87%（鼻カニューラ1 L/分 酸素投与下）。体格はやせ型。吸気時に肥大した胸鎖乳突筋が特に目立ち、口すぼめ呼吸をし、喘鳴が著明である。動脈血ガス分析（鼻カニューラ1 L/分 酸素投与下）：pH 7.35、PaCO2 55 Torr、PaO2 50 Torr、HCO3⁻ 30 mEq/L。\n初期対応で適切な酸素投与方法はどれか。",
        "choices": {
            "a": "リザーバー付マスク15 L/分",
            "b": "リザーバー付マスク10 L/分",
            "c": "鼻カニューラ5 L/分",
            "d": "鼻カニューラ2 L/分",
            "e": "鼻カニューラ0.5 L/分"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    29: {
        "stem": "30歳の初妊婦（1妊0産）。市販の妊娠検査薬が陽性であったため来院した。2年前に糖尿病と診断され、1年前から自宅近くの診療所でインスリン治療を受けている。最終月経は7週間前。月経周期は28日型、整。尿所見：蛋白（−）、糖（−）、ケトン体（−）。血液生化学所見：血糖92 mg/dL、HbA1c 6.0%（基準4.9〜6.0）。経腟超音波検査で子宮内に頭殿長〈CRL〉2.0 cmの心拍動を有する胎児を認めた。妊婦は糖尿病に伴う胎児形態異常を心配している。\nこの妊婦への説明で適切なのはどれか。",
        "choices": {
            "a": "「人工妊娠中絶を勧めます」",
            "b": "「胎児の形態異常は超音波検査で分かります」",
            "c": "「インスリンから経口糖尿病薬に変更しましょう」",
            "d": "「75 g経口ブドウ糖負荷試験で耐糖能の再評価をしましょう」",
            "e": "「胎児形態異常のリスクは糖尿病ではない方とほとんど変わりません」"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    30: {
        "stem": "80歳の女性。意識障害のため救急車で搬入された。家族によると、1週間前に左大腿に痛みを訴え、市販の痛み止めの内服と湿布薬貼布で様子をみていた。2日前の夜に39.0℃の発熱を認め、昨日悪寒が出現した。本日、呼吸が荒くなり、意識がもうろうとしてきたため家族が救急車を要請した。来院時、意識レベルはJCS Ⅱ-30。不穏状態である。身長148 cm、体重58 kg。体温39.0℃。心拍数144/分、整。血圧70/40 mmHg。呼吸数40/分。SpO2 94%（フェイスマスク6 L/分 酸素投与下）。左大腿部が腫脹し、皮膚表面は硬く暗赤色である。血液所見：赤血球375万、Hb 11.8 g/dL、Ht 35%、白血球3,000、血小板7.7万、PT-INR 1.3（基準0.9〜1.1）。血液生化学所見：総蛋白5.1 g/dL、アルブミン1.9 g/dL、AST 47 U/L、ALT 62 U/L、LD 253 U/L（基準124〜222）、CK 58 U/L（基準41〜153）、尿素窒素32 mg/dL、クレアチニン0.6 mg/dL、Na 130 mEq/L、K 3.9 mEq/L。CRP 28 mg/dL。動脈血ガス分析（フェイスマスク6 L/分 酸素投与下）：pH 7.51、PaCO2 18 Torr、PaO2 80 Torr、HCO3⁻ 15 mEq/L。心電図は洞調律。胸部エックス線写真に異常を認めない。大腿部単純CT（別冊No. 2）を別に示す。\n初期対応で適切でないのはどれか。",
        "choices": {
            "a": "胃管留置",
            "b": "気管挿管",
            "c": "赤血球輸血",
            "d": "血液培養検査",
            "e": "乳酸リンゲル液輸液"
        },
        "has_image": True, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    31: {
        "stem": "76歳の男性。高血糖高浸透圧症候群のため1週間前から入院中である。本日、訪室した際に、呼びかけに反応がなかった。糖尿病以外の既往歴はなく、入院時の血糖は785 mg/dLであったが、大量輸液とインスリン皮下注射で改善していた。直近数日の血糖は100〜150 mg/dLであった。意識レベルはJCS Ⅲ-100。体温36.2℃。心拍数108/分、整。血圧138/82 mmHg。呼吸数18/分。SpO2 99%（room air）。瞳孔は左右対称で対光反射は正常。顔面神経麻痺を認めない。指示には従えないものの四肢を動かしており、明らかな麻痺は認めない。\nまず行うべき検査はどれか。",
        "choices": {
            "a": "血糖測定",
            "b": "脳波検査",
            "c": "頭部単純CT",
            "d": "脳脊髄液検査",
            "e": "動脈血ガス分析"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    32: {
        "stem": "75歳の男性。下行結腸癌術後、肝転移のため在宅療養中である。3年前に下行結腸癌で手術を受けた。1年前に肝転移を診断されたが、薬物による抗癌治療は選択しなかった。1か月前から食欲不振が出現し、在宅で1日1,500 mLの維持輸液が開始された。その後徐々にベッド上で過ごすことが多くなり、2週間前から両下腿の浮腫が増悪している。最近では喀痰が増えてきて、心配した妻から主治医が相談を受けた。妻と2人暮らしで、患者本人と妻は自宅での療養の継続と自宅での看取りを希望している。身長165 cm、体重52 kg。体温36.2℃。脈拍92/分、整。血圧90/60 mmHg。呼吸数18/分。SpO2 96%（room air）。呼吸音は両側胸部で減弱しており、coarse cracklesと軽度のwheezesを聴取する。心窩部に径4 cmの有痛性の腫瘤を触知する。両下腿に著明な浮腫を認める。\nまず行うのはどれか。",
        "choices": {
            "a": "酸素投与",
            "b": "輸液の減量",
            "c": "緊急血液透析",
            "d": "薬物による抗癌治療",
            "e": "下大静脈フィルター留置術"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    33: {
        "stem": "70歳の男性。小規模の鉄工所に勤務している。勤務中に自分の不注意で機械に手を挟まれて、大きなけがを負ったため病院を受診した。勤務先の鉄工所は安全教育を定期的に行っていた。\n正しいのはどれか。",
        "choices": {
            "a": "全額自己負担となる。",
            "b": "医療扶助の給付対象となる。",
            "c": "健康保険の給付対象となる。",
            "d": "後期高齢者医療制度の給付対象となる。",
            "e": "労働者災害補償保険の給付対象となる。"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    34: {
        "stem": "以下は、50歳の男性が、ある疾患で入院し、退院後に語った内容である。\n「先日、ある病気になって入院したんです。2週間くらいだるさが続いたので、かかりつけの診療所を受診したら総合病院に紹介してくれました。総合病院を受診したら、すぐに入院するよう言われて。ちょっと風邪が長引いているのかな、くらいの軽い気持ちで受診したので、気が動転してしまって、何がなんだかわからないまま入院になりました。入院後は、血液や尿の検査、CTなどの検査を受けて、診断がついて、点滴で治療を受けて良くなりました。適切な診断と治療をしてくださった医師や入院生活を支えてくださった医療スタッフの皆さんには感謝しています。\nただ、少し不満もあって、総合病院を受診したときに、医師の話がよく理解できなくて、状況がのみ込めずに不安でした。入院という言葉で気が動転してしまった上に、医師が専門用語をたくさん使うので、頭が混乱してしまいました。医師には患者の心理状態や理解力にも気を配って欲しいと思いました。\nあと、入院したことで仕事への心配もありました。総合病院では、まず病気を治すことが最優先だと言われ、仕事に関する相談にもあまり応じてもらえませんでした。適切に治療してくださって、今は元気になったので、贅沢な悩みかもしれませんが…」\nこの事例で、問題があった医療の質の要素はどれか。",
        "choices": {
            "a": "安全性",
            "b": "公平性",
            "c": "適時性",
            "d": "有効性",
            "e": "患者中心性"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    35: {
        "stem": "A 25-year-old man presented with abdominal pain which started two days ago. Yesterday, the pain was periodic and located around the periumbilical area. Today, the pain is persistent and localized in the right lower abdomen. His body temperature is 37.7℃, pulse rate 90/min, blood pressure 120/62 mmHg, and respiratory rate 16/min. Physical examination shows rebound tenderness at the right lower abdomen.\nWhich one of the following should be performed next?",
        "choices": {
            "a": "Abdominal CT",
            "b": "Central venous（CV）catheterization",
            "c": "Gastrointestinal endoscopy",
            "d": "Magnetic resonance cholangiopancreatography（MRCP）",
            "e": "Nasogastric tube insertion"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    36: {
        "stem": "82歳の女性。膵癌肝転移のため緩和ケア病棟に入院中である。1週間前から食欲が低下し、徐々に食事摂取量が減少している。体重の変化はない。意識は清明。身長150 cm、体重36 kg。体温36.2℃。脈拍80/分、整。血圧108/58 mmHg。皮膚のツルゴールは低下している。口腔内の衛生状態は不良で、乾燥している。腹部は平坦、軟である。下腿に浮腫を認めない。血液所見：赤血球320万、Hb 9.2 g/dL、Ht 30%、白血球8,200、血小板23万。血液生化学所見：総蛋白5.8 g/dL、アルブミン2.8 g/dL、AST 24 U/L、ALT 28 U/L、尿素窒素28 mg/dL、クレアチニン1.0 mg/dL。栄養サポートチーム〈NST〉に介入依頼を行うことになった。\nこの患者に対するNSTの活動で正しいのはどれか。",
        "choices": {
            "a": "胃瘻造設を提案する。",
            "b": "口腔ケアの実施を提案する。",
            "c": "緩和ケアチームとは独立して活動する。",
            "d": "体重が4 kg以上減少してから介入する。",
            "e": "栄養療法の実施にあたり主治医の許諾は不要である。"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    37: {
        "stem": "53歳の男性。突然生じた強い左背部痛を主訴に救急車で搬入された。2年前から痛風で尿酸排泄促進薬を内服している。身長175 cm、体重91 kg。体温36.0℃。心拍数76/分、整。血圧162/92 mmHg。呼吸数16/分。腹部は平坦、軟で、肝・脾を触知しない。左肋骨脊柱角に叩打痛を認める。尿所見：蛋白1+、糖（−）、潜血3+、沈渣に赤血球 多数/HPF、白血球1〜5/HPF。腹部超音波検査で左水腎症を認める。腹部エックス線写真で異常を認めない。\n次に行うべき検査はどれか。",
        "choices": {
            "a": "FDG-PET",
            "b": "膀胱鏡検査",
            "c": "腹部単純CT",
            "d": "膀胱造影検査",
            "e": "腎シンチグラフィ"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    38: {
        "stem": "80歳の男性。誤嚥性肺炎のため入院中である。入院翌日から①食事が再開され、その後、肺炎は改善し、入院7日目の昨日、②末梢静脈ラインからの点滴治療が終了となった。患者のベッド周囲には③離床センサーが設置され、患者はトイレ歩行時にナースコールで看護師を呼び、④看護師見守りの下で、⑤スリッパを履き、トイレまで歩いている。\n下線部のうち、この患者の転倒のリスクファクターはどれか。",
        "choices": {
            "a": "①",
            "b": "②",
            "c": "③",
            "d": "④",
            "e": "⑤"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    39: {
        "stem": "39歳の女性。乳癌のため入院中である。4年前に乳癌と診断され、骨転移と肺転移を認めている。呼吸困難のため1か月前に入院となった。SpO2 92%前後（鼻カニューラ3 L/分 酸素投与下）で推移している。癌性疼痛緩和目的でオピオイドを含む数種類の鎮痛薬を点滴で使用している。数か月の余命と告知されている。本人は1か月後に予定されている子供の卒業式に出席することを希望している。\nこの患者への対応で正しいのはどれか。",
        "choices": {
            "a": "家族の意向の確認は不要である。",
            "b": "酸素投与中は出席を見合わせる。",
            "c": "移動に消防署の救急車を依頼する。",
            "d": "学校への連絡は方針確定後に行う。",
            "e": "多職種の関係者で対応を検討する。"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    40: {
        "stem": "70歳の男性。労作時の息切れを主訴に来院した。2か月前から咳嗽が持続している。2週間前からは労作時の息苦しさも出現してきたため受診した。体温36.4℃。脈拍72/分、整。血圧130/76 mmHg。呼吸数18/分。SpO2 96%（room air）。胸部エックス線写真で右上縦隔に腫瘤陰影を認め、気管を圧排し、気管内腔の狭窄を認める。肺野に異常は認めない。\n胸骨右縁付近で予測される聴診所見はどれか。",
        "choices": {
            "a": "喘鳴",
            "b": "水泡音",
            "c": "捻髪音",
            "d": "胸膜摩擦音",
            "e": "呼吸音減弱"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    41: {
        "stem": "【長文 B41-42共通】48歳の男性。健康診断で脂質異常を指摘され来院した。研修医が診察を行った。\n現病歴：2年前から脂質異常を指摘されていたが自覚症状はなくそのままにしていた。①この1年間で体重が5 kg増加したこともあり受診した。\n既往歴：5年前から高血圧症に対して治療中。\n生活歴：②妻（アレルギー性鼻炎で治療中）、長男と3人暮らし。喫煙歴はない。③飲酒は機会飲酒。\n家族歴：④父が45歳時に心筋梗塞で死亡。\n現症：意識は清明。身長173 cm、体重81 kg。体温36.2℃。脈拍80/分、整。血圧144/98 mmHg。呼吸数16/分。SpO2 98%（room air）。眼瞼結膜と眼球結膜とに異常を認めない。心音と呼吸音とに異常を認めない。腹部は平坦、軟で、肝・脾を触知しない。⑤アキレス腱の肥厚を認める。\n検査所見：血液所見：赤血球489万、Hb 14.9 g/dL、Ht 43%、白血球8,900、血小板23万。血液生化学所見：総蛋白7.1 g/dL、アルブミン3.8 g/dL、総ビリルビン1.1 mg/dL、AST 37 U/L、ALT 39 U/L、LD 155 U/L（基準124〜222）、CK 88 U/L（基準59〜248）、尿素窒素14 mg/dL、クレアチニン1.0 mg/dL、尿酸7.8 mg/dL、血糖90 mg/dL、HbA1c 5.6%（基準4.9〜6.0）、トリグリセリド185 mg/dL、HDLコレステロール30 mg/dL、LDLコレステロール172 mg/dL。CRP 0.3 mg/dL。\n下線部のうち、診察した研修医が指導医へ報告する際に重要でないのはどれか。",
        "choices": {
            "a": "①",
            "b": "②",
            "c": "③",
            "d": "④",
            "e": "⑤"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    42: {
        "stem": "【長文 B41-42共通の続き】生活習慣改善の必要性を説明したところ、患者から「来週から通勤時に歩こうと思います」と発言があった。\nこの言動の行動変容ステージはどれか。",
        "choices": {
            "a": "無関心期",
            "b": "関心期",
            "c": "準備期",
            "d": "実行期",
            "e": "維持期"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    43: {
        "stem": "【長文 B43-44共通】54歳の男性。脳ドックで異常を指摘され来院した。\n現病歴：自覚症状はなかったが、今回初めて脳ドックを受診した。\n既往歴：健康診断で血圧が高いと指摘をされていたがそのままにしていた。\n生活歴：喫煙歴はない。飲酒は機会飲酒。週末はジムに通っている。妻と2人の子供の4人暮らし。\n家族歴：母が62歳時に大腸癌で手術を受けた。\n現症：意識は清明。身長166 cm、体重72 kg。体温36.4℃。脈拍80/分、整。血圧140/80 mmHg。呼吸数16/分。SpO2 98%（room air）。左頸部に血管雑音を聴取する。心音と呼吸音とに異常を認めない。腹部に異常を認めない。神経診察で異常を認めない。\n検査所見：尿所見：蛋白（−）、糖（−）、潜血（−）。血液所見：赤血球450万、Hb 16.2 g/dL、Ht 50%、白血球4,600、血小板32万。血液生化学所見：総蛋白7.1 g/dL、アルブミン3.6 g/dL、総ビリルビン0.6 mg/dL、AST 23 U/L、ALT 12 U/L、LD 184 U/L（基準124〜222）、尿素窒素20 mg/dL、クレアチニン1.0 mg/dL、尿酸6.8 mg/dL、空腹時血糖105 mg/dL、HbA1c 5.2%（基準4.9〜6.0）、トリグリセリド140 mg/dL、HDLコレステロール42 mg/dL、LDLコレステロール196 mg/dL、Na 140 mEq/L、K 4.2 mEq/L、Cl 103 mEq/L、Ca 9.8 mg/dL。CRP 0.1 mg/dL。頭部単純MRIで明らかな異常を認めない。頸部MRA（別冊No. 3）を別に示す。\nこの患者で発症する可能性が最も高いのはどれか。",
        "choices": {
            "a": "Parkinson病",
            "b": "一過性脳虚血発作",
            "c": "緊張型頭痛",
            "d": "くも膜下出血",
            "e": "髄膜炎"
        },
        "has_image": True, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    44: {
        "stem": "【長文 B43-44共通の続き】病状の進行に関わるリスクファクターのうち、この患者が有するのはどれか。",
        "choices": {
            "a": "飲酒",
            "b": "運動不足",
            "c": "家族歴",
            "d": "脂質異常症",
            "e": "糖尿病"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    45: {
        "stem": "【長文 B45-46共通】70歳の女性。心窩部痛を主訴に来院した。\n現病歴：1週間前から空腹時に軽度の心窩部痛を自覚していたが、昨日から増悪したため受診した。悪心はなく、食欲は保たれている。その他の症状として、1か月前から持続性の腰痛がある。\n既往歴：10年前から高血圧症でカルシウム拮抗薬を服用している。\n生活歴：喫煙歴はない。食生活や体重に変化はない。\n現症：意識は清明。身長154 cm、体重55 kg。体温36.0℃。脈拍96/分、整。血圧108/56 mmHg。呼吸数22/分。SpO2 99%（room air）。眼瞼結膜は貧血様である。眼球結膜に黄染を認めない。甲状腺と頸部リンパ節を触知しない。心基部にLevine 1/6の収縮期雑音を聴取する。呼吸音に異常を認めない。腹部は平坦。腸雑音に異常を認めない。心窩部に圧痛を認める。肝・脾を触知しない。\n医療面接は以下のように続いた。\n医師「①お酒は飲まれますか」患者「全く飲みません」\n医師「②便の色はどうですか」患者「流してしまって見ていないです」\n医師「③健康診断は受けていますか」患者「受けていません」\n医師「④血圧の薬以外に何か服用をされていますか」患者「腰痛に対して1か月前から市販の鎮痛薬を飲んでいます」\n医師「⑤自分の病気についてどう考えていますか」患者「父が胃癌で亡くなったので、自分も胃癌なのではないかと心配です」\n下線部のうち、解釈モデルを問う質問はどれか。",
        "choices": {
            "a": "①",
            "b": "②",
            "c": "③",
            "d": "④",
            "e": "⑤"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    46: {
        "stem": "【長文 B45-46共通の続き】この患者の直腸指診で得られる便の性状で可能性が高いのはどれか。",
        "choices": {
            "a": "脂肪便",
            "b": "水様便",
            "c": "粘血便",
            "d": "灰白色便",
            "e": "タール便"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    47: {
        "stem": "【長文 B47-48共通】52歳の男性。全身倦怠感と発汗を主訴に来院した。\n現病歴：2週間前から全身倦怠感を自覚し、2日前に職場の近くの診療所で血液検査を受けた。アルコール性肝障害と診断され、入院治療のため紹介受診した。今朝から発汗を自覚している。診察室ではそわそわと落ち着きなく歩き回り、手が震えて問診票にうまく記入できなかったことを気にしている。\n既往歴：特記すべきことはない。\n生活歴：職業は会社員。喫煙は昨年まで加熱式たばこを20本/日。飲酒は仕事帰りに居酒屋でビール中ジョッキ2〜3杯/日、休日は自宅で350 mLの缶チューハイを3〜4本/日。最近はアルコール度数の高いものを選んで買っていた。休日に朝から飲酒していることを妻から注意されたことがある。2日前に診療所を受診した後からは禁酒している。\n家族歴：特記すべきことはない。\n現症：意識は清明。身長172 cm、体重73 kg。体温36.8℃。脈拍108/分、整。血圧132/80 mmHg。皮膚は軽度湿潤しているが皮疹などは認めない。眼瞼結膜と眼球結膜とに異常を認めない。甲状腺腫と頸部リンパ節とを触知しない。心音と呼吸音とに異常を認めない。腹部は平坦、軟で、波動を認めない。肝・脾を触知しない。\n検査所見：尿所見：蛋白（−）、糖（−）、潜血（−）。血液所見：赤血球452万、Hb 14.5 g/dL、白血球8,600、血小板20万、PT-INR 1.0（基準0.9〜1.1）。血液生化学所見：総蛋白7.2 g/dL、アルブミン4.6 g/dL、IgG 1,210 mg/dL（基準861〜1,747）、IgA 682 mg/dL（基準93〜393）、IgM 96 mg/dL（基準33〜183）、総ビリルビン0.8 mg/dL、AST 482 U/L、ALT 416 U/L、ALP 198 U/L（基準38〜113）、γ-GT 682 U/L（基準13〜64）、尿素窒素16 mg/dL、クレアチニン0.8 mg/dL、尿酸6.4 mg/dL、血糖110 mg/dL、TSH 2.0 μU/mL（基準0.2〜4.0）、FT4 1.8 ng/dL（基準0.8〜2.2）。免疫血清学所見：HBs抗原陰性、HCV抗体陰性。腹部超音波検査で脂肪肝を認める。\nこの患者に認められるのはどれか。",
        "choices": {
            "a": "黄疸",
            "b": "振戦",
            "c": "腹水",
            "d": "肝腫大",
            "e": "手掌紅斑"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    48: {
        "stem": "【長文 B47-48共通の続き】アルコール性肝障害の診断で入院となった。\n投与すべき薬剤はどれか。",
        "choices": {
            "a": "降圧薬",
            "b": "血糖降下薬",
            "c": "抗甲状腺薬",
            "d": "尿酸降下薬",
            "e": "ベンゾジアゼピン系薬"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    49: {
        "stem": "【長文 B49-50共通】18歳の女子。昼夜逆転の生活が続いているため両親に連れられて来院した。\n現病歴：幼少時に発達の遅れや偏りは指摘されていない。高校1年生までは成績優秀だったが、2年生のころから意欲や集中力が低下し、成績が落ちた。3年生から不登校となり、高校中退後は引きこもりがちな生活を送っている。両親によると最近、自室から独り言や笑い声が聞こえる。\n既往歴：特記すべきことはない。\n生活歴：両親と3人暮らし。喫煙歴と飲酒歴はない。\n家族歴：父がうつ病。\n現症：意識は清明。身長164 cm、体重60 kg。体温36.0℃。脈拍72分、整。血圧122/66 mmHg。呼吸数15/分。SpO2 99%（room air）。神経診察で異常を認めない。診察室ではそわそわと落ち着きなく歩き回り、質問に対して的外れな回答をすることもあり、会話が成立しにくい。「何となく悪いことが起きそうな気がする」「世界がなくなってしまう」「知らない人が自分を見ている」と言う。\nこの患者でみられる症状はどれか。",
        "choices": {
            "a": "心気",
            "b": "妄想",
            "c": "強迫観念",
            "d": "対人恐怖",
            "e": "予期不安"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    50: {
        "stem": "【長文 B49-50共通の続き】診断はどれか。",
        "choices": {
            "a": "うつ病",
            "b": "統合失調症",
            "c": "パーソナリティ症",
            "d": "自閉スペクトラム症",
            "e": "双極症〈双極性障害〉"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
}

# ── JSON生成 ──
def build_119b():
    questions = []
    for num in range(1, 51):
        q = QUESTIONS[num]
        meta = MEDU4_META[num]
        ans = ANSWERS[num]

        questions.append({
            "num": num,
            "id": f"119B{num}",
            "exam_year": 119,
            "block": "B",
            "stem": q["stem"],
            "choices": q["choices"],
            "answer": ans,
            "format": {
                "type1": meta["type1"],
                "type2": meta["type2"],
                "num_answers": 1,
                "has_image": q["has_image"],
                "is_calculation": q.get("is_calculation", False),
                "has_kinki": q.get("has_kinki", False),
                "is_deleted": q.get("is_deleted", False)
            },
            "field": meta["field"],
            "subfield": None,
            "disease": meta["disease"]
        })

    data = {
        "exam_year": 119,
        "block": "B",
        "total_questions": 50,
        "source": "厚生労働省 第119回医師国家試験",
        "questions": questions
    }

    output_path = "/Users/tasuku/Desktop/iwor/data/questions/119/119B.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"✓ 119B.json written: {len(questions)} questions")

    # Validation
    for q in questions:
        assert q["answer"] in q["choices"], f"{q['id']}: answer '{q['answer']}' not in choices"
        assert len(q["choices"]) == 5, f"{q['id']}: expected 5 choices, got {len(q['choices'])}"
    print("✓ All validations passed")

if __name__ == "__main__":
    build_119b()
