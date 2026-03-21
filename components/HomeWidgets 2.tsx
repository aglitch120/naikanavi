'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

interface StudyStats { date: string; reviewed: number; correct: number }
interface StreakData { lastDate: string; count: number; best: number }

export default function HomeWidgets() {
  const [study, setStudy] = useState<{ stats: StudyStats | null; streak: StreakData | null; dueEstimate: number }>({
    stats: null, streak: null, dueEstimate: 0,
  })
  const [josler, setJosler] = useState<{ totalCases: number; totalSummaries: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const today = new Date().toISOString().split('T')[0]

    // Study stats
    try {
      const statsRaw = localStorage.getItem('iwor_study_stats')
      const streakRaw = localStorage.getItem('iwor_study_streak')
      const fsrsRaw = localStorage.getItem('iwor_study_fsrs')

      const stats = statsRaw ? JSON.parse(statsRaw) as StudyStats : null
      const streak = streakRaw ? JSON.parse(streakRaw) as StreakData : null

      // Estimate due cards from FSRS data
      let dueEstimate = 0
      if (fsrsRaw) {
        const cards: { scheduledDays: number; lastReview: string; state: string }[] = JSON.parse(fsrsRaw)
        const now = Date.now()
        dueEstimate = cards.filter(c => {
          if (c.state === 'new') return true
          if (!c.lastReview) return true
          if (c.state === 'learning' || c.state === 'relearning') return true
          const elapsed = (now - new Date(c.lastReview).getTime()) / (1000 * 60 * 60 * 24)
          return elapsed >= c.scheduledDays
        }).length
      }

      if (stats || streak || dueEstimate > 0) {
        setStudy({
          stats: stats?.date === today ? stats : null,
          streak,
          dueEstimate,
        })
      }
    } catch { /* ignore */ }

    // J-OSLER data
    try {
      const raw = localStorage.getItem('iwor_dashboard_data')
      if (raw) {
        const data = JSON.parse(raw)
        if (data.patients) {
          setJosler({
            totalCases: data.patients?.length || 0,
            totalSummaries: 0, // summaries are in josler-specific storage
          })
        }
      }
    } catch { /* ignore */ }
  }, [])

  if (!mounted) return null

  const hasStudy = study.stats || study.streak || study.dueEstimate > 0
  const hasJosler = josler && josler.totalCases > 0
  if (!hasStudy && !hasJosler) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {/* Study Widget */}
      {hasStudy && (
        <Link href="/study" className="bg-s0 border border-br rounded-xl p-4 hover:border-ac/30 transition-all group block">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-tx group-hover:text-ac transition-colors flex items-center gap-1.5">
              <span className="text-base">📖</span>
              Study
            </p>
            {study.streak && study.streak.count > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: MCL, color: MC }}>
                🔥 {study.streak.count}日連続
              </span>
            )}
          </div>

          {/* Due cards */}
          {study.dueEstimate > 0 ? (
            <div className="mb-2">
              <div className="flex items-center justify-between mb-1">
                <p className="text-[11px] text-muted">復習待ち</p>
                <p className="text-sm font-bold" style={{ color: MC }}>{study.dueEstimate}枚</p>
              </div>
              <div className="w-full h-1.5 bg-s1 rounded-full overflow-hidden">
                <div className="h-full rounded-full transition-all" style={{
                  width: `${Math.min(100, study.stats ? (study.stats.reviewed / (study.stats.reviewed + study.dueEstimate)) * 100 : 0)}%`,
                  background: MC,
                }} />
              </div>
            </div>
          ) : (
            <p className="text-[11px] text-muted mb-2">今日の復習は完了しました 🎉</p>
          )}

          {/* Today's progress */}
          {study.stats && study.stats.reviewed > 0 && (
            <div className="flex items-center gap-3 text-[10px] text-muted">
              <span>今日: {study.stats.reviewed}枚復習</span>
              {study.stats.correct > 0 && (
                <span>正答率 {Math.round((study.stats.correct / study.stats.reviewed) * 100)}%</span>
              )}
            </div>
          )}
        </Link>
      )}

      {/* J-OSLER Widget */}
      {hasJosler && josler && (
        <Link href="/josler" className="bg-s0 border border-br rounded-xl p-4 hover:border-ac/30 transition-all group block">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-bold text-tx group-hover:text-ac transition-colors flex items-center gap-1.5">
              <span className="text-base">📊</span>
              研修記録
            </p>
          </div>
          <div className="mb-2">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[11px] text-muted">登録症例</p>
              <p className="text-sm font-bold" style={{ color: MC }}>{josler.totalCases}件</p>
            </div>
            {/* Goal gradient: 160 symptoms target */}
            <div className="w-full h-1.5 bg-s1 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{
                width: `${Math.min(100, (josler.totalCases / 160) * 100)}%`,
                background: MC,
              }} />
            </div>
            <p className="text-[10px] text-muted mt-1">目標: 160症例</p>
          </div>
        </Link>
      )}
    </div>
  )
}
