'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('insulin-sliding')!

interface ScaleRow {
  range: string
  min: number
  max: number
  low: string
  standard: string
  high: string
}

const scaleRows: ScaleRow[] = [
  { range: '< 150', min: 0, max: 149, low: '0単位', standard: '0単位', high: '0単位' },
  { range: '150–199', min: 150, max: 199, low: '0単位', standard: '2単位', high: '4単位' },
  { range: '200–249', min: 200, max: 249, low: '2単位', standard: '4単位', high: '6単位' },
  { range: '250–299', min: 250, max: 299, low: '4単位', standard: '6単位', high: '8単位' },
  { range: '300–349', min: 300, max: 349, low: '6単位', standard: '8単位', high: '10単位' },
  { range: '350–399', min: 350, max: 399, low: '8単位', standard: '10単位', high: '12単位' },
  { range: '≥ 400', min: 400, max: 9999, low: '10単位+医師報告', standard: '12単位+医師報告', high: '14単位+医師報告' },
]

function getScaleValue(row: ScaleRow, sensitivity: string): string {
  if (sensitivity === 'low') return row.low
  if (sensitivity === 'high') return row.high
  return row.standard
}

export default function InsulinSlidingPage() {
  const [glucose, setGlucose] = useState('250')
  const [sensitivity, setSensitivity] = useState('standard')

  const result = useMemo(() => {
    const g = parseFloat(glucose) || 0
    const matched = scaleRows.find(r => g >= r.min && g <= r.max)

    if (!matched) {
      return { dose: '—', range: '—', severity: 'neutral' as const, label: '血糖値を入力してください' }
    }

    const dose = getScaleValue(matched, sensitivity)
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    let label = ''

    if (g < 70) {
      severity = 'dn'
      label = '低血糖 — ブドウ糖投与を検討'
    } else if (g < 150) {
      severity = 'ok'
      label = 'インスリン追加不要'
    } else if (g < 300) {
      severity = 'wn'
      label = 'スケールに従い皮下注'
    } else {
      severity = 'dn'
      label = '高血糖 — スケール投与＋医師報告を検討'
    }

    return { dose, range: matched.range, severity, label }
  }, [glucose, sensitivity])

  const sensitivityLabel = sensitivity === 'low' ? '低用量' : sensitivity === 'high' ? '高用量' : '標準'

  return (
    <CalculatorLayout
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={
        <ResultCard
          label={`推奨インスリン量（${sensitivityLabel}）`}
          value={result.dose}
          unit=""
          interpretation={result.label}
          severity={result.severity}
          details={[
            { label: '血糖範囲', value: `${result.range} mg/dL` },
            { label: 'スケール', value: sensitivityLabel },
          ]}
        />
      }
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">インスリンスライディングスケールとは</h2>
          <p>血糖値に応じて速効型インスリン（ノボラピッド・ヒューマログ等）の皮下注射量を決定する簡易プロトコルです。主に入院中の血糖管理、当直帯での対応に使用されます。</p>
          <h3 className="font-bold text-tx">スケール選択の目安</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>低用量: インスリン感受性が高い（痩せ型、高齢者、1型DM、腎機能低下）</li>
            <li>標準: 一般的な2型DM</li>
            <li>高用量: インスリン抵抗性が高い（肥満、ステロイド使用中、高用量インスリン使用中）</li>
          </ul>
          <h3 className="font-bold text-tx">注意点</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>スライディングスケール単独での血糖管理は推奨されない（基礎インスリンとの併用が原則）</li>
            <li>低血糖（&lt; 70 mg/dL）時はブドウ糖10〜20gを経口投与</li>
            <li>持続的な高血糖はベースのインスリン量調整が必要</li>
          </ul>
          <p className="text-xs mt-2">※ 本スケールは一般的な目安です。施設のプロトコルを優先してください。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => {
          const t = implementedTools.has(s) ? getToolBySlug(s) : null
          return t ? { slug: t.slug, name: t.name } : null
        })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Umpierrez GE, et al. J Clin Endocrinol Metab 2012;97:16-38' },
        { text: 'ADA Standards of Medical Care in Diabetes (入院患者管理)' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="glucose" label="血糖値" unit="mg/dL" value={glucose} onChange={setGlucose} step={1} />
        <SelectInput
          id="sensitivity"
          label="スケール感受性"
          value={sensitivity}
          onChange={setSensitivity}
          options={[
            { value: 'low', label: '低用量（高感受性）' },
            { value: 'standard', label: '標準' },
            { value: 'high', label: '高用量（インスリン抵抗性）' },
          ]}
        />

        {/* スケール一覧テーブル */}
        <div className="mt-4 border border-br rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-s1">
              <tr>
                <th className="text-left px-3 py-2 text-tx font-medium">血糖 (mg/dL)</th>
                <th className="text-center px-2 py-2 text-tx font-medium">低用量</th>
                <th className="text-center px-2 py-2 text-tx font-medium">標準</th>
                <th className="text-center px-2 py-2 text-tx font-medium">高用量</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-br">
              {scaleRows.map(row => {
                const g = parseFloat(glucose) || 0
                const isActive = g >= row.min && g <= row.max
                return (
                  <tr key={row.range} className={isActive ? 'bg-acl' : ''}>
                    <td className="px-3 py-2 text-tx font-mono">{row.range}</td>
                    <td className={`text-center px-2 py-2 ${sensitivity === 'low' && isActive ? 'font-bold text-ac' : 'text-muted'}`}>{row.low}</td>
                    <td className={`text-center px-2 py-2 ${sensitivity === 'standard' && isActive ? 'font-bold text-ac' : 'text-muted'}`}>{row.standard}</td>
                    <td className={`text-center px-2 py-2 ${sensitivity === 'high' && isActive ? 'font-bold text-ac' : 'text-muted'}`}>{row.high}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </CalculatorLayout>
  )
}
