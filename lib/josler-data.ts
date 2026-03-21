/**
 * J-OSLER 領域・疾患群・疾患データ
 * 
 * Source: 内科専門医制度 J-OSLER 症例登録ガイドライン
 * Used by: /dashboard (病棟TODO), /josler (J-OSLER管理)
 */

export interface Specialty {
  id: string
  label: string
  short: string
  minC: number | null  // 最低症例数
  minG: number         // 最低疾患群数
  minS: number         // 最低病歴要約数
  color: string        // テーマカラー
}

export interface DiseaseGroup {
  id: string
  name: string
  gc?: string | null   // カテゴリ (消化器の消化管/肝臓/胆膵)
  diseases: string[]
}

export const SPECIALTIES: Specialty[] = [
  { id: "generalI",   label: "総合内科Ⅰ（一般）",   short: "総合Ⅰ",    minC: null, minG: 1, minS: 1, color: "#4ECDC4" },
  { id: "generalII",  label: "総合内科Ⅱ（高齢者）", short: "総合Ⅱ",    minC: null, minG: 1, minS: 1, color: "#4ECDC4" },
  { id: "generalIII", label: "総合内科Ⅲ（腫瘍）",   short: "総合Ⅲ",    minC: null, minG: 1, minS: 1, color: "#4ECDC4" },
  { id: "gastro",     label: "消化器",               short: "消化器",    minC: 10,   minG: 5, minS: 3, color: "#FF6B6B" },
  { id: "cardio",     label: "循環器",               short: "循環器",    minC: 10,   minG: 5, minS: 3, color: "#E84393" },
  { id: "endo",       label: "内分泌",               short: "内分泌",    minC: 3,    minG: 2, minS: 1, color: "#A8E6CF" },
  { id: "metabolic",  label: "代謝",                 short: "代謝",      minC: 10,   minG: 3, minS: 2, color: "#A8E6CF" },
  { id: "renal",      label: "腎臓",                 short: "腎臓",      minC: 10,   minG: 4, minS: 2, color: "#6C63FF" },
  { id: "pulm",       label: "呼吸器",               short: "呼吸器",    minC: 10,   minG: 4, minS: 3, color: "#45B7D1" },
  { id: "hematology", label: "血液",                 short: "血液",      minC: 3,    minG: 2, minS: 2, color: "#FF8B94" },
  { id: "neuro",      label: "神経",                 short: "神経",      minC: 10,   minG: 5, minS: 2, color: "#FFD93D" },
  { id: "allergy",    label: "アレルギー",           short: "アレルギー", minC: 3,    minG: 1, minS: 1, color: "#C4B5FD" },
  { id: "rheum",      label: "膠原病及び類縁疾患",   short: "膠原病",    minC: 3,    minG: 1, minS: 1, color: "#FDA4AF" },
  { id: "infection",  label: "感染症",               short: "感染症",    minC: 8,    minG: 2, minS: 2, color: "#6EE7B7" },
  { id: "emergency",  label: "救急",                 short: "救急",      minC: 10,   minG: 4, minS: 2, color: "#FCA5A5" },
  { id: "surgical",   label: "外科紹介症例",         short: "外科紹介",  minC: 2,    minG: 0, minS: 2, color: "#94A3B8" },
  { id: "autopsy",    label: "剖検症例",             short: "剖検",      minC: 1,    minG: 0, minS: 1, color: "#64748B" },
]

export const DISEASE_GROUPS: Record<string, DiseaseGroup[]> = {
  generalI: [
    { id: "g1", name: "全身性疾患・不明熱", diseases: ["不明熱", "全身性炎症反応症候群", "多臓器不全", "悪液質", "体重減少"] },
    { id: "g2", name: "医療コミュニケーション・倫理", diseases: ["インフォームドコンセント困難例", "終末期・緩和ケア", "ACP", "意思決定支援"] },
    { id: "g3", name: "在宅・地域医療", diseases: ["在宅医療", "訪問診療", "退院支援", "地域連携パス"] },
  ],
  generalII: [
    { id: "g4", name: "老年症候群", diseases: ["フレイル", "サルコペニア", "転倒・骨折リスク", "老年期うつ", "せん妄", "廃用症候群"] },
    { id: "g5", name: "認知症", diseases: ["アルツハイマー型認知症", "レビー小体型認知症", "血管性認知症", "前頭側頭型認知症", "BPSD"] },
    { id: "g6", name: "高齢者の薬物療法", diseases: ["ポリファーマシー", "薬物有害反応", "薬物相互作用", "減薬支援"] },
  ],
  generalIII: [
    { id: "g7", name: "悪性腫瘍（総論）", diseases: ["固形腫瘍（原発不明）", "がん性疼痛管理", "腫瘍崩壊症候群", "がん関連静脈血栓症"] },
    { id: "g8", name: "腫瘍内科学", diseases: ["化学療法の副作用管理", "免疫チェックポイント阻害薬有害事象", "支持療法", "栄養管理"] },
  ],
  gastro: [
    { id: "g9", gc: "消化管", name: "食道・胃疾患", diseases: ["逆流性食道炎", "食道癌", "胃潰瘍・十二指腸潰瘍", "胃癌", "H.pylori感染症", "機能性ディスペプシア"] },
    { id: "g10", gc: "消化管", name: "小腸・大腸疾患", diseases: ["潰瘍性大腸炎", "クローン病", "大腸癌", "過敏性腸症候群", "腸閉塞", "虚血性腸炎", "感染性腸炎"] },
    { id: "g11", gc: "消化管", name: "消化管出血", diseases: ["上部消化管出血", "下部消化管出血", "Mallory-Weiss症候群", "食道静脈瘤出血"] },
    { id: "g12", gc: "肝臓", name: "肝疾患", diseases: ["急性肝炎", "慢性肝炎", "肝硬変", "肝細胞癌", "自己免疫性肝炎", "NAFLD/NASH", "アルコール性肝障害"] },
    { id: "g13", gc: "胆・膵", name: "胆道疾患", diseases: ["胆石症・胆嚢炎", "急性胆管炎", "胆管癌", "胆嚢癌", "原発性硬化性胆管炎"] },
    { id: "g14", gc: "胆・膵", name: "膵疾患", diseases: ["急性膵炎", "慢性膵炎", "膵癌", "自己免疫性膵炎", "膵神経内分泌腫瘍"] },
    { id: "g15", name: "腹膜・その他消化器", diseases: ["腹膜炎", "腸間膜虚血", "腹水"] },
  ],
  cardio: [
    { id: "g16", name: "虚血性心疾患", diseases: ["急性心筋梗塞（STEMI）", "急性心筋梗塞（NSTEMI）", "不安定狭心症", "安定狭心症", "Prinzmetal狭心症"] },
    { id: "g17", name: "心不全", diseases: ["急性心不全", "慢性心不全", "HFrEF", "HFpEF", "心原性ショック"] },
    { id: "g18", name: "不整脈", diseases: ["心房細動", "心房粗動", "発作性上室頻拍", "心室頻拍", "心室細動", "完全房室ブロック", "洞不全症候群"] },
    { id: "g19", name: "弁膜症", diseases: ["大動脈弁狭窄症", "僧帽弁閉鎖不全症", "感染性心内膜炎", "大動脈弁閉鎖不全症"] },
    { id: "g20", name: "心筋症・心膜疾患", diseases: ["拡張型心筋症", "肥大型心筋症", "心筋炎", "心膜炎", "心タンポナーデ", "たこつぼ症候群"] },
    { id: "g21", name: "大血管・末梢血管疾患", diseases: ["大動脈解離", "大動脈瘤", "閉塞性動脈硬化症", "深部静脈血栓症", "肺塞栓症"] },
    { id: "g22", name: "先天性心疾患・その他", diseases: ["成人先天性心疾患", "心臓腫瘍", "心臓サルコイドーシス"] },
  ],
  endo: [
    { id: "g23", name: "甲状腺疾患", diseases: ["バセドウ病", "橋本病", "甲状腺癌", "亜急性甲状腺炎", "甲状腺クリーゼ"] },
    { id: "g24", name: "副腎疾患", diseases: ["原発性アルドステロン症", "クッシング症候群", "褐色細胞腫", "副腎不全"] },
    { id: "g25", name: "下垂体・視床下部疾患", diseases: ["先端巨大症", "プロラクチノーマ", "下垂体機能低下症", "尿崩症", "SIADH"] },
    { id: "g26", name: "副甲状腺・Ca代謝", diseases: ["原発性副甲状腺機能亢進症", "副甲状腺機能低下症", "高Ca血症", "低Ca血症"] },
    { id: "g27", name: "性腺・その他内分泌", diseases: ["MEN", "カルチノイド症候群"] },
  ],
  metabolic: [
    { id: "g28", name: "糖尿病", diseases: ["1型糖尿病", "2型糖尿病", "糖尿病ケトアシドーシス", "高浸透圧高血糖症候群", "低血糖症"] },
    { id: "g29", name: "脂質異常症", diseases: ["家族性高コレステロール血症", "高トリグリセリド血症", "メタボリックシンドローム"] },
    { id: "g30", name: "肥満症", diseases: ["肥満症", "二次性肥満"] },
    { id: "g31", name: "高尿酸血症・痛風", diseases: ["痛風発作", "痛風腎", "無症候性高尿酸血症"] },
    { id: "g32", name: "その他の代謝疾患", diseases: ["ウィルソン病", "アミロイドーシス", "骨粗鬆症"] },
  ],
  renal: [
    { id: "g33", name: "急性腎障害（AKI）", diseases: ["腎前性AKI", "急性尿細管壊死", "急性間質性腎炎", "急速進行性糸球体腎炎"] },
    { id: "g34", name: "慢性腎臓病（CKD）", diseases: ["糖尿病性腎症", "高血圧性腎硬化症", "慢性糸球体腎炎", "多発性嚢胞腎"] },
    { id: "g35", name: "糸球体腎炎", diseases: ["IgA腎症", "微小変化型ネフローゼ", "膜性腎症", "巣状分節性糸球体硬化症", "ループス腎炎"] },
    { id: "g36", name: "腎代替療法", diseases: ["血液透析", "腹膜透析", "腎移植"] },
    { id: "g37", name: "尿路疾患・電解質異常", diseases: ["尿路感染症", "尿路結石", "低Na血症", "高K血症", "代謝性アシドーシス"] },
  ],
  pulm: [
    { id: "g38", name: "気道疾患", diseases: ["気管支喘息", "COPD", "気管支拡張症"] },
    { id: "g39", name: "肺感染症", diseases: ["市中肺炎", "院内肺炎", "非定型肺炎", "肺結核", "非結核性抗酸菌症", "肺真菌症"] },
    { id: "g40", name: "間質性肺疾患", diseases: ["特発性肺線維症", "過敏性肺炎", "膠原病関連ILD", "サルコイドーシス", "薬剤性肺障害"] },
    { id: "g41", name: "胸膜・縦隔疾患", diseases: ["胸水", "自然気胸", "膿胸", "中皮腫", "縦隔腫瘍"] },
    { id: "g42", name: "肺循環・呼吸不全", diseases: ["肺高血圧症", "ARDS", "急性呼吸不全", "慢性呼吸不全", "睡眠時無呼吸症候群"] },
    { id: "g43", name: "肺腫瘍", diseases: ["肺癌（腺癌）", "肺癌（扁平上皮癌）", "肺癌（小細胞癌）"] },
  ],
  hematology: [
    { id: "g44", name: "貧血", diseases: ["鉄欠乏性貧血", "巨赤芽球性貧血", "溶血性貧血", "再生不良性貧血", "骨髄異形成症候群"] },
    { id: "g45", name: "白血病・リンパ腫", diseases: ["AML", "ALL", "CML", "DLBCL", "濾胞性リンパ腫", "ホジキンリンパ腫"] },
    { id: "g46", name: "骨髄腫・形質細胞疾患", diseases: ["多発性骨髄腫", "MGUS"] },
    { id: "g47", name: "出血・血栓性疾患", diseases: ["ITP", "DIC", "血友病", "TTP/TMA", "抗リン脂質抗体症候群"] },
    { id: "g48", name: "血液腫瘍合併症", diseases: ["発熱性好中球減少症", "腫瘍崩壊症候群", "輸血療法", "造血幹細胞移植"] },
  ],
  neuro: [
    { id: "g49", name: "脳血管障害", diseases: ["脳梗塞（アテローム性）", "脳梗塞（心原性）", "脳梗塞（ラクナ）", "脳出血", "くも膜下出血", "TIA"] },
    { id: "g50", name: "変性疾患", diseases: ["パーキンソン病", "多系統萎縮症", "進行性核上性麻痺"] },
    { id: "g51", name: "脱髄疾患", diseases: ["多発性硬化症", "NMOSD", "ADEM"] },
    { id: "g52", name: "末梢神経・神経筋疾患", diseases: ["ギラン・バレー症候群", "CIDP", "重症筋無力症", "ALS"] },
    { id: "g53", name: "てんかん・意識障害", diseases: ["てんかん", "てんかん重積状態", "意識障害の鑑別", "代謝性脳症"] },
    { id: "g54", name: "感染性・免疫性神経疾患", diseases: ["細菌性髄膜炎", "ウイルス性脳炎", "自己免疫性脳炎"] },
    { id: "g55", name: "頭痛・めまい", diseases: ["片頭痛", "群発頭痛", "緊張型頭痛", "BPPV", "メニエール病"] },
  ],
  allergy: [
    { id: "g56", name: "アレルギー疾患", diseases: ["アナフィラキシー", "アレルギー性鼻炎", "食物アレルギー", "薬物アレルギー", "蕁麻疹"] },
    { id: "g57", name: "職業性・環境性アレルギー", diseases: ["職業性喘息", "過敏性肺炎", "化学物質過敏症"] },
  ],
  rheum: [
    { id: "g58", name: "関節リウマチ・脊椎関節炎", diseases: ["関節リウマチ", "強直性脊椎炎", "乾癬性関節炎"] },
    { id: "g59", name: "全身性自己免疫疾患", diseases: ["SLE", "シェーグレン症候群", "全身性強皮症", "多発性筋炎・皮膚筋炎", "MCTD", "成人Still病"] },
    { id: "g60", name: "血管炎症候群", diseases: ["ANCA関連血管炎", "結節性多発動脈炎", "巨細胞性動脈炎", "高安動脈炎", "IgA血管炎"] },
    { id: "g61", name: "結晶性関節炎・その他", diseases: ["リウマチ性多発筋痛症", "痛風関節炎", "偽痛風", "線維筋痛症"] },
  ],
  infection: [
    { id: "g62", name: "細菌感染症", diseases: ["市中肺炎", "尿路感染症・腎盂腎炎", "感染性心内膜炎", "骨髄炎", "腹腔内感染症", "皮膚軟部組織感染症", "結核", "梅毒"] },
    { id: "g63", name: "ウイルス感染症", diseases: ["インフルエンザ", "COVID-19", "EBV感染症", "CMV感染症", "HIV/AIDS", "水痘・帯状疱疹"] },
    { id: "g64", name: "真菌・寄生虫感染症", diseases: ["カンジダ症", "アスペルギルス症", "クリプトコッカス症", "ニューモシスチス肺炎", "C.difficile感染症"] },
    { id: "g65", name: "敗血症・感染症各論", diseases: ["敗血症", "敗血症性ショック", "菌血症", "CRBSI", "薬剤耐性菌"] },
  ],
  emergency: [
    { id: "g66", name: "ショック・循環不全", diseases: ["循環血液量減少性ショック", "心原性ショック", "敗血症性ショック", "アナフィラキシーショック", "熱中症"] },
    { id: "g67", name: "意識障害・神経救急", diseases: ["意識障害の初期対応", "急性期脳卒中管理", "てんかん重積状態", "高血糖・低血糖緊急症"] },
    { id: "g68", name: "呼吸救急", diseases: ["急性呼吸不全", "ARDS", "喘息重積発作", "COPD急性増悪", "張力性気胸"] },
    { id: "g69", name: "代謝・中毒救急", diseases: ["急性薬物中毒", "重篤な酸塩基平衡障害", "重篤な電解質異常", "横紋筋融解症"] },
    { id: "g70", name: "外傷・その他救急", diseases: ["多発外傷", "熱傷", "溺水", "異物誤嚥", "心肺蘇生"] },
  ],
  surgical: [
    { id: "gs1", name: "外科紹介症例", diseases: ["消化管手術", "心臓外科手術", "血管外科手術", "腫瘍外科手術", "その他外科紹介"] },
  ],
  autopsy: [
    { id: "ga1", name: "剖検症例", diseases: ["死後診断確定症例", "臨床診断乖離症例", "稀少疾患確定診断症例", "CPC症例"] },
  ],
}
