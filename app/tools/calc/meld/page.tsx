'use client'

import { useState, useMemo } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { NumberInput, SelectInput } from '@/components/tools/InputFields'
import { getToolBySlug, implementedTools, categoryLabels, categoryIcons } from '@/lib/tools-config'

const toolDef = getToolBySlug('meld')!

function calcMELD(bilirubin: number, creatinine: number, inr: number, dialysis: boolean): number {
  // MELD(i) = 0.957 × ln(Cr) + 0.378 × ln(Bil) + 1.120 × ln(INR) + 0.643
  // multiply by 10, round
  // If dialysis ≥2x/week or CVVHD within past week → Cr = 4.0
  let cr = creatinine
  if (dialysis) cr = 4.0
  cr = Math.max(cr, 1.0)
  const bil = Math.max(bilirubin, 1.0)
  const inrVal = Math.max(inr, 1.0)

  const raw = 0.957 * Math.log(cr) + 0.378 * Math.log(bil) + 1.120 * Math.log(inrVal) + 0.643
  let meld = Math.round(raw * 10)
  meld = Math.max(6, Math.min(40, meld))
  return meld
}

function calcMELD3(bilirubin: number, creatinine: number, inr: number, sodium: number, albumin: number, isFemale: boolean, dialysis: boolean): number {
  // MELD 3.0 (2022)
  // 1.33 (if female) + 4.56 × ln(Bil) + 0.82 × (137 - Na) - 0.24 × (137 - Na) × ln(Bil) + 9.09 × ln(INR) + 11.14 × ln(Cr) + 1.85 × (3.5 - Alb) - 1.83 × (3.5 - Alb) × ln(Cr) + 6
  let cr = creatinine
  if (dialysis) cr = 3.0
  cr = Math.max(cr, 1.0)
  cr = Math.min(cr, 3.0)
  const bil = Math.max(bilirubin, 1.0)
  const inrVal = Math.max(inr, 1.0)
  const na = Math.max(125, Math.min(137, sodium))
  const alb = Math.max(1.5, Math.min(3.5, albumin))

  const raw =
    (isFemale ? 1.33 : 0) +
    4.56 * Math.log(bil) +
    0.82 * (137 - na) -
    0.24 * (137 - na) * Math.log(bil) +
    9.09 * Math.log(inrVal) +
    11.14 * Math.log(cr) +
    1.85 * (3.5 - alb) -
    1.83 * (3.5 - alb) * Math.log(cr) +
    6

  let meld3 = Math.round(raw)
  meld3 = Math.max(6, Math.min(40, meld3))
  return meld3
}

function getMortality(meld: number): { text: string; severity: 'ok' | 'wn' | 'dn'; mortality3m: string } {
  if (meld <= 9) return { text: '低リスク', severity: 'ok', mortality3m: '1.9%' }
  if (meld <= 19) return { text: '中リスク', severity: 'wn', mortality3m: '6.0%' }
  if (meld <= 29) return { text: '高リスク', severity: 'wn', mortality3m: '19.6%' }
  if (meld <= 39) return { text: '非常に高リスク', severity: 'dn', mortality3m: '52.6%' }
  return { text: '最重症', severity: 'dn', mortality3m: '71.3%' }
}

export default function MELDPage() {
  const [bilirubin, setBilirubin] = useState('2.5')
  const [creatinine, setCreatinine] = useState('1.5')
  const [inr, setInr] = useState('1.8')
  const [sodium, setSodium] = useState('132')
  const [albumin, setAlbumin] = useState('2.8')
  const [sex, setSex] = useState<'male' | 'female'>('male')
  const [dialysis, setDialysis] = useState(false)

  const result = useMemo(() => {
    const bil = parseFloat(bilirubin)
    const cr = parseFloat(creatinine)
    const inrVal = parseFloat(inr)
    const na = parseFloat(sodium)
    const alb = parseFloat(albumin)

    if (isNaN(bil) || isNaN(cr) || isNaN(inrVal) || bil <= 0 || cr <= 0 || inrVal <= 0) {
      return null
    }

    const meld = calcMELD(bil, cr, inrVal, dialysis)
    const mort = getMortality(meld)

    const hasMeld3Inputs = !isNaN(na) && !isNaN(alb) && na > 0 && alb > 0
    const meld3 = hasMeld3Inputs ? calcMELD3(bil, cr, inrVal, na, alb, sex === 'female', dialysis) : null

    return { meld, meld3, ...mort }
  }, [bilirubin, creatinine, inr, sodium, albumin, sex, dialysis])

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
            name: 'MELD スコア計算',
            description: toolDef.description,
            url: 'https://iwor.jp/tools/meld',
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
              { '@type': 'ListItem', position: 3, name: 'MELD スコア', item: 'https://iwor.jp/tools/meld' },
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
                name: 'MELDスコアとは何ですか？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'MELDスコアは末期肝疾患の重症度を数値で評価するスコアリングシステムです。ビリルビン・クレアチニン・INRの3つの検査値から算出され、肝移植の優先順位決定に国際的に使用されています。',
                },
              },
              {
                '@type': 'Question',
                name: 'MELD 3.0とは？',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'MELD 3.0は2022年にUNOSが導入した改良版で、従来のMELDにナトリウム・アルブミン・性別を加えた6変数で計算します。女性の低評価問題を是正し、より公平な臓器配分を目指しています。',
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
          { text: 'Kamath PS, et al. A model to predict survival in patients with end-stage liver disease. Hepatology. 2001;33(2):464-470. PMID: 11172350', url: 'https://pubmed.ncbi.nlm.nih.gov/11172350/' },
          { text: 'Kim WR, et al. MELD 3.0: The Model for End-Stage Liver Disease Updated for the Modern Era. Gastroenterology. 2021;161(6):1887-1895.e4. PMID: 34481845', url: 'https://pubmed.ncbi.nlm.nih.gov/34481845/' },
          { text: 'Wiesner R, et al. Model for end-stage liver disease (MELD) and allocation of donor livers. Gastroenterology. 2003;124(1):91-96. PMID: 12512033', url: 'https://pubmed.ncbi.nlm.nih.gov/12512033/' },
        ]}
        result={
          result ? (
            <div className="space-y-3">
              <ResultCard
                label="MELD スコア"
                value={result.meld}
                unit="/ 40点"
                interpretation={`${result.text} — 3ヶ月死亡率 ${result.mortality3m}`}
                severity={result.severity}
              />
              <p className="text-[10px] text-muted px-1">3ヶ月死亡率: Wiesner R, et al. Gastroenterology 2003; PMID: 12512033</p>

              {result.meld3 !== null && (
                <div className="bg-s0 border border-br rounded-xl p-4">
                  <p className="text-sm font-medium text-tx mb-1">MELD 3.0 スコア</p>
                  <p className="text-2xl font-bold text-ac">{result.meld3}</p>
                  <p className="text-xs text-muted mt-1">
                    2022年UNOS採用の改良版。Na・Alb・性別を加味し、より公平な評価を行います。
                  </p>
                </div>
              )}

              {result.meld >= 15 && (
                <div className={`${result.meld >= 25 ? 'bg-dnl border-dnb' : 'bg-wnl border-wnb'} border rounded-xl p-4`}>
                  <p className={`text-sm font-medium ${result.meld >= 25 ? 'text-dn' : 'text-wn'}`}>
                    {result.meld >= 25 ? '⚠️ 肝移植の早急な評価が必要' : '⚡ 肝移植センターへの紹介を検討'}
                  </p>
                  <p className={`text-xs mt-1 ${result.meld >= 25 ? 'text-dn' : 'text-wn'}`}>
                    {result.meld >= 25
                      ? 'MELD ≥25 は3ヶ月死亡率が高く、早急に移植リストへの登録を検討してください。'
                      : 'MELD 15-24 は移植のベネフィットが認められる範囲です。肝臓専門施設への紹介を検討してください。'}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-s0 border border-br rounded-xl p-4 text-center">
              <p className="text-sm text-muted">ビリルビン・クレアチニン・INRを入力してください</p>
            </div>
          )
        }
        explanation={
          <div className="space-y-6 text-sm text-tx leading-relaxed">
            <div>
              <h2 className="text-lg font-bold mb-2">MELDスコアとは</h2>
              <p className="text-muted">
                MELD（Model for End-Stage Liver Disease）スコアは、末期肝疾患患者の短期予後を予測するために開発された連続変数スコアです。
                2002年よりUNOS（全米臓器配分ネットワーク）で肝移植の優先順位決定に採用されています。
                ビリルビン、クレアチニン、PT-INRの3つの客観的検査値から算出され、6〜40点の範囲を取ります。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">計算式</h3>
              <div className="bg-s0 border border-br rounded-lg p-3">
                <p className="text-xs font-mono text-muted">
                  MELD = 10 × [0.957 × ln(Cr) + 0.378 × ln(Bil) + 1.120 × ln(INR) + 0.643]
                </p>
                <p className="text-xs text-muted mt-2">
                  ※ 各値の下限は1.0。透析患者はCr = 4.0。スコアは6〜40の範囲にクランプ。
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">MELD 3.0（2022年改訂版）</h3>
              <p className="text-muted">
                2022年にUNOSが採用した改良版です。従来のMELDでは女性が低く評価される傾向がありましたが、
                MELD 3.0では性別補正（女性+1.33）、血清Na、アルブミンを追加し、より公平な臓器配分を実現しています。
                Na・Alb・性別を入力すると自動的にMELD 3.0も表示されます。
              </p>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">スコアと予後の目安</h3>
              <div className="space-y-2 text-muted">
                <p><span className="font-medium text-tx">≤9点：</span>3ヶ月死亡率 1.9%。外来経過観察。</p>
                <p><span className="font-medium text-tx">10-19点：</span>3ヶ月死亡率 6.0%。移植の適応を検討開始。</p>
                <p><span className="font-medium text-tx">20-29点：</span>3ヶ月死亡率 19.6%。移植リスト登録を検討。</p>
                <p><span className="font-medium text-tx">30-39点：</span>3ヶ月死亡率 52.6%。緊急移植を検討。</p>
                <p><span className="font-medium text-tx">40点：</span>3ヶ月死亡率 71.3%。最重症。</p>
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold mb-2">よくある質問</h3>
              <div className="space-y-3">
                <div>
                  <p className="font-medium">Q. 透析患者のクレアチニン値はどう扱いますか？</p>
                  <p className="text-muted mt-1">
                    週2回以上の透析を受けている場合、またはCVVHDを施行した場合はCr = 4.0として計算します。
                    MELD 3.0ではCr = 3.0がキャップ値として使用されます。
                  </p>
                </div>
                <div>
                  <p className="font-medium">Q. Child-Pugh分類との違いは？</p>
                  <p className="text-muted mt-1">
                    Child-Pughは3段階のカテゴリ分類で臨床判断に適しますが、主観的要素（脳症・腹水）が含まれます。
                    MELDは客観的検査値のみで算出される連続変数のため、移植の優先順位決定など公平な比較に優れています。
                  </p>
                </div>
              </div>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          {/* 必須3項目 */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">必須項目</p>
            <NumberInput
              id="meld-bilirubin"
              label="血清ビリルビン"
              unit="mg/dL"
              value={bilirubin}
              onChange={setBilirubin}
              hint="例: 2.5"
              min={0.1}
              max={50}
              step={0.1}
            />
            <NumberInput
              id="meld-creatinine"
              label="血清クレアチニン"
              unit="mg/dL"
              value={creatinine}
              onChange={setCreatinine}
              hint="例: 1.2"
              min={0.1}
              max={15}
              step={0.1}
            />
            <NumberInput
              id="meld-inr"
              label="PT-INR"
              unit=""
              value={inr}
              onChange={setInr}
              hint="例: 1.5"
              min={0.1}
              max={20}
              step={0.1}
            />
          </div>

          {/* 透析 */}
          <label className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors ${
            dialysis ? 'border-ac bg-acl' : 'border-br bg-s0 hover:border-muted'
          }`}>
            <input
              type="checkbox"
              checked={dialysis}
              onChange={e => setDialysis(e.target.checked)}
              className="sr-only"
            />
            <span className={`flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
              dialysis ? 'border-ac bg-ac' : 'border-muted'
            }`}>
              {dialysis && <span className="text-white text-xs">✓</span>}
            </span>
            <span className="flex-1">
              <span className="text-sm text-tx">透析（週2回以上）またはCVVHD</span>
              <span className="block text-xs text-muted">該当する場合 Cr = 4.0 で計算</span>
            </span>
          </label>

          {/* MELD 3.0 追加項目 */}
          <div className="space-y-3 border-t border-br pt-4">
            <p className="text-xs font-medium text-muted uppercase tracking-wide">MELD 3.0 追加項目（任意）</p>
            <NumberInput
              id="meld-sodium"
              label="血清ナトリウム"
              unit="mEq/L"
              value={sodium}
              onChange={setSodium}
              hint="例: 138"
              min={100}
              max={160}
              step={1}
            />
            <NumberInput
              id="meld-albumin"
              label="血清アルブミン"
              unit="g/dL"
              value={albumin}
              onChange={setAlbumin}
              hint="例: 3.2"
              min={0.5}
              max={6}
              step={0.1}
            />
            <SelectInput
              id="meld-sex"
              label="性別"
              value={sex}
              onChange={v => setSex(v as 'male' | 'female')}
              options={[
                { value: 'male', label: '男性' },
                { value: 'female', label: '女性（+1.33点補正）' },
              ]}
            />
          </div>
        </div>
      </CalculatorLayout>
    </>
  )
}
