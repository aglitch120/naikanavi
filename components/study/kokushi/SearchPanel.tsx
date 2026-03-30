'use client'

import { useState } from 'react'
import { Q_LIST, MARKS } from './mock-data'
import QuestionList from './QuestionList'

interface SearchPanelProps {
  onBack: () => void
  onStartQuestion: () => void
}

const FILTER_SECTIONS = [
  {
    label: '結果',
    chips: MARKS.filter(m => m.key !== 'none').map(m => m.icon),
  },
  { label: '形式', chips: ['必修', '総論', '各論', '一般', '臨床'] },
  { label: '回数', chips: ['最新3回', '最新5回', '最新10回'] },
  { label: '特性', chips: ['2つ選べ', '計算', '画像あり'] },
]

export default function SearchPanel({ onBack, onStartQuestion }: SearchPanelProps) {
  const [query, setQuery] = useState('')
  const [accuracy, setAccuracy] = useState(0)
  const [activeChips, setActiveChips] = useState<Set<string>>(new Set())

  function toggleChip(chip: string) {
    const next = new Set(activeChips)
    if (next.has(chip)) next.delete(chip)
    else next.add(chip)
    setActiveChips(next)
  }

  function handleReset() {
    setQuery('')
    setAccuracy(0)
    setActiveChips(new Set())
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="bg-transparent border-none text-muted text-[13px] cursor-pointer"
        >
          ← 演習
        </button>
        <h2 className="text-base font-bold m-0">問題検索</h2>
      </div>

      {/* Two-column layout */}
      <div className="flex gap-4 items-start">
        {/* Left: search + results */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="問題番号や疾患名で検索"
            className="w-full px-4 py-3 rounded-[10px] border-[1.5px] border-br bg-s0 text-sm mb-4 outline-none focus:border-ac transition-colors"
          />
          <QuestionList
            title={`検索結果: ${Q_LIST.length}問`}
            onBack={() => {}}
            onStartQuestion={onStartQuestion}
          />
        </div>

        {/* Right: filter sidebar */}
        <div className="w-[250px] flex-shrink-0">
          <div className="bg-s0 border border-br rounded-xl p-4 sticky top-8">
            <p className="text-[13px] font-semibold mb-3">絞り込み</p>

            {FILTER_SECTIONS.map(section => (
              <div key={section.label} className="mb-3">
                <p className="text-xs font-semibold text-muted mb-1.5">{section.label}</p>
                <div className="flex gap-1 flex-wrap">
                  {section.chips.map(chip => (
                    <button
                      key={chip}
                      onClick={() => toggleChip(`${section.label}:${chip}`)}
                      className={`
                        px-2.5 py-1 rounded-md border text-[11px] cursor-pointer transition-colors
                        ${activeChips.has(`${section.label}:${chip}`)
                          ? 'border-ac bg-acl text-ac font-semibold'
                          : 'border-br bg-s0'}
                      `}
                    >
                      {chip}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {/* Accuracy slider */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-muted mb-1.5">
                正答率 {accuracy}% 以上
              </p>
              <input
                type="range"
                min={0}
                max={100}
                step={10}
                value={accuracy}
                onChange={e => setAccuracy(Number(e.target.value))}
                className="w-full accent-ac"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={handleReset}
                className="flex-1 py-1.5 rounded-lg border border-br bg-s0 text-[12px] font-semibold cursor-pointer hover:bg-s1 transition-colors"
              >
                リセット
              </button>
              <button
                className="flex-1 py-1.5 rounded-lg border-none bg-ac text-white text-[12px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
              >
                検索
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
