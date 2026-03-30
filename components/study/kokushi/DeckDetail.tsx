'use client'

import { useState } from 'react'
import { MOCK_DECKS, MOCK_DECK_CARDS } from './mock-data'
import Badge from './Badge'
import AddCardsModal from './AddCardsModal'

interface DeckDetailProps {
  deckId: number
  onBack: () => void
  onStartReview: () => void
}

type SortMode = 'created' | 'due' | 'random'

const SORT_OPTIONS: [SortMode, string][] = [
  ['created', '作成順'],
  ['due', '復習日順'],
  ['random', 'ランダム'],
]

export default function DeckDetail({ deckId, onBack, onStartReview }: DeckDetailProps) {
  const [showAddCards, setShowAddCards] = useState(false)
  const [sort, setSort] = useState<SortMode>('created')

  const deck = MOCK_DECKS.find((d) => d.id === deckId) ?? MOCK_DECKS[0]

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="text-sm text-ac font-medium bg-transparent border-none cursor-pointer hover:underline px-0"
        >
          ← デッキ一覧
        </button>
        <span className="text-m text-sm">/</span>
        <h1 className="text-[18px] font-bold text-tx m-0">{deck.name}</h1>
        <Badge color="default">{deck.cards}枚</Badge>
      </div>

      {/* Settings bar */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <button
          onClick={() => setShowAddCards((v) => !v)}
          className="px-3.5 py-1.5 rounded-lg bg-ac text-white text-xs font-semibold border-none cursor-pointer hover:bg-ac2 transition-colors"
        >
          + カードを追加
        </button>

        {/* Sort pill toggle */}
        <div className="flex bg-s1 rounded-lg p-0.5">
          {SORT_OPTIONS.map(([k, l]) => (
            <button
              key={k}
              onClick={() => setSort(k)}
              className={`px-3 py-1 rounded-md text-xs font-medium border-none cursor-pointer transition-all
                ${sort === k ? 'bg-s0 text-tx shadow-sm font-semibold' : 'bg-transparent text-muted'}`}
            >
              {l}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1.5 ml-auto">
          <button className="px-3 py-1.5 rounded-lg border border-br bg-s0 text-xs text-m cursor-pointer hover:bg-s1 transition-colors">
            🔒 Private
          </button>
          <button className="px-3 py-1.5 rounded-lg border border-br bg-s0 text-xs text-m cursor-pointer hover:bg-s1 transition-colors">
            ✏️ 編集
          </button>
          <button className="px-3 py-1.5 rounded-lg border border-br bg-s0 text-xs text-dn cursor-pointer hover:bg-dnl transition-colors">
            🗑 削除
          </button>
        </div>
      </div>

      {/* Add cards modal (inline) */}
      {showAddCards && <AddCardsModal onClose={() => setShowAddCards(false)} />}

      {/* Card list table */}
      <div className="bg-s0 border border-br rounded-xl overflow-hidden mb-5">
        {/* Table header */}
        <div
          className="grid items-center px-4 py-2 bg-s1 border-b border-br text-[11px] font-semibold text-muted"
          style={{ gridTemplateColumns: '40px 1fr 1fr 60px 30px' }}
        >
          <span>#</span>
          <span>表面</span>
          <span>裏面</span>
          <span>次回</span>
          <span />
        </div>

        {MOCK_DECK_CARDS.map((card, i) => (
          <div
            key={i}
            className="grid items-center px-4 py-3 border-b border-br last:border-b-0 hover:bg-s1 transition-colors cursor-default"
            style={{ gridTemplateColumns: '40px 1fr 1fr 60px 30px' }}
          >
            <span className="text-[11px] text-muted font-mono">{i + 1}</span>
            <span className="text-[13px] text-tx truncate pr-3">{card.front}</span>
            <span className="text-[13px] text-muted truncate pr-3">{card.back}</span>
            <span
              className={`text-[12px] font-mono ${
                card.next === '今日' ? 'text-ac font-semibold' : 'text-muted'
              }`}
            >
              {card.next}
            </span>
            <button className="text-[11px] text-muted hover:text-tx bg-transparent border-none cursor-pointer p-0">
              ✏️
            </button>
          </div>
        ))}
      </div>

      {/* Start buttons */}
      <div className="flex gap-2.5">
        <button
          onClick={onStartReview}
          className="flex-1 py-3 rounded-xl border-[1.5px] border-ac text-ac text-sm font-semibold bg-transparent cursor-pointer hover:bg-acl transition-colors"
        >
          シャッフルで始める
        </button>
        <button
          onClick={onStartReview}
          className="flex-1 py-3 rounded-xl bg-ac text-white text-sm font-semibold border-none cursor-pointer hover:bg-ac2 transition-colors"
        >
          ▶ 順番に始める
        </button>
      </div>
    </div>
  )
}
