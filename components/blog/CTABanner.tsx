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

function DoctorIllustration() {
  return (
    <svg viewBox="0 0 200 200" fill="none" className="w-32 h-32 md:w-40 md:h-40 flex-shrink-0">
      <circle cx="100" cy="100" r="90" fill="white" opacity="0.08"/>
      <circle cx="100" cy="100" r="70" fill="white" opacity="0.06"/>
      <circle cx="80" cy="60" r="20" fill="#E8F0EC" opacity="0.9"/>
      <circle cx="74" cy="57" r="2" fill="#1B4F3A"/>
      <circle cx="86" cy="57" r="2" fill="#1B4F3A"/>
      <path d="M74 65 Q80 70 86 65" stroke="#1B4F3A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <path d="M68 75 Q60 90 65 100" stroke="#86EFAC" strokeWidth="2" fill="none" strokeLinecap="round"/>
      <circle cx="65" cy="102" r="4" fill="#86EFAC"/>
      <rect x="62" y="78" width="36" height="45" rx="8" fill="white" opacity="0.85"/>
      <circle cx="80" cy="90" r="1.5" fill="#1B4F3A" opacity="0.3"/>
      <circle cx="80" cy="100" r="1.5" fill="#1B4F3A" opacity="0.3"/>
      <circle cx="80" cy="110" r="1.5" fill="#1B4F3A" opacity="0.3"/>
      <rect x="110" y="80" width="55" height="40" rx="4" fill="white" opacity="0.9"/>
      <rect x="114" y="84" width="47" height="28" rx="2" fill="#E8F0EC"/>
      <rect x="118" y="89" width="30" height="3" rx="1" fill="#1B4F3A" opacity="0.4"/>
      <rect x="118" y="95" width="38" height="3" rx="1" fill="#1B4F3A" opacity="0.3"/>
      <rect x="118" y="101" width="25" height="3" rx="1" fill="#1B4F3A" opacity="0.3"/>
      <circle cx="152" cy="89" r="6" fill="#86EFAC" opacity="0.8"/>
      <text x="152" y="92" textAnchor="middle" fill="#1B4F3A" fontSize="8" fontWeight="700">AI</text>
      <rect x="107" y="120" width="61" height="6" rx="2" fill="white" opacity="0.6"/>
      <circle cx="155" cy="55" r="14" fill="#86EFAC" opacity="0.2"/>
      <circle cx="155" cy="55" r="10" fill="none" stroke="#86EFAC" strokeWidth="1.5"/>
      <path d="M155 48 L155 55 L160 58" stroke="#86EFAC" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M170 50 L178 46" stroke="#86EFAC" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M175 52 L178 46 L172 45" stroke="#86EFAC" strokeWidth="1.5" strokeLinecap="round" fill="none"/>
      <path d="M40 40 L42 35 L44 40 L49 42 L44 44 L42 49 L40 44 L35 42 Z" fill="white" opacity="0.4"/>
      <path d="M160 140 L161 137 L162 140 L165 141 L162 142 L161 145 L160 142 L157 141 Z" fill="white" opacity="0.3"/>
      <path d="M130 45 L131 43 L132 45 L134 46 L132 47 L131 49 L130 47 L128 46 Z" fill="#86EFAC" opacity="0.5"/>
    </svg>
  )
}

function SparkIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="w-5 h-5 flex-shrink-0">
      <path d="M11 1L3 12h5l-1 7 8-11h-5l1-7z" fill="#1B4F3A"/>
    </svg>
  )
}

export default function CTABanner({ cta, variant = 'inline' }: Props) {
  if (variant === 'large') {
    return (
      <div className="relative bg-ac rounded-2xl p-6 md:p-10 my-10 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <svg className="absolute top-0 right-0 w-64 h-64 text-white/[0.03]" viewBox="0 0 200 200">
            {[30, 55, 80, 105].map((r) => (
              <circle key={r} cx="170" cy="30" r={r} fill="none" stroke="currentColor" strokeWidth="0.8" />
            ))}
          </svg>
          <svg className="absolute bottom-0 left-0 w-40 h-40 text-white/[0.04]" viewBox="0 0 120 120">
            {Array.from({ length: 5 }).map((_, row) =>
              Array.from({ length: 5 }).map((_, col) => (
                <circle key={`${row}-${col}`} cx={12 + col * 24} cy={12 + row * 24} r="1.5" fill="currentColor" />
              ))
            )}
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-10">
          <DoctorIllustration />
          
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block bg-white/15 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
              内科ナビ — J-OSLER効率化アプリ
            </span>
            
            <h3 className="text-xl md:text-2xl font-bold text-white mb-3 leading-snug">
              病歴要約の下書き、<br className="hidden md:inline"/>AIが30秒で生成します
            </h3>
            
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 mb-5 text-white/80 text-sm">
              <span className="flex items-center gap-1.5 justify-center md:justify-start">
                <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                総合考察を自動構成
              </span>
              <span className="flex items-center gap-1.5 justify-center md:justify-start">
                <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                検査値フォーマット変換
              </span>
              <span className="flex items-center gap-1.5 justify-center md:justify-start">
                <svg className="w-4 h-4 text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                症例登録テンプレ付き
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
              <a
                href="https://naikanavi.booth.pm/items/8058590"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 bg-white text-ac px-6 py-3 rounded-xl font-bold text-base hover:bg-white/90 transition-colors shadow-lg shadow-black/10"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                無料で試してみる
              </a>
              <Link
                href="/blog"
                className="inline-flex items-center justify-center gap-2 bg-transparent text-white border border-white/30 px-6 py-3 rounded-xl font-medium hover:bg-white/10 transition-colors"
              >
                他の記事を読む →
              </Link>
            </div>
            
            <p className="text-white/40 text-xs mt-3">※ 無料トライアルあり。クレジットカード不要。</p>
          </div>
        </div>
      </div>
    )
  }
  
  return (
    <a
      href={cta.url}
      target={cta.url.startsWith('http') ? '_blank' : undefined}
      rel={cta.url.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="group block bg-gradient-to-r from-ac/[0.06] to-acl/80 border border-ac/20 rounded-xl p-4 my-6 hover:border-ac/40 hover:shadow-sm transition-all no-underline"
    >
      <div className="flex items-center gap-3">
        <SparkIcon />
        <div className="min-w-0 flex-1">
          <span className="font-bold text-sm text-ac block mb-0.5">{cta.title}</span>
          <span className="text-xs text-muted block">{cta.description}</span>
        </div>
        <span className="shrink-0 bg-ac text-white text-sm px-4 py-2 rounded-lg group-hover:bg-ac2 transition-colors font-medium">
          {cta.buttonText}
        </span>
      </div>
    </a>
  )
}
