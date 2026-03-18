'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ERDisclaimerBanner,ERDisclaimerFooter,ERResultCaution } from '@/components/tools/ERDisclaimer'
interface C{label:string;value:string;icon?:string;danger?:boolean}
interface N{id:string;title:string;desc?:string;choices?:C[];result?:{severity:'critical'|'urgent'|'moderate'|'low';title:string;actions:string[];workup:string[];disposition:string;pitfall?:string};next?:(s:string)=>string}
const tree:Record<string,N>={
start:{id:'start',title:'Step 1: 転倒の初期評価',desc:'まず動かさない。バイタルサイン+意識レベル+外傷の確認。頭部打撲の有無が最重要。',choices:[
{label:'頭部打撲あり',value:'head',icon:'🧠',danger:true},
{label:'抗凝固薬/抗血小板薬服用中',value:'anticoag',icon:'💊',danger:true},
{label:'四肢の変形/著明な腫脹/荷重不能',value:'fracture',icon:'🦴'},
{label:'外傷なし/軽微な擦過傷のみ',value:'minor',icon:'🟢'},
],next:v=>v},
head:{id:'head',title:'🧠 頭部打撲',desc:'抗凝固薬使用中の場合はリスクが高い。',choices:[
{label:'意識障害/嘔吐/神経学的異常 → CT適応',value:'head_ct',icon:'🔴',danger:true},
{label:'GCS15+神経学的正常 → リスク評価',value:'head_risk',icon:'🟡'},
],next:v=>v},
head_ct:{id:'head_ct',title:'🔴 頭部CT適応',result:{severity:'urgent',title:'頭部打撲 — CT撮影+経過観察',
actions:['頭部CT（非造影）— 急性硬膜下/硬膜外血腫/くも膜下出血の除外','出血あり→脳外科コンサルト','抗凝固薬使用中→拮抗薬投与検討（ワルファリン→ビタミンK/PCC、DOAC→イダルシズマブ等）','意識レベル2時間毎にモニタリング','遅発性出血に注意（特に抗凝固薬使用中）→24h後の再CT検討','GCS低下→再CT+脳外科'],
workup:['頭部CT（非造影）','凝固（PT-INR/APTT）','CBC','GCS経時的記録'],
disposition:'24時間の神経学的モニタリング。出血あり→ICU/脳外科',pitfall:'抗凝固薬使用中の頭部打撲は軽微でも遅発性出血のリスク高い。24-72h後のCT再検を低閾値で'}},
head_risk:{id:'head_risk',title:'🟡 頭部打撲（軽症）リスク評価',result:{severity:'moderate',title:'軽症頭部打撲 — Canadian CT Head Rule',
actions:['CT適応（Canadian CT Head Rule）: 65歳以上/2回以上の嘔吐/30分以上の逆行性健忘/危険な受傷機転/頭蓋底骨折徴候','抗凝固薬使用中→低閾値でCT撮影','上記なし→経過観察（2-4時間毎の意識レベルチェック）','帰室後の観察指示: 嘔吐/頭痛増悪/意識変容→即時報告','24h後の再評価'],
workup:['意識レベル（GCS）','神経学的評価','凝固（抗凝固薬使用中）'],
disposition:'リスクなし→2-4時間毎のGCS確認。リスクあり→CT',pitfall:'高齢者の慢性硬膜下血腫は数週間後に症状出現。転倒歴を記録しておく'}},
anticoag:{id:'anticoag',title:'💊 抗凝固薬服用中の転倒',result:{severity:'urgent',title:'抗凝固薬使用中 — 出血リスク高い',
actions:['頭部打撲→低閾値で頭部CT（症状なくても検討）','PT-INR/APTT確認','出血（頭蓋内/消化管/後腹膜）の評価','ワルファリン: INR>3→ビタミンK 1-2mg iv + PCC検討','DOAC: 重篤出血→イダルシズマブ（ダビガトラン）or アンデキサネット（Xa阻害薬）','全身の打撲部位確認（腹腔内/後腹膜出血は見逃しやすい）','Hb経時的フォロー'],
workup:['頭部CT','凝固（PT-INR/APTT）','CBC（Hb経時的）','尿検査（血尿）'],
disposition:'24時間のモニタリング。出血所見あり→ICU',pitfall:'抗凝固薬使用中は軽微な転倒でも重篤な出血が遅発する。打撲なくても腹腔内出血のリスクあり'}},
fracture:{id:'fracture',title:'🦴 骨折疑い',result:{severity:'moderate',title:'骨折の評価',
actions:['患肢の安静・固定（副子）','X線撮影（疑われる部位）','大腿骨近位部骨折→整形外科コンサルト（48h以内手術が目標）','脊椎骨折疑い→脊椎安定化+CT','開放骨折→抗菌薬+破傷風+外科','疼痛管理: アセトアミノフェン+必要時オピオイド少量','骨粗鬆症の評価と治療開始検討'],
workup:['X線（疑わしい部位）','CT（脊椎/複雑骨折）','CBC','凝固（術前評価）'],
disposition:'骨折確認→整形外科/外科コンサルト',pitfall:'大腿骨近位部骨折は手術の遅れが予後悪化に直結。48h以内の手術を目指す'}},
minor:{id:'minor',title:'🟢 外傷なし/軽微',result:{severity:'low',title:'軽微な転倒 — 予防策の強化',
actions:['バイタルサイン確認','外傷部位の確認・処置','転倒原因の評価: 起立性低血圧?薬剤?環境?せん妄?','転倒予防策の強化: ベッド柵/ナースコール配置/センサーマット/歩行補助具','薬剤見直し: BZP/降圧薬/利尿薬/α遮断薬の減量検討','リハビリテーション（筋力強化/バランス訓練）','転倒リスク評価スケール（Morse Fall Scale）の再評価'],
workup:['バイタルサイン（起立性低血圧チェック）','薬剤リスト確認'],
disposition:'経過観察+転倒予防策強化',pitfall:'転倒は繰り返す。1回目の転倒で徹底した予防策を。転倒の記録（時間/場所/状況）は必須'}},
}

export default function Page(){const[path,setPath]=useState(['start']);const cur=tree[path[path.length-1]]||tree.start;const goBack=()=>setPath(p=>p.length>1?p.slice(0,-1):p);const choose=(v:string)=>{const n=cur.next?.(v)||v;if(tree[n])setPath(p=>[...p,n])};const reset=()=>setPath(['start']);const sev={'critical':'bg-red-600','urgent':'bg-orange-500','moderate':'bg-yellow-500','low':'bg-green-600'};const sevL={'critical':'\ud83d\udd34 緊急','urgent':'\ud83d\udfe0 急ぎ','moderate':'\ud83d\udfe1 準緊急','low':'\ud83d\udfe2 低緊急'};return(<main className="max-w-3xl mx-auto px-4 py-8"><nav className="text-sm text-muted mb-4"><Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span><Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span><Link href="/tools/inpatient" className="hover:text-ac">入院中トラブル</Link><span className="mx-2">›</span><span>転倒</span></nav><h1 className="text-xl font-bold text-tx mb-4">🩹 転倒 対応フロー</h1><ERDisclaimerBanner/><div className="my-6 bg-s0 border border-br rounded-2xl p-6">{path.length>1&&<button onClick={goBack} className="text-xs text-muted hover:text-ac mb-3 flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>戻る</button>}<h2 className="text-base font-bold text-tx mb-1">{cur.title}</h2>{cur.desc&&<p className="text-xs text-muted mb-4 leading-relaxed">{cur.desc}</p>}{cur.choices&&(<div className="space-y-2 mt-4">{cur.choices.map(c=>(<button key={c.value} onClick={()=>choose(c.value)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all hover:border-ac/40 hover:bg-acl ${c.danger?'border-red-200 bg-red-50/50':'border-br'}`}><span className="text-sm font-medium text-tx">{c.icon&&<span className="mr-2">{c.icon}</span>}{c.label}</span></button>))}</div>)}{cur.result&&(<div className="mt-2"><ERResultCaution/><div className="flex items-center gap-2 mb-4"><span className={`text-xs text-white font-bold px-2 py-1 rounded ${sev[cur.result.severity]}`}>{sevL[cur.result.severity]}</span><span className="text-base font-bold text-tx">{cur.result.title}</span></div><S t="対応" items={cur.result.actions}/><S t="検査" items={cur.result.workup}/><div className="mt-3 bg-s1 rounded-lg p-3"><p className="text-[10px] text-muted mb-0.5">Disposition</p><p className="text-xs text-tx font-medium">{cur.result.disposition}</p></div>{cur.result.pitfall&&<div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3"><p className="text-[10px] text-amber-700 font-bold mb-0.5">⚠️ Pitfall</p><p className="text-xs text-amber-900 leading-relaxed">{cur.result.pitfall}</p></div>}<button onClick={reset} className="mt-4 w-full py-2.5 rounded-xl border border-br text-sm font-medium text-muted hover:text-tx transition-colors">最初からやり直す</button></div>)}</div><ERDisclaimerFooter/></main>)}
function S({t,items}:{t:string;items:string[]}){return(<div className="mt-3"><p className="text-xs font-bold text-tx mb-2">{t}</p><ul className="space-y-1.5">{items.map((a,i)=><li key={i} className="text-xs text-muted leading-relaxed flex gap-2"><span className="text-ac flex-shrink-0 mt-0.5">•</span><span>{a}</span></li>)}</ul></div>)}
