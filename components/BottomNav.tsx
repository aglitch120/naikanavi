'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { trackBoothClick } from '@/lib/gtag'
import { useProStatus } from '@/components/pro/useProStatus'

const baseNavItems = [
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
    label: 'アプリ',
    href: '/app',
    icon: (active: boolean) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
        <line x1="4" y1="22" x2="4" y2="15" />
        <path d="M14 8h4M14 12h4" />
      </svg>
    ),
    exact: false,
  },
]

// PRO タブ
const proTab = {
  label: 'PRO',
  href: '/pro',
  icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
    </svg>
  ),
  exact: true,
}

// お気に入りタブ（PRO会員用）
const favTab = {
  label: 'お気に入り',
  href: '/favorites',
  icon: (active: boolean) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fillOpacity={active ? 0.15 : 0} />
    </svg>
  ),
  exact: true,
}

export default function BottomNav() {
  const pathname = usePathname()
  const { isPro } = useProStatus()

  // PRO会員ならお気に入りタブ、そうでなければPROタブ
  const lastTab = isPro ? favTab : proTab
  const navItems = [...baseNavItems, lastTab]

  const isActive = (item: typeof navItems[0]) => {
    if ('external' in item && item.external) return false
    if (item.exact) return pathname === item.href
    if (item.href === '/blog') return pathname.startsWith('/blog')
    if (item.href === '/app') {
      return pathname.startsWith('/app') || pathname.startsWith('/tools') || pathname.startsWith('/compare')
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
