import type { Metadata } from 'next';
import { siteConfig } from './blog-config';

interface SEOParams {
  title: string;
  description: string;
  path: string;
  ogImage?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  author?: string;
}

// メタデータビルダー
export function buildMetadata(params: SEOParams): Metadata {
  const {
    title,
    description,
    path,
    ogImage = siteConfig.ogImage,
    type = 'website',
    publishedTime,
    modifiedTime,
    tags,
    author = siteConfig.author,
  } = params;

  const url = `${siteConfig.url}${path}`;
  const fullTitle = `${title} | ${siteConfig.name}`;

  return {
    title: fullTitle,
    description,
    authors: [{ name: author }],
    openGraph: {
      title: fullTitle,
      description,
      url,
      siteName: siteConfig.name,
      images: [
        {
          url: ogImage.startsWith('http') ? ogImage : `${siteConfig.url}${ogImage}`,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'ja_JP',
      type: type === 'article' ? 'article' : 'website',
      ...(type === 'article' && {
        publishedTime,
        modifiedTime,
        authors: [author],
        tags,
      }),
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [ogImage.startsWith('http') ? ogImage : `${siteConfig.url}${ogImage}`],
    },
    alternates: {
      canonical: url,
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
  };
}

// 記事用メタデータ
export function buildArticleMetadata(params: {
  title: string;
  description: string;
  slug: string;
  date: string;
  updated?: string;
  tags: string[];
  author?: string;
  ogImage?: string;
}): Metadata {
  return buildMetadata({
    title: params.title,
    description: params.description,
    path: `/blog/${params.slug}/`,
    type: 'article',
    publishedTime: params.date,
    modifiedTime: params.updated || params.date,
    tags: params.tags,
    author: params.author,
    ogImage: params.ogImage,
  });
}

// カテゴリ用メタデータ
export function buildCategoryMetadata(params: {
  category: string;
  name: string;
  description: string;
}): Metadata {
  return buildMetadata({
    title: `${params.name}の記事一覧`,
    description: params.description,
    path: `/blog/category/${params.category}/`,
  });
}
