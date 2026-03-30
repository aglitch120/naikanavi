'use client'

import { useState } from 'react'
import type { QuestionItem } from './types'
import { Q_LIST, MARKS } from './mock-data'
import { MarkFilterChips } from './MarkSystem'

interface QuestionListProps {
  title: string
  onBack: () => void
  onStartQuestion: () => void
}

export default function QuestionList({ title, onBack, onStartQuestion }: QuestionListProps) {
  const [selectMode, setSelectMode] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  function toggleRow(id: string) {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  function selectAll() {
    setSelected(new Set(Q_LIST.map(q => q.id)))
  }

  function cancelSelect() {
    setSelectMode(false)
    setSelected(new Set())
  }

  const gridCols = selectMode
    ? 'grid-cols-[40px_50px_70px_1fr_60px_60px]'
    : 'grid-cols-[50px_70px_1fr_60px_60px_30px]'

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-4">
        <button
          onClick={onBack}
          className="bg-transparent border-none text-muted text-[13px] cursor-pointer"
        >
          ← 戻る
        </button>
        <span className="text-base font-bold">{title}</span>
        <div className="ml-auto flex gap-2">
          {!selectMode ? (
            <button
              onClick={() => setSelectMode(true)}
              className="px-3.5 py-1.5 rounded-lg border border-br bg-s0 text-xs cursor-pointer hover:bg-s1 transition-colors"
            >
              選択モード
            </button>
          ) : (
            <>
              <button
                onClick={selectAll}
                className="px-3.5 py-1.5 rounded-lg border border-br bg-s0 text-xs cursor-pointer hover:bg-s1 transition-colors"
              >
                全選択
              </button>
              <button
                className="px-3.5 py-1.5 rounded-lg border-none bg-ac text-white text-xs font-semibold cursor-pointer"
              >
                セットに追加 ({selected.size})
              </button>
              <button
                onClick={cancelSelect}
                className="px-3.5 py-1.5 rounded-lg border border-br bg-s0 text-xs cursor-pointer text-red-700 hover:bg-s1 transition-colors"
              >
                キャンセル
              </button>
            </>
          )}
        </div>
      </div>

      {/* Mark filter chips */}
      <MarkFilterChips />

      {/* Question table */}
      <div className="bg-s0 border border-br rounded-xl overflow-hidden">
        {/* Table header */}
        <div className={`grid ${gridCols} px-4 py-2.5 border-b border-br text-[11px] text-muted2`}>
          {selectMode && <span />}
          <span>#</span>
          <span>番号</span>
          <span>問題文</span>
          <span>マーク</span>
          <span>最終</span>
          {!selectMode && <span />}
        </div>

        {/* Data rows */}
        {Q_LIST.map((q: QuestionItem, i: number) => {
          const mk = MARKS.find(m => m.key === q.mark)
          const isSelected = selected.has(q.id)
          return (
            <div
              key={q.id}
              onClick={() => selectMode ? toggleRow(q.id) : onStartQuestion()}
              className={`
                grid ${gridCols} px-4 py-3 border-b border-br items-center cursor-pointer text-[13px]
                hover:bg-s1 transition-colors
                ${isSelected ? 'bg-acl' : ''}
              `}
            >
              {selectMode && (
                <span>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    readOnly
                    className="accent-ac"
                  />
                </span>
              )}
              <span className="font-mono text-muted text-xs">{i + 1}</span>
              <span className="text-ac font-semibold text-xs font-mono">{q.id}</span>
              <span className="truncate pr-3">{q.stem}</span>
              <span className="font-bold text-sm text-center" style={{ color: mk?.color }}>
                {mk?.icon}
              </span>
              <span className="text-[11px] text-muted">{q.last ?? '—'}</span>
              {!selectMode && <span className="text-muted">›</span>}
            </div>
          )
        })}
      </div>

      {/* Bottom action bar */}
      {!selectMode && (
        <div className="mt-4 flex gap-2.5">
          <button className="flex-1 py-3 rounded-[9px] border-[1.5px] border-br bg-s0 text-[13px] font-semibold cursor-pointer hover:bg-s1 transition-colors">
            ✕ のみ
          </button>
          <button className="flex-1 py-3 rounded-[9px] border-[1.5px] border-br bg-s0 text-[13px] font-semibold cursor-pointer hover:bg-s1 transition-colors">
            シャッフル
          </button>
          <button
            onClick={onStartQuestion}
            className="flex-1 py-3 rounded-[9px] border-none bg-ac text-white text-[13px] font-semibold cursor-pointer hover:opacity-90 transition-opacity"
          >
            ▶ 演習開始
          </button>
        </div>
      )}
    </div>
  )
}
