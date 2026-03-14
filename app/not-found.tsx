import Link from 'next/link'
import { getAllPosts } from '@/lib/mdx'

export default function NotFound() {
  const recentPosts = getAllPosts().slice(0, 3)

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <h1 className="text-6xl font-bold text-ac mb-4">404</h1>
      <h2 className="text-xl font-bold text-tx mb-2">ページが見つかりません</h2>
      <p className="text-muted mb-8 max-w-md">
        お探しのページは移動または削除された可能性があります。
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-12">
        <Link
          href="/"
          className="inline-flex items-center justify-center gap-2 bg-ac text-white px-6 py-3 rounded-xl font-bold hover:bg-ac2 transition-colors"
        >
          トップページへ
        </Link>
        <Link
          href="/blog"
          className="inline-flex items-center justify-center gap-2 border border-br text-tx px-6 py-3 rounded-xl font-medium hover:border-ac hover:text-ac transition-colors"
        >
          ブログ一覧へ
        </Link>
      </div>

      {recentPosts.length > 0 && (
        <div className="w-full max-w-2xl text-left">
          <h3 className="text-sm font-semibold text-muted mb-4 text-center">最近の記事</h3>
          <div className="grid gap-3">
            {recentPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group block p-4 rounded-lg border border-br hover:border-ac hover:bg-acl/30 transition-colors"
              >
                <span className="text-sm font-medium text-tx group-hover:text-ac transition-colors line-clamp-1">
                  {post.title}
                </span>
                <span className="text-xs text-muted line-clamp-1 mt-1 block">
                  {post.description}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
