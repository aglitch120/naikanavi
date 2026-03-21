'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('wells-pe')!

const criteria = [
  { id: 'dvt', label: 'DVTの臨床徴候・症状', sublabel: '下肢腫脹・疼痛・圧痛', points: 3 },
  { id: 'alternative', label: 'PE以外の診断の可能性が低い', sublabel: '他の鑑別診断が考えにくい', points: 3 },
  { id: 'hr', label: '心拍数 >100 bpm', sublabel: '頻脈', points: 1.5 },
  { id: 'immobilization', label: '3日以上の臥床安静または4週以内の手術', sublabel: '長期臥床・近日の手術', points: 1.5 },
  { id: 'prior', label: 'DVT/PEの既往', sublabel: '過去の血栓塞栓症歴', points: 1.5 },
  { id: 'hemoptysis', label: '喀血', sublabel: 'Hemoptysis', points: 1 },
  { id: 'malignancy', label: '悪性腫瘍（治療中 or 6ヶ月以内 or 緩和治療中）', sublabel: 'Active malignancy', points: 1 },
]

function getInterpretation(score: number): { text: string; severity: 'ok' | 'wn' | 'dn'; probability: string; recommendation: string } {
  // Traditional 3-tier model
  if (score < 2) return {
    text: '低リスク',
    severity: 'ok',
    probability: '約3.6%',
    recommendation: 'D-dimer検査を施行。陰性ならPEを除外可能（PERC ruleも参照）。',
  }
  if (score <= 6) return {
    text: '中リスク',
    severity: 'wn',
    probability: '約20.5%',
    recommendation: 'D-dimer検査を施行。陽性なら造影CT（CTPA）を施行。',
  }
  return {
    text: '高リスク',
    severity: 'dn',
    probability: '約66.7%',
    recommendation: 'D-dimerを省略し造影CT（CTPA）を直接施行。不安定ならエコー・血栓溶解も検討。',
  }
}

function getDichotomousInterpretation(score: number): { text: string; severity: 'ok' | 'dn' } {
  if (score <= 4) return { text: 'PE unlikely（≤4点）— D-dimer検査で除外可能', severity: 'ok' }
  return { text: 'PE likely（>4点）— 造影CT（CTPA）を施行', severity: 'dn' }
}

export default function WellsPEPage() {
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
            name: 'Wells PE スコア計算',
            description: toolDef.description,
            url: 'https://iwor.jp/tools/wells-pe',
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
              { '@type': 'ListItem', position: 3, name: 'Wells PE スコア', item: 'https://iwor.jp/tools/wells-pe' },
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
                name: 'Wells PEスコアとは何ですか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Wells PEスコアは肺塞栓症（PE）の臨床的検査前確率を評価するスコアリングシステムです。7つの臨床項目をチェックし、低・中・高リスクの3群または PE unlikely/likely の2群に分類します。D-dimer検査やCTPA（造影CT）の適応判断に使用されます。',
                },
              },
              {
                '@type': 'Question',
                name: '3段階モデルと2段階モデルの違いは？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '3段階モデル（低・中・高リスク）は元来のWellsスコアで、2段階モデル（PE unlikely ≤4点 / PE likely >4点）は簡便版です。2段階モデルはD-dimer検査との組み合わせで広く使用されており、ESCガイドライン等で示されています。',
                },
              },
              {
                '@type': 'Question',
                name: 'D-dimerが陰性ならPEは否定できますか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'Wells PEスコアが低〜中リスク（またはPE unlikely）かつD-dimer陰性の場合、PEの除外が可能です（陰性的中率 >99%）。ただし高リスク群ではD-dimer陰性でもPEを完全に除外できないため、CTPAを施行すべきです。',
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
          { text: 'Wells PS, et al. Derivation of a simple clinical model to categorize patients probability of pulmonary embolism: increasing the models utility with the SimpliRED D-dimer. Thromb Haemost. 2000;83(3):416-420. PMID: 10744147', url: 'https://pubmed.ncbi.nlm.nih.gov/10744147/' },
          { text: 'Wells PS, et al. Excluding pulmonary embolism at the bedside without diagnostic imaging: management of patients with suspected pulmonary embolism presenting to the emergency department by using a simple clinical model and D-dimer. Ann Intern Med. 2001;135(2):98-107. PMID: 11453709', url: 'https://pubmed.ncbi.nlm.nih.gov/11453709/' },
          { text: 'Konstantinides SV, et al. 2019 ESC Guidelines for the diagnosis and management of acute pulmonary embolism. Eur Heart J. 2020;41(4):543-603. PMID: 31504429', url: 'https://pubmed.ncbi.nlm.nih.gov/31504429/' },
          { text: 'van Belle A, et al. Effectiveness of managing suspected pulmonary embolism using an algorithm combining clinical probability, D-dimer testing, and computed tomography. JAMA. 2006;295(2):172-179. PMID: 16403929', url: 'https://pubmed.ncbi.nlm.nih.gov/16403929/' },
        ]}
        result={
          <div className="space-y-3">
            <ResultCard
              label="Wells PE スコア"
              value={result.score}
              unit="点"
              interpretation={`${result.text} — PE確率 ${result.probability}`}
              severity={result.severity}
            />
            <p className="text-[10px] text-muted px-1">検査前確率: Wells PS, et al. Thromb Haemost 2000; PMID: 10744147</p>

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
              <h2 className="text-lg font-bold mb-2">Wells PEスコアとは</h2>
              <p className="text-muted">
                Wells PEスコアは、肺塞栓症（Pulmonary Embolism: PE）の臨床的検査前確率を評価するスコアリングシステムです。
                2000年にWellsらがThrombosis and Haemostasis誌で発表し、現在ESC/AHA/ACCPのガイドラインで示されています。
                7つの臨床項目を評価し、D-dimer検査やCTPA（造影CT肺動脈造影）の適応を判断します。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">評価モデル</h3>
              <div className="space-y-3 text-muted">
                <div>
                  <p className="font-medium text-tx">3段階モデル（Traditional）</p>
                  <p>&lt;2点: 低リスク（PE確率 約3.6%）、2-6点: 中リスク（約20.5%）、&gt;6点: 高リスク（約66.7%）</p>
                </div>
                <div>
                  <p className="font-medium text-tx">2段階モデル（Dichotomous）— ESC参照</p>
                  <p>≤4点: PE unlikely → D-dimer施行。陰性ならPE除外。&gt;4点: PE likely → CTPAを直接施行。</p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">診断アルゴリズム</h3>
              <div className="bg-s0 border border-br rounded-lg p-3 text-xs text-muted space-y-1">
                <p>1. Wells PEスコアを評価</p>
                <p>2. PE unlikely（≤4点）→ D-dimer検査</p>
                <p className="pl-4">→ D-dimer 陰性 → PE除外（追加検査不要）</p>
                <p className="pl-4">→ D-dimer 陽性 → CTPA施行</p>
                <p>3. PE likely（&gt;4点）→ CTPA直接施行</p>
                <p>4. 血行動態不安定 → 心エコー → 右心負荷あれば血栓溶解検討</p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">注意点</h3>
              <div className="space-y-2 text-muted">
                <p>「PE以外の診断の可能性が低い」（3点）は主観的判断を含むため、評価者間のばらつきが生じる可能性があります。</p>
                <p>妊婦、入院患者、高齢者ではD-dimerの偽陽性率が高く、年齢調整D-dimer（年齢×10 μg/L）の使用を検討してください。</p>
                <p>PERC rule（Pulmonary Embolism Rule-out Criteria）は低リスク群でのD-dimer省略に有用ですが、日本での検証は限定的です。</p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">よくある質問</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Q. Wells PEとGeneva scoreの違いは？</p>
                  <p className="text-muted mt-1">
                    両者ともPEの検査前確率を評価するスコアです。Geneva score（改訂版）はすべて客観的項目で構成されており主観的判断が不要ですが、
                    Wellsスコアの方が広く検証され使用されています。ESCガイドラインでは両方が示されています。
                  </p>
                </div>
                <div>
                  <p className="font-medium">Q. 1.5点の項目があるのはなぜですか？</p>
                  <p className="text-muted mt-1">
                    原著の多変量ロジスティック回帰分析で得られた係数を簡略化した結果です。
                    小数点を避けたい場合、全項目を2倍にした修正版（Modified Wells）も提案されていますが、
                    オリジナルの小数点版が最も広く検証されています。
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
              id={`wellspe-${c.id}`}
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
