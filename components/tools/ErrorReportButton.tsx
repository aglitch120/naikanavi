'use client'

import { useState } from 'react'

interface ErrorReportButtonProps {
  toolName?: string
  className?: string
}

export default function ErrorReportButton({ toolName, className = '' }: ErrorReportButtonProps) {
  const [sent, setSent] = useState(false)

  const handleClick = () => {
    const subject = encodeURIComponent(`[誤り報告] ${toolName || location.pathname}`)
    const body = encodeURIComponent(
      `ページ: ${typeof window !== 'undefined' ? window.location.href : ''}\n\n` +
      `誤りの内容:\n\n\n` +
      `正しい情報（出典があれば記載してください）:\n\n`
    )
    window.open(`mailto:tellmedu.info@gmail.com?subject=${subject}&body=${body}`, '_blank')
    setSent(true)
    setTimeout(() => setSent(false), 3000)
  }

  return (
    <button
      onClick={handleClick}
      className={`inline-flex items-center gap-1.5 text-[11px] text-muted hover:text-ac transition-colors ${className}`}
      aria-label="誤りを報告"
    >
      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
      </svg>
      {sent ? '報告用メールが開きました' : '誤りを報告'}
    </button>
  )
}

/** 誤り報告 + 改善提案の2ボタン行（アプリ共通フッター用） */
export function FeedbackRow({ appName }: { appName?: string }) {
  const handleSuggest = () => {
    const subject = encodeURIComponent(`[改善提案] ${appName || location.pathname}`)
    const body = encodeURIComponent(
      `ページ: ${typeof window !== 'undefined' ? window.location.href : ''}\n\n` +
      `改善案:\n\n`
    )
    window.open(`mailto:tellmedu.info@gmail.com?subject=${subject}&body=${body}`, '_blank')
  }

  return (
    <div className="flex items-center justify-center gap-4 py-3">
      <ErrorReportButton toolName={appName} />
      <button
        onClick={handleSuggest}
        className="inline-flex items-center gap-1.5 text-[11px] text-muted hover:text-ac transition-colors"
        aria-label="改善案を提案"
      >
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 18h.01M8 21h8a2 2 0 002-2v-1a2 2 0 00-2-2H8a2 2 0 00-2 2v1a2 2 0 002 2zM10 14V8a2 2 0 114 0v6" />
        </svg>
        改善案を提案
      </button>
    </div>
  )
}
