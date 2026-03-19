'use client'

import { useState, useEffect } from 'react'

export default function OfflineIndicator() {
  const [isOffline, setIsOffline] = useState(false)

  useEffect(() => {
    const goOffline = () => setIsOffline(true)
    const goOnline = () => {
      setIsOffline(false)
    }

    // Check initial state
    if (!navigator.onLine) setIsOffline(true)

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!isOffline) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'var(--wn)',
        color: '#fff',
        textAlign: 'center',
        padding: '6px 16px',
        fontSize: '0.75rem',
        fontWeight: 500,
        animation: 'offlineSlide 0.3s ease-out',
      }}
    >
      <style>{`
        @keyframes offlineSlide {
          from { transform: translateY(-100%); }
          to { transform: translateY(0); }
        }
      `}</style>
      オフラインです — キャッシュ済みのツールは引き続き使えます
    </div>
  )
}
