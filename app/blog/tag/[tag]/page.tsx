import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPostsByTag, getAllTags } from '@/lib/mdx'
import { generateMetadata as genMeta, generateBreadcrumbJsonLd } from '@/lib/seo'
import { getTagName, getTagSlug } from '@/lib/blog-config'
import ArticleCard from '@/components/blog/ArticleCard'

interface Props {
  params: Promise<{ tag: string }>
}

export async function generateStaticParams() {
  const tags = getAllTags()
  return tags.map(({ tag }) => ({ tag: getTagSlug(tag) }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag: slug } = await params
  const tagName = getTagName(slug) || slug

  return genMeta({
    title: `「${tagName}」の記事一覧`,
    description: `内科ナビの「${tagName}」に関する記事一覧。内科専攻医向けの情報を発信しています。`,
    path: `/blog/tag/${slug}`,
  })
}

export default async function TagPage({ params }: Props) {
  const { tag: slug } = await params
  const tagName = getTagName(slug) || slug
  const posts = getPostsByTag(tagName)

  if (posts.length === 0) {
    notFound()
  }

  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'ホーム', url: 'https://naikanavi.com' },
    { name: 'ブログ', url: 'https://naikanavi.com/blog' },
    { name: `タグ: ${tagName}`, url: `https://naikanavi.com/blog/tag/${slug}` },
  ])

  const allTags = getAllTags()

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link>
        <span className="mx-2">›</span>
        <Link href="/blog" className="hover:text-ac">ブログ</Link>
        <span className="mx-2">›</span>
        <span>タグ: {tagName}</span>
      </nav>

      <h1 className="text-2xl font-bold mb-2">「{tagName}」の記事一覧</h1>
      <p className="text-muted mb-8">{posts.length}件の記事</p>

      <div className="mb-8">
        <h2 className="text-sm font-semibold text-muted mb-3">他のタグ</h2>
        <div className="flex flex-wrap gap-2">
          {allTags
            .filter(({ tag: t }) => t !== tagName)
            .slice(0, 12)
            .map(({ tag: t, count }) => (
              <Link
                key={t}
                href={`/blog/tag/${getTagSlug(t)}`}
                className="text-xs bg-s1 text-muted px-3 py-1.5 rounded-full hover:bg-acl hover:text-ac transition-colors"
              >
                {t} ({count})
              </Link>
            ))}
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {posts.map((post) => (
          <ArticleCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  )
}
