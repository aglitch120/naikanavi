// 臨床計算ツール設定
// 各ツールのメタデータ・カテゴリ・SEO情報を一元管理

export interface ToolDefinition {
  slug: string
  name: string
  nameEn: string
  description: string
  category: ToolCategory
  tier: 1 | 2 | 3
  keywords: string[]
  relatedSlugs: string[]
}

export type ToolCategory =
  | 'cardiology'
  | 'hepatology'
  | 'respiratory'
  | 'nephrology'
  | 'hematology'
  | 'infectious'
  | 'neurology'
  | 'general'
  | 'electrolyte'
  | 'antimicrobial'

export const categoryLabels: Record<ToolCategory, string> = {
  cardiology: '循環器',
  hepatology: '肝臓',
  respiratory: '呼吸器',
  nephrology: '腎臓',
  hematology: '血液',
  infectious: '感染症',
  neurology: '神経',
  general: '総合・身体計測',
  electrolyte: '電解質・輸液',
  antimicrobial: '抗菌薬・薬剤',
}

export const categoryIcons: Record<ToolCategory, string> = {
  cardiology: '❤️',
  hepatology: '🫁',
  respiratory: '🌬️',
  nephrology: '💧',
  hematology: '🩸',
  infectious: '🦠',
  neurology: '🧠',
  general: '📊',
  electrolyte: '💉',
  antimicrobial: '💊',
}

export const tools: ToolDefinition[] = [
  // ── Tier 1（16種） ──
  {
    slug: 'egfr',
    name: 'eGFR計算（CKD-EPI）',
    nameEn: 'eGFR (CKD-EPI 2021)',
    description: '血清クレアチニン値から推算糸球体濾過量（eGFR）を計算。CKD-EPI 2021式と日本人係数対応。CKDステージ判定付き。',
    category: 'nephrology',
    tier: 1,
    keywords: ['eGFR', '計算', 'CKD-EPI', '腎機能', 'CKD', 'ステージ', 'クレアチニン'],
    relatedSlugs: ['corrected-ca', 'fib-4'],
  },
  {
    slug: 'cha2ds2-vasc',
    name: 'CHA₂DS₂-VASc スコア',
    nameEn: 'CHA₂DS₂-VASc Score',
    description: '心房細動における脳卒中リスク評価。抗凝固療法の適応判断に使用。',
    category: 'cardiology',
    tier: 1,
    keywords: ['CHA2DS2-VASc', '心房細動', '脳卒中', 'リスク', '抗凝固'],
    relatedSlugs: ['chads2', 'has-bled'],
  },
  {
    slug: 'chads2',
    name: 'CHADS₂ スコア',
    nameEn: 'CHADS₂ Score',
    description: '心房細動の脳卒中リスク簡易評価。CHA₂DS₂-VAScの前身。',
    category: 'cardiology',
    tier: 1,
    keywords: ['CHADS2', '心房細動', '脳卒中'],
    relatedSlugs: ['cha2ds2-vasc', 'has-bled'],
  },
  {
    slug: 'has-bled',
    name: 'HAS-BLED スコア',
    nameEn: 'HAS-BLED Score',
    description: '心房細動患者の出血リスク評価。抗凝固療法のリスク・ベネフィット判断に。',
    category: 'cardiology',
    tier: 1,
    keywords: ['HAS-BLED', '出血', '抗凝固', '心房細動'],
    relatedSlugs: ['cha2ds2-vasc', 'chads2'],
  },
  {
    slug: 'child-pugh',
    name: 'Child-Pugh 分類',
    nameEn: 'Child-Pugh Classification',
    description: '肝硬変の重症度分類。予後予測・治療方針決定に使用。',
    category: 'hepatology',
    tier: 1,
    keywords: ['Child-Pugh', '肝硬変', '重症度'],
    relatedSlugs: ['meld', 'fib-4'],
  },
  {
    slug: 'meld',
    name: 'MELD スコア',
    nameEn: 'MELD Score',
    description: '末期肝疾患の重症度評価。肝移植の優先度決定に国際的に使用。',
    category: 'hepatology',
    tier: 1,
    keywords: ['MELD', '肝疾患', '肝移植'],
    relatedSlugs: ['child-pugh', 'fib-4'],
  },
  {
    slug: 'curb-65',
    name: 'CURB-65',
    nameEn: 'CURB-65 Score',
    description: '市中肺炎の重症度評価。入院適応の判断に使用。',
    category: 'respiratory',
    tier: 1,
    keywords: ['CURB-65', '肺炎', '重症度', 'CAP'],
    relatedSlugs: ['a-drop', 'qsofa'],
  },
  {
    slug: 'a-drop',
    name: 'A-DROP',
    nameEn: 'A-DROP Score',
    description: '日本呼吸器学会の市中肺炎重症度分類。日本のガイドライン準拠。',
    category: 'respiratory',
    tier: 1,
    keywords: ['A-DROP', '肺炎', '日本呼吸器学会'],
    relatedSlugs: ['curb-65', 'qsofa'],
  },
  {
    slug: 'wells-pe',
    name: 'Wells PE スコア',
    nameEn: 'Wells Score for PE',
    description: '肺塞栓症の臨床的確率評価。D-dimer検査の適応判断に。',
    category: 'respiratory',
    tier: 1,
    keywords: ['Wells', '肺塞栓', 'PE', 'D-dimer'],
    relatedSlugs: ['wells-dvt'],
  },
  {
    slug: 'wells-dvt',
    name: 'Wells DVT スコア',
    nameEn: 'Wells Score for DVT',
    description: '深部静脈血栓症の臨床的確率評価。',
    category: 'cardiology',
    tier: 1,
    keywords: ['Wells', 'DVT', '深部静脈血栓症'],
    relatedSlugs: ['wells-pe'],
  },
  {
    slug: 'grace',
    name: 'GRACE スコア',
    nameEn: 'GRACE Score',
    description: '急性冠症候群（ACS）の院内死亡リスク・退院後リスク評価。',
    category: 'cardiology',
    tier: 1,
    keywords: ['GRACE', 'ACS', '急性冠症候群'],
    relatedSlugs: ['cha2ds2-vasc'],
  },
  {
    slug: 'qsofa',
    name: 'qSOFA',
    nameEn: 'qSOFA Score',
    description: '敗血症のベッドサイドスクリーニング。バイタルだけで迅速評価。',
    category: 'infectious',
    tier: 1,
    keywords: ['qSOFA', '敗血症', 'sepsis'],
    relatedSlugs: ['sofa'],
  },
  {
    slug: 'sofa',
    name: 'SOFA スコア',
    nameEn: 'SOFA Score',
    description: '臓器障害の定量的評価。敗血症（Sepsis-3）の診断基準。',
    category: 'infectious',
    tier: 1,
    keywords: ['SOFA', '臓器障害', '敗血症', 'Sepsis-3'],
    relatedSlugs: ['qsofa'],
  },
  {
    slug: 'fib-4',
    name: 'FIB-4 index',
    nameEn: 'FIB-4 Index',
    description: '肝線維化の非侵襲的評価。年齢・AST・ALT・血小板で計算。',
    category: 'hepatology',
    tier: 1,
    keywords: ['FIB-4', '肝線維化', 'NAFLD'],
    relatedSlugs: ['child-pugh', 'meld'],
  },
  {
    slug: 'corrected-ca',
    name: '補正Ca',
    nameEn: 'Corrected Calcium',
    description: '低アルブミン血症時のカルシウム補正（Payneの式）。',
    category: 'electrolyte',
    tier: 1,
    keywords: ['補正Ca', 'カルシウム', 'アルブミン', 'Payne'],
    relatedSlugs: ['egfr'],
  },
  {
    slug: 'aa-gradient',
    name: 'A-aDO₂（肺胞気動脈血酸素分圧較差）',
    nameEn: 'A-a Gradient',
    description: '肺胞気-動脈血酸素分圧較差。低酸素血症の原因鑑別に。',
    category: 'respiratory',
    tier: 1,
    keywords: ['A-aDO2', '酸素分圧較差', '低酸素血症'],
    relatedSlugs: [],
  },

  // ── Tier 2（16種） ──
  {
    slug: 'cockcroft-gault',
    name: 'Cockcroft-Gault式（CCr）',
    nameEn: 'Cockcroft-Gault (CrCl)',
    description: 'クレアチニンクリアランス推算。薬剤の腎排泄量調整に必須。',
    category: 'nephrology',
    tier: 2,
    keywords: ['Cockcroft-Gault', 'CCr', 'クレアチニンクリアランス', '腎機能'],
    relatedSlugs: ['egfr'],
  },
  {
    slug: 'bmi',
    name: 'BMI計算',
    nameEn: 'Body Mass Index',
    description: '体格指数（BMI）の計算。肥満度判定付き。',
    category: 'general',
    tier: 2,
    keywords: ['BMI', '体格指数', '肥満'],
    relatedSlugs: ['bsa'],
  },
  {
    slug: 'bsa',
    name: 'BSA（体表面積）',
    nameEn: 'Body Surface Area',
    description: '体表面積の計算（Du Bois式）。薬剤投与量の算出に。',
    category: 'general',
    tier: 2,
    keywords: ['BSA', '体表面積', 'Du Bois'],
    relatedSlugs: ['bmi'],
  },
  {
    slug: 'rcri',
    name: 'RCRI（Revised Cardiac Risk Index）',
    nameEn: 'Revised Cardiac Risk Index',
    description: '非心臓手術の周術期心血管リスク評価。術前評価に必須。',
    category: 'cardiology',
    tier: 2,
    keywords: ['RCRI', '術前評価', '心血管リスク', '周術期'],
    relatedSlugs: [],
  },
  {
    slug: 'apache2',
    name: 'APACHE II',
    nameEn: 'APACHE II Score',
    description: 'ICU入室患者の重症度・予後評価。院内死亡率予測。',
    category: 'infectious',
    tier: 2,
    keywords: ['APACHE', 'ICU', '重症度', '予後'],
    relatedSlugs: ['sofa', 'qsofa'],
  },
  {
    slug: 'gcs',
    name: 'GCS（Glasgow Coma Scale）',
    nameEn: 'Glasgow Coma Scale',
    description: '意識レベルの定量的評価。E+V+Mの3要素。',
    category: 'neurology',
    tier: 2,
    keywords: ['GCS', '意識レベル', 'Glasgow', '昏睡'],
    relatedSlugs: ['nihss'],
  },
  {
    slug: 'nihss',
    name: 'NIHSS',
    nameEn: 'NIH Stroke Scale',
    description: '脳卒中の神経学的重症度評価。t-PA適応判断に。',
    category: 'neurology',
    tier: 2,
    keywords: ['NIHSS', '脳卒中', '重症度', 't-PA'],
    relatedSlugs: ['gcs', 'mrs', 'abcd2'],
  },
  {
    slug: 'mrs',
    name: 'mRS（modified Rankin Scale）',
    nameEn: 'Modified Rankin Scale',
    description: '脳卒中後の機能障害度評価。転帰評価の国際標準。',
    category: 'neurology',
    tier: 2,
    keywords: ['mRS', 'Rankin', '機能障害', '脳卒中'],
    relatedSlugs: ['nihss'],
  },
  {
    slug: 'karnofsky',
    name: 'Karnofsky PS',
    nameEn: 'Karnofsky Performance Status',
    description: '全身状態の評価（100〜0%）。がん患者の治療適応判断に。',
    category: 'general',
    tier: 2,
    keywords: ['Karnofsky', 'PS', '全身状態', 'がん'],
    relatedSlugs: ['ecog'],
  },
  {
    slug: 'ecog',
    name: 'ECOG PS',
    nameEn: 'ECOG Performance Status',
    description: '全身状態の簡易評価（0〜5）。がん臨床試験の標準。',
    category: 'general',
    tier: 2,
    keywords: ['ECOG', 'PS', '全身状態'],
    relatedSlugs: ['karnofsky'],
  },
  {
    slug: 'anion-gap',
    name: 'アニオンギャップ（AG）',
    nameEn: 'Anion Gap',
    description: 'AG計算（補正AG含む）。代謝性アシドーシスの鑑別に。',
    category: 'electrolyte',
    tier: 2,
    keywords: ['アニオンギャップ', 'AG', 'アシドーシス', '代謝性'],
    relatedSlugs: ['corrected-ca'],
  },
  {
    slug: 'abcd2',
    name: 'ABCD²スコア',
    nameEn: 'ABCD² Score',
    description: 'TIA後の脳梗塞リスク評価（2日・7日・90日）。',
    category: 'neurology',
    tier: 2,
    keywords: ['ABCD2', 'TIA', '脳梗塞', 'リスク'],
    relatedSlugs: ['nihss'],
  },

  // ── 電解質・輸液計算群 ──
  {
    slug: 'maintenance-fluid',
    name: '維持輸液計算（4-2-1ルール）',
    nameEn: 'Maintenance Fluid Calculator',
    description: '体重から維持輸液量を計算。4-2-1ルール（Holliday-Segar法）。',
    category: 'electrolyte',
    tier: 2,
    keywords: ['維持輸液', '4-2-1', 'Holliday-Segar', '輸液速度'],
    relatedSlugs: ['na-deficit', 'free-water-deficit'],
  },
  {
    slug: 'na-deficit',
    name: 'Na欠乏量計算',
    nameEn: 'Sodium Deficit Calculator',
    description: '低ナトリウム血症のNa補充量を計算。',
    category: 'electrolyte',
    tier: 2,
    keywords: ['Na欠乏量', 'ナトリウム', '低Na血症', '補正'],
    relatedSlugs: ['na-correction-rate', 'free-water-deficit'],
  },
  {
    slug: 'free-water-deficit',
    name: '自由水欠乏量',
    nameEn: 'Free Water Deficit',
    description: '高ナトリウム血症の自由水補充量を計算。',
    category: 'electrolyte',
    tier: 2,
    keywords: ['自由水', '高Na血症', 'ナトリウム', '脱水'],
    relatedSlugs: ['na-deficit', 'na-correction-rate'],
  },
  {
    slug: 'na-correction-rate',
    name: 'Na補正速度計算',
    nameEn: 'Sodium Correction Rate',
    description: 'Na補正速度の安全範囲チェック。ODS予防に。',
    category: 'electrolyte',
    tier: 2,
    keywords: ['Na補正速度', 'ODS', '浸透圧性脱髄', '補正'],
    relatedSlugs: ['na-deficit', 'free-water-deficit'],
  },
  {
    slug: 'kcl-correction',
    name: 'KCl補正計算',
    nameEn: 'Potassium Correction',
    description: '低カリウム血症のKCl補充量・投与速度を計算。',
    category: 'electrolyte',
    tier: 2,
    keywords: ['KCl', 'カリウム', '低K血症', '補正'],
    relatedSlugs: ['na-deficit'],
  },

  // ── 抗菌薬・薬剤 ──
  {
    slug: 'steroid-converter',
    name: 'ステロイド換算',
    nameEn: 'Steroid Conversion Calculator',
    description: 'ステロイド等価用量の換算（PSL, mPSL, DEX, BET, HC）。',
    category: 'antimicrobial',
    tier: 2,
    keywords: ['ステロイド', '換算', 'プレドニゾロン', 'デキサメタゾン', 'PSL'],
    relatedSlugs: [],
  },
  {
    slug: 'renal-dose-abx',
    name: '抗菌薬 腎機能別用量調整',
    nameEn: 'Renal Dose Adjustment for Antibiotics',
    description: '主要20抗菌薬のeGFR/CCr別推奨用量を表示。',
    category: 'antimicrobial',
    tier: 2,
    keywords: ['抗菌薬', '腎機能', '用量調整', 'eGFR', '減量'],
    relatedSlugs: ['egfr', 'cockcroft-gault'],
  },
  {
    slug: 'insulin-sliding',
    name: 'インスリンスライディングスケール',
    nameEn: 'Insulin Sliding Scale',
    description: '血糖値に応じたインスリン投与量の目安。当直での血糖管理に。',
    category: 'antimicrobial',
    tier: 2,
    keywords: ['インスリン', 'スライディングスケール', '血糖', '当直'],
    relatedSlugs: [],
  },
]

// 実装済みツールのslug一覧（新ツール追加時にここに追加）
export const implementedTools = new Set(['egfr', 'cha2ds2-vasc', 'chads2', 'has-bled', 'child-pugh', 'meld', 'curb-65', 'a-drop', 'wells-pe', 'wells-dvt', 'qsofa', 'sofa', 'fib-4', 'corrected-ca', 'aa-gradient', 'grace'])

export function getToolBySlug(slug: string): ToolDefinition | undefined {
  return tools.find(t => t.slug === slug)
}

export function getToolsByCategory(category: ToolCategory): ToolDefinition[] {
  return tools.filter(t => t.category === category)
}

export function getToolsByTier(tier: 1 | 2 | 3): ToolDefinition[] {
  return tools.filter(t => t.tier === tier)
}

export function getAllToolSlugs(): string[] {
  return tools.map(t => t.slug)
}
