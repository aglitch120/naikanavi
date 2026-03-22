'use client'
import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useProStatus } from '@/components/pro/useProStatus'
import ProModal from '@/components/pro/ProModal'
import AppHeader from '@/components/AppHeader'
import { JOURNALS, Journal, TOP4_IDS, SPECIALTIES, GUIDELINE_SOURCES, GuidelineSource } from './journals-data'

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

async function fetchArticlesFromCache(lang: string = 'en'): Promise<Article[]> {
  try {
    const res = await fetch(`${API_BASE}/api/journal?lang=${lang}`)
    const data = await res.json()
    if (data.ok && Array.isArray(data.articles)) return data.articles
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
      // 英語モード: Top4 always + 選択した診療科
      jList = JOURNALS.filter(j =>
        j.category === 'top4' ||
        (selectedSpecialties.size > 0 && j.specialty && selectedSpecialties.has(j.specialty) && j.lang !== 'ja')
      )
      if (ifMin > 0) jList = jList.filter(j => j.impactFactor >= ifMin)
    }
    // Exclude manually hidden journals
    return new Set(jList.map(j => j.id).filter(id => !excludedJournals.has(id)))
  }, [lang, selectedSpecialties, ifMin, excludedJournals])

  // ── Fetch（lang変更時にも再取得）──
  const doFetch = useCallback(async () => {
    setLoading(true); setError('')
    try {
      const res = await fetchArticlesFromCache(lang)
      setArticles(res)
      if (res.length === 0) setError('論文の取得に失敗しました。しばらく待ってから再取得してください。')
    } catch { setError('取得に失敗しました。') }
    setLoading(false)
  }, [lang])

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
      <AppHeader
        title="論文フィード"
        subtitle={`PubMedから最新論文を定期取得。${JOURNALS.length}誌対応。`}
        badge="FREEMIUM"
        favoriteSlug="app-journal"
        favoriteHref="/journal"
      />

      {/* ── Content Type Toggle ── */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setContentType('articles')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
            contentType === 'articles' ? 'text-white border-transparent' : 'bg-s0 border-br text-muted'
          }`}
          style={contentType === 'articles' ? { background: MC } : undefined}>
          論文
        </button>
        <button
          onClick={() => setContentType('guidelines')}
          className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all ${
            contentType === 'guidelines' ? 'text-white border-transparent' : 'bg-s0 border-br text-muted'
          }`}
          style={contentType === 'guidelines' ? { background: MC } : undefined}>
          ガイドライン
        </button>
      </div>

      {/* ── Display Language Toggle ── */}
      <div className={`${contentType === 'guidelines' ? 'opacity-40 pointer-events-none' : ''}`}>
        <div className="flex bg-s1 rounded-xl p-1 mb-3">
          <button onClick={() => setDisplayLang('ja')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${displayLang === 'ja' ? 'bg-s0 shadow-sm' : 'text-muted'}`}
            style={displayLang === 'ja' ? { color: MC } : undefined}>
            🇯🇵 日本語訳
          </button>
          <button onClick={() => setDisplayLang('en')}
            className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${displayLang === 'en' ? 'bg-s0 shadow-sm' : 'text-muted'}`}
            style={displayLang === 'en' ? { color: MC } : undefined}>
            🌍 英語原文
          </button>
        </div>
        <div className="flex gap-1.5 mb-3">
          <button onClick={() => setLang('en')} className={`px-2 py-1 rounded text-[10px] font-medium border ${lang === 'en' ? 'border-ac text-ac' : 'border-br text-muted'}`}>英語誌</button>
          <button onClick={() => setLang('ja')} className={`px-2 py-1 rounded text-[10px] font-medium border ${lang === 'ja' ? 'border-ac text-ac' : 'border-br text-muted'}`}>日本語誌</button>
        </div>
      </div>

      {/* ── フィルタ（折りたたみ） ── */}
      <div className="mb-3">
        <button onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between bg-s0 border border-br rounded-xl px-3 py-2 text-xs font-medium text-tx">
          <span>🔧 詳細フィルタ {selectedSpecialties.size > 0 ? `（${Array.from(selectedSpecialties).join('・')}）` : ''}</span>
          <span className={`text-muted transition-transform ${showAdvanced ? 'rotate-180' : ''}`}>▾</span>
        </button>
        {showAdvanced && (
          <div className="mt-2 space-y-3">

            {/* 診療科フィルタ */}
            <div className="bg-s0 border border-br rounded-xl p-3">
              <p className="text-[11px] font-medium text-tx mb-2">診療科フィルタ（Top 4 は常に表示）</p>
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

      {/* ── Bookmarks / Feed toggle (articles only) ── */}
      {contentType === 'articles' && <div className="flex items-center justify-between mb-4">
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
      </div>}

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
                  isPro={isPro} displayLang={displayLang} />
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
              isPro={isPro} displayLang={displayLang} />
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
function ArticleCard({ article: a, isBookmarked, onToggleBookmark, isPro, displayLang = 'en' }: {
  article: Article; isBookmarked: boolean; onToggleBookmark: () => void; isPro: boolean; displayLang?: 'ja' | 'en'
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
            {displayLang === 'ja' && a.titleJa ? a.titleJa : a.title}
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
            <Link href={`/presenter?type=journal-club&topic=${encodeURIComponent(a.title)}`}
              className="text-[10px] text-ac hover:underline">📚 抄読会資料</Link>
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
