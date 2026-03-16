'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProStatus } from '@/components/pro/useProStatus'
import ProModal from '@/components/pro/ProModal'

// ── お気に入り管理（localStorage → Phase2: Supabase） ──
const STORAGE_KEY = 'iwor_favorites'

function getFavorites(): string[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
  } catch { return [] }
}

function setFavorites(slugs: string[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs))
}

// ── お気に入りボタン ──
interface FavoriteButtonProps {
  slug: string
  size?: 'sm' | 'md'
}

export default function FavoriteButton({ slug, size = 'md' }: FavoriteButtonProps) {
  const { isPro } = useProStatus()
  const [isFav, setIsFav] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setIsFav(getFavorites().includes(slug))
  }, [slug])

  const handleClick = useCallback(() => {
    if (!isPro) {
      setShowModal(true)
      return
    }

    const favs = getFavorites()
    if (favs.includes(slug)) {
      setFavorites(favs.filter(s => s !== slug))
      setIsFav(false)
    } else {
      setFavorites([...favs, slug])
      setIsFav(true)
    }

    window.dispatchEvent(new CustomEvent('favorites-changed'))
  }, [slug, isPro])

  const sizeClass = size === 'sm'
    ? 'w-7 h-7 text-sm'
    : 'w-9 h-9 text-lg'

  return (
    <>
      <button
        onClick={handleClick}
        className={`${sizeClass} flex items-center justify-center rounded-full border transition-all
          ${isFav
            ? 'bg-[#FFF8E1] border-[#F9A825] text-[#F9A825]'
            : 'bg-s0 border-br text-muted hover:text-amber-400 hover:border-amber-300'
          }`}
        aria-label={isFav ? 'お気に入り解除' : 'お気に入りに追加'}
        title={isFav ? 'お気に入り解除' : 'お気に入りに追加'}
      >
        {isFav ? '★' : '☆'}
      </button>

      {showModal && <ProModal feature="favorites" onClose={() => setShowModal(false)} />}
    </>
  )
}

// ── お気に入りバー（ページ上部表示用） ──
export function FavoritesBar() {
  const [favorites, setFavoritesState] = useState<string[]>([])

  useEffect(() => {
    setFavoritesState(getFavorites())

    const handler = () => setFavoritesState(getFavorites())
    window.addEventListener('favorites-changed', handler)
    return () => window.removeEventListener('favorites-changed', handler)
  }, [])

  if (favorites.length === 0) return null

  return (
    <div className="mb-6 p-3 bg-[#FFF8E1] border border-[#F9A825]/50 rounded-xl">
      <p className="text-xs font-medium text-[#E65100] mb-2 flex items-center gap-1">
        ⭐ お気に入り
      </p>
      <div className="flex flex-wrap gap-1.5">
        {favorites.map(slug => (
          <a
            key={slug}
            href={`/tools/calc/${slug}`}
            className="text-xs px-2.5 py-1 bg-white border border-[#F9A825]/40 rounded-lg text-tx hover:bg-[#FFF8E1] transition-colors"
          >
            {slug}
          </a>
        ))}
      </div>
    </div>
  )
}
