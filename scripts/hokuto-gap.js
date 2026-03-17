#!/usr/bin/env node
// Hokuto vs iwor gap analysis

const ourTools = new Set([
  'a-drop','aa-gradient','abcd2','aims65','alvarado','anc','anion-gap','apache2','audit',
  'barthel-index','bisap','bmi','bsa','cam-icu','caprini','centor','cha2ds2-vasc','chads2',
  'charlson','child-pugh','cockcroft-gault','corrected-ca','corrected-phenytoin','curb-65',
  'dopamine-dose','ecog','egfr','fena','fib-4','fio2-table','free-water-deficit','gad7','gcs',
  'glasgow-blatchford','grace','harris-benedict','has-bled','heart-score','homa','ibw',
  'insulin-sliding','isth-dic','jcs','karnofsky','kcl-correction','ldl-friedewald',
  'light-criteria','maintenance-fluid','map','mascc','meld','meld-na','mrs','na-correction-rate',
  'na-deficit','news2','nihss','nyha','osmolality-gap','ottawa-ankle','padua','parkland','perc',
  'phq9','qsofa','qtc','ranson','rass','rcri','renal-dose-abx','rockall','sirs','sofa','spesi',
  'steroid-converter','timi','wells-dvt','wells-pe','winters-formula',
  // Also have in other sections:
  'gamma-calc', // ICU vasopressor page
])

// Hokuto tools mapped to potential slugs, grouped by priority
const hokutoGaps = {
  // === TIER 1: ER/ICU必須（最優先） ===
  tier1: [
    { slug: 'cchr', name: 'カナダ頭部CTルール (CCHR)', cat: 'neurology', desc: '成人頭部外傷のCT適応判断。GCS13-15の軽症頭部外傷が対象' },
    { slug: 'pecarn', name: 'PECARN小児頭部外傷ルール', cat: 'neurology', desc: '小児頭部外傷のCT適応。2歳未満/2歳以上で基準が異なる' },
    { slug: 'canadian-cspine', name: 'Canadian C-Spine Rule (CCR)', cat: 'neurology', desc: '頚椎損傷の画像検査適応判断' },
    { slug: 'nexus', name: 'NEXUS頚椎外傷基準', cat: 'neurology', desc: '頚椎外傷のCT評価基準' },
    { slug: 'rtpa-checklist', name: 'rt-PAチェックリスト', cat: 'neurology', desc: '脳梗塞に対する静注血栓溶解療法の適応チェック' },
    { slug: 'aspects', name: 'ASPECTSスコア', cat: 'neurology', desc: '急性期脳梗塞のCT早期虚血変化の定量評価' },
    { slug: 'add-risk', name: 'ADDリスクスコア', cat: 'cardiology', desc: '大動脈解離の診断リスク評価' },
    { slug: 'lrinec', name: 'LRINECスコア', cat: 'infectious', desc: '壊死性筋膜炎の診断予測' },
    { slug: 'fisher', name: 'Fisher分類', cat: 'neurology', desc: 'SAHのCTによる脳血管攣縮リスク分類' },
    { slug: 'hunt-hess', name: 'Hunt and Hess分類', cat: 'neurology', desc: 'SAH重症度分類' },
    { slug: 'wfns', name: 'WFNS分類', cat: 'neurology', desc: 'SAH重症度分類（GCSベース）' },
    { slug: 'ciwa-ar', name: 'CIWA-Arスコア', cat: 'general', desc: 'アルコール離脱症候群の重症度評価' },
    { slug: 'four-score', name: 'FOURスコア', cat: 'neurology', desc: '意識障害の分類（GCSの代替）' },
    { slug: 'cage', name: 'CAGEテスト', cat: 'general', desc: 'アルコール依存症スクリーニング' },
    { slug: 'psi-port', name: 'PSI/PORTスコア', cat: 'respiratory', desc: '市中肺炎の重症度分類（入院判断）' },
    { slug: 'smart-cop', name: 'SMART-COP', cat: 'respiratory', desc: '市中肺炎のICU/人工呼吸器必要性予測' },
    { slug: 'geneva', name: '改訂Genevaスコア', cat: 'cardiology', desc: 'PE診断予測（Wells代替）' },
    { slug: 'toast', name: 'TOAST分類', cat: 'neurology', desc: '脳梗塞の病型分類' },
    { slug: 'duke-criteria', name: 'Duke診断基準', cat: 'infectious', desc: '感染性心内膜炎の診断基準' },
    { slug: 'ottawa-sah', name: 'Ottawa SAHルール', cat: 'neurology', desc: '頭痛患者のSAH除外' },
    { slug: 'san-francisco-syncope', name: 'サンフランシスコ失神ルール', cat: 'cardiology', desc: '失神患者の入院適応(CHESS)' },
    { slug: 'sapsii', name: 'SAPS II', cat: 'general', desc: 'ICU入室患者の重症度予測' },
  ],

  // === TIER 2: 病棟・一般内科で頻用 ===
  tier2: [
    { slug: 'apgar', name: 'APGARスコア', cat: 'general', desc: '出生直後の新生児評価' },
    { slug: 'asa-ps', name: 'ASA-PS分類', cat: 'general', desc: '術前の全身状態分類' },
    { slug: 'gir', name: 'GIR (ブドウ糖投与速度)', cat: 'electrolyte', desc: 'ブドウ糖投与速度の算出' },
    { slug: 'candida-score', name: 'Candidaスコア', cat: 'infectious', desc: 'ICUカンジダ感染リスク' },
    { slug: 'cpot', name: 'CPOT', cat: 'general', desc: '重症患者の疼痛評価ツール' },
    { slug: 'bps-pain', name: 'BPS (Behavioral Pain Scale)', cat: 'general', desc: '鎮静患者の疼痛評価' },
    { slug: 'cfs', name: 'CFS臨床虚弱尺度', cat: 'general', desc: 'フレイル評価スケール' },
    { slug: 'hds-r', name: 'HDS-R（長谷川式）', cat: 'neurology', desc: '認知機能の評価' },
    { slug: 'mmse', name: 'MMSE', cat: 'neurology', desc: '認知機能スクリーニング' },
    { slug: 'mmt', name: 'MMT（徒手筋力テスト）', cat: 'general', desc: '筋力評価スケール' },
    { slug: 'mmrc', name: '修正MRC息切れスケール', cat: 'respiratory', desc: 'mMRC息切れ評価' },
    { slug: 'gold-copd', name: 'COPD病期分類(GOLD)', cat: 'respiratory', desc: 'COPD重症度分類' },
    { slug: 'bode', name: 'BODE指数', cat: 'respiratory', desc: 'COPD生存期間予測' },
    { slug: 'glim', name: 'GLIM基準', cat: 'general', desc: '低栄養の診断基準' },
    { slug: 'gnri', name: 'GNRI', cat: 'general', desc: '栄養の予後予測指標' },
    { slug: 'conut', name: 'CONUTスコア', cat: 'general', desc: '栄養の予後予測指標' },
    { slug: 'pni', name: 'PNI（予後推定栄養指数）', cat: 'general', desc: '栄養の予後予測指標' },
    { slug: 'nrs2002', name: 'NRS 2002', cat: 'general', desc: '栄養スクリーニング' },
    { slug: 'must-nutrition', name: 'MUSTスコア', cat: 'general', desc: '栄養スクリーニング' },
    { slug: 'sarc-f', name: 'SARC-F', cat: 'general', desc: 'サルコペニアスクリーニング' },
    { slug: 'ttkg', name: 'TTKG', cat: 'nephrology', desc: '尿細管カリウム濃度勾配' },
    { slug: 'fek', name: 'FEK（カリウム排泄率）', cat: 'nephrology', desc: '高K血症の原因精査' },
    { slug: 'geckler', name: 'Geckler分類', cat: 'respiratory', desc: '喀痰検体の顕微鏡的評価' },
    { slug: 'stone-score', name: 'STONEスコア', cat: 'nephrology', desc: '尿路結石の予測' },
    { slug: 'das28', name: 'DAS28', cat: 'general', desc: '関節リウマチ活動性評価' },
    { slug: 'cpc', name: 'CPC/OPC', cat: 'neurology', desc: '心肺蘇生後の機能評価' },
    { slug: 'opioid-conversion', name: 'オピオイド換算表', cat: 'general', desc: 'モルヒネ30mg基準の換算' },
    { slug: 'eat10', name: 'EAT-10', cat: 'general', desc: '簡易嚥下評価スコア' },
    { slug: 'design-r', name: 'DESIGN-R 2020', cat: 'general', desc: '褥瘡状態評価スケール' },
    { slug: 'drip-score', name: 'DRIPスコア', cat: 'infectious', desc: '抗菌薬耐性市中肺炎リスク' },
    { slug: 'i-road', name: 'I-ROADスコア', cat: 'respiratory', desc: '院内肺炎の重症度分類' },
    { slug: 'infusion-list', name: '輸液製剤の組成一覧', cat: 'electrolyte', desc: '細胞外液/1-4号液/Glu液の組成' },
    { slug: 'holiday-segar', name: 'Holiday-Segarの小児輸液', cat: 'electrolyte', desc: '小児の維持輸液量(4-2-1)' },
    { slug: 'periop-stop', name: '周術期の中止薬一覧', cat: 'general', desc: '抗血栓薬等の休薬期間' },
    { slug: 'tetanus', name: '破傷風予防', cat: 'infectious', desc: '外傷時の破傷風予防フロー' },
    { slug: 'kawasaki', name: '川崎病の診断基準', cat: 'general', desc: '川崎病診断の手引き' },
    { slug: 'diehr-pneumonia', name: 'Diehrの肺炎予測', cat: 'respiratory', desc: '市中肺炎の診断予測' },
    { slug: 'abpc-score', name: '非定型肺炎スコア', cat: 'respiratory', desc: '細菌性vsマイコプラズマ鑑別' },
    { slug: 'naranjo', name: 'Naranjo評価スケール', cat: 'general', desc: '薬物有害事象の評価' },
    { slug: 'mcmahon', name: 'McMahonスコア', cat: 'nephrology', desc: '横紋筋融解症の腎不全リスク' },
  ],

  // === TIER 3: 専門科・表/分類系 ===
  tier3: [
    { slug: 'ann-arbor', name: 'Ann Arbor分類', cat: 'hematology', desc: '悪性リンパ腫の病期分類' },
    { slug: 'borg-scale', name: '修正ボルグスケール', cat: 'respiratory', desc: '息切れの主観的強度' },
    { slug: 'brinkman', name: 'ブリンクマン指数', cat: 'general', desc: '喫煙影響の評価' },
    { slug: 'burn-area', name: '熱傷面積算出', cat: 'general', desc: '9の法則/手掌法/Lund-Browder' },
    { slug: 'child-vital', name: '小児バイタル正常範囲', cat: 'general', desc: '年齢別バイタルサイン一覧' },
    { slug: 'chem-extravasation', name: '抗がん剤血管外漏出リスク', cat: 'hematology', desc: '薬剤の組織障害分類' },
    { slug: 'sle-criteria', name: 'SLE分類基準', cat: 'general', desc: '全身性エリテマトーデス診断' },
    { slug: 'anaphylaxis', name: 'アナフィラキシー診断基準', cat: 'general', desc: 'WAO 2020 / GL 2022' },
    { slug: 'gustilo', name: 'Gustilo-Anderson分類', cat: 'general', desc: '開放骨折の重症度分類' },
    { slug: 'stop-bang', name: 'STOP-Bang', cat: 'respiratory', desc: 'OSASスクリーニング' },
    { slug: 'tds', name: 'TDS(タバコ依存症)', cat: 'general', desc: 'ニコチン依存症スクリーニング' },
    { slug: 'westley-croup', name: 'Westleyクループスコア', cat: 'general', desc: 'クループ重症度判定' },
    { slug: 'ipss-prostate', name: 'IPSS', cat: 'general', desc: '前立腺症状スコア' },
    { slug: 'bishop', name: 'Bishopスコア', cat: 'general', desc: '子宮頚管成熟度評価' },
    { slug: 'frax', name: 'FRAX', cat: 'general', desc: '骨折リスク評価（外部リンク）' },
    { slug: 'siadh', name: 'SIADH診断基準', cat: 'electrolyte', desc: 'バソプレシン分泌過剰症' },
    { slug: 'hyponatremia-flow', name: '低Na血症の診断フロー', cat: 'electrolyte', desc: '尿浸透圧/尿Naに基づくフロー' },
    { slug: 'ibs-rome', name: 'IBS診断基準(Rome IV)', cat: 'hepatology', desc: '過敏性腸症候群の診断' },
    { slug: 'la-classification', name: '逆流性食道炎 改訂LA分類', cat: 'hepatology', desc: '逆流性食道炎の内視鏡所見' },
    { slug: 'murray', name: 'Murrayスコア', cat: 'respiratory', desc: '急性肺障害/ECMO適応判断' },
  ],
}

// Count
const t1 = hokutoGaps.tier1.length
const t2 = hokutoGaps.tier2.length
const t3 = hokutoGaps.tier3.length
console.log(`=== Hokuto Gap Analysis ===`)
console.log(`現在のiwor計算ツール: 79個`)
console.log(`不足 Tier1 (ER/ICU必須): ${t1}個`)
console.log(`不足 Tier2 (病棟頻用): ${t2}個`)
console.log(`不足 Tier3 (専門科/表): ${t3}個`)
console.log(`合計不足: ${t1+t2+t3}個`)
console.log(`全部追加後の合計: ${79+t1+t2+t3}個`)
