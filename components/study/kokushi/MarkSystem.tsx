'use client'

import { MARKS } from './mock-data'
import type { Mark } from './types'

// ── マーク分布バー（◎12 ○34 ...）──
export function MarkBar({ marks }: { marks: Record<Mark, number> }) {
  return (
    <div className="flex items-center gap-1.5">
      {MARKS.map(m => (
        <div key={m.key} className="flex items-center gap-0.5 text-[11px]">
          <span className="font-bold text-xs" style={{ color: m.color }}>{m.icon}</span>
          <span className="text-muted font-mono">{marks[m.key] || 0}</span>
        </div>
      ))}
    </div>
  )
}

// ── マーク進捗バー（積み上げ横バー）──
export function MarkProgressBar({ marks, total }: { marks: Record<Mark, number>; total: number }) {
  const parts: { k: Mark; c: string }[] = [
    { k: 'dbl', c: '#6C5CE7' },
    { k: 'ok', c: '#166534' },
    { k: 'tri', c: '#92400E' },
    { k: 'x', c: '#991B1B' },
  ]
  return (
    <div className="h-2 bg-s2 rounded overflow-hidden flex">
      {parts.map(p => {
        const w = ((marks[p.k] || 0) / total) * 100
        if (w <= 0) return null
        return <div key={p.k} style={{ width: `${w}%`, background: p.c }} className="h-full" />
      })}
    </div>
  )
}

// ── 自己評価ボタン行 ──
export function SelfEvalButtons({ onSelect }: { onSelect?: (mark: Mark) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted">自己評価：</span>
      {MARKS.map(mk => (
        <button
          key={mk.key}
          onClick={() => onSelect?.(mk.key)}
          title={mk.label}
          className="w-9 h-9 rounded-lg border-[1.5px] border-br bg-s0 flex items-center justify-center cursor-pointer text-base font-bold hover:bg-s1 transition-colors"
          style={{ color: mk.color }}
        >
          {mk.icon}
        </button>
      ))}
    </div>
  )
}

// ── 演習履歴（マーク＋日時一覧）──
export function AttemptHistory({ attempts }: { attempts: { date: string; result: Mark }[] }) {
  return (
    <div className="ml-auto flex items-center gap-1.5">
      <span className="text-[11px] text-muted">演習履歴：</span>
      {attempts.map((a, i) => {
        const mk = MARKS.find(m => m.key === a.result)
        return (
          <div key={i} className="flex flex-col items-center gap-0.5">
            <span className="text-[13px] font-bold" style={{ color: mk?.color }}>{mk?.icon}</span>
            <span className="text-[8px] text-muted">{a.date}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── マークフィルターチップ ──
export function MarkFilterChips() {
  return (
    <div className="flex gap-1.5 mb-3">
      {MARKS.map(mk => (
        <button
          key={mk.key}
          className="px-3 py-[5px] rounded-lg border border-br bg-s0 text-xs cursor-pointer flex items-center gap-1 hover:bg-s1 transition-colors"
        >
          <span className="font-bold" style={{ color: mk.color }}>{mk.icon}</span> {mk.label}
        </button>
      ))}
    </div>
  )
}
