import { redirect } from 'next/navigation'

// γ計算はICU管理ツールに統合されました
export default function DopamineDosePage() {
  redirect('/tools/icu/gamma')
}
