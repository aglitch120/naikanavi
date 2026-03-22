'use client'

import { useState, useEffect } from 'react'

interface ProPulseHintProps {
  children: React.ReactNode
}

/**
 * ProPulseHint — お気に入りボタンのパルスアニメーション
 *
 * お気に入りが0件の場合、ツール使用5回目以降に表示。
 * その後は3回に1回の頻度で繰り返し光る（うざくない頻度）。
 * お気に入りが1件以上あれば表示しない。
 */
export default function ProPulseHint({ children }: ProPulseHintProps) {
  const [showHint, setShowHint] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    // お気に入りが既にあれば表示しない
    try {
      const favs = JSON.parse(localStorage.getItem('iwor_favorites') || '[]')
      if (favs.length > 0) return
    } catch {}

    // ツール使用回数を確認
    try {
      const usage = JSON.parse(localStorage.getItem('iwor_tool_usage') || '{"_total":0}')
      const total = usage._total || 0
      if (total < 5) return // 5回未満は表示しない

      // 3回に1回の頻度（使用回数 mod 3 === 0）
      if (total % 3 !== 0) return
    } catch { return }

    const showTimer = setTimeout(() => {
      setShowHint(true)
      setShowTooltip(true)
    }, 800)

    return () => clearTimeout(showTimer)
  }, [])

  // ツールチップ4秒後にフェードアウト
  useEffect(() => {
    if (!showTooltip) return
    const timer = setTimeout(() => setShowTooltip(false), 4000)
    return () => clearTimeout(timer)
  }, [showTooltip])

  // パルス終了後にクリーンアップ
  useEffect(() => {
    if (!showHint) return
    const timer = setTimeout(() => setShowHint(false), 3200)
    return () => clearTimeout(timer)
  }, [showHint])

  return (
    <div className="relative inline-flex items-center">
      <div className={showHint ? 'pro-pulse-ring' : ''}>
        {children}
      </div>

      {/* ツールチップ */}
      <div
        className={`absolute right-full mr-2 whitespace-nowrap text-xs font-medium text-ac bg-acl border border-ac/20 px-2.5 py-1.5 rounded-lg shadow-sm transition-all duration-300 ${
          showTooltip ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-2 pointer-events-none'
        }`}
      >
        お気に入りに保存 &rarr;
      </div>

      <style jsx>{`
        .pro-pulse-ring {
          animation: favPulse 1.5s ease-out 2;
          border-radius: 9999px;
        }

        @keyframes favPulse {
          0% { box-shadow: 0 0 0 0 rgba(249, 168, 37, 0.5); }
          70% { box-shadow: 0 0 0 12px rgba(249, 168, 37, 0); }
          100% { box-shadow: 0 0 0 0 rgba(249, 168, 37, 0); }
        }
      `}</style>
    </div>
  )
}
