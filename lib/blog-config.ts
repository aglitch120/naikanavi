// カテゴリ定義
export const categories = {
  'josler-basics': { name: 'J-OSLER基礎', cluster: 'A' },
  'case-registration': { name: '症例登録', cluster: 'C' },
  'medical-history': { name: '病歴要約', cluster: 'B' },
  'disease-specific': { name: '疾患別病歴要約', cluster: 'B' },
  'progress-management': { name: '進捗管理', cluster: 'D' },
  'jmecc-training': { name: 'JMECC・講習', cluster: 'A' },
  'specialist-exam': { name: '内科専門医試験', cluster: 'E' },
  'exam-by-field': { name: '試験領域別', cluster: 'E' },
  'comprehensive-exam': { name: '総合内科専門医', cluster: 'E' },
  'ai-tools': { name: 'AI・ツール', cluster: 'J' },
  'mental-life': { name: 'メンタル・生活', cluster: 'I' },
  'part-time': { name: 'バイト・収入', cluster: 'F' },
  'tax-saving': { name: '税金・節税', cluster: 'G' },
  'career': { name: 'キャリア', cluster: 'J' },
  'academic': { name: '学会・論文', cluster: 'K' },
  'life-events': { name: '結婚・出産', cluster: 'H' },
  'subspecialty': { name: 'サブスペJ-OSLER', cluster: 'A' },
  'others': { name: 'その他', cluster: 'A' },
} as const

export type CategorySlug = keyof typeof categories

// クラスターカラー
export const clusterColors = {
  A: { bg: '#1E3A5F', name: 'J-OSLER基礎' },
  B: { bg: '#1B4F3A', name: '病歴要約' },
  C: { bg: '#3D5A80', name: '症例登録' },
  D: { bg: '#2D6A4F', name: '進捗管理' },
  E: { bg: '#7F1D1D', name: '試験対策' },
  F: { bg: '#4C1D95', name: 'バイト' },
  G: { bg: '#92400E', name: '確定申告' },
  H: { bg: '#9D174D', name: '結婚' },
  I: { bg: '#134E4A', name: 'メンタル' },
  J: { bg: '#4338CA', name: 'キャリア' },
  K: { bg: '#6D28D9', name: '学会' },
} as const

export type ClusterId = keyof typeof clusterColors

// ピラーページ定義
export const pillarPages = {
  'josler-complete-guide': {
    title: 'J-OSLER完全攻略ガイド',
    clusters: ['A', 'B', 'C', 'D'],
  },
  'exam-preparation-guide': {
    title: '内科専門医試験 合格マニュアル',
    clusters: ['E', 'K'],
  },
  'money-guide': {
    title: '専攻医のお金完全ガイド',
    clusters: ['F', 'G'],
  },
  'lifehack-guide': {
    title: '専攻医ライフハック大全',
    clusters: ['H', 'I'],
  },
  'career-guide': {
    title: 'キャリア設計完全ロードマップ',
    clusters: ['J'],
  },
} as const

// CTA設定
export const ctaConfig = {
  template: {
    title: '📝 病歴要約テンプレートを無料ダウンロード',
    description: 'Accept率を上げる病歴要約の書き方をテンプレート付きで解説',
    buttonText: '無料ダウンロード',
    url: '/template',
  },
  progress: {
    title: '📊 J-OSLER進捗管理ツール',
    description: 'NotionとAIを使って症例登録を効率化',
    buttonText: 'ツールを見る',
    url: '/tool',
  },
  quiz: {
    title: '📚 内科専門医試験 対策クイズ',
    description: '過去問ベースのクイズで実力チェック',
    buttonText: 'クイズに挑戦',
    url: '/quiz',
  },
  checklist: {
    title: '✅ 専攻医のチェックリスト',
    description: 'やることリストで漏れなく準備',
    buttonText: 'チェックリストを見る',
    url: '/checklist',
  },
  general: {
    title: '🏠 内科ナビを使ってみる',
    description: '内科専攻医の悩みをすべて解決するWebアプリ',
    buttonText: 'アプリを開く',
    url: '/',
  },
} as const

export type CtaType = keyof typeof ctaConfig

// サイト情報
export const siteConfig = {
  name: '内科ナビ',
  description: '内科専攻医の悩みをすべて解決する',
  url: 'https://naikanavi.com',
  ogImage: 'https://naikanavi.com/og/default.png',
  author: '内科ナビ編集部',
}
