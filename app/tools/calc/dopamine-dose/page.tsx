'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('dopamine-dose')!

interface DrugPreset {
  id: string
  name: string
  concentration: number // mg/mL（標準希釈後）
  dilution: string
  unit: string
}

const drugs: DrugPreset[] = [
  { id: 'doa', name: 'ドパミン（DOA）', concentration: 1.6, dilution: 'DOA 200mg/5A + 生食 125mL = 200mg/125mL', unit: 'μg/kg/min' },
  { id: 'dob', name: 'ドブタミン（DOB）', concentration: 1.6, dilution: 'DOB 200mg/1V + 生食 125mL', unit: 'μg/kg/min' },
  { id: 'nad', name: 'ノルアドレナリン（NAd）', concentration: 0.06, dilution: 'NAd 3mg/3A + 生食 50mL = 3mg/50mL', unit: 'μg/kg/min' },
  { id: 'ad', name: 'アドレナリン（Ad）', concentration: 0.06, dilution: 'Ad 3mg/3A + 生食 50mL = 3mg/50mL', unit: 'μg/kg/min' },
  { id: 'vasopressin', name: 'バソプレシン', concentration: 0.4, dilution: 'バソプレシン 20単位 + 生食 50mL', unit: '単位/min' },
]

export default function DopamineDosePage() {
  const [weight, setWeight] = useState('60')
  const [gamma, setGamma] = useState('3')
  const [drugId, setDrugId] = useState('doa')

  const result = useMemo(() => {
    const w = parseFloat(weight) || 60
    const g = parseFloat(gamma) || 3
    const drug = drugs.find(d => d.id === drugId)!

    // γ = dose (μg/kg/min) → mg/h = γ × weight × 60 / 1000
    const mgPerHour = g * w * 60 / 1000
    const mlPerHour = mgPerHour / drug.concentration

    // 逆算: 1γ = 0.06 mg/kg/h
    const oneGamma = 0.06 * w // mg/h at 1γ

    let doseContext = ''
    if (drugId === 'doa') {
      if (g <= 3) doseContext = '腎血管拡張域（1〜3γ）'
      else if (g <= 10) doseContext = 'β1刺激域（3〜10γ）— 心拍出量↑'
      else doseContext = 'α刺激域（>10γ）— 血管収縮'
    } else if (drugId === 'dob') {
      doseContext = 'β1刺激（2.5〜15γ）— 心収縮力↑'
    } else if (drugId === 'nad') {
      doseContext = 'α1主体（0.01〜0.5γ）— 血管収縮'
    } else if (drugId === 'ad') {
      if (g <= 0.1) doseContext = 'β刺激域（〜0.1γ）— 心拍出量↑'
      else doseContext = 'α＋β刺激（>0.1γ）— 血管収縮＋心拍出量↑'
    }

    return {
      mlPerHour: mlPerHour.toFixed(1),
      mgPerHour: mgPerHour.toFixed(2),
      drug,
      doseContext,
    }
  }, [weight, gamma, drugId])

  const drug = drugs.find(d => d.id === drugId)!

  return (
    <CalculatorLayout
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={
        <ResultCard
          label="投与速度"
          value={result.mlPerHour}
          unit="mL/h"
          interpretation={result.doseContext}
          severity="neutral"
          details={[
            { label: '投与量', value: `${result.mgPerHour} mg/h` },
            { label: '希釈', value: result.drug.dilution },
          ]}
        />
      }
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">γ計算とは</h2>
          <p>γ（ガンマ）= μg/kg/min は昇圧剤の投与速度の単位です。「1γ = 0.06 mg/kg/時」と覚えておくと便利です。</p>
          <p className="font-mono bg-bg p-2 rounded text-xs">1γ = 1 μg/kg/min = 0.06 mg/kg/h</p>
          <p className="font-mono bg-bg p-2 rounded text-xs mt-1">例: 60kgで1γ → 0.06×60 = 3.6 mg/h</p>
          <h3 className="font-bold text-tx">ドパミンの用量依存性作用</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>1〜3γ: D1受容体 → 腎・腸間膜血管拡張</li>
            <li>3〜10γ: β1受容体 → 心収縮力↑・心拍出量↑</li>
            <li>&gt;10γ: α1受容体 → 末梢血管収縮</li>
          </ul>
          <h3 className="font-bold text-tx">敗血症性ショック（SSCG 2021）</h3>
          <p>第一選択: ノルアドレナリン（MAP 65以上を目標）。心機能低下合併時: ドブタミン併用。バソプレシン: NAd 0.25〜0.5γで不十分な場合に追加。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Evans L, et al. Surviving Sepsis Campaign 2021. Crit Care Med 2021' },
        { text: '日本集中治療医学会 敗血症診療ガイドライン2024' },
      ]}
    >
      <div className="space-y-4">
        <SelectInput
          id="drug"
          label="薬剤"
          value={drugId}
          onChange={setDrugId}
          options={drugs.map(d => ({ value: d.id, label: d.name }))}
        />
        <NumberInput id="weight" label="体重" unit="kg" value={weight} onChange={setWeight} min={10} max={200} step={1} />
        <NumberInput id="gamma" label={`投与量（${drug.unit}）`} unit="γ" value={gamma} onChange={setGamma} min={0.01} max={50} step={0.1} />
        <p className="text-xs text-muted p-2 bg-bg rounded">{drug.dilution}</p>
      </div>
    </CalculatorLayout>
  )
}
