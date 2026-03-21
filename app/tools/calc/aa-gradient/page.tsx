'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('aa-gradient')!

function calcAAGradient(fio2: number, pao2: number, paco2: number, patm: number = 760): {
  pao2Alveolar: number
  aaGradient: number
} {
  // PAO2 = FiO2 × (Patm - PH2O) - PaCO2 / R
  // PH2O = 47 mmHg, R = 0.8
  const pao2Alveolar = fio2 * (patm - 47) - paco2 / 0.8
  const aaGradient = pao2Alveolar - pao2
  return { pao2Alveolar: Math.round(pao2Alveolar * 10) / 10, aaGradient: Math.round(aaGradient * 10) / 10 }
}

function getExpectedGradient(age: number): number {
  // Expected A-a gradient = (Age + 10) / 4  (commonly used approximation)
  return Math.round((age + 10) / 4 * 10) / 10
}

function getInterpretation(gradient: number, expected: number): { text: string; severity: 'ok' | 'wn' | 'dn'; causes: string } {
  if (gradient <= expected) return {
    text: '正常範囲',
    severity: 'ok',
    causes: 'A-aDO₂正常の低酸素血症 → 肺胞低換気が原因。神経筋疾患、薬物中毒、中枢性呼吸抑制、高度肥満を鑑別。',
  }
  if (gradient <= expected + 10) return {
    text: '軽度開大',
    severity: 'wn',
    causes: '換気血流不均等（V/Q mismatch）を示唆。早期の肺疾患、軽度の肺塞栓、間質性肺疾患初期を鑑別。',
  }
  return {
    text: '著明な開大',
    severity: 'dn',
    causes: 'V/Q mismatch・シャント・拡散障害。肺炎、ARDS、肺塞栓、間質性肺疾患、心内シャントを鑑別。',
  }
}

export default function AAGradientPage() {
  const [age, setAge] = useState('50')
  const [fio2, setFio2] = useState('0.21')
  const [pao2, setPao2] = useState('80')
  const [paco2, setPaco2] = useState('40')

  const result = useMemo(() => {
    const a = parseFloat(age)
    const f = parseFloat(fio2)
    const po = parseFloat(pao2)
    const pc = parseFloat(paco2)
    if (isNaN(a) || isNaN(f) || isNaN(po) || isNaN(pc) || f <= 0 || f > 1 || po <= 0 || pc <= 0) return null

    const { pao2Alveolar, aaGradient } = calcAAGradient(f, po, pc)
    const expected = getExpectedGradient(a)
    return { pao2Alveolar, aaGradient, expected, ...getInterpretation(aaGradient, expected) }
  }, [age, fio2, pao2, paco2])

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
            name: 'A-aDO₂ 計算',
            description: toolDef.description,
            url: 'https://iwor.jp/tools/aa-gradient',
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
              { '@type': 'ListItem', position: 3, name: 'A-aDO₂', item: 'https://iwor.jp/tools/aa-gradient' },
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
                name: 'A-aDO₂とは何ですか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'A-aDO₂（肺胞気-動脈血酸素分圧較差）は、肺胞内のO₂分圧（PAO₂）と動脈血のO₂分圧（PaO₂）の差です。肺でのガス交換効率を評価し、低酸素血症の原因が肺胞低換気か肺実質の問題かを鑑別するのに重要です。',
                },
              },
              {
                '@type': 'Question',
                name: 'A-aDO₂の正常値は？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '年齢とともに上昇します。一般的な予測式は (年齢 + 10) / 4 で、若年成人では 5-15 mmHg、高齢者では 15-25 mmHg 程度が正常です。室内気（FiO₂ 0.21）での評価が基本です。',
                },
              },
              {
                '@type': 'Question',
                name: 'A-aDO₂が開大する疾患は？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '換気血流不均等（V/Q mismatch：肺炎、COPD）、シャント（ARDS、心内シャント）、拡散障害（間質性肺疾患）が原因です。一方、A-aDO₂が正常な低酸素血症は肺胞低換気（神経筋疾患、薬物中毒）を示唆します。',
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
          { text: 'Harris EA, et al. The normal alveolar-arterial oxygen-tension gradient in man. Clin Sci Mol Med. 1974;46(1):89-104. PMID: 4812393', url: 'https://pubmed.ncbi.nlm.nih.gov/4812393/' },
          { text: 'Kanber GJ, et al. The alveolar-arterial oxygen gradient in young and elderly men during air and oxygen breathing. Am Rev Respir Dis. 1968;97(3):376-381. PMID: 5638002', url: 'https://pubmed.ncbi.nlm.nih.gov/5638002/' },
          { text: 'Mellemgaard K. The alveolar-arterial oxygen difference: its size and components in normal man. Acta Physiol Scand. 1966;67(1):10-20. PMID: 5963295', url: 'https://pubmed.ncbi.nlm.nih.gov/5963295/' },
        ]}
        result={
          result ? (
            <div className="space-y-3">
              <ResultCard
                label="A-aDO₂"
                value={result.aaGradient}
                unit="mmHg"
                interpretation={result.text}
                severity={result.severity}
              />
              <p className="text-[10px] text-muted px-1">年齢予測値: (Age+10)/4。Harris EA, et al. Clin Sci 1974; PMID: 4812393</p>

              <div className="bg-s0 border border-br rounded-xl p-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div>
                    <p className="text-xs text-muted">PAO₂</p>
                    <p className="text-base font-bold text-tx">{result.pao2Alveolar}</p>
                    <p className="text-[10px] text-muted">mmHg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">A-aDO₂</p>
                    <p className={`text-base font-bold ${result.severity === 'ok' ? 'text-ac' : result.severity === 'wn' ? 'text-wn' : 'text-dn'}`}>
                      {result.aaGradient}
                    </p>
                    <p className="text-[10px] text-muted">mmHg</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">年齢予測値</p>
                    <p className="text-base font-bold text-tx">≤{result.expected}</p>
                    <p className="text-[10px] text-muted">mmHg</p>
                  </div>
                </div>
              </div>

              <div className={`${
                result.severity === 'dn' ? 'bg-dnl border-dnb' : result.severity === 'wn' ? 'bg-wnl border-wnb' : 'bg-s0 border-br'
              } border rounded-xl p-4`}>
                <p className={`text-sm font-medium ${
                  result.severity === 'dn' ? 'text-dn' : result.severity === 'wn' ? 'text-wn' : 'text-tx'
                }`}>
                  🔍 鑑別のポイント
                </p>
                <p className={`text-xs mt-1 ${
                  result.severity === 'dn' ? 'text-dn' : result.severity === 'wn' ? 'text-wn' : 'text-muted'
                }`}>
                  {result.causes}
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-s0 border border-br rounded-xl p-4 text-center">
              <p className="text-sm text-muted">年齢・FiO₂・PaO₂・PaCO₂を入力してください</p>
            </div>
          )
        }
        explanation={
          <div className="space-y-6 text-sm text-tx leading-relaxed">
            <div>
              <h2 className="text-lg font-bold mb-2">A-aDO₂とは</h2>
              <p className="text-muted">
                A-aDO₂（Alveolar-arterial oxygen gradient）は、肺胞内の酸素分圧（PAO₂）と動脈血の酸素分圧（PaO₂）の差です。
                この値が大きい（開大している）場合は肺でのガス交換に問題があることを示し、
                低酸素血症の原因が肺胞低換気（A-aDO₂正常）か肺実質の問題（A-aDO₂開大）かを鑑別する上で重要な指標です。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">計算式</h3>
              <div className="bg-s0 border border-br rounded-lg p-3 space-y-1">
                <p className="text-xs font-mono text-muted">PAO₂ = FiO₂ × (Patm − PH₂O) − PaCO₂ / R</p>
                <p className="text-xs font-mono text-muted">A-aDO₂ = PAO₂ − PaO₂</p>
                <p className="text-xs text-muted mt-2">
                  Patm = 760 mmHg（海面気圧）、PH₂O = 47 mmHg（37°C飽和水蒸気圧）、R = 0.8（呼吸商）
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">低酸素血症の鑑別フロー</h3>
              <div className="bg-s0 border border-br rounded-lg p-3 text-xs text-muted space-y-1">
                <p className="font-medium text-tx">低酸素血症（PaO₂低下）を認めたら：</p>
                <p>1. A-aDO₂を計算</p>
                <p>2. A-aDO₂ <span className="font-medium">正常</span> → 肺胞低換気が原因</p>
                <p className="pl-4">→ 神経筋疾患、薬物（オピオイド等）、中枢性、高度肥満</p>
                <p>3. A-aDO₂ <span className="font-medium">開大</span> → 肺実質の問題</p>
                <p className="pl-4">→ V/Q mismatch: 肺炎、COPD、肺塞栓</p>
                <p className="pl-4">→ シャント: ARDS、無気肺、心内シャント（100% O₂でも改善しない場合）</p>
                <p className="pl-4">→ 拡散障害: 間質性肺疾患、肺線維症</p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">よくある質問</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Q. 高濃度酸素下でA-aDO₂は使えますか？</p>
                  <p className="text-muted mt-1">
                    FiO₂が高いほどA-aDO₂は大きくなるため、室内気（FiO₂ 0.21）での評価が最も信頼性が高いです。
                    高濃度O₂下では吸収性無気肺の影響もあり解釈が難しくなります。
                    可能であれば室内気でのABGで評価してください。
                  </p>
                </div>
                <div>
                  <p className="font-medium">Q. 高地ではどうしますか？</p>
                  <p className="text-muted mt-1">
                    高地では大気圧（Patm）が低下するため、PAO₂も低下します。
                    本ツールは海面気圧（760 mmHg）で計算しています。高地での評価には現地の気圧値を使用する必要があります。
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <NumberInput id="aa-age" label="年齢" unit="歳" value={age} onChange={setAge} hint="例: 65" min={18} max={120} step={1} />
          <NumberInput id="aa-fio2" label="FiO₂" unit="（0.21 = 室内気）" value={fio2} onChange={setFio2} hint="例: 0.21" min={0.21} max={1.0} step={0.01} />
          <NumberInput id="aa-pao2" label="PaO₂" unit="mmHg" value={pao2} onChange={setPao2} hint="例: 75" min={1} max={600} step={1} />
          <NumberInput id="aa-paco2" label="PaCO₂" unit="mmHg" value={paco2} onChange={setPaco2} hint="例: 40" min={1} max={150} step={1} />
        </div>
      </CalculatorLayout>
    </>
  )
}
