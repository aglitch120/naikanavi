'use client'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('failure-mnemonic')!
const items = [
  { letter: 'F', word: 'Forgot medication', ja: '服薬忘れ・中断', detail: '利尿薬・ACE-I/ARB・β遮断薬の中断' },
  { letter: 'A', word: 'Arrhythmia / Anemia', ja: '不整脈・貧血', detail: '心房細動(新規/頻脈)、貧血(Hb低下)' },
  { letter: 'I', word: 'Ischemia / Infection', ja: '虚血・感染', detail: 'ACS、肺炎・尿路感染等' },
  { letter: 'L', word: 'Lifestyle', ja: '生活習慣', detail: '塩分過多・過剰飲水・アルコール' },
  { letter: 'U', word: 'Upregulators', ja: '心負荷増大薬', detail: 'NSAIDs・ステロイド・Ca拮抗薬(一部)' },
  { letter: 'R', word: 'Renal failure', ja: '腎不全悪化', detail: 'AKI/CKD進行 → 水Na貯留' },
  { letter: 'E', word: 'Embolism', ja: '肺塞栓', detail: 'PE → 急性右心不全' },
]
export default function FailureMnemonicPage() {
  return (
    <CalculatorLayout slug={toolDef.slug} title={toolDef.name} titleEn={toolDef.nameEn} description={toolDef.description}
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<div className="text-sm text-muted"><p>心不全増悪時の原因検索チェックリスト。入院時に全項目をスクリーニングする。</p></div>}
      relatedTools={[{slug:'nyha',name:'NYHA'}]}
      references={toolDef.sources||[]}
    >
      <div className="space-y-2">{items.map(item=>(
        <div key={item.letter} className="p-3 bg-s0 rounded-xl border border-br">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 bg-ac text-white rounded-lg flex items-center justify-center text-sm font-bold shrink-0">{item.letter}</span>
            <div>
              <p className="text-sm font-bold text-tx">{item.word} — {item.ja}</p>
              <p className="text-xs text-muted">{item.detail}</p>
            </div>
          </div>
        </div>
      ))}</div>
    </CalculatorLayout>
  )
}
