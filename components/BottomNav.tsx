'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  {
    label: 'Study',
    href: '/study',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 6.253v13M12 6.253C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.1 : 0} />
      </svg>
    ),
    match: (p: string) => p.startsWith('/study'),
  },
  {
    label: 'ツール',
    href: '/tools',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
    match: (p: string) => p.startsWith('/tools') || p.startsWith('/compare'),
  },
  {
    label: 'キャリア',
    href: '/matching',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 10v6M2 10l10-5 10 5-10 5z" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.1 : 0} />
        <path d="M6 12v5c0 1.66 2.69 3 6 3s6-1.34 6-3v-5" />
      </svg>
    ),
    match: (p: string) => p.startsWith('/matching') || p.startsWith('/josler') || p.startsWith('/credits') || p.startsWith('/conferences'),
  },
  {
    label: 'マイページ',
    href: '/pro',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
        <circle cx="12" cy="7" r="4" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.1 : 0} />
      </svg>
    ),
    match: (p: string) => p === '/pro' || p.startsWith('/pro/') || p.startsWith('/favorites') || p.startsWith('/settings'),
  },
]

export default function BottomNav() {
  const pathname = usePathname()

  const isActive = (item: typeof navItems[0]) => item.match(pathname)

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
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                className="relative flex flex-col items-center justify-center h-full gap-0.5 active:opacity-70 transition-opacity"
              >
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
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                    style={{ background: 'var(--ac)' }}
                  />
                )}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
