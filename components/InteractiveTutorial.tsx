'use client'
import { useState, useEffect, useCallback } from 'react'

const MC = '#1B4F3A'
const MCL = '#E8F0EC'

export interface TutorialStep {
  emoji: string
  title: string
  desc: string
}

interface Props {
  storageKey: string
  steps: TutorialStep[]
}

/**
 * Reusable interactive tutorial overlay + help button.
 * - Shows tutorial on first visit (localStorage)
 * - "?" button at bottom-left to re-show
 * - "×" button to dismiss help button permanently
 *
 * Usage:
 *   <InteractiveTutorial storageKey="iwor_tools_tutorial" steps={[...]} />
 */
export default function InteractiveTutorial({ storageKey, steps }: Props) {
  const [show, setShow] = useState(false)
  const [done, setDone] = useState(false)
  const [helpDismissed, setHelpDismissed] = useState(false)

  useEffect(() => {
    if (localStorage.getItem(storageKey)) {
      setDone(true)
    } else {
      setShow(true)
    }
    if (localStorage.getItem(`${storageKey}_help_dismissed`)) {
      setHelpDismissed(true)
    }
  }, [storageKey])

  const close = useCallback(() => {
    setShow(false)
    setDone(true)
    localStorage.setItem(storageKey, '1')
  }, [storageKey])

  const dismissHelp = useCallback(() => {
    setHelpDismissed(true)
    localStorage.setItem(`${storageKey}_help_dismissed`, '1')
  }, [storageKey])

  return (
    <>
      {/* Help button */}
      {!helpDismissed && done && !show && (
        <div style={{
          position: 'fixed',
          bottom: 'calc(72px + env(safe-area-inset-bottom, 0px))',
          left: 'max(14px, calc(50% - 346px))',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: 0,
        }}>
          <button
            onClick={() => setShow(true)}
            style={{
              width: 40, height: 40, borderRadius: '50%',
              border: '1.5px solid #DDD9D2', background: '#FEFEFC',
              color: MC, fontSize: 16, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 2px 10px rgba(0,0,0,.08)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
            aria-label="使い方ヘルプ"
          >?</button>
          <button
            onClick={dismissHelp}
            style={{
              width: 18, height: 18, borderRadius: '50%',
              border: 'none', background: '#C8C4BC', color: '#fff',
              fontSize: 10, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative', top: -14, left: -6, lineHeight: 1,
            }}
            aria-label="ヘルプを非表示"
          >×</button>
        </div>
      )}

      {/* Tutorial overlay */}
      {show && <TutorialOverlay steps={steps} onClose={close} />}
    </>
  )
}

function TutorialOverlay({ steps, onClose }: { steps: TutorialStep[]; onClose: () => void }) {
  const [step, setStep] = useState(0)
  const s = steps[step]
  const isLast = step === steps.length - 1

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 200,
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#FEFEFC', borderRadius: 20, width: '100%', maxWidth: 400,
          padding: '32px 28px 24px', textAlign: 'center',
          animation: 'iworTutFadeUp .3s ease-out',
        }}
      >
        {/* Progress dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 20 }}>
          {steps.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 4,
              background: i === step ? MC : '#E8E5DF', transition: 'all .3s',
            }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: MCL,
          border: `2px solid ${MC}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px', fontSize: 28,
        }}>
          {s.emoji}
        </div>

        {/* Content */}
        <h3 style={{ fontSize: 18, fontWeight: 700, color: '#1A1917', marginBottom: 8 }}>{s.title}</h3>
        <p style={{ fontSize: 13, color: '#6B6760', lineHeight: 1.7, marginBottom: 24 }}>{s.desc}</p>

        {/* Step counter */}
        <p style={{ fontSize: 11, color: '#C8C4BC', marginBottom: 16 }}>
          {step + 1} / {steps.length}
        </p>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1, padding: '12px 0', border: '1.5px solid #DDD9D2', borderRadius: 12,
              background: 'none', color: '#6B6760', fontSize: 13, fontWeight: 500, cursor: 'pointer',
            }}
          >
            スキップ
          </button>
          <button
            onClick={() => isLast ? onClose() : setStep(step + 1)}
            style={{
              flex: 2, padding: '12px 0', border: 'none', borderRadius: 12,
              background: MC, color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}
          >
            {isLast ? 'はじめる 🚀' : '次へ →'}
          </button>
        </div>
      </div>
      <style>{`@keyframes iworTutFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  )
}
