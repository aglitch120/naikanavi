'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import OnboardingModal, { type UserRole, getStoredRole } from './OnboardingModal'

// ── Role → アプリ並び順 ──
const ORDER_BY_ROLE: Record<string, string[]> = {
  student:   ['/matching', '/study', '/presenter', '/tools', '/journal', '/josler', '/epoc', '/josler/summary-generator', '/credits', '/conferences', '/money', '/shift'],
  resident:  ['/tools', '/epoc', '/study', '/journal', '/presenter', '/matching', '/conferences', '/josler', '/josler/summary-generator', '/credits', '/money', '/shift'],
  fellow:    ['/tools', '/josler', '/josler/summary-generator', '/study', '/journal', '/shift', '/presenter', '/matching', '/conferences', '/credits', '/money', '/epoc'],
  attending: ['/tools', '/journal', '/conferences', '/credits', '/study', '/presenter', '/shift', '/matching', '/money', '/epoc', '/josler', '/josler/summary-generator'],
}

// Role別のラベル上書き
const LABEL_OVERRIDES: Record<string, Record<string, string>> = {
  student:   { '/matching': 'マッチング対策' },
  resident:  { '/matching': '転職対策' },
  fellow:    { '/matching': '転職対策' },
  attending: { '/matching': '転職対策' },
}

// 年度切替で属性を自動更新（4/1に研修医→専攻医等）
function autoUpgradeRole(): void {
  if (typeof window === 'undefined') return
  try {
    const role = localStorage.getItem('iwor_user_role')
    const gradYear = localStorage.getItem('iwor_profile') ? JSON.parse(localStorage.getItem('iwor_profile')!).graduationYear : null
    if (!role || !gradYear) return
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1
    if (month < 4) return // 4月以降のみ
    const yearsAfterGrad = year - parseInt(gradYear)
    if (role === 'student' && yearsAfterGrad >= 0) {
      localStorage.setItem('iwor_user_role', 'resident')
    } else if (role === 'resident' && yearsAfterGrad >= 2) {
      localStorage.setItem('iwor_user_role', 'fellow')
    }
  } catch {}
}

interface AppItem {
  href: string
  label: string
  sub?: string
  badge: string
  icon: ReactNode
  featured?: boolean
}

function badgeStyle(badge: string) {
  switch (badge) {
    case 'FREE':  return 'text-muted bg-s1 border border-br'
    case 'PRO':   return 'text-ac bg-acl border border-ac/15'
    case 'NEW':   return 'text-white bg-ac'
    case '準備中': return 'text-muted bg-s1 border border-br'
    default:      return 'text-muted bg-s1 border border-br'
  }
}

export default function HomeAppGrid({ apps }: { apps: AppItem[] }) {
  const [role, setRole] = useState<UserRole>(null)
  const [showRecommend, setShowRecommend] = useState(false)

  useEffect(() => {
    autoUpgradeRole()
    const stored = getStoredRole()
    if (stored) {
      setRole(stored)
    }
  }, [])

  const handleRoleSelect = (selected: UserRole & string) => {
    setRole(selected)
    setTimeout(() => setShowRecommend(true), 100)
    setTimeout(() => setShowRecommend(false), 4500)
  }

  // Role別にアプリを並び替え+ラベル上書き
  const sortedApps = role && ORDER_BY_ROLE[role]
    ? [...apps].sort((a, b) => {
        const order = ORDER_BY_ROLE[role]
        const ai = order.indexOf(a.href)
        const bi = order.indexOf(b.href)
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
      }).map(app => {
        const override = LABEL_OVERRIDES[role]?.[app.href]
        return override ? { ...app, label: override } : app
      })
    : apps

  const recSet = role ? new Set((ORDER_BY_ROLE[role] || []).slice(0, 3)) : new Set<string>()
  const isHighlighted = (href: string) => showRecommend && recSet.has(href)

  return (
    <>
      <OnboardingModal onSelect={handleRoleSelect} />

      {/* Recommendation label */}
      {showRecommend && role && (
        <div className="flex items-center justify-center gap-2 mb-3 animate-fade-in">
          <div className="w-6 h-px bg-ac/30 rounded-full" />
          <p className="text-xs text-ac font-medium">あなたにおすすめ</p>
          <div className="w-6 h-px bg-ac/30 rounded-full" />
        </div>
      )}

      {/* Featured apps (臨床ツール + Study) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3" aria-label="メインアプリ">
        {sortedApps.filter(a => a.featured).map(app => (
            <Link key={app.href} href={app.href}
              className="featured-glow group flex flex-row items-center gap-3 rounded-2xl border py-5 px-4 sm:py-6 sm:px-5 transition-all bg-gradient-to-r from-[#1B4F3A]/[0.06] to-[#1B4F3A]/[0.02] border-[#1B4F3A]/20 hover:border-[#1B4F3A]/40 hover:shadow-lg"
              aria-label={app.label}>
              <div className="w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0"
                style={{ background: '#1B4F3A', color: '#fff' }}>
                {app.icon}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-sm font-bold whitespace-nowrap" style={{ color: '#1B4F3A' }}>{app.label}</span>
                  <span className={`text-[8px] font-bold tracking-wide px-1 py-0.5 rounded-md ${badgeStyle(app.badge)}`}>
                    {app.badge}
                  </span>
                </div>
                {app.sub && <span className="text-[10px] sm:text-[11px] text-muted leading-tight block mt-0.5">{app.sub}</span>}
              </div>
              <svg className="w-4 h-4 text-muted flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </Link>
        ))}
      </div>

      {/* Other apps (4列グリッド) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3" aria-label="アプリ一覧">
        {sortedApps.filter(a => !a.featured).map(app => {
          const isDisabled = app.badge === '準備中'
          const highlighted = isHighlighted(app.href)
          const cls = [
            'group relative flex flex-col items-center gap-2 rounded-2xl border bg-s0 p-4 md:p-5 transition-all',
            isDisabled
              ? 'border-br/60 opacity-60 cursor-default'
              : highlighted
                ? 'border-ac shadow-md ring-2 ring-ac/20 scale-[1.03]'
                : 'border-br hover:border-ac/30 hover:shadow-md',
          ].join(' ')

          const inner = (
            <>
              {/* Badge */}
              <span className={`absolute top-2 right-2 text-[9px] font-bold tracking-wide px-1.5 py-0.5 rounded-md ${
                highlighted ? 'text-white bg-ac' : badgeStyle(app.badge)
              }`}>
                {highlighted ? 'おすすめ' : app.badge}
              </span>

              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${
                isDisabled
                  ? 'bg-s1 text-muted'
                  : highlighted
                    ? 'bg-acl text-ac'
                    : 'bg-s1 text-ac group-hover:bg-acl'
              }`}>
                {app.icon}
              </div>

              {/* Label + Sub */}
              <div className="text-center">
                <span className={`text-xs font-bold leading-tight transition-colors block ${
                  isDisabled
                    ? 'text-muted'
                    : highlighted
                      ? 'text-ac'
                      : 'text-tx group-hover:text-ac'
                }`}>
                  {app.label}
                </span>
                {app.sub && (
                  <span className="text-[9px] text-muted leading-tight block mt-0.5">
                    {app.sub}
                  </span>
                )}
              </div>
            </>
          )

          return isDisabled ? (
            <div key={app.href} className={cls} aria-label={`${app.label}（準備中）`}>{inner}</div>
          ) : (
            <Link key={app.href} href={app.href} className={cls} aria-label={app.label}>{inner}</Link>
          )
        })}
      </div>
    </>
  )
}
