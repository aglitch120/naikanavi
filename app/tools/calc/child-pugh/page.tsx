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
    text: 'Class C（重度・非代償性）',
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
        explanation={
          <div className="space-y-6 text-sm text-tx leading-relaxed">
            <div>
              <h2 className="text-lg font-bold mb-2">Child-Pugh分類とは</h2>
              <p className="text-muted">
                Child-Pugh分類は、肝硬変の重症度を5つの臨床・検査項目（肝性脳症、腹水、血清ビリルビン、血清アルブミン、PT-INR）で
                スコアリングし、3段階（A / B / C）に分類するシステムです。
                1973年にPughらが食道静脈瘤手術の予後予測のために発表し、現在も肝硬変診療の基本的な重症度評価として世界中で使用されています。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">スコアリング基準</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-muted border-collapse">
                  <thead>
                    <tr className="border-b border-br">
                      <th className="text-left py-2 pr-2 font-medium text-tx">項目</th>
                      <th className="text-center py-2 px-2 font-medium text-tx">1点</th>
                      <th className="text-center py-2 px-2 font-medium text-tx">2点</th>
                      <th className="text-center py-2 px-2 font-medium text-tx">3点</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-br/50">
                      <td className="py-2 pr-2 font-medium text-tx">脳症</td>
                      <td className="text-center py-2 px-2">なし</td>
                      <td className="text-center py-2 px-2">I〜II</td>
                      <td className="text-center py-2 px-2">III〜IV</td>
                    </tr>
                    <tr className="border-b border-br/50">
                      <td className="py-2 pr-2 font-medium text-tx">腹水</td>
                      <td className="text-center py-2 px-2">なし</td>
                      <td className="text-center py-2 px-2">軽度</td>
                      <td className="text-center py-2 px-2">中等度〜</td>
                    </tr>
                    <tr className="border-b border-br/50">
                      <td className="py-2 pr-2 font-medium text-tx">Bil (mg/dL)</td>
                      <td className="text-center py-2 px-2">&lt;2.0</td>
                      <td className="text-center py-2 px-2">2.0-3.0</td>
                      <td className="text-center py-2 px-2">&gt;3.0</td>
                    </tr>
                    <tr className="border-b border-br/50">
                      <td className="py-2 pr-2 font-medium text-tx">Alb (g/dL)</td>
                      <td className="text-center py-2 px-2">&gt;3.5</td>
                      <td className="text-center py-2 px-2">2.8-3.5</td>
                      <td className="text-center py-2 px-2">&lt;2.8</td>
                    </tr>
                    <tr>
                      <td className="py-2 pr-2 font-medium text-tx">PT-INR</td>
                      <td className="text-center py-2 px-2">&lt;1.7</td>
                      <td className="text-center py-2 px-2">1.7-2.3</td>
                      <td className="text-center py-2 px-2">&gt;2.3</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">分類と予後</h3>
              <div className="space-y-2 text-muted">
                <p><span className="font-medium text-tx">Class A（5-6点）：</span>代償性肝硬変。予後良好で、多くの手術に耐術可能。</p>
                <p><span className="font-medium text-tx">Class B（7-9点）：</span>中等度障害。手術リスクが上昇し、肝移植の評価を開始すべき段階。</p>
                <p><span className="font-medium text-tx">Class C（10-15点）：</span>非代償性肝硬変。待機手術は原則禁忌。肝移植が唯一の根治的治療。</p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">MELDスコアとの使い分け</h3>
              <p className="text-muted">
                Child-Pughは3段階のカテゴリ分類のため臨床現場での直感的な判断に優れます。
                一方MELDスコアは連続変数で算出されるため、移植待機リストの優先順位決定に適しています。
                現在の臨床実践では両者を併用し、Child-Pughで全体像を把握し、MELDで移植の緊急度を評価するのが一般的です。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">限界と注意点</h3>
              <div className="space-y-2 text-muted">
                <p>脳症と腹水の評価に主観的要素が含まれるため、評価者間のばらつきが生じる可能性があります。</p>
                <p>腎機能が含まれておらず、腎障害を伴う肝硬変ではMELDの併用が必須です。</p>
                <p>原発性胆汁性胆管炎（PBC）ではビリルビンのカットオフ値が異なる修正版が使われることがあります。</p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">よくある質問</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Q. Child-Pugh分類はどのような場面で使いますか？</p>
                  <p className="text-muted mt-1">
                    肝硬変の予後予測、手術適応の判断、肝移植の評価、薬剤投与量の調整に広く使用されます。
                    特に周術期リスク評価では必須のスコアです。
                  </p>
                </div>
                <div>
                  <p className="font-medium">Q. PTの評価にINRではなく秒延長を使う施設もありますか？</p>
                  <p className="text-muted mt-1">
                    はい。原著ではPT延長秒数が使われていましたが、現在はINRでの評価が主流です。
                    本ツールではINR基準を採用しています（&lt;1.7 / 1.7-2.3 / &gt;2.3）。
                  </p>
                </div>
                <div>
                  <p className="font-medium">Q. PBCやPSCでもこのスコアは使えますか？</p>
                  <p className="text-muted mt-1">
                    PBCやPSCでは胆汁うっ滞によりビリルビンが高値になりやすいため、修正Child-Pugh分類
                    （ビリルビンのカットオフを4/10に変更）が使われることがあります。
                    本ツールは標準版の基準値を使用しています。
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
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
