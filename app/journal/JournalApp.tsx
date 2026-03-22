'use client'
import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import Link from 'next/link'
import { useProStatus } from '@/components/pro/useProStatus'
import ProModal from '@/components/pro/ProModal'
import AppHeader from '@/components/AppHeader'
import { JOURNALS, Journal, TOP4_IDS, SPECIALTIES, SPECIALTY_KEYWORDS, GUIDELINE_SOURCES, GuidelineSource } from './journals-data'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'
const FREE_LIMIT = 3
const BM_KEY = 'iwor_journal_bookmarks'

// ── Article type ──
interface Article {
  pmid: string
  title: string
  titleJa?: string
  authors: string
  journal: string
  journalId: string
  date: string
  doi: string
  impactFactor: number
}

// ── Worker API（サーバーサイドキャッシュ経由） ──
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'https://iwor-api.mightyaddnine.workers.dev'

async function fetchArticlesFromCache(lang: string = 'en', sort: string = 'date'): Promise<Article[]> {
  try {
    const res = await fetch(`${API_BASE}/api/journal?lang=${lang}&sort=${sort}`, {
      headers: { 'Accept': 'application/json' },
    })
    if (!res.ok) {
      console.error('Journal API HTTP error:', res.status, res.statusText)
      return []
    }
    const data = await res.json()
    if (data.ok && Array.isArray(data.articles)) return data.articles
    console.error('Journal API unexpected response:', data)
    return []
  } catch (e) {
    console.error('Journal API error:', e)
    return []
  }
}

async function fetchGuidelinesFromAPI(specialties: string[]): Promise<Article[]> {
  try {
    const params = specialties.length > 0 ? `&specialties=${encodeURIComponent(specialties.join(','))}` : ''
    const res = await fetch(`${API_BASE}/api/journal?type=guidelines${params}`)
    const data = await res.json()
    if (data.ok && Array.isArray(data.articles)) return data.articles
    return []
  } catch (e) {
    console.error('Guidelines API error:', e)
    return []
  }
}

export default function JournalApp() {
  const { isPro } = useProStatus()
  const [showProModal, setShowProModal] = useState(false)
  const [articles, setArticles] = useState<Article[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [lang, setLang] = useState<'en' | 'ja'>('en')
  const [displayLang, setDisplayLang] = useState<'ja' | 'en'>('ja') // 表示言語（デフォルト日本語訳）

  // 記事統計（コメント数・ブックマーク数）
  const [articleStats, setArticleStats] = useState<Record<string, { comments: number; bookmarks: number }>>({})
  // 並び替え
  const [sortBy, setSortBy] = useState<'date' | 'bm-today' | 'bm-week' | 'bm-month' | 'bm-year'>('date')

  // Content type toggle
  const [contentType, setContentType] = useState<'articles' | 'guidelines'>('articles')
  const [guidelines, setGuidelines] = useState<Article[]>([])
  const [guidelinesLoading, setGuidelinesLoading] = useState(false)
  const [guidelinesError, setGuidelinesError] = useState('')

  // Filters — unified (Top4 always included + specialty + IF)
  const [selectedSpecialties, setSelectedSpecialties] = useState<Set<string>>(new Set())
  const [ifMin, setIfMin] = useState(0)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [excludedJournals, setExcludedJournals] = useState<Set<string>>(new Set())

  // Infinite scroll
  const PAGE_SIZE = 10
  const [displayCount, setDisplayCount] = useState(PAGE_SIZE)
  const sentinelRef = useRef<HTMLDivElement>(null)

  // Bookmarks
  const [bookmarks, setBookmarks] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set()
    try { const r = localStorage.getItem(BM_KEY); return r ? new Set(JSON.parse(r)) : new Set() } catch { return new Set() }
  })
  const [showBookmarks, setShowBookmarks] = useState(false)

  // ── Compute active journal IDs — lang別にデフォルト表示を切替 ──
  const activeJournalIds = useMemo(() => {
    let jList: Journal[]
    if (lang === 'ja') {
      // 日本語モード: 全日本語ジャーナル + 選択した診療科
      jList = JOURNALS.filter(j =>
        j.category === 'japanese' ||
        (selectedSpecialties.size > 0 && j.specialty && selectedSpecialties.has(j.specialty) && j.lang === 'ja')
      )
    } else {
      // 英語モード: 診療科選択なし→全ジャーナル、選択あり→該当診療科+Top4
      if (selectedSpecialties.size === 0) {
        jList = JOURNALS.filter(j => j.lang !== 'ja')
      } else {
        jList = JOURNALS.filter(j =>
          j.category === 'top4' ||
          (j.specialty && selectedSpecialties.has(j.specialty) && j.lang !== 'ja')
        )
      }
      if (ifMin > 0) jList = jList.filter(j => j.impactFactor >= ifMin)
    }
    // Exclude manually hidden journals
    return new Set(jList.map(j => j.id).filter(id => !excludedJournals.has(id)))
  }, [lang, selectedSpecialties, ifMin, excludedJournals])

  // ── Fetch（lang変更時にも再取得）──
  const doFetch = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetchArticlesFromCache(lang, sortBy)
      setArticles(res)
      if (res.length === 0) setError('論文の取得に失敗しました。しばらく待ってから再取得してください。')
      // 統計一括取得
      if (res.length > 0) {
        try {
          const pmids = res.slice(0, 50).map(a => a.pmid).join(',')
          const statsRes = await fetch(`${API_BASE}/api/journal/stats?pmids=${pmids}`)
          const statsData = await statsRes.json()
          if (statsData.ok) setArticleStats(statsData.stats || {})
        } catch {}
      }
    } catch { setError('取得に失敗しました。') }
    setLoading(false)
  }, [lang, sortBy])

  useEffect(() => { doFetch() }, [doFetch])

  // ── Fetch guidelines when tab switches or specialty filter changes ──
  useEffect(() => {
    if (contentType !== 'guidelines') return
    const specialties = Array.from(selectedSpecialties)
    setGuidelinesLoading(true); setGuidelinesError('')
    fetchGuidelinesFromAPI(specialties).then(res => {
      setGuidelines(res)
      setGuidelinesLoading(false)
    }).catch(() => {
      setGuidelinesLoading(false)
    })
  }, [contentType, selectedSpecialties])

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

  // ── Journal exclude toggle (advanced) ──
  const toggleExcludeJournal = useCallback((id: string) => {
    setExcludedJournals(prev => {
      const n = new Set(prev)
      n.has(id) ? n.delete(id) : n.add(id)
      return n
    })
  }, [])

  // ── Filtered articles (journal + IF + Top4 specialty keyword filtering) ──
  const filteredArticles = useMemo(() => {
    let list = articles.filter(a => activeJournalIds.has(a.journalId))
    if (ifMin > 0) list = list.filter(a => a.impactFactor >= ifMin)
    // Top4雑誌の診療科フィルタリング: 診療科選択時、Top4記事はキーワードマッチのみ表示
    if (selectedSpecialties.size > 0) {
      const keywords = Array.from(selectedSpecialties).flatMap(sp => SPECIALTY_KEYWORDS[sp] || [])
      if (keywords.length > 0) {
        list = list.filter(a => {
          if (!TOP4_IDS.includes(a.journalId)) return true // 専門誌はそのまま通す
          const titleLower = (a.title + ' ' + (a.titleJa || '')).toLowerCase()
          return keywords.some(kw => titleLower.includes(kw.toLowerCase()))
        })
      }
    }
    return list
  }, [articles, activeJournalIds, ifMin, selectedSpecialties])

  // ── Visible articles (FREE/PRO gate + infinite scroll) ──
  const gatedArticles = showBookmarks
    ? filteredArticles.filter(a => bookmarks.has(a.pmid))
    : isPro ? filteredArticles : filteredArticles.slice(0, FREE_LIMIT)
  const visibleArticles = gatedArticles.slice(0, displayCount)
  const hasMore = displayCount < gatedArticles.length
  const hiddenCount = showBookmarks ? 0 : isPro ? 0 : Math.max(0, filteredArticles.length - FREE_LIMIT)

  // Reset displayCount when filters/sort/lang change
  useEffect(() => { setDisplayCount(PAGE_SIZE) }, [lang, sortBy, selectedSpecialties, ifMin, showBookmarks, contentType])

  // IntersectionObserver for infinite scroll
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setDisplayCount(prev => prev + PAGE_SIZE)
        }
      },
      { rootMargin: '200px' }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [hasMore])

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
      <AppHeader
        title="論文フィード"
        subtitle={`PubMedから最新論文を定期取得。${JOURNALS.length}誌対応。`}
        badge="FREEMIUM"
        favoriteSlug="app-journal"
        favoriteHref="/journal"
      />

      {/* ── Display Language Toggle ── */}
      <div className="flex bg-s1 rounded-xl p-1 mb-3">
        <button onClick={() => setDisplayLang('ja')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${displayLang === 'ja' ? 'bg-s0 shadow-sm' : 'text-muted'}`}
          style={displayLang === 'ja' ? { color: MC } : undefined}>
          日本語訳
        </button>
        <button onClick={() => setDisplayLang('en')}
          className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${displayLang === 'en' ? 'bg-s0 shadow-sm' : 'text-muted'}`}
          style={displayLang === 'en' ? { color: MC } : undefined}>
          英語原文
        </button>
      </div>

      {/* ── フィルタ（折りたたみ） ── */}
      <div className="mb-3">
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between bg-s0 border border-br rounded-xl px-3 py-2 text-xs font-medium text-tx">
          <span>詳細フィルタ {selectedSpecialties.size > 0 ? `（${Array.from(selectedSpecialties).join('・')}）` : ''}{contentType === 'guidelines' ? ' / ガイドライン' : ''}{lang === 'ja' ? ' / 日本語誌' : ''}</span>
          <span className={`text-muted transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {showAdvanced && (
          <div className="mt-2 space-y-3">

            {/* コンテンツタイプ + 言語 */}
            <div className="bg-s0 border border-br rounded-xl p-3">
              <div className="flex gap-2 mb-2">
                <button onClick={() => setContentType('articles')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${contentType === 'articles' ? 'text-white border-transparent' : 'border-br text-muted'}`}
                  style={contentType === 'articles' ? { background: MC } : undefined}>論文</button>
                <button onClick={() => setContentType('guidelines')}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${contentType === 'guidelines' ? 'text-white border-transparent' : 'border-br text-muted'}`}
                  style={contentType === 'guidelines' ? { background: MC } : undefined}>ガイドライン</button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => setLang('en')} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${lang === 'en' ? 'border-ac text-ac' : 'border-br text-muted'}`}>英語誌</button>
                <button onClick={() => setLang('ja')} className={`px-3 py-1.5 rounded-lg text-[11px] font-medium border transition-all ${lang === 'ja' ? 'border-ac text-ac' : 'border-br text-muted'}`}>日本語誌</button>
              </div>
            </div>

            {/* 診療科フィルタ */}
            <div className="bg-s0 border border-br rounded-xl p-3">
              <p className="text-[11px] font-medium text-tx mb-2">診療科フィルタ（Top 4 は関連論文のみ表示）</p>
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
              {selectedSpecialties.size === 0 && (
                <p className="text-[10px] text-muted mt-2">診療科を選ぶと専門誌も表示されます</p>
              )}
            </div>

            {/* 表示中のジャーナル */}
            <div className="bg-s0 border border-br rounded-xl p-3">
              <p className="text-[11px] font-medium text-tx mb-2">表示中のジャーナル（{activeJournalIds.size}誌）</p>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {['top4', 'general', 'specialty'].map(cat => {
                  const jInCat = JOURNALS.filter(j => j.category === cat && (
                    j.category === 'top4' ||
                    (selectedSpecialties.size > 0 && j.specialty && selectedSpecialties.has(j.specialty))
                  ))
                  if (jInCat.length === 0) return null
                  return (
                    <div key={cat}>
                      <p className="text-[10px] font-bold text-muted uppercase mb-1">
                        {cat === 'top4' ? 'Top 4' : cat === 'general' ? 'General' : 'Specialty'}
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {jInCat.map(j => (
                          <button key={j.id} onClick={() => toggleExcludeJournal(j.id)}
                            className={`px-2.5 py-1 rounded text-[10px] font-medium border transition-all ${
                              excludedJournals.has(j.id) ? 'border-br text-muted line-through opacity-50' : 'text-white border-transparent'
                            }`}
                            style={!excludedJournals.has(j.id) ? { background: MC } : undefined}>
                            {j.shortName} <span className="opacity-60">({j.impactFactor})</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 診療科トップジャーナル */}
            {selectedSpecialties.size > 0 && (
              <div className="bg-s0 border border-br rounded-xl p-3">
                <p className="text-[11px] font-medium text-tx mb-2">選択中の診療科トップジャーナル</p>
                <div className="space-y-2">
                  {Array.from(selectedSpecialties).map(sp => {
                    const spJournals = JOURNALS
                      .filter(j => j.specialty === sp)
                      .sort((a, b) => b.impactFactor - a.impactFactor)
                    return (
                      <div key={sp}>
                        <p className="text-[10px] font-bold text-muted mb-1">{sp}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {spJournals.map(j => (
                            <span key={j.id} className={`text-[10px] font-medium px-2 py-1 rounded-lg border transition-all ${
                              excludedJournals.has(j.id) ? 'border-br text-muted line-through opacity-50' : 'border-transparent text-white'
                            }`} style={!excludedJournals.has(j.id) ? { background: MC } : undefined}>
                              {j.shortName} <span className="opacity-70">IF {j.impactFactor}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* IF スライダー */}
            {contentType === 'articles' && (
              <div className="bg-s0 border border-br rounded-xl p-3">
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
            )}

          </div>
        )}
      </div>

      {/* ── Sort + Feed/Bookmark toggle ── */}
      {contentType === 'articles' && <>
      <div className="flex items-center gap-1.5 mb-2 overflow-x-auto">
        {[
          { id: 'date' as const, label: '新着順' },
          { id: 'bm-today' as const, label: '今日' },
          { id: 'bm-week' as const, label: '今週' },
          { id: 'bm-month' as const, label: '今月' },
          { id: 'bm-year' as const, label: '今年' },
        ].map(s => (
          <button key={s.id} onClick={() => setSortBy(s.id)}
            className={`px-2 py-1 rounded text-[9px] font-medium whitespace-nowrap border transition-all ${
              sortBy === s.id ? 'text-white border-transparent' : 'border-br text-muted'
            }`}
            style={sortBy === s.id ? { background: MC } : undefined}>
            {s.id === 'date' ? '📅' : '🔥'} {s.label}
          </button>
        ))}
      </div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1.5">
          <button onClick={() => setShowBookmarks(false)}
            className={`text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all ${!showBookmarks ? 'text-white' : 'text-muted border border-br'}`}
            style={!showBookmarks ? { background: MC } : undefined}>
            フィード ({filteredArticles.length})
          </button>
          <button onClick={() => { if (!isPro) { setShowProModal(true); return }; setShowBookmarks(true) }}
            className={`text-[10px] font-medium px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 ${showBookmarks ? 'text-white' : 'text-muted border border-br'}`}
            style={showBookmarks ? { background: MC } : undefined}>
            ★ ({bookmarks.size})
            {!isPro && <span className="text-[8px] px-1 py-0.5 rounded" style={{ background: MCL, color: MC }}>PRO</span>}
          </button>
        </div>
        {showBookmarks && bookmarks.size > 0 && (
          <div className="flex items-center gap-2">
            <button onClick={exportBookmarks} className="text-[10px] text-ac hover:underline flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3" /></svg>
              コピー
            </button>
            <Link href="/presenter?type=journal-club" className="text-[10px] text-ac hover:underline flex items-center gap-1">
              🎤 プレゼン作成
            </Link>
          </div>
        )}
      </div>
      </>}

      {/* ── Guidelines View ── */}
      {contentType === 'guidelines' && (
        <>
          {guidelinesLoading && (
            <div className="bg-s0 border border-br rounded-xl p-8 text-center mb-4">
              <div className="w-8 h-8 border-2 border-br border-t-ac rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-muted">ガイドラインを取得中...</p>
            </div>
          )}
          {!guidelinesLoading && guidelines.length === 0 && (
            <div className="bg-s0 border border-br rounded-xl p-8 text-center mb-4">
              <p className="text-sm font-bold text-tx mb-1">ガイドラインの取得に対応準備中です</p>
              <p className="text-xs text-muted mt-1">
                {selectedSpecialties.size > 0
                  ? `選択中の診療科（${Array.from(selectedSpecialties).join('・')}）のガイドラインを近日対応予定です`
                  : '診療科を選ぶと対応学会のガイドラインが表示されます（準備中）'}
              </p>
              <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
                {GUIDELINE_SOURCES
                  .filter(gs => selectedSpecialties.size === 0 || selectedSpecialties.has(gs.specialty))
                  .map(gs => (
                    <span key={gs.id} className="text-[10px] font-medium px-2.5 py-1 rounded-lg border border-br text-muted">
                      {gs.nameShort}
                    </span>
                  ))}
              </div>
            </div>
          )}
          {!guidelinesLoading && guidelines.length > 0 && (
            <div className="space-y-3">
              {guidelines.map(a => (
                <ArticleCard key={a.pmid} article={a}
                  isBookmarked={bookmarks.has(a.pmid)}
                  onToggleBookmark={() => toggleBookmark(a.pmid)}
                  isPro={isPro} displayLang={displayLang} stats={articleStats[a.pmid]} />
              ))}
            </div>
          )}
        </>
      )}

      {/* ── Loading / Error (articles mode) ── */}
      {contentType === 'articles' && loading && (
        <div className="bg-s0 border border-br rounded-xl p-8 text-center mb-4">
          <div className="w-8 h-8 border-2 border-br border-t-ac rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs text-muted">論文を取得中...</p>
        </div>
      )}
      {contentType === 'articles' && error && !loading && (
        <div className="bg-s0 border border-br rounded-xl p-6 text-center mb-4">
          <p className="text-xs text-muted mb-3">{error}</p>
          <button onClick={doFetch} className="text-xs font-medium px-4 py-2 rounded-lg text-white" style={{ background: MC }}>再取得</button>
        </div>
      )}

      {/* ── Article List ── */}
      {contentType === 'articles' && !loading && (
        <div className="space-y-3">
          {visibleArticles.map((a) => (
            <ArticleCard key={a.pmid} article={a}
              isBookmarked={bookmarks.has(a.pmid)}
              onToggleBookmark={() => toggleBookmark(a.pmid)}
              isPro={isPro} displayLang={displayLang} stats={articleStats[a.pmid]} />
          ))}

          {/* Infinite scroll sentinel */}
          {hasMore && (
            <div ref={sentinelRef} className="flex justify-center py-4">
              <div className="w-5 h-5 border-2 border-br border-t-ac rounded-full animate-spin" />
            </div>
          )}

          {/* PRO gate */}
          {hiddenCount > 0 && !hasMore && (
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
function ArticleCard({ article: a, isBookmarked, onToggleBookmark, isPro, displayLang = 'en', stats }: {
  article: Article; isBookmarked: boolean; onToggleBookmark: () => void; isPro: boolean; displayLang?: 'ja' | 'en'
  stats?: { comments: number; bookmarks: number }
}) {
  const [showComments, setShowComments] = useState(false)
  const [comments, setComments] = useState<{ id: string; text: string; displayName: string; createdAt: string }[]>([])
  const [commentText, setCommentText] = useState('')
  const [loadingComments, setLoadingComments] = useState(false)

  const ifColor = a.impactFactor >= 50 ? '#991B1B' : a.impactFactor >= 20 ? '#B45309' : a.impactFactor >= 10 ? MC : '#6B6760'
  const commentCount = stats?.comments || 0
  const bookmarkCount = stats?.bookmarks || 0

  const loadComments = useCallback(async () => {
    setLoadingComments(true)
    try {
      const res = await fetch(`${API_BASE}/api/journal/comments?pmid=${a.pmid}`)
      const data = await res.json()
      if (data.ok) setComments(data.comments || [])
    } catch {}
    setLoadingComments(false)
  }, [a.pmid])

  const postComment = useCallback(async () => {
    if (!commentText.trim()) return
    const token = typeof window !== 'undefined' ? localStorage.getItem('iwor_session_token') : null
    if (!token) return
    try {
      const res = await fetch(`${API_BASE}/api/journal/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ pmid: a.pmid, text: commentText.trim(), displayName: '医師' }),
      })
      const data = await res.json()
      if (data.ok && data.comment) {
        setComments(prev => [...prev, data.comment])
        setCommentText('')
      }
    } catch {}
  }, [a.pmid, commentText])

  return (
    <div className="bg-s0 border border-br rounded-xl overflow-hidden hover:border-ac/30 transition-all">
      <div className="p-3">
        <div className="flex items-start gap-2">
          <div className="flex-1 min-w-0">
            {/* Journal + IF + Date */}
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded" style={{ background: MCL, color: MC }}>{a.journal}</span>
              <span className="text-[9px] font-bold px-1 py-0.5 rounded" style={{ background: `${ifColor}15`, color: ifColor }}>IF {a.impactFactor}</span>
              <span className="text-[9px] text-muted">{a.date}</span>
            </div>

            {/* Title */}
            <a href={`https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/`} target="_blank" rel="noopener noreferrer"
              className="text-xs font-bold text-tx hover:text-ac transition-colors leading-snug block mb-1">
              {displayLang === 'ja' && a.titleJa ? a.titleJa : a.title}
            </a>
            {displayLang === 'ja' && a.titleJa && (
              <p className="text-[9px] text-muted mb-1 line-clamp-1">{a.title}</p>
            )}

            {/* Authors */}
            <p className="text-[10px] text-muted truncate mb-1.5">{a.authors}</p>

            {/* Actions row */}
            <div className="flex items-center gap-2 flex-wrap">
              <a href={`https://pubmed.ncbi.nlm.nih.gov/${a.pmid}/`} target="_blank" rel="noopener noreferrer"
                className="text-[9px] text-ac hover:underline">PubMed</a>
              {a.doi && <a href={`https://doi.org/${a.doi}`} target="_blank" rel="noopener noreferrer"
                className="text-[9px] text-ac hover:underline">DOI</a>}
              <Link href={`/presenter?type=journal-club&topic=${encodeURIComponent(a.title)}`}
                className="text-[9px] text-ac hover:underline">📚 抄読会</Link>

              {/* コメント・ブックマーク数 */}
              <button onClick={() => { setShowComments(!showComments); if (!showComments && comments.length === 0) loadComments() }}
                className="text-[9px] text-muted hover:text-ac flex items-center gap-0.5">
                💬 {commentCount > 0 ? commentCount : ''}
              </button>
              <span className="text-[9px] text-muted flex items-center gap-0.5">★ {bookmarkCount}</span>
            </div>
          </div>

          {/* Bookmark */}
          <button onClick={onToggleBookmark}
            className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center transition-all ${
              isBookmarked ? 'border-amber-400 bg-amber-50' : 'border-br hover:border-ac/30'
            }`}>
            <span className={`text-sm ${isBookmarked ? '' : 'opacity-30'}`}>{isBookmarked ? '★' : '☆'}</span>
          </button>
        </div>
      </div>

      {/* コメントセクション */}
      {showComments && (
        <div className="border-t border-br px-3 py-2 bg-s1/50">
          {loadingComments ? (
            <p className="text-[10px] text-muted text-center py-2">読み込み中...</p>
          ) : comments.length === 0 ? (
            <p className="text-[10px] text-muted text-center py-2">まだコメントはありません</p>
          ) : (
            <div className="space-y-1.5 mb-2 max-h-40 overflow-y-auto">
              {comments.map(c => (
                <div key={c.id} className="text-[10px]">
                  <span className="font-bold text-tx">{c.displayName}</span>
                  <span className="text-muted ml-1">{new Date(c.createdAt).toLocaleDateString('ja-JP')}</span>
                  <p className="text-tx mt-0.5">{c.text}</p>
                </div>
              ))}
            </div>
          )}
          {isPro ? (
            <div className="flex gap-1.5">
              <input value={commentText} onChange={e => setCommentText(e.target.value)}
                placeholder="コメントを追加..."
                className="flex-1 px-2 py-1 bg-bg border border-br rounded text-[10px] outline-none focus:border-ac"
                onKeyDown={e => e.key === 'Enter' && postComment()} />
              <button onClick={postComment} disabled={!commentText.trim()}
                className="px-2 py-1 rounded text-[9px] font-bold text-white disabled:opacity-30" style={{ background: MC }}>送信</button>
            </div>
          ) : (
            <p className="text-[9px] text-center" style={{ color: MC }}>コメントにはPROが必要です</p>
          )}
        </div>
      )}
    </div>
  )
}
