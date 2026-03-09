'use client'

import { useEffect, useState } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

export default function InlineTableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    // 少し遅延してDOMから見出しを取得（MDXレンダリング後）
    const timer = setTimeout(() => {
      const article = document.querySelector('.prose')
      if (!article) return

      const elements = article.querySelectorAll('h2, h3')
      const items: TocItem[] = []

      elements.forEach((el, index) => {
        if (!el.id) {
          el.id = `heading-${index}`
        }
        items.push({
          id: el.id,
          text: el.textContent || '',
          level: el.tagName === 'H2' ? 2 : 3,
        })
      })

      setHeadings(items)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  if (headings.length < 2) return null

  const h2Only = headings.filter((h) => h.level === 2)
  const previewItems = h2Only.slice(0, 4)
  const hasMore = h2Only.length > 4

  return (
    <nav className="bg-s0 border border-br rounded-xl p-4 my-6">
      {/* ヘッダー（クリックで開閉） */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-2 text-left"
      >
        <span className="text-sm font-semibold text-tx flex items-center gap-2">
          <svg className="w-4 h-4 text-ac" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h10M4 18h12" />
          </svg>
          この記事の目次
        </span>
        <svg
          className={`w-4 h-4 text-muted transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
          fill="none" stroke="currentColor" viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* 折りたたみ時：H2のプレビュー4件 */}
      {!isOpen && (
        <ul className="mt-3 space-y-1.5">
          {previewItems.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                }}
                className="text-sm text-muted hover:text-ac transition-colors block py-0.5"
              >
                {heading.text}
              </a>
            </li>
          ))}
          {hasMore && (
            <li>
              <button
                onClick={() => setIsOpen(true)}
                className="text-sm text-ac hover:underline py-0.5"
              >
                ...他{h2Only.length - 4}件を表示
              </button>
            </li>
          )}
        </ul>
      )}

      {/* 展開時：全見出し（H2+H3） */}
      {isOpen && (
        <ul className="mt-3 space-y-1">
          {headings.map((heading) => (
            <li key={heading.id}>
              <a
                href={`#${heading.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  document.getElementById(heading.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                  setIsOpen(false)
                }}
                className={`text-sm text-muted hover:text-ac transition-colors block py-0.5 ${
                  heading.level === 3 ? 'pl-4 text-xs' : 'font-medium'
                }`}
              >
                {heading.text}
              </a>
            </li>
          ))}
        </ul>
      )}
    </nav>
  )
}
