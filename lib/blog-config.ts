// カテゴリ定義（クラスターA-R: SEO_GUIDELINE.md・キーワードリスト準拠）
export const categories = {
  'josler-basics': { name: 'J-OSLER基礎', cluster: 'A' },
  'case-registration': { name: '症例登録', cluster: 'B' },
  'medical-history': { name: '病歴要約', cluster: 'C' },
  'disease-specific': { name: '疾患別病歴要約', cluster: 'D' },
  'progress-management': { name: '進捗管理', cluster: 'E' },
  'jmecc-training': { name: 'JMECC・講習', cluster: 'F' },
  'specialist-exam': { name: '内科専門医試験', cluster: 'G' },
  'exam-by-field': { name: '試験領域別', cluster: 'H' },
  'comprehensive-exam': { name: '総合内科専門医', cluster: 'I' },
  'ai-tools': { name: 'AI・ツール', cluster: 'J' },
  'mental-life': { name: 'メンタル・生活', cluster: 'K' },
  'part-time': { name: 'バイト・収入', cluster: 'L' },
  'tax-saving': { name: '税金・節税', cluster: 'M' },
  'career': { name: 'キャリア', cluster: 'N' },
  'academic': { name: '学会・論文', cluster: 'O' },
  'life-events': { name: '結婚・出産', cluster: 'P' },
  'subspecialty': { name: 'サブスペJ-OSLER', cluster: 'Q' },
  'others': { name: 'その他', cluster: 'R' },
} as const

export type CategorySlug = keyof typeof categories

// クラスターカラー（A-R: SEO_GUIDELINE.md・キーワードリスト準拠）
export const clusterColors = {
  A: { bg: '#1E3A5F', name: 'J-OSLER基礎' },
  B: { bg: '#3D5A80', name: '症例登録' },
  C: { bg: '#1B4F3A', name: '病歴要約' },
  D: { bg: '#2D6A4F', name: '疾患別病歴要約' },
  E: { bg: '#0D7377', name: '進捗管理' },
  F: { bg: '#4A5568', name: 'JMECC・講習' },
  G: { bg: '#7F1D1D', name: '内科専門医試験' },
  H: { bg: '#9B2C2C', name: '試験領域別' },
  I: { bg: '#B7410E', name: '総合内科専門医' },
  J: { bg: '#4338CA', name: 'AI・ツール' },
  K: { bg: '#134E4A', name: 'メンタル・生活' },
  L: { bg: '#4C1D95', name: 'バイト・収入' },
  M: { bg: '#92400E', name: '税金・節税' },
  N: { bg: '#2B6CB0', name: 'キャリア' },
  O: { bg: '#6D28D9', name: '学会・論文' },
  P: { bg: '#9D174D', name: '結婚・出産' },
  Q: { bg: '#5B6ABF', name: 'サブスペJ-OSLER' },
  R: { bg: '#6B6760', name: 'その他' },
} as const

export type ClusterId = keyof typeof clusterColors

// ピラーページ定義（SEO_GUIDELINE.md クラスター構成図準拠）
export const pillarPages = {
  'josler-complete-guide': {
    title: 'J-OSLER完全攻略ガイド',
    clusters: ['A', 'B', 'C', 'D', 'E', 'F'],
  },
  'exam-preparation-guide': {
    title: '内科専門医試験対策ガイド',
    clusters: ['G', 'H', 'I'],
  },
  'efficiency-guide': {
    title: '内科専攻医の効率化ガイド',
    clusters: ['J'],
  },
  'money-career-guide': {
    title: '内科専攻医のお金とキャリア',
    clusters: ['K', 'L', 'M', 'N', 'O', 'P'],
  },
} as const

// CTA設定
export const ctaConfig = {
  template: {
    title: '🚀 AIが病歴要約の下書きを30秒で生成',
    description: '症例情報を入力するだけ。総合考察・全人的視点も自動で構成。手書き3時間→30分に短縮した専攻医が続出中。',
    buttonText: '無料で試してみる',
    url: 'https://naikanavi.booth.pm/items/8058590',
  },
  progress: {
    title: '🚀 AIが病歴要約の下書きを30秒で生成',
    description: 'J-OSLER作業を10分の1に。症例登録テンプレ・検査値フォーマット変換・病歴要約AI下書きが全部入り。',
    buttonText: '無料で試してみる',
    url: 'https://naikanavi.booth.pm/items/8058590',
  },
  quiz: {
    title: '🚀 AIが病歴要約の下書きを30秒で生成',
    description: 'J-OSLER作業を10分の1に。症例登録テンプレ・検査値フォーマット変換・病歴要約AI下書きが全部入り。',
    buttonText: '無料で試してみる',
    url: 'https://naikanavi.booth.pm/items/8058590',
  },
  checklist: {
    title: '🚀 AIが病歴要約の下書きを30秒で生成',
    description: 'J-OSLER作業を10分の1に。症例登録テンプレ・検査値フォーマット変換・病歴要約AI下書きが全部入り。',
    buttonText: '無料で試してみる',
    url: 'https://naikanavi.booth.pm/items/8058590',
  },
  general: {
    title: '🚀 AIが病歴要約の下書きを30秒で生成',
    description: 'J-OSLER作業を10分の1に。症例登録テンプレ・検査値フォーマット変換・病歴要約AI下書きが全部入り。',
    buttonText: '無料で試してみる',
    url: 'https://naikanavi.booth.pm/items/8058590',
  },
} as const

export type CtaType = keyof typeof ctaConfig

// タグ → URLスラッグ変換（Cloudflare Pagesで日本語パスが404になるため英語スラッグを使用）
export const tagSlugMap: Record<string, string> = {
  'J-OSLER': 'j-osler',
  '修了要件': 'completion-requirements',
  '内科専門医': 'naika-senmonni',
  '症例登録': 'case-registration',
  '病歴要約': 'medical-history',
  '書き方': 'how-to-write',
  'テンプレート': 'template',
  '内科専攻医': 'naika-senkoui',
  '効率化': 'efficiency',
  '疾患群': 'disease-group',
  '自己省察': 'self-reflection',
  'コピペ': 'copy-paste',
  '総合考察': 'comprehensive-discussion',
  '全人的視点': 'holistic-perspective',
  '差し戻し': 'revision',
  'Accept': 'accept',
  '160症例': '160-cases',
  '120症例': '120-cases',
  '29症例': '29-cases',
  '7期生': '7th-cohort',
  '選び方': 'how-to-choose',
}

// スラッグ → タグ名の逆引き
export const slugToTagMap: Record<string, string> = Object.fromEntries(
  Object.entries(tagSlugMap).map(([tag, slug]) => [slug, tag])
)

// タグ名からスラッグを取得（未登録タグはそのまま返す）
export function getTagSlug(tag: string): string {
  return tagSlugMap[tag] || tag.toLowerCase().replace(/\s+/g, '-')
}

// スラッグからタグ名を取得
export function getTagName(slug: string): string | undefined {
  return slugToTagMap[slug]
}

// サイト情報
export const siteConfig = {
  name: '内科ナビ',
  description: '内科専攻医の悩みをすべて解決する',
  url: 'https://naikanavi.com',
  ogImage: 'https://naikanavi.com/og/default.png',
  author: '内科ナビ編集部',
}
