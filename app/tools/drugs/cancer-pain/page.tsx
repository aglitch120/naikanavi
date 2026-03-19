'use client'

import { useState } from 'react'
import Link from 'next/link'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'

/* ── WHO除痛ラダー ── */
const WHO_LADDER = [
  {
    step: 1,
    title: '非オピオイド鎮痛薬',
    color: '#166534',
    bg: '#E8F0EC',
    pain: 'NRS 1〜3（軽度）',
    drugs: [
      { name: 'アセトアミノフェン', dose: '500〜1000mg × 3〜4回/日（最大4g/日）', note: '第一選択。肝障害に注意' },
      { name: 'NSAIDs（ロキソプロフェン等）', dose: '60mg × 3回/日', note: '腎障害・消化管出血リスクあり。骨転移痛に有効' },
      { name: 'セレコキシブ', dose: '100〜200mg × 2回/日', note: 'COX-2選択的。消化管リスク低い' },
    ],
    adjuvant: '鎮痛補助薬を適宜併用',
  },
  {
    step: 2,
    title: '弱オピオイド ± 非オピオイド',
    color: '#B45309',
    bg: '#FEF3C7',
    pain: 'NRS 4〜6（中等度）',
    drugs: [
      { name: 'トラマドール', dose: '25〜50mg × 4回/日（最大400mg/日）', note: 'セロトニン症候群リスクに注意。SNRI/SSRI併用注意' },
      { name: 'コデイン', dose: '20〜60mg × 4回/日', note: 'CYP2D6でモルヒネに変換。PM(代謝遅延型)では効果不十分' },
    ],
    adjuvant: '非オピオイド鎮痛薬を併用継続。鎮痛補助薬を適宜追加',
  },
  {
    step: 3,
    title: '強オピオイド ± 非オピオイド',
    color: '#991B1B',
    bg: '#FEE2E2',
    pain: 'NRS 7〜10（高度）',
    drugs: [
      { name: 'モルヒネ徐放錠', dose: '20〜60mg/日 分2 → 漸増', note: '腎機能低下時は代謝物蓄積に注意（M6G）' },
      { name: 'オキシコドン徐放錠', dose: '10〜40mg/日 分2 → 漸増', note: '腎障害時にモルヒネより安全。第一選択になりうる' },
      { name: 'フェンタニル貼付', dose: '12.5〜25μg/h → 漸増', note: '経口不可時。カヘキシア・発熱で吸収変動' },
      { name: 'ヒドロモルフォン', dose: '2〜4mg × 4〜6回/日', note: 'モルヒネの代替。腎障害時も比較的安全' },
    ],
    adjuvant: '非オピオイド併用。レスキュー設定必須',
  },
]

/* ── レスキュードーズ ── */
const RESCUE = {
  title: 'レスキュードーズ（臨時追加投与）',
  rules: [
    '定時薬1日量の10〜20%を1回量とする',
    '経口モルヒネ: 定時60mg/日 → レスキュー6〜12mg/回',
    '投与間隔: 経口 1時間以上、注射 15〜30分以上',
    '1日4回以上レスキュー使用 → 定時薬の増量を検討',
    'レスキュー使用回数・効果を毎日評価',
  ],
}

/* ── オピオイドローテーション ── */
const ROTATION = {
  title: 'オピオイドローテーション',
  indications: [
    '副作用が許容できない（嘔気・眠気・せん妄・便秘等）',
    '鎮痛効果不十分（増量しても疼痛コントロール不良）',
    '腎機能悪化（モルヒネ→オキシコドン/フェンタニル）',
    '経口投与困難（経口→貼付/注射）',
  ],
  notes: [
    '換算は等鎮痛用量の50〜75%から開始（交差耐性が不完全なため）',
    'フェンタニル貼付への変更時は12〜24時間のラグに注意',
    '詳細な換算 → オピオイド換算表を参照',
  ],
}

/* ── 鎮痛補助薬 ── */
const ADJUVANTS = [
  { type: '神経障害性疼痛', drugs: 'プレガバリン 25〜75mg → 最大600mg/日、デュロキセチン 20〜60mg/日、アミトリプチリン 10〜25mg 眠前' },
  { type: '骨転移痛', drugs: 'NSAIDs（有効率高い）、ゾレドロン酸/デノスマブ、放射線治療、ステロイド（脊髄圧迫時）' },
  { type: '消化管閉塞・腹部膨満', drugs: 'ブチルスコポラミン、オクトレオチド、デキサメタゾン' },
  { type: '頭蓋内圧亢進', drugs: 'デキサメタゾン 4〜16mg/日、グリセオール' },
  { type: 'けいれん性疼痛', drugs: 'ブチルスコポラミン、モルヒネ（内臓痛にも有効）' },
]

/* ── 副作用対策 ── */
const OPIOID_SE = [
  { se: '便秘', freq: 'ほぼ必発', action: 'オピオイド開始時から緩下薬併用（酸化Mg/センノシド/ナルデメジン）。耐性ができにくい' },
  { se: '嘔気・嘔吐', freq: '約30%', action: 'プロクロルペラジン or メトクロプラミド。1〜2週で耐性あり。改善しなければローテーション' },
  { se: '眠気', freq: '開始時・増量時', action: '数日で耐性あり。持続する場合は減量またはローテーション。他の原因（高Ca・脳転移等）除外' },
  { se: 'せん妄', freq: '高用量・高齢者', action: 'ハロペリドール/クエチアピン。ローテーション検討。脱水・感染・代謝異常の除外' },
  { se: '呼吸抑制', freq: 'まれ（適切な漸増なら）', action: 'ナロキソン 0.04〜0.08mg iv → 反応をみて追加。半減期がオピオイドより短いため再投与必要' },
]

export default function CancerPainPage() {
  const [openStep, setOpenStep] = useState<number | null>(null)

  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span>
        <Link href="/tools/drugs" className="hover:text-ac">薬剤ガイド</Link><span className="mx-2">›</span>
        <span>癌性疼痛コントロール</span>
      </nav>

      <header className="mb-8">
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">💊 薬剤ガイド</span>
            <h1 className="text-2xl font-bold text-tx mb-1">癌性疼痛コントロール</h1>
            <p className="text-sm text-muted">WHO除痛ラダー + レスキュー + ローテーション + 鎮痛補助薬</p>
          </div>
          <ProPulseHint>
            <FavoriteButton slug="drugs-cancer-pain" title="癌性疼痛コントロール" href="/tools/drugs/cancer-pain" type="drugs" />
          </ProPulseHint>
        </div>
      </header>

      {/* ── WHO除痛ラダー ── */}
      <section className="mb-10">
        <h2 className="text-lg font-bold text-tx mb-4">WHO 3段階除痛ラダー</h2>
        <div className="space-y-3">
          {WHO_LADDER.map(step => {
            const isOpen = openStep === step.step
            return (
              <div key={step.step} className="rounded-xl border overflow-hidden" style={{ borderColor: step.color + '33' }}>
                <button
                  onClick={() => setOpenStep(isOpen ? null : step.step)}
                  className="w-full flex items-center gap-3 p-4 text-left transition-colors"
                  style={{ background: isOpen ? step.bg : undefined }}
                >
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0" style={{ background: step.color }}>
                    {step.step}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-tx">{step.title}</h3>
                    <p className="text-[11px] text-muted">{step.pain}</p>
                  </div>
                  <span className="text-muted text-xs">{isOpen ? '▲' : '▼'}</span>
                </button>
                {isOpen && (
                  <div className="px-4 pb-4 border-t" style={{ borderColor: step.color + '22', background: step.bg }}>
                    <div className="space-y-2 mt-3">
                      {step.drugs.map((d, i) => (
                        <div key={i} className="bg-white/70 rounded-lg p-3">
                          <p className="text-xs font-bold text-tx">{d.name}</p>
                          <p className="text-[11px] text-ac mt-0.5">{d.dose}</p>
                          <p className="text-[11px] text-muted mt-0.5">{d.note}</p>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted mt-3">💡 {step.adjuvant}</p>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>


        {/* ── レスキュードーズ ── */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-tx mb-4">{RESCUE.title}</h2>
          <div className="bg-s0 border border-br rounded-xl p-4">
            <ul className="space-y-2">
              {RESCUE.rules.map((r, i) => (
                <li key={i} className="text-xs text-tx flex items-start gap-2">
                  <span className="text-ac font-bold mt-0.5">{i + 1}.</span>
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── ローテーション ── */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-tx mb-4">{ROTATION.title}</h2>
          <div className="bg-s0 border border-br rounded-xl p-4 mb-3">
            <h3 className="text-xs font-bold text-ac mb-2">適応</h3>
            <ul className="space-y-1">
              {ROTATION.indications.map((ind, i) => (
                <li key={i} className="text-xs text-tx flex items-start gap-2">
                  <span className="text-ac">•</span><span>{ind}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="bg-wnl border border-wnb rounded-xl p-4">
            <h3 className="text-xs font-bold text-wn mb-2">注意点</h3>
            <ul className="space-y-1">
              {ROTATION.notes.map((n, i) => (
                <li key={i} className="text-xs text-wn flex items-start gap-2">
                  <span>⚠️</span><span>{n}</span>
                </li>
              ))}
            </ul>
            <Link href="/tools/calc/opioid-conversion" className="text-xs text-ac font-bold mt-2 inline-block hover:underline">
              → オピオイド換算表を見る
            </Link>
          </div>
        </section>

        {/* ── 鎮痛補助薬 ── */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-tx mb-4">鎮痛補助薬</h2>
          <div className="space-y-2">
            {ADJUVANTS.map((a, i) => (
              <div key={i} className="bg-s0 border border-br rounded-xl p-3">
                <p className="text-xs font-bold text-ac mb-1">{a.type}</p>
                <p className="text-xs text-tx">{a.drugs}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── オピオイド副作用 ── */}
        <section className="mb-10">
          <h2 className="text-lg font-bold text-tx mb-4">オピオイド副作用対策</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-acl">
                  <th className="text-left p-2 font-bold text-ac border-b border-br">副作用</th>
                  <th className="text-left p-2 font-bold text-ac border-b border-br">頻度</th>
                  <th className="text-left p-2 font-bold text-ac border-b border-br">対策</th>
                </tr>
              </thead>
              <tbody>
                {OPIOID_SE.map((s, i) => (
                  <tr key={i} className="border-b border-br/50">
                    <td className="p-2 font-bold text-tx whitespace-nowrap">{s.se}</td>
                    <td className="p-2 text-muted whitespace-nowrap">{s.freq}</td>
                    <td className="p-2 text-tx">{s.action}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>


      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-3 mb-8 text-sm text-wn">
        ⚠️ 癌性疼痛の管理は緩和ケアチームとの連携が重要です。用量は個別に調整してください。
      </div>

      {/* 出典 */}
      <section className="text-xs text-muted space-y-1 mb-8">
        <h3 className="font-bold text-tx text-sm mb-2">参考文献</h3>
        <p>• WHO Guidelines for the pharmacological and radiotherapeutic management of cancer pain. 2018.</p>
        <p>• 日本緩和医療学会「がん疼痛の薬物療法に関するガイドライン」2020年版.</p>
        <p>• NCCN Guidelines: Adult Cancer Pain. 2024.</p>
      </section>
    </main>
  )
}
