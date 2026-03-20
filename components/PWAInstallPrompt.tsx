'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

const DISMISS_KEY = 'iwor-pwa-dismissed'
const INSTALL_KEY = 'iwor-pwa-installed'
const TOOL_COUNT_KEY = 'iwor-tool-use-count'
const DISMISS_DAYS = 7
const RE_PROMPT_TOOL_COUNT = 5
const INITIAL_SHOW_TOOL_COUNT = 5

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showBanner, setShowBanner] = useState(false)
  const [showIOSGuide, setShowIOSGuide] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isIOSNonSafari, setIsIOSNonSafari] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const checkedRef = useRef(false)

  // Determine environment on mount
  useEffect(() => {
    // PC（タッチ非対応 or 大画面デスクトップ）には表示しない
    const isMobileOrTablet =
      navigator.maxTouchPoints > 0 && window.innerWidth < 1024
    if (!isMobileOrTablet) return

    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (navigator as any).standalone === true
    setIsStandalone(standalone)

    if (standalone) {
      localStorage.setItem(INSTALL_KEY, 'true')
      return
    }

    const ua = navigator.userAgent
    const ios =
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
    setIsIOS(ios)

    // iOS上のSafari以外のブラウザを検出（Chrome=CriOS, Firefox=FxiOS, Edge=EdgiOS等）
    if (ios) {
      const nonSafari = /CriOS|FxiOS|EdgiOS|OPiOS|GSA\//.test(ua)
      setIsIOSNonSafari(nonSafari)
    }

    // Track tool usage for re-prompting
    const path = window.location.pathname
    if (path.startsWith('/tools/') || path.startsWith('/compare/')) {
      const count = parseInt(localStorage.getItem(TOOL_COUNT_KEY) || '0', 10)
      localStorage.setItem(TOOL_COUNT_KEY, String(count + 1))
    }
  }, [])

  const checkShouldShow = useCallback(
    (forIOS: boolean) => {
      if (checkedRef.current) return
      if (localStorage.getItem(INSTALL_KEY) === 'true') return

      const dismissed = localStorage.getItem(DISMISS_KEY)
      if (dismissed) {
        const daysSince =
          (Date.now() - new Date(dismissed).getTime()) / (1000 * 60 * 60 * 24)
        if (daysSince < DISMISS_DAYS) {
          const toolCount = parseInt(
            localStorage.getItem(TOOL_COUNT_KEY) || '0',
            10
          )
          if (toolCount < RE_PROMPT_TOOL_COUNT) return
        }
      }

      // ツール5回以上使ってからの表示（初回訪問では出さない）
      const toolCount = parseInt(localStorage.getItem(TOOL_COUNT_KEY) || '0', 10)
      if (toolCount < INITIAL_SHOW_TOOL_COUNT) return

      checkedRef.current = true
      setTimeout(() => {
        if (forIOS) setShowIOSGuide(true)
        setShowBanner(true)
      }, 1000)
    },
    []
  )

  // Chrome/Android: beforeinstallprompt
  useEffect(() => {
    if (isStandalone) return

    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      checkShouldShow(false)
    }

    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [isStandalone, checkShouldShow])

  // iOS: check on mount once isIOS is determined
  useEffect(() => {
    if (isIOS && !isStandalone) {
      checkShouldShow(true)
    }
  }, [isIOS, isStandalone, checkShouldShow])

  const handleInstall = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        localStorage.setItem(INSTALL_KEY, 'true')
        localStorage.removeItem(TOOL_COUNT_KEY)
      }
      setDeferredPrompt(null)
    }
    setShowBanner(false)
  }

  const handleDismiss = () => {
    setShowBanner(false)
    setShowIOSGuide(false)
    localStorage.setItem(DISMISS_KEY, new Date().toISOString())
    localStorage.setItem(TOOL_COUNT_KEY, '0')
  }

  if (!showBanner || isStandalone) return null

  const stepCircleStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 22,
    height: 22,
    borderRadius: '50%',
    background: 'var(--ac)',
    color: '#fff',
    fontSize: '0.7rem',
    fontWeight: 700,
    flexShrink: 0,
  }

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 'calc(56px + env(safe-area-inset-bottom))',
        left: 0,
        right: 0,
        zIndex: 60,
        padding: '0 12px 8px',
        animation: 'slideUp 0.4s ease-out',
      }}
    >
      <style>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      <div
        style={{
          maxWidth: '480px',
          margin: '0 auto',
          background: 'var(--s0)',
          border: '1px solid var(--br)',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 -2px 20px rgba(0,0,0,0.08)',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: '10px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img
              src="/icon-192.png"
              alt="iwor"
              width={40}
              height={40}
              style={{ borderRadius: '10px' }}
            />
            <div>
              <div
                style={{
                  fontWeight: 600,
                  fontSize: '0.9rem',
                  color: 'var(--tx)',
                }}
              >
                iworをホーム画面に追加
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--m)',
                  marginTop: '2px',
                }}
              >
                電波が届かない場所でも、臨床ツールが使えます
              </div>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            aria-label="閉じる"
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: 'var(--m)',
              fontSize: '1.2rem',
              lineHeight: 1,
            }}
          >
            ✕
          </button>
        </div>

        {/* Benefits */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            marginBottom: '12px',
            flexWrap: 'wrap',
          }}
        >
          {[
            { text: 'オフラインで計算・フロー' },
            { text: '病棟・手術室OK' },
            { text: 'ワンタップ起動' },
          ].map((item) => (
            <span
              key={item.text}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '0.72rem',
                color: 'var(--ac)',
                background: 'var(--acl)',
                padding: '3px 8px',
                borderRadius: '100px',
                fontWeight: 500,
              }}
            >
              {item.text}
            </span>
          ))}
        </div>

        {/* iOS or Chrome install */}
        {showIOSGuide ? (
          <div
            style={{
              background: 'var(--s1)',
              borderRadius: '10px',
              padding: '12px',
              fontSize: '0.8rem',
              color: 'var(--tx)',
              lineHeight: 1.6,
            }}
          >
            {isIOSNonSafari ? (
              /* iOS Chrome / Firefox / Edge 等 → Safariへ誘導 */
              <>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                  Safariで開いてください
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--m)', margin: '0 0 10px' }}>
                  iOSではSafariからのみホーム画面に追加できます。
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={stepCircleStyle}>1</span>
                    <span>アドレスバーの <strong>URL を長押し</strong> → コピー</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={stepCircleStyle}>2</span>
                    <span><strong>Safari</strong> を開いて貼り付け</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={stepCircleStyle}>3</span>
                    <span>
                      共有ボタン
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--ac)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ verticalAlign: 'middle', margin: '0 2px' }}
                      >
                        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                      →「<strong>ホーム画面に追加</strong>」
                    </span>
                  </div>
                </div>
              </>
            ) : (
              /* iOS Safari → 通常の共有ガイド */
              <>
                <div style={{ fontWeight: 600, marginBottom: '8px' }}>
                  追加方法（Safari）
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={stepCircleStyle}>1</span>
                    <span>
                      下の <strong>共有ボタン</strong>
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="var(--ac)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        style={{ verticalAlign: 'middle', margin: '0 2px' }}
                      >
                        <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8" />
                        <polyline points="16 6 12 2 8 6" />
                        <line x1="12" y1="2" x2="12" y2="15" />
                      </svg>
                      をタップ
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={stepCircleStyle}>2</span>
                    <span>
                      「<strong>ホーム画面に追加</strong>」を選択
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={handleInstall}
            style={{
              width: '100%',
              padding: '10px',
              background: 'var(--ac)',
              color: '#fff',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.875rem',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
            onMouseOver={(e) =>
              (e.currentTarget.style.background = 'var(--ac2)')
            }
            onMouseOut={(e) =>
              (e.currentTarget.style.background = 'var(--ac)')
            }
          >
            ホーム画面に追加する
          </button>
        )}
      </div>
    </div>
  )
}
