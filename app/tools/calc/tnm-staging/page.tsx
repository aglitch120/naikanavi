'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('tnm-staging')!

interface CancerTNM {
  name: string
  edition: string
  t: string[]
  n: string[]
  m: string[]
  stages: string[]
}

const cancers: CancerTNM[] = [
  { name: '肺癌', edition: 'UICC第9版 (2024)',
    t: ['Tis: 上皮内癌','T1(≦3cm): T1a(≦1cm)/T1b(1-2cm)/T1c(2-3cm)','T2(3-5cm or 主気管支浸潤等): T2a(3-4cm)/T2b(4-5cm)','T3(5-7cm or 胸壁浸潤等)','T4(>7cm or 縦隔浸潤等)'],
    n: ['N1: 同側肺門','N2: 同側縦隔/気管分岐下','N3: 対側縦隔/対側肺門/斜角筋前/鎖骨上'],
    m: ['M1a: 対側肺内結節/胸膜播種/悪性胸水','M1b: 単一臓器の単発遠隔転移','M1c: 多臓器の遠隔転移'],
    stages: ['IA1: T1aN0M0','IA2: T1bN0M0','IA3: T1cN0M0','IB: T2aN0M0','IIA: T2bN0M0','IIB: T1-2N1/T3N0','IIIA: T1-2N2/T3N1/T4N0-1','IIIB: T1-2N3/T3-4N2','IIIC: T3-4N3','IVA: M1a-b','IVB: M1c'] },
  { name: '胃癌', edition: 'UICC第8版 (2017)',
    t: ['T1: 粘膜/粘膜下層(T1a/T1b)','T2: 固有筋層','T3: 漿膜下結合組織','T4a: 漿膜浸潤','T4b: 隣接臓器浸潤'],
    n: ['N1: 1-2個のリンパ節転移','N2: 3-6個','N3a: 7-15個','N3b: ≧16個'],
    m: ['M1: 遠隔転移あり'],
    stages: ['IA: T1N0','IB: T1N1/T2N0','IIA: T1N2/T2N1/T3N0','IIB: T1N3a/T2N2/T3N1/T4aN0','IIIA: T2N3a/T3N2/T4aN1-2/T4bN0','IIIB: T3-4aN3a/T4bN1-2','IIIC: T4aN3b/T4bN3a-b','IV: M1'] },
  { name: '大腸癌', edition: 'UICC第8版 (2017)',
    t: ['Tis: 粘膜内癌','T1: 粘膜下層','T2: 固有筋層','T3: 漿膜下/周囲組織浸潤','T4a: 漿膜浸潤','T4b: 隣接臓器浸潤'],
    n: ['N1: 1-3個(N1a:1/N1b:2-3/N1c:漿膜下deposit)','N2: ≧4個(N2a:4-6/N2b:≧7)'],
    m: ['M1a: 1臓器(腹膜以外)','M1b: 2臓器以上(腹膜以外)','M1c: 腹膜転移'],
    stages: ['0: TisN0','I: T1-2N0','IIA: T3N0','IIB: T4aN0','IIC: T4bN0','IIIA: T1-2N1/T1N2a','IIIB: T3-4aN1/T2-3N2a/T1-2N2b','IIIC: T4aN2a/T3-4aN2b/T4bN1-2','IVA: M1a','IVB: M1b','IVC: M1c'] },
  { name: '乳癌', edition: 'UICC第8版 (2017)',
    t: ['Tis: 非浸潤癌(DCIS)','T1(≦2cm): T1mi(≦1mm)/T1a/T1b/T1c','T2: 2-5cm','T3: >5cm','T4: 胸壁/皮膚浸潤(T4a-d, T4d=炎症性乳癌)'],
    n: ['N1: 同側腋窩(可動性)','N2: 同側腋窩(固定)/内胸','N3: 鎖骨下/内胸+腋窩/鎖骨上'],
    m: ['M1: 遠隔転移あり'],
    stages: ['0: TisN0','IA: T1N0','IB: T0-1N1mi','IIA: T0-1N1/T2N0','IIB: T2N1/T3N0','IIIA: T0-2N2/T3N1-2','IIIB: T4N0-2','IIIC: anyTN3','IV: M1'] },
  { name: '肝細胞癌', edition: 'UICC第8版 (2017)',
    t: ['T1a: 単発 ≦2cm 脈管浸潤なし','T1b: 単発 >2cm 脈管浸潤なし','T2: 単発+脈管浸潤 or 多発(≦5cm)','T3: 多発(>5cmのもの含む)','T4: 門脈/肝静脈主幹浸潤 or 臓器直接浸潤'],
    n: ['N1: 所属リンパ節転移'],
    m: ['M1: 遠隔転移あり'],
    stages: ['IA: T1aN0','IB: T1bN0','II: T2N0','IIIA: T3N0','IIIB: T4N0','IVA: N1','IVB: M1'] },
  { name: '膵癌', edition: 'UICC第8版 (2017)',
    t: ['T1(≦2cm): T1a(≦0.5cm)/T1b/T1c','T2: 2-4cm','T3: >4cm','T4: 腹腔動脈幹/上腸間膜動脈/総肝動脈浸潤'],
    n: ['N1: 1-3個のリンパ節転移','N2: ≧4個'],
    m: ['M1: 遠隔転移あり'],
    stages: ['IA: T1N0','IB: T2N0','IIA: T3N0','IIB: T1-3N1','III: T4anyN/anyTN2','IV: M1'] },
  { name: '腎癌', edition: 'UICC第8版 (2017)',
    t: ['T1a: ≦4cm 腎限局','T1b: 4-7cm 腎限局','T2a: 7-10cm 腎限局','T2b: >10cm 腎限局','T3a: 腎静脈/腎周囲脂肪浸潤','T3b: 横隔膜下の下大静脈内','T3c: 横隔膜上のIVC/IVC壁浸潤','T4: Gerota筋膜越え'],
    n: ['N1: 所属リンパ節転移'],
    m: ['M1: 遠隔転移あり'],
    stages: ['I: T1N0','II: T2N0','III: T1-2N1/T3anyN','IV: T4anyN/M1'] },
  { name: '膀胱癌', edition: 'UICC第8版 (2017)',
    t: ['Ta: 非浸潤性乳頭癌','Tis: CIS','T1: 粘膜下結合組織浸潤','T2a: 浅筋層','T2b: 深筋層','T3: 膀胱周囲脂肪浸潤','T4a: 前立腺/子宮/膣浸潤','T4b: 骨盤壁/腹壁浸潤'],
    n: ['N1: 小骨盤内単発(≦2cm)','N2: 小骨盤内(>2cm or 多発)','N3: 総腸骨リンパ節'],
    m: ['M1a: 遠隔リンパ節','M1b: その他の遠隔転移'],
    stages: ['0a: TaN0','0is: TisN0','I: T1N0','II: T2N0','IIIA: T3-4aN0/T1-4aN1','IIIB: T1-4aN2-3','IVA: T4b/M1a','IVB: M1b'] },
  { name: '前立腺癌', edition: 'UICC第8版 (2017)',
    t: ['T1: 触知不能/画像で同定不能(T1a/T1b/T1c)','T2: 前立腺に限局(T2a≦1/2葉/T2b>1/2葉/T2c両葉)','T3a: 被膜外浸潤','T3b: 精嚢浸潤','T4: 膀胱頸部/外括約筋/直腸/挙筋/骨盤壁浸潤'],
    n: ['N1: 所属リンパ節転移'],
    m: ['M1a: 所属外リンパ節','M1b: 骨転移','M1c: その他の遠隔転移'],
    stages: ['I: T1-2aN0 GG1','II: T1-2N0 GG2-4','IIIA: T1-2N0 GG5/PSA≧20','IIIB: T3-4N0','IIIC: anyT N0 GG5','IVA: N1','IVB: M1'] },
]

export default function TnmStagingPage() {
  const [selected, setSelected] = useState(0)
  const cancer = cancers[selected]
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<div className="text-sm text-muted"><p>TNM分類は定期的に改訂されます。最新版は各癌の治療ガイドラインまたはUICC TNM Classification原著を参照してください。</p></div>}
      relatedTools={[{href:'/tools/calc/ann-arbor',name:'Ann Arbor(リンパ腫)'},{href:'/tools/calc/ecog',name:'ECOG PS'}]}
      references={toolDef.sources||[]}
    >
      {/* 癌種セレクター */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {cancers.map((c,i)=>(
          <button key={i} onClick={()=>setSelected(i)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selected===i?'bg-ac text-white':'bg-s0 border border-br text-muted hover:border-ac/30'}`}>
            {c.name}
          </button>
        ))}
      </div>

      {/* 版情報 */}
      <div className="text-xs text-muted mb-3">{cancer.edition}</div>

      {/* T */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-tx mb-1.5">T — 原発腫瘍</h3>
        <div className="space-y-1">{cancer.t.map((t,i)=>(
          <div key={i} className="p-2 bg-s0 rounded-lg border border-br text-xs text-tx">{t}</div>
        ))}</div>
      </div>

      {/* N */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-tx mb-1.5">N — 所属リンパ節</h3>
        <div className="space-y-1">
          <div className="p-2 bg-s0 rounded-lg border border-br text-xs text-tx">N0: 転移なし</div>
          {cancer.n.map((n,i)=>(<div key={i} className="p-2 bg-s0 rounded-lg border border-br text-xs text-tx">{n}</div>))}
        </div>
      </div>

      {/* M */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-tx mb-1.5">M — 遠隔転移</h3>
        <div className="space-y-1">
          <div className="p-2 bg-s0 rounded-lg border border-br text-xs text-tx">M0: 遠隔転移なし</div>
          {cancer.m.map((m,i)=>(<div key={i} className="p-2 bg-s0 rounded-lg border border-br text-xs text-tx">{m}</div>))}
        </div>
      </div>

      {/* Stage */}
      <div>
        <h3 className="text-sm font-bold text-tx mb-1.5">Stage分類</h3>
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex flex-wrap gap-1.5">
            {cancer.stages.map((s,i)=>{
              const isIV = s.startsWith('IV')
              const isIII = s.startsWith('III')
              return (
                <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${isIV?'bg-dnl text-dn':isIII?'bg-wnl text-wn':'bg-okl text-ok'}`}>{s}</span>
              )
            })}
          </div>
        </div>
      </div>
    </CalculatorLayout>
  )
}
