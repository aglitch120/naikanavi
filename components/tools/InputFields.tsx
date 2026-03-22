'use client'

// 数値入力
interface NumberInputProps {
  label: string
  unit?: string
  hint?: string
  value: string
  onChange: (value: string) => void
  min?: number
  max?: number
  step?: number
  id?: string
}

export function NumberInput({
  label, unit, hint, value, onChange, min, max, step = 0.1, id,
}: NumberInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-tx mb-1">
        {label}
        {unit && <span className="text-muted font-normal ml-1">({unit})</span>}
      </label>
      {hint && <p className="text-xs text-muted mb-1">{hint}</p>}
      <input
        type="number"
        id={id}
        inputMode="decimal"
        value={value}
        onChange={e => onChange(e.target.value)}
        min={min}
        max={max}
        step={step}
        className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-tx
                   focus:outline-none focus:ring-2 focus:ring-ac/30 focus:border-ac
                   placeholder:text-muted/50 tabular-nums"
        placeholder={hint || '入力'}
      />
    </div>
  )
}

// セレクト
interface SelectInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  id: string
}

export function SelectInput({ label, value, onChange, options, id }: SelectInputProps) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-tx mb-1">{label}</label>
      <select
        id={id}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 bg-bg border border-br rounded-lg text-tx
                   focus:outline-none focus:ring-2 focus:ring-ac/30 focus:border-ac"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  )
}

// ラジオグループ（ボタン風）
interface RadioGroupProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  name?: string
  id?: string
}

export function RadioGroup({ label, value, onChange, options, name, id }: RadioGroupProps) {
  const groupName = name || id || 'radio'
  return (
    <fieldset>
      <legend className="block text-sm font-medium text-tx mb-2">{label}</legend>
      <div className="flex gap-2">
        {options.map(opt => (
          <label
            key={opt.value}
            className={`flex-1 text-center text-sm py-2 px-3 rounded-lg border cursor-pointer transition-colors
              ${value === opt.value
                ? 'bg-ac text-white border-ac'
                : 'bg-bg border-br text-muted hover:border-ac/30'
              }`}
          >
            <input
              type="radio"
              name={groupName}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="sr-only"
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}

// チェックボックス（スコア用）
interface CheckItemProps {
  label: string
  sublabel?: string
  points?: number
  checked: boolean
  onChange: (checked: boolean) => void
  id: string
}

export function CheckItem({ label, sublabel, points, checked, onChange, id }: CheckItemProps) {
  return (
    <label
      htmlFor={id}
      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors
        ${checked ? 'bg-acl border-ac/30' : 'bg-bg border-br hover:border-ac/20'}`}
    >
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 w-4 h-4 rounded border-br text-ac focus:ring-ac/30"
      />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-tx">{label}</span>
        {sublabel && <span className="block text-xs text-muted mt-0.5">{sublabel}</span>}
      </div>
      {points != null && <span className="text-xs font-mono text-muted whitespace-nowrap">+{points}pt</span>}
    </label>
  )
}
