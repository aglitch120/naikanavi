'use client'

import { useState, useEffect, type ReactNode } from 'react'
import Link from 'next/link'
import OnboardingModal, { type UserRole, getStoredRole } from './OnboardingModal'

// ── Role → recommended hrefs mapping ──
// Based on PRODUCT.md segment design
const recommendations: Record<string, string[]> = {
  student:   ['/matching', '/study', '/tools'],
  resident:  ['/tools', '/study', '/shift'],
  fellow:    ['/josler', '/journal', '/study'],
  attending: ['/tools', '/journal', '/money'],
}

interface AppItem {
  href: string
  label: string
  badge: string
  icon: ReactNode
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
    const stored = getStoredRole()
    if (stored) {
      setRole(stored)
      // Don't flash highlight for returning users
    }
  }, [])

  const handleRoleSelect = (selected: UserRole & string) => {
    setRole(selected)
    // Animate highlight after modal closes
    setTimeout(() => setShowRecommend(true), 100)
    // Auto-hide highlight after 4 seconds
    setTimeout(() => setShowRecommend(false), 4500)
  }

  const recSet = role ? new Set(recommendations[role] || []) : new Set<string>()
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

      <div className="grid grid-cols-3 md:grid-cols-5 gap-3" aria-label="アプリ一覧">
        {apps.map(app => {
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

              {/* Label */}
              <span className={`text-xs font-bold text-center leading-tight transition-colors ${
                isDisabled
                  ? 'text-muted'
                  : highlighted
                    ? 'text-ac'
                    : 'text-tx group-hover:text-ac'
              }`}>
                {app.label}
              </span>
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
