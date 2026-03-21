/**
 * 専門医単位 — 診療科要件データ + 型定義
 *
 * ※ 本情報は参考値です。正確な要件は各学会公式サイトでご確認ください。
 * 各学会の更新要件は年度により変更される場合があります。
 *
 * Source: 日本専門医機構 (JMSB) 更新基準 + 各学会公式サイト
 * 新制度では4カテゴリ合計50単位/5年が標準（一部例外あり）
 */

// ── 型定義 ──

export interface CreditCategory {
  id: string
  name: string
  maxCredits?: number
  minCredits?: number
}

export interface SpecialtyRequirement {
  id: string
  name: string
  society: string
  requiredCredits: number
  renewalYears: number
  officialUrl: string
  categories: CreditCategory[]
  type: 'basic' | 'subspecialty'
  notes?: string
}

export interface CreditEntry {
  id: string
  categoryId: string
  credits: number
  memo: string
  date: string
}

export interface UserCreditsData {
  selectedSpecialty: string | null
  entries: CreditEntry[]
  targetDate?: string
}

// ── JMSB標準4カテゴリ ──
// 新専門医機構制度の標準的なカテゴリ分類

const JMSB_STANDARD_CATEGORIES: CreditCategory[] = [
  { id: 'practice', name: '診療実績', maxCredits: 10, minCredits: 5 },
  { id: 'common_lecture', name: '専門医共通講習', maxCredits: 10, minCredits: 3 },
  { id: 'specialty_lecture', name: '領域講習' },
  { id: 'academic', name: '学術業績・診療以外の活動' },
]

// ── 基本領域19科 ──

const BASIC_SPECIALTIES: SpecialtyRequirement[] = [
  {
    id: 'internal',
    name: '内科専門医',
    society: '日本内科学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.naika.or.jp/',
    categories: [
      { id: 'practice', name: '診療実績', maxCredits: 10 },
      { id: 'common_lecture', name: '専門医共通講習', maxCredits: 10, minCredits: 3 },
      { id: 'specialty_lecture', name: '領域講習', minCredits: 20 },
      { id: 'academic', name: '学術業績（セルフトレーニング含む）' },
    ],
    type: 'basic',
  },
  {
    id: 'surgery',
    name: '外科専門医',
    society: '日本外科学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://jp.jssoc.or.jp/',
    categories: [
      { id: 'practice', name: '診療実績（NCD 100例）', maxCredits: 10 },
      { id: 'common_lecture', name: '専門医共通講習', maxCredits: 10, minCredits: 3 },
      { id: 'specialty_lecture', name: '領域講習（総論5必須）', minCredits: 10 },
      { id: 'academic', name: '学術業績（学会参加・発表・論文）' },
    ],
    type: 'basic',
  },
  {
    id: 'pediatrics',
    name: '小児科専門医',
    society: '日本小児科学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.jpeds.or.jp/',
    categories: [
      { id: 'practice', name: '診療実績（100例）', maxCredits: 10 },
      { id: 'common_lecture', name: '専門医共通講習', maxCredits: 20, minCredits: 3 },
      { id: 'specialty_lecture', name: '領域講習', minCredits: 20 },
      { id: 'academic', name: '学術業績' },
    ],
    type: 'basic',
  },
  {
    id: 'obgyn',
    name: '産婦人科専門医',
    society: '日本産科婦人科学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.jsog.or.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'basic',
  },
  {
    id: 'psychiatry',
    name: '精神科専門医',
    society: '日本精神神経学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.jspn.or.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'basic',
    notes: 'A群（特別講演）・B群（地方学会）・C群（地域学会）分類あり',
  },
  {
    id: 'dermatology',
    name: '皮膚科専門医',
    society: '日本皮膚科学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.dermatol.or.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'basic',
    notes: '2028年度以降: 診療実績10単位（100症例）必須',
  },
  {
    id: 'ophthalmology',
    name: '眼科専門医',
    society: '日本眼科学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.nichigan.or.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'basic',
  },
  {
    id: 'otolaryngology',
    name: '耳鼻咽喉科専門医',
    society: '日本耳鼻咽喉科頭頸部外科学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.jibika.or.jp/',
    categories: [
      { id: 'practice', name: '診療実績（200症例）', maxCredits: 10 },
      { id: 'common_lecture', name: '専門医共通講習', maxCredits: 10, minCredits: 3 },
      { id: 'specialty_lecture', name: '領域講習（総会+秋季大会必須）' },
      { id: 'academic', name: '学術業績' },
    ],
    type: 'basic',
    notes: '3回以上更新者は40単位に軽減',
  },
  {
    id: 'urology',
    name: '泌尿器科専門医',
    society: '日本泌尿器科学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.urol.or.jp/',
    categories: [
      { id: 'practice', name: '診療実績', maxCredits: 10 },
      { id: 'common_lecture', name: '専門医共通講習', maxCredits: 10, minCredits: 3 },
      { id: 'specialty_lecture', name: '領域講習' },
      { id: 'academic', name: '学術業績', maxCredits: 15, minCredits: 3 },
    ],
    type: 'basic',
    notes: '4回目以降は診療実績免除可（40単位）',
  },
  {
    id: 'orthopedics',
    name: '整形外科専門医',
    society: '日本整形外科学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.joa.or.jp/',
    categories: [
      { id: 'practice', name: '診療実績（JOANR 100例）', maxCredits: 10, minCredits: 5 },
      { id: 'common_lecture', name: '専門医共通講習', maxCredits: 10, minCredits: 3 },
      { id: 'specialty_lecture', name: '領域講習' },
      { id: 'academic', name: '学術業績' },
    ],
    type: 'basic',
  },
  {
    id: 'neurosurgery',
    name: '脳神経外科専門医',
    society: '日本脳神経外科学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://jns-official.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'basic',
  },
  {
    id: 'plastic_surgery',
    name: '形成外科専門医',
    society: '日本形成外科学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://jsprs.or.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'basic',
    notes: '旧制度150点から新制度50単位に変更',
  },
  {
    id: 'radiology',
    name: '放射線科専門医',
    society: '日本医学放射線学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.radiology.jp/',
    categories: [
      { id: 'practice', name: '診療実績' },
      { id: 'common_lecture', name: '専門医共通講習（必修A3+必修B5）', minCredits: 8 },
      { id: 'specialty_lecture', name: '領域講習' },
      { id: 'academic', name: '学術業績' },
    ],
    type: 'basic',
  },
  {
    id: 'anesthesiology',
    name: '麻酔科専門医',
    society: '日本麻酔科学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://anesth.or.jp/',
    categories: [
      { id: 'practice', name: '診療実績（麻酔症例）', maxCredits: 10, minCredits: 5 },
      { id: 'common_lecture', name: '専門医共通講習', minCredits: 3 },
      { id: 'specialty_lecture', name: '領域講習（学会主催10必須）', minCredits: 15 },
      { id: 'academic', name: '学術業績', minCredits: 6 },
    ],
    type: 'basic',
    notes: '2026年度より共通講習8単位必須',
  },
  {
    id: 'pathology',
    name: '病理専門医',
    society: '日本病理学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://pathology.or.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'basic',
  },
  {
    id: 'clinical_lab',
    name: '臨床検査専門医',
    society: '日本臨床検査医学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.jslm.org/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'basic',
  },
  {
    id: 'emergency',
    name: '救急科専門医',
    society: '日本救急医学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.jaam.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'basic',
    notes: 'e-learning（80%以上正解で単位付与）あり',
  },
  {
    id: 'rehabilitation',
    name: 'リハビリテーション科専門医',
    society: '日本リハビリテーション医学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.jarm.or.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'basic',
  },
  {
    id: 'general_practice',
    name: '総合診療専門医',
    society: '日本専門医機構（直轄）',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://jmsb.or.jp/',
    categories: [
      { id: 'practice', name: '診療実績', maxCredits: 10, minCredits: 5 },
      { id: 'common_lecture', name: '専門医共通講習', maxCredits: 10, minCredits: 3 },
      { id: 'specialty_lecture', name: '領域講習', minCredits: 20 },
      { id: 'academic', name: '学術業績', maxCredits: 10 },
    ],
    type: 'basic',
  },
]

// ── サブスペシャリティ ──

const SUBSPECIALTIES: SpecialtyRequirement[] = [
  {
    id: 'cardiology',
    name: '循環器専門医',
    society: '日本循環器学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.j-circ.or.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'subspecialty',
    notes: '必修研修30単位含む',
  },
  {
    id: 'gastroenterology',
    name: '消化器病専門医',
    society: '日本消化器病学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.jsge.or.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'subspecialty',
  },
  {
    id: 'pulmonology',
    name: '呼吸器専門医',
    society: '日本呼吸器学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.jrs.or.jp/',
    categories: [
      { id: 'practice', name: '診療実績' },
      { id: 'common_lecture', name: '専門医共通講習', minCredits: 3 },
      { id: 'specialty_lecture', name: '領域講習（学術講演会・e-learning）', minCredits: 20 },
      { id: 'academic', name: '学術業績' },
    ],
    type: 'subspecialty',
  },
  {
    id: 'endocrinology',
    name: '内分泌代謝科専門医',
    society: '日本内分泌学会',
    requiredCredits: 60,
    renewalYears: 5,
    officialUrl: 'https://www.j-endo.jp/',
    categories: [
      { id: 'practice', name: '診療実績' },
      { id: 'designated_lecture', name: '指定講演', minCredits: 20 },
      { id: 'conference', name: '講演会参加', minCredits: 30 },
      { id: 'academic', name: '学術業績' },
    ],
    type: 'subspecialty',
    notes: '4回以上更新者は25単位に軽減',
  },
  {
    id: 'nephrology',
    name: '腎臓専門医',
    society: '日本腎臓学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://jsn.or.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'subspecialty',
  },
  {
    id: 'hematology',
    name: '血液専門医',
    society: '日本血液学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.jshem.or.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'subspecialty',
  },
  {
    id: 'rheumatology',
    name: 'リウマチ専門医',
    society: '日本リウマチ学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.ryumachi-jp.com/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'subspecialty',
    notes: '必須研修項目+症例報告書提出あり',
  },
  {
    id: 'gastro_surgery',
    name: '消化器外科専門医',
    society: '日本消化器外科学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.jsgs.or.jp/',
    categories: [
      { id: 'practice', name: '手術症例（100例）' },
      { id: 'common_lecture', name: '専門医共通講習', minCredits: 3 },
      { id: 'specialty_lecture', name: '領域講習（学会参加+e-learning 4分野必須）' },
      { id: 'academic', name: '学術業績' },
    ],
    type: 'subspecialty',
  },
  {
    id: 'thoracic_surgery',
    name: '呼吸器外科専門医',
    society: '日本呼吸器外科学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://chest.umin.jp/',
    categories: [
      { id: 'practice', name: '手術症例（100例）' },
      { id: 'specialty_lecture', name: '研修実績', minCredits: 20 },
      { id: 'academic', name: '学術業績' },
    ],
    type: 'subspecialty',
    notes: '独自基準: 研修実績20単位+手術100例',
  },
  {
    id: 'cardiovascular_surgery',
    name: '心臓血管外科専門医',
    society: '日本心臓血管外科学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://jscvs.or.jp/',
    categories: [
      { id: 'practice', name: '手術症例（100例）' },
      { id: 'conference', name: '学会参加', minCredits: 5 },
      { id: 'seminar', name: 'セミナー', minCredits: 3 },
      { id: 'academic', name: '論文・学術業績', minCredits: 3 },
    ],
    type: 'subspecialty',
    notes: '独自基準あり',
  },
  {
    id: 'breast_surgery',
    name: '乳腺専門医',
    society: '日本乳癌学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.jbcs.gr.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'subspecialty',
    notes: '2024年度よりセミナー受講必須+研究業績+症例提出',
  },
  {
    id: 'infectious_disease',
    name: '感染症専門医',
    society: '日本感染症学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.kansensho.or.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'subspecialty',
    notes: '15単位は本学会主催学術集会参加必須',
  },
  {
    id: 'allergy',
    name: 'アレルギー専門医',
    society: '日本アレルギー学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.jsaweb.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'subspecialty',
    notes: '学術大会2回+総合アレルギー講習会1回（計30単位）必須',
  },
  {
    id: 'geriatrics',
    name: '老年病専門医',
    society: '日本老年医学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.jpn-geriat-soc.or.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'subspecialty',
  },
  {
    id: 'intensive_care',
    name: '集中治療専門医',
    society: '日本集中治療医学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.jsicm.org/',
    categories: [
      { id: 'practice', name: '診療実績' },
      { id: 'common_lecture', name: '専門医共通講習', minCredits: 3 },
      { id: 'specialty_lecture', name: '領域講習（学術集会2回+地方1回必須）', maxCredits: 40 },
      { id: 'academic', name: '学術業績' },
    ],
    type: 'subspecialty',
  },
  {
    id: 'pain_clinic',
    name: 'ペインクリニック専門医',
    society: '日本ペインクリニック学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.jspc.gr.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'subspecialty',
    notes: '50症例+うち5例の詳細経過報告',
  },
  {
    id: 'palliative_care',
    name: '緩和医療専門医',
    society: '日本緩和医療学会',
    requiredCredits: 50,
    renewalYears: 5,
    officialUrl: 'https://www.jspm.ne.jp/',
    categories: JMSB_STANDARD_CATEGORIES,
    type: 'subspecialty',
    notes: '更新認定試験合格が必要',
  },
]

// ── エクスポート ──

export const ALL_SPECIALTIES: SpecialtyRequirement[] = [
  ...BASIC_SPECIALTIES,
  ...SUBSPECIALTIES,
]

export function getSpecialtyById(id: string): SpecialtyRequirement | undefined {
  return ALL_SPECIALTIES.find(s => s.id === id)
}
