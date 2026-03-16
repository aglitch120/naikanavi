interface Props { activeStep: string|null; stState?: string; tState?: string; qrsState?: string; prState?: string }
export default function ECGSVG({ activeStep, stState='none', tState='normal', qrsState='narrow', prState='normal' }: Props) {
  const by=120, stY=stState==='elevation'?-25:stState==='depression'?15:0, qW=qrsState==='wide'?28:14
  const prX=prState==='prolonged_constant'||prState==='prolonged_progressive'?20:prState==='short'?-8:0
  const sm: Record<string,string[]> = {rate:['p','q','st','t','bl'],rhythm:['bl'],pWave:['p'],prInterval:['pr'],qrsWidth:['q'],axis:['q'],stChange:['st'],tWave:['t'],qtc:['q','st','t']}
  const act=activeStep?sm[activeStep]||[]:[], c=(s:string)=>act.includes(s)?'#3B82F6':'#22D3EE', o=(s:string)=>act.includes(s)?1:0.35
  const pS=60,pE=90,qS=pE+20+prX,qE=qS+qW,sE=qE+25,tE=sE+24
  const tP=tState==='inverted'?`Q${sE+12},${by+25} ${tE},${by}`:tState==='peaked'?`Q${sE+10},${by-50} ${tE},${by}`:tState==='flattened'?`Q${sE+12},${by-3} ${tE},${by}`:`Q${sE+12},${by-30} ${tE},${by}`
  return (
    <svg viewBox="0 0 400 200" className="w-full max-w-[400px] mx-auto">
      <rect width="400" height="200" fill="#FFF5F5" rx="8"/>
      {Array.from({length:21},(_,i)=><line key={`v${i}`} x1={i*20} y1="0" x2={i*20} y2="200" stroke="#FECACA" strokeWidth="0.5"/>)}
      {Array.from({length:11},(_,i)=><line key={`h${i}`} x1="0" y1={i*20} x2="400" y2={i*20} stroke="#FECACA" strokeWidth="0.5"/>)}
      <line x1="0" y1={by} x2="400" y2={by} stroke="#F87171" strokeWidth="0.5" strokeDasharray="2,4" opacity="0.3"/>
      <line x1="30" y1={by} x2={pS} y2={by} stroke={c('bl')} strokeWidth="2" opacity={o('bl')}/>
      <path d={`M${pS},${by} Q${pS+15},${by-18} ${pE},${by}`} fill="none" stroke={c('p')} strokeWidth={activeStep==='pWave'?3:2} opacity={o('p')}/>
      <line x1={pE} y1={by} x2={qS} y2={by} stroke={c('pr')} strokeWidth={activeStep==='prInterval'?3:2} opacity={o('pr')}/>
      <polyline points={`${qS},${by} ${qS+qW*.15},${by+8} ${qS+qW*.3},${by-65} ${qS+qW*.55},${by+20} ${qE},${by+stY}`} fill="none" stroke={c('q')} strokeWidth={activeStep==='qrsWidth'||activeStep==='axis'?3:2} opacity={o('q')} strokeLinejoin="round"/>
      <line x1={qE} y1={by+stY} x2={sE} y2={by+stY} stroke={c('st')} strokeWidth={activeStep==='stChange'?3:2} opacity={o('st')}/>
      {stState==='elevation'&&activeStep==='stChange'&&<><line x1={qE} y1={by} x2={qE} y2={by+stY} stroke="#EF4444" strokeWidth="1" strokeDasharray="2,2" opacity="0.6"/><text x={qE-30} y={by+stY-5} fill="#EF4444" fontSize="8" fontWeight="bold">ST↑</text></>}
      {stState==='depression'&&activeStep==='stChange'&&<><line x1={qE} y1={by} x2={qE} y2={by+stY} stroke="#EF4444" strokeWidth="1" strokeDasharray="2,2" opacity="0.6"/><text x={qE-30} y={by+stY+12} fill="#EF4444" fontSize="8" fontWeight="bold">ST↓</text></>}
      <path d={`M${sE},${by+stY} ${tP}`} fill="none" stroke={c('t')} strokeWidth={activeStep==='tWave'?3:2} opacity={o('t')}/>
      <line x1={tE} y1={by} x2="380" y2={by} stroke={c('bl')} strokeWidth="2" opacity={o('bl')}/>
      {activeStep==='pWave'&&<text x={pS+5} y={by-25} fill="#2563EB" fontSize="10" fontWeight="bold">P波</text>}
      {activeStep==='prInterval'&&<><line x1={pS} y1={by+12} x2={qS} y2={by+12} stroke="#3B82F6" strokeWidth="1.5"/><text x={pS+5} y={by+25} fill="#2563EB" fontSize="9" fontWeight="bold">PR間隔</text></>}
      {(activeStep==='qrsWidth'||activeStep==='axis')&&<><line x1={qS} y1={by+30} x2={qE} y2={by+30} stroke="#3B82F6" strokeWidth="1.5"/><text x={qS} y={by+42} fill="#2563EB" fontSize="9" fontWeight="bold">QRS{qrsState==='wide'?' ≧120ms':''}</text></>}
      {activeStep==='stChange'&&<text x={qE-5} y={by-40} fill="#2563EB" fontSize="10" fontWeight="bold">ST{stState==='elevation'?'上昇':stState==='depression'?'低下':'セグメント'}</text>}
      {activeStep==='tWave'&&<text x={sE+5} y={by-38} fill="#2563EB" fontSize="10" fontWeight="bold">T波{tState==='inverted'?'(陰転)':tState==='peaked'?'(テント状)':''}</text>}
      {activeStep==='qtc'&&<><line x1={qS} y1={by+35} x2={tE} y2={by+35} stroke="#3B82F6" strokeWidth="1.5"/><text x={qS+10} y={by+48} fill="#2563EB" fontSize="9" fontWeight="bold">QT間隔</text></>}
      {activeStep==='rhythm'&&<text x="140" y="16" fill="#2563EB" fontSize="10" fontWeight="bold">RR間隔の整・不整を評価</text>}
      {activeStep==='rate'&&<text x="10" y="18" fill="#2563EB" fontSize="10" fontWeight="bold">心拍数評価</text>}
    </svg>
  )
}
