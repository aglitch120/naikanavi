'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('a-drop')!

const criteria = [
  { id: 'age', label: 'A: 年齢（Age）', sublabel: '男性 ≥70歳 / 女性 ≥75歳', points: 1 },
  { id: 'dehydration', label: 'D: 脱水（Dehydration）', sublabel: 'BUN ≥21 mg/dL または脱水あり', points: 1 },
  { id: 'respiration', label: 'R: 呼吸不全（Respiration）', sublabel: 'SpO₂ ≤90%（PaO₂ ≤60 Torr）', points: 1 },
  { id: 'orientation', label: 'O: 見当識障害（Orientation）', sublabel: '意識障害あり', points: 1 },
  { id: 'pressure', label: 'P: 血圧低下（Pressure）', sublabel: '収縮期血圧 ≤90 mmHg', points: 1 },
]

function getInterpretation(score: number): { text: string; severity: 'ok' | 'wn' | 'dn'; category: string; disposition: string; mortality: string } {
  if (score === 0) return {
    text: '軽症',
    severity: 'ok',
    category: '軽症群',
    disposition: 'スコア0点（軽症群）',
    mortality: '2.3%',
  }
  if (score <= 2) return {
    text: score === 1 ? '中等症I' : '中等症II',
    severity: 'wn',
    category: score === 1 ? '中等症I群' : '中等症II群',
    disposition: score === 1 ? 'スコア1点（中等症I群）' : 'スコア2点（中等症II群）',
    mortality: score === 1 ? '4.3%' : '9.0%',
  }
  if (score === 3) return {
    text: '重症',
    severity: 'dn',
    category: '重症群',
    disposition: 'スコア3点（重症群）',
    mortality: '18.2%',
  }
  return {
    text: '超重症',
    severity: 'dn',
    category: '超重症群',
    disposition: 'スコア4〜5点（超重症群）',
    mortality: score === 4 ? '32.5%' : '46.2%',
  }
}

export default function ADROPPage() {
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
            name: 'A-DROP スコア計算',
            description: toolDef.description,
            url: 'https://iwor.jp/tools/a-drop',
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
              { '@type': 'ListItem', position: 3, name: 'A-DROP', item: 'https://iwor.jp/tools/a-drop' },
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
                name: 'A-DROPとは何ですか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'A-DROPは日本呼吸器学会が開発した市中肺炎（CAP）の重症度分類です。Age（年齢）、Dehydration（脱水）、Respiration（呼吸不全）、Orientation（見当識障害）、Pressure（血圧低下）の5項目で評価します。',
                },
              },
              {
                '@type': 'Question',
                name: 'A-DROPとCURB-65の違いは？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'A-DROPは日本人データに基づいて開発され、年齢基準に性差（男性≥70歳、女性≥75歳）を設定しています。また呼吸不全の指標にSpO2を使用する点がCURB-65（呼吸数を使用）と異なります。日本国内ではA-DROPの使用が示されています。',
                },
              },
              {
                '@type': 'Question',
                name: 'A-DROPで何点から入院が必要ですか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '日本呼吸器学会のガイドラインでは、スコアに応じた重症度分類（軽症・中等症I・中等症II・重症・超重症）が示されており、対応方針は担当医が総合的に判断します。',
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
          { text: '日本呼吸器学会. 成人肺炎診療ガイドライン2017. 日本呼吸器学会, 2017.', url: 'https://www.jrs.or.jp/publications/guidelines/' },
          { text: 'Miyashita N, et al. A new severity scoring system: A-DROP system for community-acquired pneumonia. Intern Med. 2006;45(5):305-309. PMID: 16595999', url: 'https://pubmed.ncbi.nlm.nih.gov/16595999/' },
          { text: 'Shindo Y, et al. Comparison of severity scoring systems A-DROP and CURB-65 for community-acquired pneumonia. Respirology. 2008;13(5):731-735. PMID: 18713094', url: 'https://pubmed.ncbi.nlm.nih.gov/18713094/' },
          { text: 'Kohno S, et al. The Japanese Respiratory Society guidelines for management of hospital-acquired pneumonia. Respirology. 2009;14 Suppl 2:S1-S71. PMID: 19857215', url: 'https://pubmed.ncbi.nlm.nih.gov/19857215/' },
        ]}
        result={
          <div className="space-y-3">
            <ResultCard
              label="A-DROP スコア"
              value={result.score}
              unit="/ 5点"
              interpretation={`${result.category}（${result.text}）— 30日死亡率 ${result.mortality}`}
              severity={result.severity}
            />
            <p className="text-[10px] text-muted px-1">30日死亡率: Miyashita N, et al. Intern Med 2006; PMID: 16595999</p>

            <div className={`${
              result.score >= 3 ? 'bg-dnl border-dnb' : result.score >= 1 ? 'bg-wnl border-wnb' : 'bg-s0 border-br'
            } border rounded-xl p-4`}>
              <p className={`text-sm font-medium ${
                result.score >= 3 ? 'text-dn' : result.score >= 1 ? 'text-wn' : 'text-tx'
              }`}>
                {result.score >= 3 ? '⚠️' : result.score >= 1 ? '⚡' : '✅'} 重症度分類（日本呼吸器学会ガイドライン）
              </p>
              <p className={`text-xs mt-1 ${
                result.score >= 3 ? 'text-dn' : result.score >= 1 ? 'text-wn' : 'text-muted'
              }`}>
                {result.disposition}
              </p>
            </div>

            {result.score >= 4 && (
              <div className="bg-dnl border border-dnb rounded-xl p-4">
                <p className="text-sm font-medium text-dn">⚠️ 超重症群 — 30日死亡率 {result.mortality}</p>
                <p className="text-xs text-dn mt-1">
                  qSOFA/SOFAスコアも参考値として使用されることがある。最終的な対応方針は担当医による判断が必要。
                </p>
              </div>
            )}
          </div>
        }
        explanation={undefined}
      >
        <div className="space-y-2">
          {criteria.map(c => (
            <CheckItem
              key={c.id}
              id={`adrop-${c.id}`}
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
