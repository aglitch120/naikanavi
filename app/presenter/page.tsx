import type { Metadata } from 'next'
import { Suspense } from 'react'
import PresenterApp from './PresenterApp'

export const metadata: Metadata = {
  title: 'プレゼン資料生成 — iwor',
  description: '学会・カンファ・コンサル用のプレゼン資料テンプレートを生成。対象者・時間・形式を設定するだけで構成案・原稿テンプレートが完成。',
  alternates: { canonical: 'https://iwor.jp/presenter' },
  openGraph: {
    title: 'プレゼン資料生成 — iwor',
    description: '学会・カンファ・コンサル用のプレゼン資料テンプレートを生成。',
    url: 'https://iwor.jp/presenter',
    siteName: 'iwor',
    type: 'website',
  },
}

export default function PresenterPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <Suspense fallback={null}>
        <PresenterApp />
      </Suspense>
    </div>
  )
}
