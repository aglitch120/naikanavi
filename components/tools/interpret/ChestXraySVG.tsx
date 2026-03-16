interface Props { activeRegion: string | null; selectedFindings?: Set<string> }
const fMap: Record<string,string[]> = {
  trachea_shift_r:['tr'],trachea_shift_l:['tr'],trachea_narrow:['tr'],rib_fracture:['ri'],vertebral_compression:['sp'],subcutaneous_emphysema:['so'],lytic_lesion:['ri'],
  cardiomegaly:['he'],mediastinal_wide:['me'],aortic_knob:['ao'],pericardial_effusion:['he'],
  cp_blunting:['cp'],diaphragm_elevated_r:['dr'],diaphragm_elevated_l:['dl'],free_air:['dr'],diaphragm_flat:['dl','dr'],
  consolidation:['rl'],ggo:['lm','rm'],nodule:['ru'],mass:['lu'],pneumothorax:['ra'],pleural_effusion:['cp'],atelectasis:['rl'],
  bilateral_infiltrates:['lm','rm','ll','rl'],reticular:['ll','rl'],cavity:['ru'],
}
const rMap: Record<string,string[]> = {A:['tr'],B:['ri','sp','cl','so'],C:['he','me','ao'],D:['dl','dr','cp'],E:['lu','lm','ll','ru','rm','rl','ra']}
export default function ChestXraySVG({ activeRegion, selectedFindings = new Set() }: Props) {
  const aa = new Set(activeRegion ? rMap[activeRegion]||[] : [])
  const ab = new Set<string>(); selectedFindings.forEach(f => fMap[f]?.forEach(a => ab.add(a)))
  const g = (id: string) => {
    const a=aa.has(id),b=ab.has(id)
    if(b&&a) return {fill:'#EF4444',opacity:0.5,stroke:'#DC2626',strokeWidth:2}
    if(b) return {fill:'#F87171',opacity:0.3,stroke:'#EF4444',strokeWidth:1.5}
    if(a) return {fill:'#3B82F6',opacity:0.3,stroke:'#2563EB',strokeWidth:2}
    return {fill:'#1a1a2e',opacity:0.05,stroke:'#334155',strokeWidth:0.5}
  }
  const ls = (id: string) => ({stroke:aa.has(id)?'#60A5FA':'#475569',strokeWidth:aa.has(id)?2:1,opacity:aa.has(id)?0.7:0.25})
  return (
    <svg viewBox="0 0 400 480" className="w-full max-w-[320px] mx-auto">
      <rect x="10" y="10" width="380" height="460" rx="12" fill="#0a0a1a"/><rect x="15" y="15" width="370" height="450" rx="10" fill="#111827"/>
      <path d="M110,80 Q100,100 95,140 Q90,200 95,280 Q100,320 130,380 L270,380 Q300,320 305,280 Q310,200 305,140 Q300,100 290,80Z" fill="none" stroke="#475569" strokeWidth="1" opacity="0.5"/>
      <rect x="190" y="40" width="20" height="100" rx="8" {...g('tr')}/>
      {aa.has('tr')&&<text x="230" y="85" fill="#93C5FD" fontSize="10" fontWeight="bold">気管</text>}
      <line x1="120" y1="95" x2="188" y2="85" strokeLinecap="round" {...ls('cl')}/><line x1="212" y1="85" x2="280" y2="95" strokeLinecap="round" {...ls('cl')}/>
      {[130,160,195,230,265,300,335].map((y,i)=><g key={i}><path d={`M${195-i*2},${y} Q${150-i*3},${y+10} ${100+i*2},${y+20}`} fill="none" {...ls('ri')}/><path d={`M${205+i*2},${y} Q${250+i*3},${y+10} ${300-i*2},${y+20}`} fill="none" {...ls('ri')}/></g>)}
      <rect x="193" y="140" width="14" height="230" rx="4" {...g('sp')}/><rect x="70" y="90" width="25" height="280" rx="6" {...g('so')}/><rect x="305" y="90" width="25" height="280" rx="6" {...g('so')}/>
      <path d="M120,100 Q100,120 100,160 L190,160 L190,100 Q160,90 120,100Z" {...g('ru')}/><path d="M100,165 Q95,210 100,260 L190,260 L190,165Z" {...g('rm')}/>
      <path d="M100,265 Q105,320 130,370 L190,370 L190,265Z" {...g('rl')}/><ellipse cx="155" cy="78" rx="35" ry="15" {...g('ra')}/>
      <path d="M210,100 L210,160 L300,160 Q300,120 280,100 Q250,90 210,100Z" {...g('lu')}/><path d="M210,165 L210,260 L300,260 Q305,210 300,165Z" {...g('lm')}/>
      <path d="M210,265 L210,370 L270,370 Q295,320 300,265Z" {...g('ll')}/>
      <path d="M195,55 Q195,35 220,35 Q260,35 270,70 Q275,90 270,110" fill="none" stroke={aa.has('ao')?'#2563EB':'#334155'} strokeWidth={aa.has('ao')?4:2} opacity={aa.has('ao')?0.8:0.3}/>
      <rect x="175" y="100" width="50" height="140" rx="8" {...g('me')}/><ellipse cx="215" cy="300" rx="75" ry="65" {...g('he')}/>
      {aa.has('he')&&<><line x1="140" y1="300" x2="290" y2="300" stroke="#60A5FA" strokeWidth="0.8" strokeDasharray="4,3" opacity="0.6"/><text x="145" y="295" fill="#93C5FD" fontSize="8">CTR</text></>}
      <path d="M100,360 Q140,380 190,370" fill="none" stroke={aa.has('dr')?'#2563EB':'#334155'} strokeWidth={aa.has('dr')?3:1.5} opacity={aa.has('dr')?0.8:0.4}/>
      <path d="M210,375 Q260,385 300,365" fill="none" stroke={aa.has('dl')?'#2563EB':'#334155'} strokeWidth={aa.has('dl')?3:1.5} opacity={aa.has('dl')?0.8:0.4}/>
      <circle cx="102" cy="362" r="10" {...g('cp')}/><circle cx="298" cy="367" r="10" {...g('cp')}/>
      {activeRegion==='A'&&<text x="230" y="60" fill="#93C5FD" fontSize="11" fontWeight="bold">A: Airway</text>}
      {activeRegion==='B'&&<text x="40" y="200" fill="#93C5FD" fontSize="11" fontWeight="bold">B: Bones</text>}
      {activeRegion==='C'&&<text x="260" y="260" fill="#93C5FD" fontSize="11" fontWeight="bold">C: Cardiac</text>}
      {activeRegion==='D'&&<text x="130" y="420" fill="#93C5FD" fontSize="11" fontWeight="bold">D: Diaphragm</text>}
      {activeRegion==='E'&&<text x="50" y="200" fill="#93C5FD" fontSize="11" fontWeight="bold">E: Lung fields</text>}
      <text x="30" y="35" fill="#9CA3AF" fontSize="14" fontWeight="bold">R</text><text x="360" y="35" fill="#9CA3AF" fontSize="14" fontWeight="bold">L</text>
    </svg>
  )
}
