'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('curb-65')!

const criteria = [
  { id: 'confusion', label: 'C: 意識障害（Confusion）', sublabel: '新規の見当識障害（AMT: Abbreviated Mental Test ≤8、または時間・場所・人の見当識障害）', points: 1 },
  { id: 'urea', label: 'U: BUN >20 mg/dL（Urea >7 mmol/L）', sublabel: '血中尿素窒素の上昇', points: 1 },
  { id: 'respiratory', label: 'R: 呼吸数 ≥30 回/分（Respiratory rate）', sublabel: '頻呼吸', points: 1 },
  { id: 'bp', label: 'B: 血圧低下（Blood pressure）', sublabel: '収縮期 <90 mmHg または 拡張期 ≤60 mmHg', points: 1 },
  { id: 'age', label: '65: 年齢 ≥65歳', sublabel: '高齢', points: 1 },
]

function getInterpretation(score: number): { text: string; severity: 'ok' | 'wn' | 'dn'; mortality: string; disposition: string } {
  if (score === 0) return {
    text: '低リスク',
    severity: 'ok',
    mortality: '0.6%',
    disposition: 'スコア0点（低リスク）',
  }
  if (score === 1) return {
    text: '低リスク',
    severity: 'ok',
    mortality: '2.7%',
    disposition: 'スコア1点（低リスク）',
  }
  if (score === 2) return {
    text: '中リスク',
    severity: 'wn',
    mortality: '6.8%',
    disposition: 'スコア2点（中リスク）',
  }
  if (score === 3) return {
    text: '高リスク',
    severity: 'dn',
    mortality: '14.0%',
    disposition: 'スコア3点（高リスク）',
  }
  return {
    text: '非常に高リスク',
    severity: 'dn',
    mortality: score === 4 ? '27.8%' : '57.0%',
    disposition: 'スコア4〜5点（非常に高リスク）',
  }
}

export default function CURB65Page() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const result = useMemo(() => {
    const score = criteria.reduce((sum, c) => sum + (checked[c.id] ? c.points : 0), 0)
    return { score, ...getInterpretation(score) }
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
            name: 'CURB-65 スコア計算',
            description: toolDef.description,
            url: 'https://iwor.jp/tools/curb-65',
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
              { '@type': 'ListItem', position: 3, name: 'CURB-65', item: 'https://iwor.jp/tools/curb-65' },
            ],
          }),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'CURB-65とは何ですか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'CURB-65は市中肺炎（CAP）の重症度を5項目（意識障害・BUN・呼吸数・血圧・年齢）で評価し、低リスク・中リスク・高リスクに分類するスコアです。British Thoracic Societyで示されています。',
                },
              },
              {
                '@type': 'Question',
                name: 'CURB-65とA-DROPの違いは？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'CURB-65は英国BTSが開発した国際的なスコアで、A-DROPは日本呼吸器学会が日本人データに基づいて開発したスコアです。両者ともBUNを使用しますが、A-DROPは年齢の性差補正（男性70歳/女性75歳）や酸素化指標（SpO2 ≤90%）を追加している点が異なります。',
                },
              },
              {
                '@type': 'Question',
                name: 'CRB-65とCURB-65の違いは？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'CRB-65はCURB-65からBUN（Urea）を除いた4項目版で、血液検査なしでベッドサイドやプライマリケアで迅速に評価できます。スコアに応じて低・中・高リスクに分類されます。',
                },
              },
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
          { text: 'Lim WS, et al. Defining community acquired pneumonia severity on presentation to hospital: an international derivation and validation study. Thorax. 2003;58(5):377-382. PMID: 12728155', url: 'https://pubmed.ncbi.nlm.nih.gov/12728155/' },
          { text: 'British Thoracic Society Standards of Care Committee. BTS guidelines for the management of community acquired pneumonia in adults. Thorax. 2001;56 Suppl 4:IV1-64. PMID: 11713364', url: 'https://pubmed.ncbi.nlm.nih.gov/11713364/' },
          { text: 'Lim WS, et al. BTS guidelines for the management of community acquired pneumonia in adults: update 2009. Thorax. 2009;64 Suppl 3:iii1-55. PMID: 19783532', url: 'https://pubmed.ncbi.nlm.nih.gov/19783532/' },
          { text: 'Metlay JP, et al. Diagnosis and treatment of adults with community-acquired pneumonia. An official clinical practice guideline of the ATS and IDSA. Am J Respir Crit Care Med. 2019;200(7):e45-e67. PMID: 31573350', url: 'https://pubmed.ncbi.nlm.nih.gov/31573350/' },
        ]}
        result={
          <div className="space-y-3">
            <ResultCard
              label="CURB-65 スコア"
              value={result.score}
              unit="/ 5点"
              interpretation={`${result.text} — 30日死亡率 ${result.mortality}`}
              severity={result.severity}
            />
            <p className="text-[10px] text-muted px-1">30日死亡率: Lim WS, et al. Thorax 2003; PMID: 12728155</p>

          </div>
        }
        explanation={undefined}
      >
        <div className="space-y-2">
          {criteria.map(c => (
            <CheckItem
              key={c.id}
              id={`curb65-${c.id}`}
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
