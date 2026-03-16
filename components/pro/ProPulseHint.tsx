'use client'

import { useState, useEffect } from 'react'
import { useHintStatus } from './useProStatus'

interface ProPulseHintProps {
  children: React.ReactNode
}

/**
 * ProPulseHint — お気に入りボタンのパルスアニメーション
 *
 * 初回のみ表示:
 * - ボタン周囲にリングが広がるパルス（2回）
 * - 横に「お気に入りに保存 →」ツールチップ（3秒後フェードアウト）
 * - 1度表示したら二度と表示しない（localStorage管理）
 */
export default function ProPulseHint({ children }: ProPulseHintProps) {
  const { isShown, markShown } = useHintStatus('favPulse')
  const [showHint, setShowHint] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)

  useEffect(() => {
    if (isShown()) return

    // 500ms待ってから表示（ページロード直後だとユーザーが見逃す）
    const showTimer = setTimeout(() => {
      setShowHint(true)
      setShowTooltip(true)
      markShown()
    }, 500)

    return () => clearTimeout(showTimer)
  }, [isShown, markShown])

  // ツールチップ3秒後にフェードアウト
  useEffect(() => {
    if (!showTooltip) return
    const timer = setTimeout(() => setShowTooltip(false), 3000)
    return () => clearTimeout(timer)
  }, [showTooltip])

  // パルスアニメーション終了後にクリーンアップ
  useEffect(() => {
    if (!showHint) return
    const timer = setTimeout(() => setShowHint(false), 3200) // 1.5s × 2回 + buffer
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
        お気に入りに保存 →
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
