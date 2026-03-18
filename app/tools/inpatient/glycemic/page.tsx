'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ERDisclaimerBanner,ERDisclaimerFooter,ERResultCaution } from '@/components/tools/ERDisclaimer'
interface C{label:string;value:string;icon?:string;danger?:boolean}
interface N{id:string;title:string;desc?:string;choices?:C[];result?:{severity:'critical'|'urgent'|'moderate'|'low';title:string;actions:string[];workup:string[];disposition:string;pitfall?:string};next?:(s:string)=>string}
const tree:Record<string,N>={
start:{id:'start',title:'Step 1: 低血糖 or 高血糖？',choices:[
{label:'低血糖（<70mg/dL）',value:'hypo',icon:'📉',danger:true},
{label:'高血糖（>250mg/dL）',value:'hyper',icon:'📈'},
],next:v=>v},
hypo:{id:'hypo',title:'Step 2: 低血糖の重症度',choices:[
{label:'意識障害/けいれん/経口摂取不可',value:'severe_hypo',icon:'🔴',danger:true},
{label:'症状あり（振戦/発汗/動悸）+経口可能',value:'mild_hypo',icon:'🟡'},
{label:'無症候性低血糖（モニタリングで発見）',value:'asymp_hypo',icon:'🟢'},
],next:v=>v},
severe_hypo:{id:'severe_hypo',title:'🔴 重症低血糖',result:{severity:'critical',title:'重症低血糖 — 即座にブドウ糖',
actions:['50%ブドウ糖液 40mL(20g) iv','iv確保困難→グルカゴン 1mg im/sc','10分後に血糖再検→改善なければ追加投与','意識回復後: 糖質摂取（パン/クラッカー等）','SU薬が原因→10%ブドウ糖持続点滴（遷延するため24-48h監視）','インスリン過量→投与量見直し','原因検索と再発予防'],
workup:['血糖（即座に/10分毎）','電解質','インスリン/Cペプチド（原因不明時）','腎機能/肝機能'],
disposition:'血糖安定まで2-4時間毎のモニタリング。SU薬→24-48h',pitfall:'SU薬による低血糖は遷延する（半減期が長い）。ブドウ糖補充後も再低下する'}},
mild_hypo:{id:'mild_hypo',title:'🟡 軽症低血糖',result:{severity:'moderate',title:'軽症低血糖',
actions:['ブドウ糖15-20g経口（ブドウ糖タブレット or ジュース150mL）','15分後に血糖再検','改善後: 次の食事まで時間があれば補食（炭水化物+蛋白質）','原因: インスリン量/食事量/運動量の見直し','SU薬使用中→減量検討'],
workup:['血糖（15分毎に回復確認）'],
disposition:'血糖回復+原因対策で経過観察',pitfall:'αGI（ボグリボース等）使用中はショ糖が吸収されない→必ずブドウ糖を使用'}},
asymp_hypo:{id:'asymp_hypo',title:'🟢 無症候性低血糖',result:{severity:'low',title:'無症候性低血糖',
actions:['ブドウ糖15g経口 or 補食','低血糖の閾値が下がっている可能性（低血糖unawareness）','インスリン/SU薬の減量','血糖目標の見直し（高齢者: やや高めに設定）','食事摂取量の確認'],
workup:['血糖パターンの確認','HbA1c'],
disposition:'薬剤調整',pitfall:'無症候性低血糖は繰り返すと低血糖unawarenessが進行→重症化リスク'}},
hyper:{id:'hyper',title:'Step 2: 高血糖の鑑別',desc:'DKA vs HHS vs 単純高血糖。',choices:[
{label:'1型DM/ケトン体↑/アシドーシス → DKA疑い',value:'dka',icon:'🔴',danger:true},
{label:'2型DM/高齢/著明脱水/意識障害 → HHS疑い',value:'hhs',icon:'🔴',danger:true},
{label:'高血糖のみ（250-400）/バイタル安定',value:'simple_hyper',icon:'🟡'},
],next:v=>v},
dka:{id:'dka',title:'🔴 DKA（糖尿病性ケトアシドーシス）',result:{severity:'critical',title:'DKA — 補液+インスリン+K補充',
actions:['生理食塩水 1L/h × 1-2h → 500mL/h → 250mL/h','インスリン: レギュラー 0.1U/kg/h持続（bolus不要の施設も）','K補充: K<3.3→K補充を先に（インスリン前に）、K 3.3-5.3→20-30mEq/L in 輸液','血糖200-250に下がったら→5%ブドウ糖+生食に変更','目標: 血糖150-200、AG閉鎖、HCO3>18','DKA改善後: 皮下インスリンに切替（持続停止1-2h前にSC投与開始）','誘因検索: 感染/インスリン中断/新規発症DM'],
workup:['血糖（1h毎）','ABG/VBG（pH/HCO3）','電解質（2h毎: Na/K/Cl）','AG計算','BUN/Cr','血中/尿中ケトン体','CBC/CRP（感染検索）','心電図（高K時）'],
disposition:'ICU管理',pitfall:'K<3.3でインスリン開始は致死的不整脈のリスク。インスリンの前にK確認・補充'}},
hhs:{id:'hhs',title:'🔴 HHS（高浸透圧高血糖状態）',result:{severity:'critical',title:'HHS — 大量補液が最優先',
actions:['生理食塩水 1L/h × 1-2h → 500mL/h（著明な脱水: 平均9L不足）','補正Na>145→0.45%NaCl に変更','インスリン: 0.1U/kg/h持続（DKAより少量。血糖低下は100mg/dL/h以下が安全）','K補充: DKAと同様','血糖300に下がったら5%ブドウ糖加','浸透圧の急激な低下を避ける（脳浮腫リスク）','誘因検索: 感染（最多）/脱水/新規DM','DVT予防（脱水+高浸透圧で血栓リスク高い）'],
workup:['血糖（1h毎）','電解質（2h毎）','浸透圧','BUN/Cr','CBC/CRP','尿検査','胸部X線'],
disposition:'ICU管理',pitfall:'HHSはDKAより死亡率高い（10-20%）。浸透圧の急速な低下は脳浮腫→ゆっくり補正'}},
simple_hyper:{id:'simple_hyper',title:'🟡 単純高血糖',result:{severity:'moderate',title:'高血糖（DKA/HHSなし）',
actions:['補正インスリン: スライディングスケール（施設プロトコルに従う）','原因: ステロイド使用/感染/食事/インスリン量不足','ステロイド高血糖→インスリン追加（特に昼〜夕が高い）','経口摂取不良+高血糖→基礎インスリンの減量','血糖目標: 一般入院 140-180mg/dL','HbA1cで既往の血糖管理状況を確認'],
workup:['血糖（食前+就寝前の4検/日）','HbA1c','電解質','尿ケトン'],
disposition:'インスリン調整で経過観察',pitfall:'入院中の厳格な血糖コントロール（<110）は低血糖リスクが上回る。目標140-180'}},
}

export default function Page(){const[path,setPath]=useState(['start']);const cur=tree[path[path.length-1]]||tree.start;const goBack=()=>setPath(p=>p.length>1?p.slice(0,-1):p);const choose=(v:string)=>{const n=cur.next?.(v)||v;if(tree[n])setPath(p=>[...p,n])};const reset=()=>setPath(['start']);const sev={'critical':'bg-red-600','urgent':'bg-orange-500','moderate':'bg-yellow-500','low':'bg-green-600'};const sevL={'critical':'\ud83d\udd34 緊急','urgent':'\ud83d\udfe0 急ぎ','moderate':'\ud83d\udfe1 準緊急','low':'\ud83d\udfe2 低緊急'};return(<main className="max-w-3xl mx-auto px-4 py-8"><nav className="text-sm text-muted mb-4"><Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span><Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span><Link href="/tools/inpatient" className="hover:text-ac">入院中トラブル</Link><span className="mx-2">›</span><span>血糖異常</span></nav><h1 className="text-xl font-bold text-tx mb-4">🩸 血糖異常 対応フロー</h1><ERDisclaimerBanner/><div className="my-6 bg-s0 border border-br rounded-2xl p-6">{path.length>1&&<button onClick={goBack} className="text-xs text-muted hover:text-ac mb-3 flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>戻る</button>}<h2 className="text-base font-bold text-tx mb-1">{cur.title}</h2>{cur.desc&&<p className="text-xs text-muted mb-4 leading-relaxed">{cur.desc}</p>}{cur.choices&&(<div className="space-y-2 mt-4">{cur.choices.map(c=>(<button key={c.value} onClick={()=>choose(c.value)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all hover:border-ac/40 hover:bg-acl ${c.danger?'border-red-200 bg-red-50/50':'border-br'}`}><span className="text-sm font-medium text-tx">{c.icon&&<span className="mr-2">{c.icon}</span>}{c.label}</span></button>))}</div>)}{cur.result&&(<div className="mt-2"><ERResultCaution/><div className="flex items-center gap-2 mb-4"><span className={`text-xs text-white font-bold px-2 py-1 rounded ${sev[cur.result.severity]}`}>{sevL[cur.result.severity]}</span><span className="text-base font-bold text-tx">{cur.result.title}</span></div><S t="対応" items={cur.result.actions}/><S t="検査" items={cur.result.workup}/><div className="mt-3 bg-s1 rounded-lg p-3"><p className="text-[10px] text-muted mb-0.5">Disposition</p><p className="text-xs text-tx font-medium">{cur.result.disposition}</p></div>{cur.result.pitfall&&<div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3"><p className="text-[10px] text-amber-700 font-bold mb-0.5">⚠️ Pitfall</p><p className="text-xs text-amber-900 leading-relaxed">{cur.result.pitfall}</p></div>}<button onClick={reset} className="mt-4 w-full py-2.5 rounded-xl border border-br text-sm font-medium text-muted hover:text-tx transition-colors">最初からやり直す</button></div>)}</div><ERDisclaimerFooter/></main>)}
function S({t,items}:{t:string;items:string[]}){return(<div className="mt-3"><p className="text-xs font-bold text-tx mb-2">{t}</p><ul className="space-y-1.5">{items.map((a,i)=><li key={i} className="text-xs text-muted leading-relaxed flex gap-2"><span className="text-ac flex-shrink-0 mt-0.5">•</span><span>{a}</span></li>)}</ul></div>)}
