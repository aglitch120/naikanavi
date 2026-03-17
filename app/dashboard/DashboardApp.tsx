// @ts-nocheck
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { SPECIALTIES as SP, DISEASE_GROUPS as DG } from '@/lib/josler-data'
import { useProStatus } from '@/components/pro/useProStatus'
import ProModal from '@/components/pro/ProModal'
import {
  loadDashboardData, saveDashboardData, saveToLocal,
  startAutoSave, stopAutoSave, setStatusCallback,
  type DashboardData, type SaveStatus,
} from '@/lib/dashboard-storage'


// ── Default 5 tasks ──
const DEFAULT_TASKS=[
  {id:"docs",label:"書類",emoji:"📄"},
  {id:"rx",label:"処方",emoji:"💊"},
  {id:"iv",label:"注射",emoji:"💉"},
  {id:"lab",label:"採血",emoji:"🩸"},
  {id:"order",label:"指示簿",emoji:"📋"},
];
// ── Suggestions (includes former defaults + procedures) ──
const EXTRA=[
  {id:"consult",label:"コンサル",emoji:"🤝"},{id:"culture",label:"培養",emoji:"🧫"},{id:"ic",label:"IC",emoji:"🗣️"},{id:"template",label:"テンプレ",emoji:"📝"},
  {id:"surgery",label:"手術",emoji:"🔪"},{id:"dialysis",label:"透析",emoji:"🫘"},{id:"thoracentesis",label:"胸穿",emoji:"🫁"},
  {id:"paracentesis",label:"腹穿",emoji:"💧"},{id:"lp",label:"腰椎穿刺",emoji:"🦴"},{id:"bma",label:"骨髄穿刺",emoji:"🦠"},
  {id:"line",label:"ルート確保",emoji:"🔗"},{id:"cv",label:"CV",emoji:"🩺"},{id:"prevention",label:"予防",emoji:"🛡️"},
  {id:"ct",label:"CT",emoji:"🔍"},{id:"echo",label:"エコー",emoji:"📡"},{id:"xray",label:"XP",emoji:"☢️"},
  {id:"mri",label:"MRI",emoji:"🧲"},{id:"ekg",label:"心電図",emoji:"📈"},{id:"rehab",label:"リハ",emoji:"🏃"},
  {id:"nutrition",label:"栄養",emoji:"🍽️"},{id:"family",label:"家族対応",emoji:"👨‍👩‍👧"},{id:"dcplan",label:"退院調整",emoji:"🏠"},
  {id:"procedure",label:"処置",emoji:"🩹"},
];
const AGES=["10代","20代","30代","40代","50代","60代","70代","80代","90代","100代"];
const uid=()=>Date.now().toString(36)+Math.random().toString(36).slice(2,7);
const C={bg:"#F5F4F0",s0:"#FEFEFC",s1:"#F0EDE7",s2:"#E8E5DF",br:"#DDD9D2",br2:"#C8C4BC",tx:"#1A1917",m:"#6B6760",ac:"#1B4F3A",acl:"#E8F0EC",ac2:"#155230",ok:"#166534",dn:"#991B1B"};
const td=()=>{const d=new Date();return`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;};
const fd=(i:string)=>{if(!i)return"";const[,m,d]=i.split("-");return`${+m}/${+d}`;};
const fdJP=(i:string)=>{if(!i)return"";const d=new Date(i+"T00:00");const w=["日","月","火","水","木","金","土"][d.getDay()];return`${d.getMonth()+1}月${d.getDate()}日（${w}）`;};

function exportCSV(arc:any[],cFields:any[]){
  const hd=["病室","患者ID","年代","性別","領域","疾患群","診断名","入院日","退院日","メモ"];
  cFields.forEach((f:any)=>hd.push(f.label));
  const esc=(v:any)=>`"${String(v||"").replace(/"/g,'""')}"`;
  const rows=[hd.map(esc).join(",")];
  arc.forEach((p:any)=>{
    const sp=p.specialty?(SP.find((s:any)=>s.id===p.specialty)?.label||""):"";
    const dg=p.diseaseGroup&&p.specialty?(DG[p.specialty]||[]).find((d:any)=>d.id===p.diseaseGroup)?.name||"":"";
    const r=[p.room,p.name,p.age,p.sex==="M"?"男性":p.sex==="F"?"女性":"",sp,dg,p.diagnosis,p.admitDate,p.dischargeDate,p.memo];
    cFields.forEach((f:any)=>r.push(p.customData?.[f.id]||""));
    rows.push(r.map(esc).join(","));
  });
  const blob=new Blob(["\uFEFF"+rows.join("\n")],{type:"text/csv;charset=utf-8;"});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");a.href=url;a.download=`iwor_症例ログ_${td()}.csv`;
  document.body.appendChild(a);a.click();document.body.removeChild(a);URL.revokeObjectURL(url);
}

// ═══════ MAIN ═══════
export default function DashboardApp(){
  const { isPro } = useProStatus()
  const[tab,setTab]=useState<string>("todo");
  const[pts,setPts]=useState<any[]>([]);
  const[arc,setArc]=useState<any[]>([]);
  const[selId,setSelId]=useState<string|null>(null);
  const[showAdd,setShowAdd]=useState<boolean>(false);
  const[tasks,setTasks]=useState(DEFAULT_TASKS);
  const[search,setSearch]=useState<string>("");
  const[lastReset,setLastReset]=useState(()=>new Date().toDateString());
  const[dcId,setDcId]=useState<string|null>(null);
  const[editTasks,setEditTasks]=useState<boolean>(false);
  const[editFields,setEditFields]=useState<boolean>(false);
  const[cFields,setCFields]=useState<any[]>([]);
  const[editLogId,setEditLogId]=useState<string|null>(null);
  const[cusIn,setCusIn]=useState<string>("");
  const[cfIn,setCfIn]=useState<string>("");
  const[saveStatus,setSaveStatus]=useState<SaveStatus>("saved");
  const[showProModal,setShowProModal]=useState<boolean>(false);
  const[proFeature,setProFeature]=useState<string>("full_access");
  const[loaded,setLoaded]=useState<boolean>(false);
  const[showTutorial,setShowTutorial]=useState<boolean>(false);
  const[helpDismissed,setHelpDismissed]=useState<boolean>(false);
  const saveTimer=useRef<any>(null);

  // ── Data load on mount ──
  useEffect(()=>{
    (async()=>{
      const data=await loadDashboardData();
      if(data){
        if(data.patients?.length) setPts(data.patients);
        if(data.archived?.length) setArc(data.archived);
        if(data.taskTemplates?.length) setTasks(data.taskTemplates);
        if(data.customFields?.length) setCFields(data.customFields);
      }
      setLoaded(true);
      // Show tutorial on first visit
      if(!localStorage.getItem('iwor_dashboard_tutorial_done')) setShowTutorial(true);
      // Check if help button was permanently dismissed
      if(localStorage.getItem('iwor_dashboard_help_dismissed')) setHelpDismissed(true);
    })();
    setStatusCallback(setSaveStatus);
    return()=>{stopAutoSave();};
  },[]);

  // ── Auto-save: debounced on every state change ──
  const getPayload=useCallback(():DashboardData=>({
    patients:pts, archived:arc, taskTemplates:tasks, customFields:cFields,
  }),[pts,arc,tasks,cFields]);

  useEffect(()=>{
    if(!loaded) return;
    if(!isPro){
      // FREE: save to localStorage only (session-level convenience)
      saveToLocal(getPayload());
      return;
    }
    // PRO: debounced save (localStorage immediate + cloud debounced)
    if(saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current=setTimeout(()=>{
      saveDashboardData(getPayload(),true);
    },2000);
    // localStorage immediate
    saveToLocal(getPayload());
  },[pts,arc,tasks,cFields,loaded,isPro,getPayload]);

  // ── Start auto-save for PRO users ──
  useEffect(()=>{
    if(loaded && isPro){
      startAutoSave(getPayload);
    }
    return()=>{stopAutoSave();};
  },[loaded,isPro,getPayload]);

  // ── Daily task reset ──
  useEffect(()=>{const t=new Date().toDateString();if(lastReset!==t){setPts((p:any)=>p.map((x:any)=>({...x,tasks:Object.fromEntries(Object.keys(x.tasks).map((k:any)=>[k,false]))})));setLastReset(t);}},[lastReset]);

  // ── PRO gate helper ──
  const requirePro=(feature:string)=>{
    if(isPro) return false;
    setProFeature(feature);
    setShowProModal(true);
    return true;
  };

  const addPt=(d:any)=>{
    // 3人目以上 → PRO
    if(pts.length>=2 && requirePro("full_access")) return;
    setPts((p:any)=>[...p,{id:uid(),...d,tasks:Object.fromEntries(tasks.map((t:any)=>[t.id,false])),memo:"",admitDate:td(),customData:{}}]);setShowAdd(false);
  };
  const updPt=(id:string,u:any)=>setPts((p:any)=>p.map((x:any)=>x.id===id?{...x,...u}:x));
  const togTask=(pid:string,tid:string)=>setPts((p:any)=>p.map((x:any)=>x.id===pid?{...x,tasks:{...x.tasks,[tid]:!x.tasks[tid]}}:x));
  const discharge=(id:string)=>{const p=pts.find((x:any)=>x.id===id);if(!p)return;setArc((a:any)=>[{...p,dischargeDate:td()},...a]);setPts(ps=>ps.filter((x:any)=>x.id!==id));setSelId(null);setDcId(null);};
  const addTask=(t:any)=>{if(!tasks.find((x:any)=>x.id===t.id)){setTasks((p:any)=>[...p,t]);setPts((p:any)=>p.map((x:any)=>({...x,tasks:{...x.tasks,[t.id]:false}})));}};
  const rmTask=(id:string)=>{setTasks((p:any)=>p.filter((t:any)=>t.id!==id));setPts((p:any)=>p.map((x:any)=>{const n={...x.tasks};delete n[id];return{...x,tasks:n};}));};
  const addCustomTask=():void=>{const l=cusIn.trim();if(!l)return;addTask({id:uid(),label:l,emoji:"📌"});setCusIn("");};
  const addCField=():void=>{const l=cfIn.trim();if(!l)return;setCFields((p:any)=>[...p,{id:uid(),label:l}]);setCfIn("");};
  const updArc=(id:string,u:any)=>setArc((a:any)=>a.map((x:any)=>x.id===id?{...x,...u}:x));

  const stats=arc.reduce((a:any,p:any)=>{const d=p.specialty?(SP.find((s:any)=>s.id===p.specialty)?.short||"?"):"未設定";a[d]=(a[d]||0)+1;return a;},{});
  const filtered=arc.filter(p=>{if(!search)return true;const q=search.toLowerCase();const sp=p.specialty?(SP.find((s:any)=>s.id===p.specialty)?.label||""):"";return[p.name,sp,p.diagnosis,p.memo,p.room].some((v:any)=>(v||"").toLowerCase().includes(q));});
  const selP=pts.find((p:any)=>p.id===selId);
  const editLP=arc.find((p:any)=>p.id===editLogId);

  return(
    <div style={{background:C.bg,minHeight:"100vh",fontFamily:"-apple-system,BlinkMacSystemFont,'Segoe UI','Hiragino Kaku Gothic ProN',sans-serif",color:C.tx,maxWidth:720,margin:"0 auto",position:"relative",paddingBottom:80}}>
      {/* Header */}
      <div style={{background:C.s0,borderBottom:`1px solid ${C.br}`,padding:"14px 18px",display:"flex",alignItems:"center",gap:10,position:"sticky",top:56,zIndex:40}}>
        <div style={{width:32,height:32,background:C.ac,borderRadius:8,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:14,fontWeight:700}}>iw</div>
        <span style={{fontWeight:700,fontSize:17}}>病棟TODO</span>
        <span style={{fontSize:11,color:C.ac,background:C.acl,padding:"2px 7px",borderRadius:4,fontWeight:600}}>PRO</span>
        <span style={{flex:1}} />
        {isPro && (
          <span style={{fontSize:11,padding:"3px 8px",borderRadius:12,fontFamily:"monospace",background:saveStatus==="saved"?"#DCFCE7":saveStatus==="saving"||saveStatus==="dirty"?"#FEF3C7":saveStatus==="error"?"#FEE2E2":"#EEF4FF",color:saveStatus==="saved"?"#166534":saveStatus==="saving"||saveStatus==="dirty"?"#92400E":saveStatus==="error"?"#991B1B":"#1E40AF",transition:"all .3s"}}>
            {saveStatus==="saved"?"✓ 保存済み":saveStatus==="saving"||saveStatus==="dirty"?"⟳ 保存中…":saveStatus==="error"?"✕ 保存失敗":"☁ オフライン"}
          </span>
        )}
      </div>

      {/* Tabs */}
      <div style={{display:"flex",background:C.s0,borderBottom:`1px solid ${C.br}`}}>
        {[{k:"todo",l:"病棟TODO",c:pts.length},{k:"log",l:"症例ログ",c:arc.length}].map((t:any)=>(
          <button key={t.k} onClick={()=>{setTab(t.k);setSelId(null);setEditTasks(false);setEditFields(false);setEditLogId(null);}} style={{flex:1,padding:"12px 0",border:"none",background:"none",cursor:"pointer",borderBottom:tab===t.k?`2.5px solid ${C.ac}`:"2.5px solid transparent",color:tab===t.k?C.ac:C.m,fontWeight:tab===t.k?600:400,fontSize:14}}>
            {t.l}<span style={{marginLeft:6,fontSize:12,background:tab===t.k?C.acl:C.s1,color:tab===t.k?C.ac:C.m,padding:"1px 7px",borderRadius:10,fontWeight:600}}>{t.c}</span>
          </button>
        ))}
      </div>

      <div style={{padding:"12px 14px"}}>
        {!loaded?(
          <div style={{textAlign:"center",padding:"60px 20px",color:C.m}}>
            <div style={{fontSize:13}}>読み込み中...</div>
          </div>
        ):tab==="todo"?(
          <>
            <div style={{textAlign:"center",marginBottom:12,fontSize:13,color:C.m,fontWeight:500}}>📅 {fdJP(td())}</div>

            {/* ── Settings row: Task editor + Measurement editor side by side ── */}
            {pts.length>0&&(
              <div style={{display:"flex",gap:8,marginBottom:12}}>
                {/* Task editor card */}
                <div style={{flex:1,background:C.s0,border:`1px solid ${C.br}`,borderRadius:10,padding:"10px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:editTasks?10:0}}>
                    <span style={{fontSize:11,color:C.m,fontWeight:600}}>📋 タスク項目 ({tasks.length})</span>
                    <button onClick={()=>{setEditTasks(!editTasks);setEditFields(false);}} style={{background:editTasks?C.acl:"transparent",border:`1px solid ${editTasks?C.ac:C.br}`,borderRadius:6,padding:"3px 8px",fontSize:11,color:editTasks?C.ac:C.m,cursor:"pointer",fontWeight:500}}>{editTasks?"✓ 完了":"編集"}</button>
                  </div>
                  {editTasks&&(
                    <>
                      <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                        {tasks.map((t:any)=>(
                          <div key={t.id} style={{display:"flex",alignItems:"center",gap:2,padding:"3px 4px 3px 8px",background:C.acl,border:`1.5px solid ${C.ac}40`,borderRadius:6,fontSize:11}}>
                            {t.emoji} {t.label}
                            <button onClick={()=>rmTask(t.id)} style={{background:"none",border:"none",color:C.dn,cursor:"pointer",fontSize:13,padding:"0 2px",lineHeight:1}}>×</button>
                          </div>
                        ))}
                      </div>
                      <div style={{fontSize:10,color:C.m,marginBottom:4,fontWeight:500}}>候補:</div>
                      <div style={{display:"flex",flexWrap:"wrap",gap:3,marginBottom:8}}>
                        {EXTRA.filter((s:any)=>!tasks.find((t:any)=>t.id===s.id)).map((s:any)=>(
                          <button key={s.id} onClick={()=>addTask(s)} style={{padding:"2px 7px",borderRadius:5,border:`1.5px dashed ${C.br2}`,background:C.s0,fontSize:10,color:C.m,cursor:"pointer",display:"flex",alignItems:"center",gap:2}}>
                            {s.emoji}{s.label}<span style={{color:C.ac,fontWeight:700}}>+</span>
                          </button>
                        ))}
                      </div>
                      <div style={{display:"flex",gap:4}}>
                        <input value={cusIn} onChange={e=>setCusIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addCustomTask();}} placeholder="カスタム項目..." style={{flex:1,padding:"6px 8px",border:`1.5px solid ${C.br}`,borderRadius:6,fontSize:12,outline:"none",background:C.bg,boxSizing:"border-box"}} />
                        <button onClick={addCustomTask} style={{padding:"6px 10px",borderRadius:6,border:"none",background:C.ac,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>追加</button>
                      </div>
                    </>
                  )}
                </div>

                {/* Measurement field editor card */}
                <div style={{flex:1,background:C.s0,border:`1px solid ${C.br}`,borderRadius:10,padding:"10px 12px"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:editFields?10:0}}>
                    <span style={{fontSize:11,color:C.m,fontWeight:600}}>📊 記録項目 ({cFields.length})</span>
                    <button onClick={()=>{setEditFields(!editFields);setEditTasks(false);}} style={{background:editFields?C.acl:"transparent",border:`1px solid ${editFields?C.ac:C.br}`,borderRadius:6,padding:"3px 8px",fontSize:11,color:editFields?C.ac:C.m,cursor:"pointer",fontWeight:500}}>{editFields?"✓ 完了":"編集"}</button>
                  </div>
                  {editFields&&(
                    <>
                      {cFields.length>0&&(
                        <div style={{display:"flex",flexWrap:"wrap",gap:4,marginBottom:8}}>
                          {cFields.map((f:any)=>(
                            <div key={f.id} style={{display:"flex",alignItems:"center",gap:2,padding:"3px 4px 3px 8px",background:C.acl,border:`1.5px solid ${C.ac}40`,borderRadius:6,fontSize:11}}>
                              {f.label}
                              <button onClick={()=>setCFields((p:any)=>p.filter((x:any)=>x.id!==f.id))} style={{background:"none",border:"none",color:C.dn,cursor:"pointer",fontSize:13,padding:"0 2px"}}>×</button>
                            </div>
                          ))}
                        </div>
                      )}
                      {cFields.length===0&&<div style={{fontSize:11,color:C.br2,marginBottom:6}}>自由に記録項目を追加できます</div>}
                      <div style={{display:"flex",gap:4}}>
                        <input value={cfIn} onChange={e=>setCfIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")addCField();}} placeholder="例: 主治医、術式…" style={{flex:1,padding:"6px 8px",border:`1.5px solid ${C.br}`,borderRadius:6,fontSize:12,outline:"none",background:C.bg,boxSizing:"border-box"}} />
                        <button onClick={addCField} style={{padding:"6px 10px",borderRadius:6,border:"none",background:C.ac,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>追加</button>
                      </div>
                      <div style={{fontSize:10,color:C.br2,marginTop:4}}>CSV出力時にカラム追加されます</div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Patient list or empty */}
            {pts.length===0?(
              <div style={{textAlign:"center",padding:"50px 20px",color:C.m}}>
                <div style={{fontSize:48,marginBottom:16,opacity:.4}}>🏥</div>
                <p style={{fontSize:15,marginBottom:8,fontWeight:500,color:C.tx}}>入院患者がいません</p>
                <p style={{fontSize:13,marginBottom:24}}>右下の＋ボタンで患者を追加</p>
                <button onClick={()=>{if(pts.length>=2&&requirePro("full_access"))return;setShowAdd(true);}} style={{background:C.ac,color:"#fff",border:"none",borderRadius:9,padding:"12px 28px",fontSize:14,fontWeight:500,cursor:"pointer"}}>+ 新しい患者を追加</button>
              </div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:8}}>
                {pts.map((p:any)=><PtCard key={p.id} p={p} tasks={tasks} onTog={tid=>togTask(p.id,tid)} onSel={()=>setSelId(p.id)} onDC={()=>setDcId(p.id)} />)}
              </div>
            )}
          </>
        ):(
          /* ═══ Log Tab ═══ */
          <>
            <div style={{display:"flex",gap:8,marginBottom:12}}>
              <div style={{position:"relative",flex:1}}>
                <span style={{position:"absolute",left:10,top:"50%",transform:"translateY(-50%)",color:C.m,fontSize:13,pointerEvents:"none"}}>🔍</span>
                <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="領域、病名、メモで検索..." style={{width:"100%",padding:"9px 10px 9px 32px",border:`1.5px solid ${C.br}`,borderRadius:9,background:C.s0,fontSize:13,color:C.tx,outline:"none",boxSizing:"border-box"}} />
              </div>
              <button onClick={()=>{if(requirePro("save"))return;exportCSV(arc,cFields);}} style={{padding:"9px 12px",borderRadius:9,border:`1.5px solid ${C.ac}`,background:C.acl,color:C.ac,fontSize:12,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap",display:"flex",alignItems:"center",gap:4}}>📥 CSV</button>
            </div>

            {/* Custom fields editor (also in log tab for convenience) */}
            <CFieldCard cFields={cFields} cfIn={cfIn} setCfIn={setCfIn} onAdd={addCField} onRemove={id=>setCFields((p:any)=>p.filter((f:any)=>f.id!==id))} />

            {Object.keys(stats).length>0&&<StatsBar stats={stats} total={arc.length} />}

            {filtered.length===0?(
              <div style={{textAlign:"center",padding:"40px 20px",color:C.m}}><div style={{fontSize:40,marginBottom:12,opacity:.3}}>📋</div><p style={{fontSize:14}}>{search?"検索結果がありません":"退院した患者がいません"}</p></div>
            ):(
              <div style={{display:"flex",flexDirection:"column",gap:6}}>
                {filtered.map((p:any)=>{
                  const sp=p.specialty?(SP.find((s:any)=>s.id===p.specialty)?.short||""):"";
                  return(
                    <div key={p.id} onClick={()=>setEditLogId(p.id)} style={{background:C.s0,border:`1px solid ${C.br}`,borderRadius:10,padding:"10px 14px",cursor:"pointer",transition:"border-color .15s"}}
                      onMouseEnter={e=>{e.currentTarget.style.borderColor=`${C.ac}50`;}} onMouseLeave={e=>{e.currentTarget.style.borderColor=C.br;}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4}}>
                        <span style={{fontSize:12,fontWeight:600,color:C.ac,background:C.acl,padding:"1px 6px",borderRadius:4}}>{p.room||"—"}</span>
                        <span style={{fontSize:14,fontWeight:600,flex:1}}>{p.name||"(ID未設定)"}{p.age&&<span style={{fontSize:12,fontWeight:400,color:C.m,marginLeft:4}}>{p.age}</span>}{p.sex&&<span style={{fontSize:12,fontWeight:400,color:C.m,marginLeft:2}}>{p.sex==="M"?"♂":"♀"}</span>}</span>
                        {sp&&<span style={{fontSize:11,color:C.m,background:C.s1,padding:"1px 6px",borderRadius:4}}>{sp}</span>}
                        <span style={{fontSize:11,color:C.br2}}>✏️</span>
                      </div>
                      <div style={{display:"flex",alignItems:"center",gap:10,fontSize:12,color:C.m,flexWrap:"wrap"}}>
                        {p.diagnosis&&<span>🔖 {p.diagnosis}</span>}
                        <span>📅 {fd(p.admitDate)} → {fd(p.dischargeDate)}</span>
                      </div>
                      {cFields.length>0&&cFields.some((f:any)=>p.customData?.[f.id])&&(
                        <div style={{display:"flex",flexWrap:"wrap",gap:5,marginTop:4}}>
                          {cFields.filter((f:any)=>p.customData?.[f.id]).map((f:any)=>(<span key={f.id} style={{fontSize:11,color:C.m,background:C.s1,padding:"1px 6px",borderRadius:4}}>{f.label}: {p.customData[f.id]}</span>))}
                        </div>
                      )}
                      {p.memo&&<div style={{marginTop:5,fontSize:12,color:C.m,background:C.s1,padding:"5px 10px",borderRadius:6,lineHeight:1.5}}>{p.memo}</div>}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>

      {tab==="todo"&&<button onClick={()=>{if(pts.length>=2&&requirePro("full_access"))return;setShowAdd(true);}} style={{position:"fixed",bottom:"calc(72px + env(safe-area-inset-bottom, 0px))",right:"max(14px,calc(50% - 346px))",width:56,height:56,borderRadius:"50%",border:"none",background:C.ac,color:"#fff",fontSize:28,fontWeight:300,cursor:"pointer",boxShadow:`0 4px 20px ${C.ac}44`,display:"flex",alignItems:"center",justifyContent:"center",zIndex:40}}>+</button>}

      {/* Help button – re-show tutorial (bottom-left, above bottom nav) */}
      {loaded&&!helpDismissed&&localStorage.getItem('iwor_dashboard_tutorial_done')&&!showTutorial&&(
        <div style={{position:"fixed",bottom:"calc(72px + env(safe-area-inset-bottom, 0px))",left:"max(14px,calc(50% - 346px))",zIndex:40,display:"flex",alignItems:"center",gap:0}}>
          <button onClick={()=>setShowTutorial(true)} style={{width:40,height:40,borderRadius:"50%",border:`1.5px solid ${C.br}`,background:C.s0,color:C.ac,fontSize:16,fontWeight:700,cursor:"pointer",boxShadow:`0 2px 10px rgba(0,0,0,.08)`,display:"flex",alignItems:"center",justifyContent:"center"}} aria-label="使い方ヘルプ">?</button>
          <button onClick={()=>{setHelpDismissed(true);localStorage.setItem('iwor_dashboard_help_dismissed','1');}} style={{width:18,height:18,borderRadius:"50%",border:"none",background:C.br2,color:"#fff",fontSize:10,fontWeight:700,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",position:"relative",top:-14,left:-6,lineHeight:1}} aria-label="ヘルプを非表示">×</button>
        </div>
      )}

      {showTutorial&&<Tutorial onClose={()=>{setShowTutorial(false);localStorage.setItem('iwor_dashboard_tutorial_done','1');}} />}
      {showAdd&&<AddModal onAdd={addPt} onClose={()=>setShowAdd(false)} />}
      {selP&&<DetailModal p={selP} tasks={tasks} cFields={cFields} onUpd={u=>updPt(selId,u)} onDC={()=>{setSelId(null);setDcId(selP.id);}} onClose={()=>setSelId(null)} onTog={tid=>togTask(selId,tid)} />}
      {dcId&&<DCConfirm p={pts.find((x:any)=>x.id===dcId)} onOk={()=>discharge(dcId)} onNo={()=>setDcId(null)} />}
      {editLP&&<LogEditModal p={editLP} cFields={cFields} onUpd={u=>updArc(editLogId,u)} onClose={()=>setEditLogId(null)} />}
      {showProModal&&<ProModal feature={proFeature as any} onClose={()=>setShowProModal(false)} />}
    </div>
  );
}

// ═══ Patient Card ═══
function PtCard({p,tasks,onTog,onSel,onDC}:any){
  const done=Object.values(p.tasks).filter(Boolean).length;
  const total=Object.keys(p.tasks).length;
  const prog=total>0?done/total:0;
  const allD=done===total&&total>0;
  const sp=p.specialty?(SP.find((s:any)=>s.id===p.specialty)?.short||""):"";
  return(
    <div style={{background:C.s0,border:`1px solid ${C.br}`,borderRadius:12,padding:"12px 14px"}}>
      <div onClick={onSel} style={{display:"flex",alignItems:"center",gap:8,cursor:"pointer",marginBottom:10}}>
        <span style={{fontSize:13,fontWeight:700,color:C.ac,background:C.acl,padding:"2px 8px",borderRadius:5,minWidth:36,textAlign:"center"}}>{p.room||"—"}</span>
        <span style={{fontSize:14,fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{p.name||"(ID未設定)"}</span>
        {(p.age||p.sex)&&<span style={{fontSize:11,color:C.m,flexShrink:0}}>{p.age||""}{p.sex?(p.sex==="M"?" ♂":" ♀"):""}</span>}
        <span style={{flex:1}} />
        {sp&&<span style={{fontSize:11,color:C.m,background:C.s1,padding:"2px 6px",borderRadius:4,flexShrink:0}}>{sp}</span>}
        <div style={{display:"flex",alignItems:"center",gap:4,flexShrink:0}}>
          <div style={{width:36,height:4,background:C.s2,borderRadius:2,overflow:"hidden"}}><div style={{width:`${prog*100}%`,height:"100%",background:allD?C.ok:C.ac,borderRadius:2,transition:"width .3s"}} /></div>
          <span style={{fontSize:10,color:C.m}}>{done}/{total}</span>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
        {tasks.map((t:any)=>{const d=p.tasks[t.id];return(
          <button key={t.id} onClick={()=>onTog(t.id)} style={{display:"flex",alignItems:"center",gap:3,padding:"4px 8px",borderRadius:6,border:`1.5px solid ${d?C.ac:C.br}`,background:d?C.acl:C.s0,color:d?C.ac:C.m,fontSize:11,fontWeight:500,cursor:"pointer",whiteSpace:"nowrap",transition:"all .12s"}}>
            <span style={{fontSize:12}}>{t.emoji}</span><span style={{textDecoration:d?"line-through":"none",opacity:d?.65:1}}>{t.label}</span>{d&&<span style={{fontSize:10}}>✓</span>}
          </button>
        );})}
        <button onClick={onDC} style={{marginLeft:"auto",display:"flex",alignItems:"center",gap:5,padding:"6px 14px 6px 10px",borderRadius:20,background:"linear-gradient(135deg,#E8F0EC 0%,#d4e8dc 100%)",border:`1.5px solid ${C.ac}30`,color:C.ac,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all .18s",boxShadow:`0 1px 4px ${C.ac}15`}}
          onMouseEnter={e=>{e.currentTarget.style.background=`linear-gradient(135deg,${C.ac},${C.ac2})`;e.currentTarget.style.color="#fff";}}
          onMouseLeave={e=>{e.currentTarget.style.background="linear-gradient(135deg,#E8F0EC 0%,#d4e8dc 100%)";e.currentTarget.style.color=C.ac;}}
        >🏠 退院</button>
      </div>
      {p.diagnosis&&<div onClick={onSel} style={{marginTop:8,fontSize:12,color:C.m,cursor:"pointer"}}>🔖 {p.diagnosis}</div>}
    </div>
  );
}

// ═══ Custom Field Card (log tab) ═══
function CFieldCard({cFields,cfIn,setCfIn,onAdd,onRemove}:any){
  const[open,setOpen]=useState<boolean>(false);
  return(
    <div style={{marginBottom:12,background:C.s0,border:`1px solid ${C.br}`,borderRadius:10,padding:"10px 12px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <span style={{fontSize:12,color:C.m,fontWeight:500}}>📊 カスタム記録項目 ({cFields.length})</span>
        <button onClick={()=>setOpen(!open)} style={{background:open?C.acl:"transparent",border:`1px solid ${open?C.ac:C.br}`,borderRadius:6,padding:"3px 9px",fontSize:11,color:open?C.ac:C.m,cursor:"pointer",fontWeight:500}}>{open?"✓ 完了":"✏️ 編集"}</button>
      </div>
      {open&&(
        <div style={{marginTop:8}}>
          {cFields.length>0&&<div style={{display:"flex",flexWrap:"wrap",gap:5,marginBottom:8}}>{cFields.map((f:any)=>(<div key={f.id} style={{display:"flex",alignItems:"center",gap:3,padding:"3px 5px 3px 9px",background:C.acl,border:`1.5px solid ${C.ac}40`,borderRadius:6,fontSize:12}}>{f.label}<button onClick={()=>onRemove(f.id)} style={{background:"none",border:"none",color:C.dn,cursor:"pointer",fontSize:14,padding:"0 2px"}}>×</button></div>))}</div>}
          <div style={{display:"flex",gap:6}}>
            <input value={cfIn} onChange={e=>setCfIn(e.target.value)} onKeyDown={e=>{if(e.key==="Enter")onAdd();}} placeholder="項目名（例: 主治医、術式）" style={{flex:1,padding:"7px 10px",border:`1.5px solid ${C.br}`,borderRadius:7,fontSize:12,outline:"none",background:C.bg,boxSizing:"border-box"}} />
            <button onClick={onAdd} style={{padding:"7px 12px",borderRadius:7,border:"none",background:C.ac,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer",whiteSpace:"nowrap"}}>追加</button>
          </div>
          <div style={{fontSize:10,color:C.br2,marginTop:4}}>CSV出力時にカラムとして追加されます</div>
        </div>
      )}
    </div>
  );
}

// ═══ Stats ═══
function StatsBar({stats,total}:any){
  const[show,setShow]=useState(true);
  const max=Math.max(...Object.values(stats),1);
  return(
    <div style={{marginBottom:14}}>
      <button onClick={()=>setShow(!show)} style={{display:"flex",alignItems:"center",gap:6,background:"none",border:"none",fontSize:13,color:C.ac,fontWeight:600,cursor:"pointer",marginBottom:6}}>📊 領域別統計 ({total}例) <span style={{fontSize:11}}>{show?"▲":"▼"}</span></button>
      {show&&<div style={{background:C.s0,border:`1px solid ${C.br}`,borderRadius:10,padding:"12px 14px"}}>
        {Object.entries(stats).sort((a:any,b:any)=>b[1]-a[1]).map(([d,c])=>(
          <div key={d} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}>
            <span style={{fontSize:11,color:C.m,width:72,flexShrink:0,textAlign:"right"}}>{d}</span>
            <div style={{flex:1,height:18,background:C.s1,borderRadius:4,overflow:"hidden"}}><div style={{width:`${(c/max)*100}%`,height:"100%",background:C.ac,borderRadius:4,display:"flex",alignItems:"center",justifyContent:"flex-end",paddingRight:5}}><span style={{fontSize:10,color:"#fff",fontWeight:600}}>{c}</span></div></div>
          </div>
        ))}
      </div>}
    </div>
  );
}

// ═══ Add Modal ═══
function AddModal({onAdd,onClose}:any){
  const[room,setRoom]=useState<string>("");const[name,setName]=useState<string>("");const[age,setAge]=useState<string>("");const[sex,setSex]=useState<string>("");const[sp,setSp]=useState<string>("");const[dg,setDg]=useState<string>("");const[dx,setDx]=useState<string>("");
  const dgL=sp?(DG[sp]||[]):[];
  return(<Ov onClose={onClose}><div style={{padding:"20px 22px"}}>
    <h2 style={{fontSize:17,fontWeight:700,marginBottom:18}}>新しい患者を追加</h2>
    <div style={{display:"flex",gap:10,marginBottom:14}}>
      <FI l="病室" v={room} s={setRoom} ph="301" st={{flex:"0 0 72px"}} />
      <div style={{flex:1}}><FI l="患者名・ID" v={name} s={setName} ph="田中A" /><div style={{fontSize:10,color:C.br2,marginTop:3}}>※ 個人特定情報は入力しないでください</div></div>
    </div>
    <div style={{display:"flex",gap:10,marginBottom:14,alignItems:"flex-end"}}>
      <div style={{flex:"0 0 110px"}}><label style={lbl}>年代</label><select value={age} onChange={e=>setAge(e.target.value)} style={sel}><option value="">選択</option>{AGES.map((a:any)=><option key={a} value={a}>{a}</option>)}</select></div>
      <div style={{flex:1}}><label style={lbl}>性別</label>
        <div style={{display:"flex"}}>{[{v:"M",l:"男性 ♂"},{v:"F",l:"女性 ♀"}].map((s:any)=>(<button key={s.v} onClick={()=>setSex(sex===s.v?"":s.v)} style={{flex:1,padding:"10px 0",fontSize:14,fontWeight:500,cursor:"pointer",border:`1.5px solid ${sex===s.v?C.ac:C.br}`,background:sex===s.v?C.acl:C.bg,color:sex===s.v?C.ac:C.m,borderRadius:s.v==="M"?"9px 0 0 9px":"0 9px 9px 0",marginLeft:s.v==="F"?-1.5:0}}>{s.l}</button>))}</div>
      </div>
    </div>
    <div style={{marginBottom:14}}><label style={lbl}>領域 <span style={{fontWeight:400,color:C.br2}}>J-OSLER準拠</span></label><select value={sp} onChange={e=>{setSp(e.target.value);setDg("");setDx("");}} style={sel}><option value="">選択</option>{SP.map((s:any)=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
    {sp&&dgL.length>0&&<div style={{marginBottom:14}}><label style={lbl}>疾患群</label><select value={dg} onChange={e=>{setDg(e.target.value);setDx("");}} style={sel}><option value="">選択</option>{dgL.map((d:any)=><option key={d.id} value={d.id}>{d.name}</option>)}</select></div>}
    {dg&&(()=>{const g=dgL.find((d:any)=>d.id===dg);if(!g)return null;return(<div style={{marginBottom:14}}><label style={lbl}>病名</label><select value={dx} onChange={e=>setDx(e.target.value)} style={sel}><option value="">選択</option>{g.diseases.map((d:any)=><option key={d} value={d}>{d}</option>)}</select><input value={dx} onChange={e=>setDx(e.target.value)} placeholder="または自由入力" style={{...inp,marginTop:6,fontSize:13}} /></div>);})()}
    {!sp&&<FI l="診断名（自由入力）" v={dx} s={setDx} ph="肺炎、心不全" />}
    <div style={{display:"flex",gap:10,marginTop:20}}><button onClick={onClose} style={btnG}>キャンセル</button><button onClick={()=>onAdd({room,name,age,sex,specialty:sp,diseaseGroup:dg,diagnosis:dx})} style={btnP}>追加</button></div>
  </div></Ov>);
}

// ═══ Detail Modal ═══
function DetailModal({p,tasks,cFields,onUpd,onDC,onClose,onTog}:any){
  const[memo,setMemo]=useState(p.memo||"");const[dx,setDx]=useState(p.diagnosis||"");const[admit,setAdmit]=useState(p.admitDate||"");const[cd,setCd]=useState(p.customData||{});
  useEffect(()=>{onUpd({memo,diagnosis:dx,admitDate:admit,customData:cd});},[memo,dx,admit,JSON.stringify(cd)]);
  const done=Object.values(p.tasks).filter(Boolean).length;const total=Object.keys(p.tasks).length;
  const spL=p.specialty?(SP.find((s:any)=>s.id===p.specialty)?.label||""):"";
  const dgL=p.diseaseGroup&&p.specialty?(DG[p.specialty]||[]).find((d:any)=>d.id===p.diseaseGroup)?.name||"":"";
  return(<Ov onClose={onClose}><div style={{padding:"20px 22px",maxHeight:"80vh",overflowY:"auto"}}>
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
      <span style={{fontSize:14,fontWeight:700,color:C.ac,background:C.acl,padding:"4px 10px",borderRadius:6}}>{p.room||"—"}</span>
      <div style={{flex:1}}>
        <div style={{fontSize:16,fontWeight:700}}>{p.name||"(ID未設定)"}{p.age&&<span style={{fontSize:13,fontWeight:400,color:C.m,marginLeft:6}}>{p.age}</span>}{p.sex&&<span style={{fontSize:13,fontWeight:400,color:C.m,marginLeft:4}}>{p.sex==="M"?"♂":"♀"}</span>}</div>
        <div style={{fontSize:12,color:C.m,marginTop:2}}>{spL}{dgL?` › ${dgL}`:""}</div>
      </div>
    </div>
    <div style={{marginBottom:14}}><label style={lbl}>入院日</label><input type="date" value={admit} onChange={e=>setAdmit(e.target.value)} style={inp} /></div>
    <div style={{background:C.s1,borderRadius:8,padding:"10px 14px",marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}><span style={{fontSize:12,color:C.m,fontWeight:500}}>本日の進捗</span><span style={{fontSize:12,color:C.ac,fontWeight:600}}>{done}/{total}</span></div>
      <div style={{width:"100%",height:6,background:C.s2,borderRadius:3,overflow:"hidden"}}><div style={{width:`${total>0?(done/total)*100:0}%`,height:"100%",background:done===total&&total>0?C.ok:C.ac,borderRadius:3,transition:"width .3s"}} /></div>
    </div>
    <div style={{marginBottom:16}}><label style={{...lbl,marginBottom:8}}>タスク</label>
      <div style={{display:"flex",flexDirection:"column",gap:6}}>
        {tasks.map((t:any)=>{const d=p.tasks[t.id];return(
          <button key={t.id} onClick={()=>onTog(t.id)} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",borderRadius:9,border:`1.5px solid ${d?C.ac:C.br}`,background:d?C.acl:C.s0,color:d?C.ac:C.tx,fontSize:14,cursor:"pointer",textAlign:"left",width:"100%"}}>
            <span style={{width:20,height:20,borderRadius:5,border:`2px solid ${d?C.ac:C.br2}`,background:d?C.ac:"transparent",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,flexShrink:0}}>{d&&"✓"}</span>
            <span style={{fontSize:14}}>{t.emoji}</span><span style={{fontWeight:500,textDecoration:d?"line-through":"none",opacity:d?.6:1}}>{t.label}</span>
          </button>
        );})}
      </div>
    </div>
    <FI l="診断名" v={dx} s={setDx} ph="肺炎、心不全" />
    {cFields.length>0&&<div style={{marginTop:14}}><label style={lbl}>カスタム記録項目</label>{cFields.map((f:any)=><div key={f.id} style={{marginBottom:8}}><span style={{fontSize:11,color:C.m}}>{f.label}</span><input value={cd[f.id]||""} onChange={e=>setCd({...cd,[f.id]:e.target.value})} style={{...inp,marginTop:3}} /></div>)}</div>}
    <div style={{marginTop:14}}><label style={lbl}>フリーメモ</label><textarea value={memo} onChange={e=>setMemo(e.target.value)} placeholder="申し送り、注意事項など..." rows={3} style={{width:"100%",padding:"10px 12px",border:`1.5px solid ${C.br}`,borderRadius:9,background:C.bg,fontSize:14,color:C.tx,outline:"none",resize:"vertical",fontFamily:"inherit",lineHeight:1.6,boxSizing:"border-box"}} /></div>
    <div style={{display:"flex",gap:10,marginTop:20}}><button onClick={onClose} style={btnG}>閉じる</button><button onClick={onDC} style={btnP}>🏠 退院</button></div>
  </div></Ov>);
}

// ═══ Log Edit Modal ═══
function LogEditModal({p,cFields,onUpd,onClose}:any){
  const[room,setRoom]=useState(p.room||"");const[name,setName]=useState(p.name||"");const[age,setAge]=useState(p.age||"");const[sex,setSex]=useState(p.sex||"");
  const[dx,setDx]=useState(p.diagnosis||"");const[memo,setMemo]=useState(p.memo||"");const[admit,setAdmit]=useState(p.admitDate||"");const[dc,setDc]=useState(p.dischargeDate||"");const[cd,setCd]=useState(p.customData||{});
  const save=()=>{onUpd({room,name,age,sex,diagnosis:dx,memo,admitDate:admit,dischargeDate:dc,customData:cd});onClose();};
  return(<Ov onClose={onClose}><div style={{padding:"20px 22px",maxHeight:"80vh",overflowY:"auto"}}>
    <h2 style={{fontSize:17,fontWeight:700,marginBottom:16}}>症例ログを編集</h2>
    <div style={{display:"flex",gap:10,marginBottom:14}}>
      <FI l="病室" v={room} s={setRoom} ph="301" st={{flex:"0 0 72px"}} />
      <div style={{flex:1}}><FI l="患者ID" v={name} s={setName} ph="田中A" /><div style={{fontSize:10,color:C.br2,marginTop:2}}>※ 個人特定情報は入力しないでください</div></div>
    </div>
    <div style={{display:"flex",gap:10,marginBottom:14}}>
      <div style={{flex:1}}><label style={lbl}>年代</label><select value={age} onChange={e=>setAge(e.target.value)} style={sel}><option value="">選択</option>{AGES.map((a:any)=><option key={a} value={a}>{a}</option>)}</select></div>
      <div style={{flex:1}}><label style={lbl}>性別</label><div style={{display:"flex"}}>{[{v:"M",l:"♂ 男"},{v:"F",l:"♀ 女"}].map((s:any)=>(<button key={s.v} onClick={()=>setSex(sex===s.v?"":s.v)} style={{flex:1,padding:"10px 0",fontSize:13,fontWeight:500,cursor:"pointer",border:`1.5px solid ${sex===s.v?C.ac:C.br}`,background:sex===s.v?C.acl:C.bg,color:sex===s.v?C.ac:C.m,borderRadius:s.v==="M"?"9px 0 0 9px":"0 9px 9px 0",marginLeft:s.v==="F"?-1.5:0}}>{s.l}</button>))}</div></div>
    </div>
    <FI l="診断名" v={dx} s={setDx} ph="肺炎、心不全" />
    <div style={{display:"flex",gap:10,marginTop:14,marginBottom:14}}>
      <div style={{flex:1}}><label style={lbl}>入院日</label><input type="date" value={admit} onChange={e=>setAdmit(e.target.value)} style={inp} /></div>
      <div style={{flex:1}}><label style={lbl}>退院日</label><input type="date" value={dc} onChange={e=>setDc(e.target.value)} style={inp} /></div>
    </div>
    {cFields.map((f:any)=><div key={f.id} style={{marginBottom:10}}><label style={lbl}>{f.label}</label><input value={cd[f.id]||""} onChange={e=>setCd({...cd,[f.id]:e.target.value})} style={inp} /></div>)}
    <div style={{marginBottom:14}}><label style={lbl}>メモ</label><textarea value={memo} onChange={e=>setMemo(e.target.value)} rows={3} style={{width:"100%",padding:"10px 12px",border:`1.5px solid ${C.br}`,borderRadius:9,background:C.bg,fontSize:14,color:C.tx,outline:"none",resize:"vertical",fontFamily:"inherit",lineHeight:1.6,boxSizing:"border-box"}} /></div>
    <div style={{display:"flex",gap:10}}><button onClick={onClose} style={btnG}>キャンセル</button><button onClick={save} style={btnP}>保存</button></div>
  </div></Ov>);
}

// ═══ DC Confirm ═══
function DCConfirm({p,onOk,onNo}:any){
  if(!p)return null;const sp=p.specialty?(SP.find((s:any)=>s.id===p.specialty)?.short||""):"";
  return(<Ov onClose={onNo}><div style={{padding:"28px 22px",textAlign:"center"}}>
    <div style={{width:64,height:64,borderRadius:"50%",background:"linear-gradient(135deg,#E8F0EC,#d4e8dc)",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:28}}>🏠</div>
    <h2 style={{fontSize:17,fontWeight:700,marginBottom:10}}>退院させますか？</h2>
    <div style={{fontSize:14,fontWeight:600,marginBottom:4}}>{p.room||"—"} {p.name||"(ID未設定)"}{p.age&&<span style={{fontWeight:400,color:C.m,marginLeft:4}}>{p.age}</span>}{p.sex&&<span style={{fontWeight:400,color:C.m,marginLeft:2}}>{p.sex==="M"?"♂":"♀"}</span>}{sp&&<span style={{marginLeft:6,fontSize:11,background:C.s1,padding:"1px 6px",borderRadius:4,fontWeight:400,color:C.m}}>{sp}</span>}</div>
    {p.diagnosis&&<p style={{fontSize:13,color:C.m}}>🔖 {p.diagnosis}</p>}
    <div style={{fontSize:13,color:C.m,margin:"14px 0 22px",lineHeight:1.6,background:C.s1,padding:"12px 14px",borderRadius:8,textAlign:"left"}}>症例ログに記録され、TODOから削除されます。入院日・診断名・メモはログに引き継がれ、あとから編集もできます。</div>
    <div style={{display:"flex",gap:10}}><button onClick={onNo} style={btnG}>キャンセル</button><button onClick={onOk} style={{...btnP,background:`linear-gradient(135deg,${C.ac},${C.ac2})`}}>退院を確定</button></div>
  </div></Ov>);
}

// ═══ Shared ═══
const lbl={fontSize:12,color:C.m,fontWeight:500,display:"block",marginBottom:5};
const inp={width:"100%",padding:"10px 12px",border:`1.5px solid ${C.br}`,borderRadius:9,background:C.bg,fontSize:14,color:C.tx,outline:"none",boxSizing:"border-box"};
const sel={width:"100%",padding:"10px 12px",border:`1.5px solid ${C.br}`,borderRadius:9,background:C.bg,fontSize:14,color:C.tx,outline:"none",appearance:"none",backgroundImage:`url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236B6760' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,backgroundRepeat:"no-repeat",backgroundPosition:"right 12px center",boxSizing:"border-box"};
const btnP={flex:1,padding:13,border:"none",borderRadius:9,background:C.ac,color:"#fff",fontSize:14,fontWeight:600,cursor:"pointer"};
const btnG={flex:1,padding:13,border:`1.5px solid ${C.br}`,borderRadius:9,background:"none",color:C.m,fontSize:14,fontWeight:500,cursor:"pointer"};
function FI({l,v,s,ph,st={}}:any){return(<div style={{marginBottom:0,...st}}><label style={lbl}>{l}</label><input value={v} onChange={e=>s(e.target.value)} placeholder={ph} style={inp} /></div>);}
function Ov({onClose,children}:any){return(<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.35)",zIndex:100,display:"flex",alignItems:"flex-end",justifyContent:"center"}}><div onClick={e=>e.stopPropagation()} style={{background:C.s0,borderRadius:"16px 16px 0 0",width:"100%",maxWidth:520,maxHeight:"85vh",overflowY:"auto",animation:"su .25s ease-out"}}><div style={{display:"flex",justifyContent:"center",paddingTop:10,paddingBottom:4}}><div style={{width:36,height:4,background:C.br2,borderRadius:2}} /></div>{children}</div><style>{`@keyframes su{from{transform:translateY(100%)}to{transform:translateY(0)}}`}</style></div>);}

// ═══ Onboarding Tutorial ═══
const TUTORIAL_STEPS = [
  {
    emoji: "➕",
    title: "症例を追加しよう",
    desc: "右下の＋ボタンから入院患者を追加します。病室・年代・性別・診断名を入力するだけ。J-OSLER準拠の領域・疾患群も選択できます。",
  },
  {
    emoji: "✅",
    title: "毎日のTODOを管理",
    desc: "患者カードのタスクボタン（書類📄・処方💊・注射💉など）をタップして完了。タスクは毎日自動リセットされます。項目は自由にカスタマイズ可能。",
  },
  {
    emoji: "📝",
    title: "メモ・記録を残す",
    desc: "患者カードをタップすると詳細画面が開きます。日々のメモ、カスタム記録項目（術式・主治医など）を自由に追加できます。",
  },
  {
    emoji: "🏠",
    title: "退院 → 自動アーカイブ",
    desc: "退院ボタンを押すと、その患者は「症例ログ」に自動アーカイブ。入院中の患者だけがTODO画面に表示されます。",
  },
  {
    emoji: "📊",
    title: "症例ログを活用",
    desc: "症例ログタブでは、今までの全症例を検索・領域別統計で確認できます。CSV出力でEPOC・J-OSLER・臨床研究・症例発表に活用できます。",
  },
];

function Tutorial({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const s = TUTORIAL_STEPS[step];
  const isLast = step === TUTORIAL_STEPS.length - 1;

  return (
    <div onClick={onClose} style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", zIndex: 200,
      display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: C.s0, borderRadius: 20, width: "100%", maxWidth: 400,
        padding: "32px 28px 24px", textAlign: "center", position: "relative",
        animation: "su .3s ease-out",
      }}>
        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 6, marginBottom: 20 }}>
          {TUTORIAL_STEPS.map((_, i) => (
            <div key={i} style={{
              width: i === step ? 20 : 8, height: 8, borderRadius: 4,
              background: i === step ? C.ac : C.s2, transition: "all .3s",
            }} />
          ))}
        </div>

        {/* Icon */}
        <div style={{
          width: 64, height: 64, borderRadius: 16, background: C.acl,
          border: `2px solid ${C.ac}30`, display: "flex", alignItems: "center",
          justifyContent: "center", margin: "0 auto 16px", fontSize: 28,
        }}>
          {s.emoji}
        </div>

        {/* Content */}
        <h3 style={{ fontSize: 18, fontWeight: 700, color: C.tx, marginBottom: 8 }}>{s.title}</h3>
        <p style={{ fontSize: 13, color: C.m, lineHeight: 1.7, marginBottom: 24 }}>{s.desc}</p>

        {/* Step counter */}
        <p style={{ fontSize: 11, color: C.br2, marginBottom: 16 }}>
          {step + 1} / {TUTORIAL_STEPS.length}
        </p>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "12px 0", border: `1.5px solid ${C.br}`, borderRadius: 12,
            background: "none", color: C.m, fontSize: 13, fontWeight: 500, cursor: "pointer",
          }}>
            スキップ
          </button>
          <button onClick={() => isLast ? onClose() : setStep(step + 1)} style={{
            flex: 2, padding: "12px 0", border: "none", borderRadius: 12,
            background: C.ac, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer",
          }}>
            {isLast ? "はじめる 🚀" : "次へ →"}
          </button>
        </div>
      </div>
    </div>
  );
}
