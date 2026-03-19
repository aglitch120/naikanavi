'use client'

import { useEffect } from 'react'

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          // Check for updates periodically
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (
                  newWorker.state === 'activated' &&
                  navigator.serviceWorker.controller
                ) {
                  // New SW activated, content updated silently
                  console.log('[SW] Updated to latest version')
                }
              })
            }
          })
        })
        .catch((error) => {
          console.error('[SW] Registration failed:', error)
        })
    }
  }, [])

  return null
}
