import type { Metadata } from 'next'
import JoslerApp from './JoslerApp'

export const metadata: Metadata = {
  title: 'J-OSLER管理 — iwor',
  description: '内科専門医J-OSLERの症例登録・進捗管理・病歴要約。120症例・56疾患群・29病歴要約の達成状況を一目で把握。17領域・70疾患群の症例カウント、特殊ルールチェック、不足チェック。',
  openGraph: {
    title: 'J-OSLER管理 — iwor',
    description: '内科専門医J-OSLERの症例登録・進捗管理・病歴要約。120症例・56疾患群・29病歴要約の達成状況を一目で把握。',
    url: 'https://iwor.jp/josler',
  },
}

export default function JoslerPage() {
  return <JoslerApp />
}
