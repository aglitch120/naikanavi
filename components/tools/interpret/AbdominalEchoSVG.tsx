interface Props { activeOrgan: string|null; abnormalOrgans?: Set<string> }
const org: Record<string,{label:string;lx:number;ly:number}> = {
  liver:{label:'肝臓',lx:120,ly:115},gb:{label:'胆嚢',lx:178,ly:178},kidney_r:{label:'右腎',lx:85,ly:248},kidney_l:{label:'左腎',lx:280,ly:248},
  spleen:{label:'脾臓',lx:310,ly:115},pancreas:{label:'膵臓',lx:195,ly:208},aorta:{label:'大動脈',lx:195,ly:283},bladder:{label:'膀胱',lx:195,ly:365},
}
export default function AbdominalEchoSVG({ activeOrgan, abnormalOrgans=new Set() }: Props) {
  const s=(k:string)=>{const a=activeOrgan===k,b=abnormalOrgans.has(k);if(b&&a)return{fill:'#EF4444',fillOpacity:0.45,stroke:'#DC2626',strokeWidth:2.5};if(b)return{fill:'#F87171',fillOpacity:0.25,stroke:'#EF4444',strokeWidth:1.5};if(a)return{fill:'#3B82F6',fillOpacity:0.35,stroke:'#2563EB',strokeWidth:2.5};return{fill:'#6B7280',fillOpacity:0.08,stroke:'#4B5563',strokeWidth:0.8}}
  const lc=(k:string)=>activeOrgan===k?'#2563EB':abnormalOrgans.has(k)?'#DC2626':'#6B7280'
  return (
    <svg viewBox="0 0 400 420" className="w-full max-w-[320px] mx-auto">
      <rect x="5" y="5" width="390" height="410" rx="12" fill="#0c0c1a"/><rect x="10" y="10" width="380" height="400" rx="10" fill="#111827"/>
      <ellipse cx="200" cy="210" rx="170" ry="190" fill="none" stroke="#334155" strokeWidth="1" opacity="0.3"/>
      <path d="M80,80 Q70,90 65,120 Q62,150 75,170 Q100,185 160,180 Q200,175 230,150 Q245,130 240,110 Q235,90 220,80 Q180,65 130,70Z" {...s('liver')}/>
      <ellipse cx="178" cy="188" rx="14" ry="22" transform="rotate(-15,178,188)" {...s('gb')}/>
      <ellipse cx="320" cy="120" rx="40" ry="28" transform="rotate(-30,320,120)" {...s('spleen')}/>
      <path d="M130,200 Q150,190 200,192 Q250,190 280,200 Q290,210 280,218 Q250,225 200,222 Q150,225 130,218 Q120,210 130,200Z" {...s('pancreas')}/>
      <ellipse cx="90" cy="250" rx="28" ry="45" transform="rotate(10,90,250)" {...s('kidney_r')}/>
      <ellipse cx="90" cy="250" rx="8" ry="15" transform="rotate(10,90,250)" fill={activeOrgan==='kidney_r'?'#1D4ED8':'#374151'} fillOpacity="0.3" stroke="none"/>
      <ellipse cx="310" cy="250" rx="28" ry="45" transform="rotate(-10,310,250)" {...s('kidney_l')}/>
      <ellipse cx="310" cy="250" rx="8" ry="15" transform="rotate(-10,310,250)" fill={activeOrgan==='kidney_l'?'#1D4ED8':'#374151'} fillOpacity="0.3" stroke="none"/>
      <rect x="188" y="230" width="14" height="100" rx="7" {...s('aorta')}/><ellipse cx="200" cy="365" rx="35" ry="25" {...s('bladder')}/>
      {Object.entries(org).map(([k,o])=><text key={k} x={o.lx} y={o.ly} fill={lc(k)} fontSize={activeOrgan===k?11:9} fontWeight={activeOrgan===k?'bold':'normal'} textAnchor="middle" opacity={activeOrgan===k||abnormalOrgans.has(k)?1:0.5}>{o.label}</text>)}
      {activeOrgan&&org[activeOrgan]&&<text x="200" y="398" fill="#60A5FA" fontSize="10" fontWeight="bold" textAnchor="middle">▸ {org[activeOrgan].label} 評価中</text>}
      <text x="25" y="30" fill="#9CA3AF" fontSize="10">R</text><text x="370" y="30" fill="#9CA3AF" fontSize="10">L</text>
    </svg>
  )
}
