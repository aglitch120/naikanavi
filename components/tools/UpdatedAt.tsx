'use client'

import { useState, useEffect } from 'react'

/** 最終確認日の表示コンポーネント — verify-status.jsonから動的取得 */
export default function UpdatedAt({ date }: { date?: string }) {
  const [verified, setVerified] = useState(date || '')

  useEffect(() => {
    fetch('/verify-status.json')
      .then(r => r.json())
      .then(d => {
        if (d.lastVerified) {
          const dt = new Date(d.lastVerified)
          setVerified(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`)
        }
      })
      .catch(() => {})
  }, [])

  const display = verified
    ? verified.replace(/^(\d{4})-(\d{2})-?(\d{2})?/, (_, y, m, d) => `${y}年${parseInt(m)}月${d ? parseInt(d) + '日' : ''}`)
    : ''

  if (!display) return null
  return <p className="text-xs text-muted/60 mt-1">最終検証: {display}</p>
}
