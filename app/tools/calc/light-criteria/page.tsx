'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('light-criteria')!

export default function LightCriteriaPage() {
  const [plProt, setPlProt] = useState('3.5')
  const [sProt, setSProt] = useState('3.5')
  const [plLdh, setPlLdh] = useState('3.5')
  const [sLdh, setSLdh] = useState('3.5')
  const [ldhUpper, setLdhUpper] = useState('230')

  const result = useMemo(() => {
    const pp = parseFloat(plProt)
    const sp = parseFloat(sProt)
    const pl = parseFloat(plLdh)
    const sl = parseFloat(sLdh)
    const lu = parseFloat(ldhUpper) || 230

    if (isNaN(pp) || isNaN(sp) || isNaN(pl) || isNaN(sl)) {
      return { ready: false, exudative: false, severity: 'neutral' as const, label: '値を入力してください', criteria: [] }
    }

    const protRatio = pp / sp
    const ldhRatio = pl / sl
    const ldhAbove = pl > lu * (2 / 3)

    const c1 = protRatio > 0.5
    const c2 = ldhRatio > 0.6
    const c3 = ldhAbove

    const exudative = c1 || c2 || c3
    const severity: 'ok' | 'wn' = exudative ? 'wn' : 'ok'
    const label = exudative
      ? '滲出性胸水 — 原因検索が必要（感染症、悪性腫瘍、膠原病等）'
      : '漏出性胸水 — 全身性要因（心不全、肝硬変、ネフローゼ等）'

    return {
      ready: true, exudative, severity, label,
      criteria: [
        { name: '胸水/血清 蛋白比 > 0.5', value: protRatio.toFixed(2), met: c1 },
        { name: '胸水/血清 LDH比 > 0.6', value: ldhRatio.toFixed(2), met: c2 },
        { name: `胸水LDH > 血清LDH上限の2/3 (${(lu * 2 / 3).toFixed(0)})`, value: pl.toFixed(0), met: c3 },
      ],
    }
  }, [plProt, sProt, plLdh, sLdh, ldhUpper])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={
        <ResultCard
          label="Light基準"
          value={!result.ready ? '—' : result.exudative ? '滲出性' : '漏出性'}
          unit=""
          interpretation={result.label}
          severity={result.severity}
        />
      }
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">Light基準とは</h2>
          <p>胸水が滲出性か漏出性かを鑑別するゴールドスタンダードです。以下の3基準のうち1つでも満たせば滲出性と判定します。感度98%・特異度83%。</p>
          <h3 className="font-bold text-tx">3つの基準</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li>胸水蛋白/血清蛋白 &gt; 0.5</li>
            <li>胸水LDH/血清LDH &gt; 0.6</li>
            <li>胸水LDH &gt; 血清LDH正常上限の2/3</li>
          </ul>
          <h3 className="font-bold text-tx">注意</h3>
          <p>利尿剤使用中の心不全患者では偽陽性（漏出性が滲出性と判定される）が起きやすく、血清-胸水アルブミン差（&gt;1.2 g/dLで漏出性）の併用が示されます。</p>
        </section>
      }
      relatedTools={[]}
      references={[{ text: 'Light RW, et al. Ann Intern Med 1972;77:507-513' }]}
    >
      <div className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <NumberInput id="pl-prot" label="胸水 蛋白" unit="g/dL" value={plProt} onChange={setPlProt} step={0.1} />
          <NumberInput id="s-prot" label="血清 蛋白" unit="g/dL" value={sProt} onChange={setSProt} step={0.1} />
          <NumberInput id="pl-ldh" label="胸水 LDH" unit="U/L" value={plLdh} onChange={setPlLdh} step={1} />
          <NumberInput id="s-ldh" label="血清 LDH" unit="U/L" value={sLdh} onChange={setSLdh} step={1} />
        </div>
        <NumberInput id="ldh-upper" label="血清LDH正常上限" unit="U/L" hint="施設基準値（通常230）" value={ldhUpper} onChange={setLdhUpper} step={1} />

        {result.ready && (
          <div className="mt-4 border border-br rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-s1">
                <tr>
                  <th className="text-left px-3 py-2 text-tx font-medium">基準</th>
                  <th className="text-right px-3 py-2 text-tx font-medium">値</th>
                  <th className="text-center px-3 py-2 text-tx font-medium">判定</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-br">
                {result.criteria.map((c, i) => (
                  <tr key={i} className={c.met ? 'bg-wnl' : ''}>
                    <td className="px-3 py-2 text-tx">{c.name}</td>
                    <td className="text-right px-3 py-2 font-mono text-tx">{c.value}</td>
                    <td className="text-center px-3 py-2">{c.met ? '⚠ 該当' : '✓ 非該当'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </CalculatorLayout>
  )
}
