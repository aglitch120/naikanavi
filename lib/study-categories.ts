// lib/study-categories.ts
// デッキを5カテゴリに分類。国試はフォルダ構造（メジャー/マイナー/その他）

export interface DeckFolder {
  id: string
  title: string
  emoji: string
  deckIds: string[]
}

export interface DeckCategory {
  id: string
  title: string
  subtitle: string
  folders?: DeckFolder[]
  deckIds: string[]
}

const KOKUSHI_FOLDERS: DeckFolder[] = [
  {
    id: 'kokushi-major',
    title: 'メジャー科',
    emoji: '🏥',
    deckIds: [
      'default-junkanki', 'default-kokyuki', 'default-shokaki',
      'default-kantansui', 'default-shinkei', 'default-jinzo',
      'default-ketsueki', 'default-taisha', 'default-kansensho',
    ],
  },
  {
    id: 'kokushi-minor',
    title: 'マイナー科',
    emoji: '📎',
    deckIds: [
      'default-seikei', 'default-hinyoki', 'default-seishin',
      'default-hifu', 'default-ganka', 'default-jibi',
      'default-hoshasen', 'default-masui', 'default-meneki', 'default-allergy',
    ],
  },
  {
    id: 'kokushi-other',
    title: 'その他',
    emoji: '📚',
    deckIds: [
      'default-kokushi', 'default-shounika', 'default-sanka',
      'default-fujinka', 'default-geka', 'default-kyukyu', 'default-koshueisei',
    ],
  },
]

const ALL_KOKUSHI_IDS = KOKUSHI_FOLDERS.flatMap(f => f.deckIds)

export const DECK_CATEGORIES: DeckCategory[] = [
  {
    id: 'kokushi',
    title: '国試対策',
    subtitle: '医師国家試験 科目別',
    folders: KOKUSHI_FOLDERS,
    deckIds: ALL_KOKUSHI_IDS,
  },
  {
    id: 'cbt', title: 'CBT対策', subtitle: '出題基準準拠 15デッキ',
    deckIds: [
      'default-cbt',
      'cbt-professional', 'cbt-statistics-ebm', 'cbt-epidemiology', 'cbt-health-system',
      'cbt-cell-genetics', 'cbt-histology-embryology', 'cbt-physiology', 'cbt-biochemistry',
      'cbt-microbiology', 'cbt-immunology', 'cbt-pharmacology-pathology',
      'cbt-behavioral-science', 'cbt-clinical-core', 'cbt-systemic-disease', 'cbt-clinical-reasoning',
    ],
  },
  { id: 'resident', title: '研修医サバイバル', subtitle: '初期研修の必須知識', deckIds: [] },
  { id: 'senmon', title: '内科専門医', subtitle: '専門医試験対策', deckIds: ['default-naika'] },
  { id: 'update', title: '最新アップデート', subtitle: 'ガイドライン・新薬', deckIds: [] },
]

const CATEGORY_ORDER: Record<string, string[]> = {
  student:   ['kokushi', 'cbt', 'resident', 'update', 'senmon'],
  resident:  ['resident', 'update', 'kokushi', 'senmon', 'cbt'],
  fellow:    ['senmon', 'update', 'resident', 'kokushi', 'cbt'],
  attending: ['update', 'senmon', 'resident', 'kokushi', 'cbt'],
}

export function getOrderedCategories(userRole: string | null): DeckCategory[] {
  const order = CATEGORY_ORDER[userRole || 'student'] || CATEGORY_ORDER.student
  const all = order
    .map(id => DECK_CATEGORIES.find(c => c.id === id))
    .filter((c): c is DeckCategory => c != null)
  const withDecks = all.filter(c => c.deckIds.length > 0)
  const empty = all.filter(c => c.deckIds.length === 0)
  return [...withDecks, ...empty]
}

export function getCategoryForDeck(deckId: string): string | null {
  for (const cat of DECK_CATEGORIES) {
    if (cat.deckIds.includes(deckId)) return cat.id
  }
  return null
}
