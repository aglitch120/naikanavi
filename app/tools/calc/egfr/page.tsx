'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, RadioGroup } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools } from '@/lib/tools-config'
import { categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('egfr')!

// CKD-EPI 2021（人種係数廃止版）+ 日本人係数 0.813
function calculateEgfr(cr: number, age: number, sex: 'male' | 'female'): number {
  // CKD-EPI 2021 (Inker et al. NEJM 2021)
  // eGFR = 142 × min(Cr/κ, 1)^α × max(Cr/κ, 1)^(-1.200) × 0.9938^age × (sex factor)
  // Female: κ=0.7, α=-0.241, sex factor=1.012
  // Male:   κ=0.9, α=-0.302, sex factor=1.000
  const kappa = sex === 'female' ? 0.7 : 0.9
  const alpha = sex === 'female' ? -0.241 : -0.302
  const sexFactor = sex === 'female' ? 1.012 : 1.0

  const crKappa = cr / kappa
  const minVal = Math.min(crKappa, 1)
  const maxVal = Math.max(crKappa, 1)

  const egfr = 142 * Math.pow(minVal, alpha) * Math.pow(maxVal, -1.200) * Math.pow(0.9938, age) * sexFactor

  // 日本人係数
  const egfrJapanese = egfr * 0.813

  return egfrJapanese
}

// 日本腎臓学会 推算式（JSN）: eGFRcreat = 194 × Cr^(-1.094) × Age^(-0.287) (× 0.739 if female)
function calculateEgfrJsn(cr: number, age: number, sex: 'male' | 'female'): number {
  const base = 194 * Math.pow(cr, -1.094) * Math.pow(age, -0.287)
  return sex === 'female' ? base * 0.739 : base
}

function getCkdStage(egfr: number): { stage: string; label: string; severity: 'ok' | 'wn' | 'dn' } {
  if (egfr >= 90) return { stage: 'G1', label: '正常または高値', severity: 'ok' }
  if (egfr >= 60) return { stage: 'G2', label: '正常または軽度低下', severity: 'ok' }
  if (egfr >= 45) return { stage: 'G3a', label: '軽度〜中等度低下', severity: 'wn' }
  if (egfr >= 30) return { stage: 'G3b', label: '中等度〜高度低下', severity: 'wn' }
  if (egfr >= 15) return { stage: 'G4', label: '高度低下', severity: 'dn' }
  return { stage: 'G5', label: '末期腎不全（ESKD）', severity: 'dn' }
}

export default function EgfrPage() {
  const [cr, setCr] = useState('1.0')
  const [age, setAge] = useState('50')
  const [sex, setSex] = useState<string>('male')

  const result = useMemo(() => {
    const crVal = parseFloat(cr)
    const ageVal = parseInt(age)
    if (!crVal || crVal <= 0 || !ageVal || ageVal < 18 || ageVal > 120) return null

    const egfrCkdEpi = calculateEgfr(crVal, ageVal, sex as 'male' | 'female')
    const egfrJsn = calculateEgfrJsn(crVal, ageVal, sex as 'male' | 'female')
    const ckd = getCkdStage(egfrCkdEpi)

    return { egfrCkdEpi, egfrJsn, ckd }
  }, [cr, age, sex])

  const relatedTools = toolDef.relatedSlugs
    .map(slug => getToolBySlug(slug))
    .filter((t): t is NonNullable<typeof t> => t !== undefined && implementedTools.has(t.slug))
    .map(t => ({ slug: t.slug, name: t.name }))

  return (
    <>
      {/* 構造化データ */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'MedicalWebPage',
            name: 'eGFR計算ツール（CKD-EPI 2021）',
            description: toolDef.description,
            url: 'https://iwor.jp/tools/egfr',
            audience: { '@type': 'MedicalAudience', audienceType: 'Clinician' },
            medicalAudience: { '@type': 'MedicalAudience', audienceType: 'Clinician' },
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
              { '@type': 'ListItem', position: 3, name: 'eGFR計算', item: 'https://iwor.jp/tools/egfr' },
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
          {
            text: 'Inker LA, et al. New Creatinine- and Cystatin C-Based Equations to Estimate GFR without Race. N Engl J Med. 2021;385(19):1737-1749. PMID: 34554658',
            url: 'https://pubmed.ncbi.nlm.nih.gov/34554658/',
          },
          {
            text: 'Matsuo S, et al. Revised equations for estimated GFR from serum creatinine in Japan. Am J Kidney Dis. 2009;53(6):982-992. PMID: 19339088',
            url: 'https://pubmed.ncbi.nlm.nih.gov/19339088/',
          },
          {
            text: 'Horio M, et al. GFR estimation using standardized serum cystatin C in Japan. Am J Kidney Dis. 2013;61(2):197-203. PMID: 22892396',
            url: 'https://pubmed.ncbi.nlm.nih.gov/22892396/',
          },
          {
            text: 'KDIGO 2024 Clinical Practice Guideline for the Evaluation, Management, and Treatment of CKD. Kidney Int. 2024;105(4S):S117-S314. PMID: 38490803',
            url: 'https://pubmed.ncbi.nlm.nih.gov/38490803/',
          },
        ]}
        result={
          result && (
            <div className="space-y-3">
              <ResultCard
                label="eGFR（CKD-EPI 2021 × 日本人係数）"
                value={result.egfrCkdEpi.toFixed(1)}
                unit="mL/min/1.73m²"
                interpretation={`CKDステージ ${result.ckd.stage}: ${result.ckd.label}`}
                severity={result.ckd.severity}
                details={[
                  { label: 'JSN推算式（参考）', value: `${result.egfrJsn.toFixed(1)} mL/min/1.73m²` },
                ]}
              />

              {/* CKDステージ早見表 */}
              <div className="bg-s0 border border-br rounded-xl p-4">
                <p className="text-sm font-medium text-tx mb-2">CKDステージ早見表</p>
                <div className="space-y-1">
                  {[
                    { stage: 'G1', range: '≥90', label: '正常または高値' },
                    { stage: 'G2', range: '60-89', label: '正常または軽度低下' },
                    { stage: 'G3a', range: '45-59', label: '軽度〜中等度低下' },
                    { stage: 'G3b', range: '30-44', label: '中等度〜高度低下' },
                    { stage: 'G4', range: '15-29', label: '高度低下' },
                    { stage: 'G5', range: '<15', label: '末期腎不全' },
                  ].map(row => (
                    <div
                      key={row.stage}
                      className={`flex items-center text-xs px-2 py-1 rounded ${
                        result.ckd.stage === row.stage ? 'bg-acl font-semibold text-ac' : 'text-muted'
                      }`}
                    >
                      <span className="w-10 font-mono">{row.stage}</span>
                      <span className="w-16 tabular-nums">{row.range}</span>
                      <span>{row.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        }
        explanation={
          <div className="space-y-6 text-sm text-tx leading-relaxed">
            <div>
              <h2 className="text-lg font-bold mb-2">eGFR（推算糸球体濾過量）とは</h2>
              <p className="text-muted">
                eGFR（estimated Glomerular Filtration Rate）は、血清クレアチニン値から腎機能（糸球体濾過量）を推算する指標です。
                CKD（慢性腎臓病）のステージ分類やフォローアップ、薬剤の用量調整に広く用いられます。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">CKD-EPI 2021式について</h3>
              <p className="text-muted mb-2">
                2021年にInkerらがNEJMで発表したCKD-EPI 2021式は、従来の式から人種係数を廃止した改訂版です。
                本ツールでは、この国際標準式に日本人係数（0.813）を掛けた値を算出しています。
              </p>
              <p className="text-muted">
                参考値として、日本腎臓学会（JSN）の推算式（194 × Cr<sup>-1.094</sup> × Age<sup>-0.287</sup>）による結果も表示しています。
                日常診療では両者に大きな差はありませんが、学会発表や論文投稿時はどちらの式を用いたか明記してください。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">CKDステージ分類（KDIGO 2024）</h3>
              <p className="text-muted">
                CKDのステージはeGFRと尿蛋白（アルブミン尿）の2軸で分類されます。
                本ツールではeGFRに基づくGFRカテゴリ（G1〜G5）を判定しています。
                正確なCKDステージ評価には、3ヶ月以上持続する腎障害の確認とアルブミン尿区分（A1〜A3）の評価が必要です。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">使用上の注意</h3>
              <ul className="list-disc list-inside text-muted space-y-1">
                <li>18歳未満には適用できません（小児にはSchwartz式を使用）</li>
                <li>急性腎障害（AKI）では正確な推算ができません</li>
                <li>筋肉量が極端に多い/少ない場合（四肢切断、筋萎縮等）は誤差が大きくなります</li>
                <li>妊婦ではeGFRの解釈に注意が必要です</li>
                <li>薬剤の腎排泄量調整にはCockcroft-Gault式によるCCrが求められる場合があります</li>
              </ul>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">よくある質問</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Q. CKD-EPI式とJSN式、どちらを使えば良いですか？</p>
                  <p className="text-muted mt-1">
                    日本の日常診療ではどちらも使われています。
                    健診ではJSN式が多く用いられ、国際共同研究ではCKD-EPI式が標準です。
                    大きな差は生じませんが、一貫性のため同一患者では同じ式でフォローしましょう。
                  </p>
                </div>
                <div>
                  <p className="font-medium">Q. eGFRが低いと言われました。どうすれば良いですか？</p>
                  <p className="text-muted mt-1">
                    eGFR 60未満が3ヶ月以上続く場合、CKDと診断されます。
                    まずかかりつけ医に相談し、原因検索（尿検査、腎エコー等）と生活指導を受けてください。
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        {/* 入力フォーム */}
        <div className="space-y-4">
          <NumberInput
            id="cr"
            label="血清クレアチニン（Cr）"
            unit="mg/dL"
            hint="例: 0.8"
            value={cr}
            onChange={setCr}
            min={0.1}
            max={30}
            step={0.01}
          />

          <NumberInput
            id="age"
            label="年齢"
            unit="歳"
            hint="18〜120"
            value={age}
            onChange={setAge}
            min={18}
            max={120}
            step={1}
          />

          <RadioGroup
            name="sex"
            label="性別"
            value={sex}
            onChange={setSex}
            options={[
              { value: 'male', label: '男性' },
              { value: 'female', label: '女性' },
            ]}
          />
        </div>
      </CalculatorLayout>
    </>
  )
}
