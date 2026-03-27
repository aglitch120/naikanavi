'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  Hospital, HOSPITALS, REGIONS, ALL_SPECIALTIES,
  BUSYNESS_LABELS, ER_TYPES, SALARY_RANGES, MATCH_RATE_RANGES,
} from './hospitals-data'
import { calculateMatchProbability, MatchProbabilityResult } from './match-calc'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

const PREF_TO_REGION: Record<string, string> = {
  '北海道':'北海道',
  '青森県':'東北','岩手県':'東北','宮城県':'東北','秋田県':'東北','山形県':'東北','福島県':'東北',
  '茨城県':'関東','栃木県':'関東','群馬県':'関東','埼玉県':'関東','千葉県':'関東','東京都':'関東','神奈川県':'関東',
  '新潟県':'中部','富山県':'中部','石川県':'中部','福井県':'中部','山梨県':'中部','長野県':'中部','岐阜県':'中部','静岡県':'中部','愛知県':'中部',
  '三重県':'近畿','滋賀県':'近畿','京都府':'近畿','大阪府':'近畿','兵庫県':'近畿','奈良県':'近畿','和歌山県':'近畿',
  '鳥取県':'中国','島根県':'中国','岡山県':'中国','広島県':'中国','山口県':'中国',
  '徳島県':'四国','香川県':'四国','愛媛県':'四国','高知県':'四国',
  '福岡県':'九州・沖縄','佐賀県':'九州・沖縄','長崎県':'九州・沖縄','熊本県':'九州・沖縄','大分県':'九州・沖縄','宮崎県':'九州・沖縄','鹿児島県':'九州・沖縄','沖縄県':'九州・沖縄',
}
const REGION_TO_PREFS: Record<string, string[]> = {}
Object.entries(PREF_TO_REGION).forEach(([pref, region]) => {
  if (!REGION_TO_PREFS[region]) REGION_TO_PREFS[region] = []
  REGION_TO_PREFS[region].push(pref)
})

// ── localStorage keys ──
const STORAGE_INTERESTED = 'iwor_matching_interested'
const STORAGE_WISHLIST = 'iwor_matching_wishlist'

/** programからhospital nameを除いた部分を抽出（コース名サブタイトル） */
function programLabel(h: Hospital): string {
  let label = h.program
  // 病院名プレフィックスを除去
  if (label.startsWith(h.name)) {
    label = label.slice(h.name.length)
  }
  // よくある接頭辞を除去
  label = label.replace(/^(卒後|医師|初期)?臨床研修/, '').replace(/^プログラム/, '').trim()
  // 空なら表示なし
  return label || ''
}

// ── ソート方式 ──
type SortKey = 'name' | 'matchRate' | 'salary' | 'beds' | 'residents' | 'anaba' | 'honmei'
const SORT_OPTIONS: { key: SortKey; label: string; pro?: boolean }[] = [
  { key: 'matchRate', label: '倍率' },
  { key: 'anaba', label: '穴場度', pro: true },
  { key: 'honmei', label: '志望集中度', pro: true },
  { key: 'name', label: '名前' },
]

// ── サブタブ ──
type SubTab = 'search' | 'interested' | 'wishlist' | 'ranking'

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
  const [filterPref, setFilterPref] = useState('')
  // 旧フィルタは削除済み（新型Hospitalでは地域+検索のみ）
  const [showFilters, setShowFilters] = useState(false)
  const [sortKey, setSortKey] = useState<SortKey>('matchRate')
  const [sortAsc, setSortAsc] = useState(true)

  // ── 志望 / 志望 リスト ──
  const [interestedIds, setInterestedIds] = useState<number[]>([])
  const [wishlistIds, setWishlistIds] = useState<number[]>([])
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [dragIdx, setDragIdx] = useState<number | null>(null)
  const [interestCounts, setInterestCounts] = useState<Record<string, number>>({})

  // localStorage読み込み
  useEffect(() => {
    try {
      const i = localStorage.getItem(STORAGE_INTERESTED)
      const w = localStorage.getItem(STORAGE_WISHLIST)
      if (i) setInterestedIds(JSON.parse(i))
      if (w) setWishlistIds(JSON.parse(w))
    } catch { /* ignore */ }
    // 志望カウント取得
    fetch('https://iwor-api.mightyaddnine.workers.dev/api/hospital/interest-counts')
      .then(r => r.json())
      .then(d => { if (d.ok && d.counts) setInterestCounts(d.counts) })
      .catch(() => {})
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
    const wasInterested = interestedIds.includes(id)
    setInterestedIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    )
    // サーバー同期
    const token = localStorage.getItem('iwor_session_token')
    if (token) {
      const action = wasInterested ? 'remove' : 'add'
      fetch('https://iwor-api.mightyaddnine.workers.dev/api/hospital/interest', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ hospitalId: id, action }),
      })
        .then(r => r.json())
        .then(d => {
          if (d.ok) setInterestCounts(prev => ({ ...prev, [String(id)]: d.count }))
        })
        .catch(() => {})
    }
  }, [isPro, onShowProModal, interestedIds])

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
      if (searchQuery && !h.name.includes(searchQuery) && !h.prefecture.includes(searchQuery) && !h.program.includes(searchQuery)) return false
      if (filterRegion) {
        if (PREF_TO_REGION[h.prefecture] !== filterRegion) return false
      }
      if (filterPref && h.prefecture !== filterPref) return false
      return true
    })

    // 穴場度計算用ヘルパー
    const calcAnaba = (h: typeof HOSPITALS[0]) => {
      const p = h.capacity > 0 ? h.applicants / h.capacity : 0
      const vacR = h.capacity > 0 ? h.vacancy / h.capacity : 0
      const trend = (h as any).popularityTrend
      return (vacR * 40) + (p < 2 ? 30 : p < 3 ? 15 : 0) + (trend !== undefined && trend < 0.8 ? 20 : trend !== undefined && trend < 1.0 ? 10 : 0) + (h.matchRate < 80 ? 10 : 0)
    }
    // ソート
    result.sort((a, b) => {
      let cmp = 0
      switch (sortKey) {
        case 'matchRate': cmp = a.popularity - b.popularity; break
        case 'anaba': cmp = calcAnaba(b) - calcAnaba(a); break
        case 'honmei': cmp = ((b as any).honmeiIndex || 0) - ((a as any).honmeiIndex || 0); break
        case 'name': cmp = a.name.localeCompare(b.name); break
        default: cmp = a.name.localeCompare(b.name)
      }
      return sortAsc ? cmp : -cmp
    })
    return result
  }, [searchQuery, filterRegion, filterPref, sortKey, sortAsc])

  // FREE: 上位10件のみ
  const FREE_LIMIT = 10
  const visible = isPro ? filtered : filtered.slice(0, FREE_LIMIT)
  const hiddenCount = isPro ? 0 : Math.max(0, filtered.length - FREE_LIMIT)

  // ── マッチ確率 ──
  const wishlistHospitals = useMemo(() =>
    wishlistIds.map(id => HOSPITALS.find(h => h.id === id)).filter(Boolean) as Hospital[]
  , [wishlistIds])

  const matchResult = useMemo(() =>
    calculateMatchProbability(wishlistHospitals)
  , [wishlistHospitals])

  const activeFilters = filterRegion ? 1 : 0

  return (
    <div className="space-y-4">
      {/* ── サブタブ（病院DBタブのみ表示。比較表・志望リストは親タブから直接呼ばれる） ── */}
      {initialSubTab !== 'ranking' && initialSubTab !== 'wishlist' && (
      <div className="flex gap-1 bg-s1 rounded-xl p-1">
        {([
          { id: 'search' as SubTab, label: '検索', count: HOSPITALS.length },
          { id: 'ranking' as SubTab, label: '人気', count: 0 },
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
      )}

      {/* ══════ 検索タブ ══════ */}
      {subTab === 'search' && (
        <>
          {/* 穴場テイザー */}
          <div className="relative overflow-hidden rounded-xl" style={{ background: `linear-gradient(135deg, ${MCL}, #F0F5F2, #E8F0EC)` }}>
            <div className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: MC }}>
                  <span className="text-white text-sm">💎</span>
                </div>
                <div>
                  <p className="text-sm font-bold text-tx">あなたに最適な病院</p>
                  <p className="text-[10px] text-muted">プロフィールに基づくAIおすすめ</p>
                </div>
                {!isPro && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded ml-auto" style={{ background: MC, color: '#fff' }}>PRO</span>
                )}
              </div>
              <div className="space-y-2">
                {(() => {
                  // プロフィールベースのスコアリング
                  const scored = HOSPITALS.map(h => {
                    let score = 0
                    // 地域マッチ（最重要）
                    const region = PREF_TO_REGION[h.prefecture]
                    if (profile.preferredRegions?.length > 0 && region && profile.preferredRegions.includes(region)) score += 40
                    // 穴場度（空席+低倍率）
                    if (h.vacancy > 0) score += 15
                    if (h.popularity < 2.0) score += 10
                    else if (h.popularity < 3.0) score += 5
                    // マッチ率
                    if (h.matchRate >= 90) score += 10
                    else if (h.matchRate >= 70) score += 5
                    // 大学病院 vs 市中（キャリアタイプによる）
                    if (h.isUniversity && profile.preferredSpecialty && ['研究','基礎研究'].some(k => (profile.research || '').includes(k))) score += 10
                    if (!h.isUniversity) score += 3 // 市中は一般的にマッチしやすい
                    return { hospital: h, score }
                  }).filter(s => s.score > 0).sort((a, b) => b.score - a.score).slice(0, 3)
                  return scored
                })().map(({ hospital: h, score }, i) => (
                  <div key={h.id} className="relative">
                    <div className={`flex items-center justify-between py-2.5 px-3 rounded-lg bg-white/80 border border-white ${!isPro ? 'select-none' : ''}`}>
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0" style={{
                          background: i === 0 ? '#FFD700' : i === 1 ? '#C0C0C0' : i === 2 ? '#CD7F32' : 'var(--s1)',
                          color: i < 3 ? '#fff' : 'var(--m)'
                        }}>{i + 1}</span>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-tx truncate">{h.name}</p>
                          {programLabel(h) && <p className="text-[10px] text-muted truncate">{programLabel(h)}</p>}
                          <p className="text-[10px] text-muted">{h.prefecture} · 空席{h.vacancy}</p>
                        </div>
                      </div>
                      {isPro && h.vacancy > 0 && (
                        <p className="text-[10px] font-medium flex-shrink-0 ml-2 text-right" style={{ color: MC }}>空席{h.vacancy}</p>
                      )}
                    </div>
                    {/* FREE: 完全に隠す */}
                    {!isPro && (
                      <div className="absolute inset-0 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E8F0EC, #F5F4F0)' }}>
                        <span className="text-[10px] text-muted">🔒 PRO限定</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {!isPro && (
                <button onClick={onShowProModal} className="pro-cta-glow w-full mt-3 py-2.5 rounded-xl text-[11px] font-bold text-white shadow-lg transition-transform hover:scale-[1.02]" style={{ background: `linear-gradient(135deg, ${MC}, #2D7A5A)` }}>
                  PRO会員であなた専用のおすすめを見る
                </button>
              )}
            </div>
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

            {/* フィルタ + ソート 横並び */}
            <div className="flex gap-2 flex-wrap items-center">
              <select value={filterRegion} onChange={e => { setFilterRegion(e.target.value); setFilterPref('') }}
                className="px-2.5 py-2 border border-br rounded-lg bg-bg text-xs text-tx focus:border-ac outline-none">
                <option value="">全地域</option>
                {REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              {filterRegion && (
                <select value={filterPref} onChange={e => setFilterPref(e.target.value)}
                  className="px-2.5 py-2 border border-br rounded-lg bg-bg text-xs text-tx focus:border-ac outline-none">
                  <option value="">全{filterRegion}</option>
                  {(REGION_TO_PREFS[filterRegion] || []).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              )}
              <div className="ml-auto flex items-center gap-1.5">
                <select value={sortKey} onChange={e => {
                  const key = e.target.value as SortKey
                  const opt = SORT_OPTIONS.find(o => o.key === key)
                  if (opt?.pro && !isPro) { onShowProModal(); return }
                  setSortKey(key)
                }}
                  className="px-2.5 py-2 border border-br rounded-lg bg-bg text-xs text-tx focus:border-ac outline-none">
                  {SORT_OPTIONS.map(o => <option key={o.key} value={o.key}>{o.label}順{o.pro && !isPro ? ' 🔒' : ''}</option>)}
                </select>
                <button onClick={() => setSortAsc(!sortAsc)}
                  className="p-1.5 border border-br rounded-lg text-muted hover:text-tx transition-colors"
                  title={sortAsc ? '昇順' : '降順'}>
                  <svg className={`w-3.5 h-3.5 transition-transform ${sortAsc ? '' : 'rotate-180'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7"/>
                  </svg>
                </button>
              </div>
            </div>
            <p className="text-[10px] text-muted">{filtered.length}件{!isPro && ` — ${FREE_LIMIT}件表示`}</p>
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
                interestCount={interestCounts[String(h.id)] || 0}
                onShowPro={onShowProModal}
              />
            ))}
          </div>

          {/* PRO誘導 */}
          {hiddenCount > 0 && (
            <div className="bg-s0 border border-dashed rounded-xl p-6 text-center" style={{ borderColor: `${MC}40` }}>
              <p className="text-sm font-bold text-tx mb-1">あと{hiddenCount}件の病院があります</p>
              <p className="text-xs text-muted mb-4">PRO会員で全{filtered.length}件＋倍率推移＋おすすめ情報にアクセス</p>
              <button onClick={onShowProModal}
                className="pro-cta-glow px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: MC }}>
                PRO会員になる
              </button>
            </div>
          )}
        </>
      )}

      {/* ══════ 志望ランキングタブ ══════ */}
      {subTab === 'ranking' && (
        <div className="space-y-3">
          <div className="bg-s0 border border-br rounded-xl p-4">
            <p className="text-xs font-bold text-tx mb-1">🔥 志望ランキング</p>
            <p className="text-[11px] text-muted mb-4">全ユーザーの「志望」数で集計</p>
            {(() => {
              const ranked = HOSPITALS
                .map(h => ({ ...h, count: interestCounts[String(h.id)] || 0 }))
                .filter(h => h.count > 0)
                .sort((a, b) => b.count - a.count)
                .slice(0, 20)

              // FREE: データの有無にかかわらずフェイクランキング+モザイク
              if (!isPro) {
                const fakeNames = ['東京大学医学部附属病院','聖路加国際病院','虎の門病院','亀田総合病院','国立国際医療研究センター','慶應義塾大学病院','手稲渓仁会病院','沖縄県立中部病院','飯塚病院','湘南鎌倉総合病院']
                return (
                  <div className="relative">
                    <div className="space-y-2" style={{ filter: 'blur(4px)', userSelect: 'none' }}>
                      {fakeNames.map((name, i) => {
                        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
                        return (
                          <div key={i} className="flex items-center gap-3 py-2 border-b last:border-b-0" style={{ borderColor: 'var(--br)' }}>
                            <span className="text-sm w-8 text-center flex-shrink-0">{medal}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-tx truncate">{name}</p>
                              <p className="text-[10px] text-muted">倍率{(2 + Math.random() * 6).toFixed(1)}</p>
                            </div>
                            <span className="text-xs font-bold flex-shrink-0" style={{ color: MC }}>♥ {Math.floor(30 + Math.random() * 120)}</span>
                          </div>
                        )
                      })}
                    </div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-s0/80 to-s0/95">
                      <p className="text-sm font-bold text-tx mb-1">志望人気ランキング</p>
                      <p className="text-[10px] text-muted mb-3">iwor全ユーザーの志望動向をリアルタイム集計</p>
                      <button onClick={onShowProModal}
                        className="pro-cta-glow px-6 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: MC }}>
                        PRO会員でランキングを見る
                      </button>
                    </div>
                  </div>
                )
              }

              if (ranked.length === 0) return (
                <p className="text-xs text-muted text-center py-8">まだデータがありません</p>
              )

              if (isPro) {
                return (
                  <div className="space-y-2">
                    {ranked.map((h, i) => {
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
                      return (
                        <div key={h.id} className="flex items-center gap-3 py-2 border-b last:border-b-0" style={{ borderColor: 'var(--br)' }}>
                          <span className="text-sm w-8 text-center flex-shrink-0">{medal}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-tx truncate">{h.name}</p>
                            {programLabel(h) && <p className="text-[10px] text-muted truncate">{programLabel(h)}</p>}
                            <p className="text-[10px] text-muted">{h.prefecture} · 倍率{h.popularity}</p>
                          </div>
                          <span className="text-xs font-bold flex-shrink-0" style={{ color: MC }}>♥ {h.count}</span>
                        </div>
                      )
                    })}
                  </div>
                )
              }
              // FREE: フェイクランキング + モザイク
              const fakeNames = ['○○大学医学部附属病院','△△市立医療センター','□□赤十字病院','☆☆記念病院','◇◇総合病院','◎◎医科大学附属病院','▽▽中央病院','★★医療センター','●●共済病院','■■労災病院']
              return (
                <div className="relative">
                  <div className="space-y-2" style={{ filter: 'blur(4px)', userSelect: 'none' }}>
                    {fakeNames.map((name, i) => {
                      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`
                      return (
                        <div key={i} className="flex items-center gap-3 py-2 border-b last:border-b-0" style={{ borderColor: 'var(--br)' }}>
                          <span className="text-sm w-8 text-center flex-shrink-0">{medal}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-tx truncate">{name}</p>
                            <p className="text-[10px] text-muted">東京都 · 倍率{(2 + Math.random() * 4).toFixed(1)}</p>
                          </div>
                          <span className="text-xs font-bold flex-shrink-0" style={{ color: MC }}>♥ {Math.floor(20 + Math.random() * 80)}</span>
                        </div>
                      )
                    })}
                  </div>
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-b from-transparent via-s0/80 to-s0/95">
                    <p className="text-sm font-bold text-tx mb-1">人気病院ランキング</p>
                    <p className="text-[10px] text-muted mb-3">iwor全ユーザーの志望動向をリアルタイム集計</p>
                    <button onClick={onShowProModal}
                      className="pro-cta-glow px-6 py-2.5 rounded-xl text-xs font-bold text-white" style={{ background: MC }}>
                      PRO会員でランキングを見る
                    </button>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ══════ 志望タブ ══════ */}
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
          emptyMessage="志望病院をタップして追加しましょう"
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
  interestCount, onShowPro,
}: {
  hospital: Hospital
  isPro: boolean
  expanded: boolean
  onToggle: () => void
  isInterested: boolean
  isWishlist: boolean
  onToggleInterested: () => void
  onToggleWishlist: () => void
  interestCount: number
  onShowPro?: () => void
}) {
  // 倍率の色分け (popularity = applicants/capacity)
  const pop = h.popularity || 0
  const rateColor = pop <= 2 ? { bg: '#DCFCE7', text: '#166534' }
    : pop <= 4 ? { bg: '#FEF3C7', text: '#92400E' }
    : { bg: '#FEE2E2', text: '#991B1B' }

  // 志望集中度（第1希望率の代理指標）
  // honmeiIndex: JRMPデータ由来（中間発表の第1希望者数/全志望者数）がある場合のみ正確
  // ない場合: 全志望者数/定員（単純な人気度）をスケーリング
  let honmei = (h as any).honmeiIndex || 0
  const hasRealData = !!(h as any).honmeiIndex
  if (!hasRealData && h.applicants > 0 && h.capacity > 0) {
    // 人気度を0-1にスケーリング（倍率5倍→1.0）
    honmei = Math.min(h.applicants / h.capacity / 5, 1)
    honmei = Math.round(honmei * 100) / 100
  }
  const honmeiColor = honmei >= 0.8 ? { bg: '#DCFCE7', text: '#166534', label: '高人気' }
    : honmei >= 0.5 ? { bg: '#FEF3C7', text: '#92400E', label: '中人気' }
    : honmei > 0 ? { bg: '#FEE2E2', text: '#991B1B', label: '低人気' }
    : { bg: '#F0EDE7', text: '#6B6760', label: '--' }

  return (
    <div className="bg-s0 border border-br rounded-xl overflow-hidden transition-all hover:border-br2">
      <button onClick={onToggle} className="w-full p-4 text-left">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <p className="text-sm font-bold text-tx truncate">{h.name}</p>
              {programLabel(h) && <p className="text-[11px] text-muted mt-0.5">{programLabel(h)}</p>}
              {h.isUniversity && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 flex-shrink-0">大学</span>
              )}
            </div>

            {/* 主要指標行 */}
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="text-[11px] text-muted">{h.prefecture}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: rateColor.bg, color: rateColor.text }}>
                倍率 {pop}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-s1 text-muted">
                定員{h.capacity} / マッチ{h.matched}
              </span>
              {h.vacancy > 0 && (
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 text-amber-700">空席{h.vacancy}</span>
              )}
            </div>

            {/* マッチ率 */}
            <div className="flex items-center gap-3 text-[10px] text-muted">
              <span>マッチ率 {h.matchRate}%</span>
              <span>応募{h.applicants}人</span>
            </div>
          </div>

          {/* 本命度バッジ (PRO) */}
          {honmei > 0 && (
            <div className="flex flex-col items-center gap-1 flex-shrink-0 ml-1">
              <div className="relative">
                <div className="w-11 h-11 rounded-full flex items-center justify-center" style={{ background: honmeiColor.bg }}>
                  <span className="text-[10px] font-bold" style={{ color: honmeiColor.text }}>{honmeiColor.label}</span>
                </div>
                {!isPro && (
                  <div className="absolute inset-0 backdrop-blur-sm bg-s0/80 rounded-full flex items-center justify-center">
                    <span className="text-[9px]">🔒</span>
                  </div>
                )}
              </div>
              <span className="text-[8px] text-muted">本命度</span>
            </div>
          )}
        </div>
      </button>

      {/* アクションボタン */}
      <div className="px-4 pb-3">
        <button onClick={e => { e.stopPropagation(); onToggleWishlist() }}
          className={`w-full py-2.5 rounded-lg text-[11px] font-medium border transition-all flex items-center justify-center gap-1 ${
            isWishlist ? 'text-white' : 'border-br text-muted hover:text-tx'
          }`}
          style={isWishlist ? { background: MC, borderColor: MC } : undefined}>
          {isWishlist ? '★ 志望中' : '☆ 志望リストに追加'}
        </button>
      </div>

      {/* 展開エリア */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-br pt-3 space-y-3">
          {/* 基本データ（FREE） */}
          <div className="grid grid-cols-3 gap-2 text-xs">
            <StatBox label="定員" value={`${h.capacity}名`} />
            <StatBox label="マッチ者数" value={`${h.matched}名`} />
            <StatBox label="空席" value={h.vacancy > 0 ? `${h.vacancy}名` : 'なし'} />
            <StatBox label="倍率" value={`${pop}倍`} highlight />
            <StatBox label="応募者数" value={`${h.applicants}名`} />
            <StatBox label="充足率" value={`${h.matchRate}%`} />
          </div>

          {/* ── iwor独自分析（PRO限定） ── */}
          <div className="relative">
            <div className="bg-s1 rounded-xl p-3 space-y-3">
              <p className="text-[11px] font-bold text-tx flex items-center gap-1">
                📊 iwor独自分析
                {!isPro && <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: '#E8F0EC', color: MC }}>PRO</span>}
              </p>

              {/* スコア4つ横並び */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { label: '偏差値', value: (h as any).hensachi?.toFixed(1), desc: '全病院中の相対人気度' },
                  { label: '穴場度', value: `${(h as any).anabaScore || 0}`, desc: '質が高く競争が少ない' },
                  { label: '志望集中度', value: honmei > 0 ? honmei.toFixed(2) : '--', desc: '第1希望率（同年）' },
                  { label: '安定度', value: `${(h as any).stabilityScore || 0}`, desc: '3年間の充足率のブレ' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-lg p-2 text-center">
                    <p className="text-[9px] text-muted">{s.label}</p>
                    <p className="text-base font-bold" style={{ color: MC }}>{s.value}</p>
                    <p className="text-[8px] text-muted">{s.desc}</p>
                  </div>
                ))}
              </div>

              {/* トレンド情報 */}
              <div className="flex gap-3 text-[10px]">
                {(h as any).popularityTrend && (h as any).popularityTrend !== 1.0 && (
                  <span className={`px-2 py-0.5 rounded ${(h as any).popularityTrend > 1 ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                    {(h as any).popularityTrend > 1 ? '📈' : '📉'} 志望者数 {Math.round(((h as any).popularityTrend - 1) * 100)}%{(h as any).popularityTrend > 1 ? '増' : '減'}（2年間）
                  </span>
                )}
                {(h as any).risingScore > 0 && (
                  <span className="px-2 py-0.5 rounded bg-green-50 text-green-700">🔥 上昇中</span>
                )}
                {(h as any).popularityRank && (
                  <span className="px-2 py-0.5 rounded bg-s2 text-muted">人気順位 {(h as any).popularityRank}/{1470}</span>
                )}
              </div>

              {/* 充足率バー（3年） */}
              <div>
                <p className="text-[9px] text-muted mb-1">3年平均充足率: {(h as any).avgMatchRate3y || h.matchRate}%</p>
                <div className="w-full h-2 bg-white rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${Math.min((h as any).avgMatchRate3y || h.matchRate, 100)}%`, background: MC }} />
                </div>
              </div>

              <p className="text-[8px] text-muted leading-relaxed">
                iwor独自指標です。JRMP公式データ（2022-2025）を統計処理したもので、病院の研修の質を直接評価するものではありません。
              </p>
            </div>

            {/* FREE: モザイク */}
            {!isPro && (
              <div className="absolute inset-0 rounded-xl flex flex-col items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(27,79,58,0.92), rgba(45,122,90,0.92))' }}>
                <p className="text-sm font-bold text-white mb-1">独自分析スコア</p>
                <p className="text-[10px] text-white/70 mb-3">偏差値・穴場度・志望集中度・安定度・トレンド</p>
                <button onClick={e => { e.stopPropagation(); onShowPro?.() }}
                  className="pro-cta-glow px-5 py-2 rounded-xl text-xs font-bold bg-white shadow-lg" style={{ color: MC }}>
                  PRO会員で分析を見る
                </button>
              </div>
            )}
          </div>

          {/* プログラム名 */}
          {h.program && (
            <div>
              <p className="text-[10px] text-muted mb-0.5">研修プログラム名</p>
              <p className="text-xs text-tx">{h.program}</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
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
//  志望 / 志望リスト タブ
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
        <p className="text-xs text-muted mb-4">{listType === 'interested' ? '志望病院リスト' : '志望リスト＆マッチ確率計算'}はPRO会員で使えます</p>
        <button onClick={onShowProModal} className="pro-cta-glow px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: MC }}>
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
            {programLabel(h) && <p className="text-[10px] text-muted truncate">{programLabel(h)}</p>}
            <div className="flex items-center gap-2 text-[10px] text-muted">
              <span>{h.prefecture}</span>
              <span className="font-medium" style={{ color: MC }}>{`${h.popularity}倍`}</span>
              <span>定員{h.capacity}</span>
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
            <button className="pro-cta-glow px-5 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg" style={{ background: MC }}>
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

          {/* 但し書き */}
          <p className="text-[9px] text-muted leading-relaxed mt-2">
            ※ この確率は過去のマッチングデータ（倍率・空席率）に基づく統計的な推定値であり、個人の能力・面接力・筆記試験の結果等は考慮されていません。
            実際のマッチング結果を保証するものではありません。iwor独自の算出です。
          </p>
        </div>
      )}
    </div>
  )
}
