'use client'

import { useEffect } from 'react'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-5xl font-bold text-ac mb-4">エラー</h1>
      <h2 className="text-lg font-bold text-tx mb-2">予期しないエラーが発生しました</h2>
      <p className="text-muted mb-8 max-w-md">
        申し訳ありません。ページの読み込み中に問題が発生しました。
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="inline-flex items-center justify-center bg-ac text-white px-6 py-3 rounded-xl font-bold hover:bg-ac2 transition-colors"
        >
          もう一度試す
        </button>
        <a
          href="/"
          className="inline-flex items-center justify-center border border-br text-tx px-6 py-3 rounded-xl font-medium hover:border-ac hover:text-ac transition-colors"
        >
          トップページへ
        </a>
      </div>
    </div>
  )
}
