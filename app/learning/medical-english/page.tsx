import type { Metadata } from 'next'
import MedicalEnglishApp from './MedicalEnglishApp'

export const metadata: Metadata = {
  title: '医学英語講座 — iwor',
  description: '臨床で使う医学英語をフラッシュカード+4択クイズで学習。問診・身体診察・検査・手技・プレゼン・略語の6カテゴリ300語以上。',
  alternates: { canonical: 'https://iwor.jp/learning/medical-english' },
}

export default function MedicalEnglishPage() {
  return (
    <div className="max-w-3xl mx-auto">
      <MedicalEnglishApp />
    </div>
  )
}
