'use client'

import { useState, useRef, useEffect } from 'react'
import { useProStatus } from './useProStatus'
import ProModal from './ProModal'

type ProFeature = 'interpretation' | 'action_plan' | 'favorites' | 'save' | 'result' | 'full_access'

interface ProGateProps {
  children: React.ReactNode
  /** ゲート種別（モーダルのメッセージに影響） */
  feature: ProFeature
  /** モザイク強度 px（デフォルト: 8） */
  blurIntensity?: number
  /** モザイク前にクリアで見せる高さ px（デフォルト: 60） */
  previewHeight?: number
  /** ラベル（モザイク上に表示するテキスト） */
  label?: string
}

/**
 * ProGate — PROゲートラッパーコンポーネント
 *
 * - PROユーザー: childrenをそのまま表示
 * - FREEユーザー: 最初のpreviewHeight分はクリア表示、残りはCSSブラーでモザイク
 *   → タップでPROモーダルを表示
 *
 * SEO注意: CSSのfilter:blurはDOMのテキストを隠さないため、検索エンジンはフル内容をクロール可能。
 * display:noneやvisibility:hiddenは使わない。
 */
export default function ProGate({
  children,
  feature,
  blurIntensity = 8,
  previewHeight = 60,
  label,
}: ProGateProps) {
  const { isPro, isLoading } = useProStatus()
  const [showModal, setShowModal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [needsGate, setNeedsGate] = useState(true)

  // コンテンツがpreviewHeight以下なら、ゲート不要
  useEffect(() => {
    if (containerRef.current) {
      setNeedsGate(containerRef.current.scrollHeight > previewHeight + 40)
    }
  }, [children, previewHeight])

  // PROユーザーまたはロード中 → そのまま表示
  if (isPro || isLoading) {
    return <>{children}</>
  }

  const defaultLabel = feature === 'interpretation'
    ? 'PRO会員で解釈を読む'
    : feature === 'action_plan'
    ? 'PRO会員でアクションプランを見る'
    : feature === 'result'
    ? 'PRO会員で結果を見る'
    : 'PRO会員で続きを見る'

  return (
    <>
      <div
        className="pro-gate-container relative cursor-pointer group"
        onClick={() => setShowModal(true)}
        role="button"
        tabIndex={0}
        onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setShowModal(true) }}
        aria-label={label || defaultLabel}
      >
        {/* コンテンツ本体（SEOのためDOMには全文残す） */}
        <div
          ref={containerRef}
          className="overflow-hidden"
          style={{
            maxHeight: needsGate ? `${previewHeight + 120}px` : undefined,
          }}
        >
          {children}
        </div>

        {/* グラデーション + ブラーオーバーレイ */}
        {needsGate && (
          <div
            className="absolute left-0 right-0 bottom-0 pointer-events-none"
            style={{
              top: `${previewHeight}px`,
              backdropFilter: `blur(${blurIntensity}px)`,
              WebkitBackdropFilter: `blur(${blurIntensity}px)`,
              maskImage: 'linear-gradient(to bottom, transparent 0%, black 30%)',
              WebkitMaskImage: 'linear-gradient(to bottom, transparent 0%, black 30%)',
            }}
          />
        )}

        {/* CTA オーバーレイ */}
        {needsGate && (
          <div className="absolute bottom-0 left-0 right-0 flex flex-col items-center pb-4 pt-8 bg-gradient-to-t from-bg via-bg/90 to-transparent">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-ac text-white rounded-xl text-sm font-bold shadow-lg group-hover:bg-ac/90 transition-colors">
              <span className="text-base">🔒</span>
              {label || defaultLabel}
            </div>
            <p className="text-xs text-muted mt-2">
              iwor PRO — ¥9,800/年
            </p>
          </div>
        )}
      </div>

      {showModal && (
        <ProModal feature={feature} onClose={() => setShowModal(false)} />
      )}
    </>
  )
}
