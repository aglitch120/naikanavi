'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { CBT_CARDS, TAGS, FlashCard } from './cbt-cards'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

// ── シャッフル ──
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

// ── セッション統計（localStorage） ──
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

// ── メインコンポーネント ──
type Screen = 'home' | 'study' | 'result'

export default function StudyApp() {
  const [screen, setScreen] = useState<Screen>('home')
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set())
  const [cards, setCards] = useState<FlashCard[]>([])
  const [currentIdx, setCurrentIdx] = useState(0)
  const [flipped, setFlipped] = useState(false)
  const [sessionCorrect, setSessionCorrect] = useState(0)
  const [sessionTotal, setSessionTotal] = useState(0)
  const [dayStats, setDayStats] = useState<DayStats>({ date: '', reviewed: 0, correct: 0 })

  useEffect(() => {
    setDayStats(getTodayStats())
  }, [])

  // ── デッキ開始 ──
  const startSession = useCallback(() => {
    const pool = selectedTags.size === 0
      ? CBT_CARDS
      : CBT_CARDS.filter(c => selectedTags.has(c.tag))
    setCards(shuffle(pool))
    setCurrentIdx(0)
    setFlipped(false)
    setSessionCorrect(0)
    setSessionTotal(0)
    setScreen('study')
  }, [selectedTags])

  // ── 回答 ──
  const answer = useCallback((correct: boolean) => {
    const newTotal = sessionTotal + 1
    const newCorrect = sessionCorrect + (correct ? 1 : 0)
    setSessionTotal(newTotal)
    setSessionCorrect(newCorrect)

    // 統計更新
    const stats = getTodayStats()
    stats.reviewed++
    if (correct) stats.correct++
    saveTodayStats(stats)
    setDayStats({ ...stats })

    // 次のカード or 結果
    if (currentIdx + 1 >= cards.length) {
      setScreen('result')
    } else {
      setCurrentIdx(currentIdx + 1)
      setFlipped(false)
    }
  }, [sessionTotal, sessionCorrect, currentIdx, cards])

  // ── タグトグル ──
  const toggleTag = useCallback((tag: string) => {
    setSelectedTags(prev => {
      const n = new Set(prev)
      n.has(tag) ? n.delete(tag) : n.add(tag)
      return n
    })
  }, [])

  const filteredCount = useMemo(() => {
    return selectedTags.size === 0
      ? CBT_CARDS.length
      : CBT_CARDS.filter(c => selectedTags.has(c.tag)).length
  }, [selectedTags])

  // ──────── ホーム画面 ────────
  if (screen === 'home') {
    return (
      <div className="px-4 py-8 max-w-lg mx-auto">
        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl" style={{ background: MCL }}>
              📚
            </div>
            <div>
              <h1 className="text-xl font-bold text-tx">iwor Study</h1>
              <p className="text-xs text-muted">医学フラッシュカード</p>
            </div>
          </div>
          <p className="text-sm text-muted">
            カードをめくって知識を定着。タップで裏面を表示し、理解度を自己評価。
          </p>
        </div>

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

        {/* デッキ */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-tx mb-3">デッキ</h2>
          <button
            onClick={startSession}
            className="w-full bg-s0 border border-br rounded-xl p-4 hover:border-ac/40 transition-all text-left"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ background: MCL }}>
                  🧠
                </div>
                <div>
                  <p className="text-sm font-bold text-tx">CBT基礎</p>
                  <p className="text-[11px] text-muted">{filteredCount}枚 — 医学部4年CBT対策</p>
                </div>
              </div>
              <svg className="w-5 h-5 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </button>
        </div>

        {/* タグフィルタ */}
        <div className="mb-8">
          <h2 className="text-sm font-bold text-tx mb-3">分野で絞り込み</h2>
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  selectedTags.has(tag)
                    ? 'text-white border-transparent'
                    : 'border-br text-muted hover:border-ac/30'
                }`}
                style={selectedTags.has(tag) ? { background: MC } : undefined}
              >
                {tag}
              </button>
            ))}
            {selectedTags.size > 0 && (
              <button
                onClick={() => setSelectedTags(new Set())}
                className="px-3 py-1.5 rounded-lg text-xs text-muted hover:text-tx transition-colors"
              >
                ✕ リセット
              </button>
            )}
          </div>
        </div>

        {/* 将来のデッキ（プレースホルダー） */}
        <div className="space-y-3 mb-8">
          {['国試必修', '内科基礎'].map(name => (
            <div key={name} className="bg-s0 border border-br rounded-xl p-4 opacity-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg bg-s1">🔒</div>
                <div>
                  <p className="text-sm font-bold text-tx">{name}</p>
                  <p className="text-[11px] text-muted">準備中</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* フッターリンク */}
        <div className="text-center">
          <Link href="/" className="text-xs text-muted hover:text-ac transition-colors">
            ← ホームに戻る
          </Link>
        </div>
      </div>
    )
  }

  // ──────── 学習画面 ────────
  if (screen === 'study') {
    const card = cards[currentIdx]
    const progress = ((currentIdx) / cards.length) * 100

    return (
      <div className="px-4 py-6 max-w-lg mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setScreen('home')} className="text-xs text-muted hover:text-tx transition-colors flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            戻る
          </button>
          <span className="text-xs font-medium text-muted">{currentIdx + 1} / {cards.length}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: MCL, color: MC }}>
            {card.tag}
          </span>
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
                  {card.front}
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
                  {card.back}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 回答ボタン */}
        {flipped && (
          <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <button
              onClick={() => answer(false)}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold border-2 border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
            >
              ✕ 不正解
            </button>
            <button
              onClick={() => answer(true)}
              className="flex-1 py-3.5 rounded-xl text-sm font-bold text-white transition-colors hover:opacity-90"
              style={{ background: MC }}
            >
              ○ 正解
            </button>
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

  // ──────── 結果画面 ────────
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
            onClick={() => setScreen('home')}
            className="w-full py-3 rounded-xl text-sm font-medium text-muted border border-br hover:border-ac/30 transition-colors"
          >
            ホームに戻る
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
