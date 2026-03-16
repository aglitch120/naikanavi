interface Props { activeRegion: string | null; selectedFindings?: Set<string> }
const fMap: Record<string,string[]> = {
  trachea_shift_r:['tr'],trachea_shift_l:['tr'],trachea_narrow:['tr'],rib_fracture:['ri'],vertebral_compression:['sp'],subcutaneous_emphysema:['so'],lytic_lesion:['ri'],
  cardiomegaly:['he'],mediastinal_wide:['me'],aortic_knob:['ao'],pericardial_effusion:['he'],
  cp_blunting:['cp'],diaphragm_elevated_r:['dr'],diaphragm_elevated_l:['dl'],free_air:['dr'],diaphragm_flat:['dl','dr'],
  consolidation:['rl'],ggo:['lm','rm'],nodule:['ru'],mass:['lu'],pneumothorax:['ra'],pleural_effusion:['cp'],atelectasis:['rl'],
  bilateral_infiltrates:['lm','rm','ll','rl'],reticular:['ll','rl'],cavity:['ru'],
}
const rMap: Record<string,string[]> = {A:['tr'],B:['ri','sp','cl','so','sc'],C:['he','me','ao'],D:['dl','dr','cp'],E:['lu','lm','ll','ru','rm','rl','ra']}

export default function ChestXraySVG({ activeRegion, selectedFindings = new Set() }: Props) {
  const aa = new Set(activeRegion ? rMap[activeRegion]||[] : [])
  const ab = new Set<string>(); selectedFindings.forEach(f => fMap[f]?.forEach(a => ab.add(a)))

  // style helpers
  const fill = (id: string) => {
    const a=aa.has(id),b=ab.has(id)
    if(b&&a) return {fill:'#EF4444',opacity:0.45,stroke:'#DC2626',strokeWidth:2}
    if(b) return {fill:'#F87171',opacity:0.25,stroke:'#EF4444',strokeWidth:1.5}
    if(a) return {fill:'#3B82F6',opacity:0.25,stroke:'#2563EB',strokeWidth:1.5}
    return {fill:'transparent',opacity:1,stroke:'none',strokeWidth:0}
  }
  const bone = (id: string) => {
    const a=aa.has(id),b=ab.has(id)
    return {stroke:b?'#F87171':a?'#93C5FD':'#6B7280',strokeWidth:b?2.5:a?2:1.2,opacity:b?0.9:a?0.8:0.35,fill:'none'}
  }

  // base anatomical colors (dark X-ray style)
  const bg = '#0f0f1a'
  const lungC = '#1a1f2e'     // dark lung field
  const medC = '#2a2a3a'      // slightly brighter mediastinum
  const boneC = '#6B7280'     // bone color
  const heartC = '#252535'    // heart silhouette

  return (
    <svg viewBox="0 0 500 560" className="w-full max-w-[340px] mx-auto">
      {/* Film background */}
      <rect x="0" y="0" width="500" height="560" rx="8" fill="#000"/>
      <rect x="8" y="8" width="484" height="544" rx="6" fill={bg}/>

      {/* ── Soft tissue outline (shoulders + thorax) ── */}
      <path d={`
        M90,60 Q60,65 40,90 Q25,120 30,160 L35,200
        Q38,280 50,340 Q60,390 80,420 L130,440
        Q170,455 250,460 Q330,455 370,440 L420,420
        Q440,390 450,340 Q462,280 465,200 L470,160
        Q475,120 460,90 Q440,65 410,60
        Q380,50 340,48 L310,50 Q270,40 250,38
        Q230,40 190,50 L160,48 Q120,50 90,60Z
      `} fill="#181825" stroke="#333" strokeWidth="0.5" opacity="0.6"/>

      {/* ── Lung fields (base - always visible) ── */}
      {/* Right lung (viewer's left) */}
      <path d={`
        M120,100 Q105,115 95,145 Q82,190 80,240
        Q78,290 85,340 Q92,370 110,395 Q130,410 155,415
        L185,415 Q195,412 200,405 L205,260 L205,130
        Q195,110 180,100 Q155,88 120,100Z
      `} fill={lungC} stroke="#2a3040" strokeWidth="0.5"/>
      {/* Left lung (viewer's right) */}
      <path d={`
        M380,100 Q395,115 405,145 Q418,190 420,240
        Q422,290 415,340 Q408,375 390,400 Q370,415 345,420
        L315,420 Q300,418 290,410 Q280,395 275,375
        L270,310 L295,280 L295,130
        Q305,110 320,100 Q345,88 380,100Z
      `} fill={lungC} stroke="#2a3040" strokeWidth="0.5"/>

      {/* Lung field highlight overlays */}
      {/* Right upper */}
      <path d="M120,100 Q105,115 95,145 Q88,175 85,200 L205,200 L205,130 Q195,110 180,100 Q155,88 120,100Z" {...fill('ru')}/>
      {/* Right middle */}
      <path d="M85,205 Q82,240 80,270 L205,270 L205,205Z" {...fill('rm')}/>
      {/* Right lower */}
      <path d="M80,275 Q78,310 85,345 Q92,370 110,395 Q130,410 155,415 L185,415 Q195,412 200,405 L205,275Z" {...fill('rl')}/>
      {/* Right apex */}
      <ellipse cx="155" cy="85" rx="40" ry="18" {...fill('ra')}/>
      {/* Left upper */}
      <path d="M380,100 Q395,115 405,145 Q412,175 415,200 L295,200 L295,130 Q305,110 320,100 Q345,88 380,100Z" {...fill('lu')}/>
      {/* Left middle */}
      <path d="M415,205 Q418,240 420,270 L295,270 L295,205Z" {...fill('lm')}/>
      {/* Left lower */}
      <path d="M420,275 Q422,310 415,345 Q408,375 390,400 Q370,415 345,420 L315,420 Q300,418 290,410 Q280,395 275,375 L270,310 L295,275Z" {...fill('ll')}/>

      {/* ── Mediastinum ── */}
      <path d={`M205,70 L205,405 Q220,415 250,420 Q265,418 280,410 L295,70Z`}
        fill={aa.has('me')?'#3B82F6':ab.has('me')?'#F87171':medC}
        stroke={aa.has('me')?'#2563EB':ab.has('me')?'#DC2626':'#3a3a4a'}
        strokeWidth={aa.has('me')||ab.has('me')?1.5:0.5}
        opacity={aa.has('me')||ab.has('me')?0.4:1}/>

      {/* ── Heart silhouette ── */}
      <path d={`
        M205,230 Q200,250 195,275
        Q190,300 185,320 Q178,345 175,360
        Q172,375 175,385 Q185,405 210,415
        Q240,425 270,420 Q295,410 310,390
        Q320,370 315,340 Q310,310 300,290
        Q295,275 295,260 L295,230Z
      `} fill={aa.has('he')?'#3B82F6':ab.has('he')?'#F87171':heartC}
        stroke={aa.has('he')?'#2563EB':ab.has('he')?'#DC2626':'#3a3a4a'}
        strokeWidth={aa.has('he')||ab.has('he')?1.5:0.8}
        opacity={aa.has('he')||ab.has('he')?0.35:1}/>
      {aa.has('he')&&<>
        <line x1="175" y1="360" x2="315" y2="360" stroke="#60A5FA" strokeWidth="1" strokeDasharray="4,3" opacity="0.7"/>
        <line x1="80" y1="360" x2="420" y2="360" stroke="#60A5FA" strokeWidth="0.5" strokeDasharray="2,4" opacity="0.3"/>
        <text x="82" y="355" fill="#93C5FD" fontSize="9" fontWeight="bold">CTR測定</text>
      </>}

      {/* ── Aortic arch ── */}
      <path d={`M240,80 Q238,60 250,52 Q270,44 290,52 Q310,62 315,85 Q318,100 315,120`}
        fill="none" stroke={aa.has('ao')?'#60A5FA':ab.has('ao')?'#F87171':'#4a4a5a'}
        strokeWidth={aa.has('ao')?3:ab.has('ao')?2.5:1.5} opacity={aa.has('ao')||ab.has('ao')?0.8:0.5}/>
      {/* Descending aorta hint */}
      <path d="M295,120 Q290,180 285,230" fill="none" stroke="#4a4a5a" strokeWidth="1" opacity="0.3"/>

      {/* ── Trachea ── */}
      <path d={`M240,30 L240,110 Q240,118 235,120 L220,130`} fill="none"
        stroke={aa.has('tr')?'#60A5FA':ab.has('tr')?'#F87171':'#555'}
        strokeWidth={aa.has('tr')?2.5:1.5} opacity={aa.has('tr')||ab.has('tr')?0.8:0.4}/>
      <path d={`M260,30 L260,110 Q260,118 265,120 L280,130`} fill="none"
        stroke={aa.has('tr')?'#60A5FA':ab.has('tr')?'#F87171':'#555'}
        strokeWidth={aa.has('tr')?2.5:1.5} opacity={aa.has('tr')||ab.has('tr')?0.8:0.4}/>
      {/* Carina */}
      <circle cx="250" cy="118" r="2"
        fill={aa.has('tr')?'#60A5FA':'#555'} opacity={aa.has('tr')?0.8:0.3}/>

      {/* ── Clavicles (S-shaped) ── */}
      <path d="M200,82 Q175,78 150,82 Q125,88 110,95 Q95,102 82,108" {...bone('cl')}/>
      <path d="M300,82 Q325,78 350,82 Q375,88 390,95 Q405,102 418,108" {...bone('cl')}/>

      {/* ── Scapulae (lateral borders) ── */}
      <path d="M72,120 Q65,160 62,200 Q60,250 65,300 Q68,330 75,350" {...bone('sc')} strokeWidth={aa.has('sc')?1.8:0.8}/>
      <path d="M428,120 Q435,160 438,200 Q440,250 435,300 Q432,330 425,350" {...bone('sc')} strokeWidth={aa.has('sc')?1.8:0.8}/>

      {/* ── Ribs (anatomically curved, 10 pairs visible) ── */}
      {/* Right posterior ribs */}
      {[
        "M205,105 Q175,108 145,118 Q115,130 90,148",
        "M205,130 Q170,135 140,148 Q110,162 85,180",
        "M205,158 Q168,165 135,180 Q105,198 82,218",
        "M205,188 Q165,198 132,215 Q100,235 80,255",
        "M205,220 Q162,232 128,252 Q98,272 80,292",
        "M205,252 Q160,266 125,288 Q98,308 82,328",
        "M205,285 Q158,300 122,325 Q100,345 88,365",
        "M205,320 Q160,338 130,358 Q108,375 95,390",
        "M205,355 Q165,370 140,388 Q120,400 110,408",
        "M205,385 Q172,395 150,408 Q135,415 125,418",
      ].map((d,i) => <path key={`rr${i}`} d={d} {...bone('ri')}/>)}
      {/* Left posterior ribs */}
      {[
        "M295,105 Q325,108 355,118 Q385,130 410,148",
        "M295,130 Q330,135 360,148 Q390,162 415,180",
        "M295,158 Q332,165 365,180 Q395,198 418,218",
        "M295,188 Q335,198 368,215 Q400,235 420,255",
        "M295,220 Q338,232 372,252 Q402,272 420,292",
        "M295,252 Q340,266 375,288 Q402,308 418,328",
        "M295,285 Q342,300 378,325 Q400,345 412,365",
        "M295,320 Q340,338 370,358 Q392,375 405,390",
        "M295,355 Q335,370 360,388 Q380,400 390,408",
        "M295,385 Q328,395 350,408 Q365,415 375,418",
      ].map((d,i) => <path key={`lr${i}`} d={d} {...bone('ri')}/>)}

      {/* ── Spine (vertebral bodies through mediastinum) ── */}
      {[100,130,160,190,220,250,280,310,340,370,400].map((y,i) => (
        <rect key={`vb${i}`} x="243" y={y} width="14" height="22" rx="3"
          fill="none" stroke={aa.has('sp')?'#93C5FD':ab.has('sp')?'#F87171':'#3a3a4a'}
          strokeWidth={aa.has('sp')||ab.has('sp')?1.2:0.5}
          opacity={aa.has('sp')||ab.has('sp')?0.7:0.2}/>
      ))}

      {/* ── Soft tissue overlay ── */}
      <rect x="35" y="90" width="30" height="300" rx="8"
        fill={aa.has('so')?'#3B82F6':ab.has('so')?'#F87171':'transparent'}
        opacity={aa.has('so')||ab.has('so')?0.15:0} stroke="none"/>
      <rect x="435" y="90" width="30" height="300" rx="8"
        fill={aa.has('so')?'#3B82F6':ab.has('so')?'#F87171':'transparent'}
        opacity={aa.has('so')||ab.has('so')?0.15:0} stroke="none"/>

      {/* ── Diaphragm ── */}
      <path d={`M85,370 Q110,355 145,350 Q175,348 200,365 L205,400`}
        fill="none" stroke={aa.has('dr')?'#60A5FA':ab.has('dr')?'#F87171':'#5a5a6a'}
        strokeWidth={aa.has('dr')?2.5:1.5} opacity={aa.has('dr')||ab.has('dr')?0.8:0.5}/>
      <path d={`M295,410 Q320,395 345,388 Q375,385 400,395 Q415,405 420,415`}
        fill="none" stroke={aa.has('dl')?'#60A5FA':ab.has('dl')?'#F87171':'#5a5a6a'}
        strokeWidth={aa.has('dl')?2.5:1.5} opacity={aa.has('dl')||ab.has('dl')?0.8:0.5}/>

      {/* ── CP angles ── */}
      <circle cx="86" cy="372" r="12" {...fill('cp')}/>
      <circle cx="418" cy="418" r="12" {...fill('cp')}/>

      {/* ── Region labels (only when active) ── */}
      {activeRegion==='A'&&<><text x="280" y="75" fill="#93C5FD" fontSize="12" fontWeight="bold">A: Airway</text><text x="280" y="90" fill="#93C5FD" fontSize="9">気管・気管支</text></>}
      {activeRegion==='B'&&<><text x="30" y="50" fill="#93C5FD" fontSize="12" fontWeight="bold">B: Bones</text><text x="30" y="63" fill="#93C5FD" fontSize="9">肋骨・鎖骨・脊椎</text></>}
      {activeRegion==='C'&&<><text x="340" y="280" fill="#93C5FD" fontSize="12" fontWeight="bold">C: Cardiac</text><text x="340" y="295" fill="#93C5FD" fontSize="9">心陰影・縦隔・大動脈</text></>}
      {activeRegion==='D'&&<><text x="130" y="450" fill="#93C5FD" fontSize="12" fontWeight="bold">D: Diaphragm</text><text x="130" y="463" fill="#93C5FD" fontSize="9">横隔膜・CP angle</text></>}
      {activeRegion==='E'&&<><text x="30" y="180" fill="#93C5FD" fontSize="12" fontWeight="bold">E: Lung fields</text><text x="30" y="193" fill="#93C5FD" fontSize="9">肺野・胸膜</text></>}

      {/* ── Direction markers ── */}
      <text x="20" y="28" fill="#9CA3AF" fontSize="14" fontWeight="bold">R</text>
      <text x="468" y="28" fill="#9CA3AF" fontSize="14" fontWeight="bold">L</text>
    </svg>
  )
}
