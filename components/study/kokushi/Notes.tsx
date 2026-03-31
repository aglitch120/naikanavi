'use client'

import { useRef, useState } from 'react'
import Badge from './Badge'
import { NOTE_FOLDERS, NOTES } from './mock-data'

// --- Markdown renderer (no external deps) ---
function renderMarkdown(text: string): string {
  let h = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  h = h.replace(/```(\w*)\n([\s\S]*?)```/g, '<pre class="bg-tx text-s0 p-3 rounded-lg my-2 text-sm overflow-x-auto"><code>$2</code></pre>')
  h = h.replace(/`([^`]+)`/g, '<code class="bg-s1 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
  h = h.replace(/^### (.+)$/gm, '<h3 class="text-base font-semibold mt-4 mb-2">$1</h3>')
  h = h.replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold mt-5 mb-2 border-l-4 border-ac pl-3">$1</h2>')
  h = h.replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold mt-6 mb-3">$1</h1>')
  h = h.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  h = h.replace(/~~(.+?)~~/g, '<del>$1</del>')
  h = h.replace(/\*(.+?)\*/g, '<em>$1</em>')
  h = h.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-br2 pl-3 text-muted italic my-2">$1</blockquote>')
  h = h.replace(/^---$/gm, '<hr class="border-br my-4" />')
  h = h.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" class="text-ac underline" target="_blank" rel="noopener">$1</a>')
  h = h.replace(/^- (.+)$/gm, '<li class="ml-4 list-disc">$1</li>')
  h = h.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>')
  h = h.replace(/^(?!<[huplib]|<hr|<block|<pre|<del)(.+)$/gm, '<p class="mb-2 leading-relaxed">$1</p>')
  return h
}

// --- Toolbar insert helper ---
function insertMarkdown(
  ref: React.RefObject<HTMLTextAreaElement | null>,
  before: string,
  after: string,
  setText: React.Dispatch<React.SetStateAction<string>>,
) {
  const ta = ref.current
  if (!ta) return
  const { selectionStart: s, selectionEnd: e, value } = ta
  const sel = value.substring(s, e) || 'テキスト'
  const replacement = before + sel + after
  setText(prev => prev.substring(0, s) + replacement + prev.substring(e))
  requestAnimationFrame(() => {
    ta.focus()
    ta.setSelectionRange(s + before.length, s + before.length + sel.length)
  })
}

const TOOLBAR = [
  { label: 'B',   title: '太字',      before: '**',  after: '**' },
  { label: 'I',   title: '斜体',      before: '*',   after: '*' },
  { label: 'S',   title: '取消線',    before: '~~',  after: '~~' },
  { label: 'H',   title: '見出し',    before: '## ', after: '' },
  { label: '•',   title: '箇条書き',  before: '- ',  after: '' },
  { label: '1.',  title: '番号付き',  before: '1. ', after: '' },
  { label: '❝',  title: '引用',      before: '> ',  after: '' },
  { label: '</>',title: 'コード',     before: '`',   after: '`' },
  { label: '🔗', title: 'リンク',     before: '[',   after: '](url)' },
  { label: '┬',  title: 'テーブル',  before: '| 列1 | 列2 |\n|------|------|\n| ', after: ' | |\n' },
]

type ViewMode = 'split' | 'editor' | 'preview'

// --- Main component ---
export default function Notes() {
  const [noteFolder, setNoteFolder] = useState<string | null>(null)
  const [noteEdit, setNoteEdit] = useState<number | 'new' | null>(null)
  const [noteText, setNoteText] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('split')
  const taRef = useRef<HTMLTextAreaElement>(null)

  const filtered = noteFolder ? NOTES.filter((n) => n.folder === noteFolder) : NOTES
  const editNote = typeof noteEdit === 'number' ? NOTES.find((n) => n.id === noteEdit) : null

  // --- Editor view ---
  if (noteEdit !== null) {
    const showEditor = viewMode !== 'preview'
    const showPreview = viewMode !== 'editor'
    return (
      <div className="flex flex-col h-full">
        {/* Header bar */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-br bg-s0 shrink-0">
          <button onClick={() => setNoteEdit(null)} className="text-sm text-muted hover:text-tx transition-colors">
            ← 一覧
          </button>
          <p className="text-sm font-semibold text-tx truncate mx-3">
            {noteEdit === 'new' ? '新規ノート' : (editNote?.title ?? '')}
          </p>
          <button className="px-3 py-1.5 rounded-lg bg-ac text-white text-xs font-semibold shrink-0">
            保存
          </button>
        </div>

        {/* Toolbar (sticky) */}
        <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-br bg-s0 shrink-0">
          {TOOLBAR.map(({ label, title, before, after }) => (
            <button
              key={label}
              title={title}
              onMouseDown={(e) => { e.preventDefault(); insertMarkdown(taRef, before, after, setNoteText) }}
              className="w-8 h-8 rounded-md bg-s0 border border-br text-xs font-mono hover:bg-s1 cursor-pointer transition-colors"
            >
              {label}
            </button>
          ))}
          {/* View mode toggle — hidden on ≥md, shown inline on mobile */}
          <div className="flex gap-1 ml-auto">
            {(['editor', 'split', 'preview'] as ViewMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setViewMode(m)}
                className={`px-2 h-8 rounded-md text-xs border transition-colors ${
                  viewMode === m ? 'bg-ac text-white border-ac' : 'bg-s0 border-br text-muted hover:bg-s1'
                }`}
              >
                {m === 'editor' ? '編集' : m === 'preview' ? 'プレビュー' : '分割'}
              </button>
            ))}
          </div>
        </div>

        {/* Split pane */}
        <div className="flex flex-1 min-h-0">
          {showEditor && (
            <textarea
              ref={taRef}
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Markdownで書く…"
              className={`${showPreview ? 'flex-1 border-r border-br' : 'w-full'} p-4 font-mono text-sm text-tx bg-bg leading-[1.75] resize-none outline-none focus:outline-none`}
            />
          )}
          {showPreview && (
            <div
              className={`${showEditor ? 'flex-1' : 'w-full'} p-4 overflow-y-auto text-sm text-tx prose-custom`}
              dangerouslySetInnerHTML={{ __html: renderMarkdown(noteText) }}
            />
          )}
        </div>
      </div>
    )
  }

  // --- List view ---
  return (
    <div className="px-6 pt-6 pb-6">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-tx">ノート</h1>
        <div className="flex gap-2">
          <button className="px-3 py-1.5 rounded-lg bg-s1 border border-br text-xs text-tx hover:bg-s2 transition-colors">
            📁 フォルダ作成
          </button>
          <button
            onClick={() => { setNoteEdit('new'); setNoteText(''); setViewMode('split') }}
            className="px-3 py-1.5 rounded-lg bg-ac text-white text-xs font-semibold"
          >
            + 新規作成
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-5">
        {[null, ...NOTE_FOLDERS].map((f) => (
          <button
            key={f ?? '__all'}
            onClick={() => setNoteFolder(f)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              noteFolder === f ? 'bg-ac text-white' : 'bg-s1 text-muted hover:bg-s2'
            }`}
          >
            {f ? `📁 ${f}` : 'すべて'}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((n) => (
          <div
            key={n.id}
            onClick={() => { setNoteEdit(n.id); setNoteText(n.preview); setViewMode('split') }}
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
