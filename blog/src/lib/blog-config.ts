// ブログ設定
export const siteConfig = {
  name: '内科ナビ',
  url: 'https://naikanavi.com',
  description: '内科専攻医の悩みをすべて解決する',
  author: '内科ナビ編集部',
  ogImage: '/og/default.png',
};

// カテゴリ定義
export const categories: Record<string, { name: string; description: string; cluster: string }> = {
  'josler-basics': {
    name: 'J-OSLER基礎',
    description: 'J-OSLERの基本的な使い方・登録方法を解説',
    cluster: 'A',
  },
  'case-registration': {
    name: '症例登録',
    description: '症例登録のコツ・効率化テクニック',
    cluster: 'C',
  },
  'medical-history': {
    name: '病歴要約',
    description: '病歴要約の書き方・Accept率を上げるコツ',
    cluster: 'B',
  },
  'disease-specific': {
    name: '疾患別病歴要約',
    description: '疾患別の病歴要約テンプレート・例文',
    cluster: 'B',
  },
  'progress-management': {
    name: '進捗管理',
    description: 'J-OSLER進捗管理・スケジュール戦略',
    cluster: 'D',
  },
  'jmecc-training': {
    name: 'JMECC・講習',
    description: 'JMECC・必須講習会の情報',
    cluster: 'A',
  },
  'specialist-exam': {
    name: '内科専門医試験',
    description: '内科専門医試験の対策・勉強法',
    cluster: 'E',
  },
  'exam-by-field': {
    name: '試験領域別',
    description: '領域別の試験対策',
    cluster: 'E',
  },
  'comprehensive-exam': {
    name: '総合内科専門医',
    description: '総合内科専門医試験の対策',
    cluster: 'E',
  },
  'ai-tools': {
    name: 'AI・ツール',
    description: 'AI・効率化ツールの活用法',
    cluster: 'J',
  },
  'mental-life': {
    name: 'メンタル・生活',
    description: '専攻医のメンタルヘルス・生活術',
    cluster: 'I',
  },
  'part-time': {
    name: 'バイト・収入',
    description: '医師バイト・副収入の情報',
    cluster: 'F',
  },
  'tax-saving': {
    name: '税金・節税',
    description: '確定申告・節税対策',
    cluster: 'G',
  },
  'career': {
    name: 'キャリア',
    description: '内科医のキャリア設計',
    cluster: 'J',
  },
  'academic': {
    name: '学会・論文',
    description: '学会発表・論文執筆のコツ',
    cluster: 'K',
  },
  'life-events': {
    name: '結婚・出産',
    description: '専攻医のライフイベント',
    cluster: 'H',
  },
  'subspecialty': {
    name: 'サブスペJ-OSLER',
    description: 'サブスペシャリティJ-OSLERの情報',
    cluster: 'A',
  },
  'others': {
    name: 'その他',
    description: 'その他の情報',
    cluster: 'Z',
  },
};

// クラスターカラー
export const clusterColors: Record<string, { bg: string; text: string; name: string }> = {
  A: { bg: '#1E3A5F', text: '#ffffff', name: 'J-OSLER基礎' },
  B: { bg: '#1B4F3A', text: '#ffffff', name: '病歴要約' },
  C: { bg: '#3D5A80', text: '#ffffff', name: '症例登録' },
  D: { bg: '#2D6A4F', text: '#ffffff', name: '進捗管理' },
  E: { bg: '#7F1D1D', text: '#ffffff', name: '試験対策' },
  F: { bg: '#4C1D95', text: '#ffffff', name: 'バイト' },
  G: { bg: '#92400E', text: '#ffffff', name: '確定申告' },
  H: { bg: '#9D174D', text: '#ffffff', name: '結婚' },
  I: { bg: '#134E4A', text: '#ffffff', name: 'メンタル' },
  J: { bg: '#4338CA', text: '#ffffff', name: 'キャリア' },
  K: { bg: '#6D28D9', text: '#ffffff', name: '学会' },
  Z: { bg: '#6B7280', text: '#ffffff', name: 'その他' },
};

// ピラーページ定義
export const pillarPages = {
  'josler-complete-guide': {
    title: 'J-OSLER完全攻略ガイド',
    description: 'J-OSLERの全てを網羅した完全ガイド',
    clusters: ['A', 'B', 'C', 'D'],
  },
  'exam-preparation-guide': {
    title: '内科専門医試験 合格マニュアル',
    description: '内科専門医試験の対策を徹底解説',
    clusters: ['E', 'K'],
  },
  'money-guide': {
    title: '専攻医のお金完全ガイド',
    description: 'バイト・確定申告・節税を解説',
    clusters: ['F', 'G'],
  },
  'lifehack-guide': {
    title: '専攻医ライフハック大全',
    description: 'メンタル・生活・結婚の悩みを解決',
    clusters: ['H', 'I'],
  },
  'career-guide': {
    title: 'キャリア設計完全ロードマップ',
    description: '内科専門医のキャリア設計を解説',
    clusters: ['J'],
  },
};

// CTA設定
export const ctaConfig = {
  template: {
    title: '📝 病歴要約テンプレートを使う',
    description: 'AIが病歴要約を自動生成。Accept率アップ！',
    buttonText: '無料で試す',
    url: '/',
  },
  progress: {
    title: '📊 進捗管理ツールを使う',
    description: 'J-OSLERの進捗を一目で把握',
    buttonText: '今すぐチェック',
    url: '/',
  },
  quiz: {
    title: '📚 内科専門医試験対策',
    description: '過去問・模擬問題で実力チェック',
    buttonText: '問題を解く',
    url: '/',
  },
  checklist: {
    title: '✅ 専攻医チェックリスト',
    description: '修了要件を漏れなくチェック',
    buttonText: 'チェックする',
    url: '/',
  },
  general: {
    title: '🩺 内科ナビを使ってみる',
    description: '専攻医の悩みをAIで解決',
    buttonText: '無料で始める',
    url: '/',
  },
};
