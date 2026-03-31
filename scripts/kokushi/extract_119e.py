#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
119E ブロック 50問のデータベース構築
- 問題文・選択肢: 厚労省PDF抽出テキスト (/tmp/119e_text.txt)
- 正答: 厚労省公式正答表
- format/field/topic: medu4メタデータ + iwor taxonomy
"""

import json

# ── 正答表 (厚労省公式) ──
# 単一解答: lowercase str
# 複数解答: list of lowercase str
ANSWERS_RAW = {
    1: "d", 2: "c", 3: "e", 4: "b", 5: "a",
    6: "a", 7: "b", 8: "d", 9: "e", 10: "a",
    11: "e", 12: "e", 13: "e", 14: "a", 15: "c",
    16: "e", 17: "a", 18: "d", 19: "e", 20: "d",
    21: "e", 22: "a", 23: "a", 24: "e", 25: "d",
    26: "b", 27: "d", 28: ["a", "c"], 29: "b", 30: "b",
    31: "e", 32: "d", 33: "c", 34: "e", 35: "d",
    36: "e", 37: "c", 38: "c", 39: "e", 40: "b",
    41: "a", 42: "e", 43: "c", 44: "e", 45: "e",
    46: "e", 47: "e", 48: "e", 49: "e", 50: "c",
}

# ── medu4メタデータ + iwor field/subfield/topic割り当て ──
# field mapping: medu4科目 → iwor field
# 01.腎→A5, 02.内分泌代謝→A6, 03.血液→A7, 04.免疫→A10, 05.感染症→A9
# 06.呼吸器→A4, 07.循環器→A1, 08.消化管→A2, 09.肝胆膵→A3, 10.神経→A8
# 11.産婦人科→C1 or C2, 12.小児科→C3, 13.加齢老年学→D3, 14.整形外科→B1
# 15.眼科→B4, 16.耳鼻咽喉科→B5, 17.泌尿器科→A5, 18.精神科→B3
# 19.皮膚科→B2, 20.放射線科→B6, 21.救急→D1, 22.中毒→D1, 24.公衆衛生→D2
# 25.総論的事項→D3, 26.必修→D2, 27.基礎医学→D3

MEDU4_META = {
    # E1: 一般x必修, 07.循環器, 症候と疾患の組合せ（複数分野融合）
    1:  {"type1": "一般", "type2": "必修", "field": "D2", "subfield": "D2-04", "topic": "症候と疾患の組合せ〈必修〉"},
    # E2: 一般x必修, 26.必修的事項, 取扱いに特に配慮を要する個人情報
    2:  {"type1": "一般", "type2": "必修", "field": "D2", "subfield": "D2-04", "topic": "個人情報の保護"},
    # E3: 一般x必修, 26.必修的事項, 医療倫理の4原則
    3:  {"type1": "一般", "type2": "必修", "field": "D2", "subfield": "D2-04", "topic": "医療倫理の4原則"},
    # E4: 一般x必修, 26.必修的事項, 性交渉歴に関する病歴聴取
    4:  {"type1": "一般", "type2": "必修", "field": "D2", "subfield": "D2-04", "topic": "病歴聴取〈必修〉"},
    # E5: 一般x必修, 18.精神科, ナルコレプシーの患者の訴え
    5:  {"type1": "一般", "type2": "必修", "field": "B3", "subfield": "B3-05", "topic": "ナルコレプシー"},
    # E6: 一般x必修, 26.必修的事項, 腰椎穿刺法による脳脊髄液検査に際する説明
    6:  {"type1": "一般", "type2": "必修", "field": "D3", "subfield": "D3-06", "topic": "腰椎穿刺〈総論〉"},
    # E7: 一般x必修, 26.必修的事項, 医師のプロフェッショナリズムについて
    7:  {"type1": "一般", "type2": "必修", "field": "D2", "subfield": "D2-04", "topic": "医師のプロフェッショナリズム"},
    # E8: 一般x必修, 01.腎, 血清K値が7.0mEq/Lの患者にまず行うべき検査
    8:  {"type1": "一般", "type2": "必修", "field": "A5", "subfield": "A5-01", "topic": "高カリウム血症〈総論〉"},
    # E9: 一般x必修, 18.精神科, 強迫性障害の患者にみられる強迫行為
    9:  {"type1": "一般", "type2": "必修", "field": "B3", "subfield": "B3-02", "topic": "強迫症（強迫性障害）"},
    # E10: 一般x必修, 26.必修的事項, チーム医療について
    10: {"type1": "一般", "type2": "必修", "field": "D2", "subfield": "D2-08", "topic": "チーム医療"},
    # E11: 一般x必修, 17.泌尿器科, 腎盂腎炎の診察
    11: {"type1": "一般", "type2": "必修", "field": "A5", "subfield": "A5-14", "topic": "腎盂腎炎"},
    # E12: 一般x必修, 14.整形外科, 骨折を認める手指エックス線写真
    12: {"type1": "一般", "type2": "必修", "field": "B1", "subfield": "B1-01", "topic": "骨折〈総論〉"},
    # E13: 一般x必修, 08.消化管, 消化器症候と疾患の組合せ
    13: {"type1": "一般", "type2": "必修", "field": "A2", "subfield": "A2-01", "topic": "消化器症候と疾患の組合せ"},
    # E14: 一般x必修, 26.必修的事項, 長時間の砕石位による合併症
    14: {"type1": "一般", "type2": "必修", "field": "D3", "subfield": "D3-06", "topic": "手術体位の合併症"},
    # E15: 一般x必修, 02.内分泌代謝, 喫煙と関連ある疾患
    15: {"type1": "一般", "type2": "必修", "field": "D2", "subfield": "D2-12", "topic": "喫煙と疾患"},
    # E16: 一般x必修, 10.神経, 小脳機能の評価に用いられる試験
    16: {"type1": "一般", "type2": "必修", "field": "A8", "subfield": "A8-01", "topic": "小脳機能検査"},
    # E17: 一般x必修, 27.基礎医学, 最も多くの遺伝子を含む染色体
    17: {"type1": "一般", "type2": "必修", "field": "D3", "subfield": "D3-06", "topic": "染色体〈基礎〉"},
    # E18: 一般x必修, 05.感染症, 皮膚開放創の消毒に用いることができる薬液
    18: {"type1": "一般", "type2": "必修", "field": "A9", "subfield": "A9-01", "topic": "消毒薬〈総論〉"},
    # E19: 一般x必修, 18.精神科, 幻覚を強く示唆する患者の発言
    19: {"type1": "一般", "type2": "必修", "field": "B3", "subfield": "B3-01", "topic": "幻覚〈精神科総論〉"},
    # E20: 一般x必修, 14.整形外科, 鼠径部レベル以下の全感覚消失の脊髄損傷レベル
    20: {"type1": "一般", "type2": "必修", "field": "B1", "subfield": "B1-03", "topic": "脊髄損傷"},
    # E21: 一般x必修, 26.必修的事項, 質が低い喀痰検体
    21: {"type1": "一般", "type2": "必修", "field": "D3", "subfield": "D3-06", "topic": "喀痰検体の評価"},
    # E22: 一般x必修, 26.必修的事項, 生活習慣の改善を促すために有効なアプローチ
    22: {"type1": "一般", "type2": "必修", "field": "D2", "subfield": "D2-12", "topic": "行動変容〈生活習慣〉"},
    # E23: 一般x必修, 24.公衆衛生, ROC曲線において偽陰性率が最も低いカットオフ値
    23: {"type1": "一般", "type2": "必修", "field": "D2", "subfield": "D2-02", "topic": "ROC曲線"},
    # E24: 一般x必修, 25.総論的事項, 処方箋から判別する1日に服用する錠剤の個数
    24: {"type1": "一般", "type2": "必修", "field": "D3", "subfield": "D3-06", "topic": "処方箋の読み方"},
    # E25: 一般x必修, 25.総論的事項, 薬物投与で皮疹が出現した場合に添付文書でまず確認する事項
    25: {"type1": "一般", "type2": "必修", "field": "D3", "subfield": "D3-06", "topic": "添付文書の確認"},
    # E26: 臨床x必修, 02.内分泌代謝, 推定エネルギー必要量の算出に必要な指標
    26: {"type1": "臨床", "type2": "必修", "field": "A6", "subfield": "A6-13", "topic": "推定エネルギー必要量"},
    # E27: 臨床x必修, 07.循環器, 深部静脈血栓〈DVT〉の検査
    27: {"type1": "臨床", "type2": "必修", "field": "A1", "subfield": "A1-08", "topic": "深部静脈血栓症（DVT）"},
    # E28: 臨床x必修, 26.必修的事項, 末梢静脈路確保に最も適切な静脈（2択）
    28: {"type1": "臨床", "type2": "必修", "field": "D3", "subfield": "D3-06", "topic": "末梢静脈路確保"},
    # E29: 臨床x必修, 25.総論的事項, 注射薬を持続皮下注射する場合の投与速度（計算問題）
    29: {"type1": "臨床", "type2": "必修", "field": "D3", "subfield": "D3-06", "topic": "薬物投与速度の計算"},
    # E30: 臨床x必修, 15.眼科, 白内障の診断
    30: {"type1": "臨床", "type2": "必修", "field": "B4", "subfield": "B4-08", "topic": "白内障"},
    # E31: 臨床x必修, 11.産婦人科, 子癇にまず投与すべき薬剤
    31: {"type1": "臨床", "type2": "必修", "field": "C1", "subfield": "C1-02", "topic": "子癇"},
    # E32: 臨床x必修, 24.公衆衛生, 行動変容のステージに基づく指導
    32: {"type1": "臨床", "type2": "必修", "field": "D2", "subfield": "D2-12", "topic": "行動変容ステージモデル"},
    # E33: 臨床x必修, 10.神経, くも膜下出血〈SAH〉の緊急性を判断する徴候
    33: {"type1": "臨床", "type2": "必修", "field": "A8", "subfield": "A8-03", "topic": "くも膜下出血（SAH）"},
    # E34: 臨床x必修, 26.必修的事項, 本人の意向を尊重した終末期の対応
    34: {"type1": "臨床", "type2": "必修", "field": "D2", "subfield": "D2-07", "topic": "終末期医療〈総論〉"},
    # E35: 臨床x必修, 05.感染症, 肺炎患者に対し入院が必要と判断する要素
    35: {"type1": "臨床", "type2": "必修", "field": "A9", "subfield": "A9-02", "topic": "肺炎（市中肺炎）〈入院適応〉"},
    # E36: 臨床x必修, 22.中毒, 灯油誤飲への対応
    36: {"type1": "臨床", "type2": "必修", "field": "D1", "subfield": "D1-03", "topic": "石油製品誤飲"},
    # E37: 臨床x必修, 25.総論的事項, 費用対効果の視点から選択すべき内服薬
    37: {"type1": "臨床", "type2": "必修", "field": "D2", "subfield": "D2-10", "topic": "費用対効果"},
    # E38: 臨床x必修, 03.血液, 免疫性血小板減少性紫斑病〈ITP〉の血液検査値
    38: {"type1": "臨床", "type2": "必修", "field": "A7", "subfield": "A7-04", "topic": "免疫性血小板減少性紫斑病（ITP）"},
    # E39: 臨床x必修, 24.公衆衛生, 事前確率から算出する事後確率（計算問題）
    39: {"type1": "臨床", "type2": "必修", "field": "D2", "subfield": "D2-02", "topic": "事後確率（ベイズの定理）"},
    # E40: 臨床x必修, 14.整形外科, 緊急性の高い椎間板ヘルニア所見
    40: {"type1": "臨床", "type2": "必修", "field": "B1", "subfield": "B1-03", "topic": "椎間板ヘルニア"},
    # E41-42: 長文x必修, 21.救急, アナフィラキシーショック / 有害事象の再発防止
    41: {"type1": "長文", "type2": "必修", "field": "D1", "subfield": "D1-07", "topic": "アナフィラキシーショック"},
    42: {"type1": "長文", "type2": "必修", "field": "D2", "subfield": "D2-08", "topic": "有害事象の再発防止"},
    # E43-44: 長文x必修, 07.循環器, 左心不全に特徴的な徴候 / 薬剤性心筋障害の既往歴
    43: {"type1": "長文", "type2": "必修", "field": "A1", "subfield": "A1-06", "topic": "左心不全"},
    44: {"type1": "長文", "type2": "必修", "field": "A1", "subfield": "A1-06", "topic": "薬剤性心筋障害"},
    # E45-46: 長文x必修, 08.消化管, 急性虫垂炎患者の問診 / 急性虫垂炎の所見
    45: {"type1": "長文", "type2": "必修", "field": "A2", "subfield": "A2-04", "topic": "急性虫垂炎"},
    46: {"type1": "長文", "type2": "必修", "field": "A2", "subfield": "A2-04", "topic": "急性虫垂炎"},
    # E47-48: 長文x必修, 06.呼吸器, 静脈留置針の自己抜去防止 / 気管支喘息への静脈内投与薬剤
    47: {"type1": "長文", "type2": "必修", "field": "D3", "subfield": "D3-06", "topic": "静脈留置針の管理"},
    48: {"type1": "長文", "type2": "必修", "field": "A4", "subfield": "A4-08", "topic": "気管支喘息〈治療〉"},
    # E49-50: 長文x必修, 06.呼吸器, 気胸の所見 / 気胸の治療方針
    49: {"type1": "長文", "type2": "必修", "field": "A4", "subfield": "A4-14", "topic": "気胸"},
    50: {"type1": "長文", "type2": "必修", "field": "A4", "subfield": "A4-14", "topic": "気胸"},
}

# ── 問題テキスト ──
QUESTIONS = {
    1: {
        "stem": "症候と疾患の組合せで誤っているのはどれか。",
        "choices": {
            "a": "排尿障害 — 腰部脊柱管狭窄症",
            "b": "歩行障害 — 頸椎性脊髄症",
            "c": "腰背部痛 — 解離性大動脈瘤",
            "d": "下肢の冷感 — 深部静脈血栓症",
            "e": "膝関節腫脹 — 偽痛風"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    2: {
        "stem": "不当な差別、偏見その他の不利益が生じないように、その取扱いに特に配慮を要する個人情報はどれか。",
        "choices": {
            "a": "学歴",
            "b": "国籍",
            "c": "病歴",
            "d": "肌の色",
            "e": "職業的地位"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    3: {
        "stem": "医療倫理の4原則に含まれないのはどれか。",
        "choices": {
            "a": "正義",
            "b": "善行",
            "c": "無危害",
            "d": "自律尊重",
            "e": "共同意思決定"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    4: {
        "stem": "性感染症が疑われる患者に対して、性交渉歴に関する病歴聴取を行う場合に正しいのはどれか。",
        "choices": {
            "a": "初診時には聴取をしない。",
            "b": "性交渉相手の人数を確認する。",
            "c": "未成年の患者では保護者を同席させる。",
            "d": "配偶者との性交渉については聴取しない。",
            "e": "経口避妊薬を服用している患者には聴取しない。"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    5: {
        "stem": "ナルコレプシーの患者の訴えはどれか。",
        "choices": {
            "a": "「会議中に突然眠ってしまいます」",
            "b": "「毎日、明け方になるまで眠れません」",
            "c": "「毎晩、眠れないのではないかと不安になります」",
            "d": "「眠っている間に足がぴくぴく動いていると妻に言われます」",
            "e": "「夜中に知らないうちに冷蔵庫の中のものを食べているみたいです」"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    6: {
        "stem": "腰椎穿刺法による脳脊髄液検査を行う。\n成人患者への説明で誤っているのはどれか。",
        "choices": {
            "a": "「うつぶせの姿勢で行います」",
            "b": "「事前に血液検査を行います」",
            "c": "「下肢に痛みが走ることがあります」",
            "d": "「事前に眼底検査か頭部画像検査を行います」",
            "e": "「検査後に立位で悪化する頭痛が起きることがあります」"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    7: {
        "stem": "医師のプロフェッショナリズムで誤っているのはどれか。",
        "choices": {
            "a": "科学的根拠を追究する。",
            "b": "自己の利益を追求する。",
            "c": "社会のニーズに応える。",
            "d": "患者の感情に共感を示す。",
            "e": "医療資源の有限性に配慮する。"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    8: {
        "stem": "ある患者の採血結果で、血清K値が7.0 mEq/Lであると検査室から連絡があった。\n血液検査の再検に加えて、まず行うべき検査はどれか。",
        "choices": {
            "a": "血糖測定",
            "b": "腹部単純CT",
            "c": "心エコー検査",
            "d": "12誘導心電図検査",
            "e": "胸部エックス線撮影"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    9: {
        "stem": "強迫性障害〈強迫症〉の患者にみられる強迫行為で正しいのはどれか。",
        "choices": {
            "a": "症状に日内変動がある。",
            "b": "強迫行為中の記憶がない。",
            "c": "患者は強迫行為を合理的であると考えている。",
            "d": "「手を洗いなさい」などの命令性幻聴に従って行われる。",
            "e": "強迫観念によって生じる不安を予防あるいは緩和する目的で行われる。"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    10: {
        "stem": "チーム医療で正しいのはどれか。",
        "choices": {
            "a": "事務職員も参加できる。",
            "b": "医師の指示が最優先される。",
            "c": "医療機関の経営業績の向上が目的である。",
            "d": "チーム全員の意見が一致する必要がある。",
            "e": "単一の医療機関内で完結することが推奨されている。"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    11: {
        "stem": "腎盂腎炎の診察に有用なのはどれか。",
        "choices": {
            "a": "振水音の聴診",
            "b": "Traube三角の打診",
            "c": "鼠径リンパ節の触診",
            "d": "腹部血管雑音の聴診",
            "e": "肋骨脊柱角の叩打診"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    12: {
        "stem": "手指のエックス線写真（別冊No. 1①〜⑤）を別に示す。\n骨折を認めるのはどれか。",
        "choices": {
            "a": "①",
            "b": "②",
            "c": "③",
            "d": "④",
            "e": "⑤"
        },
        "has_image": True, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    13: {
        "stem": "症候と疾患の組合せで正しいのはどれか。",
        "choices": {
            "a": "嚥下障害 — 膵炎",
            "b": "黄疸 — 腸閉塞",
            "c": "吐血 — 潰瘍性大腸炎",
            "d": "腹部膨隆 — 胃食道逆流症",
            "e": "便通異常 — 過敏性腸症候群"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    14: {
        "stem": "長時間の砕石位による合併症で誤っているのはどれか。",
        "choices": {
            "a": "視力障害",
            "b": "下肢の神経損傷",
            "c": "深部静脈血栓症",
            "d": "接地部の圧迫性潰瘍",
            "e": "体位解除後の低血圧"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    15: {
        "stem": "喫煙と関連が乏しいのはどれか。",
        "choices": {
            "a": "歯周病",
            "b": "大動脈瘤",
            "c": "1型糖尿病",
            "d": "冠動脈疾患",
            "e": "慢性閉塞性肺疾患"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    16: {
        "stem": "小脳機能の評価に用いないのはどれか。",
        "choices": {
            "a": "膝踵試験",
            "b": "指鼻試験",
            "c": "鼻指鼻試験",
            "d": "回内回外試験",
            "e": "上肢Barré試験"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    17: {
        "stem": "最も多くの遺伝子を含む染色体はどれか。",
        "choices": {
            "a": "1番染色体",
            "b": "16番染色体",
            "c": "18番染色体",
            "d": "21番染色体",
            "e": "X染色体"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    18: {
        "stem": "皮膚開放創の消毒に用いることができるのはどれか。",
        "choices": {
            "a": "エタノール",
            "b": "グルタールアルデヒド",
            "c": "次亜塩素酸ナトリウム",
            "d": "ポビドンヨード",
            "e": "ホルマリン"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    19: {
        "stem": "幻覚を強く示唆する患者の発言はどれか。",
        "choices": {
            "a": "「（人から見られている場面で）とても緊張します」",
            "b": "「（道を歩きながら）知らない人が私を見て笑うのです」",
            "c": "「（通常の食事をしながら）砂を嚙んでいるように感じます」",
            "d": "「（天井のしみを見ながら）あれは私を殺そうとしているサインです」",
            "e": "「（鳴っていない携帯電話を見せながら）今もこの電話の着信音がやまないのです」"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    20: {
        "stem": "鼠径部レベル以下の全感覚消失の脊髄損傷レベルはどれか。",
        "choices": {
            "a": "第4頸髄",
            "b": "第5胸髄",
            "c": "第10胸髄",
            "d": "第1腰髄",
            "e": "脊髄円錐部"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    21: {
        "stem": "喀痰検体で質が低いのはどれか。",
        "choices": {
            "a": "うがいをした後に採取した検体",
            "b": "喀痰の膿性部分が入っている検体",
            "c": "食塩水吸入で誘発して採取した検体",
            "d": "Gram染色の鏡検で白血球が多い検体",
            "e": "Gram染色の鏡検で上皮細胞が多い検体"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    22: {
        "stem": "生活習慣の改善を促すために有効なアプローチはどれか。",
        "choices": {
            "a": "解釈モデルを確認する。",
            "b": "行動目標は医師主導で設定する。",
            "c": "患者が不安になる情報提供は控える。",
            "d": "専門用語を積極的に用いて説明する。",
            "e": "標準化された指導内容を画一的に行う。"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    23: {
        "stem": "ある検査におけるReceiver Operating Characteristic〈ROC〉曲線（別冊No. 2）を別に示す。これを参考にカットオフ値を設定することとした。\n偽陰性率が最も低いのはどれか。",
        "choices": {
            "a": "①",
            "b": "②",
            "c": "③",
            "d": "④",
            "e": "⑤"
        },
        "has_image": True, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    24: {
        "stem": "ある患者の処方箋（別冊No. 3）を別に示す。\nこの患者が1日に服用する錠剤の個数はどれか。",
        "choices": {
            "a": "1",
            "b": "2",
            "c": "3",
            "d": "4",
            "e": "5"
        },
        "has_image": True, "is_calculation": True, "has_kinki": False, "is_deleted": False
    },
    25: {
        "stem": "薬物投与で皮疹が出現した場合に、添付文書でまず確認するのはどれか。",
        "choices": {
            "a": "効能又は効果",
            "b": "用法及び用量",
            "c": "相互作用",
            "d": "副作用",
            "e": "薬物動態"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    26: {
        "stem": "42歳の男性。職場の健康診断で①高血圧を指摘され来院した。仕事は②事務職で、1年前から仕事が忙しく、③過食気味で体重が8 kg増加した。既往歴に特記すべきことはない。喫煙歴はない。飲酒はビール350 mL/日。身長172 cm、体重80 kg。④脈拍72/分、整。血圧144/92 mmHg。身体診察に異常を認めない。血液生化学所見：血糖72 mg/dL、HbA1c 5.8 %（基準4.9〜6.0）、トリグリセリド190 mg/dL、HDLコレステロール62 mg/dL、⑤LDLコレステロール146 mg/dL。体重の減量を目的に食事療法を行う。\n下線部のうち、推定エネルギー必要量（kcal/日）の算出に必要なのはどれか。",
        "choices": {
            "a": "①",
            "b": "②",
            "c": "③",
            "d": "④",
            "e": "⑤"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    27: {
        "stem": "65歳の女性。右変形性膝関節症のため、右人工膝関節置換術が予定されている。術前評価のため受診した。6か月前から右膝の痛みが出現し、徐々に悪化し、歩けなくなった。整形外科を受診し、手術適応となった。3か月前に乳癌の手術を受け、薬物による抗癌治療中である。仕事は事務職でデスクワークが主体である。意識は清明。身長149 cm、体重68 kg。体温36.0 ℃。脈拍84/分、整。血圧150/70 mmHg。呼吸数20/分。SpO2 96 %（room air）。頸静脈の怒張を認めない。心音と呼吸音とに異常を認めない。右下肢に圧痕性浮腫を認める。血液所見：赤血球414万、Hb 11.3 g/dL、Ht 36 %、血小板23万、PT-INR 0.9（基準0.9〜1.1）、Dダイマー9.0 μg/mL（基準1.0以下）。血液生化学所見：尿素窒素30 mg/dL、クレアチニン2.0 mg/dL、血糖105 mg/dL、Na 140 mEq/L、K 4.6 mEq/L、Cl 107 mEq/L、Ca 9.2 mg/dL。CRP 0.8 mg/dL。\nこの時点で実施すべき検査はどれか。",
        "choices": {
            "a": "腹部単純CT",
            "b": "腎シンチグラフィ",
            "c": "下肢動脈造影検査",
            "d": "下肢静脈超音波検査",
            "e": "足関節上腕血圧比〈ABI〉"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    28: {
        "stem": "80歳の男性。発熱、咳嗽および呼吸困難のため救急車で搬入された。既往歴に脳梗塞があり、右片麻痺と失語がある。体温38.6 ℃。心拍数108/分、不整。血圧142/100 mmHg。呼吸数24/分。SpO2 90 %（鼻カニューラ2 L/分 酸素投与下）。右背側にcoarse cracklesを聴取する。検査の結果、肺炎と診断され、抗菌薬投与のため末梢静脈路確保を行うこととした。\nこの患者の末梢静脈路確保に最も適切な静脈はどれか。",
        "choices": {
            "a": "左肘正中皮静脈",
            "b": "右肘正中皮静脈",
            "c": "左橈側皮静脈",
            "d": "右橈側皮静脈",
            "e": "右大伏在静脈"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    29: {
        "stem": "65歳の男性。背部痛を主訴に来院した。肺癌の骨転移で治療を受けている。疼痛コントロール目的で入院となった。外来ではモルヒネ徐放製剤を内服していたが、指導医と相談の上、投与経路を皮下注射に変更することになった。塩酸モルヒネ注製剤と生理食塩液を混合して5 mg/mLの溶液を調整した。1日投与量を24 mg/日としたい。\nこの注射薬を持続皮下注射する場合の投与速度はどれか。",
        "choices": {
            "a": "0.1 mL/時間",
            "b": "0.2 mL/時間",
            "c": "0.4 mL/時間",
            "d": "0.5 mL/時間",
            "e": "0.8 mL/時間"
        },
        "has_image": False, "is_calculation": True, "has_kinki": False, "is_deleted": False
    },
    30: {
        "stem": "72歳の男性。右眼の視力低下を主訴に来院した。2年前に左眼が同様の症状となり、手術を受けたという。視力は右0.5（矯正不能）、左1.0（矯正不能）。眼圧は右15 mmHg、左14 mmHg。右眼の細隙灯顕微鏡写真（別冊No. 4）を別に示す。両眼とも眼底に異常を認めない。\n右眼の疾患はどれか。",
        "choices": {
            "a": "内反症",
            "b": "白内障",
            "c": "円錐角膜",
            "d": "急性緑内障発作",
            "e": "原発開放隅角緑内障"
        },
        "has_image": True, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    31: {
        "stem": "38歳の初妊婦（1妊0産）。妊娠37週4日、家庭血圧で150/100 mmHgを認めたため受診した。妊娠28週の妊婦健康診査で診察室血圧136/80 mmHgであったため、家庭血圧測定が開始されていた。来院時、血圧160/110 mmHg、随時尿で尿蛋白/Cr比は0.9 g/g Crであったため入院管理となった。病棟到着時、意識消失とけいれんを認めた。\nまず投与すべき薬剤はどれか。",
        "choices": {
            "a": "グルコン酸カルシウム",
            "b": "ドパミン",
            "c": "ニトログリセリン",
            "d": "フロセミド",
            "e": "硫酸マグネシウム"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    32: {
        "stem": "49歳の男性。健康診断で初めて高血圧を指摘され来院した。普段から味の濃い食べ物を好み、塩分の摂りすぎを気にしている。減塩はしていない。喫煙歴はない。飲酒は機会飲酒。身長172 cm、体重72 kg。体温36.4 ℃。脈拍68/分、整。血圧146/92 mmHg。\nこの患者の行動変容のステージに基づく指導で適切なのはどれか。",
        "choices": {
            "a": "「減塩しなければ脳出血になります」",
            "b": "「塩分の取りすぎが高血圧の原因です」",
            "c": "「味の濃い食べ物を摂るのを控えましょう」",
            "d": "「どのようにしたら減塩できると思いますか」",
            "e": "「その気になるまで減塩する必要はありません」"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    33: {
        "stem": "50歳の男性。頭痛を主訴に救急外来を受診した。頭痛は6時間前に出現し現在は軽快している。これまでに経験したことのない激しい頭痛であったため来院した。来院時、意識は清明。身長162 cm、体重55 kg。体温36.9 ℃。脈拍84/分、整。血圧156/92 mmHg。呼吸数18/分。\n緊急性を判断するために確認すべき徴候はどれか。",
        "choices": {
            "a": "耳鳴",
            "b": "結膜充血",
            "c": "項部硬直",
            "d": "閃輝暗点",
            "e": "四肢のしびれ"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    34: {
        "stem": "72歳の男性。食道癌で訪問診療を受けている。3年前に食道癌の手術を受けた。6か月前に肺と骨に多発転移が見つかり、余命数か月と告知を受けた。本人の強い希望で積極的な治療はせず、自宅で在宅療養をしている。ここ1か月で嚥下障害が進行し、体重が著しく減少した。本人は訪問診療に訪れた医師に「尊厳死宣言文書」を提示して「痛みがつらくて寝られないから早く死なせて欲しい」と訴えている。家族は本人の意向を尊重したいと言っている。\n行うべき対応はどれか。",
        "choices": {
            "a": "胃瘻造設",
            "b": "経過観察",
            "c": "筋弛緩薬静注",
            "d": "高カロリー輸液",
            "e": "疼痛コントロール"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    35: {
        "stem": "①57歳の男性。呼吸困難を主訴に来院した。3日前から咳嗽があり、昨日から発熱、本日から呼吸困難が出現した。②同居家族にも発熱と咳嗽を認める。既往歴に特記すべきことはない。意識レベルはJCSⅠ-3。③体温38.2 ℃。脈拍104/分、整。血圧110/68 mmHg。呼吸数28/分。④SpO2 90 %（room air）。口腔内と皮膚は乾燥している。⑤右胸部にcoarse cracklesを聴取する。胸部エックス線写真で右中肺野に浸潤影を認めた。\n下線部のうち、意識レベルと口腔内・皮膚所見に加えて入院が必要と判断する要素はどれか。",
        "choices": {
            "a": "①",
            "b": "②",
            "c": "③",
            "d": "④",
            "e": "⑤"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    36: {
        "stem": "1歳の男児。灯油を誤飲したため救急車で搬入された。父親が石油ストーブの給油タンクに灯油を入れる準備中に、灯油吸引用ポンプを舐めてしまった。一緒にいた父親が救急車を要請した。意識は清明。体温36.5 ℃。心拍数120/分、整。血圧90/50 mmHg。呼吸数30/分。SpO2 98 %（room air）。口腔内から灯油臭がしている。呼吸音に異常を認めない。\n父親への説明で適切なのはどれか。",
        "choices": {
            "a": "「吐かせましょう」",
            "b": "「胃洗浄をしましょう」",
            "c": "「牛乳を飲ませましょう」",
            "d": "「人工呼吸管理にしましょう」",
            "e": "「入院して経過をみましょう」"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    37: {
        "stem": "53歳の女性。脂質異常症と診断され、食事療法と運動療法を行っている。本日の外来までに2か月で体重は1 kg減ったものの脂質異常は改善せず、担当医は患者と相談し脳血管障害を予防するために内服薬を開始することとした。患者は「脳卒中にはなりたくない。でも治療費はなるべく低く抑えたい。」と言っている。\n脂質異常症に対する内服薬の脳血管障害発症予防効果および年間薬剤費の表を示す。なお、脂質異常症に対する効果はいずれの内服薬も同程度とする。\n内服薬①：脳血管障害10%減・年間薬剤費20,000円、②：10%減・12,000円、③：10%減・4,000円、④：不変・20,000円、⑤：不変・4,000円\n費用対効果の視点を踏まえて、この患者に開始する内服薬はどれか。",
        "choices": {
            "a": "①",
            "b": "②",
            "c": "③",
            "d": "④",
            "e": "⑤"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    38: {
        "stem": "1歳の男児。全身の皮疹を主訴に母親に連れられて来院した。2週間前に感冒様症状があり、その後、感冒様症状は改善したが、1週間前から下肢の皮疹が出現した。2日前から全身に皮疹を認めるようになったため受診した。腹痛および関節痛は認めない。関節内出血や筋肉内出血の既往はない。家族歴に特記すべきことはない。身長80 cm、体重10 kg。体温36.5 ℃。脈拍120/分、整。呼吸数32/分。顔色良好、眼瞼結膜と眼球結膜とに異常を認めない。咽頭に発赤を認めない。頸部リンパ節を触知しない。心音と呼吸音とに異常を認めない。腹部は平坦、軟で、肝・脾を触知しない。皮疹は上からガラス板で圧迫しても退色しない。頰部、腹部および左下腿の皮疹の写真（別冊No. 5A〜C）を別に示す。\n予想される血液検査値はどれか。",
        "choices": {
            "a": "PT延長",
            "b": "APTT延長",
            "c": "血小板数低値",
            "d": "Dダイマー高値",
            "e": "フィブリノゲン低値"
        },
        "has_image": True, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    39: {
        "stem": "65歳の女性。めまいを主訴に来院した。今朝、起床時に寝返りを打ったところ天井がぐるぐる回り、悪心を伴ったため、ベッド上で安静にしていた。めまいと悪心は1分程度で消失した。その後、朝食の準備中に振り向いた際に同様のめまいと悪心が再び出現したため、心配になり受診した。安静時のめまいはない。頭痛、耳鳴および難聴はない。意識は清明。体温36.5 ℃。脈拍72/分、整。血圧122/76 mmHg。神経診察で異常を認めない。\n良性発作性頭位めまい症の診断予測スコアを表1に、その診断スコア合計点別の尤度比を表2に示す。\n表1 良性発作性頭位めまい症の診断予測スコア：めまいの持続時間2分以内(1点)、寝返りで誘発される(2点)、安静時にめまいがある(-1点)\n表2 診断スコア合計点別の陽性尤度比：-1点(0.1)、0点(0.2)、1点(1.3)、2点(2.8)、3点(6.8)\nこの患者における良性発作性頭位めまい症の事前確率が40 %である場合、この患者における良性発作性頭位めまい症の事後確率に最も近いのはどれか。",
        "choices": {
            "a": "8 %",
            "b": "19 %",
            "c": "47 %",
            "d": "65 %",
            "e": "82 %"
        },
        "has_image": False, "is_calculation": True, "has_kinki": False, "is_deleted": False
    },
    40: {
        "stem": "48歳の女性。腰痛と両下肢痛を主訴に来院した。昨日の朝、ごみ出しをした後から腰痛が出現し、両下肢にも痛みとしびれがみられた。市販の鎮痛薬を内服して様子をみていた。今朝①ベッドから起き上がるときに痛みが増強した。また、②今朝から尿が出にくくなった。③最近顔がほてったりする。④8年前に子宮頸癌に対する手術を受けた。喫煙歴はない。飲酒は夫と週にワイン1本を飲む。⑤この1年間で体重が4 kg増加した。意識は清明。身長152 cm、体重68 kg。体温36.8 ℃。脈拍80/分、整。血圧124/76 mmHg。呼吸数22/分。SpO2 98 %（room air）。頭頸部と胸腹部に異常を認めない。肛門括約筋の収縮は減弱している。両側足関節底屈筋力の低下を認める。会陰部に知覚障害がある。腰部に強い痛みがあり、両臀部から大腿後面にかけて強い痛みとしびれを認める。上肢腱反射は正常。下肢では両側のアキレス腱反射が減弱している。\n下線部の病歴のうち、緊急性が高いのはどれか。",
        "choices": {
            "a": "①",
            "b": "②",
            "c": "③",
            "d": "④",
            "e": "⑤"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    # 長文: 41-42 (アナフィラキシーショック)
    41: {
        "stem": "次の文を読み、41、42の問いに答えよ。\n52歳の女性。腹部造影CT検査のために来院した。\n【現病歴】2週間前の健康診断で実施された腹部超音波検査で肝臓の結節性病変を指摘されたため、精査目的で受診した。医師から造影CT検査について説明を受け、静脈路確保後に腹部造影CT検査が施行された。造影CT検査前の意識は清明で、バイタルサインに異常は認めなかったが、検査を終了してから5分後に息苦しさと気分不快が出現した。\n【既往歴】脂質異常症で食事療法を行っている。\n【生活歴】会社で事務職をしている。夫と2人暮らし。喫煙歴はない。飲酒は機会飲酒。ペットは飼育していない。\n【家族歴】父が肺癌。\n【現症】意識レベルはJCSⅡ-10。身長160 cm、体重56 kg。体温35.0 ℃。脈拍112/分、整。血圧76/48 mmHg。呼吸数28/分。SpO2 96 %（room air）。毛細血管再充満時間は3秒である。冷感と皮膚の湿潤を認める。眼瞼結膜と眼球結膜とに異常を認めない。顔面に浮腫、胸腹部に発赤と腫脹を認める。心音に異常を認めない。発声は可能であるが、吸気性喘鳴を認める。\n直ちに投与すべき薬剤はどれか。",
        "choices": {
            "a": "アドレナリン",
            "b": "アトロピン",
            "c": "グルココルチコイド",
            "d": "グルコン酸カルシウム",
            "e": "ジアゼパム"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    42: {
        "stem": "経過観察のために入院となったが、症状は消失し、翌日に退院した。入院中に病歴を再度聴取したところ、以前にヨード造影剤を静注した際に気分不快が出現したことが判明した。\nこの患者における有害事象の再発防止に必要なのはどれか。",
        "choices": {
            "a": "クリニカルパスを作成する。",
            "b": "医療事故調査制度を利用する。",
            "c": "医療安全支援センターを利用する。",
            "d": "使用した造影剤の製薬会社に報告する。",
            "e": "患者の診療録上の所定の位置に有害事象を記録する。"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    # 長文: 43-44 (左心不全 / 薬剤性心筋障害)
    43: {
        "stem": "次の文を読み、43、44の問いに答えよ。\n74歳の女性。感冒様症状を主訴に来院した。\n【現病歴】現在、医療機関に通院していない。2週間前から、微熱と咳嗽が続き、①食欲が低下している。市販の感冒薬を服用したが、改善しないため受診した。\n【既往歴】小学生の時に気管支喘息、22歳時に虫垂炎、54歳時に胆石症、68歳時に脊椎圧迫骨折、70歳時に悪性リンパ腫。\n【生活歴】喫煙歴と飲酒歴はない。\n【家族歴】母は乳癌で死亡。\n【現症】意識は清明。身長160 cm、体重58 kg。体温36.3 ℃。脈拍84/分、整。血圧120/78 mmHg。呼吸数20/分。SpO2 86 %（room air）。眼瞼結膜と眼球結膜とに異常を認めない。②頸静脈の怒張を認める。頸部リンパ節を触知しない。心音に異常を認めない。③両肺野にcoarse cracklesを聴取する。腹部は腸雑音に異常を認めない。④肋骨弓下に肝を1 cm触知する。⑤両下肢に圧痕性の浮腫を認める。\n【検査所見】尿所見：蛋白（－）、糖（－）、ケトン体（－）、潜血（－）、沈渣に異常を認めない。血液所見：赤血球454万、Hb 13.2 g/dL、Ht 42 %、白血球7,000、血小板18万、Dダイマー2.6 μg/mL（基準1.0以下）。血液生化学所見：アルブミン3.9 g/dL、総ビリルビン1.2 mg/dL、AST 24 U/L、ALT 18 U/L、LD 182 U/L（基準124〜222）、CK 62 U/L（基準41〜153）、尿素窒素14 mg/dL、クレアチニン0.9 mg/dL、尿酸6.9 mg/dL、血糖84 mg/dL、HbA1c 5.8 %（基準4.9〜6.0）、トリグリセリド74 mg/dL、HDLコレステロール36 mg/dL、LDLコレステロール76 mg/dL、Na 132 mEq/L、K 4.0 mEq/L、BNP 356 pg/mL（基準18.4以下）。CRP 0.3 mg/dL。心電図に異常を認めない。胸部エックス線写真で心胸郭比56 %、軽度のうっ血を認める。心エコー検査で左室駆出率32 %であった。\n下線部のうち、左心不全に特徴的な徴候はどれか。",
        "choices": {
            "a": "①",
            "b": "②",
            "c": "③",
            "d": "④",
            "e": "⑤"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    44: {
        "stem": "薬剤性の心筋障害を疑った場合、既往歴のうち特に詳細に聴取すべき病歴はどれか。",
        "choices": {
            "a": "気管支喘息",
            "b": "虫垂炎",
            "c": "胆石症",
            "d": "脊椎圧迫骨折",
            "e": "悪性リンパ腫"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    # 長文: 45-46 (急性虫垂炎)
    45: {
        "stem": "次の文を読み、45、46の問いに答えよ。\n32歳の男性。腹痛を主訴に来院した。\n【現病歴】本日起床時から腹痛が出現した。悪心を伴い朝食を食べられなかった。出社時間となっても症状が改善しないため受診した。\n【既往歴】小学生時に気管支喘息のため吸入薬を使用していた。\n【生活歴】広告会社で勤務している。喫煙は10本/日を10年間。飲酒は機会飲酒。4年前に結婚し、妻と1歳の男児の3人暮らし。3年前から猫を2匹飼っている。海外渡航歴はない。\n【家族歴】父が60歳時に胃癌で手術。母が糖尿病で服薬治療中。\n【現症】身長178 cm、体重68 kg。体温37.3 ℃。脈拍72/分、整。血圧132/78 mmHg。眼瞼結膜と眼球結膜とに異常を認めない。甲状腺と頸部リンパ節を触知しない。心音と呼吸音とに異常を認めない。腹部は平坦。腸雑音はやや亢進している。肝・脾を触知しない。腹部正中に軽度の圧痛を認める。下腿に浮腫を認めない。\n【検査所見】尿所見：蛋白（－）、糖（－）、ケトン体1＋、潜血（－）、沈渣に白血球を認めない。血液所見：赤血球488万、Hb 14.6 g/dL、Ht 44 %、白血球12,300、血小板21万。血液生化学所見：総蛋白7.6 g/dL、アルブミン3.9 g/dL、総ビリルビン0.9 mg/dL、AST 28 U/L、ALT 16 U/L、LD 177 U/L（基準124〜222）、ALP 83 U/L（基準38〜113）、γ-GT 32 U/L（基準13〜64）、アミラーゼ50 U/L（基準44〜132）、CK 60 U/L（基準59〜248）、尿素窒素19 mg/dL、クレアチニン0.9 mg/dL、尿酸6.2 mg/dL、血糖98 mg/dL、Na 134 mEq/L、K 4.4 mEq/L、Cl 98 mEq/L。CRP 1.6 mg/dL。\n検査結果を説明後に、患者から「幼い子供がいるので、うつる病気かどうか心配です」と発言があった。\nこの発言に対する適切な問診はどれか。",
        "choices": {
            "a": "「夜は眠れますか」",
            "b": "「便秘はありますか」",
            "c": "「おなかの張りはありますか」",
            "d": "「手足のしびれはありますか」",
            "e": "「周りに同じ症状の人はいますか」"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    46: {
        "stem": "外来受診後、自宅で安静にしていたが、夕方になり腹痛が増悪したため再受診した。腹痛の部位が移動し、右下腹部に圧痛を認めた。\nこの患者に認める可能性の高い所見はどれか。",
        "choices": {
            "a": "黄疸",
            "b": "下血",
            "c": "波動",
            "d": "金属音",
            "e": "反跳痛"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    # 長文: 47-48 (気管支喘息)
    47: {
        "stem": "次の文を読み、47、48の問いに答えよ。\n75歳の女性。呼吸困難を主訴に救急車で搬入された。\n【現病歴】8年前に認知症と診断され、現在は直前の出来事も記憶していない。1週間前から咳嗽が増加し、市販の咳止めを内服したが改善しなかった。昨夜から呼吸困難が強くなり、喘鳴が家族にも聴取できるようになった。かかりつけ医に処方されていた吸入薬を使用したが今朝になっても改善しないため、家族が救急車を要請した。\n【既往歴】認知症のほかに、40歳時から気管支喘息で発作時の吸入薬を処方されている。\n【生活歴】喫煙歴と飲酒歴はない。\n【家族歴】父が80歳時に脳梗塞で死亡。母が65歳時に胃癌で死亡。\n【現症】ベッド上で仰臥位となっている。会話は可能だが見当識に関連する質問には回答できない。身長143 cm、体重46 kg。体温36.6 ℃。心拍数92/分、整。血圧146/68 mmHg。呼吸数20/分。SpO2 99 %（マスク5 L/分 酸素投与下）。頸静脈の怒張を認めない。口腔内と咽頭とに異常を認めない。両側全肺野で呼気時にwheezesを聴取する。腹部は平坦、軟で、肝・脾を触知しない。四肢に浮腫を認めない。\n【検査所見】尿所見：蛋白（－）、糖（－）、ケトン体（－）、潜血（－）。血液所見：赤血球452万、Hb 13.8 g/dL、Ht 41 %、白血球5,440（好中球43 %、好酸球12 %、好塩基球1 %、単球6 %、リンパ球38 %）、血小板21万。血液生化学所見：総蛋白7.3 g/dL、アルブミン3.7 g/dL、総ビリルビン0.5 mg/dL、直接ビリルビン0.1 mg/dL、AST 19 U/L、ALT 10 U/L、LD 230 U/L（基準124〜222）、CK 40 U/L（基準41〜153）、尿素窒素10 mg/dL、クレアチニン0.6 mg/dL、尿酸5.3 mg/dL、血糖98 mg/dL、Na 139 mEq/L、K 4.2 mEq/L、Cl 106 mEq/L、Ca 8.9 mg/dL、P 4.0 mg/dL。CRP 0.4 mg/dL。動脈血ガス分析（マスク5 L/分 酸素投与下）：pH 7.46、PaCO2 31 Torr、PaO2 92 Torr、HCO3- 21 mEq/L。心電図で異常を認めない。胸部エックス線写真で異常を認めない。\nこの患者の前腕から静脈投与を行う。\n静脈留置針の自己抜去を防ぐために行う対応で適切なのはどれか。",
        "choices": {
            "a": "薬剤は持続点滴で投与する。",
            "b": "両上肢を抑制帯で固定する。",
            "c": "できるだけ太い留置針を用いる。",
            "d": "夜間も患者周囲の照明をできるだけ明るくする。",
            "e": "患者から見えないように寝衣の袖の中に点滴ルートを通す。"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    48: {
        "stem": "β2刺激薬の吸入を行ったが呼吸困難と喘鳴が改善しない。\n次に静脈内投与すべき薬剤はどれか。",
        "choices": {
            "a": "アトロピン",
            "b": "ジアゼパム",
            "c": "フロセミド",
            "d": "アドレナリン",
            "e": "グルココルチコイド"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    # 長文: 49-50 (気胸)
    49: {
        "stem": "次の文を読み、49、50の問いに答えよ。\n17歳の男子。胸痛を主訴に来院した。\n【現病歴】昨日午後、高校の授業中に左胸部痛と呼吸困難を自覚し、当院を受診し、胸部エックス線撮影を施行された。一旦帰宅したが、本日朝になっても軽度の左胸痛が持続するため、再度受診した。\n【既往歴】特記すべきことはない。\n【生活歴】両親、大学生の兄と同居。アレルギー歴はない。\n【現症】意識は清明。身長182 cm、体重66 kg。体温36.5 ℃。脈拍80/分、整。血圧110/78 mmHg。呼吸数18/分。SpO2 96 %（room air）。心音に異常を認めない。\n【検査所見】血液所見：赤血球500万、Hb 14.9 g/dL、Ht 45 %、白血球8,300、血小板29万。血液生化学所見：AST 21 U/L、ALT 18 U/L、LD 180 U/L（基準124〜222）。本日来院時の胸部エックス線写真（別冊No. 6A）と胸部単純CT（別冊No. 6B）とを別に示す。\nこの患者でみられる所見はどれか。",
        "choices": {
            "a": "奇異呼吸",
            "b": "胸部握雪感",
            "c": "左上肢浮腫",
            "d": "左頸静脈怒張",
            "e": "左呼吸音減弱"
        },
        "has_image": True, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
    50: {
        "stem": "昨日と本日の胸部エックス線写真を比較して、大きな変化は認められなかった。\n適切な治療方針はどれか。",
        "choices": {
            "a": "抗菌薬投与",
            "b": "昇圧薬投与",
            "c": "外来で経過観察",
            "d": "気管支拡張薬吸入",
            "e": "緊急胸腔鏡下手術"
        },
        "has_image": False, "is_calculation": False, "has_kinki": False, "is_deleted": False
    },
}


def build_answer(num, raw):
    """正答を正規化する"""
    if isinstance(raw, list):
        return [x.lower() for x in raw]
    return raw.lower()


def build_num_answers(num, raw):
    if isinstance(raw, list):
        return len(raw)
    return 1


def main():
    questions_list = []
    calc_questions = {29, 39}  # 計算問題番号

    for num in range(1, 51):
        q = QUESTIONS[num]
        meta = MEDU4_META[num]
        raw_answer = ANSWERS_RAW[num]

        answer = build_answer(num, raw_answer)
        num_answers = build_num_answers(num, raw_answer)
        is_calc = q.get("is_calculation", False)

        question = {
            "num": num,
            "id": f"119E{num}",
            "exam_year": 119,
            "block": "E",
            "stem": q["stem"],
            "choices": q["choices"],
            "answer": answer,
            "format": {
                "type1": meta["type1"],
                "type2": meta["type2"],
                "num_answers": num_answers,
                "has_image": q["has_image"],
                "is_calculation": is_calc,
                "has_kinki": q["has_kinki"],
                "is_deleted": q["is_deleted"]
            },
            "field": meta["field"],
            "subfield": meta["subfield"],
            "topic": meta["topic"],
            "action": None,
            "knowledge_type": None,
            "explanation": {
                "summary": None,
                "choices": {},
                "background": None,
                "key_point": None
            }
        }
        questions_list.append(question)

    output = {
        "exam_year": 119,
        "block": "E",
        "total_questions": 50,
        "source": "厚生労働省 第119回医師国家試験",
        "questions": questions_list
    }

    out_path = "/Users/tasuku/Desktop/iwor/data/questions/119/119E.json"
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"Written: {out_path}")
    return output


# ── バリデーション ──
def validate(output):
    with open("/Users/tasuku/Desktop/iwor/docs/source-data/iwor-theme-taxonomy.json", encoding="utf-8") as f:
        taxonomy = json.load(f)

    categories = taxonomy["categories"]
    errors = []
    warnings = []
    questions = output["questions"]

    # 1. 50問あるか
    if len(questions) != 50:
        errors.append(f"問題数が50ではない: {len(questions)}")

    # 正答照合用テーブル
    expected = {
        1: "d", 2: "c", 3: "e", 4: "b", 5: "a",
        6: "a", 7: "b", 8: "d", 9: "e", 10: "a",
        11: "e", 12: "e", 13: "e", 14: "a", 15: "c",
        16: "e", 17: "a", 18: "d", 19: "e", 20: "d",
        21: "e", 22: "a", 23: "a", 24: "e", 25: "d",
        26: "b", 27: "d", 28: ["a", "c"], 29: "b", 30: "b",
        31: "e", 32: "d", 33: "c", 34: "e", 35: "d",
        36: "e", 37: "c", 38: "c", 39: "e", 40: "b",
        41: "a", 42: "e", 43: "c", 44: "e", 45: "e",
        46: "e", 47: "e", 48: "e", 49: "e", 50: "c",
    }

    for q in questions:
        num = q["num"]

        # 2. 正答チェック
        exp = expected.get(num)
        got = q["answer"]
        if exp != got:
            errors.append(f"E{num:03d} 正答不一致: expected={exp}, got={got}")

        # 3. subfield がタクソノミーに存在するか
        field = q["field"]
        subfield = q["subfield"]
        topic = q["topic"]

        if subfield not in categories.get(field, {}).get("subcategories", {}):
            found_sf = False
            for cat_key, cat_val in categories.items():
                if subfield in cat_val.get("subcategories", {}):
                    found_sf = True
                    if cat_key != field:
                        errors.append(f"E{num:03d} field不一致: subfield={subfield}はfield={cat_key}に属するが、field={field}と設定")
                    break
            if not found_sf:
                errors.append(f"E{num:03d} subfield={subfield}がタクソノミーに存在しない")
        else:
            topics_in_sf = categories[field]["subcategories"][subfield].get("topics", [])
            if topic not in topics_in_sf:
                warnings.append(f"E{num:03d} topic='{topic}'がsubfield={subfield}に存在しない（近似トピックで要確認）")

        # 4. field == subfield prefix チェック
        sf_prefix = subfield.split("-")[0] if "-" in subfield else subfield
        if sf_prefix != field:
            errors.append(f"E{num:03d} field={field}とsubfield prefix={sf_prefix}が一致しない")

    print("\n=== バリデーション結果 ===")
    print(f"問題数: {len(questions)}/50")
    print(f"エラー数: {len(errors)}")
    print(f"警告数: {len(warnings)}")

    if errors:
        print("\n[ERRORS]")
        for e in errors:
            print(f"  {e}")

    if warnings:
        print("\n[WARNINGS]")
        for w in warnings:
            print(f"  {w}")

    if not errors:
        print("\nバリデーション PASSED")
    else:
        print("\nバリデーション FAILED")
        raise SystemExit(1)


if __name__ == "__main__":
    output = main()
    validate(output)
