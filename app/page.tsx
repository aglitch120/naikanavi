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
        <div className="flex flex-col sm:flex-row justify-center gap-3 max-w-md mx-auto">
          <a
            href="https://naikanavi.booth.pm/items/8058590"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-ac text-white px-6 py-3 rounded-lg font-medium hover:bg-ac2 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            アプリを購入する
          </a>
          <a
            href="/app"
            className="bg-s0 text-ac border border-br px-6 py-3 rounded-lg font-medium hover:bg-acl hover:border-ac transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
            </svg>
            ログイン
          </a>
        </div>
        <p className="text-sm text-muted mt-4">
          <a href="/blog" className="text-ac hover:underline">ブログ記事を読む →</a>
        </p>
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
        <div className="bg-acl border border-ac/20 rounded-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-ac mb-4">
              内科ナビで専攻医生活を効率化しませんか？
            </h2>
            <p className="text-muted max-w-lg mx-auto">
              J-OSLER進捗管理、病歴要約テンプレート、試験対策クイズなど、
              内科専攻医に必要なツールをすべて提供しています。
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
            {/* 新規ユーザー向け */}
            <div className="bg-s0 border border-br rounded-lg p-5">
              <div className="text-sm font-medium text-ac mb-2">はじめての方</div>
              <h3 className="font-bold mb-2">BOOTHで購入する</h3>
              <p className="text-sm text-muted mb-4">買い切り型。一度の購入でずっと使えます。</p>
              <a
                href="https://naikanavi.booth.pm/items/8058590"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 w-full bg-ac text-white px-4 py-3 rounded-lg font-medium hover:bg-ac2 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                BOOTHで購入 →
              </a>
            </div>
            
            {/* 既存ユーザー向け */}
            <div className="bg-s0 border border-br rounded-lg p-5">
              <div className="text-sm font-medium text-muted mb-2">すでにお持ちの方</div>
              <h3 className="font-bold mb-2">アプリにログイン</h3>
              <p className="text-sm text-muted mb-4">進捗を確認、病歴要約を作成できます。</p>
              <a
                href="/app"
                className="inline-flex items-center justify-center gap-2 w-full bg-s0 text-ac border border-ac px-4 py-3 rounded-lg font-medium hover:bg-acl transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                ログイン →
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
