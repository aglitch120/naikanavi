import { getAllPosts } from '@/lib/mdx';
import { categories, clusterColors } from '@/lib/blog-config';
import { buildMetadata } from '@/lib/seo';
import Link from 'next/link';

export const metadata = buildMetadata({
  title: 'ブログ',
  description: '内科専攻医のためのお役立ち記事。J-OSLER、病歴要約、試験対策、キャリアまで網羅。',
  path: '/blog/',
});

export default async function BlogPage() {
  const posts = await getAllPosts();

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      {/* ヘッダー */}
      <div className="mb-12">
        <h1 className="text-2xl font-bold mb-2">ブログ</h1>
        <p className="text-[var(--m)]">
          内科専攻医のためのお役立ち記事
        </p>
      </div>

      {/* カテゴリナビ */}
      <div className="mb-8 flex flex-wrap gap-2">
        <Link 
          href="/blog/" 
          className="px-4 py-2 rounded-full bg-[var(--ac)] text-white text-sm"
        >
          すべて
        </Link>
        {Object.entries(categories).slice(0, 8).map(([slug, cat]) => (
          <Link
            key={slug}
            href={`/blog/category/${slug}/`}
            className="px-4 py-2 rounded-full bg-[var(--s1)] text-[var(--m)] text-sm hover:bg-[var(--acl)] hover:text-[var(--ac)]"
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* 記事一覧 */}
      {posts.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-[var(--m)]">まだ記事がありません</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {posts.map((post) => {
            const cluster = clusterColors[post.frontmatter.cluster] || clusterColors['Z'];
            const category = categories[post.frontmatter.category];
            
            return (
              <article key={post.slug} className="card hover:border-[var(--ac)]">
                <Link href={`/blog/${post.slug}/`}>
                  {/* クラスターバッジ */}
                  <div className="mb-3 flex items-center gap-2">
                    <span
                      className="cluster-badge"
                      style={{ backgroundColor: cluster.bg, color: cluster.text }}
                    >
                      {category?.name || post.frontmatter.category}
                    </span>
                    <span className="text-xs text-[var(--m)]">
                      {post.readingTime}分で読める
                    </span>
                  </div>

                  {/* タイトル */}
                  <h2 className="text-lg font-semibold mb-2 line-clamp-2">
                    {post.frontmatter.title}
                  </h2>

                  {/* 説明 */}
                  <p className="text-sm text-[var(--m)] line-clamp-2 mb-3">
                    {post.frontmatter.description}
                  </p>

                  {/* メタ情報 */}
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
