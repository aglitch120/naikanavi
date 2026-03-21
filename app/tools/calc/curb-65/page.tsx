'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('curb-65')!

const criteria = [
  { id: 'confusion', label: 'C: 意識障害（Confusion）', sublabel: 'AMT ≤8 または新規の見当識障害', points: 1 },
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
    disposition: '外来治療を検討',
  }
  if (score === 1) return {
    text: '低リスク',
    severity: 'ok',
    mortality: '2.7%',
    disposition: '外来治療を検討（リスク因子に応じて短期入院も考慮）',
  }
  if (score === 2) return {
    text: '中リスク',
    severity: 'wn',
    mortality: '6.8%',
    disposition: '入院治療（短期入院または Hospital-supervised）',
  }
  if (score === 3) return {
    text: '高リスク',
    severity: 'dn',
    mortality: '14.0%',
    disposition: '入院治療（重症肺炎として管理）',
  }
  return {
    text: '非常に高リスク',
    severity: 'dn',
    mortality: score === 4 ? '27.8%' : '57.0%',
    disposition: 'ICU入室を検討',
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
                  text: 'CURB-65は市中肺炎（CAP）の重症度を5項目（意識障害・BUN・呼吸数・血圧・年齢）で評価し、外来治療か入院かICUかのトリアージに使用するスコアです。British Thoracic Societyで示されています。',
                },
              },
              {
                '@type': 'Question',
                name: 'CURB-65とA-DROPの違いは？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'CURB-65は英国BTSが開発した国際的なスコアで、A-DROPは日本呼吸器学会が日本人データに基づいて開発したスコアです。項目は類似していますが、A-DROPは年齢の性差補正や脱水の指標にBUNではなくSpO2を使用する点が異なります。',
                },
              },
              {
                '@type': 'Question',
                name: 'CRB-65とCURB-65の違いは？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'CRB-65はCURB-65からBUN（Urea）を除いた4項目版で、血液検査なしでベッドサイドやプライマリケアで迅速に評価できます。0点は外来、1-2点は入院検討、3-4点は緊急入院が示されます。',
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

            {/* Disposition recommendation */}
            <div className={`${
              result.score >= 3 ? 'bg-dnl border-dnb' : result.score === 2 ? 'bg-wnl border-wnb' : 'bg-s0 border-br'
            } border rounded-xl p-4`}>
              <p className={`text-sm font-medium ${
                result.score >= 3 ? 'text-dn' : result.score === 2 ? 'text-wn' : 'text-tx'
              }`}>
                {result.score >= 3 ? '🏥' : result.score === 2 ? '⚡' : '✅'} 参考マネジメント
              </p>
              <p className={`text-xs mt-1 ${
                result.score >= 3 ? 'text-dn' : result.score === 2 ? 'text-wn' : 'text-muted'
              }`}>
                {result.disposition}
              </p>
            </div>
          </div>
        }
        explanation={
          <div className="space-y-6 text-sm text-tx leading-relaxed">
            <div>
              <h2 className="text-lg font-bold mb-2">CURB-65とは</h2>
              <p className="text-muted">
                CURB-65は、市中肺炎（Community-Acquired Pneumonia: CAP）の重症度を迅速に評価するスコアです。
                2003年にLimらがThorax誌で発表し、英国BTS（British Thoracic Society）ガイドラインで示されています。
                5つの臨床指標（Confusion, Urea, Respiratory rate, Blood pressure, 65歳以上）をチェックするだけで、
                外来治療・入院・ICU管理のトリアージ判断を支援します。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">スコア別の参考マネジメント</h3>
              <div className="space-y-2 text-muted">
                <p><span className="font-medium text-tx">0-1点（低リスク）：</span>30日死亡率 0.6-2.7%。外来治療を検討。ただし社会的因子（独居、経口摂取困難等）があれば入院も考慮。</p>
                <p><span className="font-medium text-tx">2点（中リスク）：</span>30日死亡率 6.8%。短期入院または Hospital-supervised outpatient treatment を検討。</p>
                <p><span className="font-medium text-tx">3点以上（高リスク）：</span>30日死亡率 14-57%。入院管理が必要。4-5点ではICU入室を積極的に検討。</p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">CRB-65（血液検査不要版）</h3>
              <p className="text-muted">
                BUNを除いた4項目版がCRB-65です。プライマリケアや救急外来での初期評価に有用で、
                血液検査結果を待たずにベッドサイドで迅速に判定できます。
                0点は外来、1-2点は入院検討、3-4点は緊急入院が示されます。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">A-DROPとの比較</h3>
              <p className="text-muted">
                日本呼吸器学会は日本人データに基づく A-DROP スコアを検討しています。
                CURB-65とA-DROPは類似の項目を評価しますが、A-DROPでは年齢基準に性差を設けている（男性≥70歳、女性≥75歳）点、
                脱水指標としてBUNの代わりにSpO2を採用している点が異なります。
                日本国内ではA-DROPの使用が示されますが、国際的な比較にはCURB-65が適しています。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">注意点と限界</h3>
              <div className="space-y-2 text-muted">
                <p>CURB-65は重症度の一指標であり、臨床判断を代替するものではありません。社会的因子（独居、認知症、経口摂取困難）や画像所見、酸素化も考慮してください。</p>
                <p>免疫不全患者、医療介護関連肺炎（NHCAP）、院内肺炎（HAP）には適用しないでください。</p>
                <p>若年患者では死亡率が過小評価される可能性があります。qSOFAやPSIとの併用も検討してください。</p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">よくある質問</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Q. 「Confusion」はどう評価しますか？</p>
                  <p className="text-muted mt-1">
                    Abbreviated Mental Test（AMT）スコアが8点以下、または新規に出現した見当識障害（時・場所・人の認識障害）で判定します。
                    従来のGCSではなくAMTが原著で使用されています。
                  </p>
                </div>
                <div>
                  <p className="font-medium">Q. BUNとクレアチニン、どちらを使いますか？</p>
                  <p className="text-muted mt-1">
                    CURB-65ではBUN（血中尿素窒素）を使用します。基準値は &gt;20 mg/dL（&gt;7 mmol/L）です。
                    クレアチニンではありませんのでご注意ください。
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
