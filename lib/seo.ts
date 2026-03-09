import { Metadata } from 'next'
import { siteConfig } from './blog-config'

interface GenerateMetadataParams {
  title: string
  description: string
  path?: string
  ogImage?: string
  publishedTime?: string
  modifiedTime?: string
  authors?: string[]
  tags?: string[]
}

// ページ用メタデータ生成
export function generateMetadata({
  title,
  description,
  path = '',
  ogImage,
  publishedTime,
  modifiedTime,
  authors = [siteConfig.author],
  tags = [],
}: GenerateMetadataParams): Metadata {
  const url = `${siteConfig.url}${path}`
  const image = ogImage || siteConfig.ogImage
  
  return {
    title: `${title} | ${siteConfig.name}`,
    description,
    authors: authors.map((name) => ({ name })),
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.name,
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'ja_JP',
      type: path.includes('/blog/') ? 'article' : 'website',
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
    alternates: {
      canonical: url,
    },
    keywords: tags,
  }
}

// Article構造化データ生成
export function generateArticleJsonLd({
  title,
  description,
  slug,
  date,
  updated,
  author,
  ogImage,
}: {
  title: string
  description: string
  slug: string
  date: string
  updated?: string
  author: string
  ogImage?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: ogImage || siteConfig.ogImage,
    author: {
      '@type': 'Person',
      name: author,
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`,
      },
    },
    datePublished: date,
    dateModified: updated || date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/blog/${slug}`,
    },
  }
}

// パンくず構造化データ生成
export function generateBreadcrumbJsonLd(
  items: { name: string; url: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

// Organization構造化データ
export const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: siteConfig.name,
  url: siteConfig.url,
  logo: `${siteConfig.url}/logo.png`,
  description: siteConfig.description,
  sameAs: [
    // SNSリンクがあれば追加
  ],
}

// WebSite + SearchAction構造化データ（サイト全体）
export const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  inLanguage: 'ja',
  publisher: {
    '@type': 'Organization',
    name: siteConfig.name,
  },
}

// SiteNavigationElement構造化データ
export const siteNavigationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SiteNavigationElement',
  name: [
    'ブログ',
    '購入する',
    'プライバシーポリシー',
    '利用規約',
    '特商法表示',
    'お問い合わせ',
  ],
  url: [
    `${siteConfig.url}/blog`,
    'https://naikanavi.booth.pm/items/8058590',
    `${siteConfig.url}/privacy`,
    `${siteConfig.url}/terms`,
    `${siteConfig.url}/tokushoho`,
    `${siteConfig.url}/contact`,
  ],
}

// MedicalWebPage構造化データ（医療系記事用）
export function generateMedicalArticleJsonLd({
  title,
  description,
  slug,
  date,
  updated,
  author,
  ogImage,
}: {
  title: string
  description: string
  slug: string
  date: string
  updated?: string
  author: string
  ogImage?: string
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'MedicalWebPage',
    headline: title,
    description,
    image: ogImage || siteConfig.ogImage,
    author: {
      '@type': 'Person',
      name: author,
      jobTitle: '医師',
    },
    publisher: {
      '@type': 'Organization',
      name: siteConfig.name,
      logo: {
        '@type': 'ImageObject',
        url: `${siteConfig.url}/logo.png`,
      },
    },
    datePublished: date,
    dateModified: updated || date,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/blog/${slug}`,
    },
    inLanguage: 'ja',
    audience: {
      '@type': 'MedicalAudience',
      audienceType: '内科専攻医',
    },
  }
}

// FAQPage構造化データ生成
export function generateFAQJsonLd(
  faqs: { question: string; answer: string }[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  }
}
