'use client'

import { ReactNode } from 'react'

/**
 * GlowButton — 細い回転グローボーダー付きボタンラッパー
 * 
 * 使い方:
 *   <GlowButton>
 *     <button className="...">無料で始める</button>
 *   </GlowButton>
 * 
 *   <GlowButton as="link" href="/pro">
 *     PRO プランを見る
 *   </GlowButton>
 */

interface GlowButtonProps {
  children: ReactNode
  /** ボタンの角丸（内側ボタンに合わせる） */
  radius?: number
  /** グローの強さ: 'default' | 'strong' */
  intensity?: 'default' | 'strong'
  /** fullwidth */
  fullWidth?: boolean
  className?: string
}

export default function GlowButton({
  children,
  radius = 12,
  intensity = 'default',
  fullWidth = false,
  className = '',
}: GlowButtonProps) {
  const outerRadius = radius + 2
  const blurSize = intensity === 'strong' ? 10 : 6
  const blurOpacity = intensity === 'strong' ? 0.45 : 0.3

  return (
    <span
      className={`glow-btn-wrap ${fullWidth ? 'glow-btn-full' : ''} ${className}`}
      style={{
        position: 'relative',
        display: fullWidth ? 'block' : 'inline-block',
        borderRadius: outerRadius,
      }}
    >
      {/* 回転グローボーダー（シャープ） */}
      <span
        className="glow-btn-border"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -1.5,
          borderRadius: outerRadius,
          background: 'conic-gradient(from var(--glow-angle, 0deg), transparent 55%, #2DB464 75%, #4ADE80 85%, #86EFAC 90%, #4ADE80 95%, #2DB464 100%)',
          animation: 'glowSpin 4s linear infinite',
        }}
      />
      {/* 回転グローボーダー（ぼかし＝オーラ） */}
      <span
        className="glow-btn-aura"
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -1.5,
          borderRadius: outerRadius,
          background: 'conic-gradient(from var(--glow-angle, 0deg), transparent 55%, #2DB464 75%, #4ADE80 85%, #86EFAC 90%, #4ADE80 95%, #2DB464 100%)',
          animation: 'glowSpin 4s linear infinite',
          filter: `blur(${blurSize}px)`,
          opacity: blurOpacity,
        }}
      />
      {/* 子要素（ボタン本体） */}
      <span style={{ position: 'relative', display: fullWidth ? 'block' : 'inline-block', zIndex: 1 }}>
        {children}
      </span>
    </span>
  )
}
