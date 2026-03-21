'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import Link from 'next/link'
import AppHeader from '@/components/AppHeader'
import { FlashCard } from './cbt-cards'
import {
  Rating, CardData,
  createNewCard, reviewCard, getScheduledIntervals,
  getDueCards, loadAllCardData, saveAllCardData,
} from './fsrs'
import {
  Deck, loadAllDecks, createCustomDeck, updateCustomDeck, deleteCustomDeck,
  addCardToDeck, updateCardInDeck, deleteCardFromDeck, getDeckCards, getDeckTags,
  importDeckWithCards,
} from './decks'
import { parseApkgFile, ApkgImportResult } from './apkg-import'
import ProModal from '@/components/pro/ProModal'
import { useProStatus } from '@/components/pro/useProStatus'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://iwor-api.mightyaddnine.workers.dev'

// ── セッション統計 ──
const STATS_KEY = 'iwor_study_stats'
interface DayStats { date: string; reviewed: number; correct: number }

function getTodayStats(): DayStats {
  const today = new Date().toISOString().split('T')[0]
  try {
    const raw = localStorage.getItem(STATS_KEY)
    if (raw) {
      const stats: DayStats = JSON.parse(raw)
      if (stats.date === today) return stats
    }
  } catch {}
  return { date: today, reviewed: 0, correct: 0 }
}

function saveTodayStats(stats: DayStats) {
  localStorage.setItem(STATS_KEY, JSON.stringify(stats))
}

// ── ストリーク追跡 ──
const STREAK_KEY = 'iwor_study_streak'
interface StreakData { lastDate: string; count: number; best: number }

function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem(STREAK_KEY)
    if (raw) return JSON.parse(raw)
  } catch {}
  return { lastDate: '', count: 0, best: 0 }
}

function updateStreak(): StreakData {
  const today = new Date().toISOString().split('T')[0]
  const streak = getStreak()
  if (streak.lastDate === today) return streak // 今日すでに更新済み

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString().split('T')[0]

  let newCount: number
  if (streak.lastDate === yesterdayStr) {
    newCount = streak.count + 1 // 連続
  } else {
    newCount = 1 // リセット
  }
  const newBest = Math.max(newCount, streak.best)
  const updated = { lastDate: today, count: newCount, best: newBest }
  localStorage.setItem(STREAK_KEY, JSON.stringify(updated))
  return updated
}

// ── ストリークサーバー同期（fire-and-forget）──
function syncStreakToServer(streakData: StreakData) {
  try {
    const token = localStorage.getItem('iwor_session_token')
    if (!token) return
    const userRaw = localStorage.getItem('iwor_user')
    const displayName = userRaw ? (JSON.parse(userRaw).name || '匿名医師') : '匿名医師'
    fetch(`${API_BASE}/api/streak`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({
        count: streakData.count,
        best: streakData.best,
        lastDate: streakData.lastDate,
        displayName: displayName.slice(0, 8),
      }),
    }).catch(() => {})
  } catch {}
}

// ── 試験カウントダウン ──
const EXAM_KEY = 'iwor_study_exam'
interface ExamData { name: string; date: string; emoji: string }

const EXAM_PRESETS: { name: string; emoji: string }[] = [
  { name: 'CBT', emoji: '📖' },
  { name: '医師国家試験', emoji: '🏥' },
  { name: '専門医試験', emoji: '🎓' },
]

function loadExam(): ExamData | null {
  try {
    const raw = localStorage.getItem(EXAM_KEY)
    if (raw) {
      const data: ExamData = JSON.parse(raw)
      if (data.name && data.date) return data
    }
  } catch {}
  return null
}

function saveExam(data: ExamData) {
  localStorage.setItem(EXAM_KEY, JSON.stringify(data))
}

function deleteExam() {
  localStorage.removeItem(EXAM_KEY)
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

// ── 画面定義 ──
type Screen = 'home' | 'deck' | 'study' | 'result' | 'create-deck' | 'edit-deck' | 'add-card' | 'edit-card' | 'card-list' | 'exam-settings' | 'ranking'

// ── ランキングデータ型 ──
interface RankingEntry { displayName: string; count: number; rank: number }
interface RankingData {
  leaderboard: RankingEntry[]
  myRank: number | null
  myStreak: number
  totalUsers: number
  isPro: boolean
}

const RATING_BUTTONS: { rating: Rating; label: string; color: string; bgColor: string; borderColor: string }[] = [
  { rating: 1, label: 'もう一度', color: '#DC2626', bgColor: '#FEF2F2', borderColor: '#FECACA' },
  { rating: 2, label: '難しい',  color: '#D97706', bgColor: '#FFFBEB', borderColor: '#FDE68A' },
  { rating: 3, label: '正解',    color: '#059669', bgColor: '#ECFDF5', borderColor: '#A7F3D0' },
  { rating: 4, label: '余裕',    color: '#2563EB', bgColor: '#EFF6FF', borderColor: '#BFDBFE' },
]

const EMOJI_OPTIONS = ['📚', '🧠', '💊', '🩺', '🔬', '📋', '🏥', '⚕️', '🫀', '🫁', '🦴', '🧬', '💉', '🩻', '📝', '🎯']

export default function StudyApp() {
  // ── State ──
  const [screen, setScreen] = useState<Screen>('home')
  const [decks, setDecks] = useState<Deck[]>([])
  const [activeDeckId, setActiveDeckId] = useState<string | null>(null)
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [studyQueue, setStudyQueue] = useState<string[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)
  const [dayStats, setDayStats] = useState<DayStats>({ date: '', reviewed: 0, correct: 0 })
  const [cardDataMap, setCardDataMap] = useState<Map<string, CardData>>(new Map())

  // Form states
  const [formName, setFormName] = useState('')
  const [formEmoji, setFormEmoji] = useState('📚')
  const [formDesc, setFormDesc] = useState('')
  const [formFront, setFormFront] = useState('')
  const [formBack, setFormBack] = useState('')
  const [formTag, setFormTag] = useState('')
  const [editingCardId, setEditingCardId] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState(false)
  const [streak, setStreak] = useState<StreakData>({ lastDate: '', count: 0, best: 0 })
  const [examData, setExamData] = useState<ExamData | null>(null)
  const [examFormName, setExamFormName] = useState('')
  const [examFormDate, setExamFormDate] = useState('')
  const [examFormEmoji, setExamFormEmoji] = useState('📖')

  // Import states
  const [importLoading, setImportLoading] = useState(false)
  const [importError, setImportError] = useState('')
  const [importResult, setImportResult] = useState<ApkgImportResult | null>(null)

  // Ranking states
  const [rankingData, setRankingData] = useState<RankingData | null>(null)
  const [rankingLoading, setRankingLoading] = useState(false)

  // PRO states
  const { isPro } = useProStatus()
  const [showProModal, setShowProModal] = useState(false)
  const [streakPromoShown, setStreakPromoShown] = useState(false)

  // ── Init ──
  useEffect(() => {
    setDayStats(getTodayStats())
    setCardDataMap(loadAllCardData())
    setDecks(loadAllDecks())
    setStreak(getStreak())
    setExamData(loadExam())
    setStreakPromoShown(localStorage.getItem('streak_promo_shown') === 'true')
  }, [])

  // ── Active deck ──
  const activeDeck = useMemo(() => {
    if (!activeDeckId) return null
    return decks.find(d => d.id === activeDeckId) || null
  }, [decks, activeDeckId])

  // ── Filtered card IDs for active deck ──
  const filteredIds = useMemo(() => {
    if (!activeDeck) return []
    const cards = getDeckCards(activeDeck.id)
    if (selectedTags.size === 0) return cards.map(c => c.id)
    return cards.filter(c => selectedTags.has(c.tag)).map(c => c.id)
  }, [activeDeck, selectedTags])

  // ── Due counts ──
  const dueInfo = useMemo(() => {
    const now = new Date()
    let dueCount = 0
    let newCount = 0

    for (const id of filteredIds) {
      const data = cardDataMap.get(id)
      if (!data || data.state === 'new') { newCount++; continue }
      if (data.state === 'learning' || data.state === 'relearning') { dueCount++; continue }
      if (data.lastReview) {
        const elapsed = (now.getTime() - new Date(data.lastReview).getTime()) / (1000 * 60 * 60 * 24)
        if (elapsed >= data.scheduledDays) dueCount++
      }
    }

    return { dueCount, newCount, total: filteredIds.length }
  }, [filteredIds, cardDataMap])

  // ── Deck-level due info (for home screen) ──
  const getDeckDueInfo = useCallback((deck: Deck) => {
    const now = new Date()
    let dueCount = 0; let newCount = 0
    for (const card of deck.cards) {
      const data = cardDataMap.get(card.id)
      if (!data || data.state === 'new') { newCount++; continue }
      if (data.state === 'learning' || data.state === 'relearning') { dueCount++; continue }
      if (data.lastReview) {
        const elapsed = (now.getTime() - new Date(data.lastReview).getTime()) / (1000 * 60 * 60 * 24)
        if (elapsed >= data.scheduledDays) dueCount++
      }
    }
    return { dueCount, newCount, total: deck.cards.length }
  }, [cardDataMap])

  // ── Start session ──
  const startSession = useCallback(() => {
    const queue = getDueCards(cardDataMap, filteredIds)
    if (queue.length === 0) return
    setStudyQueue(queue)
    setCurrentIdx(0)
    setFlipped(false)
    setSessionCorrect(0)
    setSessionTotal(0)
    setScreen('study')
  }, [cardDataMap, filteredIds])

  // ── Answer with FSRS ──
  const answer = useCallback((rating: Rating) => {
    const cardId = studyQueue[currentIdx]
    const existing = cardDataMap.get(cardId) || createNewCard(cardId)
    const updated = reviewCard(existing, rating)

    const newMap = new Map(cardDataMap)
    newMap.set(cardId, updated)
    setCardDataMap(newMap)
    saveAllCardData(newMap)

    const isCorrect = rating >= 3
    setSessionTotal(prev => prev + 1)
    if (isCorrect) setSessionCorrect(prev => prev + 1)

    const stats = getTodayStats()
    stats.reviewed++
    if (isCorrect) stats.correct++
    saveTodayStats(stats)
    setDayStats({ ...stats })

    if (currentIdx + 1 >= studyQueue.length) {
      const updatedStreak = updateStreak()
      setStreak(updatedStreak)
      syncStreakToServer(updatedStreak)
      // 7日達成PROモーダル
      if (updatedStreak.count >= 7 && !isPro && !streakPromoShown) {
        setStreakPromoShown(true)
        localStorage.setItem('streak_promo_shown', 'true')
        setTimeout(() => setShowProModal(true), 1500)
      }
      setScreen('result')
    } else {
      setCurrentIdx(currentIdx + 1)
      setFlipped(false)
    }
  }, [studyQueue, currentIdx, cardDataMap])

  // ── Deck CRUD handlers ──
  const handleCreateDeck = useCallback(() => {
    if (!formName.trim()) return
    const deck = createCustomDeck(formName.trim(), formEmoji, formDesc.trim())
    setDecks(loadAllDecks())
    setActiveDeckId(deck.id)
    setScreen('deck')
    setFormName(''); setFormEmoji('📚'); setFormDesc('')
  }, [formName, formEmoji, formDesc])

  const handleUpdateDeck = useCallback(() => {
    if (!activeDeckId || !formName.trim()) return
    updateCustomDeck(activeDeckId, { name: formName.trim(), emoji: formEmoji, description: formDesc.trim() })
    setDecks(loadAllDecks())
    setScreen('deck')
    setFormName(''); setFormEmoji('📚'); setFormDesc('')
  }, [activeDeckId, formName, formEmoji, formDesc])

  const handleDeleteDeck = useCallback(() => {
    if (!activeDeckId) return
    deleteCustomDeck(activeDeckId)
    setDecks(loadAllDecks())
    setActiveDeckId(null)
    setScreen('home')
    setDeleteConfirm(false)
  }, [activeDeckId])

  // ── Card CRUD handlers ──
  const handleAddCard = useCallback(() => {
    if (!activeDeckId || !formFront.trim() || !formBack.trim()) return
    addCardToDeck(activeDeckId, formFront.trim(), formBack.trim(), formTag.trim())
    setDecks(loadAllDecks())
    setFormFront(''); setFormBack(''); setFormTag('')
    setScreen('deck')
  }, [activeDeckId, formFront, formBack, formTag])

  const handleUpdateCard = useCallback(() => {
    if (!activeDeckId || !editingCardId || !formFront.trim() || !formBack.trim()) return
    updateCardInDeck(activeDeckId, editingCardId, { front: formFront.trim(), back: formBack.trim(), tag: formTag.trim() })
    setDecks(loadAllDecks())
    setEditingCardId(null)
    setFormFront(''); setFormBack(''); setFormTag('')
    setScreen('card-list')
  }, [activeDeckId, editingCardId, formFront, formBack, formTag])

  const handleDeleteCard = useCallback((cardId: string) => {
    if (!activeDeckId) return
    deleteCardFromDeck(activeDeckId, cardId)
    setDecks(loadAllDecks())
  }, [activeDeckId])

  // ── .apkgインポート ──
  const handleImportApkg = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    // input をリセット（同じファイルを再選択可能にする）
    e.target.value = ''

    setImportLoading(true)
    setImportError('')
    setImportResult(null)

    try {
      const result = await parseApkgFile(file)
      const deck = importDeckWithCards(
        result.deckName,
        '📥',
        `Ankiからインポート（${result.importedCards}枚）`
      , result.cards)
      setDecks(loadAllDecks())
      setImportResult(result)
      setActiveDeckId(deck.id)
      // 少し表示してからデッキ画面へ
      setTimeout(() => {
        setImportResult(null)
        setScreen('deck')
      }, 2000)
    } catch (err) {
      setImportError(err instanceof Error ? err.message : 'インポートに失敗しました')
    } finally {
      setImportLoading(false)
    }
  }, [])

  // ── ランキング取得 ──
  const fetchRanking = useCallback(async () => {
    setRankingLoading(true)
    try {
      const headers: Record<string, string> = {}
      const token = localStorage.getItem('iwor_session_token')
      if (token) headers['Authorization'] = `Bearer ${token}`
      const res = await fetch(`${API_BASE}/api/streak/ranking`, { headers })
      if (res.ok) {
        const data = await res.json()
        setRankingData(data)
      }
    } catch {}
    setRankingLoading(false)
  }, [])

  // ── Navigation helpers ──
  const openDeck = useCallback((deckId: string) => {
    setActiveDeckId(deckId)
    setSelectedTags(new Set())
    setScreen('deck')
  }, [])

  const goHome = useCallback(() => {
    setScreen('home')
    setActiveDeckId(null)
    setSelectedTags(new Set())
    setDeleteConfirm(false)
  }, [])

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => {
      const n = new Set(prev)
      n.has(tag) ? n.delete(tag) : n.add(tag)
      return n
    })
  }, [])

  // ── Current card (study) ──
  const currentCard = useMemo(() => {
    if (screen !== 'study' || studyQueue.length === 0 || !activeDeck) return null
    const cards = getDeckCards(activeDeck.id)
    return cards.find(c => c.id === studyQueue[currentIdx]) || null
  }, [screen, studyQueue, currentIdx, activeDeck])

  const intervalPreviews = useMemo(() => {
    if (!currentCard) return []
    const data = cardDataMap.get(currentCard.id) || createNewCard(currentCard.id)
    return getScheduledIntervals(data)
  }, [currentCard, cardDataMap])

  // ── 共通パーツ ──
  const BackButton = ({ onClick, label = '戻る' }: { onClick: () => void; label?: string }) => (
    <button onClick={onClick} className="text-xs text-muted hover:text-tx transition-colors flex items-center gap-1 mb-4">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
      </svg>
      {label}
    </button>
  )

  // ══════════════════════════════════════════
  //  ホーム画面
  // ══════════════════════════════════════════
  if (screen === 'home') {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto">
        <AppHeader
          title="iwor Study"
          subtitle="医学フラッシュカード — FSRS搭載の科学的復習スケジューラー"
          badge="NEW"
          favoriteSlug="app-study"
          favoriteHref="/study"
        />

        {/* 試験カウントダウン */}
        {examData ? (() => {
          const days = getDaysUntil(examData.date)
          const urgentColor = days <= 7 ? '#991B1B' : days <= 30 ? '#92400E' : MC
          const urgentBg = days <= 7 ? '#FEE2E2' : days <= 30 ? '#FEF3C7' : MCL
          const urgentBorder = days <= 7 ? '#FCA5A5' : days <= 30 ? '#FCD34D' : 'rgba(27,79,58,0.2)'
          return (
            <button
              onClick={() => {
                setExamFormName(examData.name)
                setExamFormDate(examData.date)
                setExamFormEmoji(examData.emoji)
                setScreen('exam-settings')
              }}
              className="w-full rounded-xl p-4 mb-6 text-left transition-all hover:opacity-90 border"
              style={{ background: urgentBg, borderColor: urgentBorder }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{examData.emoji}</span>
                  <div>
                    <p className="text-xs font-bold" style={{ color: urgentColor }}>{examData.name}</p>
                    <p className="text-[10px] text-muted">
                      {new Date(examData.date + 'T00:00:00').toLocaleDateString('ja-JP', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  {days > 0 ? (
                    <>
                      <p className="text-2xl font-bold" style={{ color: urgentColor }}>{days}</p>
                      <p className="text-[10px] font-medium" style={{ color: urgentColor }}>日後</p>
                    </>
                  ) : days === 0 ? (
                    <p className="text-lg font-bold" style={{ color: urgentColor }}>今日！</p>
                  ) : (
                    <p className="text-sm font-bold text-muted">終了</p>
                  )}
                </div>
              </div>
            </button>
          )
        })() : (
          <button
            onClick={() => {
              setExamFormName('')
              setExamFormDate('')
              setExamFormEmoji('📖')
              setScreen('exam-settings')
            }}
            className="w-full bg-s0 border border-dashed border-br rounded-xl p-3 mb-6 text-center hover:border-ac/40 transition-colors"
          >
            <p className="text-xs text-muted">🎯 試験日を設定してカウントダウン</p>
          </button>
        )}

        {/* 今日の統計 */}
        {dayStats.reviewed > 0 && (
          <div className="bg-s0 border border-br rounded-xl p-4 mb-6">
            <p className="text-xs font-bold text-muted mb-2">今日の学習</p>
            <div className="flex gap-4">
              <div className="text-center flex-1">
                <p className="text-2xl font-bold" style={{ color: MC }}>{dayStats.reviewed}</p>
                <p className="text-[10px] text-muted">枚</p>
              </div>
              <div className="text-center flex-1">
                <p className="text-2xl font-bold" style={{ color: MC }}>
                  {dayStats.reviewed > 0 ? Math.round((dayStats.correct / dayStats.reviewed) * 100) : 0}%
                </p>
                <p className="text-[10px] text-muted">正答率</p>
              </div>
            </div>
          </div>
        )}

        {/* ランキングバナー */}
        <button
          onClick={() => { fetchRanking(); setScreen('ranking') }}
          className="w-full bg-s0 border border-br rounded-xl p-4 mb-6 text-left hover:border-ac/40 transition-all"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🏆</span>
              <div>
                <p className="text-sm font-bold text-tx">ストリークランキング</p>
                <p className="text-[11px] text-muted">全国の学習者と競おう</p>
              </div>
            </div>
            {streak.count > 0 && (
              <span className="text-xs font-bold px-2 py-1 rounded-lg" style={{ background: MCL, color: MC }}>
                🔥 {streak.count}日
              </span>
            )}
          </div>
        </button>

        {/* デッキ一覧 */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-tx mb-3">デッキ</h2>
          <div className="space-y-3">
            {decks.map(deck => {
              const info = getDeckDueInfo(deck)
              return (
                <button
                  key={deck.id}
                  onClick={() => openDeck(deck.id)}
                  className="w-full bg-s0 border border-br rounded-xl p-4 hover:border-ac/40 transition-all text-left"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: MCL }}>
                        {deck.emoji}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-tx">{deck.name}</p>
                        <p className="text-[11px] text-muted">{info.total}枚{!deck.isDefault && ' · 自作'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {info.dueCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                          復習 {info.dueCount}
                        </span>
                      )}
                      {info.newCount > 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200">
                          新規 {info.newCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        {/* 自作デッキ作成 & .apkgインポート */}
        <div className="flex gap-3 mb-4">
          <button
            onClick={() => { setFormName(''); setFormEmoji('📚'); setFormDesc(''); setScreen('create-deck') }}
            className="flex-1 border-2 border-dashed border-br rounded-xl p-4 text-center hover:border-ac/40 transition-colors"
          >
            <span className="text-lg">＋</span>
            <p className="text-xs font-medium text-muted mt-1">自作デッキ</p>
          </button>
          <label
            className="flex-1 border-2 border-dashed border-br rounded-xl p-4 text-center hover:border-ac/40 transition-colors cursor-pointer"
          >
            <input
              type="file"
              accept=".apkg"
              onChange={handleImportApkg}
              className="hidden"
              disabled={importLoading}
            />
            <span className="text-lg">{importLoading ? '⏳' : '📥'}</span>
            <p className="text-xs font-medium text-muted mt-1">
              {importLoading ? '読み込み中...' : '.apkgインポート'}
            </p>
          </label>
        </div>

        {/* インポート結果 */}
        {importResult && (
          <div className="mb-4 p-3 rounded-xl bg-green-50 border border-green-200 text-center">
            <p className="text-sm font-bold text-green-700">✓ インポート完了</p>
            <p className="text-xs text-green-600 mt-1">
              「{importResult.deckName}」{importResult.importedCards}枚
              {importResult.skippedEmpty > 0 && `（${importResult.skippedEmpty}枚スキップ）`}
            </p>
          </div>
        )}

        {/* インポートエラー */}
        {importError && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200">
            <p className="text-xs text-red-600">{importError}</p>
            <button onClick={() => setImportError('')} className="text-[10px] text-red-400 mt-1 underline">閉じる</button>
          </div>
        )}

        {/* FSRS説明 */}
        <div className="bg-s1 rounded-xl p-4 mb-6 text-[11px] text-muted leading-relaxed">
          <p className="font-bold text-tx mb-1">📊 FSRSアルゴリズム搭載</p>
          <p>科学的な復習スケジューリングで効率よく記憶を定着。回答の自信度に応じて次の復習タイミングを最適化します。</p>
        </div>

        <div className="text-center">
          <Link href="/" className="text-xs text-muted hover:text-ac transition-colors">
            ← ホームに戻る
          </Link>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════
  //  ランキング画面
  // ══════════════════════════════════════════
  if (screen === 'ranking') {
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <BackButton onClick={goHome} />
        <div className="flex items-center gap-3 mb-6">
          <span className="text-3xl">🏆</span>
          <div>
            <h2 className="text-lg font-bold text-tx">ストリークランキング</h2>
            <p className="text-[11px] text-muted">連続学習日数の全国ランキング</p>
          </div>
        </div>

        {/* 自分のストリーク */}
        <div className="bg-s0 border border-br rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">🔥</span>
              <div>
                <p className="text-2xl font-bold" style={{ color: MC }}>{streak.count}</p>
                <p className="text-[10px] text-muted">日連続</p>
              </div>
            </div>
            {rankingData?.myRank && (
              <div className="text-right">
                <p className="text-2xl font-bold" style={{ color: MC }}>{rankingData.myRank}位</p>
                <p className="text-[10px] text-muted">全国{rankingData.totalUsers}人中</p>
              </div>
            )}
          </div>
        </div>

        {/* ランキングリスト */}
        {rankingLoading ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted">読み込み中...</p>
          </div>
        ) : rankingData ? (
          <div className="space-y-2">
            {rankingData.leaderboard.map((entry) => {
              const isMe = rankingData.myRank === entry.rank
              const medal = entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : entry.rank === 3 ? '🥉' : ''
              return (
                <div
                  key={entry.rank}
                  className="flex items-center gap-3 p-3 rounded-xl border transition-all"
                  style={{
                    background: isMe ? MCL : 'var(--s0)',
                    borderColor: isMe ? `${MC}40` : 'var(--br)',
                  }}
                >
                  <span className="w-8 text-center text-sm font-bold" style={{ color: isMe ? MC : undefined }}>
                    {medal || `${entry.rank}`}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-tx truncate">
                      {entry.displayName}{isMe && ' (あなた)'}
                    </p>
                  </div>
                  <span className="text-sm font-bold" style={{ color: MC }}>
                    🔥 {entry.count}日
                  </span>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-sm text-muted">ランキングデータを取得できませんでした</p>
          </div>
        )}

        {/* FREE: ブラー + ProGate */}
        {!rankingData?.isPro && rankingData && rankingData.totalUsers > 3 && (
          <div className="relative mt-4">
            {/* ブラーされた追加行 */}
            <div className="space-y-2 select-none" style={{ filter: 'blur(6px)' }}>
              {[4, 5, 6].map(i => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-br bg-s0">
                  <span className="w-8 text-center text-sm font-bold text-muted">{i}</span>
                  <div className="flex-1"><p className="text-sm font-bold text-muted">{'●●●●●●'}</p></div>
                  <span className="text-sm font-bold text-muted">🔥 ??日</span>
                </div>
              ))}
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <button
                onClick={() => setShowProModal(true)}
                className="px-5 py-2.5 bg-ac text-white rounded-xl text-sm font-bold shadow-lg hover:bg-ac/90 transition-colors"
              >
                🔒 PROで全ランキングを見る
              </button>
            </div>
          </div>
        )}

        {showProModal && <ProModal feature="full_access" onClose={() => setShowProModal(false)} />}
      </div>
    )
  }

  // ══════════════════════════════════════════
  //  デッキ詳細画面
  // ══════════════════════════════════════════
  if (screen === 'deck' && activeDeck) {
    const deckTags = getDeckTags(activeDeck.id)
    const deckCards = getDeckCards(activeDeck.id)

    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <BackButton onClick={goHome} />

        {/* デッキヘッダー */}
        <div className="bg-s0 border border-br rounded-xl p-5 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl" style={{ background: MCL }}>
                {activeDeck.emoji}
              </div>
              <div>
                <h2 className="text-lg font-bold text-tx">{activeDeck.name}</h2>
                <p className="text-[11px] text-muted">{activeDeck.description}</p>
              </div>
            </div>
            {!activeDeck.isDefault && (
              <button
                onClick={() => {
                  setFormName(activeDeck.name)
                  setFormEmoji(activeDeck.emoji)
                  setFormDesc(activeDeck.description)
                  setDeleteConfirm(false)
                  setScreen('edit-deck')
                }}
                className="text-xs text-muted hover:text-tx p-1"
                aria-label="デッキ設定を開く"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                </svg>
              </button>
            )}
          </div>

          {/* Due badges */}
          <div className="flex items-center gap-2 mt-4">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-s1 text-muted border border-br">
              全{dueInfo.total}枚
            </span>
            {dueInfo.dueCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-700 border border-emerald-200">
                復習 {dueInfo.dueCount}
              </span>
            )}
            {dueInfo.newCount > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-100 text-blue-700 border border-blue-200">
                新規 {dueInfo.newCount}
              </span>
            )}
          </div>
        </div>

        {/* 学習開始 */}
        {deckCards.length > 0 && (
          <button
            onClick={startSession}
            className="w-full py-3.5 rounded-xl text-sm font-bold text-white mb-6 transition-colors hover:opacity-90 active:scale-[0.98]"
            style={{ background: MC }}
          >
            学習を開始する
          </button>
        )}

        {/* タグフィルタ */}
        {deckTags.length > 1 && (
          <div className="mb-6">
            <p className="text-xs font-bold text-muted mb-2">分野フィルタ</p>
            <div className="flex flex-wrap gap-1.5">
              {deckTags.map(tag => {
                const selected = selectedTags.has(tag)
                return (
                  <button
                    key={tag}
                    onClick={() => toggleTag(tag)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all"
                    style={{
                      background: selected ? MCL : 'transparent',
                      color: selected ? MC : undefined,
                      borderColor: selected ? `${MC}40` : 'var(--br)',
                    }}
                  >
                    {tag}
                  </button>
                )
              })}
              {selectedTags.size > 0 && (
                <button
                  onClick={() => setSelectedTags(new Set())}
                  className="px-2.5 py-1 rounded-lg text-[11px] text-muted hover:text-tx"
                >
                  ✕ リセット
                </button>
              )}
            </div>
          </div>
        )}

        {/* カスタムデッキ: カード管理ボタン */}
        {!activeDeck.isDefault && (
          <div className="space-y-2 mb-6">
            <button
              onClick={() => { setFormFront(''); setFormBack(''); setFormTag(''); setScreen('add-card') }}
              className="w-full py-2.5 rounded-xl text-xs font-medium border border-br bg-s0 hover:border-ac/40 transition-colors"
            >
              ＋ カードを追加
            </button>
            {deckCards.length > 0 && (
              <button
                onClick={() => setScreen('card-list')}
                className="w-full py-2.5 rounded-xl text-xs font-medium border border-br bg-s0 hover:border-ac/40 transition-colors"
              >
                カード一覧を見る（{deckCards.length}枚）
              </button>
            )}
          </div>
        )}

        {/* デフォルトデッキのカード一覧ボタン */}
        {activeDeck.isDefault && deckCards.length > 0 && (
          <button
            onClick={() => setScreen('card-list')}
            className="w-full py-2.5 rounded-xl text-xs font-medium border border-br bg-s0 hover:border-ac/40 transition-colors mb-6"
          >
            カード一覧を見る（{deckCards.length}枚）
          </button>
        )}

        {/* 空のデッキ */}
        {deckCards.length === 0 && (
          <div className="text-center py-8">
            <p className="text-3xl mb-2">📭</p>
            <p className="text-sm text-muted">カードがまだありません</p>
            {!activeDeck.isDefault && (
              <p className="text-[11px] text-muted mt-1">「カードを追加」からカードを作成しましょう</p>
            )}
          </div>
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════
  //  デッキ作成 / 編集画面
  // ══════════════════════════════════════════
  if (screen === 'create-deck' || screen === 'edit-deck') {
    const isEdit = screen === 'edit-deck'
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <BackButton onClick={() => isEdit ? setScreen('deck') : goHome()} />

        <h2 className="text-lg font-bold text-tx mb-6">{isEdit ? 'デッキを編集' : '新しいデッキ'}</h2>

        {/* Emoji picker */}
        <div className="mb-4">
          <label className="text-xs font-bold text-muted block mb-2">アイコン</label>
          <div className="flex flex-wrap gap-2">
            {EMOJI_OPTIONS.map(e => (
              <button
                key={e}
                onClick={() => setFormEmoji(e)}
                className="w-10 h-10 rounded-lg text-lg flex items-center justify-center border-2 transition-all"
                style={{
                  borderColor: formEmoji === e ? MC : 'var(--br)',
                  background: formEmoji === e ? MCL : 'var(--s0)',
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Name */}
        <div className="mb-4">
          <label className="text-xs font-bold text-muted block mb-1">デッキ名</label>
          <input
            type="text"
            value={formName}
            onChange={e => setFormName(e.target.value)}
            placeholder="例: 循環器ノート"
            maxLength={30}
            className="w-full px-3 py-2.5 rounded-xl border border-br bg-s0 text-sm text-tx placeholder:text-muted/50 focus:outline-none focus:border-ac/50"
          />
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="text-xs font-bold text-muted block mb-1">説明（任意）</label>
          <input
            type="text"
            value={formDesc}
            onChange={e => setFormDesc(e.target.value)}
            placeholder="例: 循環器内科ローテで覚えたいこと"
            maxLength={60}
            className="w-full px-3 py-2.5 rounded-xl border border-br bg-s0 text-sm text-tx placeholder:text-muted/50 focus:outline-none focus:border-ac/50"
          />
        </div>

        <button
          onClick={isEdit ? handleUpdateDeck : handleCreateDeck}
          disabled={!formName.trim()}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40"
          style={{ background: MC }}
        >
          {isEdit ? '保存する' : 'デッキを作成'}
        </button>

        {/* 削除ボタン（編集時のみ） */}
        {isEdit && (
          <div className="mt-8 pt-6 border-t border-br">
            {!deleteConfirm ? (
              <button
                onClick={() => setDeleteConfirm(true)}
                className="w-full py-2.5 rounded-xl text-xs font-medium text-red-600 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
              >
                デッキを削除
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-red-600 text-center">デッキと全カードが削除されます。この操作は取り消せません。</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setDeleteConfirm(false)}
                    className="flex-1 py-2.5 rounded-xl text-xs font-medium border border-br bg-s0 text-muted"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={handleDeleteDeck}
                    className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white bg-red-600"
                  >
                    削除する
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════
  //  カード追加 / 編集画面
  // ══════════════════════════════════════════
  if ((screen === 'add-card' || screen === 'edit-card') && activeDeck) {
    const isEdit = screen === 'edit-card'
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <BackButton onClick={() => setScreen(isEdit ? 'card-list' : 'deck')} />

        <h2 className="text-lg font-bold text-tx mb-6">{isEdit ? 'カードを編集' : 'カードを追加'}</h2>

        <div className="mb-4">
          <label className="text-xs font-bold text-muted block mb-1">表面（問題）</label>
          <textarea
            value={formFront}
            onChange={e => setFormFront(e.target.value)}
            placeholder="問題を入力..."
            rows={3}
            className="w-full px-3 py-2.5 rounded-xl border border-br bg-s0 text-sm text-tx placeholder:text-muted/50 focus:outline-none focus:border-ac/50 resize-none"
          />
        </div>

        <div className="mb-4">
          <label className="text-xs font-bold text-muted block mb-1">裏面（回答）</label>
          <textarea
            value={formBack}
            onChange={e => setFormBack(e.target.value)}
            placeholder="回答を入力..."
            rows={4}
            className="w-full px-3 py-2.5 rounded-xl border border-br bg-s0 text-sm text-tx placeholder:text-muted/50 focus:outline-none focus:border-ac/50 resize-none"
          />
        </div>

        <div className="mb-6">
          <label className="text-xs font-bold text-muted block mb-1">タグ（任意）</label>
          <input
            type="text"
            value={formTag}
            onChange={e => setFormTag(e.target.value)}
            placeholder="例: 循環器"
            maxLength={20}
            className="w-full px-3 py-2.5 rounded-xl border border-br bg-s0 text-sm text-tx placeholder:text-muted/50 focus:outline-none focus:border-ac/50"
          />
        </div>

        <button
          onClick={isEdit ? handleUpdateCard : handleAddCard}
          disabled={!formFront.trim() || !formBack.trim()}
          className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-40"
          style={{ background: MC }}
        >
          {isEdit ? '保存する' : 'カードを追加'}
        </button>

        {/* 連続追加ボタン */}
        {!isEdit && (
          <button
            onClick={() => {
              if (!activeDeckId || !formFront.trim() || !formBack.trim()) return
              addCardToDeck(activeDeckId, formFront.trim(), formBack.trim(), formTag.trim())
              setDecks(loadAllDecks())
              setFormFront(''); setFormBack('')
            }}
            disabled={!formFront.trim() || !formBack.trim()}
            className="w-full py-2.5 rounded-xl text-xs font-medium border border-br bg-s0 text-muted mt-2 transition-colors disabled:opacity-40 hover:border-ac/30"
          >
            追加して次のカードへ
          </button>
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════
  //  カード一覧画面
  // ══════════════════════════════════════════
  if (screen === 'card-list' && activeDeck) {
    const deckCards = getDeckCards(activeDeck.id)
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <BackButton onClick={() => setScreen('deck')} />

        <h2 className="text-lg font-bold text-tx mb-1">カード一覧</h2>
        <p className="text-[11px] text-muted mb-4">{activeDeck.name} — {deckCards.length}枚</p>

        <div className="space-y-2">
          {deckCards.map(card => (
            <div key={card.id} className="bg-s0 border border-br rounded-xl p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-tx truncate">{card.front}</p>
                  <p className="text-[11px] text-muted mt-0.5 line-clamp-2">{card.back}</p>
                  {card.tag && (
                    <span className="inline-block text-[9px] font-medium px-1.5 py-0.5 rounded mt-1" style={{ background: MCL, color: MC }}>
                      {card.tag}
                    </span>
                  )}
                </div>
                {!activeDeck.isDefault && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingCardId(card.id)
                        setFormFront(card.front)
                        setFormBack(card.back)
                        setFormTag(card.tag)
                        setScreen('edit-card')
                      }}
                      className="p-1.5 rounded-lg text-muted hover:text-tx hover:bg-s1 transition-colors"
                      aria-label="カードを編集"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                      aria-label="カードを削除"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {deckCards.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-muted">カードがありません</p>
          </div>
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════
  //  学習画面
  // ══════════════════════════════════════════
  if (screen === 'study' && currentCard) {
    const progress = ((currentIdx) / studyQueue.length) * 100

    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setScreen('deck')} className="text-xs text-muted hover:text-tx transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </button>
          <span className="text-xs font-medium text-muted">{currentIdx + 1} / {studyQueue.length}</span>
          {currentCard.tag && (
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: MCL, color: MC }}>
              {currentCard.tag}
            </span>
          )}
        </div>

        {/* プログレスバー */}
        <div className="w-full h-1.5 bg-s1 rounded-full mb-6 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{ width: `${progress}%`, background: MC }}
          />
        </div>

        {/* カード */}
        <div
          className="perspective-1000 mb-6 cursor-pointer select-none"
          onClick={() => setFlipped(!flipped)}
          style={{ perspective: '1000px' }}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); setFlipped(!flipped) } }}
          aria-label={flipped ? '回答を表示中（タップで問題面に戻る）' : '問題カード（タップで回答を表示）'}
          aria-pressed={flipped}
        >
          <div
            className="relative w-full transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: flipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
              minHeight: '280px',
            }}
          >
            {/* 表面 */}
            <div
              className="absolute inset-0 bg-s0 border border-br rounded-2xl p-6 flex flex-col justify-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <div className="text-center">
                <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-4" style={{ background: MCL, color: MC }}>
                  Question
                </span>
                <p className="text-base font-bold text-tx leading-relaxed">
                  {currentCard.front}
                </p>
                <p className="text-xs text-muted mt-6">タップで回答を表示</p>
              </div>
            </div>

            {/* 裏面 */}
            <div
              className="absolute inset-0 bg-s0 border-2 rounded-2xl p-6 flex flex-col justify-center overflow-y-auto"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                borderColor: `${MC}40`,
              }}
            >
              <div>
                <span className="inline-block text-[10px] font-medium px-2 py-0.5 rounded-full mb-3" style={{ background: MC, color: '#fff' }}>
                  Answer
                </span>
                <div className="text-sm text-tx leading-relaxed whitespace-pre-line">
                  {currentCard.back}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* FSRS 4択 */}
        {flipped && (
          <div className="grid grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {RATING_BUTTONS.map((btn, i) => {
              const preview = intervalPreviews[i]
              return (
                <button
                  key={btn.rating}
                  onClick={() => answer(btn.rating)}
                  className="py-3 rounded-xl text-center border-2 transition-all hover:opacity-90 active:scale-95"
                  style={{
                    color: btn.color,
                    background: btn.bgColor,
                    borderColor: btn.borderColor,
                  }}
                >
                  <span className="text-[10px] font-bold block">{preview?.label || ''}</span>
                  <span className="text-xs font-bold block mt-0.5">{btn.label}</span>
                </button>
              )
            })}
          </div>
        )}

        {!flipped && (
          <div className="text-center">
            <p className="text-[11px] text-muted">カードをタップして裏面を確認してください</p>
          </div>
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════
  //  試験カウントダウン設定画面
  // ══════════════════════════════════════════
  if (screen === 'exam-settings') {
    const canSave = examFormName.trim() && examFormDate
    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        <BackButton onClick={goHome} />

        <h2 className="text-lg font-bold text-tx mb-1">試験カウントダウン</h2>
        <p className="text-xs text-muted mb-6">試験日を設定すると、Study画面に残り日数が表示されます</p>

        {/* プリセット選択 */}
        <div className="mb-6">
          <p className="text-xs font-bold text-muted mb-2">試験を選択</p>
          <div className="flex flex-wrap gap-2">
            {EXAM_PRESETS.map(preset => {
              const selected = examFormName === preset.name
              return (
                <button
                  key={preset.name}
                  onClick={() => { setExamFormName(preset.name); setExamFormEmoji(preset.emoji) }}
                  className="px-3 py-2 rounded-lg text-xs font-medium border transition-all"
                  style={{
                    background: selected ? MCL : 'var(--s0)',
                    borderColor: selected ? MC : 'var(--br)',
                    color: selected ? MC : 'var(--tx)',
                  }}
                >
                  {preset.emoji} {preset.name}
                </button>
              )
            })}
            <button
              onClick={() => { setExamFormName(''); setExamFormEmoji('🎯') }}
              className="px-3 py-2 rounded-lg text-xs font-medium border transition-all"
              style={{
                background: !EXAM_PRESETS.some(p => p.name === examFormName) && examFormName !== '' ? MCL : 'var(--s0)',
                borderColor: !EXAM_PRESETS.some(p => p.name === examFormName) && examFormName !== '' ? MC : 'var(--br)',
                color: !EXAM_PRESETS.some(p => p.name === examFormName) && examFormName !== '' ? MC : 'var(--m)',
              }}
            >
              ✏️ カスタム
            </button>
          </div>
        </div>

        {/* カスタム試験名 */}
        {!EXAM_PRESETS.some(p => p.name === examFormName) && (
          <div className="mb-6">
            <label className="text-xs font-bold text-muted block mb-2">試験名</label>
            <input
              type="text"
              value={examFormName}
              onChange={e => setExamFormName(e.target.value)}
              placeholder="例: TOEFL, USMLE Step1..."
              className="w-full bg-s0 border border-br rounded-xl px-4 py-3 text-sm text-tx placeholder:text-muted/50 focus:outline-none focus:border-ac/50 transition-colors"
              style={{ fontSize: '16px' }}
            />
          </div>
        )}

        {/* 試験日 */}
        <div className="mb-8">
          <label className="text-xs font-bold text-muted block mb-2">試験日</label>
          <input
            type="date"
            value={examFormDate}
            onChange={e => setExamFormDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full bg-s0 border border-br rounded-xl px-4 py-3 text-sm text-tx focus:outline-none focus:border-ac/50 transition-colors"
            style={{ fontSize: '16px' }}
          />
          {examFormDate && (() => {
            const days = getDaysUntil(examFormDate)
            return days > 0 ? (
              <p className="text-xs text-muted mt-2 text-center">あと <span className="font-bold" style={{ color: MC }}>{days}</span> 日</p>
            ) : null
          })()}
        </div>

        {/* 保存ボタン */}
        <button
          onClick={() => {
            if (!canSave) return
            const data: ExamData = { name: examFormName.trim(), date: examFormDate, emoji: examFormEmoji }
            saveExam(data)
            setExamData(data)
            goHome()
          }}
          disabled={!canSave}
          className="w-full py-3.5 rounded-xl text-sm font-bold text-white mb-3 transition-colors disabled:opacity-40"
          style={{ background: MC }}
        >
          保存する
        </button>

        {/* 削除ボタン（既存データがある場合のみ） */}
        {examData && (
          <button
            onClick={() => {
              deleteExam()
              setExamData(null)
              goHome()
            }}
            className="w-full py-3 rounded-xl text-sm font-medium border border-br text-muted hover:text-dn hover:border-dn/30 transition-colors"
          >
            カウントダウンを削除
          </button>
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════
  //  結果画面（Peak-End）
  // ══════════════════════════════════════════
  const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0
  const isNewBest = streak.count === streak.best && streak.count > 1
  const streakMilestone = [3, 7, 14, 30, 50, 100].includes(streak.count)

  // メッセージ選択（ストリーク × 正答率）
  const getMessage = () => {
    if (streakMilestone) return `${streak.count}日連続達成！`
    if (isNewBest) return '自己ベスト更新！'
    if (accuracy >= 90) return 'パーフェクト！'
    if (accuracy >= 80) return '素晴らしい！'
    if (accuracy >= 60) return 'いい調子！'
    return 'コツコツが大事！'
  }
  const getEmoji = () => {
    if (streakMilestone || isNewBest) return '🏆'
    if (accuracy >= 90) return '🎉'
    if (accuracy >= 80) return '✨'
    if (accuracy >= 60) return '👍'
    return '💪'
  }

  return (
    <div className="px-4 py-8 max-w-lg mx-auto">
      {/* メインカード */}
      <div className="bg-s0 border border-br rounded-2xl p-8 text-center relative overflow-hidden">
        {/* 祝福アニメーション（高スコアまたはマイルストーン時） */}
        {(accuracy >= 80 || streakMilestone) && (
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 rounded-full opacity-0"
                style={{
                  left: `${10 + (i * 7.5)}%`,
                  top: '-8px',
                  background: ['#1B4F3A', '#2D6A4F', '#059669', '#FCD34D', '#F59E0B', '#2563EB'][i % 6],
                  animation: `confetti-fall ${1.5 + (i % 3) * 0.5}s ease-in ${i * 0.1}s forwards`,
                }}
              />
            ))}
          </div>
        )}

        <div className="text-5xl mb-3">{getEmoji()}</div>
        <h2 className="text-xl font-bold text-tx mb-1">{getMessage()}</h2>
        <p className="text-sm text-muted mb-6">セッション完了</p>

        {/* ストリーク（メイン指標） */}
        <div
          className="mx-auto mb-6 rounded-2xl p-5 border"
          style={{
            background: streak.count >= 3 ? MCL : 'var(--bg)',
            borderColor: streak.count >= 3 ? 'rgba(27,79,58,0.2)' : 'var(--br)',
          }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <span className="text-2xl">🔥</span>
            <span className="text-3xl font-bold" style={{ color: MC }}>{streak.count}</span>
            <span className="text-sm font-medium text-muted">日連続</span>
          </div>
          {isNewBest && (
            <p className="text-[11px] font-bold" style={{ color: MC }}>
              🏅 自己ベスト！
            </p>
          )}
          {streak.best > streak.count && (
            <p className="text-[10px] text-muted">
              ベスト: {streak.best}日
            </p>
          )}
        </div>

        {/* 試験カウントダウン（結果画面） */}
        {examData && (() => {
          const days = getDaysUntil(examData.date)
          if (days < 0) return null
          const urgentColor = days <= 7 ? '#991B1B' : days <= 30 ? '#92400E' : MC
          const urgentBg = days <= 7 ? '#FEE2E2' : days <= 30 ? '#FEF3C7' : MCL
          const urgentBorder = days <= 7 ? '#FCA5A5' : days <= 30 ? '#FCD34D' : 'rgba(27,79,58,0.2)'
          return (
            <div className="mb-6 rounded-xl p-3 border text-center" style={{ background: urgentBg, borderColor: urgentBorder }}>
              <div className="flex items-center justify-center gap-2">
                <span className="text-base">{examData.emoji}</span>
                <span className="text-xs font-bold" style={{ color: urgentColor }}>{examData.name}まで</span>
                <span className="text-lg font-bold" style={{ color: urgentColor }}>
                  {days === 0 ? '今日！' : `あと${days}日`}
                </span>
              </div>
            </div>
          )
        })()}

        {/* セッション統計 */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="bg-bg rounded-xl p-3">
            <p className="text-2xl font-bold" style={{ color: MC }}>{sessionTotal}</p>
            <p className="text-[10px] text-muted">学習枚数</p>
          </div>
          <div className="bg-bg rounded-xl p-3">
            <p className="text-2xl font-bold" style={{ color: accuracy >= 80 ? '#059669' : accuracy >= 60 ? '#D97706' : '#DC2626' }}>
              {accuracy}%
            </p>
            <p className="text-[10px] text-muted">正答率</p>
          </div>
          <div className="bg-bg rounded-xl p-3">
            <p className="text-2xl font-bold" style={{ color: MC }}>{sessionCorrect}</p>
            <p className="text-[10px] text-muted">正解数</p>
          </div>
        </div>

        {/* SNSシェア */}
        {(() => {
          const shareText = `${getEmoji()} ${getMessage()}\n🔥 ${streak.count}日連続 | 📊 正答率${accuracy}% | 📚 ${sessionTotal}枚\niwor Studyで医学を学ぼう`
          const shareUrl = 'https://iwor.jp/study'
          const encodedText = encodeURIComponent(shareText)
          const encodedUrl = encodeURIComponent(shareUrl)
          return (
            <div className="mb-6">
              <p className="text-[10px] text-muted mb-2">結果をシェア</p>
              <div className="flex justify-center gap-2">
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-br text-muted hover:bg-tx/5 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  <span className="text-xs">X</span>
                </a>
                <a
                  href={`https://social-plugins.line.me/lineit/share?url=${encodedUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-br text-muted hover:bg-[#06C755]/10 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" /></svg>
                  <span className="text-xs">LINE</span>
                </a>
                <button
                  onClick={async (e) => {
                    try {
                      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`)
                      const span = (e.currentTarget as HTMLElement).querySelector('span')
                      if (span) { span.textContent = 'OK!'; setTimeout(() => { span.textContent = 'コピー' }, 2000) }
                    } catch {}
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-br text-muted hover:bg-s1 transition-colors"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
                  <span className="text-xs">コピー</span>
                </button>
              </div>
            </div>
          )
        })()}

        {/* ボタン */}
        <div className="space-y-3">
          <button
            onClick={startSession}
            className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors hover:opacity-90"
            style={{ background: MC }}
          >
            もう一度
          </button>
          <button
            onClick={() => setScreen('deck')}
            className="w-full py-3 rounded-xl text-sm font-medium text-muted border border-br hover:border-ac/30 transition-colors"
          >
            デッキに戻る
          </button>
        </div>
      </div>

      {/* 今日の累計 */}
      <div className="mt-6 bg-s0 border border-br rounded-xl p-4">
        <p className="text-xs font-bold text-muted mb-2">今日の累計</p>
        <div className="flex gap-4">
          <div className="text-center flex-1">
            <p className="text-lg font-bold" style={{ color: MC }}>{dayStats.reviewed}</p>
            <p className="text-[10px] text-muted">枚</p>
          </div>
          <div className="text-center flex-1">
            <p className="text-lg font-bold" style={{ color: MC }}>
              {dayStats.reviewed > 0 ? Math.round((dayStats.correct / dayStats.reviewed) * 100) : 0}%
            </p>
            <p className="text-[10px] text-muted">正答率</p>
          </div>
        </div>
      </div>

      {/* 7日達成PROモーダル */}
      {showProModal && <ProModal feature="full_access" onClose={() => setShowProModal(false)} />}

      {/* confetti animation */}
      <style jsx>{`
        @keyframes confetti-fall {
          0% { opacity: 1; transform: translateY(0) rotate(0deg) scale(1); }
          100% { opacity: 0; transform: translateY(300px) rotate(720deg) scale(0.3); }
        }
      `}</style>
    </div>
  )
}
