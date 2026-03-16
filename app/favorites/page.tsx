'use client'

import Link from 'next/link'
import { useFavorites } from '@/lib/useFavorites'
import { useProStatus } from '@/components/pro/useProStatus'

// タイプ別アイコン
const typeIcons: Record<string, string> = {
  tool: '🧮',
  app: '📱',
  blog: '📝',
  compare: '💊',
}

const typeLabels: Record<string, string> = {
  tool: 'ツール',
  app: 'アプリ',
  blog: '記事',
  compare: '薬剤比較',
}

export default function FavoritesPage() {
  const { isPro, isLoading: proLoading } = useProStatus()
  const { favorites, isLoaded, remove, moveUp, moveDown } = useFavorites()

  if (proLoading || !isLoaded) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12 text-center">
        <p className="text-muted text-sm">読み込み中...</p>
      </main>
    )
  }

  if (!isPro) {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="w-16 h-16 bg-acl rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-ac" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
          </svg>
        </div>
        <h1 className="text-xl font-bold text-tx mb-2">お気に入り</h1>
        <p className="text-sm text-muted mb-6">
          PRO会員になると、よく使うツールやアプリを<br />お気に入りに登録してすぐにアクセスできます。
        </p>
        <Link
          href="/pro"
          className="inline-flex items-center justify-center bg-ac text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-ac2 transition-colors"
        >
          PROプランを見る
        </Link>
      </main>
    )
  }

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-tx">お気に入り</h1>
        <p className="text-sm text-muted mt-1">
          よく使うツール・アプリにすぐアクセス。↑↓で並び替えできます。
        </p>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-14 h-14 bg-s1 border border-br rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
          </div>
          <p className="text-sm text-muted mb-1">まだお気に入りがありません</p>
          <p className="text-xs text-muted mb-6">ツールページの ★ ボタンで追加できます</p>
          <Link
            href="/tools"
            className="inline-flex items-center justify-center bg-ac text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-ac2 transition-colors"
          >
            ツールを使ってみる
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {favorites.map((fav, i) => (
            <div
              key={fav.id}
              className="flex items-center gap-3 bg-s0 border border-br rounded-xl p-4 hover:border-ac/20 transition-colors"
            >
              {/* アイコン */}
              <span className="text-lg flex-shrink-0">{fav.icon || typeIcons[fav.type] || '📌'}</span>

              {/* リンク */}
              <Link href={fav.href} className="flex-1 min-w-0">
                <p className="text-sm font-bold text-tx truncate hover:text-ac transition-colors">
                  {fav.title}
                </p>
                <p className="text-[10px] text-muted">{typeLabels[fav.type] || fav.type}</p>
              </Link>

              {/* 並び替えボタン */}
              <div className="flex flex-col gap-0.5 flex-shrink-0">
                <button
                  onClick={() => moveUp(i)}
                  disabled={i === 0}
                  className="w-7 h-7 rounded-md bg-s1 border border-br flex items-center justify-center text-muted hover:text-tx hover:border-ac/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M18 15l-6-6-6 6" />
                  </svg>
                </button>
                <button
                  onClick={() => moveDown(i)}
                  disabled={i === favorites.length - 1}
                  className="w-7 h-7 rounded-md bg-s1 border border-br flex items-center justify-center text-muted hover:text-tx hover:border-ac/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </button>
              </div>

              {/* 削除 */}
              <button
                onClick={() => remove(fav.id)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-muted hover:text-dn hover:bg-dnl transition-all flex-shrink-0"
                title="お気に入りから削除"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
