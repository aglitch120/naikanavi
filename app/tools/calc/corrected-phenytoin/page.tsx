'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('corrected-phenytoin')!

export default function CorrectedPhenytoinPage() {
  const [level, setLevel] = useState('8')
  const [alb, setAlb] = useState('2.5')
  const [renal, setRenal] = useState('normal')

  const result = useMemo(() => {
    const lv = parseFloat(level)
    const albVal = parseFloat(alb)
    if (!lv || !albVal || albVal <= 0) return null

    // Sheiner-Tozer式（アルブミン正常値 4.4 g/dL で正規化）
    const divisor = renal === 'normal'
      ? 0.2 * (albVal / 4.4) + 0.1
      : 0.1 * (albVal / 4.4) + 0.1  // 腎不全時

    const corrected = lv / divisor

    let interpretation = ''
    let severity: 'ok' | 'wn' | 'dn' = 'ok'
    if (corrected > 20) {
      interpretation = '補正濃度が治療域上限超 — 中毒域の可能性'
      severity = 'dn'
    } else if (corrected >= 10) {
      interpretation = '補正濃度は治療域内（10〜20 μg/mL）'
      severity = 'ok'
    } else {
      interpretation = '補正濃度が治療域未満 — 増量を検討'
      severity = 'wn'
    }

    return { corrected: corrected.toFixed(1), severity, interpretation }
  }, [level, alb, renal])

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
          label="補正フェニトイン濃度"
          value={result.corrected}
          unit="μg/mL"
          interpretation={result.interpretation}
          severity={result.severity}
          details={[
            { label: '治療域', value: '10〜20 μg/mL' },
          ]}
        />
      )}
      explanation={undefined}
      relatedTools={toolDef.relatedSlugs
        .map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null })
        .filter(Boolean) as { slug: string; name: string }[]}
      references={[
        { text: 'Sheiner LB, Tozer TN. Clin Pharmacol Ther 1978;23:63-67' },
        { text: 'Winter ME. Basic Clinical Pharmacokinetics, 5th ed.' },
      ]}
    >
      <div className="space-y-4">
        <NumberInput id="level" label="実測フェニトイン濃度" unit="μg/mL" value={level} onChange={setLevel} min={0.1} max={50} step={0.1} />
        <NumberInput id="alb" label="血清アルブミン" unit="g/dL" value={alb} onChange={setAlb} min={0.5} max={6} step={0.1} />
        <RadioGroup label="腎機能" name="renal" value={renal} onChange={setRenal} options={[{ value: 'normal', label: '正常' }, { value: 'impaired', label: '腎不全（CrCl < 15（末期腎不全））' }]} />
      </div>
    </CalculatorLayout>
  )
}
