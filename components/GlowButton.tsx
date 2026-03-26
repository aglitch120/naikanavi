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
      {/* 回転グローボーダー — overflow:hiddenで外にはみ出さない */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -1.5,
          borderRadius: outerRadius,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '-50%', left: '-50%',
            width: '200%', height: '200%',
            background: 'conic-gradient(from 0deg, transparent 40%, #2DB464 50%, #4ADE80 55%, #86EFAC 58%, #4ADE80 62%, #2DB464 68%, transparent 75%)',
            animation: 'glowBtnSpin 3s linear infinite',
          }}
        />
      </span>
      {/* ぼかしオーラ */}
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -1.5,
          borderRadius: outerRadius,
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: '-50%', left: '-50%',
            width: '200%', height: '200%',
            background: 'conic-gradient(from 0deg, transparent 40%, #2DB464 50%, #4ADE80 55%, #86EFAC 58%, #4ADE80 62%, #2DB464 68%, transparent 75%)',
            animation: 'glowBtnSpin 3s linear infinite',
            filter: `blur(${blurSize}px)`,
            opacity: blurOpacity,
          }}
        />
      </span>
      <style>{`@keyframes glowBtnSpin { to { transform: rotate(360deg); } }`}</style>
      {/* 子要素（ボタン本体） */}
      <span style={{ position: 'relative', display: fullWidth ? 'block' : 'inline-block', zIndex: 1 }}>
        {children}
      </span>
    </span>
  )
}
