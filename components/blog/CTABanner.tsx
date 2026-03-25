'use client'

import Link from 'next/link'
import { trackBoothClick } from '@/lib/gtag'
import GlowButton from '@/components/GlowButton'

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

function ServiceIllustration() {
  return (
    <svg viewBox="0 0 220 180" fill="none" className="w-36 h-28 md:w-48 md:h-36 flex-shrink-0">
      {/* 背景グロー */}
      <circle cx="110" cy="90" r="80" fill="white" opacity="0.06"/>
      
      {/* ノートPC */}
      <rect x="30" y="40" width="100" height="68" rx="6" fill="white" opacity="0.92"/>
      <rect x="35" y="45" width="90" height="52" rx="3" fill="#E8F0EC"/>
      {/* 画面: ダッシュボード風 */}
      {/* グラフ */}
      <rect x="40" y="50" width="38" height="24" rx="2" fill="white" opacity="0.8"/>
      <polyline points="44,70 50,64 56,66 62,58 68,60 74,54" stroke="#1B4F3A" strokeWidth="1.5" fill="none" strokeLinecap="round"/>
      <text x="42" y="57" fill="#1B4F3A" fontSize="5" fontWeight="600">進捗</text>
      {/* 症例数カウンター */}
      <rect x="82" y="50" width="38" height="24" rx="2" fill="white" opacity="0.8"/>
      <text x="101" y="62" textAnchor="middle" fill="#1B4F3A" fontSize="10" fontWeight="700">87</text>
      <text x="101" y="70" textAnchor="middle" fill="#6B6760" fontSize="4">/120 症例</text>
      {/* テキスト行（病歴要約風） */}
      <rect x="40" y="78" width="50" height="3" rx="1" fill="#1B4F3A" opacity="0.25"/>
      <rect x="40" y="83" width="76" height="3" rx="1" fill="#1B4F3A" opacity="0.15"/>
      <rect x="40" y="88" width="60" height="3" rx="1" fill="#1B4F3A" opacity="0.15"/>
      {/* AIバッジ */}
      <rect x="100" y="78" width="18" height="10" rx="5" fill="#86EFAC"/>
      <text x="109" y="85" textAnchor="middle" fill="#1B4F3A" fontSize="5.5" fontWeight="700">AI</text>
      {/* キーボード */}
      <path d="M25 108 L135 108 L130 114 L30 114 Z" fill="white" opacity="0.5"/>
      
      {/* スマホ */}
      <rect x="148" y="52" width="42" height="72" rx="6" fill="white" opacity="0.92"/>
      <rect x="152" y="58" width="34" height="54" rx="2" fill="#E8F0EC"/>
      {/* スマホ画面: チェックリスト */}
      <rect x="156" y="62" width="8" height="8" rx="2" fill="#86EFAC" opacity="0.6"/>
      <path d="M158 66 L160 68 L163 64" stroke="#1B4F3A" strokeWidth="1" strokeLinecap="round"/>
      <rect x="167" y="63" width="15" height="2.5" rx="1" fill="#1B4F3A" opacity="0.3"/>
      <rect x="167" y="67" width="11" height="2" rx="1" fill="#1B4F3A" opacity="0.15"/>
      
      <rect x="156" y="76" width="8" height="8" rx="2" fill="#86EFAC" opacity="0.6"/>
      <path d="M158 80 L160 82 L163 78" stroke="#1B4F3A" strokeWidth="1" strokeLinecap="round"/>
      <rect x="167" y="77" width="14" height="2.5" rx="1" fill="#1B4F3A" opacity="0.3"/>
      <rect x="167" y="81" width="10" height="2" rx="1" fill="#1B4F3A" opacity="0.15"/>
      
      <rect x="156" y="90" width="8" height="8" rx="2" fill="white" opacity="0.5" stroke="#C8C4BC" strokeWidth="0.5"/>
      <rect x="167" y="91" width="13" height="2.5" rx="1" fill="#1B4F3A" opacity="0.2"/>
      <rect x="167" y="95" width="9" height="2" rx="1" fill="#1B4F3A" opacity="0.1"/>
      
      {/* 接続線（PC↔スマホ） */}
      <path d="M130 80 Q140 80 148 76" stroke="#86EFAC" strokeWidth="1" strokeDasharray="3,2" opacity="0.5"/>
      
      {/* キラキラ */}
      <path d="M20 30 L22 25 L24 30 L29 32 L24 34 L22 39 L20 34 L15 32 Z" fill="white" opacity="0.35"/>
      <path d="M195 40 L196 37 L197 40 L200 41 L197 42 L196 45 L195 42 L192 41 Z" fill="#86EFAC" opacity="0.4"/>
      <path d="M145 30 L146 28 L147 30 L149 31 L147 32 L146 34 L145 32 L143 31 Z" fill="white" opacity="0.3"/>
      
      {/* 時短アイコン */}
      <circle cx="180" cy="140" r="12" fill="#86EFAC" opacity="0.15"/>
      <circle cx="180" cy="140" r="8" fill="none" stroke="#86EFAC" strokeWidth="1.2"/>
      <path d="M180 135 L180 140 L184 142" stroke="#86EFAC" strokeWidth="1.2" strokeLinecap="round"/>
      <text x="180" y="158" textAnchor="middle" fill="white" opacity="0.4" fontSize="5">3h→30min</text>
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
      <>
        <style>{`
          @keyframes ctaFloat {
            from { opacity: 0; transform: translateY(12px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @keyframes ctaBob {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-6px); }
          }
          .cta-float { animation: ctaFloat 0.6s ease-out both; }
          .cta-float:hover { animation: ctaBob 2.4s ease-in-out infinite; }
          .cta-float-inline { animation: ctaFloat 0.4s ease-out both; }
          .cta-float-inline:hover { animation: ctaBob 2s ease-in-out infinite; }
        `}</style>
        <div className="cta-float relative rounded-2xl p-6 md:p-8 lg:p-10 my-10 overflow-hidden" style={{ background: '#1A1917' }}>
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
          <ServiceIllustration />
          
          <div className="flex-1 text-center md:text-left">
            <span className="inline-block bg-white/15 text-white text-xs font-semibold px-3 py-1 rounded-full mb-3">
              iwor — J-OSLER × 内科専門医試験 対策アプリ
            </span>
            
            <h3 className="text-xl md:text-2xl font-bold text-white mb-3 leading-snug">
              J-OSLER作業を10分の1に。<br className="hidden md:inline"/>試験対策もこれ一つ。
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 mb-5 text-white/80 text-sm">
              <span className="flex items-center gap-1.5 justify-center md:justify-start">
                <svg className="w-4 h-4 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                病歴要約AI下書き（30秒）
              </span>
              <span className="flex items-center gap-1.5 justify-center md:justify-start">
                <svg className="w-4 h-4 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                症例登録テンプレ＋検査値変換
              </span>
              <span className="flex items-center gap-1.5 justify-center md:justify-start">
                <svg className="w-4 h-4 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                ダッシュボードで進捗一目瞭然
              </span>
              <span className="flex items-center gap-1.5 justify-center md:justify-start">
                <svg className="w-4 h-4 text-green-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg>
                内科専門医試験クイズ機能
              </span>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start items-center md:items-start">
              <GlowButton radius={12} intensity="strong">
                <a
                  href="/pro"
                  onClick={() => trackBoothClick('cta_banner')}
                  className="inline-flex items-center justify-center gap-2 bg-ac text-white px-6 py-3 rounded-xl font-bold text-base hover:bg-ac2 transition-colors shadow-lg shadow-black/10"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  無料で試してみる
                </a>
              </GlowButton>
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
      </>
    )
  }
  
  return (
    <a
      href={cta.url}
      target={cta.url.startsWith('http') ? '_blank' : undefined}
      rel={cta.url.startsWith('http') ? 'noopener noreferrer' : undefined}
      className="cta-float-inline group block bg-gradient-to-r from-ac/[0.06] to-acl/80 border border-ac/20 rounded-xl p-3 sm:p-4 my-6 hover:border-ac/40 hover:shadow-sm transition-all no-underline"
    >
      <div className="flex items-center gap-2 sm:gap-3">
        <SparkIcon />
        <div className="min-w-0 flex-1">
          <span className="font-bold text-sm text-ac block">{cta.title}</span>
          <span className="text-xs text-muted hidden sm:block mt-0.5">{cta.description}</span>
        </div>
        <span className="shrink-0 bg-ac text-white text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-lg group-hover:bg-ac2 transition-colors font-medium whitespace-nowrap">
          {cta.buttonText}
        </span>
      </div>
    </a>
  )
}
