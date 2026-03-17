import type { Metadata } from 'next'
import JoslerTeaser from './JoslerTeaser'

export const metadata: Metadata = {
  title: 'J-OSLER管理 — iwor',
  description: '内科専門医J-OSLERの症例登録・進捗管理・病歴要約AI生成。120症例・56疾患群・29病歴要約の達成状況を一目で把握。病棟TODOとの自動連携でダブル入力不要。',
  openGraph: {
    title: 'J-OSLER管理 — iwor',
    description: '内科専門医J-OSLERの症例登録・進捗管理・病歴要約AI生成。120症例・56疾患群・29病歴要約の達成状況を一目で把握。',
    url: 'https://iwor.jp/josler',
  },
}

export default function JoslerPage() {
  return <JoslerTeaser />
}
