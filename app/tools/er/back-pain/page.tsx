'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ERDisclaimerBanner, ERDisclaimerFooter, ERResultCaution } from '@/components/tools/ERDisclaimer'

interface Choice { label: string; value: string; icon?: string; danger?: boolean }
interface TreeNode {
  id: string; title: string; desc?: string
  choices?: Choice[]
  result?: { severity: 'critical'|'urgent'|'moderate'|'low'; title: string; actions: string[]; workup: string[]; disposition: string; pitfall?: string }
  next?: (selected: string) => string
}

const tree: Record<string, TreeNode> = {
  start: {
    id:'start', title:'Step 1: Red Flagの評価',
    desc:'腰背部痛のER評価では致死的・緊急手術適応の疾患を最初に除外。バイタル確認 → Red Flag評価。',
    choices:[
      {label:'バイタル不安定（低血圧・頻脈 → 大動脈解離/AAA破裂疑い）',value:'unstable',icon:'🚨',danger:true},
      {label:'馬尾症候群徴候（膀胱直腸障害・サドル麻痺・両下肢筋力低下）',value:'cauda',icon:'🧠',danger:true},
      {label:'発熱 + 腰痛（化膿性脊椎炎・硬膜外膿瘍疑い）',value:'fever_back',icon:'🌡️',danger:true},
      {label:'悪性腫瘍の既往 + 腰痛（転移性脊椎疾患疑い）',value:'cancer_back',icon:'⚠️',danger:true},
      {label:'片側の激痛（側腹部〜鼠径部に放散、波状 → 尿管結石疑い）',value:'renal_colic',icon:'💎'},
      {label:'Red Flagなし（非特異的腰痛パターン）',value:'no_redflag',icon:'✅'},
    ],
    next:v=>v,
  },

  unstable: {
    id:'unstable', title:'🚨 バイタル不安定 → 大動脈緊急の除外',
    result:{
      severity:'critical',
      title:'腰背部痛 + ショック → AAA破裂/大動脈解離',
      actions:[
        '大口径ルート2本確保・輸液開始',
        '緊急腹部CT造影（AAA破裂: 後腹膜血腫/遊離液体）',
        'AAA破裂確認 → 血管外科緊急コンサルト（EVAR or 開腹修復）',
        '大動脈解離（Stanford B型も背部痛）→ CT血管造影 → 心臓血管外科',
        '大量輸血準備・クロスマッチ',
        '許容低血圧: 意識がある限り過度の昇圧は避ける（再出血リスク）',
      ],
      workup:['腹部CT造影','CBC・凝固','T&S/クロスマッチ','電解質・腎機能','乳酸','心電図','胸部X線（大動脈解離：縦隔拡大）'],
      disposition:'手術室 or ICU',
      pitfall:'AAA破裂は「腎結石」と誤診されやすい。50歳以上男性の突然の腰背部痛 + ショック → 尿検査で血尿陽性でもAAAを除外。腹部拍動性腫瘤の触診を忘れない',
    },
  },

  cauda: {
    id:'cauda', title:'🧠 馬尾症候群',
    result:{
      severity:'critical',
      title:'馬尾症候群 — 緊急手術適応',
      actions:[
        '膀胱直腸障害: 尿閉（残尿測定 ≧ 200mLで有意）、便失禁',
        'サドル麻痺: 会陰部の感覚低下（必ず確認）',
        '肛門括約筋のトーン低下（直腸診で確認）',
        '緊急腰椎MRI（48h以内の手術が予後を左右）',
        '脊椎外科/整形外科 緊急コンサルト',
        '除圧手術の遅延（48h以上）は不可逆的な膀胱直腸障害のリスク',
        'MRI施行できない場合: CT myelography',
      ],
      workup:['腰椎MRI（緊急）','残尿測定','神経学的診察（下肢筋力・感覚・反射・肛門反射）'],
      disposition:'緊急手術 → 入院',
      pitfall:'馬尾症候群は「進行性」であることが多い。「まだ歩ける」「排尿できる」でも、サドル麻痺や肛門反射消失があれば緊急MRI。不完全型を見逃さない',
    },
  },

  fever_back: {
    id:'fever_back', title:'🌡️ 発熱 + 腰痛 → 脊椎感染症',
    result:{
      severity:'urgent',
      title:'化膿性脊椎炎 / 硬膜外膿瘍の疑い',
      actions:[
        '血液培養2セット',
        '炎症マーカー: CRP, ESR, PCT',
        '腰椎MRI（造影）: 椎体のT2高信号+造影効果→脊椎炎。硬膜外膿瘍は脊髄圧迫の評価が重要',
        '硬膜外膿瘍 + 神経症状あり → 緊急外科的ドレナージ',
        '抗菌薬: 血培採取後に開始。黄色ブドウ球菌をカバー（MSSA: CEZ、MRSA疑い: VCM）',
        'リスク因子: IVDU、糖尿病、免疫不全、最近の脊椎手術/硬膜外注射',
      ],
      workup:['血液培養2セット','CBC・CRP・ESR','腰椎MRI（造影）','必要に応じてCTガイド生検'],
      disposition:'入院（抗菌薬 4-6週間が標準。外科的介入の判断を含む）',
      pitfall:'硬膜外膿瘍は急速に進行し不可逆的な対麻痺をきたしうる。発熱＋腰痛＋神経症状は緊急MRIの適応。「高齢者の腰痛」で片付けない',
    },
  },

  cancer_back: {
    id:'cancer_back', title:'⚠️ 悪性腫瘍 + 腰痛',
    result:{
      severity:'urgent',
      title:'転移性脊椎腫瘍 / 脊髄圧迫の評価',
      actions:[
        '全脊椎MRI（脊髄圧迫の有無を評価）',
        '脊髄圧迫あり → デキサメタゾン 10mg iv → 4mg q6h（脊髄浮腫軽減）',
        '放射線治療科・脊椎外科コンサルト',
        '疼痛管理: オピオイド＋NSAIDs（腎機能に注意）',
        '高Ca血症のチェック（骨転移に伴う）',
        '原発不明の場合: CT（胸腹骨盤）、PSA、CA19-9等の腫瘍マーカー検討',
      ],
      workup:['全脊椎MRI（造影）','CBC・電解質','Ca・ALP・LDH','腫瘍マーカー','CT（原発検索）'],
      disposition:'入院（脊髄圧迫あり or 高Ca血症 or 疼痛コントロール不良）',
      pitfall:'脊髄圧迫は72h以内の治療開始が歩行能力温存に重要。「明日MRI」では遅い場合がある',
    },
  },

  renal_colic: {
    id:'renal_colic', title:'💎 尿管結石 / 腎疝痛',
    result:{
      severity:'moderate',
      title:'腎疝痛 — 疼痛管理＋排石促進',
      actions:[
        '疼痛管理: NSAIDs第一選択（ジクロフェナク坐薬50mg or ケトロラク30mg iv）',
        'NSAIDs不十分→アセトアミノフェン1g iv 併用',
        'それでも不十分→フェンタニル or モルヒネ少量iv',
        '制吐薬: メトクロプラミド10mg iv',
        '単純CT（造影なし）で結石の部位・サイズ確認',
        '5mm以下→自然排石期待（排石率90%）。α遮断薬（タムスロシン）で排石促進',
        '5-10mm→泌尿器科コンサルト（ESWL or TUL検討）',
        '10mm超→泌尿器科コンサルト',
        '緊急介入適応: 感染結石（発熱+結石+水腎症）、両側閉塞、単腎閉塞、腎後性腎不全',
      ],
      workup:['尿検査（血尿確認。血尿なしでも結石は否定できない）','単純CT（結石の標準検査）','CBC・CRP（感染合併の評価）','腎機能（Cr）','50歳以上男性: AAA破裂の除外を忘れない'],
      disposition:'疼痛コントロール良好＋感染なし＋単腎でない→帰宅（泌尿器科外来）。感染結石→緊急入院',
      pitfall:'「血尿＝結石」と決めつけない。AAA破裂は腎疝痛と類似の症状（50歳以上の初回腎疝痛はCTで大動脈も確認）。感染結石（発熱＋水腎症＋結石）は緊急ドレナージの適応で、敗血症へ急速に進行しうる',
    },
  },

  no_redflag: {
    id:'no_redflag', title:'Step 2: 非特異的腰痛',
    result:{
      severity:'low',
      title:'非特異的腰痛（機械的腰痛）— 対症療法',
      actions:[
        'NSAIDs（第一選択）+ アセトアミノフェン',
        '筋弛緩薬: チザニジンやシクロベンザプリン（短期間）',
        '安静は避ける（早期の活動再開が回復を促進）',
        '画像検査は原則不要（Red Flagなし、6週間以内の腰痛には推奨されない）',
        '6週間以上改善しない場合→腰椎MRI検討、整形外科紹介',
        'セルフケア指導: 適度な運動（ウォーキング・体幹強化）、体重管理',
        'オピオイドは急性腰痛には推奨されない（依存リスク＞ベネフィット）',
      ],
      workup:['通常不要（Red Flagなし、6週間以内）'],
      disposition:'帰宅',
      pitfall:'「非特異的腰痛」は除外診断。Red Flagがないことの確認が前提。6週間以上持続する場合は再評価',
    },
  },
}

const sevColor = {
  critical:{bg:'bg-[#FDECEA]',border:'border-[#D93025]',text:'text-[#B71C1C]',badge:'🚨 緊急'},
  urgent:{bg:'bg-[#FFF8E1]',border:'border-[#F9A825]',text:'text-[#E65100]',badge:'⚠️ 準緊急'},
  moderate:{bg:'bg-[#E8F0FE]',border:'border-[#4285F4]',text:'text-[#1565C0]',badge:'ℹ️ 中等度'},
  low:{bg:'bg-[#E6F4EA]',border:'border-[#34A853]',text:'text-[#1B5E20]',badge:'✅ 低リスク'},
}

export default function BackPainPage(){
  const[path,setPath]=useState<string[]>(['start'])
  const current=tree[path[path.length-1]]
  const handleChoice=(v:string)=>{if(current?.next){const n=current.next(v);if(tree[n])setPath(p=>[...p,n])}}
  const goBack=()=>{if(path.length>1)setPath(p=>p.slice(0,-1))}
  const reset=()=>setPath(['start'])
  if(!current)return null
  const sc=current.result?sevColor[current.result.severity]:null

  return(
    <div className="max-w-3xl mx-auto">
      <nav className="text-sm text-muted mb-6">
        <Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span>
        <Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span>
        <Link href="/tools/er" className="hover:text-ac">ER対応</Link><span className="mx-2">›</span>
        <span>腰背部痛</span>
      </nav>
      <header className="mb-6">
        <span className="inline-block text-sm bg-dnl text-dn px-2.5 py-0.5 rounded-full font-medium mb-2">🚨 ER対応</span>
        <h1 className="text-2xl font-bold text-tx mb-1">腰背部痛</h1>
        <p className="text-sm text-muted">AAA破裂・馬尾症候群・脊椎感染症・尿管結石・転移性腫瘍の除外 → 非特異的腰痛の対症療法</p>
      </header>
      <ERDisclaimerBanner />
      <div className="mb-4 flex items-center gap-2">
        {path.length>1&&<button onClick={goBack} className="text-xs text-ac px-2 py-1 rounded border border-ac/20 hover:bg-acl transition-colors">← 戻る</button>}
        {path.length>1&&<button onClick={reset} className="text-xs text-muted px-2 py-1 rounded border border-br hover:bg-s1 transition-colors">最初から</button>}
      </div>
      {current.choices&&!current.result&&(
        <div className="bg-s0 border border-br rounded-xl p-5 mb-6">
          <h2 className="text-base font-bold text-tx mb-2">{current.title}</h2>
          {current.desc&&<p className="text-sm text-muted mb-4">{current.desc}</p>}
          <div className="space-y-2">{current.choices.map(c=>(
            <button key={c.value} onClick={()=>handleChoice(c.value)}
              className={`w-full text-left p-4 rounded-xl border-2 transition-all ${c.danger?'border-[#D93025]/30 hover:border-[#D93025] hover:bg-[#FDECEA]':'border-br hover:border-ac/40 hover:bg-acl'}`}>
              <span className="text-sm font-medium text-tx">{c.icon&&<span className="mr-2">{c.icon}</span>}{c.label}</span>
            </button>
          ))}</div>
        </div>
      )}
      {current.result&&sc&&(
        <div className={`${sc.bg} border-2 ${sc.border} rounded-xl p-5 mb-6`}>
          <div className="flex items-center gap-2 mb-3"><span className={`text-xs font-bold px-2.5 py-1 rounded-full ${sc.text} bg-white/70`}>{sc.badge}</span></div>
          <h2 className={`text-lg font-bold mb-3 ${sc.text}`}>{current.result.title}</h2>
          <div className="space-y-4">
            <div><p className="text-xs font-bold text-tx mb-2">アクション</p><div className="space-y-1.5">{current.result.actions.map((a,i)=><p key={i} className="text-sm text-tx leading-relaxed">{a}</p>)}</div></div>
            <div><p className="text-xs font-bold text-tx mb-2">検査オーダー</p><div className="flex flex-wrap gap-1.5">{current.result.workup.map((w,i)=><span key={i} className="text-xs px-2 py-0.5 rounded bg-white/60 text-tx">{w}</span>)}</div></div>
            <div className="flex items-center gap-2"><p className="text-xs font-bold text-tx">Disposition:</p><p className="text-sm text-tx">{current.result.disposition}</p></div>
            {current.result.pitfall&&(<div className="bg-white/60 rounded-lg p-3"><p className="text-xs font-bold text-[#E65100] mb-1">⚠️ ピットフォール</p><p className="text-xs text-tx leading-relaxed">{current.result.pitfall}</p></div>)}
          </div>
          <ERResultCaution />
          <button onClick={reset} className="mt-4 w-full py-2.5 bg-white/60 rounded-xl text-sm font-medium text-tx hover:bg-white/80 transition-colors">最初からやり直す</button>
        </div>
      )}
      <section className="mb-8"><h2 className="text-lg font-bold mb-3">関連ツール</h2>
        <div className="flex flex-wrap gap-2">
          {[{href:'/tools/er/abdominal-pain',name:'腹痛'},{href:'/tools/er/chest-pain',name:'胸痛'},{href:'/tools/calc/egfr',name:'eGFR'},{href:'/tools/calc/gcs',name:'GCS'}].map(t=>(
            <Link key={t.href} href={t.href} className="text-sm bg-s1 text-tx px-3 py-1.5 rounded-lg hover:bg-acl hover:text-ac transition-colors">{t.name}</Link>
          ))}
        </div>
      </section>
      <ERDisclaimerFooter />
      <section className="mb-8"><h2 className="text-lg font-bold mb-3">参考文献</h2>
        <ol className="list-decimal list-inside text-sm text-muted space-y-2">
          <li>Chou R et al. ACP Clinical Practice Guideline: Diagnostic Imaging for Low Back Pain. Ann Intern Med 2011</li>
          <li>Deyo RA, Weinstein JN. Low Back Pain. NEJM 2001</li>
          <li>日本整形外科学会. 腰痛診療ガイドライン 2019</li>
        </ol>
      </section>
    </div>
  )
}
