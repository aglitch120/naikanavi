'use client'

import Link from 'next/link'
import { NAV_ITEMS } from './mock-data'
import type { Tab } from './types'

// ── サイドバーの中身（PC・モバイル共通）──
export function SidebarContent({
  tab,
  onNavigate,
}: {
  tab: Tab
  onNavigate: (t: Tab) => void
}) {
  return (
    <>
      {NAV_ITEMS.map(it => (
        <button
          key={it.id}
          onClick={() => onNavigate(it.id)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border-none text-[13px] font-medium cursor-pointer text-left w-full transition-colors ${
            tab === it.id ? 'bg-acl text-ac font-semibold' : 'bg-transparent text-muted hover:bg-s1'
          }`}
        >
          <span className="text-sm w-5 text-center opacity-70">{it.icon}</span>
          {it.label}
          {it.id === 'chat' && (
            <span className="ml-auto text-[9px] px-1.5 py-0.5 rounded bg-[rgba(108,92,231,0.08)] text-[#6C5CE7] font-semibold">AI</span>
          )}
        </button>
      ))}

      {/* ── ホームに戻る ── */}
      <Link
        href="/"
        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium text-muted hover:bg-s1 transition-colors mt-2"
      >
        <span className="text-sm w-5 text-center opacity-70">←</span>
        ホームに戻る
      </Link>

      {/* ── クレジット + PRO ── */}
      <div className="mt-auto pt-3 px-3 border-t border-br" style={{ minWidth: 196 }}>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[11px] text-muted">クレジット</span>
          <span
            className="text-[9px] px-1.5 py-0.5 rounded font-semibold text-white"
            style={{ background: 'linear-gradient(135deg,#1B4F3A,#2D6A4F)' }}
          >PRO</span>
        </div>
        <div className="text-[22px] font-bold font-mono text-tx">
          247<span className="text-xs font-normal text-muted"> / 300</span>
        </div>
        <div className="h-[3px] bg-s2 rounded-full mt-2 overflow-hidden">
          <div className="h-full bg-ac rounded-full" style={{ width: '82%' }} />
        </div>
      </div>
    </>
  )
}

// ── PC サイドバー ──
export default function Sidebar({
  tab,
  sidebarCollapsed,
  sidebarHover,
  onNavigate,
  onToggleCollapse,
  onHoverEnter,
  onHoverLeave,
}: {
  tab: Tab
  sidebarCollapsed: boolean
  sidebarHover: boolean
  onNavigate: (t: Tab) => void
  onToggleCollapse: () => void
  onHoverEnter: () => void
  onHoverLeave: () => void
}) {
  const sidebarVisible = !sidebarCollapsed || sidebarHover

  return (
    <>
      {/* ホバーゾーン（折りたたみ時） */}
      {sidebarCollapsed && !sidebarHover && (
        <div
          onMouseEnter={onHoverEnter}
          className="fixed left-0 w-2 z-50 cursor-e-resize max-md:hidden"
          style={{ top: 56, height: 'calc(100vh - 56px)' }}
        />
      )}

      <nav
        onMouseEnter={() => { if (sidebarCollapsed) onHoverEnter() }}
        onMouseLeave={() => { if (sidebarCollapsed) onHoverLeave() }}
        className={`flex flex-col gap-0.5 shrink-0 box-border bg-s0 overflow-y-auto overflow-x-hidden transition-all duration-200 max-md:hidden ${
          sidebarCollapsed ? 'fixed left-0 z-[60]' : 'sticky'
        } ${sidebarCollapsed && sidebarHover ? 'shadow-xl' : ''}`}
        // PCではメインヘッダー(h-14=56px)の下に配置
        data-sidebar
        style={{
          top: sidebarCollapsed ? 56 : 56,
          height: 'calc(100vh - 56px)',
          width: sidebarVisible ? 220 : 0,
          minWidth: sidebarVisible ? 220 : 0,
          padding: sidebarVisible ? '20px 12px' : 0,
          borderRight: sidebarVisible ? '1px solid #DDD9D2' : 'none',
          opacity: sidebarVisible ? 1 : 0,
        }}
      >
        {/* ロゴ（ホームリンク）+ 折りたたみ */}
        <div className="flex items-center gap-2.5 px-3 py-2 mb-4" style={{ minWidth: 196 }}>
          <Link href="/" className="flex items-center gap-2.5 flex-1 min-w-0">
            <div className="w-[30px] h-[30px] rounded-[9px] bg-ac flex items-center justify-center shrink-0">
              <svg className="w-4 h-4" fill="none" stroke="white" viewBox="0 0 24 24" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 6.253v13M12 6.253C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span className="text-sm font-semibold">iwor Study</span>
          </Link>
          <button
            onClick={onToggleCollapse}
            title={sidebarCollapsed ? 'サイドバーを固定' : 'フォーカスモード'}
            className="p-1 text-muted hover:bg-s1 hover:text-tx rounded-md transition-colors shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {sidebarCollapsed
                ? <><line x1="3" y1="3" x2="3" y2="13" /><polyline points="7,6 10,8 7,10" /></>
                : <><line x1="3" y1="3" x2="3" y2="13" /><polyline points="10,6 7,8 10,10" /></>
              }
            </svg>
          </button>
        </div>

        <SidebarContent tab={tab} onNavigate={onNavigate} />
      </nav>
    </>
  )
}
