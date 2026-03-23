// デッキ管理システム
// デフォルト3デッキ + ユーザー自作デッキ（localStorage）

import { FlashCard } from './cbt-cards'
import { CBT_CARDS, TAGS as CBT_TAGS } from './cbt-cards'
import { KOKUSHI_CARDS, KOKUSHI_TAGS } from './kokushi-cards'
import { NAIKA_CARDS, NAIKA_TAGS } from './naika-cards'
import { TAISHA_CARDS } from './data/taisha-cards'
import { shinkei_cards } from './data/shinkei-cards'
import { jinzo_cards } from './data/jinzo-cards'
import { ketsueki_cards } from './data/ketsueki-cards'
import { kansensho_cards } from './data/kansensho-cards'
import { meneki_cards } from './data/meneki-cards'
import { allergy_cards } from './data/allergy-cards'
import { kyukyu_cards } from './data/kyukyu-cards'
import { shounika_cards } from './data/shounika-cards'

const TAISHA_TAGS = Array.from(new Set(TAISHA_CARDS.map(c => c.tag)))
const SHINKEI_TAGS = Array.from(new Set(shinkei_cards.map(c => c.tag)))
const JINZO_TAGS = Array.from(new Set(jinzo_cards.map(c => c.tag)))
const KETSUEKI_TAGS = Array.from(new Set(ketsueki_cards.map(c => c.tag)))
const KANSENSHO_TAGS = Array.from(new Set(kansensho_cards.map(c => c.tag)))
const MENEKI_TAGS = Array.from(new Set(meneki_cards.map(c => c.tag)))
const ALLERGY_TAGS = Array.from(new Set(allergy_cards.map(c => c.tag)))
const KYUKYU_TAGS = Array.from(new Set(kyukyu_cards.map(c => c.tag)))
const SHOUNIKA_TAGS = Array.from(new Set(shounika_cards.map(c => c.tag)))

// ── 型定義 ──

export interface Deck {
  id: string            // "default-cbt", "default-kokushi", "default-naika", "custom-xxxxx"
  name: string
  emoji: string
  description: string
  cards: FlashCard[]
  tags: string[]
  isDefault: boolean
  createdAt: string     // ISO
  updatedAt: string     // ISO
}

export interface CustomDeckMeta {
  id: string
  name: string
  emoji: string
  description: string
  createdAt: string
  updatedAt: string
}

// ── デフォルトデッキ ──

const DEFAULT_DECKS: Deck[] = [
  {
    id: 'default-cbt',
    name: 'CBT基礎',
    emoji: '🧠',
    description: '医学部4年 CBT対策の必須知識 50問',
    cards: CBT_CARDS,
    tags: CBT_TAGS,
    isDefault: true,
    createdAt: '2026-03-01T00:00:00Z',
    updatedAt: '2026-03-20T00:00:00Z',
  },
  {
    id: 'default-kokushi',
    name: '国試必修',
    emoji: '📋',
    description: '医師国家試験 必修問題対策 50問',
    cards: KOKUSHI_CARDS,
    tags: KOKUSHI_TAGS,
    isDefault: true,
    createdAt: '2026-03-20T00:00:00Z',
    updatedAt: '2026-03-20T00:00:00Z',
  },
  {
    id: 'default-naika',
    name: '内科基礎',
    emoji: '🏥',
    description: '内科専門医・内科ローテーション必須知識 50問',
    cards: NAIKA_CARDS,
    tags: NAIKA_TAGS,
    isDefault: true,
    createdAt: '2026-03-20T00:00:00Z',
    updatedAt: '2026-03-20T00:00:00Z',
  },
  {
    id: 'default-taisha',
    name: '代謝・内分泌',
    emoji: '🧪',
    description: '内科専門医試験 代謝・内分泌領域 55問',
    cards: TAISHA_CARDS,
    tags: TAISHA_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-shinkei',
    name: '脳・神経',
    emoji: '🧠',
    description: '内科専門医試験 脳・神経領域 60問（国試逆算設計）',
    cards: shinkei_cards,
    tags: SHINKEI_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-jinzo',
    name: '腎臓',
    emoji: '🫘',
    description: '内科専門医試験 腎臓領域 45問（国試逆算設計）',
    cards: jinzo_cards,
    tags: JINZO_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-ketsueki',
    name: '血液',
    emoji: '🩸',
    description: '内科専門医試験 血液領域 42問（国試逆算設計）',
    cards: ketsueki_cards,
    tags: KETSUEKI_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-kansensho',
    name: '感染症',
    emoji: '🦠',
    description: '内科専門医試験 感染症領域 50問（国試逆算設計）',
    cards: kansensho_cards,
    tags: KANSENSHO_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-meneki',
    name: '自己免疫',
    emoji: '🛡️',
    description: '内科専門医試験 自己免疫疾患 25問（国試逆算設計）',
    cards: meneki_cards,
    tags: MENEKI_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-allergy',
    name: 'アレルギー',
    emoji: '🤧',
    description: '内科専門医試験 アレルギー疾患 15問（国試逆算設計）',
    cards: allergy_cards,
    tags: ALLERGY_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-kyukyu',
    name: '救急',
    emoji: '🚑',
    description: '救急・集中治療 25問（国試逆算設計）',
    cards: kyukyu_cards,
    tags: KYUKYU_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-shounika',
    name: '小児科',
    emoji: '👶',
    description: '小児科 45問（国試逆算設計）',
    cards: shounika_cards,
    tags: SHOUNIKA_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
]

// ── localStorage キー ──

const CUSTOM_DECKS_KEY = 'iwor_study_custom_decks'  // CustomDeckMeta[]
const CUSTOM_CARDS_PREFIX = 'iwor_study_deck_'        // + deckId → FlashCard[]

// ── ユーティリティ ──

function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

// ── カスタムデッキCRUD ──

function loadCustomDeckMetas(): CustomDeckMeta[] {
  try {
    const raw = localStorage.getItem(CUSTOM_DECKS_KEY)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveCustomDeckMetas(metas: CustomDeckMeta[]) {
  localStorage.setItem(CUSTOM_DECKS_KEY, JSON.stringify(metas))
}

function loadCustomCards(deckId: string): FlashCard[] {
  try {
    const raw = localStorage.getItem(CUSTOM_CARDS_PREFIX + deckId)
    if (!raw) return []
    return JSON.parse(raw)
  } catch {
    return []
  }
}

function saveCustomCards(deckId: string, cards: FlashCard[]) {
  localStorage.setItem(CUSTOM_CARDS_PREFIX + deckId, JSON.stringify(cards))
}

// ── Public API ──

/** 全デッキ（デフォルト + カスタム）を返す */
export function loadAllDecks(): Deck[] {
  const customMetas = loadCustomDeckMetas()
  const customDecks: Deck[] = customMetas.map(meta => {
    const cards = loadCustomCards(meta.id)
    return {
      ...meta,
      cards,
      tags: Array.from(new Set(cards.map(c => c.tag).filter(Boolean))),
      isDefault: false,
    }
  })
  return [...DEFAULT_DECKS, ...customDecks]
}

/** カスタムデッキを新規作成 */
export function createCustomDeck(name: string, emoji: string, description: string): Deck {
  const id = `custom-${generateId()}`
  const now = new Date().toISOString()
  const meta: CustomDeckMeta = { id, name, emoji, description, createdAt: now, updatedAt: now }

  const metas = loadCustomDeckMetas()
  metas.push(meta)
  saveCustomDeckMetas(metas)
  saveCustomCards(id, [])

  return { ...meta, cards: [], tags: [], isDefault: false }
}

/** カスタムデッキの名前・emoji・descriptionを更新 */
export function updateCustomDeck(deckId: string, updates: { name?: string; emoji?: string; description?: string }): boolean {
  const metas = loadCustomDeckMetas()
  const idx = metas.findIndex(m => m.id === deckId)
  if (idx === -1) return false

  if (updates.name !== undefined) metas[idx].name = updates.name
  if (updates.emoji !== undefined) metas[idx].emoji = updates.emoji
  if (updates.description !== undefined) metas[idx].description = updates.description
  metas[idx].updatedAt = new Date().toISOString()
  saveCustomDeckMetas(metas)
  return true
}

/** カスタムデッキを削除 */
export function deleteCustomDeck(deckId: string): boolean {
  const metas = loadCustomDeckMetas()
  const idx = metas.findIndex(m => m.id === deckId)
  if (idx === -1) return false

  metas.splice(idx, 1)
  saveCustomDeckMetas(metas)
  localStorage.removeItem(CUSTOM_CARDS_PREFIX + deckId)
  return true
}

/** カスタムデッキにカード追加 */
export function addCardToDeck(deckId: string, front: string, back: string, tag: string): FlashCard {
  const cards = loadCustomCards(deckId)
  const cardNum = cards.length + 1
  const card: FlashCard = {
    id: `${deckId}-${cardNum}`,
    front,
    back,
    tag,
  }
  cards.push(card)
  saveCustomCards(deckId, cards)

  // Update meta timestamp
  const metas = loadCustomDeckMetas()
  const idx = metas.findIndex(m => m.id === deckId)
  if (idx !== -1) {
    metas[idx].updatedAt = new Date().toISOString()
    saveCustomDeckMetas(metas)
  }

  return card
}

/** カスタムデッキのカードを更新 */
export function updateCardInDeck(deckId: string, cardId: string, updates: { front?: string; back?: string; tag?: string }): boolean {
  const cards = loadCustomCards(deckId)
  const idx = cards.findIndex(c => c.id === cardId)
  if (idx === -1) return false

  if (updates.front !== undefined) cards[idx].front = updates.front
  if (updates.back !== undefined) cards[idx].back = updates.back
  if (updates.tag !== undefined) cards[idx].tag = updates.tag
  saveCustomCards(deckId, cards)
  return true
}

/** カスタムデッキからカード削除 */
export function deleteCardFromDeck(deckId: string, cardId: string): boolean {
  const cards = loadCustomCards(deckId)
  const idx = cards.findIndex(c => c.id === cardId)
  if (idx === -1) return false

  cards.splice(idx, 1)
  saveCustomCards(deckId, cards)
  return true
}

/** .apkgインポート: カード付きでカスタムデッキを一括作成 */
export function importDeckWithCards(name: string, emoji: string, description: string, cards: FlashCard[]): Deck {
  const id = `custom-${generateId()}`
  const now = new Date().toISOString()
  const meta: CustomDeckMeta = { id, name, emoji, description, createdAt: now, updatedAt: now }

  const metas = loadCustomDeckMetas()
  metas.push(meta)
  saveCustomDeckMetas(metas)

  // カードIDをこのデッキのIDに付け替え
  const deckCards = cards.map((c, i) => ({
    ...c,
    id: `${id}-${i + 1}`,
  }))
  saveCustomCards(id, deckCards)

  return {
    ...meta,
    cards: deckCards,
    tags: Array.from(new Set(deckCards.map(c => c.tag).filter(Boolean))),
    isDefault: false,
  }
}

/** 特定デッキのカード一覧を取得 */
export function getDeckCards(deckId: string): FlashCard[] {
  const defaultDeck = DEFAULT_DECKS.find(d => d.id === deckId)
  if (defaultDeck) return defaultDeck.cards
  return loadCustomCards(deckId)
}

/** 特定デッキのタグ一覧を取得 */
export function getDeckTags(deckId: string): string[] {
  const defaultDeck = DEFAULT_DECKS.find(d => d.id === deckId)
  if (defaultDeck) return defaultDeck.tags
  const cards = loadCustomCards(deckId)
  return Array.from(new Set(cards.map(c => c.tag).filter(Boolean)))
}
