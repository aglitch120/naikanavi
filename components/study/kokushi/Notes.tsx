'use client'

import { useState } from 'react'
import Badge from './Badge'
import { NOTE_FOLDERS, NOTES } from './mock-data'

export default function Notes() {
  const [noteFolder, setNoteFolder] = useState<string | null>(null)
  const [noteEdit, setNoteEdit] = useState<number | 'new' | null>(null)
  const [noteText, setNoteText] = useState('')

  const filtered = noteFolder ? NOTES.filter((n) => n.folder === noteFolder) : NOTES
  const editNote = typeof noteEdit === 'number' ? NOTES.find((n) => n.id === noteEdit) : null

  if (noteEdit !== null) {
    return (
      <div className="flex flex-col h-full px-6 pt-6 pb-6">
        <div className="flex items-center justify-between mb-5">
          <button
            onClick={() => setNoteEdit(null)}
            className="text-sm text-muted hover:text-tx transition-colors"
          >
            ← 一覧
          </button>
          <p className="text-sm font-semibold text-tx">
            {noteEdit === 'new' ? '新規ノート' : (editNote?.title ?? '')}
          </p>
          <button className="px-3 py-1.5 rounded-lg bg-ac text-white text-xs font-semibold">
            保存
          </button>
        </div>
        <textarea
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="ここに書く…"
          className="flex-1 p-5 rounded-xl border-[1.5px] border-br bg-s0 font-mono leading-[1.75] resize-none text-sm text-tx outline-none focus:border-ac transition-colors"
        />
      </div>
    )
  }

  return (
    <div className="px-6 pt-6 pb-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-tx">ノート</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-s1 border border-br text-xs text-tx hover:bg-s2 transition-colors">
            📁 フォルダ作成
          </button>
          <button
            onClick={() => { setNoteEdit('new'); setNoteText('') }}
            className="px-3 py-1.5 rounded-lg bg-ac text-white text-xs font-semibold"
          >
            + 新規作成
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setNoteFolder(null)}
          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
            noteFolder === null ? 'bg-ac text-white' : 'bg-s1 text-muted hover:bg-s2'
          }`}
        >
          すべて
        </button>
        {NOTE_FOLDERS.map((f) => (
          <button
            key={f}
            onClick={() => setNoteFolder(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              noteFolder === f ? 'bg-ac text-white' : 'bg-s1 text-muted hover:bg-s2'
            }`}
          >
            📁 {f}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((n) => (
          <div
            key={n.id}
            onClick={() => { setNoteEdit(n.id); setNoteText(n.preview) }}
            className="bg-s0 border border-br rounded-xl p-4 cursor-pointer hover:border-ac transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <p className="text-sm font-semibold text-tx">{n.title}</p>
              <Badge>{n.folder}</Badge>
            </div>
            <p className="text-xs text-muted mb-2">{n.updated}</p>
            <p className="font-mono text-xs text-muted max-h-10 overflow-hidden">{n.preview}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
