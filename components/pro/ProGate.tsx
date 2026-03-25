'use client'

import { useState, useRef, useEffect } from 'react'
import { useProStatus } from './useProStatus'
import ProModal from './ProModal'

type ProFeature = 'interpretation' | 'action_plan' | 'favorites' | 'save' | 'result' | 'full_access' | 'first_taste' | 'social_proof'

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
  /** ファーストテイスト用: このゲートの一意識別子 */
  tasteId?: string
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
  tasteId,
}: ProGateProps) {
  const { isPro, isLoading } = useProStatus()
  const [showModal, setShowModal] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [needsGate, setNeedsGate] = useState(true)
  const [tasteUsed, setTasteUsed] = useState(false)

  // コンテンツがpreviewHeight以下なら、ゲート不要
  useEffect(() => {
    if (containerRef.current) {
      setNeedsGate(containerRef.current.scrollHeight > previewHeight + 40)
    }
  }, [children, previewHeight])

  // ファーストテイスト: 初回1回だけ無料閲覧
  useEffect(() => {
    if (feature === 'first_taste' && tasteId) {
      const key = `iwor_first_taste_${tasteId}`
      if (localStorage.getItem(key)) {
        setTasteUsed(true)
      }
    }
  }, [feature, tasteId])

  const handleFirstTaste = () => {
    if (feature === 'first_taste' && tasteId && !tasteUsed) {
      localStorage.setItem(`iwor_first_taste_${tasteId}`, '1')
      setTasteUsed(true)
      return // 初回は無料で見せる
    }
    setShowModal(true)
  }

  // PROユーザーまたはロード中 → そのまま表示
  if (isPro || isLoading) {
    return <>{children}</>
  }

  // ファーストテイスト: 初回はゲートなしで表示
  if (feature === 'first_taste' && !tasteUsed) {
    return (
      <div onClick={handleFirstTaste} className="cursor-pointer">
        <div className="bg-acl border border-ac/20 rounded-lg px-3 py-1.5 mb-2 text-center">
          <span className="text-[10px] font-bold" style={{ color: '#1B4F3A' }}>初回無料プレビュー — タップで表示</span>
        </div>
        {showModal && <ProModal feature="full_access" onClose={() => setShowModal(false)} />}
      </div>
    )
  }

  // ファーストテイスト使用済み or 通常 → ゲート表示
  if (feature === 'first_taste' && tasteUsed) {
    // 2回目以降はPROモーダル
  }

  const defaultLabel = feature === 'interpretation'
    ? 'PRO会員で推奨アクションを見る'
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
            <div className="pro-glow-btn inline-flex items-center gap-2 px-5 py-2.5 bg-ac text-white rounded-xl text-sm font-bold shadow-lg group-hover:bg-ac/90 transition-colors relative overflow-hidden">
              <span className="text-base">🔒</span>
              {label || defaultLabel}
            </div>
            <style>{`
              .pro-glow-btn { animation: proGlowFade 3s ease-out forwards; }
              @keyframes proGlowFade {
                0% { box-shadow: 0 0 8px 2px rgba(27,79,58,0.6), 0 0 20px 4px rgba(27,79,58,0.3); }
                50% { box-shadow: 0 0 16px 4px rgba(27,79,58,0.5), 0 0 32px 8px rgba(27,79,58,0.2); }
                100% { box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
              }
            `}</style>
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
