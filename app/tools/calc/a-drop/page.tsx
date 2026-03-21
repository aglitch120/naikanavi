'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('a-drop')!

const criteria = [
  { id: 'age', label: 'A: 年齢（Age）', sublabel: '男性 ≥70歳 / 女性 ≥75歳', points: 1 },
  { id: 'dehydration', label: 'D: 脱水（Dehydration）', sublabel: 'BUN ≥21 mg/dL', points: 1 },
  { id: 'respiration', label: 'R: 呼吸不全（Respiration）', sublabel: 'SpO₂ ≤90%（PaO₂ ≤60 Torr）', points: 1 },
  { id: 'orientation', label: 'O: 見当識障害（Orientation）', sublabel: '意識障害あり', points: 1 },
  { id: 'pressure', label: 'P: 血圧低下（Pressure）', sublabel: '収縮期血圧 ≤90 mmHg', points: 1 },
]

function getInterpretation(score: number): { text: string; severity: 'ok' | 'wn' | 'dn'; category: string; disposition: string; mortality: string } {
  if (score === 0) return {
    text: '軽症',
    severity: 'ok',
    category: '軽症群',
    disposition: '外来治療',
    mortality: '2.3%',
  }
  if (score <= 2) return {
    text: score === 1 ? '中等症' : '中等症',
    severity: 'wn',
    category: '中等症群',
    disposition: score === 1 ? '外来または入院' : '入院治療',
    mortality: score === 1 ? '4.3%' : '9.0%',
  }
  if (score === 3) return {
    text: '重症',
    severity: 'dn',
    category: '重症群',
    disposition: '入院治療（集中治療も検討）',
    mortality: '18.2%',
  }
  return {
    text: '超重症',
    severity: 'dn',
    category: '超重症群',
    disposition: 'ICU管理',
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
                  text: '日本呼吸器学会のガイドラインでは、0点は外来治療、1-2点は外来または入院、3点は入院（集中治療検討）、4-5点はICU管理が示されています。',
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
                {result.score >= 3 ? '🏥' : result.score >= 1 ? '⚡' : '✅'} 参考マネジメント（日本呼吸器学会ガイドライン）
              </p>
              <p className={`text-xs mt-1 ${
                result.score >= 3 ? 'text-dn' : result.score >= 1 ? 'text-wn' : 'text-muted'
              }`}>
                {result.disposition}
              </p>
            </div>

            {result.score >= 4 && (
              <div className="bg-dnl border border-dnb rounded-xl p-4">
                <p className="text-sm font-medium text-dn">⚠️ 超重症 — ICU管理・敗血症評価を</p>
                <p className="text-xs text-dn mt-1">
                  qSOFA/SOFAスコアによる敗血症評価を並行して行い、
                  エンピリック抗菌薬の早期投与と血液培養採取を優先してください。
                </p>
              </div>
            )}
          </div>
        }
        explanation={
          <div className="space-y-6 text-sm text-tx leading-relaxed">
            <div>
              <h2 className="text-lg font-bold mb-2">A-DROPとは</h2>
              <p className="text-muted">
                A-DROPは、日本呼吸器学会が日本人の市中肺炎（CAP）データに基づいて開発した重症度分類です。
                Age（年齢）、Dehydration（脱水）、Respiration（呼吸不全）、Orientation（見当識障害）、Pressure（血圧低下）の
                5項目を評価し、軽症・中等症・重症・超重症の4段階に分類します。
                成人肺炎診療ガイドライン2017で示されており、日本国内での標準的な肺炎重症度評価ツールです。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">スコア別の参考マネジメント</h3>
              <div className="space-y-2 text-muted">
                <p><span className="font-medium text-tx">0点（軽症）：</span>外来治療。経口抗菌薬で治療可能。</p>
                <p><span className="font-medium text-tx">1-2点（中等症）：</span>外来または入院。1点は社会的因子を考慮して判断。2点は原則入院。</p>
                <p><span className="font-medium text-tx">3点（重症）：</span>入院治療が必要。集中治療の適応も検討。</p>
                <p><span className="font-medium text-tx">4-5点（超重症）：</span>ICU管理。人工呼吸器管理や昇圧剤投与が必要になる可能性。</p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">CURB-65との違い</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-muted border-collapse">
                  <thead>
                    <tr className="border-b border-br">
                      <th className="text-left py-2 pr-2 font-medium text-tx">項目</th>
                      <th className="text-center py-2 px-2 font-medium text-tx">A-DROP</th>
                      <th className="text-center py-2 px-2 font-medium text-tx">CURB-65</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-br/50">
                      <td className="py-2 pr-2 font-medium text-tx">年齢</td>
                      <td className="text-center py-2 px-2">男≥70 / 女≥75</td>
                      <td className="text-center py-2 px-2">≥65（性差なし）</td>
                    </tr>
                    <tr className="border-b border-br/50">
                      <td className="py-2 pr-2 font-medium text-tx">脱水/腎</td>
                      <td className="text-center py-2 px-2">BUN ≥21</td>
                      <td className="text-center py-2 px-2">BUN &gt;20</td>
                    </tr>
                    <tr className="border-b border-br/50">
                      <td className="py-2 pr-2 font-medium text-tx">呼吸</td>
                      <td className="text-center py-2 px-2">SpO₂ ≤90%</td>
                      <td className="text-center py-2 px-2">呼吸数 ≥30</td>
                    </tr>
                    <tr className="border-b border-br/50">
                      <td className="py-2 pr-2 font-medium text-tx">意識</td>
                      <td className="text-center py-2 px-2">意識障害</td>
                      <td className="text-center py-2 px-2">AMT ≤8</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-2 font-medium text-tx">血圧</td>
                      <td className="text-center py-2 px-2">sBP ≤90</td>
                      <td className="text-center py-2 px-2">sBP &lt;90 or dBP ≤60</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-muted mt-2">
                A-DROPの主な特徴は、年齢基準に性差があること（日本人の平均寿命差を考慮）と、
                呼吸評価に呼吸数ではなくSpO₂を使用する点です。SpO₂はパルスオキシメーターで非侵襲的に測定でき、
                呼吸数の目視カウントより客観的です。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">注意点</h3>
              <div className="space-y-2 text-muted">
                <p>A-DROPは市中肺炎（CAP）に対する重症度分類です。院内肺炎（HAP）や医療介護関連肺炎（NHCAP）には I-ROAD システムを使用してください。</p>
                <p>免疫不全患者（HIV、臓器移植後、化学療法中等）では重症度が過小評価される可能性があります。</p>
                <p>スコアだけでなく、画像所見（多葉性浸潤影）、基礎疾患、社会的因子も総合的に判断してください。</p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">よくある質問</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Q. A-DROPは日本以外でも使われますか？</p>
                  <p className="text-muted mt-1">
                    A-DROPは日本人データに基づいて開発・検証されたスコアで、主に日本国内で使用されています。
                    国際的にはCURB-65やPSI（Pneumonia Severity Index）が広く使用されています。
                  </p>
                </div>
                <div>
                  <p className="font-medium">Q. SpO₂が測定できない場合は？</p>
                  <p className="text-muted mt-1">
                    動脈血ガス分析でPaO₂ ≤60 Torrの場合、R（呼吸不全）の項目に該当します。
                    SpO₂もPaO₂もない場合、呼吸数≥30回/分を代替指標として参考にしてください。
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
