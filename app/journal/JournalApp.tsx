'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useProStatus } from '@/components/pro/useProStatus'
import ProModal from '@/components/pro/ProModal'
import FavoriteButton from '@/components/tools/FavoriteButton'
import { JOURNALS, Journal, TOP4_IDS, SPECIALTIES } from './journals-data'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'
const FREE_LIMIT = 3
const BM_KEY = 'iwor_journal_bookmarks'

// ── Article type ──
interface Article {
  pmid: string
  title: string
  authors: string
  journal: string
  journalId: string
  date: string
  doi: string
  impactFactor: number
}

// ── Worker API（サーバーサイドキャッシュ経由） ──
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://iwor-api.mightyaddnine.workers.dev'

async function fetchArticlesFromCache(): Promise<Article[]> {
  try {
    const res = await fetch(`${API_BASE}/api/journal`)
    const data = await res.json()
    if (data.ok && Array.isArray(data.articles)) return data.articles
    return []
  } catch (e) {
    console.error('Journal API error:', e)
    return []
  }
}

// ── Filter mode ──
type FilterMode = 'top4' | 'specialty' | 'custom'

export default function JournalApp() {
  const { isPro } = useProStatus()
  const [showProModal, setShowProModal] = useState(false)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Filters
  const [filterMode, setFilterMode] = useState<FilterMode>('top4')
  const [selectedJournals, setSelectedJournals] = useState<Set<string>>(new Set(TOP4_IDS))
  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<string>>(new Set())
  const [ifMin, setIfMin] = useState(0)
  const [showJournalPicker, setShowJournalPicker] = useState(false)

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try { const r = localStorage.getItem(BM_KEY); return r ? new Set(JSON.parse(r)) : new Set() } catch { return new Set() }
  })
  const [showBookmarks, setShowBookmarks] = useState(false)

  // ── Compute active journal IDs from filters ──
  const activeJournalIds = useMemo(() => {
    let jList: Journal[] = []
    if (filterMode === 'top4') {
      jList = JOURNALS.filter(j => TOP4_IDS.includes(j.id))
    } else if (filterMode === 'specialty') {
      jList = JOURNALS.filter(j =>
        j.category === 'top4' || (j.specialty && selectedSpecialties.has(j.specialty))
      )
    } else {
      jList = JOURNALS.filter(j => selectedJournals.has(j.id))
    }
    if (ifMin > 0) jList = jList.filter(j => j.impactFactor >= ifMin)
    return new Set(jList.map(j => j.id))
  }, [filterMode, selectedJournals, selectedSpecialties, ifMin])

  // ── Fetch（1回だけ、全記事をWorker APIキャッシュから取得）──
  const doFetch = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetchArticlesFromCache()
      setArticles(res)
      if (res.length === 0) setError('論文の取得に失敗しました。しばらく待ってから再取得してください。')
    } catch { setError('取得に失敗しました。') }
    setLoading(false)
  }, [])

  useEffect(() => { doFetch() }, [doFetch])

  // ── Bookmark toggle ──
  const toggleBookmark = useCallback((pmid: string) => {
    if (!isPro) { setShowProModal(true); return }
    setBookmarks(prev => {
      const n = new Set(prev)
      n.has(pmid) ? n.delete(pmid) : n.add(pmid)
      localStorage.setItem(BM_KEY, JSON.stringify(Array.from(n)))
      return n
    })
  }, [isPro])

  // ── Specialty toggle ──
  const toggleSpecialty = useCallback((sp: string) => {
    setSelectedSpecialties(prev => {
      const n = new Set(prev)
      n.has(sp) ? n.delete(sp) : n.add(sp)
      return n
    })
  }, [])

  // ── Journal toggle (custom mode) ──
  const toggleJournal = useCallback((id: string) => {
    setSelectedJournals(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }, [])

  // ── Filtered articles (journal + IF applied client-side) ──
  const filteredArticles = useMemo(() => {
    let list = articles.filter(a => activeJournalIds.has(a.journalId))
    if (ifMin > 0) list = list.filter(a => a.impactFactor >= ifMin)
    return list
  }, [articles, activeJournalIds, ifMin])

  // ── Visible articles (FREE/PRO gate) ──
  const visibleArticles = showBookmarks
    ? filteredArticles.filter(a => bookmarks.has(a.pmid))
    : isPro ? filteredArticles : filteredArticles.slice(0, FREE_LIMIT)
  const hiddenCount = showBookmarks ? 0 : isPro ? 0 : Math.max(0, filteredArticles.length - FREE_LIMIT)

  // ── Export bookmarks to clipboard (for presenter) ──
  const exportBookmarks = useCallback(() => {
    const bm = filteredArticles.filter(a => bookmarks.has(a.pmid))
    if (bm.length === 0) return
    const text = bm.map((a, i) =>
      `${i + 1}. ${a.title}\n   ${a.authors}\n   ${a.journal} (IF: ${a.impactFactor}) | ${a.date}\n   PMID: ${a.pmid}${a.doi ? ` | DOI: ${a.doi}` : ''}\n   https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/`
    ).join('\n\n')
    navigator.clipboard.writeText(`■ ブックマーク論文リスト（${bm.length}件）\n${'─'.repeat(40)}\n\n${text}`)
  }, [filteredArticles, bookmarks])

  return (
    <div className="px-4 py-8">
      {/* ── Header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: MCL }}>
            <svg className="w-5 h-5" style={{ stroke: MC }} viewBox="0 0 24 24" fill="none" strokeWidth={2} strokeLinecap="round">
              <path d="M4 19.5A2.5 2.5 0 016.5 17H20" /><path d="M4 4.5A2.5 2.5 0 016.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-xl font-bold text-tx">論文フィード</h1>
            <p className="text-[11px] text-muted">PubMedから最新論文を定期取得。{JOURNALS.length}誌対応。</p>
          </div>
          <FavoriteButton slug="app-journal" title="論文フィード" href="/journal" type="app" size="sm" />
        </div>
      </div>

      {/* ── Filter Mode Toggle ── */}
      <div className="flex gap-1 mb-4 bg-s1 rounded-xl p-1">
        {([
          { id: 'top4' as FilterMode, label: 'Top 4', icon: '🏆' },
          { id: 'specialty' as FilterMode, label: '診療科別', icon: '🏥' },
          { id: 'custom' as FilterMode, label: 'カスタム', icon: '⚙️' },
        ]).map(m => (
          <button key={m.id} onClick={() => setFilterMode(m.id)}
            className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1 ${
              filterMode === m.id ? 'bg-s0 shadow-sm' : 'text-muted hover:text-tx'
            }`}
            style={filterMode === m.id ? { color: MC } : undefined}>
            <span>{m.icon}</span>{m.label}
          </button>
        ))}
      </div>

      {/* ── Specialty selector (specialty mode) ── */}
      {filterMode === 'specialty' && (
        <div className="bg-s0 border border-br rounded-xl p-3 mb-4">
          <p className="text-[11px] font-medium text-tx mb-2">診療科を選択（複数可）— Top4は常に含む</p>
          <div className="flex flex-wrap gap-1.5">
            {SPECIALTIES.map(sp => (
              <button key={sp} onClick={() => toggleSpecialty(sp)}
                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${
                  selectedSpecialties.has(sp) ? 'text-white border-transparent' : 'border-br text-muted hover:border-ac/30'
                }`}
                style={selectedSpecialties.has(sp) ? { background: MC } : undefined}>
                {sp}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Custom journal selector ── */}
      {filterMode === 'custom' && (
        <div className="bg-s0 border border-br rounded-xl p-3 mb-4">
          <button onClick={() => setShowJournalPicker(!showJournalPicker)}
            className="w-full flex items-center justify-between text-xs font-medium text-tx">
            <span>ジャーナル選択（{selectedJournals.size}誌）</span>
            <span className={`text-muted transition-transform ${showJournalPicker ? 'rotate-180' : ''}`}>▾</span>
          </button>
          {showJournalPicker && (
            <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
              {['top4', 'general', 'specialty'].map(cat => (
                <div key={cat}>
                  <p className="text-[10px] font-bold text-muted uppercase mb-1">
                    {cat === 'top4' ? 'Top 4' : cat === 'general' ? 'General' : 'Specialty'}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {JOURNALS.filter(j => j.category === cat).map(j => (
                      <button key={j.id} onClick={() => toggleJournal(j.id)}
                        className={`px-2.5 py-1 rounded text-[10px] font-medium border transition-all ${
                          selectedJournals.has(j.id) ? 'text-white border-transparent' : 'border-br text-muted hover:border-ac/30'
                        }`}
                        style={selectedJournals.has(j.id) ? { background: MC } : undefined}>
                        {j.shortName} <span className="opacity-60">({j.impactFactor})</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── IF Slider ── */}
      <div className="bg-s0 border border-br rounded-xl p-3 mb-4">
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-medium text-tx">Impact Factor フィルタ</p>
          <span className="text-xs font-bold" style={{ color: MC }}>
            {ifMin === 0 ? 'すべて' : `IF ≧ ${ifMin}`}
          </span>
        </div>
        <input
          type="range" min={0} max={80} step={5} value={ifMin}
          onChange={e => setIfMin(Number(e.target.value))}
          className="w-full h-2 rounded-full appearance-none cursor-pointer"
          style={{
            background: `linear-gradient(to right, ${MC} ${(ifMin / 80) * 100}%, #E8E5DF ${(ifMin / 80) * 100}%)`,
          }}
        />
        <div className="flex justify-between text-[9px] text-muted mt-1">
          <span>0</span><span>20</span><span>40</span><span>60</span><span>80+</span>
        </div>
      </div>

      {/* ── Bookmarks / Feed toggle ── */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button onClick={() => setShowBookmarks(false)}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all ${!showBookmarks ? 'text-white' : 'text-muted border border-br'}`}
            style={!showBookmarks ? { background: MC } : undefined}>
            フィード ({filteredArticles.length})
          </button>
          <button onClick={() => { if (!isPro) { setShowProModal(true); return }; setShowBookmarks(true) }}
            className={`text-xs font-medium px-3 py-1.5 rounded-lg transition-all flex items-center gap-1 ${showBookmarks ? 'text-white' : 'text-muted border border-br'}`}
            style={showBookmarks ? { background: MC } : undefined}>
            ★ ブックマーク ({bookmarks.size})
            {!isPro && <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: MCL, color: MC }}>PRO</span>}
          </button>
        </div>
        {showBookmarks && bookmarks.size > 0 && (
          <button onClick={exportBookmarks} className="text-[10px] text-ac hover:underline flex items-center gap-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" /></svg>
            プレゼン用コピー
          </button>
        )}
      </div>

      {/* ── Loading / Error ── */}
      {loading && (
        <div className="bg-s0 border border-br rounded-xl p-8 text-center mb-4">
          <div className="w-8 h-8 border-2 border-br border-t-ac rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted">論文を取得中...</p>
        </div>
      )}
      {error && !loading && (
        <div className="bg-s0 border border-br rounded-xl p-6 text-center mb-4">
          <p className="text-xs text-muted mb-3">{error}</p>
          <button onClick={doFetch} className="text-xs font-medium px-4 py-2 rounded-lg text-white" style={{ background: MC }}>再取得</button>
        </div>
      )}

      {/* ── Article List ── */}
      {!loading && (
        <div className="space-y-3">
          {visibleArticles.map((a, i) => (
            <ArticleCard key={a.pmid} article={a}
              isBookmarked={bookmarks.has(a.pmid)}
              onToggleBookmark={() => toggleBookmark(a.pmid)}
              isPro={isPro} />
          ))}

          {/* PRO gate */}
          {hiddenCount > 0 && (
            <div className="bg-s0 border border-dashed rounded-xl p-6 text-center" style={{ borderColor: `${MC}40` }}>
              <p className="text-sm font-bold text-tx mb-1">あと{hiddenCount}件の論文があります</p>
              <p className="text-xs text-muted mb-4">PRO会員で全件閲覧＋ブックマーク＋プレゼン連携</p>
              <button onClick={() => setShowProModal(true)}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: MC }}>
                PRO会員になる
              </button>
            </div>
          )}

          {visibleArticles.length === 0 && !loading && !error && (
            <div className="bg-s0 border border-br rounded-xl p-8 text-center">
              <p className="text-sm text-muted">{showBookmarks ? 'ブックマークが空です' : '該当する論文がありません'}</p>
            </div>
          )}
        </div>
      )}

      {showProModal && <ProModal onClose={() => setShowProModal(false)} feature="save" />}
    </div>
  )
}

// ── Article Card ──
function ArticleCard({ article: a, isBookmarked, onToggleBookmark, isPro }: {
  article: Article; isBookmarked: boolean; onToggleBookmark: () => void; isPro: boolean
}) {
  const ifColor = a.impactFactor >= 50 ? '#991B1B' : a.impactFactor >= 20 ? '#B45309' : a.impactFactor >= 10 ? MC : '#6B6760'

  return (
    <div className="bg-s0 border border-br rounded-xl p-4 hover:border-ac/30 transition-all">
      <div className="flex items-start gap-3">
        <div className="flex-1 min-w-0">
          {/* Journal + IF badge */}
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded" style={{ background: MCL, color: MC }}>
              {a.journal}
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: `${ifColor}15`, color: ifColor }}>
              IF {a.impactFactor}
            </span>
            <span className="text-[10px] text-muted">{a.date}</span>
          </div>

          {/* Title */}
          <a href={`https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/`} target="_blank" rel="noopener noreferrer"
            className="text-sm font-bold text-tx hover:text-ac transition-colors leading-snug block mb-1.5">
            {a.title}
          </a>

          {/* Authors */}
          <p className="text-[11px] text-muted truncate">{a.authors}</p>

          {/* Links */}
          <div className="flex items-center gap-3 mt-2">
            <a href={`https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/`} target="_blank" rel="noopener noreferrer"
              className="text-[10px] text-ac hover:underline">PubMed</a>
            {a.doi && (
              <a href={`https://doi.org/${a.doi}`} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-ac hover:underline">DOI</a>
            )}
            <span className="text-[10px] text-muted">PMID: {a.pmid}</span>
          </div>
        </div>

        {/* Bookmark button */}
        <button onClick={onToggleBookmark}
          className={`flex-shrink-0 w-9 h-9 rounded-lg border flex items-center justify-center transition-all ${
            isBookmarked ? 'border-amber-400 bg-amber-50' : 'border-br hover:border-ac/30'
          }`}>
          <span className={`text-base ${isBookmarked ? '' : 'opacity-30'}`}>
            {isBookmarked ? '★' : '☆'}
          </span>
        </button>
      </div>
    </div>
  )
}
