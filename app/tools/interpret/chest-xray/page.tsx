'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import ChestXraySVG from '@/components/tools/interpret/ChestXraySVG'
import ProGate from '@/components/pro/ProGate'
import FavoriteButton from '@/components/tools/FavoriteButton'
import ProPulseHint from '@/components/pro/ProPulseHint'
import { trackToolUsage } from '@/components/pro/useProStatus'

type Severity = 'ok' | 'wn' | 'dn' | 'neutral'

interface Finding {
  id: string; category: string; label: string; detail: string; severity: Severity
}

interface StepResult {
  step: number; title: string; finding: string; severity: Severity; detail: string
}

// ── All findings organized by ABCDE ──
const categories = [
  {
    key: 'A', title: 'A: Airway（気道）',
    desc: '気管・主気管支の偏位や狭窄をチェック',
    findings: [
      { id: 'trachea_midline', category: 'A', label: '気管正中', detail: '気管が正中に位置。正常。', severity: 'ok' as Severity },
      { id: 'trachea_shift_r', category: 'A', label: '気管右偏位', detail: '気管が右に偏位: 左側の緊張性気胸・大量胸水（押す側）、または右上葉無気肺・右肺切除後（引く側）を鑑別。', severity: 'dn' as Severity },
      { id: 'trachea_shift_l', category: 'A', label: '気管左偏位', detail: '気管が左に偏位: 右側の緊張性気胸・大量胸水（押す側）、または左上葉無気肺（引く側）を鑑別。', severity: 'dn' as Severity },
      { id: 'trachea_narrow', category: 'A', label: '気管狭窄', detail: '気管の狭窄: 甲状腺腫・縦隔腫瘍・気管内腫瘍・長期挿管後狭窄を鑑別。', severity: 'wn' as Severity },
    ]
  },
  {
    key: 'B', title: 'B: Bones & soft tissue（骨・軟部組織）',
    desc: '肋骨骨折、椎体圧迫、皮下気腫、軟部組織腫瘤',
    findings: [
      { id: 'bones_normal', category: 'B', label: '骨・軟部組織 正常', detail: '肋骨・脊椎・鎖骨に明らかな異常なし。', severity: 'ok' as Severity },
      { id: 'rib_fracture', category: 'B', label: '肋骨骨折', detail: '肋骨骨折: 外傷歴を確認。多発肋骨骨折ではflail chest・血気胸の合併に注意。病的骨折（転移性骨腫瘍）の可能性も。', severity: 'dn' as Severity },
      { id: 'vertebral_compression', category: 'B', label: '椎体圧迫骨折', detail: '椎体の楔状変形: 骨粗鬆症性圧迫骨折・転移性腫瘍を鑑別。胸腰椎移行部に好発。', severity: 'wn' as Severity },
      { id: 'subcutaneous_emphysema', category: 'B', label: '皮下気腫', detail: '皮下気腫: 気胸・縦隔気腫・食道破裂・外傷後に出現。原因検索が必要。', severity: 'dn' as Severity },
      { id: 'lytic_lesion', category: 'B', label: '溶骨性病変', detail: '溶骨性病変: 骨転移（肺癌・乳癌・腎癌・甲状腺癌）・多発性骨髄腫を鑑別。', severity: 'dn' as Severity },
    ]
  },
  {
    key: 'C', title: 'C: Cardiac（心臓・縦隔）',
    desc: 'CTR、心陰影の形態、縦隔幅、大動脈弓',
    findings: [
      { id: 'heart_normal', category: 'C', label: '心陰影 正常（CTR < 50%）', detail: 'CTR（心胸郭比）< 50%: 正常。PA像での評価が正確。AP像では過大評価されやすい。', severity: 'ok' as Severity },
      { id: 'cardiomegaly', category: 'C', label: '心拡大（CTR ≧ 50%）', detail: '心拡大: 心不全・弁膜症・心筋症・心嚢液貯留を鑑別。急性増大なら心嚢液を最優先で除外（心エコー）。', severity: 'wn' as Severity },
      { id: 'mediastinal_wide', category: 'C', label: '縦隔拡大', detail: '上縦隔の拡大: 大動脈解離（急性胸痛＋縦隔拡大 → 造影CT）・大動脈瘤・リンパ腫・胸腺腫・甲状腺腫を鑑別。', severity: 'dn' as Severity },
      { id: 'aortic_knob', category: 'C', label: '大動脈弓突出', detail: '大動脈弓の突出・蛇行: 高血圧性変化・大動脈瘤・動脈硬化を示唆。新規の場合は大動脈解離も鑑別。', severity: 'wn' as Severity },
      { id: 'pericardial_effusion', category: 'C', label: '水筒状心陰影（flask shape）', detail: '急速な心拡大 + 水筒状: 大量心嚢液貯留を示唆。心タンポナーデの可能性 → 緊急心エコー。', severity: 'dn' as Severity },
    ]
  },
  {
    key: 'D', title: 'D: Diaphragm（横隔膜）',
    desc: '横隔膜の位置・形態、free air、CP angle',
    findings: [
      { id: 'diaphragm_normal', category: 'D', label: '横隔膜 正常', detail: '右横隔膜が左より1-2cm高位。肋骨横隔膜角（CP angle）鋭角。正常所見。', severity: 'ok' as Severity },
      { id: 'cp_blunting', category: 'D', label: 'CP angle鈍化', detail: 'CP angle鈍化: 少量胸水（200-300 mL以上で検出可能）。lateral decubitus で確認。心不全・肺炎・悪性胸水を鑑別。', severity: 'wn' as Severity },
      { id: 'diaphragm_elevated_r', category: 'D', label: '右横隔膜挙上', detail: '右横隔膜挙上: 肝腫大・横隔膜神経麻痺・右下葉無気肺・腹腔内腫瘤を鑑別。', severity: 'wn' as Severity },
      { id: 'diaphragm_elevated_l', category: 'D', label: '左横隔膜挙上', detail: '左横隔膜挙上: 横隔膜神経麻痺（左）・脾腫・左下葉無気肺・胃拡張を鑑別。', severity: 'wn' as Severity },
      { id: 'free_air', category: 'D', label: '横隔膜下 free air', detail: '横隔膜下遊離ガス: 消化管穿孔を示唆（最も多いのは胃・十二指腸潰瘍穿孔）。立位で右横隔膜下に検出しやすい。外科的緊急対応。', severity: 'dn' as Severity },
      { id: 'diaphragm_flat', category: 'D', label: '横隔膜平坦化', detail: '横隔膜の平坦化: 肺過膨張（COPD・喘息発作）を示唆。側面像で確認。', severity: 'wn' as Severity },
    ]
  },
  {
    key: 'E', title: 'E: Everything else（肺野・胸膜）',
    desc: '肺野の透過性、浸潤影、結節影、気胸、胸水',
    findings: [
      { id: 'lungs_clear', category: 'E', label: '肺野 清', detail: '両側肺野に明らかな異常陰影なし。正常所見。', severity: 'ok' as Severity },
      { id: 'consolidation', category: 'E', label: '浸潤影（consolidation）', detail: '均一な高濃度陰影（air bronchogram陽性のことが多い）: 肺炎（最多）・肺胞出血・器質化肺炎・肺胞蛋白症を鑑別。区域性なら細菌性肺炎。', severity: 'dn' as Severity },
      { id: 'ggo', category: 'E', label: 'すりガラス影（GGO）', detail: 'すりガラス影: 間質性肺炎・ウイルス性肺炎（COVID-19・インフルエンザ）・肺胞出血・薬剤性肺障害・心原性肺水腫初期を鑑別。分布パターンが重要。', severity: 'wn' as Severity },
      { id: 'nodule', category: 'E', label: '肺結節影', detail: '孤立性肺結節: 肺癌（悪性の可能性はサイズ・辺縁・石灰化パターンで評価）・肉芽腫・過誤腫を鑑別。> 8mmはCTフォロー or PET-CT。', severity: 'wn' as Severity },
      { id: 'mass', category: 'E', label: '肺腫瘤影（> 3cm）', detail: '3cm以上の腫瘤: 原発性肺癌の可能性が高い。辺縁不整・スピキュラ・胸膜陥入は悪性示唆。CTガイド下生検 or 気管支鏡を検討。', severity: 'dn' as Severity },
      { id: 'pneumothorax', category: 'E', label: '気胸', detail: '肺血管影の消失 + 臓側胸膜ライン: 気胸。緊張性気胸（気管偏位＋縦隔偏位＋頸静脈怒張）は臨床診断で即時脱気。自然気胸（若年・やせ型・喫煙者）vs 外傷性 vs 続発性（COPD）。', severity: 'dn' as Severity },
      { id: 'pleural_effusion', category: 'E', label: '胸水', detail: '胸水: meniscus sign（外側高・内側低の液面）。大量胸水では縦隔偏位。心不全（両側）・肺炎随伴性（片側）・悪性・肝硬変を鑑別。', severity: 'wn' as Severity },
      { id: 'atelectasis', category: 'E', label: '無気肺', detail: '含気の消失 + 容量減少（横隔膜挙上・縦隔偏位・肋間腔狭小化）: 閉塞性無気肺（気管支内腫瘍・粘液栓）・圧排性（胸水・気胸）・術後を鑑別。', severity: 'wn' as Severity },
      { id: 'bilateral_infiltrates', category: 'E', label: '両側びまん性浸潤影', detail: '両側びまん性: 肺水腫（心原性 vs ARDS）・びまん性肺胞出血・PCP（免疫不全者）・薬剤性肺障害・好酸球性肺炎を鑑別。分布パターン（中枢性=肺水腫、末梢性=好酸球性）が重要。', severity: 'dn' as Severity },
      { id: 'reticular', category: 'E', label: '網状影（reticular pattern）', detail: '網状影: 間質性肺疾患（IPF・膠原病肺・石綿肺）。蜂巣肺を伴えば線維化の進行を示唆。HRCTで詳細評価。', severity: 'wn' as Severity },
      { id: 'cavity', category: 'E', label: '空洞影', detail: '空洞（壁を持つ含気腔）: 肺結核（上葉に好発）・肺膿瘍・壊死性肺炎・肺癌（扁平上皮癌）・Wegener肉芽腫症を鑑別。鏡面像（ニボー）があれば膿瘍示唆。', severity: 'dn' as Severity },
      { id: 'tube_line', category: 'E', label: 'チューブ・ライン位置確認', detail: '気管チューブ先端: 気管分岐部の2-4cm上方が適正。CVカテーテル: SVC-RA接合部付近。胸腔ドレーン: 胸腔内に位置。NGチューブ: 胃内に到達。', severity: 'neutral' as Severity },
    ]
  },
]

export default function ChestXrayPage() {
  // PLG: ツール利用トラッキング
  useEffect(() => { trackToolUsage('interpret-chest-xray') }, [])

  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeCat, setActiveCat] = useState<string | null>(null)

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const results = useMemo(() => {
    const steps: StepResult[] = []
    let stepNum = 1
    categories.forEach(cat => {
      const catFindings = cat.findings.filter(f => selected.has(f.id))
      catFindings.forEach(f => {
        steps.push({ step: stepNum, title: `${cat.key}: ${f.label}`, finding: f.label, severity: f.severity, detail: f.detail })
      })
      if (catFindings.length > 0) stepNum++
    })
    return steps
  }, [selected])

  const hasAnyAbnormal = results.some(r => r.severity !== 'ok')

  return (
    <div className="max-w-4xl mx-auto">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span>
        <Link href="/tools/interpret" className="hover:text-ac">検査読影</Link><span className="mx-2">›</span><span>胸部X線</span>
      </nav>
      <header className="mb-6"><div className="flex items-start justify-between gap-3"><div className="min-w-0">
        <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">🫁 検査読影</span>
        <h1 className="text-2xl font-bold text-tx mb-1">胸部X線 系統的読影チェックリスト</h1>
        <p className="text-sm text-muted">ABCDE法で見落としゼロ。各セクションにホバーすると模式図の対応部位がハイライト。</p>
      </div><ProPulseHint><FavoriteButton slug="interpret-chest-xray" /></ProPulseHint></div></header>
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="lg:w-[320px] shrink-0"><div className="lg:sticky lg:top-4 bg-s1 border border-br rounded-xl p-3">
          <p className="text-xs font-bold text-tx mb-2 text-center">模式的胸部X線</p>
          <ChestXraySVG activeRegion={activeCat} selectedFindings={selected} />
          <p className="text-[10px] text-muted text-center mt-2">{activeCat?`${activeCat} セクション評価中`:'セクションにホバーで部位ハイライト'}</p>
        </div></div>
      <section className="flex-1 space-y-4">
        {categories.map(cat => (
          <div key={cat.key} className={`bg-s0 border rounded-xl p-4 transition-colors ${activeCat===cat.key?'border-ac/50 bg-acl/30':'border-br'}`}
            onMouseEnter={()=>setActiveCat(cat.key)} onMouseLeave={()=>setActiveCat(null)}>
            <h2 className="text-sm font-bold text-tx mb-1">{cat.title}</h2>
            <p className="text-[11px] text-muted mb-3">{cat.desc}</p>
            <div className="flex flex-wrap gap-2">
              {cat.findings.map(f => (
                <button key={f.id} onClick={()=>{toggle(f.id);setActiveCat(cat.key)}}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    selected.has(f.id)
                      ? f.severity === 'ok'
                        ? 'bg-[#166534] text-white border-[#166534]'
                        : f.severity === 'dn'
                          ? 'bg-[#991B1B] text-white border-[#991B1B]'
                          : f.severity === 'wn'
                            ? 'bg-[#92400E] text-white border-[#92400E]'
                            : 'bg-ac text-white border-ac'
                      : 'bg-bg text-tx border-br hover:border-ac/30'
                  }`}>
                  {selected.has(f.id) ? '✓ ' : ''}{f.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </section>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <ProGate feature="interpretation" previewHeight={100}>
          <CxrResultTabs results={results} hasAnyAbnormal={hasAnyAbnormal} />
        </ProGate>
      )}

      {selected.size === 0 && (
        <div className="bg-s1 border border-br rounded-xl p-6 text-center text-muted text-sm mb-8">
          上のABCDEチェックリストから所見を選択すると、鑑別疾患と解説が表示されます。
        </div>
      )}

      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-4 mb-8 text-sm text-wn">
        <p className="font-semibold mb-1">⚠️ 医療上の免責事項</p>
        <p>本ツールは胸部X線の系統的読影を補助するチェックリストです。画像の自動判定は行いません。読影・診断の最終判断は必ず担当医が行ってください。</p>
      </div>

      {/* 関連ツール */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">関連ツール</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/tools/interpret/blood-gas', name: '血ガス解釈' },
            { href: '/tools/interpret/body-fluid', name: '体液検査' },
            { href: '/tools/calc/curb65', name: 'CURB-65' },
            { href: '/tools/calc/a-drop', name: 'A-DROP' },
            { href: '/tools/calc/wells-pe', name: 'Wells PE' },
            { href: '/tools/calc/sofa', name: 'SOFA' },
          ].map(t => (
            <Link key={t.href} href={t.href}
              className="text-sm bg-s1 text-tx px-3 py-1.5 rounded-lg hover:bg-acl hover:text-ac transition-colors">
              {t.name}
            </Link>
          ))}
        </div>
      </section>

      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">参考文献</h2>
        <ol className="list-decimal list-inside text-sm text-muted space-y-2">
          <li>Felson B. Chest Roentgenology. WB Saunders, 1973</li>
          <li>Goodman LR. Felson&apos;s Principles of Chest Roentgenology, 5th ed. Elsevier, 2021</li>
          <li>Corne J, Pointon K. Chest X-Ray Made Easy, 5th ed. Elsevier, 2022</li>
        </ol>
      </section>
    </div>
  )
}

const cxrStyles: Record<Severity, string> = {
  ok: 'bg-[#E6F4EA] border-l-4 border-[#34A853]',
  wn: 'bg-[#FFF8E1] border-l-4 border-[#F9A825]',
  dn: 'bg-[#FDECEA] border-l-4 border-[#D93025]',
  neutral: 'bg-[#E8F0FE] border-l-4 border-[#4285F4]',
}
const cxrTextColors: Record<Severity, string> = {
  ok: 'text-[#1B5E20]', wn: 'text-[#E65100]', dn: 'text-[#B71C1C]', neutral: 'text-[#1565C0]',
}

function CxrResultTabs({ results, hasAnyAbnormal }: { results: StepResult[]; hasAnyAbnormal: boolean }) {
  const [activeTab, setActiveTab] = useState<'result' | 'action'>('result')
  return (
    <section className="mb-8">
      <div className="flex border border-br rounded-xl overflow-hidden mb-4">
        <button onClick={() => setActiveTab('result')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'result' ? 'bg-ac text-white' : 'bg-s1 text-muted hover:text-tx'}`}>
          検査結果
        </button>
        <button onClick={() => setActiveTab('action')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === 'action' ? 'bg-ac text-white' : 'bg-s1 text-muted hover:text-tx'}`}>
          アクション
        </button>
      </div>
      {activeTab === 'result' && (
        <div>
          <h2 className="text-lg font-bold text-tx mb-3">
            読影サマリー（{results.length}所見）
            {!hasAnyAbnormal && <span className="text-sm font-normal text-[#166534] ml-2">✓ 異常所見なし</span>}
          </h2>
          <div className="space-y-3">
            {results.map((s, i) => (
              <div key={i} className={`rounded-xl p-4 ${cxrStyles[s.severity]}`}>
                <p className={`text-sm font-bold mb-1 ${cxrTextColors[s.severity]}`}>{s.title}</p>
                <p className="text-xs text-tx/80">{s.detail}</p>
              </div>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'action' && (
        <div className="space-y-4 text-sm text-muted">
          <h3 className="font-bold text-tx">胸部X線 ABCDE法による系統的読影</h3>
          <p>ABCDE法: Airway → Bones → Cardiac → Diaphragm → Everything else の順に評価。系統的アプローチで見落としを防ぎます。</p>
          <h3 className="font-bold text-tx">読影の基本チェック</h3>
          <p>技術的評価（RIP: Rotation・Inspiration・Penetration）を最初に確認。棘突起が鎖骨中間、横隔膜が第10後肋骨レベル。</p>
          <h3 className="font-bold text-tx">見落としやすい所見</h3>
          <p>肺尖部の結節影、横隔膜下のfree air、肋骨骨折、心陰影に重なる左下葉の浸潤影、気管の偏位。</p>
        </div>
      )}
    </section>
  )
}
