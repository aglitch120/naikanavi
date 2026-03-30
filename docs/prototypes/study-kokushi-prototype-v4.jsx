import { useState } from "react";

/* ═══ Design System ═══ */
const C = {
  bg: "#F5F4F0", s0: "#FEFEFC", s1: "#F0EDE7", s2: "#E8E5DF",
  br: "#DDD9D2", br2: "#C8C4BC",
  tx: "#1A1917", m: "#6B6760", m2: "#9B9790",
  ac: "#1B4F3A", acl: "#E8F0EC", ac2: "#155230",
  ok: "#166534", okl: "#DCFCE7", okb: "#86EFAC",
  wn: "#92400E", wnl: "#FEF3C7", wnb: "#FCD34D",
  dn: "#991B1B", dnl: "#FEE2E2", dnb: "#FCA5A5",
  ai: "#6C5CE7", aiSoft: "rgba(108,92,231,0.08)",
};
const mono = "'DM Mono','Courier New',monospace";

/* ═══ Components ═══ */
function Badge({ children, color = "default", style: s }) {
  const map = {
    default: { bg: C.s1, c: C.m }, accent: { bg: C.acl, c: C.ac },
    ok: { bg: C.okl, c: C.ok }, dn: { bg: C.dnl, c: C.dn },
    wn: { bg: C.wnl, c: C.wn }, ai: { bg: C.aiSoft, c: C.ai },
    pro: { bg: `linear-gradient(135deg,${C.ac},#2D6A4F)`, c: "#fff" },
  };
  const v = map[color] || map.default;
  return (
    <span style={{ display: "inline-flex", alignItems: "center", padding: "2px 8px", borderRadius: 6, fontSize: 11, fontWeight: 600, background: v.bg, color: v.c, whiteSpace: "nowrap", ...s }}>
      {children}
    </span>
  );
}

function ProgressRing({ value, size = 80, stroke = 5, color = C.ac }) {
  const r = (size - stroke) / 2;
  const ci = 2 * Math.PI * r;
  const off = ci - (value / 100) * ci;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={C.s2} strokeWidth={stroke} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeDasharray={ci} strokeDashoffset={off} strokeLinecap="round" style={{ transition: "stroke-dashoffset .8s cubic-bezier(.4,0,.2,1)" }} />
    </svg>
  );
}

function StatCard({ label, value, sub, trend, icon }) {
  return (
    <div style={{ background: C.s0, border: `1px solid ${C.br}`, borderRadius: 12, padding: "18px 20px", flex: 1, minWidth: 130 }}>
      <div style={{ fontSize: 11, color: C.m2, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 10 }}>{icon && <span style={{ marginRight: 6 }}>{icon}</span>}{label}</div>
      <div style={{ fontSize: 28, fontWeight: 700, color: C.tx, lineHeight: 1, fontFamily: mono }}>{value}</div>
      {sub && <div style={{ fontSize: 12, color: C.m, marginTop: 6 }}>{sub}</div>}
      {trend != null && <div style={{ fontSize: 11, color: trend > 0 ? C.ok : C.dn, marginTop: 4, fontWeight: 500 }}>{trend > 0 ? "↑" : "↓"}{Math.abs(trend)}%</div>}
    </div>
  );
}

function Card({ children, style: s, onClick, className: cn }) {
  return <div onClick={onClick} className={cn} style={{ background: C.s0, border: `1px solid ${C.br}`, borderRadius: 12, padding: 20, ...s }}>{children}</div>;
}

function GlowButton({ children, onClick, style: us, small }) {
  return (
    <span className="glow-wrap" style={{ position: "relative", display: "inline-flex", borderRadius: small ? 10 : 12, padding: 2, overflow: "hidden", cursor: "pointer", ...us }} onClick={onClick}>
      <span aria-hidden="true" className="glow-spinner" style={{ position: "absolute", top: "-50%", left: "-50%", width: "200%", height: "200%", background: "conic-gradient(from 0deg,transparent 30%,#2DB464 45%,#4ADE80 50%,#86EFAC 53%,#4ADE80 58%,#2DB464 65%,transparent 75%)", animation: "glowSpin 2.5s linear infinite" }} />
      <span style={{ position: "relative", zIndex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: small ? 8 : 10, background: C.ac, color: "#fff", padding: small ? "8px 16px" : "12px 24px", fontSize: small ? 12 : 13, fontWeight: 600, whiteSpace: "nowrap", width: "100%" }}>
        {children}
      </span>
    </span>
  );
}

const MARKS = [
  { key: "dbl", icon: "◎", color: "#6C5CE7", label: "完璧" },
  { key: "ok", icon: "○", color: C.ok, label: "正解" },
  { key: "tri", icon: "△", color: C.wn, label: "曖昧" },
  { key: "x", icon: "✕", color: C.dn, label: "不正解" },
  { key: "none", icon: "—", color: C.m2, label: "未演習" },
];

function MarkBar({ marks }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
      {MARKS.map(m => (
        <div key={m.key} style={{ display: "flex", alignItems: "center", gap: 3, fontSize: 11 }}>
          <span style={{ color: m.color, fontWeight: 700, fontSize: 12 }}>{m.icon}</span>
          <span style={{ color: C.m, fontFamily: mono }}>{marks[m.key] || 0}</span>
        </div>
      ))}
    </div>
  );
}

function MarkProgressBar({ marks, total }) {
  const parts = [
    { k: "dbl", c: "#6C5CE7" }, { k: "ok", c: C.ok }, { k: "tri", c: C.wn }, { k: "x", c: C.dn },
  ];
  return (
    <div style={{ height: 8, background: C.s2, borderRadius: 4, overflow: "hidden", display: "flex" }}>
      {parts.map(p => {
        const w = ((marks[p.k] || 0) / total) * 100;
        if (w <= 0) return null;
        return <div key={p.k} style={{ width: `${w}%`, height: "100%", background: p.c }} />;
      })}
    </div>
  );
}

/* ═══ Data ═══ */
const MODES = ["すべて", "医師国家試験", "CBT", "初期研修", "専攻医", "一般医師"];

const FIELDS = [
  { id: "A", label: "内科系メジャー", subs: [
    { id: "A1", label: "循環器", total: 420, done: 357, pct: 82, marks: { dbl: 89, ok: 180, tri: 52, x: 36, none: 63 } },
    { id: "A2", label: "呼吸器", total: 280, done: 182, pct: 68, marks: { dbl: 40, ok: 98, tri: 28, x: 16, none: 98 } },
    { id: "A3", label: "消化管", total: 310, done: 233, pct: 75, marks: { dbl: 65, ok: 120, tri: 30, x: 18, none: 77 } },
    { id: "A4", label: "肝胆膵", total: 220, done: 140, pct: 64, marks: { dbl: 30, ok: 72, tri: 24, x: 14, none: 80 } },
    { id: "A5", label: "腎・電解質", total: 190, done: 105, pct: 55, marks: { dbl: 18, ok: 52, tri: 22, x: 13, none: 85 } },
    { id: "A6", label: "内分泌", total: 200, done: 84, pct: 42, marks: { dbl: 10, ok: 38, tri: 20, x: 16, none: 116 } },
    { id: "A7", label: "血液", total: 180, done: 110, pct: 61, marks: { dbl: 22, ok: 55, tri: 20, x: 13, none: 70 } },
    { id: "A9", label: "感染症", total: 210, done: 140, pct: 67, marks: { dbl: 35, ok: 68, tri: 22, x: 15, none: 70 } },
    { id: "A10", label: "神経", total: 250, done: 113, pct: 48, marks: { dbl: 12, ok: 50, tri: 30, x: 21, none: 137 } },
  ] },
  { id: "B", label: "外科系・専門科", subs: [
    { id: "B1", label: "整形外科", total: 120, done: 50, pct: 42, marks: { dbl: 8, ok: 22, tri: 12, x: 8, none: 70 } },
    { id: "B5", label: "皮膚科", total: 95, done: 40, pct: 42, marks: { dbl: 6, ok: 18, tri: 10, x: 6, none: 55 } },
    { id: "B6", label: "精神科", total: 130, done: 65, pct: 50, marks: { dbl: 10, ok: 30, tri: 15, x: 10, none: 65 } },
  ] },
  { id: "C", label: "周産期・小児", subs: [
    { id: "C1", label: "産婦人科", total: 200, done: 56, pct: 28, marks: { dbl: 5, ok: 25, tri: 15, x: 11, none: 144 } },
    { id: "C2", label: "小児科", total: 180, done: 55, pct: 31, marks: { dbl: 5, ok: 22, tri: 16, x: 12, none: 125 } },
  ] },
  { id: "D", label: "横断領域", subs: [
    { id: "D1", label: "救急", total: 150, done: 82, pct: 55, marks: { dbl: 15, ok: 38, tri: 18, x: 11, none: 68 } },
    { id: "D3", label: "公衆衛生", total: 320, done: 192, pct: 60, marks: { dbl: 40, ok: 95, tri: 35, x: 22, none: 128 } },
  ] },
];

const EXAMS = [
  { year: 120, total: 400, done: 0, pct: 0 },
  { year: 119, total: 400, done: 368, pct: 76 },
  { year: 118, total: 400, done: 312, pct: 72 },
  { year: 117, total: 400, done: 260, pct: 65 },
  { year: 116, total: 400, done: 180, pct: 58 },
  { year: 115, total: 400, done: 120, pct: 52 },
];

const Q_LIST = [
  { id: "119A1", stem: "自己免疫性膵炎で誤っているのはどれか。", field: "肝胆膵", mark: "ok", last: "03/30" },
  { id: "119A2", stem: "68歳の男性。胸痛を主訴に来院した。2時間前…", field: "循環器", mark: "dbl", last: "03/29" },
  { id: "119A3", stem: "インフルエンザの治療薬として正しいのはどれか。", field: "感染症", mark: "tri", last: "03/28" },
  { id: "119A4", stem: "72歳の女性。歩行障害を主訴に来院した。", field: "神経", mark: "x", last: "03/27" },
  { id: "119A5", stem: "生後3日の新生児。全身の黄染を認める。", field: "小児科", mark: "ok", last: "03/26" },
  { id: "119A6", stem: "45歳の男性。心窩部痛と黒色便を主訴に来院。", field: "消化管", mark: "none", last: null },
  { id: "119A7", stem: "35歳の女性。動悸、体重減少、手指振戦。", field: "内分泌", mark: "ok", last: "03/25" },
  { id: "119A8", stem: "22歳の男性。「テレビが命令してくる」…", field: "精神科", mark: "dbl", last: "03/24" },
];

const MOCK_SETS = [
  { name: "苦手科目集中", count: 85, created: "03/28" },
  { name: "119回 要復習", count: 42, created: "03/25" },
];

const MOCK_DECKS = [
  { id: 1, name: "CBT基礎", cards: 150, due: 12, folder: "CBT" },
  { id: 2, name: "国試 循環器", cards: 86, due: 8, folder: "国試" },
  { id: 3, name: "国試 消化管", cards: 42, due: 3, folder: "国試" },
];

const DECK_FOLDERS = ["CBT", "国試", "カスタム"];

const CHAT_HISTORY = [
  { id: 1, title: "IgG4関連疾患の機序", date: "03/30", src: "119A1" },
  { id: 2, title: "循環器の苦手克服プラン", date: "03/29", src: "フリー" },
  { id: 3, title: "高K血症の対応順序", date: "03/27", src: "119A11" },
];

const NOTE_FOLDERS = ["循環器", "感染症", "国試メモ", "未整理"];
const NOTES = [
  { id: 1, title: "心不全まとめ", folder: "循環器", updated: "03/30", preview: "HFrEF: EF<40% / HFpEF: EF≥50%" },
  { id: 2, title: "抗菌薬一覧", folder: "感染症", updated: "03/29", preview: "ABPC→腸球菌 / AMPC→市中肺炎" },
  { id: 3, title: "119回メモ", folder: "国試メモ", updated: "03/28", preview: "119A4: iNPH Hakim三徴" },
];

const GEN_CARDS = [
  { front: "自己免疫性膵炎の画像所見は？", back: "びまん性膵腫大（ソーセージ様）+ capsule-like rim", type: "事実" },
  { front: "IgG4クラススイッチを誘導するサイトカインは？", back: "IL-4, IL-10, IL-13（Th2サイトカイン）", type: "機序" },
  { front: "AIP 1型 vs 2型の違い", back: "1型: IgG4関連, 高齢男性, 膵外病変\n2型: 好中球性, 若年, IBD合併", type: "鑑別" },
  { front: "AIPの治療 第一選択は？", back: "グルココルチコイド（ステロイド）", type: "事実" },
  { front: "AIP確定診断(ICDC)の要素は？", back: "①画像②血清学③膵外病変④病理⑤ステロイド反応性", type: "事実" },
];

/* ═══ Main App ═══ */
export default function IworStudyV4() {
  const [tab, setTab] = useState("dashboard");
  const [pView, setPView] = useState("field");
  const [examMode, setExamMode] = useState("すべて");
  const [drillField, setDrillField] = useState(null);
  const [showQList, setShowQList] = useState(null);
  const [activeQ, setActiveQ] = useState(false);
  const [selAns, setSelAns] = useState(null);
  const [showRes, setShowRes] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const [showCardGen, setShowCardGen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [cardFlipped, setCardFlipped] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatTab, setChatTab] = useState("free");
  const [statsTab, setStatsTab] = useState("kokushi");
  const [noteFolder, setNoteFolder] = useState(null);
  const [noteEdit, setNoteEdit] = useState(null);
  const [noteText, setNoteText] = useState("");
  const [deckView, setDeckView] = useState("list");
  const [deckPicker, setDeckPicker] = useState(null);
  const [showAddCards, setShowAddCards] = useState(false);
  const [cardsTab, setCardsTab] = useState("mine"); // mine | shared
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [sidebarHover, setSidebarHover] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dashKokushiMetric, setDashKokushiMetric] = useState("count"); // count | rate
  const [dashKokushiPeriod, setDashKokushiPeriod] = useState("week"); // day | week | month | year
  const [dashFieldMetric, setDashFieldMetric] = useState("rate"); // rate | progress
  const [dashFieldPeriod, setDashFieldPeriod] = useState("week");

  const sidebarVisible = !sidebarCollapsed || sidebarHover;

  const resetAll = () => {
    setActiveQ(false); setSelAns(null); setShowRes(false); setShowAI(false);
    setShowCardGen(false); setShowQList(null); setSelectMode(false);
    setSelected(new Set()); setShowSearch(false); setDrillField(null);
    setDeckPicker(null); setShowAddCards(false);
  };

  const totalQ = FIELDS.reduce((s, f) => s + f.subs.reduce((ss, sub) => ss + sub.total, 0), 0);
  const totalDone = FIELDS.reduce((s, f) => s + f.subs.reduce((ss, sub) => ss + sub.done, 0), 0);

  const navItems = [
    { id: "dashboard", icon: "◫", label: "ダッシュボード" },
    { id: "practice", icon: "✎", label: "演習" },
    { id: "cards", icon: "⊞", label: "暗記カード" },
    { id: "stats", icon: "◔", label: "統計" },
    { id: "chat", icon: "◇", label: "iwor AI" },
    { id: "notes", icon: "☰", label: "ノート" },
  ];

  /* ── Question List reusable ── */
  function renderQList(title, onBack) {
    return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
          <button onClick={onBack} style={{ background: "none", border: "none", color: C.m, cursor: "pointer", fontSize: 13 }}>← 戻る</button>
          <span style={{ fontSize: 16, fontWeight: 700 }}>{title}</span>
          <div style={{ marginLeft: "auto", display: "flex", gap: 8 }}>
            {!selectMode ? (
              <button onClick={() => setSelectMode(true)} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.br}`, background: C.s0, fontSize: 12, cursor: "pointer" }}>選択モード</button>
            ) : (
              <>
                <button onClick={() => { const all = new Set(Q_LIST.map(q => q.id)); setSelected(all); }} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.br}`, background: C.s0, fontSize: 12, cursor: "pointer" }}>全選択</button>
                <button style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: C.ac, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>セットに追加 ({selected.size})</button>
                <button onClick={() => { setSelectMode(false); setSelected(new Set()); }} style={{ padding: "6px 14px", borderRadius: 8, border: `1px solid ${C.br}`, background: C.s0, fontSize: 12, cursor: "pointer", color: C.dn }}>キャンセル</button>
              </>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
          {MARKS.map(mk => (
            <button key={mk.key} style={{ padding: "5px 12px", borderRadius: 8, border: `1px solid ${C.br}`, background: C.s0, fontSize: 12, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ color: mk.color, fontWeight: 700 }}>{mk.icon}</span> {mk.label}
            </button>
          ))}
        </div>
        <div style={{ background: C.s0, border: `1px solid ${C.br}`, borderRadius: 12, overflow: "hidden" }}>
          <div style={{ display: "grid", gridTemplateColumns: selectMode ? "40px 50px 70px 1fr 60px 60px" : "50px 70px 1fr 60px 60px 30px", padding: "10px 16px", borderBottom: `1px solid ${C.br}`, fontSize: 11, color: C.m2 }}>
            {selectMode && <span></span>}<span>#</span><span>番号</span><span>問題文</span><span>マーク</span><span>最終</span>{!selectMode && <span></span>}
          </div>
          {Q_LIST.map((q, i) => {
            const mk = MARKS.find(m => m.key === q.mark);
            return (
              <div key={q.id}
                onClick={() => { if (selectMode) { const n = new Set(selected); if (n.has(q.id)) n.delete(q.id); else n.add(q.id); setSelected(n); } else setActiveQ(true); }}
                className="row-hover"
                style={{ display: "grid", gridTemplateColumns: selectMode ? "40px 50px 70px 1fr 60px 60px" : "50px 70px 1fr 60px 60px 30px", padding: "12px 16px", borderBottom: `1px solid ${C.br}`, alignItems: "center", cursor: "pointer", fontSize: 13, background: selected.has(q.id) ? C.acl : undefined }}>
                {selectMode && <span><input type="checkbox" checked={selected.has(q.id)} readOnly style={{ accentColor: C.ac }} /></span>}
                <span style={{ color: C.m2, fontFamily: mono, fontSize: 12 }}>{i + 1}</span>
                <span style={{ color: C.ac, fontWeight: 600, fontSize: 12, fontFamily: mono }}>{q.id}</span>
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", paddingRight: 12 }}>{q.stem}</span>
                <span style={{ color: mk?.color, fontWeight: 700, fontSize: 14, textAlign: "center" }}>{mk?.icon}</span>
                <span style={{ fontSize: 11, color: C.m2 }}>{q.last || "—"}</span>
                {!selectMode && <span style={{ color: C.m2 }}>›</span>}
              </div>
            );
          })}
        </div>
        {!selectMode && (
          <div style={{ marginTop: 16, display: "flex", gap: 10 }}>
            <button style={{ flex: 1, padding: "12px", borderRadius: 9, border: `1.5px solid ${C.br}`, background: C.s0, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>✕ のみ</button>
            <button style={{ flex: 1, padding: "12px", borderRadius: 9, border: `1.5px solid ${C.br}`, background: C.s0, fontSize: 13, fontWeight: 600, cursor: "pointer" }}>シャッフル</button>
            <button onClick={() => setActiveQ(true)} style={{ flex: 1, padding: "12px", borderRadius: 9, border: "none", background: C.ac, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>▶ 演習開始</button>
          </div>
        )}
      </div>
    );
  }

  /* ── Tab buttons helper ── */
  function TabBar({ items, active, onChange }) {
    return (
      <div style={{ display: "flex", gap: 0, marginBottom: 24, borderBottom: `2px solid ${C.br}` }}>
        {items.map(([k, l]) => (
          <button key={k} onClick={() => onChange(k)} style={{ padding: "10px 20px", border: "none", background: "transparent", fontSize: 13, fontWeight: active === k ? 600 : 500, color: active === k ? C.ac : C.m, cursor: "pointer", borderBottom: active === k ? `2px solid ${C.ac}` : "2px solid transparent", marginBottom: -2 }}>
            {l}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="iwor-study-root" style={{ fontFamily: "'Noto Sans JP','Hiragino Sans',-apple-system,sans-serif", background: C.bg, color: C.tx, minHeight: "100vh", display: "flex", WebkitFontSmoothing: "antialiased" }}>

      {/* NOTE: This component sits inside iwor.jp's existing layout.
          The parent provides Header (AppHeader) and BottomNav.
          This component does NOT render its own top-level header/footer on mobile —
          it relies on the parent's. The mobile-header here is study-specific
          and can be hidden if the parent already shows navigation. */}

      {/* ── Mobile Header ── */}
      <div className="mobile-header" style={{ display: "none", position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: C.s0, borderBottom: `1px solid ${C.br}`, padding: "10px 16px", alignItems: "center", gap: 12 }}>
        <button onClick={() => setMobileMenuOpen(true)} style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke={C.tx} strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="19" y2="6"/><line x1="3" y1="11" x2="19" y2="11"/><line x1="3" y1="16" x2="19" y2="16"/></svg>
        </button>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: C.ac, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: "#fff" }}>i</div>
        <span style={{ fontSize: 13, fontWeight: 600, flex: 1 }}>{navItems.find(n => n.id === tab)?.label}</span>
        <Badge color="pro" style={{ fontSize: 9, padding: "1px 6px" }}>PRO</Badge>
      </div>

      {/* ── Mobile Overlay ── */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" style={{ position: "fixed", inset: 0, zIndex: 200 }}>
          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.3)" }} onClick={() => setMobileMenuOpen(false)} />
          <div style={{ position: "absolute", top: 0, left: 0, bottom: 0, width: 260, background: C.s0, padding: "20px 16px", display: "flex", flexDirection: "column", gap: 2, boxShadow: "4px 0 20px rgba(0,0,0,0.1)", overflowY: "auto", animation: "slideRight 0.2s ease" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 4px", marginBottom: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 9, background: C.ac, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>i</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>iwor study</div>
                  <div style={{ fontSize: 10, color: C.m2, fontWeight: 500 }}>{examMode}</div>
                </div>
              </div>
              <button onClick={() => setMobileMenuOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 18, color: C.m, padding: 4 }}>✕</button>
            </div>
            {navItems.map(it => (
              <button key={it.id} onClick={() => { setTab(it.id); resetAll(); setPView("field"); setDeckView("list"); setMobileMenuOpen(false); }}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 14px", borderRadius: 10, border: "none", background: tab === it.id ? C.acl : "transparent", color: tab === it.id ? C.ac : C.m, fontSize: 14, fontWeight: tab === it.id ? 600 : 500, cursor: "pointer", textAlign: "left", width: "100%" }}>
                <span style={{ fontSize: 16, width: 22, textAlign: "center", opacity: 0.7 }}>{it.icon}</span>
                {it.label}
                {it.id === "chat" && <Badge color="ai" style={{ marginLeft: "auto", fontSize: 9, padding: "1px 6px" }}>AI</Badge>}
              </button>
            ))}
            <div style={{ marginTop: "auto", padding: 12, borderTop: `1px solid ${C.br}` }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                <span style={{ fontSize: 11, color: C.m2 }}>クレジット</span>
                <Badge color="pro" style={{ fontSize: 9, padding: "1px 6px" }}>PRO</Badge>
              </div>
              <div style={{ fontSize: 22, fontWeight: 700, fontFamily: mono }}>247<span style={{ fontSize: 12, fontWeight: 400, color: C.m2 }}> / 300</span></div>
              <div style={{ height: 3, background: C.s2, borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
                <div style={{ width: "82%", height: "100%", background: C.ac, borderRadius: 2 }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Hover zone (when collapsed) ── */}
      {sidebarCollapsed && !sidebarHover && (
        <div
          onMouseEnter={() => setSidebarHover(true)}
          style={{ position: "fixed", top: 0, left: 0, width: 8, height: "100vh", zIndex: 50, cursor: "e-resize" }}
        />
      )}

      {/* ── Sidebar (PC) ── */}
      <nav
        className="sidebar"
        onMouseEnter={() => { if (sidebarCollapsed) setSidebarHover(true); }}
        onMouseLeave={() => { if (sidebarCollapsed) setSidebarHover(false); }}
        style={{
          width: sidebarVisible ? 220 : 0,
          minWidth: sidebarVisible ? 220 : 0,
          borderRight: sidebarVisible ? `1px solid ${C.br}` : "none",
          padding: sidebarVisible ? "20px 12px" : 0,
          display: "flex", flexDirection: "column", gap: 2, flexShrink: 0,
          position: sidebarCollapsed ? "fixed" : "sticky",
          top: 0, left: 0, height: "100vh", boxSizing: "border-box",
          background: C.s0, overflowY: "auto", overflowX: "hidden",
          transition: "width 0.2s ease, min-width 0.2s ease, padding 0.2s ease",
          zIndex: sidebarCollapsed ? 60 : "auto",
          boxShadow: sidebarCollapsed && sidebarHover ? "4px 0 20px rgba(0,0,0,0.08)" : "none",
          opacity: sidebarVisible ? 1 : 0,
        }}
      >
        <div style={{ padding: "8px 12px", marginBottom: 16, display: "flex", alignItems: "center", gap: 10, minWidth: 196 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: C.ac, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#fff" }}>i</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600 }}>iwor study</div>
            <div style={{ fontSize: 10, color: C.m2, fontWeight: 500 }}>{examMode}</div>
          </div>
          {/* Collapse toggle */}
          <button
            onClick={() => { setSidebarCollapsed(!sidebarCollapsed); setSidebarHover(false); }}
            title={sidebarCollapsed ? "サイドバーを固定" : "フォーカスモード"}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: C.m2, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: 6, transition: "background 0.15s" }}
            className="collapse-btn"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              {sidebarCollapsed
                ? <><line x1="3" y1="3" x2="3" y2="13"/><polyline points="7,6 10,8 7,10"/></>
                : <><line x1="3" y1="3" x2="3" y2="13"/><polyline points="10,6 7,8 10,10"/></>
              }
            </svg>
          </button>
        </div>

        {navItems.map(it => (
          <button key={it.id} onClick={() => { setTab(it.id); resetAll(); setPView("field"); setDeckView("list"); }}
            className="nav-btn"
            style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", background: tab === it.id ? C.acl : "transparent", color: tab === it.id ? C.ac : C.m, fontSize: 13, fontWeight: tab === it.id ? 600 : 500, cursor: "pointer", textAlign: "left", width: "100%", minWidth: 196, whiteSpace: "nowrap" }}>
            <span style={{ fontSize: 14, width: 20, textAlign: "center", opacity: 0.7 }}>{it.icon}</span>
            {it.label}
            {it.id === "chat" && <Badge color="ai" style={{ marginLeft: "auto", fontSize: 9, padding: "1px 6px" }}>AI</Badge>}
          </button>
        ))}

        <div style={{ marginTop: "auto", padding: 12, borderTop: `1px solid ${C.br}`, minWidth: 196 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 11, color: C.m2 }}>クレジット</span>
            <Badge color="pro" style={{ fontSize: 9, padding: "1px 6px" }}>PRO</Badge>
          </div>
          <div style={{ fontSize: 22, fontWeight: 700, fontFamily: mono }}>247<span style={{ fontSize: 12, fontWeight: 400, color: C.m2 }}> / 300</span></div>
          <div style={{ height: 3, background: C.s2, borderRadius: 2, marginTop: 8, overflow: "hidden" }}>
            <div style={{ width: "82%", height: "100%", background: C.ac, borderRadius: 2 }} />
          </div>
        </div>
      </nav>

      {/* ── Main ── */}
      <main className="main-content" style={{ flex: 1, padding: "32px 44px", maxWidth: 960, minWidth: 0, overflowY: "auto" }}>

        {/* ═══ DASHBOARD ═══ */}
        {tab === "dashboard" && (
          <div className="fade-in">
            <div style={{ marginBottom: 24 }}>
              <div style={{ fontSize: 11, color: C.m2, fontWeight: 500, letterSpacing: ".06em", textTransform: "uppercase", marginBottom: 8 }}>2026年3月31日（火）</div>
              <h1 style={{ fontSize: 28, fontWeight: 700, margin: 0 }}>おかえりなさい</h1>
              <p style={{ fontSize: 14, color: C.m, margin: "8px 0 0" }}>国試まであと<span style={{ color: C.ac, fontWeight: 700 }}>315日</span></p>
            </div>

            {/* ── 国試演習 ── */}
            <div style={{ fontSize: 12, fontWeight: 600, color: C.m, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>✎ 国試演習</div>
            <Card style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", gap: 24, flexWrap: "wrap" }}>
                {/* Left: Bar chart */}
                <div style={{ flex: "1 1 380px", minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <div style={{ display: "flex", background: C.s1, borderRadius: 8, padding: 2 }}>
                      {[["count", "演習数"], ["rate", "正答率"]].map(([k, l]) => (
                        <button key={k} onClick={() => setDashKokushiMetric(k)} style={{ padding: "5px 14px", borderRadius: 6, border: "none", background: dashKokushiMetric === k ? C.s0 : "transparent", color: dashKokushiMetric === k ? C.tx : C.m, fontSize: 12, fontWeight: dashKokushiMetric === k ? 600 : 500, cursor: "pointer", boxShadow: dashKokushiMetric === k ? "0 1px 3px rgba(0,0,0,0.06)" : "none" }}>{l}</button>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: 2 }}>
                      {[["day", "日"], ["week", "週"], ["month", "月"], ["year", "年"]].map(([k, l]) => (
                        <button key={k} onClick={() => setDashKokushiPeriod(k)} style={{ padding: "4px 10px", borderRadius: 6, border: "none", background: dashKokushiPeriod === k ? C.acl : "transparent", color: dashKokushiPeriod === k ? C.ac : C.m2, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>{l}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 130, padding: "0 4px" }}>
                    {(dashKokushiPeriod === "day" ? [8, 22, 15, 30, 18, 25, 24] : dashKokushiPeriod === "week" ? [95, 120, 142, 88, 110, 135, 142] : dashKokushiPeriod === "month" ? [380, 420, 510, 480] : [2400, 3200, 4100]).map((v, i, arr) => {
                      const max = Math.max(...arr);
                      const barH = Math.max(4, Math.round((v / max) * 90));
                      const isLast = i === arr.length - 1;
                      const rateVal = [58, 63, 55, 72, 60, 68, 71, 65, 70, 74, 69, 71][i] || 65;
                      return (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
                          <span style={{ fontSize: 10, color: isLast ? C.ac : C.m2, fontWeight: isLast ? 600 : 400, fontFamily: mono }}>
                            {dashKokushiMetric === "rate" ? rateVal + "%" : v}
                          </span>
                          <div style={{ width: "100%", maxWidth: 40, height: barH, background: isLast ? C.ac : C.s2, borderRadius: 4, transition: "height 0.4s ease" }} />
                          <span style={{ fontSize: 9, color: C.m2 }}>
                            {dashKokushiPeriod === "day" ? ["月", "火", "水", "木", "金", "土", "日"][i] : dashKokushiPeriod === "week" ? `W${i + 1}` : dashKokushiPeriod === "month" ? `${i + 1}月` : `${2024 + i}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 12, paddingTop: 12, borderTop: `1px solid ${C.br}` }}>
                    <div>
                      <span style={{ fontSize: 24, fontWeight: 700, fontFamily: mono }}>{dashKokushiMetric === "count" ? "142" : "71%"}</span>
                      <span style={{ fontSize: 12, color: C.m, marginLeft: 6 }}>{dashKokushiMetric === "count" ? "問（今週）" : "全科目平均"}</span>
                    </div>
                    <div style={{ fontSize: 11, color: C.ok, fontWeight: 500 }}>↑ {dashKokushiMetric === "count" ? "12" : "3"}% vs 先週</div>
                  </div>
                </div>

                {/* Right: Progress ring */}
                <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", padding: "0 8px", borderLeft: `1px solid ${C.br}`, minWidth: 160 }}>
                  <div style={{ fontSize: 11, color: C.m2, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 12 }}>全問進捗</div>
                  <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ProgressRing value={Math.round(totalDone / totalQ * 100)} size={100} stroke={6} />
                    <div style={{ position: "absolute", textAlign: "center" }}>
                      <div style={{ fontSize: 24, fontWeight: 700, fontFamily: mono }}>{Math.round(totalDone / totalQ * 100)}%</div>
                      <div style={{ fontSize: 10, color: C.m2 }}>{totalDone.toLocaleString()} / {totalQ.toLocaleString()}</div>
                    </div>
                  </div>
                  <button onClick={() => { setTab("practice"); setPView("field"); }} style={{ width: "100%", padding: "8px 16px", borderRadius: 8, border: "none", background: C.ac, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 12 }}>演習を始める</button>
                </div>
              </div>
            </Card>

            {/* ── 暗記カード ── */}
            <div style={{ fontSize: 12, fontWeight: 600, color: C.m, marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>⊞ 暗記カード</div>
            <Card style={{ marginBottom: 24 }}>
              <div style={{ display: "flex", gap: 20, flexWrap: "wrap", alignItems: "center" }}>
                <div style={{ display: "flex", gap: 12, flex: "1 1 300px", flexWrap: "wrap" }}>
                  <StatCard icon="⊞" label="今日の復習" value="38" sub="枚" />
                  <StatCard label="カード総数" value="278" sub="枚" />
                  <StatCard icon="🔥" label="連続学習" value="14" sub="日" />
                </div>
                <div style={{ flex: "0 0 auto", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "0 8px", borderLeft: `1px solid ${C.br}`, minWidth: 140 }}>
                  <div style={{ fontSize: 11, color: C.m2, fontWeight: 500, letterSpacing: ".04em", textTransform: "uppercase", marginBottom: 10 }}>今日の復習</div>
                  <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <ProgressRing value={42} size={80} stroke={5} color="#6C5CE7" />
                    <div style={{ position: "absolute", textAlign: "center" }}>
                      <div style={{ fontSize: 20, fontWeight: 700, fontFamily: mono }}>16</div>
                      <div style={{ fontSize: 9, color: C.m2 }}>/ 38枚</div>
                    </div>
                  </div>
                  <button onClick={() => { setTab("cards"); setDeckView("review"); }} style={{ width: "100%", padding: "7px 16px", borderRadius: 8, border: "none", background: C.ac, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", marginTop: 10 }}>復習を始める</button>
                </div>
              </div>
            </Card>

            {/* ── 科目別 ── */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>科目別</span>
                  {/* Metric toggle */}
                  <div style={{ display: "flex", background: C.s1, borderRadius: 8, padding: 2 }}>
                    {[["rate", "正答率"], ["progress", "演習進捗"]].map(([k, l]) => (
                      <button key={k} onClick={() => setDashFieldMetric(k)} style={{ padding: "4px 12px", borderRadius: 6, border: "none", background: dashFieldMetric === k ? C.s0 : "transparent", color: dashFieldMetric === k ? C.tx : C.m, fontSize: 11, fontWeight: dashFieldMetric === k ? 600 : 500, cursor: "pointer", boxShadow: dashFieldMetric === k ? "0 1px 3px rgba(0,0,0,0.06)" : "none" }}>{l}</button>
                    ))}
                  </div>
                </div>
                {/* Period toggle */}
                <div style={{ display: "flex", gap: 2 }}>
                  {[["day", "日"], ["week", "週"], ["month", "月"], ["year", "年"]].map(([k, l]) => (
                    <button key={k} onClick={() => setDashFieldPeriod(k)} style={{ padding: "3px 8px", borderRadius: 6, border: "none", background: dashFieldPeriod === k ? C.acl : "transparent", color: dashFieldPeriod === k ? C.ac : C.m2, fontSize: 11, fontWeight: 500, cursor: "pointer" }}>{l}</button>
                  ))}
                </div>
              </div>
              {FIELDS[0].subs.map(s => (
                <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0" }}>
                  <div style={{ width: 72, fontSize: 12, color: C.m, textAlign: "right", fontWeight: 500 }}>{s.label}</div>
                  <div style={{ flex: 1, height: 6, background: C.s2, borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ width: `${dashFieldMetric === "rate" ? s.pct : Math.round(s.done / s.total * 100)}%`, height: "100%", borderRadius: 3, background: (() => { const v = dashFieldMetric === "rate" ? s.pct : Math.round(s.done / s.total * 100); return v >= 70 ? C.ok : v >= 50 ? C.ac : v >= 30 ? C.wn : C.dn; })(), transition: "width 0.4s ease" }} />
                  </div>
                  <div style={{ width: 40, fontSize: 12, fontWeight: 600, fontFamily: mono, textAlign: "right" }}>
                    {dashFieldMetric === "rate" ? `${s.pct}%` : `${Math.round(s.done / s.total * 100)}%`}
                  </div>
                  <div style={{ width: 60, fontSize: 11, color: C.m2, fontFamily: mono }}>
                    {dashFieldMetric === "rate" ? "" : `${s.done}/${s.total}`}
                  </div>
                </div>
              ))}
              <div style={{ fontSize: 12, color: C.ac, marginTop: 12, cursor: "pointer", fontWeight: 500 }} onClick={() => { setTab("practice"); setPView("field"); }}>全科目を表示 →</div>
            </Card>
          </div>
        )}

        {/* ═══ PRACTICE — Browse ═══ */}
        {tab === "practice" && !activeQ && !showQList && !showSearch && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>演習</h1>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setShowSearch(true)} style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.br}`, background: C.s0, fontSize: 12, cursor: "pointer" }}>🔍 検索</button>
                <Badge color="accent" style={{ fontSize: 12, padding: "4px 10px" }}>{totalDone.toLocaleString()} / {totalQ.toLocaleString()}</Badge>
              </div>
            </div>
            {/* Mode pills */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              {MODES.map(m => (
                <button key={m} onClick={() => setExamMode(m)} style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${examMode === m ? C.ac : C.br}`, background: examMode === m ? C.acl : "transparent", color: examMode === m ? C.ac : C.m, fontSize: 12, fontWeight: examMode === m ? 600 : 500, cursor: "pointer" }}>{m}</button>
              ))}
            </div>
            <TabBar items={[["field", "分野別"], ["exam", "回数別"], ["sets", "問題セット"]]} active={pView} onChange={(k) => { setPView(k); setDrillField(null); }} />

            {/* 分野別 — groups */}
            {pView === "field" && !drillField && FIELDS.map(g => {
              const gt = g.subs.reduce((s, sub) => s + sub.total, 0);
              const gd = g.subs.reduce((s, sub) => s + sub.done, 0);
              const gm = g.subs.reduce((s, sub) => ({ dbl: s.dbl + (sub.marks.dbl || 0), ok: s.ok + (sub.marks.ok || 0), tri: s.tri + (sub.marks.tri || 0), x: s.x + (sub.marks.x || 0), none: s.none + (sub.marks.none || 0) }), { dbl: 0, ok: 0, tri: 0, x: 0, none: 0 });
              return (
                <Card key={g.id} style={{ cursor: "pointer", padding: "16px 20px", marginBottom: 10 }} className="card-hover" onClick={() => setDrillField(g.id)}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 700, color: C.ac, fontFamily: mono }}>{g.id}</span>
                      <span style={{ fontWeight: 600 }}>{g.label}</span>
                      <span style={{ fontSize: 12, color: C.m }}>({gt})</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <MarkBar marks={gm} />
                      <span style={{ fontWeight: 700, color: C.ac, fontFamily: mono, fontSize: 12 }}>{gd}/{gt}</span>
                      <span style={{ color: C.m2 }}>›</span>
                    </div>
                  </div>
                  <MarkProgressBar marks={gm} total={gt} />
                </Card>
              );
            })}

            {/* 分野別 — sub-fields */}
            {pView === "field" && drillField && (() => {
              const g = FIELDS.find(f => f.id === drillField);
              if (!g) return null;
              return (
                <div>
                  <button onClick={() => setDrillField(null)} style={{ background: "none", border: "none", color: C.m, cursor: "pointer", fontSize: 13, marginBottom: 16 }}>← 分野一覧</button>
                  <h2 style={{ fontSize: 18, fontWeight: 700, margin: "0 0 16px" }}>{g.id} {g.label}</h2>
                  {g.subs.map(sub => (
                    <Card key={sub.id} style={{ cursor: "pointer", padding: "14px 18px", marginBottom: 8 }} className="card-hover" onClick={() => setShowQList(sub.label)}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontSize: 12, fontFamily: mono, color: C.m }}>{sub.id}</span>
                          <span style={{ fontWeight: 600 }}>{sub.label}</span>
                          <span style={{ fontSize: 12, color: C.m }}>({sub.total})</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <span style={{ fontWeight: 700, color: sub.pct >= 70 ? C.ok : sub.pct >= 50 ? C.wn : C.dn, fontFamily: mono }}>{sub.pct}%</span>
                          <span style={{ fontSize: 12, color: C.m, fontFamily: mono }}>{sub.done}/{sub.total}</span>
                          <span style={{ color: C.m2 }}>›</span>
                        </div>
                      </div>
                      <MarkProgressBar marks={sub.marks} total={sub.total} />
                    </Card>
                  ))}
                </div>
              );
            })()}

            {/* 回数別 */}
            {pView === "exam" && EXAMS.map(ex => (
              <Card key={ex.year} style={{ cursor: "pointer", padding: "14px 18px", marginBottom: 8 }} className="card-hover" onClick={() => setShowQList(`第${ex.year}回`)}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, fontFamily: mono }}>第{ex.year}回</span>
                    <span style={{ fontSize: 12, color: C.m }}>({ex.total}問)</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {ex.done > 0 && <span style={{ fontWeight: 700, color: ex.pct >= 70 ? C.ok : C.wn, fontFamily: mono }}>{ex.pct}%</span>}
                    <span style={{ fontSize: 12, color: C.m, fontFamily: mono }}>{ex.done}/{ex.total}</span>
                    <span style={{ color: C.m2 }}>›</span>
                  </div>
                </div>
                <div style={{ height: 6, background: C.s2, borderRadius: 3, overflow: "hidden" }}>
                  <div style={{ width: `${(ex.done / ex.total) * 100}%`, height: "100%", borderRadius: 3, background: ex.pct >= 70 ? C.ok : C.ac }} />
                </div>
              </Card>
            ))}

            {/* 問題セット */}
            {pView === "sets" && (
              <div>
                <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
                  <button style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: C.ac, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ 新規作成</button>
                </div>
                {MOCK_SETS.map((s, i) => (
                  <Card key={i} style={{ cursor: "pointer", padding: "14px 18px", marginBottom: 8 }} className="card-hover" onClick={() => setShowQList(s.name)}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{s.name}</div>
                        <div style={{ fontSize: 11, color: C.m2, marginTop: 2 }}>{s.count}問 · {s.created}</div>
                      </div>
                      <span style={{ color: C.m2 }}>›</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Question List */}
        {tab === "practice" && showQList && !activeQ && (
          <div className="fade-in">
            {renderQList(showQList, () => { setShowQList(null); setSelectMode(false); setSelected(new Set()); })}
          </div>
        )}

        {/* Search */}
        {tab === "practice" && showSearch && !activeQ && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button onClick={() => setShowSearch(false)} style={{ background: "none", border: "none", color: C.m, cursor: "pointer", fontSize: 13 }}>← 演習</button>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>問題検索</h2>
            </div>
            <div style={{ display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <input placeholder="問題番号や疾患名で検索" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${C.br}`, background: C.s0, fontSize: 14, outline: "none", marginBottom: 16 }} />
                {renderQList(`検索結果: ${Q_LIST.length}問`, () => {})}
              </div>
              <div style={{ width: 250, flexShrink: 0 }}>
                <Card style={{ padding: 16, position: "sticky", top: 32 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12 }}>絞り込み</div>
                  {[
                    ["結果", MARKS.filter(m => m.key !== "none").map(m => m.icon)],
                    ["形式", ["必修", "総論", "各論", "一般", "臨床"]],
                    ["回数", ["最新3回", "最新5回", "最新10回"]],
                    ["特性", ["2つ選べ", "計算", "画像あり"]],
                  ].map(([label, chips]) => (
                    <div key={label} style={{ marginBottom: 14 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.m, marginBottom: 6 }}>{label}</div>
                      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                        {chips.map(c => (
                          <button key={c} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.br}`, background: C.s0, fontSize: 11, cursor: "pointer" }}>{c}</button>
                        ))}
                      </div>
                    </div>
                  ))}
                  <div style={{ fontSize: 12, fontWeight: 600, color: C.m, marginBottom: 6 }}>正答率</div>
                  <input type="range" min={0} max={100} defaultValue={50} style={{ width: "100%", accentColor: C.ac, marginBottom: 14 }} />
                  <div style={{ display: "flex", gap: 8 }}>
                    <button style={{ flex: 1, padding: "8px", borderRadius: 8, border: `1px solid ${C.br}`, background: C.s0, fontSize: 12, cursor: "pointer" }}>リセット</button>
                    <button style={{ flex: 1, padding: "8px", borderRadius: 8, border: "none", background: C.ac, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>検索</button>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* ═══ ACTIVE QUESTION ═══ */}
        {tab === "practice" && activeQ && !showAI && !showCardGen && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20, position: "sticky", top: 0, background: C.bg, paddingBottom: 12, zIndex: 10 }}>
              <button onClick={resetAll} style={{ background: "none", border: "none", color: C.m, cursor: "pointer", fontSize: 13 }}>← 戻る</button>
              <Badge>119A1</Badge>
              <Badge color="accent">肝胆膵</Badge>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 12, color: C.m2, fontFamily: mono }}>1 / 24</span>
                {showRes && <button onClick={() => { setSelAns(null); setShowRes(false); }} style={{ padding: "8px 18px", borderRadius: 8, border: "none", background: C.ac, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>次の問題 →</button>}
              </div>
            </div>

            <h2 style={{ fontSize: 17, fontWeight: 500, lineHeight: 1.75, margin: "0 0 24px" }}>自己免疫性膵炎で誤っているのはどれか。</h2>

            {[
              { l: "a", t: "膵の萎縮を認める。", correct: true },
              { l: "b", t: "高齢男性に好発する。" },
              { l: "c", t: "病理で線維化を認める。" },
              { l: "d", t: "IgG4関連疾患に含まれる。" },
              { l: "e", t: "グルココルチコイド投与が第一選択。" },
            ].map(opt => {
              const sel = selAns === opt.l;
              const rev = showRes;
              let bg = C.s0, bd = C.br, lc = C.m;
              if (rev && opt.correct) { bg = C.okl; bd = C.okb; lc = C.ok; }
              else if (rev && sel && !opt.correct) { bg = C.dnl; bd = C.dnb; lc = C.dn; }
              else if (sel && !rev) { bg = C.acl; bd = C.ac; lc = C.ac; }
              return (
                <button key={opt.l}
                  onClick={() => { if (!showRes) { setSelAns(opt.l); setTimeout(() => setShowRes(true), 400); } }}
                  className="choice-btn"
                  style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "14px 18px", borderRadius: 10, border: `1.5px solid ${bd}`, background: bg, fontSize: 14, cursor: showRes ? "default" : "pointer", textAlign: "left", lineHeight: 1.65, width: "100%", marginBottom: 8, color: C.tx }}>
                  <span style={{ width: 26, height: 26, borderRadius: 7, border: `1.5px solid ${lc}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700, color: lc, flexShrink: 0, marginTop: 1 }}>
                    {rev && opt.correct ? "✓" : rev && sel && !opt.correct ? "✕" : opt.l}
                  </span>
                  <span>{opt.t}</span>
                </button>
              );
            })}

            {showRes && (
              <div className="fade-in">
                <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 12, color: C.m }}>自己評価：</span>
                  {MARKS.filter(m => m.key !== "none").map(mk => (
                    <button key={mk.key} className="rating-btn" style={{ width: 36, height: 36, borderRadius: 8, border: `1.5px solid ${C.br}`, background: C.s0, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", fontSize: 16, color: mk.color, fontWeight: 700 }}>{mk.icon}</button>
                  ))}
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
                  <GlowButton onClick={() => setShowAI(true)} style={{ flex: 1 }}>◇ AIに深掘り <span style={{ fontSize: 10, opacity: 0.7 }}>3cr</span></GlowButton>
                  <GlowButton onClick={() => setShowCardGen(true)} style={{ flex: 1 }}>⊞ カード生成 <span style={{ fontSize: 10, opacity: 0.7 }}>2cr</span></GlowButton>
                </div>

                <Card style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                    <span style={{ color: C.ok, fontWeight: 600 }}>正解：a</span>
                    <Badge color="ai" style={{ marginLeft: "auto" }}>AI生成</Badge>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.8, color: C.m, margin: "0 0 16px" }}>
                    自己免疫性膵炎ではびまん性の<span style={{ color: C.tx, fontWeight: 600 }}>膵腫大（ソーセージ様）</span>が典型。萎縮は慢性膵炎の所見。
                  </p>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10 }}>選択肢解説</div>
                  {[
                    { l: "a", t: "膵の萎縮を認める。", ex: "AIPではびまん性膵腫大が典型。萎縮は慢性膵炎。→誤り", wrong: true },
                    { l: "b", t: "高齢男性に好発する。", ex: "50〜60歳代男性、男女比3〜4:1。正しい。" },
                    { l: "c", t: "病理で線維化を認める。", ex: "storiform fibrosis（花筵状線維化）が特徴。正しい。" },
                    { l: "d", t: "IgG4関連疾患に含まれる。", ex: "1型AIPはIgG4-RDの膵病変。正しい。" },
                    { l: "e", t: "グルココルチコイドが第一選択。", ex: "ステロイド著効。診断的治療にも。正しい。" },
                  ].map(opt => (
                    <div key={opt.l} style={{ padding: "10px 14px", borderLeft: `3px solid ${opt.wrong ? C.dn : C.ok}`, marginBottom: 4, borderRadius: "0 8px 8px 0", background: opt.wrong ? C.dnl + "40" : "transparent" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ color: opt.wrong ? C.dn : C.ok, fontWeight: 700 }}>{opt.wrong ? "✕" : "○"}</span>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{opt.l}. {opt.t}</span>
                      </div>
                      <div style={{ fontSize: 12.5, color: C.m, lineHeight: 1.6, marginLeft: 20 }}>{opt.ex}</div>
                    </div>
                  ))}
                  <div style={{ marginTop: 14, padding: "12px 14px", borderRadius: 8, background: C.wnl, border: `1px solid ${C.wnb}` }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: C.wn, marginBottom: 4 }}>💡 覚えるポイント</div>
                    <p style={{ fontSize: 12.5, lineHeight: 1.6, margin: 0 }}>AIP = 膵腫大 + capsule-like rim + ステロイド著効</p>
                  </div>
                </Card>
                <div style={{ marginTop: 8, padding: "8px 12px", borderRadius: 8, background: C.s1, fontSize: 10.5, color: C.m, textAlign: "center" }}>⚠️ AI生成解説。正答は厚労省公式データ。</div>
              </div>
            )}
          </div>
        )}

        {/* AI from practice */}
        {tab === "practice" && showAI && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button onClick={() => setShowAI(false)} style={{ background: "none", border: "none", color: C.m, cursor: "pointer", fontSize: 13 }}>← 問題に戻る</button>
              <Badge>119A1</Badge><Badge color="ai">AI対話</Badge>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 16, marginBottom: 20 }}>
              {[
                { role: "user", text: "IgG4が上がるメカニズムは？" },
                { role: "ai", text: "Th2優位の免疫応答でIL-4/IL-10/IL-13がB細胞のIgG4クラススイッチを促進。\n\n• Tregも増加しIL-10産生\n• IgG4は補体活性化能が低い\n\n💡「穏やかだけどしつこい」抗体" },
              ].map((msg, i) => (
                <div key={i} style={{ display: "flex", gap: 12, flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, ...(msg.role === "ai" ? { background: C.acl, color: C.ac, fontWeight: 700 } : { background: C.s2, color: C.m }) }}>{msg.role === "ai" ? "i" : "U"}</div>
                  <div style={{ maxWidth: "75%", padding: "14px 18px", borderRadius: 14, fontSize: 13.5, lineHeight: 1.75, ...(msg.role === "ai" ? { background: C.s0, border: `1px solid ${C.br}`, borderTopLeftRadius: 4 } : { background: C.ac, color: "#fff", borderTopRightRadius: 4 }) }}>
                    {msg.text.split("\n").map((l, j) => <div key={j} style={{ marginTop: j > 0 ? 4 : 0 }}>{l}</div>)}
                  </div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="質問を入力..." style={{ flex: 1, padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${C.br}`, background: C.s0, fontSize: 14, outline: "none" }} />
              <GlowButton>送信</GlowButton>
            </div>
          </div>
        )}

        {/* Card Generation with deck picker */}
        {tab === "practice" && showCardGen && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
              <button onClick={() => setShowCardGen(false)} style={{ background: "none", border: "none", color: C.m, cursor: "pointer", fontSize: 13 }}>← 問題に戻る</button>
              <Badge>119A1</Badge><Badge color="ai">カード生成</Badge>
            </div>
            <Card style={{ marginBottom: 16, textAlign: "center", padding: "20px" }}>
              <div style={{ fontSize: 13, color: C.ac, fontWeight: 600 }}>✓ {GEN_CARDS.length}枚を生成</div>
              <div style={{ fontSize: 12, color: C.m, marginTop: 4 }}>保存したいカードの [+] をクリック</div>
            </Card>
            {GEN_CARDS.map((card, i) => (
              <Card key={i} style={{ marginBottom: 8, padding: "14px 18px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
                  <Badge>{card.type}</Badge>
                  <span style={{ marginLeft: "auto", fontSize: 11, color: C.m2 }}>カード {i + 1}</span>
                  {deckPicker === i ? (
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {MOCK_DECKS.map(d => (
                        <button key={d.id} onClick={() => setDeckPicker(null)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.br}`, background: C.s0, fontSize: 11, cursor: "pointer" }}>{d.name}</button>
                      ))}
                      <button onClick={() => setDeckPicker(null)} style={{ padding: "4px 10px", borderRadius: 6, border: `1px solid ${C.ac}`, background: C.acl, fontSize: 11, cursor: "pointer", color: C.ac, fontWeight: 600 }}>+ 新規デッキ</button>
                    </div>
                  ) : (
                    <button onClick={() => setDeckPicker(i)} style={{ width: 28, height: 28, borderRadius: 7, border: `1.5px solid ${C.ac}`, background: C.acl, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: C.ac, fontSize: 16, fontWeight: 700 }}>+</button>
                  )}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>{card.front}</div>
                <div style={{ fontSize: 13, color: C.m, lineHeight: 1.7, padding: "8px 12px", background: C.s1, borderRadius: 8, whiteSpace: "pre-line" }}>{card.back}</div>
              </Card>
            ))}
            <button onClick={() => setShowCardGen(false)} style={{ width: "100%", padding: "12px", borderRadius: 9, border: "none", background: C.ac, color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", marginTop: 12 }}>問題に戻る</button>
          </div>
        )}

        {/* ═══ CARDS — Deck Management ═══ */}
        {tab === "cards" && deckView === "list" && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>暗記カード</h1>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.br}`, background: C.s0, fontSize: 12, cursor: "pointer" }}>📁 フォルダ作成</button>
                <button onClick={() => setShowAddCards(true)} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: C.ac, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ デッキ作成</button>
              </div>
            </div>

            <TabBar items={[["mine", "自分のデッキ"], ["shared", "共有デッキ"]]} active={cardsTab} onChange={setCardsTab} />

            {/* Add cards modal */}
            {showAddCards && (
              <Card style={{ marginBottom: 20, border: `2px solid ${C.ac}` }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                  <span style={{ fontSize: 14, fontWeight: 600 }}>カードを追加</span>
                  <button onClick={() => setShowAddCards(false)} style={{ background: "none", border: "none", color: C.m, cursor: "pointer", fontSize: 16 }}>✕</button>
                </div>
                <div className="add-cards-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  {[
                    { icon: "✏️", label: "自分でテキスト入力", desc: "表面・裏面を手動で作成" },
                    { icon: "✕", label: "間違えた問題から", desc: "✕マークの問題からAI生成" },
                    { icon: "🔍", label: "特定の問題から", desc: "問題番号を指定してAI生成" },
                    { icon: "📄", label: "CSVインポート", desc: "表面,裏面 のCSVファイル" },
                    { icon: "📦", label: "Ankiファイルインポート", desc: ".apkgファイルを読み込み" },
                    { icon: "🌐", label: "共有デッキからインポート", desc: "他のユーザーのデッキを追加" },
                  ].map(opt => (
                    <button key={opt.label} style={{ padding: "14px 16px", borderRadius: 10, border: `1px solid ${C.br}`, background: C.s0, cursor: "pointer", textAlign: "left", display: "flex", alignItems: "flex-start", gap: 12 }} className="card-hover">
                      <span style={{ fontSize: 20 }}>{opt.icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 600, color: C.tx }}>{opt.label}</div>
                        <div style={{ fontSize: 11, color: C.m2, marginTop: 2 }}>{opt.desc}</div>
                      </div>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {/* 自分のデッキ */}
            {cardsTab === "mine" && (
              MOCK_DECKS.length === 0 ? (
                <Card style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>⊞</div>
                  <div style={{ fontSize: 14, color: C.m }}>デッキがありません</div>
                  <div style={{ fontSize: 13, color: C.m2, marginTop: 4 }}>問題演習からカードを生成するか、手動で作成</div>
                </Card>
              ) : (
                DECK_FOLDERS.map(folder => {
                  const decks = MOCK_DECKS.filter(d => d.folder === folder);
                  if (!decks.length) return null;
                  return (
                    <div key={folder} style={{ marginBottom: 20 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: C.m, marginBottom: 8 }}>📁 {folder}</div>
                      {decks.map(d => (
                        <Card key={d.id} style={{ marginBottom: 6, padding: "14px 18px", cursor: "pointer" }} className="card-hover" onClick={() => setDeckView("review")}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                              <div style={{ fontWeight: 600 }}>{d.name}</div>
                              <div style={{ fontSize: 11, color: C.m2, marginTop: 2 }}>{d.cards}枚</div>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                              {d.due > 0 && <span style={{ fontSize: 13, fontWeight: 700, color: C.ac }}>{d.due}枚 復習</span>}
                              <span style={{ color: C.m2 }}>›</span>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  );
                })
              )
            )}

            {/* 共有デッキ（マーケット） */}
            {cardsTab === "shared" && (
              <div>
                <input placeholder="デッキを検索…" style={{ width: "100%", padding: "12px 16px", borderRadius: 10, border: `1.5px solid ${C.br}`, background: C.s0, fontSize: 14, outline: "none", marginBottom: 16 }} />
                <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
                  {["人気", "新着", "循環器", "消化管", "公衆衛生", "CBT", "必修"].map(t => (
                    <button key={t} style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${C.br}`, background: C.s0, fontSize: 12, cursor: "pointer", color: C.tx }}>{t}</button>
                  ))}
                </div>
                {[
                  { name: "循環器マスター 500問", author: "Dr.Tanaka", cards: 500, downloads: 1240, rating: 4.8 },
                  { name: "CBT直前 必修200", author: "iwor公式", cards: 200, downloads: 3800, rating: 4.9 },
                  { name: "消化管 内視鏡画像集", author: "gastro_med", cards: 120, downloads: 680, rating: 4.5 },
                  { name: "抗菌薬 完全まとめ", author: "ID_resident", cards: 85, downloads: 920, rating: 4.7 },
                ].map((d, i) => (
                  <Card key={i} style={{ marginBottom: 8, padding: "14px 18px" }} className="card-hover">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, marginBottom: 2 }}>{d.name}</div>
                        <div style={{ fontSize: 11, color: C.m2 }}>by {d.author} · {d.cards}枚 · ⬇ {d.downloads.toLocaleString()}</div>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: 12, color: C.wn, fontWeight: 600 }}>★ {d.rating}</span>
                        <button style={{ padding: "6px 14px", borderRadius: 8, border: "none", background: C.ac, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ 追加</button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === "cards" && deckView === "review" && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
              <button onClick={() => setDeckView("list")} style={{ background: "none", border: "none", color: C.m, cursor: "pointer", fontSize: 13 }}>← デッキ一覧</button>
              <span style={{ fontWeight: 600 }}>CBT基礎</span>
              <Badge>残り12枚</Badge>
            </div>
            <div onClick={() => setCardFlipped(!cardFlipped)} style={{ background: C.s0, border: `1px solid ${C.br}`, borderRadius: 16, padding: "44px 40px", minHeight: 200, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", cursor: "pointer", textAlign: "center", position: "relative" }}>
              <div style={{ position: "absolute", top: 16, left: 20 }}><Badge color="accent">機序</Badge></div>
              {!cardFlipped ? (
                <div>
                  <div style={{ fontSize: 18, fontWeight: 600, lineHeight: 1.65, maxWidth: 500 }}>自己免疫性膵炎の画像所見は？</div>
                  <div style={{ fontSize: 12, color: C.m2, marginTop: 20 }}>クリックして回答表示</div>
                </div>
              ) : (
                <div className="fade-in">
                  <div style={{ fontSize: 17, fontWeight: 600, lineHeight: 1.7, maxWidth: 500 }}>
                    <span style={{ color: C.ac }}>びまん性の膵腫大（ソーセージ様膵）</span><br />+ capsule-like rim
                  </div>
                </div>
              )}
            </div>
            {cardFlipped && (
              <div style={{ display: "flex", gap: 8, marginTop: 16 }} className="fade-in">
                {[{ l: "もう一度", c: C.dn, s: "1分後" }, { l: "難しい", c: C.wn, s: "10分後" }, { l: "普通", c: C.ac, s: "1日後" }, { l: "簡単", c: C.ok, s: "4日後" }].map(b => (
                  <button key={b.l} onClick={() => setCardFlipped(false)} className="rating-btn" style={{ flex: 1, padding: "14px 0", borderRadius: 10, border: `1.5px solid ${C.br}`, background: C.s0, color: b.c, fontSize: 13, fontWeight: 700, cursor: "pointer", textAlign: "center" }}>
                    {b.l}<div style={{ fontSize: 10, color: C.m2, marginTop: 3, fontWeight: 400 }}>{b.s}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ STATS ═══ */}
        {tab === "stats" && (
          <div className="fade-in">
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 6px" }}>統計</h1>
            <TabBar items={[["kokushi", "国試演習"], ["cards", "暗記カード"]]} active={statsTab} onChange={setStatsTab} />
            {statsTab === "kokushi" && (
              <div>
                <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                  <StatCard icon="◎" label="総演習数" value={totalDone.toLocaleString()} sub="問" />
                  <StatCard icon="📈" label="正答率" value="71%" trend={8} />
                  <StatCard label="カバー率" value={`${Math.round(totalDone / totalQ * 100)}%`} sub={`${totalDone}/${totalQ}`} />
                  <StatCard icon="⏱" label="学習時間" value="142h" sub="累計" />
                </div>

                {/* Heatmap */}
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>演習ヒートマップ</div>
                    <span style={{ fontSize: 11, color: C.m2 }}>過去12週間</span>
                  </div>
                  <div style={{ display: "flex", gap: 3, flexWrap: "wrap" }}>
                    {Array.from({ length: 84 }, (_, i) => {
                      const v = Math.random();
                      return <div key={i} style={{ width: 12, height: 12, borderRadius: 2, background: v > 0.8 ? C.ac : v > 0.5 ? C.acl : v > 0.2 ? C.s2 : C.s1 }} />;
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, fontSize: 10, color: C.m2, alignItems: "center" }}>
                    <span>少ない</span>
                    {[C.s1, C.s2, C.acl, C.ac].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />)}
                    <span>多い</span>
                  </div>
                </Card>

                {/* Weekly trend bar chart */}
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>週別演習数</div>
                  <div style={{ fontSize: 11, color: C.m2, marginBottom: 14 }}>1日あたりの問題数推移</div>
                  <div style={{ display: "flex", alignItems: "flex-end", gap: 4, height: 80 }}>
                    {[18, 25, 32, 28, 42, 35, 22, 45, 38, 50, 42, 48].map((v, i) => (
                      <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                        <span style={{ fontSize: 9, color: C.m2 }}>{v}</span>
                        <div style={{ width: "100%", height: `${(v / 50) * 65}px`, background: i >= 10 ? C.ac : C.acl, borderRadius: 3, minHeight: 4 }} />
                      </div>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: C.m2 }}>
                    <span>12週前</span><span>6週前</span><span>今週</span>
                  </div>
                </Card>

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                  {/* Mark distribution */}
                  <Card style={{ flex: "1 1 300px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>マーク分布</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, justifyContent: "center", height: 100 }}>
                      {[
                        { icon: "◎", count: 520, color: "#6C5CE7", pct: 22 },
                        { icon: "○", count: 1080, color: C.ok, pct: 47 },
                        { icon: "△", count: 420, color: C.wn, pct: 18 },
                        { icon: "✕", count: 297, color: C.dn, pct: 13 },
                      ].map(mk => (
                        <div key={mk.icon} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, fontFamily: mono }}>{mk.count}</span>
                          <div style={{ width: "100%", maxWidth: 50, height: `${mk.pct * 2}px`, background: mk.color, borderRadius: 4, minHeight: 8 }} />
                          <span style={{ fontSize: 16, color: mk.color, fontWeight: 700 }}>{mk.icon}</span>
                          <span style={{ fontSize: 10, color: C.m2 }}>{mk.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Accuracy trend */}
                  <Card style={{ flex: "1 1 300px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>正答率推移</div>
                    <div style={{ fontSize: 11, color: C.m2, marginBottom: 14 }}>週別の正答率</div>
                    <div style={{ position: "relative", height: 80 }}>
                      <svg viewBox="0 0 240 80" style={{ width: "100%", height: 80 }}>
                        <polyline fill="none" stroke={C.acl} strokeWidth="20" points="0,70 20,65 40,60 60,55 80,50 100,48 120,42 140,38 160,35 180,32 200,28 220,25 240,23" opacity="0.5" />
                        <polyline fill="none" stroke={C.ac} strokeWidth="2" points="0,52 20,48 40,45 60,42 80,38 100,36 120,34 140,32 160,30 180,28 200,26 220,24 240,23" strokeLinecap="round" />
                      </svg>
                      <div style={{ position: "absolute", left: 0, bottom: 0, fontSize: 10, color: C.m2 }}>63%</div>
                      <div style={{ position: "absolute", right: 0, top: 0, fontSize: 12, color: C.ac, fontWeight: 700 }}>71%</div>
                    </div>
                  </Card>
                </div>

                {/* Field breakdown */}
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>科目別カバー率</div>
                  {FIELDS.flatMap(g => g.subs).sort((a, b) => b.pct - a.pct).slice(0, 10).map(s => (
                    <div key={s.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "7px 0" }}>
                      <div style={{ width: 80, fontSize: 12, color: C.m, textAlign: "right" }}>{s.label}</div>
                      <div style={{ flex: 1, height: 6, background: C.s2, borderRadius: 3, overflow: "hidden" }}>
                        <div style={{ width: `${s.pct}%`, height: "100%", borderRadius: 3, background: s.pct >= 70 ? C.ok : s.pct >= 50 ? C.ac : s.pct >= 40 ? C.wn : C.dn }} />
                      </div>
                      <div style={{ width: 36, fontSize: 12, fontWeight: 600, fontFamily: mono }}>{s.pct}%</div>
                      <div style={{ width: 60, fontSize: 11, color: C.m2, fontFamily: mono }}>{s.done}/{s.total}</div>
                    </div>
                  ))}
                </Card>

                {/* Exam progress */}
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>回数別進捗</div>
                  {EXAMS.filter(e => e.done > 0).map(ex => (
                    <div key={ex.year} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0" }}>
                      <span style={{ fontSize: 13, fontWeight: 600, width: 55, fontFamily: mono }}>{ex.year}回</span>
                      <div style={{ flex: 1, height: 8, background: C.s2, borderRadius: 4, overflow: "hidden" }}>
                        <div style={{ width: `${(ex.done / ex.total) * 100}%`, height: "100%", borderRadius: 4, background: ex.pct >= 70 ? C.ok : C.ac }} />
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, width: 36, fontFamily: mono }}>{ex.pct}%</span>
                      <span style={{ fontSize: 11, color: C.m2, fontFamily: mono, width: 70 }}>{ex.done}/{ex.total}</span>
                    </div>
                  ))}
                </Card>
              </div>
            )}
            {statsTab === "cards" && (
              <div>
                {/* Today */}
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>今日</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, textAlign: "center" }}>
                    <div><div style={{ fontSize: 24, fontWeight: 700, fontFamily: mono }}>38</div><div style={{ fontSize: 11, color: C.m2 }}>復習予定</div></div>
                    <div><div style={{ fontSize: 24, fontWeight: 700, fontFamily: mono, color: C.ac }}>16</div><div style={{ fontSize: 11, color: C.m2 }}>復習済み</div></div>
                    <div><div style={{ fontSize: 24, fontWeight: 700, fontFamily: mono }}>12.4<span style={{ fontSize: 14, color: C.m }}>秒</span></div><div style={{ fontSize: 11, color: C.m2 }}>平均回答時間</div></div>
                  </div>
                  <div style={{ display: "flex", justifyContent: "center", gap: 20, marginTop: 14, fontSize: 12, color: C.m }}>
                    <span>基本学習: <b style={{ color: C.tx }}>8</b></span>
                    <span>復習: <b style={{ color: C.tx }}>8</b></span>
                    <span>再学習: <b style={{ color: C.tx }}>0</b></span>
                    <span>正解率: <b style={{ color: C.ok }}>87%</b></span>
                  </div>
                </Card>

                {/* Summary stats */}
                <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                  <StatCard icon="⊞" label="カード総数" value="278" sub="枚" />
                  <StatCard label="復習累計" value="1,842" sub="枚" />
                  <StatCard label="保持率" value="87%" trend={2} />
                  <StatCard icon="🔥" label="連続学習" value="14" sub="日" />
                </div>

                {/* Card status pie (text-based mock) */}
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>カード内訳</div>
                  <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                    {/* Pie mock */}
                    <div style={{ position: "relative", width: 120, height: 120, flexShrink: 0 }}>
                      <svg viewBox="0 0 36 36" style={{ width: 120, height: 120, transform: "rotate(-90deg)" }}>
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke={C.s2} strokeWidth="3.5" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#3B82F6" strokeWidth="3.5" strokeDasharray="35 65" strokeDashoffset="0" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke={C.ok} strokeWidth="3.5" strokeDasharray="40 60" strokeDashoffset="-35" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke="#10B981" strokeWidth="3.5" strokeDasharray="18 82" strokeDashoffset="-75" />
                        <circle cx="18" cy="18" r="15.9" fill="none" stroke={C.wn} strokeWidth="3.5" strokeDasharray="5 95" strokeDashoffset="-93" />
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      {[
                        { label: "新規", count: 98, pct: "35.3%", color: "#3B82F6" },
                        { label: "復習(未熟)", count: 110, pct: "39.6%", color: C.ok },
                        { label: "復習(熟知)", count: 52, pct: "18.7%", color: "#10B981" },
                        { label: "保留", count: 14, pct: "5.0%", color: C.wn },
                        { label: "延期", count: 4, pct: "1.4%", color: C.m2 },
                      ].map(item => (
                        <div key={item.label} style={{ display: "flex", alignItems: "center", gap: 8, padding: "5px 0", fontSize: 13 }}>
                          <div style={{ width: 10, height: 10, borderRadius: 2, background: item.color, flexShrink: 0 }} />
                          <span style={{ color: C.m, flex: 1 }}>{item.label}</span>
                          <span style={{ fontWeight: 600, fontFamily: mono, width: 40, textAlign: "right" }}>{item.count}</span>
                          <span style={{ color: C.m2, fontFamily: mono, width: 50, textAlign: "right", fontSize: 12 }}>{item.pct}</span>
                        </div>
                      ))}
                      <div style={{ borderTop: `1px solid ${C.br}`, marginTop: 6, paddingTop: 6, display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                        <span style={{ flex: 1, fontWeight: 600 }}>合計</span>
                        <span style={{ fontWeight: 700, fontFamily: mono, width: 40, textAlign: "right" }}>278</span>
                      </div>
                    </div>
                  </div>
                </Card>

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                  {/* Review forecast */}
                  <Card style={{ flex: "1 1 400px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>復習予測</div>
                    <div style={{ fontSize: 11, color: C.m2, marginBottom: 14 }}>今後の復習カード枚数</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 3, height: 100 }}>
                      {[38, 25, 32, 18, 45, 28, 35, 22, 40, 30, 26, 42, 20, 34].map((v, i) => (
                        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                          <div style={{ width: "100%", height: `${(v / 45) * 80}px`, background: i === 0 ? C.ac : C.acl, borderRadius: 3 }} />
                          {i % 3 === 0 && <span style={{ fontSize: 9, color: C.m2 }}>{i === 0 ? "今日" : `+${i}日`}</span>}
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 16, marginTop: 12, fontSize: 11, color: C.m }}>
                      <span>明日: <b>25枚</b></span>
                      <span>平均: <b>31枚/日</b></span>
                    </div>
                  </Card>

                  {/* Interval distribution */}
                  <Card style={{ flex: "1 1 280px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>復習間隔</div>
                    <div style={{ fontSize: 11, color: C.m2, marginBottom: 14 }}>次回復習までの間隔分布</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 80 }}>
                      {[65, 45, 30, 22, 18, 15, 12, 10, 8, 6, 5, 4].map((v, i) => (
                        <div key={i} style={{ flex: 1, height: `${(v / 65) * 70}px`, background: "#3B82F6", borderRadius: 2, opacity: 0.6 + (i * 0.03) }} />
                      ))}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontSize: 10, color: C.m2 }}>
                      <span>1日</span><span>1週</span><span>1月</span><span>3月+</span>
                    </div>
                    <div style={{ textAlign: "center", marginTop: 10, fontSize: 12, color: C.m }}>平均間隔: <b>8.4日</b></div>
                  </Card>
                </div>

                {/* Calendar heatmap */}
                <Card style={{ marginBottom: 16 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>カレンダー</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <button style={{ background: "none", border: "none", color: C.m, cursor: "pointer", fontSize: 14 }}>◀</button>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>2026</span>
                      <button style={{ background: "none", border: "none", color: C.m, cursor: "pointer", fontSize: 14 }}>▶</button>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                    {Array.from({ length: 90 }, (_, i) => {
                      const v = Math.random();
                      const bg = v > 0.85 ? C.ac : v > 0.6 ? C.acl : v > 0.3 ? C.s2 : C.s1;
                      return <div key={i} style={{ width: 11, height: 11, borderRadius: 2, background: i > 80 ? C.s1 : bg }} />;
                    })}
                  </div>
                  <div style={{ display: "flex", gap: 8, marginTop: 10, fontSize: 10, color: C.m2, alignItems: "center" }}>
                    <span>少ない</span>
                    {[C.s1, C.s2, C.acl, C.ac].map((c, i) => <div key={i} style={{ width: 10, height: 10, borderRadius: 2, background: c }} />)}
                    <span>多い</span>
                    <span style={{ marginLeft: "auto" }}>学習日数: <b style={{ color: C.tx }}>68</b> / 90日 (76%)</span>
                  </div>
                </Card>

                <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                  {/* Answer buttons */}
                  <Card style={{ flex: "1 1 300px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>回答ボタン分布</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 12, justifyContent: "center", height: 100 }}>
                      {[
                        { label: "もう一度", count: 245, color: C.dn, pct: 13 },
                        { label: "難しい", count: 128, color: C.wn, pct: 7 },
                        { label: "普通", count: 1089, color: C.ac, pct: 59 },
                        { label: "簡単", count: 380, color: C.ok, pct: 21 },
                      ].map(btn => (
                        <div key={btn.label} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flex: 1 }}>
                          <span style={{ fontSize: 12, fontWeight: 600, fontFamily: mono }}>{btn.count}</span>
                          <div style={{ width: "100%", maxWidth: 50, height: `${btn.pct * 1.5}px`, background: btn.color, borderRadius: 4, minHeight: 8 }} />
                          <span style={{ fontSize: 10, color: C.m }}>{btn.label}</span>
                          <span style={{ fontSize: 10, color: C.m2 }}>{btn.pct}%</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  {/* Hourly analysis */}
                  <Card style={{ flex: "1 1 300px" }}>
                    <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>時間帯別</div>
                    <div style={{ fontSize: 11, color: C.m2, marginBottom: 14 }}>学習量と正解率</div>
                    <div style={{ display: "flex", alignItems: "flex-end", gap: 2, height: 70 }}>
                      {Array.from({ length: 24 }, (_, h) => {
                        const active = h >= 7 && h <= 23;
                        const v = active ? (h >= 9 && h <= 17 ? 40 + Math.random() * 40 : 10 + Math.random() * 30) : Math.random() * 5;
                        return (
                          <div key={h} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ width: "100%", height: `${(v / 80) * 60}px`, background: v > 40 ? "#3B82F6" : v > 15 ? "#93C5FD" : C.s2, borderRadius: 2, minHeight: 2 }} />
                          </div>
                        );
                      })}
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 4, fontSize: 9, color: C.m2 }}>
                      <span>0</span><span>6</span><span>12</span><span>18</span><span>23</span>
                    </div>
                    <div style={{ textAlign: "center", marginTop: 8, fontSize: 11, color: C.m }}>ピーク: <b>10時〜12時</b> · 正解率: <b style={{ color: C.ok }}>92%</b></div>
                  </Card>
                </div>

                {/* Deck breakdown */}
                <Card>
                  <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 14 }}>デッキ別統計</div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 60px 60px", padding: "8px 0", borderBottom: `1px solid ${C.br}`, fontSize: 11, color: C.m2 }}>
                    <span>デッキ</span><span style={{ textAlign: "right" }}>カード数</span><span style={{ textAlign: "right" }}>復習</span><span style={{ textAlign: "right" }}>保持率</span><span style={{ textAlign: "right" }}>平均間隔</span>
                  </div>
                  {MOCK_DECKS.map(d => (
                    <div key={d.id} style={{ display: "grid", gridTemplateColumns: "1fr 60px 60px 60px 60px", padding: "10px 0", borderBottom: `1px solid ${C.br}`, fontSize: 13, alignItems: "center" }}>
                      <span style={{ fontWeight: 600 }}>{d.name}</span>
                      <span style={{ textAlign: "right", fontFamily: mono, fontSize: 12 }}>{d.cards}</span>
                      <span style={{ textAlign: "right", fontFamily: mono, fontSize: 12, color: C.ac, fontWeight: 600 }}>{d.due}</span>
                      <span style={{ textAlign: "right", fontFamily: mono, fontSize: 12, color: C.ok }}>{82 + d.id * 3}%</span>
                      <span style={{ textAlign: "right", fontFamily: mono, fontSize: 12, color: C.m }}>{4 + d.id * 3}日</span>
                    </div>
                  ))}
                </Card>
              </div>
            )}
          </div>
        )}

        {/* ═══ CHAT ═══ */}
        {tab === "chat" && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)" }}>
            <h1 style={{ fontSize: 22, fontWeight: 700, margin: "0 0 4px" }}>iwor AI</h1>
            <TabBar items={[["free", "フリーチャット"], ["history", "チャット履歴"]]} active={chatTab} onChange={setChatTab} />
            {chatTab === "free" && (
              <>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16, marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: C.acl, color: C.ac, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 16, flexShrink: 0 }}>i</div>
                    <Card style={{ maxWidth: "75%", borderTopLeftRadius: 4 }}>
                      <p style={{ fontSize: 14, lineHeight: 1.75, margin: 0 }}>何でも聞いてください。</p>
                      <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                        {["循環器の苦手克服", "119回の頻出テーマ", "学習プラン作成"].map(q => (
                          <button key={q} style={{ padding: "6px 12px", borderRadius: 8, border: `1px solid ${C.br}`, background: C.s1, fontSize: 12, cursor: "pointer" }}>{q}</button>
                        ))}
                      </div>
                    </Card>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 10, paddingTop: 12, borderTop: `1px solid ${C.br}` }}>
                  <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="何でも聞いてください..." style={{ flex: 1, padding: "13px 16px", borderRadius: 10, border: `1.5px solid ${C.br}`, background: C.s0, fontSize: 14, outline: "none" }} />
                  <GlowButton>送信 <span style={{ fontSize: 10, opacity: 0.7 }}>3cr</span></GlowButton>
                </div>
              </>
            )}
            {chatTab === "history" && (
              <div style={{ flex: 1, overflowY: "auto" }}>
                <div style={{ fontSize: 13, color: C.m, marginBottom: 12 }}>過去のチャット（演習中AI対話含む）</div>
                {CHAT_HISTORY.map(ch => (
                  <Card key={ch.id} style={{ marginBottom: 8, cursor: "pointer", padding: "14px 18px" }} className="card-hover">
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{ch.title}</div>
                        <div style={{ fontSize: 11, color: C.m2, marginTop: 2 }}>出典: {ch.src}</div>
                      </div>
                      <span style={{ fontSize: 12, color: C.m2 }}>{ch.date}</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ NOTES ═══ */}
        {tab === "notes" && !noteEdit && (
          <div className="fade-in">
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>ノート</h1>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ padding: "8px 16px", borderRadius: 8, border: `1px solid ${C.br}`, background: C.s0, fontSize: 12, cursor: "pointer" }}>📁 フォルダ作成</button>
                <button onClick={() => { setNoteEdit("new"); setNoteText("# 新しいノート\n\n"); }} style={{ padding: "8px 16px", borderRadius: 8, border: "none", background: C.ac, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>+ 新規作成</button>
              </div>
            </div>
            <div style={{ display: "flex", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
              <button onClick={() => setNoteFolder(null)} style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${!noteFolder ? C.ac : C.br}`, background: !noteFolder ? C.acl : "transparent", color: !noteFolder ? C.ac : C.m, fontSize: 12, fontWeight: !noteFolder ? 600 : 500, cursor: "pointer" }}>すべて</button>
              {NOTE_FOLDERS.map(f => (
                <button key={f} onClick={() => setNoteFolder(f)} style={{ padding: "6px 14px", borderRadius: 20, border: `1.5px solid ${noteFolder === f ? C.ac : C.br}`, background: noteFolder === f ? C.acl : "transparent", color: noteFolder === f ? C.ac : C.m, fontSize: 12, fontWeight: noteFolder === f ? 600 : 500, cursor: "pointer" }}>📁 {f}</button>
              ))}
            </div>
            {NOTES.filter(n => !noteFolder || n.folder === noteFolder).map(n => (
              <Card key={n.id} style={{ marginBottom: 8, cursor: "pointer" }} className="card-hover" onClick={() => { setNoteEdit(n.id); setNoteText(n.preview); }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600 }}>{n.title}</span>
                  <Badge>{n.folder}</Badge>
                  <span style={{ fontSize: 11, color: C.m2, marginLeft: "auto" }}>{n.updated}</span>
                </div>
                <div style={{ fontSize: 12.5, color: C.m, fontFamily: mono, whiteSpace: "pre-line", maxHeight: 40, overflow: "hidden" }}>{n.preview}</div>
              </Card>
            ))}
          </div>
        )}
        {tab === "notes" && noteEdit && (
          <div className="fade-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 64px)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
              <button onClick={() => setNoteEdit(null)} style={{ background: "none", border: "none", color: C.m, cursor: "pointer", fontSize: 13 }}>← 一覧</button>
              <span style={{ fontWeight: 600 }}>{noteEdit === "new" ? "新しいノート" : NOTES.find(n => n.id === noteEdit)?.title}</span>
              <button style={{ marginLeft: "auto", padding: "8px 16px", borderRadius: 8, border: "none", background: C.ac, color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>保存</button>
            </div>
            <textarea value={noteText} onChange={e => setNoteText(e.target.value)} style={{ flex: 1, padding: "20px 24px", borderRadius: 12, border: `1.5px solid ${C.br}`, background: C.s0, fontSize: 14, fontFamily: mono, lineHeight: 1.75, resize: "none", outline: "none", color: C.tx }} />
          </div>
        )}

      </main>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes glowSpin { to { transform: rotate(360deg); } }
        @keyframes slideRight { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .fade-in { animation: fadeIn 0.3s ease; }
        .iwor-study-root * { box-sizing: border-box; }
        .iwor-study-root button, .iwor-study-root input, .iwor-study-root textarea { font-family: inherit; }
        ::selection { background: rgba(27,79,58,0.15); }
        .nav-btn:hover { background: ${C.s1} !important; }
        .choice-btn:hover { border-color: ${C.br2} !important; }
        .rating-btn:hover { background: ${C.s1} !important; }
        .card-hover:hover { border-color: ${C.br2} !important; }
        .row-hover:hover { background: ${C.s1} !important; }
        .glow-wrap:hover .glow-spinner { animation-duration: 1.5s !important; }
        .collapse-btn:hover { background: ${C.s1}; color: ${C.tx} !important; }
        @media (max-width: 768px) {
          .sidebar { display: none !important; }
          .main-content { padding: 16px 16px 100px !important; padding-top: 64px !important; }
          /* 64px top = parent AppHeader height, 100px bottom = parent BottomNav */
          .mobile-header { display: flex !important; }
          .add-cards-grid { grid-template-columns: 1fr !important; }
        }
        @media (min-width: 769px) {
          .mobile-header { display: none !important; }
          .mobile-overlay { display: none !important; }
        }
      `}</style>
    </div>
  );
}
