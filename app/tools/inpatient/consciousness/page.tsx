'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ERDisclaimerBanner,ERDisclaimerFooter,ERResultCaution } from '@/components/tools/ERDisclaimer'
interface C{label:string;value:string;icon?:string;danger?:boolean}
interface N{id:string;title:string;desc?:string;choices?:C[];result?:{severity:'critical'|'urgent'|'moderate'|'low';title:string;actions:string[];workup:string[];disposition:string;pitfall?:string};next?:(s:string)=>string}
const tree:Record<string,N>={
start:{id:'start',title:'Step 1: 意識障害の初期評価',desc:'GCS評価+バイタル安定化+血糖測定。ABCの安定を最優先。',choices:[
{label:'血糖<70mg/dL（低血糖）',value:'hypoglycemia',icon:'🩸',danger:true},
{label:'片麻痺/失語/瞳孔不同（脳卒中疑い）',value:'stroke',icon:'🧠',danger:true},
{label:'けいれん後/てんかん重積',value:'seizure',icon:'⚡',danger:true},
{label:'新規薬剤投与後/オピオイド使用中',value:'drug',icon:'💊'},
{label:'発熱+項部硬直（髄膜炎疑い）',value:'meningitis',icon:'🌡️',danger:true},
{label:'上記に該当しない',value:'other',icon:'🔍'},
],next:v=>v},
hypoglycemia:{id:'hypoglycemia',title:'🩸 低血糖',result:{severity:'critical',title:'低血糖 — 即座にブドウ糖投与',
actions:['50%ブドウ糖液 40mL(20g) iv','経口摂取可能なら糖質摂取','10分後に血糖再検','原因検索: インスリン過量/経口血糖降下薬/食事量減少/肝不全/副腎不全','持続する低血糖→10%ブドウ糖液持続点滴','SU薬による低血糖は遷延する→24-48h血糖モニタリング'],
workup:['血糖（即座に）','インスリン/Cペプチド（原因不明時）','肝機能','コルチゾール（副腎不全疑い時）'],
disposition:'原因によるが、SU薬低血糖は入院経過観察',pitfall:'低血糖の意識障害は脳卒中に似ることがある。まず血糖測定'}},
stroke:{id:'stroke',title:'🧠 脳卒中',result:{severity:'critical',title:'脳卒中 — CT+神経内科コール',
actions:['ABCの安定化','頭部CT（出血/梗塞の鑑別）→ 最優先','脳梗塞+発症4.5h以内→rt-PA適応評価','脳出血→降圧（目標sBP<140）+ 脳外科コンサルト','NIHSSスコア評価','抗凝固薬服用中の出血→拮抗薬投与','大きな梗塞/出血→ICU管理+脳浮腫対策'],
workup:['頭部CT（非造影）','頭部MRI/MRA（可能なら）','CBC/凝固','電解質/血糖','12誘導心電図（AFのチェック）'],
disposition:'SCU/ICU管理',pitfall:'入院中の脳卒中は発症時刻の特定が困難。「最終正常確認時刻」を記録'}},
seizure:{id:'seizure',title:'⚡ けいれん後/てんかん重積',result:{severity:'critical',title:'けいれん後 — てんかん重積の評価',
actions:['活動性けいれん→ジアゼパム 5-10mg iv or ミダゾラム 5mg im','5分以上持続→てんかん重積: ホスフェニトイン 22.5mg/kg iv','気道確保+側臥位（誤嚥予防）','けいれん後の意識障害→postictal stateは通常30分以内に改善','30分以上意識回復なし→非けいれん性てんかん重積(NCSE)の可能性→脳波','原因検索: 電解質異常/低血糖/薬剤中止/脳卒中'],
workup:['血糖','電解質（Na/Ca/Mg）','抗てんかん薬血中濃度','頭部CT','脳波（NCSE疑い時）'],
disposition:'けいれん消失+意識回復→一般病棟でモニタリング。SE→ICU',pitfall:'けいれん後の意識障害が30分以上続く場合はNCSEを疑い脳波を'}},
drug:{id:'drug',title:'💊 薬剤性意識障害',result:{severity:'urgent',title:'薬剤性 — 原因薬剤の特定と拮抗',
actions:['オピオイド→ナロキソン 0.4mg iv（2-3分毎、最大2mg）','ベンゾジアゼピン→フルマゼニル 0.2mg iv（慎重に）','抗コリン薬中毒→フィゾスチグミン（重症時のみ）','セロトニン症候群→クーリング+シプロヘプタジン','悪性症候群→ダントロレン','原因薬剤の中止/減量','投与された全薬剤のレビュー'],
workup:['薬物スクリーニング','バイタルサイン（体温含む）','CK（悪性症候群/横紋筋融解）','肝機能/腎機能（薬物排泄能）'],
disposition:'拮抗薬で改善→経過観察。改善なし→ICU',pitfall:'フルマゼニルはけいれん誘発リスクあり（BZP長期使用者/てんかん既往）。ナロキソンは半減期が短いため再沈下に注意'}},
meningitis:{id:'meningitis',title:'🌡️ 髄膜炎',result:{severity:'critical',title:'髄膜炎疑い — 1時間以内に抗菌薬',
actions:['血液培養2セット→経験的抗菌薬開始（結果を待たない）','CTRX 2g q12h + VCM + デキサメタゾン 0.15mg/kg q6h（細菌性髄膜炎疑い）','頭部CTに禁忌がなければ腰椎穿刺','CT前でも抗菌薬は先に開始（治療の遅れは予後悪化）','HSV脳炎疑い→アシクロビル追加'],
workup:['血液培養2セット','頭部CT（腰椎穿刺前）','腰椎穿刺（髄液: 細胞数/糖/蛋白/培養/グラム染色）','CRP/PCT','HSV PCR（脳炎疑い時）'],
disposition:'ICU管理',pitfall:'CT→腰椎穿刺→抗菌薬の順では遅い。抗菌薬は最初に。項部硬直がなくても髄膜炎は否定できない（高齢者/免疫不全）'}},
other:{id:'other',title:'Step 2: その他の原因検索',desc:'代謝/電解質/肝性脳症/高CO2/低体温etc',choices:[
{label:'肝硬変/黄疸 → 肝性脳症',value:'hepatic',icon:'🟡'},
{label:'腎不全/電解質異常',value:'metabolic',icon:'🧪'},
{label:'低酸素/CO2ナルコーシス',value:'hypoxia',icon:'🫁'},
{label:'心停止後/低体温',value:'anoxic',icon:'❄️',danger:true},
],next:v=>v},
hepatic:{id:'hepatic',title:'🟡 肝性脳症',result:{severity:'urgent',title:'肝性脳症',
actions:['ラクツロース 30mL q2h（排便3回/日が目標）','リファキシミン 400mg tid','誘因検索: 消化管出血/便秘/感染/電解質異常/蛋白過剰摂取/脱水/BZP使用','誘因の治療','蛋白制限（急性期のみ、長期制限は不要）'],
workup:['NH3','肝機能','電解質','CBC','便潜血','感染検索'],
disposition:'原因治療で改善→一般病棟。改善なし→ICU',pitfall:'肝性脳症の診断にNH3は必須でない（正常でも肝性脳症はありうる）'}},
metabolic:{id:'metabolic',title:'🧪 代謝/電解質異常',result:{severity:'urgent',title:'代謝性意識障害',
actions:['低Na(<120): 3%NaCl慎重投与（1-2mEq/L/hで補正、24hで8mEq/L以下）','高Ca: 生食大量補液+ゾレドロン酸/カルシトニン','高K: カルシウム+GI療法+透析準備','DKA/HHS: 補液+インスリン（別項参照）','尿毒症: 透析検討'],
workup:['電解質(Na/K/Ca/Mg)','血糖','BUN/Cr','浸透圧','ABG/VBG','尿検査'],
disposition:'原因に応じた治療',pitfall:'低Naの急速補正は浸透圧性脱髄症候群(ODS)のリスク'}},
hypoxia:{id:'hypoxia',title:'🫁 低酸素/CO2ナルコーシス',result:{severity:'critical',title:'低酸素/高CO2血症',
actions:['酸素投与（COPD患者はSpO2 88-92%目標）','CO2ナルコーシス→NPPV（BiPAP）','改善なし→挿管+人工呼吸器管理','原因治療: 肺炎/心不全/COPD急性増悪/気道閉塞'],
workup:['ABG（PaO2/PaCO2/pH）','胸部X線','SpO2連続モニタリング'],
disposition:'呼吸不全の重症度に応じてICU',pitfall:'COPD患者への高流量酸素でCO2ナルコーシス悪化。ABG確認必須'}},
anoxic:{id:'anoxic',title:'❄️ 低酸素脳症/心停止後',result:{severity:'critical',title:'心停止後脳症/低酸素脳症',
actions:['体温管理療法(TTM): 32-36℃ 24h','けいれん管理','血行動態安定化','72h以降に神経学的予後評価','神経学的評価: 瞳孔反射/角膜反射/GCS-M/体性感覚誘発電位/MRI'],
workup:['頭部CT/MRI','脳波','体性感覚誘発電位','NSE/S100B（予後指標）'],
disposition:'ICU管理',pitfall:'72h以前の予後判定は不正確。鎮静薬/低体温の影響を除外してから評価'}},
}

export default function Page(){const[path,setPath]=useState(['start']);const cur=tree[path[path.length-1]]||tree.start;const goBack=()=>setPath(p=>p.length>1?p.slice(0,-1):p);const choose=(v:string)=>{const n=cur.next?.(v)||v;if(tree[n])setPath(p=>[...p,n])};const reset=()=>setPath(['start']);const sev={'critical':'bg-red-600','urgent':'bg-orange-500','moderate':'bg-yellow-500','low':'bg-green-600'};const sevL={'critical':'\ud83d\udd34 緊急','urgent':'\ud83d\udfe0 急ぎ','moderate':'\ud83d\udfe1 準緊急','low':'\ud83d\udfe2 低緊急'};return(<main className="max-w-3xl mx-auto px-4 py-8"><nav className="text-sm text-muted mb-4"><Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span><Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span><Link href="/tools/inpatient" className="hover:text-ac">入院中トラブル</Link><span className="mx-2">›</span><span>意識障害</span></nav><h1 className="text-xl font-bold text-tx mb-4">🧠 意識障害（入院中）対応フロー</h1><ERDisclaimerBanner/><div className="my-6 bg-s0 border border-br rounded-2xl p-6">{path.length>1&&<button onClick={goBack} className="text-xs text-muted hover:text-ac mb-3 flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>戻る</button>}<h2 className="text-base font-bold text-tx mb-1">{cur.title}</h2>{cur.desc&&<p className="text-xs text-muted mb-4 leading-relaxed">{cur.desc}</p>}{cur.choices&&(<div className="space-y-2 mt-4">{cur.choices.map(c=>(<button key={c.value} onClick={()=>choose(c.value)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all hover:border-ac/40 hover:bg-acl ${c.danger?'border-red-200 bg-red-50/50':'border-br'}`}><span className="text-sm font-medium text-tx">{c.icon&&<span className="mr-2">{c.icon}</span>}{c.label}</span></button>))}</div>)}{cur.result&&(<div className="mt-2"><ERResultCaution/><div className="flex items-center gap-2 mb-4"><span className={`text-xs text-white font-bold px-2 py-1 rounded ${sev[cur.result.severity]}`}>{sevL[cur.result.severity]}</span><span className="text-base font-bold text-tx">{cur.result.title}</span></div><S t="対応" items={cur.result.actions}/><S t="検査" items={cur.result.workup}/><div className="mt-3 bg-s1 rounded-lg p-3"><p className="text-[10px] text-muted mb-0.5">Disposition</p><p className="text-xs text-tx font-medium">{cur.result.disposition}</p></div>{cur.result.pitfall&&<div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3"><p className="text-[10px] text-amber-700 font-bold mb-0.5">⚠️ Pitfall</p><p className="text-xs text-amber-900 leading-relaxed">{cur.result.pitfall}</p></div>}<button onClick={reset} className="mt-4 w-full py-2.5 rounded-xl border border-br text-sm font-medium text-muted hover:text-tx transition-colors">最初からやり直す</button></div>)}</div><ERDisclaimerFooter/></main>)}
function S({t,items}:{t:string;items:string[]}){return(<div className="mt-3"><p className="text-xs font-bold text-tx mb-2">{t}</p><ul className="space-y-1.5">{items.map((a,i)=><li key={i} className="text-xs text-muted leading-relaxed flex gap-2"><span className="text-ac flex-shrink-0 mt-0.5">•</span><span>{a}</span></li>)}</ul></div>)}
