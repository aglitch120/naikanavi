import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getPostBySlug, getAllPostSlugs, getRelatedPosts, getAdjacentPosts, getCategoryCounts, compileMDXContent } from '@/lib/mdx'
import { categories, clusterColors, ctaConfig, getTagSlug } from '@/lib/blog-config'
import { generateMetadata as genMeta, generateArticleJsonLd, generateBreadcrumbJsonLd, generateHowToJsonLd, extractHowToSteps, isHowToArticle } from '@/lib/seo'
import ArticleCard from '@/components/blog/ArticleCard'
import CTABanner from '@/components/blog/CTABanner'
import TableOfContents from '@/components/blog/TableOfContents'
import InlineTableOfContents from '@/components/blog/InlineTableOfContents'
import ShareButtons from '@/components/blog/ShareButtons'
import ReadingProgress from '@/components/blog/ReadingProgress'
import RelatedArticlesSidebar from '@/components/blog/RelatedArticlesSidebar'
import CategoryNavSidebar from '@/components/blog/CategoryNavSidebar'

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
  const clusterColor = category ? clusterColors[category.cluster]?.bg : '#1B4F3A'
  const relatedPosts = getRelatedPosts(slug, 5)
  const { prev, next } = getAdjacentPosts(slug)
  const categoryCounts = getCategoryCounts()
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

  // HowToスキーマ（手順系記事のみ）
  const howToJsonLd = isHowToArticle(frontmatter.title)
    ? generateHowToJsonLd({
        title: frontmatter.title,
        description: frontmatter.description,
        slug,
        steps: extractHowToSteps(content),
      })
    : null
  
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
      {howToJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(howToJsonLd) }}
        />
      )}
      
      <ReadingProgress />
      
      <article>
        {/* パンくず */}
        <nav className="text-sm text-muted mb-4">
          <Link href="/" className="hover:text-ac">ホーム</Link>
          <span className="mx-2">›</span>
          <Link href="/blog" className="hover:text-ac">ブログ</Link>
          <span className="mx-2">›</span>
          <Link href={`/blog/category/${frontmatter.category}`} className="hover:text-ac">
            {category?.name || 'その他'}
          </Link>
        </nav>

        {/* カテゴリ + 読了時間 */}
        <div className="flex items-center gap-2 mb-4">
          <Link
            href={`/blog/category/${frontmatter.category}`}
            className="text-xs text-white px-2 py-1 rounded"
            style={{ backgroundColor: clusterColor }}
          >
            {category?.name || 'その他'}
          </Link>
          <span className="text-sm text-muted">{readingTime}分で読める</span>
        </div>

        {/* アイキャッチ画像 */}
        <div className="mb-6 rounded-xl overflow-hidden bg-s1">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/blog/${slug}/opengraph-image`}
            alt={frontmatter.title}
            width={1200}
            height={630}
            className="w-full h-auto"
            loading="eager"
          />
        </div>

        {/* 記事ヘッダー */}
        <header className="mb-8">
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

        {/* 冒頭目次（モバイルのみ） */}
        <div className="lg:hidden">
          <InlineTableOfContents />
        </div>

        {/* 本文 + サイドバー目次 */}
        <div className="lg:flex lg:gap-8">
          <div className="lg:flex-1 min-w-0">
            <div className="prose max-w-none">
              {MDXContent}
            </div>
          </div>
          <aside className="hidden lg:block lg:w-56 flex-shrink-0">
            <TableOfContents />
            <RelatedArticlesSidebar posts={relatedPosts.slice(0, 5)} />
            <CategoryNavSidebar categories={categoryCounts} currentCategory={frontmatter.category} />
          </aside>
        </div>

        {/* 末尾CTA */}
        <CTABanner cta={cta} variant="large" />

        {/* タグ */}
        {frontmatter.tags.length > 0 && (
          <div className="mt-8 pt-8 border-t border-br">
            <h3 className="text-sm font-semibold text-muted mb-3">タグ</h3>
            <div className="flex flex-wrap gap-2">
              {frontmatter.tags.map((tag) => (
                <Link
                  key={tag}
                  href={`/blog/tag/${getTagSlug(tag)}`}
                  className="text-xs bg-s1 text-muted px-3 py-1.5 rounded-full hover:bg-acl hover:text-ac transition-colors"
                >
                  {tag}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SNSシェアボタン */}
        <div className="mt-6 pt-6 border-t border-br">
          <ShareButtons title={frontmatter.title} slug={slug} />
        </div>
      </article>

      {/* 前後記事ナビゲーション */}
      {(prev || next) && (
        <nav className="mt-10 pt-8 border-t border-br grid grid-cols-1 md:grid-cols-2 gap-4">
          {prev ? (
            <Link
              href={`/blog/${prev.slug}`}
              className="group flex flex-col p-4 rounded-lg border border-br hover:border-ac hover:bg-acl/30 transition-colors"
            >
              <span className="text-xs text-muted mb-1">← 前の記事</span>
              <span className="text-sm font-medium text-tx group-hover:text-ac transition-colors line-clamp-2">
                {prev.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
          {next ? (
            <Link
              href={`/blog/${next.slug}`}
              className="group flex flex-col items-end text-right p-4 rounded-lg border border-br hover:border-ac hover:bg-acl/30 transition-colors"
            >
              <span className="text-xs text-muted mb-1">次の記事 →</span>
              <span className="text-sm font-medium text-tx group-hover:text-ac transition-colors line-clamp-2">
                {next.title}
              </span>
            </Link>
          ) : (
            <div />
          )}
        </nav>
      )}

      {/* 関連記事 */}
      {relatedPosts.length > 0 && (
        <section className="mt-12 pt-8 border-t border-br">
          <h2 className="text-xl font-bold mb-6">関連記事</h2>
          <div className="grid md:grid-cols-3 gap-4">
            {relatedPosts.slice(0, 3).map((post) => (
              <ArticleCard key={post.slug} post={post} compact />
            ))}
          </div>
        </section>
      )}
    </>
  )
}
