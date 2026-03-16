'use client'

import { useState, useEffect, useCallback } from 'react'

// ── お気に入り管理 ──
// Phase 1: localStorage
// Phase 2: Supabase sync

const FAV_KEY = 'iwor_favorites'

export interface FavoriteItem {
  id: string        // ユニークID（href をベースに）
  title: string     // 表示名
  href: string      // リンク先
  type: 'tool' | 'app' | 'blog' | 'compare'  // カテゴリ
  icon?: string     // emoji アイコン（任意）
  addedAt: number   // 追加日時
}

function loadFavorites(): FavoriteItem[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(FAV_KEY) || '[]')
  } catch { return [] }
}

function saveFavorites(items: FavoriteItem[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(FAV_KEY, JSON.stringify(items))
}

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteItem[]>([])
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    setFavorites(loadFavorites())
    setIsLoaded(true)
  }, [])

  /** お気に入り追加 */
  const add = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    setFavorites(prev => {
      if (prev.some(f => f.id === item.id)) return prev
      const next = [...prev, { ...item, addedAt: Date.now() }]
      saveFavorites(next)
      return next
    })
  }, [])

  /** お気に入り削除 */
  const remove = useCallback((id: string) => {
    setFavorites(prev => {
      const next = prev.filter(f => f.id !== id)
      saveFavorites(next)
      return next
    })
  }, [])

  /** お気に入りかどうか */
  const isFavorite = useCallback((id: string) => {
    return favorites.some(f => f.id === id)
  }, [favorites])

  /** トグル */
  const toggle = useCallback((item: Omit<FavoriteItem, 'addedAt'>) => {
    if (favorites.some(f => f.id === item.id)) {
      remove(item.id)
    } else {
      add(item)
    }
  }, [favorites, add, remove])

  /** 並び替え（indexA と indexB を入れ替え） */
  const reorder = useCallback((fromIndex: number, toIndex: number) => {
    setFavorites(prev => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      saveFavorites(next)
      return next
    })
  }, [])

  /** 上に移動 */
  const moveUp = useCallback((index: number) => {
    if (index <= 0) return
    reorder(index, index - 1)
  }, [reorder])

  /** 下に移動 */
  const moveDown = useCallback((index: number) => {
    setFavorites(prev => {
      if (index >= prev.length - 1) return prev
      const next = [...prev]
      const [moved] = next.splice(index, 1)
      next.splice(index + 1, 0, moved)
      saveFavorites(next)
      return next
    })
  }, [])

  return { favorites, isLoaded, add, remove, isFavorite, toggle, reorder, moveUp, moveDown }
}
