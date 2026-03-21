// ── Journal database with Impact Factors (2024 JCR) ──

export interface Journal {
  id: string
  name: string
  shortName: string
  issn: string         // for PubMed search
  impactFactor: number // 2024 JCR
  category: 'top4' | 'general' | 'specialty' | 'japanese'
  /** 3層構造: core=全員表示, specialty_top=専門科連動Q1, specialty_ext=Q2以下オプション */
  tier: 'core' | 'specialty_top' | 'specialty_ext'
  /** JCR四分位: Q1が最上位 */
  jcrQuartile?: 'Q1' | 'Q2' | 'Q3' | 'Q4'
  specialty?: string
  lang?: 'en' | 'ja'
  /** ユーザーが何も設定しなくても表示するか */
  isDefault?: boolean
}

// Top 4 + major medical journals
export const JOURNALS: Journal[] = [
  // ── Top 4 (Big 4 General Medical) ──
  { id: 'lancet', name: 'The Lancet', shortName: 'Lancet', issn: '0140-6736', impactFactor: 98.4, category: 'top4', tier: 'core', jcrQuartile: 'Q1', isDefault: true },
  { id: 'nejm', name: 'New England Journal of Medicine', shortName: 'NEJM', issn: '0028-4793', impactFactor: 78.5, category: 'top4', tier: 'core', jcrQuartile: 'Q1', isDefault: true },
  { id: 'jama', name: 'JAMA', shortName: 'JAMA', issn: '0098-7484', impactFactor: 55.0, category: 'top4', tier: 'core', jcrQuartile: 'Q1', isDefault: true },
  { id: 'bmj', name: 'The BMJ', shortName: 'BMJ', issn: '0959-8138', impactFactor: 42.7, category: 'top4', tier: 'core', jcrQuartile: 'Q1', isDefault: true },

  // ── General / Internal Medicine ──
  { id: 'nat-med', name: 'Nature Medicine', shortName: 'Nat Med', issn: '1078-8956', impactFactor: 82.9, category: 'general', tier: 'core', jcrQuartile: 'Q1' },
  { id: 'ann-intern', name: 'Annals of Internal Medicine', shortName: 'Ann Intern Med', issn: '0003-4819', impactFactor: 39.2, category: 'general', tier: 'core', jcrQuartile: 'Q1' },
  { id: 'lancet-dig', name: 'Lancet Digital Health', shortName: 'Lancet Dig Health', issn: '2589-7500', impactFactor: 23.8, category: 'general', tier: 'core', jcrQuartile: 'Q1' },
  { id: 'jama-intern', name: 'JAMA Internal Medicine', shortName: 'JAMA Intern Med', issn: '2168-6106', impactFactor: 39.2, category: 'general', tier: 'core', jcrQuartile: 'Q1' },
  { id: 'plos-med', name: 'PLOS Medicine', shortName: 'PLOS Med', issn: '1549-1676', impactFactor: 15.8, category: 'general', tier: 'core', jcrQuartile: 'Q1' },

  // ── Cardiology ──
  { id: 'jacc', name: 'Journal of the American College of Cardiology', shortName: 'JACC', issn: '0735-1097', impactFactor: 21.7, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '循環器' },
  { id: 'eur-heart', name: 'European Heart Journal', shortName: 'Eur Heart J', issn: '0195-668X', impactFactor: 37.6, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '循環器' },
  { id: 'circulation', name: 'Circulation', shortName: 'Circulation', issn: '0009-7322', impactFactor: 35.5, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '循環器' },

  // ── Oncology ──
  { id: 'jco', name: 'Journal of Clinical Oncology', shortName: 'JCO', issn: '0732-183X', impactFactor: 42.1, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '腫瘍' },
  { id: 'lancet-onc', name: 'Lancet Oncology', shortName: 'Lancet Oncol', issn: '1470-2045', impactFactor: 41.3, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '腫瘍' },

  // ── Respiratory ──
  { id: 'lancet-resp', name: 'Lancet Respiratory Medicine', shortName: 'Lancet Respir Med', issn: '2213-2600', impactFactor: 38.9, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '呼吸器' },
  { id: 'ajrccm', name: 'American Journal of Respiratory and Critical Care Medicine', shortName: 'AJRCCM', issn: '1073-449X', impactFactor: 19.3, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '呼吸器' },

  // ── Infectious Disease ──
  { id: 'lancet-id', name: 'Lancet Infectious Diseases', shortName: 'Lancet Infect Dis', issn: '1473-3099', impactFactor: 36.4, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '感染症' },
  { id: 'cid', name: 'Clinical Infectious Diseases', shortName: 'CID', issn: '1058-4838', impactFactor: 11.8, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '感染症' },

  // ── Gastroenterology ──
  { id: 'gastro', name: 'Gastroenterology', shortName: 'Gastroenterology', issn: '0016-5085', impactFactor: 25.7, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '消化器' },
  { id: 'hepatology', name: 'Hepatology', shortName: 'Hepatology', issn: '0270-9139', impactFactor: 12.9, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '消化器' },

  // ── Nephrology ──
  { id: 'jasn', name: 'Journal of the American Society of Nephrology', shortName: 'JASN', issn: '1046-6673', impactFactor: 10.3, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '腎臓' },
  { id: 'kid-int', name: 'Kidney International', shortName: 'Kidney Int', issn: '0085-2538', impactFactor: 14.8, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '腎臓' },

  // ── Neurology ──
  { id: 'lancet-neuro', name: 'Lancet Neurology', shortName: 'Lancet Neurol', issn: '1474-4422', impactFactor: 46.3, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '神経' },
  { id: 'neurology', name: 'Neurology', shortName: 'Neurology', issn: '0028-3878', impactFactor: 8.8, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '神経' },

  // ── Critical Care ──
  { id: 'ccm', name: 'Critical Care Medicine', shortName: 'Crit Care Med', issn: '0090-3493', impactFactor: 7.7, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '集中治療' },
  { id: 'intensive-care', name: 'Intensive Care Medicine', shortName: 'Intensive Care Med', issn: '0342-4642', impactFactor: 27.1, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '集中治療' },

  // ── Endocrinology ──
  { id: 'diabetes-care', name: 'Diabetes Care', shortName: 'Diabetes Care', issn: '0149-5992', impactFactor: 14.8, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '内分泌' },

  // ── Hematology ──
  { id: 'blood', name: 'Blood', shortName: 'Blood', issn: '0006-4971', impactFactor: 20.3, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '血液' },

  // ── Rheumatology ──
  { id: 'ard', name: 'Annals of the Rheumatic Diseases', shortName: 'Ann Rheum Dis', issn: '0003-4967', impactFactor: 20.3, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '膠原病' },

  // ── Endocrinology/Metabolism（追加） ──
  { id: 'jcem', name: 'Journal of Clinical Endocrinology & Metabolism', shortName: 'JCEM', issn: '0021-972X', impactFactor: 5.8, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '内分泌' },
  { id: 'thyroid', name: 'Thyroid', shortName: 'Thyroid', issn: '1050-7256', impactFactor: 5.2, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '内分泌' },

  // ── Dermatology ──
  { id: 'jaad', name: 'Journal of the American Academy of Dermatology', shortName: 'JAAD', issn: '0190-9622', impactFactor: 11.5, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '皮膚科' },
  { id: 'bjd', name: 'British Journal of Dermatology', shortName: 'Br J Dermatol', issn: '0007-0963', impactFactor: 8.1, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '皮膚科' },

  // ── Psychiatry ──
  { id: 'ajp', name: 'American Journal of Psychiatry', shortName: 'Am J Psychiatry', issn: '0002-953X', impactFactor: 13.4, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '精神科' },
  { id: 'lancet-psych', name: 'Lancet Psychiatry', shortName: 'Lancet Psychiatry', issn: '2215-0366', impactFactor: 64.3, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '精神科' },

  // ── Pediatrics ──
  { id: 'pediatrics', name: 'Pediatrics', shortName: 'Pediatrics', issn: '0031-4005', impactFactor: 8.0, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '小児科' },
  { id: 'jpeds', name: 'Journal of Pediatrics', shortName: 'J Pediatr', issn: '0022-3476', impactFactor: 3.7, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '小児科' },

  // ── Urology ──
  { id: 'eur-urol', name: 'European Urology', shortName: 'Eur Urol', issn: '0302-2838', impactFactor: 25.3, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '泌尿器' },

  // ── Radiology ──
  { id: 'radiology', name: 'Radiology', shortName: 'Radiology', issn: '0033-8419', impactFactor: 12.1, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '放射線' },

  // ── Anesthesiology ──
  { id: 'anesthesiology', name: 'Anesthesiology', shortName: 'Anesthesiology', issn: '0003-3022', impactFactor: 8.0, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '麻酔科' },

  // ── Emergency ──
  { id: 'ann-emerg', name: 'Annals of Emergency Medicine', shortName: 'Ann Emerg Med', issn: '0196-0644', impactFactor: 5.6, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '救急' },

  // ── Geriatrics ──
  { id: 'jags', name: 'Journal of the American Geriatrics Society', shortName: 'JAGS', issn: '0002-8614', impactFactor: 6.3, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '老年病' },

  // ── Orthopedics ──
  { id: 'jbjs', name: 'Journal of Bone and Joint Surgery', shortName: 'JBJS', issn: '0021-9355', impactFactor: 5.3, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '整形外科' },

  // ── Ophthalmology ──
  { id: 'ophthalmology', name: 'Ophthalmology', shortName: 'Ophthalmology', issn: '0161-6420', impactFactor: 13.7, category: 'specialty', tier: 'specialty_top', jcrQuartile: 'Q1', specialty: '眼科' },

  // ── Japanese Journals（Worker API H-5 対応済み） ──
  { id: 'naika', name: '日本内科学会雑誌', shortName: '日本内科学会雑誌', issn: '0021-5384', impactFactor: 0.3, category: 'japanese', tier: 'specialty_ext', lang: 'ja' },
  { id: 'igaku-zasshi', name: '日本医事新報', shortName: '日本医事新報', issn: '0385-9215', impactFactor: 0.2, category: 'japanese', tier: 'specialty_ext', lang: 'ja' },
  { id: 'rinsho', name: '臨床雑誌内科', shortName: '臨床雑誌内科', issn: '0022-1961', impactFactor: 0.2, category: 'japanese', tier: 'specialty_ext', lang: 'ja' },
  { id: 'jjsem', name: '日本救急医学会雑誌', shortName: '日本救急医学会雑誌', issn: '0915-924X', impactFactor: 0.3, category: 'japanese', tier: 'specialty_ext', specialty: '救急', lang: 'ja' },
  { id: 'jsim', name: '日本集中治療医学会雑誌', shortName: '日本集中治療医学会雑誌', issn: '1340-7988', impactFactor: 0.3, category: 'japanese', tier: 'specialty_ext', specialty: '集中治療', lang: 'ja' },
  { id: 'circ-j', name: 'Circulation Journal', shortName: 'Circ J', issn: '1346-9843', impactFactor: 3.2, category: 'japanese', tier: 'specialty_ext', specialty: '循環器', lang: 'ja' },
  { id: 'jjc', name: '日本循環器学会誌', shortName: '日本循環器学会誌', issn: '0047-1828', impactFactor: 0.5, category: 'japanese', tier: 'specialty_ext', specialty: '循環器', lang: 'ja' },
  { id: 'jga', name: '日本消化器病学会雑誌', shortName: '日本消化器病学会雑誌', issn: '0446-6586', impactFactor: 0.3, category: 'japanese', tier: 'specialty_ext', specialty: '消化器', lang: 'ja' },
  { id: 'jjca', name: '日本癌学会誌', shortName: '日本癌学会誌', issn: '0021-4922', impactFactor: 0.5, category: 'japanese', tier: 'specialty_ext', specialty: '腫瘍', lang: 'ja' },
  { id: 'jpn-j-surg', name: '日本外科学会雑誌', shortName: '日本外科学会雑誌', issn: '0301-4894', impactFactor: 0.3, category: 'japanese', tier: 'specialty_ext', specialty: '外科', lang: 'ja' },
]

export const TOP4_IDS = ['lancet', 'nejm', 'jama', 'bmj']

export const SPECIALTIES = Array.from(new Set(JOURNALS.filter(j => j.specialty).map(j => j.specialty!)))

export const IF_RANGES = [
  { label: 'IF ≧ 50', min: 50 },
  { label: 'IF ≧ 30', min: 30 },
  { label: 'IF ≧ 20', min: 20 },
  { label: 'IF ≧ 10', min: 10 },
  { label: 'すべて', min: 0 },
]

// Top4雑誌の診療科フィルタリング用キーワード（タイトルマッチング）
export const SPECIALTY_KEYWORDS: Record<string, string[]> = {
  '循環器': ['heart', 'cardiac', 'cardiovascular', 'coronary', 'atrial', 'ventricular', 'aortic', 'myocardial', 'arrhythmia', 'hypertension', 'heart failure', 'statin', 'anticoagul', 'thromboembol', 'stroke', 'cerebrovascular', 'aneurysm', 'valvular', 'pericardi', 'endocarditis', 'cardiomyopath'],
  '腫瘍': ['cancer', 'tumor', 'oncol', 'carcinoma', 'melanoma', 'lymphoma', 'leukemia', 'sarcoma', 'chemotherap', 'immunotherap', 'checkpoint inhibitor', 'metasta', 'neoplasm', 'malignant', 'pembrolizumab', 'nivolumab', 'atezolizumab'],
  '呼吸器': ['pulmonary', 'respiratory', 'lung', 'asthma', 'copd', 'pneumonia', 'bronch', 'ventilat', 'oxygen', 'fibrosis', 'tuberculosis', 'pleural', 'airway'],
  '感染症': ['infect', 'antibiotic', 'antimicrobial', 'sepsis', 'bacterial', 'viral', 'fungal', 'hiv', 'hepatitis', 'covid', 'sars-cov', 'influenza', 'vaccine', 'tuberculosis', 'mrsa', 'resistance'],
  '消化器': ['gastro', 'hepat', 'liver', 'colon', 'intestin', 'pancrea', 'biliary', 'cirrhosis', 'crohn', 'colitis', 'celiac', 'endoscop', 'esophag', 'bowel', 'gallbladder'],
  '腎臓': ['renal', 'kidney', 'nephro', 'dialysis', 'glomerul', 'proteinuria', 'creatinine', 'ckd', 'aki', 'transplant', 'hemodialysis', 'peritoneal'],
  '神経': ['neuro', 'brain', 'alzheimer', 'parkinson', 'epilepsy', 'seizure', 'dementia', 'multiple sclerosis', 'migraine', 'cerebral', 'spinal cord', 'neuropath', 'meningitis', 'encephalitis'],
  '血液': ['hematol', 'blood', 'anemia', 'thrombocytop', 'coagul', 'transfusion', 'myeloma', 'lymphoma', 'leukemia', 'hemophilia', 'platelet', 'neutropeni', 'bone marrow'],
  '内分泌': ['diabetes', 'diabetic', 'insulin', 'thyroid', 'adrenal', 'pituitary', 'endocrin', 'hba1c', 'glucose', 'metabolic', 'obesity', 'osteoporosis', 'calcium', 'parathyroid', 'glp-1', 'semaglutide', 'tirzepatide'],
  'リウマチ': ['rheumat', 'arthritis', 'lupus', 'vasculitis', 'autoimmune', 'connective tissue', 'spondyl', 'gout', 'fibromyalgia', 'sjogren', 'scleroderma'],
  '皮膚科': ['dermat', 'skin', 'psoriasis', 'eczema', 'melanoma', 'atopic', 'wound', 'cutaneous', 'urticaria'],
  '精神科': ['psychiatr', 'depression', 'anxiety', 'schizophren', 'bipolar', 'mental health', 'antidepressant', 'psychosis', 'suicid', 'ptsd', 'adhd'],
  '小児科': ['pediatr', 'child', 'infant', 'neonat', 'adolescent', 'newborn', 'preterm', 'vaccination', 'developmental'],
  '泌尿器': ['urolog', 'prostate', 'bladder', 'kidney stone', 'renal cell', 'urinary', 'incontinence', 'erectile', 'testicular'],
  '放射線': ['radiol', 'imaging', 'ct scan', 'mri', 'ultrasound', 'mammograph', 'radiograph', 'pet scan', 'radiation therapy'],
  '麻酔科': ['anesthes', 'anaesthes', 'perioperative', 'sedation', 'pain management', 'regional block', 'intubation', 'airway management'],
  '救急': ['emergency', 'trauma', 'resuscitat', 'critical care', 'triage', 'acute care', 'cardiac arrest', 'shock', 'burn'],
  '老年病': ['geriatr', 'elderly', 'aging', 'frailty', 'dementia', 'falls', 'polypharmacy', 'sarcopenia', 'nursing home'],
  '整形外科': ['orthop', 'fracture', 'arthroplasty', 'bone', 'joint', 'musculoskeletal', 'spine', 'knee', 'hip replacement', 'tendon'],
  '眼科': ['ophthalm', 'retina', 'glaucoma', 'cataract', 'macular', 'cornea', 'visual', 'intraocular', 'optic nerve'],
  '集中治療': ['intensive care', 'icu', 'critical care', 'mechanical ventilat', 'sepsis', 'shock', 'organ failure', 'vasopressor', 'ecmo'],
}

// ── Guideline sources (日本の学会ガイドライン) ──

export interface GuidelineSource {
  id: string
  name: string
  nameShort: string
  specialty: string
  searchTerms: string[] // PubMed search terms for guidelines from this org
}

export const GUIDELINE_SOURCES: GuidelineSource[] = [
  // 循環器
  { id: 'jcs', name: '日本循環器学会', nameShort: '循環器学会', specialty: '循環器', searchTerms: ['Japanese Circulation Society'] },
  { id: 'jas', name: '日本動脈硬化学会', nameShort: '動脈硬化学会', specialty: '循環器', searchTerms: ['Japan Atherosclerosis Society'] },
  { id: 'jsh-hyper', name: '日本高血圧学会', nameShort: '高血圧学会', specialty: '循環器', searchTerms: ['Japanese Society of Hypertension'] },
  // 呼吸器
  { id: 'jrs', name: '日本呼吸器学会', nameShort: '呼吸器学会', specialty: '呼吸器', searchTerms: ['Japanese Respiratory Society'] },
  // 消化器
  { id: 'jsge', name: '日本消化器病学会', nameShort: '消化器学会', specialty: '消化器', searchTerms: ['Japanese Society of Gastroenterology'] },
  { id: 'jsh-hepat', name: '日本肝臓学会', nameShort: '肝臓学会', specialty: '消化器', searchTerms: ['Japan Society of Hepatology'] },
  // 腎臓
  { id: 'jsn', name: '日本腎臓学会', nameShort: '腎臓学会', specialty: '腎臓', searchTerms: ['Japanese Society of Nephrology'] },
  // 神経
  { id: 'jsnp', name: '日本神経学会', nameShort: '神経学会', specialty: '神経', searchTerms: ['Japanese Society of Neurology'] },
  { id: 'jss', name: '日本脳卒中学会', nameShort: '脳卒中学会', specialty: '神経', searchTerms: ['Japan Stroke Society'] },
  // 血液
  { id: 'jsh', name: '日本血液学会', nameShort: '血液学会', specialty: '血液', searchTerms: ['Japanese Society of Hematology'] },
  // 感染症
  { id: 'jaid', name: '日本感染症学会', nameShort: '感染症学会', specialty: '感染症', searchTerms: ['Japanese Association for Infectious Diseases'] },
  { id: 'jsc', name: '日本化学療法学会', nameShort: '化学療法学会', specialty: '感染症', searchTerms: ['Japanese Society of Chemotherapy'] },
  // 内分泌
  { id: 'jds', name: '日本糖尿病学会', nameShort: '糖尿病学会', specialty: '内分泌', searchTerms: ['Japan Diabetes Society'] },
  { id: 'jts', name: '日本甲状腺学会', nameShort: '甲状腺学会', specialty: '内分泌', searchTerms: ['Japan Thyroid Association'] },
  { id: 'jes', name: '日本内分泌学会', nameShort: '内分泌学会', specialty: '内分泌', searchTerms: ['Japan Endocrine Society'] },
  // リウマチ
  { id: 'jcr', name: '日本リウマチ学会', nameShort: 'リウマチ学会', specialty: 'リウマチ', searchTerms: ['Japan College of Rheumatology'] },
  // 腫瘍
  { id: 'jsco', name: '日本臨床腫瘍学会', nameShort: '臨床腫瘍学会', specialty: '腫瘍', searchTerms: ['Japanese Society of Clinical Oncology'] },
  { id: 'jsmo', name: '日本癌治療学会', nameShort: '癌治療学会', specialty: '腫瘍', searchTerms: ['Japanese Society of Medical Oncology'] },
  // 皮膚科
  { id: 'jda', name: '日本皮膚科学会', nameShort: '皮膚科学会', specialty: '皮膚科', searchTerms: ['Japanese Dermatological Association'] },
  // 精神科
  { id: 'jspn', name: '日本精神神経学会', nameShort: '精神神経学会', specialty: '精神科', searchTerms: ['Japanese Society of Psychiatry and Neurology'] },
  // 小児科
  { id: 'jps', name: '日本小児科学会', nameShort: '小児科学会', specialty: '小児科', searchTerms: ['Japan Pediatric Society'] },
  // 救急
  { id: 'jaam', name: '日本救急医学会', nameShort: '救急医学会', specialty: '救急', searchTerms: ['Japanese Association for Acute Medicine'] },
  // 集中治療
  { id: 'jsicm', name: '日本集中治療医学会', nameShort: '集中治療学会', specialty: '集中治療', searchTerms: ['Japanese Society of Intensive Care Medicine'] },
  // 麻酔科
  { id: 'jsa', name: '日本麻酔科学会', nameShort: '麻酔科学会', specialty: '麻酔科', searchTerms: ['Japanese Society of Anesthesiologists'] },
  // 総合内科
  { id: 'jsim', name: '日本内科学会', nameShort: '内科学会', specialty: '総合内科', searchTerms: ['Japanese Society of Internal Medicine'] },
  // アレルギー
  { id: 'jsallergy', name: '日本アレルギー学会', nameShort: 'アレルギー学会', specialty: '呼吸器', searchTerms: ['Japanese Society of Allergology'] },
]
