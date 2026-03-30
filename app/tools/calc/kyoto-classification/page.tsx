'use client'
import CalculatorLayout from '@/components/tools/CalculatorLayout'
import { getToolBySlug, categoryLabels, categoryIcons } from '@/lib/tools-config'
const toolDef = getToolBySlug('kyoto-classification')!

// ○=観察されることが多い △=観察されることがある ×=観察されない
// 京都分類 表1: 胃炎の京都分類（内視鏡所見と H.pylori 感染状態）
const findings: { location: string; items: { name: string; en: string; infected: string; uninfected: string; postErad: string }[] }[] = [
  { location: '胃粘膜全体', items: [
    { name: '萎縮', en: 'atrophy', infected: '○', uninfected: '×', postErad: '○〜×' },
    { name: 'びまん性発赤', en: 'diffuse redness', infected: '○', uninfected: '×', postErad: '×' },
    { name: '腺窩上皮過形成性ポリープ', en: 'foveolar-hyperplastic polyp', infected: '○', uninfected: '×', postErad: '○〜×' },
    { name: '地図状発赤', en: 'map-like redness', infected: '×', uninfected: '×', postErad: '○' },
    { name: '黄色腫', en: 'xanthoma', infected: '○', uninfected: '×', postErad: '○' },
    { name: 'ヘマチン', en: 'hematin', infected: '△', uninfected: '○', postErad: '○' },
    { name: '稜線状発赤', en: 'red streak', infected: '△', uninfected: '○', postErad: '○' },
    { name: '腸上皮化生', en: 'intestinal metaplasia', infected: '○', uninfected: '×', postErad: '○〜△' },
    { name: '粘膜腫脹', en: 'mucosal swelling', infected: '○', uninfected: '×', postErad: '×' },
    { name: '斑状発赤', en: 'patchy redness', infected: '○', uninfected: '○', postErad: '○' },
    { name: '陥凹型びらん', en: 'depressive erosion', infected: '○', uninfected: '○', postErad: '○' },
  ]},
  { location: '胃体部', items: [
    { name: '皺襞腫大・蛇行', en: 'enlarged fold, tortuous fold', infected: '○', uninfected: '×', postErad: '×' },
    { name: '白濁粘液', en: 'sticky mucus', infected: '○', uninfected: '×', postErad: '×' },
  ]},
  { location: '胃体部〜穹窿部', items: [
    { name: '胃底腺ポリープ', en: 'fundic gland polyp', infected: '×', uninfected: '○', postErad: '○' },
    { name: '点状発赤', en: 'spotty redness', infected: '○', uninfected: '×', postErad: '△〜×' },
    { name: '多発性白色扁平隆起', en: 'multiple white and flat elevated lesions', infected: '△', uninfected: '○', postErad: '○' },
  ]},
  { location: '胃体下部小弯〜胃角', items: [
    { name: 'RAC', en: 'regular arrangement of collecting venules', infected: '×', uninfected: '○', postErad: '×〜△' },
  ]},
  { location: '胃前庭部', items: [
    { name: '鳥肌', en: 'nodularity', infected: '○', uninfected: '×', postErad: '△〜×' },
    { name: '隆起型びらん', en: 'raised erosion', infected: '△', uninfected: '○', postErad: '○' },
  ]},
]

export default function KyotoClassificationPage() {
  return (
    <CalculatorLayout slug={toolDef.slug} title="胃炎の京都分類" titleEn="Kyoto Classification of Gastritis"
      description="内視鏡所見からH.pylori感染状態（現感染・未感染・除菌後）を推定するための体系的分類。"
      category={categoryLabels[toolDef.category]} categoryIcon={categoryIcons[toolDef.category]}
      result={null}
      explanation={<div className="text-sm text-muted space-y-1">
        <p>各内視鏡所見がH.pylori感染/未感染/除菌後のどの状態で観察されるかを示す。○=よく観察される △=観察されることがある ×=観察されない</p>
        <p className="text-xs">※本分類はスコアリングツールではなく、内視鏡所見の体系的整理です。胃癌リスク評価には別途ガイドラインを参照してください。</p>
      </div>}
      relatedTools={[{slug:'la-classification',name:'LA分類'}]}
      references={[
        {text:'春間 賢ほか. 胃炎の京都分類 改訂第2版. 日本メディカルセンター, 2018'},
        {text:'Sugano K, et al. Kyoto global consensus report on Helicobacter pylori gastritis. Gut. 2015;64:1353-1367'},
      ]}
    >
      <div className="space-y-4">
        {findings.map(section => (
          <div key={section.location}>
            <p className="text-xs font-bold text-ac mb-2">{section.location}</p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-s1">
                    <th className="text-left p-1.5 text-tx font-medium border-b border-br">所見</th>
                    <th className="text-center p-1.5 text-tx font-medium border-b border-br w-14">感染</th>
                    <th className="text-center p-1.5 text-tx font-medium border-b border-br w-14">未感染</th>
                    <th className="text-center p-1.5 text-tx font-medium border-b border-br w-14">除菌後</th>
                  </tr>
                </thead>
                <tbody>
                  {section.items.map(item => (
                    <tr key={item.name} className="border-b border-br/50">
                      <td className="p-1.5 text-tx">
                        <span className="font-medium">{item.name}</span>
                        <span className="text-muted ml-1">({item.en})</span>
                      </td>
                      <td className="text-center p-1.5">{item.infected}</td>
                      <td className="text-center p-1.5">{item.uninfected}</td>
                      <td className="text-center p-1.5">{item.postErad}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </CalculatorLayout>
  )
}
