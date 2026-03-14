'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    label: 'ホーム',
    href: '/',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
        <path d="M9 21V12h6v9" />
      </svg>
    ),
    exact: true,
  },
  {
    label: 'ブログ',
    href: '/blog',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="18" height="18" rx="2" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
        <path d="M7 8h10M7 12h10M7 16h6" />
      </svg>
    ),
    exact: false,
  },
  {
    label: 'カテゴリ',
    href: '/blog/category/josler-basics',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="8" height="8" rx="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
        <rect x="13" y="3" width="8" height="8" rx="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
        <rect x="3" y="13" width="8" height="8" rx="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
        <rect x="13" y="13" width="8" height="8" rx="1.5" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
      </svg>
    ),
    exact: false,
    matchPrefix: '/blog/category',
  },
  {
    label: '購入',
    href: 'https://naikanavi.booth.pm/items/8058590',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
        <line x1="3" y1="6" x2="21" y2="6" />
        <path d="M16 10a4 4 0 01-8 0" />
      </svg>
    ),
    external: true,
    exact: false,
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  const isActive = (item: typeof navItems[0]) => {
    if (item.external) return false
    if ('matchPrefix' in item && item.matchPrefix) {
      return pathname.startsWith(item.matchPrefix)
    }
    if (item.exact) return pathname === item.href
    // /blog はブログ記事ページでもアクティブ（カテゴリ除く）
    if (item.href === '/blog') {
      return pathname.startsWith('/blog') && !pathname.startsWith('/blog/category')
    }
    return pathname.startsWith(item.href)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: 'var(--s0)',
        borderTop: '1px solid var(--br)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <ul className="flex items-stretch h-14">
        {navItems.map((item) => {
          const active = isActive(item)
          const content = (
            <>
              <span
                style={{ color: active ? 'var(--ac)' : 'var(--m)' }}
                className="transition-colors duration-150"
              >
                {item.icon(active)}
              </span>
              <span
                className="text-[10px] mt-0.5 font-medium transition-colors duration-150"
                style={{ color: active ? 'var(--ac)' : 'var(--m)' }}
              >
                {item.label}
              </span>
              {/* アクティブインジケーター */}
              {active && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ background: 'var(--ac)' }}
                />
              )}
            </>
          )

          return (
            <li key={item.href} className="flex-1">
              {item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex flex-col items-center justify-center h-full gap-0.5 active:opacity-70 transition-opacity"
                >
                  {content}
                </a>
              ) : (
                <Link
                  href={item.href}
                  className="relative flex flex-col items-center justify-center h-full gap-0.5 active:opacity-70 transition-opacity"
                >
                  {content}
                </Link>
              )}
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
