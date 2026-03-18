'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ERDisclaimerBanner,ERDisclaimerFooter,ERResultCaution } from '@/components/tools/ERDisclaimer'
interface C{label:string;value:string;icon?:string;danger?:boolean}
interface N{id:string;title:string;desc?:string;choices?:C[];result?:{severity:'critical'|'urgent'|'moderate'|'low';title:string;actions:string[];workup:string[];disposition:string;pitfall?:string};next?:(s:string)=>string}
const tree:Record<string,N>={
start:{id:'start',title:'Step 1: せん妄の評価',desc:'CAM(Confusion Assessment Method)で診断: 急性発症+注意力障害+思考障害 or 意識レベル変動。',choices:[
{label:'過活動型（興奮/暴力/自己抜去リスク）',value:'hyper',icon:'🔴',danger:true},
{label:'低活動型（傾眠/無気力/見逃されやすい）',value:'hypo',icon:'🟡'},
{label:'混合型',value:'mixed',icon:'🟠'},
],next:v=>v},
hyper:{id:'hyper',title:'Step 2: 過活動型 — まず安全確保+原因検索',desc:'身体拘束は最終手段。まず環境調整+原因治療。',choices:[
{label:'感染徴候あり（発熱/炎症高値）',value:'infection',icon:'🌡️'},
{label:'薬剤変更/追加あり（48h以内）',value:'drug_cause',icon:'💊'},
{label:'便秘/尿閉',value:'retention',icon:'🚽'},
{label:'電解質異常/脱水',value:'electrolyte',icon:'🧪'},
{label:'疼痛コントロール不良',value:'pain',icon:'😖'},
{label:'アルコール離脱疑い',value:'alcohol',icon:'🍺',danger:true},
{label:'原因不明 → 非薬物+薬物対応',value:'treatment',icon:'💊'},
],next:v=>v},
hypo:{id:'hypo',title:'低活動型せん妄',result:{severity:'moderate',title:'低活動型せん妄 — 見逃しやすい',
actions:['過活動型と同じ原因検索を行う','非薬物的介入: 日中の覚醒促進/光環境/リハビリ','薬剤見直し（特にBZP/抗コリン薬/オピオイド）','脱水/電解質/感染の補正','うつ病との鑑別（せん妄は急性発症+変動性）','原因治療が最優先（抗精神病薬は基本不要）'],
workup:['CAMスコア','血液検査(CBC/CRP/電解質/BUN/肝腎機能)','尿検査','薬剤リスト確認','残尿測定','腹部X線（便秘確認）'],
disposition:'原因治療+モニタリング',pitfall:'低活動型は「おとなしい」ため見逃されやすい。入院高齢者の急な傾眠はせん妄を疑う'}},
mixed:{id:'mixed',title:'混合型せん妄',result:{severity:'urgent',title:'混合型せん妄',
actions:['過活動期と低活動期が交互に出現','原因検索は同じ（感染/薬剤/電解質/便秘尿閉/疼痛）','非薬物的介入を継続','薬物治療: 過活動期のみ頓用で対応','ハロペリドール 0.5-2mg iv/im（高齢者は0.5mgから）','クエチアピン 25mg po（経口可の場合）'],
workup:['過活動型と同じ検査一式'],
disposition:'原因治療+モニタリング',pitfall:'時間帯で症状が変動するため「良くなった」と判断しない。夕方〜夜間に悪化しやすい（sundowning）'}},
infection:{id:'infection',title:'🌡️ 感染がせん妄の原因',result:{severity:'urgent',title:'感染症によるせん妄',
actions:['感染源検索: 尿路/肺炎/CVC/創部/CDI','適切な抗菌薬開始','感染症治療でせん妄は改善することが多い','並行して非薬物的せん妄対策','興奮が強い場合のみ抗精神病薬頓用'],
workup:['CBC/CRP/PCT','尿検査/尿培養','胸部X線','血液培養','CDI検査（抗菌薬使用中+下痢）'],
disposition:'感染症治療',pitfall:'高齢者のせん妄が唯一の感染症症状であることも（発熱がないことがある）'}},
drug_cause:{id:'drug_cause',title:'💊 薬剤性せん妄',result:{severity:'moderate',title:'薬剤性せん妄 — 原因薬剤の中止/変更',
actions:['原因薬剤の特定と中止/変更','高リスク薬剤: BZP（最多）/抗コリン薬/オピオイド/ステロイド/H2ブロッカー/メトクロプラミド','BZP→減量（急な中止は離脱せん妄のリスク）','オピオイド→減量 or ローテーション','抗コリン薬→中止','ポリファーマシーの見直し（Beers criteria参照）'],
workup:['投薬リスト（開始日/変更日）の精査','薬物血中濃度（該当薬剤）'],
disposition:'原因薬剤変更で改善を待つ',pitfall:'BZPの急な中止は離脱せん妄を誘発。漸減が原則'}},
retention:{id:'retention',title:'🚽 便秘/尿閉',result:{severity:'moderate',title:'便秘/尿閉によるせん妄',
actions:['残尿測定: >200mL→導尿','便秘: 腹部X線確認→浣腸/緩下剤','オピオイド使用中→便秘が高頻度','便秘/尿閉の解消でせん妄が劇的に改善することがある','予防: 排便コントロール、カテーテル管理'],
workup:['残尿測定（エコー）','腹部X線（便塊確認）'],
disposition:'便秘/尿閉の解消',pitfall:'特に高齢者では便秘/尿閉がせん妄の「唯一の原因」であることが多い'}},
electrolyte:{id:'electrolyte',title:'🧪 電解質/脱水',result:{severity:'moderate',title:'電解質異常/脱水によるせん妄',
actions:['脱水: 補液（生食 or 維持液）','低Na: 原因（SIADH/利尿薬）に応じた補正','高Ca: 補液+ビスホスホネート','低Mg: 硫酸Mg補充','腎機能悪化→薬剤用量調整','口渇感が乏しい高齢者は脱水に注意'],
workup:['電解質(Na/K/Ca/Mg)','BUN/Cr','浸透圧','尿検査'],
disposition:'電解質補正',pitfall:'低Naの急速補正はODSリスク。高齢者の脱水は気づきにくい'}},
pain:{id:'pain',title:'😖 疼痛',result:{severity:'moderate',title:'疼痛によるせん妄',
actions:['痛みの評価（NRS/BPS）','適切な鎮痛（アセトアミノフェン定期投与が基本）','オピオイドは最小用量で（過量もせん妄の原因）','非薬物的鎮痛: 体位変換/冷罨法/リラクゼーション','術後鎮痛の見直し'],
workup:['疼痛スケール評価'],
disposition:'適切な鎮痛管理',pitfall:'鎮痛不足もオピオイド過量もせん妄の原因。バランスが重要'}},
alcohol:{id:'alcohol',title:'🍺 アルコール離脱',result:{severity:'critical',title:'アルコール離脱せん妄(DT)',
actions:['CIWA-Ar評価スケールで重症度判定','BZP: ジアゼパム 5-10mg iv q5-10min（CIWA>10で投与）','重症: ジアゼパム持続投与 or フェノバルビタール追加','ビタミンB1(チアミン) 100mg iv → B1補充を先に（ブドウ糖前に）','補液+電解質補正（Mg/K/PO4）','ICU管理（重症DT: 発熱/頻脈/幻覚/けいれん）','けいれん→ジアゼパム/ロラゼパム'],
workup:['CIWA-Arスコア（2-4時間毎）','電解質(Mg/K/PO4)','肝機能','CBC','血糖','アルコール血中濃度'],
disposition:'軽症→一般病棟でCIWA monitoring。重症DT→ICU',pitfall:'アルコール離脱は入院2-4日目に悪化。DTは死亡率高い。ビタミンB1はブドウ糖投与前に（Wernicke予防）'}},
treatment:{id:'treatment',title:'Step 3: せん妄の治療',result:{severity:'moderate',title:'せん妄の非薬物+薬物対応',
actions:['【非薬物的介入（最優先）】','見当識: 時計/カレンダー/家族の写真を設置','睡眠衛生: 夜間照明最小化/日中覚醒促進/耳栓/アイマスク','早期離床・リハビリ','メガネ/補聴器の使用','不要なモニター/ライン/カテーテルの除去','家族の面会','【薬物治療（興奮が強く安全確保困難な場合のみ）】','ハロペリドール 0.5-2mg iv/im（高齢者0.5mg開始）','クエチアピン 25mg po（経口可の場合）','BZPはせん妄には原則使用しない（アルコール離脱を除く）','デクスメデトミジン（挿管中/ICUの場合）'],
workup:['CAMスコア定期評価','全原因検索を並行'],
disposition:'原因治療+モニタリング。改善しない場合は精神科コンサルト',pitfall:'BZPはせん妄を悪化させる（アルコール離脱を除く）。身体拘束はせん妄を悪化させるため最終手段'}},
}

export default function Page(){const[path,setPath]=useState(['start']);const cur=tree[path[path.length-1]]||tree.start;const goBack=()=>setPath(p=>p.length>1?p.slice(0,-1):p);const choose=(v:string)=>{const n=cur.next?.(v)||v;if(tree[n])setPath(p=>[...p,n])};const reset=()=>setPath(['start']);const sev={'critical':'bg-red-600','urgent':'bg-orange-500','moderate':'bg-yellow-500','low':'bg-green-600'};const sevL={'critical':'\ud83d\udd34 緊急','urgent':'\ud83d\udfe0 急ぎ','moderate':'\ud83d\udfe1 準緊急','low':'\ud83d\udfe2 低緊急'};return(<main className="max-w-3xl mx-auto px-4 py-8"><nav className="text-sm text-muted mb-4"><Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span><Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span><Link href="/tools/inpatient" className="hover:text-ac">入院中トラブル</Link><span className="mx-2">›</span><span>せん妄</span></nav><h1 className="text-xl font-bold text-tx mb-4">😵‍💫 せん妄 対応フロー</h1><ERDisclaimerBanner/><div className="my-6 bg-s0 border border-br rounded-2xl p-6">{path.length>1&&<button onClick={goBack} className="text-xs text-muted hover:text-ac mb-3 flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>戻る</button>}<h2 className="text-base font-bold text-tx mb-1">{cur.title}</h2>{cur.desc&&<p className="text-xs text-muted mb-4 leading-relaxed">{cur.desc}</p>}{cur.choices&&(<div className="space-y-2 mt-4">{cur.choices.map(c=>(<button key={c.value} onClick={()=>choose(c.value)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all hover:border-ac/40 hover:bg-acl ${c.danger?'border-red-200 bg-red-50/50':'border-br'}`}><span className="text-sm font-medium text-tx">{c.icon&&<span className="mr-2">{c.icon}</span>}{c.label}</span></button>))}</div>)}{cur.result&&(<div className="mt-2"><ERResultCaution/><div className="flex items-center gap-2 mb-4"><span className={`text-xs text-white font-bold px-2 py-1 rounded ${sev[cur.result.severity]}`}>{sevL[cur.result.severity]}</span><span className="text-base font-bold text-tx">{cur.result.title}</span></div><S t="対応" items={cur.result.actions}/><S t="検査" items={cur.result.workup}/><div className="mt-3 bg-s1 rounded-lg p-3"><p className="text-[10px] text-muted mb-0.5">Disposition</p><p className="text-xs text-tx font-medium">{cur.result.disposition}</p></div>{cur.result.pitfall&&<div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3"><p className="text-[10px] text-amber-700 font-bold mb-0.5">⚠️ Pitfall</p><p className="text-xs text-amber-900 leading-relaxed">{cur.result.pitfall}</p></div>}<button onClick={reset} className="mt-4 w-full py-2.5 rounded-xl border border-br text-sm font-medium text-muted hover:text-tx transition-colors">最初からやり直す</button></div>)}</div><ERDisclaimerFooter/></main>)}
function S({t,items}:{t:string;items:string[]}){return(<div className="mt-3"><p className="text-xs font-bold text-tx mb-2">{t}</p><ul className="space-y-1.5">{items.map((a,i)=><li key={i} className="text-xs text-muted leading-relaxed flex gap-2"><span className="text-ac flex-shrink-0 mt-0.5">•</span><span>{a}</span></li>)}</ul></div>)}
