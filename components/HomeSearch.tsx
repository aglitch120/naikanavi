'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

interface IndexEntry {
  s: string
  t: string
  d: string
  c: string
  g: string
}

interface SearchResult {
  slug: string
  title: string
  description: string
  categoryName: string
  type: 'article' | 'app' | 'tool'
  href: string
}

import { tools, implementedTools } from '@/lib/tools-config'

// 正規化: ハイフン・記号・スペースを除去してあいまい一致
function normalize(s: string): string {
  return s.toLowerCase().replace(/[-_・．.　\s₂]/g, '')
}

// App/tool entries for search
const appEntries: SearchResult[] = [
  { slug: 'tools', title: '臨床ツール', description: '臨床計算178種・薬剤ガイド・比較・手技・基準値・γ計算', categoryName: 'アプリ', type: 'app', href: '/tools' },
  { slug: 'study', title: 'iwor Study', description: '医学フラッシュカード — CBT・国試・専門医対策', categoryName: 'アプリ', type: 'app', href: '/study' },
  { slug: 'josler', title: '研修記録（J-OSLER）', description: 'J-OSLER JOSLER ジェイオスラー 症例登録・進捗管理 EPOC 内科専攻', categoryName: 'アプリ', type: 'app', href: '/josler' },
  { slug: 'matching', title: 'マッチング・転職対策', description: '履歴書作成・病院検索・書類生成 マッチング対策', categoryName: 'アプリ', type: 'app', href: '/matching' },
  { slug: 'journal', title: '論文フィード', description: '最新論文の日本語要約・ブックマーク PubMed', categoryName: 'アプリ', type: 'app', href: '/journal' },
  { slug: 'presenter', title: 'プレゼン資料生成', description: '学会・カンファ・コンサル用テンプレート 抄読会', categoryName: 'アプリ', type: 'app', href: '/presenter' },
  { slug: 'money', title: 'マネー', description: 'ふるさと納税・手取り概算・NISA・確定申告 節税', categoryName: 'アプリ', type: 'app', href: '/money' },
  { slug: 'credits', title: '専門医単位', description: '専門医単位 更新 学会 単位管理 リマインダー', categoryName: 'アプリ', type: 'app', href: '/credits' },
  { slug: 'conferences', title: '学会カレンダー', description: '学会 カレンダー 日程 演題締切', categoryName: 'アプリ', type: 'app', href: '/conferences' },
  { slug: 'shift', title: 'シフト', description: 'シフト管理 当直 カレンダー', categoryName: 'アプリ', type: 'app', href: '/shift' },
  { slug: 'calc', title: '臨床計算ツール一覧', description: 'eGFR CHA2DS2VASc SOFA Wells ADROP qSOFA BMI BSA 補正Na AG', categoryName: 'ツール', type: 'tool', href: '/tools/calc' },
  { slug: 'drugs', title: '薬剤ガイド', description: '抗菌薬スペクトラム・エンピリック・ステロイド換算・オピオイド換算・腎機能別用量', categoryName: 'ツール', type: 'tool', href: '/tools/drugs' },
  { slug: 'compare', title: '薬剤比較', description: '降圧薬・スタチン・DPP4・SGLT2・GLP1・PPI・DOAC・抗血小板', categoryName: 'ツール', type: 'tool', href: '/compare' },
  { slug: 'procedures', title: '手技ガイド', description: 'CV・Aライン・腰椎穿刺・胸腔穿刺・腹腔穿刺・気管挿管', categoryName: 'ツール', type: 'tool', href: '/tools/procedures' },
  { slug: 'lab-values', title: '基準値早見表', description: '血算・生化学・凝固・血液ガスの基準値', categoryName: 'ツール', type: 'tool', href: '/tools/interpret/lab-values' },
  { slug: 'gamma', title: 'γ計算', description: 'DOA・DOB・NAd・ニカルジピン・ニトログリセリン ガンマ計算', categoryName: 'ツール', type: 'tool', href: '/tools/calc/gamma' },
  { slug: 'combination', title: '配合錠リスト', description: '高血圧・脂質異常症・糖尿病の配合錠一覧', categoryName: 'ツール', type: 'tool', href: '/tools/drugs/combination' },
  // 個別計算ツール178種
  ...tools.filter(t => implementedTools.has(t.slug)).map(t => ({
    slug: t.slug,
    title: t.name,
    description: `${t.nameEn || ''} ${t.description} ${(t.keywords || []).join(' ')}`,
    categoryName: '計算ツール',
    type: 'tool' as const,
    href: `/tools/calc/${t.slug}`,
  })),
]

let cachedIndex: IndexEntry[] | null = null

async function loadIndex(): Promise<IndexEntry[]> {
  if (cachedIndex) return cachedIndex
  const res = await fetch('/search-index.json')
  cachedIndex = await res.json()
  return cachedIndex!
}

function searchAll(index: IndexEntry[], query: string): SearchResult[] {
  const normalizedQuery = normalize(query)
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (keywords.length === 0) return []

  // Search apps/tools (normalize matching)
  const appResults = appEntries
    .map(entry => {
      const haystack = normalize(`${entry.title} ${entry.description} ${entry.categoryName} ${entry.slug}`)
      // normalized match (josler → josler in "josler症例登録")
      const normalMatch = haystack.includes(normalizedQuery) ? 1 : 0
      // keyword match
      const kwHaystack = `${entry.title} ${entry.description} ${entry.categoryName}`.toLowerCase()
      const matchCount = keywords.filter(kw => kwHaystack.includes(kw)).length
      const score = normalMatch + matchCount / keywords.length
      if (score === 0) return null
      return { ...entry, relevance: score + (entry.type === 'app' ? 0.5 : 0.3) }
    })
    .filter(r => r !== null) as (SearchResult & { relevance: number })[]

  // Search articles
  const articleResults = index
    .map(entry => {
      const haystack = normalize(`${entry.t} ${entry.d} ${entry.c} ${entry.g}`)
      const normalMatch = haystack.includes(normalizedQuery) ? 1 : 0
      const kwHaystack = `${entry.t} ${entry.d} ${entry.c} ${entry.g}`.toLowerCase()
      const matchCount = keywords.filter(kw => kwHaystack.includes(kw)).length
      const score = normalMatch + matchCount / keywords.length
      if (score === 0) return null
      return {
        slug: entry.s,
        title: entry.t,
        description: entry.d,
        categoryName: entry.c,
        type: 'article' as const,
        href: `/blog/${entry.s}`,
        relevance: score,
      }
    })
    .filter(r => r !== null) as (SearchResult & { relevance: number })[]

  return [...appResults, ...articleResults]
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 12)
}

export default function HomeSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [index, setIndex] = useState<IndexEntry[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const router = useRouter()

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setResults([])
  }, [])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        close()
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isOpen, close])

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      return
    }
    if (!index) {
      loadIndex().then(loaded => {
        setIndex(loaded)
        setResults(searchAll(loaded, query.trim()))
      })
    } else {
      setResults(searchAll(index, query.trim()))
    }
    setSelectedIndex(0)
  }, [query, index])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      router.push(results[selectedIndex].href)
      close()
    } else if (e.key === 'Escape') {
      close()
    }
  }

  const typeLabel = (type: string) => {
    switch (type) {
      case 'app': return 'アプリ'
      case 'tool': return 'ツール'
      default: return '記事'
    }
  }

  const typeColor = (type: string) => {
    switch (type) {
      case 'app': return 'text-ac bg-acl'
      case 'tool': return 'text-ac bg-acl'
      default: return 'text-muted bg-s1'
    }
  }

  return (
    <div ref={containerRef} className="relative max-w-lg mx-auto">
      <div
        className={`flex items-center gap-3 bg-s0 border rounded-xl px-4 py-3 transition-all ${
          isOpen ? 'border-ac/40 shadow-md' : 'border-br hover:border-ac/20'
        }`}
      >
        <svg
          className="w-4.5 h-4.5 text-muted flex-shrink-0"
          width="18" height="18"
          viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setIsOpen(true) }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="アプリ・ツール・記事を検索..."
          className="flex-1 bg-transparent text-sm text-tx outline-none placeholder:text-muted/50"
        />
        {query && (
          <button
            onClick={() => { setQuery(''); setResults([]) }}
            className="text-muted hover:text-tx transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Dropdown results */}
      {isOpen && query.trim() && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-s0 border border-br rounded-xl shadow-lg overflow-hidden z-50">
          {results.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted">
              「{query}」に一致する結果がありません
            </div>
          ) : (
            <ul className="py-1.5 max-h-[50vh] overflow-y-auto">
              {results.map((result, i) => (
                <li key={`${result.type}-${result.slug}`}>
                  <Link
                    href={result.href}
                    onClick={close}
                    className={`block px-4 py-2.5 transition-colors ${
                      i === selectedIndex ? 'bg-acl' : 'hover:bg-s1'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${typeColor(result.type)}`}>
                        {typeLabel(result.type)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-tx leading-snug">{result.title}</p>
                    <p className="text-xs text-muted mt-0.5 line-clamp-1">{result.description}</p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
