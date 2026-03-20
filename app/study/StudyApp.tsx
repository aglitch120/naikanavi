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
} from './decks'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

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

// ── 画面定義 ──
type Screen = 'home' | 'deck' | 'study' | 'result' | 'create-deck' | 'edit-deck' | 'add-card' | 'edit-card' | 'card-list'

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

  // ── Init ──
  useEffect(() => {
    setDayStats(getTodayStats())
    setCardDataMap(loadAllCardData())
    setDecks(loadAllDecks())
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

        {/* 自作デッキ作成 */}
        <button
          onClick={() => { setFormName(''); setFormEmoji('📚'); setFormDesc(''); setScreen('create-deck') }}
          className="w-full border-2 border-dashed border-br rounded-xl p-4 text-center hover:border-ac/40 transition-colors mb-8"
        >
          <span className="text-lg">＋</span>
          <p className="text-xs font-medium text-muted mt-1">自作デッキを作成</p>
        </button>

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
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDeleteCard(card.id)}
                      className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
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
  //  結果画面
  // ══════════════════════════════════════════
  const accuracy = sessionTotal > 0 ? Math.round((sessionCorrect / sessionTotal) * 100) : 0
  const emoji = accuracy >= 80 ? '🎉' : accuracy >= 60 ? '👍' : '💪'
  const message = accuracy >= 80 ? '素晴らしい！' : accuracy >= 60 ? 'いい調子！' : 'もう一周しよう！'

  return (
    <div className="px-4 py-8 max-w-lg mx-auto">
      <div className="bg-s0 border border-br rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">{emoji}</div>
        <h2 className="text-xl font-bold text-tx mb-1">{message}</h2>
        <p className="text-sm text-muted mb-6">セッション完了</p>

        <div className="flex gap-4 justify-center mb-8">
          <div className="bg-bg rounded-xl p-4 flex-1">
            <p className="text-2xl font-bold" style={{ color: MC }}>{sessionTotal}</p>
            <p className="text-[10px] text-muted">学習枚数</p>
          </div>
          <div className="bg-bg rounded-xl p-4 flex-1">
            <p className="text-2xl font-bold" style={{ color: MC }}>{accuracy}%</p>
            <p className="text-[10px] text-muted">正答率</p>
          </div>
          <div className="bg-bg rounded-xl p-4 flex-1">
            <p className="text-2xl font-bold" style={{ color: MC }}>{sessionCorrect}</p>
            <p className="text-[10px] text-muted">正解数</p>
          </div>
        </div>

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
    </div>
  )
}
