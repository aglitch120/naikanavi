import { redirect } from 'next/navigation'

// γ計算ページへのリダイレクト
export default function DopamineDosePage() {
  redirect('/tools/calc/gamma')
}
