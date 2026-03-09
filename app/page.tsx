import Link from 'next/link'
import { getAllPosts } from '@/lib/mdx'
import { categories } from '@/lib/blog-config'
import ArticleCard from '@/components/blog/ArticleCard'

export default function HomePage() {
  const latestPosts = getAllPosts().slice(0, 6)
  
  return (
    <div>
      {/* ヒーローセクション */}
      <section className="text-center py-12">
        <h1 className="text-2xl md:text-3xl font-bold mb-4">
          内科専攻医の悩みを<br className="md:hidden" />すべて解決する
        </h1>
        <p className="text-muted mb-8 max-w-xl mx-auto">
          J-OSLER、病歴要約、内科専門医試験対策から、キャリア・お金の情報まで。
          内科専攻医に必要な情報をすべてカバー。
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/blog"
            className="bg-ac text-white px-6 py-3 rounded-lg font-medium hover:bg-ac2 transition-colors"
          >
            ブログを読む
          </Link>
          <a
            href="/app.html"
            className="bg-s0 text-ac border border-br px-6 py-3 rounded-lg font-medium hover:bg-acl hover:border-ac transition-colors"
          >
            アプリを使う
          </a>
        </div>
      </section>

      {/* カテゴリセクション */}
      <section className="py-8">
        <h2 className="text-xl font-bold mb-6">カテゴリ</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(categories).slice(0, 8).map(([slug, category]) => (
            <Link
              key={slug}
              href={`/blog/category/${slug}`}
              className="bg-s0 border border-br rounded-lg p-4 text-center hover:border-ac hover:bg-acl transition-colors"
            >
              <span className="text-sm font-medium">{category.name}</span>
            </Link>
          ))}
        </div>
      </section>

      {/* 最新記事セクション */}
      <section className="py-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">最新記事</h2>
          <Link href="/blog" className="text-ac text-sm hover:underline">
            すべて見る →
          </Link>
        </div>
        
        {latestPosts.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {latestPosts.map((post) => (
              <ArticleCard key={post.slug} post={post} />
            ))}
          </div>
        ) : (
          <div className="bg-s0 border border-br rounded-lg p-8 text-center text-muted">
            <p>まだ記事がありません。近日公開予定です！</p>
          </div>
        )}
      </section>

      {/* CTAセクション */}
      <section className="py-8">
        <div className="bg-acl border border-ac/20 rounded-lg p-8 text-center">
          <h2 className="text-xl font-bold text-ac mb-4">
            内科ナビを使ってみませんか？
          </h2>
          <p className="text-muted mb-6">
            J-OSLER進捗管理、病歴要約テンプレート、試験対策クイズなど、
            内科専攻医に必要なツールをすべて無料で提供しています。
          </p>
          <a
            href="/app.html"
            className="inline-block bg-ac text-white px-8 py-3 rounded-lg font-medium hover:bg-ac2 transition-colors"
          >
            無料で始める
          </a>
        </div>
      </section>
    </div>
  )
}
