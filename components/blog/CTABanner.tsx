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
      <div className="bg-acl border border-ac/20 rounded-lg p-6 my-8 text-center">
        <h3 className="text-lg font-bold text-ac mb-2">{cta.title}</h3>
        <p className="text-muted text-sm mb-4">{cta.description}</p>
        <Link
          href={cta.url}
          className="inline-block bg-ac text-white px-6 py-2.5 rounded-lg font-medium hover:bg-ac2 transition-colors"
        >
          {cta.buttonText}
        </Link>
      </div>
    )
  }
  
  return (
    <div className="bg-s1 border border-br rounded-lg p-4 my-6 flex items-center justify-between gap-4">
      <div>
        <h4 className="font-semibold text-sm mb-1">{cta.title}</h4>
        <p className="text-xs text-muted">{cta.description}</p>
      </div>
      <Link
        href={cta.url}
        className="shrink-0 bg-ac text-white text-sm px-4 py-2 rounded-lg hover:bg-ac2 transition-colors"
      >
        {cta.buttonText}
      </Link>
    </div>
  )
}
