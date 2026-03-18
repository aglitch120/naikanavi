'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ERDisclaimerBanner,ERDisclaimerFooter,ERResultCaution } from '@/components/tools/ERDisclaimer'
interface C{label:string;value:string;icon?:string;danger?:boolean}
interface N{id:string;title:string;desc?:string;choices?:C[];result?:{severity:'critical'|'urgent'|'moderate'|'low';title:string;actions:string[];workup:string[];disposition:string;pitfall?:string};next?:(s:string)=>string}
const tree:Record<string,N>={
start:{id:'start',title:'Step 1: ショックの初期評価',desc:'sBP<90/MAP<65/sBP 30以上低下+末梢循環不全。まず輸液路確保+モニタリング+酸素投与。',choices:[
{label:'出血/体液喪失（手術後/消化管出血/脱水）',value:'hypo',icon:'🩸',danger:true},
{label:'心原性（胸痛/不整脈/心不全既往）',value:'cardio',icon:'💔',danger:true},
{label:'閉塞性（PE/緊張性気胸/心タンポナーデ）',value:'obst',icon:'🫁',danger:true},
{label:'敗血症性（発熱+感染徴候）',value:'septic',icon:'🦠',danger:true},
{label:'アナフィラキシー（薬剤投与後）',value:'ana',icon:'🚨',danger:true},
],next:v=>v},
hypo:{id:'hypo',title:'🩸 循環血液量減少性ショック',result:{severity:'critical',title:'出血性/体液喪失性ショック',
actions:['太い末梢静脈路2本（18G以上）確保','初期輸液: 生食/乳酸リンゲル 500-1000mL急速投与','出血性: 輸血準備（T&S→必要時O型RBC）、止血術手配','大量輸血プロトコル: RBC:FFP:PC = 1:1:1','目標: MAP≧65, 尿量≧0.5mL/kg/h, 乳酸クリアランス','脱水: 原因検索（嘔吐/下痢/3rd space）+ 補液'],
workup:['CBC（Hb経時的フォロー）','凝固（PT/APTT/Fib）','乳酸値','電解質/腎機能','血液型+クロスマッチ','FAST/CT（出血源検索）'],
disposition:'ICU管理。止血術が必要な場合は即座に手配',
pitfall:'初期Hbは出血量を反映しない。血圧正常でも頻脈+乳酸↑はショックの始まり'}},
cardio:{id:'cardio',title:'💔 心原性ショック',result:{severity:'critical',title:'心原性ショック — ポンプ不全',
actions:['心電図: STEMI→緊急PCI','心エコー: 壁運動/弁膜症/タンポナーデ評価','輸液は慎重（肺うっ血なければ250mL試行）','昇圧: ドブタミン or ノルアドレナリン','肺うっ血→フロセミド 20-40mg iv','重症: IABP/ECMO検討（循環器コンサルト）'],
workup:['12誘導心電図','心エコー','トロポニン','BNP/NT-proBNP','乳酸値','胸部X線'],
disposition:'CCU/ICU。STEMI→緊急カテ室',
pitfall:'心原性に大量輸液は禁忌。右室梗塞は輸液で改善（左室不全と逆）'}},
obst:{id:'obst',title:'🫁 閉塞性ショック',result:{severity:'critical',title:'閉塞性ショック — 機械的閉塞解除',
actions:['緊張性気胸: 即座に針脱気→胸腔ドレーン','心タンポナーデ: 心エコー確認→心嚢穿刺','大量PE: CTPA→ヘパリン→血栓溶解療法','輸液: 右室前負荷維持のため500mL急速投与','昇圧: ノルアドレナリン'],
workup:['胸部X線（気胸/縦隔偏位）','心エコー（心嚢液/右室拡大）','CTPA（PE疑い）','心電図（S1Q3T3）'],
disposition:'ICU管理。緊張性気胸→即時処置',
pitfall:'緊張性気胸は画像を待たない（臨床診断で即時脱気）'}},
septic:{id:'septic',title:'🦠 敗血症性ショック',result:{severity:'critical',title:'敗血症性ショック — Hour-1 Bundle',
actions:['血培2セット→1時間以内に広域抗菌薬','晶質液 30mL/kg を3時間以内','MAP<65持続→ノルアドレナリン開始','感染源コントロール（膿瘍ドレナージ/デバイス抜去）','バソプレシン追加（ノルアド高用量で不十分時）','ステロイド: HC 200mg/日（昇圧剤反応不良時）'],
workup:['血液培養2セット','乳酸値','CBC/CRP/PCT','電解質/腎機能/肝機能','凝固（DICスクリーニング）','尿検査/尿培養','感染巣の画像検査'],
disposition:'ICU管理。Hour-1 Bundle完遂',
pitfall:'培養採取後すぐに抗菌薬。輸液反応性なき患者への過剰輸液は肺水腫リスク'}},
ana:{id:'ana',title:'🚨 アナフィラキシーショック',result:{severity:'critical',title:'アナフィラキシーショック',
actions:['アドレナリン 0.3-0.5mg筋注（大腿外側）— 最重要','原因薬剤の投与中止','生理食塩水 1-2L急速投与','仰臥位+下肢挙上','アドレナリン追加（5-15分毎、最大3回）','気道閉塞→挿管準備（外科的気道確保も準備）','mPSL 125mg iv + ジフェンヒドラミン 50mg iv'],
workup:['トリプターゼ（1-2h後）','バイタルモニタリング','心電図'],
disposition:'最低6-8h経過観察（二相性反応）。重症→ICU',
pitfall:'アドレナリンの躊躇が最大のリスク。iv投与は1:10000で少量ずつ'}},
}
export default function Page(){const[path,setPath]=useState(['start']);const cur=tree[path[path.length-1]]||tree.start;const goBack=()=>setPath(p=>p.length>1?p.slice(0,-1):p);const choose=(v:string)=>{const n=cur.next?.(v)||v;if(tree[n])setPath(p=>[...p,n])};const reset=()=>setPath(['start']);const sev={'critical':'bg-red-600','urgent':'bg-orange-500','moderate':'bg-yellow-500','low':'bg-green-600'};const sevL={'critical':'🔴 緊急','urgent':'🟠 急ぎ','moderate':'🟡 準緊急','low':'🟢 低緊急'};return(<main className="max-w-3xl mx-auto px-4 py-8"><nav className="text-sm text-muted mb-4"><Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span><Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span><Link href="/tools/inpatient" className="hover:text-ac">入院中トラブル</Link><span className="mx-2">›</span><span>ショック</span></nav><h1 className="text-xl font-bold text-tx mb-4">🔴 ショック（血圧低下）対応フロー</h1><ERDisclaimerBanner/><div className="my-6 bg-s0 border border-br rounded-2xl p-6">{path.length>1&&<button onClick={goBack} className="text-xs text-muted hover:text-ac mb-3 flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>戻る</button>}<h2 className="text-base font-bold text-tx mb-1">{cur.title}</h2>{cur.desc&&<p className="text-xs text-muted mb-4 leading-relaxed">{cur.desc}</p>}{cur.choices&&(<div className="space-y-2 mt-4">{cur.choices.map(c=>(<button key={c.value} onClick={()=>choose(c.value)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all hover:border-ac/40 hover:bg-acl ${c.danger?'border-red-200 bg-red-50/50':'border-br'}`}><span className="text-sm font-medium text-tx">{c.icon&&<span className="mr-2">{c.icon}</span>}{c.label}</span></button>))}</div>)}{cur.result&&(<div className="mt-2"><ERResultCaution/><div className="flex items-center gap-2 mb-4"><span className={`text-xs text-white font-bold px-2 py-1 rounded ${sev[cur.result.severity]}`}>{sevL[cur.result.severity]}</span><span className="text-base font-bold text-tx">{cur.result.title}</span></div><S t="対応" items={cur.result.actions}/><S t="検査" items={cur.result.workup}/><div className="mt-3 bg-s1 rounded-lg p-3"><p className="text-[10px] text-muted mb-0.5">Disposition</p><p className="text-xs text-tx font-medium">{cur.result.disposition}</p></div>{cur.result.pitfall&&<div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3"><p className="text-[10px] text-amber-700 font-bold mb-0.5">⚠️ Pitfall</p><p className="text-xs text-amber-900 leading-relaxed">{cur.result.pitfall}</p></div>}<button onClick={reset} className="mt-4 w-full py-2.5 rounded-xl border border-br text-sm font-medium text-muted hover:text-tx transition-colors">最初からやり直す</button></div>)}</div><ERDisclaimerFooter/></main>)}
function S({t,items}:{t:string;items:string[]}){return(<div className="mt-3"><p className="text-xs font-bold text-tx mb-2">{t}</p><ul className="space-y-1.5">{items.map((a,i)=><li key={i} className="text-xs text-muted leading-relaxed flex gap-2"><span className="text-ac flex-shrink-0 mt-0.5">•</span><span>{a}</span></li>)}</ul></div>)}
