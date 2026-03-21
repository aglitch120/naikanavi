// ═══════════════════════════════════════════════════════════════
//  カルテテキスト → J-OSLER病歴要約セクション 自動振り分けエンジン v2
//  AI不使用・正規表現ベース・ブラウザ完結
//
//  対応フォーマット:
//  - 電子カルテの検査テーブル（スペース区切り列、H/Lフラグ、日付ヘッダー）
//  - プロブレムリスト形式（#1, ＃, d/d等）
//  - 経過記載（Day X, X/X, 入院X日目）
//  - CT/画像レポート（放射線科フォーマット）
//  - 処方リスト（用量・用法・分X付き）
//  - 紹介状・IC記録
// ═══════════════════════════════════════════════════════════════

import { convertPrescriptionToGeneric } from './drug-name-converter'
import type { DiseaseTemplate } from './josler-templates'

export interface ParsedKarte {
  chiefComplaint: string
  history: string
  presentIllness: string
  physicalExam: string
  labFindings: string
  imaging: string
  problemList: string
  course: string
  dischargeMeds: string
  diagnosis: string
  unparsed: string
}

// ═══ 電子カルテ検査テーブルのパーサー ═══
// 「WBC    H    13.8」「CRP    H    0.85」のようなスペース区切り形式を認識
function parseLabTable(text: string): { labs: string; remaining: string } {
  const lines = text.split('\n')
  const labLines: string[] = []
  const otherLines: string[] = []

  // 検査項目名パターン（日本の電子カルテで一般的な項目）
  const labItemPattern = /^(?:WBC|RBC|HGB|HCT|MCV|MCH|MCHC|PLT|RDW|PDW|TP|ALB|T-CHO|GLU|UN|CREAT|eGFR|UA|Na|K(?:\+)?|CL|IP|CA|T-BIL|D-BIL|AST|ALT|ALP|LD|CK|AMY|γ-GT|CRP|BNP|NT-proBNP|心筋ﾄﾛﾎﾟﾆﾝ|PCT|ﾌﾟﾛｶﾙｼﾄﾆﾝ|FIB-4|乳酸|アンモニア|Hｂ-A1ｃ|PT-|APTT|D-ﾀﾞｲﾏｰ|ﾌｨﾌﾞﾘﾉｰｹﾞﾝ|pH|pCO2|pO2|HCO3|BE|ｓO2|Lactate|AnGap|Fe|TIBC|ﾌｪﾘﾁﾝ|Neut|Lymph|Mono|Eosi|Baso|SEG|STAB|LYMPHO|Mg|重炭酸|CK-MB|LDH|LD-IFCC|ALP-IFCC|CHE|HDL|LDL|TG|TSH|Free T|ｺﾙﾁｿﾞｰﾙ|ACTH|AFP|PIVKA|CEA|SCC|CA19|KL-6|SP-D|尿蛋白|尿糖|比重|潜血|白血球反応|亜硝酸|P\/C比|A\/C比|赤血球|白血球|円柱|細菌|eGFR-IND|CCR|尿NA|尿K|尿CL|尿浸透圧|尿CREAT|尿TP|INR|APTT|Glu(?:NaF)?|SP-A|IgG|IgA|IgM|RF|抗核抗体|MPO|PR3|NSE|Pro-GRP|ｼﾌﾗ|SLX|網赤血球|IPF)/i

  // 日付ヘッダー行パターン
  const dateHeaderPattern = /^\s*(?:救急|呼内|循内|消内|糖内|外科|整外|泌外|産婦|精神|皮膚|眼科|耳鼻|放射|麻酔|病理|リハ)\s/
  const dateRowPattern = /^\s*20\d{2}[-\/]\d{1,2}[-\/]\d{1,2}/

  // セクション区切り（「血算」「ﾌﾟﾛﾄﾛﾝﾋﾞﾝ時間」「尿定性」「救急ｶﾞｽ分析」等）
  const sectionDivider = /^(?:血算|ﾌﾟﾛﾄﾛﾝﾋﾞﾝ時間|尿定性|尿沈渣|救急ｶﾞｽ分析|血液像|ＡＢＯ血液型|RH|不規則抗体|交差)/

  let inLabTable = false

  for (const line of lines) {
    const trimmed = line.trim()
    if (!trimmed) { otherLines.push(line); continue }

    // 日付ヘッダー行 or 科名ヘッダー行 → ラボテーブルの一部
    if (dateHeaderPattern.test(trimmed) || dateRowPattern.test(trimmed)) {
      inLabTable = true
      continue // ヘッダー行自体はスキップ
    }

    // セクション区切り（「血算-----」等）
    if (sectionDivider.test(trimmed)) {
      inLabTable = true
      continue
    }

    // 検査項目行の判定
    if (labItemPattern.test(trimmed)) {
      inLabTable = true
      // 数値を抽出（H/Lフラグ付き）
      const match = trimmed.match(/^(.+?)\s+([HL])?\s*([\d.]+(?:再検査|仮報告)?)\s*$/)
      if (match) {
        const name = match[1].trim()
        const flag = match[2] || ''
        const value = match[3].replace(/再検査|仮報告/g, '')
        if (value && !isNaN(parseFloat(value))) {
          labLines.push(`${name} ${value}${flag ? ` (${flag})` : ''}`)
        }
      } else {
        // テーブル形式で複数列がある場合、最初の数値のみ取得
        const multiMatch = trimmed.match(/^(.+?)\s+(?:[HL]\s+)?([\d.]+)/)
        if (multiMatch) {
          labLines.push(`${multiMatch[1].trim()} ${multiMatch[2]}`)
        }
      }
      continue
    }

    // ラボテーブルの途中の空データ行（項目名のみで値なし）
    if (inLabTable && /^\s*[A-Za-zﾞﾟ\u3000-\u9FFF]+\s*$/.test(trimmed) && trimmed.length < 40) {
      continue // 値なしの検査項目行はスキップ
    }

    // ラボテーブルを抜けた
    if (inLabTable && !labItemPattern.test(trimmed)) {
      inLabTable = false
    }

    otherLines.push(line)
  }

  return {
    labs: labLines.length > 0 ? labLines.join('\n') : '',
    remaining: otherLines.join('\n'),
  }
}

// ═══ プロブレムリスト検出 ═══
function extractProblemList(text: string): { problems: string; remaining: string } {
  const lines = text.split('\n')
  const problemLines: string[] = []
  const otherLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()
    // #1, #2, ＃, d/d, abx 等のプロブレムリスト行
    if (/^[#＃]\s*\.?\s*\d*\.?\s*.+/.test(trimmed) || /^[#＃]\s/.test(trimmed)) {
      problemLines.push(trimmed)
    } else if (problemLines.length > 0 && /^\s{2,}/.test(line) && trimmed.length > 0) {
      // インデントされた続き行
      problemLines[problemLines.length - 1] += ' ' + trimmed
    } else {
      otherLines.push(line)
    }
  }

  return {
    problems: problemLines.join('\n'),
    remaining: otherLines.join('\n'),
  }
}

// ═══ バイタルサイン検出 ═══
function extractVitals(text: string): { vitals: string; remaining: string } {
  const lines = text.split('\n')
  const vitalLines: string[] = []
  const otherLines: string[] = []

  const vitalPattern = /(?:BT|体温|℃|BP|血圧|SpO2|HR|PR|脈拍|RR|呼吸数|JCS|GCS|general|sBP|意識)/i

  for (const line of lines) {
    const trimmed = line.trim()
    if (vitalPattern.test(trimmed) && trimmed.length < 200) {
      vitalLines.push(trimmed)
    } else {
      otherLines.push(line)
    }
  }

  return {
    vitals: vitalLines.join('\n'),
    remaining: otherLines.join('\n'),
  }
}

// ═══ 身体所見検出 ═══
function extractPhysicalExam(text: string): { pe: string; remaining: string } {
  const lines = text.split('\n')
  const peLines: string[] = []
  const otherLines: string[] = []

  const pePattern = /(?:胸部|腹部|心音|呼吸音|心雑音|ラ音|crackles|wheezes|浮腫|圧痛|反跳痛|筋性防御|CVA叩打|項部硬直|瞳孔|対光反射|Babinski|腱反射|肝脾腫|蜘蛛状|手掌紅斑|眼瞼結膜|眼球結膜|リンパ節|皮疹|発赤|腫脹|褥瘡|四肢|打撲|蜂窩織炎|下腿浮腫|Killip|sick|胸郭|鼓音|肛門)/i

  for (const line of lines) {
    const trimmed = line.trim()
    if (pePattern.test(trimmed) && trimmed.length < 300) {
      peLines.push(trimmed)
    } else {
      otherLines.push(line)
    }
  }

  return {
    pe: peLines.join('\n'),
    remaining: otherLines.join('\n'),
  }
}

// ═══ 画像レポート検出 ═══
function extractImaging(text: string): { imaging: string; remaining: string } {
  const lines = text.split('\n')
  const imgLines: string[] = []
  const otherLines: string[] = []
  let inImgReport = false

  for (const line of lines) {
    const trimmed = line.trim()

    // 画像レポート開始パターン
    if (/^(?:CT|MRI|CXR|ECG|心電図|胸部X|腹部|頭部)/.test(trimmed) &&
      /(?:所見|レポート|診断|比較|撮像|\d{4})/.test(trimmed)) {
      inImgReport = true
      imgLines.push(trimmed)
      continue
    }

    // レポート内の診断行
    if (inImgReport) {
      if (trimmed === '' && imgLines.length > 0) {
        // 空行でレポート終了の可能性
        const nextNonEmpty = lines.indexOf(line) + 1
        if (nextNonEmpty < lines.length && lines[nextNonEmpty].trim() === '') {
          inImgReport = false
        }
        imgLines.push('')
      } else if (/^(?:診断|所見|他|ほか|前回|比較|心拡大|肺|肝|膵|脾|腎|胆|腹|胸|脳|骨|左|右|両)/.test(trimmed)) {
        imgLines.push(trimmed)
      } else {
        inImgReport = false
        otherLines.push(line)
      }
      continue
    }

    // ECG所見
    if (/^ECG|^心電図/.test(trimmed)) {
      imgLines.push(trimmed)
      continue
    }

    // CXR所見
    if (/^CXR/.test(trimmed)) {
      imgLines.push(trimmed)
      continue
    }

    otherLines.push(line)
  }

  return {
    imaging: imgLines.filter(l => l.trim()).join('\n'),
    remaining: otherLines.join('\n'),
  }
}

// ═══ 処方検出 ═══
function extractPrescription(text: string): { rx: string; remaining: string } {
  const lines = text.split('\n')
  const rxLines: string[] = []
  const otherLines: string[] = []
  let inRx = false

  const rxHeaderPattern = /(?:退院時処方|常用薬|内服薬|内服|処方|RP|Rp)/
  const rxItemPattern = /(?:mg|μg|mL|g\/日|錠|カプセル|包|本|1[Xx]|[23][Xx]|分[123]|1日[123]回|朝|昼|夕|眠前|就寝前|食後|食前|頓用|吸入|点眼)/

  for (const line of lines) {
    const trimmed = line.trim()

    if (rxHeaderPattern.test(trimmed)) {
      inRx = true
      continue
    }

    if (inRx && rxItemPattern.test(trimmed)) {
      rxLines.push(trimmed)
      continue
    }

    if (inRx && trimmed === '') {
      inRx = false
    }

    // 処方ヘッダーなしでも処方っぽい行
    if (!inRx && rxItemPattern.test(trimmed) && trimmed.length < 150 &&
      /[a-zA-Zぁ-ん]/.test(trimmed) && /\d/.test(trimmed)) {
      rxLines.push(trimmed)
      continue
    }

    otherLines.push(line)
  }

  return {
    rx: rxLines.length > 0 ? convertPrescriptionToGeneric(rxLines.join('\n')) : '',
    remaining: otherLines.join('\n'),
  }
}

// ═══ 経過記載検出 ═══
function extractCourse(text: string): { course: string; remaining: string } {
  const lines = text.split('\n')
  const courseLines: string[] = []
  const otherLines: string[] = []

  const coursePattern = /^(?:\d{1,2}\/\d{1,2}|Day\s*\d|第\d+|入院\d+日|20\d{2}\/\d{1,2}\/\d{1,2})/

  for (const line of lines) {
    const trimmed = line.trim()
    if (coursePattern.test(trimmed)) {
      courseLines.push(trimmed)
    } else {
      otherLines.push(line)
    }
  }

  return {
    course: courseLines.join('\n'),
    remaining: otherLines.join('\n'),
  }
}

// ═══ セクションヘッダーベースのパーサー ═══
const SECTION_HEADERS: { key: keyof ParsedKarte; patterns: RegExp[] }[] = [
  { key: 'chiefComplaint', patterns: [/^(?:【)?主\s*訴(?:】)?[：:\s]/m, /^(?:S\))/m] },
  { key: 'presentIllness', patterns: [/^(?:【)?現\s*病\s*歴(?:】)?[：:\s]/m, /^(?:【)?病\s*歴(?:】)?[：:\s]/m] },
  { key: 'history', patterns: [/^(?:【)?既\s*往\s*歴(?:】)?[：:\s]/m, /^(?:【)?生\s*活\s*(?:歴|社会歴)(?:】)?[：:\s]/m, /^(?:【)?家\s*族\s*歴(?:】)?[：:\s]/m, /^(?:【)?アレルギー(?:】)?[：:\s]/m] },
  { key: 'diagnosis', patterns: [/^(?:【)?(?:確定)?診\s*断(?:名)?(?:】)?[：:\s]/m, /^(?:【)?(?:入院時)?診断(?:】)?[：:\s]/m] },
  { key: 'dischargeMeds', patterns: [/^(?:【)?(?:退院時)?処\s*方(?:】)?[：:\s]/m, /^(?:【)?常\s*用\s*薬(?:】)?[：:\s]/m] },
]

function extractByHeaders(text: string): Partial<ParsedKarte> {
  const result: Partial<ParsedKarte> = {}

  for (const { key, patterns } of SECTION_HEADERS) {
    for (const pattern of patterns) {
      const match = text.match(pattern)
      if (match && match.index !== undefined) {
        const start = match.index + match[0].length
        // 次のセクションヘッダーまたはテキスト終端まで
        const nextHeaders = SECTION_HEADERS.flatMap(s => s.patterns)
        let end = text.length
        for (const np of nextHeaders) {
          const nm = text.slice(start).match(np)
          if (nm && nm.index !== undefined && nm.index > 0 && (start + nm.index) < end) {
            end = start + nm.index
          }
        }
        const content = text.slice(start, end).trim()
        if (content) {
          if (result[key]) {
            result[key] += '\n' + content
          } else {
            result[key] = content
          }
        }
        break
      }
    }
  }

  return result
}

// ═══ メインパーサー（v2） ═══
export function parseKarteText(text: string): ParsedKarte {
  const result: ParsedKarte = {
    chiefComplaint: '', history: '', presentIllness: '', physicalExam: '',
    labFindings: '', imaging: '', problemList: '', course: '',
    dischargeMeds: '', diagnosis: '', unparsed: '',
  }

  if (!text.trim()) return result

  // Phase 1: ヘッダーベースの抽出
  const headerExtracted = extractByHeaders(text)
  Object.assign(result, headerExtracted)

  // Phase 2: 検査テーブルの抽出
  const { labs, remaining: afterLabs } = parseLabTable(text)
  if (labs) result.labFindings = labs

  // Phase 3: プロブレムリスト抽出
  const { problems, remaining: afterProblems } = extractProblemList(afterLabs)
  if (problems) result.problemList = problems

  // Phase 4: バイタルサイン抽出
  const { vitals, remaining: afterVitals } = extractVitals(afterProblems)

  // Phase 5: 身体所見抽出
  const { pe, remaining: afterPE } = extractPhysicalExam(afterVitals)
  if (vitals || pe) {
    result.physicalExam = [vitals, pe].filter(Boolean).join('\n')
  }

  // Phase 6: 画像レポート抽出
  const { imaging, remaining: afterImaging } = extractImaging(afterPE)
  if (imaging) result.imaging = imaging

  // Phase 7: 処方抽出
  const { rx, remaining: afterRx } = extractPrescription(afterImaging)
  if (rx) result.dischargeMeds = rx

  // Phase 8: 経過記載抽出
  const { course, remaining: afterCourse } = extractCourse(afterRx)
  if (course) result.course = course

  // 主訴（ヘッダーで取れなかった場合）
  if (!result.chiefComplaint) {
    // 最初の短い行を主訴として推定
    const firstLines = text.split('\n').filter(l => l.trim()).slice(0, 3)
    for (const line of firstLines) {
      if (line.trim().length <= 25 && line.trim().length > 2) {
        result.chiefComplaint = line.trim()
        break
      }
    }
  }

  // 現病歴（ヘッダーで取れなかった場合、残りのテキストを使用）
  if (!result.presentIllness && afterCourse.trim()) {
    // IC記録・紹介状を除外
    const filtered = afterCourse.split('\n').filter(l => {
      const t = l.trim()
      return t && !/^(?:ご家族|奥様|娘|KP|キーパーソン|IC|来院|御侍史|拝見|お忙しい|上記|何卒|宜しく)/.test(t)
    }).join('\n')
    if (filtered.trim()) result.presentIllness = filtered.trim()
  }

  // 既往歴の文字数制限
  if (result.history && result.history.length > 100) {
    result.history = result.history.slice(0, 100)
  }

  // 主訴の文字数制限
  if (result.chiefComplaint && result.chiefComplaint.length > 25) {
    result.chiefComplaint = result.chiefComplaint.slice(0, 25)
  }

  return result
}

// ═══ 考察テンプレート生成 ═══
export function generateDiscussionTemplate(
  template: DiseaseTemplate | undefined,
  problemList: string,
  diagnosis: string,
): { courseTemplate: string; discussionTemplate: string } {
  if (!template) {
    return {
      courseTemplate: `【経過】\n（入院後の治療経過を時系列で記載）\n\n【考察】\n（診断根拠・鑑別除外・治療選択の根拠を記載）`,
      discussionTemplate: `（診断・治療の過程を文献を引用しながら考察）\n\n（文献）\n1. \n2. `,
    }
  }

  const problems = problemList.split('\n').filter(l => l.trim().startsWith('#') || l.trim().startsWith('＃')).map(l => l.trim())
  const mainProblem = problems[0] || `#1 ${template.disease}`

  let courseTemplate = `${mainProblem}\n【経過】\n`
  courseTemplate += `入院後, ${template.standardTreatment.slice(0, 2).join(', ') || '〈治療内容〉'}を開始した. `
  courseTemplate += `〈治療経過・検査値の推移を時系列で記載〉. 〈転帰〉.\n\n`
  courseTemplate += `【考察】\n`
  courseTemplate += `本症例は〈主訴・所見〉から${template.disease}と診断した. `

  if (template.differentialDiagnosis.length > 0) {
    courseTemplate += `鑑別として${template.differentialDiagnosis.slice(0, 3).join(', ')}を考慮したが, `
    courseTemplate += `〈各々の除外根拠〉より否定的であった. `
  }

  if (template.guidelineRef) {
    courseTemplate += `${template.guidelineRef}に準じた治療方針とした. `
  }

  let discussionTemplate = `本症例は〈年齢〉歳〈性別〉に発症した${template.disease}の症例である. `
  if (template.standardTreatment.length > 0) {
    discussionTemplate += `治療は${template.standardTreatment.join(', ')}を行い, 〈転帰〉. `
  }
  discussionTemplate += `\n\n（文献）\n1. （PubMed: ${template.pubmedQuery}）\n2. `
  if (template.guidelineRef) discussionTemplate += `\n3. ${template.guidelineRef}`

  return { courseTemplate, discussionTemplate }
}
