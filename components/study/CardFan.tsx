'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface CardFanItem {
  id: string
  label: string
  emoji: string
  subtitle?: string
  cardCount: number
  dueCount: number
  newCount: number
  color?: string
}

interface CardFanProps {
  title: string
  subtitle?: string
  items: CardFanItem[]
  onSelect: (id: string) => void
  /** Show "+ 新規作成" button in header */
  showAddBtn?: boolean
  onAdd?: () => void
  /** "PRO" badge next to title */
  proBadge?: boolean
  /** Blur overlay on cards (for community PRO gate) */
  proGate?: boolean
}

const CW = 148
const CH = 208
const PEEK = 32
const MAX_VIS = 6

export default function CardFan({ title, subtitle, items, onSelect, showAddBtn, onAdd, proBadge, proGate }: CardFanProps) {
  const [active, setActive] = useState(0)
  const startX = useRef(0)
  const deltaX = useRef(0)
  const [dragging, setDragging] = useState(false)
  const [dx, setDx] = useState(0)
  const wasDrag = useRef(false)

  const go = useCallback((i: number) => {
    setActive(Math.max(0, Math.min(i, items.length - 1)))
  }, [items.length])

  // Touch handlers
  const onTS = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX
    deltaX.current = 0
    wasDrag.current = false
    setDragging(true)
  }, [])
  const onTM = useCallback((e: React.TouchEvent) => {
    if (!dragging) return
    deltaX.current = e.touches[0].clientX - startX.current
    if (Math.abs(deltaX.current) > 8) wasDrag.current = true
    setDx(deltaX.current)
  }, [dragging])
  const onTE = useCallback(() => {
    if (!dragging) return
    setDragging(false)
    if (deltaX.current < -40) go(active + 1)
    else if (deltaX.current > 40) go(active - 1)
    setDx(0)
  }, [dragging, active, go])

  // Mouse handlers
  const onMD = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    startX.current = e.clientX
    deltaX.current = 0
    wasDrag.current = false
    setDragging(true)
  }, [])

  useEffect(() => {
    if (!dragging) return
    const mv = (e: MouseEvent) => {
      deltaX.current = e.clientX - startX.current
      if (Math.abs(deltaX.current) > 8) wasDrag.current = true
      setDx(deltaX.current)
    }
    const up = () => {
      setDragging(false)
      if (deltaX.current < -40) go(active + 1)
      else if (deltaX.current > 40) go(active - 1)
      setDx(0)
    }
    window.addEventListener('mousemove', mv)
    window.addEventListener('mouseup', up)
    return () => { window.removeEventListener('mousemove', mv); window.removeEventListener('mouseup', up) }
  }, [dragging, active, go])

  const handleClick = useCallback((i: number) => {
    if (wasDrag.current) return
    if (i === active) onSelect(items[i].id)
    else go(i)
  }, [active, items, onSelect, go])

  if (items.length === 0) {
    return (
      <div className="mb-6">
        <div className="px-5 mb-2">
          <p className="text-sm font-bold text-tx">{title}</p>
          {subtitle && <p className="text-[11px] text-muted mt-0.5">{subtitle}</p>}
        </div>
        <div className="mx-5 rounded-xl border border-dashed border-br p-6 text-center">
          <p className="text-xs text-muted">準備中</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      {/* Header */}
      <div className="px-5 mb-2.5 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-tx">{title}</p>
            {proBadge && (
              <span className="text-[9px] font-bold px-1.5 py-px rounded border"
                style={{ color: '#D97706', background: '#FEF3C7', borderColor: 'rgba(217,119,6,0.2)' }}>
                PRO
              </span>
            )}
          </div>
          {subtitle && <p className="text-[11px] text-muted mt-0.5">{subtitle}</p>}
        </div>
        {showAddBtn && onAdd && (
          <button
            onClick={onAdd}
            className="bg-s0 border border-br rounded-lg px-2.5 py-1 text-[11px] font-semibold text-ac flex items-center gap-1 hover:border-ac/40 transition-colors"
          >
            <span className="text-sm leading-none">+</span> 新規作成
          </button>
        )}
      </div>

      {/* Card fan area */}
      <div
        onTouchStart={onTS}
        onTouchMove={onTM}
        onTouchEnd={onTE}
        onMouseDown={onMD}
        className="relative select-none"
        style={{
          height: CH + 8,
          marginLeft: 20,
          cursor: dragging ? 'grabbing' : 'grab',
          touchAction: 'pan-y',
        }}
      >
        {items.map((item, i) => {
          const rel = i - active
          if (rel < -1 || rel > MAX_VIS) return null

          const isActive = rel === 0
          const isPrev = rel < 0
          const hasPrev = active > 0

          let x: number
          if (isPrev) {
            x = (dragging ? dx : 0) - CW + 22
          } else if (isActive) {
            x = (dragging ? dx : 0) + (hasPrev ? 28 : 0)
          } else {
            const base = hasPrev ? 28 : 0
            x = base + CW - 14 + (rel - 1) * PEEK
          }

          const z = 100 - Math.abs(rel)
          const op = isPrev ? 0.55 : isActive ? 1 : Math.max(1 - rel * 0.12, 0.3)
          const sc = isPrev ? 0.97 : isActive ? 1 : 1 - rel * 0.012
          const rot = isPrev ? -0.4 : isActive ? 0 : rel * 0.3

          const deckColor = item.color || '#1B4F3A'

          return (
            <div
              key={item.id}
              onClick={() => handleClick(i)}
              className="absolute top-0 left-0"
              style={{
                width: CW,
                height: CH,
                transform: `translateX(${x}px) scale(${sc}) rotate(${rot}deg)`,
                transformOrigin: 'center center',
                zIndex: z,
                opacity: op,
                transition: dragging ? 'none' : 'all 0.35s cubic-bezier(.4,0,.12,1)',
                cursor: 'pointer',
              }}
            >
              <div
                className="w-full h-full rounded-2xl border overflow-hidden flex flex-col"
                style={{
                  background: 'var(--s0)',
                  borderColor: isActive ? deckColor + '45' : 'var(--br)',
                  boxShadow: isActive
                    ? `0 4px 16px ${deckColor}14, 0 1px 4px rgba(0,0,0,0.06)`
                    : '0 1px 3px rgba(0,0,0,0.04)',
                }}
              >
                {/* Color header */}
                <div
                  className="h-[54px] flex items-center justify-center text-2xl relative"
                  style={{ background: `linear-gradient(140deg, ${deckColor}, ${deckColor}BB)` }}
                >
                  {item.emoji}
                </div>

                {/* Body */}
                <div className="px-3 py-2 flex-1 flex flex-col">
                  <p className="text-[13px] font-bold text-tx leading-tight line-clamp-2">
                    {item.label}
                  </p>
                  {item.subtitle && (
                    <p className="text-[10.5px] text-muted mt-0.5 line-clamp-1">{item.subtitle}</p>
                  )}
                  <p className="text-[10.5px] text-muted mt-1">{item.cardCount}枚</p>

                  <div className="mt-auto flex items-center gap-1.5">
                    {item.dueCount > 0 && (
                      <span className="text-[10px] font-semibold px-1.5 py-px rounded bg-acl text-ac">
                        復習 {item.dueCount}
                      </span>
                    )}
                    {item.newCount > 0 && (
                      <span className="text-[10px] font-semibold px-1.5 py-px rounded bg-blue-50 text-blue-600 border border-blue-100">
                        新規 {item.newCount}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* PRO gate overlay */}
              {proGate && (
                <div
                  className="absolute bottom-0 left-0 right-0 rounded-b-2xl flex items-end justify-center pb-2.5 pointer-events-none"
                  style={{
                    height: '50%',
                    background: 'linear-gradient(to bottom, transparent, rgba(254,243,199,0.8) 70%, rgba(254,243,199,0.97))',
                    backdropFilter: 'blur(2px)',
                    WebkitBackdropFilter: 'blur(2px)',
                  }}
                >
                  <span
                    className="text-[10px] font-bold text-white px-3 py-1 rounded-lg pointer-events-auto flex items-center gap-1"
                    style={{ background: '#D97706', boxShadow: '0 2px 8px rgba(217,119,6,0.3)' }}
                  >
                    🔒 PROで使う
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Dot indicators */}
      {items.length > 1 && (
        <div className="flex justify-center gap-1 mt-1">
          {items.map((_, i) => (
            <button
              key={i}
              onClick={() => go(i)}
              className="border-none p-0 transition-all"
              style={{
                width: i === active ? 16 : 5,
                height: 5,
                borderRadius: 3,
                background: i === active ? 'var(--ac)' : 'var(--br)',
                cursor: 'pointer',
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
