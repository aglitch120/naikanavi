import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import { remark } from 'remark';
import html from 'remark-html';
import readingTime from 'reading-time';

// 記事のフロントマター型定義
export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  updated?: string;
  author: string;
  category: string;
  cluster: string;
  pillar?: string;
  tags: string[];
  cta_type: 'template' | 'progress' | 'quiz' | 'checklist' | 'general';
  reading_time?: number;
  status: 'draft' | 'published' | 'needs_review';
  seo_checked?: boolean;
}

// 記事型定義
export interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  readingTime: number;
}

// コンテンツディレクトリ
const postsDirectory = path.join(process.cwd(), 'content/blog');

// 全記事のスラッグを取得
export function getAllPostSlugs(): string[] {
  if (!fs.existsSync(postsDirectory)) {
    return [];
  }
  
  const fileNames = fs.readdirSync(postsDirectory);
  return fileNames
    .filter((name) => name.endsWith('.md') || name.endsWith('.mdx'))
    .map((name) => name.replace(/\.mdx?$/, ''));
}

// 単一記事を取得
export async function getPostBySlug(slug: string): Promise<Post | null> {
  const mdPath = path.join(postsDirectory, `${slug}.md`);
  const mdxPath = path.join(postsDirectory, `${slug}.mdx`);
  
  let fullPath = '';
  if (fs.existsSync(mdxPath)) {
    fullPath = mdxPath;
  } else if (fs.existsSync(mdPath)) {
    fullPath = mdPath;
  } else {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, 'utf8');
  const { data, content } = matter(fileContents);

  // reading timeを計算
  const stats = readingTime(content);

  return {
    slug,
    frontmatter: data as PostFrontmatter,
    content,
    readingTime: Math.ceil(stats.minutes),
  };
}

// Markdownをhtmlに変換
export async function markdownToHtml(markdown: string): Promise<string> {
  const result = await remark().use(html).process(markdown);
  return result.toString();
}

// 全記事を取得（公開済みのみ）
export async function getAllPosts(): Promise<Post[]> {
  const slugs = getAllPostSlugs();
  const posts: Post[] = [];

  for (const slug of slugs) {
    const post = await getPostBySlug(slug);
    if (post && post.frontmatter.status === 'published') {
      posts.push(post);
    }
  }

  // 日付で降順ソート
  return posts.sort((a, b) => {
    const dateA = new Date(a.frontmatter.date);
    const dateB = new Date(b.frontmatter.date);
    return dateB.getTime() - dateA.getTime();
  });
}

// カテゴリ別記事を取得
export async function getPostsByCategory(category: string): Promise<Post[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter((post) => post.frontmatter.category === category);
}

// クラスター別記事を取得
export async function getPostsByCluster(cluster: string): Promise<Post[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter((post) => post.frontmatter.cluster === cluster);
}

// ピラー別記事を取得
export async function getPostsByPillar(pillar: string): Promise<Post[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter((post) => post.frontmatter.pillar === pillar);
}

// 関連記事を取得（同じクラスター内、最大4件）
export async function getRelatedPosts(currentSlug: string, cluster: string): Promise<Post[]> {
  const clusterPosts = await getPostsByCluster(cluster);
  return clusterPosts
    .filter((post) => post.slug !== currentSlug)
    .slice(0, 4);
}

// タグ別記事を取得
export async function getPostsByTag(tag: string): Promise<Post[]> {
  const allPosts = await getAllPosts();
  return allPosts.filter((post) => post.frontmatter.tags.includes(tag));
}

// 全タグを取得（重複なし）
export async function getAllTags(): Promise<string[]> {
  const allPosts = await getAllPosts();
  const tagSet = new Set<string>();
  
  allPosts.forEach((post) => {
    post.frontmatter.tags.forEach((tag) => tagSet.add(tag));
  });
  
  return Array.from(tagSet).sort();
}

// 全カテゴリを取得（重複なし）
export async function getAllCategories(): Promise<string[]> {
  const allPosts = await getAllPosts();
  const categorySet = new Set<string>();
  
  allPosts.forEach((post) => {
    categorySet.add(post.frontmatter.category);
  });
  
  return Array.from(categorySet).sort();
}
