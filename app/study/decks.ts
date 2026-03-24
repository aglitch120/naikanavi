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
import { sanka_cards } from './data/sanka-cards'
import { fujinka_cards } from './data/fujinka-cards'
import { seikei_cards } from './data/seikei-cards'
import { hinyoki_cards } from './data/hinyoki-cards'
import { seishin_cards } from './data/seishin-cards'
import { hifu_cards } from './data/hifu-cards'
import { ganka_cards } from './data/ganka-cards'
import { jibi_cards } from './data/jibi-cards'
import { hoshasen_cards } from './data/hoshasen-cards'
import { masui_cards } from './data/masui-cards'
import { geka_cards } from './data/geka-cards'
import { koshueisei_cards } from './data/koshueisei-cards'
import { junkanki_cards } from './data/junkanki-cards'
import { shokaki_cards } from './data/shokaki-cards'
import { kokyuki_cards } from './data/kokyuki-cards'
import { kantansui_cards } from './data/kantansui-cards'

const TAISHA_TAGS = Array.from(new Set(TAISHA_CARDS.map(c => c.tag)))
const SHINKEI_TAGS = Array.from(new Set(shinkei_cards.map(c => c.tag)))
const JINZO_TAGS = Array.from(new Set(jinzo_cards.map(c => c.tag)))
const KETSUEKI_TAGS = Array.from(new Set(ketsueki_cards.map(c => c.tag)))
const KANSENSHO_TAGS = Array.from(new Set(kansensho_cards.map(c => c.tag)))
const MENEKI_TAGS = Array.from(new Set(meneki_cards.map(c => c.tag)))
const ALLERGY_TAGS = Array.from(new Set(allergy_cards.map(c => c.tag)))
const KYUKYU_TAGS = Array.from(new Set(kyukyu_cards.map(c => c.tag)))
const SHOUNIKA_TAGS = Array.from(new Set(shounika_cards.map(c => c.tag)))
const SANKA_TAGS = Array.from(new Set(sanka_cards.map(c => c.tag)))
const FUJINKA_TAGS = Array.from(new Set(fujinka_cards.map(c => c.tag)))
const SEIKEI_TAGS = Array.from(new Set(seikei_cards.map(c => c.tag)))
const HINYOKI_TAGS = Array.from(new Set(hinyoki_cards.map(c => c.tag)))
const SEISHIN_TAGS = Array.from(new Set(seishin_cards.map(c => c.tag)))
const HIFU_TAGS = Array.from(new Set(hifu_cards.map(c => c.tag)))
const GANKA_TAGS = Array.from(new Set(ganka_cards.map(c => c.tag)))
const JIBI_TAGS = Array.from(new Set(jibi_cards.map(c => c.tag)))
const HOSHASEN_TAGS = Array.from(new Set(hoshasen_cards.map(c => c.tag)))
const MASUI_TAGS = Array.from(new Set(masui_cards.map(c => c.tag)))
const GEKA_TAGS = Array.from(new Set(geka_cards.map(c => c.tag)))
const KOSHUEISEI_TAGS = Array.from(new Set(koshueisei_cards.map(c => c.tag)))
const JUNKANKI_TAGS = Array.from(new Set(junkanki_cards.map(c => c.tag)))
const SHOKAKI_TAGS = Array.from(new Set(shokaki_cards.map(c => c.tag)))
const KOKYUKI_TAGS = Array.from(new Set(kokyuki_cards.map(c => c.tag)))
const KANTANSUI_TAGS = Array.from(new Set(kantansui_cards.map(c => c.tag)))

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
  {
    id: 'default-sanka',
    name: '産科',
    emoji: '🤰',
    description: '産科 40問（国試逆算設計）',
    cards: sanka_cards,
    tags: SANKA_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-fujinka',
    name: '婦人科',
    emoji: '🌸',
    description: '婦人科 35問（国試逆算設計）',
    cards: fujinka_cards,
    tags: FUJINKA_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-seikei',
    name: '整形外科',
    emoji: '🦴',
    description: '整形外科 30問（国試逆算設計）',
    cards: seikei_cards,
    tags: SEIKEI_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-hinyoki',
    name: '泌尿器科',
    emoji: '🫀',
    description: '泌尿器科 25問（国試逆算設計）',
    cards: hinyoki_cards,
    tags: HINYOKI_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-seishin',
    name: '精神科',
    emoji: '🧠',
    description: '精神科 30問（国試逆算設計）',
    cards: seishin_cards,
    tags: SEISHIN_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-hifu',
    name: '皮膚科',
    emoji: '🩹',
    description: '皮膚科 20問（国試逆算設計）',
    cards: hifu_cards,
    tags: HIFU_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-ganka',
    name: '眼科',
    emoji: '👁️',
    description: '眼科 18問（国試逆算設計）',
    cards: ganka_cards,
    tags: GANKA_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-jibi',
    name: '耳鼻咽喉科',
    emoji: '👂',
    description: '耳鼻咽喉科 18問（国試逆算設計）',
    cards: jibi_cards,
    tags: JIBI_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-hoshasen',
    name: '放射線科',
    emoji: '☢️',
    description: '放射線科 12問（国試逆算設計）',
    cards: hoshasen_cards,
    tags: HOSHASEN_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-masui',
    name: '麻酔科',
    emoji: '💉',
    description: '麻酔科 8問（国試逆算設計）',
    cards: masui_cards,
    tags: MASUI_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-geka',
    name: '外科・周術期',
    emoji: '🔪',
    description: '外科・周術期管理 15問（国試逆算設計）',
    cards: geka_cards,
    tags: GEKA_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-koshueisei',
    name: '公衆衛生',
    emoji: '📊',
    description: '公衆衛生 35問（国試逆算設計）',
    cards: koshueisei_cards,
    tags: KOSHUEISEI_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-junkanki',
    name: '循環器',
    emoji: '❤️',
    description: '循環器 63問（国試逆算設計v2）',
    cards: junkanki_cards as any as FlashCard[],
    tags: JUNKANKI_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-kokyuki',
    name: '呼吸器',
    emoji: '🫁',
    description: '呼吸器 63問（国試逆算設計）',
    cards: kokyuki_cards as any as FlashCard[],
    tags: KOKYUKI_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-shokaki',
    name: '消化器',
    emoji: '🫄',
    description: '消化器 64問（国試逆算設計）',
    cards: shokaki_cards as any as FlashCard[],
    tags: SHOKAKI_TAGS,
    isDefault: true,
    createdAt: '2026-03-23T00:00:00Z',
    updatedAt: '2026-03-23T00:00:00Z',
  },
  {
    id: 'default-kantansui',
    name: '肝胆膵',
    emoji: '🟤',
    description: '肝胆膵 55問（国試逆算設計）',
    cards: kantansui_cards as any as FlashCard[],
    tags: KANTANSUI_TAGS,
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

// ── CBTデッキ（JSON from public/data/decks/） ──

const CBT_DECK_META: { id: string; name: string; emoji: string; file: string }[] = [
  { id: 'cbt-professional', name: 'プロフェッショナリズム', emoji: '🩺', file: 'cbt-professional.json' },
  { id: 'cbt-statistics-ebm', name: '統計・EBM', emoji: '📈', file: 'cbt-statistics-ebm.json' },
  { id: 'cbt-epidemiology', name: '疫学・予防医学', emoji: '🔬', file: 'cbt-epidemiology.json' },
  { id: 'cbt-health-system', name: '医療制度・法規', emoji: '⚖️', file: 'cbt-health-system.json' },
  { id: 'cbt-cell-genetics', name: '細胞・遺伝学', emoji: '🧬', file: 'cbt-cell-genetics.json' },
  { id: 'cbt-histology-embryology', name: '組織・発生学', emoji: '🔍', file: 'cbt-histology-embryology.json' },
  { id: 'cbt-physiology', name: '生理学', emoji: '⚡', file: 'cbt-physiology.json' },
  { id: 'cbt-biochemistry', name: '生化学', emoji: '🧪', file: 'cbt-biochemistry.json' },
  { id: 'cbt-microbiology', name: '微生物学', emoji: '🦠', file: 'cbt-microbiology.json' },
  { id: 'cbt-immunology', name: '免疫学', emoji: '🛡️', file: 'cbt-immunology.json' },
  { id: 'cbt-pharmacology-pathology', name: '薬理・病理総論', emoji: '💊', file: 'cbt-pharmacology-pathology.json' },
  { id: 'cbt-behavioral-science', name: '行動科学', emoji: '🧠', file: 'cbt-behavioral-science.json' },
  { id: 'cbt-clinical-core', name: '臨床医学', emoji: '🏥', file: 'cbt-clinical-core.json' },
  { id: 'cbt-systemic-disease', name: '全身性疾患', emoji: '🫀', file: 'cbt-systemic-disease.json' },
  { id: 'cbt-clinical-reasoning', name: '臨床推論', emoji: '🎯', file: 'cbt-clinical-reasoning.json' },
]

let cbtDecksCache: Deck[] | null = null

// CBTデッキJSONをdynamic importでバンドルに含める（fetchの失敗を回避）
const CBT_IMPORTS: Record<string, () => Promise<any>> = {
  'cbt-professional.json': () => import('../../public/data/decks/cbt-professional.json'),
  'cbt-statistics-ebm.json': () => import('../../public/data/decks/cbt-statistics-ebm.json'),
  'cbt-epidemiology.json': () => import('../../public/data/decks/cbt-epidemiology.json'),
  'cbt-health-system.json': () => import('../../public/data/decks/cbt-health-system.json'),
  'cbt-cell-genetics.json': () => import('../../public/data/decks/cbt-cell-genetics.json'),
  'cbt-histology-embryology.json': () => import('../../public/data/decks/cbt-histology-embryology.json'),
  'cbt-physiology.json': () => import('../../public/data/decks/cbt-physiology.json'),
  'cbt-biochemistry.json': () => import('../../public/data/decks/cbt-biochemistry.json'),
  'cbt-microbiology.json': () => import('../../public/data/decks/cbt-microbiology.json'),
  'cbt-immunology.json': () => import('../../public/data/decks/cbt-immunology.json'),
  'cbt-pharmacology-pathology.json': () => import('../../public/data/decks/cbt-pharmacology-pathology.json'),
  'cbt-behavioral-science.json': () => import('../../public/data/decks/cbt-behavioral-science.json'),
  'cbt-clinical-core.json': () => import('../../public/data/decks/cbt-clinical-core.json'),
  'cbt-systemic-disease.json': () => import('../../public/data/decks/cbt-systemic-disease.json'),
  'cbt-clinical-reasoning.json': () => import('../../public/data/decks/cbt-clinical-reasoning.json'),
}

function parseCbtCards(rawCards: any[]): FlashCard[] {
  return rawCards.map((c: any) => {
    if (c.type === 'step_card' && c.steps) {
      const steps = c.steps as { step: number; question: string; answer: string; hint?: string }[]
      return {
        id: c.id,
        front: `[4連問] ${c.scenario}\n\nStep 1: ${steps[0]?.question || ''}`,
        back: steps.map((s: any) => `Step ${s.step}: ${s.question}\n→ ${s.answer}`).join('\n\n'),
        tag: (c.tags && c.tags[0]) || '臨床推論',
        explanation: `対象疾患: ${c.target_disease || ''}（${c.disease_class || ''}群）`,
        source: c.source_code || '',
      }
    }
    return {
      id: c.id,
      front: c.front || '',
      back: c.back || '',
      tag: (c.tags && c.tags[0]) || c.deck || '',
      explanation: c.explanation || '',
      source: c.source_code || '',
    }
  })
}

/** CBTデッキをdynamic importで非同期ロード */
export async function loadCbtDecks(): Promise<Deck[]> {
  if (cbtDecksCache) return cbtDecksCache
  const decks: Deck[] = []
  for (const meta of CBT_DECK_META) {
    try {
      const importer = CBT_IMPORTS[meta.file]
      if (!importer) continue
      const mod = await importer()
      const rawCards = mod.default || mod
      const cards = parseCbtCards(Array.isArray(rawCards) ? rawCards : [])
      if (cards.length === 0) continue
      decks.push({
        id: meta.id,
        name: meta.name,
        emoji: meta.emoji,
        description: `CBT出題基準準拠 ${cards.length}問`,
        cards,
        tags: Array.from(new Set(cards.map(c => c.tag).filter(Boolean))),
        isDefault: true,
        createdAt: '2026-03-23T00:00:00Z',
        updatedAt: '2026-03-23T00:00:00Z',
      })
    } catch (err) {
      console.error(`CBT deck load error (${meta.file}):`, err)
    }
  }
  cbtDecksCache = decks
  return decks
}

/** 全デッキ（デフォルト + CBTキャッシュ + カスタム）を返す */
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
  // CBTデッキがキャッシュ済みなら含める
  const cbt = cbtDecksCache || []
  return [...DEFAULT_DECKS, ...cbt, ...customDecks]
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
  // DEFAULT_DECKSを検索
  const defaultDeck = DEFAULT_DECKS.find(d => d.id === deckId)
  if (defaultDeck) return defaultDeck.cards
  // CBTデッキキャッシュを検索
  const cbtDeck = cbtDecksCache?.find(d => d.id === deckId)
  if (cbtDeck) return cbtDeck.cards
  // カスタムデッキ
  return loadCustomCards(deckId)
}

/** 特定デッキのタグ一覧を取得 */
export function getDeckTags(deckId: string): string[] {
  const defaultDeck = DEFAULT_DECKS.find(d => d.id === deckId)
  if (defaultDeck) return defaultDeck.tags
  const cbtDeck = cbtDecksCache?.find(d => d.id === deckId)
  if (cbtDeck) return cbtDeck.tags
  const cards = loadCustomCards(deckId)
  return Array.from(new Set(cards.map(c => c.tag).filter(Boolean)))
}
