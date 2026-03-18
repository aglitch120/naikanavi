'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ERDisclaimerBanner,ERDisclaimerFooter,ERResultCaution } from '@/components/tools/ERDisclaimer'
interface C{label:string;value:string;icon?:string;danger?:boolean}
interface N{id:string;title:string;desc?:string;choices?:C[];result?:{severity:'critical'|'urgent'|'moderate'|'low';title:string;actions:string[];workup:string[];disposition:string;pitfall?:string};next?:(s:string)=>string}
const tree:Record<string,N>={
start:{id:'start',title:'Step 1: 頻脈 or 徐脈？',desc:'まず血行動態の安定性を評価。不安定: 低血圧/意識変容/胸痛/心不全徴候。',choices:[
{label:'頻脈（HR>100）',value:'tachy',icon:'📈'},
{label:'徐脈（HR<60）',value:'brady',icon:'📉'},
],next:v=>v},
tachy:{id:'tachy',title:'Step 2: 頻脈の血行動態',choices:[
{label:'不安定（低血圧/意識変容/胸痛）→ 即座に同期電気ショック',value:'tachy_unstable',icon:'🔴',danger:true},
{label:'安定 → 12誘導心電図で鑑別',value:'tachy_stable',icon:'🟡'},
],next:v=>v},
tachy_unstable:{id:'tachy_unstable',title:'🔴 不安定頻脈',result:{severity:'critical',title:'不安定頻脈 — 同期電気ショック',
actions:['鎮静（ミダゾラム 1-2mg iv）下で同期電気ショック','Narrow QRS: 50-100J → 100J → 200J','Wide QRS: 100J → 200J → 360J','ショック後もモニタリング継続','原因検索: 脱水/敗血症/出血/PE/心筋虚血','循環器コンサルト'],
workup:['12誘導心電図','電解質（K/Mg）','トロポニン','CBC','TSH（甲状腺機能）'],
disposition:'ICU/CCU管理',pitfall:'電気ショックは「同期」モード。非同期だとVFを誘発するリスク'}},
tachy_stable:{id:'tachy_stable',title:'Step 3: QRS幅は？',choices:[
{label:'Narrow QRS（<120ms）',value:'narrow',icon:'📊'},
{label:'Wide QRS（≧120ms）',value:'wide',icon:'📊',danger:true},
],next:v=>v},
narrow:{id:'narrow',title:'Narrow QRS頻脈',desc:'規則的: SVT/AFL。不規則: AF/MAT。',choices:[
{label:'規則的 → SVT疑い',value:'svt',icon:'💓'},
{label:'不規則 → AF疑い',value:'af',icon:'💓'},
],next:v=>v},
svt:{id:'svt',title:'💓 SVT',result:{severity:'moderate',title:'上室性頻拍(SVT)',
actions:['迷走神経刺激（Valsalva/頸動脈洞マッサージ/冷水顔面）','ATP 6mg急速iv（効果なし→12mg）','Ca拮抗薬: ベラパミル 5mg iv or ジルチアゼム','β遮断薬: エスモロール（短時間作用型）','WPW合併→ATP/Ca拮抗薬は禁忌（プロカインアミド or 電気ショック）'],
workup:['12誘導心電図','電解質','甲状腺機能'],
disposition:'薬物で停止すれば経過観察。再発頻回→カテーテルアブレーション検討',pitfall:'WPW+AF: irregularly irregular wide QRS → Ca拮抗薬/ジゴキシン禁忌（VF誘発）'}},
af:{id:'af',title:'💓 心房細動(AF)',result:{severity:'moderate',title:'新規AF / 急性増悪',
actions:['レートコントロール: ジルチアゼム iv or β遮断薬（目標HR<110）','心不全合併→ジゴキシン or アミオダロン','血行動態不安定→同期電気ショック','48h以内の発症→リズムコントロール検討','抗凝固: CHADS2-VAScスコアで適応判断','原因検索: 感染/甲状腺/電解質/飲酒/PE'],
workup:['12誘導心電図','電解質（K/Mg）','TSH','心エコー','CBC/CRP'],
disposition:'レートコントロール後、原因治療',pitfall:'AF+WPWの鑑別を忘れない。RR不整+wide QRSはWPW+AFの可能性'}},
wide:{id:'wide',title:'Wide QRS頻拍',result:{severity:'urgent',title:'Wide QRS頻拍 — VTとして対応',
actions:['原則: Wide QRS頻拍はVTとして扱う（SVT+脚ブロックの可能性あっても）','安定: アミオダロン 150mg iv 10min → 1mg/min維持','不安定: 同期電気ショック','無脈性VT→CPR + 除細動（非同期200J）','K/Mg補正','抗不整脈薬投与後も再発→カテーテルアブレーション/ICD検討'],
workup:['12誘導心電図','電解質（K/Mg/Ca）','トロポニン','心エコー'],
disposition:'CCU/ICU管理。循環器コンサルト',pitfall:'Wide QRS頻拍を安易にSVTと判断しない。迷ったらVTとして治療'}},
brady:{id:'brady',title:'Step 2: 徐脈の血行動態',choices:[
{label:'症候性（低血圧/意識変容/心不全）',value:'brady_symp',icon:'🔴',danger:true},
{label:'無症候性',value:'brady_asymp',icon:'🟢'},
],next:v=>v},
brady_symp:{id:'brady_symp',title:'🔴 症候性徐脈',result:{severity:'critical',title:'症候性徐脈 — ACLS徐脈アルゴリズム',
actions:['アトロピン 0.5mg iv（3-5分毎、最大3mg）','アトロピン無効→経皮ペーシング（鎮痛・鎮静併用）','ドパミン 5-20μg/kg/min or アドレナリン 2-10μg/min持続','完全房室ブロック/Mobitz II型→経静脈ペーシング準備','原因検索: 薬剤（β遮断薬/Ca拮抗薬/ジゴキシン）/高K/AMI下壁/甲状腺機能低下'],
workup:['12誘導心電図','電解質（K）','ジゴキシン濃度（使用中の場合）','甲状腺機能','トロポニン'],
disposition:'CCU/ICU管理。ペースメーカー適応の検討',pitfall:'3度AVB/Mobitz IIではアトロピンは無効or悪化の可能性→早めにペーシング準備'}},
brady_asymp:{id:'brady_asymp',title:'🟢 無症候性徐脈',result:{severity:'low',title:'無症候性徐脈 — 経過観察',
actions:['モニタリング継続','原因薬剤の確認・減量検討','心電図で房室ブロックの型を評価','スポーツ心臓/睡眠中の洞徐脈→問題なし','悪化時の対応計画を立てておく'],
workup:['12誘導心電図','電解質','ホルター心電図（必要時）'],
disposition:'モニタリング。症候性になれば即座に対応',pitfall:'無症候でもMobitz II型/3度AVBは症候化のリスク高い→循環器コンサルト'}},
}

export default function Page(){const[path,setPath]=useState(['start']);const cur=tree[path[path.length-1]]||tree.start;const goBack=()=>setPath(p=>p.length>1?p.slice(0,-1):p);const choose=(v:string)=>{const n=cur.next?.(v)||v;if(tree[n])setPath(p=>[...p,n])};const reset=()=>setPath(['start']);const sev={'critical':'bg-red-600','urgent':'bg-orange-500','moderate':'bg-yellow-500','low':'bg-green-600'};const sevL={'critical':'\ud83d\udd34 緊急','urgent':'\ud83d\udfe0 急ぎ','moderate':'\ud83d\udfe1 準緊急','low':'\ud83d\udfe2 低緊急'};return(<main className="max-w-3xl mx-auto px-4 py-8"><nav className="text-sm text-muted mb-4"><Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span><Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span><Link href="/tools/inpatient" className="hover:text-ac">入院中トラブル</Link><span className="mx-2">›</span><span>頻脈・徐脈</span></nav><h1 className="text-xl font-bold text-tx mb-4">💓 頻脈・徐脈 対応フロー</h1><ERDisclaimerBanner/><div className="my-6 bg-s0 border border-br rounded-2xl p-6">{path.length>1&&<button onClick={goBack} className="text-xs text-muted hover:text-ac mb-3 flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>戻る</button>}<h2 className="text-base font-bold text-tx mb-1">{cur.title}</h2>{cur.desc&&<p className="text-xs text-muted mb-4 leading-relaxed">{cur.desc}</p>}{cur.choices&&(<div className="space-y-2 mt-4">{cur.choices.map(c=>(<button key={c.value} onClick={()=>choose(c.value)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all hover:border-ac/40 hover:bg-acl ${c.danger?'border-red-200 bg-red-50/50':'border-br'}`}><span className="text-sm font-medium text-tx">{c.icon&&<span className="mr-2">{c.icon}</span>}{c.label}</span></button>))}</div>)}{cur.result&&(<div className="mt-2"><ERResultCaution/><div className="flex items-center gap-2 mb-4"><span className={`text-xs text-white font-bold px-2 py-1 rounded ${sev[cur.result.severity]}`}>{sevL[cur.result.severity]}</span><span className="text-base font-bold text-tx">{cur.result.title}</span></div><S t="対応" items={cur.result.actions}/><S t="検査" items={cur.result.workup}/><div className="mt-3 bg-s1 rounded-lg p-3"><p className="text-[10px] text-muted mb-0.5">Disposition</p><p className="text-xs text-tx font-medium">{cur.result.disposition}</p></div>{cur.result.pitfall&&<div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3"><p className="text-[10px] text-amber-700 font-bold mb-0.5">⚠️ Pitfall</p><p className="text-xs text-amber-900 leading-relaxed">{cur.result.pitfall}</p></div>}<button onClick={reset} className="mt-4 w-full py-2.5 rounded-xl border border-br text-sm font-medium text-muted hover:text-tx transition-colors">最初からやり直す</button></div>)}</div><ERDisclaimerFooter/></main>)}
function S({t,items}:{t:string;items:string[]}){return(<div className="mt-3"><p className="text-xs font-bold text-tx mb-2">{t}</p><ul className="space-y-1.5">{items.map((a,i)=><li key={i} className="text-xs text-muted leading-relaxed flex gap-2"><span className="text-ac flex-shrink-0 mt-0.5">•</span><span>{a}</span></li>)}</ul></div>)}
