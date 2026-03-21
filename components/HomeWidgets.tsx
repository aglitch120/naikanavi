'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

/* ═══════════════════════════════════
   Storage keys (duplicated intentionally — 
   HomeWidgets reads but never writes)
═══════════════════════════════════ */
const FSRS_KEY = 'iwor_study_fsrs'
const CUSTOM_DECKS_KEY = 'iwor_study_custom_decks'
const STREAK_KEY = 'iwor_study_streak'
const JOSLER_KEY = 'iwor_josler_data'

/* ═══════════════════════════════════
   Types
═══════════════════════════════════ */
interface WidgetData {
  // Study
  studyDue: number
  studyNew: number
  studyStreak: number
  studyTotal: number
  studyReviewed: number  // cards that have been reviewed at least once
  // J-OSLER
  joslerCases: number
  joslerGroups: number
  joslerSummaries: number
  hasJosler: boolean
  hasStudy: boolean
}

/* ═══════════════════════════════════
   Data loaders (read-only, no side effects)
═══════════════════════════════════ */
function loadWidgetData(): WidgetData {
  const result: WidgetData = {
    studyDue: 0, studyNew: 0, studyStreak: 0, studyTotal: 0, studyReviewed: 0,
    joslerCases: 0, joslerGroups: 0, joslerSummaries: 0,
    hasJosler: false, hasStudy: false,
  }

  try {
    // ── Study: FSRS card data ──
    const fsrsRaw = localStorage.getItem(FSRS_KEY)
    if (fsrsRaw) {
      const arr: [string, any][] = JSON.parse(fsrsRaw)
      const now = new Date()
      let due = 0, newC = 0, reviewed = 0

      for (const [, data] of arr) {
        if (!data || data.state === 'new') { newC++; continue }
        reviewed++
        if (data.state === 'learning' || data.state === 'relearning') { due++; continue }
        if (data.lastReview) {
          const elapsed = (now.getTime() - new Date(data.lastReview).getTime()) / (1000 * 60 * 60 * 24)
          if (elapsed >= data.scheduledDays) due++
        }
      }
      result.studyDue = due
      result.studyNew = newC
      result.studyReviewed = reviewed
      result.studyTotal = arr.length
      result.hasStudy = arr.length > 0
    }

    // ── Study: check custom decks exist (even if no FSRS data yet) ──
    if (!result.hasStudy) {
      const customRaw = localStorage.getItem(CUSTOM_DECKS_KEY)
      if (customRaw) {
        const metas = JSON.parse(customRaw)
        if (metas.length > 0) result.hasStudy = true
      }
      // Default decks always exist, so Study is always "available"
      result.hasStudy = true
    }

    // ── Study: streak ──
    const streakRaw = localStorage.getItem(STREAK_KEY)
    if (streakRaw) {
      const streak = JSON.parse(streakRaw)
      result.studyStreak = streak.count || 0
    }

    // ── J-OSLER ──
    const joslerRaw = localStorage.getItem(JOSLER_KEY)
    if (joslerRaw) {
      const data = JSON.parse(joslerRaw)
      result.hasJosler = true

      // Count cases and groups from eg (experience grid)
      if (data.eg) {
        for (const spId of Object.keys(data.eg)) {
          const sp = data.eg[spId] || {}
          for (const dgId of Object.keys(sp)) {
            const dg = sp[dgId]
            if (dg?.on) result.joslerGroups++
            if (dg?.d) {
              result.joslerCases += Object.values(dg.d).filter(Boolean).length
            }
          }
        }
      }

      // Count accepted summaries
      if (data.summaries) {
        result.joslerSummaries = data.summaries.filter((s: any) => s.status === 'accepted').length
      }
    }
  } catch {
    // localStorage read failure — silently return defaults
  }

  return result
}

/* ═══════════════════════════════════
   Progress Bar Component
═══════════════════════════════════ */
function MiniProgress({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--s2)' }}>
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  )
}

/* ═══════════════════════════════════
   Main Component
═══════════════════════════════════ */
export default function HomeWidgets() {
  const [data, setData] = useState<WidgetData | null>(null)

  useEffect(() => {
    setData(loadWidgetData())
  }, [])

  // CLS対策: SSR/初回レンダリング時はスケルトン表示（高さを確保）
  if (!data) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-hidden="true">
        <div className="rounded-xl p-4 animate-pulse" style={{ background: 'var(--s0)', border: '1px solid var(--br)', minHeight: '100px' }}>
          <div className="h-3 w-12 rounded bg-s2 mb-3" />
          <div className="h-4 w-32 rounded bg-s2 mb-2" />
          <div className="h-1.5 w-full rounded-full bg-s2" />
        </div>
      </div>
    )
  }

  // Don't show if user has no activity at all
  const hasActivity = data.studyReviewed > 0 || data.studyStreak > 0 || data.hasJosler
  if (!hasActivity) return null

  const showStudy = data.studyDue > 0 || data.studyNew > 0 || data.studyStreak > 0
  const showJosler = data.hasJosler

  if (!showStudy && !showJosler) return null

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3" aria-label="アクティビティウィジェット">

      {/* ── Study Widget (Zeigarnik + Streak) ── */}
      {showStudy && (
        <Link href="/study" className="block" aria-label={`Study — ${data.studyDue > 0 ? `${data.studyDue}枚の復習待ち` : data.studyNew > 0 ? `${data.studyNew}枚の新規カード` : '今日の復習完了'}`}>
          <div
            className="rounded-xl p-4 transition-all hover:shadow-md"
            style={{ background: 'var(--s0)', border: '1px solid var(--br)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--m)' }}>Study</span>
              {data.studyStreak > 0 && (
                <span className="text-xs font-bold" style={{ color: 'var(--ac)' }}>
                  🔥 {data.studyStreak}日
                </span>
              )}
            </div>

            {/* Zeigarnik: unfinished reviews pull you back */}
            {data.studyDue > 0 ? (
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--tx)' }}>
                {data.studyDue}枚の復習待ち
              </p>
            ) : data.studyNew > 0 ? (
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--tx)' }}>
                {data.studyNew}枚の新規カード
              </p>
            ) : (
              <p className="text-sm font-bold mb-1" style={{ color: 'var(--ok)' }}>
                ✓ 今日の復習完了
              </p>
            )}

            {/* Goal Gradient: deck completion */}
            {data.studyTotal > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-[10px] mb-1" style={{ color: 'var(--m)' }}>
                  <span>学習済み</span>
                  <span>{data.studyReviewed}/{data.studyTotal}</span>
                </div>
                <MiniProgress value={data.studyReviewed} max={data.studyTotal} color="var(--ac)" />
              </div>
            )}
          </div>
        </Link>
      )}

      {/* ── J-OSLER Widget (Goal Gradient) ── */}
      {showJosler && (
        <Link href="/josler" className="block" aria-label={`J-OSLER — ${120 - data.joslerCases > 0 ? `あと${120 - data.joslerCases}症例` : '症例数クリア'}`}>
          <div
            className="rounded-xl p-4 transition-all hover:shadow-md"
            style={{ background: 'var(--s0)', border: '1px solid var(--br)' }}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium" style={{ color: 'var(--m)' }}>J-OSLER</span>
              <span className="text-xs font-bold" style={{ color: '#5B7FA6' }}>
                {Math.round(((data.joslerCases / 120) + (data.joslerGroups / 56) + (data.joslerSummaries / 29)) / 3 * 100)}%
              </span>
            </div>

            {/* Zeigarnik: show what's incomplete */}
            <p className="text-sm font-bold mb-2" style={{ color: 'var(--tx)' }}>
              {120 - data.joslerCases > 0
                ? `あと${120 - data.joslerCases}症例`
                : '症例数クリア ✓'}
            </p>

            {/* Goal Gradient: 3 mini progress bars */}
            <div className="space-y-1.5">
              <div>
                <div className="flex justify-between text-[10px] mb-0.5" style={{ color: 'var(--m)' }}>
                  <span>症例</span>
                  <span>{data.joslerCases}/120</span>
                </div>
                <MiniProgress value={data.joslerCases} max={120} color="#5B7FA6" />
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-0.5" style={{ color: 'var(--m)' }}>
                  <span>疾患群</span>
                  <span>{data.joslerGroups}/56</span>
                </div>
                <MiniProgress value={data.joslerGroups} max={56} color="#2D6A4F" />
              </div>
              <div>
                <div className="flex justify-between text-[10px] mb-0.5" style={{ color: 'var(--m)' }}>
                  <span>病歴要約</span>
                  <span>{data.joslerSummaries}/29</span>
                </div>
                <MiniProgress value={data.joslerSummaries} max={29} color="#7F5539" />
              </div>
            </div>
          </div>
        </Link>
      )}
    </div>
  )
}
