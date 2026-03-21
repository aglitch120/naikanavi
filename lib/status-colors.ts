// 全ツール共通のステータスカラー
// サイトのクリーム系テーマ (#F5F4F0) で確実に読めるコントラスト

export const statusCard = {
  ok: 'bg-[#E6F4EA] border-[#34A853] border-l-4',
  wn: 'bg-[#FFF8E1] border-[#F9A825] border-l-4',
  dn: 'bg-[#FDECEA] border-[#D93025] border-l-4',
  neutral: 'bg-[#E8F0FE] border-[#4285F4] border-l-4',
} as const

// テキストは常に高コントラスト
export const statusText = {
  ok: 'text-[#1B5E20]',
  wn: 'text-[#E65100]',
  dn: 'text-[#B71C1C]',
  neutral: 'text-[#1565C0]',
} as const

// バッジ
export const statusBadge = {
  ok: 'bg-[#34A853] text-white',
  wn: 'bg-[#F9A825] text-[#4A3800]',
  dn: 'bg-[#D93025] text-white',
  neutral: 'bg-[#4285F4] text-white',
} as const

// 優先度バッジ（アクション用）
export const priorityBadge = {
  high: 'bg-[#D93025] text-white',
  medium: 'bg-[#F9A825] text-[#4A3800]',
  low: 'bg-[#E8E5DF] text-[#6B6760]',
} as const

export type StatusType = keyof typeof statusCard
