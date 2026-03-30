'use client'

import { useState } from 'react'
import type { PracticeView } from './types'
import { EXAM_MODES, FIELDS, EXAMS, MOCK_SETS, getTotals } from './mock-data'
import TabBar from './TabBar'
import Badge from './Badge'
import { MarkBar, MarkProgressBar } from './MarkSystem'

interface PracticeProps {
  onShowQuestionList: (title: string) => void
  onShowSearch: () => void
}

const CARD_BASE =
  'bg-s0 border border-br rounded-xl mb-2 cursor-pointer hover:border-br2 transition-colors'

// #9B9790 = C.m2 (not a named Tailwind token)
const M2 = '#9B9790'

function pctColor(pct: number): string {
  if (pct >= 70) return 'text-ok'
  if (pct >= 50) return 'text-wn'
  return 'text-dn'
}

export default function Practice({ onShowQuestionList, onShowSearch }: PracticeProps) {
  const [pView, setPView] = useState<PracticeView>('field')
  const [examMode, setExamMode] = useState('すべて')
  const [drillField, setDrillField] = useState<string | null>(null)

  const { totalQ, totalDone } = getTotals()

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[22px] font-bold m-0">演習</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={onShowSearch}
            className="px-4 py-2 rounded-lg border border-br bg-s0 text-xs cursor-pointer"
          >
            🔍 検索
          </button>
          <Badge color="accent" className="text-xs px-[10px] py-1">
            {totalDone.toLocaleString()} / {totalQ.toLocaleString()}
          </Badge>
        </div>
      </div>

      {/* Mode pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {EXAM_MODES.map(m => (
          <button
            key={m}
            onClick={() => setExamMode(m)}
            className={`px-3.5 py-1.5 rounded-full text-xs cursor-pointer transition-colors border-[1.5px] ${
              examMode === m
                ? 'border-ac bg-acl text-ac font-semibold'
                : 'border-br bg-transparent text-muted font-medium'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Tab bar */}
      <TabBar
        items={[
          ['field', '分野別'],
          ['exam', '回数別'],
          ['sets', '問題セット'],
        ]}
        active={pView}
        onChange={k => {
          setPView(k as PracticeView)
          setDrillField(null)
        }}
      />

      {/* 分野別 — group list */}
      {pView === 'field' && !drillField &&
        FIELDS.map(g => {
          const gt = g.subs.reduce((s, sub) => s + sub.total, 0)
          const gd = g.subs.reduce((s, sub) => s + sub.done, 0)
          const gm = g.subs.reduce(
            (s, sub) => ({
              dbl: s.dbl + (sub.marks.dbl || 0),
              ok: s.ok + (sub.marks.ok || 0),
              tri: s.tri + (sub.marks.tri || 0),
              x: s.x + (sub.marks.x || 0),
              none: s.none + (sub.marks.none || 0),
            }),
            { dbl: 0, ok: 0, tri: 0, x: 0, none: 0 },
          )
          return (
            <div
              key={g.id}
              className={`${CARD_BASE} px-5 py-4`}
              onClick={() => setDrillField(g.id)}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-ac font-mono">{g.id}</span>
                  <span className="font-semibold">{g.label}</span>
                  <span className="text-xs text-muted">({gt})</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <MarkBar marks={gm} />
                  <span className="font-bold text-ac font-mono text-xs">{gd}/{gt}</span>
                  <span style={{ color: M2 }}>›</span>
                </div>
              </div>
              <MarkProgressBar marks={gm} total={gt} />
            </div>
          )
        })}

      {/* 分野別 — sub-fields */}
      {pView === 'field' && drillField && (() => {
        const g = FIELDS.find(f => f.id === drillField)
        if (!g) return null
        return (
          <div>
            <button
              onClick={() => setDrillField(null)}
              className="bg-transparent border-none text-muted cursor-pointer text-[13px] mb-4"
            >
              ← 分野一覧
            </button>
            <h2 className="text-lg font-bold mt-0 mb-4">
              {g.id} {g.label}
            </h2>
            {g.subs.map(sub => (
              <div
                key={sub.id}
                className={`${CARD_BASE} p-4`}
                onClick={() => onShowQuestionList(sub.label)}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted">{sub.id}</span>
                    <span className="font-semibold">{sub.label}</span>
                    <span className="text-xs text-muted">({sub.total})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`font-bold font-mono ${pctColor(sub.pct)}`}>{sub.pct}%</span>
                    <span className="text-xs text-muted font-mono">{sub.done}/{sub.total}</span>
                    <span style={{ color: M2 }}>›</span>
                  </div>
                </div>
                <MarkProgressBar marks={sub.marks} total={sub.total} />
              </div>
            ))}
          </div>
        )
      })()}

      {/* 回数別 */}
      {pView === 'exam' &&
        EXAMS.map(ex => (
          <div
            key={ex.year}
            className={`${CARD_BASE} p-4`}
            onClick={() => onShowQuestionList(`第${ex.year}回`)}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[15px] font-bold font-mono">第{ex.year}回</span>
                <span className="text-xs text-muted">({ex.total}問)</span>
              </div>
              <div className="flex items-center gap-2">
                {ex.done > 0 && (
                  <span className={`font-bold font-mono ${pctColor(ex.pct)}`}>{ex.pct}%</span>
                )}
                <span className="text-xs text-muted font-mono">{ex.done}/{ex.total}</span>
                <span style={{ color: M2 }}>›</span>
              </div>
            </div>
            <div className="h-1.5 bg-s2 rounded overflow-hidden">
              <div
                className={`h-full rounded ${ex.pct >= 70 ? 'bg-ok' : 'bg-ac'}`}
                style={{ width: `${(ex.done / ex.total) * 100}%` }}
              />
            </div>
          </div>
        ))}

      {/* 問題セット */}
      {pView === 'sets' && (
        <div>
          <div className="flex justify-end mb-4">
            <button className="px-4 py-2 rounded-lg border-none bg-ac text-white text-xs font-semibold cursor-pointer">
              + 新規作成
            </button>
          </div>
          {MOCK_SETS.map((s, i) => (
            <div
              key={i}
              className={`${CARD_BASE} p-4`}
              onClick={() => onShowQuestionList(s.name)}
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold">{s.name}</div>
                  <div className="text-[11px] mt-0.5" style={{ color: M2 }}>
                    {s.count}問 · {s.created}
                  </div>
                </div>
                <span style={{ color: M2 }}>›</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
