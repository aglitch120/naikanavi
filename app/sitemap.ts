import { MetadataRoute } from 'next'
import { getAllPosts, getPostBySlug } from '@/lib/mdx'
import { categories } from '@/lib/blog-config'
import { tools, implementedTools } from '@/lib/tools-config'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://iwor.jp'
  const posts = getAllPosts()
  
  // 静的ページ
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date('2026-03-09'),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date('2026-03-09'),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date('2026-03-09'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date('2026-03-09'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/tokushoho`,
      lastModified: new Date('2026-03-09'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date('2026-03-09'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/app`,
      lastModified: new Date('2026-03-17'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: new Date('2026-03-17'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/matching`,
      lastModified: new Date('2026-03-17'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/josler`,
      lastModified: new Date('2026-03-17'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/pro`,
      lastModified: new Date('2026-03-17'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ]

  // ツールページ（実装済みのみ）
  const toolPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'weekly' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools/calc`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'weekly' as const,
      priority: 0.85,
    },
    ...tools
      .filter(t => implementedTools.has(t.slug))
      .map(t => ({
        url: `${baseUrl}/tools/calc/${t.slug}`,
        lastModified: new Date('2026-03-15'),
        changeFrequency: 'monthly' as const,
        priority: 0.85,
      })),
  ]
  
  // カテゴリページ
  const categoryPages: MetadataRoute.Sitemap = Object.keys(categories).map((slug) => ({
    url: `${baseUrl}/blog/category/${slug}`,
    lastModified: new Date('2026-03-09'),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))
  
  // 記事ページ（updatedがあればそちらを使用）
  const postPages: MetadataRoute.Sitemap = posts.map((post) => {
    const fullPost = getPostBySlug(post.slug)
    const lastMod = fullPost?.frontmatter.updated || post.date
    return {
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(lastMod),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }
  })
  
  return [...staticPages, ...toolPages, ...categoryPages, ...postPages]
}
