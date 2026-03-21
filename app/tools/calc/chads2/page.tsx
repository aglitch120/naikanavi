'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('chads2')!

const criteria = [
  { id: 'chf', label: 'C: うっ血性心不全', sublabel: 'Congestive heart failure', points: 1 },
  { id: 'htn', label: 'H: 高血圧', sublabel: 'Hypertension（治療中含む）', points: 1 },
  { id: 'age', label: 'A: 年齢 ≥75歳', sublabel: 'Age ≥75', points: 1 },
  { id: 'dm', label: 'D: 糖尿病', sublabel: 'Diabetes mellitus', points: 1 },
  { id: 'stroke', label: 'S₂: 脳卒中/TIAの既往', sublabel: 'Stroke / TIA history', points: 2 },
]

const strokeRisk: Record<number, string> = {
  0: '1.9%',
  1: '2.8%',
  2: '4.0%',
  3: '5.9%',
  4: '8.5%',
  5: '12.5%',
  6: '18.2%',
}

function getRecommendation(score: number): string {
  if (score === 0) return '低リスク — 抗凝固療法は不要（またはアスピリン考慮）'
  if (score === 1) return '中リスク — 抗凝固療法を考慮'
  return '高リスク — 抗凝固療法を検討'
}

function getSeverity(score: number): 'ok' | 'wn' | 'dn' {
  if (score === 0) return 'ok'
  if (score === 1) return 'wn'
  return 'dn'
}

export default function CHADS2Page() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const result = useMemo(() => {
    const score = criteria.reduce((sum, c) => sum + (checked[c.id] ? c.points : 0), 0)
    return {
      score,
      risk: strokeRisk[score] || '>18%',
      recommendation: getRecommendation(score),
      severity: getSeverity(score),
    }
  }, [checked])

  const relatedTools = toolDef.relatedSlugs
    .map(slug => getToolBySlug(slug))
    .filter((t): t is NonNullable<typeof t> => t !== undefined && implementedTools.has(t.slug))
    .map(t => ({ slug: t.slug, name: t.name }))

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MedicalWebPage',
            name: 'CHADS₂ スコア計算',
            description: toolDef.description,
            url: 'https://iwor.jp/tools/chads2',
            audience: { '@type': 'MedicalAudience', audienceType: 'Clinician' },
            lastReviewed: '2026-03-15',
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'ホーム', item: 'https://iwor.jp' },
              { '@type': 'ListItem', position: 2, name: '臨床計算ツール', item: 'https://iwor.jp/tools' },
              { '@type': 'ListItem', position: 3, name: 'CHADS₂', item: 'https://iwor.jp/tools/chads2' },
            ],
          }),
        }}
      />

      <CalculatorLayout
        slug={toolDef.slug}
      title={toolDef.name}
        titleEn={toolDef.nameEn}
        description={toolDef.description}
        category={categoryLabels[toolDef.category]}
        categoryIcon={categoryIcons[toolDef.category]}
        relatedTools={relatedTools}
        references={[
          { text: 'Gage BF, et al. Validation of clinical classification schemes for predicting stroke: results from the National Registry of Atrial Fibrillation. JAMA. 2001;285(22):2864-2870. PMID: 11401607', url: 'https://pubmed.ncbi.nlm.nih.gov/11401607/' },
          { text: '2024 JCS/JHRS Guideline on Pharmacotherapy of Cardiac Arrhythmias. Circ J. 2024. 日本循環器学会/日本不整脈心電学会.' },
        ]}
        result={
          <ResultCard
            label="CHADS₂ スコア"
            value={result.score}
            unit="/ 6点"
            interpretation={result.recommendation}
            severity={result.severity}
            details={[
              { label: '年間脳卒中リスク', value: result.risk },
            ]}
          />
        }
        explanation={
          <div className="space-y-6 text-sm text-tx leading-relaxed">
            <div>
              <h2 className="text-lg font-bold mb-2">CHADS₂スコアとは</h2>
              <p className="text-muted">
                CHADS₂スコアは、非弁膜症性心房細動（NVAF）患者における脳卒中リスクを簡易評価する5項目のスコアです。
                2001年にGageらがJAMAで発表し、広く普及しました。
                現在はより精密なCHA₂DS₂-VAScスコアが国際標準ですが、日本の不整脈ガイドラインではCHADS₂も引き続き参照されています。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">スコア別年間脳卒中リスク</h3>
              <div className="bg-s1 rounded-lg p-4">
                <div className="grid grid-cols-7 gap-1 text-center text-xs">
                  {[0,1,2,3,4,5,6].map(s => (
                    <div key={s} className={`py-1.5 rounded ${result.score === s ? 'bg-ac text-white font-bold' : 'text-muted'}`}>
                      <div>{s}点</div>
                      <div className="mt-0.5">{strokeRisk[s]}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">CHA₂DS₂-VAScとの使い分け</h3>
              <p className="text-muted">
                CHADS₂は簡便ですが、0-1点の低〜中リスク層の識別が粗いという限界があります。
                CHADS₂ 0点でもCHA₂DS₂-VAScで2点以上になる場合は抗凝固療法が示されるため、
                低リスク例ではCHA₂DS₂-VAScでの再評価が重要です。
              </p>
            </div>
          </div>
        }
      >
        <div className="space-y-2">
          {criteria.map(c => (
            <CheckItem
              key={c.id}
              id={`chads2-${c.id}`}
              label={c.label}
              sublabel={c.sublabel}
              points={c.points}
              checked={!!checked[c.id]}
              onChange={v => setChecked(prev => ({ ...prev, [c.id]: v }))}
            />
          ))}
        </div>
      </CalculatorLayout>
    </>
  )
}
