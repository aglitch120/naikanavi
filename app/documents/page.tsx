import type { Metadata } from 'next'
import DocumentsApp from './DocumentsApp'

export const metadata: Metadata = {
  title: '文書支援 — 紹介状・退院サマリ・カルテテンプレート | iwor',
  description:
    '紹介状、退院サマリ、入院時カルテ、外来カルテ、病棟カルテのテンプレートを生成。患者情報不保持のプロンプト生成システム。',
  alternates: { canonical: 'https://iwor.jp/documents' },
}

export default function DocumentsPage() {
  return (
    <div className="max-w-4xl mx-auto">
      <DocumentsApp />
    </div>
  )
}
