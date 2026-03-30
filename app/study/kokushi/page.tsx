import { redirect } from 'next/navigation'

// /study/kokushi → /study にリダイレクト
export default function KokushiPage() {
  redirect('/study')
}
