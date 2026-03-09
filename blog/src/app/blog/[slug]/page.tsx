import { notFound } from 'next/navigation';
import { getAllPostSlugs, getPostBySlug, markdownToHtml, getRelatedPosts } from '@/lib/mdx';
import { buildArticleMetadata } from '@/lib/seo';
import { categories, clusterColors, ctaConfig, siteConfig } from '@/lib/blog-config';
import Link from 'next/link';

// 静的パス生成
export async function generateStaticParams() {
  const slugs = getAllPostSlugs();
  return slugs.map((slug) => ({ slug }));
}

// メタデータ生成
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post) {
    return { title: '記事が見つかりません' };
  }

  return buildArticleMetadata({
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    slug: post.slug,
    date: post.frontmatter.date,
    updated: post.frontmatter.updated,
    tags: post.frontmatter.tags,
    author: post.frontmatter.author,
  });
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.frontmatter.status !== 'published') {
    notFound();
  }

  const content = await markdownToHtml(post.content);
  const relatedPosts = await getRelatedPosts(slug, post.frontmatter.cluster);
  const cluster = clusterColors[post.frontmatter.cluster] || clusterColors['Z'];
  const category = categories[post.frontmatter.category];
  const cta = ctaConfig[post.frontmatter.cta_type] || ctaConfig.general;

  return (
    <article className="mx-auto max-w-3xl px-4 py-12">
      {/* パンくず */}
      <Breadcrumb
        items={[
          { label: 'ホーム', href: '/' },
          { label: 'ブログ', href: '/blog/' },
          { label: category?.name || post.frontmatter.category, href: `/blog/category/${post.frontmatter.category}/` },
          { label: post.frontmatter.title },
        ]}
      />

      {/* 記事ヘッダー */}
      <header className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <span
            className="cluster-badge"
            style={{ backgroundColor: cluster.bg, color: cluster.text }}
          >
            {category?.name || post.frontmatter.category}
          </span>
          <span className="text-sm text-[var(--m)]">
            {post.readingTime}分で読める
          </span>
        </div>

        <h1 className="text-2xl font-bold mb-4 leading-tight">
          {post.frontmatter.title}
        </h1>

        <p className="text-[var(--m)] mb-4">
          {post.frontmatter.description}
        </p>

        <div className="flex items-center gap-4 text-sm text-[var(--m)]">
          <time dateTime={post.frontmatter.date}>
            公開: {new Date(post.frontmatter.date).toLocaleDateString('ja-JP')}
          </time>
          {post.frontmatter.updated && post.frontmatter.updated !== post.frontmatter.date && (
            <time dateTime={post.frontmatter.updated}>
              更新: {new Date(post.frontmatter.updated).toLocaleDateString('ja-JP')}
            </time>
          )}
          <span>{post.frontmatter.author}</span>
        </div>
      </header>

      {/* 上部CTA */}
      <CTABanner cta={cta} variant="inline" />

      {/* 記事本文 */}
      <div
        className="prose"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      {/* 下部CTA */}
      <CTABanner cta={cta} variant="card" />

      {/* タグ */}
      <div className="mt-8 flex flex-wrap gap-2">
        {post.frontmatter.tags.map((tag) => (
          <span
            key={tag}
            className="px-3 py-1 bg-[var(--s1)] text-sm text-[var(--m)] rounded-full"
          >
            #{tag}
          </span>
        ))}
      </div>

      {/* 関連記事 */}
      {relatedPosts.length > 0 && (
        <section className="mt-12">
          <h2 className="text-xl font-semibold mb-6">関連記事</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {relatedPosts.map((related) => (
              <Link
                key={related.slug}
                href={`/blog/${related.slug}/`}
                className="card hover:border-[var(--ac)]"
              >
                <h3 className="font-semibold mb-2 line-clamp-2">
                  {related.frontmatter.title}
                </h3>
                <p className="text-sm text-[var(--m)] line-clamp-2">
                  {related.frontmatter.description}
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* JSON-LD構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Article',
            headline: post.frontmatter.title,
            description: post.frontmatter.description,
            datePublished: post.frontmatter.date,
            dateModified: post.frontmatter.updated || post.frontmatter.date,
            author: {
              '@type': 'Organization',
              name: post.frontmatter.author,
            },
            publisher: {
              '@type': 'Organization',
              name: siteConfig.name,
              url: siteConfig.url,
            },
            mainEntityOfPage: {
              '@type': 'WebPage',
              '@id': `${siteConfig.url}/blog/${slug}/`,
            },
          }),
        }}
      />
    </article>
  );
}

// パンくずコンポーネント
function Breadcrumb({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="mb-6 text-sm text-[var(--m)]">
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-center gap-2">
            {index > 0 && <span>/</span>}
            {item.href ? (
              <Link href={item.href} className="hover:text-[var(--ac)]">
                {item.label}
              </Link>
            ) : (
              <span className="text-[var(--tx)]">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}

// CTAコンポーネント
function CTABanner({ cta, variant }: { cta: typeof ctaConfig.general; variant: 'inline' | 'card' }) {
  if (variant === 'inline') {
    return (
      <div className="mb-8 p-4 bg-[var(--acl)] rounded-lg border border-[var(--ac)]">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-semibold text-[var(--ac)]">{cta.title}</p>
            <p className="text-sm text-[var(--m)]">{cta.description}</p>
          </div>
          <a href={cta.url} className="btn-primary px-6 py-2 text-sm whitespace-nowrap">
            {cta.buttonText}
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-12 p-6 bg-[var(--s0)] rounded-lg border border-[var(--br)] text-center">
      <p className="text-xl font-semibold mb-2">{cta.title}</p>
      <p className="text-[var(--m)] mb-4">{cta.description}</p>
      <a href={cta.url} className="btn-primary inline-block px-8 py-3">
        {cta.buttonText}
      </a>
    </div>
  );
}
