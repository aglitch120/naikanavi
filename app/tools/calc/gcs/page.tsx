'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('gcs')!

const eyeOptions = [
  { value: '4', label: 'E4: 自発的に開眼' },
  { value: '3', label: 'E3: 呼びかけで開眼' },
  { value: '2', label: 'E2: 痛み刺激で開眼' },
  { value: '1', label: 'E1: 開眼しない' },
]
const verbalOptions = [
  { value: '5', label: 'V5: 見当識あり' },
  { value: '4', label: 'V4: 混乱した会話' },
  { value: '3', label: 'V3: 不適切な言葉' },
  { value: '2', label: 'V2: 理解不能な音声' },
  { value: '1', label: 'V1: 発語なし' },
]
const motorOptions = [
  { value: '6', label: 'M6: 命令に従う' },
  { value: '5', label: 'M5: 疼痛部位へ手を持っていく' },
  { value: '4', label: 'M4: 逃避反応（引っ込める）' },
  { value: '3', label: 'M3: 異常屈曲（除皮質肢位）' },
  { value: '2', label: 'M2: 伸展反応（除脳肢位）' },
  { value: '1', label: 'M1: 全く動かない' },
]

function getSeverity(score: number): 'ok' | 'wn' | 'dn' {
  if (score >= 13) return 'ok'
  if (score >= 9) return 'wn'
  return 'dn'
}

function getLabel(score: number): string {
  if (score >= 13) return '軽症'
  if (score >= 9) return '中等症'
  if (score >= 4) return '重症 — 挿管を考慮'
  return '最重症（GCS 3）'
}

export default function GcsPage() {
  const [eye, setEye] = useState('4')
  const [verbal, setVerbal] = useState('5')
  const [motor, setMotor] = useState('6')

  const result = useMemo(() => {
    const e = parseInt(eye)
    const v = parseInt(verbal)
    const m = parseInt(motor)
    const total = e + v + m
    return { total, e, v, m, label: getLabel(total), severity: getSeverity(total) }
  }, [eye, verbal, motor])

  return (
    <CalculatorLayout
      slug={toolDef.slug}
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={
        <ResultCard
          label="GCS"
          value={result.total}
          unit="/ 15点"
          interpretation={result.label}
          severity={result.severity}
          details={[
            { label: '内訳', value: `E${result.e} + V${result.v} + M${result.m}` },
          ]}
        />
      }
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">GCS（Glasgow Coma Scale）とは</h2>
          <p>GCSは意識レベルを定量的に評価するスケールで、開眼（E）・言語（V）・運動（M）の3要素から構成されます。合計3〜15点。</p>
          <h3 className="font-bold text-tx">重症度分類</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>13〜15: 軽症</li>
            <li>9〜12: 中等症</li>
            <li>3〜8: 重症（気管挿管の目安: GCS ≤ 8）</li>
          </ul>
          <h3 className="font-bold text-tx">臨床的注意点</h3>
          <p>GCSは合計点だけでなく、各要素の内訳（例: E2V3M5 = 10）を記録することが示されます。特に運動反応（M）が予後予測に最も重要です。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => {
          const t = implementedTools.has(s) ? getToolBySlug(s) : null
          return t ? { slug: t.slug, name: t.name } : null
        })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Teasdale G, Jennett B. Lancet 1974;2:81-84' },
      ]}
    >
      <div className="space-y-4">
        <SelectInput id="eye" label="E: 開眼（Eye opening）" value={eye} onChange={setEye} options={eyeOptions} />
        <SelectInput id="verbal" label="V: 言語（Verbal response）" value={verbal} onChange={setVerbal} options={verbalOptions} />
        <SelectInput id="motor" label="M: 運動（Motor response）" value={motor} onChange={setMotor} options={motorOptions} />
      </div>
    </CalculatorLayout>
  )
}
