import { Metadata } from 'next'
import Link from 'next/link'
import { getAllPosts } from '@/lib/mdx'
import { categories } from '@/lib/blog-config'
import { generateMetadata as genMeta } from '@/lib/seo'
import ArticleCard from '@/components/blog/ArticleCard'

export const metadata: Metadata = genMeta({
  title: 'ブログ',
  description: '内科専攻医向けの情報を発信。J-OSLER、病歴要約、内科専門医試験対策からキャリア・お金の情報まで。',
  path: '/blog',
})

export default function BlogPage() {
  const posts = getAllPosts()
  
  return (
    <div>
      {/* パンくず */}
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <span>ブログ</span>
      </nav>

      <h1 className="text-2xl font-bold mb-8">ブログ</h1>

      {/* カテゴリフィルター */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted mb-3">カテゴリで絞り込む</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(categories).map(([slug, category]) => (
            <Link
              key={slug}
              href={`/blog/category/${slug}`}
              className="text-xs bg-s1 text-muted px-3 py-1.5 rounded-full hover:bg-ac hover:text-white transition-colors"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      {/* 記事一覧 */}
      {posts.length > 0 ? (
        <div className="grid md:grid-cols-2 gap-4">
          {posts.map((post) => (
            <ArticleCard key={post.slug} post={post} />
          ))}
        </div>
      ) : (
        <div className="bg-s0 border border-br rounded-lg p-12 text-center">
          <p className="text-muted text-lg mb-4">まだ記事がありません</p>
          <p className="text-sm text-muted">
            近日公開予定です。お楽しみに！
          </p>
        </div>
      )}
    </div>
  )
}
