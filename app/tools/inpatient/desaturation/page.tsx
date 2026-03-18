'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ERDisclaimerBanner,ERDisclaimerFooter,ERResultCaution } from '@/components/tools/ERDisclaimer'
interface C{label:string;value:string;icon?:string;danger?:boolean}
interface N{id:string;title:string;desc?:string;choices?:C[];result?:{severity:'critical'|'urgent'|'moderate'|'low';title:string;actions:string[];workup:string[];disposition:string;pitfall?:string};next?:(s:string)=>string}
const tree:Record<string,N>={
start:{id:'start',title:'Step 1: SpO2低下の初期評価',desc:'SpO2<90% or 4%以上低下。まず気道開通確認→酸素投与→原因検索。',choices:[
{label:'気道閉塞/喘鳴/努力呼吸',value:'airway',icon:'🔴',danger:true},
{label:'片側呼吸音減弱/消失',value:'unilateral',icon:'🫁',danger:true},
{label:'両側ラ音/起座呼吸/頸静脈怒張',value:'chf',icon:'💧'},
{label:'突然発症の呼吸困難+胸痛/頻脈',value:'pe',icon:'🩸',danger:true},
{label:'術後/臥床中の徐々の低下',value:'postop',icon:'🏥'},
{label:'発熱+咳嗽/喀痰',value:'pneumonia',icon:'🌡️'},
],next:v=>v},
airway:{id:'airway',title:'🔴 気道緊急',result:{severity:'critical',title:'気道閉塞 — 即座に対応',
actions:['気道開通: 頭部後屈顎先挙上 or 下顎挙上','口腔内異物の確認・除去（吸引）','経口/経鼻エアウェイ挿入','改善なし→BVM換気→挿管準備','アナフィラキシー→アドレナリン筋注','喉頭浮腫→アドレナリン吸入+ステロイド','挿管困難→外科的気道確保準備'],
workup:['SpO2連続モニタリング','ABG（可能なら）','胸部X線（安定後）'],
disposition:'ICU管理',pitfall:'SpO2は遅延指標。チアノーゼや意識変容が先に出現することも'}},
unilateral:{id:'unilateral',title:'Step 2: 片側呼吸音減弱',choices:[
{label:'緊張性気胸疑い（頸静脈怒張+気管偏位+低血圧）',value:'tension',icon:'🔴',danger:true},
{label:'気胸（バイタル安定）',value:'ptx',icon:'🫁'},
{label:'大量胸水',value:'effusion',icon:'💧'},
{label:'無気肺（術後/粘液栓）',value:'atelectasis',icon:'🏥'},
],next:v=>v},
tension:{id:'tension',title:'🔴 緊張性気胸',result:{severity:'critical',title:'緊張性気胸 — 画像を待たず脱気',
actions:['即座に針脱気: 鎖骨中線第2肋間 or 中腋窩線第5肋間','14-16G針で脱気→シューと空気が出れば確定的','その後胸腔ドレーン留置','酸素投与+輸液路確保'],
workup:['臨床診断で治療開始','胸部X線（処置後確認）'],
disposition:'胸腔ドレーン留置後、ICU管理',pitfall:'画像確認を待って処置が遅れることが最大のリスク'}},
ptx:{id:'ptx',title:'🫁 気胸',result:{severity:'urgent',title:'気胸',
actions:['小さい気胸（<2cm）: 酸素投与+経過観察','中等度以上: 胸腔ドレーン留置','バイタル不安定→緊張性気胸として対応'],
workup:['胸部X線','SpO2モニタリング','ABG（呼吸不全時）'],
disposition:'ドレーン留置後は入院管理',pitfall:'人工呼吸器管理中の気胸は急速に緊張性に移行しうる'}},
effusion:{id:'effusion',title:'💧 大量胸水',result:{severity:'urgent',title:'大量胸水によるSpO2低下',
actions:['治療的胸腔穿刺（一度に1-1.5Lまで）','エコーガイド下穿刺が安全','再膨張性肺水腫に注意','原因検索: Light基準で滲出性/漏出性の鑑別','癌性/感染性→適切な治療','心不全性→利尿薬'],
workup:['胸部X線/CT','エコー（穿刺部位決定）','胸水検査（Light基準・細胞診・培養）','BNP'],
disposition:'原因に応じた治療',pitfall:'急速排液で再膨張性肺水腫のリスク。1.5L以上の排液は慎重に'}},
atelectasis:{id:'atelectasis',title:'🏥 無気肺',result:{severity:'moderate',title:'無気肺 — 術後最多',
actions:['体位変換+深呼吸促進','incentive spirometry（IS）','必要に応じて吸引','早期離床が最善の予防・治療','気管支鏡での粘液栓除去（重症時）'],
workup:['胸部X線','SpO2モニタリング'],
disposition:'経過観察。改善なければ気管支鏡検討',pitfall:'無気肺と肺炎の鑑別: 発熱+膿性痰が続けば肺炎を疑う'}},
chf:{id:'chf',title:'💧 急性心不全増悪',result:{severity:'urgent',title:'急性心不全 — 酸素+利尿+座位',
actions:['座位（起座呼吸の改善）','酸素投与（NPPV考慮: CPAP/BiPAP）','フロセミド 20-40mg iv（既使用量の2倍まで）','ニトログリセリン舌下/iv（sBP>110の場合）','輸液制限','原因検索: 新規不整脈/ACS/感染/コンプライアンス不良','NPPV無効→挿管+人工呼吸器管理'],
workup:['BNP/NT-proBNP','胸部X線','心電図','心エコー','トロポニン','電解質/腎機能'],
disposition:'CCU/ICU管理',pitfall:'利尿薬無効→腎機能悪化?低心拍出?を確認。NPPV早期導入で挿管回避'}},
pe:{id:'pe',title:'🩸 肺塞栓症(PE)',result:{severity:'critical',title:'PE — 抗凝固+必要時血栓溶解',
actions:['ヘパリン: 確定前でも臨床的にPE疑い高ければ開始','massive PE（ショック/低血圧）→血栓溶解療法（rt-PA）','submassive PE（右室機能不全あり）→抗凝固+経過観察 or 血栓溶解検討','酸素投与','輸液（右室前負荷維持、ただし過剰は禁忌）','昇圧: ノルアドレナリン（massive PE時）'],
workup:['CTPA（確定診断）','心エコー（右室拡大/D-shape）','D-dimer','下肢静脈エコー','心電図（S1Q3T3）','トロポニン/BNP（重症度評価）'],
disposition:'ICU管理（massive/submassive）。低リスク→一般病棟で抗凝固',pitfall:'術後のD-dimerは非特異的に上昇。臨床的に疑えばCTPAを直接施行'}},
pneumonia:{id:'pneumonia',title:'🌡️ 肺炎',result:{severity:'moderate',title:'院内肺炎/誤嚥性肺炎',
actions:['入院48h以降の発症→HAP(院内肺炎)','経験的抗菌薬: TAZ/PIPC or MEPM（HAP）','誤嚥性→嫌気性菌カバー追加（ABPC/SBT or CLDM）','酸素投与（目標SpO2 94-98%、COPD: 88-92%）','喀痰培養提出後に抗菌薬開始','A-DROPまたはCURB-65で重症度評価'],
workup:['胸部X線/CT','喀痰培養・グラム染色','血液培養2セット','CBC/CRP/PCT','ABG（呼吸不全時）'],
disposition:'重症度に応じてICU or 一般病棟',pitfall:'誤嚥性肺炎の誤嚥イベントが不明瞭なことも多い。嚥下機能評価を'}},
postop:{id:'postop',title:'🏥 術後/臥床中のSpO2低下',desc:'最も多い原因は無気肺。PE・肺炎・心不全も鑑別。',choices:[
{label:'術後1-2日 → 無気肺が最多',value:'atelectasis',icon:'🫁'},
{label:'術後+突然発症 → PE疑い',value:'pe',icon:'🩸',danger:true},
{label:'発熱+膿性痰 → 肺炎',value:'pneumonia',icon:'🌡️'},
{label:'輸液過多/心不全既往 → 心不全',value:'chf',icon:'💧'},
],next:v=>v},
}

export default function Page(){const[path,setPath]=useState(['start']);const cur=tree[path[path.length-1]]||tree.start;const goBack=()=>setPath(p=>p.length>1?p.slice(0,-1):p);const choose=(v:string)=>{const n=cur.next?.(v)||v;if(tree[n])setPath(p=>[...p,n])};const reset=()=>setPath(['start']);const sev={'critical':'bg-red-600','urgent':'bg-orange-500','moderate':'bg-yellow-500','low':'bg-green-600'};const sevL={'critical':'\ud83d\udd34 緊急','urgent':'\ud83d\udfe0 急ぎ','moderate':'\ud83d\udfe1 準緊急','low':'\ud83d\udfe2 低緊急'};return(<main className="max-w-3xl mx-auto px-4 py-8"><nav className="text-sm text-muted mb-4"><Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span><Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span><Link href="/tools/inpatient" className="hover:text-ac">入院中トラブル</Link><span className="mx-2">›</span><span>SpO2低下</span></nav><h1 className="text-xl font-bold text-tx mb-4">🫁 SpO2低下 対応フロー</h1><ERDisclaimerBanner/><div className="my-6 bg-s0 border border-br rounded-2xl p-6">{path.length>1&&<button onClick={goBack} className="text-xs text-muted hover:text-ac mb-3 flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>戻る</button>}<h2 className="text-base font-bold text-tx mb-1">{cur.title}</h2>{cur.desc&&<p className="text-xs text-muted mb-4 leading-relaxed">{cur.desc}</p>}{cur.choices&&(<div className="space-y-2 mt-4">{cur.choices.map(c=>(<button key={c.value} onClick={()=>choose(c.value)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all hover:border-ac/40 hover:bg-acl ${c.danger?'border-red-200 bg-red-50/50':'border-br'}`}><span className="text-sm font-medium text-tx">{c.icon&&<span className="mr-2">{c.icon}</span>}{c.label}</span></button>))}</div>)}{cur.result&&(<div className="mt-2"><ERResultCaution/><div className="flex items-center gap-2 mb-4"><span className={`text-xs text-white font-bold px-2 py-1 rounded ${sev[cur.result.severity]}`}>{sevL[cur.result.severity]}</span><span className="text-base font-bold text-tx">{cur.result.title}</span></div><S t="対応" items={cur.result.actions}/><S t="検査" items={cur.result.workup}/><div className="mt-3 bg-s1 rounded-lg p-3"><p className="text-[10px] text-muted mb-0.5">Disposition</p><p className="text-xs text-tx font-medium">{cur.result.disposition}</p></div>{cur.result.pitfall&&<div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3"><p className="text-[10px] text-amber-700 font-bold mb-0.5">⚠️ Pitfall</p><p className="text-xs text-amber-900 leading-relaxed">{cur.result.pitfall}</p></div>}<button onClick={reset} className="mt-4 w-full py-2.5 rounded-xl border border-br text-sm font-medium text-muted hover:text-tx transition-colors">最初からやり直す</button></div>)}</div><ERDisclaimerFooter/></main>)}
function S({t,items}:{t:string;items:string[]}){return(<div className="mt-3"><p className="text-xs font-bold text-tx mb-2">{t}</p><ul className="space-y-1.5">{items.map((a,i)=><li key={i} className="text-xs text-muted leading-relaxed flex gap-2"><span className="text-ac flex-shrink-0 mt-0.5">•</span><span>{a}</span></li>)}</ul></div>)}
