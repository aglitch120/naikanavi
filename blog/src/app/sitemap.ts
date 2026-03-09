import { MetadataRoute } from 'next';
import { getAllPosts } from '@/lib/mdx';
import { categories, siteConfig } from '@/lib/blog-config';

// Static export用の設定
export const dynamic = 'force-static';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  // 記事ページ
  const postUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteConfig.url}/blog/${post.slug}/`,
    lastModified: new Date(post.frontmatter.updated || post.frontmatter.date),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  // カテゴリページ
  const categoryUrls: MetadataRoute.Sitemap = Object.keys(categories).map((category) => ({
    url: `${siteConfig.url}/blog/category/${category}/`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }));

  // 固定ページ
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: siteConfig.url,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1.0,
    },
    {
      url: `${siteConfig.url}/blog/`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
  ];

  return [...staticUrls, ...postUrls, ...categoryUrls];
}
