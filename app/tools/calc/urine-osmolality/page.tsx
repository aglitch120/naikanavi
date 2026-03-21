'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('urine-osmolality')!

export default function UrineOsmolalityPage() {
  const [sg, setSg] = useState('1.020')

  const result = useMemo(() => {
    const sgVal = parseFloat(sg)
    if (!sgVal || sgVal < 1.000 || sgVal > 1.060) return null

    // 推算尿浸透圧 = (SG - 1.000) × 35,000（Zieliński 近似）
    // 別法: (SG - 1.000) × 40,000（一部文献）
    const uosm35 = (sgVal - 1.000) * 35000
    const uosm40 = (sgVal - 1.000) * 40000

    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (uosm35 < 100) {
      interpretation = '著明希釈尿 — 水中毒・心因性多飲・尿崩症を考慮'
      severity = 'wn'
    } else if (uosm35 < 300) {
      interpretation = '希釈尿 — ADH抑制状態（水分過剰・尿崩症）の可能性'
      severity = 'wn'
    } else if (uosm35 > 800) {
      interpretation = '高度濃縮尿 — 脱水・SIADH・腎濃縮能は保たれている'
      severity = 'wn'
    } else {
      interpretation = '等張〜軽度濃縮尿（正常範囲は300〜900 mOsm/kg で変動）'
    }

    return {
      uosm: Math.round(uosm35),
      uosmRange: `${Math.round(uosm35)}〜${Math.round(uosm40)}`,
      severity,
      interpretation,
    }
  }, [sg])

  return (
    <CalculatorLayout
      slug={toolDef.slug}
      title={toolDef.name}
      titleEn={toolDef.nameEn}
      description={toolDef.description}
      category={categoryLabels[toolDef.category]}
      categoryIcon={categoryIcons[toolDef.category]}
      result={result && (
        <ResultCard
          label="推算尿浸透圧"
          value={result.uosmRange}
          unit="mOsm/kg"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            { label: '×35,000 法', value: `${result.uosm} mOsm/kg` },
            { label: '参考: 随時尿の範囲', value: '50〜1,200 mOsm/kg' },
            { label: '低Na鑑別の閾値', value: '100 mOsm/kg（ADH抑制の目安）' },
          ]}
        />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">尿浸透圧（推算）とは</h2>
          <p>尿比重から尿浸透圧を簡易的に推算する方法です。実測値が得られないときのスクリーニングに有用ですが、尿中に糖・蛋白・造影剤が大量に含まれると乖離します。</p>
          <p className="font-mono bg-bg p-2 rounded text-xs">推算 Uosm ≈ (尿比重 − 1.000) × 35,000</p>
          <p className="text-xs text-muted mt-1">※ 係数は文献により 35,000〜40,000 と幅があるため、範囲で表示しています。</p>
          <h3 className="font-bold text-tx">低Na血症の鑑別での使い方</h3>
          <p>尿浸透圧 &lt; 100 mOsm/kg → ADH抑制（水中毒・心因性多飲）。尿浸透圧 &gt; 100 mOsm/kg → ADH分泌あり（SIADH・副腎不全・甲状腺機能低下症などを鑑別）。</p>
          <h3 className="font-bold text-tx">注意点</h3>
          <p>尿糖(+)・尿蛋白大量・造影剤使用後は尿比重が偽高値となり、推算値が実際より高くなります。正確な評価には実測浸透圧を検討します。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Imran S, et al. Is specific gravity a good estimate of urine osmolality? J Clin Lab Anal 2010;24:426-430' },
        { text: 'Zieliński H, et al. Assessment of urine concentration ability. Pol Arch Med Wewn 2004;112:1393-1400' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="sg" label="尿比重" unit="" value={sg} onChange={setSg} min={1.000} max={1.060} step={0.001} />
      </div>
    </CalculatorLayout>
  )
}
