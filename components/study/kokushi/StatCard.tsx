'use client'

export default function StatCard({
  label, value, sub, trend, icon,
}: {
  label: string
  value: string
  sub?: string
  trend?: number
  icon?: string
}) {
  return (
    <div className="bg-s0 border border-br rounded-xl px-5 py-[18px] flex-1 min-w-[130px]">
      <div className="text-[11px] text-muted font-medium tracking-wider uppercase mb-2.5">
        {icon && <span className="mr-1.5">{icon}</span>}{label}
      </div>
      <div className="text-[28px] font-bold text-tx leading-none font-mono tracking-tight">{value}</div>
      {sub && <div className="text-xs text-muted mt-1.5">{sub}</div>}
      {trend != null && (
        <div className={`text-[11px] font-medium mt-1 ${trend > 0 ? 'text-ok' : 'text-dn'}`}>
          {trend > 0 ? '↑' : '↓'}{Math.abs(trend)}%
        </div>
      )}
    </div>
  )
}
