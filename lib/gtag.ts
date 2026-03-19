declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
  }
}

export const GA_ID = 'G-VTCJT6XFHG'

// GA4カスタムイベント送信
export const trackEvent = (
  eventName: string,
  params?: Record<string, string | number | boolean>
) => {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag('event', eventName, params)
  }
}

// ── コンバージョンイベント ──

// 購入クリック計測
export const trackBoothClick = (location: string) => {
  trackEvent('purchase_click', { location, event_category: 'conversion' })
}

// PRO登録完了
export const trackProRegister = (plan: string) => {
  trackEvent('pro_register', { plan, event_category: 'conversion', value: 1 })
}

// PRO ログイン
export const trackProLogin = () => {
  trackEvent('pro_login', { event_category: 'engagement' })
}

// CTAクリック計測
export const trackCtaClick = (label: string) => {
  trackEvent('cta_click', { label, event_category: 'engagement' })
}

// ── エンゲージメントイベント ──

// ツール閲覧
export const trackToolView = (slug: string, category?: string) => {
  trackEvent('tool_view', { slug, tool_category: category || 'calc', event_category: 'engagement' })
}

// お気に入り追加
export const trackFavoriteAdd = (slug: string) => {
  trackEvent('favorite_add', { slug, event_category: 'engagement' })
}

// タブ切替（PRO系アプリ）
export const trackAppTabChange = (app: string, tab: string) => {
  trackEvent('app_tab_change', { app, tab, event_category: 'engagement' })
}

// ProGate表示（PRO誘導）
export const trackProGateView = (feature: string) => {
  trackEvent('pro_gate_view', { feature, event_category: 'conversion' })
}

// ProModal表示
export const trackProModalView = (feature: string) => {
  trackEvent('pro_modal_view', { feature, event_category: 'conversion' })
}
