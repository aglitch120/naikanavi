/**
 * FSRS (Free Spaced Repetition Scheduler) — Simplified implementation
 * Based on FSRS-4.5 algorithm by Jarrett Ye
 * 
 * Each card tracks: stability (S), difficulty (D), state, last review, reps
 * Rating: Again(1) / Hard(2) / Good(3) / Easy(4)
 */

export type Rating = 1 | 2 | 3 | 4
export type CardState = 'new' | 'learning' | 'review' | 'relearning'

export interface CardData {
  cardId: string         // e.g. "cbt-1", "kokushi-5", "custom-abc-3"
  state: CardState
  stability: number      // S: days until ~90% recall probability
  difficulty: number     // D: 0-10 scale
  elapsedDays: number    // days since last review
  scheduledDays: number  // interval in days
  reps: number           // total review count
  lapses: number         // count of Again ratings in review state
  lastReview: string     // ISO date string
}

export interface ReviewResult {
  card: CardData
  nextInterval: number   // days until next review
  label: string          // "1m" "10m" "1d" "3d" etc.
}

// ── FSRS default parameters (w0-w18) ──
const W = [
  0.4072, 1.1829, 3.1262, 15.4722,  // w0-w3: initial stability per rating
  7.2102,                              // w4: difficulty init
  0.5316, 1.0651,                      // w5-w6: difficulty update
  0.0092, 1.5972, 0.1059, 1.0127,     // w7-w10: stability after success
  1.9395, 0.1100, 0.2939,             // w11-w13: stability after failure
  2.0091, 0.2491, 2.9898, 0.5180, 0.6136 // w14-w18: additional params
]

const DESIRED_RETENTION = 0.9   // Target 90% recall
const DECAY = -0.5
const FACTOR = Math.pow(DESIRED_RETENTION, 1 / DECAY) - 1

// ── Core functions ──

function initDifficulty(rating: Rating): number {
  return clamp(W[4] - Math.exp(W[5] * (rating - 1)) + 1, 1, 10)
}

function initStability(rating: Rating): number {
  return Math.max(W[rating - 1], 0.1)
}

function nextDifficulty(d: number, rating: Rating): number {
  const newD = d - W[6] * (rating - 3)
  // Mean reversion
  return clamp(W[7] * initDifficulty(3) + (1 - W[7]) * newD, 1, 10)
}

function nextRecallStability(d: number, s: number, retrievability: number, rating: Rating): number {
  const hardPenalty = rating === 2 ? W[15] : 1
  const easyBonus = rating === 4 ? W[16] : 1
  return s * (1 + Math.exp(W[8]) *
    (11 - d) *
    Math.pow(s, -W[9]) *
    (Math.exp((1 - retrievability) * W[10]) - 1) *
    hardPenalty *
    easyBonus)
}

function nextForgetStability(d: number, s: number, retrievability: number): number {
  return Math.max(
    W[11] *
    Math.pow(d, -W[12]) *
    (Math.pow(s + 1, W[13]) - 1) *
    Math.exp((1 - retrievability) * W[14]),
    0.1
  )
}

function retrievability(elapsedDays: number, stability: number): number {
  if (stability <= 0) return 0
  return Math.pow(1 + FACTOR * elapsedDays / stability, DECAY)
}

function nextInterval(stability: number): number {
  return Math.max(Math.round(stability * FACTOR), 1)
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

// ── Public API ──

export function createNewCard(cardId: string): CardData {
  return {
    cardId,
    state: 'new',
    stability: 0,
    difficulty: 0,
    elapsedDays: 0,
    scheduledDays: 0,
    reps: 0,
    lapses: 0,
    lastReview: '',
  }
}

export function reviewCard(card: CardData, rating: Rating, now: Date = new Date()): CardData {
  const elapsed = card.lastReview
    ? Math.max((now.getTime() - new Date(card.lastReview).getTime()) / (1000 * 60 * 60 * 24), 0)
    : 0

  let newCard: CardData = { ...card }
  newCard.reps += 1
  newCard.lastReview = now.toISOString()

  if (card.state === 'new') {
    // First review
    newCard.difficulty = initDifficulty(rating)
    newCard.stability = initStability(rating)
    newCard.state = rating === 1 ? 'learning' : rating === 2 ? 'learning' : 'review'
    newCard.elapsedDays = 0
  } else {
    // Subsequent reviews
    const r = retrievability(elapsed, card.stability)
    newCard.difficulty = nextDifficulty(card.difficulty, rating)
    newCard.elapsedDays = Math.round(elapsed)

    if (rating === 1) {
      // Again — lapse
      newCard.stability = nextForgetStability(card.difficulty, card.stability, r)
      newCard.state = card.state === 'review' ? 'relearning' : 'learning'
      newCard.lapses += 1
    } else {
      // Hard/Good/Easy — success
      newCard.stability = nextRecallStability(card.difficulty, card.stability, r, rating)
      newCard.state = 'review'
    }
  }

  newCard.scheduledDays = nextInterval(newCard.stability)
  return newCard
}

/**
 * Get scheduled intervals for all 4 ratings (preview)
 */
export function getScheduledIntervals(card: CardData, now: Date = new Date()): ReviewResult[] {
  return ([1, 2, 3, 4] as Rating[]).map(rating => {
    const result = reviewCard(card, rating, now)
    return {
      card: result,
      nextInterval: result.scheduledDays,
      label: formatInterval(result.scheduledDays, card.state, rating),
    }
  })
}

function formatInterval(days: number, state: CardState, rating: Rating): string {
  if (state === 'new') {
    if (rating === 1) return '1m'
    if (rating === 2) return '6m'
    if (rating === 3) return '10m'
    return '1d'
  }
  if (rating === 1) return '10m'
  if (days < 1) return '<1d'
  if (days === 1) return '1d'
  if (days < 30) return `${days}d`
  if (days < 365) return `${Math.round(days / 30)}mo`
  return `${(days / 365).toFixed(1)}y`
}

/**
 * Sort cards for review: due cards first, then new cards
 */
export function getDueCards(allCardData: Map<string, CardData>, allCardIds: string[], now: Date = new Date()): string[] {
  const due: { id: string; priority: number }[] = []
  const newCards: string[] = []

  for (const id of allCardIds) {
    const data = allCardData.get(id)
    if (!data || data.state === 'new') {
      newCards.push(id)
      continue
    }

    // Check if due
    if (!data.lastReview) {
      newCards.push(id)
      continue
    }

    const elapsed = (now.getTime() - new Date(data.lastReview).getTime()) / (1000 * 60 * 60 * 24)

    if (data.state === 'learning' || data.state === 'relearning') {
      // Learning/relearning cards are always due
      due.push({ id, priority: -1000 + elapsed })
    } else if (elapsed >= data.scheduledDays) {
      // Review cards that are overdue
      const overdue = elapsed - data.scheduledDays
      due.push({ id, priority: -overdue }) // more overdue = higher priority
    }
  }

  // Sort: most overdue first
  due.sort((a, b) => a.priority - b.priority)

  return [...due.map(d => d.id), ...newCards]
}

// ── LocalStorage helpers ──

const CARD_DATA_KEY = 'iwor_study_fsrs'
const MIGRATION_KEY = 'iwor_study_fsrs_v2'

/** Migrate old numeric card IDs to string format ("cbt-N") */
function migrateV1Data(): Map<string, CardData> | null {
  try {
    const raw = localStorage.getItem(CARD_DATA_KEY)
    if (!raw) return null
    if (localStorage.getItem(MIGRATION_KEY)) return null // already migrated
    const arr = JSON.parse(raw) as Array<{ cardId: number | string } & Omit<CardData, 'cardId'>>
    if (arr.length === 0) return null
    // Check if any have numeric IDs
    const hasNumeric = arr.some(c => typeof c.cardId === 'number')
    if (!hasNumeric) return null
    const map = new Map<string, CardData>()
    arr.forEach(c => {
      const newId = typeof c.cardId === 'number' ? `cbt-${c.cardId}` : String(c.cardId)
      map.set(newId, { ...c, cardId: newId })
    })
    localStorage.setItem(MIGRATION_KEY, '1')
    return map
  } catch {
    return null
  }
}

export function loadAllCardData(): Map<string, CardData> {
  // Try migration first
  const migrated = migrateV1Data()
  if (migrated) {
    saveAllCardData(migrated)
    return migrated
  }
  try {
    const raw = localStorage.getItem(CARD_DATA_KEY)
    if (!raw) return new Map()
    const arr: CardData[] = JSON.parse(raw)
    const map = new Map<string, CardData>()
    arr.forEach(c => map.set(c.cardId, c))
    return map
  } catch {
    return new Map()
  }
}

export function saveAllCardData(data: Map<string, CardData>) {
  const arr: CardData[] = []
  data.forEach(v => arr.push(v))
  localStorage.setItem(CARD_DATA_KEY, JSON.stringify(arr))
}
