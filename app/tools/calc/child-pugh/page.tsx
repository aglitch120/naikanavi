'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('child-pugh')!

interface CriterionOption {
  label: string
  points: number
}

interface Criterion {
  id: string
  name: string
  options: CriterionOption[]
}

const criteria: Criterion[] = [
  {
    id: 'encephalopathy',
    name: '肝性脳症',
    options: [
      { label: 'なし', points: 1 },
      { label: 'Grade I〜II（軽度〜中等度）', points: 2 },
      { label: 'Grade III〜IV（重度・昏睡）', points: 3 },
    ],
  },
  {
    id: 'ascites',
    name: '腹水',
    options: [
      { label: 'なし', points: 1 },
      { label: '少量（利尿薬で制御可能）', points: 2 },
      { label: '中等量〜大量（難治性）', points: 3 },
    ],
  },
  {
    id: 'bilirubin',
    name: '血清ビリルビン (mg/dL)',
    options: [
      { label: '< 2.0', points: 1 },
      { label: '2.0 〜 3.0', points: 2 },
      { label: '> 3.0', points: 3 },
    ],
  },
  {
    id: 'albumin',
    name: '血清アルブミン (g/dL)',
    options: [
      { label: '> 3.5', points: 1 },
      { label: '2.8 〜 3.5', points: 2 },
      { label: '< 2.8', points: 3 },
    ],
  },
  {
    id: 'pt',
    name: 'PT-INR',
    options: [
      { label: '< 1.7', points: 1 },
      { label: '1.7 〜 2.3', points: 2 },
      { label: '> 2.3', points: 3 },
    ],
  },
]

function getClassification(score: number): { grade: string; text: string; severity: 'ok' | 'wn' | 'dn'; survival1y: string; survival2y: string; perioperativeMortality: string } {
  if (score <= 6) return {
    grade: 'A',
    text: 'Class A（軽度・代償性）',
    severity: 'ok',
    survival1y: '100%',
    survival2y: '85%',
    perioperativeMortality: '10%',
  }
  if (score <= 9) return {
    grade: 'B',
    text: 'Class B（中等度）',
    severity: 'wn',
    survival1y: '81%',
    survival2y: '57%',
    perioperativeMortality: '30%',
  }
  return {
    grade: 'C',
    text: 'Class C（重度・非代償性）— 周術期リスク極めて高い。肝臓専門医への相談を推奨',
    severity: 'dn',
    survival1y: '45%',
    survival2y: '35%',
    perioperativeMortality: '82%',
  }
}

export default function ChildPughPage() {
  const [selected, setSelected] = useState<Record<string, number>>({
    encephalopathy: 0,
    ascites: 0,
    bilirubin: 0,
    albumin: 0,
    pt: 0,
  })

  const result = useMemo(() => {
    const score = Object.entries(selected).reduce((sum, [id, optIndex]) => {
      const criterion = criteria.find(c => c.id === id)!
      return sum + criterion.options[optIndex].points
    }, 0)
    return { score, ...getClassification(score) }
  }, [selected])

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
            name: 'Child-Pugh 分類 計算',
            description: toolDef.description,
            url: 'https://iwor.jp/tools/child-pugh',
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
              { '@type': 'ListItem', position: 3, name: 'Child-Pugh 分類', item: 'https://iwor.jp/tools/child-pugh' },
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
                name: 'Child-Pugh分類とは何ですか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Child-Pugh分類は、肝硬変の重症度を5項目（脳症・腹水・ビリルビン・アルブミン・PT）のスコアで評価し、A（軽度）・B（中等度）・C（重度）に分類するシステムです。',
                },
              },
              {
                '@type': 'Question',
                name: 'Child-Pugh分類はどのような場面で使いますか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '肝硬変の予後予測、手術適応の判断、肝移植の評価、薬剤投与量の調整などに使用されます。Class Cでは周術期死亡率が80%を超えるため、待機手術は原則禁忌とされます。',
                },
              },
              {
                '@type': 'Question',
                name: 'Child-PughとMELDの違いは？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Child-Pughは3段階のカテゴリ分類（A/B/C）で臨床的判断に適し、MELDは連続変数で算出され移植待機リストの優先順位決定に使われます。両者は補完的に使用されます。',
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
          { text: 'Pugh RN, et al. Transection of the oesophagus for bleeding oesophageal varices. Br J Surg. 1973;60(8):646-649. PMID: 4541913', url: 'https://pubmed.ncbi.nlm.nih.gov/4541913/' },
          { text: 'Mansour A, et al. Abdominal operations in patients with cirrhosis: still a major surgical challenge. Surgery. 1997;122(4):730-735. PMID: 9347849', url: 'https://pubmed.ncbi.nlm.nih.gov/9347849/' },
          { text: 'Cholongitas E, et al. Systematic review: the model for end-stage liver disease—should it replace Child-Pugh\'s classification for assessing prognosis in cirrhosis? Aliment Pharmacol Ther. 2005;22(11-12):1079-1089. PMID: 16305721', url: 'https://pubmed.ncbi.nlm.nih.gov/16305721/' },
          { text: 'D\'Amico G, et al. Natural history and prognostic indicators of survival in cirrhosis: a systematic review of 118 studies. J Hepatol. 2006;44(1):217-231. PMID: 16298014', url: 'https://pubmed.ncbi.nlm.nih.gov/16298014/' },
        ]}
        result={
          <div className="space-y-3">
            <ResultCard
              label="Child-Pugh スコア"
              value={result.score}
              unit="/ 15点"
              interpretation={result.text}
              severity={result.severity}
            />

            {/* 予後・周術期リスク */}
            <div className="bg-s0 border border-br rounded-xl p-4">
              <p className="text-sm font-medium text-tx mb-2">📊 予後データ（Class {result.grade}）</p>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-xs text-muted">1年生存率</p>
                  <p className="text-base font-bold text-tx">{result.survival1y}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">2年生存率</p>
                  <p className="text-base font-bold text-tx">{result.survival2y}</p>
                </div>
                <div>
                  <p className="text-xs text-muted">周術期死亡率</p>
                  <p className={`text-base font-bold ${result.severity === 'dn' ? 'text-dn' : result.severity === 'wn' ? 'text-wn' : 'text-tx'}`}>
                    {result.perioperativeMortality}
                  </p>
                </div>
              </div>
              <p className="text-[10px] text-muted mt-2">出典: D'Amico G, et al. J Hepatol 2006（生存率）; Mansour A, et al. Surgery 1997（周術期死亡率）</p>
            </div>
            {result.grade === 'C' && (
              <div className="bg-dnl border border-dnb rounded-xl p-4">
                <p className="text-sm font-medium text-dn">⚠️ Class C — 待機手術は原則禁忌</p>
                <p className="text-xs text-dn mt-1">
                  周術期死亡率が極めて高く、肝移植の適応を積極的に検討してください。MELD スコアによる移植優先度評価を併用してください。
                </p>
              </div>
            )}
            {result.grade === 'B' && (
              <div className="bg-wnl border border-wnb rounded-xl p-4">
                <p className="text-sm font-medium text-wn">⚡ Class B — 手術適応は慎重に判断</p>
                <p className="text-xs text-wn mt-1">
                  周術期リスクが高いため、手術適応は肝臓専門医と協議のうえ慎重に判断してください。栄養療法・腹水管理による改善も検討します。
                </p>
              </div>
            )}
          </div>
        }
        explanation={undefined}
      >
        <div className="space-y-4">
          {criteria.map(criterion => (
            <div key={criterion.id} className="space-y-1.5">
              <p className="text-sm font-medium text-tx">{criterion.name}</p>
              <div className="space-y-1">
                {criterion.options.map((option, optIdx) => (
                  <label
                    key={optIdx}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
                      selected[criterion.id] === optIdx
                        ? 'border-ac bg-acl'
                        : 'border-br bg-s0 hover:border-muted'
                    }`}
                  >
                    <input
                      type="radio"
                      name={criterion.id}
                      value={optIdx}
                      checked={selected[criterion.id] === optIdx}
                      onChange={() => setSelected(prev => ({ ...prev, [criterion.id]: optIdx }))}
                      className="sr-only"
                    />
                    <span className={`flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      selected[criterion.id] === optIdx
                        ? 'border-ac'
                        : 'border-muted'
                    }`}>
                      {selected[criterion.id] === optIdx && (
                        <span className="w-2.5 h-2.5 rounded-full bg-ac" />
                      )}
                    </span>
                    <span className="flex-1 text-sm text-tx">{option.label}</span>
                    <span className="text-xs text-muted flex-shrink-0">{option.points}点</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CalculatorLayout>
    </>
  )
}
