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
    id:'start', title:'Step 1: Red Flagの有無',
    desc:'頭痛のER評価では「二次性頭痛の除外」が最優先。以下のRed Flagがあれば緊急精査。',
    choices:[
      {label:'雷鳴頭痛（Thunderclap: 突然発症、秒単位でピークに達する最悪の頭痛）',value:'thunderclap',icon:'⚡',danger:true},
      {label:'神経学的異常所見（片麻痺・失語・複視・意識障害・痙攣）',value:'neuro_deficit',icon:'🧠',danger:true},
      {label:'発熱 + 頭痛（± 項部硬直・意識障害）',value:'fever_headache',icon:'🌡️',danger:true},
      {label:'50歳以上の新規発症頭痛',value:'elderly_new',icon:'👴'},
      {label:'免疫不全 or 悪性腫瘍の既往',value:'immunocompromised',icon:'⚠️',danger:true},
      {label:'Red Flagなし（慢性の頭痛パターンと同じ）',value:'no_redflag',icon:'✅'},
    ],
    next:v=>v,
  },

  thunderclap: {
    id:'thunderclap', title:'🚨 雷鳴頭痛 → SAH除外',
    result:{
      severity:'critical',
      title:'雷鳴頭痛 — くも膜下出血の除外',
      actions:[
        '頭部CT（単純）→ 発症6h以内なら感度98-100%',
        'CT陰性 → 腰椎穿刺（キサントクロミー/赤血球数でSAH除外）',
        '　LP: 発症12h以降に施行するのが理想（キサントクロミーの検出感度が上がる）',
        'SAH確認 → CT血管造影（CTA）で動脈瘤の部位特定',
        '脳外科緊急コンサルト（クリッピング or コイル塞栓の判断）',
        '再破裂予防: 安静、血圧管理（sBP <160目標）、鎮痛（モルヒネ等）、制吐薬',
        'SAH否定でもRCVS（可逆性脳血管攣縮症候群）・脳静脈血栓症・動脈解離を検討',
      ],
      workup:['頭部CT（単純）','腰椎穿刺（CT陰性時）','CTA or MRA','CBC・凝固','電解質','心電図'],
      disposition:'SAH確認 → ICU/脳外科。SAH否定でもCTA/MRAで血管評価追加が望ましい',
      pitfall:'「CT正常 → SAH否定」ではない。発症6h以降のCT感度は低下する。sentinel headache（警告頭痛：SAH本発作の数日前の軽い頭痛）を見逃さない',
    },
  },

  neuro_deficit: {
    id:'neuro_deficit', title:'🧠 神経学的異常所見あり',
    result:{
      severity:'critical',
      title:'頭痛 + 局所神経症状 — 脳卒中/腫瘍/膿瘍の除外',
      actions:[
        '頭部CT → 出血・腫瘍・水頭症の除外',
        'CT正常でも症状持続 → MRI DWI（虚血性脳卒中の評価）',
        '片麻痺＋頭痛: 脳出血、脳梗塞（特に内頚動脈解離）、脳腫瘍を検討',
        '乳頭浮腫あり → 頭蓋内圧亢進（腫瘍・水頭症・静脈血栓症）',
        '急性発症の片頭痛（hemiplegic migraine）は除外診断',
        '頚動脈/椎骨動脈解離: Horner症候群 + 頚部痛 + 同側の頭痛 → CTA/MRA',
      ],
      workup:['頭部CT','MRI DWI/MRA','CTA（血管解離疑い時）','CBC・凝固・CRP','眼底検査（乳頭浮腫）'],
      disposition:'入院精査（原因に応じて脳外科 or 神経内科）',
      pitfall:'「片頭痛の既往がある」だけで局所神経症状を片頭痛に帰着させない。新規の局所症状は必ず画像精査',
    },
  },

  fever_headache: {
    id:'fever_headache', title:'🌡️ 発熱 + 頭痛 → 髄膜炎/脳炎除外',
    result:{
      severity:'critical',
      title:'発熱 + 頭痛 — 中枢神経感染症の除外',
      actions:[
        'Jolt accentuation test（頭振り試験）: 陽性なら髄膜炎の可能性↑',
        '血液培養2セット（腰椎穿刺前に採取）',
        '頭部CT: 腰椎穿刺前に頭蓋内圧亢進の除外が必要な場合（免疫不全・局所神経症状・乳頭浮腫・痙攣）',
        '腰椎穿刺: 細胞数・分画・蛋白・糖・グラム染色・培養',
        '細菌性髄膜炎疑い → 抗菌薬を可及的速やかに投与（LP結果を待たない）',
        '　CTRX + VCM ± ABPC（リステリア：高齢者・免疫不全）+ デキサメタゾン（成人）',
        '脳炎疑い（意識障害・痙攣・人格変化）→ アシクロビル追加（HSV脳炎）',
      ],
      workup:['血液培養2セット','頭部CT（LP前に必要な場合）','腰椎穿刺','CBC・CRP・PCT','電解質・腎機能','血糖（髄液糖/血糖比計算用）'],
      disposition:'入院（細菌性髄膜炎疑い → ICU）',
      pitfall:'「LP待ちで抗菌薬遅延」は致命的。細菌性髄膜炎を疑ったら、血培採取後すぐに抗菌薬投与。CT→LP→抗菌薬の順番にこだわらない',
    },
  },

  elderly_new: {
    id:'elderly_new', title:'50歳以上の新規発症頭痛',
    result:{
      severity:'urgent',
      title:'高齢者の新規頭痛 — 巨細胞性動脈炎(GCA)/腫瘍/慢性硬膜下血腫',
      actions:[
        '側頭動脈の触診（圧痛・怒張・拍動消失 → GCA疑い）',
        'ESR/CRP測定（GCA: ESR > 50が典型。ただしESR正常でもGCA否定できず）',
        'GCA疑い → 視力低下がなくても失明予防のためステロイド即日開始（PSL 40-60mg/日）→ 側頭動脈生検',
        '頭部CT/MRI（慢性硬膜下血腫、脳腫瘍、転移性腫瘍の除外）',
        '咬筋跛行（咀嚼時の疲労感・痛み）はGCAに比較的特異的',
        '眼科コンサルト（GCA疑い時: 視力・視野評価）',
      ],
      workup:['ESR・CRP','CBC','肝腎機能','頭部CT/MRI','GCA疑い: 眼科受診・側頭動脈生検（リウマチ科/脳外科）'],
      disposition:'GCA疑いでステロイド開始→外来フォロー可（視力正常なら）。脳腫瘍等→入院',
      pitfall:'GCAによる失明は不可逆。ESR/CRP上昇＋新規頭痛＋50歳以上ならステロイド開始を躊躇しない（生検結果を待たない）',
    },
  },

  immunocompromised: {
    id:'immunocompromised', title:'⚠️ 免疫不全 / 悪性腫瘍の既往',
    result:{
      severity:'urgent',
      title:'免疫不全者の頭痛 — 日和見感染/転移の評価',
      actions:[
        '頭部CT → MRI（造影: 膿瘍・転移・トキソプラズマ・リンパ腫）',
        '腰椎穿刺: 通常検査 + クリプトコッカス抗原 + 結核PCR + 細胞診',
        'HIV未診断なら HIV検査',
        'CD4 < 200: トキソプラズマ脳炎、クリプトコッカス髄膜炎、PML、CNSリンパ腫を考慮',
        '悪性腫瘍: 髄膜癌腫症（癌性髄膜炎）、脳転移、薬剤性（髄注後 etc）',
      ],
      workup:['頭部MRI（造影）','腰椎穿刺（圧測定含む）','クリプトコッカス抗原','CD4カウント','血液培養','結核検査','細胞診'],
      disposition:'入院精査',
      pitfall:'免疫不全者の「軽い頭痛」でもクリプトコッカス髄膜炎は除外が必要。初圧が高い場合は繰り返しLPで減圧が必要なこともある',
    },
  },

  no_redflag: {
    id:'no_redflag', title:'Step 2: Red Flagなし — 一次性頭痛の評価',
    desc:'Red Flagがなければ一次性頭痛（片頭痛・緊張型頭痛・群発頭痛）の可能性が高い。',
    choices:[
      {label:'片側性 + 拍動性 + 悪心/光/音過敏（片頭痛パターン）',value:'migraine',icon:'🌗'},
      {label:'両側性 + 圧迫感 + 日常動作で悪化しない（緊張型）',value:'tension',icon:'😣'},
      {label:'片側眼窩部 + 激痛 + 流涙/鼻汁/結膜充血（群発頭痛パターン）',value:'cluster',icon:'🔥'},
      {label:'鎮痛薬を月15日以上使用（薬物乱用頭痛の可能性）',value:'moh',icon:'💊'},
    ],
    next:v=>v,
  },

  migraine: {
    id:'migraine', title:'片頭痛',
    result:{severity:'low',title:'片頭痛 — 急性期治療と予防',
      actions:['急性期: トリプタン（スマトリプタン50mg内服 or 皮下注）。発作早期に服用するほど有効','制吐薬: メトクロプラミド 10mg iv → 頭痛自体にも効果あり','NSAIDs: イブプロフェン400mg or ナプロキセン500mg（軽度〜中等度）','アセトアミノフェン1000mg（NSAIDs禁忌時）','ER頭痛カクテル: メトクロプラミド + ジフェンヒドラミン + ケトロラク iv','予防治療の検討: 月4回以上の発作 → 脳神経内科紹介（プロプラノロール/バルプロ酸/トピラマート/CGRP抗体）'],
      workup:['通常不要（典型的パターンで既知の場合）','新規の場合は頭部CTを検討（安心のため）'],
      disposition:'帰宅（急性期治療で改善後）',
      pitfall:'「いつもの片頭痛」でも、パターンの変化（新しい症状・今までにない強さ・初めての前兆）があれば二次性頭痛の除外が必要',
    },
  },

  tension: {
    id:'tension', title:'緊張型頭痛',
    result:{severity:'low',title:'緊張型頭痛 — 対症療法',
      actions:['アセトアミノフェン1000mg or イブプロフェン400mg（第一選択）','筋緊張緩和: 温罨法、ストレッチ、マッサージ','慢性化予防: 睡眠衛生指導、ストレス管理、定期運動','慢性型（月15日以上）→ アミトリプチリン少量（10-25mg就寝前）検討'],
      workup:['通常不要'],
      disposition:'帰宅',
      pitfall:'緊張型頭痛の頻度が増加している場合は薬物乱用頭痛（MOH）を疑う',
    },
  },

  cluster: {
    id:'cluster', title:'群発頭痛',
    result:{severity:'moderate',title:'群発頭痛 — 酸素＋トリプタン',
      actions:['【急性期第一選択】100%酸素 12L/min（15分間、フェイスマスク）→ 15分以内に70%が改善','スマトリプタン6mg皮下注（酸素と同等の効果。内服は効果発現が遅い）','予防: ベラパミル（群発期に開始）→ 脳神経内科で管理','短期ブリッジ: プレドニゾロン60-80mg → 漸減（群発期初期に）','群発期間中のアルコール回避'],
      workup:['通常不要（典型的パターン）','初発: MRI（下垂体腫瘍等の二次性除外）'],
      disposition:'帰宅（酸素/トリプタンで改善後）。脳神経内科紹介',
      pitfall:'群発頭痛は「自殺頭痛」とも呼ばれるほど激痛。患者の苦痛を過小評価しない。三叉神経・自律神経性頭痛（TACs）の他の型（SUNCT等）との鑑別も',
    },
  },

  moh: {
    id:'moh', title:'薬物乱用頭痛（MOH）',
    result:{severity:'moderate',title:'薬物乱用頭痛 — 原因薬剤の漸減',
      actions:['原因薬剤の特定: トリプタン≧月10日、NSAIDs/アセトアミノフェン≧月15日で発症リスク','原因薬剤の中止/漸減（離脱頭痛が2-10日間出現する旨を説明）','離脱期のブリッジ: ナプロキセン500mg×2/日（10日間限定）or プレドニゾロン短期','予防薬の導入: トピラマート or アミトリプチリン or CGRP抗体','頭痛ダイアリーの指導（月あたりの頭痛日数と薬剤使用日数を記録）','脳神経内科/頭痛外来紹介'],
      workup:['通常不要（薬剤使用歴で臨床診断）'],
      disposition:'帰宅。脳神経内科/頭痛外来紹介',
      pitfall:'MOHは「鎮痛薬を飲むほど頭痛が悪化する」悪循環。患者への丁寧な説明が治療成功の鍵',
    },
  },
}

const sevColor = {
  critical:{bg:'bg-[#FDECEA]',border:'border-[#D93025]',text:'text-[#B71C1C]',badge:'🚨 緊急'},
  urgent:{bg:'bg-[#FFF8E1]',border:'border-[#F9A825]',text:'text-[#E65100]',badge:'⚠️ 準緊急'},
  moderate:{bg:'bg-[#E8F0FE]',border:'border-[#4285F4]',text:'text-[#1565C0]',badge:'ℹ️ 中等度'},
  low:{bg:'bg-[#E6F4EA]',border:'border-[#34A853]',text:'text-[#1B5E20]',badge:'✅ 低リスク'},
}

export default function HeadachePage(){
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
        <span>頭痛</span>
      </nav>
      <header className="mb-6">
        <span className="inline-block text-sm bg-dnl text-dn px-2.5 py-0.5 rounded-full font-medium mb-2">🚨 ER対応</span>
        <h1 className="text-2xl font-bold text-tx mb-1">頭痛</h1>
        <p className="text-sm text-muted">Red Flag評価 → 二次性頭痛の除外（SAH・髄膜炎・GCA）→ 一次性頭痛の治療</p>
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
          {[{href:'/tools/er/altered-consciousness',name:'意識障害'},{href:'/tools/er/seizure',name:'けいれん'},{href:'/tools/er/fever',name:'発熱'},{href:'/tools/calc/gcs',name:'GCS'},{href:'/tools/calc/nihss',name:'NIHSS'}].map(t=>(
            <Link key={t.href} href={t.href} className="text-sm bg-s1 text-tx px-3 py-1.5 rounded-lg hover:bg-acl hover:text-ac transition-colors">{t.name}</Link>
          ))}
        </div>
      </section>
      <ERDisclaimerFooter />
      <section className="mb-8"><h2 className="text-lg font-bold mb-3">参考文献</h2>
        <ol className="list-decimal list-inside text-sm text-muted space-y-2">
          <li>Edlow JA et al. Avoiding Pitfalls in the Diagnosis of SAH. NEJM 2000</li>
          <li>Headache Classification Committee of IHS. ICHD-3. Cephalalgia 2018</li>
          <li>Do TP et al. Red and orange flags for secondary headaches. Neurology 2019</li>
          <li>日本頭痛学会. 頭痛の診療ガイドライン 2021</li>
        </ol>
      </section>
    </div>
  )
}
