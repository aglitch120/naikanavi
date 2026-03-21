import type { Metadata } from 'next'
import EchoCourse from './EchoCourse'

export const metadata: Metadata = {
  title: '心エコー講座 — iwor',
  description: '心エコーの基本断面・計測・病態評価を体系的に学習。8レッスン+確認クイズ。',
}

export default function Page() {
  return <div className="max-w-3xl mx-auto"><EchoCourse /></div>
}
