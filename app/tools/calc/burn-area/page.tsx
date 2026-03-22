'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('burn-area')!

const regions = [
  { id: 'head', label: '頭部', adult: 9, child: 18 },
  { id: 'chest', label: '体幹前面（胸腹部）', adult: 18, child: 18 },
  { id: 'back', label: '体幹後面（背部）', adult: 18, child: 18 },
  { id: 'rArm', label: '右上肢', adult: 9, child: 9 },
  { id: 'lArm', label: '左上肢', adult: 9, child: 9 },
  { id: 'rLeg', label: '右下肢', adult: 18, child: 13.5 },
  { id: 'lLeg', label: '左下肢', adult: 18, child: 13.5 },
  { id: 'perineum', label: '会陰部', adult: 1, child: 1 },
]

export default function BurnAreaPage() {
  const [selected, setSelected] = useState<Record<string, boolean>>(
    Object.fromEntries(regions.map(r => [r.id, false]))
  )
  const [isChild, setIsChild] = useState(false)
  const [weight, setWeight] = useState('')

  const result = useMemo(() => {
    const tbsa = regions
      .filter(r => selected[r.id])
      .reduce((sum, r) => sum + (isChild ? r.child : r.adult), 0)
    const w = parseFloat(weight)
    const parkland = w > 0 ? 4 * w * tbsa : null
    const first8h = parkland ? parkland / 2 : null
    return { tbsa, parkland, first8h }
  }, [selected, isChild, weight])

  const severity = result.tbsa >= 30 ? 'dn' as const : result.tbsa >= 15 ? 'wn' as const : 'ok' as const
  const label = result.tbsa >= 30
    ? '重症熱傷（TBSA≧30%）→ 専門施設搬送'
    : result.tbsa >= 15
      ? '中等症熱傷（TBSA 15-29%）→ 大量輸液必要'
      : result.tbsa > 0
        ? '軽症熱傷'
        : '部位を選択してください'

  return (
    <CalculatorLayout
      slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={
        <>
          <ResultCard label="TBSA（9の法則）" value={result.tbsa + '%'} interpretation={label} severity={severity} />
          {result.parkland !== null && (
            <div className="mt-3 p-3 rounded-lg bg-bg border border-br text-sm space-y-1">
              <p className="font-medium text-tx">Parkland公式（初期24h輸液量）</p>
              <p className="text-muted">総量: <span className="font-bold text-tx">{Math.round(result.parkland!)} mL</span>（乳酸リンゲル液）</p>
              <p className="text-muted">最初8h: <span className="font-bold text-wn">{Math.round(result.first8h!)} mL</span>　残り16h: {Math.round(result.first8h!)} mL</p>
              <p className="text-xs text-muted mt-2">※ 尿量0.5-1 mL/kg/h（小児1 mL/kg/h）を目標に調整。受傷時刻から起算。</p>
            </div>
          )}
        </>
      }
      explanation={undefined}
      relatedTools={[]}
      references={[
        { text: 'Wallace AB. The exposure treatment of burns. Lancet 1951;1:501-504' },
        { text: 'Baxter CR, Shires T. Physiological response to crystalloid resuscitation of severe burns. Ann N Y Acad Sci 1968;150:874-894' },
        { text: 'Lund CC, Browder NC. The estimation of areas of burns. Surg Gynecol Obstet 1944;79:352-358' },
        { text: 'American Burn Association. Advanced Burn Life Support Course. 2018' },
        { text: '日本熱傷学会. 熱傷診療ガイドライン 2015' },
      ]}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-bg border border-br">
          <label className="flex items-center gap-2 cursor-pointer text-sm">
            <input type="checkbox" checked={isChild} onChange={e => setIsChild(e.target.checked)} className="accent-ac" />
            <span className="text-tx font-medium">小児（修正値を使用）</span>
          </label>
        </div>
        <NumberInput id="weight" label="体重" unit="kg" value={weight} onChange={setWeight} min={1} max={300} hint="Parkland公式の計算に使用" />
        <p className="text-xs text-muted font-medium">受傷部位を選択（{isChild ? '小児' : '成人'}・9の法則）</p>
        {regions.map(r => (
          <CheckItem
            key={r.id}
            id={r.id}
            label={`${r.label}（${isChild ? r.child : r.adult}%）`}
            checked={selected[r.id]}
            onChange={v => setSelected(p => ({ ...p, [r.id]: v }))}
          />
        ))}
      </div>
    </CalculatorLayout>
  )
}
