import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
import { compileMDX } from 'next-mdx-remote/rsc'
import remarkGfm from 'remark-gfm'
import rehypeSlug from 'rehype-slug'
import rehypeAutolinkHeadings from 'rehype-autolink-headings'
import CopyableCodeBlock from '@/components/blog/CopyableCodeBlock'
import MdxImage from '@/components/blog/MdxImage'
import { categories, type CategorySlug, type ClusterId, type CtaType } from './blog-config'

// 記事のフロントマター型
export interface PostFrontmatter {
  title: string
  description: string
  date: string
  updated?: string
  author: string
  category: CategorySlug
  cluster: ClusterId
  pillar?: string
  tags: string[]
  cta_type: CtaType
  reading_time?: number
  status: 'draft' | 'published' | 'needs_review'
  seo_checked?: boolean
}

// 記事データ型
export interface Post {
  slug: string
  frontmatter: PostFrontmatter
  content: string
  readingTime: number
}

// 記事リスト用の軽量型
export interface PostListItem {
  slug: string
  title: string
  description: string
  date: string
  category: CategorySlug
  categoryName: string
  cluster: ClusterId
  tags: string[]
  readingTime: number
}

const CONTENT_DIR = path.join(process.cwd(), 'content/blog')

// 全記事のスラッグを取得
export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(CONTENT_DIR)) {
    return []
  }
  
  const files = fs.readdirSync(CONTENT_DIR)
  return files
    .filter((file) => file.endsWith('.mdx'))
    .map((file) => file.replace(/\.mdx$/, ''))
}

// 単一記事を取得
export function getPostBySlug(slug: string): Post | null {
  const filePath = path.join(CONTENT_DIR, `${slug}.mdx`)
  
  if (!fs.existsSync(filePath)) {
    return null
  }
  
  const fileContent = fs.readFileSync(filePath, 'utf-8')
  const { data, content } = matter(fileContent)
  const stats = readingTime(content)
  
  return {
    slug,
    frontmatter: data as PostFrontmatter,
    content,
    readingTime: Math.ceil(stats.minutes),
  }
}

// 全記事を取得（公開済みのみ）
export function getAllPosts(): PostListItem[] {
  const slugs = getAllPostSlugs()
  
  const posts = slugs
    .map((slug) => {
      const post = getPostBySlug(slug)
      if (!post || post.frontmatter.status !== 'published') {
        return null
      }
      
      return {
        slug: post.slug,
        title: post.frontmatter.title,
        description: post.frontmatter.description,
        date: post.frontmatter.date,
        category: post.frontmatter.category,
        categoryName: categories[post.frontmatter.category]?.name || 'その他',
        cluster: post.frontmatter.cluster,
        tags: post.frontmatter.tags,
        readingTime: post.readingTime,
      } as PostListItem
    })
    .filter((post): post is PostListItem => post !== null)
  
  // 日付で降順ソート
  return posts.sort((a, b) => 
    new Date(b.date).getTime() - new Date(a.date).getTime()
  )
}

// カテゴリ別記事を取得
export function getPostsByCategory(categorySlug: CategorySlug): PostListItem[] {
  return getAllPosts().filter((post) => post.category === categorySlug)
}

// クラスター別記事を取得
export function getPostsByCluster(clusterId: ClusterId): PostListItem[] {
  return getAllPosts().filter((post) => post.cluster === clusterId)
}

// 関連記事を取得（同カテゴリ・同クラスター）
export function getRelatedPosts(currentSlug: string, limit = 3): PostListItem[] {
  const currentPost = getPostBySlug(currentSlug)
  if (!currentPost) return []
  
  const allPosts = getAllPosts()
  const currentTags = new Set(currentPost.frontmatter.tags)
  
  // スコアリング: カテゴリ一致(4) > クラスター一致(2) > タグ一致(各1)
  const related = allPosts
    .filter((post) => post.slug !== currentSlug)
    .map((post) => {
      const tagOverlap = post.tags.filter((t) => currentTags.has(t)).length
      const score =
        (post.category === currentPost.frontmatter.category ? 4 : 0) +
        (post.cluster === currentPost.frontmatter.cluster ? 2 : 0) +
        tagOverlap
      return { post, score }
    })
    .sort((a, b) => b.score - a.score || b.post.date.localeCompare(a.post.date))
    .map(({ post }) => post)
  
  return related.slice(0, limit)
}

// タグで記事を取得
export function getPostsByTag(tag: string): PostListItem[] {
  return getAllPosts().filter((post) => post.tags.includes(tag))
}

// 全タグを取得
export function getAllTags(): { tag: string; count: number }[] {
  const posts = getAllPosts()
  const tagCount: Record<string, number> = {}
  
  posts.forEach((post) => {
    post.tags.forEach((tag) => {
      tagCount[tag] = (tagCount[tag] || 0) + 1
    })
  })
  
  return Object.entries(tagCount)
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count)
}

// カテゴリ別記事数を取得
export function getCategoryCounts(): { slug: CategorySlug; name: string; cluster: string; count: number }[] {
  const posts = getAllPosts()
  const counts: Partial<Record<CategorySlug, number>> = {}

  posts.forEach((post) => {
    counts[post.category] = (counts[post.category] || 0) + 1
  })

  return (Object.entries(categories) as [CategorySlug, { name: string; cluster: string }][])
    .map(([slug, { name, cluster }]) => ({
      slug,
      name,
      cluster,
      count: counts[slug] || 0,
    }))
    .filter((c) => c.count > 0)
    .sort((a, b) => b.count - a.count)
}

// 前後記事を取得（日付順）
export function getAdjacentPosts(currentSlug: string): { prev: PostListItem | null; next: PostListItem | null } {
  const allPosts = getAllPosts() // 日付降順
  const index = allPosts.findIndex((post) => post.slug === currentSlug)
  
  if (index === -1) return { prev: null, next: null }
  
  return {
    prev: index < allPosts.length - 1 ? allPosts[index + 1] : null, // 古い記事
    next: index > 0 ? allPosts[index - 1] : null, // 新しい記事
  }
}

// MDXをコンパイルしてReactコンポーネントを返す
export async function compileMDXContent(source: string) {
  const { content } = await compileMDX({
    source,
    components: {
      pre: CopyableCodeBlock,
      img: MdxImage,
    },
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: 'wrap' }],
        ],
      },
    },
  })
  return content
}
