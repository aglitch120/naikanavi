import type { Metadata } from 'next'
import FluidCourse from './FluidCourse'

export const metadata: Metadata = {
  title: '輸液講座 — iwor',
  description: '電解質異常・酸塩基平衡・輸液設計を体系的に学習。8レッスン+確認クイズ。',
}

export default function Page() {
  return <div className="max-w-3xl mx-auto"><FluidCourse /></div>
}
