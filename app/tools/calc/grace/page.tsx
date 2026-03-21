'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, SelectInput, CheckItem } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('grace')!

// GRACE 2.0 simplified risk score lookup tables (approximated)
// Original uses nonlinear regression; we use the published point-based system
function agePoints(age: number): number {
  if (age < 30) return 0
  if (age < 40) return 8
  if (age < 50) return 25
  if (age < 60) return 41
  if (age < 70) return 58
  if (age < 80) return 75
  if (age < 90) return 91
  return 100
}

function hrPoints(hr: number): number {
  if (hr < 50) return 0
  if (hr < 70) return 3
  if (hr < 90) return 9
  if (hr < 110) return 15
  if (hr < 150) return 24
  if (hr < 200) return 38
  return 46
}

function sbpPoints(sbp: number): number {
  if (sbp < 80) return 58
  if (sbp < 100) return 53
  if (sbp < 120) return 43
  if (sbp < 140) return 34
  if (sbp < 160) return 24
  if (sbp < 200) return 10
  return 0
}

function crPoints(cr: number): number {
  if (cr < 0.4) return 1
  if (cr < 0.8) return 4
  if (cr < 1.2) return 7
  if (cr < 1.6) return 10
  if (cr < 2.0) return 13
  if (cr < 4.0) return 21
  return 28
}

function killipPoints(killip: number): number {
  if (killip === 1) return 0
  if (killip === 2) return 20
  if (killip === 3) return 39
  return 59 // Killip IV
}

function getInHospitalMortality(score: number): { risk: string; severity: 'ok' | 'wn' | 'dn'; recommendation: string } {
  if (score <= 108) return {
    risk: '低リスク（院内死亡率 <1%）',
    severity: 'ok',
    recommendation: '標準的治療。早期の侵襲的戦略は必ずしも必要ないが、個別のリスク評価に基づき判断。',
  }
  if (score <= 140) return {
    risk: '中リスク（院内死亡率 1-3%）',
    severity: 'wn',
    recommendation: '早期の侵襲的戦略（24-72時間以内のCAG）を検討。抗血栓療法の強化も考慮。',
  }
  return {
    risk: '高リスク（院内死亡率 >3%）',
    severity: 'dn',
    recommendation: '緊急〜早期の侵襲的戦略（24時間以内のCAG）を強く検討。GPIIb/IIIa阻害薬の使用も検討。',
  }
}

export default function GRACEPage() {
  const [age, setAge] = useState('65')
  const [hr, setHr] = useState('85')
  const [sbp, setSbp] = useState('130')
  const [cr, setCr] = useState('1.2')
  const [killip, setKillip] = useState('1')
  const [stChange, setStChange] = useState(false)
  const [cardiacArrest, setCardiacArrest] = useState(false)
  const [elevatedMarkers, setElevatedMarkers] = useState(false)

  const result = useMemo(() => {
    const a = parseFloat(age)
    const h = parseFloat(hr)
    const s = parseFloat(sbp)
    const c = parseFloat(cr)
    const k = parseInt(killip)
    if (isNaN(a) || isNaN(h) || isNaN(s) || isNaN(c) || a <= 0 || h <= 0 || s <= 0 || c <= 0) return null

    const score =
      agePoints(a) +
      hrPoints(h) +
      sbpPoints(s) +
      crPoints(c) +
      killipPoints(k) +
      (stChange ? 28 : 0) +
      (cardiacArrest ? 39 : 0) +
      (elevatedMarkers ? 14 : 0)

    return { score, ...getInHospitalMortality(score) }
  }, [age, hr, sbp, cr, killip, stChange, cardiacArrest, elevatedMarkers])

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
            name: 'GRACE スコア計算',
            description: toolDef.description,
            url: 'https://iwor.jp/tools/grace',
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
              { '@type': 'ListItem', position: 3, name: 'GRACE スコア', item: 'https://iwor.jp/tools/grace' },
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
                name: 'GRACEスコアとは何ですか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'GRACE（Global Registry of Acute Coronary Events）スコアは、急性冠症候群（ACS）患者の院内死亡リスクおよび退院後6ヶ月死亡リスクを予測するスコアです。8つの臨床変数から算出され、ESCガイドラインでNSTE-ACSのリスク層別化と侵襲的治療の適応判断に示されています。',
                },
              },
              {
                '@type': 'Question',
                name: 'GRACEスコアで高リスクの場合はどうしますか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'GRACE >140（高リスク）では早期の侵襲的戦略（24時間以内の冠動脈造影）が強くとされています。抗血栓療法の強化（DAPT + 抗凝固薬）や循環補助の検討も必要です。',
                },
              },
              {
                '@type': 'Question',
                name: 'GRACE 2.0との違いは？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'GRACE 2.0はオリジナルのGRACEスコアを簡略化したもので、院内死亡と退院後1年・3年死亡を連続的に予測できます。本ツールはオリジナルの入院時GRACEスコア（院内死亡予測）を計算します。',
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
          { text: 'Granger CB, et al. Predictors of hospital mortality in the Global Registry of Acute Coronary Events. Arch Intern Med. 2003;163(19):2345-2353. PMID: 14581255', url: 'https://pubmed.ncbi.nlm.nih.gov/14581255/' },
          { text: 'Fox KA, et al. Prediction of risk of death and myocardial infarction in the six months after presentation with acute coronary syndrome: prospective multinational observational study (GRACE). BMJ. 2006;333(7578):1091. PMID: 17032691', url: 'https://pubmed.ncbi.nlm.nih.gov/17032691/' },
          { text: 'Collet JP, et al. 2020 ESC Guidelines for the management of acute coronary syndromes in patients presenting without persistent ST-segment elevation. Eur Heart J. 2021;42(14):1289-1367. PMID: 32860058', url: 'https://pubmed.ncbi.nlm.nih.gov/32860058/' },
          { text: 'Fox KA, et al. Should patients with acute coronary disease be stratified for management according to their risk? Derivation, external validation and outcomes using the updated GRACE risk score. BMJ Open. 2014;4(2):e004425. PMID: 24561498', url: 'https://pubmed.ncbi.nlm.nih.gov/24561498/' },
        ]}
        result={
          result ? (
            <div className="space-y-3">
              <ResultCard
                label="GRACE スコア"
                value={result.score}
                unit="点"
                interpretation={result.risk}
                severity={result.severity}
              />
              <p className="text-[10px] text-muted px-1">リスク層別化: Granger CB, et al. Arch Intern Med 2003; PMID: 14581255</p>

              <div className={`${
                result.severity === 'dn' ? 'bg-dnl border-dnb' : result.severity === 'wn' ? 'bg-wnl border-wnb' : 'bg-s0 border-br'
              } border rounded-xl p-4`}>
                <p className={`text-sm font-medium ${
                  result.severity === 'dn' ? 'text-dn' : result.severity === 'wn' ? 'text-wn' : 'text-tx'
                }`}>
                  {result.severity === 'dn' ? '🚨 ESC参照: 早期侵襲的戦略' : result.severity === 'wn' ? '⚡ 侵襲的戦略を検討' : '✅ 参考マネジメント'}
                </p>
                <p className={`text-xs mt-1 ${
                  result.severity === 'dn' ? 'text-dn' : result.severity === 'wn' ? 'text-wn' : 'text-muted'
                }`}>
                  {result.recommendation}
                </p>
                <p className="text-[10px] text-muted/70 mt-1">ESC NSTE-ACS Guidelines 2020; PMID: 32860058</p>
              </div>
            </div>
          ) : (
            <div className="bg-s0 border border-br rounded-xl p-4 text-center">
              <p className="text-sm text-muted">年齢・心拍数・収縮期血圧・クレアチニンを入力してください</p>
            </div>
          )
        }
        explanation={
          <div className="space-y-6 text-sm text-tx leading-relaxed">
            <div>
              <h2 className="text-lg font-bold mb-2">GRACEスコアとは</h2>
              <p className="text-muted">
                GRACE（Global Registry of Acute Coronary Events）スコアは、急性冠症候群（ACS）患者の
                短期・中期死亡リスクを予測するスコアリングシステムです。
                2003年にGrangerらがArch Intern Med誌で発表し、ESCガイドラインでNSTE-ACS（非ST上昇型ACS）の
                リスク層別化に示されています。8つの臨床変数（年齢、心拍数、収縮期血圧、クレアチニン、
                Killip分類、ST変化、心停止、心筋マーカー上昇）から算出されます。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">リスク層別と治療戦略（ESC 2020）</h3>
              <div className="space-y-2 text-muted">
                <p><span className="font-medium text-tx">≤108点（低リスク）：</span>院内死亡率 &lt;1%。保存的戦略も許容。非侵襲的評価で虚血を確認後、選択的CAGも可。</p>
                <p><span className="font-medium text-tx">109-140点（中リスク）：</span>院内死亡率 1-3%。24-72時間以内の侵襲的戦略（CAG）を検討。</p>
                <p><span className="font-medium text-tx">&gt;140点（高リスク）：</span>院内死亡率 &gt;3%。24時間以内の早期侵襲的戦略を強く検討。</p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">Killip分類</h3>
              <div className="space-y-1 text-muted text-xs">
                <p><span className="font-medium text-tx">Class I：</span>心不全徴候なし</p>
                <p><span className="font-medium text-tx">Class II：</span>軽度心不全（ラ音、III音、頸静脈怒張）</p>
                <p><span className="font-medium text-tx">Class III：</span>肺水腫</p>
                <p><span className="font-medium text-tx">Class IV：</span>心原性ショック</p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">よくある質問</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Q. STEMIにもGRACEスコアは使いますか？</p>
                  <p className="text-muted mt-1">
                    GRACEスコアは主にNSTE-ACSのリスク層別化に使用されます。STEMIでは再灌流療法（Primary PCI）の
                    適応が明確なため、GRACEスコアによるリスク層別化よりも時間（Door-to-Balloon time）が優先されます。
                    ただし退院後の予後評価にはSTEMI患者にも適用可能です。
                  </p>
                </div>
                <div>
                  <p className="font-medium">Q. TIMIスコアとの違いは？</p>
                  <p className="text-muted mt-1">
                    GRACEスコアはより多くの変数を使用し、連続変数として予測精度が高いとされています。
                    TIMIスコアは7項目で簡便ですが、ESCガイドラインではGRACEがより示されています。
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <div className="space-y-3">
            <NumberInput id="grace-age" label="年齢" unit="歳" value={age} onChange={setAge} hint="例: 68" min={18} max={120} step={1} />
            <NumberInput id="grace-hr" label="心拍数" unit="bpm" value={hr} onChange={setHr} hint="例: 88" min={20} max={300} step={1} />
            <NumberInput id="grace-sbp" label="収縮期血圧" unit="mmHg" value={sbp} onChange={setSbp} hint="例: 130" min={30} max={300} step={1} />
            <NumberInput id="grace-cr" label="血清クレアチニン" unit="mg/dL" value={cr} onChange={setCr} hint="例: 1.1" min={0.1} max={15} step={0.1} />
            <SelectInput
              id="grace-killip"
              label="Killip分類"
              value={killip}
              onChange={setKillip}
              options={[
                { value: '1', label: 'Class I — 心不全徴候なし' },
                { value: '2', label: 'Class II — 軽度心不全（ラ音・III音）' },
                { value: '3', label: 'Class III — 肺水腫' },
                { value: '4', label: 'Class IV — 心原性ショック' },
              ]}
            />
          </div>

          <div className="space-y-2 border-t border-br pt-4">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">追加所見</p>
            <CheckItem
              id="grace-st"
              label="ST変化（ST低下 or 一過性ST上昇）"
              sublabel="心電図上のST偏位"
              points={28}
              checked={stChange}
              onChange={setStChange}
            />
            <CheckItem
              id="grace-arrest"
              label="入院時心停止"
              sublabel="来院時または入院中の心停止"
              points={39}
              checked={cardiacArrest}
              onChange={setCardiacArrest}
            />
            <CheckItem
              id="grace-markers"
              label="心筋マーカー上昇"
              sublabel="トロポニン陽性 or CK-MB上昇"
              points={14}
              checked={elevatedMarkers}
              onChange={setElevatedMarkers}
            />
          </div>
        </div>
      </CalculatorLayout>
    </>
  )
}
