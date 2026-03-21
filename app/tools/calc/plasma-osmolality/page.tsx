'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('plasma-osmolality')!

export default function PlasmaOsmolalityPage() {
  const [na, setNa] = useState('140')
  const [glucose, setGlucose] = useState('100')
  const [bun, setBun] = useState('15')

  const result = useMemo(() => {
    const naVal = parseFloat(na)
    const glu = parseFloat(glucose)
    const bunVal = parseFloat(bun)
    if (!naVal || !glu || !bunVal) return null

    // 推算血漿浸透圧 = 2×Na + Glu/18 + BUN/2.8
    const posm = 2 * naVal + glu / 18 + bunVal / 2.8
    // 有効浸透圧（effective osmolality）= 2×Na + Glu/18（BUNは細胞膜自由通過のため除外）
    const effectiveOsm = 2 * naVal + glu / 18

    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (posm > 320) {
      interpretation = '著明高浸透圧 — 高Na血症・高血糖・浸透圧物質を確認。意識障害リスク高'
      severity = 'dn'
    } else if (posm > 295) {
      interpretation = '高浸透圧 — 脱水・高Na・高血糖・マンニトール等を鑑別'
      severity = 'wn'
    } else if (posm < 275) {
      interpretation = '低浸透圧 — 低Na血症の精査（尿浸透圧・尿Naで鑑別）'
      severity = 'wn'
    } else if (posm < 260) {
      interpretation = '著明低浸透圧 — 急性低Na血症の可能性。けいれん・脳浮腫に注意'
      severity = 'dn'
    } else {
      interpretation = '正常範囲（275〜295 mOsm/kg）'
    }

    return {
      posm: posm.toFixed(1),
      effectiveOsm: effectiveOsm.toFixed(1),
      severity,
      interpretation,
    }
  }, [na, glucose, bun])

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
          label="推算血漿浸透圧"
          value={result.posm}
          unit="mOsm/kg"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            { label: '有効浸透圧（effective）', value: `${result.effectiveOsm} mOsm/kg` },
            { label: '正常範囲', value: '275〜295 mOsm/kg' },
          ]}
        />
      )}
      explanation={
        <section className="space-y-4 text-sm text-muted">
          <h2 className="text-base font-bold text-tx">血漿浸透圧（推算）とは</h2>
          <p>血漿中の溶質濃度の指標。Na・血糖・BUNの3項目から推算できます。実測浸透圧との差が浸透圧ギャップです。</p>
          <p className="font-mono bg-bg p-2 rounded text-xs">推算 Posm = 2×Na + Glu/18 + BUN/2.8</p>
          <p className="font-mono bg-bg p-2 rounded text-xs mt-1">有効浸透圧 = 2×Na + Glu/18（BUNは細胞膜自由通過のため除外）</p>
          <h3 className="font-bold text-tx">臨床的意義</h3>
          <p>低Na血症の評価（真の低浸透圧か偽性か）、高浸透圧の鑑別（DKA・HHS・高Na血症）、浸透圧ギャップ（実測値との差→中毒スクリーニング）に使用します。</p>
          <h3 className="font-bold text-tx">有効浸透圧と推算浸透圧の違い</h3>
          <p>BUNは細胞膜を自由に通過するため浸透圧勾配を生じません。水の移動を考える場合は有効浸透圧を用います。</p>
        </section>
      }
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Worthley LIG. Osmolality. In: Handbook of ICU Therapy. 3rd ed. Cambridge University Press; 2005' },
        { text: 'Purssell RA, et al. Derivation of a formula to estimate the contribution of ethanol to the osmolal gap. Ann Emerg Med 2001;38:653-659' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="na" label="血清Na" unit="mEq/L" value={na} onChange={setNa} min={100} max={180} step={0.1} />
        <NumberInput id="glucose" label="血糖" unit="mg/dL" value={glucose} onChange={setGlucose} min={10} max={1500} step={1} />
        <NumberInput id="bun" label="BUN" unit="mg/dL" value={bun} onChange={setBun} min={1} max={200} step={0.1} />
      </div>
    </CalculatorLayout>
  )
}
