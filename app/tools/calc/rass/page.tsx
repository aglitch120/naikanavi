'use client'

import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('rass')!

const scales = [
  { value: 4, label: '+4 好戦的: 明らかに好戦的、暴力的、スタッフに危険', severity: 'dn' as const },
  { value: 3, label: '+3 非常に興奮: チューブやカテーテルを引っ張る、攻撃的', severity: 'dn' as const },
  { value: 2, label: '+2 興奮: 頻繁な目的のない動き、人工呼吸器に抵抗', severity: 'wn' as const },
  { value: 1, label: '+1 落ち着きのない: 不安そう、動きは攻撃的/活発ではない', severity: 'wn' as const },
  { value: 0, label: '0 覚醒・穏やか', severity: 'ok' as const },
  { value: -1, label: '-1 傾眠: 完全に覚醒していないが、呼びかけに10秒以上開眼・アイコンタクト', severity: 'ok' as const },
  { value: -2, label: '-2 軽い鎮静: 呼びかけに10秒未満の開眼・アイコンタクト', severity: 'ok' as const },
  { value: -3, label: '-3 中等度鎮静: 呼びかけに動きや開眼あるがアイコンタクトなし', severity: 'wn' as const },
  { value: -4, label: '-4 深い鎮静: 呼びかけに無反応、身体刺激で動きや開眼', severity: 'wn' as const },
  { value: -5, label: '-5 覚醒不能: 呼びかけにも身体刺激にも無反応', severity: 'dn' as const },
]

export default function RassPage() {
  const [selected, setSelected] = useState(0)
  const scale = scales.find(s => s.value === selected)!

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={<ResultCard label="RASS" value={selected > 0 ? `+${selected}` : `${selected}`} interpretation={scale.label} severity={scale.severity}
        details={[{ label: '一般的な目標', value: '0〜-2（覚醒・穏やか〜軽い鎮静）' }, { label: 'CAM-ICU評価可能', value: selected >= -3 ? 'はい（RASS ≧ -3）' : 'いいえ（RASS -4/-5は評価不能）' }]} />}
      explanation={<section className="space-y-4 text-sm text-muted">
        <h2 className="text-base font-bold text-tx">RASS（Richmond Agitation-Sedation Scale）とは</h2>
        <p>ICU患者の鎮静深度を-5（覚醒不能）〜+4（好戦的）の10段階で評価。PADISガイドラインで示される標準スケール。</p>
        <h3 className="font-bold text-tx">評価手順</h3>
        <p>1. 患者を30秒間観察（RASS 0〜+4を判定）。2. 声をかけて開眼/アイコンタクトを確認（RASS -1〜-3）。3. 身体刺激（肩を揺する/胸骨摩擦）で反応を確認（RASS -4/-5）。</p>
        <h3 className="font-bold text-tx">PADIS GL 2018の参考</h3>
        <p>軽い鎮静（RASS 0〜-2）を目標とすることで、人工呼吸器離脱が早く、ICU在室日数が短縮。</p>
      </section>}
      relatedTools={toolDef.relatedSlugs.map(s => { const t = implementedTools.has(s) ? getToolBySlug(s) : null; return t ? { slug: t.slug, name: t.name } : null }).filter(Boolean) as { slug: string; name: string }[]}
      references={[{ text: 'Sessler CN, et al. Am J Respir Crit Care Med 2002;166:1338-1344' }, { text: 'Devlin JW, et al. Crit Care Med 2018;46:e825-e873 (PADIS)' }]}
    >
      <div className="space-y-2">
        {scales.map(s => (
          <label key={s.value} className="flex items-start gap-3 cursor-pointer py-1">
            <input type="radio" name="rass" value={s.value} checked={selected === s.value} onChange={() => setSelected(s.value)} className="mt-0.5 w-4 h-4 text-ac" />
            <span className="text-sm text-tx">{s.label}</span>
          </label>
        ))}
      </div>
    </CalculatorLayout>
  )
}
