// lib/study-categories.ts
// デッキを5カテゴリに分類し、ユーザー属性に応じて表示順を並び替える

export interface DeckCategory {
  id: string
  title: string
  subtitle: string
  /** default deck IDs belonging to this category */
  deckIds: string[]
}

export const DECK_CATEGORIES: DeckCategory[] = [
  {
    id: 'kokushi',
    title: '国試対策',
    subtitle: '医師国家試験 科目別',
    deckIds: [
      'default-kokushi',
      'default-junkanki',
      'default-kokyuki',
      'default-shokaki',
      'default-kantansui',
      'default-shinkei',
      'default-jinzo',
      'default-ketsueki',
      'default-taisha',
      'default-kansensho',
      'default-meneki',
      'default-allergy',
      'default-kyukyu',
      'default-shounika',
      'default-sanka',
      'default-fujinka',
      'default-seikei',
      'default-hinyoki',
      'default-seishin',
      'default-hifu',
      'default-ganka',
      'default-jibi',
      'default-hoshasen',
      'default-masui',
      'default-geka',
      'default-koshueisei',
    ],
  },
  {
    id: 'cbt',
    title: 'CBT・OSCE',
    subtitle: '臨床実習前',
    deckIds: ['default-cbt'],
  },
  {
    id: 'resident',
    title: '研修医サバイバル',
    subtitle: '初期研修の必須知識',
    deckIds: [],  // 今後追加予定
  },
  {
    id: 'senmon',
    title: '内科専門医',
    subtitle: '専門医試験対策',
    deckIds: ['default-naika'],
  },
  {
    id: 'update',
    title: '最新アップデート',
    subtitle: 'ガイドライン・新薬',
    deckIds: [],  // 今後追加予定
  },
]

// ユーザー属性に応じたカテゴリ表示順
const CATEGORY_ORDER: Record<string, string[]> = {
  student:   ['kokushi', 'cbt', 'resident', 'update', 'senmon'],
  resident:  ['resident', 'update', 'kokushi', 'senmon', 'cbt'],
  fellow:    ['senmon', 'update', 'resident', 'kokushi', 'cbt'],
  attending: ['update', 'senmon', 'resident', 'kokushi', 'cbt'],
}

/** ユーザー属性に応じてカテゴリを並び替え。デッキが0件のカテゴリは末尾に移動 */
export function getOrderedCategories(userRole: string | null): DeckCategory[] {
  const order = CATEGORY_ORDER[userRole || 'student'] || CATEGORY_ORDER.student
  const all = order
    .map(id => DECK_CATEGORIES.find(c => c.id === id))
    .filter((c): c is DeckCategory => c != null)
  // デッキがあるカテゴリを先に、空のカテゴリを後に
  const withDecks = all.filter(c => c.deckIds.length > 0)
  const empty = all.filter(c => c.deckIds.length === 0)
  return [...withDecks, ...empty]
}

/** デッキIDからカテゴリを逆引き */
export function getCategoryForDeck(deckId: string): string | null {
  for (const cat of DECK_CATEGORIES) {
    if (cat.deckIds.includes(deckId)) return cat.id
  }
  return null
}
