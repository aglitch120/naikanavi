'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'

// ─── Types ───

// 当直カテゴリ（admin が自由に追加可能）
interface DutyCategory {
  id: string
  name: string        // 例: "救急", "病棟"
  color: string       // Tailwind color class
}

// スロット設定: カテゴリ × 日タイプ（平日当直/休日日直/休日当直）ごとの有効/人数
interface SlotConfig {
  dutyType: string    // weekday_night | holiday_day | holiday_night
  categoryId: string  // DutyCategoryのid
  enabled: boolean
  required: number    // 必要人数
}

// 各日のスロット定義
interface SlotDef {
  day: number
  dutyType: string    // "weekday_night" | "holiday_day" | "holiday_night"
  categoryId: string  // DutyCategoryのid
  required: number    // 必要人数
}

interface Doctor {
  id: string
  name: string
  ngDays: number[]
  maxShifts?: number
  weight: number       // 勤務量ウェイト 0.5(少なめ)〜1.0(標準)〜1.5(多め)
  minInterval: number  // 最小間隔（日）デフォルト2
  categoryIds: string[] // 担当可能カテゴリ（空=全て）
}

// assignment key = "day-dutyType-categoryId"
interface ShiftData {
  groupName: string
  year: number
  month: number
  doctors: Doctor[]
  categories: DutyCategory[]
  slotConfigs: SlotConfig[]
  saturdayMode?: SaturdayMode
  assignments: Record<string, string[]>  // key -> [doctorId, ...] (複数人対応)
  slotsPerDay: number
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

// 日本の祝日（簡易版 2025-2027）
const HOLIDAYS: Record<string, string> = {
  '2026-01-01': '元日', '2026-01-12': '成人の日', '2026-02-11': '建国記念の日', '2026-02-23': '天皇誕生日',
  '2026-03-20': '春分の日', '2026-04-29': '昭和の日', '2026-05-03': '憲法記念日', '2026-05-04': 'みどりの日',
  '2026-05-05': 'こどもの日', '2026-05-06': '振替休日', '2026-07-20': '海の日', '2026-08-11': '山の日',
  '2026-09-21': '敬老の日', '2026-09-23': '秋分の日', '2026-10-12': 'スポーツの日', '2026-11-03': '文化の日',
  '2026-11-23': '勤労感謝の日', '2027-01-01': '元日', '2027-01-11': '成人の日', '2027-02-11': '建国記念の日',
  '2027-02-23': '天皇誕生日', '2027-03-21': '春分の日', '2027-04-29': '昭和の日', '2027-05-03': '憲法記念日',
  '2027-05-04': 'みどりの日', '2027-05-05': 'こどもの日', '2027-07-19': '海の日', '2027-08-11': '山の日',
  '2027-09-20': '敬老の日', '2027-09-23': '秋分の日', '2027-10-11': 'スポーツの日', '2027-11-03': '文化の日',
  '2027-11-23': '勤労感謝の日',
}

function isHoliday(year: number, month: number, day: number): string | null {
  const key = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
  return HOLIDAYS[key] || null
}

type SaturdayMode = 'holiday' | 'weekday' | 'half'  // 休日扱い / 平日扱い / 半日（日直のみ）

function isHolidayOrWeekend(year: number, month: number, day: number, satMode: SaturdayMode = 'holiday'): boolean {
  const dow = new Date(year, month - 1, day).getDay()
  if (dow === 0) return true // 日曜は常に休日
  if (dow === 6) { // 土曜
    if (satMode === 'weekday') return false
    return true // holiday or half → 休日扱い
  }
  return !!isHoliday(year, month, day)
}

function isSaturday(year: number, month: number, day: number): boolean {
  return new Date(year, month - 1, day).getDay() === 6
}

// 月のスロット定義を生成（slotConfigsベース）
function generateSlots(year: number, month: number, configs: SlotConfig[], satMode: SaturdayMode = 'holiday'): SlotDef[] {
  const totalDays = getDaysInMonth(year, month)
  const slots: SlotDef[] = []
  for (let day = 1; day <= totalDays; day++) {
    const holiday = isHolidayOrWeekend(year, month, day, satMode)
    for (const cfg of configs) {
      if (!cfg.enabled) continue
      // 平日の日に休日スロットは不要、逆も然り
      if (!holiday && cfg.dutyType !== 'weekday_night') continue
      if (holiday && cfg.dutyType === 'weekday_night') continue
      slots.push({ day, dutyType: cfg.dutyType, categoryId: cfg.categoryId, required: cfg.required })
    }
  }
  return slots
}

function slotKey(day: number, dutyType: string, categoryId: string): string {
  return `${day}-${dutyType}-${categoryId}`
}

const DEFAULT_CATEGORIES: DutyCategory[] = [
  { id: 'er', name: '救急', color: 'bg-red-100 text-red-700 border-red-200' },
  { id: 'ward', name: '病棟', color: 'bg-blue-100 text-blue-700 border-blue-200' },
]

const DUTY_TYPES = [
  { id: 'weekday_night', label: '平日当直', when: 'weekday' },
  { id: 'holiday_day', label: '休日日直', when: 'holiday' },
  { id: 'holiday_night', label: '休日当直', when: 'holiday' },
  { id: 'holiday_daynight', label: '休日日当直（24h通し）', when: 'holiday' },
] as const

const DUTY_TYPE_LABELS: Record<string, string> = {
  weekday_night: '平日当直',
  holiday_day: '休日日直',
  holiday_night: '休日当直',
  holiday_daynight: '休日日当直',
}

function buildDefaultSlotConfigs(categories: DutyCategory[]): SlotConfig[] {
  const configs: SlotConfig[] = []
  for (const cat of categories) {
    for (const dt of DUTY_TYPES) {
      // 日当直はデフォルト無効（日直+当直の分離が一般的）
      const enabled = dt.id !== 'holiday_daynight'
      configs.push({ dutyType: dt.id, categoryId: cat.id, enabled, required: 1 })
    }
  }
  return configs
}

// スロット表示名: "平日救急当直" "休日病棟日直" "休日救急日当直" 等
function slotDisplayName(dutyType: string, categoryName: string): string {
  const prefix = dutyType === 'weekday_night' ? '平日' : '休日'
  const suffix = dutyType === 'holiday_day' ? '日直' : dutyType === 'holiday_daynight' ? '日当直' : '当直'
  return `${prefix}${categoryName}${suffix}`
}

const DUTY_TYPE_COLORS: Record<string, string> = {
  weekday_night: 'bg-indigo-100 text-indigo-700',
  holiday_day: 'bg-amber-100 text-amber-700',
  holiday_night: 'bg-purple-100 text-purple-700',
}
const API = process.env.NEXT_PUBLIC_API_URL || 'https://iwor-api.mightyaddnine.workers.dev'

function generateId() {
  return Math.random().toString(36).slice(2, 8)
}

// ─── Auto-assign algorithm ───
// 制約: NG日回避, 連日回避, 同一週2回回避, 均等分配
function autoAssign(data: ShiftData): Record<string, string[]> {
  const { year, month, doctors, slotConfigs } = data
  const slots = generateSlots(year, month, slotConfigs, data.saturdayMode)
  const assignments: Record<string, string[]> = {}

  if (doctors.length === 0) return assignments

  const ngSets = new Map<string, Set<number>>()
  doctors.forEach(d => ngSets.set(d.id, new Set(d.ngDays)))

  // Track: total count, last assigned day, weekly counts
  const counts = new Map<string, number>()
  const lastDay = new Map<string, number>()
  const weekCounts = new Map<string, Map<number, number>>() // doctorId -> weekNum -> count
  doctors.forEach(d => {
    counts.set(d.id, 0)
    lastDay.set(d.id, -10)
    weekCounts.set(d.id, new Map())
  })

  function getWeek(day: number): number {
    return Math.ceil(day / 7)
  }

  function getWeekCount(docId: string, week: number): number {
    return weekCounts.get(docId)?.get(week) || 0
  }

  // Sort slots by day
  const sortedSlots = [...slots].sort((a, b) => a.day - b.day || a.dutyType.localeCompare(b.dutyType))

  for (const slot of sortedSlots) {
    const key = slotKey(slot.day, slot.dutyType, slot.categoryId)
    const needed = slot.required
    const assigned: string[] = []

    for (let n = 0; n < needed; n++) {
      // 同日に既に割り当てられた医師（日当直は同日の他スロットと排他）
      const sameDayAssigned = new Set<string>()
      Object.entries(assignments).forEach(([k, ids]) => {
        if (k.startsWith(`${slot.day}-`)) ids.forEach(id => sameDayAssigned.add(id))
      })

      const eligible = doctors.filter(d => {
        if (ngSets.get(d.id)?.has(slot.day)) return false
        if (assigned.includes(d.id)) return false
        // 日当直の排他: 日当直が入っている日に他スロットは入れない
        if (sameDayAssigned.has(d.id)) {
          const dayNightKey = Object.keys(assignments).find(k => k.startsWith(`${slot.day}-holiday_daynight`) && assignments[k]?.includes(d.id))
          if (dayNightKey) return false
        }
        // この枠が日当直なら、同日に既に入っている人は除外
        if (slot.dutyType === 'holiday_daynight' && sameDayAssigned.has(d.id)) return false
        // カテゴリ制限チェック
        if (d.categoryIds.length > 0 && !d.categoryIds.includes(slot.categoryId)) return false
        // 最小間隔チェック
        const gap = slot.day - (lastDay.get(d.id) || -100)
        if (gap < (d.minInterval || 2)) return false
        return true
      })

      const week = getWeek(slot.day)
      // eligible が0なら間隔制約を緩和してフォールバック
      const pool = eligible.length > 0 ? eligible : doctors.filter(d => !ngSets.get(d.id)?.has(slot.day) && !assigned.includes(d.id) && (d.categoryIds.length === 0 || d.categoryIds.includes(slot.categoryId)))
      const finalPool = pool.length > 0 ? pool : doctors.filter(d => !assigned.includes(d.id))

      const sorted = finalPool.sort((a, b) => {
        // 同一週2回回避
        const wA = getWeekCount(a.id, week), wB = getWeekCount(b.id, week)
        if (wA !== wB) return wA - wB
        // ウェイト考慮の均等分配: count / weight が小さい方を優先
        const wCountA = (counts.get(a.id) || 0) / (a.weight || 1)
        const wCountB = (counts.get(b.id) || 0) / (b.weight || 1)
        if (Math.abs(wCountA - wCountB) > 0.1) return wCountA - wCountB
        // 間隔が大きい方を優先
        const gapA = slot.day - (lastDay.get(a.id) || -100)
        const gapB = slot.day - (lastDay.get(b.id) || -100)
        return gapB - gapA
      })

      if (sorted.length > 0) {
        const doc = sorted[0]
        assigned.push(doc.id)
        const increment = slot.dutyType === 'holiday_daynight' ? 2 : 1 // 日当直は2コマ分
        counts.set(doc.id, (counts.get(doc.id) || 0) + increment)
        lastDay.set(doc.id, slot.day)
        const wm = weekCounts.get(doc.id)!
        wm.set(week, (wm.get(week) || 0) + increment)
      }
    }
    assignments[key] = assigned
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
    c: data.categories,
    sc: data.slotConfigs,
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
        id: d.i, name: d.n, ngDays: d.ng, weight: 1.0, minInterval: 2, categoryIds: [],
      })),
      categories: slim.c || DEFAULT_CATEGORIES,
      slotConfigs: slim.sc || buildDefaultSlotConfigs(slim.c || DEFAULT_CATEGORIES),
      assignments: slim.a || {},
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
type Step = 'setup' | 'config' | 'doctors' | 'preferences' | 'result'

const DRAFT_KEY = 'iwor_shift_draft'

function saveDraft(data: any) {
  try { localStorage.setItem(DRAFT_KEY, JSON.stringify(data)) } catch {}
}
function loadDraft(): any {
  try { const raw = localStorage.getItem(DRAFT_KEY); return raw ? JSON.parse(raw) : null } catch { return null }
}
function clearDraft() {
  try { localStorage.removeItem(DRAFT_KEY) } catch {}
}

export default function ShiftPage() {
  const [step, _setStep] = useState<Step>('setup')
  const setStep = (s: Step) => { _setStep(s); window.scrollTo(0, 0) }
  const [groupName, setGroupName] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [month, setMonth] = useState(new Date().getMonth() + 2 > 12 ? 1 : new Date().getMonth() + 2)
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [categories, setCategories] = useState<DutyCategory[]>(DEFAULT_CATEGORIES)
  const [slotConfigs, setSlotConfigs] = useState<SlotConfig[]>(buildDefaultSlotConfigs(DEFAULT_CATEGORIES))
  const [hasDraft, setHasDraft] = useState(false)
  const [newDoctorName, setNewDoctorName] = useState('')
  const [assignments, setAssignments] = useState<Record<string, string[]>>({})
  const [editingDay, setEditingDay] = useState<number | null>(null)
  const [isViewMode, setIsViewMode] = useState(false)
  const [shareUrl, setShareUrl] = useState('')
  const [copied, setCopied] = useState(false)
  const [selectedDocId, setSelectedDocId] = useState('')
  const [defaultMinInterval, setDefaultMinInterval] = useState(2)
  const [saturdayMode, setSaturdayMode] = useState<SaturdayMode>('holiday')
  const [surveyPassword, setSurveyPassword] = useState('')
  const [surveyUrls, setSurveyUrls] = useState<{ doctorId: string; name: string; url: string }[]>([])
  const [surveyId, setSurveyId] = useState('')
  const [surveyCopied, setSurveyCopied] = useState('')
  const [surveyLoading, setSurveyLoading] = useState(false)

  // Check URL for shared data, admin recovery, or draft on mount
  useEffect(() => {
    // URLパラメータからadmin surveyId復元（キャッシュクリア対策）
    const params = new URLSearchParams(window.location.search)
    const adminSurveyId = params.get('admin')
    if (adminSurveyId) {
      // KVからsurvey情報を取得して復元
      fetch(`${API}/api/shift/survey/results`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ surveyId: adminSurveyId }),
      }).then(r => r.json()).then(data => {
        if (data.ok && data.survey) {
          const s = data.survey
          setGroupName(s.groupName || '')
          setYear(s.year || year)
          setMonth(s.month || month)
          setSurveyId(adminSurveyId)
          const docs = (s.doctors || []).map((d: any) => ({
            id: d.id, name: d.name, ngDays: s.responses?.[d.id]?.ngDays || [],
            weight: 1.0, minInterval: 2, categoryIds: [],
          }))
          setDoctors(docs)
          // URLリスト復元
          const urls = (s.doctors || []).map((d: any) => ({
            doctorId: d.id, name: d.name,
            url: `${window.location.origin}/shift/survey?id=${adminSurveyId}&token=${d.token || ''}`,
          }))
          setSurveyUrls(urls)
          setStep('doctors')
        }
      }).catch(() => {})
      return
    }

    // ドラフト復元チェック
    const draft = loadDraft()
    if (draft && !window.location.hash.slice(1)) {
      setHasDraft(true)
    }

    const hash = window.location.hash.slice(1)
    if (hash) {
      const data = decompressData(hash)
      if (data) {
        setGroupName(data.groupName)
        setYear(data.year)
        setMonth(data.month)
        setDoctors(data.doctors)
        if (data.categories) setCategories(data.categories)
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
    Object.values(assignments).forEach(ids => {
      if (Array.isArray(ids)) ids.forEach(id => counts.set(id, (counts.get(id) || 0) + 1))
    })
    return counts
  }, [assignments, doctors])

  // ─── Handlers ───
  const addDoctor = () => {
    const name = newDoctorName.trim()
    if (!name) return
    setDoctors(prev => [...prev, { id: generateId(), name, ngDays: [], weight: 1.0, minInterval: defaultMinInterval, categoryIds: [] }])
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
    const data: ShiftData = { groupName, year, month, doctors, categories, slotConfigs, saturdayMode, assignments: {}, slotsPerDay: 1 }
    const result = autoAssign(data)
    setAssignments(result)
    setStep('result')
    clearDraft() // 生成完了→ドラフト削除
  }

  const handleRegenerate = () => {
    const data: ShiftData = { groupName, year, month, doctors, categories, slotConfigs, saturdayMode, assignments: {}, slotsPerDay: 1 }
    setAssignments(autoAssign(data))
  }

  const handleShare = () => {
    const data: ShiftData = { groupName, year, month, doctors, categories, slotConfigs, saturdayMode, assignments, slotsPerDay: 1 }
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
      { key: 'config', label: '詳細設定' },
      { key: 'doctors', label: '医師登録' },
      { key: 'preferences', label: 'NG日' },
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

          // Result mode — 全スロットの割り当てを表示
          const daySlotKeys = Object.keys(assignments).filter(k => k.startsWith(`${day}-`))
          const dayAssigned = daySlotKeys.flatMap(k => (assignments[k] || []).map(id => ({ key: k, id })))
          const firstAssigned = dayAssigned[0]
          const firstDoc = firstAssigned ? doctors.find(d => d.id === firstAssigned.id) : null
          const colorClass = firstAssigned ? doctorColorMap.get(firstAssigned.id) || '' : ''

          return (
            <div
              key={day}
              className={`h-16 border-b border-r border-br/50 flex flex-col items-center justify-center gap-0.5 relative ${
                weekend ? 'bg-blue-50/30' : ''
              } ${!isViewMode ? 'cursor-pointer hover:bg-s1/50' : ''}`}
              onClick={() => !isViewMode && setEditingDay(editingDay === day ? null : day)}
            >
              <span className={`text-[10px] ${dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-muted'}`}>{day}</span>
              {firstDoc && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${colorClass}`}>
                  {firstDoc.name.slice(0, 3)}
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
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumb />
      <h1 className="text-2xl font-bold text-tx mb-1">当直シフト作成</h1>
      <p className="text-sm text-muted mb-2">ブラウザ完結・登録不要・完全無料</p>
      <div className="bg-s1 rounded-lg p-2.5 mb-6 text-[10px] text-muted leading-relaxed space-y-0.5">
        <p>🔒 データはお使いの端末にのみ保存され、サーバーには送信されません。</p>
        <p>💡 病院名・医師名が気になる場合はイニシャルや略称でもOKです。</p>
      </div>

      {/* ドラフト復元バナー */}
      {hasDraft && (
        <div className="bg-acl border border-ac/20 rounded-xl p-4 mb-4">
          <p className="text-xs font-bold text-ac mb-1">作成中のシフトがあります</p>
          <p className="text-[10px] text-muted mb-2">アンケート回答待ちの状態から再開できます</p>
          <div className="flex gap-2">
            <button onClick={() => {
              const draft = loadDraft()
              if (draft) {
                setGroupName(draft.groupName || '')
                setYear(draft.year || year)
                setMonth(draft.month || month)
                setDoctors((draft.doctors || []).map((d: any) => ({ ...d, ngDays: d.ngDays || [] })))
                if (draft.categories) setCategories(draft.categories)
                if (draft.slotConfigs) setSlotConfigs(draft.slotConfigs)
                if (draft.saturdayMode) setSaturdayMode(draft.saturdayMode)
                if (draft.defaultMinInterval) setDefaultMinInterval(draft.defaultMinInterval)
                if (draft.surveyId) setSurveyId(draft.surveyId)
                if (draft.surveyUrls) setSurveyUrls(draft.surveyUrls)
                if (draft.surveyPassword) setSurveyPassword(draft.surveyPassword)
                setStep('doctors')
                setHasDraft(false)
              }
            }}
              className="flex-1 py-2 rounded-lg text-xs font-bold text-white" style={{ background: '#1B4F3A' }}>
              再開する
            </button>
            <button onClick={() => { clearDraft(); setHasDraft(false) }}
              className="px-4 py-2 rounded-lg text-xs font-medium border border-br text-muted">
              破棄
            </button>
          </div>
        </div>
      )}

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
          onClick={() => setStep('config')}
          disabled={!groupName.trim()}
          className="w-full bg-ac text-white py-3 rounded-xl font-bold text-sm hover:bg-ac2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          次へ →
        </button>
      </div>
    </main>
  )

  // ─── Step: Config (詳細設定) ───
  if (step === 'config') return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <Breadcrumb />
      <h1 className="text-2xl font-bold text-tx mb-1">当直シフト作成</h1>
      <p className="text-sm text-muted mb-6">{groupName} — {year}年{month}月</p>
      {renderStepIndicator()}

      <div className="space-y-5">
        {/* ① 当直カテゴリ定義 */}
        <div>
          <label className="text-xs font-bold text-tx block mb-2">① 当直カテゴリ</label>
          <p className="text-[10px] text-muted mb-2">病院にある当直の種類を設定してください</p>
          <div className="space-y-2">
            {categories.map(cat => (
              <div key={cat.id} className="flex items-center gap-2 bg-s0 border border-br rounded-lg px-3 py-2.5">
                <span className={`w-3 h-3 rounded-full ${cat.color.split(' ')[0]}`} />
                <span className="text-sm text-tx flex-1">{cat.name}</span>
                {categories.length > 1 && (
                  <button onClick={() => {
                    setCategories(prev => prev.filter(c => c.id !== cat.id))
                    setSlotConfigs(prev => prev.filter(s => s.categoryId !== cat.id))
                  }} className="text-[10px] text-muted hover:text-red-500">削除</button>
                )}
              </div>
            ))}
            <button onClick={() => {
              const name = prompt('カテゴリ名（例: ICU、外来、産科）')
              if (name) {
                const id = generateId()
                setCategories(prev => [...prev, { id, name, color: 'bg-teal-100 text-teal-700 border-teal-200' }])
                // 新カテゴリの全日タイプを追加
                setSlotConfigs(prev => [...prev,
                  { dutyType: 'weekday_night', categoryId: id, enabled: true, required: 1 },
                  { dutyType: 'holiday_day', categoryId: id, enabled: true, required: 1 },
                  { dutyType: 'holiday_night', categoryId: id, enabled: true, required: 1 },
                ])
              }
            }} className="text-[11px] text-ac hover:underline">+ カテゴリを追加</button>
          </div>
        </div>

        {/* ② スロット設定（カテゴリ×日タイプ） */}
        <div>
          <label className="text-xs font-bold text-tx block mb-2">② スロット設定</label>
          <p className="text-[10px] text-muted mb-2">各カテゴリが平日・休日のどこに該当するか、必要人数を設定</p>
          <div className="bg-s0 border border-br rounded-xl overflow-hidden">
            {/* ヘッダー */}
            <div className="grid grid-cols-4 gap-px bg-s1 border-b border-br text-center">
              <div className="py-2 text-[10px] font-bold text-muted">スロット</div>
              <div className="py-2 text-[10px] font-bold text-muted">有効</div>
              <div className="py-2 text-[10px] font-bold text-muted">人数</div>
              <div className="py-2 text-[10px] font-bold text-muted">月合計</div>
            </div>
            {/* 各行 */}
            {categories.flatMap(cat =>
              DUTY_TYPES.map(dt => {
                const cfg = slotConfigs.find(s => s.categoryId === cat.id && s.dutyType === dt.id)
                if (!cfg) return null
                const totalDays = getDaysInMonth(year, month)
                let count = 0
                for (let d = 1; d <= totalDays; d++) {
                  const hol = isHolidayOrWeekend(year, month, d)
                  if (dt.id === 'weekday_night' && !hol) count++
                  if (dt.id !== 'weekday_night' && hol) count++
                }
                return (
                  <div key={`${cat.id}-${dt.id}`} className="grid grid-cols-4 gap-px border-b border-br/50 items-center">
                    <div className="px-2 py-2 text-[10px] text-tx">{slotDisplayName(dt.id, cat.name)}</div>
                    <div className="text-center">
                      <button onClick={() => setSlotConfigs(prev => prev.map(s =>
                        s.categoryId === cat.id && s.dutyType === dt.id ? { ...s, enabled: !s.enabled } : s
                      ))} className={`w-6 h-6 rounded border text-[10px] font-bold ${cfg.enabled ? 'bg-ac text-white border-ac' : 'border-br text-muted'}`}>
                        {cfg.enabled ? '✓' : '−'}
                      </button>
                    </div>
                    <div className="text-center">
                      <select value={cfg.required} disabled={!cfg.enabled} onChange={e => setSlotConfigs(prev => prev.map(s =>
                        s.categoryId === cat.id && s.dutyType === dt.id ? { ...s, required: parseInt(e.target.value) } : s
                      ))} className="text-[11px] border border-br rounded px-1 py-0.5 bg-bg disabled:opacity-30">
                        {[1,2,3].map(n => <option key={n} value={n}>{n}人</option>)}
                      </select>
                    </div>
                    <div className="text-center text-[10px] text-muted">{cfg.enabled ? count * cfg.required : 0}枠</div>
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* 土曜日の扱い */}
        <div>
          <label className="text-xs font-bold text-tx block mb-2">土曜日の扱い</label>
          <div className="flex gap-1.5">
            {([
              { v: 'holiday' as SaturdayMode, l: '休日扱い', sub: '日直+当直' },
              { v: 'half' as SaturdayMode, l: '日当直', sub: '24h通し' },
              { v: 'weekday' as SaturdayMode, l: '平日扱い', sub: '当直のみ' },
            ]).map(opt => (
              <button key={opt.v} onClick={() => setSaturdayMode(opt.v)}
                className={`flex-1 py-2 rounded-lg text-center border transition-all ${
                  saturdayMode === opt.v ? 'bg-ac text-white border-ac' : 'border-br text-muted'
                }`}>
                <span className="text-[11px] font-bold block">{opt.l}</span>
                <span className="text-[9px] opacity-70">{opt.sub}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ③ 最小間隔 */}
        <div>
          <label className="text-xs font-bold text-tx block mb-2">③ デフォルト最小間隔</label>
          <div className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map(n => (
              <button key={n} onClick={() => setDefaultMinInterval(n)}
                className={`flex-1 py-2 rounded-lg text-xs font-medium border transition-all ${
                  defaultMinInterval === n ? 'bg-ac text-white border-ac' : 'border-br text-muted'
                }`}>{n}日</button>
            ))}
          </div>
        </div>

        {/* スロット概要 */}
        <div className="bg-s1 rounded-xl p-3">
          <p className="text-[10px] font-bold text-tx mb-1">{month}月のスロット概要</p>
          {(() => {
            const totalSlots = slotConfigs.filter(s => s.enabled).reduce((sum, cfg) => {
              const totalDays = getDaysInMonth(year, month)
              let count = 0
              for (let d = 1; d <= totalDays; d++) {
                const hol = isHolidayOrWeekend(year, month, d)
                if (cfg.dutyType === 'weekday_night' && !hol) count++
                if (cfg.dutyType !== 'weekday_night' && hol) count++
              }
              return sum + count * cfg.required
            }, 0)
            return (
              <div className="text-[10px] text-muted">
                <p className="font-bold text-tx">合計 {totalSlots}枠（{slotConfigs.filter(s => s.enabled).length}種類のスロット）</p>
              </div>
            )
          })()}
        </div>

        <div className="flex gap-2">
          <button onClick={() => setStep('setup')} className="flex-1 border border-br text-muted py-3 rounded-xl font-bold text-sm hover:bg-s1 transition-colors">
            ← 戻る
          </button>
          <button onClick={() => setStep('doctors')}
            className="flex-1 bg-ac text-white py-3 rounded-xl font-bold text-sm hover:bg-ac2 transition-colors">
            次へ →
          </button>
        </div>
      </div>
    </main>
  )

  // ─── Step: Doctors ───
  if (step === 'doctors') return (
    <main className="max-w-4xl mx-auto px-4 py-8">
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
              <div key={d.id} className="bg-s0 border border-br rounded-lg px-3 py-2.5">
                <div className="flex items-center gap-3 mb-2">
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
                {/* 忙しさ5段階 */}
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-muted w-10">忙しさ:</span>
                  {[{v:0.6,l:'軽'},{v:0.8,l:'少'},{v:1.0,l:'標準'},{v:1.2,l:'多'},{v:1.5,l:'最多'}].map(({v,l}) => (
                    <button key={v} onClick={() => setDoctors(prev => prev.map(doc => doc.id === d.id ? { ...doc, weight: v } : doc))}
                      className={`flex-1 py-1 rounded text-[9px] font-medium border transition-all ${
                        d.weight === v ? 'bg-ac text-white border-ac' : 'border-br text-muted'
                      }`}>{l}</button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* パスワード設定（アンケートURL生成の前に） */}
        {doctors.length >= 2 && (
          <div className="bg-s0 border border-br rounded-xl p-4">
            <label className="text-[10px] text-muted block mb-1">アンケートのパスワード（任意）</label>
            <input type="text" value={surveyPassword} onChange={e => setSurveyPassword(e.target.value)}
              placeholder="設定しない場合は空欄"
              className="w-full px-3 py-2 border border-br rounded-lg text-xs bg-bg outline-none focus:border-ac" />
            <p className="text-[9px] text-muted mt-1">設定すると各医師がNG日回答時にパスワード入力が必要になります</p>
          </div>
        )}

        {/* NG日入力方法選択 */}
        {doctors.length >= 2 && (
          <div className="bg-s0 border border-br rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-tx">NG日の入力方法</p>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setStep('preferences')}
                className="p-3 rounded-xl border border-ac/30 bg-acl text-left hover:shadow-sm transition-all">
                <span className="text-lg block mb-1">✏️</span>
                <p className="text-xs font-bold text-ac">自分で全員分入力</p>
                <p className="text-[10px] text-muted">管理者がNG日を代理入力</p>
              </button>
              <button onClick={async () => {
                const deadline = new Date()
                deadline.setDate(deadline.getDate() + 7)
                const pw = surveyPassword || undefined
                setSurveyLoading(true)
                try {
                  const res = await fetch(`${API}/api/shift/survey`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      groupName, year, month,
                      doctors: doctors.map(d => ({ id: d.id, name: d.name })),
                      deadline: deadline.toISOString().split('T')[0],
                      password: pw,
                    }),
                  })
                  const data = await res.json()
                  if (data.ok) {
                    setSurveyId(data.surveyId)
                    if (data.urls) {
                      setSurveyUrls(data.urls)
                      // ドラフト保存（後日復帰用）
                      const draftData = {
                        step: 'doctors', groupName, year, month,
                        doctors: doctors.map(d => ({ id: d.id, name: d.name, weight: d.weight, minInterval: d.minInterval, categoryIds: d.categoryIds, ngDays: d.ngDays })),
                        categories, slotConfigs, saturdayMode, defaultMinInterval,
                        surveyId: data.surveyId, surveyUrls: data.urls, surveyPassword,
                      }
                      saveDraft(draftData)
                      // URLにsurveyIdを含める（キャッシュクリア対策）
                      const adminUrl = `${window.location.origin}/shift?admin=${data.surveyId}`
                      history.replaceState(null, '', `?admin=${data.surveyId}`)
                    }
                  }
                } catch {}
                setSurveyLoading(false)
              }}
                className="p-3 rounded-xl border border-br bg-white text-left hover:border-ac/20 hover:shadow-sm transition-all">
                <span className="text-lg block mb-1">{surveyLoading ? '⏳' : '📩'}</span>
                <p className="text-xs font-bold text-tx">{surveyLoading ? 'URL生成中...' : '各自に入力してもらう'}</p>
                <p className="text-[10px] text-muted">{surveyLoading ? '' : 'アンケートURLを共有'}</p>
              </button>
            </div>
            {/* 個別アンケートURL表示 */}
            {surveyUrls.length > 0 && (
              <div className="bg-acl border border-ac/20 rounded-xl p-3 space-y-2">
                <p className="text-sm font-bold text-ac mb-2">URLを配布しました。次のステップ:</p>
                <div className="space-y-1.5 mb-3">
                  {[
                    { step: '1', text: '下のURLを各医師にLINE・メール等で送信', done: false },
                    { step: '2', text: '全員の回答を待つ（期限: 7日後）', done: false },
                    { step: '3', text: 'このページに戻り「回答を取得」ボタンを押す', done: false },
                  ].map(s => (
                    <div key={s.step} className="flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-white" style={{ background: '#1B4F3A' }}>{s.step}</span>
                      <span className="text-[11px] text-tx">{s.text}</span>
                    </div>
                  ))}
                </div>
                <p className="text-[9px] text-muted">各URLは本人専用です。回答は1回限り。</p>
                <div className="space-y-1.5">
                  {surveyUrls.map(u => (
                    <div key={u.doctorId} className="flex items-center gap-2 bg-white rounded-lg px-2 py-1.5 border border-br">
                      <span className="text-[10px] font-bold text-tx w-16 truncate">{u.name}</span>
                      <input readOnly value={u.url} className="flex-1 text-[9px] bg-transparent truncate outline-none text-muted" />
                      <button onClick={() => { navigator.clipboard.writeText(u.url); setSurveyCopied(u.doctorId); setTimeout(() => setSurveyCopied(''), 2000) }}
                        className="text-[9px] font-bold px-2 py-1 rounded shrink-0" style={{ background: surveyCopied === u.doctorId ? '#166534' : '#1B4F3A', color: '#fff' }}>
                        {surveyCopied === u.doctorId ? '✓' : 'コピー'}
                      </button>
                    </div>
                  ))}
                </div>
                <button onClick={() => {
                  const text = surveyUrls.map(u => `${u.name}さん: ${u.url}`).join('\n')
                  navigator.clipboard.writeText(text)
                  setSurveyCopied('all'); setTimeout(() => setSurveyCopied(''), 2000)
                }}
                  className="w-full py-2 rounded-lg text-[11px] font-bold border border-ac/30 text-ac hover:bg-white transition-all">
                  {surveyCopied === 'all' ? '✓ コピー済み' : '全員分をまとめてコピー'}
                </button>
                <div className="bg-white/50 rounded-lg p-2 mt-1">
                  <p className="text-[9px] text-muted mb-1">管理者用復帰URL（ブックマーク推奨）:</p>
                  <div className="flex gap-1 items-center">
                    <input readOnly value={`${typeof window !== 'undefined' ? window.location.origin : ''}/shift?admin=${surveyId}`}
                      className="flex-1 text-[8px] bg-white border border-br rounded px-1.5 py-1 truncate" />
                    <button onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/shift?admin=${surveyId}`)
                      setSurveyCopied('admin'); setTimeout(() => setSurveyCopied(''), 2000)
                    }} className="text-[8px] font-bold px-2 py-1 rounded shrink-0" style={{ background: surveyCopied === 'admin' ? '#166534' : '#1B4F3A', color: '#fff' }}>
                      {surveyCopied === 'admin' ? '✓' : 'コピー'}
                    </button>
                  </div>
                  <p className="text-[8px] text-muted mt-0.5">⚠️ このURLをブックマークしておけば、ブラウザキャッシュクリアしても復帰できます</p>
                </div>
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 mt-2">
                  <p className="text-[11px] font-bold text-amber-800">全員の回答が揃ったら、このページに戻ってきてください</p>
                  <p className="text-[9px] text-amber-700 mt-0.5">上の管理者用復帰URLをブックマークしておくと安心です</p>
                </div>
                <button onClick={async () => {
                  setSurveyLoading(true)
                  try {
                    const res = await fetch(`${API}/api/shift/survey/results`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ surveyId, password: surveyPassword || undefined }),
                    })
                    const data = await res.json()
                    if (data.ok && data.survey) {
                      const responses = data.survey.responses || {}
                      const respondedIds = Object.keys(responses)
                      const notResponded = doctors.filter(d => !respondedIds.includes(d.id))
                      if (notResponded.length > 0) {
                        alert(`未回答者がいます: ${notResponded.map(d => d.name).join('、')}\n\n全員の回答を待ってから反映してください。`)
                        setSurveyLoading(false)
                        return
                      }
                      const updated = doctors.map(d => {
                        const resp = responses[d.id]
                        return resp ? { ...d, ngDays: resp.ngDays } : d
                      })
                      setDoctors(updated)
                      setStep('preferences')
                      clearDraft()
                    }
                  } catch {}
                  setSurveyLoading(false)
                }}
                  className="w-full mt-2 py-2.5 rounded-lg text-[11px] font-bold text-white transition-all" style={{ background: '#1B4F3A' }}>
                  {surveyLoading ? '確認中...' : '回答を取得してNG日に反映 →'}
                </button>
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2">
          <button onClick={() => setStep('config')} className="flex-1 border border-br text-muted py-3 rounded-xl font-bold text-sm hover:bg-s1 transition-colors">
            ← 戻る
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

      {/* スロット別リスト */}
      <div className="mt-4 bg-s0 border border-br rounded-xl p-4">
        <h3 className="text-xs font-bold text-tx mb-3">日別詳細</h3>
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => {
            const dayKeys = Object.keys(assignments).filter(k => k.startsWith(`${day}-`))
            if (dayKeys.length === 0) return null
            const dow = new Date(year, month - 1, day).getDay()
            const hol = isHoliday(year, month, day)
            return (
              <div key={day} className={`flex items-center gap-2 py-1.5 px-2 rounded text-[11px] ${isWeekend(year, month, day) || hol ? 'bg-blue-50/50' : ''}`}>
                <span className={`w-8 font-bold ${dow === 0 ? 'text-red-500' : dow === 6 ? 'text-blue-500' : 'text-tx'}`}>{day}日</span>
                <span className="text-[9px] text-muted w-4">{DAY_LABELS[dow]}</span>
                <div className="flex-1 flex flex-wrap gap-1">
                  {dayKeys.map(key => {
                    const parts = key.split('-')
                    const dutyType = parts[1]
                    const catId = parts.slice(2).join('-')
                    const cat = categories.find(c => c.id === catId)
                    const ids = assignments[key] || []
                    return ids.map((id, j) => {
                      const doc = doctors.find(d => d.id === id)
                      return (
                        <span key={`${key}-${j}`} className={`px-1.5 py-0.5 rounded text-[9px] font-medium border ${doctorColorMap.get(id) || 'bg-s1 text-muted border-br'}`}>
                          {DUTY_TYPE_LABELS[dutyType]?.replace('当直','').replace('日直','') || ''}{cat ? `${cat.name.replace('当直','')}` : ''} {doc?.name || '?'}
                        </span>
                      )
                    })
                  })}
                </div>
              </div>
            )
          })}
        </div>
      </div>

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
