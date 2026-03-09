import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'
import readingTime from 'reading-time'
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
  
  // 同カテゴリ優先、次に同クラスター
  const related = allPosts
    .filter((post) => post.slug !== currentSlug)
    .sort((a, b) => {
      const aScore = 
        (a.category === currentPost.frontmatter.category ? 2 : 0) +
        (a.cluster === currentPost.frontmatter.cluster ? 1 : 0)
      const bScore = 
        (b.category === currentPost.frontmatter.category ? 2 : 0) +
        (b.cluster === currentPost.frontmatter.cluster ? 1 : 0)
      return bScore - aScore
    })
  
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
