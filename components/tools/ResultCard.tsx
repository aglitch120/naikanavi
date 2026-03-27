'use client'

interface ResultCardProps {
  value: string | number
  label?: string
  unit?: string
  interpretation?: string
  severity?: 'ok' | 'wn' | 'dn' | 'neutral'
  details?: { label: string; value: string }[]
}

const severityStyles = {
  ok: 'bg-okl border-okb text-ok',
  wn: 'bg-wnl border-wnb text-wn',
  dn: 'bg-dnl border-dnb text-dn',
  neutral: 'bg-s1 border-br text-tx',
}

export default function ResultCard({
  value,
  label,
  unit,
  interpretation,
  severity = 'neutral',
  details,
}: ResultCardProps) {
  // NaN/Infinity防御: 計算エラーの場合は結果を表示しない
  const isInvalid = typeof value === 'number' && (!isFinite(value) || isNaN(value))
  if (isInvalid) {
    return (
      <div className="border rounded-xl p-4 sm:p-5 bg-dnl border-dnb text-dn">
        <p className="text-sm font-medium mb-1">{label}</p>
        <p className="text-lg font-bold">計算エラー</p>
        <p className="text-xs mt-1">入力値をご確認ください。</p>
      </div>
    )
  }

  return (
    <div className={`border rounded-xl p-4 sm:p-5 overflow-hidden ${severityStyles[severity]}`}>
      {label && <p className="text-sm font-medium mb-1">{label}</p>}
      <div className="flex flex-wrap items-baseline gap-x-1.5">
        <span className="text-3xl font-bold tabular-nums">{value}</span>
        {unit && <span className="text-sm font-normal">{unit}</span>}
      </div>
      {interpretation && (
        <p className="text-sm font-medium mt-2 break-words">{interpretation}</p>
      )}
      {details && details.length > 0 && (
        <div className="mt-3 pt-3 border-t border-current/10 space-y-1.5">
          {details.map((d, i) => (
            <div key={i} className="flex flex-col sm:flex-row sm:justify-between text-sm gap-0.5">
              <span>{d.label}</span>
              <span className="font-medium tabular-nums">{d.value}</span>
            </div>
          ))}
        </div>
      )}
      <p className="text-[9px] mt-2 opacity-50">※ 参考値です。臨床判断の代替にはなりません。</p>
    </div>
  )
}
