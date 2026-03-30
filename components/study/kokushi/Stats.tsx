'use client'

import { useState, useMemo } from 'react'
import type { StatsTab } from './types'
import { FIELDS, EXAMS, MOCK_DECKS, getTotals } from './mock-data'
import TabBar from './TabBar'
import StatCard from './StatCard'

// ── helpers ──────────────────────────────────────────────────────────────────

function CardBox({ title, right, children }: {
  title: string
  right?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="bg-s0 border border-br rounded-xl p-5 mb-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold text-tx m-0">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  )
}

function pctColor(pct: number): string {
  if (pct >= 70) return 'text-ok'
  if (pct >= 50) return 'text-wn'
  return 'text-dn'
}

// ── Kokushi stats sub-components ─────────────────────────────────────────────

const WEEK_BARS = [18, 25, 32, 28, 42, 35, 22, 45, 38, 50, 42, 48]
const RATE_POINTS = [63, 65, 61, 67, 64, 68, 71]

function HeatmapSection({ cells }: { cells: number[] }) {
  function cellColor(v: number) {
    if (v > 0.8) return 'bg-ac'
    if (v > 0.5) return 'bg-acl'
    if (v > 0.2) return 'bg-s2'
    return 'bg-s1'
  }
  return (
    <CardBox title="演習ヒートマップ">
      <div className="flex flex-wrap gap-1 mb-3">
        {cells.map((v, i) => (
          <div key={i} className={`w-[14px] h-[14px] rounded-sm ${cellColor(v)}`} />
        ))}
      </div>
      <div className="flex items-center gap-2 text-[11px] text-muted">
        <span>少ない</span>
        <div className="w-[12px] h-[12px] rounded-sm bg-s1" />
        <div className="w-[12px] h-[12px] rounded-sm bg-s2" />
        <div className="w-[12px] h-[12px] rounded-sm bg-acl" />
        <div className="w-[12px] h-[12px] rounded-sm bg-ac" />
        <span>多い</span>
      </div>
    </CardBox>
  )
}

function WeeklyBarsSection() {
  const max = Math.max(...WEEK_BARS)
  return (
    <CardBox title="週別演習数">
      <div className="flex items-end gap-1.5 h-[100px]">
        {WEEK_BARS.map((v, i) => {
          const isRecent = i >= WEEK_BARS.length - 2
          return (
            <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
              <div
                className={`w-full rounded-sm ${isRecent ? 'bg-ac' : 'bg-acl'}`}
                style={{ height: `${(v / max) * 80}px` }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex justify-between text-[10px] text-muted mt-1">
        <span>12週前</span>
        <span>6週前</span>
        <span>今週</span>
      </div>
    </CardBox>
  )
}

function MarkDistribution() {
  const bars = [
    { icon: '◎', label: '完璧', count: 520, pct: 22, color: 'bg-[#6C5CE7]' },
    { icon: '○',  label: '正解', count: 1080, pct: 47, color: 'bg-ok' },
    { icon: '△',  label: '曖昧', count: 420, pct: 18, color: 'bg-wn' },
    { icon: '✕',  label: '不正解', count: 297, pct: 13, color: 'bg-dn' },
  ]
  return (
    <div className="bg-s0 border border-br rounded-xl p-5 flex-1 min-w-[200px]">
      <h3 className="text-[14px] font-semibold text-tx m-0 mb-4">マーク分布</h3>
      <div className="flex items-end gap-3 h-[100px]">
        {bars.map(b => (
          <div key={b.icon} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[11px] text-muted font-mono">{b.pct}%</span>
            <div
              className={`w-full rounded-sm ${b.color}`}
              style={{ height: `${b.pct * 2.8}px` }}
            />
            <span className="text-[13px]">{b.icon}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex flex-col gap-1">
        {bars.map(b => (
          <div key={b.icon} className="flex items-center justify-between text-[11px]">
            <span className="text-muted">{b.icon} {b.label}</span>
            <span className="font-mono text-tx">{b.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function RateTrendChart() {
  const w = 220
  const h = 80
  const pad = 10
  const innerW = w - pad * 2
  const innerH = h - pad * 2
  const min = 55
  const max = 80
  const pts = RATE_POINTS.map((v, i) => {
    const x = pad + (i / (RATE_POINTS.length - 1)) * innerW
    const y = pad + innerH - ((v - min) / (max - min)) * innerH
    return `${x},${y}`
  }).join(' ')
  return (
    <div className="bg-s0 border border-br rounded-xl p-5 flex-1 min-w-[200px]">
      <h3 className="text-[14px] font-semibold text-tx m-0 mb-1">正答率推移</h3>
      <div className="text-[11px] text-muted mb-3">63% → 71%</div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} className="overflow-visible">
        <polyline
          points={pts}
          fill="none"
          stroke="var(--ac)"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {RATE_POINTS.map((v, i) => {
          const x = pad + (i / (RATE_POINTS.length - 1)) * innerW
          const y = pad + innerH - ((v - min) / (max - min)) * innerH
          return (
            <circle key={i} cx={x} cy={y} r="3" fill="var(--ac)" />
          )
        })}
        <text x={pad} y={h - 2} fontSize="9" fill="var(--m)">63%</text>
        <text x={w - pad - 8} y={h - 2} fontSize="9" fill="var(--m)">71%</text>
      </svg>
    </div>
  )
}

function SubFieldCoverage() {
  const allSubs = FIELDS.flatMap(f => f.subs)
  const sorted = [...allSubs].sort((a, b) => b.pct - a.pct).slice(0, 10)
  return (
    <CardBox title="科目別カバー率（上位10科目）">
      <div className="flex flex-col gap-2.5">
        {sorted.map(sub => (
          <div key={sub.id}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] text-tx">{sub.label}</span>
              <span className={`text-[12px] font-mono font-semibold ${pctColor(sub.pct)}`}>
                {sub.pct}%
              </span>
            </div>
            <div className="h-1.5 bg-s1 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-ac transition-all"
                style={{ width: `${sub.pct}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </CardBox>
  )
}

function ExamProgress() {
  const active = EXAMS.filter(e => e.done > 0)
  return (
    <CardBox title="回数別進捗">
      <div className="flex flex-col gap-3">
        {active.map(e => (
          <div key={e.year}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[12px] text-tx font-medium">第{e.year}回</span>
              <span className={`text-[12px] font-mono font-semibold ${pctColor(e.pct)}`}>
                {e.pct}%
              </span>
            </div>
            <div className="h-2 bg-s1 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-ac transition-all"
                style={{ width: `${(e.done / e.total) * 100}%` }}
              />
            </div>
            <div className="text-[10px] text-muted mt-0.5">
              {e.done} / {e.total} 問
            </div>
          </div>
        ))}
      </div>
    </CardBox>
  )
}

// ── Cards stats sub-components ────────────────────────────────────────────────

const FORECAST_BARS = [38, 22, 15, 8, 45, 12, 6, 32, 18, 9, 52, 28, 14, 7]
const INTERVAL_BARS = [45, 62, 88, 74, 52, 38, 28, 20, 14, 9, 6, 4]

const DONUT_SLICES = [
  { label: '新規',     count: 98,  pct: 35, color: '#6C5CE7' },
  { label: '復習未熟', count: 110, pct: 40, color: 'var(--ac)' },
  { label: '復習熟知', count: 52,  pct: 19, color: 'var(--acl)' },
  { label: '保留',     count: 14,  pct: 5,  color: 'var(--s2)' },
  { label: '延期',     count: 4,   pct: 1,  color: 'var(--br)' },
]

function DonutChart() {
  const r = 38
  const cx = 50
  const cy = 50
  const circumference = 2 * Math.PI * r
  let offset = 0
  return (
    <svg width="100" height="100" viewBox="0 0 100 100">
      {DONUT_SLICES.map(s => {
        const dash = (s.pct / 100) * circumference
        const gap  = circumference - dash
        const el = (
          <circle
            key={s.label}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke={s.color}
            strokeWidth="16"
            strokeDasharray={`${dash} ${gap}`}
            strokeDashoffset={-offset}
            transform="rotate(-90 50 50)"
          />
        )
        offset += dash
        return el
      })}
    </svg>
  )
}

function CardBreakdown() {
  return (
    <CardBox title="カード内訳">
      <div className="flex gap-6 items-start">
        <div className="shrink-0">
          <DonutChart />
        </div>
        <div className="flex-1">
          <table className="w-full text-[12px]">
            <tbody>
              {DONUT_SLICES.map(s => (
                <tr key={s.label}>
                  <td className="py-0.5 pr-2">
                    <span
                      className="inline-block w-2.5 h-2.5 rounded-sm mr-1.5 align-middle"
                      style={{ background: s.color }}
                    />
                    <span className="text-tx">{s.label}</span>
                  </td>
                  <td className="text-right font-mono text-tx">{s.count}</td>
                  <td className="text-right text-muted pl-2">{s.pct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </CardBox>
  )
}

function ReviewForecast() {
  const max = Math.max(...FORECAST_BARS)
  return (
    <div className="bg-s0 border border-br rounded-xl p-5 flex-1 min-w-[200px]">
      <h3 className="text-[14px] font-semibold text-tx m-0 mb-4">復習予測（14日）</h3>
      <div className="flex items-end gap-1 h-[80px]">
        {FORECAST_BARS.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className={`w-full rounded-sm ${i === 0 ? 'bg-ac' : 'bg-acl'}`}
              style={{ height: `${(v / max) * 68}px` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted mt-1">
        <span>今日</span>
        <span>7日後</span>
        <span>14日後</span>
      </div>
    </div>
  )
}

function ReviewIntervals() {
  const max = Math.max(...INTERVAL_BARS)
  const labels = ['1', '2', '3', '5', '7', '10', '14', '21', '30', '60', '90', '180+']
  return (
    <div className="bg-s0 border border-br rounded-xl p-5 flex-1 min-w-[200px]">
      <h3 className="text-[14px] font-semibold text-tx m-0 mb-4">復習間隔分布（日）</h3>
      <div className="flex items-end gap-1 h-[80px]">
        {INTERVAL_BARS.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-sm bg-acl"
              style={{ height: `${(v / max) * 68}px` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted mt-1">
        {[labels[0], labels[5], labels[11]].map(l => (
          <span key={l}>{l}日</span>
        ))}
      </div>
    </div>
  )
}

function CalendarHeatmap({ cells }: { cells: number[] }) {
  function cellColor(v: number) {
    if (v > 0.8) return 'bg-ac'
    if (v > 0.5) return 'bg-acl'
    if (v > 0.2) return 'bg-s2'
    return 'bg-s1'
  }
  return (
    <CardBox
      title="カレンダー"
      right={
        <div className="flex items-center gap-2 text-[13px] text-muted">
          <button className="px-1.5 hover:text-tx transition-colors border-none bg-transparent cursor-pointer">◀</button>
          <span className="text-[12px] font-medium text-tx">2026年3月</span>
          <button className="px-1.5 hover:text-tx transition-colors border-none bg-transparent cursor-pointer">▶</button>
        </div>
      }
    >
      <div className="flex flex-wrap gap-1">
        {cells.map((v, i) => (
          <div key={i} className={`w-[13px] h-[13px] rounded-sm ${cellColor(v)}`} />
        ))}
      </div>
    </CardBox>
  )
}

const ANSWER_BUTTONS = [
  { label: 'もう一度', count: 245, color: 'bg-dn' },
  { label: '難しい',   count: 128, color: 'bg-wn' },
  { label: '普通',     count: 1089, color: 'bg-acl' },
  { label: '簡単',     count: 380, color: 'bg-ok' },
]

const HOURLY_BARS = [
  2, 1, 0, 0, 1, 3, 8, 22, 45, 62, 58, 38,
  42, 55, 48, 35, 28, 20, 15, 10, 8, 6, 4, 2,
]

function AnswerButtonDist() {
  const maxA = Math.max(...ANSWER_BUTTONS.map(b => b.count))
  return (
    <div className="bg-s0 border border-br rounded-xl p-5 flex-1 min-w-[200px]">
      <h3 className="text-[14px] font-semibold text-tx m-0 mb-4">回答ボタン分布</h3>
      <div className="flex items-end gap-3 h-[100px]">
        {ANSWER_BUTTONS.map(b => (
          <div key={b.label} className="flex-1 flex flex-col items-center gap-1">
            <span className="text-[10px] text-muted font-mono">{b.count.toLocaleString()}</span>
            <div
              className={`w-full rounded-sm ${b.color}`}
              style={{ height: `${(b.count / maxA) * 68}px` }}
            />
            <span className="text-[10px] text-muted text-center leading-tight">{b.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function HourlyAnalysis() {
  const maxH = Math.max(...HOURLY_BARS)
  return (
    <div className="bg-s0 border border-br rounded-xl p-5 flex-1 min-w-[200px]">
      <h3 className="text-[14px] font-semibold text-tx m-0 mb-4">時間帯別演習数</h3>
      <div className="flex items-end gap-0.5 h-[80px]">
        {HOURLY_BARS.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className="w-full rounded-sm bg-acl"
              style={{ height: `${maxH > 0 ? (v / maxH) * 68 : 0}px` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] text-muted mt-1">
        <span>0時</span>
        <span>6時</span>
        <span>12時</span>
        <span>18時</span>
        <span>23時</span>
      </div>
    </div>
  )
}

function DeckStatsTable() {
  return (
    <CardBox title="デッキ別統計">
      <div className="overflow-x-auto">
        <table className="w-full text-[12px]">
          <thead>
            <tr className="border-b border-br">
              <th className="text-left py-2 text-muted font-medium pr-4">デッキ</th>
              <th className="text-right py-2 text-muted font-medium px-2">カード数</th>
              <th className="text-right py-2 text-muted font-medium px-2">復習</th>
              <th className="text-right py-2 text-muted font-medium px-2">保持率</th>
              <th className="text-right py-2 text-muted font-medium pl-2">平均間隔</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_DECKS.map(d => (
              <tr key={d.id} className="border-b border-br last:border-0">
                <td className="py-2 pr-4 text-tx font-medium">{d.name}</td>
                <td className="text-right py-2 px-2 font-mono text-tx">{d.cards}</td>
                <td className="text-right py-2 px-2 font-mono text-ac font-semibold">{d.due}</td>
                <td className={`text-right py-2 px-2 font-mono font-semibold ${pctColor(82)}`}>82%</td>
                <td className="text-right py-2 pl-2 font-mono text-muted">14.2日</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </CardBox>
  )
}

// ── Main Stats component ──────────────────────────────────────────────────────

export default function Stats() {
  const [statsTab, setStatsTab] = useState<StatsTab>('kokushi')

  const { totalDone } = getTotals()
  const totalQ = FIELDS.reduce((s, f) => s + f.subs.reduce((ss, sub) => ss + sub.total, 0), 0)
  const coverPct = Math.round((totalDone / totalQ) * 100)

  // Stable random data for heatmaps
  const kokushiHeatCells = useMemo(() => {
    const rng = (seed: number) => {
      let x = Math.sin(seed + 1) * 10000
      return x - Math.floor(x)
    }
    return Array.from({ length: 84 }, (_, i) => rng(i))
  }, [])

  const calendarCells = useMemo(() => {
    const rng = (seed: number) => {
      let x = Math.sin(seed + 500) * 10000
      return x - Math.floor(x)
    }
    return Array.from({ length: 90 }, (_, i) => rng(i))
  }, [])

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[22px] font-bold m-0">統計</h1>
      </div>
      <p className="text-[13px] text-muted mt-1 mb-5">学習の進捗と傾向を確認できます</p>

      <TabBar
        items={[
          ['kokushi', '国試演習'],
          ['cards',   '暗記カード'],
        ]}
        active={statsTab}
        onChange={v => setStatsTab(v as StatsTab)}
      />

      {/* ── Kokushi tab ── */}
      {statsTab === 'kokushi' && (
        <div>
          {/* Summary stat cards */}
          <div className="flex gap-3 flex-wrap mb-4">
            <StatCard label="総演習数" value={totalDone.toLocaleString()} icon="◎" sub="問演習完了" />
            <StatCard label="正答率" value="71%" trend={8} sub="先月比" />
            <StatCard label="カバー率" value={`${coverPct}%`} sub={`${totalDone}/${totalQ}問`} />
            <StatCard label="学習時間" value="142h" sub="累計" />
          </div>

          <HeatmapSection cells={kokushiHeatCells} />
          <WeeklyBarsSection />

          <div className="flex gap-4 flex-wrap mb-4">
            <MarkDistribution />
            <RateTrendChart />
          </div>

          <SubFieldCoverage />
          <ExamProgress />
        </div>
      )}

      {/* ── Cards tab ── */}
      {statsTab === 'cards' && (
        <div>
          {/* 今日カード */}
          <div className="bg-s0 border border-br rounded-xl p-5 mb-4">
            <h3 className="text-[14px] font-semibold text-tx m-0 mb-4">今日のカード</h3>
            <div className="grid grid-cols-3 gap-3 mb-4">
              {[
                { label: '復習予定', value: '38', color: 'text-ac' },
                { label: '復習済み', value: '16', color: 'text-ok' },
                { label: '平均回答時間', value: '12.4秒', color: 'text-tx' },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <div className={`text-[22px] font-bold font-mono ${item.color}`}>{item.value}</div>
                  <div className="text-[11px] text-muted mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>
            <div className="border-t border-br pt-3 flex gap-4 flex-wrap">
              {[
                { label: '基本', value: 8 },
                { label: '復習', value: 8 },
                { label: '再学習', value: 0 },
                { label: '正解率', value: null, display: '87%' },
              ].map(item => (
                <div key={item.label} className="text-[12px] text-muted">
                  {item.label}:{' '}
                  <span className="font-semibold text-tx">
                    {item.display ?? item.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Summary stat cards */}
          <div className="flex gap-3 flex-wrap mb-4">
            <StatCard label="カード総数" value="278" sub="枚" />
            <StatCard label="復習累計" value="1,842" sub="回" />
            <StatCard label="保持率" value="87%" trend={2} sub="先週比" />
            <StatCard label="連続学習" value="14日" sub="ストリーク" />
          </div>

          <CardBreakdown />

          <div className="flex gap-4 flex-wrap mb-4">
            <ReviewForecast />
            <ReviewIntervals />
          </div>

          <CalendarHeatmap cells={calendarCells} />

          <div className="flex gap-4 flex-wrap mb-4">
            <AnswerButtonDist />
            <HourlyAnalysis />
          </div>

          <DeckStatsTable />
        </div>
      )}
    </div>
  )
}
