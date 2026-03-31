'use client'

import Link from 'next/link'
import { NAV_ITEMS } from './mock-data'
import { SidebarContent } from './Sidebar'
import type { Tab } from './types'

export default function MobileNav({
  tab,
  mobileMenuOpen,
  onNavigate,
  onClose,
  onOpen,
}: {
  tab: Tab
  mobileMenuOpen: boolean
  onNavigate: (t: Tab) => void
  onClose: () => void
  onOpen: () => void
}) {
  return (
    <>
      {/* ── モバイルヘッダー ── */}
      <div className="fixed top-0 left-0 right-0 z-[100] bg-s0 border-b border-br px-4 py-2.5 items-center gap-3 hidden max-md:flex">
        <button onClick={onOpen} className="p-1">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="3" y1="6" x2="19" y2="6" />
            <line x1="3" y1="11" x2="19" y2="11" />
            <line x1="3" y1="16" x2="19" y2="16" />
          </svg>
        </button>
        <Link href="/" className="flex items-center gap-2">
          <div className="w-[26px] h-[26px] rounded-[7px] bg-ac flex items-center justify-center">
            <svg className="w-3.5 h-3.5" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 6.253v13M12 6.253C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
        </Link>
        <span className="text-[13px] font-semibold flex-1">
          {NAV_ITEMS.find(n => n.id === tab)?.label}
        </span>
        <span
          className="text-[9px] px-1.5 py-0.5 rounded font-semibold text-white"
          style={{ background: 'linear-gradient(135deg,#1B4F3A,#2D6A4F)' }}
        >PRO</span>
      </div>

      {/* ── モバイルドロワー ── */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-[200] md:hidden">
          <div className="absolute inset-0 bg-black/30" onClick={onClose} />
          <div className="absolute top-0 left-0 bottom-0 w-[260px] bg-s0 p-5 flex flex-col gap-0.5 shadow-xl overflow-y-auto animate-[slideRight_0.2s_ease]">
            <div className="flex items-center justify-between mb-4">
              <Link href="/" className="flex items-center gap-2.5">
                <div className="w-[30px] h-[30px] rounded-[9px] bg-ac flex items-center justify-center">
                  <svg className="w-4 h-4" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 6.253v13M12 6.253C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </div>
                <span className="text-sm font-semibold">iwor Study</span>
              </Link>
              <button onClick={onClose} className="text-lg text-muted p-1">✕</button>
            </div>
            <SidebarContent
              tab={tab}
              onNavigate={(t) => { onNavigate(t); onClose() }}
            />
          </div>
        </div>
      )}
    </>
  )
}
