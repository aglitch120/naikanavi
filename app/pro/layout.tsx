import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'iwor PRO — 臨床ツールの深い解釈とキャリアデータを、あなたに',
  description: '79+の臨床計算ツール、ER対応、ACLS、検査読影の解釈とアクションプラン。病棟stat tracker、論文フィード、J-OSLER管理。月額約817円で全機能アクセス。',
  openGraph: {
    title: 'iwor PRO — 医師の臨床とキャリアを支えるプロツール',
    description: '臨床ツールの解釈・アクションプラン・お気に入り・病棟stat tracker・論文フィードが使い放題。¥9,800/年〜',
    url: 'https://iwor.jp/pro',
  },
  alternates: {
    canonical: 'https://iwor.jp/pro',
  },
}

export default function ProLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'Product',
            name: 'iwor PRO',
            description: '医師の臨床とキャリアを支えるプロツール。臨床計算ツールの解釈、アクションプラン、病棟stat tracker、論文フィード。',
            url: 'https://iwor.jp/pro',
            brand: { '@type': 'Brand', name: 'iwor' },
            offers: [
              {
                '@type': 'Offer',
                name: '1年パス',
                price: '9800',
                priceCurrency: 'JPY',
                availability: 'https://schema.org/InStock',
              },
              {
                '@type': 'Offer',
                name: '2年パス',
                price: '15800',
                priceCurrency: 'JPY',
                availability: 'https://schema.org/InStock',
              },
              {
                '@type': 'Offer',
                name: '3年パス',
                price: '19800',
                priceCurrency: 'JPY',
                availability: 'https://schema.org/InStock',
              },
            ],
          }),
        }}
      />
      {children}
    </>
  )
}
