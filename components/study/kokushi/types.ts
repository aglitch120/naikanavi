// ── Kokushi shared types ──

export type Tab = 'dashboard' | 'practice' | 'cards' | 'stats' | 'chat' | 'notes'
export type Mark = 'dbl' | 'ok' | 'tri' | 'x' | 'none'
export type PracticeView = 'field' | 'exam' | 'sets'
export type DeckView = 'list' | 'review'
export type CardsTab = 'mine' | 'shared'
export type StatsTab = 'kokushi' | 'cards'
export type ChatTab = 'free' | 'history'

export interface NavItem {
  id: Tab
  icon: string
  label: string
}

export interface MarkDef {
  key: Mark
  icon: string
  color: string
  label: string
}

export interface SubField {
  id: string
  label: string
  total: number
  done: number
  pct: number
  marks: Record<Mark, number>
}

export interface FieldGroup {
  id: string
  label: string
  subs: SubField[]
}

export interface ExamEntry {
  year: number
  total: number
  done: number
  pct: number
}

export interface QuestionItem {
  id: string
  stem: string
  field: string
  mark: Mark
  last: string | null
}

export interface MockSet {
  name: string
  count: number
  created: string
}

export interface DeckItem {
  id: number
  name: string
  cards: number
  due: number
  folder: string
}

export interface ChatHistoryItem {
  id: number
  title: string
  date: string
  src: string
}

export interface NoteItem {
  id: number
  title: string
  folder: string
  updated: string
  preview: string
}

export interface GenCard {
  front: string
  back: string
  type: string
}
