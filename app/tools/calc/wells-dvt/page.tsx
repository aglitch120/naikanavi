'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('wells-dvt')!

const criteria = [
  { id: 'cancer', label: '活動性の悪性腫瘍', sublabel: '治療中・6ヶ月以内・緩和治療中', points: 1 },
  { id: 'paralysis', label: '麻痺・不全麻痺・最近のギプス固定', sublabel: '下肢の不動化', points: 1 },
  { id: 'bedridden', label: '3日以上の臥床安静または12週以内の大手術', sublabel: '全身・局所麻酔下', points: 1 },
  { id: 'tenderness', label: '深部静脈走行に沿った圧痛', sublabel: 'Localized tenderness along deep venous system', points: 1 },
  { id: 'swelling', label: '下肢全体の腫脹', sublabel: 'Entire leg swollen', points: 1 },
  { id: 'calf', label: '腓腹部の左右差 >3cm', sublabel: '脛骨粗面の10cm下で計測', points: 1 },
  { id: 'edema', label: '圧痕性浮腫（患側のみ）', sublabel: 'Pitting edema（片側性）', points: 1 },
  { id: 'collateral', label: '表在静脈の側副血行路（怒張）', sublabel: '静脈瘤以外の表在静脈拡張', points: 1 },
  { id: 'prior', label: 'DVTの既往', sublabel: '過去の深部静脈血栓症', points: 1 },
  { id: 'alternative', label: 'DVT以外の診断の可能性が同等以上', sublabel: '蜂窩織炎・Baker嚢腫・筋損傷等', points: -2 },
]

function getInterpretation(score: number): { text: string; severity: 'ok' | 'wn' | 'dn'; probability: string; recommendation: string } {
  if (score <= 0) return {
    text: '低リスク',
    severity: 'ok',
    probability: '約5%',
    recommendation: 'D-dimer検査を施行。陰性ならDVTを除外可能。',
  }
  if (score <= 2) return {
    text: '中リスク',
    severity: 'wn',
    probability: '約17%',
    recommendation: 'D-dimer検査を施行。陽性なら下肢静脈エコーを施行。',
  }
  return {
    text: '高リスク',
    severity: 'dn',
    probability: '約53%',
    recommendation: '下肢静脈エコーを直接施行。陰性でも臨床的疑いが強ければ1週間後に再検。',
  }
}

function getDichotomousInterpretation(score: number): { text: string; severity: 'ok' | 'dn' } {
  if (score <= 1) return { text: 'DVT unlikely（≤1点）— D-dimer検査で除外可能', severity: 'ok' }
  return { text: 'DVT likely（≥2点）— 下肢静脈エコーを施行', severity: 'dn' }
}

export default function WellsDVTPage() {
  const [checked, setChecked] = useState<Record<string, boolean>>({})

  const result = useMemo(() => {
    const score = criteria.reduce((sum, c) => sum + (checked[c.id] ? c.points : 0), 0)
    const traditional = getInterpretation(score)
    const dichotomous = getDichotomousInterpretation(score)
    return { score, ...traditional, dichotomous }
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
            name: 'Wells DVT スコア計算',
            description: toolDef.description,
            url: 'https://iwor.jp/tools/wells-dvt',
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
              { '@type': 'ListItem', position: 3, name: 'Wells DVT スコア', item: 'https://iwor.jp/tools/wells-dvt' },
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
                name: 'Wells DVTスコアとは何ですか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Wells DVTスコアは深部静脈血栓症（DVT）の臨床的検査前確率を10項目で評価するスコアリングシステムです。D-dimer検査や下肢静脈エコーの適応判断に使用されます。',
                },
              },
              {
                '@type': 'Question',
                name: 'Wells DVTスコアで-2点の項目があるのはなぜ？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '「DVT以外の診断の可能性が同等以上」という項目は-2点です。蜂窩織炎やBaker嚢腫破裂など、他の鑑別診断が十分に考えられる場合はDVTの事前確率が低くなるため、減点されます。',
                },
              },
              {
                '@type': 'Question',
                name: 'D-dimer陰性ならDVTは否定できますか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Wells DVTスコアが低〜中リスク（またはDVT unlikely）でD-dimer陰性の場合、DVTの除外が可能です（陰性的中率 >99%）。高リスク群ではD-dimer陰性でもエコー検査が示されます。',
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
          { text: 'Wells PS, et al. Value of assessment of pretest probability of deep-vein thrombosis in clinical management. Lancet. 1997;350(9094):1795-1798. PMID: 9428249', url: 'https://pubmed.ncbi.nlm.nih.gov/9428249/' },
          { text: 'Wells PS, et al. Evaluation of D-dimer in the diagnosis of suspected deep-vein thrombosis. N Engl J Med. 2003;349(13):1227-1235. PMID: 14507948', url: 'https://pubmed.ncbi.nlm.nih.gov/14507948/' },
          { text: 'Defined approach to DVT rule out. Ann Intern Med. 2004;140(8):589-602. PMID: 15096330', url: 'https://pubmed.ncbi.nlm.nih.gov/15096330/' },
          { text: 'Defined clinical practice guideline: Diagnosis and management of DVT. J Thromb Haemost. 2018;16(7):1291-1303. PMID: 29709513', url: 'https://pubmed.ncbi.nlm.nih.gov/29709513/' },
        ]}
        result={
          <div className="space-y-3">
            <ResultCard
              label="Wells DVT スコア"
              value={result.score}
              unit="点"
              interpretation={`${result.text} — DVT確率 ${result.probability}`}
              severity={result.severity}
            />
            <p className="text-[10px] text-muted px-1">検査前確率: Wells PS, et al. Lancet 1997; PMID: 9428249</p>

            {/* 2段階モデル */}
            <div className={`${
              result.dichotomous.severity === 'dn' ? 'bg-dnl border-dnb' : 'bg-s0 border-br'
            } border rounded-xl p-4`}>
              <p className={`text-sm font-medium ${result.dichotomous.severity === 'dn' ? 'text-dn' : 'text-tx'}`}>
                📋 2段階モデル（Dichotomous）
              </p>
              <p className={`text-xs mt-1 ${result.dichotomous.severity === 'dn' ? 'text-dn' : 'text-muted'}`}>
                {result.dichotomous.text}
              </p>
            </div>

            {/* 参考アクション */}
            <div className={`${
              result.severity === 'dn' ? 'bg-dnl border-dnb' : result.severity === 'wn' ? 'bg-wnl border-wnb' : 'bg-s0 border-br'
            } border rounded-xl p-4`}>
              <p className={`text-sm font-medium ${
                result.severity === 'dn' ? 'text-dn' : result.severity === 'wn' ? 'text-wn' : 'text-tx'
              }`}>
                {result.severity === 'dn' ? '🚨' : '⚡'} 参考アクション
              </p>
              <p className={`text-xs mt-1 ${
                result.severity === 'dn' ? 'text-dn' : result.severity === 'wn' ? 'text-wn' : 'text-muted'
              }`}>
                {result.recommendation}
              </p>
            </div>
          </div>
        }
        explanation={
          <div className="space-y-6 text-sm text-tx leading-relaxed">
            <div>
              <h2 className="text-lg font-bold mb-2">Wells DVTスコアとは</h2>
              <p className="text-muted">
                Wells DVTスコアは、深部静脈血栓症（Deep Vein Thrombosis: DVT）の臨床的検査前確率を評価するスコアです。
                1997年にWellsらがLancet誌で発表し、現在も静脈血栓塞栓症（VTE）の診断アルゴリズムの中核を成しています。
                10項目の臨床所見・病歴からスコアを算出し、D-dimer検査や下肢静脈エコーの適応を判断します。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">評価モデル</h3>
              <div className="space-y-3 text-muted">
                <div>
                  <p className="font-medium text-tx">3段階モデル（Traditional）</p>
                  <p>≤0点: 低リスク（DVT確率 約5%）、1-2点: 中リスク（約17%）、≥3点: 高リスク（約53%）</p>
                </div>
                <div>
                  <p className="font-medium text-tx">2段階モデル（Dichotomous）— 一般的</p>
                  <p>≤1点: DVT unlikely → D-dimer施行。陰性ならDVT除外。≥2点: DVT likely → 下肢静脈エコー直接施行。</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">診断アルゴリズム</h3>
              <div className="bg-s0 border border-br rounded-lg p-3 text-xs text-muted space-y-1">
                <p>1. Wells DVTスコアを評価</p>
                <p>2. DVT unlikely（≤1点）→ D-dimer検査</p>
                <p className="pl-4">→ D-dimer 陰性 → DVT除外</p>
                <p className="pl-4">→ D-dimer 陽性 → 下肢静脈エコー</p>
                <p>3. DVT likely（≥2点）→ 下肢静脈エコー直接施行</p>
                <p className="pl-4">→ 陽性 → 抗凝固療法開始</p>
                <p className="pl-4">→ 陰性 → D-dimer施行 or 1週後再検</p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">Wells PE スコアとの違い</h3>
              <p className="text-muted">
                Wells DVTスコアは下肢DVTの診断に特化しています。肺塞栓症（PE）が疑われる場合は
                Wells PEスコアを使用してください。DVTとPEは静脈血栓塞栓症（VTE）として連続した病態であり、
                DVT確認後はPEの合併についても評価が必要です。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">注意点</h3>
              <div className="space-y-2 text-muted">
                <p>「DVT以外の診断の可能性が同等以上」（-2点）は主観的評価を含みます。蜂窩織炎、Baker嚢腫破裂、筋損傷、リンパ浮腫、表在性血栓性静脈炎などが鑑別に挙がります。</p>
                <p>上肢DVTには適用できません。上肢DVTが疑われる場合はエコー検査を直接施行してください。</p>
                <p>入院患者や術後患者では感度が低下する可能性があり、臨床的疑いが強ければスコアに関わらずエコー検査を施行してください。</p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">よくある質問</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Q. 腓腹部の左右差はどこで測定しますか？</p>
                  <p className="text-muted mt-1">
                    脛骨粗面の10cm下方で、両側の腓腹部周囲長を測定します。
                    患側が健側より3cm以上大きい場合に陽性と判定します。
                  </p>
                </div>
                <div>
                  <p className="font-medium">Q. 両側のDVTが疑われる場合は？</p>
                  <p className="text-muted mt-1">
                    Wells DVTスコアは片側性DVTの評価を前提としています。
                    両側の症状がある場合、より症状の強い側で評価してください。
                    ただし両側性DVTはIVC（下大静脈）血栓やMay-Thurner症候群など特殊な病態を示唆する場合があります。
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
              id={`wellsdvt-${c.id}`}
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
