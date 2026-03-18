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
    key: 'IMT', title: 'IMT（内膜中膜複合体厚）',
    desc: '動脈硬化の早期評価。総頸動脈遠位壁後壁で計測',
    findings: [
      { id: 'imt_normal', label: 'IMT < 1.0mm（正常）', detail: 'IMT正常。動脈硬化の所見を認めない。ただし危険因子（高血圧・DM・脂質異常・喫煙）が複数ある場合は定期フォロー。', severity: 'ok' as Sev },
      { id: 'imt_thick', label: 'IMT 1.0-1.5mm（肥厚）', detail: 'IMT肥厚: 動脈硬化の初期変化。心血管リスクの上昇を示唆。生活習慣改善+危険因子の治療強化。脂質管理目標の厳格化を検討。', severity: 'wn' as Sev },
      { id: 'imt_plaque', label: 'IMT ≧ 1.5mm or プラーク', detail: 'プラーク: 限局性のIMT肥厚（≧ 1.5mm）。形態評価（表面不整・潰瘍・低輝度→不安定プラーク）が重要。心血管イベントリスク高い。スタチン+抗血小板薬を検討。', severity: 'wn' as Sev },
    ]
  },
  {
    key: 'Plaque', title: 'プラーク性状',
    desc: '安定性・脆弱性の評価（エコー輝度・表面・内部構造）',
    findings: [
      { id: 'plaque_none', label: 'プラークなし', detail: '総頸動脈・内頸動脈・外頸動脈にプラークを認めない。正常所見。', severity: 'ok' as Sev },
      { id: 'plaque_stable', label: '安定プラーク（高輝度・均一・平滑）', detail: '線維性/石灰化プラーク。高輝度で均一な内部構造、表面平滑。塞栓リスクは比較的低い。スタチン継続+定期フォロー。', severity: 'wn' as Sev },
      { id: 'plaque_vulnerable', label: '不安定プラーク（低輝度・不均一・潰瘍）', detail: '脂質コアが豊富な脆弱プラーク。低輝度・不均一な内部構造・表面不整/潰瘍。脳梗塞の塞栓源として高リスク。頸動脈MRI(黒い血)で確認。CEA/CASの適応を評価。', severity: 'dn' as Sev },
      { id: 'plaque_calcified', label: '石灰化プラーク', detail: '後方に音響陰影を伴う高輝度。安定だが高度石灰化は狭窄率の評価を困難にすることがある。CTAやMRAで補完。', severity: 'neutral' as Sev },
    ]
  },
  {
    key: 'Stenosis', title: '狭窄評価',
    desc: 'PSV/EDV・狭窄率・血流パターン',
    findings: [
      { id: 'stenosis_none', label: '有意狭窄なし（< 50%）', detail: '内頸動脈の有意狭窄を認めない。PSV < 125 cm/s。定期フォロー+危険因子管理。', severity: 'ok' as Sev },
      { id: 'stenosis_moderate', label: '中等度狭窄（50-69%）', detail: 'NASCET 50-69%相当。PSV 125-230 cm/s。症候性の場合、CEAの適応あり（NNT約15）。無症候性は薬物治療が基本+フォロー。', severity: 'wn' as Sev },
      { id: 'stenosis_severe', label: '高度狭窄（70-99%）', detail: 'NASCET 70-99%相当。PSV > 230 cm/s、EDV > 100 cm/s。症候性: CEA強く推奨（NNT約6）。無症候性: 薬物治療 or CEA/CAS（施設の手技成績による）。', severity: 'dn' as Sev },
      { id: 'stenosis_occluded', label: '閉塞（100%）', detail: '内頸動脈完全閉塞: 血流シグナルなし。CEAの適応なし。対側の狭窄評価が重要。側副血行路の発達度を評価。脳循環予備能の評価（SPECT等）。', severity: 'dn' as Sev },
      { id: 'ica_eca_ratio', label: 'ICA/CCA PSV比 > 4.0', detail: 'ICA/CCA比の上昇は高度狭窄を示唆。全身的に血流速度が変動する場合（高心拍出量・対側閉塞による代償）にも比が有用。', severity: 'dn' as Sev },
    ]
  },
  {
    key: 'Other', title: 'その他の所見',
    desc: '椎骨動脈・血流方向・解離',
    findings: [
      { id: 'va_normal', label: '椎骨動脈 正常', detail: '両側椎骨動脈の血流正常。左右差なし。', severity: 'ok' as Sev },
      { id: 'va_hypoplasia', label: '椎骨動脈低形成', detail: '一側の椎骨動脈が細い（diameter < 2mm）。先天的変異で比較的多い。対側の椎骨動脈で代償されていれば臨床的意義は低い。', severity: 'neutral' as Sev },
      { id: 'va_reversal', label: '椎骨動脈逆流', detail: '鎖骨下動脈盗血症候群: 鎖骨下動脈の近位部狭窄/閉塞により、同側椎骨動脈の血流が逆転。患側上肢の運動時にめまい・ふらつきが出現。', severity: 'wn' as Sev },
      { id: 'dissection', label: '内膜フラップ/解離所見', detail: '頸動脈解離: 内膜フラップ・偽腔・内膜下血腫を認める。若年〜中年の脳卒中の重要な原因。抗凝固 or 抗血小板療法。MRIで確認。', severity: 'dn' as Sev },
    ]
  },
]

export default function CarotidEchoPage() {
  useEffect(() => { trackToolUsage('interpret-carotid-echo') }, [])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const results = useMemo(() => { const r: any[] = []; categories.forEach(cat => cat.findings.filter(f => selected.has(f.id)).forEach(f => r.push({ title: `${cat.key}: ${f.label}`, severity: f.severity, detail: f.detail }))); return r }, [selected])
  const sty: Record<Sev, string> = { ok: 'bg-[#E6F4EA] border-l-4 border-[#34A853]', wn: 'bg-[#FFF8E1] border-l-4 border-[#F9A825]', dn: 'bg-[#FDECEA] border-l-4 border-[#D93025]', neutral: 'bg-[#E8F0FE] border-l-4 border-[#4285F4]' }
  const tc: Record<Sev, string> = { ok: 'text-[#1B5E20]', wn: 'text-[#E65100]', dn: 'text-[#B71C1C]', neutral: 'text-[#1565C0]' }

  return (
    <div className="max-w-4xl mx-auto">
      <nav className="text-sm text-muted mb-6"><Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span><Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span><Link href="/tools/interpret" className="hover:text-ac">検査読影</Link><span className="mx-2">›</span><span>頸動脈エコー</span></nav>
      <header className="mb-6"><div className="flex items-start justify-between gap-3"><div className="min-w-0">
        <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">🩺 検査読影</span>
        <h1 className="text-2xl font-bold text-tx mb-1">頸動脈エコー 系統的評価チェックリスト</h1>
        <p className="text-sm text-muted">IMT→プラーク性状→狭窄評価→椎骨動脈の順に評価。脳卒中リスクと治療方針を提示。</p>
      </div><ProPulseHint><FavoriteButton slug="interpret-carotid-echo" title="頸動脈エコー 系統的評価チェックリスト" /></ProPulseHint></div></header>
      <section className="space-y-4 mb-6">{categories.map(cat => (<div key={cat.key} className="bg-s0 border border-br rounded-xl p-4"><h2 className="text-sm font-bold text-tx mb-1">{cat.title}</h2><p className="text-[11px] text-muted mb-3">{cat.desc}</p><div className="flex flex-wrap gap-2">{cat.findings.map(f => (<button key={f.id} onClick={() => toggle(f.id)} className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${selected.has(f.id) ? f.severity === 'ok' ? 'bg-[#166534] text-white border-[#166534]' : f.severity === 'dn' ? 'bg-[#991B1B] text-white border-[#991B1B]' : f.severity === 'neutral' ? 'bg-ac text-white border-ac' : 'bg-[#92400E] text-white border-[#92400E]' : 'bg-bg text-tx border-br hover:border-ac/30'}`}>{selected.has(f.id) ? '✓ ' : ''}{f.label}</button>))}</div></div>))}</section>
      {results.length > 0 && <ProGate feature="interpretation" previewHeight={100}><section className="mb-8"><h2 className="text-lg font-bold text-tx mb-3">推奨アクション（{results.length}所見）</h2><div className="space-y-3">{results.map((r: any, i: number) => (<div key={i} className={`rounded-xl p-4 ${sty[r.severity as Sev]}`}><p className={`text-sm font-bold mb-1 ${tc[r.severity as Sev]}`}>{r.title}</p><p className="text-xs text-tx/80">{r.detail}</p></div>))}</div></section></ProGate>}
      {selected.size === 0 && <div className="bg-s1 border border-br rounded-xl p-6 text-center text-muted text-sm mb-8">上のチェックリストから所見を選択すると、鑑別疾患と解説が表示されます。</div>}
      <div className="bg-wnl border border-wnb rounded-lg p-4 mb-8 text-sm text-wn"><p className="font-semibold mb-1">⚠️ 医療上の免責事項</p><p>本ツールは頸動脈エコーの系統的評価を補助するチェックリストです。診断の最終判断は必ず担当医が行ってください。</p></div>
      <section className="mb-8"><h2 className="text-lg font-bold mb-3">参考文献</h2><ol className="list-decimal list-inside text-sm text-muted space-y-2"><li>日本脳神経超音波学会. 頸動脈エコー検査ガイドライン, 2021</li><li>Grant EG, et al. Carotid Artery Stenosis: Gray-Scale and Doppler US Diagnosis. Radiology 2003</li><li>日本脳卒中学会. 脳卒中治療ガイドライン2021</li></ol></section>
    </div>
  )
}
