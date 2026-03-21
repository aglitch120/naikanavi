/** 最終確認日の表示コンポーネント */
export default function UpdatedAt({ date = '2026-03' }: { date?: string }) {
  const display = date.replace('-', '年') + '月'
  return <p className="text-xs text-muted/60 mt-1">最終確認: {display}</p>
}
