'use client'

import Image from 'next/image'
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
        <Link href="/">
          <Image src="/icon.png" alt="iwor" width={26} height={26} className="rounded-[7px]" />
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
                <Image src="/icon.png" alt="iwor" width={30} height={30} className="rounded-[9px]" />
                <div>
                  <div className="text-sm font-semibold">iwor study</div>
                  <div className="text-[10px] text-muted font-medium">医師国家試験</div>
                </div>
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
