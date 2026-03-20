'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Hospital, HOSPITALS, REGIONS, ALL_SPECIALTIES,
  BUSYNESS_LABELS, ER_TYPES, SALARY_RANGES, MATCH_RATE_RANGES,
} from './hospitals-data'
import { calculateMatchProbability, MatchProbabilityResult } from './match-calc'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

// ── localStorage keys ──
const STORAGE_INTERESTED = 'iwor_matching_interested'
const STORAGE_WISHLIST = 'iwor_matching_wishlist'

// ── ソート方式 ──
type SortKey = 'name' | 'matchRate' | 'salary' | 'beds' | 'residents'
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'matchRate', label: '倍率' },
  { key: 'salary', label: '年収' },
  { key: 'beds', label: '病床数' },
  { key: 'residents', label: '研修医数' },
  { key: 'name', label: '名前' },
]

// ── サブタブ ──
type SubTab = 'search' | 'interested' | 'wishlist'

interface Profile {
  name: string
  university: string
  graduationYear: string
  preferredSpecialty: string
  preferredRegions: string[]
  clubs: string
  research: string
  strengths: string
  motivation: string
}

export default function HospitalTab({
  profile, isPro, onShowProModal, initialSubTab,
}: {
  profile: Profile
  isPro: boolean
  onShowProModal: () => void
  initialSubTab?: SubTab
}) {
  const [subTab, setSubTab] = useState<SubTab>(initialSubTab || 'search')

  // ── フィルタ状態 ──
  const [searchQuery, setSearchQuery] = useState('')
  const [filterRegion, setFilterRegion] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterSpecialty, setFilterSpecialty] = useState('')
  const [filterBusyness, setFilterBusyness] = useState('')
  const [filterErType, setFilterErType] = useState('')
  const [filterSalary, setFilterSalary] = useState('')
  const [filterMatchRate, setFilterMatchRate] = useState('')
  const [filterDeptScale, setFilterDeptScale] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('matchRate')
  const [sortAsc, setSortAsc] = useState(true)

  // ── 気になる / 志望 リスト ──
  const [interestedIds, setInterestedIds] = useState<number[]>([])
  const [wishlistIds, setWishlistIds] = useState<number[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)

  // localStorage読み込み
  useEffect(() => {
    try {
      const i = localStorage.getItem(STORAGE_INTERESTED)
      const w = localStorage.getItem(STORAGE_WISHLIST)
      if (i) setInterestedIds(JSON.parse(i))
      if (w) setWishlistIds(JSON.parse(w))
    } catch { /* ignore */ }
  }, [])

  // localStorage保存
  useEffect(() => {
    localStorage.setItem(STORAGE_INTERESTED, JSON.stringify(interestedIds))
  }, [interestedIds])
  useEffect(() => {
    localStorage.setItem(STORAGE_WISHLIST, JSON.stringify(wishlistIds))
  }, [wishlistIds])

  const toggleInterested = useCallback((id: number) => {
    if (!isPro) { onShowProModal(); return }
    setInterestedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }, [isPro, onShowProModal])

  const toggleWishlist = useCallback((id: number) => {
    if (!isPro) { onShowProModal(); return }
    setWishlistIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
  }, [isPro, onShowProModal])

  const removeFromList = useCallback((list: 'interested' | 'wishlist', id: number) => {
    if (list === 'interested') setInterestedIds(prev => prev.filter(x => x !== id))
    else setWishlistIds(prev => prev.filter(x => x !== id))
  }, [])

  // ── ドラッグ並び替え ──
  const moveItem = useCallback((list: 'interested' | 'wishlist', fromIdx: number, toIdx: number) => {
    const setter = list === 'interested' ? setInterestedIds : setWishlistIds
    setter(prev => {
      const arr = [...prev]
      const [item] = arr.splice(fromIdx, 1)
      arr.splice(toIdx, 0, item)
      return arr
    })
  }, [])

  // ── フィルタリング＆ソート ──
  const filtered = useMemo(() => {
    let result = HOSPITALS.filter(h => {
      if (searchQuery && !h.name.includes(searchQuery) && !h.prefecture.includes(searchQuery)) return false
      if (filterRegion && h.region !== filterRegion) return false
      if (filterType && h.type !== filterType) return false
      if (filterSpecialty && !h.specialties.includes(filterSpecialty)) return false
      if (filterBusyness && h.busyness !== filterBusyness) return false
      if (filterErType && h.erType !== filterErType) return false
      if (filterSalary) {
        const range = SALARY_RANGES.find(r => r.label === filterSalary)
        if (range && (h.salaryNum < range.min || h.salaryNum >= range.max)) return false
      }
      if (filterMatchRate) {
        const range = MATCH_RATE_RANGES.find(r => r.label === filterMatchRate)
        if (range && (h.matchRate < range.min || h.matchRate >= range.max)) return false
      }
      if (filterDeptScale) {
        const hasScale = Object.values(h.deptScale).some(s => s === filterDeptScale)
        if (!hasScale) return false
      }
      return true
    })

    // ソート
    result.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'matchRate': cmp = a.matchRate - b.matchRate; break
        case 'salary': cmp = a.salaryNum - b.salaryNum; break
        case 'beds': cmp = a.beds - b.beds; break
        case 'residents': cmp = a.residents - b.residents; break
        case 'name': cmp = a.name.localeCompare(b.name); break
      }
      return sortAsc ? cmp : -cmp
    })
    return result
  }, [searchQuery, filterRegion, filterType, filterSpecialty, filterBusyness, filterErType, filterSalary, filterMatchRate, filterDeptScale, sortKey, sortAsc])

  // FREE: 上位5件のみ
  const FREE_LIMIT = 5
  const visible = isPro ? filtered : filtered.slice(0, FREE_LIMIT)
  const hiddenCount = isPro ? 0 : Math.max(0, filtered.length - FREE_LIMIT)

  // 穴場病院（上位3つ）
  const anabaHospitals = useMemo(() =>
    HOSPITALS.filter(h => h.isAnaba).sort((a, b) => a.matchRate - b.matchRate).slice(0, 3)
  , [])

  // ── マッチ確率 ──
  const wishlistHospitals = useMemo(() =>
    wishlistIds.map(id => HOSPITALS.find(h => h.id === id)).filter(Boolean) as Hospital[]
  , [wishlistIds])

  const matchResult = useMemo(() =>
    calculateMatchProbability(wishlistHospitals)
  , [wishlistHospitals])

  const activeFilters = [filterRegion, filterType, filterSpecialty, filterBusyness, filterErType, filterSalary, filterMatchRate, filterDeptScale].filter(Boolean).length

  return (
    <div className="space-y-4">
      {/* ── サブタブ ── */}
      <div className="flex gap-1 bg-s1 rounded-xl p-1">
        {([
          { id: 'search' as SubTab, label: '病院検索', count: HOSPITALS.length },
          { id: 'interested' as SubTab, label: '気になる', count: interestedIds.length },
          { id: 'wishlist' as SubTab, label: '志望リスト', count: wishlistIds.length },
        ]).map(t => (
          <button
            key={t.id}
            onClick={() => setSubTab(t.id)}
            className={`flex-1 py-2.5 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 ${
              subTab === t.id ? 'bg-s0 shadow-sm' : 'text-muted hover:text-tx'
            }`}
            style={subTab === t.id ? { color: MC } : undefined}
          >
            {t.label}
            {t.count > 0 && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                subTab === t.id ? 'font-bold' : 'bg-s2 text-muted'
              }`} style={subTab === t.id ? { background: MCL, color: MC } : undefined}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ══════ 検索タブ ══════ */}
      {subTab === 'search' && (
        <>
          {/* 穴場テイザー */}
          <div className="bg-s0 border border-br rounded-xl p-4 relative overflow-hidden">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-sm">💎</span>
              <p className="text-sm font-bold text-tx">あなたに最適な病院</p>
              {!isPro && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: MCL, color: MC }}>PRO</span>
              )}
            </div>
            <div className="space-y-2">
              {anabaHospitals.map((h, i) => (
                <div key={h.id} className="relative">
                  <div className={`flex items-center justify-between py-2 px-3 rounded-lg bg-s1 ${!isPro && i > 0 ? 'select-none' : ''}`}>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-tx truncate">{h.name}</p>
                      <p className="text-[10px] text-muted">{h.prefecture} · {h.matchRateLabel}</p>
                    </div>
                    {isPro && (
                      <p className="text-[10px] font-medium flex-shrink-0 ml-2 max-w-[45%] text-right" style={{ color: MC }}>{h.anabaReason}</p>
                    )}
                  </div>
                  {/* FREE: 2件目以降モザイク */}
                  {!isPro && i > 0 && (
                    <div className="absolute inset-0 backdrop-blur-md bg-s0/95 rounded-lg flex items-center justify-center">
                      <span className="text-[10px] text-muted">🔒 PRO会員でおすすめ理由を確認</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!isPro && (
              <button onClick={onShowProModal} className="w-full mt-3 py-2 rounded-lg text-[11px] font-bold text-white" style={{ background: MC }}>
                PRO会員でおすすめを全て見る
              </button>
            )}
          </div>

          {/* 検索・フィルタ */}
          <div className="bg-s0 border border-br rounded-xl p-4 space-y-3">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/>
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="病院名・都道府県で検索"
                className="w-full pl-10 pr-3 py-2.5 border border-br rounded-lg bg-bg text-sm text-tx focus:border-ac focus:ring-1 focus:ring-ac/20 outline-none transition-all"
              />
            </div>

            {/* 基本フィルタ行 */}
            <div className="flex gap-2 flex-wrap">
              <select value={filterRegion} onChange={e => setFilterRegion(e.target.value)}
                className="px-3 py-2 border border-br rounded-lg bg-bg text-xs text-tx focus:border-ac outline-none">
                <option value="">全地域</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <select value={filterType} onChange={e => setFilterType(e.target.value)}
                className="px-3 py-2 border border-br rounded-lg bg-bg text-xs text-tx focus:border-ac outline-none">
                <option value="">全タイプ</option>
                <option value="大学病院">大学病院</option>
                <option value="市中病院">市中病院</option>
              </select>
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`px-3 py-2 rounded-lg text-xs font-medium border transition-all flex items-center gap-1 ${
                  activeFilters > 0 ? 'border-ac/40' : 'border-br'
                }`}
                style={activeFilters > 0 ? { background: MCL, color: MC } : undefined}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
                </svg>
                詳細フィルタ{activeFilters > 0 && ` (${activeFilters})`}
              </button>
            </div>

            {/* 詳細フィルタ */}
            {showFilters && (
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-br">
                <select value={filterSpecialty} onChange={e => setFilterSpecialty(e.target.value)}
                  className="px-3 py-2 border border-br rounded-lg bg-bg text-xs text-tx outline-none">
                  <option value="">全診療科</option>
                  {ALL_SPECIALTIES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select value={filterBusyness} onChange={e => setFilterBusyness(e.target.value)}
                  className="px-3 py-2 border border-br rounded-lg bg-bg text-xs text-tx outline-none">
                  <option value="">忙しさ</option>
                  {Object.entries(BUSYNESS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <select value={filterErType} onChange={e => setFilterErType(e.target.value)}
                  className="px-3 py-2 border border-br rounded-lg bg-bg text-xs text-tx outline-none">
                  <option value="">救急体制</option>
                  {ER_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
                <select value={filterSalary} onChange={e => setFilterSalary(e.target.value)}
                  className="px-3 py-2 border border-br rounded-lg bg-bg text-xs text-tx outline-none">
                  <option value="">年収</option>
                  {SALARY_RANGES.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
                </select>
                <select value={filterMatchRate} onChange={e => setFilterMatchRate(e.target.value)}
                  className="px-3 py-2 border border-br rounded-lg bg-bg text-xs text-tx outline-none">
                  <option value="">倍率</option>
                  {MATCH_RATE_RANGES.map(r => <option key={r.label} value={r.label}>{r.label}</option>)}
                </select>
                <select value={filterDeptScale} onChange={e => setFilterDeptScale(e.target.value)}
                  className="px-3 py-2 border border-br rounded-lg bg-bg text-xs text-tx outline-none">
                  <option value="">診療科規模</option>
                  <option value="L">大（スタッフ多）</option>
                  <option value="M">中</option>
                  <option value="S">小（少人数）</option>
                </select>
              </div>
            )}

            {/* ソート＆件数 */}
            <div className="flex items-center justify-between">
              <p className="text-[11px] text-muted">
                {filtered.length}件{!isPro && ` — ${FREE_LIMIT}件表示`}
              </p>
              <div className="flex items-center gap-1">
                <select value={sortKey} onChange={e => setSortKey(e.target.value as SortKey)}
                  className="px-2 py-1 border border-br rounded text-[11px] bg-bg text-tx outline-none">
                  {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
                </select>
                <button onClick={() => setSortAsc(!sortAsc)}
                  className="p-1 border border-br rounded text-muted hover:text-tx transition-colors">
                  <svg className={`w-3.5 h-3.5 transition-transform ${sortAsc ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* 病院リスト */}
          <div className="space-y-3">
            {visible.map(h => (
              <HospitalCard
                key={h.id}
                hospital={h}
                isPro={isPro}
                expanded={expandedId === h.id}
                onToggle={() => setExpandedId(expandedId === h.id ? null : h.id)}
                isInterested={interestedIds.includes(h.id)}
                isWishlist={wishlistIds.includes(h.id)}
                onToggleInterested={() => toggleInterested(h.id)}
                onToggleWishlist={() => toggleWishlist(h.id)}
              />
            ))}
          </div>

          {/* PRO誘導 */}
          {hiddenCount > 0 && (
            <div className="bg-s0 border border-dashed rounded-xl p-6 text-center" style={{ borderColor: `${MC}40` }}>
              <p className="text-sm font-bold text-tx mb-1">あと{hiddenCount}件の病院があります</p>
              <p className="text-xs text-muted mb-4">PRO会員で全{filtered.length}件＋倍率推移＋おすすめ情報にアクセス</p>
              <button onClick={onShowProModal}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: MC }}>
                PRO会員になる
              </button>
            </div>
          )}
        </>
      )}

      {/* ══════ 気になるタブ ══════ */}
      {subTab === 'interested' && (
        <ListTab
          ids={interestedIds}
          listType="interested"
          isPro={isPro}
          onShowProModal={onShowProModal}
          onRemove={id => removeFromList('interested', id)}
          onMove={(from, to) => moveItem('interested', from, to)}
          onMoveToWishlist={id => {
            removeFromList('interested', id)
            if (!wishlistIds.includes(id)) setWishlistIds(prev => [...prev, id])
          }}
          emptyMessage="気になる病院をタップして追加しましょう"
          emptySubMessage="病院検索タブで ♡ ボタンを押すと追加されます"
        />
      )}

      {/* ══════ 志望リストタブ ══════ */}
      {subTab === 'wishlist' && (
        <>
          {/* マッチ確率カード */}
          <MatchProbabilityCard result={matchResult} isPro={isPro} onShowProModal={onShowProModal} />

          <ListTab
            ids={wishlistIds}
            listType="wishlist"
            isPro={isPro}
            onShowProModal={onShowProModal}
            onRemove={id => removeFromList('wishlist', id)}
            onMove={(from, to) => moveItem('wishlist', from, to)}
            emptyMessage="志望する病院を追加しましょう"
            emptySubMessage="病院検索タブで ★ ボタンを押すと追加されます"
          />
        </>
      )}
    </div>
  )
}


// ═══════════════════════════════════════
//  病院カード
// ═══════════════════════════════════════
function HospitalCard({
  hospital: h, isPro, expanded, onToggle,
  isInterested, isWishlist, onToggleInterested, onToggleWishlist,
}: {
  hospital: Hospital
  isPro: boolean
  expanded: boolean
  onToggle: () => void
  isInterested: boolean
  isWishlist: boolean
  onToggleInterested: () => void
  onToggleWishlist: () => void
}) {
  // 倍率の色分け
  const rateColor = h.matchRate <= 2 ? { bg: '#DCFCE7', text: '#166534' }
    : h.matchRate <= 4 ? { bg: '#FEF3C7', text: '#92400E' }
    : { bg: '#FEE2E2', text: '#991B1B' }

  // 忙しさドット
  const busynessLevel = h.busyness === 'high' ? 3 : h.busyness === 'medium' ? 2 : 1

  return (
    <div className="bg-s0 border border-br rounded-xl overflow-hidden transition-all hover:border-br2">
      <button onClick={onToggle} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <p className="text-sm font-bold text-tx truncate">{h.name}</p>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded flex-shrink-0 ${
                h.type === '市中病院' ? 'bg-blue-50 text-blue-700' : 'bg-purple-50 text-purple-700'
              }`}>{h.type}</span>
              {h.isAnaba && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 flex-shrink-0">
                  💎 おすすめ
                </span>
              )}
            </div>

            {/* 主要指標行 */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[11px] text-muted">{h.prefecture}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: rateColor.bg, color: rateColor.text }}>
                {h.matchRateLabel}
              </span>
              <span className="text-[11px] text-muted">{h.salaryLabel}</span>
              <span className="text-[10px] text-muted flex items-center gap-0.5" title={BUSYNESS_LABELS[h.busyness]}>
                {[1, 2, 3].map(i => (
                  <span key={i} className={`inline-block w-1.5 h-1.5 rounded-full ${i <= busynessLevel ? 'bg-amber-500' : 'bg-s2'}`} />
                ))}
                <span className="ml-0.5">{BUSYNESS_LABELS[h.busyness]}</span>
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-s1 text-muted">{h.erType}</span>
            </div>

            {/* サブ情報 */}
            <div className="flex items-center gap-3 text-[10px] text-muted">
              <span>{h.beds}床</span>
              <span>研修医{h.residents}名/年</span>
            </div>
          </div>

          {/* マッチ度バッジ */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0 ml-1">
            <div className="relative">
              <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: MCL }}>
                <span className="text-xs font-bold" style={{ color: MC }}>{getMatchDegree(h)}%</span>
              </div>
              {!isPro && (
                <div className="absolute inset-0 backdrop-blur-sm bg-s0/80 rounded-full flex items-center justify-center">
                  <span className="text-[9px]">🔒</span>
                </div>
              )}
            </div>
            <span className="text-[8px] text-muted">マッチ度</span>
          </div>
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {h.features.slice(0, 4).map(f => (
            <span key={f} className="text-[10px] px-1.5 py-0.5 rounded bg-s1 text-muted">{f}</span>
          ))}
          {h.features.length > 4 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-s1 text-muted">+{h.features.length - 4}</span>
          )}
        </div>
      </button>

      {/* アクションボタン */}
      <div className="px-4 pb-3 flex gap-2">
        <button onClick={e => { e.stopPropagation(); onToggleInterested() }}
          className={`flex-1 py-2 rounded-lg text-[11px] font-medium border transition-all flex items-center justify-center gap-1 ${
            isInterested ? 'border-pink-300 bg-pink-50 text-pink-600' : 'border-br text-muted hover:text-tx'
          }`}>
          {isInterested ? '♥' : '♡'} 気になる
        </button>
        <button onClick={e => { e.stopPropagation(); onToggleWishlist() }}
          className={`flex-1 py-2 rounded-lg text-[11px] font-medium border transition-all flex items-center justify-center gap-1 ${
            isWishlist ? 'text-white' : 'border-br text-muted hover:text-tx'
          }`}
          style={isWishlist ? { background: MC, borderColor: MC } : undefined}>
          ★ 志望する
        </button>
      </div>

      {/* 展開エリア */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-br pt-3 space-y-3">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <StatBox label="病床数" value={`${h.beds}床`} />
            <StatBox label="研修医数" value={`${h.residents}名/年`} />
            <StatBox label="マッチング倍率" value={h.matchRateLabel} highlight />
            <StatBox label="年収目安" value={h.salaryLabel} />
            <StatBox label="忙しさ" value={BUSYNESS_LABELS[h.busyness]} />
            <StatBox label="救急体制" value={h.erType} />
          </div>

          {/* 倍率推移 — PROモザイク */}
          <div className="relative">
            <div className="bg-s1 rounded-lg p-3">
              <p className="text-[10px] text-muted mb-2">倍率推移（過去3年）</p>
              <div className="flex items-end gap-3 h-12">
                {h.historicalRates.map((r, i) => {
                  const maxR = Math.max(...h.historicalRates.map(x => x.rate))
                  const pct = (r.rate / maxR) * 100
                  return (
                    <div key={r.year} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] font-bold text-tx">{r.rate}倍</span>
                      <div className="w-full rounded-t" style={{
                        height: `${pct}%`, background: i === h.historicalRates.length - 1 ? MC : '#DDD9D2',
                      }} />
                      <span className="text-[9px] text-muted">{r.year}</span>
                    </div>
                  )
                })}
              </div>
            </div>
            {!isPro && (
              <div className="absolute inset-0 backdrop-blur-md bg-s0/95 rounded-lg flex items-center justify-center">
                <span className="text-[10px] font-medium" style={{ color: MC }}>🔒 PRO会員で倍率推移を表示</span>
              </div>
            )}
          </div>

          {/* 診療科 */}
          <div>
            <p className="text-[10px] text-muted mb-1">強い診療科</p>
            <div className="flex flex-wrap gap-1">
              {h.specialties.map(s => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded font-medium" style={{ background: MCL, color: MC }}>
                  {s}
                </span>
              ))}
            </div>
          </div>

          {/* 診療科規模 */}
          <div>
            <p className="text-[10px] text-muted mb-1">診療科規模（スタッフ数）</p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(h.deptScale).map(([dept, scale]) => (
                <span key={dept} className={`text-[10px] px-2 py-0.5 rounded ${
                  scale === 'L' ? 'bg-green-50 text-green-700' :
                  scale === 'M' ? 'bg-blue-50 text-blue-700' :
                  'bg-gray-100 text-gray-600'
                }`}>
                  {dept}（{scale === 'L' ? '大' : scale === 'M' ? '中' : '小'}）
                </span>
              ))}
            </div>
          </div>

          {/* 病院理念（面接対策用） */}
          {h.philosophy && (
            <div className="bg-s1 rounded-lg p-3">
              <p className="text-[10px] font-medium text-muted mb-1 flex items-center gap-1">
                <span>💡</span>病院理念（面接対策に活用）
              </p>
              <p className="text-xs text-tx leading-relaxed">「{h.philosophy}」</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ダミーマッチ度（病院IDベースで一貫性のある値を生成）
function getMatchDegree(h: Hospital): number {
  const seed = h.id * 17 + h.beds + h.residents
  return 60 + (seed % 35) // 60-94%
}

function StatBox({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="bg-s1 rounded-lg p-2.5">
      <p className="text-muted text-[10px] mb-0.5">{label}</p>
      <p className={`font-bold ${highlight ? '' : 'text-tx'}`} style={highlight ? { color: MC } : undefined}>
        {value}
      </p>
    </div>
  )
}


// ═══════════════════════════════════════
//  気になる / 志望リスト タブ
// ═══════════════════════════════════════
function ListTab({
  ids, listType, isPro, onShowProModal, onRemove, onMove, onMoveToWishlist,
  emptyMessage, emptySubMessage,
}: {
  ids: number[]
  listType: 'interested' | 'wishlist'
  isPro: boolean
  onShowProModal: () => void
  onRemove: (id: number) => void
  onMove: (from: number, to: number) => void
  onMoveToWishlist?: (id: number) => void
  emptyMessage: string
  emptySubMessage: string
}) {
  const hospitals = ids.map(id => HOSPITALS.find(h => h.id === id)).filter(Boolean) as Hospital[]

  if (!isPro) {
    return (
      <div className="bg-s0 border border-dashed rounded-xl p-8 text-center" style={{ borderColor: `${MC}40` }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3" style={{ background: MCL }}>
          <svg className="w-6 h-6" style={{ stroke: MC }} fill="none" viewBox="0 0 24 24" strokeWidth={2}>
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/>
          </svg>
        </div>
        <p className="text-sm font-bold text-tx mb-1">PRO限定機能</p>
        <p className="text-xs text-muted mb-4">{listType === 'interested' ? '気になる病院リスト' : '志望リスト＆マッチ確率計算'}はPRO会員で使えます</p>
        <button onClick={onShowProModal} className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: MC }}>
          PRO会員になる
        </button>
      </div>
    )
  }

  if (hospitals.length === 0) {
    return (
      <div className="bg-s0 border border-br rounded-xl p-8 text-center">
        <p className="text-2xl mb-2">{listType === 'interested' ? '♡' : '★'}</p>
        <p className="text-sm font-bold text-tx mb-1">{emptyMessage}</p>
        <p className="text-xs text-muted">{emptySubMessage}</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <p className="text-[11px] text-muted px-1">ドラッグで並び替え可能 · {hospitals.length}件</p>
      {hospitals.map((h, idx) => (
        <div
          key={h.id}
          draggable
          onDragStart={() => {}}
          className="bg-s0 border border-br rounded-xl p-3 flex items-center gap-3 cursor-move hover:border-br2 transition-all"
        >
          {/* 順位 */}
          <div className="w-7 h-7 rounded-lg bg-s1 flex items-center justify-center flex-shrink-0 text-xs font-bold text-muted">
            {idx + 1}
          </div>

          {/* 並び替えボタン */}
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            <button disabled={idx === 0} onClick={() => onMove(idx, idx - 1)}
              className="p-0.5 text-muted hover:text-tx disabled:opacity-30 transition-colors">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/>
              </svg>
            </button>
            <button disabled={idx === hospitals.length - 1} onClick={() => onMove(idx, idx + 1)}
              className="p-0.5 text-muted hover:text-tx disabled:opacity-30 transition-colors">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
          </div>

          {/* 病院情報 */}
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-tx truncate">{h.name}</p>
            <div className="flex items-center gap-2 text-[10px] text-muted">
              <span>{h.prefecture}</span>
              <span className="font-medium" style={{ color: MC }}>{h.matchRateLabel}</span>
              <span>{h.salaryLabel}</span>
            </div>
          </div>

          {/* アクション */}
          <div className="flex items-center gap-1 flex-shrink-0">
            {onMoveToWishlist && (
              <button onClick={() => onMoveToWishlist(h.id)}
                className="p-1.5 rounded-lg text-muted hover:text-white transition-all text-[10px]"
                style={{ background: MCL, color: MC }}
                title="志望リストへ移動">
                ★
              </button>
            )}
            <button onClick={() => onRemove(h.id)}
              className="p-1.5 rounded-lg bg-s1 text-muted hover:text-red-500 hover:bg-red-50 transition-all"
              title="削除">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}


// ═══════════════════════════════════════
//  マッチ確率カード
// ═══════════════════════════════════════
function MatchProbabilityCard({
  result, isPro, onShowProModal,
}: {
  result: MatchProbabilityResult
  isPro: boolean
  onShowProModal: () => void
}) {
  const colorMap = {
    excellent: { bg: '#DCFCE7', text: '#166534', border: '#86EFAC' },
    good: { bg: '#E8F0EC', text: '#1B4F3A', border: '#A7D5BA' },
    warning: { bg: '#FEF3C7', text: '#92400E', border: '#FCD34D' },
    danger: { bg: '#FEE2E2', text: '#991B1B', border: '#FCA5A5' },
  }

  // FREE用ダミー表示
  if (!isPro) {
    const dummyHospitals = [
      { name: '東京大学医学部附属病院', prob: 87 },
      { name: '慶應義塾大学病院', prob: 72 },
      { name: '聖路加国際病院', prob: 64 },
      { name: '虎の門病院', prob: 58 },
    ]
    return (
      <div className="bg-s0 border border-br rounded-xl p-4 relative overflow-hidden cursor-pointer" onClick={onShowProModal}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-sm">📊</span>
          <p className="text-sm font-bold text-tx">マッチング成功確率</p>
        </div>
        <div className="relative">
          <div className="space-y-3 filter blur-[6px] pointer-events-none select-none" aria-hidden="true">
            <div className="rounded-xl p-4 text-center" style={{ background: '#DCFCE7', border: '1px solid #86EFAC' }}>
              <p className="text-3xl font-bold mb-1" style={{ color: '#166534' }}>93%</p>
              <p className="text-[11px] font-medium" style={{ color: '#166534' }}>少なくとも1つマッチする確率</p>
            </div>
            <div className="space-y-1.5">
              {dummyHospitals.map((h, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="text-[10px] text-muted w-4 text-right flex-shrink-0">{i + 1}</span>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-[11px] font-medium text-tx">{h.name}</p>
                      <span className="text-[11px] font-bold" style={{ color: MC }}>{h.prob}%</span>
                    </div>
                    <div className="h-1.5 bg-s1 rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${h.prob}%`, background: MC }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <button className="px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg" style={{ background: MC }}>
              🔒 PRO会員でマッチ確率を計算
            </button>
            <p className="text-xs text-muted mt-2">志望病院の倍率・プロフィールから算出</p>
          </div>
        </div>
      </div>
    )
  }

  const c = colorMap[result.safetyLevel]

  return (
    <div className="bg-s0 border border-br rounded-xl p-4 relative overflow-hidden">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-sm">📊</span>
        <p className="text-sm font-bold text-tx">マッチング成功確率</p>
      </div>

      {result.perHospital.length === 0 ? (
        <p className="text-xs text-muted text-center py-4">志望リストに病院を追加すると確率を計算します</p>
      ) : (
        <div className="space-y-3">
          {/* メイン確率 */}
          <div className="rounded-xl p-4 text-center" style={{ background: c.bg, border: `1px solid ${c.border}` }}>
            <p className="text-3xl font-bold mb-1" style={{ color: c.text }}>
              {result.totalProbability}%
            </p>
            <p className="text-[11px] font-medium" style={{ color: c.text }}>
              少なくとも1つマッチする確率
            </p>
          </div>

          {/* 各病院の確率 */}
          <div className="space-y-1.5">
            {result.perHospital.map((h, i) => (
              <div key={h.id} className="flex items-center gap-2">
                <span className="text-[10px] text-muted w-4 text-right flex-shrink-0">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-[11px] font-medium text-tx truncate">{h.name}</p>
                    <span className="text-[11px] font-bold flex-shrink-0 ml-2" style={{ color: MC }}>{h.probability}%</span>
                  </div>
                  <div className="h-1.5 bg-s1 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: `${h.probability}%`, background: MC,
                    }} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* アドバイス */}
          <div className="rounded-lg p-3" style={{ background: c.bg }}>
            <p className="text-[11px] leading-relaxed" style={{ color: c.text }}>
              {result.recommendation}
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
