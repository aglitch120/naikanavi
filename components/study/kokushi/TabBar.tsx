'use client'

export default function TabBar({
  items,
  active,
  onChange,
}: {
  items: [string, string][]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <div className="flex gap-0 mb-6 border-b-2 border-br">
      {items.map(([k, l]) => (
        <button
          key={k}
          onClick={() => onChange(k)}
          className={`px-5 py-2.5 border-none bg-transparent text-[13px] cursor-pointer -mb-[2px] transition-colors ${
            active === k
              ? 'font-semibold text-ac border-b-2 border-ac'
              : 'font-medium text-muted border-b-2 border-transparent'
          }`}
        >
          {l}
        </button>
      ))}
    </div>
  )
}
