'use client'
import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('sle-criteria')!

const domains = [
  { name: '全身症状', items: [{ id: 'fever', label: '発熱', points: 2 }] },
  { name: '血液', items: [
    { id: 'leukopenia', label: '白血球減少（WBC<4000/μL）', points: 3 },
    { id: 'thrombocytopenia', label: '血小板減少（PLT<100,000/μL）', points: 4 },
    { id: 'hemolysis', label: '自己免疫性溶血', points: 4 },
  ]},
  { name: '神経精神', items: [
    { id: 'delirium', label: 'せん妄', points: 2 },
    { id: 'psychosis', label: '精神病', points: 3 },
    { id: 'seizure', label: 'けいれん', points: 5 },
  ]},
  { name: '皮膚粘膜', items: [
    { id: 'alopecia', label: '非瘢痕性脱毛', points: 2 },
    { id: 'oral_ulcer', label: '口腔潰瘍', points: 2 },
    { id: 'subacute', label: '亜急性皮膚ループス or 円板状ループス', points: 4 },
    { id: 'acute', label: '急性皮膚ループス（蝶形紅斑等）', points: 6 },
  ]},
  { name: '漿膜', items: [
    { id: 'effusion', label: '胸水 or 心嚢液', points: 5 },
    { id: 'pericarditis', label: '急性心膜炎', points: 6 },
  ]},
  { name: '筋骨格', items: [
    { id: 'joint', label: '関節炎（≧2関節の腫脹 or 圧痛+朝のこわばり≧30分）', points: 6 },
  ]},
  { name: '腎', items: [
    { id: 'proteinuria', label: '蛋白尿（>0.5g/24h）', points: 4 },
    { id: 'ln_ii_v', label: 'ループス腎炎 Class II or V', points: 8 },
    { id: 'ln_iii_iv', label: 'ループス腎炎 Class III or IV', points: 10 },
  ]},
  { name: '抗リン脂質抗体', items: [
    { id: 'apl', label: '抗カルジオリピン抗体 or 抗β2GP1抗体 or ループスアンチコアグラント', points: 2 },
  ]},
  { name: '補体', items: [
    { id: 'c3_or_c4', label: 'C3低下 or C4低下', points: 3 },
    { id: 'c3_and_c4', label: 'C3低下 and C4低下', points: 4 },
  ]},
  { name: 'SLE特異的自己抗体', items: [
    { id: 'anti_dsdna', label: '抗dsDNA抗体', points: 6 },
    { id: 'anti_sm', label: '抗Sm抗体', points: 6 },
  ]},
]

const allItems = domains.flatMap(d => d.items)

export default function SLECriteriaPage() {
  const [ana, setAna] = useState(false)
  const [checks, setChecks] = useState<Record<string, boolean>>(
    Object.fromEntries(allItems.map(i => [i.id, false]))
  )

  const result = useMemo(() => {
    if (!ana) return { score: 0, met: false, label: 'ANA陰性 → SLE分類基準の入口基準を満たさない' }
    // Each domain: take max score from checked items
    const domainScores = domains.map(d => {
      const checked = d.items.filter(i => checks[i.id])
      if (checked.length === 0) return 0
      return Math.max(...checked.map(i => i.points))
    })
    const total = domainScores.reduce((s, v) => s + v, 0)
    // 臨床ドメイン(全身症状〜腎): index 0-6。免疫ドメイン: index 7-9
    const hasClinical = domainScores.slice(0, 7).some(s => s > 0)
    const met = total >= 10 && hasClinical
    return {
      score: total,
      met,
      hasClinical,
      label: met
        ? 'EULAR/ACR 2019 SLE分類基準を満たす（臨床項目≧1 + 合計≧10点）'
        : total >= 10 && !hasClinical
          ? `合計${total}点だが臨床項目が0 → 基準を満たさない（臨床項目≧1が必要）`
          : `基準未達（${total}/10点）`,
    }
  }, [ana, checks])

  return (
    <CalculatorLayout
      slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={
        <ResultCard
          label="EULAR/ACR 2019"
          value={ana ? result.score + '点' : 'ANA(-)'}
          interpretation={result.label}
          severity={!ana ? 'neutral' as const : result.met ? 'dn' as const : 'ok' as const}
        />
      }
      explanation={undefined}
      relatedTools={[]}
      references={[
        { text: 'Aringer M et al. 2019 European League Against Rheumatism/American College of Rheumatology Classification Criteria for Systemic Lupus Erythematosus. Arthritis Rheumatol 2019;71:1400-1412' },
        { text: 'Petri M et al. Derivation and validation of the Systemic Lupus International Collaborating Clinics classification criteria for SLE. Arthritis Rheum 2012;64:2677-2686' },
        { text: 'Fanouriakis A et al. 2019 update of the EULAR recommendations for the management of SLE. Ann Rheum Dis 2019;78:736-745' },
      ]}
    >
      <div className="space-y-4">
        <div className="p-3 rounded-lg border-2 border-ac bg-acl">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={ana} onChange={e => setAna(e.target.checked)} className="accent-ac w-5 h-5" />
            <div>
              <span className="text-sm font-bold text-tx">入口基準: ANA陽性（≧1:80）</span>
              <p className="text-xs text-muted mt-0.5">HEp-2間接蛍光抗体法で1回以上陽性</p>
            </div>
          </label>
        </div>
        {ana && domains.map(d => (
          <div key={d.name}>
            <p className="text-xs font-bold text-ac mb-2 uppercase tracking-wide">{d.name}</p>
            <div className="space-y-2">
              {d.items.map(i => (
                <CheckItem
                  key={i.id}
                  id={i.id}
                  label={i.label}
                  points={i.points}
                  checked={checks[i.id]}
                  onChange={v => setChecks(p => ({ ...p, [i.id]: v }))}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </CalculatorLayout>
  )
}
