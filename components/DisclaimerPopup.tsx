'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

const STORAGE_KEY = 'iwor_disclaimer_accepted'

/** ツール系パスかどうか判定 */
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

  // body スクロール抑止
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
        className="relative bg-s0 border border-br rounded-2xl shadow-2xl max-w-md w-full p-6 overflow-y-auto max-h-[90vh]"
        style={{ animation: 'disclaimerIn .25s ease-out' }}
      >
        {/* ヘッダー */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-acl mb-3">
            <svg className="w-6 h-6 text-ac" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-tx">ご利用にあたって</h2>
        </div>

        {/* 本文 */}
        <div className="space-y-4 text-sm text-tx leading-relaxed">
          {/* 対象確認 */}
          <div className="bg-acl/60 border border-ac/15 rounded-xl p-4">
            <p className="font-bold text-ac mb-1">対象ユーザーの確認</p>
            <p className="text-muted text-[13px]">
              本サービスは<strong className="text-tx">医学生・医師・医療従事者</strong>を対象としています。
              医療従事者でない方が本サービスの情報を自己診断・自己治療に使用することは想定していません。
            </p>
          </div>

          {/* 個人情報禁止 */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="font-bold text-red-700 mb-1">⚠️ 患者個人情報の入力禁止</p>
            <p className="text-muted text-[13px]">
              本サービスに<strong className="text-red-700">患者の氏名・ID・個人を特定できる情報</strong>を入力しないでください。
              入力されたデータの安全性は保証できません。
            </p>
          </div>

          {/* 免責事項 */}
          <div className="bg-wnl border border-wnb/40 rounded-xl p-4">
            <p className="font-bold text-wn mb-1">免責事項</p>
            <ul className="text-muted text-[13px] space-y-1.5">
              <li className="flex gap-2">
                <span className="text-wn mt-0.5 shrink-0">•</span>
                <span>本サービスの医学情報は最善を尽くして作成していますが、<strong className="text-tx">正確性を保証するものではありません</strong>。</span>
              </li>
              <li className="flex gap-2">
                <span className="text-wn mt-0.5 shrink-0">•</span>
                <span>臨床判断は必ずご自身の知識・経験・最新のガイドラインに基づいて行ってください。</span>
              </li>
              <li className="flex gap-2">
                <span className="text-wn mt-0.5 shrink-0">•</span>
                <span>本サービスの利用により生じたいかなる損害についても、運営者は責任を負いかねます。</span>
              </li>
            </ul>
          </div>

          {/* 連絡促し */}
          <div className="bg-s1 border border-br rounded-xl p-4">
            <p className="font-bold text-tx mb-1">間違いを見つけたら</p>
            <p className="text-muted text-[13px]">
              情報の誤りやお気づきの点がありましたら、ぜひ
              <a href="/contact" className="text-ac hover:underline font-medium">お問い合わせ</a>
              からご連絡ください。迅速に対応いたします。
            </p>
          </div>
        </div>

        {/* 同意ボタン */}
        <button
          onClick={handleAccept}
          className="mt-6 w-full py-3.5 bg-ac text-white rounded-xl font-bold text-sm hover:bg-ac/90 transition-colors active:scale-[0.98]"
        >
          了解しました
        </button>

        <p className="text-center text-[11px] text-muted mt-3">
          「了解しました」をクリックすると、上記内容に同意したものとみなします。
        </p>
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
