'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import AppHeader from '@/components/AppHeader'
import ProModal from '@/components/pro/ProModal'
import { useProStatus } from '@/components/pro/useProStatus'
import { ALL_SPECIALTIES, getSpecialtyById, type CreditEntry, type UserCreditsData } from '@/lib/credits-data'
import {
  loadCreditsData, saveCreditsToLocal, saveCreditsToCloud,
} from '@/lib/josler-storage'

const C = {
  ac: '#1B4F3A', acl: '#E8F0EC', ac2: '#155230',
  bg: '#F5F4F0', s0: '#FEFEFC', s1: '#F0EDE7', s2: '#E8E5DF',
  br: '#DDD9D2', tx: '#1A1917', m: '#6B6760',
  ok: '#166534', wn: '#B45309',
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

// ── Ring Progress ──
function RingProgress({ value, max, size = 100, strokeWidth = 8, color = C.ac }: {
  value: number; max: number; size?: number; strokeWidth?: number; color?: string
}) {
  const r = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * r
  const pct = max > 0 ? Math.min(value / max, 1) : 0
  const offset = circumference * (1 - pct)

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={C.s2} strokeWidth={strokeWidth} />
      <circle cx={size / 2} cy={size / 2} r={r}
        fill="none" stroke={color} strokeWidth={strokeWidth}
        strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-500" />
    </svg>
  )
}

// ── Add Entry Modal ──
function AddEntryModal({ categories, onAdd, onClose }: {
  categories: { id: string; name: string }[]
  onAdd: (entry: Omit<CreditEntry, 'id'>) => void
  onClose: () => void
}) {
  const [categoryId, setCategoryId] = useState(categories[0]?.id || '')
  const [credits, setCredits] = useState('1')
  const [memo, setMemo] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const c = parseFloat(credits)
    if (!c || c <= 0) return
    onAdd({ categoryId, credits: c, memo, date })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl w-full max-w-md p-5 space-y-4" onClick={e => e.stopPropagation()}>
        <h3 className="text-base font-bold" style={{ color: C.tx }}>単位を追加</h3>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-medium" style={{ color: C.m }}>カテゴリ</label>
            <select value={categoryId} onChange={e => setCategoryId(e.target.value)}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm border"
              style={{ borderColor: C.br, color: C.tx }}>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium" style={{ color: C.m }}>単位数</label>
              <input type="number" step="0.5" min="0.5" value={credits}
                onChange={e => setCredits(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm border"
                style={{ borderColor: C.br, color: C.tx }} />
            </div>
            <div>
              <label className="text-xs font-medium" style={{ color: C.m }}>取得日</label>
              <input type="date" value={date} onChange={e => setDate(e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm border"
                style={{ borderColor: C.br, color: C.tx }} />
            </div>
          </div>
          <div>
            <label className="text-xs font-medium" style={{ color: C.m }}>メモ（任意）</label>
            <input type="text" value={memo} onChange={e => setMemo(e.target.value)}
              placeholder="第○回学術集会 等"
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm border"
              style={{ borderColor: C.br, color: C.tx }} />
          </div>
          <div className="flex gap-2 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-medium"
              style={{ color: C.m, background: C.s1 }}>
              キャンセル
            </button>
            <button type="submit"
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white"
              style={{ background: C.ac }}>
              追加
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function CreditsApp() {
  const { isPro } = useProStatus()
  const [data, setData] = useState<UserCreditsData>({
    selectedSpecialty: null,
    entries: [],
    targetDate: undefined,
  })
  const [loaded, setLoaded] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [showTargetInput, setShowTargetInput] = useState(false)
  const [showProModal, setShowProModal] = useState(false)
  const [actionCount, setActionCount] = useState(0)

  // Load data
  useEffect(() => {
    loadCreditsData().then(d => {
      setData(d)
      setLoaded(true)
    })
  }, [])

  // Save helper — FREE users can use but not persist
  const save = useCallback((newData: UserCreditsData) => {
    setData(newData)
    if (isPro) {
      saveCreditsToLocal(newData)
      saveCreditsToCloud(newData)
    } else {
      setActionCount(prev => {
        const next = prev + 1
        // 3回操作後にPRO保存を促す
        if (next === 3) setShowProModal(true)
        return next
      })
    }
  }, [isPro])

  const specialty = data.selectedSpecialty ? getSpecialtyById(data.selectedSpecialty) : null

  const totalCredits = useMemo(() => {
    return data.entries.reduce((sum, e) => sum + e.credits, 0)
  }, [data.entries])

  const creditsByCategory = useMemo(() => {
    const map: Record<string, number> = {}
    for (const e of data.entries) {
      map[e.categoryId] = (map[e.categoryId] || 0) + e.credits
    }
    return map
  }, [data.entries])

  const sortedEntries = useMemo(() => {
    return [...data.entries].sort((a, b) => b.date.localeCompare(a.date))
  }, [data.entries])

  const handleSelectSpecialty = (id: string) => {
    save({ ...data, selectedSpecialty: id || null })
  }

  const handleAddEntry = (entry: Omit<CreditEntry, 'id'>) => {
    const newEntry: CreditEntry = { ...entry, id: genId() }
    save({ ...data, entries: [...data.entries, newEntry] })
  }

  const handleDeleteEntry = (id: string) => {
    save({ ...data, entries: data.entries.filter(e => e.id !== id) })
  }

  const handleSetTargetDate = (date: string) => {
    save({ ...data, targetDate: date || undefined })
    setShowTargetInput(false)
  }

  // Days until target
  const daysUntilTarget = useMemo(() => {
    if (!data.targetDate) return null
    const target = new Date(data.targetDate + 'T00:00:00')
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
  }, [data.targetDate])

  const basicSpecs = ALL_SPECIALTIES.filter(s => s.type === 'basic')
  const subSpecs = ALL_SPECIALTIES.filter(s => s.type === 'subspecialty')

  if (!loaded) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-6">
        <AppHeader title="専門医単位" subtitle="専門医更新に必要な単位を管理" badge="PRO" />
        <div className="text-center py-20 text-sm" style={{ color: C.m }}>読み込み中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 pt-6 pb-32">
      <AppHeader title="専門医単位" subtitle="専門医更新に必要な単位を管理" badge="PRO" />

      <div>
        {/* ── 診療科選択 ── */}
        <div className="rounded-xl p-4 mb-4" style={{ background: C.s0, border: `1px solid ${C.br}` }}>
          <label className="text-xs font-medium mb-2 block" style={{ color: C.m }}>診療科を選択</label>
          <select
            value={data.selectedSpecialty || ''}
            onChange={e => handleSelectSpecialty(e.target.value)}
            className="w-full px-3 py-2.5 rounded-lg text-sm border appearance-none"
            style={{ borderColor: C.br, color: C.tx, background: 'white' }}
          >
            <option value="">-- 選択してください --</option>
            <optgroup label="基本領域（19科）">
              {basicSpecs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </optgroup>
            <optgroup label="サブスペシャリティ">
              {subSpecs.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </optgroup>
          </select>
        </div>

        {specialty && (
          <>
            {/* ── 概要パネル ── */}
            <div className="rounded-xl p-5 mb-4" style={{ background: C.s0, border: `1px solid ${C.br}` }}>
              <div className="flex items-center gap-5">
                <div className="relative flex-shrink-0">
                  <RingProgress value={totalCredits} max={specialty.requiredCredits} size={90} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-bold" style={{ color: C.tx }}>{totalCredits}</span>
                    <span className="text-[10px]" style={{ color: C.m }}>/ {specialty.requiredCredits}</span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-bold mb-1" style={{ color: C.tx }}>{specialty.name}</h2>
                  <p className="text-xs mb-1" style={{ color: C.m }}>{specialty.society}</p>
                  <p className="text-xs" style={{ color: C.m }}>
                    更新周期: {specialty.renewalYears}年 / 必要単位: {specialty.requiredCredits}単位
                  </p>
                  {totalCredits >= specialty.requiredCredits ? (
                    <p className="text-xs font-bold mt-1" style={{ color: C.ok }}>必要単位を達成しています</p>
                  ) : (
                    <p className="text-xs mt-1" style={{ color: C.wn }}>
                      残り {specialty.requiredCredits - totalCredits} 単位
                    </p>
                  )}
                </div>
              </div>

              {/* 更新期限 */}
              <div className="mt-3 pt-3" style={{ borderTop: `1px solid ${C.s2}` }}>
                {data.targetDate && daysUntilTarget !== null ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs" style={{ color: C.m }}>更新期限: {data.targetDate}</span>
                      <span className={`text-xs font-bold ml-2 ${daysUntilTarget <= 90 ? 'text-red-600' : ''}`}
                        style={daysUntilTarget > 90 ? { color: C.ac } : undefined}>
                        {daysUntilTarget > 0 ? `あと${daysUntilTarget}日` : '期限超過'}
                      </span>
                    </div>
                    <button onClick={() => setShowTargetInput(true)}
                      className="text-xs px-2 py-1 rounded" style={{ color: C.ac }}>変更</button>
                  </div>
                ) : showTargetInput ? (
                  <div className="flex items-center gap-2">
                    <input type="date" className="flex-1 px-2 py-1.5 rounded-lg text-sm border"
                      style={{ borderColor: C.br }}
                      onChange={e => handleSetTargetDate(e.target.value)} />
                    <button onClick={() => setShowTargetInput(false)}
                      className="text-xs px-2 py-1" style={{ color: C.m }}>取消</button>
                  </div>
                ) : (
                  <button onClick={() => setShowTargetInput(true)}
                    className="text-xs" style={{ color: C.ac }}>
                    + 更新期限を設定
                  </button>
                )}
              </div>
            </div>

            {/* ── カテゴリ別進捗 ── */}
            <div className="rounded-xl p-4 mb-4" style={{ background: C.s0, border: `1px solid ${C.br}` }}>
              <h3 className="text-sm font-bold mb-3" style={{ color: C.tx }}>カテゴリ別</h3>
              <div className="space-y-2.5">
                {specialty.categories.map(cat => {
                  const earned = creditsByCategory[cat.id] || 0
                  const barMax = cat.maxCredits || (cat.minCredits ? Math.max(cat.minCredits * 2, earned) : specialty.requiredCredits)
                  const pct = barMax > 0 ? Math.min((earned / barMax) * 100, 100) : 0
                  const metMin = cat.minCredits ? earned >= cat.minCredits : true
                  return (
                    <div key={cat.id}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs" style={{ color: C.tx }}>{cat.name}</span>
                        <span className="text-xs font-medium" style={{ color: C.m }}>
                          {earned}
                          {cat.minCredits ? ` (必須${cat.minCredits}+)` : ''}
                          {cat.maxCredits ? ` / 上限${cat.maxCredits}` : ''}
                        </span>
                      </div>
                      <div className="h-1.5 rounded-full overflow-hidden" style={{ background: C.s2 }}>
                        <div className="h-full rounded-full transition-all duration-300"
                          style={{ width: `${pct}%`, background: metMin ? C.ac : C.wn }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* ── 記録リスト ── */}
            <div className="rounded-xl p-4 mb-4" style={{ background: C.s0, border: `1px solid ${C.br}` }}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold" style={{ color: C.tx }}>
                  取得記録 ({data.entries.length})
                </h3>
                <button onClick={() => setShowAddModal(true)}
                  className="text-xs font-bold px-3 py-1.5 rounded-lg text-white"
                  style={{ background: C.ac }}>
                  + 追加
                </button>
              </div>
              {sortedEntries.length === 0 ? (
                <p className="text-xs text-center py-6" style={{ color: C.m }}>
                  まだ記録がありません。「+ 追加」から単位を記録しましょう。
                </p>
              ) : (
                <div className="space-y-2">
                  {sortedEntries.map(entry => {
                    const catName = specialty.categories.find(c => c.id === entry.categoryId)?.name || entry.categoryId
                    return (
                      <div key={entry.id} className="flex items-center gap-3 py-2 px-3 rounded-lg"
                        style={{ background: C.s1 }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium px-1.5 py-0.5 rounded"
                              style={{ background: C.acl, color: C.ac }}>{catName}</span>
                            <span className="text-sm font-bold" style={{ color: C.tx }}>
                              {entry.credits}単位
                            </span>
                          </div>
                          {entry.memo && (
                            <p className="text-xs mt-0.5 truncate" style={{ color: C.m }}>{entry.memo}</p>
                          )}
                        </div>
                        <span className="text-xs flex-shrink-0" style={{ color: C.m }}>{entry.date}</span>
                        <button onClick={() => handleDeleteEntry(entry.id)}
                          className="text-xs flex-shrink-0 p-1 rounded hover:bg-red-50"
                          style={{ color: '#DC2626' }}
                          aria-label="削除">
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M18 6L6 18M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* ── 学会要件参考 ── */}
            <div className="rounded-xl p-4 mb-4" style={{ background: C.acl, border: `1px solid ${C.ac}15` }}>
              <h3 className="text-sm font-bold mb-2" style={{ color: C.ac }}>学会要件（参考）</h3>
              <div className="text-xs space-y-1" style={{ color: C.tx }}>
                <p>学会: {specialty.society}</p>
                <p>必要単位: {specialty.requiredCredits}単位 / {specialty.renewalYears}年</p>
                {specialty.notes && (
                  <p style={{ color: C.m }}>{specialty.notes}</p>
                )}
                <a href={specialty.officialUrl} target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-1 underline" style={{ color: C.ac }}>
                  公式サイトで確認 →
                </a>
              </div>
              <p className="text-[10px] mt-3" style={{ color: C.m }}>
                ※ 本情報は参考値です。正確な要件は各学会公式サイトでご確認ください。
              </p>
            </div>
          </>
        )}

        {!specialty && (
          <div className="text-center py-16">
            <div className="text-4xl mb-3 opacity-30">🏥</div>
            <p className="text-sm" style={{ color: C.m }}>
              上のドロップダウンから診療科を選択してください
            </p>
          </div>
        )}

        {/* ── 免責 ── */}
        <div className="rounded-xl p-3 text-[10px] leading-relaxed" style={{ background: C.s1, color: C.m }}>
          本機能は専門医単位の自己管理を目的としています。
          各学会の正式な単位管理システムの代替ではありません。
          正確な要件・取得状況は各学会公式サイトでご確認ください。
        </div>
        {/* FREE user save hint */}
        {!isPro && actionCount >= 3 && (
          <div className="rounded-xl p-4 mb-4 text-center" style={{ background: C.acl, border: `1px solid ${C.ac}20` }}>
            <p className="text-sm font-bold" style={{ color: C.ac }}>データを保存するにはPRO会員登録が必要です</p>
            <p className="text-xs mt-1" style={{ color: C.m }}>現在の入力はブラウザを閉じると失われます</p>
            <button onClick={() => setShowProModal(true)}
              className="mt-2 px-4 py-2 rounded-xl text-xs font-bold text-white"
              style={{ background: C.ac }}>
              PRO会員について詳しく見る
            </button>
          </div>
        )}
      </div>

      {/* ── Add Modal ── */}
      {showAddModal && specialty && (
        <AddEntryModal
          categories={specialty.categories}
          onAdd={handleAddEntry}
          onClose={() => setShowAddModal(false)}
        />
      )}

      {/* ── PRO Modal ── */}
      {showProModal && (
        <ProModal feature="save" onClose={() => setShowProModal(false)} />
      )}

      {/* ── Sticky bottom banner ── */}
      {specialty && (
        <div className="fixed left-0 right-0 px-4 z-40" style={{ bottom: '56px' }}>
          <div className="max-w-2xl mx-auto">
            <button
              onClick={() => setShowAddModal(true)}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg"
              style={{ background: C.ac }}
            >
              + 単位を追加
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
