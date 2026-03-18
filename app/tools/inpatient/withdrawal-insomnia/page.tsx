'use client'
import { useState } from 'react'
import Link from 'next/link'
import { ERDisclaimerBanner,ERDisclaimerFooter,ERResultCaution } from '@/components/tools/ERDisclaimer'
interface C{label:string;value:string;icon?:string;danger?:boolean}
interface N{id:string;title:string;desc?:string;choices?:C[];result?:{severity:'critical'|'urgent'|'moderate'|'low';title:string;actions:string[];workup:string[];disposition:string;pitfall?:string};next?:(s:string)=>string}
const tree:Record<string,N>={
start:{id:'start',title:'Step 1: 主な問題は？',choices:[
{label:'アルコール離脱症状（振戦/発汗/頻脈/幻覚）',value:'withdrawal',icon:'🍺',danger:true},
{label:'入院中の不眠',value:'insomnia',icon:'😴'},
],next:v=>v},
withdrawal:{id:'withdrawal',title:'Step 2: アルコール離脱の重症度',desc:'CIWA-Arスコアで評価。入院後24-72hが最もリスクが高い。',choices:[
{label:'軽症（CIWA<10: 不安/振戦/不眠/嘔気）',value:'mild_w',icon:'🟡'},
{label:'中等症（CIWA 10-18: 著明な振戦/発汗/頻脈/幻覚）',value:'mod_w',icon:'🟠'},
{label:'重症/離脱せん妄(DT)（CIWA>18: 高熱/けいれん/意識障害）',value:'severe_w',icon:'🔴',danger:true},
{label:'離脱けいれん',value:'seizure_w',icon:'⚡',danger:true},
],next:v=>v},
mild_w:{id:'mild_w',title:'🟡 軽症離脱',result:{severity:'moderate',title:'軽症アルコール離脱',
actions:['CIWA-Ar 2-4h毎に評価','環境調整: 静かな部屋/適度な照明','支持的ケア: 補液/栄養','チアミン(B1) 100mg iv/im → 経口100mg/日×3-5日','葉酸 1mg/日','マルチビタミン','BZP（CIWA≧10で開始）: ジアゼパム 5-10mg po or ロラゼパム 1-2mg po','電解質補正（Mg/K/PO4）'],
workup:['CIWA-Arスコア','CBC','電解質(Mg/K/PO4)','肝機能','血糖'],
disposition:'CIWA monitoring。悪化なければ一般病棟で管理',pitfall:'軽症でも急速にDTに進行しうる。CIWA定期評価を怠らない'}},
mod_w:{id:'mod_w',title:'🟠 中等症離脱',result:{severity:'urgent',title:'中等症アルコール離脱',
actions:['CIWA-Ar 1-2h毎に評価','ジアゼパム 10-20mg po/iv q1-2h（CIWA≧10で投与）','肝障害あり→ロラゼパム 2-4mg iv（肝代謝依存が少ない）','チアミン 100mg iv（ブドウ糖投与前に必ず）','補液+電解質補正','環境調整','バイタルサインモニタリング'],
workup:['CIWA-Arスコア（1-2h毎）','電解質','肝機能','血糖','心電図'],
disposition:'一般病棟（頻回モニタリング体制）',pitfall:'ジアゼパムの蓄積に注意（高齢者/肝障害）。ロラゼパムへの変更を検討'}},
severe_w:{id:'severe_w',title:'🔴 重症離脱/離脱せん妄(DT)',result:{severity:'critical',title:'離脱せん妄(DT) — ICU管理',
actions:['ICU管理','ジアゼパム 10-20mg iv q5-10min（鎮静達成まで）','大量BZP必要→フェノバルビタール 130-260mg iv追加','挿管準備（過鎮静/気道防御反射低下時）','チアミン 200-500mg iv tid × 3日（Wernicke予防）','補液: 生食（脱水補正）+電解質（Mg/K/PO4）','冷却: 高体温（>38.5℃）→物理的冷却','DT死亡率: 未治療15-20% → 適切治療<5%'],
workup:['CIWA-Arスコア（頻回）','バイタルサイン（持続モニタリング）','電解質','ABG','CK（横紋筋融解）','肝機能','頭部CT（他の原因除外）'],
disposition:'ICU管理。DT改善後もBZP漸減',pitfall:'DTは致死的。BZP投与を躊躇しない。チアミンはブドウ糖前に必ず投与（Wernicke脳症予防）'}},
seizure_w:{id:'seizure_w',title:'⚡ 離脱けいれん',result:{severity:'critical',title:'アルコール離脱けいれん',
actions:['ジアゼパム 10mg iv（けいれん持続中）','ロラゼパム 2-4mg iv（代替）','けいれんは通常48h以内に起こる（入院後）','離脱けいれんは通常自然停止するが、DT前駆症状','BZP投与でけいれん予防+DT予防','フェニトインはアルコール離脱けいれんには無効','けいれん後のCIWA monitoring強化'],
workup:['血糖（低血糖除外）','電解質（Mg/Na/Ca）','頭部CT（初発けいれん or 既往と異なるパターン）','アルコール血中濃度'],
disposition:'ICU or モニタリング可能な病棟',pitfall:'アルコール離脱けいれんは抗てんかん薬ではなくBZPで治療。フェニトインは無効'}},
insomnia:{id:'insomnia',title:'Step 2: 入院中の不眠',desc:'まず非薬物的対応。安易なBZP処方は避ける。',choices:[
{label:'非薬物的対応から始めたい',value:'non_pharm',icon:'🌿'},
{label:'非薬物的対応で改善しない',value:'pharm',icon:'💊'},
{label:'せん妄の可能性がある',value:'check_delirium',icon:'🔍'},
],next:v=>v},
non_pharm:{id:'non_pharm',title:'🌿 非薬物的不眠対策',result:{severity:'low',title:'非薬物的対応 — 睡眠衛生',
actions:['夜間の照明・騒音を最小化','不要な夜間バイタル測定の中止/頻度減少','日中の覚醒促進（離床/リハビリ/日光）','カフェイン制限（14時以降）','温かい飲み物（カフェインフリー）','就寝前のルーティン確立','耳栓・アイマスクの提供','不安への傾聴・対応','痛みがあれば適切な鎮痛'],
workup:['睡眠パターンの記録','せん妄スクリーニング（CAM）'],
disposition:'2-3日試行して改善なければ薬物も検討',pitfall:'入院環境自体が不眠の最大の原因。環境改善が最も効果的'}},
pharm:{id:'pharm',title:'💊 薬物治療',result:{severity:'low',title:'入院中不眠の薬物対応',
actions:['【第一選択】','トラゾドン 25-50mg（高齢者は25mg開始）: 依存性低い','ラメルテオン 8mg（メラトニン受容体作動薬: せん妄リスク低い）','スボレキサント 15-20mg（高齢者10mg: オレキシン受容体拮抗薬）','【できれば避ける】','BZP系（トリアゾラム/ニトラゼパム等）: せん妄リスク↑/転倒↑/依存性','非BZP系（ゾルピデム等）: BZPよりはマシだが同様のリスク','抗ヒスタミン薬（ジフェンヒドラミン）: 抗コリン作用でせん妄悪化','【特殊な場合】','ICU: デクスメデトミジン','アルコール離脱: BZP（この場合はBZPが適応）'],
workup:['薬剤リスト確認（不眠の原因薬剤?）','せん妄評価'],
disposition:'短期間での漸減・中止を計画',pitfall:'入院中に開始したBZPが退院後も漫然と続くケースが多い。退院時に見直しを'}},
check_delirium:{id:'check_delirium',title:'🔍 せん妄の評価',result:{severity:'moderate',title:'不眠ではなくせん妄の可能性',
actions:['CAM(Confusion Assessment Method)で評価','急性発症+注意力障害+意識変動→せん妄','せん妄なら不眠薬ではなく原因治療','低活動型せん妄は「不眠」「元気がない」と見誤られやすい','せん妄→詳細は「せん妄対応フロー」を参照'],
workup:['CAMスコア','血液検査（感染/電解質/肝腎機能）','薬剤リスト確認','残尿/便秘チェック'],
disposition:'せん妄確定→原因検索と治療',pitfall:'「夜眠れない」と言っている患者が実はせん妄。BZPを出すと悪化する'}},
}

export default function Page(){const[path,setPath]=useState(['start']);const cur=tree[path[path.length-1]]||tree.start;const goBack=()=>setPath(p=>p.length>1?p.slice(0,-1):p);const choose=(v:string)=>{const n=cur.next?.(v)||v;if(tree[n])setPath(p=>[...p,n])};const reset=()=>setPath(['start']);const sev={'critical':'bg-red-600','urgent':'bg-orange-500','moderate':'bg-yellow-500','low':'bg-green-600'};const sevL={'critical':'\ud83d\udd34 緊急','urgent':'\ud83d\udfe0 急ぎ','moderate':'\ud83d\udfe1 準緊急','low':'\ud83d\udfe2 低緊急'};return(<main className="max-w-3xl mx-auto px-4 py-8"><nav className="text-sm text-muted mb-4"><Link href="/" className="hover:text-ac">ホーム</Link><span className="mx-2">›</span><Link href="/tools" className="hover:text-ac">臨床ツール</Link><span className="mx-2">›</span><Link href="/tools/inpatient" className="hover:text-ac">入院中トラブル</Link><span className="mx-2">›</span><span>アルコール離脱・不眠</span></nav><h1 className="text-xl font-bold text-tx mb-4">🌙 アルコール離脱・不眠 対応フロー</h1><ERDisclaimerBanner/><div className="my-6 bg-s0 border border-br rounded-2xl p-6">{path.length>1&&<button onClick={goBack} className="text-xs text-muted hover:text-ac mb-3 flex items-center gap-1"><svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7"/></svg>戻る</button>}<h2 className="text-base font-bold text-tx mb-1">{cur.title}</h2>{cur.desc&&<p className="text-xs text-muted mb-4 leading-relaxed">{cur.desc}</p>}{cur.choices&&(<div className="space-y-2 mt-4">{cur.choices.map(c=>(<button key={c.value} onClick={()=>choose(c.value)} className={`w-full text-left px-4 py-3 rounded-xl border transition-all hover:border-ac/40 hover:bg-acl ${c.danger?'border-red-200 bg-red-50/50':'border-br'}`}><span className="text-sm font-medium text-tx">{c.icon&&<span className="mr-2">{c.icon}</span>}{c.label}</span></button>))}</div>)}{cur.result&&(<div className="mt-2"><ERResultCaution/><div className="flex items-center gap-2 mb-4"><span className={`text-xs text-white font-bold px-2 py-1 rounded ${sev[cur.result.severity]}`}>{sevL[cur.result.severity]}</span><span className="text-base font-bold text-tx">{cur.result.title}</span></div><S t="対応" items={cur.result.actions}/><S t="検査" items={cur.result.workup}/><div className="mt-3 bg-s1 rounded-lg p-3"><p className="text-[10px] text-muted mb-0.5">Disposition</p><p className="text-xs text-tx font-medium">{cur.result.disposition}</p></div>{cur.result.pitfall&&<div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-3"><p className="text-[10px] text-amber-700 font-bold mb-0.5">⚠️ Pitfall</p><p className="text-xs text-amber-900 leading-relaxed">{cur.result.pitfall}</p></div>}<button onClick={reset} className="mt-4 w-full py-2.5 rounded-xl border border-br text-sm font-medium text-muted hover:text-tx transition-colors">最初からやり直す</button></div>)}</div><ERDisclaimerFooter/></main>)}
function S({t,items}:{t:string;items:string[]}){return(<div className="mt-3"><p className="text-xs font-bold text-tx mb-2">{t}</p><ul className="space-y-1.5">{items.map((a,i)=><li key={i} className="text-xs text-muted leading-relaxed flex gap-2"><span className="text-ac flex-shrink-0 mt-0.5">•</span><span>{a}</span></li>)}</ul></div>)}
