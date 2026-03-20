'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const STORAGE_KEY = 'iwor_disclaimer_accepted'

function isToolPath(path: string): boolean {
  return (
    path.startsWith('/tools/') ||
    path.startsWith('/compare/') ||
    path.startsWith('/josler') ||
    path.startsWith('/matching') ||
    path.startsWith('/journal')
  )
}

export default function DisclaimerPopup() {
  const pathname = usePathname()
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (!isToolPath(pathname)) return
    try {
      const accepted = localStorage.getItem(STORAGE_KEY)
      if (!accepted) setShow(true)
    } catch {
      setShow(true)
    }
  }, [pathname])

  useEffect(() => {
    if (!show) return
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [show])

  function handleAccept() {
    try { localStorage.setItem(STORAGE_KEY, Date.now().toString()) } catch {}
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      <div
        className="relative bg-s0 border border-br rounded-2xl shadow-2xl max-w-sm w-full p-5"
        style={{ animation: 'disclaimerIn .25s ease-out' }}
      >
        <h2 className="text-base font-bold text-tx text-center mb-3">ご利用にあたって</h2>

        <div className="space-y-2 text-xs text-muted leading-relaxed">
          <p>本サービスは<strong className="text-tx">医療従事者向け</strong>です。</p>
          <p className="text-red-700 font-bold">患者の氏名・ID等の個人情報を入力しないでください。</p>
          <p>掲載情報は公式文献の転記であり、正確性は保証しません。必ず原典をご確認ください。</p>
          <p>本サービスの利用により生じた損害について運営者は責任を負いません。</p>
        </div>

        <button
          onClick={handleAccept}
          className="mt-4 w-full py-3 bg-ac text-white rounded-xl font-bold text-sm hover:bg-ac/90 transition-colors active:scale-[0.98]"
        >
          了解しました
        </button>
      </div>

      <style jsx>{`
        @keyframes disclaimerIn {
          from { opacity: 0; transform: scale(0.95) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
