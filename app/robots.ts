import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/pro/activate/',
          '/pro/login/',
          '/pro/register/',
          '/pro/reset-password/',
          '/favorites/',
          '/offline/',
        ],
      },
    ],
    sitemap: [
      'https://iwor.jp/sitemap.xml',
      'https://iwor.jp/image-sitemap.xml',
    ],
  }
}
