import { getAllPostSlugs } from '@/lib/mdx'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

const BASE_URL = 'https://iwor.jp'
const CONTENT_DIR = path.join(process.cwd(), 'content/blog')

// MDXから画像情報を抽出する
function extractImagesFromMDX(slug: string): Array<{ loc: string; title: string }> {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return []

  const raw = fs.readFileSync(filePath, 'utf-8')
  const { content } = matter(raw)

  const images: Array<{ loc: string; title: string }> = []
  // ![alt](path) 形式を抽出
  const imageRegex = /!\[([^\]]*)\]\(([^)]+)\)/g
  let match

  while ((match = imageRegex.exec(content)) !== null) {
    const alt = match[1]
    const src = match[2]
    // 外部URLは除外、/images/ で始まるもののみ
    if (src.startsWith('/images/')) {
      images.push({
        loc: `${BASE_URL}${src}`,
        title: alt || slug,
      })
    }
  }

  return images
}

export async function GET() {
  const slugs = getAllPostSlugs()

  // 記事ごとに画像を収集
  const urlEntries = slugs
    .map((slug) => {
      const images = extractImagesFromMDX(slug)
      if (images.length === 0) return null

      const imageXml = images
        .map(
          (img) => `
    <image:image>
      <image:loc>${escapeXml(img.loc)}</image:loc>
      <image:title>${escapeXml(img.title)}</image:title>
    </image:image>`
        )
        .join('')

      return `
  <url>
    <loc>${BASE_URL}/blog/${slug}</loc>${imageXml}
  </url>`
    })
    .filter(Boolean)
    .join('')

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset
  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
>${urlEntries}
</urlset>`

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  })
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
