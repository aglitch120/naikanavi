import Link from 'next/link'
import { categories, clusterColors } from '@/lib/blog-config'
import type { PostListItem } from '@/lib/mdx'

interface Props {
  post: PostListItem
  compact?: boolean
}

export default function ArticleCard({ post, compact = false }: Props) {
  const category = categories[post.category]
  const cluster = clusterColors[post.cluster]
  
  if (compact) {
    return (
      <Link
        href={`/blog/${post.slug}`}
        className="group block bg-s0 border border-br rounded-xl p-5 hover:border-ac/30 hover:shadow-md transition-all"
      >
        <span
          className="inline-block text-[10px] font-bold text-white px-2 py-0.5 rounded mb-3"
          style={{ backgroundColor: cluster?.bg || '#1B4F3A' }}
        >
          {category?.name || 'その他'}
        </span>
        <h3 className="font-bold text-sm text-tx leading-snug line-clamp-2 group-hover:text-ac transition-colors">
          {post.title}
        </h3>
      </Link>
    )
  }
  
  return (
    <Link
      href={`/blog/${post.slug}`}
      className="group block bg-s0 border border-br rounded-xl p-5 hover:border-ac/30 hover:shadow-md transition-all"
    >
      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[10px] font-bold text-white px-2 py-0.5 rounded"
          style={{ backgroundColor: cluster?.bg || '#1B4F3A' }}
        >
          {category?.name || 'その他'}
        </span>
        <span className="text-[11px] text-muted">{post.readingTime}分</span>
      </div>
      
      <h3 className="font-bold mb-2 line-clamp-2 group-hover:text-ac transition-colors">{post.title}</h3>
      
      <p className="text-sm text-muted line-clamp-2 mb-3">
        {post.description}
      </p>
      
      <div className="flex items-center justify-between text-xs text-muted">
        <time dateTime={post.date}>
          {new Date(post.date).toLocaleDateString('ja-JP', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          })}
        </time>
        <div className="flex gap-1">
          {post.tags.slice(0, 2).map((tag) => (
            <span key={tag} className="bg-s1 px-2 py-0.5 rounded">
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  )
}
