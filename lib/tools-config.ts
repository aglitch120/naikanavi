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

export const categoryLabels: Record<ToolCategory, string> = {
  cardiology: '循環器',
  hepatology: '肝臓',
  respiratory: '呼吸器',
  nephrology: '腎臓',
  hematology: '血液',
  infectious: '感染症',
  neurology: '神経',
  general: '総合',
  electrolyte: '電解質・輸液',
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
]

// 実装済みツールのslug一覧（新ツール追加時にここに追加）
export const implementedTools = new Set(['egfr'])

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
