'use client'

import { useFavorites, type FavoriteItem } from '@/lib/useFavorites'
import { useProStatus } from '@/components/pro/useProStatus'

interface Props {
  item: Omit<FavoriteItem, 'addedAt'>
  className?: string
}

export default function FavoriteButton({ item, className = '' }: Props) {
  const { isPro } = useProStatus()
  const { isFavorite, toggle } = useFavorites()
  const active = isFavorite(item.id)

  if (!isPro) return null

  return (
    <button
      onClick={() => toggle(item)}
      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        active
          ? 'bg-ac text-white'
          : 'bg-s1 border border-br text-muted hover:border-ac/30 hover:text-ac'
      } ${className}`}
      title={active ? 'お気に入りから削除' : 'お気に入りに追加'}
    >
      <svg
        className="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
      </svg>
      {active ? '登録済み' : 'お気に入り'}
    </button>
  )
}
