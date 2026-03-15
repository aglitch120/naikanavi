'use client'

interface ResultCardProps {
  value: string | number
  label: string
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
  return (
    <div className={`border rounded-xl p-4 sm:p-5 overflow-hidden ${severityStyles[severity]}`}>
      <p className="text-sm font-medium mb-1">{label}</p>
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
    </div>
  )
}
