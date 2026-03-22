'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useProStatus } from '@/components/pro/useProStatus'

export default function BottomNav() {
  const pathname = usePathname()
  const { isPro } = useProStatus()

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
      match: (p: string) => p === '/',
    },
    {
      label: 'お気に入り',
      href: '/favorites',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.15 : 0} />
        </svg>
      ),
      match: (p: string) => p.startsWith('/favorites'),
    },
    {
      label: isPro ? 'マイページ' : 'PRO',
      href: isPro ? '/mypage' : '/pro',
      icon: (active: boolean) => (
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
          <circle cx="12" cy="7" r="4" fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.1 : 0} />
        </svg>
      ),
      match: (p: string) => p === '/pro' || p.startsWith('/pro/') || p.startsWith('/mypage') || p.startsWith('/settings'),
    },
  ]

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
      style={{
        background: 'var(--s0)',
        borderTop: '1px solid var(--br)',
        paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0px)',
      }}
    >
      <ul className="flex items-stretch h-14">
        {navItems.map((item) => {
          const active = item.match(pathname)
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
