'use client'

import { useEffect, useState, useMemo } from 'react'

interface TocItem {
  id: string
  text: string
  level: number
}

export default function TableOfContents() {
  const [headings, setHeadings] = useState<TocItem[]>([])
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
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
  }, [])

  useEffect(() => {
    if (headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((e) => e.isIntersecting)
        if (visibleEntries.length > 0) {
          setActiveId(visibleEntries[0].target.id)
        }
      },
      {
        rootMargin: '-80px 0px -70% 0px',
        threshold: 0,
      }
    )

    headings.forEach(({ id }) => {
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    })

    return () => observer.disconnect()
  }, [headings])

  // activeIdが属する親H2を特定
  const activeParentH2Id = useMemo(() => {
    if (!activeId) return ''
    const idx = headings.findIndex((h) => h.id === activeId)
    if (idx === -1) return ''
    // activeがH2ならそのまま
    if (headings[idx].level === 2) return headings[idx].id
    // activeがH3なら、直前のH2を探す
    for (let i = idx - 1; i >= 0; i--) {
      if (headings[i].level === 2) return headings[i].id
    }
    return ''
  }, [activeId, headings])

  if (headings.length < 2) return null

  return (
    <nav className="hidden lg:block">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
        目次
      </p>
      <ul className="space-y-0.5 border-l-2 border-br">
        {headings.map((heading, i) => {
          const isH2 = heading.level === 2
          const isActive = activeId === heading.id

          // H3の表示判定：親H2がアクティブな場合のみ表示
          if (!isH2) {
            // 直前のH2を見つける
            let parentH2Id = ''
            for (let j = i - 1; j >= 0; j--) {
              if (headings[j].level === 2) {
                parentH2Id = headings[j].id
                break
              }
            }
            // 親H2がアクティブでなければ非表示
            if (parentH2Id !== activeParentH2Id) return null
          }

          return (
            <li
              key={heading.id}
              className={!isH2 ? 'animate-fadeIn' : ''}
            >
              <a
                href={`#${heading.id}`}
                onClick={(e) => {
                  e.preventDefault()
                  const el = document.getElementById(heading.id)
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
                    history.pushState(null, '', `#${heading.id}`)
                  }
                }}
                className={`block text-sm py-1 transition-colors ${
                  isH2 ? 'pl-3' : 'pl-6'
                } ${
                  isActive
                    ? 'text-ac font-medium border-l-2 border-ac -ml-[2px]'
                    : 'text-muted hover:text-tx'
                }`}
              >
                {heading.text}
              </a>
            </li>
          )
        })}
      </ul>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </nav>
  )
}
