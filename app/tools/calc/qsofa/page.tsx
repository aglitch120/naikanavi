'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('qsofa')!

const criteria = [
  { id: 'mental', label: '意識変容（GCS <15）', sublabel: 'Altered mentation — GCS 14以下', points: 1 },
  { id: 'respiratory', label: '呼吸数 ≥22 回/分', sublabel: 'Respiratory rate', points: 1 },
  { id: 'bp', label: '収縮期血圧 ≤100 mmHg', sublabel: 'Systolic BP', points: 1 },
]

function getInterpretation(score: number): { text: string; severity: 'ok' | 'wn' | 'dn'; recommendation: string } {
  if (score < 2) return {
    text: 'qSOFA 陰性',
    severity: 'ok',
    recommendation: '敗血症の可能性は低いが、感染症が疑われる場合は臨床的に注意。',
  }
  return {
    text: 'qSOFA 陽性（≥2点）— 敗血症を疑う',
    severity: 'dn',
    recommendation: '敗血症（Sepsis-3）を疑う。治療方針は担当医が判断。',
  }
}

export default function QSOFAPage() {
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
            name: 'qSOFA スコア計算',
            description: toolDef.description,
            url: 'https://iwor.jp/tools/qsofa',
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
              { '@type': 'ListItem', position: 3, name: 'qSOFA', item: 'https://iwor.jp/tools/qsofa' },
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
                name: 'qSOFAとは何ですか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'qSOFA（quick SOFA）は感染症が疑われる患者の敗血症スクリーニングツールです。意識変容・呼吸数・血圧の3項目をベッドサイドで迅速に評価し、2点以上で敗血症を疑います。Sepsis-3（2016年）で提唱されました。',
                },
              },
              {
                '@type': 'Question',
                name: 'qSOFAとSOFAの違いは？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'qSOFAは3項目のスクリーニングツール（検査不要）で、SOFAは6臓器系の詳細な臓器障害評価スコア（検査値が必要）です。qSOFA陽性時にSOFAで臓器障害を定量評価する二段階アプローチが示されています。',
                },
              },
              {
                '@type': 'Question',
                name: 'qSOFAが陰性なら敗血症は否定できますか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'いいえ。qSOFAは感度が低い（約50-60%）ため、陰性でも敗血症を除外できません。臨床的に感染症が疑われる場合は、qSOFAに関わらず乳酸値やSOFAスコアで評価してください。qSOFAは「除外ツール」ではなく「警告ツール」です。',
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
          { text: 'Singer M, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):801-810. PMID: 26903338', url: 'https://pubmed.ncbi.nlm.nih.gov/26903338/' },
          { text: 'Seymour CW, et al. Assessment of clinical criteria for sepsis: for the Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):762-774. PMID: 26903335', url: 'https://pubmed.ncbi.nlm.nih.gov/26903335/' },
          { text: 'Freund Y, et al. Prognostic accuracy of sepsis-3 criteria for in-hospital mortality among patients with suspected infection presenting to the emergency department. JAMA. 2017;317(3):301-308. PMID: 28114554', url: 'https://pubmed.ncbi.nlm.nih.gov/28114554/' },
          { text: 'Surviving Sepsis Campaign: International Guidelines for Management of Sepsis and Septic Shock: 2021. Intensive Care Med. 2021;47(11):1181-1247. PMID: 34599691', url: 'https://pubmed.ncbi.nlm.nih.gov/34599691/' },
        ]}
        result={
          <div className="space-y-3">
            <ResultCard
              label="qSOFA スコア"
              value={result.score}
              unit="/ 3点"
              interpretation={result.text}
              severity={result.severity}
            />

            <div className={`${
              result.score >= 2 ? 'bg-dnl border-dnb' : 'bg-s0 border-br'
            } border rounded-xl p-4`}>
              <p className={`text-sm font-medium ${result.score >= 2 ? 'text-dn' : 'text-tx'}`}>
                {result.score >= 2 ? '🚨 参考情報' : '✅ 参考'}
              </p>
              <p className={`text-xs mt-1 ${result.score >= 2 ? 'text-dn' : 'text-muted'}`}>
                {result.recommendation}
              </p>
            </div>

          </div>
        }
        explanation={undefined}
      >
        <div className="space-y-2">
          {criteria.map(c => (
            <CheckItem
              key={c.id}
              id={`qsofa-${c.id}`}
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
