'use client'

import { useState, useEffect } from 'react'

export type UserRole = 'student' | 'resident' | 'fellow' | 'attending' | null

interface RoleOption {
  key: UserRole & string
  label: string
  sub: string
  emoji: string
}

const roles: RoleOption[] = [
  { key: 'student',   label: '医学生',     sub: 'CBT・マッチング・国試', emoji: '🎓' },
  { key: 'resident',  label: '初期研修医',  sub: '臨床ツール・症例記録',   emoji: '🏥' },
  { key: 'fellow',    label: '専攻医',     sub: 'J-OSLER・論文・学会',   emoji: '📋' },
  { key: 'attending', label: '医師',       sub: '臨床ツール・論文・マネー', emoji: '🩺' },
]

const STORAGE_KEY = 'iwor_user_role'

export function getStoredRole(): UserRole {
  if (typeof window === 'undefined') return null
  const v = localStorage.getItem(STORAGE_KEY)
  if (v === 'student' || v === 'resident' || v === 'fellow' || v === 'attending') return v
  return null
}

export function setStoredRole(role: UserRole) {
  if (typeof window === 'undefined' || !role) return
  localStorage.setItem(STORAGE_KEY, role)
}

interface Props {
  onSelect: (role: UserRole & string) => void
  forceShow?: boolean
  onClose?: () => void
}

export default function OnboardingModal({ onSelect, forceShow, onClose }: Props) {
  const [show, setShow] = useState(false)
  const [animateIn, setAnimateIn] = useState(false)

  useEffect(() => {
    if (forceShow) {
      setShow(true)
      requestAnimationFrame(() => setAnimateIn(true))
      return
    }
    const stored = getStoredRole()
    if (!stored) {
      const t = setTimeout(() => {
        setShow(true)
        requestAnimationFrame(() => setAnimateIn(true))
      }, 600)
      return () => clearTimeout(t)
    }
  }, [forceShow])

  const handleSelect = (role: UserRole & string) => {
    setStoredRole(role)
    setAnimateIn(false)
    setTimeout(() => {
      setShow(false)
      onSelect(role)
      onClose?.()
    }, 200)
  }

  if (!show) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-colors duration-200 ${
        animateIn ? 'bg-black/40' : 'bg-black/0'
      }`}
    >
      <div
        className={`w-full sm:max-w-sm mx-auto bg-s0 rounded-t-2xl sm:rounded-2xl border border-br shadow-2xl transition-all duration-300 ${
          animateIn
            ? 'translate-y-0 opacity-100'
            : 'translate-y-8 opacity-0'
        }`}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-2 text-center">
          <p className="text-[11px] text-muted tracking-widest uppercase font-mono mb-1">iwor</p>
          <h2 className="text-lg font-bold text-tx">あなたの立場は？</h2>
          <p className="text-xs text-muted mt-1">おすすめのツールをご案内します</p>
        </div>

        {/* Role options */}
        <div className="px-5 pb-20 sm:pb-5 pt-3 space-y-2">
          {roles.map((r) => (
            <button
              key={r.key}
              onClick={() => handleSelect(r.key)}
              className="w-full flex items-center gap-3.5 px-4 py-3.5 rounded-xl border border-br bg-bg
                         hover:border-ac/30 hover:bg-acl active:scale-[0.98]
                         transition-all text-left group"
            >
              <span className="text-2xl flex-shrink-0">{r.emoji}</span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-tx group-hover:text-ac transition-colors">
                  {r.label}
                </p>
                <p className="text-[11px] text-muted leading-snug">{r.sub}</p>
              </div>
              <svg
                className="w-4 h-4 text-muted ml-auto flex-shrink-0 group-hover:text-ac transition-colors"
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
              >
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          ))}
        </div>

        {/* Skip */}
        <div className="px-5 pb-5">
          <button
            onClick={() => {
              setAnimateIn(false)
              setTimeout(() => setShow(false), 200)
            }}
            className="w-full text-center text-xs text-muted hover:text-tx transition-colors py-2"
          >
            スキップ
          </button>
        </div>
      </div>
    </div>
  )
}
