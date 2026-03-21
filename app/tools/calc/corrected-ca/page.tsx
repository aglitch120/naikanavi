'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('corrected-ca')!

function getInterpretation(corrCa: number): { text: string; severity: 'ok' | 'wn' | 'dn' } {
  if (corrCa < 8.4) return { text: '低Ca血症', severity: 'dn' }
  if (corrCa <= 10.2) return { text: '正常範囲', severity: 'ok' }
  if (corrCa <= 12.0) return { text: '軽度高Ca血症', severity: 'wn' }
  if (corrCa <= 14.0) return { text: '中等度高Ca血症', severity: 'dn' }
  return { text: '重度高Ca血症（高Ca血症クリーゼ）', severity: 'dn' }
}

export default function CorrectedCaPage() {
  const [ca, setCa] = useState('8.5')
  const [alb, setAlb] = useState('3.0')

  const result = useMemo(() => {
    const caVal = parseFloat(ca)
    const albVal = parseFloat(alb)
    if (isNaN(caVal) || isNaN(albVal) || caVal <= 0 || albVal <= 0) return null

    // Payne式: 補正Ca = 実測Ca + 0.8 × (4.0 - Alb)
    const corrCa = caVal + 0.8 * (4.0 - albVal)
    const corrCaRound = Math.round(corrCa * 10) / 10
    const needsCorrection = albVal < 4.0
    return { corrCa: corrCaRound, rawCa: caVal, alb: albVal, needsCorrection, ...getInterpretation(corrCa) }
  }, [ca, alb])

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
            name: '補正Ca 計算',
            description: toolDef.description,
            url: 'https://iwor.jp/tools/corrected-ca',
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
              { '@type': 'ListItem', position: 3, name: '補正Ca', item: 'https://iwor.jp/tools/corrected-ca' },
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
                name: '補正Caとは何ですか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '血清カルシウムの約40%はアルブミンと結合しているため、低アルブミン血症では血清Ca値が見かけ上低下します。補正Ca（Payneの式）はアルブミン値で補正した真のCa濃度の推定値です。',
                },
              },
              {
                '@type': 'Question',
                name: 'Payneの式とは？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: '補正Ca (mg/dL) = 実測Ca + 0.8 × (4.0 - Alb) です。アルブミンが4.0 g/dLから1 g/dL低下するごとに、実測Caに0.8 mg/dLを加算します。日本ではこの式が最も広く使用されています。',
                },
              },
              {
                '@type': 'Question',
                name: 'イオン化Caとの違いは？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'イオン化Ca（iCa）は生理活性を持つCaの直接測定値で、最も正確です。補正Caは簡便な推定式ですが、重症患者・酸塩基異常・高グロブリン血症では誤差が大きくなるため、これらの状況ではiCa測定が示されます。',
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
          { text: 'Payne RB, et al. Interpretation of serum calcium in patients with abnormal serum proteins. Br Med J. 1973;4(5893):643-646. PMID: 4758544', url: 'https://pubmed.ncbi.nlm.nih.gov/4758544/' },
          { text: 'Bushinsky DA, Monk RD. Electrolyte quintet: Calcium. Lancet. 1998;352(9124):306-311. PMID: 9690425', url: 'https://pubmed.ncbi.nlm.nih.gov/9690425/' },
          { text: 'Dickerson RN, Alexander KH, Minard G, Croce MA, Brown RO. Accuracy of methods to estimate ionized and "corrected" serum calcium concentrations in critically ill multiple trauma patients receiving specialized nutrition support. JPEN J Parenter Enteral Nutr. 2004;28(3):133-141. PMID: 15141404', url: 'https://pubmed.ncbi.nlm.nih.gov/15141404/' },
        ]}
        result={
          result ? (
            <div className="space-y-3">
              <ResultCard
                label="補正Ca"
                value={result.corrCa}
                unit="mg/dL"
                interpretation={result.text}
                severity={result.severity}
              />
              <p className="text-[10px] text-muted px-1">Payne式: Payne RB, et al. Br Med J 1973; PMID: 4758544</p>

              <div className="bg-s0 border border-br rounded-xl p-4">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <p className="text-xs text-muted">実測Ca</p>
                    <p className="text-lg font-bold text-tx">{result.rawCa} <span className="text-xs font-normal">mg/dL</span></p>
                  </div>
                  <div>
                    <p className="text-xs text-muted">補正Ca</p>
                    <p className={`text-lg font-bold ${result.severity === 'ok' ? 'text-ac' : result.severity === 'wn' ? 'text-wn' : 'text-dn'}`}>
                      {result.corrCa} <span className="text-xs font-normal">mg/dL</span>
                    </p>
                  </div>
                </div>
                {result.needsCorrection ? (
                  <p className="text-xs text-wn mt-2 text-center">
                    Alb {result.alb} g/dL（&lt;4.0）→ 補正により +{Math.round((result.corrCa - result.rawCa) * 10) / 10} mg/dL
                  </p>
                ) : (
                  <p className="text-xs text-muted mt-2 text-center">
                    Alb ≥4.0 g/dL のため補正不要（実測Ca = 補正Ca）
                  </p>
                )}
              </div>

              {result.corrCa > 12.0 && (
                <div className="bg-dnl border border-dnb rounded-xl p-4">
                  <p className="text-sm font-medium text-dn">⚠️ {result.corrCa > 14.0 ? '高Ca血症クリーゼ — 緊急対応' : '中等度以上の高Ca血症'}</p>
                  <p className="text-xs text-dn mt-1">
                    {result.corrCa > 14.0
                      ? '生理食塩水による大量輸液 + カルシトニン ± ビスホスホネート。原因検索（PTH・PTHrP・VitD・悪性腫瘍）を並行して進めてください。'
                      : '生理食塩水輸液と原因検索（副甲状腺機能亢進症・悪性腫瘍・薬剤性等）を開始してください。'}
                  </p>
                </div>
              )}

              {result.corrCa < 8.4 && (
                <div className="bg-dnl border border-dnb rounded-xl p-4">
                  <p className="text-sm font-medium text-dn">⚠️ 低Ca血症</p>
                  <p className="text-xs text-dn mt-1">
                    症状（テタニー・痙攣・QT延長）の有無を確認。症候性低Ca血症ではグルコン酸Ca静注を検討。
                    原因検索（副甲状腺機能低下症・VitD欠乏・Mg欠乏・慢性腎臓病）を進めてください。
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-s0 border border-br rounded-xl p-4 text-center">
              <p className="text-sm text-muted">血清Ca値とアルブミン値を入力してください</p>
            </div>
          )
        }
        explanation={
          <div className="space-y-6 text-sm text-tx leading-relaxed">
            <div>
              <h2 className="text-lg font-bold mb-2">補正Caとは</h2>
              <p className="text-muted">
                血清総カルシウムの約40%はアルブミンと結合しています。低アルブミン血症（肝硬変、ネフローゼ症候群、低栄養など）では
                アルブミン結合Ca分が減少するため、血清Ca値が見かけ上低下します。
                補正Ca（Payneの式）はアルブミン値を用いてこの影響を補正し、真のカルシウム濃度を推定するものです。
                1973年にPayneらがBr Med J誌で発表しました（PMID: 4758544）。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">計算式</h3>
              <div className="bg-s0 border border-br rounded-lg p-3">
                <p className="text-xs font-mono text-muted">
                  補正Ca (mg/dL) = 実測Ca (mg/dL) + 0.8 × (4.0 − Alb [g/dL])
                </p>
                <p className="text-xs text-muted mt-2">
                  ※ Alb ≥ 4.0 g/dL の場合は補正不要（補正Ca = 実測Ca）
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">基準値と臨床的意義</h3>
              <div className="space-y-2 text-muted">
                <p><span className="font-medium text-tx">&lt;8.4 mg/dL：</span>低Ca血症。テタニー・Chvostek/Trousseau徴候・QT延長に注意。</p>
                <p><span className="font-medium text-tx">8.4-10.2 mg/dL：</span>正常範囲。</p>
                <p><span className="font-medium text-tx">10.2-12.0 mg/dL：</span>軽度高Ca血症。原因検索を開始。</p>
                <p><span className="font-medium text-tx">12.0-14.0 mg/dL：</span>中等度高Ca血症。輸液と原因検索。</p>
                <p><span className="font-medium text-tx">&gt;14.0 mg/dL：</span>高Ca血症クリーゼ。緊急対応が必要。</p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">Payneの式の限界</h3>
              <div className="bg-wnl border border-wnb rounded-lg p-3 text-sm text-wn">
                <p>
                  Payneの式は広く使用されていますが、ICU患者では精度が低下することが報告されています
                  （Dickerson RN, et al. JPEN 2004; PMID: 15141404）。
                  重症患者・酸塩基異常・高グロブリン血症ではイオン化Ca（iCa）の直接測定が示されます。
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">よくある質問</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Q. 日本の補正式は海外と違いますか？</p>
                  <p className="text-muted mt-1">
                    日本で広く使用されているのはPayneの式（係数0.8）です。一部の文献では係数1.0の式も見られますが、
                    Payneの原著論文に基づく0.8が国際的にも最も広く使用されています。
                  </p>
                </div>
                <div>
                  <p className="font-medium">Q. アルブミンが正常以上（&gt;4.0）の場合は？</p>
                  <p className="text-muted mt-1">
                    アルブミンが正常範囲以上の場合、補正の必要はありません。
                    本ツールではAlb ≥ 4.0の場合、補正Ca = 実測Caと表示します。
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-3">
          <NumberInput id="ca-total" label="血清Ca（総カルシウム）" unit="mg/dL" value={ca} onChange={setCa} hint="例: 8.2" min={1} max={20} step={0.1} />
          <NumberInput id="ca-alb" label="血清アルブミン" unit="g/dL" value={alb} onChange={setAlb} hint="例: 2.8" min={0.5} max={6} step={0.1} />
        </div>
      </CalculatorLayout>
    </>
  )
}
