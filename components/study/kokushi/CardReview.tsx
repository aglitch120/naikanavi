'use client'

import { useState } from 'react'
import Badge from './Badge'

interface CardReviewProps {
  onBack: () => void
}

const RATINGS = [
  { label: 'もう一度', sub: '1分後', colorClass: 'text-dn' },
  { label: '難しい',   sub: '10分後', colorClass: 'text-wn' },
  { label: '普通',     sub: '1日後',  colorClass: 'text-ac' },
  { label: '簡単',     sub: '4日後',  colorClass: 'text-ok' },
] as const

export default function CardReview({ onBack }: CardReviewProps) {
  const [cardFlipped, setCardFlipped] = useState(false)

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="text-sm text-ac font-medium bg-transparent border-none cursor-pointer hover:underline px-0"
        >
          ← 戻る
        </button>
        <span className="text-[16px] font-bold text-tx">CBT基礎</span>
        <Badge color="default">残り12枚</Badge>
      </div>

      {/* Card */}
      <div
        className="relative bg-s0 border border-br rounded-2xl p-11 min-h-[200px] flex flex-col items-center justify-center cursor-pointer select-none mb-5"
        onClick={() => setCardFlipped((v) => !v)}
      >
        {/* Type badge */}
        <span className="absolute top-4 left-4">
          <Badge color="default">機序</Badge>
        </span>

        {!cardFlipped ? (
          <div className="text-center">
            <p className="text-[15px] font-semibold text-tx mb-3">
              IgG4クラススイッチを誘導するサイトカインは？
            </p>
            <p className="text-[12px] text-muted">クリックして回答表示</p>
          </div>
        ) : (
          <div className="text-center animate-fade-in">
            <p className="text-[15px] font-semibold text-ac">
              IL-4, IL-10, IL-13（Th2サイトカイン）
            </p>
          </div>
        )}
      </div>

      {/* Rating buttons */}
      {cardFlipped && (
        <div className="flex gap-2 animate-fade-in">
          {RATINGS.map(({ label, sub, colorClass }) => (
            <button
              key={label}
              onClick={() => setCardFlipped(false)}
              className="flex-1 py-3.5 rounded-[10px] border-[1.5px] border-br bg-s0 cursor-pointer hover:bg-s1 transition-colors flex flex-col items-center gap-0.5"
            >
              <span className={`text-[13px] font-bold ${colorClass}`}>{label}</span>
              <span className="text-[10px] text-muted">{sub}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
