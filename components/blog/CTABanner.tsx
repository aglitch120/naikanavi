import Link from 'next/link'

interface CTAProps {
  title: string
  description: string
  buttonText: string
  url: string
}

interface Props {
  cta: CTAProps
  variant?: 'inline' | 'large'
}

export default function CTABanner({ cta, variant = 'inline' }: Props) {
  if (variant === 'large') {
    return (
      <div className="relative bg-ac rounded-2xl p-6 md:p-8 my-10 overflow-hidden">
        {/* 幾何学装飾 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <svg className="absolute top-0 right-0 w-48 h-48 text-white/[0.04]" viewBox="0 0 200 200">
            {[30, 50, 70].map((r) => (
              <circle key={r} cx="160" cy="40" r={r} fill="none" stroke="currentColor" strokeWidth="1" />
            ))}
          </svg>
          <svg className="absolute bottom-0 left-0 w-32 h-32 text-white/[0.05]" viewBox="0 0 120 120">
            {Array.from({ length: 4 }).map((_, row) =>
              Array.from({ length: 4 }).map((_, col) => (
                <circle key={`${row}-${col}`} cx={15 + col * 30} cy={15 + row * 30} r="2" fill="currentColor" />
              ))
            )}
          </svg>
        </div>

        <div className="relative z-10 text-center">
          <h3 className="text-lg md:text-xl font-bold text-white mb-2">{cta.title}</h3>
          <p className="text-white/60 text-sm mb-5 max-w-md mx-auto">{cta.description}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="https://naikanavi.booth.pm/items/8058590"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 bg-white text-ac px-6 py-2.5 rounded-lg font-medium hover:bg-white/90 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              アプリを購入する（¥9,800）
            </a>
            <Link
              href="/app"
              className="inline-flex items-center justify-center gap-2 bg-transparent text-white border border-white/30 px-6 py-2.5 rounded-lg font-medium hover:bg-white/10 transition-colors"
            >
              ログイン →
            </Link>
          </div>
        </div>
      </div>
    )
  }
  
  // inline variant: 記事冒頭用のコンパクトCTA
  return (
    <div className="bg-acl/50 border border-ac/15 rounded-xl p-4 my-6 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <h4 className="font-semibold text-sm text-ac mb-0.5 truncate">{cta.title}</h4>
        <p className="text-xs text-muted truncate">{cta.description}</p>
      </div>
      <Link
        href={cta.url}
        className="shrink-0 bg-ac text-white text-sm px-4 py-2 rounded-lg hover:bg-ac2 transition-colors font-medium"
      >
        {cta.buttonText}
      </Link>
    </div>
  )
}
