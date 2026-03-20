'use client'

import { useState, useMemo } from 'react'
import AppHeader from '@/components/AppHeader'
import { CONFERENCES_2026, Conference, getSpecialtyCategory, SPECIALTY_COLORS } from '@/lib/conferences-data'

type ViewMode = 'list' | 'calendar'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

function formatDateRange(start: string, end: string): string {
  const s = new Date(start + 'T00:00:00')
  const e = new Date(end + 'T00:00:00')
  const sM = s.getMonth() + 1
  const eM = e.getMonth() + 1
  if (sM === eM) {
    return `${sM}/${s.getDate()}-${e.getDate()}`
  }
  return `${sM}/${s.getDate()}-${eM}/${e.getDate()}`
}

function getDaysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
}

export default function ConferencesApp() {
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const [filterArea, setFilterArea] = useState<string>('all')

  // ソート: 日付順
  const sorted = useMemo(() => {
    let list = [...CONFERENCES_2026]
    if (filterArea !== 'all') {
      list = list.filter(c => c.specialtyArea === filterArea)
    }
    return list.sort((a, b) => a.startDate.localeCompare(b.startDate))
  }, [filterArea])

  // 月ごとにグループ
  const grouped = useMemo(() => {
    const map = new Map<string, Conference[]>()
    for (const c of sorted) {
      const month = c.startDate.slice(0, 7)
      if (!map.has(month)) map.set(month, [])
      map.get(month)!.push(c)
    }
    return map
  }, [sorted])

  // 診療科一覧
  const areas = useMemo(() => {
    const set = new Set(CONFERENCES_2026.map(c => c.specialtyArea))
    return Array.from(set).sort()
  }, [])

  return (
    <div className="px-4 py-8 max-w-lg mx-auto">
      <AppHeader
        title="学会カレンダー"
        subtitle="基本領域19学会 2026年度 学術集会日程"
        badge="NEW"
        favoriteSlug="app-conferences"
        favoriteHref="/conferences"
      />

      {/* ビュー切替 */}
      <div className="flex bg-s1 rounded-xl p-1 mb-4">
        {(['list', 'calendar'] as ViewMode[]).map(mode => (
          <button
            key={mode}
            onClick={() => setViewMode(mode)}
            className="flex-1 py-2 rounded-lg text-xs font-bold transition-all"
            style={{
              background: viewMode === mode ? 'var(--s0)' : 'transparent',
              color: viewMode === mode ? MC : 'var(--m)',
              boxShadow: viewMode === mode ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
            }}
          >
            {mode === 'list' ? 'リスト' : '月表示'}
          </button>
        ))}
      </div>

      {/* 診療科フィルタ */}
      <div className="flex flex-wrap gap-1.5 mb-6">
        <button
          onClick={() => setFilterArea('all')}
          className="px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all"
          style={{
            background: filterArea === 'all' ? MCL : 'transparent',
            color: filterArea === 'all' ? MC : undefined,
            borderColor: filterArea === 'all' ? `${MC}40` : 'var(--br)',
          }}
        >
          全て
        </button>
        {areas.map(area => (
          <button
            key={area}
            onClick={() => setFilterArea(area === filterArea ? 'all' : area)}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all"
            style={{
              background: filterArea === area ? MCL : 'transparent',
              color: filterArea === area ? MC : undefined,
              borderColor: filterArea === area ? `${MC}40` : 'var(--br)',
            }}
          >
            {area}
          </button>
        ))}
      </div>

      {/* リスト表示 */}
      {viewMode === 'list' && (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([month, confs]) => {
            const [y, m] = month.split('-')
            return (
              <div key={month}>
                <h3 className="text-sm font-bold text-tx mb-3">{y}年{parseInt(m)}月</h3>
                <div className="space-y-3">
                  {confs.map(conf => (
                    <ConferenceCard key={conf.id} conf={conf} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* カレンダー表示はC2-1-3で実装 */}
      {viewMode === 'calendar' && (
        <CalendarPlaceholder conferences={sorted} />
      )}
    </div>
  )
}

function ConferenceCard({ conf }: { conf: Conference }) {
  const days = getDaysUntil(conf.startDate)
  const cat = getSpecialtyCategory(conf.specialtyArea)
  const catColor = SPECIALTY_COLORS[cat]
  const isPast = days < 0

  return (
    <div
      className="bg-s0 border border-br rounded-xl p-4 transition-all hover:border-ac/30"
      style={{ opacity: isPast ? 0.6 : 1 }}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-1 self-stretch rounded-full shrink-0"
          style={{ background: catColor }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold" style={{ color: catColor }}>
              {formatDateRange(conf.startDate, conf.endDate)}
            </span>
            {days > 0 && days <= 30 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                あと{days}日
              </span>
            )}
            {isPast && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-s1 text-muted border border-br">
                終了
              </span>
            )}
          </div>
          <p className="text-sm font-bold text-tx mb-1 leading-snug">{conf.meetingName}</p>
          <div className="flex items-center gap-2 text-[11px] text-muted">
            <span>📍 {conf.venue}（{conf.city}）</span>
          </div>
          {conf.theme && (
            <p className="text-[10px] text-muted mt-1 italic">「{conf.theme}」</p>
          )}
          {conf.president && (
            <p className="text-[10px] text-muted mt-0.5">
              会長: {conf.president}{conf.presidentAffiliation && `（${conf.presidentAffiliation}）`}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// カレンダーグリッドのプレースホルダー（C2-1-3で実装）
function CalendarPlaceholder({ conferences }: { conferences: Conference[] }) {
  return (
    <div className="text-center py-8 bg-s0 border border-br rounded-xl">
      <p className="text-2xl mb-2">📅</p>
      <p className="text-sm text-muted">月表示（カレンダー）を読み込み中...</p>
    </div>
  )
}
