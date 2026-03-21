'use client'

import { useState, useEffect, useCallback } from 'react'
import { useProStatus } from '@/components/pro/useProStatus'
import ProModal from '@/components/pro/ProModal'
import { trackFavoriteAdd } from '@/lib/gtag'

// ── お気に入り管理（localStorage → Phase2: Supabase） ──
const STORAGE_KEY = 'iwor_favorites'

export interface FavoriteItem {
  id: string
  title: string
  href: string
  type: string   // 'calc' | 'icu' | 'compare' | 'drugs' | 'blog' | 'app' | 'procedures'
  icon?: string
  addedAt: number
}

export function loadFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]')
    // Migration: old format was string[] of slugs
    if (raw.length > 0 && typeof raw[0] === 'string') {
      const migrated: FavoriteItem[] = raw.map((slug: string) => ({
        id: slug,
        title: slug,
        href: `/tools/calc/${slug}`,
        type: slug.startsWith('icu-') ? 'icu' : 'calc',
        addedAt: Date.now(),
      }))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(migrated))
      return migrated
    }
    // Migration v2: fix broken hrefs and slug-as-title
    const HREF_FIXES: Record<string, string> = {
      'icu-gamma-calc': '/tools/icu/gamma',
    }
    let needsSave = false
    const fixed = (raw as FavoriteItem[]).map((f: FavoriteItem) => {
      let changed = false
      let item = { ...f }
      // Fix known broken hrefs
      if (HREF_FIXES[f.id] && f.href !== HREF_FIXES[f.id]) {
        item.href = HREF_FIXES[f.id]
        changed = true
      }
      // Remove favorites for deleted tools (er, acls, interpret, dashboard)
      if (['er', 'acls', 'interpret'].includes(f.type) || f.href.startsWith('/dashboard') || f.href.startsWith('/tools/er/') || f.href.startsWith('/tools/acls/') || f.href.startsWith('/tools/interpret/')) {
        return null // will be filtered out
      }
      // Fix app hrefs
      if (f.id.startsWith('app-') && f.href.startsWith('/tools/calc/')) {
        item.href = `/${f.id.replace('app-', '')}`
        item.type = 'app'
        changed = true
      }
      if (changed) needsSave = true
      return item
    }).filter(Boolean) as FavoriteItem[]
    if (needsSave || fixed.length < raw.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fixed))
    }
    return fixed
  } catch { return [] }
}

function saveFavorites(items: FavoriteItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

// ── お気に入りボタン ──
interface FavoriteButtonProps {
  slug: string
  title?: string
  href?: string
  type?: string
  size?: 'sm' | 'md'
}

export default function FavoriteButton({ slug, title, href, type, size = 'md' }: FavoriteButtonProps) {
  const { isPro } = useProStatus()
  const [isFav, setIsFav] = useState(false)
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setIsFav(loadFavorites().some(f => f.id === slug))
  }, [slug])

  const handleClick = useCallback(() => {
    if (!isPro) {
      setShowModal(true)
      return
    }

    const favs = loadFavorites()
    if (favs.some(f => f.id === slug)) {
      saveFavorites(favs.filter(f => f.id !== slug))
      setIsFav(false)
    } else {
      const derivedType = type
        || (slug.startsWith('icu-') ? 'icu'
          : slug.startsWith('app-') ? 'app'
          : 'calc')
      const derivedHref = href
        || (derivedType === 'icu' ? `/tools/icu/${slug.replace('icu-', '')}`
          : derivedType === 'app' ? `/${slug.replace('app-', '')}`
          : `/tools/calc/${slug}`)

      saveFavorites([...favs, {
        id: slug,
        title: title || slug,
        href: derivedHref,
        type: derivedType,
        addedAt: Date.now(),
      }])
      setIsFav(true)
      trackFavoriteAdd(slug)
    }

    window.dispatchEvent(new CustomEvent('favorites-changed'))
  }, [slug, title, href, type, isPro])

  const sizeClass = size === 'sm' ? 'w-7 h-7 text-sm' : 'w-9 h-9 text-lg'

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
  const [favorites, setFavoritesState] = useState<FavoriteItem[]>([])

  useEffect(() => {
    setFavoritesState(loadFavorites())
    const handler = () => setFavoritesState(loadFavorites())
    window.addEventListener('favorites-changed', handler)
    return () => window.removeEventListener('favorites-changed', handler)
  }, [])

  if (favorites.length === 0) return null

  return (
    <div className="mb-6 p-3 bg-[#FFF8E1] border border-[#F9A825]/50 rounded-xl">
      <p className="text-xs font-medium text-[#E65100] mb-2 flex items-center gap-1">⭐ お気に入り</p>
      <div className="flex flex-wrap gap-1.5">
        {favorites.map(fav => (
          <a key={fav.id} href={fav.href}
            className="text-xs px-2.5 py-1 bg-white border border-[#F9A825]/40 rounded-lg text-tx hover:bg-[#FFF8E1] transition-colors">
            {fav.title}
          </a>
        ))}
      </div>
    </div>
  )
}
