import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '特定商取引法に基づく表示',
  description: '内科ナビの特定商取引法に基づく表示。',
  alternates: {
    canonical: 'https://iwor.jp/tokushoho',
  },
}

export default function TokushohoPage() {
  return (
    <article className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-tx mb-2">特定商取引法に基づく表示</h1>
      <p className="text-sm text-muted mb-10">最終更新日: 2026年3月6日</p>

      <div className="bg-s0 border border-br rounded-xl p-6 md:p-8">
        <p className="text-sm text-tx/80 leading-relaxed mb-6">
          内科ナビはBOOTH（株式会社ピクシブ）を通じて販売しており、
          特定商取引法に基づく表示はBOOTHの販売ページに記載しています。
        </p>

        <a
          href="https://naikanavi.booth.pm/items/8058590"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 bg-ac text-white px-5 py-3 rounded-lg hover:bg-ac2 transition-colors font-medium text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
          </svg>
          BOOTHの販売ページで確認する
        </a>

        <div className="mt-8 pt-6 border-t border-br">
          <h2 className="text-base font-bold text-tx mb-3">お問い合わせ先</h2>
          <p className="text-sm text-tx/80 leading-relaxed">
            サービスに関するお問い合わせは下記までご連絡ください。
          </p>
          <p className="text-sm mt-2">
            メール：<a href="mailto:naikanavi.info@gmail.com" className="text-ac underline">naikanavi.info@gmail.com</a>
          </p>
        </div>
      </div>
    </article>
  )
}
