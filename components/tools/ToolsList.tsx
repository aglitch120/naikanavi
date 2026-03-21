'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { tools, implementedTools, categoryLabels, categoryIcons, type ToolCategory, type ToolDefinition } from '@/lib/tools-config'
import FavoriteButton, { FavoritesBar } from '@/components/tools/FavoriteButton'

const categoryOrder: ToolCategory[] = [
  'nephrology', 'cardiology', 'hepatology', 'respiratory',
  'infectious', 'electrolyte', 'neurology', 'hematology',
  'antimicrobial', 'general',
]

export default function ToolsList() {
  const [query, setQuery] = useState('')

  const filtered = useMemo(() => {
    if (!query.trim()) return tools
    const q = query.toLowerCase()
    return tools.filter(t =>
      t.name.toLowerCase().includes(q) ||
      t.nameEn.toLowerCase().includes(q) ||
      t.description.toLowerCase().includes(q) ||
      t.keywords.some(k => k.toLowerCase().includes(q))
    )
  }, [query])

  const grouped = useMemo(() => {
    return filtered.reduce((acc, tool) => {
      if (!acc[tool.category]) acc[tool.category] = []
      acc[tool.category].push(tool)
      return acc
    }, {} as Record<ToolCategory, ToolDefinition[]>)
  }, [filtered])

  return (
    <>
      {/* お気に入りバー */}
      <FavoritesBar />

      {/* 検索窓 */}
      <div className="relative mb-8">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted pointer-events-none"
          fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="search"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="ツール名・キーワードで検索（例: eGFR, 心房細動, Na補正）"
          className="w-full pl-10 pr-10 py-2.5 bg-s0 border border-br rounded-xl text-sm text-tx
                     placeholder:text-muted/50 focus:outline-none focus:ring-2 focus:ring-ac/30 focus:border-ac"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center rounded-full bg-br/50 text-muted hover:text-tx text-xs"
            aria-label="クリア"
          >
            ✕
          </button>
        )}
      </div>

      {/* 検索結果カウント */}
      {query && (
        <p className="text-xs text-muted mb-4">
          {filtered.length}件のツールが見つかりました
        </p>
      )}

      {/* カテゴリ別リスト */}
      {categoryOrder.map(cat => {
        const catTools = grouped[cat]
        if (!catTools || catTools.length === 0) return null
        return (
          <section key={cat} className="mb-8">
            <h2 className="text-base font-bold text-tx mb-3 flex items-center gap-2">
              <span>{categoryIcons[cat]}</span>
              <span>{categoryLabels[cat]}</span>
              <span className="text-xs font-normal text-muted">({catTools.length})</span>
            </h2>
            <div className="grid gap-2">
              {catTools.map(tool => {
                const isLive = implementedTools.has(tool.slug)
                return isLive ? (
                  <Link
                    key={tool.slug}
                    href={`/tools/calc/${tool.slug}`}
                    className="flex items-center justify-between gap-3 p-3 bg-s0 border border-ac/10 rounded-lg hover:border-ac/30 hover:bg-acl transition-colors group"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-tx group-hover:text-ac transition-colors">{tool.name}</p>
                      <p className="text-xs text-muted line-clamp-1">{tool.description}</p>
                    </div>
                    <span className="text-ac text-sm shrink-0">→</span>
                  </Link>
                ) : (
                  <div
                    key={tool.slug}
                    className="flex items-center justify-between gap-3 p-3 bg-s1/50 border border-br/50 rounded-lg opacity-50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-muted">{tool.name}</p>
                      <p className="text-xs text-muted/70 line-clamp-1">{tool.description}</p>
                    </div>
                    <span className="text-[10px] text-muted bg-s2 px-2 py-0.5 rounded shrink-0">準備中</span>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}

      {/* 検索結果0件 */}
      {query && filtered.length === 0 && (
        <div className="text-center py-12 text-muted">
          <p className="text-sm">「{query}」に一致するツールが見つかりませんでした</p>
          <button
            onClick={() => setQuery('')}
            className="text-ac text-sm mt-2 hover:underline"
          >
            検索をクリア
          </button>
        </div>
      )}
    </>
  )
}
