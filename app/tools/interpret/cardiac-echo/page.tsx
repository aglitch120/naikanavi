'use client'
import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import ProGate from '@/components/pro/ProGate'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'
import { trackToolUsage } from '@/components/pro/useProStatus'

type Sev = 'ok' | 'wn' | 'dn' | 'neutral'
interface Finding { id: string; label: string; detail: string; severity: Sev }

const categories = [
  {
    key: 'LV', title: '左室機能',
    desc: 'LVEF・壁運動・LVDd/Ds・拡張能',
    findings: [
      { id: 'ef_normal', label: 'LVEF ≧ 50%（正常）', detail: '左室駆出率正常。HFpEFの可能性は否定しないが、収縮機能は保たれている。', severity: 'ok' as Sev },
      { id: 'ef_mild', label: 'LVEF 40-49%（軽度低下）', detail: '左室駆出率軽度低下（HFmrEF）。虚血性心疾患・弁膜症・初期心筋症を鑑別。負荷心エコーや心臓MRIを検討。', severity: 'wn' as Sev },
      { id: 'ef_reduced', label: 'LVEF < 40%（低下）', detail: '左室駆出率低下（HFrEF）。DCM・ICM・心筋炎を鑑別。ARNI/BB/MRA/SGLT2iの4剤導入を検討。ICD/CRT適応も評価。', severity: 'dn' as Sev },
      { id: 'wma_regional', label: '局所壁運動異常あり', detail: '虚血性心疾患を強く示唆。冠動脈支配領域との対応を確認。LAD→前壁・中隔、RCA→下壁、LCx→側壁・後壁。心臓カテーテル検査を検討。', severity: 'dn' as Sev },
      { id: 'lvdd_dilated', label: 'LVDd拡大（> 55mm）', detail: '左室拡張末期径拡大。DCM・陳旧性MI・AR・MRなど容量負荷を鑑別。', severity: 'wn' as Sev },
      { id: 'dd_impaired', label: '拡張障害（E/A<1, DcT延長）', detail: '左室弛緩障害。高血圧性心疾患・肥大型心筋症・加齢性変化を鑑別。E/e\' > 14でLV充満圧上昇を示唆。', severity: 'wn' as Sev },
      { id: 'ee_elevated', label: 'E/e\' > 14（充満圧上昇）', detail: 'E/e\' > 14は左室充満圧上昇を示唆。HFpEFの診断根拠の一つ。利尿薬による前負荷軽減を検討。', severity: 'wn' as Sev },
    ]
  },
  {
    key: 'RV', title: '右室・肺高血圧',
    desc: 'TAPSE・RV拡大・TR-PG・IVC',
    findings: [
      { id: 'rv_normal', label: '右室サイズ・機能 正常', detail: '右室拡大なし、TAPSE > 17mm。右心機能は保たれている。', severity: 'ok' as Sev },
      { id: 'rv_dilated', label: '右室拡大', detail: '右室拡大: 肺高血圧・右室梗塞・PE・ARDS・先天性心疾患を鑑別。D-shapeの有無を確認。', severity: 'wn' as Sev },
      { id: 'tapse_low', label: 'TAPSE < 17mm', detail: 'TAPSE低下は右室収縮障害を示唆。肺高血圧・右室梗塞・心臓手術後を鑑別。', severity: 'dn' as Sev },
      { id: 'trpg_high', label: 'TR-PG > 35mmHg', detail: '肺高血圧の存在を示唆。Group 1-5の鑑別が必要。右心カテーテルでの確認を検討。', severity: 'wn' as Sev },
      { id: 'ivc_dilated', label: 'IVC拡大（> 21mm）/呼吸性変動低下', detail: 'IVC拡大+呼吸性変動低下は右房圧上昇を示唆。RAP 10-15mmHg相当。右心不全・心タンポナーデ・収縮性心膜炎を鑑別。', severity: 'wn' as Sev },
    ]
  },
  {
    key: 'Valve', title: '弁膜症',
    desc: 'AS/AR/MS/MR/TR',
    findings: [
      { id: 'valve_normal', label: '弁膜症なし', detail: '有意な弁膜症を認めない。正常所見。', severity: 'ok' as Sev },
      { id: 'as_severe', label: '重症AS（AVA < 1.0cm², Vmax > 4m/s）', detail: '重症大動脈弁狭窄症。症候性（心不全・失神・狭心症）であればTAVR/SAVRの適応。無症候でもEF低下やBNP上昇は手術考慮。', severity: 'dn' as Sev },
      { id: 'ar_moderate', label: '中等度以上AR', detail: '大動脈弁閉鎖不全症。Vena contracta > 6mm、逆流ジェット面積/LVOT面積 > 25%で重症。LV拡大の進行をフォロー。', severity: 'wn' as Sev },
      { id: 'mr_severe', label: '重症MR', detail: '重症僧帽弁閉鎖不全症。器質性（弁逸脱・リウマチ性）vs 機能性（テザリング）の鑑別が治療方針を左右。外科修復術 or MitraClipを検討。', severity: 'dn' as Sev },
      { id: 'ms_moderate', label: '中等度以上MS（MVA < 1.5cm²）', detail: '僧帽弁狭窄症。リウマチ性が最多。MVA < 1.0cm²で重症。症候性なら弁置換またはPTMC（弁形態良好な場合）。', severity: 'wn' as Sev },
      { id: 'tr_severe', label: '重症TR', detail: '重症三尖弁閉鎖不全症。二次性（肺高血圧・RV拡大による弁輪拡大）が多い。原因治療が基本。', severity: 'wn' as Sev },
      { id: 'ie_vegetation', label: '疣贅（vegetation）', detail: '弁に付着する可動性エコー輝度: 感染性心内膜炎を示唆。血液培養3セット+抗菌薬開始。Duke基準で評価。TEEが感度高い。', severity: 'dn' as Sev },
    ]
  },
  {
    key: 'Peri', title: '心膜・その他',
    desc: '心嚢液・LVH・心腔内血栓・心臓腫瘍',
    findings: [
      { id: 'peri_normal', label: '心嚢液なし', detail: '心嚢液貯留を認めない。正常所見。', severity: 'ok' as Sev },
      { id: 'pe_small', label: '少量心嚢液', detail: '少量心嚢液（拡張期エコーフリースペース < 10mm）。心膜炎・心不全・甲状腺機能低下症・悪性腫瘍を鑑別。経過観察可能なことが多い。', severity: 'wn' as Sev },
      { id: 'pe_large', label: '大量心嚢液 / タンポナーデ所見', detail: '大量心嚢液+右房・右室虚脱+IVC拡大=心タンポナーデ。緊急心嚢穿刺の適応。奇脈（> 10mmHg）、心拍出量低下を確認。', severity: 'dn' as Sev },
      { id: 'lvh', label: '左室肥大（IVSd > 11mm）', detail: '左室壁肥厚: 高血圧性心肥大・HCM・Fabry病・アミロイドーシス・AS後負荷を鑑別。非対称性中隔肥厚(ASH)はHCMを示唆。', severity: 'wn' as Sev },
      { id: 'la_thrombus', label: '心腔内血栓', detail: '左房内血栓（特にLAA）: 心房細動での塞栓リスク。左室内血栓: 前壁MI後に好発。抗凝固療法の適応。', severity: 'dn' as Sev },
    ]
  },
]

export default function CardiacEchoPage() {
  useEffect(() => { trackToolUsage('interpret-cardiac-echo') }, [])
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const toggle = (id: string) => setSelected(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n })
  const results = useMemo(() => {
    const r: { title: string; label: string; severity: Sev; detail: string }[] = []
    categories.forEach(cat => cat.findings.filter(f => selected.has(f.id)).forEach(f => r.push({ title: `${cat.key}: ${f.label}`, label: f.label, severity: f.severity, detail: f.detail })))
    return r
  }, [selected])
  const sevStyles: Record<Sev, string> = { ok: 'bg-[#E6F4EA] border-l-4 border-[#34A853]', wn: 'bg-[#FFF8E1] border-l-4 border-[#F9A825]', dn: 'bg-[#FDECEA] border-l-4 border-[#D93025]', neutral: 'bg-[#E8F0FE] border-l-4 border-[#4285F4]' }
  const sevText: Record<Sev, string> = { ok: 'text-[#1B5E20]', wn: 'text-[#E65100]', dn: 'text-[#B71C1C]', neutral: 'text-[#1565C0]' }

  return (
    <div className="max-w-4xl mx-auto">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span>
        <Link href="/tools/interpret" className="hover:text-ac">検査読影</Link><span className="mx-2">›</span><span>心エコー</span>
      </nav>
      <header className="mb-6"><div className="flex items-start justify-between gap-3"><div className="min-w-0">
        <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">🫀 検査読影</span>
        <h1 className="text-2xl font-bold text-tx mb-1">心エコー 系統的評価チェックリスト</h1>
        <p className="text-sm text-muted">左室機能→右室→弁膜症→心膜の順に評価。所見を選択すると鑑別疾患・次のアクションを表示。</p>
      </div><ProPulseHint><FavoriteButton slug="interpret-cardiac-echo" title="心エコー 系統的評価チェックリスト" /></ProPulseHint></div></header>

      <section className="space-y-4 mb-6">
        {categories.map(cat => (
          <div key={cat.key} className="bg-s0 border border-br rounded-xl p-4">
            <h2 className="text-sm font-bold text-tx mb-1">{cat.title}</h2>
            <p className="text-[11px] text-muted mb-3">{cat.desc}</p>
            <div className="flex flex-wrap gap-2">
              {cat.findings.map(f => (
                <button key={f.id} onClick={() => toggle(f.id)}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    selected.has(f.id)
                      ? f.severity === 'ok' ? 'bg-[#166534] text-white border-[#166534]'
                        : f.severity === 'dn' ? 'bg-[#991B1B] text-white border-[#991B1B]'
                        : 'bg-[#92400E] text-white border-[#92400E]'
                      : 'bg-bg text-tx border-br hover:border-ac/30'
                  }`}>
                  {selected.has(f.id) ? '✓ ' : ''}{f.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>

      {results.length > 0 && (
        <ProGate feature="interpretation" previewHeight={100}>
          <section className="mb-8">
            <div className="flex border border-br rounded-xl overflow-hidden mb-4">
              <div className="flex-1 py-2.5 text-sm font-medium bg-ac text-white text-center">推奨アクション</div>
            </div>
            <div className="space-y-3">
              {results.map((r, i) => (
                <div key={i} className={`rounded-xl p-4 ${sevStyles[r.severity]}`}>
                  <p className={`text-sm font-bold mb-1 ${sevText[r.severity]}`}>{r.title}</p>
                  <p className="text-xs text-tx/80">{r.detail}</p>
                </div>
              ))}
            </div>
          </section>
        </ProGate>
      )}

      {selected.size === 0 && <div className="bg-s1 border border-br rounded-xl p-6 text-center text-muted text-sm mb-8">上のチェックリストから所見を選択すると、鑑別疾患と解説が表示されます。</div>}
      <div className="bg-wnl border border-wnb rounded-lg p-4 mb-8 text-sm text-wn"><p className="font-semibold mb-1">⚠️ 医療上の免責事項</p><p>本ツールは心エコーの系統的評価を補助するチェックリストです。診断の最終判断は必ず担当医が行ってください。</p></div>
      <section className="mb-8"><h2 className="text-lg font-bold mb-3">関連ツール</h2><div className="flex flex-wrap gap-2">
        {[{ href: '/tools/interpret/ecg', name: '心電図読影' },{ href: '/tools/interpret/chest-xray', name: '胸部X線' },{ href: '/tools/calc/bnp', name: 'BNP/NT-proBNP' },{ href: '/tools/interpret/carotid-echo', name: '頸動脈エコー' }].map(t => <Link key={t.href} href={t.href} className="text-sm bg-s1 text-tx px-3 py-1.5 rounded-lg hover:bg-acl hover:text-ac transition-colors">{t.name}</Link>)}
      </div></section>
      <section className="mb-8"><h2 className="text-lg font-bold mb-3">参考文献</h2><ol className="list-decimal list-inside text-sm text-muted space-y-2">
        <li>日本超音波医学会. 心エコー図検査ガイドライン, 2021</li>
        <li>ASE/EACVI Guidelines for Chamber Quantification, JASE 2015</li>
        <li>Baumgartner H, et al. 2017 ESC/EACTS Valvular Heart Disease Guidelines</li>
      </ol></section>
    </div>
  )
}
