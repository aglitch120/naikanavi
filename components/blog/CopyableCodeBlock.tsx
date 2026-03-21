'use client'

import { useState, useRef, ReactNode } from 'react'

interface CopyableCodeBlockProps {
  children: ReactNode
}

export default function CopyableCodeBlock({ children }: CopyableCodeBlockProps) {
  const [copied, setCopied] = useState(false)
  const preRef = useRef<HTMLPreElement>(null)

  const handleCopy = async () => {
    const text = preRef.current?.textContent || ''
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback
      const textarea = document.createElement('textarea')
      textarea.value = text
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div className="code-block-wrapper">
      <pre ref={preRef}>
        {children}
      </pre>
      <button
        onClick={handleCopy}
        className="code-copy-btn"
        aria-label="コピー"
        title="コピー"
      >
        {copied ? (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
        )}
        <span className="code-copy-label">{copied ? 'コピー済み' : 'コピー'}</span>
      </button>
    </div>
  )
}
