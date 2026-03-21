'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'

interface IndexEntry {
  s: string  // slug
  t: string  // title
  d: string  // description
  c: string  // categoryName
  g: string  // tags
}

interface SearchResult {
  slug: string
  title: string
  description: string
  categoryName: string
}

let cachedIndex: IndexEntry[] | null = null

async function loadIndex(): Promise<IndexEntry[]> {
  if (cachedIndex) return cachedIndex
  const res = await fetch('/search-index.json')
  cachedIndex = await res.json()
  return cachedIndex!
}

function search(index: IndexEntry[], query: string): SearchResult[] {
  const keywords = query.toLowerCase().split(/\s+/).filter(Boolean)
  if (keywords.length === 0) return []

  return index
    .map((entry) => {
      const haystack = `${entry.t} ${entry.d} ${entry.c} ${entry.g}`.toLowerCase()
      const matchCount = keywords.filter((kw) => haystack.includes(kw)).length
      if (matchCount === 0) return null
      return {
        slug: entry.s,
        title: entry.t,
        description: entry.d,
        categoryName: entry.c,
        relevance: matchCount / keywords.length,
      }
    })
    .filter((r): r is SearchResult & { relevance: number } => r !== null)
    .sort((a, b) => b.relevance - a.relevance)
    .slice(0, 10)
}

export default function SearchDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [index, setIndex] = useState<IndexEntry[] | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const open = useCallback(() => {
    setIsOpen(true)
    setQuery('')
    setResults([])
    setSelectedIndex(0)
    if (!index) {
      loadIndex().then(setIndex)
    }
  }, [index])

  const close = useCallback(() => {
    setIsOpen(false)
    setQuery('')
    setResults([])
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        isOpen ? close() : open()
      }
      if (e.key === 'Escape' && isOpen) close()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, open, close])

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  useEffect(() => {
    if (!index || !query.trim()) {
      setResults([])
      return
    }
    setResults(search(index, query.trim()))
    setSelectedIndex(0)
  }, [query, index])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      close()
    }
  }

  if (!isOpen) {
    return (
      <button
        onClick={open}
        className="flex items-center justify-center w-9 h-9 rounded-lg text-muted hover:text-ac hover:bg-s1 transition-colors"
        aria-label="サイト内検索"
        title="検索（⌘K）"
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" />
        </svg>
      </button>
    )
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-tx/40 z-[60] backdrop-blur-sm"
        onClick={close}
      />
      <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh] px-4" onClick={close}>
        <div
          className="w-full max-w-lg bg-s0 rounded-xl shadow-2xl border border-br overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-3 px-4 border-b border-br">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-muted flex-shrink-0"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="記事を検索..."
              className="flex-1 py-3.5 bg-transparent text-tx text-sm outline-none placeholder:text-muted/60"
            />
            <button
              onClick={close}
              className="flex items-center justify-center w-7 h-7 rounded-md text-muted hover:text-tx hover:bg-s1 transition-colors"
              aria-label="閉じる"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18" />
                <path d="M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="max-h-[50vh] overflow-y-auto">
            {query.trim() && results.length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-muted">
                「{query}」に一致する記事が見つかりませんでした
              </div>
            )}
            {results.length > 0 && (
              <ul className="py-2">
                {results.map((result, i) => (
                  <li key={result.slug}>
                    <Link
                      href={`/blog/${result.slug}`}
                      onClick={close}
                      className={`block px-4 py-3 transition-colors ${
                        i === selectedIndex ? 'bg-acl' : 'hover:bg-s1'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs text-muted bg-s1 px-2 py-0.5 rounded">
                          {result.categoryName}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-tx leading-snug">
                        {result.title}
                      </p>
                      <p className="text-xs text-muted mt-0.5 line-clamp-1">
                        {result.description}
                      </p>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
            {!query.trim() && (
              <div className="px-4 py-8 text-center text-sm text-muted">
                キーワードを入力して記事を検索
              </div>
            )}
          </div>

          <div className="px-4 py-2.5 border-t border-br bg-s1/50 flex items-center gap-4 text-xs text-muted">
            <span className="flex items-center gap-1">
              <kbd className="bg-s0 border border-br px-1 py-0.5 rounded font-mono text-[10px]">↑</kbd>
              <kbd className="bg-s0 border border-br px-1 py-0.5 rounded font-mono text-[10px]">↓</kbd>
              移動
            </span>
            <span className="flex items-center gap-1">
              <kbd className="bg-s0 border border-br px-1 py-0.5 rounded font-mono text-[10px]">Enter</kbd>
              開く
            </span>
          </div>
        </div>
      </div>
    </>
  )
}
