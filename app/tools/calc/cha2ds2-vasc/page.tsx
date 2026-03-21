'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('cha2ds2-vasc')!

interface CriterionDef {
  id: string
  label: string
  sublabel: string
  points: number
}

const criteria: CriterionDef[] = [
  { id: 'chf', label: 'C: うっ血性心不全', sublabel: 'CHF / LV dysfunction (EF≤40%)', points: 1 },
  { id: 'htn', label: 'H: 高血圧', sublabel: 'Hypertension（治療中含む）', points: 1 },
  { id: 'age75', label: 'A₂: 年齢 ≥75歳', sublabel: 'Age ≥75', points: 2 },
  { id: 'dm', label: 'D: 糖尿病', sublabel: 'Diabetes mellitus', points: 1 },
  { id: 'stroke', label: 'S₂: 脳卒中/TIA/血栓塞栓症の既往', sublabel: 'Stroke / TIA / thromboembolism', points: 2 },
  { id: 'vascular', label: 'V: 血管疾患', sublabel: 'MI既往・PAD・大動脈プラーク', points: 1 },
  { id: 'age65', label: 'A: 年齢 65-74歳', sublabel: 'Age 65-74', points: 1 },
  { id: 'sex', label: 'Sc: 女性', sublabel: 'Sex category (female)', points: 1 },
]

// 年間脳卒中リスク（Lip GY et al. Chest 2010 ベース）
const strokeRisk: Record<number, string> = {
  0: '0%',
  1: '1.3%',
  2: '2.2%',
  3: '3.2%',
  4: '4.0%',
  5: '6.7%',
  6: '9.8%',
  7: '9.6%',
  8: '6.7%',
  9: '15.2%',
}

function getRecommendation(score: number, isFemale: boolean): string {
  // 女性で性別ポイントのみ（実質0点）の場合
  const effectiveScore = isFemale ? score - 1 : score
  if (effectiveScore === 0) return '抗凝固療法は不要（低リスク）'
  if (effectiveScore === 1) return '抗凝固療法を考慮（DOAC参照）'
  return '抗凝固療法を検討（DOAC参照）'
}

function getSeverity(score: number, isFemale: boolean): 'ok' | 'wn' | 'dn' {
  const effectiveScore = isFemale ? score - 1 : score
  if (effectiveScore === 0) return 'ok'
  if (effectiveScore === 1) return 'wn'
  return 'dn'
}

export default function CHA2DS2VAScPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const result = useMemo(() => {
    const score = criteria.reduce((sum, c) => sum + (checked[c.id] ? c.points : 0), 0)
    const isFemale = !!checked['sex']
    return {
      score,
      risk: strokeRisk[score] || '>15%',
      recommendation: getRecommendation(score, isFemale),
      severity: getSeverity(score, isFemale),
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
            name: 'CHA₂DS₂-VASc スコア計算',
            description: toolDef.description,
            url: 'https://iwor.jp/tools/cha2ds2-vasc',
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
              { '@type': 'ListItem', position: 3, name: 'CHA₂DS₂-VASc', item: 'https://iwor.jp/tools/cha2ds2-vasc' },
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
          { text: 'Lip GY, et al. Refining clinical risk stratification for predicting stroke and thromboembolism in atrial fibrillation using a novel risk factor-based approach. Chest. 2010;137(2):263-272. PMID: 19762550', url: 'https://pubmed.ncbi.nlm.nih.gov/19762550/' },
          { text: 'Hindricks G, et al. 2020 ESC Guidelines for the diagnosis and management of atrial fibrillation. Eur Heart J. 2021;42(5):373-498. PMID: 32860505', url: 'https://pubmed.ncbi.nlm.nih.gov/32860505/' },
          { text: '2024 JCS/JHRS Guideline on Pharmacotherapy of Cardiac Arrhythmias. Circ J. 2024. 日本循環器学会/日本不整脈心電学会.' },
        ]}
        result={
          <div className="space-y-3">
            <ResultCard
              label="CHA₂DS₂-VASc スコア"
              value={result.score}
              unit={`/ 9点`}
              interpretation={result.recommendation}
              severity={result.severity}
              details={[
                { label: '年間脳卒中リスク', value: result.risk },
              ]}
            />
          </div>
        }
        explanation={
          <div className="space-y-6 text-sm text-tx leading-relaxed">
            <div>
              <h2 className="text-lg font-bold mb-2">CHA₂DS₂-VAScスコアとは</h2>
              <p className="text-muted">
                CHA₂DS₂-VAScスコアは、非弁膜症性心房細動（NVAF）患者における脳卒中・全身性塞栓症のリスクを評価するスコアリングシステムです。
                CHADS₂スコアを拡張し、より詳細なリスク層別化を可能にしました。
                ESC・AHAガイドラインで抗凝固療法の適応判断に示されています。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">抗凝固療法の参考</h3>
              <div className="bg-s1 rounded-lg p-4 space-y-2 text-muted">
                <p><span className="font-medium text-ok">0点（男性）/ 1点（女性のみ）：</span> 抗凝固療法は不要</p>
                <p><span className="font-medium text-wn">1点（男性）/ 2点（女性）：</span> 抗凝固療法を考慮（DOAC参照）</p>
                <p><span className="font-medium text-dn">≥2点（男性）/ ≥3点（女性）：</span> 抗凝固療法を検討（DOAC参照）</p>
              </div>
              <p className="text-xs text-muted mt-2">
                ※ 女性の性別ポイント（+1）は単独ではリスク因子とならないため、実質スコアから1を引いて判断します。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">CHADS₂との違い</h3>
              <p className="text-muted">
                CHADS₂スコアは5項目で簡便ですが、低〜中リスク層の識別が不十分でした。
                CHA₂DS₂-VAScは血管疾患・年齢65-74歳・女性を追加し、特に「CHADS₂ 0-1点」の患者をより精密に層別化します。
                現在の国際ガイドラインではCHA₂DS₂-VAScが標準です。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">よくある質問</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Q. DOACとワルファリン、どちらを選ぶべきですか？</p>
                  <p className="text-muted mt-1">
                    NVAFではDOACが第一選択です。ただし、機械弁・中等度以上の僧帽弁狭窄症ではワルファリンが必須です。
                    腎機能（CCr）に応じてDOACの種類・用量を選択します。
                  </p>
                </div>
                <div>
                  <p className="font-medium">Q. HAS-BLEDスコアが高い場合、抗凝固は中止すべきですか？</p>
                  <p className="text-muted mt-1">
                    いいえ。HAS-BLEDスコアが高いことは抗凝固中止の理由にはなりません。
                    出血リスク因子の是正（血圧管理、不要なNSAID中止等）を行いつつ、抗凝固を継続することが示されます。
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-2">
          {criteria.map(c => (
            <CheckItem
              key={c.id}
              id={`cha2ds2-${c.id}`}
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
