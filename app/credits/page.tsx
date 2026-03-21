import type { Metadata } from 'next'
import CreditsApp from './CreditsApp'

export const metadata: Metadata = {
  title: '専門医単位管理 — iwor',
  description: '専門医更新に必要な単位の取得状況を管理。基本領域19科+サブスペシャリティ対応。',
}

export default function CreditsPage() {
  return <CreditsApp />
}
