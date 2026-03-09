import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPostBySlug, getAllPostSlugs, getRelatedPosts, compileMDXContent } from '@/lib/mdx'
import { categories, ctaConfig } from '@/lib/blog-config'
import { generateMetadata as genMeta, generateArticleJsonLd, generateBreadcrumbJsonLd } from '@/lib/seo'
import ArticleCard from '@/components/blog/ArticleCard'
import CTABanner from '@/components/blog/CTABanner'

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const slugs = getAllPostSlugs()
  return slugs.map((slug) => ({ slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = getPostBySlug(slug)
  
  if (!post) {
    return {}
  }
  
  return genMeta({
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    path: `/blog/${slug}`,
    publishedTime: post.frontmatter.date,
    modifiedTime: post.frontmatter.updated,
    authors: [post.frontmatter.author],
    tags: post.frontmatter.tags,
  })
}

export default async function ArticlePage({ params }: Props) {
  const { slug } = await params
  const post = getPostBySlug(slug)
  
  if (!post || post.frontmatter.status !== 'published') {
    notFound()
  }
  
  const { frontmatter, content, readingTime } = post
  const category = categories[frontmatter.category]
  const relatedPosts = getRelatedPosts(slug, 3)
  const cta = ctaConfig[frontmatter.cta_type]
  
  // MDXをコンパイル
  const MDXContent = await compileMDXContent(content)
  
  // 構造化データ
  const articleJsonLd = generateArticleJsonLd({
    title: frontmatter.title,
    description: frontmatter.description,
    slug,
    date: frontmatter.date,
    updated: frontmatter.updated,
    author: frontmatter.author,
  })
  
  const breadcrumbJsonLd = generateBreadcrumbJsonLd([
    { name: 'ホーム', url: 'https://naikanavi.com' },
    { name: 'ブログ', url: 'https://naikanavi.com/blog' },
    { name: category?.name || 'その他', url: `https://naikanavi.com/blog/category/${frontmatter.category}` },
    { name: frontmatter.title, url: `https://naikanavi.com/blog/${slug}` },
  ])
  
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      
      <article>
        {/* パンくず */}
        <nav className="text-sm text-muted mb-6">
          <Link href="/" className="hover:text-ac">ホーム</Link>
          <span className="mx-2">›</span>
          <Link href="/blog" className="hover:text-ac">ブログ</Link>
          <span className="mx-2">›</span>
          <Link href={`/blog/category/${frontmatter.category}`} className="hover:text-ac">
            {category?.name || 'その他'}
          </Link>
        </nav>

        {/* 記事ヘッダー */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <Link
              href={`/blog/category/${frontmatter.category}`}
              className="text-xs bg-ac text-white px-2 py-1 rounded"
            >
              {category?.name || 'その他'}
            </Link>
            <span className="text-sm text-muted">{readingTime}分で読める</span>
          </div>
          
          <h1 className="text-2xl md:text-3xl font-bold mb-4 leading-tight">
            {frontmatter.title}
          </h1>
          
          <p className="text-muted mb-4">{frontmatter.description}</p>
          
          <div className="flex items-center gap-4 text-sm text-muted">
            <span>{frontmatter.author}</span>
            <span>•</span>
            <time dateTime={frontmatter.date}>
              {new Date(frontmatter.date).toLocaleDateString('ja-JP', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            {frontmatter.updated && frontmatter.updated !== frontmatter.date && (
              <>
                <span>•</span>
                <span>
                  更新: {new Date(frontmatter.updated).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </>
            )}
          </div>
        </header>

        {/* 冒頭CTA */}
        <CTABanner cta={cta} variant="inline" />

        {/* 本文 */}
        <div className="prose max-w-none">
          {MDXContent}
        </div>

        {/* 末尾CTA */}
        <CTABanner cta={cta} variant="large" />

        {/* タグ */}
        {frontmatter.tags.length > 0 && (
          <div className="mt-8 pt-8 border-t border-br">
            <h3 className="text-sm font-semibold text-muted mb-3">タグ</h3>
            <div className="flex flex-wrap gap-2">
              {frontmatter.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs bg-s1 text-muted px-3 py-1.5 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </article>

      {/* 関連記事 */}
      {relatedPosts.length > 0 && (
        <section className="mt-12 pt-8 border-t border-br">
          <h2 className="text-xl font-bold mb-6">関連記事</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {relatedPosts.map((post) => (
              <ArticleCard key={post.slug} post={post} compact />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
