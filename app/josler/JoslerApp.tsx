// @ts-nocheck
'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { SPECIALTIES as SP, DISEASE_GROUPS as DG } from '@/lib/josler-data'
import { useProStatus } from '@/components/pro/useProStatus'
import ProModal from '@/components/pro/ProModal'
import FavoriteButton from '@/components/tools/FavoriteButton'
import {
  loadJoslerData, saveJoslerData, saveToLocal,
  startAutoSave, stopAutoSave, setStatusCallback,
  type JoslerData, type SaveStatus,
  type RecordMode, loadRecordMode, saveRecordMode,
  loadEpocData, saveEpocToLocal, saveEpocToCloud,
} from '@/lib/josler-storage'
import {
  EPOC_SYMPTOMS, EPOC_DISEASES, EPOC_PROCEDURES,
  SYMPTOM_CATEGORIES, DISEASE_CATEGORIES, PROCEDURE_CATEGORIES,
  type EpocData, createDefaultEpocData,
} from '@/lib/epoc-data'

/* ── Colors ── */
const C = { bg: '#F5F4F0', s0: '#FEFEFC', s1: '#F0EDE7', s2: '#E8E5DF', br: '#DDD9D2', br2: '#C8C4BC', tx: '#1A1917', m: '#6B6760', ac: '#1B4F3A', acl: '#E8F0EC', ac2: '#155230', ok: '#166534', wn: '#B45309' }

/* ── Summary statuses ── */
const ST = [
  { v: 'none', l: '未着手', c: '#7A7872' },
  { v: 'writing', l: '作成中', c: '#92400E' },
  { v: 'submitted', l: '一次評価中', c: '#1D4ED8' },
  { v: 'revision', l: '修正中', c: '#5B21B6' },
  { v: 'accepted', l: '受理済✓', c: '#166534' },
]

/* ── Guide sections ── */
/* ── State builders ── */
function buildEG() {
  const eg: any = {}
  SP.forEach(sp => {
    eg[sp.id] = {};
    (DG[sp.id] || []).forEach(dg => {
      eg[sp.id][dg.id] = { on: false, d: {} }
      dg.diseases.forEach(d => { eg[sp.id][dg.id].d[d] = false })
    })
  })
  return eg
}
function makeSums() {
  return Array.from({ length: 29 }, (_, i) => ({ id: i + 1, specialty: '', dgId: '', diseases: [] as string[], title: '', status: 'none', notes: '' }))
}
function defaultOther() {
  return { jmecc: false, publications: 0, ethics: { y1: 0, y2: 0, y3: 0 }, academicMeetings: { y1: 0, y2: 0, y3: 0 } }
}

/* ── Computed helpers ── */
function recalc(eg: any) {
  const cases: any = {}, groups: any = {}
  SP.forEach(sp => {
    const e = eg[sp.id] || {}
    groups[sp.id] = Object.values(e).filter((v: any) => v.on).length
    cases[sp.id] = Object.values(e).reduce((a: number, v: any) => a + Object.values(v.d).filter(Boolean).length, 0)
  })
  return { cases, groups }
}

/* ════════════════════════════════════
   MAIN APP
════════════════════════════════════ */
export default function JoslerApp({ initialMode }: { initialMode?: RecordMode } = {}) {
  const { isPro } = useProStatus()
  const [mode, setMode] = useState<RecordMode>(initialMode || 'josler')
  const [tab, setTab] = useState('overview')
  const [eg, setEg] = useState(() => buildEG())
  const [summaries, setSummaries] = useState(() => makeSums())
  const [other, setOther] = useState(() => defaultOther())
  const [loaded, setLoaded] = useState(false)
  const [showProModal, setShowProModal] = useState(false)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved')

  // EPOC state
  const [epocData, setEpocData] = useState<EpocData>(() => createDefaultEpocData())
  const [epocTab, setEpocTab] = useState<'overview' | 'symptoms' | 'diseases' | 'procedures'>('overview')
  const [epocLoaded, setEpocLoaded] = useState(false)

  // UI state
  const [openSp, setOpenSp] = useState<string | null>(null)
  const [openDgBySp, setOpenDgBySp] = useState<Record<string, string | null>>({})
  const [openSumId, setOpenSumId] = useState<number | null>(null)
  const [openSumDg, setOpenSumDg] = useState<Record<number, string | null>>({})
  const [showRules, setShowRules] = useState(false)
  const [showShortage, setShowShortage] = useState(false)

  // ── Data load on mount ──
  useEffect(() => {
    if (!initialMode) setMode(loadRecordMode())
    ;(async () => {
      const [joslerResult, epocResult] = await Promise.all([
        loadJoslerData(),
        loadEpocData(),
      ])
      if (joslerResult) {
        if (joslerResult.eg) setEg(joslerResult.eg)
        if (joslerResult.summaries) setSummaries(joslerResult.summaries)
        if (joslerResult.other) setOther(joslerResult.other)
      }
      setEpocData(epocResult)
      setEpocLoaded(true)
      setLoaded(true)
    })()
    setStatusCallback(setSaveStatus)
    return () => { stopAutoSave() }
  }, [])

  // ── EPOC auto-save ──
  const epocSaveTimer = useRef<any>(null)
  useEffect(() => {
    if (!epocLoaded) return
    saveEpocToLocal(epocData)
    if (isPro) {
      if (epocSaveTimer.current) clearTimeout(epocSaveTimer.current)
      epocSaveTimer.current = setTimeout(() => { saveEpocToCloud(epocData) }, 2000)
    }
  }, [epocData, epocLoaded, isPro])

  // ── Mode switch handler ──
  const switchMode = useCallback((newMode: RecordMode) => {
    setMode(newMode)
    saveRecordMode(newMode)
  }, [])

  // ── Auto-save: debounced on every state change ──
  const getPayload = useCallback((): JoslerData => ({
    eg, summaries, other,
  }), [eg, summaries, other])

  const saveTimer = useRef<any>(null)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  useEffect(() => {
    if (!loaded) return
    if (!isPro) {
      // FREE: 保存しない（セッション中のみ state で保持）
      // データ変更があったことを記録
      setHasUnsavedChanges(true)
      return
    }
    // PRO: debounced save (localStorage immediate + cloud debounced)
    if (saveTimer.current) clearTimeout(saveTimer.current)
    saveTimer.current = setTimeout(() => {
      saveJoslerData(getPayload(), true)
    }, 2000)
    saveToLocal(getPayload())
  }, [eg, summaries, other, loaded, isPro, getPayload])

  // ── Start auto-save for PRO users ──
  useEffect(() => {
    if (loaded && isPro) {
      startAutoSave(getPayload)
    }
    return () => { stopAutoSave() }
  }, [loaded, isPro, getPayload])

  // FREE: ページ離脱時に警告
  useEffect(() => {
    if (isPro || !hasUnsavedChanges) return
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [isPro, hasUnsavedChanges])

  // FREE: 一定時間操作後にPRO誘導
  useEffect(() => {
    if (isPro || !loaded) return
    const timer = setTimeout(() => {
      if (hasUnsavedChanges) setShowProModal(true)
    }, 120000) // 2分後
    return () => clearTimeout(timer)
  }, [isPro, loaded, hasUnsavedChanges])

  // Computed
  const { cases, groups } = recalc(eg)
  const totalC = Object.values(cases).reduce((a: number, b: any) => a + b, 0)
  const totalG = Object.values(groups).reduce((a: number, b: any) => a + b, 0)
  const totalAcc = summaries.filter(s => s.status === 'accepted').length
  const totalWip = summaries.filter(s => s.status !== 'none' && s.status !== 'accepted').length
  const oProg = (() => {
    const o = other; let done = 0
    if (o.jmecc) done++
    if ((o.publications || 0) >= 2) done++
    if (['y1', 'y2', 'y3'].every(y => (o.ethics?.[y] || 0) >= 2)) done++
    if (['y1', 'y2', 'y3'].every(y => (o.academicMeetings?.[y] || 0) >= 2)) done++
    return { done, total: 4 }
  })()
  const cPct = totalC / 120 * 100, gPct = totalG / 56 * 100, sPct = totalAcc / 29 * 100, ooPct = oProg.done / 4 * 100
  const overallPct = Math.round((cPct + gPct + sPct + ooPct) / 4)

  // Mutations
  const toggleGroup = (spId: string, dgId: string) => {
    setEg((p: any) => {
      const n = JSON.parse(JSON.stringify(p))
      if (n[spId]?.[dgId]) n[spId][dgId].on = !n[spId][dgId].on
      return n
    })
  }
  const toggleDisease = (spId: string, dgId: string, dis: string) => {
    setEg((p: any) => {
      const n = JSON.parse(JSON.stringify(p))
      if (n[spId]?.[dgId]) {
        n[spId][dgId].d[dis] = !n[spId][dgId].d[dis]
        if (Object.values(n[spId][dgId].d).some(Boolean)) n[spId][dgId].on = true
      }
      return n
    })
  }
  const updSum = (id: number, upd: any) => setSummaries(p => p.map(s => s.id === id ? { ...s, ...upd } : s))
  const updOther = (upd: any) => setOther((p: any) => ({ ...p, ...upd }))

  // ── EPOC toggles ──
  const toggleEpocItem = useCallback((section: 'symptoms' | 'diseases' | 'procedures', id: string) => {
    setEpocData(prev => ({
      ...prev,
      [section]: { ...prev[section], [id]: !prev[section][id] },
    }))
  }, [])

  const TABS = [
    { id: 'overview', l: '📋 概要' },
    { id: 'cases', l: '📊 症例' },
    { id: 'summaries', l: '📝 要約' },
    { id: 'generator', l: '✍️ 要約生成' },
    { id: 'other', l: '📎 その他' },
  ]

  if (!loaded) return <div style={{ textAlign: 'center', padding: '80px 20px', color: C.m }}>読み込み中...</div>

  // ── モード切り替えUI ──
  const ModeSwitch = () => (
    <div style={{ display: 'flex', gap: 6, padding: '14px 18px 0' }}>
      {([
        { id: 'epoc' as RecordMode, label: 'EPOC', sub: '初期研修', disabled: false },
        { id: 'josler' as RecordMode, label: 'J-OSLER', sub: '内科専攻', disabled: false },
        { id: null, label: '外科専攻', sub: '準備中', disabled: true },
      ]).map((m, i) => {
        const active = !m.disabled && mode === m.id
        return (
          <button key={i} onClick={() => !m.disabled && m.id && switchMode(m.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', border: `1.5px solid ${active ? C.ac : C.br}`,
            borderRadius: 20, cursor: m.disabled ? 'default' : 'pointer',
            background: active ? C.ac : C.s0,
            opacity: m.disabled ? 0.38 : 1,
            transition: 'all .18s',
          }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: active ? C.s0 : C.m, letterSpacing: '0.01em' }}>{m.label}</span>
            <span style={{ fontSize: 10, color: active ? 'rgba(255,255,255,0.7)' : C.br2, lineHeight: 1 }}>{m.sub}</span>
          </button>
        )
      })}
    </div>
  )

  // ── EPOC画面 ──
  if (mode === 'epoc') {
    const symDone = Object.values(epocData.symptoms).filter(Boolean).length
    const disDone = Object.values(epocData.diseases).filter(Boolean).length
    const proDone = Object.values(epocData.procedures).filter(Boolean).length
    const totalDone = symDone + disDone + proDone
    const totalAll = 29 + 26 + 14
    const overallPct = Math.round(totalDone / totalAll * 100)

    const EPOC_TABS = [
      { id: 'overview' as const, l: '📋 概要' },
      { id: 'symptoms' as const, l: `🩺 症候 ${symDone}/29` },
      { id: 'diseases' as const, l: `📊 疾病 ${disDone}/26` },
      { id: 'procedures' as const, l: `🔧 手技 ${proDone}/14` },
    ]

    return (
      <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI','Hiragino Kaku Gothic ProN',sans-serif", color: C.tx, maxWidth: 960, margin: '0 auto', position: 'relative', paddingBottom: 80 }}>
        <div style={{ padding: '12px 18px 0' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.m, marginBottom: 10 }}>
            <a href="/" style={{ color: C.m, textDecoration: 'none' }}>ホーム</a>
            <span style={{ opacity: 0.5 }}>›</span>
            <span style={{ color: C.tx }}>研修記録</span>
          </nav>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20, fontWeight: 700, color: C.tx, letterSpacing: '-0.02em' }}>研修記録</span>
            <FavoriteButton slug="app-josler" title="研修記録" href="/josler" type="app" size="sm" />
          </div>
        </div>
        <ModeSwitch />
        <div style={{ display: 'flex', background: C.bg, borderBottom: `1px solid ${C.br}`, overflowX: 'auto', marginTop: 14 }}>
          {EPOC_TABS.map(t => (
            <button key={t.id} onClick={() => setEpocTab(t.id)} style={{
              flex: 1, padding: '10px 4px', border: 'none', background: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
              borderBottom: epocTab === t.id ? `2px solid ${C.ac}` : '2px solid transparent',
              color: epocTab === t.id ? C.ac : C.m, fontWeight: epocTab === t.id ? 600 : 400, fontSize: 12,
            }}>
              {t.l}
            </button>
          ))}
        </div>
        <div style={{ padding: '12px 14px' }}>
          {epocTab === 'overview' && <EpocOverview symDone={symDone} disDone={disDone} proDone={proDone} overallPct={overallPct} />}
          {epocTab === 'symptoms' && <EpocChecklist section="symptoms" data={epocData.symptoms} items={EPOC_SYMPTOMS} categories={SYMPTOM_CATEGORIES} toggle={toggleEpocItem} color="#2D6A4F" />}
          {epocTab === 'diseases' && <EpocChecklist section="diseases" data={epocData.diseases} items={EPOC_DISEASES} categories={DISEASE_CATEGORIES} toggle={toggleEpocItem} color="#5B7FA6" />}
          {epocTab === 'procedures' && <EpocChecklist section="procedures" data={epocData.procedures} items={EPOC_PROCEDURES} categories={PROCEDURE_CATEGORIES} toggle={toggleEpocItem} color="#9A3B3B" />}
        </div>
        {showProModal && <ProModal feature="full_access" onClose={() => setShowProModal(false)} />}
      </div>
    )
  }

  // ── J-OSLER画面（既存）──
  return (
    <div style={{ background: C.bg, minHeight: '100vh', fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI','Hiragino Kaku Gothic ProN',sans-serif", color: C.tx, maxWidth: 960, margin: '0 auto', position: 'relative', paddingBottom: 80 }}>
      {/* Breadcrumb + Title */}
      <div style={{ padding: '12px 18px 0' }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: C.m, marginBottom: 10 }}>
          <a href="/" style={{ color: C.m, textDecoration: 'none' }}>ホーム</a>
          <span style={{ opacity: 0.5 }}>›</span>
          <span style={{ color: C.tx }}>研修記録</span>
        </nav>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: C.tx, letterSpacing: '-0.02em' }}>研修記録</span>
          <span style={{ fontSize: 10, color: C.ac, background: C.acl, padding: '2px 7px', borderRadius: 10, fontWeight: 700, letterSpacing: '0.04em' }}>PRO</span>
          <FavoriteButton slug="app-josler" title="J-OSLER管理" href="/josler" type="app" size="sm" />
          <span style={{ flex: 1 }} />
          {isPro && (
            <span style={{ fontSize: 11, padding: '3px 10px', borderRadius: 20, fontFamily: 'monospace', background: saveStatus === 'saved' ? '#DCFCE7' : saveStatus === 'saving' || saveStatus === 'dirty' ? '#FEF3C7' : saveStatus === 'error' ? '#FEE2E2' : '#EEF4FF', color: saveStatus === 'saved' ? '#166534' : saveStatus === 'saving' || saveStatus === 'dirty' ? '#92400E' : saveStatus === 'error' ? '#991B1B' : '#1E40AF', transition: 'all .3s' }}>
              {saveStatus === 'saved' ? '✓ 保存済み' : saveStatus === 'saving' || saveStatus === 'dirty' ? '⟳ 保存中…' : saveStatus === 'error' ? '✕ 保存失敗' : '☁ オフライン'}
            </span>
          )}
          {!isPro && (
            <span style={{ fontSize: 10, padding: '3px 10px', borderRadius: 20, background: '#FEF3C7', color: '#92400E', cursor: 'pointer' }}
              onClick={() => setShowProModal(true)}>
              未保存 — PROで保存
            </span>
          )}
        </div>
      </div>
      <ModeSwitch />

      {/* FREE: 保存誘導バナー */}
      {!isPro && hasUnsavedChanges && (
        <div style={{ margin: '8px 14px 0', padding: '10px 14px', borderRadius: 10, background: '#FEF3C7', border: '1px solid #FCD34D', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#92400E' }}>データは保存されていません</div>
            <div style={{ fontSize: 10, color: '#92400E', opacity: 0.8 }}>ページを閉じると入力内容が失われます</div>
          </div>
          <button onClick={() => setShowProModal(true)} style={{ padding: '6px 12px', borderRadius: 8, background: C.ac, color: '#fff', fontSize: 11, fontWeight: 700, border: 'none', cursor: 'pointer', whiteSpace: 'nowrap' }}>
            PROで保存
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', background: C.bg, borderBottom: `1px solid ${C.br}`, overflowX: 'auto', marginTop: 14 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => { setTab(t.id); setOpenSp(null); setOpenSumId(null) }} style={{
            flex: 1, padding: '10px 4px', border: 'none', background: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
            borderBottom: tab === t.id ? `2px solid ${C.ac}` : '2px solid transparent',
            color: tab === t.id ? C.ac : C.m, fontWeight: tab === t.id ? 600 : 400, fontSize: 12,
          }}>
            {t.l}
          </button>
        ))}
      </div>

      <div style={{ padding: '12px 14px' }}>
        {tab === 'overview' && <OverviewTab cases={cases} groups={groups} totalC={totalC} totalG={totalG} totalAcc={totalAcc} totalWip={totalWip} summaries={summaries} overallPct={overallPct} cPct={cPct} gPct={gPct} sPct={sPct} ooPct={ooPct} oProg={oProg} />}
        {tab === 'cases' && <CasesTab eg={eg} cases={cases} groups={groups} totalC={totalC} totalG={totalG} openSp={openSp} setOpenSp={setOpenSp} openDgBySp={openDgBySp} setOpenDgBySp={setOpenDgBySp} toggleGroup={toggleGroup} toggleDisease={toggleDisease} onImport={(imported: any) => {
          setEg((prev: any) => {
            const n = JSON.parse(JSON.stringify(prev))
            imported.forEach((r: any) => {
              if (r.spId && r.dgId && n[r.spId]?.[r.dgId]) {
                n[r.spId][r.dgId].on = true
                if (r.disease && n[r.spId][r.dgId].d.hasOwnProperty(r.disease)) {
                  n[r.spId][r.dgId].d[r.disease] = true
                }
              }
            })
            return n
          })
        }} />}
        {tab === 'summaries' && <SummariesTab summaries={summaries} eg={eg} updSum={updSum} openSumId={openSumId} setOpenSumId={setOpenSumId} openSumDg={openSumDg} setOpenSumDg={setOpenSumDg} showRules={showRules} setShowRules={setShowRules} showShortage={showShortage} setShowShortage={setShowShortage} />}
        {tab === 'other' && <OtherTab other={other} updOther={updOther} />}
        {tab === 'generator' && <GeneratorTab summaries={summaries} />}
      </div>

      {showProModal && <ProModal feature="full_access" onClose={() => setShowProModal(false)} />}
    </div>
  )
}

/* ═══ Ring SVG ═══ */
function Ring({ pct, size = 88, stroke = 8, color = C.ac }: any) {
  const r = (size - stroke) / 2, circ = 2 * Math.PI * r, off = circ * (1 - Math.min(pct, 100) / 100)
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.s2} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={circ} strokeDashoffset={off} strokeLinecap="round" style={{ transition: 'stroke-dashoffset .6s ease-out' }} />
    </svg>
  )
}
function PBar({ pct, color = C.ac }: any) {
  return <div style={{ width: '100%', height: 5, background: C.s2, borderRadius: 3, overflow: 'hidden', marginTop: 6 }}><div style={{ width: `${Math.min(pct, 100)}%`, height: '100%', background: color, borderRadius: 3, transition: 'width .6s ease-out' }} /></div>
}

/* ═══ Card ═══ */
function Card({ children, style = {} }: any) {
  return <div style={{ background: C.s0, border: `1px solid ${C.br}`, borderRadius: 12, padding: '14px 14px', marginBottom: 10, ...style }}>{children}</div>
}
function CardT({ children }: any) {
  return <div style={{ fontSize: 13, fontWeight: 600, color: C.m, marginBottom: 10 }}>{children}</div>
}

/* ═══════════════════════════════════
   OVERVIEW TAB
═══════════════════════════════════ */
function OverviewTab({ totalC, totalG, totalAcc, totalWip, summaries, overallPct, cPct, gPct, sPct, ooPct, oProg, cases, groups }: any) {
  return (
    <>
      {/* Hero ring */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
            <Ring pct={overallPct} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: C.ac }}>{overallPct}%</span>
              <span style={{ fontSize: 9, color: C.m }}>総合進捗</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>内科専門医 取得ナビ</div>
            <div style={{ fontSize: 11, color: C.m }}>120症例 / 56疾患群 / 29病歴要約 / その他要件</div>
          </div>
        </div>
      </Card>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
        {[
          { l: '症例数', v: totalC, mx: 120, c: C.ac, p: cPct },
          { l: '疾患群', v: totalG, mx: 56, c: '#5B7FA6', p: gPct },
          { l: '病歴要約', v: totalAcc, mx: 29, c: '#9A3B3B', p: sPct, extra: totalWip > 0 ? `+${totalWip}作業中` : '' },
          { l: 'その他要件', v: oProg.done, mx: 4, c: '#7C6F4A', p: ooPct },
        ].map((s, i) => (
          <Card key={i} style={{ marginBottom: 0 }}>
            <div style={{ fontSize: 10, color: C.m, marginBottom: 4 }}>{s.l}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</span>
              <span style={{ fontSize: 11, color: C.m }}>/ {s.mx}</span>
              {s.extra && <span style={{ fontSize: 10, color: C.wn, marginLeft: 4 }}>{s.extra}</span>}
            </div>
            <PBar pct={s.p} color={s.c} />
          </Card>
        ))}
      </div>

      {/* EPOC連携 */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.tx, marginBottom: 2 }}>EPOCから症例を取り込む</div>
            <div style={{ fontSize: 10, color: C.m }}>初期研修で経験した症例をJ-OSLERに反映</div>
          </div>
          <a href="/epoc" style={{ fontSize: 11, fontWeight: 700, color: 'white', background: C.ac, padding: '6px 14px', borderRadius: 8, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            EPOC &rsaquo;
          </a>
        </div>
      </Card>

      {/* Specialty table */}
      <Card>
        <CardT>領域別 達成状況</CardT>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1.5px solid ${C.br}` }}>
                {['領域', '症例', '疾患群', '要約', '作業中'].map((h, i) => (
                  <th key={h} style={{ padding: '6px 4px', textAlign: i === 0 ? 'left' : 'center', fontWeight: 600, color: C.m, fontSize: 10 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {SP.map(sp => {
                const c = cases[sp.id] || 0, g = groups[sp.id] || 0
                const a = summaries.filter((s: any) => s.specialty === sp.id && s.status === 'accepted').length
                const w = summaries.filter((s: any) => s.specialty === sp.id && s.status !== 'none' && s.status !== 'accepted').length
                const cOk = !sp.minC || c >= sp.minC, gOk = !sp.minG || g >= sp.minG, sOk = !sp.minS || a >= sp.minS
                return (
                  <tr key={sp.id} style={{ borderBottom: `1px solid ${C.s1}` }}>
                    <td style={{ padding: '5px 4px', whiteSpace: 'nowrap' }}>
                      <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: sp.color, marginRight: 5, verticalAlign: 'middle' }} />
                      {sp.short}
                    </td>
                    <td style={{ textAlign: 'center', padding: '5px 4px' }}>
                      <span style={{ color: cOk ? C.ok : C.wn, fontWeight: 600 }}>{c}</span>
                      <span style={{ color: C.br2 }}>/{sp.minC || '-'}</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '5px 4px' }}>
                      <span style={{ color: gOk ? C.ok : C.wn, fontWeight: 600 }}>{g}</span>
                      <span style={{ color: C.br2 }}>/{sp.minG || '-'}</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '5px 4px' }}>
                      <span style={{ color: sOk ? C.ok : C.wn, fontWeight: 600 }}>{a}</span>
                      <span style={{ color: C.br2 }}>/{sp.minS || '-'}</span>
                    </td>
                    <td style={{ textAlign: 'center', padding: '5px 4px' }}>
                      {w > 0 ? <span style={{ color: C.wn }}>{w}</span> : <span style={{ color: C.br2 }}>-</span>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

/* ═══════════════════════════════════
   CASES TAB
═══════════════════════════════════ */
function CasesTab({ eg, cases, groups, totalC, totalG, openSp, setOpenSp, openDgBySp, setOpenDgBySp, toggleGroup, toggleDisease, onImport }: any) {
  const genTot = (cases.generalI || 0) + (cases.generalII || 0) + (cases.generalIII || 0)
  const [showImport, setShowImport] = useState(false)
  const [importData, setImportData] = useState<any[]>([])
  const [importDone, setImportDone] = useState(false)

  const loadDashboardArchive = () => {
    try {
      const raw = localStorage.getItem('iwor_dashboard_data')
      if (!raw) { setImportData([]); setShowImport(true); return }
      const data = JSON.parse(raw)
      const archived = data.archived || []
      // Filter: only those with specialty + diseaseGroup + diagnosis
      const valid = archived
        .filter((p: any) => p.specialty && p.diseaseGroup && p.diagnosis)
        .map((p: any) => {
          const sp = SP.find(s => s.id === p.specialty)
          const dgs = DG[p.specialty] || []
          const dg = dgs.find((d: any) => d.id === p.diseaseGroup)
          // Check if disease exists in disease group
          const diseaseMatch = dg?.diseases?.includes(p.diagnosis) ? p.diagnosis : null
          // Check if already in J-OSLER
          const alreadyIn = eg[p.specialty]?.[p.diseaseGroup]?.d?.[p.diagnosis] === true
          return {
            id: p.id,
            room: p.room,
            name: p.name,
            diagnosis: p.diagnosis,
            spId: p.specialty,
            spLabel: sp?.short || p.specialty,
            dgId: p.diseaseGroup,
            dgLabel: dg?.name || p.diseaseGroup,
            disease: diseaseMatch,
            dischargeDate: p.dischargeDate,
            alreadyIn,
          }
        })
      setImportData(valid)
      setShowImport(true)
      setImportDone(false)
    } catch { setImportData([]); setShowImport(true) }
  }

  const executeImport = () => {
    const toImport = importData.filter((r: any) => !r.alreadyIn)
    if (toImport.length === 0) return
    onImport(toImport)
    setImportDone(true)
  }

  return (
    <>
      <Card>
        <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 700, color: C.ac }}>{totalC}</span>
            <span style={{ fontSize: 12, color: C.m }}> / 120</span>
            <div style={{ fontSize: 10, color: C.m }}>総症例数</div>
          </div>
          <div>
            <span style={{ fontSize: 22, fontWeight: 700, color: '#5B7FA6' }}>{totalG}</span>
            <span style={{ fontSize: 12, color: C.m }}> / 56</span>
            <div style={{ fontSize: 10, color: C.m }}>総疾患群</div>
          </div>
          {genTot > 0 && (
            <div style={{ fontSize: 11, color: C.m, alignSelf: 'center' }}>
              総合内科合計: <span style={{ color: genTot >= 10 ? C.ok : C.wn, fontWeight: 700 }}>{genTot}</span> / 10
            </div>
          )}
        </div>
        <div style={{ fontSize: 10, color: C.m }}>① 疾患群の ☐ を押して選択 → ② ▶ で病名を展開 → タップで複数選択</div>
      </Card>


      {/* Specialty accordion */}
      {SP.map(sp => {
        const isOpen = openSp === sp.id
        const dgs = DG[sp.id] || []
        const c = cases[sp.id] || 0, g = groups[sp.id] || 0
        const cOk = !sp.minC || c >= sp.minC, gOk = !sp.minG || g >= sp.minG
        const expG = Object.values(eg[sp.id] || {}).filter((v: any) => v.on).length
        const expD = c

        return (
          <div key={sp.id} style={{ marginBottom: 6 }}>
            <button onClick={() => setOpenSp(isOpen ? null : sp.id)} style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px',
              border: `1px solid ${isOpen ? sp.color + '88' : C.br}`, borderRadius: isOpen ? '8px 8px 0 0' : 8,
              background: isOpen ? sp.color + '08' : C.s0, cursor: 'pointer', fontSize: 13, fontWeight: 600, color: C.tx, textAlign: 'left',
            }}>
              <span style={{ width: 10, height: 10, borderRadius: '50%', background: sp.color, flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{sp.short}</span>
              <span style={{ fontSize: 11, color: gOk ? C.ok : C.m, fontWeight: 600 }}>疾患群 {expG}/{dgs.length}</span>
              {expD > 0 && <span style={{ fontSize: 11, color: C.m, marginLeft: 6 }}>計{expD}症例</span>}
              <span style={{ fontSize: 12, color: C.m, transform: isOpen ? 'rotate(90deg)' : 'none', transition: 'transform .2s', marginLeft: 4 }}>▶</span>
            </button>
            {isOpen && (
              <div style={{ border: `1px solid ${sp.color}44`, borderTop: 'none', borderRadius: '0 0 8px 8px', padding: '8px 10px', background: C.s0 }}>
                <DGPanel spId={sp.id} spColor={sp.color} eg={eg} dgs={dgs}
                  openDgId={openDgBySp[sp.id] || null}
                  setOpenDg={(dgId: string | null) => setOpenDgBySp((p: any) => ({ ...p, [sp.id]: dgId }))}
                  toggleGroup={toggleGroup} toggleDisease={toggleDisease}
                />
              </div>
            )}
          </div>
        )
      })}
    </>
  )
}

/* ── Disease Group Panel (shared by Cases & Summaries) ── */
function DGPanel({ spId, spColor, eg, dgs, openDgId, setOpenDg, toggleGroup, toggleDisease, isSumPanel, sumId, sumDgId, sumDiseases, onSumDgToggle, onSumDisToggle }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
      {dgs.map((dg: any) => {
        let on: boolean, dc: number, exp: boolean
        if (isSumPanel) {
          on = sumDgId === dg.id; dc = on ? (sumDiseases || []).length : 0; exp = openDgId === dg.id
        } else {
          const dgEg = eg[spId]?.[dg.id] || { on: false, d: {} }
          on = dgEg.on; dc = Object.values(dgEg.d).filter(Boolean).length; exp = openDgId === dg.id
        }
        return (
          <div key={dg.id} style={{ border: `1px solid ${on ? spColor + '88' : C.br}`, borderRadius: 7, background: on ? spColor + '14' : C.bg, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 10px' }}>
              <div onClick={() => isSumPanel ? onSumDgToggle(dg.id, on) : toggleGroup(spId, dg.id)} style={{
                width: 18, height: 18, borderRadius: 4, border: `2px solid ${on ? spColor : C.br2}`,
                background: on ? spColor : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 10, fontWeight: 900, cursor: 'pointer', flexShrink: 0,
              }}>
                {on && '✓'}
              </div>
              <span onClick={() => setOpenDg(exp ? null : dg.id)} style={{ flex: 1, fontSize: 12, fontWeight: 600, color: on ? spColor : C.tx, cursor: 'pointer' }}>
                {dg.name}
                {dg.gc && <span style={{ fontSize: 10, color: C.m, marginLeft: 5, fontWeight: 400 }}>[{dg.gc}]</span>}
              </span>
              {dc > 0 && <span style={{ fontSize: 11, color: spColor, fontWeight: 600 }}>{isSumPanel ? dc + '疾患選択中' : dc + '症例'}</span>}
              <span onClick={() => setOpenDg(exp ? null : dg.id)} style={{ fontSize: 12, color: C.m, transform: exp ? 'rotate(90deg)' : 'none', transition: 'transform .2s', cursor: 'pointer', padding: '2px 6px' }}>▶</span>
            </div>
            {exp && (
              <div style={{ borderTop: `1px solid ${on ? spColor + '44' : C.br}`, padding: '6px 10px' }}>
                {!on && isSumPanel && <div style={{ fontSize: 11, color: C.wn, marginBottom: 6 }}>← まず左の ☐ でこの疾患群を選択</div>}
                <div style={{ fontSize: 11, color: C.m, marginBottom: 6 }}>{isSumPanel ? '病名をタップ（複数選択可）:' : 'タップで経験済み（1タップ=1症例）:'}</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {dg.diseases.map((d: string) => {
                    let chk: boolean
                    if (isSumPanel) { chk = on && (sumDiseases || []).includes(d) } else { chk = !!(eg[spId]?.[dg.id]?.d[d]) }
                    return (
                      <button key={d} onClick={() => isSumPanel ? onSumDisToggle(dg.id, d, on) : toggleDisease(spId, dg.id, d)} style={{
                        padding: '3px 8px', borderRadius: 5, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                        border: `1.5px solid ${chk ? spColor : C.br}`, background: chk ? spColor + '18' : C.s0, color: chk ? spColor : C.m,
                      }}>
                        {chk && '✓ '}{d}
                      </button>
                    )
                  })}
                </div>
                {isSumPanel && on && (sumDiseases || []).length > 0 && (
                  <div style={{ fontSize: 11, color: spColor, marginTop: 6, fontWeight: 600 }}>選択中: {(sumDiseases || []).join('、')}</div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

/* ═══════════════════════════════════
   SUMMARIES TAB
═══════════════════════════════════ */
function SummariesTab({ summaries, eg, updSum, openSumId, setOpenSumId, openSumDg, setOpenSumDg, showRules, setShowRules, showShortage, setShowShortage }: any) {
  // Special rules
  const genCov = new Set(summaries.filter((s: any) => ['generalI', 'generalII', 'generalIII'].includes(s.specialty) && s.status !== 'none').map((s: any) => s.specialty))
  const genOk = genCov.size >= 2
  const gastroDGs = DG.gastro || []
  const gSumCats = new Set(summaries.filter((s: any) => s.specialty === 'gastro' && s.status !== 'none' && s.dgId).map((s: any) => (gastroDGs.find(x => x.id === s.dgId) || {} as any).gc).filter(Boolean))
  const gCasCats = new Set(Object.entries(eg.gastro || {}).filter(([, v]: any) => v.on).map(([id]: any) => (gastroDGs.find(x => x.id === id) || {} as any).gc).filter(Boolean))
  const endoN = summaries.filter((s: any) => s.specialty === 'endo' && s.status !== 'none').length
  const metaN = summaries.filter((s: any) => s.specialty === 'metabolic' && s.status !== 'none').length
  const emOk = endoN >= 1 && metaN >= 1
  const ruleAllOk = genOk && emOk

  // Shortage
  const shortageN = SP.filter(sp => sp.minS > 0 && !['generalI', 'generalII', 'generalIII'].includes(sp.id))
    .filter(sp => Math.max(0, sp.minS - summaries.filter((s: any) => s.specialty === sp.id && s.status === 'accepted').length) > 0).length

  // Stack bar
  const acc = summaries.filter((s: any) => s.status === 'accepted').length
  const wip = summaries.filter((s: any) => s.status !== 'none' && s.status !== 'accepted').length

  return (
    <>
      {/* Progress */}
      <Card>
        <CardT>病歴要約 進捗</CardT>
        <div style={{ display: 'flex', height: 10, borderRadius: 5, overflow: 'hidden', background: C.s2 }}>
          {acc > 0 && <div style={{ width: `${acc / 29 * 100}%`, background: C.ok }} />}
          {wip > 0 && <div style={{ width: `${wip / 29 * 100}%`, background: '#D97706' }} />}
        </div>
        <div style={{ display: 'flex', gap: 12, marginTop: 6, fontSize: 11, color: C.m }}>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: C.ok, marginRight: 3 }} />受理 {acc}</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: '#D97706', marginRight: 3 }} />作業中 {wip}</span>
          <span><span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: 2, background: C.s2, marginRight: 3 }} />未着手 {29 - acc - wip}</span>
        </div>
      </Card>

      {/* Rule check */}
      <Card style={{ background: C.s1 }}>
        <div onClick={() => setShowRules(!showRules)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.m }}>📋 特殊ルール チェック</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!showRules && <span style={{ fontSize: 11, fontWeight: 600, color: ruleAllOk ? C.ok : C.wn, background: ruleAllOk ? '#D1EAD9' : '#FDF0F0', padding: '2px 10px', borderRadius: 20 }}>{ruleAllOk ? '✓ すべてOK' : '⚠ 要確認'}</span>}
            <span style={{ fontSize: 12, color: C.m, transform: showRules ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>▶</span>
          </span>
        </div>
        {showRules && (
          <div style={{ marginTop: 12 }}>
            {/* 総合内科 */}
            <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, border: `1px solid ${genOk ? '#A7C4B5' : '#E0B8B8'}`, background: genOk ? '#EAF4EE' : '#FDF0F0' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.ac, marginBottom: 6 }}>総合内科 — 3区分のうち2区分以上から各1編以上</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 6 }}>
                {['generalI', 'generalII', 'generalIII'].map(id => {
                  const sp = SP.find(x => x.id === id)!
                  const n = summaries.filter((s: any) => s.specialty === id && s.status !== 'none').length
                  return (
                    <div key={id} style={{ flex: 1, minWidth: 80, background: n > 0 ? '#D1EAD9' : C.s0, border: `1px solid ${n > 0 ? '#A7C4B5' : C.br}`, borderRadius: 6, padding: 8, textAlign: 'center' }}>
                      <div style={{ fontSize: 11, color: n > 0 ? C.ok : C.m, fontWeight: 600 }}>{sp.short}</div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: n > 0 ? C.ok : C.m }}>{n}</div>
                      <div style={{ fontSize: 10, color: n > 0 ? C.ok : C.m }}>{n > 0 ? '✓' : '未着手'}</div>
                    </div>
                  )
                })}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: genOk ? C.ok : C.wn }}>{genOk ? `✓ ${genCov.size}区分カバー済` : `⚠ 少なくとも2区分が必要（現在${genCov.size}区分）`}</div>
            </div>
            {/* 消化器 */}
            <div style={{ marginBottom: 12, padding: '10px 12px', borderRadius: 8, border: `1px solid ${C.br}` }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: '#9A3B3B', marginBottom: 8 }}>消化器 — 消化管・肝臓・胆膵それぞれ1例以上（症例＆病歴要約）</div>
              {['消化管', '肝臓', '胆・膵'].map(cat => {
                const cOk = gCasCats.has(cat), sOk = gSumCats.has(cat)
                return (
                  <div key={cat} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, minWidth: 48 }}>{cat}</span>
                    {[['症例', cOk], ['病歴要約', sOk]].map(([l, ok]: any) => (
                      <span key={l} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, background: ok ? '#D1EAD9' : C.s0, color: ok ? C.ok : C.m, border: `1px solid ${ok ? '#A7C4B5' : C.br}` }}>{ok ? '✓ ' + l + 'あり' : l + 'なし'}</span>
                    ))}
                  </div>
                )
              })}
            </div>
            {/* 内分泌・代謝 */}
            <div style={{ padding: '10px 12px', borderRadius: 8, border: `1px solid ${emOk ? '#A7C4B5' : C.br}`, background: emOk ? '#EAF4EE' : C.s0 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.ac, marginBottom: 8 }}>内分泌・代謝 — それぞれ1編以上（合計3編以上）</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 8 }}>
                {[{ l: '内分泌', n: endoN, r: 1 }, { l: '代謝', n: metaN, r: 2 }, { l: '合計', n: endoN + metaN, r: 3 }].map(x => (
                  <div key={x.l} style={{ flex: 1, minWidth: 80, background: x.n >= x.r ? '#D1EAD9' : C.s0, border: `1px solid ${x.n >= x.r ? '#A7C4B5' : C.br}`, borderRadius: 6, padding: 8, textAlign: 'center' }}>
                    <div style={{ fontSize: 11, color: x.n >= x.r ? C.ok : C.m, fontWeight: 600 }}>{x.l}</div>
                    <div style={{ fontSize: 20, fontWeight: 700, color: x.n >= x.r ? C.ok : C.wn }}>{x.n}</div>
                    <div style={{ fontSize: 10, color: C.m }}>/{x.r}編</div>
                  </div>
                ))}
              </div>
              <div style={{ fontSize: 12, fontWeight: 600, color: emOk ? C.ok : C.wn }}>{emOk ? '✓ 要件を満たしています' : '⚠ 内分泌・代謝それぞれ1編以上が必要'}</div>
            </div>
          </div>
        )}
      </Card>

      {/* Shortage check */}
      <Card style={{ background: C.s1 }}>
        <div onClick={() => setShowShortage(!showShortage)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.m }}>⚠️ 病歴要約 不足チェック</span>
          <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {!showShortage && <span style={{ fontSize: 11, fontWeight: 600, color: shortageN === 0 ? C.ok : C.wn, background: shortageN === 0 ? '#D1EAD9' : '#FDF0F0', padding: '2px 10px', borderRadius: 20 }}>{shortageN === 0 ? '✓ すべてOK' : shortageN + '科 不足あり'}</span>}
            <span style={{ fontSize: 12, color: C.m, transform: showShortage ? 'rotate(90deg)' : 'none', transition: 'transform .2s' }}>▶</span>
          </span>
        </div>
        {showShortage && (
          <div style={{ marginTop: 10 }}>
            {SP.filter(sp => sp.minS > 0 && !['generalI', 'generalII', 'generalIII'].includes(sp.id)).map(sp => {
              const acc2 = summaries.filter((s: any) => s.specialty === sp.id && s.status === 'accepted').length
              const w = summaries.filter((s: any) => s.specialty === sp.id && s.status !== 'none' && s.status !== 'accepted').length
              const need = Math.max(0, sp.minS - acc2), ok = need === 0
              return (
                <div key={sp.id} style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', padding: '5px 8px', borderRadius: 6, background: ok ? '#EAF4EE' : 'transparent', border: `1px solid ${ok ? '#A7C4B5' : C.br}`, marginBottom: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: sp.color }} />
                  <span style={{ fontSize: 12, fontWeight: 600, minWidth: 60, color: ok ? C.ok : C.tx }}>{sp.short}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: ok ? C.ok : C.wn }}>{ok ? '✓' : `あと${need}編`}</span>
                  <span style={{ fontSize: 11, color: C.m }}>受理{acc2} / 作業中{w} / 必要{sp.minS}</span>
                </div>
              )
            })}
          </div>
        )}
      </Card>

      {/* Summary list */}
      <Card>
        <CardT>病歴要約 一覧</CardT>
        {summaries.map((s: any) => {
          const st = ST.find(x => x.v === s.status)!
          const spObj = SP.find(x => x.id === s.specialty)
          const dgs = s.specialty ? (DG[s.specialty] || []) : []
          const dgObj = dgs.find((x: any) => x.id === s.dgId)
          const isOpen = openSumId === s.id
          const col = spObj ? spObj.color : C.ac

          return (
            <div key={s.id} style={{ border: `1px solid ${s.status === 'accepted' ? '#A7C4B5' : isOpen ? col + '99' : C.br}`, background: isOpen ? col + '10' : C.s0, borderRadius: 8, marginBottom: 8, overflow: 'hidden' }}>
              {/* Header row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: C.m, minWidth: 24 }}>#{s.id}</span>
                <select value={s.status} onChange={e => updSum(s.id, { status: e.target.value })} style={{ ...selSt, color: st.c }}>
                  {ST.map(x => <option key={x.v} value={x.v}>{x.l}</option>)}
                </select>
                <select value={s.specialty} onChange={e => { updSum(s.id, { specialty: e.target.value, dgId: '', diseases: [] }); setOpenSumId(s.id) }} style={{ ...selSt, color: spObj ? spObj.color : C.m, fontWeight: spObj ? 600 : 400 }}>
                  <option value="">領域を選択…</option>
                  {SP.map(sp => <option key={sp.id} value={sp.id}>{sp.short}</option>)}
                </select>
                {dgObj && (
                  <div style={{ flex: 1, fontSize: 11, minWidth: 80 }}>
                    <span style={{ color: C.m }}>{dgObj.name}</span>
                    {(s.diseases || []).length > 0 && <span style={{ color: col, fontWeight: 600 }}> › {(s.diseases || []).join('、')}</span>}
                  </div>
                )}
                {s.specialty && (
                  <button onClick={() => setOpenSumId(isOpen ? null : s.id)} style={{ background: 'none', border: `1px solid ${isOpen ? col : C.br}`, borderRadius: 6, color: isOpen ? col : C.m, padding: '4px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                    {isOpen ? '▲ 閉じる' : '▼ 疾患群・病名'}
                  </button>
                )}
              </div>
              {/* DG panel */}
              {isOpen && spObj && (
                <div style={{ borderTop: `1px solid ${col}44`, padding: '8px 10px' }}>
                  <DGPanel spId={spObj.id} spColor={col} eg={{}} dgs={dgs}
                    openDgId={openSumDg[s.id] || null}
                    setOpenDg={(dgId: string | null) => setOpenSumDg((p: any) => ({ ...p, [s.id]: dgId }))}
                    toggleGroup={() => { }} toggleDisease={() => { }}
                    isSumPanel sumId={s.id} sumDgId={s.dgId} sumDiseases={s.diseases}
                    onSumDgToggle={(dgId: string, wasOn: boolean) => {
                      if (wasOn) { updSum(s.id, { dgId: '', diseases: [] }); setOpenSumDg((p: any) => ({ ...p, [s.id]: null })) }
                      else { updSum(s.id, { dgId, diseases: [] }); setOpenSumDg((p: any) => ({ ...p, [s.id]: dgId })) }
                    }}
                    onSumDisToggle={(dgId: string, dis: string, wasOn: boolean) => {
                      if (!wasOn) { updSum(s.id, { dgId, diseases: [] }); setOpenSumDg((p: any) => ({ ...p, [s.id]: dgId })) }
                      const cur = s.diseases || []
                      updSum(s.id, { diseases: cur.includes(dis) ? cur.filter((d: string) => d !== dis) : [...cur, dis] })
                    }}
                  />
                </div>
              )}
              {/* 査読メモ（ドロップダウンのみ） */}
              <div style={{ padding: '0 12px 10px' }}>
                <select value={s.notes || ''} onChange={e => updSum(s.id, { notes: e.target.value })} style={{ ...inpSt, fontSize: 12, color: C.m }}>
                  <option value="">メモなし</option>
                  <option value="査読待ち">査読待ち</option>
                  <option value="差し戻し: 考察不足">差し戻し: 考察不足</option>
                  <option value="差し戻し: 検査不足">差し戻し: 検査不足</option>
                  <option value="差し戻し: 文献不足">差し戻し: 文献不足</option>
                  <option value="差し戻し: その他">差し戻し: その他</option>
                  <option value="修正済み・再提出">修正済み・再提出</option>
                  <option value="承認済み">承認済み</option>
                </select>
              </div>
            </div>
          )
        })}
      </Card>
    </>
  )
}

const selSt: any = { padding: '4px 8px', border: `1px solid ${C.br}`, borderRadius: 6, background: C.bg, fontSize: 11, outline: 'none', fontFamily: 'inherit' }
const inpSt: any = { width: '100%', padding: '7px 10px', border: `1px solid ${C.br}`, borderRadius: 6, background: C.bg, fontSize: 13, color: C.tx, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }

/* ═══════════════════════════════════
   OTHER TAB
═══════════════════════════════════ */
function OtherTab({ other: o, updOther }: any) {
  const yrs = ['y1', 'y2', 'y3'] as const
  const yLbl: any = { y1: '1年目', y2: '2年目', y3: '3年目' }
  const items = [
    { id: 'ethics', label: '倫理・安全・感染対策講習', min: 2 },
    { id: 'academicMeetings', label: '内科系学術集会 参加', min: 2 },
  ]

  return (
    <Card>
      <CardT>その他の修了要件</CardT>

      {/* JMECC */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: C.s1, borderRadius: 8, border: `1px solid ${C.br}`, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>JMECC 受講</span>
        <div onClick={() => updOther({ jmecc: !o.jmecc })} style={{
          width: 22, height: 22, borderRadius: 5, border: `2px solid ${o.jmecc ? C.ac : C.br2}`,
          background: o.jmecc ? C.ac : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          {o.jmecc && <span style={{ color: '#fff', fontSize: 13, fontWeight: 800 }}>✓</span>}
        </div>
      </div>

      {/* Publications */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', background: C.s1, borderRadius: 8, border: `1px solid ${C.br}`, marginBottom: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>筆頭演者/著者 発表・論文（2件以上）</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <select value={o.publications || 0} onChange={e => updOther({ publications: parseInt(e.target.value) || 0 })} style={selSt}>
            {Array.from({ length: 11 }, (_, i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <span style={{ fontSize: 12, color: (o.publications || 0) >= 2 ? C.ok : C.wn }}>{(o.publications || 0) >= 2 ? '✓' : '/ 2 必要'}</span>
        </div>
      </div>

      {/* Per-year items */}
      {items.map(it => {
        const vals = o[it.id] || { y1: 0, y2: 0, y3: 0 }
        const tot = yrs.reduce((a, y) => a + (vals[y] || 0), 0)
        const allOk = yrs.every(y => (vals[y] || 0) >= it.min)
        return (
          <div key={it.id} style={{ background: C.s1, borderRadius: 8, border: `1px solid ${allOk ? '#A7C4B5' : C.br}`, padding: '12px 14px', marginBottom: 8 }}>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{it.label}</div>
            <div style={{ fontSize: 11, color: C.m, marginBottom: 10 }}>年{it.min}回以上 × 3年間</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {yrs.map(y => {
                const v = vals[y] || 0, ok = v >= it.min
                return (
                  <div key={y} style={{ flex: 1, minWidth: 80, border: `1px solid ${ok ? '#A7C4B5' : C.br}`, borderRadius: 8, padding: 10, textAlign: 'center', background: C.s0 }}>
                    <div style={{ fontSize: 11, color: C.m, marginBottom: 6 }}>{yLbl[y]}</div>
                    <select value={v} onChange={e => updOther({ [it.id]: { ...vals, [y]: parseInt(e.target.value) || 0 } })} style={{ ...selSt, fontSize: 16, padding: '6px 10px', textAlign: 'center' }}>
                      {Array.from({ length: 11 }, (_, i) => <option key={i} value={i}>{i}</option>)}
                    </select>
                    <div style={{ fontSize: 11, color: ok ? C.ok : C.wn, marginTop: 4 }}>{ok ? `✓ ${it.min}回以上` : `あと ${it.min - v} 回`}</div>
                  </div>
                )
              })}
            </div>
            <div style={{ fontSize: 11, color: C.m, marginTop: 8, textAlign: 'right' }}>
              合計: <span style={{ color: allOk ? C.ok : C.tx, fontWeight: 600 }}>{tot}</span> 回 / {it.min * 3} 回
              {allOk && <span style={{ color: C.ok, marginLeft: 6 }}>✓ 全年度OK</span>}
            </div>
          </div>
        )
      })}
    </Card>
  )
}

/* ═══════════════════════════════════
   GUIDE TAB
═══════════════════════════════════ */
function GeneratorTab({ summaries }: { summaries: any[] }) {
  return (
    <>
      {/* 説明 */}
      <Card style={{ background: `linear-gradient(135deg, ${C.acl}, #d4e8dc)`, border: `1px solid ${C.ac}30` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <span style={{ fontSize: 22 }}>✍️</span>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.ac }}>病歴要約ジェネレーター</div>
            <div style={{ fontSize: 10, color: C.m }}>J-OSLER手引き準拠 / AI不使用 / データ非保持 / ブラウザ完結</div>
          </div>
        </div>
        <a href="/josler/summary-generator" style={{
          display: 'block', width: '100%', padding: '10px 0', borderRadius: 8,
          background: C.ac, color: '#fff', fontSize: 13, fontWeight: 700, textAlign: 'center', textDecoration: 'none',
        }}>
          新規作成（白紙から）
        </a>
      </Card>

      {/* 29要約から選んで生成 */}
      <Card>
        <CardT>登録済み要約から生成</CardT>
        <p style={{ fontSize: 11, color: C.m, marginBottom: 10, lineHeight: 1.5 }}>
          下の要約タブで登録した病歴要約のデータを使って、病歴要約ジェネレーターを開きます。
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {summaries.map((s: any) => {
            const spObj = SP.find(x => x.id === s.specialty)
            const dgs = s.specialty ? (DG[s.specialty] || []) : []
            const dgObj = dgs.find((x: any) => x.id === s.dgId)
            const hasData = s.specialty && s.dgId
            const label = hasData
              ? `#${s.id} ${spObj?.short || ''} — ${dgObj?.name || ''}`
              : `#${s.id} 未設定`
            const st = ST.find(x => x.v === s.status)!
            return (
              <div key={s.id} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                borderRadius: 8, border: `1px solid ${hasData ? (spObj?.color || C.ac) + '30' : C.br}`,
                background: hasData ? C.s0 : C.s1, opacity: hasData ? 1 : 0.5,
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: st.c, minWidth: 48, padding: '2px 6px', borderRadius: 4, background: st.c + '15', textAlign: 'center' }}>
                  {st.l}
                </span>
                <span style={{ flex: 1, fontSize: 11, fontWeight: hasData ? 600 : 400, color: hasData ? C.tx : C.m, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
                {hasData ? (
                  <a href={`/josler/summary-generator?summary=${s.id}&specialty=${s.specialty}&dg=${s.dgId || ''}&diseases=${(s.diseases || []).join(',')}`}
                    style={{ padding: '4px 10px', borderRadius: 6, background: C.acl, color: C.ac, fontSize: 10, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                    生成 →
                  </a>
                ) : (
                  <span style={{ fontSize: 10, color: C.m }}>要約タブで設定</span>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}

/* ═══════════════════════════════════
   EPOC OVERVIEW
═══════════════════════════════════ */
function EpocOverview({ symDone, disDone, proDone, overallPct }: { symDone: number; disDone: number; proDone: number; overallPct: number }) {
  return (
    <>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ position: 'relative', width: 88, height: 88, flexShrink: 0 }}>
            <Ring pct={overallPct} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 22, fontWeight: 800, color: C.ac }}>{overallPct}%</span>
              <span style={{ fontSize: 9, color: C.m }}>総合進捗</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 3 }}>初期臨床研修 到達目標</div>
            <div style={{ fontSize: 11, color: C.m }}>29症候 / 26疾病 / 14手技</div>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 10 }}>
        {[
          { l: '症候', v: symDone, mx: 29, c: '#2D6A4F', p: symDone / 29 * 100 },
          { l: '疾病・病態', v: disDone, mx: 26, c: '#5B7FA6', p: disDone / 26 * 100 },
          { l: '手技', v: proDone, mx: 14, c: '#9A3B3B', p: proDone / 14 * 100 },
        ].map((s, i) => (
          <Card key={i} style={{ marginBottom: 0 }}>
            <div style={{ fontSize: 10, color: C.m, marginBottom: 4 }}>{s.l}</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 22, fontWeight: 700, color: s.c }}>{s.v}</span>
              <span style={{ fontSize: 11, color: C.m }}>/ {s.mx}</span>
            </div>
            <PBar pct={s.p} color={s.c} />
          </Card>
        ))}
      </div>

      {/* JOSLER連携 */}
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.tx, marginBottom: 2 }}>J-OSLERに経験を引き継ぐ</div>
            <div style={{ fontSize: 10, color: C.m }}>EPOCで経験した症例をJ-OSLERの症例登録に反映</div>
          </div>
          <a href="/josler" style={{ fontSize: 11, fontWeight: 700, color: 'white', background: C.ac, padding: '6px 14px', borderRadius: 8, textDecoration: 'none', whiteSpace: 'nowrap' }}>
            J-OSLERへ &rsaquo;
          </a>
        </div>
      </Card>

      <Card style={{ background: C.s1 }}>
        <div style={{ fontSize: 12, color: C.m, lineHeight: 1.7 }}>
          <p style={{ fontWeight: 600, color: C.tx, marginBottom: 4 }}>EPOC（初期臨床研修評価）とは</p>
          <p>2年間の初期臨床研修で経験すべき症候29項目・疾病26項目・手技14項目をチェックリスト形式で管理できます。</p>
          <p style={{ fontSize: 11, color: C.br2, marginTop: 8 }}>出典: 厚生労働省 医師臨床研修指導ガイドライン / PG-EPOC (UMIN)</p>
        </div>
      </Card>
    </>
  )
}

/* ═══════════════════════════════════
   EPOC CHECKLIST (症候/疾病/手技 共通)
═══════════════════════════════════ */
function EpocChecklist({ section, data, items, categories, toggle, color }: {
  section: 'symptoms' | 'diseases' | 'procedures'
  data: Record<string, boolean>
  items: readonly { id: string; name: string; category: string }[]
  categories: readonly string[]
  toggle: (section: 'symptoms' | 'diseases' | 'procedures', id: string) => void
  color: string
}) {
  const done = Object.values(data).filter(Boolean).length
  const total = items.length

  return (
    <>
      <Card>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div>
            <span style={{ fontSize: 22, fontWeight: 700, color }}>{done}</span>
            <span style={{ fontSize: 12, color: C.m }}> / {total}</span>
          </div>
          <PBar pct={done / total * 100} color={color} />
        </div>
        <div style={{ fontSize: 10, color: C.m }}>タップで経験済みをチェック</div>
      </Card>

      {categories.map(cat => {
        const catItems = items.filter(i => i.category === cat)
        const catDone = catItems.filter(i => data[i.id]).length

        return (
          <Card key={cat}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
              <CardT>{cat}</CardT>
              <span style={{ fontSize: 11, fontWeight: 600, color: catDone === catItems.length ? C.ok : C.m }}>
                {catDone}/{catItems.length}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {catItems.map(item => {
                const checked = data[item.id]
                return (
                  <div
                    key={item.id}
                    onClick={() => toggle(section, item.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px',
                      borderRadius: 8, cursor: 'pointer', transition: 'all .15s',
                      border: `1.5px solid ${checked ? color + '88' : C.br}`,
                      background: checked ? color + '10' : C.bg,
                    }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: 5, flexShrink: 0,
                      border: `2px solid ${checked ? color : C.br2}`,
                      background: checked ? color : 'transparent',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {checked && <span style={{ color: '#fff', fontSize: 11, fontWeight: 900 }}>✓</span>}
                    </div>
                    <span style={{
                      fontSize: 13, fontWeight: checked ? 600 : 400,
                      color: checked ? color : C.tx,
                    }}>
                      {item.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </Card>
        )
      })}
    </>
  )
}
