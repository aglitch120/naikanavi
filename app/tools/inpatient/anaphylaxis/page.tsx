'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ERDisclaimerBanner,ERDisclaimerFooter,ERResultCaution } from '@/components/tools/ERDisclaimer'
interface C{label:string;value:string;icon?:string;danger?:boolean}
interface N{id:string;title:string;desc?:string;choices?:C[];result?:{severity:'critical'|'urgent'|'moderate'|'low';title:string;actions:string[];workup:string[];disposition:string;pitfall?:string};next?:(s:string)=>string}
const tree:Record<string,N>={
start:{id:'start',title:'Step 1: アナフィラキシーの重症度',desc:'2臓器以上の症状（皮膚+呼吸器/循環器/消化器）or 既知アレルゲン曝露後の急速な血圧低下/気道狭窄。',choices:[
{label:'ショック（血圧低下/意識障害）',value:'shock',icon:'🔴',danger:true},
{label:'気道症状（喘鳴/嗄声/呼吸困難）',value:'airway',icon:'🫁',danger:true},
{label:'皮膚+消化器症状のみ（蕁麻疹/嘔吐/下痢）',value:'moderate',icon:'🟡'},
],next:v=>v},
shock:{id:'shock',title:'🔴 アナフィラキシーショック',result:{severity:'critical',title:'アナフィラキシーショック — アドレナリン筋注',
actions:['①アドレナリン 0.3-0.5mg筋注（大腿外側中央）— 即座に','②原因薬剤/アレルゲンの投与中止','③仰臥位+下肢挙上（呼吸困難時は座位可）','④生理食塩水 1-2L急速投与','⑤酸素投与（高流量）','⑥アドレナリン追加: 5-15分毎（改善なければ最大3回）','⑦それでも改善なし→アドレナリン持続iv（0.1μg/kg/min~）','⑧気道確保準備（声門浮腫→挿管困難の可能性→輪状甲状靭帯切開準備）','⑨ステロイド: mPSL 125mg iv or ヒドロコルチゾン 200mg iv','⑩抗ヒスタミン: ジフェンヒドラミン 50mg iv + ファモチジン 20mg iv'],
workup:['バイタル持続モニタリング','トリプターゼ（発症1-2h後に採血）','ABG','心電図'],
disposition:'ICU管理。最低8-12h経過観察（二相性反応）',pitfall:'アドレナリン筋注の躊躇が最大のリスク。「軽症に見える」でも進行は分単位。iv投与は必ず希釈（1:10000）'}},
airway:{id:'airway',title:'🫁 気道症状優位',result:{severity:'critical',title:'気道狭窄 — アドレナリン+気道確保',
actions:['アドレナリン 0.3-0.5mg筋注（即座に）','酸素投与','アドレナリン吸入（1:1000を2.5-5mL ネブライザー）','気道確保準備: 挿管セット+外科的気道確保','喘鳴持続→サルブタモール吸入追加','ステロイド: mPSL 125mg iv','抗ヒスタミン薬'],
workup:['SpO2連続モニタリング','ABG','喉頭ファイバー（声門浮腫評価、余裕があれば）'],
disposition:'気道症状消失まで8-12h以上経過観察',pitfall:'喉頭浮腫は急速進行する。挿管が困難になる前に早めの気道確保判断'}},
moderate:{id:'moderate',title:'🟡 中等症アナフィラキシー',result:{severity:'urgent',title:'中等症 — アドレナリン筋注+経過観察',
actions:['アドレナリン 0.3mg筋注（中等症でも投与が原則）','原因アレルゲンの除去','抗ヒスタミン: ジフェンヒドラミン 50mg iv/im','ステロイド: mPSL 40-125mg iv（二相性反応予防）','バイタルモニタリング','アレルギー科/救急科コンサルト','エピペン処方+アレルギー検査の手配（退院時）','二相性反応: 最初の反応消失後1-12hで再発（20%）'],
workup:['バイタルサイン','トリプターゼ（可能なら）','原因薬剤/食物の記録'],
disposition:'最低6-8h経過観察。二相性反応リスク高い場合は24h',pitfall:'皮膚症状のみでも進行する可能性。軽症と判断しても最低4-6hは観察'}},
}

export default function Page(){const[path,setPath]=useState(['start']);const cur=tree[path[path.length-1]]||tree.start;const goBack=()=>setPath(p=>p.length>1?p.slice(0,-1):p);const choose=(v:string)=>{const n=cur.next?.(v)||v;if(tree[n])setPath(p=>[...p,n])};const reset=()=>setPath(['start']);const sev={'critical':'bg-red-600','urgent':'bg-orange-500','moderate':'bg-yellow-500','low':'bg-green-600'};const sevL={'critical':'\ud83d\udd34 緊急','urgent':'\ud83d\udfe0 急ぎ','moderate':'\ud83d\udfe1 準緊急','low':'\ud83d\udfe2 低緊急'};return(<main className="max-w-3xl mx-auto px-4 py-8"><nav className="text-sm text-muted mb-4"><Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span><Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span><Link href="/tools/inpatient" className="hover:text-ac">入院中トラブル</Link><span className="mx-2">›</span><span>アナフィラキシー</span></nav><h1 className="text-xl font-bold text-tx mb-4">🚨 アナフィラキシー 対応フロー</h1><ERDisclaimerBanner/><div className="my-6 bg-s0 border border-br rounded-2xl p-6">{path.length>1&&<button onClick={goBack} className="text-xs text-muted hover:text-ac mb-3 flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>戻る</button>}<h2 className="text-base font-bold text-tx mb-1">{cur.title}</h2>{cur.desc&&<p className="text-xs text-muted mb-4 leading-relaxed">{cur.desc}</p>}{cur.choices&&(<div className="space-y-2 mt-4">{cur.choices.map(c=>(<button key={c.value} onClick={()=>choose(c.value)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all hover:border-ac/40 hover:bg-acl ${c.danger?'border-red-200 bg-red-50/50':'border-br'}`}><span className="text-sm font-medium text-tx">{c.icon&&<span className="mr-2">{c.icon}</span>}{c.label}</span></button>))}</div>)}{cur.result&&(<div className="mt-2"><ERResultCaution/><div className="flex items-center gap-2 mb-4"><span className={`text-xs text-white font-bold px-2 py-1 rounded ${sev[cur.result.severity]}`}>{sevL[cur.result.severity]}</span><span className="text-base font-bold text-tx">{cur.result.title}</span></div><S t="対応" items={cur.result.actions}/><S t="検査" items={cur.result.workup}/><div className="mt-3 bg-s1 rounded-lg p-3"><p className="text-[10px] text-muted mb-0.5">Disposition</p><p className="text-xs text-tx font-medium">{cur.result.disposition}</p></div>{cur.result.pitfall&&<div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3"><p className="text-[10px] text-amber-700 font-bold mb-0.5">⚠️ Pitfall</p><p className="text-xs text-amber-900 leading-relaxed">{cur.result.pitfall}</p></div>}<button onClick={reset} className="mt-4 w-full py-2.5 rounded-xl border border-br text-sm font-medium text-muted hover:text-tx transition-colors">最初からやり直す</button></div>)}</div><ERDisclaimerFooter/></main>)}
function S({t,items}:{t:string;items:string[]}){return(<div className="mt-3"><p className="text-xs font-bold text-tx mb-2">{t}</p><ul className="space-y-1.5">{items.map((a,i)=><li key={i} className="text-xs text-muted leading-relaxed flex gap-2"><span className="text-ac flex-shrink-0 mt-0.5">•</span><span>{a}</span></li>)}</ul></div>)}
