'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useProStatus } from '@/components/pro/useProStatus'
import { loadFavorites, type FavoriteItem } from '@/components/tools/FavoriteButton'

const STORAGE_KEY = 'iwor_favorites'

// カテゴリ定義
const CATEGORIES = [
  { id: 'all', label: 'すべて', icon: '📌' },
  { id: 'app', label: 'アプリ', icon: '📱' },
  { id: 'calc', label: '臨床計算', icon: '🧮' },
  { id: 'interpret', label: '検査読影', icon: '🔬' },
  { id: 'er', label: 'ER', icon: '🚑' },
  { id: 'icu', label: 'ICU', icon: '🏥' },
  { id: 'acls', label: 'ACLS', icon: '❤️' },
  { id: 'compare', label: '薬剤比較', icon: '💊' },
  { id: 'drugs', label: '薬剤ガイド', icon: '💉' },
]

function saveFavorites(items: FavoriteItem[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export default function FavoritesPage() {
  const { isPro, isLoading: proLoading } = useProStatus()
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [activeCategory, setActiveCategory] = useState('all')

  useEffect(() => {
    setFavorites(loadFavorites())
    setIsLoaded(true)
    const handler = () => setFavorites(loadFavorites())
    window.addEventListener('favorites-changed', handler)
    return () => window.removeEventListener('favorites-changed', handler)
  }, [])

  const remove = (id: string) => {
    const next = favorites.filter(f => f.id !== id)
    saveFavorites(next)
    setFavorites(next)
    window.dispatchEvent(new CustomEvent('favorites-changed'))
  }

  const moveUp = (index: number) => {
    if (index <= 0) return
    const next = [...favorites]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    saveFavorites(next)
    setFavorites(next)
  }

  const moveDown = (index: number) => {
    if (index >= favorites.length - 1) return
    const next = [...favorites]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    saveFavorites(next)
    setFavorites(next)
  }

  if (proLoading || !isLoaded) {
    return <main className="max-w-2xl mx-auto px-4 py-12 text-center"><p className="text-muted text-sm">読み込み中...</p></main>
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
        <p className="text-sm text-muted mb-6">PRO会員になると、よく使うツールやアプリを<br />お気に入りに登録してすぐにアクセスできます。</p>
        <Link href="/pro" className="inline-flex items-center justify-center bg-ac text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-ac2 transition-colors">PROプランを見る</Link>
      </main>
    )
  }

  // Filter by category
  const filtered = activeCategory === 'all' ? favorites : favorites.filter(f => f.type === activeCategory)

  // Categories that have items (for badge counts)
  const categoryCounts: Record<string, number> = {}
  favorites.forEach(f => { categoryCounts[f.type] = (categoryCounts[f.type] || 0) + 1 })

  // Only show category tabs that exist
  const visibleCategories = CATEGORIES.filter(c => c.id === 'all' || categoryCounts[c.id])

  return (
    <main className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-tx">お気に入り</h1>
        <p className="text-sm text-muted mt-1">
          よく使うツールにすぐアクセス。{favorites.length > 0 && <span className="text-ac font-medium">{favorites.length}件</span>}
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
          <Link href="/tools" className="inline-flex items-center justify-center bg-ac text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-ac2 transition-colors">ツールを使ってみる</Link>
        </div>
      ) : (
        <>
          {/* Category filter tabs */}
          {visibleCategories.length > 2 && (
            <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
              {visibleCategories.map(c => {
                const count = c.id === 'all' ? favorites.length : (categoryCounts[c.id] || 0)
                const isActive = activeCategory === c.id
                return (
                  <button key={c.id} onClick={() => setActiveCategory(c.id)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                      isActive ? 'bg-acl border-ac/30 text-ac' : 'bg-s0 border-br text-muted hover:border-ac/20'
                    }`}
                  >
                    <span>{c.icon}</span>
                    <span>{c.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-ac/15 text-ac' : 'bg-s1 text-muted'
                    }`}>{count}</span>
                  </button>
                )
              })}
            </div>
          )}

          {/* Favorites list */}
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted">このカテゴリにはお気に入りがありません</div>
          ) : (
            <div className="space-y-2">
              {filtered.map((fav) => {
                // Find global index for move operations
                const globalIdx = favorites.findIndex(f => f.id === fav.id)
                const catInfo = CATEGORIES.find(c => c.id === fav.type)
                return (
                  <div key={fav.id} className="flex items-center gap-3 bg-s0 border border-br rounded-xl p-4 hover:border-ac/20 transition-colors">
                    <span className="text-lg flex-shrink-0">{fav.icon || catInfo?.icon || '📌'}</span>
                    <Link href={fav.href} className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-tx truncate hover:text-ac transition-colors">{fav.title}</p>
                      <p className="text-[10px] text-muted">{catInfo?.label || fav.type}</p>
                    </Link>
                    {/* Reorder */}
                    <div className="flex flex-col gap-0.5 flex-shrink-0">
                      <button onClick={() => moveUp(globalIdx)} disabled={globalIdx === 0}
                        className="w-7 h-7 rounded-md bg-s1 border border-br flex items-center justify-center text-muted hover:text-tx hover:border-ac/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M18 15l-6-6-6 6" /></svg>
                      </button>
                      <button onClick={() => moveDown(globalIdx)} disabled={globalIdx === favorites.length - 1}
                        className="w-7 h-7 rounded-md bg-s1 border border-br flex items-center justify-center text-muted hover:text-tx hover:border-ac/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all">
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}><path d="M6 9l6 6 6-6" /></svg>
                      </button>
                    </div>
                    {/* Delete */}
                    <button onClick={() => remove(fav.id)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-muted hover:text-dn hover:bg-dnl transition-all flex-shrink-0" title="お気に入りから削除">
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M18 6L6 18M6 6l12 12" /></svg>
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </main>
  )
}
