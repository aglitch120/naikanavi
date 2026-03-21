/**
 * ページレンダリングテスト
 * 主要 'use client' コンポーネントがクラッシュせずにレンダリングできることを検証
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'

// ── Next.js モック ──
vi.mock('next/link', () => ({
  default: ({ children, href, ...props }: any) => <a href={href} {...props}>{children}</a>,
}))
vi.mock('next/image', () => ({
  default: ({ src, alt, ...props }: any) => <img src={src} alt={alt} {...props} />,
}))
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn(), replace: vi.fn() }),
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
}))

// ── lib モック ──
vi.mock('@/lib/mdx', () => ({
  getAllPosts: () => [],
}))
vi.mock('@/lib/gtag', () => ({
  trackBoothClick: vi.fn(),
  trackFavoriteAdd: vi.fn(),
  event: vi.fn(),
  default: vi.fn(),
}))

beforeEach(() => {
  localStorage.clear()
})

describe('StudyApp', () => {
  it('renders without crashing', async () => {
    const { default: StudyApp } = await import('@/app/study/StudyApp')
    const { container } = render(<StudyApp />)
    // Studyアプリが何かしらのDOMを出力する
    expect(container.querySelector('div')).toBeTruthy()
  })
})
