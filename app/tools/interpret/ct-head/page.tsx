'use client'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import ProGate from '@/components/pro/ProGate'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'
import { trackToolUsage } from '@/components/pro/useProStatus'

type Sev = 'ok' | 'wn' | 'dn' | 'neutral'

const categories = [
  {
    key: 'Parenchyma', title: '脳実質',
    desc: '出血・梗塞・腫瘤・浮腫・萎縮',
    findings: [
      { id: 'brain_normal', label: '脳実質 異常なし', detail: '明らかな出血・梗塞・腫瘤を認めない。灰白質/白質のコントラスト正常。', severity: 'ok' as Sev },
      { id: 'ich', label: '脳内出血（ICH）', detail: '脳実質内の高吸収域。被殻出血（高血圧性、最多）・視床出血・小脳出血・脳幹出血・皮質下出血（CAA、AVM）を部位で鑑別。血腫量（ABC/2法）とヘルニア徴候を評価。', severity: 'dn' as Sev },
      { id: 'sah', label: 'くも膜下出血（SAH）', detail: 'くも膜下腔・脳槽の高吸収。脳動脈瘤破裂が80%。Fisher分類で血管攣縮リスクを評価。緊急3D-CTA→脳外科コンサルト。', severity: 'dn' as Sev },
      { id: 'sdh', label: '硬膜下血腫（SDH）', detail: '硬膜と脳表面の三日月型血腫。急性（高吸収）vs 慢性（低〜等吸収）。正中偏位 > 5mm or 血腫厚 > 10mmは手術適応。', severity: 'dn' as Sev },
      { id: 'edh', label: '硬膜外血腫（EDH）', detail: '凸レンズ型の高吸収域。中硬膜動脈損傷が多い。lucid intervalに注意。正中偏位・血腫拡大は緊急開頭。', severity: 'dn' as Sev },
      { id: 'early_infarct', label: '早期虚血性変化', detail: 'early CT sign: 皮髄境界不明瞭化、島皮質の不鮮明化、レンズ核の不鮮明化、脳溝消失。ASPECTS評価。発症6時間以内→tPA/血栓回収を検討。', severity: 'dn' as Sev },
      { id: 'established_infarct', label: '確立した脳梗塞', detail: '明確な低吸収域。血管支配領域と一致→アテローム血栓性 or 心原性。ラクナ梗塞（< 15mm、基底核・橋）。出血性梗塞転化に注意。', severity: 'dn' as Sev },
      { id: 'mass_lesion', label: '占拠性病変（腫瘤）', detail: '等〜高吸収の腫瘤。周囲浮腫・mass effect・造影パターンで評価。転移性脳腫瘍（多発）・グリオーマ・髄膜腫を鑑別。造影MRIで精査。', severity: 'dn' as Sev },
      { id: 'brain_edema', label: '脳浮腫', detail: '脳実質の低吸収化+脳溝消失+脳室圧排。血管原性（腫瘍周囲）vs 細胞毒性（梗塞）。ヘルニアリスク評価。マンニトール/高張食塩水を検討。', severity: 'dn' as Sev },
      { id: 'atrophy', label: '脳萎縮', detail: '脳溝拡大+脳室拡大。加齢性 vs 神経変性疾患（AD: 海馬萎縮、FTD: 前頭側頭萎縮）。NPH（正常圧水頭症）との鑑別が重要。', severity: 'wn' as Sev },
    ]
  },
  {
    key: 'Ventricle', title: '脳室・脳槽',
    desc: '脳室拡大・水頭症・脳室内出血',
    findings: [
      { id: 'ventricle_normal', label: '脳室 正常', detail: '脳室系の形態・サイズ正常。正中偏位なし。', severity: 'ok' as Sev },
      { id: 'hydrocephalus', label: '水頭症', detail: '脳室拡大: 交通性（くも膜顆粒吸収障害）vs 非交通性（腫瘍・出血による閉塞）。Evans index > 0.3。NPH: 歩行障害+認知症+尿失禁のtriad。', severity: 'wn' as Sev },
      { id: 'ivh', label: '脳室内出血（IVH）', detail: '脳室内の高吸収。被殻/視床出血の脳室穿破が多い。急性水頭症のリスク → 脳室ドレナージを検討。', severity: 'dn' as Sev },
      { id: 'midline_shift', label: '正中偏位', detail: '透明中隔の偏位。5mm以上は有意。テント上ヘルニアのリスク。原因（血腫・腫瘤・浮腫）の治療が急務。', severity: 'dn' as Sev },
    ]
  },
  {
    key: 'Bone', title: '骨・軟部',
    desc: '頭蓋骨骨折・副鼻腔・乳突蜂巣',
    findings: [
      { id: 'skull_normal', label: '頭蓋骨 異常なし', detail: '骨折・溶骨性病変を認めない。正常所見。', severity: 'ok' as Sev },
      { id: 'skull_fracture', label: '頭蓋骨骨折', detail: '線状骨折 vs 陥没骨折。中硬膜動脈走行部の骨折 → EDHリスク。側頭骨骨折 → 髄液漏・顔面神経麻痺。', severity: 'dn' as Sev },
      { id: 'sinusitis', label: '副鼻腔液貯留/肥厚', detail: '副鼻腔の粘膜肥厚・液面形成。急性副鼻腔炎。頭蓋底骨折後の血性貯留の可能性も。', severity: 'wn' as Sev },
      { id: 'scalp_hematoma', label: '頭皮下血腫', detail: '皮下軟部組織の腫脹・高吸収。外傷の受傷部位を示唆。直下の頭蓋骨骨折をチェック。', severity: 'neutral' as Sev },
    ]
  },
]

export default function CTHeadPage() {
  useEffect(() => { trackToolUsage('interpret-ct-head') }, [])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const results = useMemo(() => { const r: any[] = []; categories.forEach(cat => cat.findings.filter(f => selected.has(f.id)).forEach(f => r.push({ title: `${cat.key}: ${f.label}`, severity: f.severity, detail: f.detail }))); return r }, [selected])
  const sty: Record<Sev, string> = { ok: 'bg-[#E6F4EA] border-l-4 border-[#34A853]', wn: 'bg-[#FFF8E1] border-l-4 border-[#F9A825]', dn: 'bg-[#FDECEA] border-l-4 border-[#D93025]', neutral: 'bg-[#E8F0FE] border-l-4 border-[#4285F4]' }
  const tc: Record<Sev, string> = { ok: 'text-[#1B5E20]', wn: 'text-[#E65100]', dn: 'text-[#B71C1C]', neutral: 'text-[#1565C0]' }

  return (
    <div className="max-w-4xl mx-auto">
      <nav className="text-sm text-muted mb-6"><Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span><Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span><Link href="/tools/interpret" className="hover:text-ac">検査読影</Link><span className="mx-2">›</span><span>頭部CT</span></nav>
      <header className="mb-6"><div className="flex items-start justify-between gap-3"><div className="min-w-0">
        <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">🧠 検査読影</span>
        <h1 className="text-2xl font-bold text-tx mb-1">頭部CT 系統的評価チェックリスト</h1>
        <p className="text-sm text-muted">脳実質→脳室→骨・軟部の順に評価。出血・梗塞・腫瘤の迅速な鑑別をサポート。</p>
      </div><ProPulseHint><FavoriteButton slug="interpret-ct-head" title="頭部CT 系統的評価チェックリスト" /></ProPulseHint></div></header>
      <section className="space-y-4 mb-6">{categories.map(cat => (<div key={cat.key} className="bg-s0 border border-br rounded-xl p-4"><h2 className="text-sm font-bold text-tx mb-1">{cat.title}</h2><p className="text-[11px] text-muted mb-3">{cat.desc}</p><div className="flex flex-wrap gap-2">{cat.findings.map(f => (<button key={f.id} onClick={() => toggle(f.id)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${selected.has(f.id) ? f.severity === 'ok' ? 'bg-[#166534] text-white border-[#166534]' : f.severity === 'dn' ? 'bg-[#991B1B] text-white border-[#991B1B]' : f.severity === 'neutral' ? 'bg-ac text-white border-ac' : 'bg-[#92400E] text-white border-[#92400E]' : 'bg-bg text-tx border-br hover:border-ac/30'}`}>{selected.has(f.id) ? '✓ ' : ''}{f.label}</button>))}</div></div>))}</section>
      {results.length > 0 && <ProGate feature="interpretation" previewHeight={100}><section className="mb-8"><h2 className="text-lg font-bold text-tx mb-3">推奨アクション（{results.length}所見）</h2><div className="space-y-3">{results.map((r: any, i: number) => (<div key={i} className={`rounded-xl p-4 ${sty[r.severity as Sev]}`}><p className={`text-sm font-bold mb-1 ${tc[r.severity as Sev]}`}>{r.title}</p><p className="text-xs text-tx/80">{r.detail}</p></div>))}</div></section></ProGate>}
      {selected.size === 0 && <div className="bg-s1 border border-br rounded-xl p-6 text-center text-muted text-sm mb-8">上のチェックリストから所見を選択すると、鑑別疾患と解説が表示されます。</div>}
      <div className="bg-wnl border border-wnb rounded-lg p-4 mb-8 text-sm text-wn"><p className="font-semibold mb-1">⚠️ 医療上の免責事項</p><p>本ツールは頭部CTの系統的評価を補助するチェックリストです。画像の自動判定は行いません。読影・診断の最終判断は必ず担当医が行ってください。</p></div>
      <section className="mb-8"><h2 className="text-lg font-bold mb-3">参考文献</h2><ol className="list-decimal list-inside text-sm text-muted space-y-2"><li>Osborn AG. Osborn&apos;s Brain, 2nd ed. Elsevier, 2017</li><li>Powers WJ, et al. AHA/ASA Guidelines for Acute Ischemic Stroke, Stroke 2019</li><li>Hemphill JC, et al. AHA/ASA ICH Guidelines, Stroke 2015</li></ol></section>
    </div>
  )
}
