import { MetadataRoute } from 'next'
import { getAllPosts, getPostBySlug } from '@/lib/mdx'
import { categories } from '@/lib/blog-config'
import { tools, implementedTools } from '@/lib/tools-config'
import { HOSPITALS } from '@/app/matching/hospitals-data'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://iwor.jp'
  const posts = getAllPosts()

  // 静的ページ（主要サービス）
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/tools/calc`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${baseUrl}/study`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/matching`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/josler`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/journal`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/presenter`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/shift`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/money`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/learning`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/pro`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/app`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${baseUrl}/compare`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/furusato-nozei`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    // 法的ページ
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
  ]

  // 薬剤ガイドページ
  const drugPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/tools/drugs`, lastModified: new Date('2026-03-20'), changeFrequency: 'weekly' as const, priority: 0.8 },
    { url: `${baseUrl}/tools/drugs/antibiotics`, lastModified: new Date('2026-03-20'), changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${baseUrl}/tools/drugs/cancer-pain`, lastModified: new Date('2026-03-20'), changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${baseUrl}/tools/drugs/combination`, lastModified: new Date('2026-03-20'), changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${baseUrl}/tools/drugs/preop-drugs`, lastModified: new Date('2026-03-20'), changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${baseUrl}/tools/drugs/steroid-cover`, lastModified: new Date('2026-03-20'), changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${baseUrl}/tools/drugs/tube-admin`, lastModified: new Date('2026-03-20'), changeFrequency: 'monthly' as const, priority: 0.75 },
  ]

  // その他ツールページ
  const otherToolPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/tools/antibiotics`, lastModified: new Date('2026-03-20'), changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${baseUrl}/tools/procedures`, lastModified: new Date('2026-03-20'), changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${baseUrl}/tools/interpret/lab-values`, lastModified: new Date('2026-03-20'), changeFrequency: 'monthly' as const, priority: 0.75 },
    { url: `${baseUrl}/tools/calc/gamma`, lastModified: new Date('2026-03-20'), changeFrequency: 'monthly' as const, priority: 0.75 },
  ]

  // 計算ツールページ（実装済みのみ）
  const calcPages: MetadataRoute.Sitemap = tools
    .filter(t => implementedTools.has(t.slug))
    .map(t => ({
      url: `${baseUrl}/tools/calc/${t.slug}`,
      lastModified: t.updatedAt ? new Date(`${t.updatedAt}-01`) : new Date('2026-03-20'),
      changeFrequency: 'monthly' as const,
      priority: t.tier === 1 ? 0.85 : t.tier === 2 ? 0.8 : 0.75,
    }))

  // ブログカテゴリページ
  const categoryPages: MetadataRoute.Sitemap = Object.keys(categories).map((slug) => ({
    url: `${baseUrl}/blog/category/${slug}`,
    lastModified: new Date('2026-03-20'),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // ブログ記事ページ（updatedがあればそちらを使用）
  const postPages: MetadataRoute.Sitemap = posts.map((post) => {
    const fullPost = getPostBySlug(post.slug)
    const lastMod = fullPost?.frontmatter.updated || post.date
    return {
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(lastMod),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }
  })

  // 病院ページ
  const hospitalPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/hospitals`, lastModified: new Date('2026-03-21'), changeFrequency: 'weekly' as const, priority: 0.7 },
    ...HOSPITALS.map(h => ({
      url: `${baseUrl}/hospitals/${h.id}`,
      lastModified: new Date('2026-03-21'),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
  ]

  // 新規追加ページ
  const newPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/record`, lastModified: new Date('2026-03-21'), changeFrequency: 'weekly' as const, priority: 0.7 },
    { url: `${baseUrl}/study/lp`, lastModified: new Date('2026-03-21'), changeFrequency: 'monthly' as const, priority: 0.7 },
  ]

  return [
    ...staticPages,
    ...drugPages,
    ...otherToolPages,
    ...calcPages,
    ...categoryPages,
    ...postPages,
    ...hospitalPages,
    ...newPages,
  ]
}
