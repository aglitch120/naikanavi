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
    id:'start', title:'Step 1: めまいの性状を確認',
    desc:'「めまい」は患者によって異なる症状を指す。まず性状の確認が最重要。回転性（vertigo）、浮動性（lightheadedness）、失調（disequilibrium）を区別。',
    choices:[
      {label:'回転性めまい（天井がぐるぐる回る）',value:'vertigo',icon:'🌀'},
      {label:'浮動性めまい・ふらつき（ふわふわする、気が遠くなる）',value:'presyncope',icon:'💫'},
      {label:'歩行時のふらつき・失調（座位では大丈夫）',value:'ataxia',icon:'🚶'},
      {label:'バイタル不安定（低血圧・頻脈・徐脈）',value:'unstable',icon:'🚨',danger:true},
    ],
    next:v=>v,
  },

  unstable: {
    id:'unstable', title:'🚨 バイタル不安定 → 原因検索',
    result:{
      severity:'critical',
      title:'バイタル不安定を伴うめまい — 循環不全の評価',
      actions:[
        'ABC安定化・モニタリング開始',
        '12誘導心電図（不整脈・ACS除外）',
        '起立性低血圧の評価（臥位→立位で収縮期BP≧20mmHg↓）',
        '出血の検索（消化管出血・腹腔内出血・大動脈解離）',
        '不整脈（徐脈・頻脈）があれば対応（→ ACLS参照）',
        '輸液開始・必要に応じて昇圧',
      ],
      workup:['心電図','CBC（Hb確認）','電解質','血糖','BUN/Cr','トロポニン（ACS疑い時）','血液ガス','胸部X線','必要に応じてCT（大動脈解離・出血源）'],
      disposition:'原因に応じて入院 or ICU',
      pitfall:'高齢者の「めまい」は心筋梗塞の非典型的症状であることがある。めまい＋胸部不快感があれば心電図必須',
    },
  },

  vertigo: {
    id:'vertigo', title:'Step 2: 回転性めまい — 中枢性 vs 末梢性',
    desc:'回転性めまいの95%は末梢性（良性）。しかし中枢性（脳卒中）を見逃すと致命的。HINTSテストが鑑別の鍵。',
    choices:[
      {label:'HINTSテスト施行可能（急性持続性めまい）',value:'hints',icon:'👁️'},
      {label:'発作性（頭位変換で誘発、数十秒で消失）',value:'bppv',icon:'🔄'},
      {label:'難聴・耳鳴りを伴う',value:'meniere',icon:'👂'},
      {label:'小脳症状あり（構音障害・四肢失調・歩行障害）',value:'central_signs',icon:'🧠',danger:true},
    ],
    next:v=>v,
  },

  hints: {
    id:'hints', title:'Step 3: HINTSテスト（急性前庭症候群）',
    desc:'急性持続性めまいでは HINTS（Head Impulse / Nystagmus / Test of Skew）が中枢性除外に有用。MRIより感度が高い（発症24h以内）。',
    choices:[
      {label:'末梢パターン: HI陽性（catch-up saccade+）、方向固定性眼振、skew deviation(−)',value:'peripheral_hints',icon:'✅'},
      {label:'中枢パターン: HI陰性（正常）、方向交代性眼振、skew deviation(+)',value:'central_hints',icon:'🚨',danger:true},
      {label:'判断に迷う / HINTSができない',value:'hints_uncertain',icon:'❓'},
    ],
    next:v=>v,
  },

  peripheral_hints: {
    id:'peripheral_hints', title:'末梢性前庭障害（前庭神経炎が代表）',
    result:{
      severity:'moderate',
      title:'末梢性前庭障害 — 前庭神経炎',
      actions:[
        '対症療法: メクリジン or ジフェンヒドラミン（発症急性期のみ、3日以上は代償遅延）',
        '制吐薬: メトクロプラミド or オンダンセトロン（嘔吐が強い場合）',
        '輸液（経口摂取困難時）',
        '早期リハビリテーション: 前庭リハビリ体操を指導（Brandt-Daroff体操等）',
        '抗めまい薬の長期使用は前庭代償を妨げるため避ける',
        '1-2週間で症状改善。改善しない場合は再評価（MRI検討）',
      ],
      workup:['神経学的診察（小脳症状なし確認）','聴力評価（突発性難聴の合併に注意）','MRIは急性期にはroutineでは不要（HINTSで末梢と判断された場合）'],
      disposition:'帰宅可（経口摂取可能・歩行可能なら）。嘔吐で脱水なら短期入院',
      pitfall:'「前庭神経炎」と診断する前にHINTSで中枢性を除外すること。発症48h以内のMRI DWIでも小脳梗塞の30%は偽陰性',
    },
  },

  central_hints: {
    id:'central_hints', title:'🚨 中枢性めまい（脳卒中疑い）',
    result:{
      severity:'critical',
      title:'中枢性めまい — 小脳/脳幹梗塞疑い',
      actions:[
        '脳卒中プロトコル発動（時間が勝負）',
        'MRI DWI（CTでは後方循環梗塞の多くが見えない）',
        '嚥下評価（脳幹梗塞では誤嚥リスク高い）',
        '血圧管理（急性期の過度な降圧は避ける）',
        '脳神経内科/脳卒中科コンサルト',
        '小脳出血の場合: 神経外科コンサルト（4cm超の血腫は外科的除圧の適応）',
        '抗血栓療法の検討（発症時間に応じてt-PA・血管内治療の適応評価）',
      ],
      workup:['MRI DWI/MRA（最優先）','頭部CT（出血除外の初期スクリーニング）','CBC・凝固','電解質・腎機能','心電図（AF→塞栓源）','心エコー（塞栓源検索）'],
      disposition:'脳卒中ユニット or ICU',
      pitfall:'「小脳梗塞」は初期CTで正常なことが多い。めまい＋HINTSで中枢パターンなら、CT正常でもMRIを撮る。AICA領域梗塞は難聴を合併し、末梢性と誤診されやすい',
    },
  },

  hints_uncertain: {
    id:'hints_uncertain', title:'HINTSの判定に迷う場合',
    result:{
      severity:'urgent',
      title:'判断困難 — 安全側に精査',
      actions:[
        'リスク因子の評価: 高齢、AF、高血圧、糖尿病、脂質異常、喫煙',
        'リスク因子あり → MRI DWIを施行（中枢性を除外）',
        'リスク因子なし＋若年 → 経過観察可。ただし悪化時は再受診指導',
        '小脳症状（指鼻試験・踵膝試験・歩行）を慎重に再評価',
        '判断に迷ったら脳神経内科にコンサルト',
      ],
      workup:['MRI DWI/MRA（閾値低く施行）','頭部CT','CBC・電解質','心電図'],
      disposition:'MRI結果次第。中枢性否定されれば帰宅可。判断つかない場合は入院観察',
      pitfall:'「めまい＋歩行困難」は小脳梗塞のred flag。「高齢者のめまいで歩けない」を安易にBPPVと診断しない',
    },
  },

  bppv: {
    id:'bppv', title:'良性発作性頭位めまい症（BPPV）',
    result:{
      severity:'low',
      title:'BPPV — 耳石置換法で治療',
      actions:[
        '確認: Dix-Hallpike テスト → 後半規管型（最多、80%）',
        '治療: Epley法（後半規管型）→ 成功率80-90%',
        '水平半規管型: 水平方向の頭位変換で誘発 → Lempert法（BBQ roll法）',
        '抗めまい薬は原則不要（Epley法の方が有効）',
        '再発予防: 就寝時の頭位挙上、急な頭位変換を避ける',
        '1-2週間で自然軽快することも多い。4週以上持続→耳鼻科紹介',
      ],
      workup:['Dix-Hallpikeテスト（診察で確定）','追加検査は通常不要'],
      disposition:'帰宅',
      pitfall:'BPPVは「頭位変換で誘発され、30-60秒で消失する」のが典型。持続性のめまいをBPPVと診断しない。高齢者のBPPVと中枢性めまいは合併しうる',
    },
  },

  meniere: {
    id:'meniere', title:'難聴・耳鳴りを伴うめまい',
    result:{
      severity:'moderate',
      title:'メニエール病 / 突発性難聴の鑑別',
      actions:[
        '聴力検査（Weber/Rinne → 感音性難聴の確認。オージオグラムが理想）',
        '突発性難聴: ステロイド早期投与が予後を改善（発症2週間以内）→ 耳鼻科緊急紹介',
        'メニエール病: 回転性めまい + 難聴 + 耳鳴り + 耳閉感の4徴。発作は数時間持続',
        '急性期: 制吐薬 + 安静',
        '突発性難聴が疑われたら即日耳鼻科紹介（ステロイド開始のタイミングが予後を左右）',
        'AICA梗塞の除外: 中枢性サインがないか再確認（HINTSの中枢パターン → MRI）',
      ],
      workup:['聴力検査','神経学的診察','突発性難聴疑い: 即日耳鼻科紹介','MRI（中枢性疑い or 聴神経腫瘍除外目的で後日）'],
      disposition:'突発性難聴→耳鼻科緊急。メニエール病→帰宅可（耳鼻科外来紹介）',
      pitfall:'「めまい＋急性難聴」は突発性難聴の可能性。ステロイド投与開始が遅れると聴力予後が悪化。AICA領域の小脳梗塞もめまい＋難聴を呈する',
    },
  },

  central_signs: {
    id:'central_signs', title:'🧠 小脳症状あり → 中枢性めまい',
    result:{
      severity:'critical',
      title:'小脳症状を伴うめまい — 脳卒中の高リスク',
      actions:[
        '脳卒中プロトコル発動',
        '頭部CT → MRI DWI/MRA',
        '構音障害・嚥下障害・複視・Horner症候群 → Wallenberg症候群を考慮',
        '小脳出血: 4cm超 or 水頭症合併 → 神経外科緊急コンサルト',
        '急性期の過度な降圧を避ける',
        '絶食（嚥下評価まで）',
      ],
      workup:['頭部CT（出血除外）','MRI DWI/MRA','CBC・凝固','心電図','心エコー'],
      disposition:'脳卒中ユニット or ICU',
      pitfall:'小脳梗塞の腫脹は発症24-72hで最大となり、急激に悪化しうる。「最初は歩けていた」患者が数時間後に意識障害をきたすことがある',
    },
  },

  presyncope: {
    id:'presyncope', title:'Step 2: 浮動性めまい — 前失神との鑑別',
    desc:'「ふわふわする」「気が遠くなる」は前失神（presyncope）の可能性。循環器系の評価が必要。',
    result:{
      severity:'moderate',
      title:'浮動性めまい / 前失神 — 循環器・代謝の評価',
      actions:[
        '起立性低血圧の評価（臥位→立位でsBP≧20↓ or HR≧30↑）',
        '12誘導心電図（不整脈・QT延長・Brugada・WPW確認）',
        '貧血の除外（Hbチェック）',
        '血糖チェック',
        '薬剤歴の確認（降圧薬・利尿薬・α遮断薬・抗うつ薬）',
        '脱水の評価と補液',
        '起立性低血圧が確認されたら原因治療（薬剤調整・弾性ストッキング・塩分摂取指導）',
        '不整脈疑い → ホルター心電図（外来フォロー）',
      ],
      workup:['起立試験','心電図','CBC','血糖','電解質','BUN/Cr','必要に応じてホルター・心エコー'],
      disposition:'原因が明確でバイタル安定→帰宅可。不整脈疑い or 繰り返す失神前兆→循環器コンサルト',
      pitfall:'高齢者の「ふらつき」は複数の原因が重なっていることが多い（多因子性めまい：薬剤＋脱水＋起立性低血圧＋視力低下）。1つの原因に帰着させず包括的に評価',
    },
  },

  ataxia: {
    id:'ataxia', title:'Step 2: 歩行時失調 — 中枢性病変の除外',
    result:{
      severity:'urgent',
      title:'歩行失調を伴うめまい — 中枢性の評価',
      actions:[
        '小脳機能検査: 指鼻試験、踵膝試験、rapid alternating movements',
        'Romberg試験: 閉眼で不安定↑→感覚性失調、開眼でも不安定→小脳性失調',
        '頭部CT → MRI（小脳・脳幹病変の除外）',
        '急性発症の失調は脳卒中を最優先で除外',
        '慢性経過の失調: アルコール性小脳変性・薬剤性（フェニトイン等）・MS・傍腫瘍症候群を検討',
        '高齢者: 正常圧水頭症の3徴（歩行障害・認知症・尿失禁）に注意',
      ],
      workup:['神経学的診察','頭部CT/MRI','CBC・電解質','ビタミンB1/B12（慢性失調時）','甲状腺機能','抗てんかん薬濃度（服用中の場合）'],
      disposition:'急性発症→入院精査。慢性経過→脳神経内科外来紹介',
      pitfall:'「歩けないめまい」は小脳梗塞のred flag。座位では問題なくても歩行させて初めて失調が明らかになることがある',
    },
  },
}

const sevColor = {
  critical:{bg:'bg-[#FDECEA]',border:'border-[#D93025]',text:'text-[#B71C1C]',badge:'🚨 緊急'},
  urgent:{bg:'bg-[#FFF8E1]',border:'border-[#F9A825]',text:'text-[#E65100]',badge:'⚠️ 準緊急'},
  moderate:{bg:'bg-[#E8F0FE]',border:'border-[#4285F4]',text:'text-[#1565C0]',badge:'ℹ️ 中等度'},
  low:{bg:'bg-[#E6F4EA]',border:'border-[#34A853]',text:'text-[#1B5E20]',badge:'✅ 低リスク'},
}

export default function DizzinessPage(){
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
        <span>めまい</span>
      </nav>
      <header className="mb-6">
        <span className="inline-block text-sm bg-dnl text-dn px-2.5 py-0.5 rounded-full font-medium mb-2">🚨 ER対応</span>
        <h1 className="text-2xl font-bold text-tx mb-1">めまい</h1>
        <p className="text-sm text-muted">回転性/浮動性/失調の分類 → HINTSで中枢性除外 → BPPV/前庭神経炎/脳卒中の鑑別</p>
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
          <div className="space-y-2">
            {current.choices.map(c=>(
              <button key={c.value} onClick={()=>handleChoice(c.value)}
                className={`w-full text-left p-4 rounded-xl border-2 transition-all ${c.danger?'border-[#D93025]/30 hover:border-[#D93025] hover:bg-[#FDECEA]':'border-br hover:border-ac/40 hover:bg-acl'}`}>
                <span className="text-sm font-medium text-tx">{c.icon&&<span className="mr-2">{c.icon}</span>}{c.label}</span>
              </button>
            ))}
          </div>
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
          {current.choices&&(
            <div className="mt-4 pt-4 border-t border-black/10"><div className="space-y-2">{current.choices.map(c=>(
              <button key={c.value} onClick={()=>handleChoice(c.value)} className="w-full text-left p-3 rounded-xl border-2 border-white/40 hover:border-white/80 hover:bg-white/30 transition-all">
                <span className="text-sm font-medium text-tx">{c.icon&&<span className="mr-2">{c.icon}</span>}{c.label}</span>
              </button>
            ))}</div></div>
          )}
          <button onClick={reset} className="mt-4 w-full py-2.5 bg-white/60 rounded-xl text-sm font-medium text-tx hover:bg-white/80 transition-colors">最初からやり直す</button>
        </div>
      )}
      <section className="mb-8"><h2 className="text-lg font-bold mb-3">関連ツール</h2>
        <div className="flex flex-wrap gap-2">
          {[{href:'/tools/er/syncope',name:'失神'},{href:'/tools/er/altered-consciousness',name:'意識障害'},{href:'/tools/er/chest-pain',name:'胸痛'},{href:'/tools/calc/gcs',name:'GCS'}].map(t=>(
            <Link key={t.href} href={t.href} className="text-sm bg-s1 text-tx px-3 py-1.5 rounded-lg hover:bg-acl hover:text-ac transition-colors">{t.name}</Link>
          ))}
        </div>
      </section>
      <ERDisclaimerFooter />
      <section className="mb-8"><h2 className="text-lg font-bold mb-3">参考文献</h2>
        <ol className="list-decimal list-inside text-sm text-muted space-y-2">
          <li>Kattah JC et al. HINTS to Diagnose Stroke in the Acute Vestibular Syndrome. Stroke 2009</li>
          <li>Edlow JA et al. Diagnosis and Initial Management of Cerebellar Infarction. Lancet Neurol 2008</li>
          <li>日本めまい平衡医学会. めまいの診療ガイドライン 2021</li>
          <li>Bhattacharyya N et al. AAO-HNS Clinical Practice Guideline: BPPV. Otolaryngol Head Neck Surg 2017</li>
        </ol>
      </section>
    </div>
  )
}
