'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('la-classification')!

const grades = [
  { value: 'N', label: 'Grade N: 正常（粘膜障害なし）', severity: 'ok' as const, detail: '逆流性食道炎なし' },
  { value: 'M', label: 'Grade M: 微小変化（発赤のみ、びらんなし）', severity: 'ok' as const, detail: '非びらん性逆流症（NERD）の可能性' },
  { value: 'A', label: 'Grade A: 粘膜障害が5mm以下で粘膜ヒダに限局', severity: 'wn' as const, detail: '軽症（治療は専門医と相談の上で判断）' },
  { value: 'B', label: 'Grade B: 粘膜障害が5mm超だが粘膜ヒダ間に連続しない', severity: 'wn' as const, detail: '中等症（治療は専門医と相談の上で判断）' },
  { value: 'C', label: 'Grade C: 粘膜障害が粘膜ヒダ間に連続するが全周の75%未満', severity: 'dn' as const, detail: '重症（治療は専門医と相談の上で判断）' },
  { value: 'D', label: 'Grade D: 粘膜障害が全周の75%以上', severity: 'dn' as const, detail: '最重症（治療は専門医と相談の上で判断）' },
]

export default function LAClassificationPage() {
  const [selected, setSelected] = useState<string | null>(null)
  const result = useMemo(() => {
    if (!selected) return null
    const g = grades.find(g => g.value === selected)!
    return { label: `改訂LA分類 ${g.value}`, severity: g.severity, detail: g.detail }
  }, [selected])

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={result && <ResultCard label="逆流性食道炎 改訂LA分類" value={result.label} severity={result.severity}
        interpretation={result.detail}
        details={[
          { label: 'Grade N/M', value: '非びらん性' },
          { label: 'Grade A/B', value: '軽症〜中等症' },
          { label: 'Grade C/D', value: '重症（長期PPI・外科考慮）' },
        ]} />}
      references={[
        { text: 'Lundell LR, et al. Endoscopic assessment of oesophagitis: clinical and functional correlates and further validation of the Los Angeles classification. Gut 1999;45:172-180' },
      ]}
    >
      <div className="space-y-2">
        {grades.map(g => (
          <button key={g.value} onClick={() => setSelected(g.value)}
            className={`w-full text-left p-3 rounded-lg border text-sm transition-all ${
              selected === g.value ? 'bg-acl border-ac/30 text-ac font-medium' : 'border-br text-fg hover:border-ac/20'
            }`}>
            {g.label}
          </button>
        ))}
      </div>
    </CalculatorLayout>
  )
}
