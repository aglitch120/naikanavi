'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

// ─── Types ───
interface Doctor {
  id: string
  name: string
  ngDays: number[]  // day-of-month array
  maxShifts?: number
}

interface ShiftData {
  groupName: string
  year: number
  month: number  // 1-12
  doctors: Doctor[]
  assignments: Record<number, string>  // day -> doctor id
  slotsPerDay: number  // 1 for now
}

// ─── Helpers ───
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate()
}

function getFirstDayOfWeek(year: number, month: number) {
  return new Date(year, month - 1, 1).getDay() // 0=Sun
}

function isWeekend(year: number, month: number, day: number) {
  const dow = new Date(year, month - 1, day).getDay()
  return dow === 0 || dow === 6
}

const DAY_LABELS = ['日', '月', '火', '水', '木', '金', '土']

function generateId() {
  return Math.random().toString(36).slice(2, 8)
}

// ─── Auto-assign algorithm ───
function autoAssign(data: ShiftData): Record<number, string> {
  const { year, month, doctors } = data
  const totalDays = getDaysInMonth(year, month)
  const assignments: Record<number, string> = {}

  if (doctors.length === 0) return assignments

  // Build NG set per doctor
  const ngSets = new Map<string, Set<number>>()
  doctors.forEach(d => ngSets.set(d.id, new Set(d.ngDays)))

  // Track assignment counts
  const counts = new Map<string, number>()
  doctors.forEach(d => counts.set(d.id, 0))

  // Assign day by day
  for (let day = 1; day <= totalDays; day++) {
    // Get eligible doctors (not NG for this day)
    const eligible = doctors.filter(d => !ngSets.get(d.id)?.has(day))

    if (eligible.length === 0) {
      // No one available - assign least-loaded doctor anyway
      const sorted = [...doctors].sort((a, b) => (counts.get(a.id) || 0) - (counts.get(b.id) || 0))
      assignments[day] = sorted[0].id
      counts.set(sorted[0].id, (counts.get(sorted[0].id) || 0) + 1)
    } else {
      // Assign least-loaded eligible doctor
      // Tie-break: prefer someone who didn't work yesterday
      const yesterday = assignments[day - 1]
      const sorted = eligible.sort((a, b) => {
        const diff = (counts.get(a.id) || 0) - (counts.get(b.id) || 0)
        if (diff !== 0) return diff
        // Avoid consecutive days
        if (a.id === yesterday) return 1
        if (b.id === yesterday) return -1
        return 0
      })
      assignments[day] = sorted[0].id
      counts.set(sorted[0].id, (counts.get(sorted[0].id) || 0) + 1)
    }
  }

  return assignments
}

// ─── Compress/decompress for sharing ───
function compressData(data: ShiftData): string {
  const slim = {
    g: data.groupName,
    y: data.year,
    m: data.month,
    d: data.doctors.map(d => ({ i: d.id, n: d.name, ng: d.ngDays })),
    a: data.assignments,
  }
  try {
    return btoa(encodeURIComponent(JSON.stringify(slim)))
  } catch {
    return ''
  }
}

function decompressData(encoded: string): ShiftData | null {
  try {
    const slim = JSON.parse(decodeURIComponent(atob(encoded)))
    return {
      groupName: slim.g,
      year: slim.y,
      month: slim.m,
      doctors: slim.d.map((d: { i: string; n: string; ng: number[] }) => ({
        id: d.i,
        name: d.n,
        ngDays: d.ng,
      })),
      assignments: slim.a,
      slotsPerDay: 1,
    }
  } catch {
    return null
  }
}

// ─── Color assignment ───
const DOCTOR_COLORS = [
  'bg-blue-100 text-blue-700 border-blue-200',
  'bg-emerald-100 text-emerald-700 border-emerald-200',
  'bg-amber-100 text-amber-700 border-amber-200',
  'bg-purple-100 text-purple-700 border-purple-200',
  'bg-rose-100 text-rose-700 border-rose-200',
  'bg-cyan-100 text-cyan-700 border-cyan-200',
  'bg-orange-100 text-orange-700 border-orange-200',
  'bg-indigo-100 text-indigo-700 border-indigo-200',
  'bg-teal-100 text-teal-700 border-teal-200',
  'bg-pink-100 text-pink-700 border-pink-200',
]

// ─── Steps ───
type Step = 'setup' | 'doctors' | 'preferences' | 'result'

export default function ShiftPage() {
  const [step, setStep] = useState<Step>('setup')
  const [groupName, setGroupName] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2) // default: next month
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [newDoctorName, setNewDoctorName] = useState('')
  const [assignments, setAssignments] = useState<Record<number, string>>({})
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [isViewMode, setIsViewMode] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState('')

  // Check URL for shared data on mount
  useEffect(() => {
    const hash = window.location.hash.slice(1)
    if (hash) {
      const data = decompressData(hash)
      if (data) {
        setGroupName(data.groupName)
        setYear(data.year)
        setMonth(data.month)
        setDoctors(data.doctors)
        setAssignments(data.assignments)
        setStep('result')
        setIsViewMode(true)
      }
    }
  }, [])

  const totalDays = useMemo(() => getDaysInMonth(year, month), [year, month])
  const firstDow = useMemo(() => getFirstDayOfWeek(year, month), [year, month])

  const doctorColorMap = useMemo(() => {
    const map = new Map<string, string>()
    doctors.forEach((d, i) => map.set(d.id, DOCTOR_COLORS[i % DOCTOR_COLORS.length]))
    return map
  }, [doctors])

  const shiftCounts = useMemo(() => {
    const counts = new Map<string, number>()
    doctors.forEach(d => counts.set(d.id, 0))
    Object.values(assignments).forEach(id => {
      counts.set(id, (counts.get(id) || 0) + 1)
    })
    return counts
  }, [assignments, doctors])

  // ─── Handlers ───
  const addDoctor = () => {
    const name = newDoctorName.trim()
    if (!name) return
    setDoctors(prev => [...prev, { id: generateId(), name, ngDays: [] }])
    setNewDoctorName('')
  }

  const removeDoctor = (id: string) => {
    setDoctors(prev => prev.filter(d => d.id !== id))
  }

  const toggleNgDay = (doctorId: string, day: number) => {
    setDoctors(prev => prev.map(d => {
      if (d.id !== doctorId) return d
      const has = d.ngDays.includes(day)
      return { ...d, ngDays: has ? d.ngDays.filter(n => n !== day) : [...d.ngDays, day] }
    }))
  }

  const handleGenerate = () => {
    const data: ShiftData = { groupName, year, month, doctors, assignments: {}, slotsPerDay: 1 }
    const result = autoAssign(data)
    setAssignments(result)
    setStep('result')
  }

  const handleRegenerate = () => {
    const data: ShiftData = { groupName, year, month, doctors, assignments: {}, slotsPerDay: 1 }
    setAssignments(autoAssign(data))
  }

  const handleShare = () => {
    const data: ShiftData = { groupName, year, month, doctors, assignments, slotsPerDay: 1 }
    const compressed = compressData(data)
    const url = `${window.location.origin}/shift#${compressed}`
    setShareUrl(url)
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handlePrint = () => window.print()

  const assignDay = (day: number, doctorId: string) => {
    setAssignments(prev => ({ ...prev, [day]: doctorId }))
    setEditingDay(null)
  }

  // ─── Render helpers ───
  const renderStepIndicator = () => {
    const steps: { key: Step; label: string }[] = [
      { key: 'setup', label: '基本設定' },
      { key: 'doctors', label: '医師登録' },
      { key: 'preferences', label: 'NG日入力' },
      { key: 'result', label: '結果' },
    ]
    const currentIdx = steps.findIndex(s => s.key === step)
    return (
      <div className="flex items-center gap-1 mb-6 print:hidden">
        {steps.map((s, i) => (
          <div key={s.key} className="flex items-center gap-1">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
              i <= currentIdx ? 'bg-ac text-white' : 'bg-s1 text-muted border border-br'
            }`}>
              {i + 1}
            </div>
            <span className={`text-[11px] ${i <= currentIdx ? 'text-ac font-bold' : 'text-muted'}`}>{s.label}</span>
            {i < steps.length - 1 && <div className="w-4 h-px bg-br mx-1" />}
          </div>
        ))}
      </div>
    )
  }

  const renderCalendar = (mode: 'ng' | 'result', selectedDoctor?: string) => (
    <div className="bg-s0 border border-br rounded-xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-7 bg-s1 border-b border-br">
        {DAY_LABELS.map((d, i) => (
          <div key={d} className={`text-center py-2 text-[10px] font-bold ${
            i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted'
          }`}>{d}</div>
        ))}
      </div>
      {/* Days */}
      <div className="grid grid-cols-7">
        {/* Empty cells before first day */}
        {Array.from({ length: firstDow }).map((_, i) => (
          <div key={`e-${i}`} className="h-16 border-b border-r border-br/50" />
        ))}
        {Array.from({ length: totalDays }).map((_, i) => {
          const day = i + 1
          const dow = (firstDow + i) % 7
          const weekend = dow === 0 || dow === 6

          if (mode === 'ng' && selectedDoctor) {
            const doctor = doctors.find(d => d.id === selectedDoctor)
            const isNg = doctor?.ngDays.includes(day)
            return (
              <button
                key={day}
                onClick={() => toggleNgDay(selectedDoctor, day)}
                className={`h-16 border-b border-r border-br/50 flex flex-col items-center justify-center gap-1 transition-colors ${
                  isNg ? 'bg-red-50' : weekend ? 'bg-blue-50/30' : ''
                }`}
              >
                <span className={`text-xs ${dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-tx'}`}>{day}</span>
                {isNg && <span className="text-[10px] text-red-500 font-bold">NG</span>}
              </button>
            )
          }

          // Result mode
          const assignedId = assignments[day]
          const assignedDoc = doctors.find(d => d.id === assignedId)
          const colorClass = assignedId ? doctorColorMap.get(assignedId) || '' : ''

          return (
            <div
              key={day}
              className={`h-16 border-b border-r border-br/50 flex flex-col items-center justify-center gap-0.5 relative ${
                weekend ? 'bg-blue-50/30' : ''
              } ${!isViewMode ? 'cursor-pointer hover:bg-s1/50' : ''}`}
              onClick={() => !isViewMode && setEditingDay(editingDay === day ? null : day)}
            >
              <span className={`text-[10px] ${dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-muted'}`}>{day}</span>
              {assignedDoc && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${colorClass}`}>
                  {assignedDoc.name.slice(0, 3)}
                </span>
              )}
              {/* Edit dropdown */}
              {editingDay === day && !isViewMode && (
                <div className="absolute top-full left-1/2 -translate-x-1/2 z-20 bg-s0 border border-br rounded-lg shadow-lg py-1 min-w-[100px]">
                  {doctors.map(d => (
                    <button
                      key={d.id}
                      onClick={(e) => { e.stopPropagation(); assignDay(day, d.id) }}
                      className="block w-full text-left px-3 py-1.5 text-xs hover:bg-acl transition-colors"
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )

  // ─── Step: Setup ───
  if (step === 'setup') return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <Breadcrumb />
      <h1 className="text-2xl font-bold text-tx mb-1">当直シフト作成</h1>
      <p className="text-sm text-muted mb-6">ブラウザ完結・登録不要・完全無料</p>
      {renderStepIndicator()}

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-tx block mb-1.5">グループ名</label>
          <input
            type="text"
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="例: 内科病棟A"
            className="w-full border border-br rounded-lg px-3 py-2.5 text-sm bg-s0 text-tx outline-none focus:border-ac/40"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-tx block mb-1.5">年</label>
            <select value={year} onChange={e => setYear(Number(e.target.value))} className="w-full border border-br rounded-lg px-3 py-2.5 text-sm bg-s0 text-tx outline-none focus:border-ac/40">
              {[2025, 2026, 2027].map(y => <option key={y} value={y}>{y}年</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-tx block mb-1.5">月</label>
            <select value={month} onChange={e => setMonth(Number(e.target.value))} className="w-full border border-br rounded-lg px-3 py-2.5 text-sm bg-s0 text-tx outline-none focus:border-ac/40">
              {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}月</option>)}
            </select>
          </div>
        </div>

        <button
          onClick={() => setStep('doctors')}
          disabled={!groupName.trim()}
          className="w-full bg-ac text-white py-3 rounded-xl font-bold text-sm hover:bg-ac2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          次へ →
        </button>
      </div>
    </main>
  )

  // ─── Step: Doctors ───
  if (step === 'doctors') return (
    <main className="max-w-lg mx-auto px-4 py-8">
      <Breadcrumb />
      <h1 className="text-2xl font-bold text-tx mb-1">当直シフト作成</h1>
      <p className="text-sm text-muted mb-6">{groupName} — {year}年{month}月</p>
      {renderStepIndicator()}

      <div className="space-y-4">
        <div>
          <label className="text-xs font-medium text-tx block mb-1.5">医師を追加</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newDoctorName}
              onChange={e => setNewDoctorName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addDoctor()}
              placeholder="名前を入力"
              className="flex-1 border border-br rounded-lg px-3 py-2.5 text-sm bg-s0 text-tx outline-none focus:border-ac/40"
            />
            <button
              onClick={addDoctor}
              disabled={!newDoctorName.trim()}
              className="bg-ac text-white px-4 rounded-lg text-sm font-bold hover:bg-ac2 transition-colors disabled:opacity-40"
            >
              追加
            </button>
          </div>
        </div>

        {doctors.length > 0 && (
          <div className="space-y-2">
            {doctors.map((d, i) => (
              <div key={d.id} className="flex items-center gap-3 bg-s0 border border-br rounded-lg px-3 py-2.5">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${DOCTOR_COLORS[i % DOCTOR_COLORS.length]}`}>
                  {d.name[0]}
                </span>
                <span className="text-sm font-medium text-tx flex-1">{d.name}</span>
                <button onClick={() => removeDoctor(d.id)} className="text-muted hover:text-red-500 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => setStep('setup')} className="flex-1 border border-br text-muted py-3 rounded-xl font-bold text-sm hover:bg-s1 transition-colors">
            ← 戻る
          </button>
          <button
            onClick={() => setStep('preferences')}
            disabled={doctors.length < 2}
            className="flex-1 bg-ac text-white py-3 rounded-xl font-bold text-sm hover:bg-ac2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            次へ →
          </button>
        </div>
        {doctors.length < 2 && doctors.length > 0 && (
          <p className="text-[11px] text-muted text-center">2名以上で次へ進めます</p>
        )}
      </div>
    </main>
  )

  // ─── Step: Preferences (NG days) ───
  if (step === 'preferences') {
    const currentDocId = selectedDocId || doctors[0]?.id || ''

    return (
      <main className="max-w-2xl mx-auto px-4 py-8">
        <Breadcrumb />
        <h1 className="text-2xl font-bold text-tx mb-1">当直シフト作成</h1>
        <p className="text-sm text-muted mb-6">{groupName} — {year}年{month}月</p>
        {renderStepIndicator()}

        {/* Doctor selector */}
        <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
          {doctors.map((d, i) => (
            <button
              key={d.id}
              onClick={() => setSelectedDocId(d.id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                currentDocId === d.id
                  ? 'bg-ac text-white'
                  : 'bg-s0 border border-br text-muted hover:border-ac/20'
              }`}
            >
              {d.name}
              {d.ngDays.length > 0 && (
                <span className={`text-[9px] px-1 rounded ${currentDocId === d.id ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>
                  NG:{d.ngDays.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <p className="text-xs text-muted mb-3">カレンダーをタップしてNG日を指定してください。</p>

        {renderCalendar('ng', currentDocId)}

        <div className="flex gap-2 mt-6">
          <button onClick={() => setStep('doctors')} className="flex-1 border border-br text-muted py-3 rounded-xl font-bold text-sm hover:bg-s1 transition-colors">
            ← 戻る
          </button>
          <button
            onClick={handleGenerate}
            className="flex-1 bg-ac text-white py-3 rounded-xl font-bold text-sm hover:bg-ac2 transition-colors"
          >
            シフト自動生成 →
          </button>
        </div>
      </main>
    )
  }

  // ─── Step: Result ───
  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      {/* Print header (hidden on screen) */}
      <div className="hidden print:block mb-4">
        <h1 className="text-xl font-bold">{groupName} — {year}年{month}月 当直シフト</h1>
      </div>

      <div className="print:hidden">
        <Breadcrumb />
        <h1 className="text-2xl font-bold text-tx mb-1">当直シフト作成</h1>
        <p className="text-sm text-muted mb-6">{groupName} — {year}年{month}月</p>
        {!isViewMode && renderStepIndicator()}
      </div>

      {/* Calendar */}
      {renderCalendar('result')}

      {/* Stats */}
      <div className="mt-4 bg-s0 border border-br rounded-xl p-4">
        <h3 className="text-xs font-bold text-tx mb-2">担当回数</h3>
        <div className="flex flex-wrap gap-2">
          {doctors.map(d => (
            <div key={d.id} className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-bold ${doctorColorMap.get(d.id)}`}>
              <span>{d.name}</span>
              <span className="opacity-60">×{shiftCounts.get(d.id) || 0}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="mt-4 flex flex-wrap gap-2 print:hidden">
        {!isViewMode && (
          <>
            <button onClick={handleRegenerate} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-br bg-s0 text-sm font-bold text-tx hover:border-ac/30 transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 4v6h6" /><path d="M23 20v-6h-6" />
                <path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15" />
              </svg>
              再生成
            </button>
            <button onClick={() => setStep('preferences')} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-br bg-s0 text-sm font-bold text-tx hover:border-ac/30 transition-colors">
              ← NG日を修正
            </button>
          </>
        )}
        <button onClick={handleShare} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-ac text-white text-sm font-bold hover:bg-ac2 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <path d="M8.59 13.51l6.83 3.98M15.41 6.51l-6.82 3.98" />
          </svg>
          {copied ? 'コピーしました！' : '共有リンクをコピー'}
        </button>
        <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl border border-br bg-s0 text-sm font-bold text-tx hover:border-ac/30 transition-colors">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 9V2h12v7" /><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          印刷
        </button>
      </div>

      {/* iwor CTA (shown especially in view mode) */}
      <div className={`mt-8 bg-acl border border-ac/15 rounded-xl p-4 text-center print:hidden ${isViewMode ? '' : 'opacity-70'}`}>
        <p className="text-xs text-ac font-bold mb-1">iwor — 医師のためのワークスペース</p>
        <p className="text-[11px] text-muted mb-3">臨床ツール166種、フラッシュカード、論文フィード、マネーツール。すべて無料。</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 bg-ac text-white px-5 py-2 rounded-lg text-xs font-bold hover:bg-ac2 transition-colors"
        >
          iworを使ってみる →
        </Link>
      </div>

      {/* View mode notice */}
      {isViewMode && (
        <div className="mt-4 text-center print:hidden">
          <Link href="/shift" className="text-xs text-ac font-medium hover:underline">
            自分もシフトを作成する →
          </Link>
        </div>
      )}
    </main>
  )
}

// ─── Breadcrumb ───
function Breadcrumb() {
  return (
    <nav className="flex items-center gap-2 mb-4 text-xs text-muted print:hidden">
      <Link href="/" className="hover:text-ac transition-colors">ホーム</Link>
      <span>›</span>
      <span className="text-tx font-medium">当直シフト作成</span>
    </nav>
  )
}
