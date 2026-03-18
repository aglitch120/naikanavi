'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ERDisclaimerBanner,ERDisclaimerFooter,ERResultCaution } from '@/components/tools/ERDisclaimer'
interface C{label:string;value:string;icon?:string;danger?:boolean}
interface N{id:string;title:string;desc?:string;choices?:C[];result?:{severity:'critical'|'urgent'|'moderate'|'low';title:string;actions:string[];workup:string[];disposition:string;pitfall?:string};next?:(s:string)=>string}
const tree:Record<string,N>={
start:{id:'start',title:'Step 1: 何が抜去されたか？',desc:'まず患者の安全確認。バイタルサイン測定→出血/気道の確認→医師報告。',choices:[
{label:'末梢静脈ライン（点滴）',value:'piv',icon:'💉'},
{label:'中心静脈カテーテル（CVC）',value:'cvc',icon:'🔴',danger:true},
{label:'経鼻胃管（NGチューブ）',value:'ng',icon:'🟡'},
{label:'胃瘻チューブ（PEG）',value:'peg',icon:'🟡',danger:true},
{label:'尿道カテーテル',value:'foley',icon:'🚿'},
{label:'胸腔/腹腔ドレーン',value:'drain',icon:'🔴',danger:true},
],next:v=>v},
piv:{id:'piv',title:'💉 末梢静脈ライン',result:{severity:'low',title:'末梢IV自己抜去',
actions:['止血（圧迫5分）','皮下血腫のチェック','点滴が必要なら再確保','持続投与中の薬剤（昇圧剤等）→緊急で再確保','抜去原因の評価: せん妄?不快感?','固定方法の見直し、ミトン検討'],
workup:['抜去部位の出血確認','投与中薬剤の確認'],
disposition:'止血後経過観察',pitfall:'昇圧剤等の持続投与中は数分の中断が致命的。緊急で再確保'}},
cvc:{id:'cvc',title:'🔴 CVC自己抜去',result:{severity:'critical',title:'CVC自己抜去 — 空気塞栓リスク',
actions:['即座に挿入部を圧迫止血','左側臥位+頭低位（Trendelenburg）: 空気塞栓予防','バイタル確認（空気塞栓の徴候: 突然の呼吸困難/低血圧/意識変容）','出血量の評価','投与中薬剤の代替ルート確保','カテーテルの残存確認（断片が残っていないか）','再挿入の必要性を医師と判断'],
workup:['バイタルサイン','胸部X線（カテーテル残存/気胸確認）','凝固（出血持続時）'],
disposition:'安定していれば経過観察。空気塞栓疑い→ICU',pitfall:'CVC抜去後の空気塞栓は致死的。まず挿入部を密封（ガーゼ+フィルム）'}},
ng:{id:'ng',title:'🟡 経鼻胃管',result:{severity:'low',title:'NGチューブ自己抜去',
actions:['鼻出血のチェック・止血','誤嚥のリスク評価','再挿入の必要性判断: 減圧目的?栄養?薬剤投与?','再挿入する場合: X線で先端位置確認','減圧目的のNG→イレウスの状態再評価','栄養目的→経口摂取可能か評価','せん妄対策の強化'],
workup:['腹部X線（再挿入時の位置確認）','腹部所見（イレウスの場合）'],
disposition:'再挿入or経口移行を検討',pitfall:'NG再挿入時は必ずX線で位置確認（気管挿入の除外）。聴診だけでは不十分'}},
peg:{id:'peg',title:'🟡 胃瘻(PEG)チューブ',result:{severity:'urgent',title:'PEGチューブ自己抜去',
actions:['造設後2週間以内の抜去→緊急: 瘻孔未完成で腹膜炎リスク→外科コンサルト','造設2週間以降→瘻孔は数時間で閉鎖開始','瘻孔維持: フォーリーカテーテル等を一時的に挿入（サイズダウンでも可）','腹膜炎徴候（腹痛/発熱/腹膜刺激徴候）の確認','再挿入は消化器科/外科に依頼','瘻孔閉鎖前の再挿入が重要（6-12時間以内が目安）'],
workup:['腹部X線','バイタルサイン','腹部CT（腹膜炎疑い時）','血液検査（炎症所見）'],
disposition:'早期PEG(2週間以内)の抜去→緊急外科コンサルト。それ以外→瘻孔維持+再挿入手配',pitfall:'造設後早期の抜去は腹膜炎の危険。瘻孔は数時間で閉鎖するため速やかに対応'}},
foley:{id:'foley',title:'🚿 尿道カテーテル',result:{severity:'low',title:'尿道カテーテル自己抜去',
actions:['バルーン膨張のまま抜去→尿道損傷の評価','血尿の有無確認','排尿可能か評価（自排尿テスト）','尿閉→再挿入','カテーテルが本当に必要か再評価（不要なら再挿入しない）','尿道損傷疑い→泌尿器科コンサルト','再挿入困難→3wayカテ or 泌尿器科'],
workup:['残尿測定（エコー）','尿検査（血尿確認）'],
disposition:'自排尿可能なら経過観察。尿閉→再挿入',pitfall:'バルーンが膨らんだまま引き抜かれた場合は尿道損傷を疑う。無理な再挿入は二次損傷リスク'}},
drain:{id:'drain',title:'🔴 胸腔/腹腔ドレーン',result:{severity:'critical',title:'ドレーン自己抜去',
actions:['胸腔ドレーン: 即座にガーゼ+フィルムで密封（開放性気胸予防）','バイタルサイン確認','呼吸状態の評価（SpO2/呼吸音）','胸部X線（気胸の有無確認）','腹腔ドレーン: 挿入部の汚染・腹膜炎徴候の確認','ドレナージが必要な状態なら再挿入を検討','外科/主治医に即座に報告'],
workup:['胸部X線（胸腔ドレーンの場合）','バイタルサイン','腹部CT（腹腔ドレーンで腹膜炎疑い時）'],
disposition:'状態に応じてICU or 経過観察',pitfall:'胸腔ドレーン抜去後は開放性気胸→緊張性気胸に移行する可能性。即座に密封'}},
}

export default function Page(){const[path,setPath]=useState(['start']);const cur=tree[path[path.length-1]]||tree.start;const goBack=()=>setPath(p=>p.length>1?p.slice(0,-1):p);const choose=(v:string)=>{const n=cur.next?.(v)||v;if(tree[n])setPath(p=>[...p,n])};const reset=()=>setPath(['start']);const sev={'critical':'bg-red-600','urgent':'bg-orange-500','moderate':'bg-yellow-500','low':'bg-green-600'};const sevL={'critical':'\ud83d\udd34 緊急','urgent':'\ud83d\udfe0 急ぎ','moderate':'\ud83d\udfe1 準緊急','low':'\ud83d\udfe2 低緊急'};return(<main className="max-w-3xl mx-auto px-4 py-8"><nav className="text-sm text-muted mb-4"><Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span><Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span><Link href="/tools/inpatient" className="hover:text-ac">入院中トラブル</Link><span className="mx-2">›</span><span>自己抜去</span></nav><h1 className="text-xl font-bold text-tx mb-4">⚠️ 自己抜去 対応フロー</h1><ERDisclaimerBanner/><div className="my-6 bg-s0 border border-br rounded-2xl p-6">{path.length>1&&<button onClick={goBack} className="text-xs text-muted hover:text-ac mb-3 flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>戻る</button>}<h2 className="text-base font-bold text-tx mb-1">{cur.title}</h2>{cur.desc&&<p className="text-xs text-muted mb-4 leading-relaxed">{cur.desc}</p>}{cur.choices&&(<div className="space-y-2 mt-4">{cur.choices.map(c=>(<button key={c.value} onClick={()=>choose(c.value)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all hover:border-ac/40 hover:bg-acl ${c.danger?'border-red-200 bg-red-50/50':'border-br'}`}><span className="text-sm font-medium text-tx">{c.icon&&<span className="mr-2">{c.icon}</span>}{c.label}</span></button>))}</div>)}{cur.result&&(<div className="mt-2"><ERResultCaution/><div className="flex items-center gap-2 mb-4"><span className={`text-xs text-white font-bold px-2 py-1 rounded ${sev[cur.result.severity]}`}>{sevL[cur.result.severity]}</span><span className="text-base font-bold text-tx">{cur.result.title}</span></div><S t="対応" items={cur.result.actions}/><S t="検査" items={cur.result.workup}/><div className="mt-3 bg-s1 rounded-lg p-3"><p className="text-[10px] text-muted mb-0.5">Disposition</p><p className="text-xs text-tx font-medium">{cur.result.disposition}</p></div>{cur.result.pitfall&&<div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3"><p className="text-[10px] text-amber-700 font-bold mb-0.5">⚠️ Pitfall</p><p className="text-xs text-amber-900 leading-relaxed">{cur.result.pitfall}</p></div>}<button onClick={reset} className="mt-4 w-full py-2.5 rounded-xl border border-br text-sm font-medium text-muted hover:text-tx transition-colors">最初からやり直す</button></div>)}</div><ERDisclaimerFooter/></main>)}
function S({t,items}:{t:string;items:string[]}){return(<div className="mt-3"><p className="text-xs font-bold text-tx mb-2">{t}</p><ul className="space-y-1.5">{items.map((a,i)=><li key={i} className="text-xs text-muted leading-relaxed flex gap-2"><span className="text-ac flex-shrink-0 mt-0.5">•</span><span>{a}</span></li>)}</ul></div>)}
