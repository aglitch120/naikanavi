import Link from 'next/link'
import { categories, clusterColors } from '@/lib/blog-config'
import type { PostListItem } from '@/lib/mdx'

interface Props {
  posts: PostListItem[]
}

export default function RelatedArticlesSidebar({ posts }: Props) {
  if (posts.length === 0) return null

  return (
    <div className="mt-8 pt-6 border-t border-br">
      <p className="text-xs font-semibold text-muted uppercase tracking-wider mb-3">
        関連記事
      </p>
      <ul className="space-y-3">
        {posts.map((post) => {
          const category = categories[post.category]
          const cluster = clusterColors[post.cluster]
          return (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="group block p-2.5 -mx-1 rounded-lg hover:bg-acl/40 transition-colors"
              >
                <span
                  className="inline-block text-[10px] text-white px-1.5 py-0.5 rounded mb-1.5"
                  style={{ backgroundColor: cluster?.bg || '#1B4F3A' }}
                >
                  {category?.name || 'その他'}
                </span>
                <span className="block text-sm leading-snug text-tx group-hover:text-ac transition-colors line-clamp-2">
                  {post.title}
                </span>
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
