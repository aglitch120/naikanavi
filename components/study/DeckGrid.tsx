'use client'

import { useState, useRef, useCallback } from 'react'
import type { DeckFolder } from '@/lib/study-categories'

export interface DeckItem {
  id: string
  label: string
  emoji: string
  subtitle?: string
  cardCount: number
  dueCount: number
  newCount: number
  color?: string
}

// ── 単体デッキカード（横スクロール内の1枚） ──
function DeckCard({ item, onClick }: { item: DeckItem; onClick: () => void }) {
  const color = item.color || '#1B4F3A'
  return (
    <button
      onClick={onClick}
      className="flex-shrink-0 w-[128px] md:w-full bg-s0 border border-br rounded-2xl overflow-hidden text-left transition-all hover:border-ac/40 active:scale-[0.97]"
    >
      <div
        className="h-11 flex items-center justify-center text-xl"
        style={{ background: `linear-gradient(140deg, ${color}, ${color}BB)` }}
      >
        {item.emoji}
      </div>
      <div className="px-2.5 py-2 flex flex-col gap-0.5">
        <p className="text-[12px] font-bold text-tx leading-tight line-clamp-2 min-h-[32px]">
          {item.label}
        </p>
        <p className="text-[10px] text-muted">{item.cardCount}枚</p>
        <div className="flex items-center gap-1 mt-0.5 min-h-[18px] flex-wrap">
          {item.dueCount > 0 && (
            <span className="text-[9px] font-semibold px-1.5 py-px rounded bg-acl text-ac">
              復習{item.dueCount}
            </span>
          )}
          {item.newCount > 0 && (
            <span className="text-[9px] font-semibold px-1.5 py-px rounded bg-blue-50 text-blue-600 border border-blue-100">
              新規{item.newCount}
            </span>
          )}
        </div>
      </div>
    </button>
  )
}

// ── 横スクロールリスト（PC: 矢印ボタン付き） ──
function HScrollList({ items, onSelect }: { items: DeckItem[]; onSelect: (id: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 8)
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 8)
  }, [])

  const scroll = useCallback((dir: 'left' | 'right') => {
    const el = scrollRef.current
    if (!el) return
    el.scrollBy({ left: dir === 'right' ? 280 : -280, behavior: 'smooth' })
  }, [])

  return (
    <div className="relative group">
      {/* 左矢印（PC hover時に表示） */}
      {canScrollLeft && (
        <button
          onClick={() => scroll('left')}
          className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-white/90 border border-br shadow-md text-muted hover:text-tx transition-all opacity-0 group-hover:opacity-100"
          aria-label="左へスクロール"
        >
          ‹
        </button>
      )}
      {/* PC: グリッド / スマホ: 横スクロール */}
      <div
        ref={scrollRef}
        onScroll={updateScrollState}
        className="flex gap-2.5 overflow-x-auto pb-1 -mx-5 px-5 md:grid md:grid-cols-5 md:gap-3 md:overflow-visible md:mx-0 md:px-0 md:pb-0"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
      >
        {items.map(item => (
          <DeckCard key={item.id} item={item} onClick={() => onSelect(item.id)} />
        ))}
      </div>
      {/* 右矢印（PC hover時に表示） */}
      {canScrollRight && (
        <button
          onClick={() => scroll('right')}
          className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 items-center justify-center rounded-full bg-white/90 border border-br shadow-md text-muted hover:text-tx transition-all opacity-0 group-hover:opacity-100"
          aria-label="右へスクロール"
        >
          ›
        </button>
      )}
    </div>
  )
}

// ── フォルダ行（スマホ: toggle、PC: 常時展開グリッド） ──
function FolderRow({
  folder, items, isOpen, onToggle, onSelectDeck,
}: {
  folder: DeckFolder; items: DeckItem[]; isOpen: boolean
  onToggle: () => void; onSelectDeck: (id: string) => void
}) {
  const totalCards = items.reduce((s, d) => s + d.cardCount, 0)
  const totalDue = items.reduce((s, d) => s + d.dueCount + d.newCount, 0)

  return (
    <div>
      {/* フォルダヘッダー（スマホ: toggle、PC: ラベルのみ） */}
      <button
        onClick={onToggle}
        className={`w-full rounded-xl border px-3.5 py-2.5 text-left transition-all md:cursor-default ${
          isOpen ? 'bg-acl border-ac/30' : 'bg-s0 border-br hover:border-ac/30'
        } md:bg-transparent md:border-0 md:px-0 md:py-1`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-base">{folder.emoji}</span>
            <div>
              <p className="text-[13px] font-bold text-tx">{folder.title}</p>
              <p className="text-[10px] text-muted">{items.length}デッキ · {totalCards}枚</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {totalDue > 0 && (
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-acl text-ac">{totalDue}</span>
            )}
            <span className="text-muted text-xs transition-transform duration-200 md:hidden" style={{ transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>▶</span>
          </div>
        </div>
      </button>
      {/* スマホ: toggle開閉の横スクロール */}
      {isOpen && (
        <div className="mt-2 md:hidden">
          <HScrollList items={items} onSelect={onSelectDeck} />
        </div>
      )}
      {/* PC: 常時展開のグリッド */}
      <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 mt-2">
        {items.map(item => (
          <DeckCard key={item.id} item={item} onClick={() => onSelectDeck(item.id)} />
        ))}
      </div>
    </div>
  )
}

// ═══════════════════════════════════════════
// DeckGrid メイン
// ═══════════════════════════════════════════
interface DeckGridProps {
  title: string
  subtitle?: string
  items: DeckItem[]
  onSelect: (id: string) => void
  folders?: DeckFolder[]
  showAddBtn?: boolean
  onAdd?: () => void
  proBadge?: boolean
}

export default function DeckGrid({
  title, subtitle, items, onSelect,
  folders, showAddBtn, onAdd, proBadge,
}: DeckGridProps) {
  const [openFolder, setOpenFolder] = useState<string | null>(null)

  if (items.length === 0 && !folders?.length) {
    return (
      <div className="mb-5 px-5">
        <p className="text-sm font-bold text-tx">{title}</p>
        {subtitle && <p className="text-[11px] text-muted mt-0.5">{subtitle}</p>}
        <div className="rounded-xl border border-dashed border-br p-5 text-center mt-2">
          <p className="text-xs text-muted">準備中</p>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-5 px-5">
      {/* ヘッダー */}
      <div className="flex items-end justify-between mb-2">
        <div>
          <div className="flex items-center gap-1.5">
            <p className="text-sm font-bold text-tx">{title}</p>
            {proBadge && (
              <span className="text-[9px] font-bold px-1.5 py-px rounded border"
                style={{ color: '#D97706', background: '#FEF3C7', borderColor: 'rgba(217,119,6,0.2)' }}>PRO</span>
            )}
          </div>
          {subtitle && <p className="text-[11px] text-muted mt-0.5">{subtitle}</p>}
        </div>
        {showAddBtn && onAdd && (
          <button onClick={onAdd}
            className="bg-s0 border border-br rounded-lg px-2.5 py-1 text-[11px] font-semibold text-ac flex items-center gap-1 hover:border-ac/40 transition-colors">
            <span className="text-sm leading-none">+</span> 新規作成
          </button>
        )}
      </div>

      {/* フォルダ構造（国試） */}
      {folders && folders.length > 0 ? (
        <div className="space-y-2">
          {folders.map(folder => {
            const folderItems = folder.deckIds
              .map(id => items.find(i => i.id === id))
              .filter((i): i is DeckItem => i != null)
            if (folderItems.length === 0) return null
            return (
              <FolderRow
                key={folder.id}
                folder={folder}
                items={folderItems}
                isOpen={openFolder === folder.id}
                onToggle={() => setOpenFolder(openFolder === folder.id ? null : folder.id)}
                onSelectDeck={onSelect}
              />
            )
          })}
        </div>
      ) : (
        <>
          {/* スマホ: 横スクロール */}
          <div className="md:hidden">
            <HScrollList items={items} onSelect={onSelect} />
          </div>
          {/* PC: グリッド */}
          <div className="hidden md:grid md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5">
            {items.map(item => (
              <DeckCard key={item.id} item={item} onClick={() => onSelect(item.id)} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
