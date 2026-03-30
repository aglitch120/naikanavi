'use client'

export default function ProgressRing({
  value,
  size = 80,
  stroke = 5,
  color = '#1B4F3A',
}: {
  value: number
  size?: number
  stroke?: number
  color?: string
}) {
  const r = (size - stroke) / 2
  const ci = 2 * Math.PI * r
  const off = ci - (value / 100) * ci
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#E8E5DF" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke}
        strokeDasharray={ci} strokeDashoffset={off} strokeLinecap="round"
        className="transition-all duration-700 ease-out"
      />
    </svg>
  )
}
