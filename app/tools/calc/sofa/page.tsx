'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('sofa')!

interface OrganSystem {
  id: string
  name: string
  icon: string
  options: { label: string; points: number }[]
}

const organs: OrganSystem[] = [
  {
    id: 'respiration',
    name: '呼吸器（PaO₂/FiO₂）',
    icon: '🫁',
    options: [
      { label: '≥400', points: 0 },
      { label: '<400', points: 1 },
      { label: '<300', points: 2 },
      { label: '<200（人工呼吸器下）', points: 3 },
      { label: '<100（人工呼吸器下）', points: 4 },
    ],
  },
  {
    id: 'coagulation',
    name: '凝固（血小板数 ×10³/μL）',
    icon: '🩸',
    options: [
      { label: '≥150', points: 0 },
      { label: '<150', points: 1 },
      { label: '<100', points: 2 },
      { label: '<50', points: 3 },
      { label: '<20', points: 4 },
    ],
  },
  {
    id: 'liver',
    name: '肝臓（ビリルビン mg/dL）',
    icon: '🫁',
    options: [
      { label: '<1.2', points: 0 },
      { label: '1.2〜1.9', points: 1 },
      { label: '2.0〜5.9', points: 2 },
      { label: '6.0〜11.9', points: 3 },
      { label: '≥12.0', points: 4 },
    ],
  },
  {
    id: 'cardiovascular',
    name: '循環器（低血圧 / 昇圧剤）',
    icon: '❤️',
    options: [
      { label: 'MAP ≥70 mmHg（昇圧剤なし）', points: 0 },
      { label: 'MAP <70 mmHg（昇圧剤なし）', points: 1 },
      { label: 'DOA ≤5 or DOB（any）', points: 2 },
      { label: 'DOA >5 or Ad/NAd ≤0.1', points: 3 },
      { label: 'DOA >15 or Ad/NAd >0.1', points: 4 },
    ],
  },
  {
    id: 'cns',
    name: '中枢神経（GCS）',
    icon: '🧠',
    options: [
      { label: 'GCS 15', points: 0 },
      { label: 'GCS 13-14', points: 1 },
      { label: 'GCS 10-12', points: 2 },
      { label: 'GCS 6-9', points: 3 },
      { label: 'GCS <6', points: 4 },
    ],
  },
  {
    id: 'renal',
    name: '腎臓（Cr mg/dL / 尿量）',
    icon: '💧',
    options: [
      { label: 'Cr <1.2', points: 0 },
      { label: 'Cr 1.2〜1.9', points: 1 },
      { label: 'Cr 2.0〜3.4', points: 2 },
      { label: 'Cr 3.5〜4.9 or 尿量 <500mL/日', points: 3 },
      { label: 'Cr ≥5.0 or 尿量 <200mL/日', points: 4 },
    ],
  },
]

function getInterpretation(score: number): { text: string; severity: 'ok' | 'wn' | 'dn'; mortality: string } {
  if (score <= 1) return { text: '臓器障害なし〜軽微', severity: 'ok', mortality: '<3%' }
  if (score <= 6) return { text: '軽度〜中等度の臓器障害', severity: 'wn', mortality: '<10%' }
  if (score <= 9) return { text: '中等度の臓器障害', severity: 'wn', mortality: '15-20%' }
  if (score <= 12) return { text: '重度の臓器障害', severity: 'dn', mortality: '40-50%' }
  return { text: '非常に重度の臓器障害', severity: 'dn', mortality: '>80%' }
}

export default function SOFAPage() {
  const [selected, setSelected] = useState<Record<string, number>>({
    respiration: 0,
    coagulation: 0,
    liver: 0,
    cardiovascular: 0,
    cns: 0,
    renal: 0,
  })

  const result = useMemo(() => {
    const score = Object.entries(selected).reduce((sum, [id, optIndex]) => {
      const organ = organs.find(o => o.id === id)!
      return sum + organ.options[optIndex].points
    }, 0)
    const organScores = Object.entries(selected).map(([id, optIndex]) => {
      const organ = organs.find(o => o.id === id)!
      return { name: organ.name, icon: organ.icon, points: organ.options[optIndex].points }
    })
    return { score, organScores, ...getInterpretation(score) }
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
            name: 'SOFA スコア計算',
            description: toolDef.description,
            url: 'https://iwor.jp/tools/sofa',
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
              { '@type': 'ListItem', position: 3, name: 'SOFA スコア', item: 'https://iwor.jp/tools/sofa' },
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
                name: 'SOFAスコアとは何ですか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'SOFA（Sequential Organ Failure Assessment）スコアは6つの臓器系（呼吸・凝固・肝臓・循環・神経・腎臓）の障害度を各0-4点で評価するスコアです。Sepsis-3の定義では、感染症が疑われSOFAがベースラインから2点以上上昇した場合に敗血症と診断します。',
                },
              },
              {
                '@type': 'Question',
                name: 'SOFAスコアとqSOFAの違いは？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'qSOFAは3項目のベッドサイドスクリーニング（検査不要）で、SOFAは6臓器系の詳細な評価（血液検査・血液ガスが必要）です。qSOFAで敗血症を疑った後にSOFAで臓器障害を定量化する流れが示されています。',
                },
              },
              {
                '@type': 'Question',
                name: 'SOFAスコアの「ベースラインからの変化」とは？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Sepsis-3の診断基準はSOFAの絶対値ではなく「ベースラインから2点以上の急性上昇」です。慢性疾患のある患者では、入院前の臓器機能をベースラインとして変化量を評価します。既往のない患者ではベースラインは0点と仮定します。',
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
          { text: 'Vincent JL, et al. The SOFA (Sepsis-related Organ Failure Assessment) score to describe organ dysfunction/failure. Intensive Care Med. 1996;22(7):707-710. PMID: 8844239', url: 'https://pubmed.ncbi.nlm.nih.gov/8844239/' },
          { text: 'Singer M, et al. The Third International Consensus Definitions for Sepsis and Septic Shock (Sepsis-3). JAMA. 2016;315(8):801-810. PMID: 26903338', url: 'https://pubmed.ncbi.nlm.nih.gov/26903338/' },
          { text: 'Ferreira FL, et al. Serial evaluation of the SOFA score to predict outcome in critically ill patients. JAMA. 2001;286(14):1754-1758. PMID: 11594901', url: 'https://pubmed.ncbi.nlm.nih.gov/11594901/' },
          { text: 'Evans L, et al. Surviving Sepsis Campaign: International Guidelines 2021. Intensive Care Med. 2021;47(11):1181-1247. PMID: 34599691', url: 'https://pubmed.ncbi.nlm.nih.gov/34599691/' },
        ]}
        result={
          <div className="space-y-3">
            <ResultCard
              label="SOFA スコア"
              value={result.score}
              unit="/ 24点"
              interpretation={`${result.text} — ICU死亡率 ${result.mortality}`}
              severity={result.severity}
            />
            <p className="text-[10px] text-muted px-1">死亡率: Ferreira FL, et al. JAMA 2001; PMID: 11594901</p>

            {/* 臓器別スコア */}
            <div className="bg-s0 border border-br rounded-xl p-4">
              <p className="text-sm font-medium text-tx mb-2">臓器別スコア</p>
              <div className="grid grid-cols-3 gap-2">
                {result.organScores.map(os => (
                  <div key={os.name} className="text-center">
                    <p className="text-lg">{os.icon}</p>
                    <p className={`text-sm font-bold ${os.points >= 3 ? 'text-dn' : os.points >= 2 ? 'text-wn' : 'text-tx'}`}>
                      {os.points}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {result.score >= 2 && (
              <div className="bg-wnl border border-wnb rounded-xl p-4">
                <p className="text-sm font-medium text-wn">⚡ Sepsis-3 診断基準</p>
                <p className="text-xs text-wn mt-1">
                  感染症（疑い含む）+ SOFAスコアがベースラインから≥2点上昇 → <span className="font-medium">敗血症</span>。
                  本スコアは現在値です。ベースラインとの差分が≥2かを確認してください。
                </p>
              </div>
            )}
          </div>
        }
        explanation={
          <div className="space-y-6 text-sm text-tx leading-relaxed">
            <div>
              <h2 className="text-lg font-bold mb-2">SOFAスコアとは</h2>
              <p className="text-muted">
                SOFA（Sequential Organ Failure Assessment）スコアは、ICU患者の臓器障害を定量的に評価するスコアです。
                1996年にVincentらがIntensive Care Medicine誌で発表しました。
                6つの臓器系（呼吸・凝固・肝臓・循環・中枢神経・腎臓）を各0-4点で評価し、合計0-24点で表されます。
                2016年のSepsis-3では、敗血症の診断基準として「感染症 + SOFAスコアのベースラインから2点以上の急性上昇」が定義されました。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">スコアリング基準</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[11px] text-muted border-collapse">
                  <thead>
                    <tr className="border-b border-br">
                      <th className="text-left py-1.5 pr-1 font-medium text-tx">臓器</th>
                      <th className="text-center py-1.5 px-1 font-medium text-tx">0</th>
                      <th className="text-center py-1.5 px-1 font-medium text-tx">1</th>
                      <th className="text-center py-1.5 px-1 font-medium text-tx">2</th>
                      <th className="text-center py-1.5 px-1 font-medium text-tx">3</th>
                      <th className="text-center py-1.5 px-1 font-medium text-tx">4</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-br/50">
                      <td className="py-1.5 pr-1 font-medium text-tx">P/F比</td>
                      <td className="text-center py-1.5 px-1">≥400</td>
                      <td className="text-center py-1.5 px-1">&lt;400</td>
                      <td className="text-center py-1.5 px-1">&lt;300</td>
                      <td className="text-center py-1.5 px-1">&lt;200*</td>
                      <td className="text-center py-1.5 px-1">&lt;100*</td>
                    </tr>
                    <tr className="border-b border-br/50">
                      <td className="py-1.5 pr-1 font-medium text-tx">Plt(×10³)</td>
                      <td className="text-center py-1.5 px-1">≥150</td>
                      <td className="text-center py-1.5 px-1">&lt;150</td>
                      <td className="text-center py-1.5 px-1">&lt;100</td>
                      <td className="text-center py-1.5 px-1">&lt;50</td>
                      <td className="text-center py-1.5 px-1">&lt;20</td>
                    </tr>
                    <tr className="border-b border-br/50">
                      <td className="py-1.5 pr-1 font-medium text-tx">Bil</td>
                      <td className="text-center py-1.5 px-1">&lt;1.2</td>
                      <td className="text-center py-1.5 px-1">1.2-1.9</td>
                      <td className="text-center py-1.5 px-1">2.0-5.9</td>
                      <td className="text-center py-1.5 px-1">6.0-11.9</td>
                      <td className="text-center py-1.5 px-1">≥12</td>
                    </tr>
                    <tr className="border-b border-br/50">
                      <td className="py-1.5 pr-1 font-medium text-tx">循環</td>
                      <td className="text-center py-1.5 px-1">正常</td>
                      <td className="text-center py-1.5 px-1">MAP&lt;70</td>
                      <td className="text-center py-1.5 px-1">DOA≤5</td>
                      <td className="text-center py-1.5 px-1">DOA&gt;5</td>
                      <td className="text-center py-1.5 px-1">DOA&gt;15</td>
                    </tr>
                    <tr className="border-b border-br/50">
                      <td className="py-1.5 pr-1 font-medium text-tx">GCS</td>
                      <td className="text-center py-1.5 px-1">15</td>
                      <td className="text-center py-1.5 px-1">13-14</td>
                      <td className="text-center py-1.5 px-1">10-12</td>
                      <td className="text-center py-1.5 px-1">6-9</td>
                      <td className="text-center py-1.5 px-1">&lt;6</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 pr-1 font-medium text-tx">Cr/尿量</td>
                      <td className="text-center py-1.5 px-1">&lt;1.2</td>
                      <td className="text-center py-1.5 px-1">1.2-1.9</td>
                      <td className="text-center py-1.5 px-1">2.0-3.4</td>
                      <td className="text-center py-1.5 px-1">3.5-4.9</td>
                      <td className="text-center py-1.5 px-1">≥5.0</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[10px] text-muted mt-1">* 人工呼吸器管理下。DOA=ドパミン(μg/kg/min), Ad=アドレナリン, NAd=ノルアドレナリン(μg/kg/min)</p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">よくある質問</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Q. SOFAスコアはどのくらいの頻度で評価しますか？</p>
                  <p className="text-muted mt-1">
                    ICUでは入室時と24時間ごとの評価が示されます。トレンドの変化（改善 or 悪化）が予後予測に重要です。
                    初日からの改善は良好な予後と関連します（Ferreira FL, et al. JAMA 2001; PMID: 11594901）。
                  </p>
                </div>
                <div>
                  <p className="font-medium">Q. P/F比が測定できない場合は？</p>
                  <p className="text-muted mt-1">
                    SpO₂/FiO₂比で代用可能です。SpO₂/FiO₂ 235 ≈ PaO₂/FiO₂ 200、SpO₂/FiO₂ 315 ≈ PaO₂/FiO₂ 300 が
                    おおよその換算値です。
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-5">
          {organs.map(organ => (
            <div key={organ.id} className="space-y-1.5">
              <p className="text-sm font-medium text-tx">{organ.icon} {organ.name}</p>
              <div className="space-y-1">
                {organ.options.map((option, optIdx) => (
                  <label
                    key={optIdx}
                    className={`flex items-center gap-3 rounded-lg border px-3 py-2 cursor-pointer transition-colors ${
                      selected[organ.id] === optIdx
                        ? 'border-ac bg-acl'
                        : 'border-br bg-s0 hover:border-muted'
                    }`}
                  >
                    <input
                      type="radio"
                      name={organ.id}
                      value={optIdx}
                      checked={selected[organ.id] === optIdx}
                      onChange={() => setSelected(prev => ({ ...prev, [organ.id]: optIdx }))}
                      className="sr-only"
                    />
                    <span className={`flex-shrink-0 w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selected[organ.id] === optIdx ? 'border-ac' : 'border-muted'
                    }`}>
                      {selected[organ.id] === optIdx && (
                        <span className="w-2 h-2 rounded-full bg-ac" />
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
