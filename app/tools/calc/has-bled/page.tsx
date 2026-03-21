'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('has-bled')!

const criteria = [
  { id: 'htn', label: 'H: 高血圧（コントロール不良）', sublabel: '収縮期血圧 >160 mmHg', points: 1, modifiable: true },
  { id: 'renal', label: 'A: 腎機能障害', sublabel: '透析・腎移植・Cr>2.26mg/dL', points: 1, modifiable: false },
  { id: 'liver', label: 'A: 肝機能障害', sublabel: '慢性肝疾患・Bil>2倍・AST/ALT/ALP>3倍', points: 1, modifiable: false },
  { id: 'stroke', label: 'S: 脳卒中の既往', sublabel: 'Stroke history', points: 1, modifiable: false },
  { id: 'bleeding', label: 'B: 出血の既往・素因', sublabel: '大出血既往・出血性素因・貧血', points: 1, modifiable: false },
  { id: 'labile', label: 'L: INR不安定', sublabel: 'TTR<60%（ワルファリン使用時）', points: 1, modifiable: true },
  { id: 'elderly', label: 'E: 高齢（>65歳）', sublabel: 'Elderly', points: 1, modifiable: false },
  { id: 'drugs', label: 'D: 出血リスクのある薬剤', sublabel: '抗血小板薬・NSAID併用', points: 1, modifiable: true },
  { id: 'alcohol', label: 'D: アルコール過剰摂取', sublabel: '≥8 drinks/週', points: 1, modifiable: true },
]

function getInterpretation(score: number): { text: string; severity: 'ok' | 'wn' | 'dn' } {
  if (score <= 1) return { text: '低リスク（年間出血率 1.0-3.4%）', severity: 'ok' }
  if (score === 2) return { text: '中リスク（年間出血率 4.1%）', severity: 'wn' }
  return { text: `高リスク（年間出血率 ${score >= 5 ? '>12' : score === 3 ? '5.8' : score === 4 ? '8.7' : '12.5'}%）— 是正可能な因子を確認`, severity: 'dn' }
}

export default function HASBLEDPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const result = useMemo(() => {
    const score = criteria.reduce((sum, c) => sum + (checked[c.id] ? c.points : 0), 0)
    const interp = getInterpretation(score)
    const modifiableChecked = criteria.filter(c => c.modifiable && checked[c.id])
    return { score, ...interp, modifiableChecked }
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
            name: 'HAS-BLED スコア計算',
            description: toolDef.description,
            url: 'https://iwor.jp/tools/has-bled',
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
              { '@type': 'ListItem', position: 3, name: 'HAS-BLED', item: 'https://iwor.jp/tools/has-bled' },
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
          { text: 'Pisters R, et al. A novel user-friendly score (HAS-BLED) to assess 1-year risk of major bleeding in patients with atrial fibrillation. Chest. 2010;138(5):1093-1100. PMID: 20299623', url: 'https://pubmed.ncbi.nlm.nih.gov/20299623/' },
          { text: 'Hindricks G, et al. 2020 ESC Guidelines for the diagnosis and management of atrial fibrillation. Eur Heart J. 2021;42(5):373-498. PMID: 32860505', url: 'https://pubmed.ncbi.nlm.nih.gov/32860505/' },
          { text: 'Lip GY, et al. Bleeding risk assessment and management in atrial fibrillation patients. Europace. 2011;13(5):723-746. PMID: 21515596', url: 'https://pubmed.ncbi.nlm.nih.gov/21515596/' },
        ]}
        result={
          <div className="space-y-3">
            <ResultCard
              label="HAS-BLED スコア"
              value={result.score}
              unit="/ 9点"
              interpretation={result.text}
              severity={result.severity}
            />

            {/* 是正可能な因子のハイライト */}
            {result.modifiableChecked.length > 0 && (
              <div className="bg-s0 border border-br rounded-xl p-4">
                <p className="text-sm font-medium text-tx mb-2">⚡ 是正可能なリスク因子</p>
                <p className="text-xs text-muted mb-2">
                  以下の因子は介入により出血リスクを低減できます。抗凝固中止の理由にはなりません。
                </p>
                <ul className="space-y-1">
                  {result.modifiableChecked.map(c => (
                    <li key={c.id} className="text-xs text-ac flex items-start gap-1.5">
                      <span className="mt-0.5">→</span>
                      <span>
                        <span className="font-medium">{c.label.split(':')[1]?.trim()}</span>
                        {c.id === 'htn' && '：降圧目標の見直し'}
                        {c.id === 'labile' && '：DOAC切替を検討'}
                        {c.id === 'drugs' && '：不要なNSAID・抗血小板薬の中止'}
                        {c.id === 'alcohol' && '：減酒指導'}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        }
        explanation={
          <div className="space-y-6 text-sm text-tx leading-relaxed">
            <div>
              <h2 className="text-lg font-bold mb-2">HAS-BLEDスコアとは</h2>
              <p className="text-muted">
                HAS-BLEDスコアは、心房細動患者の抗凝固療法中における大出血リスクを評価するツールです。
                2010年にPistersらがChest誌で発表し、ESCガイドラインで出血リスク評価に示されています。
                9項目（最大9点）で評価し、3点以上を「高リスク」とします。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">重要：高スコア＝抗凝固中止ではない</h3>
              <div className="bg-wnl border border-wnb rounded-lg p-3 text-wn">
                <p className="text-sm">
                  HAS-BLEDスコアが高いことは、抗凝固療法の中止理由にはなりません。
                  スコアの目的は「是正可能なリスク因子を特定し、介入する」ことです。
                  血圧コントロール、不要なNSAID中止、INR不安定例へのDOAC切替などが有効です。
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">是正可能な因子と介入</h3>
              <div className="space-y-2 text-muted">
                <p><span className="font-medium text-tx">高血圧：</span>降圧目標の見直し（140/90未満への厳格管理）</p>
                <p><span className="font-medium text-tx">INR不安定：</span>ワルファリンからDOACへの切替を検討</p>
                <p><span className="font-medium text-tx">薬剤：</span>不要な抗血小板薬・NSAIDの中止。PPI併用の検討</p>
                <p><span className="font-medium text-tx">アルコール：</span>減酒指導</p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">CHA₂DS₂-VAScとの併用</h3>
              <p className="text-muted">
                臨床では CHA₂DS₂-VASc（脳卒中リスク）と HAS-BLED（出血リスク）を並べて評価し、
                リスク・ベネフィットのバランスで抗凝固療法の適応を判断します。
                多くの場合、脳卒中予防のベネフィットが出血リスクを上回ります。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">よくある質問</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Q. 「A」が2回あるのはなぜですか？</p>
                  <p className="text-muted mt-1">
                    Abnormal renal function（腎機能障害）とAbnormal liver function（肝機能障害）で
                    それぞれ1点ずつ加算されます。両方該当すれば「A」だけで2点になります。
                  </p>
                </div>
                <div>
                  <p className="font-medium">Q. DOACでもHAS-BLEDは使えますか？</p>
                  <p className="text-muted mt-1">
                    はい。元々はワルファリン患者で検証されましたが、DOAC患者でも出血リスク評価に有用であることが複数の研究で示されています。
                    ただし「L: INR不安定」の項目はDOAC使用時は該当しません。
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
              id={`hasbled-${c.id}`}
              label={c.label}
              sublabel={`${c.sublabel}${c.modifiable ? ' 🔧 是正可能' : ''}`}
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
