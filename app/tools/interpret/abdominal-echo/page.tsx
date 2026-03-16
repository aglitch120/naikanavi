'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import AbdominalEchoSVG from '@/components/tools/interpret/AbdominalEchoSVG'

type Severity = 'ok' | 'wn' | 'dn' | 'neutral'

interface Finding {
  id: string; label: string; detail: string; severity: Severity
}

interface OrganCategory {
  key: string; title: string; icon: string; desc: string; findings: Finding[]
}

const organs: OrganCategory[] = [
  {
    key: 'liver', title: '肝臓', icon: '🫘', desc: 'サイズ・実質エコー・腫瘤・脈管系',
    findings: [
      { id: 'liver_normal', label: '正常', detail: '肝臓のサイズ・形態・エコーパターン正常。肝内脈管に異常なし。', severity: 'ok' },
      { id: 'hepatomegaly', label: '肝腫大', detail: '肝腫大: うっ血肝（右心不全）・脂肪肝・肝炎・浸潤性疾患（リンパ腫・アミロイドーシス）・Budd-Chiari症候群を鑑別。MCL上で > 15cmが目安。', severity: 'wn' },
      { id: 'fatty_liver', label: '脂肪肝（bright liver）', detail: '肝実質のエコー輝度上昇 + 深部減衰 + 肝内血管の不明瞭化: 脂肪肝。NAFLD/NASHの評価として肝線維化マーカー（FIB-4）・エラストグラフィを検討。', severity: 'wn' },
      { id: 'liver_cirrhosis', label: '肝硬変所見', detail: '肝表面の凹凸不整 + 肝右葉萎縮/尾状葉腫大 + 粗い実質エコー: 肝硬変を示唆。脾腫・腹水・側副血行路の有無を確認。Child-Pugh分類で重症度評価。', severity: 'dn' },
      { id: 'liver_mass', label: '肝腫瘤', detail: '肝腫瘤: 肝細胞癌（肝硬変背景 + モザイクパターン）・転移性肝腫瘍（多発・bull\'s eye）・肝血管腫（高エコー・均一）・肝嚢胞（無エコー）を鑑別。造影CTまたはMRIで精査。', severity: 'dn' },
      { id: 'liver_cyst', label: '肝嚢胞', detail: '単純性肝嚢胞: 薄壁・無エコー・後方エコー増強。通常は良性で経過観察。隔壁・壁肥厚・内部エコーがあれば嚢胞腺腫・膿瘍・包虫嚢胞を鑑別。', severity: 'ok' },
      { id: 'dilated_ihd', label: '肝内胆管拡張', detail: '肝内胆管の拡張（> 2-3mm or 門脈の40%以上）: 閉塞性黄疸。肝門部〜下部胆管の閉塞原因（胆管癌・膵頭部癌・総胆管結石）を検索。', severity: 'dn' },
    ]
  },
  {
    key: 'gb', title: '胆嚢・胆管', icon: '💚', desc: '壁肥厚・結石・ポリープ・総胆管径',
    findings: [
      { id: 'gb_normal', label: '正常', detail: '胆嚢壁は薄く（< 3mm）、内部に結石・ポリープなし。総胆管径正常（< 6mm、胆摘後は < 10mm）。', severity: 'ok' },
      { id: 'gallstones', label: '胆石', detail: '胆嚢内の高エコー結節 + 音響陰影（acoustic shadow）: 胆石。Murphy sign（プローブ圧迫で疼痛）陽性なら急性胆嚢炎を示唆。', severity: 'wn' },
      { id: 'acute_cholecystitis', label: '急性胆嚢炎所見', detail: '胆石 + 胆嚢壁肥厚（> 4mm）+ 胆嚢腫大 + 周囲液体貯留 + Murphy sign陽性: 急性胆嚢炎。東京ガイドライン（TG18）で重症度分類し、早期胆嚢摘出術を検討。', severity: 'dn' },
      { id: 'gb_polyp', label: '胆嚢ポリープ', detail: '胆嚢壁から突出する隆起性病変。10mm以上・広基性・増大傾向は悪性（胆嚢癌）リスク → 胆嚢摘出術。10mm未満は6-12ヶ月毎にフォロー。', severity: 'wn' },
      { id: 'cbd_dilated', label: '総胆管拡張（> 6mm）', detail: '総胆管拡張: 総胆管結石・膵頭部腫瘍・胆管癌・乳頭部腫瘍を鑑別。拡張 + 黄疸 → MRCP or EUSで閉塞部位と原因を精査。', severity: 'dn' },
      { id: 'cbd_stone', label: '総胆管結石', detail: '総胆管内の高エコー + 音響陰影: 総胆管結石。ERCPによる砕石・除石を検討。急性胆管炎（Charcot三徴: 発熱・黄疸・右季肋部痛）の合併に注意。', severity: 'dn' },
    ]
  },
  {
    key: 'pancreas', title: '膵臓', icon: '🟡', desc: '腫大・腫瘤・膵管拡張・石灰化',
    findings: [
      { id: 'pancreas_normal', label: '正常', detail: '膵臓のサイズ・実質エコー正常。主膵管 < 3mm。腫瘤なし。', severity: 'ok' },
      { id: 'pancreas_swelling', label: '膵腫大（びまん性）', detail: 'びまん性膵腫大: 急性膵炎（腹痛 + アミラーゼ/リパーゼ上昇）・自己免疫性膵炎（IgG4上昇・ソーセージ様腫大）を鑑別。', severity: 'dn' },
      { id: 'pancreas_mass', label: '膵腫瘤', detail: '膵臓の限局性低エコー腫瘤: 膵癌（膵頭部に好発・60-70%）・膵管内乳頭粘液性腫瘍（IPMN）・神経内分泌腫瘍・転移性腫瘍を鑑別。造影CT + EUSで精査。', severity: 'dn' },
      { id: 'mpd_dilated', label: '主膵管拡張（> 3mm）', detail: '主膵管拡張: 膵頭部癌による閉塞（double duct sign: 膵管＋胆管の同時拡張）・IPMN・慢性膵炎を鑑別。', severity: 'dn' },
      { id: 'pancreas_calcification', label: '膵石灰化', detail: '膵内の高エコー点状影 + 音響陰影: 慢性膵炎（アルコール性が最多）。膵石による膵管閉塞・膵外分泌機能低下の評価を。', severity: 'wn' },
      { id: 'pancreas_cyst', label: '膵嚢胞性病変', detail: '膵嚢胞: 仮性嚢胞（膵炎後）・IPMN（分枝型: 低リスク、主膵管型: 高リスク）・MCN・SCN・SPN を鑑別。MRI/EUS + 嚢胞液分析で評価。', severity: 'wn' },
    ]
  },
  {
    key: 'kidney', title: '腎臓', icon: '🫘', desc: 'サイズ・水腎症・結石・腫瘤・皮髄境界',
    findings: [
      { id: 'kidney_normal', label: '正常', detail: '両腎のサイズ正常（長径 10-12cm）。皮髄境界明瞭。腎盂拡張なし。', severity: 'ok' },
      { id: 'hydronephrosis', label: '水腎症', detail: '腎盂・腎杯の拡張: 尿管結石（最多）・前立腺肥大・腫瘍による閉塞・VUR を鑑別。Grade I（軽度腎盂拡張）〜 IV（皮質菲薄化）で評価。', severity: 'dn' },
      { id: 'kidney_stone', label: '腎結石', detail: '腎杯・腎盂内の高エコー + 音響陰影: 腎結石。尿管結石では直接描出困難なこともある（水腎症の有無で間接的に判断）。', severity: 'wn' },
      { id: 'kidney_cyst', label: '腎嚢胞', detail: '単純性腎嚢胞（Bosniak I）: 薄壁・無エコー・後方エコー増強。良性。隔壁・石灰化・造影効果があればBosniak分類で悪性リスク評価。', severity: 'ok' },
      { id: 'kidney_mass', label: '腎腫瘤', detail: '腎実質の充実性腫瘤: 腎細胞癌（RCC、エコーパターンは多様）・腎血管筋脂肪腫（AML、高エコー）・オンコサイトーマを鑑別。造影CTで精査。', severity: 'dn' },
      { id: 'kidney_atrophy', label: '腎萎縮', detail: '腎臓の萎縮（< 9cm）+ 皮質菲薄化 + 皮髄境界不明瞭: 慢性腎臓病（CKD）の進行を示唆。片側性なら腎動脈狭窄・先天性低形成も鑑別。', severity: 'wn' },
      { id: 'kidney_size_asymmetry', label: '左右差（> 1.5cm）', detail: '腎臓の左右差: 片側腎動脈狭窄（萎縮側）・先天性低形成・VUR後の瘢痕腎・片側閉塞を鑑別。', severity: 'wn' },
    ]
  },
  {
    key: 'spleen', title: '脾臓', icon: '🟤', desc: '脾腫・腫瘤・副脾',
    findings: [
      { id: 'spleen_normal', label: '正常', detail: '脾臓サイズ正常（長径 < 12cm）。実質エコー均一。', severity: 'ok' },
      { id: 'splenomegaly', label: '脾腫（> 12cm）', detail: '脾腫: 肝硬変（門脈圧亢進）・血液疾患（リンパ腫・白血病・溶血性貧血・骨髄線維症）・感染症（EBV・マラリア・リーシュマニア）・うっ血性（右心不全）を鑑別。', severity: 'wn' },
      { id: 'spleen_mass', label: '脾腫瘤', detail: '脾腫瘤: リンパ腫浸潤（最多）・転移性腫瘍（稀）・血管腫・脾膿瘍・脾梗塞を鑑別。', severity: 'dn' },
    ]
  },
  {
    key: 'aorta', title: '大動脈', icon: '🔴', desc: '径・瘤・解離',
    findings: [
      { id: 'aorta_normal', label: '正常（< 3cm）', detail: '腹部大動脈径 < 3cm。正常。', severity: 'ok' },
      { id: 'aaa', label: '腹部大動脈瘤（≧ 3cm）', detail: '腹部大動脈径 ≧ 3cm: AAA。5.5cm以上（女性5.0cm）は破裂リスク高く、待機的手術の適応。5.5cm未満は6-12ヶ月毎のサーベイランス。急性腹痛＋AAA = 破裂を疑い緊急対応。', severity: 'dn' },
      { id: 'aorta_thrombus', label: '壁在血栓', detail: '大動脈壁在血栓: 塞栓症のリスク。抗凝固療法の適応を検討。', severity: 'wn' },
    ]
  },
  {
    key: 'others', title: 'その他', icon: '📋', desc: '腹水・リンパ節腫大・膀胱',
    findings: [
      { id: 'ascites', label: '腹水', detail: '腹水: 肝硬変（SAAG ≧ 1.1）・癌性腹膜炎（SAAG < 1.1）・心不全・ネフローゼ・結核性を鑑別。腹水穿刺でSAAG・細胞数・蛋白を評価。', severity: 'wn' },
      { id: 'lymphadenopathy', label: '傍大動脈リンパ節腫大', detail: 'リンパ節腫大（短径 > 10mm）: リンパ腫・転移性腫瘍・結核・サルコイドーシスを鑑別。CTで全体的なリンパ節分布を評価。', severity: 'dn' },
      { id: 'bladder_mass', label: '膀胱内腫瘤', detail: '膀胱壁の隆起性病変: 膀胱癌（肉眼的血尿が初発症状のことが多い）・膀胱ポリープを鑑別。膀胱鏡で生検。', severity: 'dn' },
      { id: 'pleural_effusion_e', label: '胸水（右横隔膜上）', detail: '右横隔膜上に液体貯留: 胸水。肝硬変に伴う肝性胸水（右側に好発）・心不全・肺炎随伴性を鑑別。', severity: 'wn' },
    ]
  },
]

export default function AbdominalEchoPage() {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [activeOrgan, setActiveOrgan] = useState<string | null>(null)
  const svgKey: Record<string,string> = {liver:'liver',gb:'gb',pancreas:'pancreas',kidney:'kidney_r',spleen:'spleen',aorta:'aorta',others:'bladder'}
  const abnormalOrgans = useMemo(() => {
    const set = new Set<string>()
    organs.forEach(o => { if(o.findings.some(f => selected.has(f.id) && f.severity!=='ok')) { const k=svgKey[o.key]; if(k) set.add(k) } })
    return set
  }, [selected])

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const results = useMemo(() => {
    return organs.flatMap(organ =>
      organ.findings.filter(f => selected.has(f.id)).map(f => ({
        organ: organ.title, icon: organ.icon, ...f
      }))
    )
  }, [selected])

  const hasAbnormal = results.some(r => r.severity !== 'ok')

  const styles: Record<Severity, string> = {
    ok: 'bg-[#E6F4EA] border-l-4 border-[#34A853]',
    wn: 'bg-[#FFF8E1] border-l-4 border-[#F9A825]',
    dn: 'bg-[#FDECEA] border-l-4 border-[#D93025]',
    neutral: 'bg-[#E8F0FE] border-l-4 border-[#4285F4]',
  }
  const textColors: Record<Severity, string> = {
    ok: 'text-[#1B5E20]', wn: 'text-[#E65100]', dn: 'text-[#B71C1C]', neutral: 'text-[#1565C0]',
  }

  return (
    <div className="max-w-4xl mx-auto">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span>
        <Link href="/tools/interpret" className="hover:text-ac">検査読影</Link><span className="mx-2">›</span><span>腹部エコー</span>
      </nav>
      <header className="mb-6">
        <span className="inline-block text-sm bg-acl text-ac px-2.5 py-0.5 rounded-full font-medium mb-2">🔊 検査読影</span>
        <h1 className="text-2xl font-bold text-tx mb-1">腹部エコー 系統的評価チェックリスト</h1>
        <p className="text-sm text-muted">臓器別に評価。各セクションにホバーすると模式図の対応臓器がハイライト。</p>
      </header>
      <div className="flex flex-col lg:flex-row gap-6 mb-6">
        <div className="lg:w-[320px] shrink-0"><div className="lg:sticky lg:top-4 bg-s1 border border-br rounded-xl p-3">
          <p className="text-xs font-bold text-tx mb-2 text-center">模式的腹部臓器配置</p>
          <AbdominalEchoSVG activeOrgan={activeOrgan?svgKey[activeOrgan]||activeOrgan:null} abnormalOrgans={abnormalOrgans} />
          <p className="text-[10px] text-muted text-center mt-2">{activeOrgan?'臓器評価中':'セクションにホバーで臓器ハイライト'}</p>
        </div></div>
      <section className="flex-1 space-y-4">
        {organs.map(organ => (
          <div key={organ.key} className={`bg-s0 border rounded-xl p-4 transition-colors ${activeOrgan===organ.key?'border-ac/50 bg-acl/30':'border-br'}`}
            onMouseEnter={()=>setActiveOrgan(organ.key)} onMouseLeave={()=>setActiveOrgan(null)}>
            <h2 className="text-sm font-bold text-tx mb-1">{organ.icon} {organ.title}</h2>
            <p className="text-[11px] text-muted mb-3">{organ.desc}</p>
            <div className="flex flex-wrap gap-2">
              {organ.findings.map(f => (
                <button key={f.id} onClick={()=>{toggle(f.id);setActiveOrgan(organ.key)}}
                  className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                    selected.has(f.id)
                      ? f.severity === 'ok'
                        ? 'bg-[#166534] text-white border-[#166534]'
                        : f.severity === 'dn'
                          ? 'bg-[#991B1B] text-white border-[#991B1B]'
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
      </div>

      {/* Results */}
      {results.length > 0 && (
        <section className="mb-8">
          <h2 className="text-lg font-bold text-tx mb-4">
            評価サマリー（{results.length}所見）
            {!hasAbnormal && <span className="text-sm font-normal text-[#166534] ml-2">✓ 異常所見なし</span>}
          </h2>
          <div className="space-y-3">
            {results.map((r, i) => (
              <div key={i} className={`rounded-xl p-4 ${styles[r.severity]}`}>
                <p className={`text-sm font-bold mb-1 ${textColors[r.severity]}`}>{r.icon} {r.organ}: {r.label}</p>
                <p className="text-xs text-tx/80">{r.detail}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {selected.size === 0 && (
        <div className="bg-s1 border border-br rounded-xl p-6 text-center text-muted text-sm mb-8">
          上の臓器別チェックリストから所見を選択すると、鑑別疾患と精査方針が表示されます。
        </div>
      )}

      {/* 免責 */}
      <div className="bg-wnl border border-wnb rounded-lg p-4 mb-8 text-sm text-wn">
        <p className="font-semibold mb-1">⚠️ 医療上の免責事項</p>
        <p>本ツールは腹部超音波検査の系統的評価を補助するチェックリストです。超音波画像の自動判定は行いません。診断・治療の最終判断は必ず担当医が行ってください。</p>
      </div>

      {/* SEO */}
      <section className="space-y-4 text-sm text-muted mb-8">
        <h2 className="text-base font-bold text-tx">腹部エコーの系統的アプローチ</h2>
        <p>腹部超音波検査はベッドサイドで非侵襲的に腹腔内臓器を評価できる重要な検査です。系統的に肝臓→胆嚢・胆管→膵臓→腎臓→脾臓→大動脈→その他の順に評価することで見落としを防ぎます。</p>

        <h3 className="font-bold text-tx">肝臓の評価ポイント</h3>
        <p>サイズ（MCL上 &gt; 15cmで肝腫大）、実質エコー（bright liverは脂肪肝）、表面の凹凸（肝硬変）、肝内胆管拡張（閉塞性黄疸）、腫瘤性病変の有無を系統的に確認します。</p>

        <h3 className="font-bold text-tx">急性腹症での腹部エコー</h3>
        <p>急性胆嚢炎（Murphy sign + 胆嚢壁肥厚 + 結石）・AAA破裂（大動脈径拡大 + 後腹膜血腫）・水腎症（尿管結石）・腹水（消化管穿孔・出血）の迅速診断に不可欠です。</p>
      </section>

      {/* 関連ツール */}
      <section className="mb-8">
        <h2 className="text-lg font-bold mb-3">関連ツール</h2>
        <div className="flex flex-wrap gap-2">
          {[
            { href: '/tools/interpret/body-fluid', name: '体液検査' },
            { href: '/tools/calc/child-pugh', name: 'Child-Pugh' },
            { href: '/tools/calc/meld', name: 'MELD' },
            { href: '/tools/calc/fib4', name: 'FIB-4' },
            { href: '/tools/calc/egfr', name: 'eGFR' },
            { href: '/tools/calc/alvarado', name: 'Alvarado' },
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
          <li>日本超音波医学会. 腹部超音波検査ガイドライン 2021</li>
          <li>Rumack CM et al. Diagnostic Ultrasound, 5th ed. Elsevier, 2018</li>
          <li>American College of Radiology. ACR Appropriateness Criteria. 2023</li>
        </ol>
      </section>
    </div>
  )
}
