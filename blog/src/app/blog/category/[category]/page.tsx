import { notFound } from 'next/navigation';
import { getPostsByCategory } from '@/lib/mdx';
import { categories, clusterColors } from '@/lib/blog-config';
import { buildCategoryMetadata } from '@/lib/seo';
import Link from 'next/link';

// 静的パス生成
export async function generateStaticParams() {
  return Object.keys(categories).map((category) => ({ category }));
}

// メタデータ生成
export async function generateMetadata({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categoryData = categories[category];

  if (!categoryData) {
    return { title: 'カテゴリが見つかりません' };
  }

  return buildCategoryMetadata({
    category,
    name: categoryData.name,
    description: categoryData.description,
  });
}

export default async function CategoryPage({ params }: { params: Promise<{ category: string }> }) {
  const { category } = await params;
  const categoryData = categories[category];

  if (!categoryData) {
    notFound();
  }

  const posts = await getPostsByCategory(category);
  const cluster = clusterColors[categoryData.cluster] || clusterColors['Z'];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* ヘッダー */}
      <div className="mb-12">
        <div className="mb-4">
          <Link href="/blog/" className="text-sm text-[var(--m)] hover:text-[var(--ac)]">
            ← ブログに戻る
          </Link>
        </div>
        <div className="flex items-center gap-3 mb-2">
          <span
            className="cluster-badge"
            style={{ backgroundColor: cluster.bg, color: cluster.text }}
          >
            {categoryData.name}
          </span>
        </div>
        <h1 className="text-2xl font-bold mb-2">{categoryData.name}の記事一覧</h1>
        <p className="text-[var(--m)]">{categoryData.description}</p>
      </div>

      {/* カテゴリナビ */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Link 
          href="/blog/" 
          className="px-4 py-2 rounded-full bg-[var(--s1)] text-[var(--m)] text-sm hover:bg-[var(--acl)] hover:text-[var(--ac)]"
        >
          すべて
        </Link>
        {Object.entries(categories).slice(0, 8).map(([slug, cat]) => (
          <Link
            key={slug}
            href={`/blog/category/${slug}/`}
            className={`px-4 py-2 rounded-full text-sm ${
              slug === category
                ? 'bg-[var(--ac)] text-white'
                : 'bg-[var(--s1)] text-[var(--m)] hover:bg-[var(--acl)] hover:text-[var(--ac)]'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* 記事一覧 */}
      {posts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[var(--m)]">このカテゴリにはまだ記事がありません</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => {
            const postCluster = clusterColors[post.frontmatter.cluster] || clusterColors['Z'];
            const postCategory = categories[post.frontmatter.category];

            return (
              <article key={post.slug} className="card hover:border-[var(--ac)]">
                <Link href={`/blog/${post.slug}/`}>
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className="cluster-badge"
                      style={{ backgroundColor: postCluster.bg, color: postCluster.text }}
                    >
                      {postCategory?.name || post.frontmatter.category}
                    </span>
                    <span className="text-xs text-[var(--m)]">
                      {post.readingTime}分で読める
                    </span>
                  </div>

                  <h2 className="text-lg font-semibold mb-2 line-clamp-2">
                    {post.frontmatter.title}
                  </h2>

                  <p className="text-sm text-[var(--m)] line-clamp-2 mb-3">
                    {post.frontmatter.description}
                  </p>

                  <div className="flex items-center gap-4 text-xs text-[var(--m)]">
                    <time dateTime={post.frontmatter.date}>
                      {new Date(post.frontmatter.date).toLocaleDateString('ja-JP')}
                    </time>
                    {post.frontmatter.tags.slice(0, 3).map((tag) => (
                      <span key={tag}>#{tag}</span>
                    ))}
                  </div>
                </Link>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
