'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('csf-analysis')!

type Etiology = 'bacterial' | 'viral' | 'tb' | 'fungal' | 'normal' | 'indeterminate'

const ETIOLOGY_INFO: Record<Etiology, { label: string; color: string; desc: string }> = {
  bacterial: { label: '細菌性髄膜炎疑い', color: '#DC2626', desc: '※参考所見のみ。臨床判断が必要です。グラム染色・培養・血液培養を確認。' },
  viral: { label: 'ウイルス性髄膜炎疑い', color: '#2563EB', desc: '多くは自然軽快。PCR検査（HSV, エンテロウイルス等）を検討。' },
  tb: { label: '結核性髄膜炎疑い', color: '#D97706', desc: 'ADA測定、抗酸菌培養、PCR。治療開始の遅れが予後を悪化させる。' },
  fungal: { label: '真菌性髄膜炎疑い', color: '#7C3AED', desc: '墨汁染色、クリプトコッカス抗原、培養を確認。免疫不全の有無を評価。' },
  normal: { label: '正常範囲', color: '#059669', desc: '髄液所見は正常範囲内です。臨床症状との照合が必要です。' },
  indeterminate: { label: '鑑別困難', color: '#6B7280', desc: '典型的パターンに合致しません。臨床経過と合わせて判断してください。' },
}

export default function CSFAnalysisPage() {
  const [wbc, setWbc] = useState('')
  const [neutro, setNeutro] = useState('')
  const [protein, setProtein] = useState('')
  const [glucose, setGlucose] = useState('')
  const [serumGlucose, setSerumGlucose] = useState('')
  const [gram, setGram] = useState('unknown')
  const [appearance, setAppearance] = useState('clear')

  const result = useMemo(() => {
    const w = parseFloat(wbc)
    const n = parseFloat(neutro)
    const p = parseFloat(protein)
    const g = parseFloat(glucose)
    const sg = parseFloat(serumGlucose)

    if (isNaN(w) || isNaN(p) || isNaN(g)) return null

    const glucoseRatio = !isNaN(sg) && sg > 0 ? g / sg : null
    const neutroPercent = !isNaN(n) ? n : null

    let etiology: Etiology = 'indeterminate'

    // 正常
    if (w <= 5 && p <= 45 && g >= 40) {
      etiology = 'normal'
    }
    // 細菌性: 多核球優位、蛋白高、糖低
    else if (w > 100 && (neutroPercent === null || neutroPercent > 50) && p > 100 && (g < 40 || (glucoseRatio !== null && glucoseRatio < 0.4))) {
      etiology = 'bacterial'
    }
    // 結核性: リンパ球優位、蛋白高、糖低
    else if (w > 10 && w <= 500 && (neutroPercent !== null && neutroPercent <= 50) && p > 100 && (g < 45 || (glucoseRatio !== null && glucoseRatio < 0.5))) {
      etiology = 'tb'
    }
    // ウイルス性: リンパ球優位、蛋白軽度上昇(≤100が典型)、糖正常
    else if (w > 5 && w <= 500 && (neutroPercent === null || neutroPercent <= 50) && p <= 100 && g >= 45) {
      etiology = 'viral'
    }
    // 真菌性: リンパ球優位、蛋白高、糖低（結核性と類似）
    else if (w > 5 && (neutroPercent !== null && neutroPercent <= 50) && p > 50 && g < 40) {
      etiology = 'fungal'
    }

    // グラム染色が陽性なら細菌性を優先
    if (gram === 'positive') etiology = 'bacterial'

    const info = ETIOLOGY_INFO[etiology]

    return {
      etiology,
      label: info.label,
      desc: info.desc,
      color: info.color,
      severity: etiology === 'normal' ? 'ok' as const : etiology === 'bacterial' ? 'dn' as const : 'wn' as const,
      glucoseRatio: glucoseRatio ? glucoseRatio.toFixed(2) : null,
      findings: [
        { name: '細胞数', value: `${w} /uL`, normal: w <= 5 },
        ...(neutroPercent !== null ? [{ name: '好中球', value: `${n}%`, normal: n <= 50 }] : []),
        { name: '蛋白', value: `${p} mg/dL`, normal: p <= 45 },
        { name: '糖', value: `${g} mg/dL`, normal: g >= 40 },
        ...(glucoseRatio !== null ? [{ name: '髄液糖/血糖比', value: glucoseRatio.toFixed(2), normal: glucoseRatio >= 0.6 }] : []),
      ],
    }
  }, [wbc, neutro, protein, glucose, serumGlucose, gram])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={
        <ResultCard
          label="髄液分析"
          value={result ? result.label : '—'}
          unit=""
          interpretation={result?.desc || '髄液検査値を入力してください'}
          severity={result?.severity || 'neutral'}
        />
      }
      explanation={<div className="text-sm text-muted"><p>初期結核性髄膜炎は蛋白・糖が正常域に近いことがあり、ウイルス性との鑑別が困難です。臨床的に疑う場合はADA・PCR等の追加検査を考慮してください。</p></div>}
      relatedTools={[]}
      references={[{ text: 'Seehusen DA, et al. Am Fam Physician 2003;68:1103-1108' }]}
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput id="csf-wbc" label="髄液 細胞数" unit="/uL" value={wbc} onChange={setWbc} step={1} hint="例: 500" />
          <NumberInput id="csf-neutro" label="好中球割合（任意）" unit="%" value={neutro} onChange={setNeutro} step={1} hint="例: 80" />
          <NumberInput id="csf-protein" label="髄液 蛋白" unit="mg/dL" value={protein} onChange={setProtein} step={1} hint="例: 200" />
          <NumberInput id="csf-glucose" label="髄液 糖" unit="mg/dL" value={glucose} onChange={setGlucose} step={1} hint="例: 30" />
          <NumberInput id="serum-glucose" label="血糖値（任意）" unit="mg/dL" value={serumGlucose} onChange={setSerumGlucose} step={1} hint="例: 100" />
          <SelectInput id="gram" label="グラム染色" value={gram} onChange={setGram}
            options={[
              { value: 'unknown', label: '未施行/結果待ち' },
              { value: 'positive', label: '菌体あり（陽性）' },
              { value: 'negative', label: '菌体なし（陰性）' },
            ]} />
        </div>

        {result && result.etiology !== 'normal' && (
          <div className="mt-4 rounded-xl border border-br overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-s1">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted">項目</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-muted">値</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-muted">判定</th>
                </tr>
              </thead>
              <tbody>
                {result.findings.map((f, i) => (
                  <tr key={i} className="border-t border-br">
                    <td className="px-3 py-2 text-xs">{f.name}</td>
                    <td className="px-3 py-2 text-xs font-mono">{f.value}</td>
                    <td className="px-3 py-2 text-center text-xs">{f.normal ? '正常' : '異常'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* 鑑別パターン参考表 */}
        <details className="mt-4">
          <summary className="text-xs font-medium cursor-pointer" style={{ color: '#6B6760' }}>髄液所見の典型パターン（参考）</summary>
          <div className="mt-2 rounded-xl border border-br overflow-x-auto">
            <table className="w-full text-[11px]">
              <thead className="bg-s1">
                <tr>
                  <th className="px-2 py-1.5 text-left">病型</th>
                  <th className="px-2 py-1.5">細胞数</th>
                  <th className="px-2 py-1.5">優位</th>
                  <th className="px-2 py-1.5">蛋白</th>
                  <th className="px-2 py-1.5">糖</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['正常', '0-5', '—', '15-45', '>=40'],
                  ['細菌性', '100-10000', '多核球', '100-500', '<40'],
                  ['ウイルス性', '10-500', 'リンパ球', '50-100', '正常'],
                  ['結核性', '50-500', 'リンパ球', '100-500', '<45'],
                  ['真菌性', '10-500', 'リンパ球', '50-500', '<40'],
                ].map((row, i) => (
                  <tr key={i} className="border-t border-br">
                    {row.map((cell, j) => <td key={j} className="px-2 py-1.5 text-center">{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </details>
      </div>
    </CalculatorLayout>
  )
}
