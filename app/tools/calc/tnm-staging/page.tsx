'use client'
import { useState } from 'react'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import ResultCard from '@/components/tools/ResultCard'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('tnm-staging')!

interface TNMOption { value: string; label: string }
interface StageRule { t: string[]; n: string[]; m: string[]; stage: string }
interface CancerDef {
  name: string; edition: string
  tOptions: TNMOption[]; nOptions: TNMOption[]; mOptions: TNMOption[]
  rules: StageRule[]
}

// ──────── 癌種データ ────────
const cancers: CancerDef[] = [
  // ── 肺癌 ──
  { name: '肺癌', edition: 'UICC第9版 (2024)',
    tOptions: [
      { value: 'Tis', label: 'Tis: 上皮内癌' },
      { value: 'T1a', label: 'T1a: ≦1cm' },
      { value: 'T1b', label: 'T1b: 1-2cm' },
      { value: 'T1c', label: 'T1c: 2-3cm' },
      { value: 'T2a', label: 'T2a: 3-4cm' },
      { value: 'T2b', label: 'T2b: 4-5cm' },
      { value: 'T3', label: 'T3: 5-7cm/胸壁浸潤等' },
      { value: 'T4', label: 'T4: >7cm/縦隔浸潤等' },
    ],
    nOptions: [
      { value: 'N0', label: 'N0: 転移なし' },
      { value: 'N1', label: 'N1: 同側肺門' },
      { value: 'N2', label: 'N2: 同側縦隔/気管分岐下' },
      { value: 'N3', label: 'N3: 対側縦隔/鎖骨上' },
    ],
    mOptions: [
      { value: 'M0', label: 'M0: 遠隔転移なし' },
      { value: 'M1a', label: 'M1a: 対側肺/胸膜播種/悪性胸水' },
      { value: 'M1b', label: 'M1b: 単一臓器の単発転移' },
      { value: 'M1c', label: 'M1c: 多臓器の遠隔転移' },
    ],
    rules: [
      { t:['Tis'], n:['N0'], m:['M0'], stage:'0' },
      { t:['T1a'], n:['N0'], m:['M0'], stage:'IA1' },
      { t:['T1b'], n:['N0'], m:['M0'], stage:'IA2' },
      { t:['T1c'], n:['N0'], m:['M0'], stage:'IA3' },
      { t:['T2a'], n:['N0'], m:['M0'], stage:'IB' },
      { t:['T2b'], n:['N0'], m:['M0'], stage:'IIA' },
      { t:['T1a','T1b','T1c','T2a','T2b'], n:['N1'], m:['M0'], stage:'IIB' },
      { t:['T3'], n:['N0'], m:['M0'], stage:'IIB' },
      { t:['T1a','T1b','T1c','T2a','T2b'], n:['N2'], m:['M0'], stage:'IIIA' },
      { t:['T3'], n:['N1'], m:['M0'], stage:'IIIA' },
      { t:['T4'], n:['N0','N1'], m:['M0'], stage:'IIIA' },
      { t:['T1a','T1b','T1c','T2a','T2b'], n:['N3'], m:['M0'], stage:'IIIB' },
      { t:['T3','T4'], n:['N2'], m:['M0'], stage:'IIIB' },
      { t:['T3','T4'], n:['N3'], m:['M0'], stage:'IIIC' },
      { t:['Tis','T1a','T1b','T1c','T2a','T2b','T3','T4'], n:['N0','N1','N2','N3'], m:['M1a','M1b'], stage:'IVA' },
      { t:['Tis','T1a','T1b','T1c','T2a','T2b','T3','T4'], n:['N0','N1','N2','N3'], m:['M1c'], stage:'IVB' },
    ],
  },
  // ── 胃癌 ──
  { name: '胃癌', edition: 'UICC第8版 (2017)',
    tOptions: [
      { value: 'T1', label: 'T1: 粘膜/粘膜下層' },
      { value: 'T2', label: 'T2: 固有筋層' },
      { value: 'T3', label: 'T3: 漿膜下結合組織' },
      { value: 'T4a', label: 'T4a: 漿膜浸潤' },
      { value: 'T4b', label: 'T4b: 隣接臓器浸潤' },
    ],
    nOptions: [
      { value: 'N0', label: 'N0: 転移なし' },
      { value: 'N1', label: 'N1: 1-2個' },
      { value: 'N2', label: 'N2: 3-6個' },
      { value: 'N3a', label: 'N3a: 7-15個' },
      { value: 'N3b', label: 'N3b: ≧16個' },
    ],
    mOptions: [
      { value: 'M0', label: 'M0: 遠隔転移なし' },
      { value: 'M1', label: 'M1: 遠隔転移あり' },
    ],
    rules: [
      { t:['T1'], n:['N0'], m:['M0'], stage:'IA' },
      { t:['T1'], n:['N1'], m:['M0'], stage:'IB' },
      { t:['T2'], n:['N0'], m:['M0'], stage:'IB' },
      { t:['T1'], n:['N2'], m:['M0'], stage:'IIA' },
      { t:['T2'], n:['N1'], m:['M0'], stage:'IIA' },
      { t:['T3'], n:['N0'], m:['M0'], stage:'IIA' },
      { t:['T1'], n:['N3a'], m:['M0'], stage:'IIB' },
      { t:['T2'], n:['N2'], m:['M0'], stage:'IIB' },
      { t:['T3'], n:['N1'], m:['M0'], stage:'IIB' },
      { t:['T4a'], n:['N0'], m:['M0'], stage:'IIB' },
      { t:['T2'], n:['N3a'], m:['M0'], stage:'IIIA' },
      { t:['T3'], n:['N2'], m:['M0'], stage:'IIIA' },
      { t:['T4a'], n:['N1','N2'], m:['M0'], stage:'IIIA' },
      { t:['T4b'], n:['N0'], m:['M0'], stage:'IIIA' },
      { t:['T1','T2'], n:['N3b'], m:['M0'], stage:'IIIB' },
      { t:['T3','T4a'], n:['N3a'], m:['M0'], stage:'IIIB' },
      { t:['T4b'], n:['N1','N2'], m:['M0'], stage:'IIIB' },
      { t:['T4a'], n:['N3b'], m:['M0'], stage:'IIIC' },
      { t:['T4b'], n:['N3a','N3b'], m:['M0'], stage:'IIIC' },
      { t:['T1','T2','T3','T4a','T4b'], n:['N0','N1','N2','N3a','N3b'], m:['M1'], stage:'IV' },
    ],
  },
  // ── 大腸癌 ──
  { name: '大腸癌', edition: 'UICC第8版 (2017)',
    tOptions: [
      { value: 'Tis', label: 'Tis: 粘膜内癌' },
      { value: 'T1', label: 'T1: 粘膜下層' },
      { value: 'T2', label: 'T2: 固有筋層' },
      { value: 'T3', label: 'T3: 漿膜下/周囲組織' },
      { value: 'T4a', label: 'T4a: 漿膜浸潤' },
      { value: 'T4b', label: 'T4b: 隣接臓器浸潤' },
    ],
    nOptions: [
      { value: 'N0', label: 'N0: 転移なし' },
      { value: 'N1a', label: 'N1a: 1個' },
      { value: 'N1b', label: 'N1b: 2-3個' },
      { value: 'N2a', label: 'N2a: 4-6個' },
      { value: 'N2b', label: 'N2b: ≧7個' },
    ],
    mOptions: [
      { value: 'M0', label: 'M0: 遠隔転移なし' },
      { value: 'M1a', label: 'M1a: 1臓器(腹膜以外)' },
      { value: 'M1b', label: 'M1b: 2臓器以上(腹膜以外)' },
      { value: 'M1c', label: 'M1c: 腹膜転移' },
    ],
    rules: [
      { t:['Tis'], n:['N0'], m:['M0'], stage:'0' },
      { t:['T1','T2'], n:['N0'], m:['M0'], stage:'I' },
      { t:['T3'], n:['N0'], m:['M0'], stage:'IIA' },
      { t:['T4a'], n:['N0'], m:['M0'], stage:'IIB' },
      { t:['T4b'], n:['N0'], m:['M0'], stage:'IIC' },
      { t:['T1','T2'], n:['N1a','N1b'], m:['M0'], stage:'IIIA' },
      { t:['T1'], n:['N2a'], m:['M0'], stage:'IIIA' },
      { t:['T3','T4a'], n:['N1a','N1b'], m:['M0'], stage:'IIIB' },
      { t:['T2','T3'], n:['N2a'], m:['M0'], stage:'IIIB' },
      { t:['T1','T2'], n:['N2b'], m:['M0'], stage:'IIIB' },
      { t:['T4a'], n:['N2a'], m:['M0'], stage:'IIIC' },
      { t:['T3','T4a'], n:['N2b'], m:['M0'], stage:'IIIC' },
      { t:['T4b'], n:['N1a','N1b','N2a','N2b'], m:['M0'], stage:'IIIC' },
      { t:['Tis','T1','T2','T3','T4a','T4b'], n:['N0','N1a','N1b','N2a','N2b'], m:['M1a'], stage:'IVA' },
      { t:['Tis','T1','T2','T3','T4a','T4b'], n:['N0','N1a','N1b','N2a','N2b'], m:['M1b'], stage:'IVB' },
      { t:['Tis','T1','T2','T3','T4a','T4b'], n:['N0','N1a','N1b','N2a','N2b'], m:['M1c'], stage:'IVC' },
    ],
  },
  // ── 食道癌 ──
  { name: '食道癌', edition: 'UICC第8版 (2017)',
    tOptions: [
      { value: 'Tis', label: 'Tis: 上皮内癌' },
      { value: 'T1a', label: 'T1a: 粘膜固有層/粘膜筋板' },
      { value: 'T1b', label: 'T1b: 粘膜下層' },
      { value: 'T2', label: 'T2: 固有筋層' },
      { value: 'T3', label: 'T3: 外膜浸潤' },
      { value: 'T4a', label: 'T4a: 胸膜/心膜/奇静脈/横隔膜/腹膜浸潤' },
      { value: 'T4b', label: 'T4b: 大動脈/椎体/気管浸潤' },
    ],
    nOptions: [
      { value: 'N0', label: 'N0: 転移なし' },
      { value: 'N1', label: 'N1: 1-2個' },
      { value: 'N2', label: 'N2: 3-6個' },
      { value: 'N3', label: 'N3: ≧7個' },
    ],
    mOptions: [
      { value: 'M0', label: 'M0: 遠隔転移なし' },
      { value: 'M1', label: 'M1: 遠隔転移あり' },
    ],
    rules: [
      { t:['Tis'], n:['N0'], m:['M0'], stage:'0' },
      { t:['T1a','T1b'], n:['N0'], m:['M0'], stage:'I' },
      { t:['T2'], n:['N0'], m:['M0'], stage:'II' },
      { t:['T1a','T1b'], n:['N1'], m:['M0'], stage:'II' },
      { t:['T3'], n:['N0'], m:['M0'], stage:'II' },
      { t:['T1a','T1b'], n:['N2'], m:['M0'], stage:'III' },
      { t:['T2'], n:['N1'], m:['M0'], stage:'III' },
      { t:['T3'], n:['N1','N2'], m:['M0'], stage:'III' },
      { t:['T4a'], n:['N0','N1','N2'], m:['M0'], stage:'IIIA' /* IVA in some */, },
      { t:['T1a','T1b','T2','T3'], n:['N3'], m:['M0'], stage:'III' },
      { t:['T4a'], n:['N3'], m:['M0'], stage:'IVA' },
      { t:['T4b'], n:['N0','N1','N2','N3'], m:['M0'], stage:'IVA' },
      { t:['Tis','T1a','T1b','T2','T3','T4a','T4b'], n:['N0','N1','N2','N3'], m:['M1'], stage:'IVB' },
    ],
  },
  // ── 乳癌 ──
  { name: '乳癌', edition: 'UICC第8版 (2017)',
    tOptions: [
      { value: 'Tis', label: 'Tis: 非浸潤癌(DCIS)' },
      { value: 'T1', label: 'T1: ≦2cm' },
      { value: 'T2', label: 'T2: 2-5cm' },
      { value: 'T3', label: 'T3: >5cm' },
      { value: 'T4', label: 'T4: 胸壁/皮膚浸潤(炎症性含む)' },
    ],
    nOptions: [
      { value: 'N0', label: 'N0: 転移なし' },
      { value: 'N1', label: 'N1: 同側腋窩(可動性)' },
      { value: 'N2', label: 'N2: 同側腋窩(固定)/内胸' },
      { value: 'N3', label: 'N3: 鎖骨下/内胸+腋窩/鎖骨上' },
    ],
    mOptions: [
      { value: 'M0', label: 'M0: 遠隔転移なし' },
      { value: 'M1', label: 'M1: 遠隔転移あり' },
    ],
    rules: [
      { t:['Tis'], n:['N0'], m:['M0'], stage:'0' },
      { t:['T1'], n:['N0'], m:['M0'], stage:'IA' },
      { t:['T1'], n:['N1'], m:['M0'], stage:'IIA' },
      { t:['T2'], n:['N0'], m:['M0'], stage:'IIA' },
      { t:['T2'], n:['N1'], m:['M0'], stage:'IIB' },
      { t:['T3'], n:['N0'], m:['M0'], stage:'IIB' },
      { t:['T1','T2'], n:['N2'], m:['M0'], stage:'IIIA' },
      { t:['T3'], n:['N1','N2'], m:['M0'], stage:'IIIA' },
      { t:['T4'], n:['N0','N1','N2'], m:['M0'], stage:'IIIB' },
      { t:['Tis','T1','T2','T3','T4'], n:['N3'], m:['M0'], stage:'IIIC' },
      { t:['Tis','T1','T2','T3','T4'], n:['N0','N1','N2','N3'], m:['M1'], stage:'IV' },
    ],
  },
  // ── 肝細胞癌 ──
  { name: '肝細胞癌', edition: 'UICC第8版 (2017)',
    tOptions: [
      { value: 'T1a', label: 'T1a: 単発 ≦2cm 脈管浸潤なし' },
      { value: 'T1b', label: 'T1b: 単発 >2cm 脈管浸潤なし' },
      { value: 'T2', label: 'T2: 単発+脈管浸潤 or 多発(≦5cm)' },
      { value: 'T3', label: 'T3: 多発(>5cm含む)' },
      { value: 'T4', label: 'T4: 門脈/肝静脈主幹浸潤' },
    ],
    nOptions: [
      { value: 'N0', label: 'N0: 転移なし' },
      { value: 'N1', label: 'N1: 所属リンパ節転移' },
    ],
    mOptions: [
      { value: 'M0', label: 'M0: 遠隔転移なし' },
      { value: 'M1', label: 'M1: 遠隔転移あり' },
    ],
    rules: [
      { t:['T1a'], n:['N0'], m:['M0'], stage:'IA' },
      { t:['T1b'], n:['N0'], m:['M0'], stage:'IB' },
      { t:['T2'], n:['N0'], m:['M0'], stage:'II' },
      { t:['T3'], n:['N0'], m:['M0'], stage:'IIIA' },
      { t:['T4'], n:['N0'], m:['M0'], stage:'IIIB' },
      { t:['T1a','T1b','T2','T3','T4'], n:['N1'], m:['M0'], stage:'IVA' },
      { t:['T1a','T1b','T2','T3','T4'], n:['N0','N1'], m:['M1'], stage:'IVB' },
    ],
  },
  // ── 膵癌 ──
  { name: '膵癌', edition: 'UICC第8版 (2017)',
    tOptions: [
      { value: 'T1', label: 'T1: ≦2cm' },
      { value: 'T2', label: 'T2: 2-4cm' },
      { value: 'T3', label: 'T3: >4cm' },
      { value: 'T4', label: 'T4: 腹腔動脈幹/SMA/総肝動脈浸潤' },
    ],
    nOptions: [
      { value: 'N0', label: 'N0: 転移なし' },
      { value: 'N1', label: 'N1: 1-3個' },
      { value: 'N2', label: 'N2: ≧4個' },
    ],
    mOptions: [
      { value: 'M0', label: 'M0: 遠隔転移なし' },
      { value: 'M1', label: 'M1: 遠隔転移あり' },
    ],
    rules: [
      { t:['T1'], n:['N0'], m:['M0'], stage:'IA' },
      { t:['T2'], n:['N0'], m:['M0'], stage:'IB' },
      { t:['T3'], n:['N0'], m:['M0'], stage:'IIA' },
      { t:['T1','T2','T3'], n:['N1'], m:['M0'], stage:'IIB' },
      { t:['T4'], n:['N0','N1','N2'], m:['M0'], stage:'III' },
      { t:['T1','T2','T3'], n:['N2'], m:['M0'], stage:'III' },
      { t:['T1','T2','T3','T4'], n:['N0','N1','N2'], m:['M1'], stage:'IV' },
    ],
  },
  // ── 腎癌 ──
  { name: '腎癌', edition: 'UICC第8版 (2017)',
    tOptions: [
      { value: 'T1a', label: 'T1a: ≦4cm 腎限局' },
      { value: 'T1b', label: 'T1b: 4-7cm 腎限局' },
      { value: 'T2a', label: 'T2a: 7-10cm 腎限局' },
      { value: 'T2b', label: 'T2b: >10cm 腎限局' },
      { value: 'T3a', label: 'T3a: 腎静脈/腎周囲浸潤' },
      { value: 'T3b', label: 'T3b: 横隔膜下IVC内' },
      { value: 'T3c', label: 'T3c: 横隔膜上IVC/壁浸潤' },
      { value: 'T4', label: 'T4: Gerota筋膜越え' },
    ],
    nOptions: [
      { value: 'N0', label: 'N0: 転移なし' },
      { value: 'N1', label: 'N1: 所属リンパ節転移' },
    ],
    mOptions: [
      { value: 'M0', label: 'M0: 遠隔転移なし' },
      { value: 'M1', label: 'M1: 遠隔転移あり' },
    ],
    rules: [
      { t:['T1a','T1b'], n:['N0'], m:['M0'], stage:'I' },
      { t:['T2a','T2b'], n:['N0'], m:['M0'], stage:'II' },
      { t:['T1a','T1b','T2a','T2b'], n:['N1'], m:['M0'], stage:'III' },
      { t:['T3a','T3b','T3c'], n:['N0','N1'], m:['M0'], stage:'III' },
      { t:['T4'], n:['N0','N1'], m:['M0'], stage:'IV' },
      { t:['T1a','T1b','T2a','T2b','T3a','T3b','T3c','T4'], n:['N0','N1'], m:['M1'], stage:'IV' },
    ],
  },
  // ── 膀胱癌 ──
  { name: '膀胱癌', edition: 'UICC第8版 (2017)',
    tOptions: [
      { value: 'Ta', label: 'Ta: 非浸潤性乳頭癌' },
      { value: 'Tis', label: 'Tis: CIS' },
      { value: 'T1', label: 'T1: 粘膜下結合組織浸潤' },
      { value: 'T2a', label: 'T2a: 浅筋層' },
      { value: 'T2b', label: 'T2b: 深筋層' },
      { value: 'T3', label: 'T3: 膀胱周囲脂肪浸潤' },
      { value: 'T4a', label: 'T4a: 前立腺/子宮/膣浸潤' },
      { value: 'T4b', label: 'T4b: 骨盤壁/腹壁浸潤' },
    ],
    nOptions: [
      { value: 'N0', label: 'N0: 転移なし' },
      { value: 'N1', label: 'N1: 小骨盤内単発(≦2cm)' },
      { value: 'N2', label: 'N2: 小骨盤内(>2cm/多発)' },
      { value: 'N3', label: 'N3: 総腸骨リンパ節' },
    ],
    mOptions: [
      { value: 'M0', label: 'M0: 遠隔転移なし' },
      { value: 'M1a', label: 'M1a: 遠隔リンパ節' },
      { value: 'M1b', label: 'M1b: その他の遠隔転移' },
    ],
    rules: [
      { t:['Ta'], n:['N0'], m:['M0'], stage:'0a' },
      { t:['Tis'], n:['N0'], m:['M0'], stage:'0is' },
      { t:['T1'], n:['N0'], m:['M0'], stage:'I' },
      { t:['T2a','T2b'], n:['N0'], m:['M0'], stage:'II' },
      { t:['T3','T4a'], n:['N0'], m:['M0'], stage:'IIIA' },
      { t:['Ta','Tis','T1','T2a','T2b','T3','T4a'], n:['N1'], m:['M0'], stage:'IIIA' },
      { t:['Ta','Tis','T1','T2a','T2b','T3','T4a'], n:['N2','N3'], m:['M0'], stage:'IIIB' },
      { t:['T4b'], n:['N0','N1','N2','N3'], m:['M0'], stage:'IVA' },
      { t:['Ta','Tis','T1','T2a','T2b','T3','T4a','T4b'], n:['N0','N1','N2','N3'], m:['M1a'], stage:'IVA' },
      { t:['Ta','Tis','T1','T2a','T2b','T3','T4a','T4b'], n:['N0','N1','N2','N3'], m:['M1b'], stage:'IVB' },
    ],
  },
  // ── 前立腺癌 ──
  { name: '前立腺癌', edition: 'UICC第8版 (2017)',
    tOptions: [
      { value: 'T1', label: 'T1: 触知不能/画像同定不能' },
      { value: 'T2', label: 'T2: 前立腺に限局' },
      { value: 'T3a', label: 'T3a: 被膜外浸潤' },
      { value: 'T3b', label: 'T3b: 精嚢浸潤' },
      { value: 'T4', label: 'T4: 膀胱頸部/直腸/骨盤壁浸潤' },
    ],
    nOptions: [
      { value: 'N0', label: 'N0: 転移なし' },
      { value: 'N1', label: 'N1: 所属リンパ節転移' },
    ],
    mOptions: [
      { value: 'M0', label: 'M0: 遠隔転移なし' },
      { value: 'M1a', label: 'M1a: 所属外リンパ節' },
      { value: 'M1b', label: 'M1b: 骨転移' },
      { value: 'M1c', label: 'M1c: その他の遠隔転移' },
    ],
    rules: [
      { t:['T1','T2'], n:['N0'], m:['M0'], stage:'I〜II (※GG/PSAで細分)' },
      { t:['T3a','T3b'], n:['N0'], m:['M0'], stage:'IIIB' },
      { t:['T4'], n:['N0'], m:['M0'], stage:'IIIB' },
      { t:['T1','T2','T3a','T3b','T4'], n:['N1'], m:['M0'], stage:'IVA' },
      { t:['T1','T2','T3a','T3b','T4'], n:['N0','N1'], m:['M1a','M1b','M1c'], stage:'IVB' },
    ],
  },
  // ── 子宮頸癌 ──
  { name: '子宮頸癌', edition: 'FIGO 2018 / UICC第8版',
    tOptions: [
      { value: 'T1a1', label: 'T1a1(IA1): 間質浸潤 ≦3mm' },
      { value: 'T1a2', label: 'T1a2(IA2): 間質浸潤 3-5mm' },
      { value: 'T1b1', label: 'T1b1(IB1): ≦2cm' },
      { value: 'T1b2', label: 'T1b2(IB2): 2-4cm' },
      { value: 'T1b3', label: 'T1b3(IB3): ≧4cm' },
      { value: 'T2a', label: 'T2a(IIA): 膣上2/3, 子宮傍組織(−)' },
      { value: 'T2b', label: 'T2b(IIB): 子宮傍組織浸潤' },
      { value: 'T3a', label: 'T3a(IIIA): 膣下1/3' },
      { value: 'T3b', label: 'T3b(IIIB): 骨盤壁/水腎症' },
      { value: 'T4', label: 'T4(IVA): 膀胱/直腸粘膜浸潤' },
    ],
    nOptions: [
      { value: 'N0', label: 'N0: 転移なし' },
      { value: 'N1', label: 'N1: 所属リンパ節転移(IIIC1:骨盤/IIIC2:傍大動脈)' },
    ],
    mOptions: [
      { value: 'M0', label: 'M0: 遠隔転移なし' },
      { value: 'M1', label: 'M1(IVB): 遠隔転移あり' },
    ],
    rules: [
      { t:['T1a1'], n:['N0'], m:['M0'], stage:'IA1' },
      { t:['T1a2'], n:['N0'], m:['M0'], stage:'IA2' },
      { t:['T1b1'], n:['N0'], m:['M0'], stage:'IB1' },
      { t:['T1b2'], n:['N0'], m:['M0'], stage:'IB2' },
      { t:['T1b3'], n:['N0'], m:['M0'], stage:'IB3' },
      { t:['T2a'], n:['N0'], m:['M0'], stage:'IIA' },
      { t:['T2b'], n:['N0'], m:['M0'], stage:'IIB' },
      { t:['T3a'], n:['N0'], m:['M0'], stage:'IIIA' },
      { t:['T3b'], n:['N0'], m:['M0'], stage:'IIIB' },
      { t:['T1a1','T1a2','T1b1','T1b2','T1b3','T2a','T2b','T3a','T3b','T4'], n:['N1'], m:['M0'], stage:'IIIC' },
      { t:['T4'], n:['N0'], m:['M0'], stage:'IVA' },
      { t:['T1a1','T1a2','T1b1','T1b2','T1b3','T2a','T2b','T3a','T3b','T4'], n:['N0','N1'], m:['M1'], stage:'IVB' },
    ],
  },
  // ── 子宮体癌 ──
  { name: '子宮体癌', edition: 'FIGO 2023 / UICC第8版',
    tOptions: [
      { value: 'T1a', label: 'T1a(IA): 筋層1/2未満' },
      { value: 'T1b', label: 'T1b(IB): 筋層1/2以上' },
      { value: 'T2', label: 'T2(II): 子宮頸部間質浸潤' },
      { value: 'T3a', label: 'T3a(IIIA): 漿膜/付属器浸潤' },
      { value: 'T3b', label: 'T3b(IIIB): 膣/子宮傍組織浸潤' },
      { value: 'T4', label: 'T4(IVA): 膀胱/腸管粘膜浸潤' },
    ],
    nOptions: [
      { value: 'N0', label: 'N0: 転移なし' },
      { value: 'N1', label: 'N1: 骨盤リンパ節転移' },
      { value: 'N2', label: 'N2: 傍大動脈リンパ節転移' },
    ],
    mOptions: [
      { value: 'M0', label: 'M0: 遠隔転移なし' },
      { value: 'M1', label: 'M1(IVB): 遠隔転移あり' },
    ],
    rules: [
      { t:['T1a'], n:['N0'], m:['M0'], stage:'IA' },
      { t:['T1b'], n:['N0'], m:['M0'], stage:'IB' },
      { t:['T2'], n:['N0'], m:['M0'], stage:'II' },
      { t:['T3a'], n:['N0'], m:['M0'], stage:'IIIA' },
      { t:['T3b'], n:['N0'], m:['M0'], stage:'IIIB' },
      { t:['T1a','T1b','T2','T3a','T3b'], n:['N1'], m:['M0'], stage:'IIIC1' },
      { t:['T1a','T1b','T2','T3a','T3b'], n:['N2'], m:['M0'], stage:'IIIC2' },
      { t:['T4'], n:['N0','N1','N2'], m:['M0'], stage:'IVA' },
      { t:['T1a','T1b','T2','T3a','T3b','T4'], n:['N0','N1','N2'], m:['M1'], stage:'IVB' },
    ],
  },
  // ── 甲状腺癌 ──
  { name: '甲状腺癌', edition: 'UICC第8版 (2017)',
    tOptions: [
      { value: 'T1a', label: 'T1a: ≦1cm 甲状腺限局' },
      { value: 'T1b', label: 'T1b: 1-2cm 甲状腺限局' },
      { value: 'T2', label: 'T2: 2-4cm 甲状腺限局' },
      { value: 'T3a', label: 'T3a: >4cm 甲状腺限局' },
      { value: 'T3b', label: 'T3b: 舌骨下筋群浸潤' },
      { value: 'T4a', label: 'T4a: 喉頭/気管/食道/反回神経浸潤' },
      { value: 'T4b', label: 'T4b: 椎前筋膜/頸動脈/縦隔浸潤' },
    ],
    nOptions: [
      { value: 'N0', label: 'N0: 転移なし' },
      { value: 'N1a', label: 'N1a: 気管前/傍気管/喉頭前' },
      { value: 'N1b', label: 'N1b: 頸部/上縦隔リンパ節' },
    ],
    mOptions: [
      { value: 'M0', label: 'M0: 遠隔転移なし' },
      { value: 'M1', label: 'M1: 遠隔転移あり' },
    ],
    rules: [
      { t:['T1a','T1b'], n:['N0'], m:['M0'], stage:'I (※55歳未満はI-II)' },
      { t:['T2'], n:['N0'], m:['M0'], stage:'I' },
      { t:['T1a','T1b','T2'], n:['N1a','N1b'], m:['M0'], stage:'II' },
      { t:['T3a','T3b'], n:['N0','N1a','N1b'], m:['M0'], stage:'II' },
      { t:['T4a'], n:['N0','N1a','N1b'], m:['M0'], stage:'III' },
      { t:['T4b'], n:['N0','N1a','N1b'], m:['M0'], stage:'IVA' },
      { t:['T1a','T1b','T2','T3a','T3b','T4a','T4b'], n:['N0','N1a','N1b'], m:['M1'], stage:'IVB' },
    ],
  },
  // ── 胆道癌（肝外胆管） ──
  { name: '胆道癌', edition: 'UICC第8版 (2017)',
    tOptions: [
      { value: 'Tis', label: 'Tis: 上皮内癌' },
      { value: 'T1', label: 'T1: 胆管壁内限局' },
      { value: 'T2a', label: 'T2a: 胆管壁越え周囲脂肪浸潤' },
      { value: 'T2b', label: 'T2b: 肝実質浸潤' },
      { value: 'T3', label: 'T3: 片側門脈/肝動脈浸潤' },
      { value: 'T4', label: 'T4: 門脈本幹/両側門脈/総肝動脈浸潤' },
    ],
    nOptions: [
      { value: 'N0', label: 'N0: 転移なし' },
      { value: 'N1', label: 'N1: 1-3個' },
      { value: 'N2', label: 'N2: ≧4個' },
    ],
    mOptions: [
      { value: 'M0', label: 'M0: 遠隔転移なし' },
      { value: 'M1', label: 'M1: 遠隔転移あり' },
    ],
    rules: [
      { t:['Tis'], n:['N0'], m:['M0'], stage:'0' },
      { t:['T1'], n:['N0'], m:['M0'], stage:'I' },
      { t:['T2a','T2b'], n:['N0'], m:['M0'], stage:'II' },
      { t:['T3'], n:['N0'], m:['M0'], stage:'IIIA' },
      { t:['T1','T2a','T2b','T3'], n:['N1'], m:['M0'], stage:'IIIB' },
      { t:['T4'], n:['N0','N1'], m:['M0'], stage:'IIIB' },
      { t:['Tis','T1','T2a','T2b','T3','T4'], n:['N2'], m:['M0'], stage:'IIIB' },
      { t:['Tis','T1','T2a','T2b','T3','T4'], n:['N0','N1','N2'], m:['M1'], stage:'IV' },
    ],
  },
  // ── 頭頸部癌（口腔） ──
  { name: '頭頸部癌', edition: 'UICC第8版 (2017) 口腔',
    tOptions: [
      { value: 'Tis', label: 'Tis: 上皮内癌' },
      { value: 'T1', label: 'T1: ≦2cm DOI≦5mm' },
      { value: 'T2', label: 'T2: ≦2cm DOI>5-10mm / 2-4cm DOI≦10mm' },
      { value: 'T3', label: 'T3: >4cm / DOI>10mm' },
      { value: 'T4a', label: 'T4a: 上顎骨/下顎骨皮質/上顎洞/顔面皮膚浸潤' },
      { value: 'T4b', label: 'T4b: 咀嚼筋間隙/翼突板/頭蓋底/内頸動脈浸潤' },
    ],
    nOptions: [
      { value: 'N0', label: 'N0: 転移なし' },
      { value: 'N1', label: 'N1: 同側単発 ≦3cm ENE(−)' },
      { value: 'N2a', label: 'N2a: 同側単発 3-6cm ENE(−)' },
      { value: 'N2b', label: 'N2b: 同側多発 ≦6cm ENE(−)' },
      { value: 'N2c', label: 'N2c: 両側/対側 ≦6cm ENE(−)' },
      { value: 'N3a', label: 'N3a: >6cm ENE(−)' },
      { value: 'N3b', label: 'N3b: ENE(+)' },
    ],
    mOptions: [
      { value: 'M0', label: 'M0: 遠隔転移なし' },
      { value: 'M1', label: 'M1: 遠隔転移あり' },
    ],
    rules: [
      { t:['Tis'], n:['N0'], m:['M0'], stage:'0' },
      { t:['T1'], n:['N0'], m:['M0'], stage:'I' },
      { t:['T2'], n:['N0'], m:['M0'], stage:'II' },
      { t:['T3'], n:['N0'], m:['M0'], stage:'III' },
      { t:['T1','T2','T3'], n:['N1'], m:['M0'], stage:'III' },
      { t:['T1','T2','T3','T4a'], n:['N2a','N2b','N2c'], m:['M0'], stage:'IVA' },
      { t:['T4a'], n:['N0','N1'], m:['M0'], stage:'IVA' },
      { t:['T4b'], n:['N0','N1','N2a','N2b','N2c'], m:['M0'], stage:'IVB' },
      { t:['T1','T2','T3','T4a','T4b'], n:['N3a','N3b'], m:['M0'], stage:'IVB' },
      { t:['Tis','T1','T2','T3','T4a','T4b'], n:['N0','N1','N2a','N2b','N2c','N3a','N3b'], m:['M1'], stage:'IVC' },
    ],
  },
]

// ──────── Stage判定関数 ────────
function getStage(cancer: CancerDef, t: string, n: string, m: string): string | null {
  for (const rule of cancer.rules) {
    if (rule.t.includes(t) && rule.n.includes(n) && rule.m.includes(m)) {
      return rule.stage
    }
  }
  return null
}

function stageColor(stage: string): string {
  if (stage.startsWith('IV')) return 'bg-dnl text-dn'
  if (stage.startsWith('III')) return 'bg-wnl text-wn'
  return 'bg-okl text-ok'
}

// ──────── コンポーネント ────────
export default function TnmStagingPage() {
  const [selected, setSelected] = useState(0)
  const [tVal, setTVal] = useState('')
  const [nVal, setNVal] = useState('')
  const [mVal, setMVal] = useState('')

  const cancer = cancers[selected]
  const stage = tVal && nVal && mVal ? getStage(cancer, tVal, nVal, mVal) : null

  const handleCancerChange = (i: number) => {
    setSelected(i)
    setTVal('')
    setNVal('')
    setMVal('')
  }

  const resultNode = stage ? (
    <ResultCard
      value={`Stage ${stage}`}
      label={`${tVal} / ${nVal} / ${mVal}`}
      severity={stage.startsWith('IV') ? 'dn' : stage.startsWith('III') ? 'wn' : 'ok'}
    />
  ) : null

  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={resultNode}
      explanation={<div className="text-sm text-muted"><p>T・N・Mを選択するとStageが自動表示されます。最新版はUICC TNM分類原著を参照してください。</p></div>}
      relatedTools={[{slug:'ann-arbor',name:'Ann Arbor(リンパ腫)'},{slug:'ecog',name:'ECOG PS'}]}
      references={toolDef.sources||[]}
    >
      {/* 癌種セレクター */}
      <div className="flex gap-1.5 mb-4 overflow-x-auto pb-1">
        {cancers.map((c,i)=>(
          <button key={i} onClick={()=>handleCancerChange(i)}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${selected===i?'bg-ac text-white':'bg-s0 border border-br text-muted hover:border-ac/30'}`}>
            {c.name}
          </button>
        ))}
      </div>
      <div className="text-xs text-muted mb-4">{cancer.edition}</div>

      {/* T分類 */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-tx mb-1.5">T — 原発腫瘍</h3>
        <div className="space-y-1">
          {cancer.tOptions.map(opt => (
            <button key={opt.value} onClick={() => setTVal(opt.value)}
              className={`w-full text-left p-2 rounded-lg border text-xs transition-all ${tVal === opt.value ? 'border-ac bg-ac/10 text-ac font-semibold' : 'border-br bg-s0 text-tx hover:border-ac/30'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* N分類 */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-tx mb-1.5">N — 所属リンパ節</h3>
        <div className="space-y-1">
          {cancer.nOptions.map(opt => (
            <button key={opt.value} onClick={() => setNVal(opt.value)}
              className={`w-full text-left p-2 rounded-lg border text-xs transition-all ${nVal === opt.value ? 'border-ac bg-ac/10 text-ac font-semibold' : 'border-br bg-s0 text-tx hover:border-ac/30'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* M分類 */}
      <div className="mb-4">
        <h3 className="text-sm font-bold text-tx mb-1.5">M — 遠隔転移</h3>
        <div className="space-y-1">
          {cancer.mOptions.map(opt => (
            <button key={opt.value} onClick={() => setMVal(opt.value)}
              className={`w-full text-left p-2 rounded-lg border text-xs transition-all ${mVal === opt.value ? 'border-ac bg-ac/10 text-ac font-semibold' : 'border-br bg-s0 text-tx hover:border-ac/30'}`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Stage一覧（参照用） */}
      <div>
        <h3 className="text-sm font-bold text-tx mb-1.5">Stage分類一覧</h3>
        <div className="flex flex-wrap gap-1.5">
          {cancer.rules.map((r, i) => {
            const isMatch = stage && r.stage === stage
            return (
              <span key={i} className={`text-xs px-2.5 py-1 rounded-full font-medium ${isMatch ? 'ring-2 ring-ac ring-offset-1' : ''} ${stageColor(r.stage)}`}>
                {r.stage}: {r.t.length <= 3 ? r.t.join('/') : 'T*'}{r.n.length <= 2 ? r.n.join('/') : 'N*'}{r.m[0]}
              </span>
            )
          })}
        </div>
      </div>
    </CalculatorLayout>
  )
}
