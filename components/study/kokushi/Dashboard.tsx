'use client'

import { useState } from 'react'
import { FIELDS, getTotals } from './mock-data'
import ProgressRing from './ProgressRing'
import StatCard from './StatCard'

interface DashboardProps {
  onSwitchTab: (tab: 'practice' | 'cards') => void
}

const BAR_DATA = {
  day:   [8, 22, 15, 30, 18, 25, 24],
  week:  [95, 120, 142, 88, 110, 135, 142],
  month: [380, 420, 510, 480],
  year:  [2400, 3200, 4100],
} as const

const RATE_DATA = [58, 63, 55, 72, 60, 68, 71]

const X_LABELS = {
  day:   ['月', '火', '水', '木', '金', '土', '日'],
  week:  ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7'],
  month: ['1月', '2月', '3月', '4月'],
  year:  ['2024', '2025', '2026'],
} as const

type Period = 'day' | 'week' | 'month' | 'year'
type Metric = 'count' | 'rate'
type FieldMetric = 'rate' | 'progress'

function PillToggle<T extends string>({
  options, value, onChange, accent,
}: {
  options: [T, string][]
  value: T
  onChange: (v: T) => void
  accent?: boolean
}) {
  return (
    <div className="flex bg-s1 rounded-lg p-0.5">
      {options.map(([k, l]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`px-3 py-1 rounded-md text-xs font-medium border-none cursor-pointer transition-all
            ${value === k
              ? accent
                ? 'bg-acl text-ac'
                : 'bg-s0 text-tx shadow-sm font-semibold'
              : 'bg-transparent text-muted'
            }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}

function barColor(v: number): string {
  if (v >= 70) return 'bg-ok'
  if (v >= 50) return 'bg-ac'
  if (v >= 30) return 'bg-wn'
  return 'bg-dn'
}

export default function Dashboard({ onSwitchTab }: DashboardProps) {
  const [kokushiMetric, setKokushiMetric] = useState<Metric>('count')
  const [kokushiPeriod, setKokushiPeriod] = useState<Period>('week')
  const [fieldMetric, setFieldMetric] = useState<FieldMetric>('rate')
  const [fieldPeriod, setFieldPeriod] = useState<Period>('week')

  const { totalQ, totalDone } = getTotals()
  const totalPct = Math.round((totalDone / totalQ) * 100)

  const bars = BAR_DATA[kokushiPeriod]
  const maxBar = Math.max(...bars)

  return (
    <div className="animate-fade-in">

      {/* Greeting */}
      <div className="mb-6">
        <div className="text-[11px] text-muted font-semibold tracking-widest uppercase mb-2">
          2026年3月31日（火）
        </div>
        <h1 className="text-[28px] font-bold text-tx m-0">おかえりなさい</h1>
        <p className="text-sm text-muted mt-2 mb-0">
          国試まであと<span className="text-ac font-bold">315日</span>
        </p>
      </div>

      {/* 国試演習 */}
      <div className="text-xs font-semibold text-muted mb-2.5 flex items-center gap-1.5">✎ 国試演習</div>
      <div className="bg-s0 border border-br rounded-xl p-5 mb-6">
        <div className="flex gap-6 flex-wrap">

          {/* Bar chart */}
          <div className="flex-1 min-w-0" style={{ flexBasis: 380 }}>
            <div className="flex items-center justify-between mb-4">
              <PillToggle
                options={[['count', '演習数'], ['rate', '正答率']]}
                value={kokushiMetric}
                onChange={setKokushiMetric}
              />
              <PillToggle
                options={[['day', '日'], ['week', '週'], ['month', '月'], ['year', '年']]}
                value={kokushiPeriod}
                onChange={setKokushiPeriod}
                accent
              />
            </div>

            <div className="flex items-end gap-2 h-[130px] px-1">
              {bars.map((v, i) => {
                const isLast = i === bars.length - 1
                const barH = Math.max(4, Math.round((v / maxBar) * 90))
                const rateVal = RATE_DATA[i] ?? 65
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <span className={`text-[10px] font-mono ${isLast ? 'text-ac font-semibold' : 'text-muted'}`}>
                      {kokushiMetric === 'rate' ? `${rateVal}%` : v}
                    </span>
                    <div
                      className={`w-full max-w-[40px] rounded-[4px] transition-all duration-400 ${isLast ? 'bg-ac' : 'bg-s2'}`}
                      style={{ height: barH }}
                    />
                    <span className="text-[9px] text-muted">
                      {X_LABELS[kokushiPeriod][i] ?? ''}
                    </span>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between mt-3 pt-3 border-t border-br">
              <div>
                <span className="text-2xl font-bold font-mono text-tx">
                  {kokushiMetric === 'count' ? '142' : '71%'}
                </span>
                <span className="text-xs text-muted ml-1.5">
                  {kokushiMetric === 'count' ? '問（今週）' : '全科目平均'}
                </span>
              </div>
              <div className="text-[11px] text-ok font-medium">
                ↑ {kokushiMetric === 'count' ? '12' : '3'}% vs 先週
              </div>
            </div>
          </div>

          {/* Progress ring */}
          <div className="flex-none flex flex-col items-center justify-center text-center px-2 border-l border-br min-w-[160px]">
            <div className="text-[11px] text-muted font-semibold tracking-wider uppercase mb-3">全問進捗</div>
            <div className="relative flex items-center justify-center">
              <ProgressRing value={totalPct} size={100} stroke={6} />
              <div className="absolute text-center">
                <div className="text-2xl font-bold font-mono text-tx">{totalPct}%</div>
                <div className="text-[10px] text-muted">{totalDone.toLocaleString()} / {totalQ.toLocaleString()}</div>
              </div>
            </div>
            <button
              onClick={() => onSwitchTab('practice')}
              className="w-full mt-3 py-2 px-4 rounded-lg bg-ac text-white text-xs font-semibold border-none cursor-pointer"
            >
              演習を始める
            </button>
          </div>
        </div>
      </div>

      {/* 暗記カード */}
      <div className="text-xs font-semibold text-muted mb-2.5 flex items-center gap-1.5">⊞ 暗記カード</div>
      <div className="bg-s0 border border-br rounded-xl p-5 mb-6">
        <div className="flex gap-5 flex-wrap items-center">
          <div className="flex gap-3 flex-wrap" style={{ flex: '1 1 300px' }}>
            <StatCard icon="⊞" label="今日の復習" value="38" sub="枚" />
            <StatCard label="カード総数" value="278" sub="枚" />
            <StatCard icon="🔥" label="連続学習" value="14" sub="日" />
          </div>
          <div className="flex-none flex flex-col items-center text-center px-2 border-l border-br min-w-[140px]">
            <div className="text-[11px] text-muted font-semibold tracking-wider uppercase mb-2.5">今日の復習</div>
            <div className="relative flex items-center justify-center">
              <ProgressRing value={42} size={80} stroke={5} color="#6C5CE7" />
              <div className="absolute text-center">
                <div className="text-xl font-bold font-mono text-tx">16</div>
                <div className="text-[9px] text-muted">/ 38枚</div>
              </div>
            </div>
            <button
              onClick={() => onSwitchTab('cards')}
              className="w-full mt-2.5 py-[7px] px-4 rounded-lg bg-ac text-white text-xs font-semibold border-none cursor-pointer"
            >
              復習を始める
            </button>
          </div>
        </div>
      </div>

      {/* 科目別 */}
      <div className="bg-s0 border border-br rounded-xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-[13px] font-semibold text-tx">科目別</span>
            <PillToggle
              options={[['rate', '正答率'], ['progress', '演習進捗']]}
              value={fieldMetric}
              onChange={setFieldMetric}
            />
          </div>
          <PillToggle
            options={[['day', '日'], ['week', '週'], ['month', '月'], ['year', '年']]}
            value={fieldPeriod}
            onChange={setFieldPeriod}
            accent
          />
        </div>

        {FIELDS[0].subs.map(s => {
          const pct = fieldMetric === 'rate' ? s.pct : Math.round((s.done / s.total) * 100)
          return (
            <div key={s.id} className="flex items-center gap-3 py-[7px]">
              <div className="w-[72px] text-xs text-muted text-right font-medium">{s.label}</div>
              <div className="flex-1 h-1.5 bg-s2 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-400 ${barColor(pct)}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="w-10 text-xs font-semibold font-mono text-right text-tx">{pct}%</div>
              <div className="w-[60px] text-[11px] text-muted font-mono">
                {fieldMetric === 'progress' ? `${s.done}/${s.total}` : ''}
              </div>
            </div>
          )
        })}

        <button
          onClick={() => onSwitchTab('practice')}
          className="text-xs text-ac font-medium mt-3 cursor-pointer bg-transparent border-none p-0"
        >
          全科目を表示 →
        </button>
      </div>

    </div>
  )
}
