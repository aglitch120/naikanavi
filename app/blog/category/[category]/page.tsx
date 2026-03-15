import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPostsByCategory } from '@/lib/mdx'
import { categories, clusterColors, type CategorySlug } from '@/lib/blog-config'
import { generateMetadata as genMeta, generateBreadcrumbJsonLd } from '@/lib/seo'
import ArticleCard from '@/components/blog/ArticleCard'

interface Props {
  params: Promise<{ category: string }>
}

export async function generateStaticParams() {
  return Object.keys(categories).map((category) => ({ category }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params
  const categoryData = categories[category as CategorySlug]
  
  if (!categoryData) {
    return {}
  }
  
  return genMeta({
    title: `${categoryData.name}の記事一覧`,
    description: `内科ナビの${categoryData.name}に関する記事一覧。内科専攻医向けの情報を発信しています。`,
    path: `/blog/category/${category}`,
  })
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params
  const categoryData = categories[category as CategorySlug]
  
  if (!categoryData) {
    notFound()
  }
  
  const posts = getPostsByCategory(category as CategorySlug)
  
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'ホーム', url: 'https://iwor.jp' },
    { name: 'ブログ', url: 'https://iwor.jp/blog' },
    { name: categoryData.name, url: `https://iwor.jp/blog/category/${category}` },
  ])
  
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* パンくず */}
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <Link href="/blog" className="hover:text-ac">ブログ</Link>
        <span className="mx-2">›</span>
        <span>{categoryData.name}</span>
      </nav>

      <div className="flex items-center gap-3 mb-2">
        <span
          className="inline-block w-1 h-8 rounded-full flex-shrink-0"
          style={{ backgroundColor: clusterColors[categoryData.cluster]?.bg || '#1B4F3A' }}
        />
        <h1 className="text-2xl font-bold">{categoryData.name}</h1>
      </div>
      <p className="text-muted mb-8">{posts.length}件の記事</p>

      {/* 他カテゴリへのリンク */}
      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted mb-3">他のカテゴリ</h2>
        <div className="flex flex-wrap gap-2">
          {Object.entries(categories)
            .filter(([slug]) => slug !== category)
            .map(([slug, cat]) => (
              <Link
                key={slug}
                href={`/blog/category/${slug}`}
                className="inline-flex items-center gap-1.5 text-xs bg-s1 text-muted px-3 py-1.5 rounded-full hover:opacity-90 hover:text-white transition-colors"
              >
                <span
                  className="inline-block w-2 h-2 rounded-full flex-shrink-0"
                  style={{ backgroundColor: clusterColors[cat.cluster]?.bg || '#1B4F3A' }}
                />
                {cat.name}
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
          <p className="text-muted text-lg mb-4">
            {categoryData.name}の記事はまだありません
          </p>
          <Link href="/blog" className="text-ac hover:underline">
            他の記事を見る →
          </Link>
        </div>
      )}
    </div>
  )
}
