'use client'

import { useState } from 'react'
import type { CardsTab } from './types'
import { MOCK_DECKS, DECK_FOLDERS } from './mock-data'
import TabBar from './TabBar'
import AddCardsModal from './AddCardsModal'

interface DeckManagerProps {
  onOpenDeckDetail: (deckId: number) => void
  onStartReview: () => void
}

const SHARED_DECKS = [
  { id: 10, name: '国試 循環器 厳選100', author: 'dr_naika', cards: 100, downloads: 482, rating: 4.8 },
  { id: 11, name: 'CBT 必修50問', author: 'med_study', cards: 50, downloads: 310, rating: 4.6 },
  { id: 12, name: '公衆衛生まとめ', author: 'kokushi119', cards: 75, downloads: 198, rating: 4.3 },
  { id: 13, name: '感染症 抗菌薬カード', author: 'icu_doc', cards: 60, downloads: 265, rating: 4.7 },
]

const SHARED_CATS = ['人気', '新着', '循環器', '消化管', '公衆衛生', 'CBT', '必修']

export default function DeckManager({ onOpenDeckDetail }: DeckManagerProps) {
  const [cardsTab, setCardsTab] = useState<CardsTab>('mine')
  const [deckFolder, setDeckFolder] = useState<string | null>(null)
  const [showDeckCreate, setShowDeckCreate] = useState(false)
  const [showAddCards, setShowAddCards] = useState(false)
  const [sharedCat, setSharedCat] = useState('人気')

  const filteredDecks = deckFolder
    ? MOCK_DECKS.filter((d) => d.folder === deckFolder)
    : MOCK_DECKS

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-tx">暗記カード</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setShowDeckCreate(!showDeckCreate)}
            className="px-3 py-1.5 text-[12px] font-medium border border-br rounded-lg text-m hover:border-br2 bg-transparent cursor-pointer transition-colors"
          >
            📁 フォルダ作成
          </button>
          <button
            onClick={() => setShowDeckCreate(!showDeckCreate)}
            className="px-3 py-1.5 text-[12px] font-semibold border border-ac rounded-lg text-ac hover:bg-acl bg-transparent cursor-pointer transition-colors"
          >
            + デッキ作成
          </button>
        </div>
      </div>

      {/* TabBar */}
      <TabBar
        items={[['mine', '自分のデッキ'], ['shared', '共有デッキ']]}
        active={cardsTab}
        onChange={(k) => setCardsTab(k as CardsTab)}
      />

      {/* Deck create modal */}
      {showDeckCreate && (
        <div className="bg-s0 border-2 border-ac rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-[15px] text-tx">新しいデッキを作成</span>
            <button
              onClick={() => setShowDeckCreate(false)}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-s1 text-m text-lg leading-none border-none bg-transparent cursor-pointer"
            >
              ✕
            </button>
          </div>
          <input
            type="text"
            placeholder="デッキ名を入力"
            className="w-full px-3 py-2 text-[13px] border border-br rounded-lg bg-s1 text-tx placeholder:text-m focus:outline-none focus:border-ac mb-2"
          />
          <div className="flex gap-2">
            <select className="flex-1 px-3 py-2 text-[13px] border border-br rounded-lg bg-s1 text-tx focus:outline-none focus:border-ac">
              <option value="">フォルダを選択</option>
              {DECK_FOLDERS.map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
            <button className="px-4 py-2 text-[13px] font-semibold bg-ac text-white rounded-lg border-none cursor-pointer hover:bg-ac2 transition-colors">
              作成
            </button>
          </div>
        </div>
      )}

      {/* Add cards modal */}
      {showAddCards && (
        <AddCardsModal onClose={() => setShowAddCards(false)} />
      )}

      {/* 自分のデッキ tab */}
      {cardsTab === 'mine' && (
        <div>
          {/* Folder filter pills */}
          <div className="flex gap-2 flex-wrap mb-4">
            {[null, ...DECK_FOLDERS].map((f) => (
              <button
                key={f ?? 'all'}
                onClick={() => setDeckFolder(f)}
                className={`px-3 py-1 text-[12px] font-medium rounded-full border cursor-pointer transition-colors ${
                  deckFolder === f
                    ? 'bg-acl text-ac border-ac'
                    : 'bg-s0 text-m border-br hover:border-br2'
                }`}
              >
                {f ? `📁 ${f}` : 'すべて'}
              </button>
            ))}
          </div>

          {/* Deck cards */}
          <div className="flex flex-col gap-2">
            {filteredDecks.map((deck) => (
              <button
                key={deck.id}
                onClick={() => onOpenDeckDetail(deck.id)}
                className="flex items-center justify-between p-3.5 bg-s0 border border-br rounded-xl text-left cursor-pointer hover:border-br2 transition-colors w-full"
              >
                <div className="flex items-center gap-3">
                  <div>
                    <div className="text-[14px] font-semibold text-tx">{deck.name}</div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-m bg-s1 px-2 py-0.5 rounded-full">📁 {deck.folder}</span>
                      <span className="text-[11px] text-m">{deck.cards} カード</span>
                      {deck.due > 0 && (
                        <span className="text-[11px] font-semibold text-wn bg-wnl px-2 py-0.5 rounded-full">
                          {deck.due} 復習
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-m text-lg">›</span>
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowAddCards(!showAddCards)}
            className="mt-3 w-full py-2.5 text-[13px] font-medium text-m border border-dashed border-br rounded-xl hover:border-br2 bg-transparent cursor-pointer transition-colors"
          >
            + カードを追加
          </button>
        </div>
      )}

      {/* 共有デッキ tab */}
      {cardsTab === 'shared' && (
        <div>
          {/* Search */}
          <input
            type="text"
            placeholder="デッキを検索..."
            className="w-full px-3 py-2 text-[13px] border border-br rounded-lg bg-s0 text-tx placeholder:text-m focus:outline-none focus:border-ac mb-3"
          />

          {/* Category chips */}
          <div className="flex gap-2 flex-wrap mb-4">
            {SHARED_CATS.map((cat) => (
              <button
                key={cat}
                onClick={() => setSharedCat(cat)}
                className={`px-3 py-1 text-[12px] font-medium rounded-full border cursor-pointer transition-colors ${
                  sharedCat === cat
                    ? 'bg-acl text-ac border-ac'
                    : 'bg-s0 text-m border-br hover:border-br2'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Shared deck cards */}
          <div className="flex flex-col gap-2">
            {SHARED_DECKS.map((deck) => (
              <div
                key={deck.id}
                className="flex items-center justify-between p-3.5 bg-s0 border border-br rounded-xl"
              >
                <div>
                  <div className="text-[14px] font-semibold text-tx">{deck.name}</div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-m">@{deck.author}</span>
                    <span className="text-[11px] text-m">{deck.cards}枚</span>
                    <span className="text-[11px] text-m">↓{deck.downloads}</span>
                    <span className="text-[11px] text-m">★{deck.rating}</span>
                  </div>
                </div>
                <button className="px-3 py-1.5 text-[12px] font-semibold text-ac border border-ac rounded-lg hover:bg-acl bg-transparent cursor-pointer transition-colors whitespace-nowrap">
                  + 追加
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
