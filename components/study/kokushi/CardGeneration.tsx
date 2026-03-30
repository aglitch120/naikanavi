'use client'

import { useState } from 'react'
import Badge from './Badge'
import { GEN_CARDS, MOCK_DECKS } from './mock-data'

interface CardGenerationProps {
  onBack: () => void
}

export default function CardGeneration({ onBack }: CardGenerationProps) {
  const [deckPicker, setDeckPicker] = useState<number | null>(null)

  return (
    <div className="px-6 pt-6 pb-6">
      <div className="flex items-center gap-2 mb-5">
        <button onClick={onBack} className="text-sm text-muted hover:text-tx transition-colors">
          ← 問題に戻る
        </button>
        <Badge>119A1</Badge>
        <Badge color="ai">カード生成</Badge>
      </div>

      <div className="bg-s0 border border-br rounded-xl p-4 mb-5">
        <p className="text-sm font-semibold text-tx mb-1">✓ 5枚を生成</p>
        <p className="text-xs text-muted">保存したいカードの [+] をクリック</p>
      </div>

      <div className="flex flex-col gap-3 mb-6">
        {GEN_CARDS.map((card, i) => (
          <div key={i} className="bg-s0 border border-br rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Badge>{card.type}</Badge>
                <span className="text-xs text-muted">カード {i + 1}</span>
              </div>
              {deckPicker === i ? (
                <div className="flex flex-wrap gap-1.5">
                  {MOCK_DECKS.map((d) => (
                    <button
                      key={d.id}
                      onClick={() => setDeckPicker(null)}
                      className="px-2.5 py-1 rounded-lg bg-acl text-ac text-xs font-semibold hover:bg-ac hover:text-white transition-colors"
                    >
                      {d.name}
                    </button>
                  ))}
                  <button
                    onClick={() => setDeckPicker(null)}
                    className="px-2.5 py-1 rounded-lg border border-br text-xs text-muted hover:bg-s1 transition-colors"
                  >
                    + 新規デッキ
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setDeckPicker(i)}
                  className="w-7 h-7 rounded-[7px] border-[1.5px] border-ac bg-acl text-ac flex items-center justify-center text-base font-bold hover:bg-ac hover:text-white transition-colors"
                >
                  +
                </button>
              )}
            </div>
            <p className="text-sm font-semibold text-tx mb-2">{card.front}</p>
            <div className="bg-s1 rounded-lg p-3 font-mono text-xs text-tx whitespace-pre-line">
              {card.back}
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={onBack}
        className="w-full py-3 rounded-xl bg-ac text-white text-sm font-semibold"
      >
        問題に戻る
      </button>
    </div>
  )
}
