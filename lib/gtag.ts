declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
  }
}

// GA4カスタムイベント送信
export const trackEvent = (
  eventName: string,
  params?: Record<string, string | number | boolean>
) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params)
  }
}

// BOOTHクリック計測
export const trackBoothClick = (location: string) => {
  trackEvent('booth_click', { location })
}

// CTAクリック計測
export const trackCtaClick = (label: string) => {
  trackEvent('cta_click', { label })
}
