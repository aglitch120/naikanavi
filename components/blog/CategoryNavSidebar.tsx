import Link from 'next/link'
import { clusterColors } from '@/lib/blog-config'
import type { CategorySlug } from '@/lib/blog-config'

interface CategoryItem {
  slug: CategorySlug
  name: string
  cluster: string
  count: number
}

interface Props {
  categories: CategoryItem[]
  currentCategory?: CategorySlug
}

export default function CategoryNavSidebar({ categories, currentCategory }: Props) {
  if (categories.length === 0) return null

  return (
    <div className="mt-8 pt-6 border-t border-br">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
        カテゴリ
      </p>
      <ul className="space-y-0.5">
        {categories.map((cat) => {
          const color = clusterColors[cat.cluster as keyof typeof clusterColors]
          const isActive = cat.slug === currentCategory
          return (
            <li key={cat.slug}>
              <Link
                href={`/blog/category/${cat.slug}`}
                className={`flex items-center justify-between py-1.5 px-2.5 -mx-1 rounded-md text-sm transition-colors ${
                  isActive
                    ? 'bg-acl text-ac font-medium'
                    : 'text-muted hover:text-tx hover:bg-s1'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: color?.bg || '#6B6760' }}
                  />
                  <span className="truncate">{cat.name}</span>
                </span>
                <span className="text-xs text-muted flex-shrink-0 ml-1">{cat.count}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
