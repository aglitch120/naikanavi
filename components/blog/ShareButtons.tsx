'use client'

interface ShareButtonsProps {
  title: string
  slug: string
}

export default function ShareButtons({ title, slug }: ShareButtonsProps) {
  const url = `https://iwor.jp/blog/${slug}`
  const encodedUrl = encodeURIComponent(url)
  const encodedTitle = encodeURIComponent(title)

  const shareLinks = [
    {
      name: 'X (Twitter)',
      href: `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      ),
      color: 'hover:bg-tx/5',
    },
    {
      name: 'LINE',
      href: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M19.365 9.863c.349 0 .63.285.63.631 0 .345-.281.63-.63.63H17.61v1.125h1.755c.349 0 .63.283.63.63 0 .344-.281.629-.63.629h-2.386c-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63h2.386c.349 0 .63.285.63.63 0 .349-.281.63-.63.63H17.61v1.125h1.755zm-3.855 3.016c0 .27-.174.51-.432.596-.064.021-.133.031-.199.031-.211 0-.391-.09-.51-.25l-2.443-3.317v2.94c0 .344-.279.629-.631.629-.346 0-.626-.285-.626-.629V8.108c0-.27.173-.51.43-.595.06-.023.136-.033.194-.033.195 0 .375.104.495.254l2.462 3.33V8.108c0-.345.282-.63.63-.63.345 0 .63.285.63.63v4.771zm-5.741 0c0 .344-.282.629-.631.629-.345 0-.627-.285-.627-.629V8.108c0-.345.282-.63.627-.63.349 0 .631.285.631.63v4.771zm-2.466.629H4.917c-.345 0-.63-.285-.63-.629V8.108c0-.345.285-.63.63-.63.348 0 .63.285.63.63v4.141h1.756c.348 0 .629.283.629.63 0 .344-.282.629-.629.629M24 10.314C24 4.943 18.615.572 12 .572S0 4.943 0 10.314c0 4.811 4.27 8.842 10.035 9.608.391.082.923.258 1.058.59.12.301.079.766.038 1.08l-.164 1.02c-.045.301-.24 1.186 1.049.645 1.291-.539 6.916-4.078 9.436-6.975C23.176 14.393 24 12.458 24 10.314" />
        </svg>
      ),
      color: 'hover:bg-[#06C755]/10',
    },
    {
      name: 'コピー',
      href: '#',
      icon: (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      ),
      color: 'hover:bg-s1',
      onClick: async (e: React.MouseEvent) => {
        e.preventDefault()
        try {
          await navigator.clipboard.writeText(url)
          const btn = e.currentTarget as HTMLElement
          const originalText = btn.querySelector('span')
          if (originalText) {
            originalText.textContent = 'コピー済み!'
            setTimeout(() => {
              originalText.textContent = 'コピー'
            }, 2000)
          }
        } catch {
          // fallback
        }
      },
    },
  ]

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-xs text-muted font-medium w-full sm:w-auto mb-1 sm:mb-0">共有:</span>
      {shareLinks.map((link) => (
        <a
          key={link.name}
          href={link.href}
          onClick={link.onClick as any}
          target={link.href !== '#' ? '_blank' : undefined}
          rel={link.href !== '#' ? 'noopener noreferrer' : undefined}
          className={`inline-flex items-center gap-1.5 text-sm text-muted ${link.color} px-3 py-2 rounded-lg border border-br transition-colors min-h-[44px]`}
          title={`${link.name}でシェア`}
        >
          {link.icon}
          <span className="text-xs">{link.name}</span>
        </a>
      ))}
    </div>
  )
}
