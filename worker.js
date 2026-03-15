// ═══════════════════════════════════════════════════════════════
//  内科専門医 取得ナビ  ─  Cloudflare Worker v15
//
//  v15 changes:
//   - 筆記試験対策 問題演習エンジン追加（370疾患×5出題パターン＝無限生成）
//   - POST /credits/quiz/generate — 問題生成（5問/1クレジット、初回5問無料）
//   - POST /credits/quiz/record — 結果記録（分野別正答率・直近100問スタッツ）
//   - GET /credits/quiz/stats — スタッツダッシュボード取得
//   - クレジットシステム汎用化（テンプレート＋問題演習共通）
//  v14 changes:
//   - AI病歴要約テンプレート 370疾患完全実装（全70グループ対応）
//  v13 changes:
//   - ダッシュボードにクレジット売上・購入履歴追加
//  v12 changes:
//   - テンプレート生成履歴の保存・取得 (GET /credits/template-history)
//   - テスト用注文番号 99999999（何度でも10クレジットチャージ可能）
//
//  v11 changes:
//   - 価格改定: 松竹梅（¥980 / ¥2,980 / ¥4,980）
//   - アカウント発行時に初回1クレジットを自動付与（お試し用）
//   - /register でクレジットパック注文番号を拒否（商品名チェック）
//
//  v10 changes:
//   - クレジットシステム（都度課金テンプレート生成）
//   - GET /credits — 残高確認
//   - POST /credits/redeem — クレジットパック注文番号でチャージ
//   - POST /credits/generate-template — 1クレジット消費でテンプレート生成
//   - store-order がクレジットパック商品を自動判定
//
//  KV namespace binding: NAIKA_KV
//  Secrets: ADMIN_KEY, N8N_KEY
// ═══════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = ["https://iwor.jp", "http://localhost:3000"];

function getCors(request) {
  const origin = request?.headers?.get("Origin") || "";
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : "https://iwor.jp";
  return {
    "Access-Control-Allow-Origin":  allowedOrigin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Key,X-Admin-Key",
    "Vary": "Origin",
  };
}

// 後方互換: 静的CORSオブジェクト（リクエストなし文脈で使用）
const CORS = getCors(null);

const json = (data, status=200, extraHeaders={}) =>
  new Response(JSON.stringify(data), {
    status, headers: { "Content-Type":"application/json", ...CORS, ...extraHeaders }
  });

const html = (body, status=200, extraHeaders={}) =>
  new Response(body, {
    status, headers: { "Content-Type":"text/html;charset=UTF-8", ...extraHeaders }
  });

async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b=>b.toString(16).padStart(2,"0")).join("");
}
const makeToken = () => {
  const a = new Uint8Array(32); crypto.getRandomValues(a);
  return Array.from(a).map(b=>b.toString(16).padStart(2,"0")).join("");
};
const makePass = () => {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const a = new Uint8Array(8); crypto.getRandomValues(a);
  return Array.from(a).map(b=>chars[b%chars.length]).join("");
};

/** Cookie から session token を取得 */
function getCookieToken(request) {
  const cookie = request.headers.get("Cookie") || "";
  const m = cookie.match(/naika_sess=([a-f0-9]{64})/);
  return m ? m[1] : null;
}

/** セッション検証（Cookie用） */
async function validateSession(token, env) {
  if (!token) return null;
  const raw = await env.NAIKA_KV.get(`sess:${token}`);
  if (!raw) return null;
  const sess = JSON.parse(raw);
  if (Date.now() > sess.expires) {
    await env.NAIKA_KV.delete(`sess:${token}`);
    return null;
  }
  return sess;
}

const COOKIE_MAX_AGE = 60*60*24*30; // 30日

function sessionCookie(token) {
  return `naika_sess=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${COOKIE_MAX_AGE}`;
}
function clearCookie() {
  return "naika_sess=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
}

// ═══════════════════════════════════════════════════════════════
//  クレジットシステム
// ═══════════════════════════════════════════════════════════════

const CREDIT_PACKS = {
  "5":  { amount: 5,  price: 980,  label: "5クレジットパック" },
  "20": { amount: 20, price: 2980, label: "20クレジットパック" },
  "50": { amount: 50, price: 4980, label: "50クレジットパック" },
};

function detectCreditPack(productName) {
  if (!productName) return null;
  // 「50クレジット」「50回」両方に対応（移行期間）
  if (productName.includes("50クレジット") || productName.includes("50回") || productName.includes("まとめ買い")) return CREDIT_PACKS["50"];
  if (productName.includes("20クレジット") || productName.includes("20回") || productName.includes("標準"))   return CREDIT_PACKS["20"];
  if (productName.includes("5クレジット")  || productName.includes("5回")  || productName.includes("お試し"))  return CREDIT_PACKS["5"];
  if (productName.includes("クレジット") || productName.includes("テンプレート")) return CREDIT_PACKS["5"];
  return null;
}

async function getCredits(env, username) {
  const raw = await env.NAIKA_KV.get(`credits:${username}`);
  if (!raw) return { balance: 0, totalPurchased: 0, history: [] };
  return JSON.parse(raw);
}

async function addCredits(env, username, amount, orderNumber) {
  const credits = await getCredits(env, username);
  credits.balance += amount;
  credits.totalPurchased += amount;
  credits.history.push({ type:"add", amount, orderNumber, at: new Date().toISOString() });
  await env.NAIKA_KV.put(`credits:${username}`, JSON.stringify(credits));
  return credits;
}

async function useCredit(env, username) {
  const credits = await getCredits(env, username);
  if (credits.balance <= 0) return null;
  credits.balance -= 1;
  credits.history.push({ type:"use", amount: -1, at: new Date().toISOString() });
  await env.NAIKA_KV.put(`credits:${username}`, JSON.stringify(credits));
  return credits;
}

// テンプレート無料お試し（1回、クレジット消費なし）
const TEMPLATE_FREE_LIMIT = 1;

async function getTemplateFreeUsed(env, username) {
  const raw = await env.NAIKA_KV.get(`tmpl-free:${username}`);
  return raw ? parseInt(raw) : 0;
}

async function useTemplateFreeOrCredit(env, username) {
  const freeUsed = await getTemplateFreeUsed(env, username);
  if (freeUsed < TEMPLATE_FREE_LIMIT) {
    await env.NAIKA_KV.put(`tmpl-free:${username}`, String(freeUsed + 1));
    const credits = await getCredits(env, username);
    return { ok: true, source: 'free', balance: credits.balance, freeRemaining: TEMPLATE_FREE_LIMIT - freeUsed - 1 };
  }
  const credits = await useCredit(env, username);
  if (!credits) return { ok: false };
  return { ok: true, source: 'credit', balance: credits.balance, freeRemaining: 0 };
}

// ═══════════════════════════════════════════════════════════════
//  テンプレート生成履歴
// ═══════════════════════════════════════════════════════════════

async function saveTemplateHistory(env, username, groupId, groupName, diseaseName, template) {
  const key = `tmpl-history:${username}`;
  const raw = await env.NAIKA_KV.get(key);
  const history = raw ? JSON.parse(raw) : [];
  history.unshift({
    id: Date.now().toString(36) + Math.random().toString(36).slice(2,6),
    groupId, groupName, diseaseName,
    template,
    createdAt: new Date().toISOString(),
  });
  // 最大100件保持
  if (history.length > 100) history.length = 100;
  await env.NAIKA_KV.put(key, JSON.stringify(history));
}

async function getTemplateHistory(env, username) {
  const raw = await env.NAIKA_KV.get(`tmpl-history:${username}`);
  return raw ? JSON.parse(raw) : [];
}

// ═══════════════════════════════════════════════════════════════
//  問題演習エンジン（筆記試験対策）
// ═══════════════════════════════════════════════════════════════

const QUIZ_FREE_LIMIT = 5;
const QUIZ_PER_CREDIT = 5;

const CATEGORY_MAP = {
  general:['g1','g2','g3','g4','g5','g6','g7','g8'],
  gastro:['g9','g10','g11','g12','g14'],
  cardio:['g13','g15','g16','g17','g18','g19','g20','g21','g22'],
  endo:['g23','g24','g25','g26','g27','g28','g29','g30','g31','g32'],
  renal:['g33','g34','g35','g36','g37'],
  resp:['g38','g39','g40','g41','g42','g43'],
  hema:['g44','g45','g46','g47','g48'],
  neuro:['g49','g50','g51','g52','g53','g54','g55'],
  rheum:['g56','g57','g58','g59','g60','g61'],
  infect:['g62','g63','g64','g65'],
  emerg:['g66','g67','g68','g69','g70'],
};

const GROUP_LABELS = {
  g1:"総合内科I(一般)",g2:"総合内科I(感染症)",g3:"総合内科I(腫瘍)",g4:"総合内科I(その他)",
  g5:"総合内科II(一般)",g6:"総合内科II(高齢)",g7:"総合内科II(地域)",g8:"総合内科II(緩和)",
  g9:"消化管",g10:"大腸",g11:"胆膵",g12:"肝臓",g13:"循環器(血圧血管)",g14:"膵炎",g15:"循環器(その他)",
  g16:"冠動脈疾患",g17:"心不全",g18:"不整脈",g19:"弁膜症",g20:"心筋症・心膜",g21:"大血管・血栓",g22:"循環器特殊",
  g23:"甲状腺",g24:"副腎",g25:"下垂体",g26:"副甲状腺Ca",g27:"内分泌その他",g28:"糖尿病",g29:"脂質",g30:"肥満",g31:"尿酸",g32:"代謝その他",
  g33:"AKI",g34:"CKD",g35:"糸球体腎炎",g36:"透析・移植",g37:"電解質・尿路",
  g38:"気道疾患",g39:"肺感染症",g40:"間質性肺疾患",g41:"胸膜・縦隔",g42:"肺血管・呼吸不全",g43:"肺腫瘍",
  g44:"貧血",g45:"白血病・リンパ腫",g46:"骨髄腫",g47:"止血凝固",g48:"腫瘍支持療法",
  g49:"脳血管障害",g50:"変性疾患",g51:"脱髄疾患",g52:"末梢神経・筋",g53:"てんかん・意識障害",g54:"CNS感染症",g55:"頭痛・めまい",
  g56:"アレルギー",g57:"職業性",g58:"関節炎",g59:"膠原病",g60:"血管炎",g61:"リウマチ性疾患",
  g62:"細菌感染症",g63:"ウイルス感染症",g64:"真菌・寄生虫",g65:"特殊感染症",
  g66:"ショック",g67:"神経救急",g68:"呼吸器救急",g69:"中毒・代謝救急",g70:"外傷・蘇生"
};

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr, n) {
  return shuffle(arr).slice(0, n);
}

function splitField(text) {
  return text.split(/[,、．.→→/／]/)
    .map(s => s.trim().replace(/^(→|・|#\d+\s*)/,'').trim())
    .filter(s => s.length >= 3 && s.length <= 60 && !s.match(/^\d+$/));
}

function pickFirstMeaningful(text, maxLen) {
  const items = splitField(text);
  const good = items.filter(s => s.length >= 4 && s.length <= (maxLen||50));
  return good.length > 0 ? good[0] : items[0] || text.slice(0, 40);
}

function getCategoryForGroup(gId) {
  for (const [cat, groups] of Object.entries(CATEGORY_MAP)) {
    if (groups.includes(gId)) return cat;
  }
  return 'general';
}

function getSiblingGroups(gId) {
  const cat = getCategoryForGroup(gId);
  return CATEGORY_MAP[cat] || [];
}

function getAllDiseases() {
  const all = [];
  for (const [gId, group] of Object.entries(TMPL)) {
    for (const [dName, dData] of Object.entries(group)) {
      all.push({ gId, dName, dData });
    }
  }
  return all;
}

function getDiseasesInGroups(groupIds) {
  const result = [];
  for (const gId of groupIds) {
    if (!TMPL[gId]) continue;
    for (const [dName, dData] of Object.entries(TMPL[gId])) {
      result.push({ gId, dName, dData });
    }
  }
  return result;
}

function pickDistractorDiseaseNames(correctGId, correctDName, count) {
  const siblings = getSiblingGroups(correctGId);
  let pool = getDiseasesInGroups(siblings).filter(d => d.dName !== correctDName);
  if (pool.length < count) {
    pool = getAllDiseases().filter(d => d.dName !== correctDName);
  }
  return pick(pool, count).map(d => d.dName);
}

function pickDistractorFieldItems(correctGId, correctDName, field, correctItem, count) {
  const siblings = getSiblingGroups(correctGId);
  let pool = getDiseasesInGroups(siblings).filter(d => d.dName !== correctDName);
  if (pool.length < count) {
    pool = getAllDiseases().filter(d => d.dName !== correctDName);
  }
  const items = [];
  const used = new Set([correctItem.toLowerCase()]);
  for (const d of shuffle(pool)) {
    const candidates = splitField(d.dData[field] || '');
    for (const c of candidates) {
      if (!used.has(c.toLowerCase()) && c.length >= 4 && c.length <= 55) {
        items.push(c);
        used.add(c.toLowerCase());
        break;
      }
    }
    if (items.length >= count) break;
  }
  // fallback
  while (items.length < count) items.push("該当なし（" + items.length + "）");
  return items.slice(0, count);
}

function makeQuestion(gId, dName, dData) {
  const types = ['diagnosis', 'test', 'treatment', 'exam', 'differential'];
  const qType = types[Math.floor(Math.random() * types.length)];
  const labels = ['a','b','c','d','e'];
  let stem, correctText, distractors, explanation;

  switch (qType) {
    case 'diagnosis': {
      const symParts = (dData.s || '').split('.').filter(s=>s.trim());
      const sym = symParts.length > 0 ? symParts[0].trim() : '';
      stem = `${dData.prof}。${dData.cc}を主訴に来院した。${dData.o}。随伴症状として${sym}を認める。\n最も考えられる診断はどれか。`;
      correctText = dName;
      distractors = pickDistractorDiseaseNames(gId, dName, 4);
      explanation = `正解は「${dName}」。${dData.disc}`;
      break;
    }
    case 'test': {
      const keyTest = pickFirstMeaningful(dData.tests, 50);
      stem = `${dData.prof}。${dName}が疑われる。\n確定診断に最も有用な検査はどれか。`;
      correctText = keyTest;
      distractors = pickDistractorFieldItems(gId, dName, 'tests', keyTest, 4);
      explanation = `正解は「${keyTest}」。本疾患の検査のポイント: ${dData.tests}`;
      break;
    }
    case 'treatment': {
      const courseItems = splitField(dData.course);
      const keyTx = courseItems.find(s => s.length >= 4 && s.length <= 50) || courseItems[0] || dData.course.slice(0, 40);
      stem = `${dData.prof}。${dName}と診断された。\n初期治療として最も適切なのはどれか。`;
      correctText = keyTx;
      distractors = pickDistractorFieldItems(gId, dName, 'course', keyTx, 4);
      explanation = `正解は「${keyTx}」。本疾患の経過: ${dData.course}`;
      break;
    }
    case 'exam': {
      const keyPE = pickFirstMeaningful(dData.pe, 50);
      const symParts = (dData.s || '').split('.').filter(s=>s.trim());
      stem = `${dData.prof}。${dData.cc}で来院した。\n身体診察で最も重要な所見はどれか。`;
      correctText = keyPE;
      distractors = pickDistractorFieldItems(gId, dName, 'pe', keyPE, 4);
      explanation = `正解は「${keyPE}」。本疾患の身体所見: ${dData.pe}`;
      break;
    }
    case 'differential': {
      // 疾患名バレ防止: discフィールドではなくtests/pe/courseから具体的な事実を出題
      const fieldPool = [
        { key: 'tests', qSuffix: '診断に有用な検査はどれか。' },
        { key: 'pe', qSuffix: '特徴的な身体所見はどれか。' },
        { key: 'course', qSuffix: '治療方針として正しいのはどれか。' },
      ];
      const chosen = fieldPool[Math.floor(Math.random() * fieldPool.length)];
      const items = splitField(dData[chosen.key] || '');
      // 疾患名を含む選択肢を除外（名前バレ防止）
      const good = items.filter(s => s.length >= 4 && s.length <= 55 && !s.toLowerCase().includes(dName.toLowerCase().slice(0, 4)));
      const keyItem = good.length > 0 ? good[Math.floor(Math.random() * Math.min(good.length, 3))] : (items[0] || dData[chosen.key].slice(0, 40));
      correctText = keyItem;
      distractors = pickDistractorFieldItems(gId, dName, chosen.key, keyItem, 4);
      stem = `${dData.prof}。${dName}と診断された。\n${chosen.qSuffix}`;
      explanation = `正解は「${keyItem}」。${dData[chosen.key]}`;
      break;
    }
  }

  // Build choices with shuffle
  const choices = [{ text: correctText, correct: true }];
  for (const d of distractors) {
    choices.push({ text: d, correct: false });
  }
  const shuffled = shuffle(choices);
  shuffled.forEach((c, i) => { c.label = labels[i]; });

  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
    groupId: gId,
    groupName: GROUP_LABELS[gId] || gId,
    diseaseName: dName,
    type: qType,
    stem,
    choices: shuffled,
    explanation,
    refs: dData.refs || []
  };
}

function generateQuizQuestions(mode, groupId, count, weakGroups) {
  let pool;
  switch (mode) {
    case 'group':
      if (!TMPL[groupId]) return [];
      pool = Object.entries(TMPL[groupId]).map(([dName, dData]) => ({ gId: groupId, dName, dData }));
      break;
    case 'weak':
      if (weakGroups && weakGroups.length > 0) {
        pool = getDiseasesInGroups(weakGroups);
      } else {
        pool = getAllDiseases();
      }
      break;
    case 'random':
    default:
      pool = getAllDiseases();
      break;
  }
  if (pool.length === 0) return [];
  const selected = [];
  for (let i = 0; i < count; i++) {
    const d = pool[Math.floor(Math.random() * pool.length)];
    selected.push(makeQuestion(d.gId, d.dName, d.dData));
  }
  return selected;
}

// Quiz stats helpers
async function getQuizStats(env, username) {
  const raw = await env.NAIKA_KV.get(`quiz-stats:${username}`);
  if (!raw) return { totalAttempts: 0, totalCorrect: 0, recent: [], byGroup: {}, freeUsed: 0 };
  return JSON.parse(raw);
}

async function saveQuizResults(env, username, results) {
  const stats = await getQuizStats(env, username);
  for (const r of results) {
    stats.totalAttempts++;
    if (r.correct) stats.totalCorrect++;
    // Recent 100
    stats.recent.unshift({ gId: r.groupId, d: r.diseaseName, c: r.correct, at: new Date().toISOString() });
    if (stats.recent.length > 100) stats.recent.length = 100;
    // By group
    if (!stats.byGroup[r.groupId]) stats.byGroup[r.groupId] = { attempts: 0, correct: 0 };
    stats.byGroup[r.groupId].attempts++;
    if (r.correct) stats.byGroup[r.groupId].correct++;
  }
  await env.NAIKA_KV.put(`quiz-stats:${username}`, JSON.stringify(stats));
  return stats;
}

async function useQuizFreeOrCredit(env, username, questionCount) {
  const stats = await getQuizStats(env, username);
  const freeRemaining = Math.max(0, QUIZ_FREE_LIMIT - stats.freeUsed);

  if (questionCount <= freeRemaining) {
    // Use free trial
    stats.freeUsed += questionCount;
    await env.NAIKA_KV.put(`quiz-stats:${username}`, JSON.stringify(stats));
    return { ok: true, source: 'free', freeRemaining: freeRemaining - questionCount, balance: (await getCredits(env, username)).balance };
  }

  // Need credits: 5 questions = 1 credit
  const creditsNeeded = Math.ceil(questionCount / QUIZ_PER_CREDIT);
  const credits = await getCredits(env, username);
  if (credits.balance < creditsNeeded) {
    return { ok: false, error: 'credits', freeRemaining, balance: credits.balance, needed: creditsNeeded };
  }

  // Consume credits
  credits.balance -= creditsNeeded;
  credits.history.push({ type: "quiz", amount: -creditsNeeded, questions: questionCount, at: new Date().toISOString() });
  await env.NAIKA_KV.put(`credits:${username}`, JSON.stringify(credits));

  // Mark free as fully used if any were remaining
  if (freeRemaining > 0) {
    stats.freeUsed = QUIZ_FREE_LIMIT;
    await env.NAIKA_KV.put(`quiz-stats:${username}`, JSON.stringify(stats));
  }

  return { ok: true, source: 'credit', freeRemaining: 0, balance: credits.balance };
}



// テスト用注文番号（何度でもチャージ可能、10クレジット付与）
const TEST_CREDIT_ORDER = "99999999";
const TEST_CREDIT_AMOUNT = 10;

// ═══════════════════════════════════════════════════════════════
//  テンプレートデータ（病歴要約下書き生成用）
// ═══════════════════════════════════════════════════════════════
// 各疾患のテンプレートメタデータ: {prof,cc,o,p,q,r,s,t,pe,tests,probs,course,disc,refs}

const TMPL={"g1":{"不明熱":{prof:"40代女性, 3週間以上の発熱",cc:"発熱",o:"〇週間前からの間欠熱",p:"解熱薬で一時的に解熱するが再燃",q:"38-39℃台の弛張熱",r:"全身（局所症状乏しい）",s:"体重減少, 盗汗, 倦怠感. 関節痛なし, 皮疹なし",t:"発症→前医で抗菌薬投与→改善なし→当院紹介",pe:"リンパ節腫脹の有無, 脾腫, 心雑音, 皮疹, 関節所見を系統的に",tests:"血液培養(3セット), PCT, フェリチン, 可溶性IL-2R, ANA, RF, CT(胸腹骨盤), 心エコー",probs:"#1 不明熱(3週間以上) #2 炎症反応高値 #3 体重減少",course:"系統的検索→感染症精査→自己免疫精査→悪性腫瘍精査→診断確定→治療開始",disc:"不明熱の鑑別アプローチ(感染症・自己免疫・悪性腫瘍の3本柱), 診断に至るまでの論理的プロセス",refs:["Knockaert DC. Arch Intern Med 2003;163:1033","Hayakawa K. J Infect Chemother 2020;26:698"]}},"g2":{"蜂窩織炎・丹毒":{prof:"60代男性, 糖尿病, 右下肢の発赤腫脹",cc:"右下肢の発赤・腫脹・疼痛",o:"〇日前から右下腿の発赤・腫脹が出現",p:"安静・挙上で軽減, 歩行で増悪",q:"発赤の境界不明瞭(蜂窩織炎)/明瞭(丹毒), 熱感著明",r:"右下腿(片側性)",s:"発熱38℃台, 悪寒, リンパ節腫脹, 水疱形成の有無",t:"小外傷/足白癬→発赤出現→拡大→発熱→前医受診→入院",pe:"発赤範囲のマーキング, 熱感, 圧痛, 水疱・膿瘍形成, 捻髪音(壊死性筋膜炎除外), 足趾間白癬, 下肢浮腫",tests:"血算, CRP, 血液培養2セット, 創部培養, 腎機能, 血糖, HbA1c, 下肢エコー(膿瘍除外), DVT除外",probs:"#1 蜂窩織炎/丹毒(右下腿) #2 糖尿病 #3 足白癬(entry門戸)",course:"抗菌薬(CEZ or ABPC/SBT)→経過観察(発赤範囲縮小確認)→解熱・CRP改善→経口スイッチ→再発予防(白癬治療・スキンケア)",disc:"蜂窩織炎と丹毒の鑑別, 壊死性筋膜炎の除外(LRINEC score), 再発予防戦略",refs:["Stevens DL. Clin Infect Dis 2014;59:e10","日本皮膚科学会. 蜂窩織炎・丹毒ガイドライン 2017"]},"感染性腸炎":{prof:"35歳男性, 生食摂取後の急性下痢",cc:"水様性下痢, 腹痛, 嘔吐",o:"生牡蠣摂取〇時間後から嘔吐・下痢",p:"排便後に一時軽減, 再燃",q:"水様性下痢1日10回以上, 嘔吐あり",r:"腹部全体(臍周囲中心)",s:"発熱, 脱水, 血便の有無, テネスムス",t:"生食摂取→潜伏期→嘔吐・下痢→脱水→受診",pe:"脱水所見(皮膚ツルゴール低下, 口腔乾燥), 腹部圧痛, 腸蠕動音亢進, 体温",tests:"便培養, 便中毒素(CD), ノロウイルス迅速, 血算, CRP, 電解質, 腎機能, 血液ガス",probs:"#1 急性感染性腸炎(原因菌: _) #2 脱水 #3 電解質異常",course:"脱水補正(経口/点滴)→食事指導→便培養結果確認→抗菌薬(細菌性の場合)→症状改善→退院",disc:"感染性腸炎の原因微生物と潜伏期, 抗菌薬適応の判断, 食中毒届出の要否",refs:["Shane AL. JAMA 2017;318:957","日本感染症学会. 腸管感染症ガイドライン"]},"肝膿瘍":{prof:"65歳男性, 糖尿病, 発熱持続",cc:"発熱, 右季肋部痛",o:"〇週間前から38-39℃台の発熱と右季肋部痛",p:"解熱薬で一時的に解熱するが再燃",q:"弛張熱, 右季肋部鈍痛",r:"右季肋部, 右肩放散痛",s:"悪寒戦慄, 食欲低下, 体重減少, 黄疸",t:"発熱持続→前医で抗菌薬→改善なし→腹部CT→肝膿瘍→当院紹介",pe:"右季肋部圧痛, 肝叩打痛, 体温, 黄疸, Murphy sign",tests:"血液培養2セット以上, 腹部造影CT, 腹部エコー, CRP, 肝機能, 膿瘍穿刺培養, アメーバ抗体",probs:"#1 肝膿瘍(細菌性/アメーバ性) #2 菌血症 #3 糖尿病",course:"血液培養→経験的抗菌薬→膿瘍ドレナージ(≥5cm)→培養結果で最適化→4-6週抗菌薬→画像フォロー",disc:"細菌性vsアメーバ性肝膿瘍の鑑別, ドレナージの適応と時期, 基礎疾患の検索(胆道系・大腸癌)",refs:["Lardière-Deguelte S. World J Gastroenterol 2015;21:3671","Kaplan GG. Clin Gastroenterol Hepatol 2004;2:1032"]},"壊死性筋膜炎":{prof:"55歳男性, 糖尿病・肝硬変, 急速進行する下肢感染",cc:"右下肢の激痛, 急速に拡大する発赤",o:"軽微な外傷〇日後から右下肢の発赤・疼痛が急速に進行",p:"進行性, 鎮痛薬で改善しない",q:"見た目以上の激痛(pain out of proportion), 皮膚の暗赤色変化",r:"右下腿→大腿に急速拡大",s:"高熱, 頻脈, 血圧低下, 水疱・壊死, 捻髪音",t:"外傷→急速な発赤拡大→激痛→ショック状態→救急搬送",pe:"皮膚所見(暗赤色, 水疱, 壊死), 捻髪音, pain out of proportion, ショック徴候, LRINEC score",tests:"血算, CRP, CK, 乳酸, 凝固(DIC), 血液培養, 軟部組織CT/MRI, LRINEC score",probs:"#1 壊死性筋膜炎(Type I/II) #2 敗血症性ショック #3 DIC",course:"緊急外科的デブリドマン→広域抗菌薬(カルバペネム+VCM+CLDM)→ICU管理→再デブリドマン→創傷管理",disc:"壊死性筋膜炎の早期診断(LRINEC score), 外科的緊急介入の重要性, Type I(混合感染) vs Type II(GAS)",refs:["Stevens DL. Clin Infect Dis 2014;59:e10","Wong CH. Curr Opin Infect Dis 2005;18:101"]},"感染性脊椎炎":{prof:"60代男性, 糖尿病, 腰背部痛と発熱",cc:"腰背部痛, 発熱",o:"〇週間前から腰背部痛が出現, 〇日前から発熱",p:"安静で軽減しない, 体動で増悪",q:"持続性の腰背部痛, NRS 7/10",r:"腰椎部(L3-4付近)",s:"発熱, 下肢のしびれ・脱力の有無, 膀胱直腸障害の有無",t:"腰痛→発熱出現→前医で保存治療→改善なし→MRI→椎体炎→当院紹介",pe:"脊椎叩打痛, 傍脊柱筋圧痛, 下肢神経学的所見, 膀胱直腸障害",tests:"MRI(T2高信号, 造影増強), 血液培養2セット以上, CRP/ESR, 血算, CTガイド下生検培養, 心エコー(IE合併除外)",probs:"#1 感染性脊椎炎(部位: _, 起因菌: _) #2 硬膜外膿瘍の有無 #3 菌血症",course:"血液培養・生検→起因菌同定→抗菌薬6-8週→脊椎不安定性・膿瘍→手術検討→リハビリ→画像フォロー",disc:"感染性脊椎炎の診断アプローチ(MRI+生検培養), 長期抗菌薬の管理, 手術適応の判断",refs:["Berbari EF. N Engl J Med 2015;373:1040","IDSA. Clin Infect Dis 2015;61:e26"]},"感染性心内膜炎予防・人工弁感染":{prof:"50代女性, 機械弁置換後, 発熱",cc:"発熱持続, 全身倦怠感",o:"歯科治療〇週間後から発熱が持続",p:"解熱薬で一時的に解熱するが再燃",q:"38-39℃台の弛張熱, 倦怠感",r:"全身",s:"悪寒, 体重減少, 関節痛, 視力低下(塞栓症)",t:"歯科治療→発熱持続→前医で血液培養陽性→当院紹介",pe:"新規心雑音, Osler結節, Janeway病変, 爪下出血, 脾腫, 眼底所見",tests:"血液培養3セット以上, 経食道心エコー(TEE), CRP/ESR, 補体, RF, 腎機能, 頭部MRI(塞栓)",probs:"#1 人工弁感染性心内膜炎(modified Duke基準) #2 菌血症(起因菌:_) #3 塞栓症評価",course:"血液培養→経験的抗菌薬→起因菌同定→最適抗菌薬6週以上→早期手術の適応評価→外来フォロー",disc:"人工弁IEの特殊性(診断困難, 手術適応の拡大), 早期手術の適応基準, 予防抗菌薬の適応",refs:["Habib G. Eur Heart J 2015;36:3075","Baddour LM. Circulation 2015;132:1435"]},"カテーテル関連血流感染症":{prof:"70代男性, 中心静脈カテーテル留置中, 発熱",cc:"発熱, 悪寒戦慄",o:"CVC留置〇日目に突然の悪寒戦慄と高熱",p:"解熱薬で一時解熱, カテーテル抜去で改善",q:"体温39℃台, 悪寒戦慄",r:"カテーテル刺入部, 全身",s:"刺入部発赤・排膿の有無, 低血圧, 頻脈",t:"CVC留置→発熱→血液培養→CRBSI疑い→当科コンサルト",pe:"カテーテル刺入部所見(発赤・排膿・硬結), バイタル(敗血症評価), 他の感染源の除外",tests:"カテーテル血・末梢血の対培養(DTP), カテーテル先端培養, CRP, PCT, 血算",probs:"#1 カテーテル関連血流感染症 #2 敗血症(qSOFA_点) #3 CVC管理",course:"対培養採取→カテーテル抜去→経験的抗菌薬(VCM±グラム陰性カバー)→培養結果で最適化→合併症検索→適切な期間の抗菌薬",disc:"CRBSIの診断基準(DTP), カテーテル抜去 vs salvageの判断, 起因菌別の抗菌薬期間",refs:["Mermel LA. Clin Infect Dis 2009;49:1","IDSA Guidelines for CRBSI 2009"]},"伝染性単核球症":{prof:"20代男性, 咽頭痛・発熱・リンパ節腫脹",cc:"咽頭痛, 発熱, 頸部リンパ節腫脹",o:"〇週間前から咽頭痛・発熱, 頸部リンパ節腫脹が出現",p:"解熱薬で一時的に軽減",q:"高熱39℃台, 著明な咽頭発赤・白苔, 頸部リンパ節腫大",r:"咽頭, 両側頸部, 腋窩",s:"倦怠感著明, 肝脾腫, 皮疹(ABPC投与後), 眼瞼浮腫",t:"咽頭痛→発熱持続→前医でABPC処方→皮疹出現→血液検査で異型リンパ球→当院紹介",pe:"咽頭所見(発赤・白苔), リンパ節腫脹(両側頸部), 肝脾腫, 皮疹, 眼瞼浮腫",tests:"血算(異型リンパ球), 肝機能, EBV VCA-IgM/IgG, EBNA抗体, 腹部エコー(脾腫評価), 迅速モノスポットテスト",probs:"#1 伝染性単核球症(EBV感染) #2 肝機能障害 #3 脾腫",course:"対症療法(安静・解熱鎮痛)→肝機能モニタリング→脾腫の場合は運動制限→合併症監視→自然軽快",disc:"EBV感染症の診断と自然経過, ABPC投与による皮疹, 脾破裂のリスクと運動制限, 稀な合併症(HLH)",refs:["Dunmire SK. Curr Top Microbiol Immunol 2015;390:211","Ebell MH. JAMA 2016;315:1502"]}},"g3":{"原発不明癌":{prof:"65歳男性, 多発リンパ節腫脹, 体重減少",cc:"頸部リンパ節腫脹, 体重減少",o:"〇カ月前から頸部リンパ節腫脹と体重減少",p:"緩徐に進行",q:"3カ月で8kg体重減少, 多発リンパ節腫脹",r:"頸部・鎖骨上・腋窩リンパ節",s:"倦怠感, 食欲不振, 微熱",t:"リンパ節腫脹→前医で生検→低分化癌→原発巣不明→精査目的で当院紹介",pe:"リンパ節触診(部位・大きさ・硬さ・可動性), 甲状腺触診, 乳房診, 直腸診, 皮膚診察",tests:"リンパ節生検(免疫組織化学: CK7/20, TTF-1, PSA, ER等), PET-CT, 上下部内視鏡, 腫瘍マーカー",probs:"#1 原発不明癌(組織型: _, 免疫染色: _) #2 多発リンパ節転移 #3 体重減少・低栄養",course:"組織診断→免疫染色パネル→PET-CT→原発巣検索→治療可能なサブセットの同定→化学療法",disc:"原発不明癌の診断アプローチ(免疫組織化学の活用), favorable subsetの同定と治療, 分子プロファイリング",refs:["Fizazi K. Ann Oncol 2015;26 Suppl 5:v133","NCCN Guidelines. Occult Primary 2024"]},"傍腫瘍症候群":{prof:"58歳男性, 喫煙歴, 小脳失調・体重減少",cc:"歩行障害, 体重減少",o:"〇カ月前から歩行時のふらつきが進行",p:"緩徐に進行, 改善なし",q:"小脳性運動失調, 3カ月で5kg体重減少",r:"体幹・四肢の失調",s:"構音障害, 嚥下障害, 四肢しびれ, めまい",t:"歩行障害→前医でMRI異常なし→傍腫瘍症候群疑い→精査目的で当院紹介",pe:"小脳機能検査(指鼻試験, 踵膝試験, Romberg), 眼振, 構音, 感覚検査, 筋力",tests:"抗神経抗体(抗Yo, 抗Hu, 抗Ri, 抗CV2), 胸部造影CT, PET-CT, 腫瘍マーカー, 髄液検査, 頭部MRI",probs:"#1 傍腫瘍性小脳変性症(抗体: _) #2 悪性腫瘍の検索 #3 小脳性運動失調",course:"抗神経抗体検査→悪性腫瘍の検索・治療→免疫療法(IVIg, ステロイド)→リハビリ→定期的な腫瘍スクリーニング",disc:"傍腫瘍症候群の分類(古典的 vs 非古典的), 抗神経抗体と関連腫瘍, 早期の腫瘍治療の重要性",refs:["Dalmau J. N Engl J Med 2018;378:840","Graus F. J Neurol Neurosurg Psychiatry 2004;75 Suppl 3:iii1"]},"上大静脈症候群":{prof:"60代男性, 肺癌, 顔面浮腫",cc:"顔面浮腫, 呼吸困難, 頸部腫脹",o:"〇週間前から顔面・頸部の浮腫と呼吸困難",p:"臥位で増悪, 座位でやや軽減",q:"顔面・上肢の著明な浮腫, 頸静脈怒張",r:"顔面, 頸部, 上肢",s:"頭痛, 視力変化, 咳嗽, 嗄声",t:"肺癌治療中→顔面浮腫出現→増悪→当院受診",pe:"顔面浮腫(朝方増悪), 頸静脈怒張, 前胸部静脈怒張(側副血行路), 上肢浮腫, 眼球結膜浮腫",tests:"胸部造影CT(SVC閉塞・圧排所見), 胸部X線, 組織診(未確定の場合), 凝固検査",probs:"#1 上大静脈症候群(原因: 肺癌) #2 肺癌(Stage_) #3 気道圧迫(あれば)",course:"酸素投与・上半身挙上→原疾患診断(未確定時)→放射線治療/化学療法→SVC内ステント留置(重症時)→抗凝固療法",disc:"上大静脈症候群の緊急度評価, 原疾患別の治療戦略(SCLC vs NSCLC vs リンパ腫), ステント留置の適応",refs:["Wilson LD. N Engl J Med 2007;356:1862","Yu JB. Chest 2008;133:460"]},"脊髄圧迫（腫瘍性）":{prof:"70代男性, 前立腺癌, 急速進行する下肢脱力",cc:"背部痛, 下肢脱力, 排尿障害",o:"〇週間前から背部痛, 〇日前から下肢脱力が急速進行",p:"臥位で背部痛増悪, 進行性",q:"両下肢麻痺(MMT 2-3/5), 感覚レベルTh10",r:"胸椎部, 両下肢",s:"膀胱直腸障害, 帯状の感覚障害, 便秘",t:"前立腺癌既往→背部痛→下肢脱力→排尿障害→救急受診",pe:"脊椎叩打痛, 下肢筋力(MMT), 感覚レベル, 深部腱反射, Babinski, 膀胱直腸障害, 肛門周囲感覚",tests:"脊椎MRI(全脊椎, 造影), 血算, 腎機能, Ca, 腫瘍マーカー(PSA)",probs:"#1 転移性脊髄圧迫(原発: 前立腺癌, 圧迫部位: Th_) #2 対麻痺 #3 膀胱直腸障害",course:"デキサメタゾン高用量→緊急MRI→放射線治療(24h以内)/手術→原疾患治療→リハビリ",disc:"腫瘍性脊髄圧迫のoncologic emergency, ステロイドの早期投与, 手術 vs 放射線の選択(Patchell study), 歩行能力温存と予後",refs:["Patchell RA. Lancet 2005;366:643","NICE Guideline. Metastatic spinal cord compression 2008"]},"がん性腹膜炎・癌性腹水":{prof:"55歳女性, 卵巣癌, 腹部膨満",cc:"腹部膨満, 食欲不振, 体重増加",o:"〇カ月前から腹部膨満が進行",p:"腹水穿刺で一時的に軽減, 再貯留",q:"大量腹水, 腹囲著明に増大",r:"腹部全体",s:"食欲不振, 嘔気, 呼吸困難(横隔膜挙上), 下肢浮腫",t:"卵巣癌治療後→腹水増加→腹部膨満→当院受診",pe:"腹部膨満, 波動, 腹水移動性濁音, 下肢浮腫, 腫瘤触知",tests:"腹水穿刺(細胞診, SAAG, LDH, 蛋白, 培養), 腹部CT, 腫瘍マーカー(CA125等)",probs:"#1 がん性腹膜炎(原発: 卵巣癌) #2 癌性腹水 #3 低栄養",course:"腹水穿刺・排液→細胞診確認→化学療法(原疾患)→腹水コントロール(利尿薬, 反復穿刺, 腹腔内投与)→緩和ケア",disc:"癌性腹水の鑑別(SAAG), 腹水管理の戦略(穿刺 vs 利尿薬 vs CARTシステム), QOLを考慮した治療選択",refs:["Becker G. J Pain Symptom Manage 2006;32:145","Defined NCCN Guidelines 2024"]},"腫瘍関連静脈血栓塞栓症":{prof:"60代女性, 膵癌, 左下肢腫脹",cc:"左下肢の腫脹・疼痛",o:"膵癌化学療法中, 〇日前から左下肢腫脹が出現",p:"安静で軽減しない, 挙上でやや軽減",q:"左下肢全体の腫脹, 周径差3cm",r:"左下肢全体",s:"疼痛, Homans sign陽性, 呼吸困難(PE合併の場合)",t:"膵癌治療中→左下肢腫脹→エコーでDVT→PE精査目的で当院",pe:"下肢周径差, Homans sign, 下肢色調, 呼吸数, SpO2, 頻脈",tests:"下肢静脈エコー, 造影CT(PE合併評価), D-dimer, 凝固検査, Khorana score",probs:"#1 腫瘍関連DVT(左腸骨-大腿静脈) #2 PE合併の有無 #3 膵癌(化学療法中)",course:"抗凝固療法(LMWH or DOAC)→PE評価→化学療法との併用管理→長期抗凝固(がん治療中は継続)",disc:"がん関連VTEの疫学とリスク因子(Khorana score), 抗凝固薬の選択(LMWH vs DOAC), 一次予防の適応",refs:["Key NS. J Clin Oncol 2020;38:496","Lyman GH. J Thromb Haemost 2021;19:2444"]},"骨転移・高カルシウム血症（腫瘍性）":{prof:"65歳女性, 乳癌, 腰痛・倦怠感",cc:"腰痛, 倦怠感, 口渇",o:"乳癌術後〇年, 〇カ月前から腰痛と倦怠感が出現",p:"安静でも軽減しない腰痛, NSAIDsで不十分",q:"NRS 6/10の持続性腰痛, 高Ca血症(13.5mg/dL)",r:"腰椎, 胸椎",s:"口渇, 多尿, 便秘, 嘔気, 意識混濁(重症時)",t:"乳癌既往→腰痛→前医で骨シンチ→多発骨転移→高Ca→当院紹介",pe:"脊椎叩打痛, 神経学的所見(脊髄圧迫除外), 脱水所見, 意識レベル",tests:"Ca(補正), P, ALP, intact-PTH, PTHrP, 骨シンチ, 全脊椎MRI, 腫瘍マーカー, 腎機能",probs:"#1 多発骨転移(原発: 乳癌) #2 腫瘍性高カルシウム血症 #3 病的骨折リスク",course:"大量輸液→ビスホスホネート/デノスマブ→骨転移治療(放射線/手術)→原疾患治療→骨修飾薬継続",disc:"腫瘍性高Ca血症のメカニズム(PTHrP vs 骨転移), 緊急治療, 骨転移の包括的管理(骨修飾薬, 放射線, 疼痛管理)",refs:["Coleman RE. Ann Oncol 2014;25 Suppl 3:iii124","Mirrakhimov AE. Int J Clin Pract 2015;69:1268"]},"がん性疼痛管理":{prof:"70代男性, 進行膵癌, 腹部・背部痛",cc:"腹部痛, 背部痛, 不眠",o:"膵癌進行に伴い〇カ月前から腹部・背部痛が増悪",p:"体動で増悪, 前屈位でやや軽減, NSAIDsで不十分",q:"NRS 7-8/10, 持続痛+突出痛",r:"心窩部から背部に放散",s:"食欲不振, 不眠, 不安, 体重減少",t:"膵癌治療中→疼痛増悪→NSAIDs不十分→オピオイド導入目的で当科紹介",pe:"疼痛評価(NRS, 部位, 性状), PS評価, 腹部診察, 栄養状態",tests:"画像(疼痛の原因評価), 腎機能・肝機能(オピオイド選択), 電解質",probs:"#1 がん性疼痛(内臓痛+体性痛) #2 進行膵癌 #3 低栄養・PS低下",course:"WHO三段階除痛ラダー→オピオイド導入(モルヒネ/オキシコドン)→タイトレーション→レスキュー設定→副作用対策→神経ブロック検討",disc:"WHO三段階除痛ラダーとオピオイドの選択, タイトレーションの実際, オピオイドの副作用管理(便秘・嘔気・眠気), 神経ブロック(腹腔神経叢ブロック)の適応",refs:["WHO Guidelines for Cancer Pain 2018","Caraceni A. Lancet Oncol 2012;13:e58"]}},"g4":{"自己免疫性肝炎":{prof:"45歳女性, 倦怠感・黄疸",cc:"倦怠感, 黄疸, 食欲低下",o:"〇カ月前から倦怠感, 〇週間前から黄疸に気付く",p:"緩徐に進行",q:"AST/ALT 500-1000 IU/L, T.Bil 5.0 mg/dL",r:"全身(黄疸, 倦怠感)",s:"皮膚搔痒, 関節痛, 発熱, 体重減少",t:"倦怠感→黄疸→前医で肝機能異常→ウイルス性除外→当院紹介",pe:"黄疸, 肝腫大, 脾腫, クモ状血管腫, 他の自己免疫疾患の合併所見",tests:"肝機能(AST/ALT/ALP/γGTP/T.Bil), IgG, ANA, 抗SMA抗体, 抗LKM-1抗体, ウイルスマーカー除外, 肝生検",probs:"#1 自己免疫性肝炎(簡易国際スコア) #2 黄疸 #3 他の自己免疫疾患合併(あれば)",course:"診断確定(肝生検)→ステロイド導入(PSL 0.5-1mg/kg)→肝機能改善確認→AZA追加→ステロイド漸減→寛解維持",disc:"AIHの診断基準(IAIHG簡易スコア), ステロイド+AZAの標準治療, 急性発症型AIHへの対応, 長期予後",refs:["Mack CL. Hepatology 2020;72:671","EASL Clinical Practice Guidelines. J Hepatol 2015;63:971"]},"原発性胆汁性胆管炎":{prof:"55歳女性, 搔痒感, 肝機能異常",cc:"皮膚搔痒, 倦怠感",o:"〇年前から搔痒感, 健診で肝機能異常を指摘",p:"搔痒は入浴後・夜間に増悪",q:"ALP/γGTP上昇, T.Bil正常〜軽度上昇",r:"全身(搔痒), 右季肋部",s:"倦怠感, 乾燥症状(シェーグレン合併), 骨粗鬆症",t:"搔痒→健診でALP上昇→前医でAMA陽性→当院紹介",pe:"皮膚掻破痕, 黄色腫, 黄疸(進行例), 肝脾腫, シェーグレン症候群の合併所見",tests:"ALP/γGTP, T.Bil, IgM, AMA(M2抗体), ANA, 腹部エコー, 肝生検(必要時), 骨密度",probs:"#1 原発性胆汁性胆管炎(Scheuer分類Stage_) #2 搔痒症 #3 骨粗鬆症",course:"UDCA投与(13-15mg/kg/日)→効果不十分時→OCA/ベザフィブラート追加→搔痒管理→骨粗鬆症治療→肝硬変への進展監視",disc:"PBCの診断基準(AMA+胆道系酵素上昇), UDCAの有効性, 治療不応例への対応, 合併症管理",refs:["Lindor KD. Hepatology 2019;69:394","EASL. J Hepatol 2017;67:145"]},"IgG4関連疾患":{prof:"60代男性, 涙腺・唾液腺腫脹, 膵腫大",cc:"両側涙腺腫脹, 唾液腺腫脹, 黄疸",o:"〇カ月前から涙腺・唾液腺の腫脹, 〇週間前から黄疸",p:"緩徐に進行",q:"両側対称性の涙腺・顎下腺腫脹, 閉塞性黄疸",r:"涙腺, 顎下腺, 膵臓, 後腹膜",s:"アレルギー歴, 体重減少, 全身倦怠感",t:"涙腺腫脹→唾液腺腫脹→黄疸→膵癌疑い→精査→IgG4高値→当院紹介",pe:"涙腺・顎下腺腫脹(対称性, 硬), 黄疸, 腹部所見",tests:"血清IgG4(>135mg/dL), IgG, IgE, 好酸球, 補体(低C3/C4), 造影CT(膵のソーセージ様腫大), 組織生検(IgG4陽性形質細胞浸潤・花筵状線維化)",probs:"#1 IgG4関連疾患(罹患臓器: _) #2 自己免疫性膵炎(1型) #3 閉塞性黄疸(あれば)",course:"診断確定(包括的診断基準)→ステロイド(PSL 0.6mg/kg)→劇的改善確認→漸減→再燃監視→維持療法",disc:"IgG4関連疾患の包括的診断基準, 膵癌との鑑別, ステロイド反応性の治療的意義, 多臓器病変のスクリーニング",refs:["Umehara H. Mod Rheumatol 2012;22:21","Kamisawa T. Lancet 2015;385:1460"]},"NAFLD・NASH":{prof:"50代男性, 肥満, 糖尿病, 肝機能異常",cc:"健診で肝機能異常を指摘",o:"数年前からAST/ALT軽度上昇を指摘されるも放置",p:"自覚症状なし",q:"AST 55, ALT 85 IU/L, 肝エコーで脂肪肝",r:"右季肋部(自覚症状乏しい)",s:"倦怠感(軽度), 肥満(BMI 30), 2型糖尿病, 脂質異常症",t:"健診異常→肝エコー→脂肪肝→ウイルス除外→NAFLD→線維化評価目的で当院紹介",pe:"BMI, 腹囲, 肝腫大の有無, 肝硬変徴候の有無",tests:"肝機能, ウイルスマーカー(除外), フェリチン, 自己抗体(AIH除外), FIB-4 index, 肝エラストグラフィ, 肝生検(必要時)",probs:"#1 NAFLD/NASH(線維化Stage_) #2 2型糖尿病 #3 肥満症 #4 脂質異常症",course:"線維化評価(FIB-4→エラストグラフィ→生検)→生活習慣改善(体重7%減)→薬物療法(ピオグリタゾン, VitE, SGLT2i)→合併症管理→肝癌スクリーニング",disc:"NAFLD/NASHの疫学と自然史, 非侵襲的線維化評価(FIB-4, エラストグラフィ), 治療のエビデンス, MASH(新名称)への移行",refs:["Chalasani N. Hepatology 2018;67:328","Rinella ME. Hepatology 2023;77:1797"]},"機能性ディスペプシア":{prof:"35歳女性, ストレス多い, 心窩部不快感",cc:"心窩部不快感, 早期満腹感, 食後膨満感",o:"〇カ月前から食後の心窩部不快感と早期満腹感",p:"食事で増悪, 空腹時はやや軽快",q:"持続的な不快感, NRS 3-4/10, 日常生活に支障",r:"心窩部",s:"嘔気, 食欲低下, 体重減少なし, 不安・抑うつ",t:"心窩部不快感→前医で内視鏡→器質的異常なし→機能性ディスペプシア→当院紹介",pe:"心窩部圧痛(軽度), 腹部膨満なし, 体重正常",tests:"上部消化管内視鏡(器質的疾患除外), H.pylori検査, 血算, 甲状腺機能, 腹部エコー",probs:"#1 機能性ディスペプシア(EPS/PDS) #2 H.pylori感染の有無 #3 心理社会的因子",course:"H.pylori陽性→除菌→PPI/P-CAB→消化管運動改善薬→漢方(六君子湯)→必要時抗不安薬/SSRI→生活指導",disc:"FDの診断基準(Rome IV), EPS vs PDSサブタイプ, 段階的治療アプローチ, 脳腸相関",refs:["Stanghellini V. Gastroenterology 2016;150:1380","日本消化器病学会. FDガイドライン2021"]},"過敏性腸症候群":{prof:"30代女性, ストレスフルな職場環境, 腹痛・便通異常",cc:"反復する腹痛, 下痢・便秘の交代",o:"〇年前から反復する腹痛と便通異常",p:"排便で軽減, ストレスで増悪",q:"腹痛NRS 4-5/10, 排便回数1日3-5回",r:"下腹部(左下腹部中心)",s:"腹部膨満, ガス, 粘液便, 血便なし, 体重減少なし",t:"反復する腹痛・便通異常→前医で大腸内視鏡→異常なし→IBS→当院紹介",pe:"左下腹部圧痛(S状結腸部), 腹部膨満, 腸蠕動音正常",tests:"大腸内視鏡(器質的疾患除外), 便潜血, 血算, CRP, 甲状腺機能, 便中カルプロテクチン(IBD除外)",probs:"#1 過敏性腸症候群(混合型/下痢型/便秘型) #2 心理社会的ストレス",course:"診断確定→生活・食事指導(低FODMAP食)→薬物療法(ポリカルボフィル, 抗コリン薬, ラモセトロン)→心理療法(CBT)→長期フォロー",disc:"IBSの診断基準(Rome IV), サブタイプ分類と治療選択, 低FODMAP食のエビデンス, 脳腸相関と心理療法",refs:["Lacy BE. Gastroenterology 2016;150:1393","Ford AC. Lancet 2020;396:1675"]},"クローン病":{prof:"25歳男性, 肛門病変, 腹痛・下痢",cc:"腹痛, 下痢, 体重減少, 肛門痛",o:"〇カ月前から下痢・腹痛, 肛門周囲膿瘍の既往",p:"食事で増悪, 絶食で軽減",q:"1日5-6回の下痢(非血性), 体重減少5kg/3カ月",r:"右下腹部, 臍周囲, 肛門部",s:"発熱, 口腔内アフタ, 肛門周囲病変(痔瘻), 関節痛",t:"下痢・腹痛→肛門周囲膿瘍→前医で精査→回腸末端潰瘍→生検→当院紹介",pe:"右下腹部圧痛, 腹部腫瘤(あれば), 肛門周囲所見(痔瘻, skin tag), 口腔内アフタ, 体重・BMI",tests:"大腸内視鏡+回腸末端(縦走潰瘍, 敷石像, 生検), 小腸造影/CTE/MRE, CRP, Alb, 便中カルプロテクチン",probs:"#1 クローン病(小腸型/大腸型/小腸大腸型, 活動度CDAI_) #2 肛門病変 #3 低栄養",course:"栄養評価→寛解導入(ステロイド/抗TNF/ウステキヌマブ/リサンキズマブ)→寛解維持→栄養療法→肛門病変管理→定期画像フォロー",disc:"クローン病の病型分類と活動度評価, 生物学的製剤の選択(step-up vs top-down), 栄養療法の位置付け, 手術適応",refs:["Torres J. Lancet 2017;389:1741","Lichtenstein GR. Am J Gastroenterol 2018;113:481"]},"好酸球性食道炎":{prof:"35歳男性, アレルギー体質, 嚥下障害",cc:"固形物の嚥下困難, つかえ感",o:"〇年前から固形物のつかえ感, 〇カ月前に食塊嵌頓",p:"固形物で増悪, 液体は通過可能",q:"間欠的な嚥下障害, 食塊嵌頓歴あり",r:"前胸部, 咽頭",s:"胸やけ, アレルギー性鼻炎・喘息の合併, 体重減少なし",t:"嚥下障害→食塊嵌頓→前医で内視鏡→縦走溝・リング状粘膜→生検→好酸球浸潤→当院紹介",pe:"体重, BMI, 咽頭所見, 胸部聴診",tests:"上部消化管内視鏡(縦走溝, リング, 白斑, 狭窄), 生検(≥15eos/HPF), 末梢血好酸球, IgE, GERD除外(PPI trial)",probs:"#1 好酸球性食道炎 #2 アレルギー体質(鼻炎, 喘息) #3 食道狭窄(あれば)",course:"PPI trial→効果不十分→局所ステロイド(ブデソニド嚥下)→食事除去療法→狭窄→内視鏡拡張→長期維持",disc:"EoEの診断基準と鑑別, PPI-REE(PPI反応性食道好酸球増多)の位置付け, 治療戦略(薬物 vs 食事除去)",refs:["Dellon ES. Gastroenterology 2018;154:319","Lucendo AJ. United European Gastroenterol J 2017;5:335"]}},"g5":{"本態性高血圧症":{prof:"55歳男性, 健診で高血圧を指摘",cc:"血圧高値(健診指摘)",o:"健診で〇年前から血圧高値を指摘, 未治療",p:"自覚症状なし",q:"診察室血圧 165/95 mmHg, 家庭血圧 155/90 mmHg",r:"全身(臓器障害評価が必要)",s:"頭痛(時々), めまい, 動悸なし, 視力低下なし",t:"健診異常→放置→頭痛出現→前医受診→二次性除外目的で当院紹介",pe:"血圧(両上肢, 起立), 眼底検査, 心雑音, 頸動脈雑音, 腎動脈雑音, 下肢浮腫, 腹部腫瘤",tests:"血算, 腎機能, 電解質(K), 脂質, 血糖, HbA1c, 尿検査(蛋白・微量アルブミン), 心電図, 心エコー, 頸動脈エコー, 眼底",probs:"#1 本態性高血圧症(Grade_) #2 臓器障害評価 #3 心血管リスク因子",course:"生活習慣改善(減塩6g/日, 運動, 減量)→薬物療法(Ca拮抗薬/ARB/ACEi)→降圧目標確認→臓器障害モニタリング",disc:"高血圧の分類と心血管リスク評価, 降圧目標の個別化, 降圧薬の選択(第一選択薬), 生活習慣修正のエビデンス",refs:["日本高血圧学会. 高血圧治療ガイドライン2019","Whelton PK. J Am Coll Cardiol 2018;71:e127"]},"二次性高血圧の鑑別":{prof:"40代女性, 治療抵抗性高血圧",cc:"3剤併用でも血圧コントロール不良",o:"〇年前から降圧薬3剤で治療中, 血圧目標未達成",p:"服薬アドヒアランス良好にも関わらず血圧高値持続",q:"診察室血圧 160/100 mmHg(3剤併用中)",r:"全身",s:"低カリウム血症, 夜間頻尿, 発作性高血圧(褐色細胞腫)",t:"高血圧治療中→3剤で不十分→二次性高血圧疑い→精査目的で当院紹介",pe:"血圧(両上肢, 下肢), 腹部血管雑音, クッシング様体型, 甲状腺触診",tests:"PAC/PRA比(PA), メタネフリン・ノルメタネフリン(褐色細胞腫), コルチゾール(クッシング), TSH, 腎動脈エコー/MRA, 睡眠検査(SAS)",probs:"#1 治療抵抗性高血圧(二次性の除外) #2 鑑別: PA/褐色細胞腫/腎血管性/クッシング/SAS",course:"体系的二次性高血圧スクリーニング→該当疾患の確定診断→原疾患治療→降圧薬調整",disc:"二次性高血圧のスクリーニング適応, 各疾患のスクリーニング検査と確定診断, 治療抵抗性高血圧の定義と対応",refs:["日本高血圧学会. 高血圧治療ガイドライン2019","Charles L. Am Fam Physician 2017;96:453"]},"脂質異常症（管理）":{prof:"50代男性, 健診でLDL高値",cc:"LDL-C高値(健診指摘)",o:"健診でLDL-C 180mg/dLを指摘, 未治療",p:"自覚症状なし",q:"LDL-C 180, HDL-C 40, TG 200 mg/dL",r:"全身(動脈硬化リスク)",s:"家族歴(父: 心筋梗塞), 喫煙, 高血圧, 糖尿病",t:"健診異常→前医受診→リスク評価→管理目的で当院紹介",pe:"アキレス腱肥厚, 眼瞼黄色腫, 角膜輪, 頸動脈雑音, BMI",tests:"脂質(LDL-C, HDL-C, TG, non-HDL-C, Lp(a)), 空腹時血糖, HbA1c, 甲状腺機能(二次性除外), 頸動脈エコー",probs:"#1 脂質異常症(高LDL-C血症) #2 動脈硬化リスク評価(吹田スコア) #3 生活習慣病",course:"心血管リスク評価→LDL-C管理目標設定→生活習慣改善→スタチン導入→効果不十分時→エゼチミブ/PCSK9阻害薬追加",disc:"動脈硬化性疾患予防ガイドラインに基づくリスク分類とLDL-C管理目標, スタチンのエビデンス, 残余リスクへのアプローチ",refs:["日本動脈硬化学会. 動脈硬化性疾患予防ガイドライン2022","Mach F. Eur Heart J 2020;41:111"]},"慢性腎臓病（総合内科的管理）":{prof:"65歳男性, 糖尿病・高血圧, eGFR低下",cc:"健診でeGFR低下を指摘",o:"〇年前からeGFRが緩徐に低下(60→42 mL/min)",p:"自覚症状乏しい",q:"eGFR 42 mL/min/1.73m2, 尿蛋白1+",r:"全身(CKD合併症)",s:"下肢浮腫(軽度), 夜間頻尿, 倦怠感",t:"健診でeGFR低下→前医で経過観察→蛋白尿出現→腎保護目的で当院紹介",pe:"血圧, 浮腫, 体液量評価, 眼底(糖尿病網膜症)",tests:"Cr, eGFR, 尿蛋白定量, 尿アルブミン/Cr比, 電解質, Ca/P, PTH, Hb, フェリチン, HbA1c, 腎エコー",probs:"#1 CKD G3b A2(糖尿病性腎症/高血圧性腎硬化症) #2 2型糖尿病 #3 高血圧症",course:"原疾患治療→腎保護(RAS阻害薬, SGLT2i)→合併症管理(貧血, CKD-MBD, 高K)→減塩指導→腎臓専門医連携",disc:"CKDのステージ分類と管理, SGLT2阻害薬の腎保護エビデンス(DAPA-CKD, EMPA-KIDNEY), 紹介基準, 生活指導",refs:["KDIGO. Kidney Int 2024;105:S117","日本腎臓学会. CKD診療ガイドライン2023"]},"ポリファーマシー":{prof:"80歳女性, 多疾患併存, 10剤以上服用中",cc:"ふらつき, 食欲低下",o:"〇カ月前からふらつきと食欲低下が出現",p:"起立時にふらつき増悪",q:"12剤服用中, 起立性低血圧, 食欲不振",r:"全身",s:"転倒歴, 腎機能低下, 便秘, 口腔乾燥",t:"多剤服用中→ふらつき→転倒→精査→薬剤性副作用疑い→処方整理目的で当院紹介",pe:"起立性血圧変動, 認知機能, ADL評価, 転倒リスク評価, 口腔乾燥",tests:"血算, 腎機能(eGFR), 肝機能, 電解質, 血糖, 薬物血中濃度(該当薬), ECG(QT延長)",probs:"#1 ポリファーマシー(12剤) #2 薬物有害事象(ふらつき・食欲低下) #3 多疾患併存",course:"処方薬一覧作成→潜在的不適切処方の評価(STOPP/START基準)→優先順位→段階的減薬→減薬後モニタリング→多職種連携",disc:"ポリファーマシーの定義と有害性, 処方見直しツール(STOPP/START, Beers基準), 段階的減薬の実際, 多疾患併存患者の治療優先順位",refs:["日本老年医学会. 高齢者の安全な薬物療法ガイドライン2015","Scott IA. JAMA Intern Med 2015;175:827"]},"術前リスク評価（内科的）":{prof:"70歳男性, 心房細動・糖尿病, 大腸癌手術予定",cc:"術前内科的評価の依頼",o:"大腸癌に対する手術予定, 術前リスク評価の依頼",p:"現在安定した状態",q:"心房細動(DOAC服用中), 2型糖尿病(HbA1c 7.5%), NYHA II",r:"全身(周術期リスク)",s:"労作時息切れ(軽度), 糖尿病合併症",t:"大腸癌診断→手術予定→麻酔科・内科コンサルト→術前評価",pe:"心肺機能評価, 気道評価, 体液量, 栄養状態(Alb, 体重)",tests:"心電図, 心エコー(EF), 呼吸機能検査, 血算, 凝固(DOAC休薬計画), 血糖, HbA1c, 腎機能, 胸部X線, BNP",probs:"#1 術前リスク評価(RCRI_点) #2 心房細動(抗凝固管理) #3 2型糖尿病(周術期血糖管理)",course:"リスク評価(RCRI/METs)→抗凝固薬の休薬・再開計画→周術期血糖管理→心機能最適化→VTE予防→術後管理計画",disc:"周術期心血管リスク評価(RCRI, METs), 抗凝固薬の周術期管理, 周術期血糖管理, VTE予防",refs:["Fleisher LA. Circulation 2014;130:e278","日本循環器学会. 非心臓手術における合併心疾患の評価と管理ガイドライン2014"]},"静脈血栓塞栓症予防":{prof:"75歳女性, 人工膝関節置換術後, 安静臥床",cc:"VTE予防の管理",o:"人工膝関節置換術後, VTE高リスク",p:"安静臥床中",q:"Caprini score高リスク, 下肢腫脹なし",r:"両下肢",s:"肥満, 高齢, 長期臥床, VTE既往なし",t:"人工関節置換術→術後安静→VTE予防管理依頼",pe:"下肢腫脹の有無, Homans sign, 呼吸状態, SpO2",tests:"D-dimer, 下肢静脈エコー(スクリーニング), 凝固検査, 腎機能(抗凝固薬用量調整)",probs:"#1 VTE高リスク(術後安静) #2 抗凝固療法の管理 #3 出血リスク評価",course:"リスク評価(Caprini/Padua)→弾性ストッキング/IPC→薬物的予防(エノキサパリン/DOAC)→早期離床→退院後の予防期間",disc:"VTEリスクスコア(入院: Padua, 術後: Caprini), 予防法の選択(機械的 vs 薬物的), 整形外科手術後の予防期間",refs:["Anderson DR. Chest 2019;156:e1","日本循環器学会. 肺血栓塞栓症/深部静脈血栓症ガイドライン2017"]},"健診異常の精査":{prof:"45歳男性, 健診で複数の異常値を指摘",cc:"健診で肝機能異常, 蛋白尿, 心電図異常を指摘",o:"健診で肝機能異常(AST 60, ALT 80), 蛋白尿(1+), 心電図異常(ST変化)を指摘",p:"自覚症状なし",q:"AST 60, ALT 80, 尿蛋白1+, 心電図ST低下(V5-6)",r:"全身(多臓器の精査)",s:"飲酒習慣(ビール500mL/日), 肥満(BMI 27), 喫煙",t:"健診→複数異常→かかりつけ医から精査紹介",pe:"BMI, 血圧, 心雑音, 肝腫大, 浮腫",tests:"肝機能精査(ウイルスマーカー, 腹部エコー), 尿精査(尿沈渣, 蛋白定量, Cr), 心電図(12誘導), 負荷心電図, 心エコー, 血算, 脂質, 血糖",probs:"#1 肝機能異常(原因精査) #2 蛋白尿(腎疾患精査) #3 心電図異常(虚血精査) #4 メタボリックシンドローム",course:"各異常の系統的精査→鑑別→診断→治療介入→生活習慣改善→定期フォロー",disc:"健診異常の効率的な精査アプローチ, 各異常の鑑別診断, 生活習慣病の包括的管理",refs:["日本人間ドック学会. 判定区分2022","特定健診・保健指導ガイドライン"]}},"g6":{"誤嚥性肺炎":{prof:"85歳男性, 脳梗塞後遺症, 嚥下障害",cc:"発熱, 湿性咳嗽, SpO2低下",o:"〇日前から発熱と湿性咳嗽, SpO2低下",p:"食事で咳嗽増悪",q:"体温38.2℃, SpO2 90%(室内気), 膿性痰",r:"右下肺野",s:"嚥下障害, 食事中のむせ, 全身倦怠感, 食欲低下",t:"食事中のむせ→発熱→SpO2低下→かかりつけ医→当院紹介",pe:"SpO2, 呼吸数, 右下肺野のcoarse crackles, 嚥下機能評価(RSSTなど)",tests:"胸部X線/CT, 血算, CRP, 喀痰培養, 血液培養, 嚥下機能評価(VF/VE)",probs:"#1 誤嚥性肺炎 #2 嚥下障害(脳梗塞後遺症) #3 低栄養・サルコペニア",course:"抗菌薬(SBT/ABPC)→嚥下評価→食形態調整→嚥下リハビリ→口腔ケア→栄養管理→再発予防",disc:"誤嚥性肺炎の病態(不顕性誤嚥を含む), 嚥下評価と食形態調整, 再発予防戦略(口腔ケア, 嚥下リハ, 体位), 繰り返す誤嚥性肺炎の治療方針",refs:["Mandell LA. Clin Infect Dis 2007;44:S27","日本呼吸器学会. 成人肺炎診療ガイドライン2017"]},"フレイル・サルコペニア":{prof:"82歳女性, 体重減少, 歩行速度低下",cc:"体重減少, 歩行困難, 転倒",o:"〇年前から体重減少(1年で5kg減)と歩行速度低下",p:"緩徐に進行, 転倒が増加",q:"体重減少(BMI 18.5), 歩行速度0.6m/s, 握力14kg",r:"全身(筋量・筋力低下)",s:"易疲労, 活動量低下, 食欲低下, 社会的孤立",t:"体重減少→転倒→骨折→入院→フレイル評価依頼",pe:"体重, BMI, 握力, 歩行速度, 筋肉量(下腿周囲長), ADL・IADL, 認知機能(MMSE/MoCA), 栄養状態",tests:"血算, Alb, CRP, 腎機能, 25-OH Vit D, 甲状腺機能, 体組成分析(BIA/DXA), 骨密度",probs:"#1 フレイル(CHS基準) #2 サルコペニア(AWGS基準) #3 低栄養 #4 転倒リスク",course:"包括的老年医学的評価(CGA)→栄養介入(蛋白質1.2g/kg/日)→運動療法(レジスタンス+バランス)→VitD補充→社会的支援→多職種連携",disc:"フレイルの概念と診断基準(CHS基準, J-CHS), サルコペニアの診断(AWGS 2019), 介入のエビデンス(栄養+運動), 可逆性への取り組み",refs:["Fried LP. J Gerontol A Biol Sci Med Sci 2001;56:M146","Chen LK. J Am Med Dir Assoc 2020;21:300"]},"認知症":{prof:"78歳男性, 物忘れ, IADL低下",cc:"物忘れ, 同じ話の繰り返し, 金銭管理の困難",o:"〇年前から物忘れが目立つようになった(家族の気付き)",p:"緩徐に進行",q:"MMSE 20/30, 近時記憶障害が顕著",r:"認知機能全般",s:"見当識障害, 判断力低下, IADL低下, BPSD(夜間不穏, 易怒性)",t:"物忘れ→IADL低下→家族が気付く→前医受診→認知症疑い→精査目的で当院紹介",pe:"認知機能検査(MMSE, MoCA, HDS-R), 神経学的所見(錐体外路症状, 歩行), ADL・IADL評価, BPSD評価(NPI)",tests:"頭部MRI(海馬萎縮, VSRAD), 血算, 甲状腺機能, VitB12, 葉酸, Ca, 梅毒(treatable dementiaの除外), 脳血流SPECT",probs:"#1 認知症(アルツハイマー型/血管性/レビー小体型/前頭側頭型) #2 BPSD #3 社会的支援",course:"treatable dementia除外→病型診断→薬物療法(ChEI, メマンチン)→BPSD対策→介護保険→家族支援→advance care planning",disc:"認知症の病型鑑別(AD vs DLB vs VaD vs FTD), treatable dementiaの除外, 非薬物療法の重要性, 家族支援とACP",refs:["日本神経学会. 認知症疾患診療ガイドライン2017","Livingston G. Lancet 2020;396:413"]},"せん妄":{prof:"80歳男性, 術後, 急性の意識変容",cc:"夜間の不穏, 見当識障害, 幻視",o:"手術〇日後から夜間の不穏と見当識障害が出現",p:"夜間増悪(日内変動), 日中はやや改善",q:"注意力低下, 見当識障害, 幻視, CAM陽性",r:"意識・認知機能",s:"不眠, 興奮, 幻視, 点滴自己抜去, 低活動型(傾眠)の場合も",t:"手術→術後→夜間不穏出現→看護師報告→当科コンサルト",pe:"意識レベル(GCS, CAM), 注意力(digit span), 見当識, 脱水・感染・疼痛の評価, 薬剤チェック",tests:"血算, CRP, 電解質, 腎機能, 肝機能, 血糖, 血液ガス, 尿検査, 胸部X線, 薬剤リスト確認, 頭部CT(必要時)",probs:"#1 せん妄(過活動型/低活動型/混合型) #2 誘因検索(感染/脱水/薬剤/疼痛/便秘/尿閉) #3 術後状態",course:"誘因の同定と是正→非薬物的介入(環境整備, 日内リズム, 早期離床)→薬物療法(最小限: ハロペリドール, クエチアピン)→経過観察",disc:"せん妄の診断(CAM, DSM-5)と病型, 誘因の検索と是正の重要性, 非薬物的介入の優先, 薬物療法の限界",refs:["Inouye SK. N Engl J Med 2006;354:1157","American Geriatrics Society. J Am Geriatr Soc 2015;63:142"]},"転倒・大腿骨近位部骨折":{prof:"83歳女性, 骨粗鬆症, 転倒後の歩行困難",cc:"転倒後の右股関節痛, 歩行不能",o:"自宅内で〇日前に転倒, 右股関節痛で歩行不能",p:"体動で増悪, 安静で軽減しない",q:"右股関節の激痛, 歩行不能",r:"右股関節, 右大腿部",s:"下肢短縮, 外旋位, 転倒原因の検索(めまい, 失神, 低血糖)",t:"転倒→右股関節痛→歩行不能→救急搬送→X線で大腿骨頸部骨折→入院",pe:"右下肢短縮・外旋, 股関節可動域制限, 神経血管損傷の有無, 転倒原因の検索(起立性低血圧, 不整脈)",tests:"骨盤X線, CT/MRI(不顕性骨折), 血算, 凝固, 腎機能, Ca, 25-OH VitD, 心電図, 骨密度(後日)",probs:"#1 大腿骨近位部骨折(頸部/転子部) #2 骨粗鬆症 #3 転倒原因の検索 #4 ADL低下リスク",course:"手術(人工骨頭/骨接合術)→早期リハビリ→骨粗鬆症治療開始→転倒予防→退院支援→回復期リハ転院",disc:"高齢者の転倒リスク評価と予防, 大腿骨近位部骨折の手術選択, 骨粗鬆症の二次骨折予防(FLS), 周術期の内科的管理",refs:["NICE Guideline. Hip fracture management 2023","骨粗鬆症の予防と治療ガイドライン2015"]},"老年症候群":{prof:"88歳女性, 多疾患併存, ADL低下",cc:"食欲低下, ADL低下, 社会的孤立",o:"〇カ月前から食欲低下・活動性低下・閉じこもり",p:"緩徐に進行",q:"体重減少, Barthel index 55点, 外出困難",r:"全身(多面的)",s:"尿失禁, 難聴, 視力低下, 抑うつ傾向, 口腔機能低下",t:"ADL低下→食欲不振→家族の心配→かかりつけ医→CGA目的で当院紹介",pe:"CGA(包括的老年医学的評価): ADL, IADL, 認知機能, うつ(GDS), 栄養(MNA), 歩行・バランス, 社会的評価",tests:"血算, Alb, 腎機能, 電解質, 甲状腺機能, VitB12, 25-OH VitD, CRP, 体重推移",probs:"#1 老年症候群(多領域) #2 低栄養 #3 社会的孤立 #4 尿失禁",course:"CGA→問題の優先順位付け→個別介入計画→多職種チーム介入(医師・看護・PT/OT・ST・MSW・栄養士)→介護保険・社会資源活用",disc:"老年症候群の概念と多面的評価(CGA), 多職種連携の実際, 社会的フレイルと孤立の対策, 人生の最終段階に向けたACP",refs:["Inouye SK. N Engl J Med 2007;357:1072","日本老年医学会. 高齢者総合的機能評価ガイドライン"]},"加齢に伴う嚥下障害":{prof:"84歳男性, パーキンソン病, 誤嚥リスク高い",cc:"食事中のむせ, 体重減少",o:"〇カ月前から食事中のむせが増加, 体重減少",p:"液体でむせやすい, とろみ付きで軽減",q:"RSST 2回/30秒, 体重減少3kg/3カ月",r:"咽頭・喉頭",s:"湿性嗄声, 痰がらみの咳, 食事時間延長, 誤嚥性肺炎歴",t:"むせ増加→体重減少→誤嚥性肺炎→入院→嚥下評価依頼",pe:"口腔内評価, 嚥下関連筋力, RSST, 改訂水飲みテスト, フードテスト, 栄養状態",tests:"嚥下造影(VF), 嚥下内視鏡(VE), 栄養評価(Alb, BMI), 胸部X線, 血算",probs:"#1 嚥下障害(パーキンソン病関連) #2 低栄養 #3 誤嚥性肺炎リスク",course:"嚥下評価(VF/VE)→食形態調整→嚥下リハビリ(間接・直接訓練)→栄養補助→口腔ケア→経管栄養の検討(重症時)→ACP",disc:"加齢とパーキンソン病による嚥下障害の機序, 嚥下評価法(VF/VE), 食形態とリハビリの介入, 経口摂取継続と人工栄養の意思決定",refs:["Langmore SE. Dysphagia 1998;13:69","日本嚥下医学会. 嚥下障害診療ガイドライン2018"]},"褥瘡":{prof:"90歳男性, 寝たきり, 仙骨部の褥瘡",cc:"仙骨部の皮膚潰瘍",o:"寝たきり状態が〇カ月続き, 仙骨部に褥瘡が出現",p:"同一体位の持続で増悪, 体位変換で予防",q:"DESIGN-R評価: D3(皮下組織まで), 4×5cm",r:"仙骨部",s:"低栄養(Alb 2.5), 浮腫, 貧血, ADL全介助",t:"脳梗塞後遺症→寝たきり→仙骨部褥瘡出現→増悪→管理目的",pe:"褥瘡評価(DESIGN-R: D, E, S, I, G, N, P), 栄養状態, 全身の皮膚, 関節拘縮, 体圧分散の状況",tests:"血算, Alb, CRP(感染合併), 創培養(感染時), 血糖, 栄養評価",probs:"#1 褥瘡(仙骨部, DESIGN-R_点) #2 低栄養 #3 寝たきり状態",course:"DESIGN-R評価→局所治療(洗浄・デブリドマン・被覆材)→体圧分散(マットレス・体位変換)→栄養改善(蛋白・亜鉛・VitC)→多職種連携",disc:"褥瘡のリスク評価(Braden scale)と予防, DESIGN-Rによる評価と治療選択, TIME理論に基づく局所管理, 栄養介入の重要性",refs:["日本褥瘡学会. 褥瘡予防・管理ガイドライン2015","European Pressure Ulcer Advisory Panel. 国際ガイドライン2019"]}},"g7":{"在宅医療":{prof:"80歳男性, 進行肺癌, ADL低下, 在宅療養希望",cc:"在宅療養への移行支援",o:"進行肺癌で積極的治療終了, 在宅療養を希望",p:"PS 3-4, ベッド上中心の生活",q:"PS 3, 予後数カ月, 疼痛コントロール中",r:"全身(包括的ケア)",s:"呼吸困難(労作時), 疼痛(オピオイド使用中), 食欲低下, 家族の介護力",t:"肺癌治療→積極的治療終了→在宅療養希望→退院前カンファ→在宅移行",pe:"PS評価, 疼痛評価, 呼吸状態, ADL, 栄養状態, 家族の介護力評価, 住環境",tests:"必要最小限(血算, 腎機能), 在宅での緊急検査体制の確認",probs:"#1 在宅医療導入(進行肺癌) #2 症状マネジメント(疼痛, 呼吸困難) #3 家族支援 #4 ACP",course:"退院前カンファ→在宅主治医・訪問看護導入→医療機器準備(HOT, 輸液ポンプ等)→24時間連絡体制→定期訪問→急変時対応計画",disc:"在宅医療のチーム構成と多職種連携, 在宅での症状マネジメント, 看取りの体制, 介護保険と医療保険の使い分け",refs:["日本在宅医学会. 在宅医療テキスト","厚生労働省. 在宅医療推進事業"]},"予防接種（成人）":{prof:"65歳男性, 糖尿病, インフルエンザ・肺炎球菌ワクチン未接種",cc:"予防接種の相談",o:"定期健診で予防接種歴の確認, 未接種ワクチンあり",p:"現在健康, 慢性疾患の管理中",q:"糖尿病(HbA1c 7.0%), 高血圧, 予防接種不十分",r:"全身(予防医学)",s:"肺炎球菌ワクチン未接種, 帯状疱疹ワクチン未接種, インフルエンザ毎年接種なし",t:"定期受診時→予防接種歴確認→推奨ワクチン説明→接種計画",pe:"全身状態, 免疫不全の有無, アレルギー歴, 現在の健康状態",tests:"特になし(接種前の特別な検査は通常不要)",probs:"#1 予防接種の適応評価 #2 ハイリスク群(糖尿病, 65歳以上) #3 キャッチアップ接種計画",course:"予防接種歴確認→推奨ワクチンリスト作成(肺炎球菌PCV20, 帯状疱疹RZV, インフルエンザ, COVID-19)→接種スケジュール→接種→記録",disc:"成人の推奨予防接種スケジュール, ハイリスク群への追加接種, 肺炎球菌ワクチン(PCV vs PPSV)の使い分け, 帯状疱疹ワクチン(RZV)の推奨",refs:["CDC. Adult Immunization Schedule 2024","日本感染症学会. ワクチンガイドライン"]},"禁煙指導":{prof:"50歳男性, 喫煙30 pack-years, COPD予備軍",cc:"禁煙希望",o:"20歳から喫煙, 1日30本, 過去に自力禁煙失敗歴あり",p:"ストレス時に本数増加",q:"Brinkman index 900, TDS(ニコチン依存度)7点, FTND 6点",r:"全身(喫煙関連リスク)",s:"朝起きてすぐの喫煙, 呼吸機能軽度低下(FEV1/FVC 68%), 咳嗽",t:"健診で呼吸機能低下指摘→禁煙勧告→禁煙外来紹介",pe:"SpO2, 呼気CO濃度, 呼吸音, 口腔内所見, 血圧, BMI",tests:"呼気CO, 呼吸機能検査, 胸部X線, ニコチン依存度テスト(TDS/FTND)",probs:"#1 ニコチン依存症 #2 COPD予備軍(閉塞性換気障害) #3 心血管リスク",course:"禁煙外来(12週間プログラム: 5回受診)→薬物療法(バレニクリン/ニコチン置換療法)→行動療法→フォロー→再喫煙予防",disc:"禁煙治療の保険適用条件, 薬物療法(バレニクリン vs NRT)のエビデンス, 禁煙による健康利益, 再喫煙の予防",refs:["日本循環器学会. 禁煙ガイドライン2020","Fiore MC. Clinical Practice Guideline 2008"]},"生活習慣病指導":{prof:"45歳男性, メタボリックシンドローム, 特定保健指導対象",cc:"特定健診でメタボリックシンドローム該当",o:"健診で腹囲90cm, 高血圧, 高血糖, 脂質異常を指摘",p:"自覚症状なし, 不規則な食生活・運動不足",q:"腹囲90cm, 血圧140/90, 空腹時血糖110, TG 200",r:"全身(代謝リスク)",s:"運動不足, 夜遅い食事, 飲酒量多い, 喫煙なし",t:"特定健診→メタボ該当→特定保健指導→積極的支援",pe:"BMI, 腹囲, 血圧, 体組成",tests:"血算, 脂質, 血糖, HbA1c, 肝機能, 尿酸, 腎機能, 尿検査, 心電図",probs:"#1 メタボリックシンドローム #2 内臓脂肪蓄積 #3 心血管リスク",course:"リスク評価→行動目標設定→食事指導(エネルギー制限, 減塩, 飲酒制限)→運動指導(週150分中等度)→3-6カ月後評価→継続支援",disc:"特定健診・特定保健指導の制度, 行動変容ステージに応じたアプローチ, メタボリックドミノの概念, 生活習慣改善のエビデンス",refs:["厚生労働省. 特定健診・特定保健指導プログラム","日本内科学会. メタボリックシンドロームの診断基準2005"]},"渡航医学・トラベルクリニック":{prof:"30代男性, 東南アジアへの赴任予定",cc:"海外赴任前の健康相談・予防接種",o:"〇カ月後に東南アジアへの長期赴任予定",p:"現在健康",q:"渡航先: ベトナム, 期間: 2年, 持病: なし",r:"全身(渡航関連リスク)",s:"予防接種歴不明確, マラリア流行地域への渡航",t:"赴任決定→渡航外来受診→リスク評価→ワクチン・予防薬",pe:"一般健康状態, 既往歴, 予防接種歴の確認",tests:"A型肝炎・B型肝炎抗体, 狂犬病抗体, 日本脳炎抗体, 黄熱(必要地域), 一般血液検査",probs:"#1 渡航前健康リスク評価 #2 予防接種計画 #3 マラリア予防",course:"渡航先リスク評価→推奨ワクチン接種(A肝, B肝, 腸チフス, 狂犬病, 日本脳炎)→マラリア予防薬→旅行者下痢対応→緊急連絡先",disc:"渡航医学の基本(リスク評価と予防), 渡航先別の推奨ワクチン, マラリア予防(化学予防薬の選択), 帰国後の有熱患者への対応",refs:["CDC. Yellow Book 2024","日本渡航医学会. 海外渡航者のためのワクチンガイドライン"]},"感染症届出・サーベイランス":{prof:"40歳男性, 赤痢アメーバ症, 感染症届出の必要",cc:"血性下痢, 発熱(渡航帰国後)",o:"東南アジア渡航帰国〇週間後から血性下痢と発熱",p:"下痢持続, 腹痛伴う",q:"粘血便, 1日8-10回, 体温38℃",r:"右下腹部(盲腸部), 直腸",s:"腹痛, テネスムス, 脱水, 体重減少",t:"東南アジア渡航→帰国→血性下痢→前医→当院紹介",pe:"脱水所見, 右下腹部圧痛, 肝叩打痛(肝膿瘍合併), 体温",tests:"便検査(アメーバ栄養体), 大腸内視鏡(タコ焼き様潰瘍), 血清アメーバ抗体, 腹部エコー(肝膿瘍), 血算, CRP",probs:"#1 赤痢アメーバ症(腸アメーバ症) #2 肝膿瘍合併の有無 #3 感染症法届出(5類)",course:"メトロニダゾール投与→症状改善確認→嚢子駆除(パロモマイシン)→肝膿瘍があれば穿刺→保健所届出→治癒確認",disc:"輸入感染症の鑑別(渡航歴からのアプローチ), 感染症法に基づく届出義務(1-5類), 感染症サーベイランスの意義",refs:["White NJ. Lancet 2014;383:1084","感染症法. 厚生労働省"]},"地域包括ケア":{prof:"78歳女性, 脳梗塞後遺症, 要介護3, 独居",cc:"退院後の在宅生活支援",o:"脳梗塞で入院, 回復期リハ後退院予定, 独居で自宅復帰",p:"右片麻痺残存, ADL一部介助",q:"Barthel index 65, 要介護3, 独居",r:"全身(在宅生活全般)",s:"右片麻痺(杖歩行), 軽度構音障害, 嚥下機能やや低下, 認知機能正常",t:"脳梗塞→急性期→回復期リハ→退院前カンファ→地域連携",pe:"ADL評価, 歩行能力, 嚥下機能, 認知機能, 住環境評価, 社会的支援状況",tests:"特になし(退院時サマリーの共有が重要)",probs:"#1 脳梗塞後遺症(退院後管理) #2 転倒予防 #3 独居生活支援 #4 介護サービス調整",course:"退院前カンファ(多職種+ケアマネ)→介護保険サービス調整(訪問リハ, 通所リハ, 訪問看護)→住宅改修→かかりつけ医連携→定期的ケア会議",disc:"地域包括ケアシステムの概念, 退院支援のプロセス, 多職種連携とケアマネジメント, 介護保険サービスの種類と使い方",refs:["厚生労働省. 地域包括ケアシステム","日本リハビリテーション医学会ガイドライン"]},"職業性疾患":{prof:"55歳男性, アスベスト曝露歴, 胸膜肥厚斑",cc:"労作時呼吸困難, 健診で胸膜肥厚斑",o:"建設業〇年間従事, アスベスト曝露歴, 健診で胸膜肥厚斑を指摘",p:"緩徐に労作時呼吸困難が進行",q:"mMRC 1-2, 拘束性換気障害(軽度)",r:"胸部",s:"乾性咳嗽, 胸痛(時に), 喀血なし",t:"アスベスト曝露歴→健診で胸膜肥厚斑→精査目的で当院紹介",pe:"呼吸音(fine crackles), 胸郭変形, ばち指の有無, SpO2",tests:"胸部X線/HRCT(胸膜肥厚斑, 間質性変化), 呼吸機能検査, 胸部CT(悪性中皮腫スクリーニング), 喀痰細胞診",probs:"#1 石綿関連疾患(胸膜肥厚斑/石綿肺) #2 悪性中皮腫・肺癌のスクリーニング #3 労災認定",course:"画像・肺機能フォロー→悪性腫瘍スクリーニング(年1-2回CT)→症状に応じた対症療法→労災・救済制度の案内→禁煙指導",disc:"アスベスト関連疾患の分類(胸膜肥厚斑, 石綿肺, 中皮腫, 肺癌), 潜伏期間と曝露量の関係, 労災認定・石綿健康被害救済法",refs:["American Thoracic Society. Am J Respir Crit Care Med 2004;170:691","環境省. アスベスト健康被害救済制度"]}},"g8":{"がん終末期の疼痛管理":{prof:"65歳男性, 進行胃癌, 腹膜播種, 腹痛",cc:"腹痛増悪, 経口摂取困難",o:"進行胃癌, 〇週間前から腹痛が増悪し経口摂取困難",p:"オピオイド増量で一時的に軽減, 再増悪",q:"NRS 7-8/10, 持続痛+突出痛, オピオイド増量中",r:"腹部全体",s:"嘔吐, 便秘, 腹部膨満, 嗜眠傾向(オピオイド副作用)",t:"胃癌→腹膜播種→腹痛増悪→緩和ケアチーム介入",pe:"疼痛評価(NRS, STAS), 腹部膨満, 腸蠕動音, 栄養状態, PS, 意識レベル",tests:"血算, 腎機能(オピオイド代謝), 電解質, Ca(高Ca除外), 腹部X線(腸閉塞評価)",probs:"#1 がん性疼痛(腹膜播種, 内臓痛+体性痛) #2 オピオイド副作用管理 #3 がん性腸閉塞(あれば)",course:"疼痛再評価→オピオイドスイッチング(フェンタニル貼付等)→鎮痛補助薬→持続皮下注射→腸閉塞管理(オクトレオチド)→神経ブロック検討",disc:"オピオイドスイッチングの適応と換算, 鎮痛補助薬(ステロイド, ガバペンチノイド), がん性腸閉塞の緩和的管理, 持続皮下注射の実際",refs:["WHO Guidelines for Cancer Pain 2018","日本緩和医療学会. がん疼痛の薬物療法に関するガイドライン2020"]},"終末期呼吸困難":{prof:"70代女性, 進行肺癌, 呼吸困難増悪",cc:"呼吸困難, 酸素需要量増加",o:"進行肺癌, 〇週間前から安静時呼吸困難が出現",p:"酸素投与で一部軽減, 不安で増悪",q:"mMRC 4, SpO2 88%(O2 3L), 安静時呼吸困難",r:"胸部",s:"不安, 恐怖, 不眠, 咳嗽, 喘鳴(death rattle)",t:"肺癌進行→呼吸困難増悪→酸素増量→緩和ケア介入",pe:"呼吸数, 呼吸パターン, SpO2, 不安・苦痛の程度, 浮腫, 胸水",tests:"胸部X線(胸水評価), 血液ガス(必要時のみ), BNP",probs:"#1 終末期呼吸困難(肺癌) #2 不安・精神的苦痛 #3 胸水(あれば)",course:"酸素療法→モルヒネ少量投与(呼吸困難緩和)→抗不安薬→胸水穿刺(QOL改善目的)→送風(扇風機)→環境調整→鎮静の検討(耐え難い場合)",disc:"終末期呼吸困難の病態と評価, モルヒネの呼吸困難に対する有効性と安全性, 非薬物的アプローチ(送風, 体位), 鎮静の倫理的側面",refs:["Abernethy AP. BMJ 2003;327:523","日本緩和医療学会. 呼吸困難のガイドライン"]},"悪心・嘔吐（緩和ケア）":{prof:"60代女性, 進行卵巣癌, 持続する嘔気",cc:"嘔気, 嘔吐, 経口摂取不良",o:"化学療法中止後, 〇週間前から嘔気が持続",p:"食後に増悪, 制吐薬で一時軽減",q:"持続する嘔気, 間欠的嘔吐(1日3-4回)",r:"心窩部, 咽頭",s:"腹部膨満, 便秘(オピオイド性), 食欲不振, 体重減少",t:"進行卵巣癌→嘔気持続→経口摂取低下→脱水→緩和ケア介入",pe:"脱水所見, 腹部膨満, 腸蠕動音, 便塊触知, 口腔内カンジダ",tests:"血算, 電解質, Ca, 腎機能, 肝機能, 腹部X線(腸閉塞評価), 頭部画像(脳転移除外)",probs:"#1 嘔気・嘔吐(原因: 消化管閉塞/薬剤性/代謝性) #2 脱水 #3 進行卵巣癌",course:"原因評価→原因別制吐薬選択(ドパミン拮抗薬/セロトニン拮抗薬/ステロイド)→便秘対策→輸液(最小限)→腸閉塞時はオクトレオチド→経鼻胃管(最終手段)",disc:"嘔気・嘔吐の原因別アプローチ(化学受容器/前庭系/消化管/頭蓋内圧), 緩和ケアにおける制吐薬の選択, がん性腸閉塞の管理",refs:["Lau PM. Curr Treat Options Oncol 2005;6:277","日本緩和医療学会. 制吐薬適正使用ガイドライン"]},"鎮静（パリアティブセデーション）":{prof:"75歳男性, 進行膵癌, 耐え難い苦痛",cc:"耐え難い疼痛・せん妄, 他の方法で緩和不能",o:"進行膵癌終末期, オピオイド増量・鎮痛補助薬でも疼痛とせん妄がコントロール不能",p:"あらゆる緩和手段を試行済み, 改善なし",q:"NRS 9-10/10, 不穏・せん妄, 家族と相談済み",r:"全身",s:"不穏, せん妄(過活動型), 呼吸困難, 家族の苦悩",t:"膵癌終末期→疼痛増悪→せん妄→緩和困難→鎮静の検討",pe:"苦痛の評価(STAS), 意識レベル, 予後予測(PPI), 他の緩和手段の検証",tests:"必要最小限(苦痛の原因検索: Ca, 脱水, 薬剤等の可逆的要因除外)",probs:"#1 治療抵抗性の苦痛(耐え難い疼痛+せん妄) #2 進行膵癌(予後日〜週単位) #3 鎮静の適応判断",course:"可逆的要因の除外→他の緩和手段の再検討→チーム判断→患者・家族との合意→間欠的鎮静(ミダゾラム)→効果不十分→持続的深い鎮静→記録と倫理的配慮",disc:"パリアティブセデーションの定義と適応, 倫理的枠組み(苦痛の治療抵抗性, インフォームドコンセント, 比例性原則), 安楽死との区別, 日本の実態と課題",refs:["Cherny NI. Ann Oncol 2014;25 Suppl 3:iii218","日本緩和医療学会. 苦痛緩和のための鎮静に関するガイドライン2023"]},"アドバンス・ケア・プランニング":{prof:"72歳男性, 進行COPD, 呼吸不全(HOT中)",cc:"今後の治療方針についての話し合い",o:"COPD Stage IV, HOT導入中, 増悪による入退院を繰り返し, 今後の方針について相談希望",p:"増悪時の対応を含めた今後の方針",q:"FEV1 25% predicted, mMRC 4, HOT 2L",r:"全身(終末期のケア計画)",s:"呼吸困難(安静時), ADL低下, 不安, 家族の不安",t:"COPD進行→入退院繰り返し→ACPの提案→話し合い開始",pe:"全身状態評価, PS, 栄養状態, 呼吸機能, 認知機能(意思決定能力)",tests:"血液ガス, 呼吸機能(直近), BNP, Alb, 体重推移",probs:"#1 進行COPD(予後不良) #2 ACP(今後の治療方針) #3 人工呼吸器・心肺蘇生の意思確認",course:"病状説明→価値観・希望の確認→代理意思決定者の確認→急変時対応の相談(DNAR, 人工呼吸)→文書化→定期的見直し",disc:"ACPの概念と実践プロセス, 非がん疾患(COPD, 心不全)でのACPの特殊性, DNAR/POLST, 共同意思決定, 文化的配慮",refs:["Sudore RL. JAMA Intern Med 2017;177:870","厚生労働省. 人生の最終段階における医療の決定プロセスに関するガイドライン2018"]},"非がん疾患の緩和ケア":{prof:"80歳女性, 重症心不全(EF20%), NYHA IV",cc:"呼吸困難, 倦怠感, 繰り返す入院",o:"重症心不全で年〇回の入退院, 呼吸困難と倦怠感が持続",p:"利尿薬で一時改善, 再増悪を繰り返す",q:"NYHA IV, EF 20%, 6カ月で3回入院",r:"全身(心不全症状)",s:"呼吸困難, 下肢浮腫, 倦怠感, 食欲不振, 不安・抑うつ",t:"心不全→繰り返す入院→GDMT限界→緩和ケア併診",pe:"心不全徴候(頸静脈怒張, 肺ラ音, 浮腫), PS, 栄養状態, うつ・不安スクリーニング",tests:"BNP, 腎機能, 電解質, Alb, 心エコー",probs:"#1 進行心不全(StageD) #2 症状緩和(呼吸困難, 倦怠感) #3 ACP #4 精神的苦痛",course:"心不全治療の最適化→症状緩和(利尿薬調整, オピオイド少量)→心理社会的支援→ACP→在宅ケア移行→多職種チーム",disc:"非がん疾患の緩和ケアの特殊性(予後予測の困難さ, 治療と緩和の並行), 心不全緩和ケアのエビデンス, 緩和ケア導入のタイミング(Surprise Question)",refs:["Rogers JG. JACC Heart Fail 2017;5:770","日本心不全学会. 心不全緩和ケアステートメント2021"]},"栄養・輸液管理（終末期）":{prof:"78歳男性, 進行食道癌, 経口摂取不能",cc:"経口摂取不能, 栄養管理の方針",o:"進行食道癌で完全閉塞, 経口摂取不能",p:"食道ステント不適応",q:"経口摂取ゼロ, PS 3, 予後数週〜数カ月",r:"全身(栄養状態)",s:"脱水, 口渇, 倦怠感, 家族の不安(「何も食べられない」)",t:"食道癌進行→嚥下不能→栄養管理方針検討→緩和ケアチーム介入",pe:"脱水所見, 栄養状態(BMI, Alb), 浮腫, PS, 意識レベル",tests:"血算, Alb, 電解質, 腎機能, 血糖",probs:"#1 経口摂取不能(食道癌完全閉塞) #2 終末期の栄養管理 #3 家族への説明・支援",course:"予後と全身状態の評価→輸液量の検討(500-1000mL/日, 過剰輸液回避)→末梢点滴 vs 皮下輸液→口腔ケア→家族への説明(自然な過程としての食欲低下)→ACP",disc:"終末期の輸液管理(過剰輸液の弊害: 浮腫, 胸水, 喀痰増加), 人工栄養の適応と限界, 家族への説明と支援, 口渇の緩和",refs:["Good P. Cochrane Database Syst Rev 2014;4:CD007022","日本緩和医療学会. 輸液ガイドライン2013"]},"家族ケア・グリーフケア":{prof:"50代女性, 夫を癌で亡くした遺族",cc:"夫の死後の悲嘆反応, 不眠, 食欲低下",o:"夫が膵癌で死亡して〇カ月, 悲嘆反応が持続",p:"日常生活に支障, 仕事復帰困難",q:"持続する悲嘆, 不眠, 食欲低下, 社会的引きこもり",r:"精神的・社会的側面",s:"故人への強い思慕, 罪悪感, 孤独感, 涙もろさ, 身体症状(頭痛, 倦怠感)",t:"夫の死亡→悲嘆反応→自然軽快しない→かかりつけ医から紹介",pe:"精神状態の評価, うつ症状スクリーニング(PHQ-9), 希死念慮の確認, 日常生活機能の評価, 社会的支援の有無",tests:"血算, 甲状腺機能(身体的原因の除外), 必要時心理検査",probs:"#1 遷延性悲嘆障害の疑い #2 抑うつ状態 #3 社会的孤立",course:"正常な悲嘆 vs 遷延性悲嘆障害の評価→支持的カウンセリング→遷延性悲嘆療法(CGT)→必要時抗うつ薬→遺族会紹介→長期フォロー",disc:"正常な悲嘆反応と遷延性悲嘆障害(ICD-11/DSM-5-TR)の区別, グリーフケアの実践, 遺族支援のリソース, 医療者自身の悲嘆とセルフケア",refs:["Shear MK. N Engl J Med 2015;372:153","日本グリーフケア協会"]}},"g9":{"逆流性食道炎":{prof:"55歳男性, 肥満, 飲酒歴あり",cc:"胸やけ, 呑酸",o:"〇カ月前から食後の胸やけ",p:"食後・臥位で増悪, 制酸薬で軽減",q:"灼熱感, NRS 4/10",r:"心窩部から胸骨後部",s:"嚥下困難なし, 体重変化なし, 吐血なし",t:"間欠的→持続的に増悪→前医でPPI処方→改善不十分→当院紹介",pe:"BMI, 腹部膨満, 心窩部圧痛の有無",tests:"上部消化管内視鏡(LA分類), 生検(Barrett食道確認), H.pylori検査",probs:"#1 逆流性食道炎(LA分類Grade_) #2 肥満 #3 飲酒習慣",course:"PPI開始→生活指導(減量・禁酒・挙上)→内視鏡フォロー→PPI維持療法",disc:"GERDの病態生理, PPI抵抗性GERDへのアプローチ, Barrett食道のサーベイランス",refs:["Katz PO. Am J Gastroenterol 2022;117:27","Iwakiri K. J Gastroenterol 2021;56:95"]},"胃癌":{prof:"70代男性, H.pylori既感染",cc:"心窩部痛, 体重減少",o:"〇カ月前から心窩部不快感",p:"食事と無関係に持続",q:"鈍痛, 食欲低下が顕著",r:"心窩部",s:"体重減少(3カ月で5kg), 貧血症状, 吐血なし",t:"食欲低下→前医で内視鏡→生検で腺癌→staging目的で当院紹介",pe:"体重・BMI, 腹部腫瘤, Virchow転移, 腹水, 直腸診",tests:"上部消化管内視鏡(生検), CT(胸腹骨盤), 腫瘍マーカー(CEA/CA19-9), 血算(貧血)",probs:"#1 胃癌(cT_N_M_, cStage_) #2 貧血 #3 H.pylori既感染",course:"ステージング完了→治療方針決定(手術/化学療法/内視鏡治療)→治療施行→術後管理→フォロー",disc:"胃癌の進行度分類とエビデンスに基づく治療選択, H.pyloriと胃癌の関連",refs:["Japanese Gastric Cancer Association. Gastric Cancer 2021;24:1","Smyth EC. Lancet 2020;396:635"]},"胃潰瘍・十二指腸潰瘍":{prof:"50代男性, NSAIDs常用",cc:"心窩部痛",o:"〇週間前から食後の心窩部痛",p:"食事で増悪(胃潰瘍)/空腹時に増悪(十二指腸潰瘍), 制酸薬で軽減",q:"灼熱感〜鈍痛",r:"心窩部",s:"嘔気あり, 黒色便の有無, 体重変化",t:"間欠的→持続的に増悪→前医受診→内視鏡施行",pe:"腹部圧痛, 反跳痛の有無, 直腸診(黒色便)",tests:"上部消化管内視鏡(Forrest分類), 生検(悪性除外), H.pylori検査, 血算(貧血)",probs:"#1 胃潰瘍/十二指腸潰瘍(Forrest分類_) #2 H.pylori感染/NSAIDs起因 #3 貧血(あれば)",course:"止血処置(必要時)→PPI投与→H.pylori除菌(陽性時)→NSAIDs中止→内視鏡フォロー",disc:"消化性潰瘍の成因(H.pylori vs NSAIDs), 内視鏡的止血の適応, 除菌治療の意義",refs:["Laine L. N Engl J Med 2016;374:2367","Malfertheiner P. Lancet 2009;374:1449"]},"食道癌":{prof:"65歳男性, 喫煙・飲酒歴, 嚥下障害",cc:"嚥下困難, 体重減少",o:"〇カ月前から固形物の嚥下困難が出現",p:"緩徐に進行, 液体も困難に",q:"嚥下困難(進行性), 3カ月で6kg体重減少",r:"前胸部〜背部(食道走行)",s:"嗄声(反回神経浸潤), 胸痛, 食欲低下, 吐血",t:"嚥下困難→前医で上部内視鏡→食道腫瘍→生検で扁平上皮癌/腺癌→staging目的で当院紹介",pe:"栄養状態(BMI, 体重減少), 頸部リンパ節, 嗄声, 鎖骨上リンパ節",tests:"上部消化管内視鏡(生検, ヨード染色/NBI), 胸腹部造影CT, PET-CT, 頭頸部CT(重複癌), 上部消化管造影, 腫瘍マーカー(SCC/CEA)",probs:"#1 食道癌(cT_N_M_, cStage_) #2 嚥下障害 #3 低栄養",course:"ステージング→早期: ESD→進行: 術前化学療法(CF/DCF)→手術(食道亜全摘)→術後補助療法→切除不能: CRT or 化学療法+免疫療法",disc:"食道癌の組織型(扁平上皮癌vs腺癌)と治療選択, 内視鏡治療の適応, 周術期管理, KEYNOTE-590(免疫療法)",refs:["Kitagawa Y. Ann Surg 2019;270:492","Kojima T. J Clin Oncol 2020;38:4138"]},"H.pylori感染症":{prof:"50歳男性, 胃潰瘍既往, 除菌未施行",cc:"心窩部不快感",o:"〇カ月前から心窩部不快感, 胃潰瘍の再発指摘",p:"食事と関連, 間欠的",q:"心窩部鈍痛, 食欲やや低下",r:"心窩部",s:"嘔気, 腹部膨満感, 胃潰瘍反復",t:"胃潰瘍再発→前医で内視鏡→H.pylori陽性→除菌目的で当院紹介",pe:"心窩部圧痛(軽度), 貧血所見の有無",tests:"H.pylori検査(尿素呼気試験/便中抗原/迅速ウレアーゼ試験/血清抗体), 上部消化管内視鏡, 血算(貧血), ペプシノゲンI/II比",probs:"#1 H.pylori感染症 #2 胃潰瘍(H.pylori関連) #3 胃癌リスク",course:"一次除菌(PPI+AMPC+CAM 7日間)→除菌判定(4週後UBT)→失敗: 二次除菌(PPI+AMPC+MNZ)→除菌成功後: 定期内視鏡フォロー",disc:"H.pyloriと胃癌の関連, 除菌療法のレジメンと成功率, CAM耐性の問題, 除菌後の胃癌サーベイランス",refs:["Sugano K. Gut 2015;64:1353","Malfertheiner P. Gut 2017;66:6"]},"急性胃炎":{prof:"40歳男性, NSAIDs内服, 飲酒後",cc:"心窩部痛, 嘔気",o:"飲酒翌日に心窩部痛と嘔気が出現",p:"食事・飲酒で増悪, 空腹時やや軽減",q:"心窩部痛NRS 5/10, 嘔気",r:"心窩部",s:"嘔吐, 食欲低下, 吐血(びらん性の場合)",t:"飲酒後→心窩部痛→嘔気→受診",pe:"心窩部圧痛, 反跳痛なし, 腸蠕動音正常, バイタル安定",tests:"上部消化管内視鏡(発赤・びらん・出血), 血算(貧血の有無), H.pylori検査",probs:"#1 急性胃炎(びらん性/非びらん性) #2 原因(NSAIDs/アルコール/ストレス) #3 上部消化管出血(あれば)",course:"原因除去(NSAIDs中止, 禁酒)→PPI/P-CAB→粘膜保護薬→食事指導→H.pylori陽性なら除菌→経過観察",disc:"急性胃炎の原因と鑑別, NSAIDs起因性胃粘膜障害の予防(PPI併用), ストレス潰瘍の予防",refs:["Laine L. Gastroenterology 2012;143:1218","日本消化器病学会. 消化性潰瘍診療ガイドライン2020"]}},"g10":{"潰瘍性大腸炎":{prof:"25歳男性, 初回発症",cc:"血便, 下痢",o:"〇カ月前から粘血便・下痢",p:"排便後に一時軽減, 食事で増悪",q:"1日6-8回の水様〜粘血便",r:"下腹部〜左下腹部",s:"腹痛, テネスムス, 発熱, 体重減少",t:"血便出現→前医で保存的治療→改善なし→当院紹介",pe:"腹部圧痛(左下腹部), 腸蠕動音亢進, 直腸診, 体温・脈拍",tests:"下部消化管内視鏡(生検), 便培養(感染症除外), CRP, 血算, Alb, 便中カルプロテクチン",probs:"#1 潰瘍性大腸炎(初回発症, 全大腸型/左側型, 重症度_) #2 貧血 #3 低栄養",course:"重症度判定(Truelove-Witts)→5-ASA or ステロイド導入→効果判定→寛解維持療法→内視鏡フォロー",disc:"UCの病型分類と重症度評価, 寛解導入と維持療法の選択, 長期経過と発癌サーベイランス",refs:["Ungaro R. Lancet 2017;389:1756","Kobayashi T. Nat Rev Dis Primers 2020;6:74"]},"大腸癌":{prof:"65歳男性, 便潜血陽性で精査",cc:"排便習慣の変化, 血便",o:"〇カ月前から便が細くなった",p:"特になし, 緩徐に進行",q:"便柱狭小化, 時に鮮血便",r:"下腹部(左側結腸の場合)",s:"貧血症状(動悸・息切れ), 体重減少",t:"検診で便潜血陽性→前医で大腸内視鏡→腫瘍性病変→生検で腺癌→当院紹介",pe:"腹部腫瘤, 肝腫大, 直腸指診, リンパ節腫脹",tests:"大腸内視鏡(生検), CT(胸腹骨盤), CEA/CA19-9, 血算",probs:"#1 大腸癌(部位_, cT_N_M_, cStage_) #2 鉄欠乏性貧血 #3 便潜血陽性(検診契機)",course:"ステージング→手術→術後病理→補助化学療法(StageIII)→サーベイランス",disc:"大腸癌のスクリーニングと早期発見の意義, ステージ別治療戦略",refs:["Benson AB. J Natl Compr Canc Netw 2022;20:219","Hashiguchi Y. Int J Clin Oncol 2020;25:1"]},"腸閉塞":{prof:"70代女性, 腹部手術既往, 腹痛・嘔吐",cc:"腹痛, 嘔吐, 排ガス停止",o:"〇日前から腹痛と嘔吐, 排ガス・排便停止",p:"間欠的な疝痛→持続痛に変化",q:"腹部膨満著明, 嘔吐(胆汁性→糞臭), 排ガス停止",r:"腹部全体",s:"脱水, 発熱(絞扼性), 腹膜刺激徴候(絞扼性)",t:"腹痛・嘔吐→排ガス停止→前医で腹部X線→腸閉塞→当院搬送",pe:"腹部膨満, 腸蠕動音(金属音/亢進→減弱), 圧痛, 腹膜刺激徴候, ヘルニア門, 直腸指診",tests:"腹部X線(鏡面像, 拡張腸管), 腹部CT(閉塞部位・原因, 絞扼徴候), 血算, CRP, 乳酸, 電解質, 腎機能",probs:"#1 腸閉塞(機械的: 癒着性/腫瘍性/ヘルニア, 絞扼性の有無) #2 脱水・電解質異常 #3 絞扼性イレウスの除外",course:"絶食・補液→経鼻胃管/イレウス管→単純性: 保存的治療→絞扼性: 緊急手術→原因検索→再発予防",disc:"機械的イレウスvs機能的イレウスの鑑別, 絞扼性イレウスの早期診断(CT所見), 手術適応の判断",refs:["Maung AA. JAMA Surg 2012;147:1085","日本腹部救急医学会. 急性腹症診療ガイドライン2015"]},"虚血性腸炎":{prof:"65歳女性, 高血圧・動脈硬化, 突然の腹痛・血便",cc:"左下腹部痛, 血便",o:"〇日前に突然の左下腹部痛, その後血便が出現",p:"急性発症, 排便後にやや軽減",q:"左下腹部痛, 暗赤色〜鮮血便",r:"左下腹部(下行結腸〜S状結腸)",s:"嘔気, 下痢, 発熱(あれば)",t:"突然の腹痛→血便→前医受診→虚血性腸炎疑い→当院紹介",pe:"左下腹部圧痛, 腸蠕動音亢進, 腹膜刺激徴候(壊疽型で出現), 直腸診(血便確認)",tests:"大腸内視鏡(縦走潰瘍, 粘膜浮腫, 暗赤色粘膜: 左側結腸優位), 腹部CT(壁肥厚, 周囲脂肪織混濁), 血算, CRP, 乳酸, 凝固",probs:"#1 虚血性腸炎(一過性型/狭窄型/壊疽型) #2 動脈硬化 #3 壊疽型の除外",course:"一過性型(大多数): 絶食→補液→抗菌薬(必要時)→食事再開→自然軽快→狭窄型: 内視鏡フォロー→壊疽型: 緊急手術",disc:"虚血性腸炎の3病型と予後, 急性腸間膜虚血との鑑別, 壊疽型の早期認識",refs:["Brandt LJ. Gastroenterology 2015;148:1163","日本消化器病学会. 大腸疾患診療ガイドライン"]},"憩室症":{prof:"60歳男性, 便秘傾向, 左下腹部痛",cc:"左下腹部痛, 発熱",o:"〇日前から左下腹部痛と発熱",p:"食事で増悪, 持続性",q:"左下腹部痛NRS 5/10, 体温38℃",r:"左下腹部(S状結腸)",s:"便秘, 下痢(交互), 腹部膨満, 血便(出血時)",t:"左下腹部痛→発熱→前医でCT→憩室炎→当院紹介",pe:"左下腹部圧痛, 筋性防御(あれば), 腹膜刺激徴候(穿孔時), 直腸診",tests:"腹部CT(憩室周囲脂肪織混濁, 膿瘍形成の有無, 遊離ガス), 血算, CRP, 尿検査(膀胱瘻除外), 大腸内視鏡(急性期後)",probs:"#1 急性憩室炎(Hinchey分類_) #2 合併症(膿瘍/穿孔/瘻孔) #3 大腸癌除外",course:"非複雑性: 抗菌薬(AMPC/CVA or LVFX+MNZ)→絶食→改善確認→複雑性(膿瘍>3cm): 経皮ドレナージ→穿孔: 緊急手術→急性期後: 大腸内視鏡(腫瘍除外)→再発予防(食物繊維)",disc:"憩室炎の重症度評価(Hinchey分類), 非複雑性の外来治療, 選択的手術の適応, 日本vs欧米の好発部位の違い(右側vs左側)",refs:["Stollman N. Lancet 2004;363:631","日本消化器病学会. 大腸憩室症ガイドライン2019"]}},"g11":{"胆石症・急性胆嚢炎":{prof:"50代女性, 肥満, 右季肋部痛",cc:"右季肋部痛, 発熱, 嘔気",o:"脂肪食摂取後に右季肋部痛が出現, 〇時間で増悪",p:"安静で軽減しない, 体動で増悪",q:"持続性の右季肋部痛, NRS 7/10, 発熱38.5℃",r:"右季肋部, 右肩放散痛",s:"嘔気, 嘔吐, Murphy sign陽性",t:"脂肪食後→右季肋部痛→発熱→前医で胆嚢炎疑い→当院紹介",pe:"右季肋部圧痛, Murphy sign, 筋性防御, 黄疸の有無, 体温, 脈拍",tests:"血算, CRP, 肝機能(AST/ALT/ALP/γGTP/T.Bil), 腹部エコー(胆嚢壁肥厚, 結石, debrisなど), 腹部CT",probs:"#1 急性胆嚢炎(TG18: Grade_) #2 胆石症 #3 敗血症の有無",course:"絶食→輸液→抗菌薬→重症度判定(TG18)→早期腹腔鏡下胆嚢摘出術(72h以内)→術後管理",disc:"急性胆嚢炎の診断基準と重症度分類(TG18/TG13), 早期手術の推奨, 手術困難例への経皮的胆嚢ドレナージ(PTGBD)",refs:["Yokoe M. J Hepatobiliary Pancreat Sci 2018;25:41","Ansaloni L. World J Emerg Surg 2016;11:25"]},"総胆管結石・急性胆管炎":{prof:"70代男性, 発熱・黄疸・腹痛(Charcot三徴)",cc:"発熱, 黄疸, 右季肋部痛",o:"〇日前から発熱・黄疸・右季肋部痛が出現",p:"解熱薬で一時解熱, 再燃",q:"体温39℃, T.Bil 5.0, 右季肋部痛",r:"右季肋部",s:"悪寒戦慄, 嘔気, 意識障害(重症時: Reynolds五徴)",t:"腹痛→発熱→黄疸→前医→Charcot三徴→当院搬送",pe:"黄疸, 右季肋部圧痛, バイタル(ショック評価), 意識レベル",tests:"血算, CRP, 肝胆道系酵素, ビリルビン, 凝固, 血液培養2セット, 腹部エコー/CT(胆管拡張, 結石), MRCP",probs:"#1 急性胆管炎(TG18: Grade_) #2 総胆管結石 #3 敗血症/DIC(重症時)",course:"輸液→抗菌薬→重症度判定→緊急胆道ドレナージ(ERCP/PTBD)(Grade III: 緊急, Grade II: 早期, Grade I: 待機)→結石除去→必要時胆嚢摘出",disc:"急性胆管炎の診断基準と重症度分類(TG18), 緊急胆道ドレナージの適応とタイミング, ERCP vs PTBDの選択",refs:["Miura F. J Hepatobiliary Pancreat Sci 2018;25:55","Manes G. Endoscopy 2019;51:472"]},"胆嚢癌・胆管癌":{prof:"65歳女性, 閉塞性黄疸, 体重減少",cc:"黄疸, 体重減少, 右季肋部鈍痛",o:"〇カ月前から皮膚の黄染と体重減少",p:"緩徐に進行",q:"T.Bil 10, ALP著増, 3カ月で6kg体重減少",r:"右季肋部",s:"搔痒, 灰白色便, 濃縮尿, 食欲不振",t:"黄疸→前医でCT→胆管腫瘍疑い→当院紹介",pe:"黄疸, 搔破痕, 胆嚢腫大(Courvoisier sign), 肝腫大, 腹水",tests:"肝胆道系酵素, ビリルビン, 腫瘍マーカー(CA19-9, CEA), 造影CT/MRI, MRCP, EUS, ERCP(組織採取), 胆汁細胞診",probs:"#1 胆管癌/胆嚢癌(部位: _, cStage_) #2 閉塞性黄疸 #3 栄養障害",course:"黄疸減黄(ERCP/PTBD)→ステージング→手術可能→手術(肝切除+胆管切除)→術後補助化学療法→手術不能→化学療法(GCS療法)→BSC",disc:"胆道癌の分類(肝内/肝門部/遠位部/胆嚢), 切除可能性の判断, 減黄の方法とタイミング, 化学療法のエビデンス(GCS療法)",refs:["Valle J. N Engl J Med 2010;362:1273","日本肝胆膵外科学会. 胆道癌診療ガイドライン2019"]},"膵癌":{prof:"65歳男性, 黄疸, 背部痛, 体重減少",cc:"黄疸, 背部痛, 体重減少",o:"〇カ月前から背部痛と体重減少, 〇週間前から黄疸",p:"緩徐に進行, 背部痛は前屈で軽減",q:"T.Bil 8.0, 4カ月で8kg体重減少",r:"心窩部〜背部",s:"食欲不振, 新規発症糖尿病, 灰白色便",t:"体重減少→背部痛→黄疸→前医CT→膵頭部腫瘤→当院紹介",pe:"黄疸, Courvoisier sign(胆嚢腫大), 体重減少, 腹水, 腹部腫瘤",tests:"造影CT/MRI, EUS-FNA(組織診), MRCP, 腫瘍マーカー(CA19-9, CEA, DUPAN-2, Span-1), 血糖/HbA1c",probs:"#1 膵癌(膵頭部, cT_N_M_, cStage_) #2 閉塞性黄疸 #3 新規発症糖尿病",course:"減黄(ERCP)→ステージング→切除可能→術前化学療法→膵頭十二指腸切除→術後補助化学療法(S-1)→切除不能→GnP/FOLFIRINOX→BSC",disc:"膵癌の早期診断の困難さ, 新規発症糖尿病との関連, ステージ別治療戦略(BR/LA/M), 術前化学療法の役割",refs:["Mizrahi JD. Lancet 2020;395:2008","日本膵臓学会. 膵癌診療ガイドライン2022"]},"自己免疫性膵炎":{prof:"60代男性, 閉塞性黄疸, 膵腫大",cc:"黄疸, 上腹部不快感",o:"〇週間前から皮膚の黄染と上腹部不快感",p:"緩徐に進行",q:"T.Bil 6.0, 膵のびまん性腫大(ソーセージ様)",r:"心窩部",s:"搔痒, 体重減少(軽度), 腹痛(軽度)",t:"黄疸→前医CT→膵腫大→膵癌疑い→当院紹介→AIP疑い",pe:"黄疸, 腹部所見(圧痛軽度), 涙腺・唾液腺腫脹の有無",tests:"IgG4(>135mg/dL), IgG, 造影CT(capsule-like rim, ソーセージ様膵), MRCP(主膵管の狭細化), EUS-FNA, 他臓器病変検索",probs:"#1 自己免疫性膵炎(1型/2型) #2 閉塞性黄疸 #3 膵癌との鑑別",course:"膵癌の除外→AIP確定診断(国際コンセンサス基準)→ステロイド(PSL 0.6mg/kg)→劇的改善(診断的治療)→漸減→再燃監視→維持療法",disc:"AIPの1型(IgG4関連) vs 2型の鑑別, 膵癌との鑑別診断, ステロイド治療の反応性, 再燃リスクと維持療法",refs:["Shimosegawa T. Gut 2011;60:666","Okazaki K. J Gastroenterol 2017;52:17"]},"慢性膵炎":{prof:"50代男性, アルコール多飲, 反復する腹痛",cc:"心窩部痛(反復性), 脂肪便",o:"〇年前からアルコール摂取後の心窩部痛を反復",p:"前屈位で軽減, 飲酒・食事で増悪",q:"間欠的な心窩部痛, 脂肪便(光沢のある軟便)",r:"心窩部〜背部",s:"体重減少, 脂肪便, 糖尿病の新規発症, 食欲低下",t:"飲酒後腹痛反復→前医CT→膵石灰化→慢性膵炎→当院紹介",pe:"心窩部圧痛, 体重減少, 栄養状態, アルコール摂取歴の詳細",tests:"膵酵素(正常化していることも), 便中エラスターゼ, 腹部X線/CT(膵石灰化, 膵管拡張), MRCP, 72時間便中脂肪, 血糖/HbA1c",probs:"#1 慢性膵炎(成因: アルコール性, ステージ_) #2 膵外分泌不全 #3 二次性糖尿病 #4 アルコール使用障害",course:"禁酒→疼痛管理(段階的: NSAIDs→弱オピオイド)→膵酵素補充(リパクレオン)→糖尿病管理→膵管ドレナージ(ESWL+ERCP)→栄養指導",disc:"慢性膵炎のステージ分類(早期, 確診), 膵外分泌不全の診断と膵酵素補充, 疼痛管理の難しさ, 膵癌リスクの経過観察",refs:["Beyer G. Lancet 2020;396:499","日本膵臓学会. 慢性膵炎診療ガイドライン2021"]},"膵嚢胞性疾患（IPMN）":{prof:"70代女性, 偶発的に発見された膵嚢胞",cc:"画像検査で偶発的に発見された膵嚢胞",o:"他疾患の精査中にCTで膵嚢胞を偶発的に発見",p:"無症状",q:"膵体部に15mmの嚢胞性病変, 主膵管拡張なし",r:"膵体部",s:"無症状, 膵炎既往なし, 家族歴なし",t:"他疾患精査中→CT→膵嚢胞→精査目的で当院紹介",pe:"無所見(偶発的発見)",tests:"造影CT/MRI, MRCP, EUS(壁在結節, 主膵管拡張), 嚢胞液分析(CEA, 細胞診, アミラーゼ), 腫瘍マーカー",probs:"#1 膵嚢胞性疾患(IPMN: 分枝型/主膵管型/混合型) #2 悪性転化リスク評価",course:"嚢胞の特徴評価→high-risk stigmata/worrisome featuresの有無→高リスク→手術→低リスク→定期画像フォロー(MRI/EUS)",disc:"膵嚢胞の鑑別(IPMN, MCN, SCN, SPN), IPMNの悪性転化リスク(国際コンセンサスガイドライン2017), サーベイランスの方法と間隔",refs:["Tanaka M. Pancreatology 2017;17:738","European Study Group. Gut 2018;67:789"]},"胆道ジスキネジア・胆嚢ポリープ":{prof:"40代女性, 繰り返す右季肋部痛, 胆石なし",cc:"反復する右季肋部痛(胆石なし)",o:"〇年前から食後の右季肋部痛を反復, 胆石は認めない",p:"脂肪食で増悪, 間欠的",q:"食後30分-1時間で出現, 数時間持続, NRS 5-6/10",r:"右季肋部",s:"嘔気, 腹部膨満, 機能的消化管障害との重複あり",t:"繰り返す右季肋部痛→エコー・CT→胆石なし→機能性疾患疑い→当院紹介",pe:"右季肋部圧痛, Murphy sign陰性, 腹部全体の診察",tests:"腹部エコー(胆嚢ポリープの有無, サイズ), 肝機能, CCK負荷胆嚢造影(胆嚢駆出率<35%: 異常), 上部内視鏡(他疾患除外)",probs:"#1 胆道ジスキネジア/胆嚢機能障害 #2 胆嚢ポリープ(あれば: サイズ_mm) #3 機能性消化管障害の重複",course:"胆嚢ポリープ→10mm以上or増大傾向→胆嚢摘出術→10mm未満→経過観察(6-12カ月毎エコー)→ジスキネジア→CCK負荷検査→異常→腹腔鏡下胆摘検討→正常→対症療法",disc:"胆嚢機能障害(Rome IV基準), 胆嚢ポリープの悪性リスク評価と手術適応, CCK-HIDA検査の診断的意義",refs:["Cotton PB. Gastroenterology 2016;150:1525","Wiles R. Radiology 2017;283:8"]},"原発性硬化性胆管炎":{prof:"35歳男性, 潰瘍性大腸炎合併, 肝機能異常",cc:"搔痒感, 肝機能異常",o:"UCの経過中にALP/γGTP上昇が出現",p:"緩徐に進行",q:"ALP 3×ULN, γGTP上昇, T.Bil軽度上昇",r:"右季肋部, 全身(搔痒)",s:"搔痒感, 倦怠感, 黄疸(進行時), 体重減少",t:"UC管理中→肝機能異常→MRCP→胆管の多発狭窄・拡張→PSC疑い→当院紹介",pe:"黄疸(進行時), 肝腫大, 脾腫, 掻破痕",tests:"ALP/γGTP上昇, T.Bil, IgG4(IgG4-SC除外), p-ANCA, MRCP(胆管の数珠状変化: 狭窄+拡張), ERCP(必要時), 肝生検(小胆管型), 大腸内視鏡(UC合併評価)",probs:"#1 原発性硬化性胆管炎 #2 潰瘍性大腸炎合併 #3 胆管癌リスク #4 肝硬変進展",course:"UDCA(効果は限定的, 議論あり)→搔痒管理→胆管狭窄: 内視鏡的拡張/ステント→胆管癌サーベイランス(年1回MRCP+CA19-9)→進行: 肝移植(唯一の根治)→UC管理継続",disc:"PSCの診断(MRCP+除外診断), UCとの関連(80%合併), 胆管癌リスク(生涯10-15%), 肝移植後の再発, IgG4関連硬化性胆管炎との鑑別",refs:["Karlsen TH. J Hepatol 2017;67:1298","Chapman R. Hepatology 2010;51:660"]}},"g12":{"肝硬変":{prof:"60代男性, C型肝炎既往, 飲酒歴あり",cc:"腹部膨満, 下肢浮腫",o:"〇カ月前から腹部膨満感と下肢浮腫が出現",p:"利尿薬で一時改善するが再貯留",q:"腹囲増大, 両下肢の圧痕性浮腫",r:"腹部全体, 両下肢",s:"倦怠感, 食欲低下, 黄疸なし/あり",t:"C型肝炎治療後→経過観察中→腹水出現→利尿薬開始→コントロール不良→当院紹介",pe:"腹水(波動, 濁音移動), 脾腫, クモ状血管腫, 手掌紅斑, 腹壁静脈怒張, 羽ばたき振戦",tests:"肝機能, PT-INR, 血算(血小板減少), 腹部エコー, CT, 上部消化管内視鏡(食道静脈瘤), Child-Pugh分類",probs:"#1 肝硬変(Child-Pugh_) #2 腹水 #3 C型肝炎既往(SVR確認) #4 食道静脈瘤",course:"Child-Pugh/MELD評価→腹水管理(減塩・利尿薬)→静脈瘤評価・予防→HCCスクリーニング→栄養管理",disc:"肝硬変の合併症管理(腹水・SBP・HE・HRS・HCC), Child-Pugh/MELDの臨床的意義",refs:["Tsochatzis EA. Lancet 2014;383:1749","EASL. J Hepatol 2018;69:406"]},"上部消化管出血":{prof:"65歳男性, NSAIDs内服中, 吐血",cc:"吐血, 黒色便, めまい",o:"〇日前から黒色便, 本日吐血が出現",p:"急性発症, 増悪傾向",q:"暗赤色吐血, タール便, 起立時めまい",r:"上部消化管(食道〜十二指腸)",s:"冷汗, 動悸, 失神(大量出血時)",t:"吐血+黒色便→救急搬送",pe:"バイタル(ショック徴候), 直腸診(黒色便), 経鼻胃管(血液確認), 貧血所見, 肝硬変徴候",tests:"血算(Hb), 血液型・交差試験, 凝固, BUN/Cr比(>30: 上部示唆), 緊急上部消化管内視鏡(Forrest分類), 腹部CT(活動性出血)",probs:"#1 上部消化管出血(原因: 消化性潰瘍/食道静脈瘤/Mallory-Weiss/腫瘍) #2 出血性ショック(あれば) #3 貧血",course:"ABC確保→輸液・輸血→PPI静注(内視鏡前)→緊急内視鏡(24h以内)→内視鏡的止血(クリッピング/焼灼/EIS)→止血困難: IVR/手術→原因治療",disc:"Glasgow-Blatchford scoreによるリスク評価, Forrest分類と内視鏡治療の適応, 再出血予防",refs:["Barkun AN. Ann Intern Med 2019;171:805","Laine L. Am J Gastroenterol 2021;116:899"]},"下部消化管出血":{prof:"70歳男性, 抗凝固薬内服中, 血便",cc:"鮮血便, 腹痛(軽度)",o:"〇日前から鮮血便が出現",p:"間欠的, 排便時に出現",q:"鮮血便(便器が赤くなる), 軽度腹痛",r:"下腹部",s:"めまい(大量出血時), 冷汗, 動悸",t:"鮮血便→量が増加→当院受診",pe:"バイタル, 直腸診(血液付着, 痔核の有無), 腹部診察, 貧血所見",tests:"血算(Hb), 凝固, 血液型, 腹部CT(造影: 出血部位同定), 大腸内視鏡(準備後), 血管造影(持続出血時)",probs:"#1 下部消化管出血(原因: 憩室出血/虚血性腸炎/痔核/腫瘍/血管異形成) #2 貧血 #3 抗凝固薬管理",course:"バイタル安定化→輸液・輸血→造影CT(活動性出血評価)→大腸内視鏡→内視鏡的止血→止血困難: IVR(コイル塞栓)→手術(最終手段)→原因治療→抗凝固薬再開判断",disc:"下部消化管出血の原因鑑別, 造影CTの役割, 大腸憩室出血の管理, 抗凝固薬/抗血小板薬の再開時期",refs:["Strate LL. N Engl J Med 2012;367:1272","Oakland K. Gut 2019;68:776"]},"Mallory-Weiss症候群":{prof:"40歳男性, 大量飲酒後の嘔吐, 吐血",cc:"嘔吐後の吐血",o:"大量飲酒後に反復嘔吐, その後吐血が出現",p:"嘔吐を繰り返した後に出現",q:"嘔吐後の鮮血〜暗赤色吐血, 比較的少量",r:"心窩部",s:"嘔気持続, めまい(大量時)",t:"飲酒→反復嘔吐→吐血→救急受診",pe:"バイタル(通常安定), 心窩部圧痛(軽度), 脱水所見",tests:"上部消化管内視鏡(食道胃接合部の縦走裂傷), 血算, 凝固",probs:"#1 Mallory-Weiss症候群 #2 上部消化管出血 #3 アルコール多飲",course:"大多数は自然止血(90%)→活動性出血: 内視鏡的止血(クリッピング)→PPI→制吐薬→飲酒指導",disc:"Mallory-Weiss症候群の病態(嘔吐による食道胃接合部裂傷), Boerhaave症候群(食道破裂)との鑑別, 自然止血率の高さ",refs:["Rawla P. Dis Mon 2019;65:100882","Kortas DY. Am J Gastroenterol 2001;96:2304"]},"食道静脈瘤出血":{prof:"60歳男性, 肝硬変(C型), 大量吐血",cc:"大量吐血, 意識混濁",o:"肝硬変経過観察中, 〇時間前に突然大量の吐血",p:"突然発症, 大量出血",q:"大量の暗赤色吐血, ショック状態",r:"食道〜胃噴門部",s:"冷汗, 意識レベル低下, 黒色便",t:"突然大量吐血→ショック→救急搬送",pe:"ショック徴候, 肝硬変所見(黄疸, 腹水, クモ状血管腫), 脾腫",tests:"血算(Hb), 凝固(PT延長), 血液型・交差試験, 肝機能, 腎機能, 乳酸, 緊急上部消化管内視鏡",probs:"#1 食道静脈瘤破裂出血 #2 肝硬変(Child-Pugh_) #3 出血性ショック",course:"ABC確保→輸液・輸血(制限的: Hb 7-8目標)→テルリプレシン/オクトレオチド静注→緊急内視鏡(EVL: 結紮術)→止血困難: SBチューブ/TIPS→抗菌薬(SBP予防)→二次予防(EVL+β遮断薬)",disc:"食道静脈瘤出血の初期管理(薬物+内視鏡), EVL vs EIS, 二次予防(EVL+非選択的β遮断薬), Baveno VIIコンセンサス",refs:["Garcia-Tsao G. Hepatology 2017;65:310","de Franchis R. J Hepatol 2022;76:959"]},"急性肝炎（A/B/C型・薬剤性）":{prof:"30歳男性, 黄疸, 全身倦怠感",cc:"黄疸, 倦怠感, 食欲低下",o:"〇週間前から倦怠感, 〇日前から黄疸が出現",p:"急性発症, 増悪傾向",q:"AST/ALT>1000, T.Bil 8.0, 黄疸",r:"全身(黄疸), 右季肋部",s:"嘔気, 褐色尿, 灰白色便, 掻痒感, 発熱(A型・E型)",t:"倦怠感→黄疸→前医で肝機能著明高値→ウイルス性/薬剤性精査→当院紹介",pe:"黄疸, 肝腫大(急性期), 圧痛, 腹水(劇症化時), 羽ばたき振戦(肝性脳症)",tests:"AST/ALT, T.Bil, PT-INR(劇症化指標), IgM-HA抗体(A型), HBs抗原/IgM-HBc抗体(B型), HCV抗体/HCV-RNA(C型), IgA-HEV抗体(E型), DLST(薬剤性), 自己抗体(AIH除外), 腹部エコー",probs:"#1 急性肝炎(A型/B型/C型/E型/薬剤性) #2 劇症化リスク評価(PT-INR) #3 肝予備能",course:"安静・対症療法→PT-INR/意識レベルモニタリング→劇症化徴候: 早期肝移植評価→B型急性重症: 核酸アナログ→薬剤性: 被疑薬中止→急性C型: DAA(慢性化予防)",disc:"急性肝炎の原因別特徴, 劇症肝炎の早期認識と肝移植適応, 薬剤性肝障害の診断(DDW-J基準)",refs:["Khashab M. Am J Gastroenterol 2007;102:2472","Andrade RJ. J Hepatol 2019;70:1222"]},"慢性肝炎":{prof:"50歳男性, B型肝炎キャリア, 肝機能異常持続",cc:"健診で肝機能異常を指摘(持続)",o:"〇年前からHBs抗原陽性, AST/ALT軽度上昇が持続",p:"自覚症状乏しい, 緩徐に進行",q:"AST 55, ALT 70, HBV-DNA 5.0 logIU/mL",r:"右季肋部(自覚症状乏しい)",s:"倦怠感(軽度), 肝線維化進行リスク",t:"HBVキャリア→肝機能異常持続→前医で経過観察→肝線維化評価目的で当院紹介",pe:"肝腫大(あれば), 脾腫, 肝硬変徴候の有無, クモ状血管腫",tests:"HBs抗原定量, HBe抗原/抗体, HBV-DNA定量, 肝機能, 血算(血小板), FIB-4 index, 肝エラストグラフィ, 腹部エコー, AFP(HCC スクリーニング)",probs:"#1 慢性B型肝炎(免疫活動期) #2 肝線維化評価 #3 肝細胞癌サーベイランス",course:"治療適応評価(ALT基準値+HBV-DNA量+線維化)→核酸アナログ(ETV/TAF)→HBV-DNA陰性化確認→HBsAg消失目標→肝癌サーベイランス(6カ月毎エコー+AFP)→C型: DAA(SVR達成)",disc:"B型慢性肝炎の治療適応と核酸アナログ選択, HBsAg消失(functional cure), C型慢性肝炎のDAA治療(SVR>95%), 肝癌サーベイランス",refs:["Terrault NA. Hepatology 2018;67:1560","EASL. J Hepatol 2017;67:370"]},"肝細胞癌":{prof:"70歳男性, C型肝硬変(SVR後), 定期エコーで腫瘤",cc:"肝腫瘤(スクリーニング発見)",o:"C型肝硬変SVR後, 定期エコーで肝腫瘤を発見",p:"無症状(スクリーニング発見)",q:"S6に25mm SOL, AFP 250, PIVKA-II 350",r:"右葉(S6)",s:"肝硬変症状(あれば), 体重減少(進行時)",t:"定期エコー→肝SOL→造影CT/MRI→典型的HCC→当院紹介",pe:"肝硬変所見(黄疸, 腹水, クモ状血管腫, 脾腫), 肝腫大, 圧痛",tests:"造影CT/MRI(動脈相濃染+門脈相wash-out), AFP, AFP-L3%, PIVKA-II, 肝機能(Child-Pugh), ICG R15, 腹部エコー, 腫瘍生検(非典型例)",probs:"#1 肝細胞癌(Stage_, Child-Pugh_) #2 肝硬変 #3 C型肝炎(SVR後)",course:"ステージング+肝予備能評価→治療アルゴリズム: 切除可能→肝切除, 3cm以下3個以下→RFA, 多発/大型→TACE, 脈管侵襲/遠隔転移→全身化学療法(アテゾリズマブ+ベバシズマブ)→肝移植(ミラノ基準内)",disc:"肝細胞癌の画像診断(典型的血行動態), 治療アルゴリズム(肝癌診療ガイドライン), IMbrave150試験(Atezo+Bev), 肝移植の適応(ミラノ基準)",refs:["Llovet JM. N Engl J Med 2021;385:56","日本肝臓学会. 肝癌診療ガイドライン2021"]},"アルコール性肝障害":{prof:"55歳男性, 大量飲酒歴20年",cc:"倦怠感, 腹部膨満, 黄疸",o:"20年間の大量飲酒(日本酒5合/日), 〇カ月前から腹部膨満と黄疸",p:"飲酒継続で増悪",q:"AST>ALT(AST/ALT比>2), γGTP著明高値, T.Bil上昇",r:"右季肋部, 腹部全体(腹水)",s:"食欲低下, 体重減少, 下肢浮腫, 手指振戦(離脱)",t:"大量飲酒→肝機能悪化→黄疸→腹水→当院紹介",pe:"肝腫大/縮小, 腹水, クモ状血管腫, 手掌紅斑, Dupuytren拘縮, 耳下腺腫大, 女性化乳房",tests:"AST/ALT(AST>ALT), γGTP, MCV(大球性), IgA, 腹部エコー/CT(脂肪肝/肝硬変), 肝エラストグラフィ, AUDIT, 他の肝疾患除外",probs:"#1 アルコール性肝障害(脂肪肝/肝炎/肝硬変) #2 アルコール使用障害 #3 栄養障害",course:"断酒(最重要)→アルコール性肝炎重症: ステロイド(Maddrey DF≥32)→栄養療法(ビタミンB1補充)→肝硬変管理→断酒支援(専門医/自助グループ)→肝癌サーベイランス",disc:"アルコール性肝障害のスペクトラム(脂肪肝→肝炎→肝硬変), 重症アルコール性肝炎の管理(Maddrey DF, Lilleスコア), 断酒の肝疾患改善効果",refs:["Crabb DW. Hepatology 2020;71:306","EASL. J Hepatol 2018;69:154"]}},"g13":{"本態性高血圧症（循環器的管理）":{prof:"60歳男性, 高血圧20年, 左室肥大",cc:"高血圧に伴う臓器障害の評価・管理",o:"20年来の高血圧, 降圧不十分, 左室肥大を指摘",p:"降圧薬2剤で血圧150/95 mmHg",q:"左室肥大(心エコー: IVSTd 13mm), 微量アルブミン尿",r:"全身(高血圧性臓器障害)",s:"労作時息切れ(軽度), 頭痛(時々), 夜間頻尿",t:"高血圧→左室肥大→降圧不十分→臓器障害評価→循環器紹介",pe:"血圧(両上肢, 起立), 心雑音(AR/AS), 眼底(KW分類), 頸動脈雑音, 末梢動脈, 浮腫",tests:"心電図(左室肥大), 心エコー(LVMI, E/e'), 頸動脈エコー(IMT), 腎機能, 尿アルブミン, ABI, 眼底",probs:"#1 高血圧性心疾患(左室肥大) #2 高血圧管理不良 #3 臓器障害(心・腎・血管)",course:"臓器障害評価→降圧薬最適化(ARB/ACEi+Ca拮抗薬+利尿薬)→降圧目標130/80未満→左室肥大退縮フォロー→定期的臓器障害評価",disc:"高血圧性臓器障害の評価(心, 腎, 血管, 脳, 眼底), 降圧目標の個別化, 薬剤選択と臓器保護, 治療抵抗性高血圧へのアプローチ",refs:["Williams B. Eur Heart J 2018;39:3021","日本高血圧学会. 高血圧治療ガイドライン2019"]},"腎血管性高血圧":{prof:"55歳女性, 急速な血圧上昇, 腎機能低下",cc:"急速に進行する高血圧, 腎機能低下",o:"〇年前から高血圧で治療中, 〇カ月前から急速に血圧上昇しCr上昇",p:"降圧薬増量で改善不十分",q:"血圧180/100(3剤), Cr 1.0→1.8に上昇",r:"全身(腎血管性)",s:"頭痛, 治療抵抗性, ACEi/ARB開始後の腎機能悪化",t:"高血圧→治療抵抗性→ACEi開始後Cr上昇→腎動脈狭窄疑い→当院紹介",pe:"血圧(両上肢), 腹部血管雑音(腎動脈), 眼底, 末梢血管",tests:"腎動脈エコー(PSV/RAR), 腎動脈MRA/CTA, PRA/PAC(レニン活性亢進), 腎機能, 腎サイズ左右差",probs:"#1 腎血管性高血圧(動脈硬化性/線維筋性異形成) #2 虚血性腎症 #3 治療抵抗性高血圧",course:"画像診断→動脈硬化性→薬物治療優先(ACEi/ARB慎重投与+Ca拮抗薬)→血管形成術(適応例)→線維筋性→バルーン拡張術→経過観察",disc:"腎血管性高血圧の原因(動脈硬化性 vs 線維筋性異形成), 薬物治療 vs 血管形成術のエビデンス(CORAL/ASTRAL試験), ACEi/ARB使用時の注意点",refs:["Cooper CJ. N Engl J Med 2014;370:13","Textor SC. N Engl J Med 2009;361:1972"]},"起立性低血圧・失神":{prof:"75歳男性, 降圧薬服用中, 起立時のめまい・失神",cc:"起立時のめまい, 失神",o:"〇カ月前から起立時のめまいが出現, 〇日前に失神して転倒",p:"起立時に増悪, 臥位で改善",q:"起立3分後に収縮期血圧20mmHg以上低下, 失神1回",r:"全身(循環不全)",s:"倦怠感, 食後低血圧, 入浴後低血圧, 転倒歴",t:"起立時めまい→失神→転倒→救急受診→起立性低血圧→精査目的で入院",pe:"起立試験(臥位→立位: 血圧・脈拍の変動), 脱水所見, 神経学的所見(自律神経障害), 心雑音",tests:"起立試験, 12誘導心電図, ホルター心電図, 心エコー, 血算, 腎機能, 電解質, コルチゾール, 薬剤リスト確認, Head-up tilt test(必要時)",probs:"#1 起立性低血圧(薬剤性/自律神経障害/脱水) #2 失神(原因精査) #3 転倒リスク",course:"原因検索→薬剤性→減薬・変更→脱水→補液→自律神経障害→非薬物療法(弾性ストッキング, 塩分摂取, 起立ゆっくり)→薬物療法(ミドドリン, フルドロコルチゾン)→心原性失神除外",disc:"起立性低血圧の定義と原因分類, 失神の鑑別(反射性/起立性/心原性), European Society of Cardiology失神ガイドライン, 高齢者の薬剤性低血圧",refs:["Brignole M. Eur Heart J 2018;39:1883","Ricci F. J Am Coll Cardiol 2015;66:848"]},"大動脈弁輪拡大・Marfan症候群":{prof:"25歳男性, 高身長, 大動脈基部拡大",cc:"大動脈基部拡大の指摘",o:"健診で心雑音→心エコーで大動脈基部拡大(45mm)を指摘",p:"無症状",q:"大動脈基部径45mm, 軽度AR",r:"胸部大動脈",s:"高身長(195cm), 指が長い(arachnodactyly), 水晶体亜脱臼, 気胸歴",t:"健診→心雑音→心エコー→大動脈基部拡大→Marfan症候群疑い→当院紹介",pe:"体型(高身長, arm span>身長), 指徴候(wrist/thumb sign), 水晶体亜脱臼(スリットランプ), 胸郭変形(漏斗胸/鳩胸), 関節過伸展, AR雑音",tests:"心エコー(大動脈基部径, AR), 造影CT/MRA(全大動脈), 眼科受診(水晶体), FBN1遺伝子検査, 家族歴聴取",probs:"#1 Marfan症候群(Ghent基準) #2 大動脈基部拡大(45mm) #3 大動脈解離・破裂リスク",course:"診断確定(Ghent基準)→ARB/β遮断薬→大動脈径フォロー(年1回エコー/CT)→手術適応(50mm or 急速拡大)→David手術/Bentall手術→遺伝カウンセリング→運動制限指導",disc:"Marfan症候群の診断基準(改訂Ghent基準2010), 大動脈合併症の予防(ARB/β遮断薬), 手術適応と術式選択, 妊娠・遺伝カウンセリング",refs:["Loeys BL. J Med Genet 2010;47:476","日本循環器学会. Marfan症候群ガイドライン"]},"末梢動脈疾患（CLI含む）":{prof:"70代男性, 糖尿病・喫煙歴, 間欠性跛行",cc:"歩行時の下肢痛(間欠性跛行)",o:"〇年前から歩行時の右下腿痛, 最近歩行距離が短縮",p:"歩行で出現, 休息で軽減(2-3分)",q:"歩行距離200m→50mに短縮, ABI 0.6",r:"右下腿",s:"冷感, 足背動脈触知微弱, 趾の色調変化, 安静時痛(重症化時)",t:"間欠性跛行→歩行距離短縮→前医でABI低下→当院紹介",pe:"足背・後脛骨動脈触知, ABI測定, 足趾血圧(SPP), 皮膚色調・温度, 潰瘍・壊疽の有無, Buerger test",tests:"ABI, SPP(皮膚灌流圧), 下肢動脈エコー, CTA/MRA, 血算, HbA1c, 脂質, 腎機能",probs:"#1 末梢動脈疾患(Fontaine_度, Rutherford_) #2 心血管リスク因子(糖尿病, 喫煙) #3 CLI(重症虚血肢)の有無",course:"リスク因子管理(禁煙, 糖尿病, 脂質)→抗血小板薬→運動療法(監視下歩行訓練)→血行再建(EVT/バイパス)(CLI or 薬物不応)→足のケア→フォロー",disc:"PADの診断(ABI)とFontaine/Rutherford分類, CLIの定義と治療戦略, 冠動脈・脳血管疾患の合併スクリーニング, 多面的リスク管理",refs:["Gerhard-Herman MD. Circulation 2017;135:e686","日本循環器学会. 末梢閉塞性動脈疾患ガイドライン2022"]},"急性大動脈症候群":{prof:"60代男性, 突然の背部痛, 高血圧",cc:"突然の激烈な背部痛",o:"〇月〇日〇時, 突然の背部痛(引き裂かれるような痛み)が出現",p:"安静で軽減しない, 移動する痛み",q:"激痛, NRS 10/10, 突然発症",r:"前胸部→背部→腰部に移動",s:"冷汗, 高血圧(200/110), 血圧左右差, 意識混濁",t:"突然発症の背部痛→救急搬送→造影CT→大動脈解離",pe:"血圧左右差(>20mmHg), 脈拍左右差, AR雑音(Stanford A), 腹部拍動性腫瘤, 下肢虚血徴候, 神経学的異常",tests:"造影CT(flap, 偽腔, 解離範囲), D-dimer, 心エコー(AR, 心タンポナーデ), 心電図, 血液ガス, 腎機能",probs:"#1 急性大動脈解離(Stanford A/B, DeBakey_型) #2 合併症(AR, 心タンポナーデ, 臓器虚血) #3 高血圧管理",course:"Stanford A→緊急手術(人工血管置換)→ICU管理→Stanford B→降圧(sBP 100-120)→安静→合併症監視→慢性期管理→画像フォロー",disc:"急性大動脈症候群(解離, 壁内血腫, PAU)の分類, Stanford分類と治療選択, 合併症の早期発見, 慢性期の大動脈管理",refs:["Erbel R. Eur Heart J 2014;35:2873","日本循環器学会. 大動脈瘤・大動脈解離ガイドライン2020"]},"心臓リハビリテーション":{prof:"55歳男性, 急性心筋梗塞後PCI, 心臓リハビリ目的",cc:"心筋梗塞後の心臓リハビリテーション",o:"急性心筋梗塞→PCI後, 心臓リハビリ開始",p:"術後経過良好, リハビリ介入段階",q:"EF 45%, peak VO2 15 mL/kg/min, NYHA II",r:"全身(運動耐容能)",s:"労作時息切れ, 体力低下, 不安, 復職への不安",t:"AMI→PCI→急性期→回復期心臓リハビリ開始",pe:"バイタル, 心肺運動負荷試験(CPX), 心拍応答, 血圧応答, 運動耐容能評価, 心理評価",tests:"CPX(AT, peak VO2, VE/VCO2 slope), 心エコー, ホルター心電図, BNP, 血液検査",probs:"#1 急性心筋梗塞後(PCI後) #2 運動耐容能低下 #3 二次予防(リスク因子管理)",course:"急性期リハ(ICU内早期離床)→前期回復期(病棟歩行)→後期回復期(CPX→運動処方)→維持期(外来リハ, 自主トレ)→復職支援",disc:"心臓リハビリテーションのエビデンス(予後改善効果), CPXによる運動処方の個別化, 二次予防の包括的アプローチ, 心理的支援",refs:["Anderson L. Cochrane Database Syst Rev 2016;1:CD001800","日本心臓リハビリテーション学会. 心臓リハビリテーションガイドライン2021"]},"妊娠高血圧症候群":{prof:"32歳女性, 初産婦, 妊娠34週, 高血圧・蛋白尿",cc:"妊娠中の高血圧, 蛋白尿, 頭痛",o:"妊娠34週の妊婦健診で血圧160/100, 蛋白尿2+",p:"安静で軽減しない, 進行性",q:"血圧160/100, 蛋白尿2+, 頭痛あり",r:"全身(母体・胎児)",s:"頭痛, 視覚異常(きらきら), 心窩部痛, 下肢浮腫",t:"妊婦健診→血圧上昇・蛋白尿→前医→重症妊娠高血圧腎症→当院搬送",pe:"血圧, 蛋白尿, 深部腱反射亢進(子癇前駆), 浮腫, 体重増加, 胎児心拍モニタリング",tests:"血算(HELLP症候群: LDH, 肝酵素, 血小板), 凝固, 腎機能, 尿蛋白/Cr比, 尿酸, sFlt-1/PlGF比, 胎児エコー",probs:"#1 重症妊娠高血圧腎症 #2 HELLP症候群の除外 #3 子癇予防 #4 胎児発育評価",course:"入院→降圧(ニカルジピン, ラベタロール)→硫酸マグネシウム(子癇予防)→胎児成熟度評価→37週到達or母体悪化→分娩→産後管理(降圧薬漸減)",disc:"妊娠高血圧症候群の分類(2018改訂), 重症化徴候(HELLP, 子癇), 降圧薬の選択(妊娠中の禁忌薬), 分娩時期の決定, 産後の長期心血管リスク",refs:["ACOG Practice Bulletin No. 222. Obstet Gynecol 2020;135:e237","日本妊娠高血圧学会. ガイドライン2021"]}},"g14":{"急性膵炎":{prof:"50代男性, アルコール多飲",cc:"心窩部痛, 背部痛",o:"飲酒後数時間で急激に発症",p:"前屈位でやや軽減, 仰臥位で増悪",q:"激痛, NRS 9/10, 持続性",r:"心窩部から背部に放散",s:"嘔吐, 発熱, 腹部膨満",t:"飲酒→数時間後に心窩部痛→前医受診→膵酵素上昇→当院搬送",pe:"心窩部圧痛・筋性防御, 腸蠕動音減弱, Grey-Turner/Cullen sign, バイタル",tests:"リパーゼ/アミラーゼ, CRP, BUN, LDH, Ca, 血液ガス, 造影CT, 重症度判定(JPN)",probs:"#1 急性膵炎(成因: アルコール性/胆石性, 重症度_) #2 脱水 #3 アルコール多飲",course:"絶食→十分な輸液→疼痛管理→重症度再評価(48h)→早期経腸栄養→合併症管理→成因治療",disc:"急性膵炎の重症度判定と初期治療, 壊死性膵炎への対応, 再発予防",refs:["Banks PA. Gut 2013;62:102","Yokoe M. J Hepatobiliary Pancreat Sci 2015;22:405"]},"膵神経内分泌腫瘍":{prof:"50歳女性, 低血糖発作, 膵腫瘤",cc:"反復する低血糖症状(空腹時), 膵腫瘤",o:"〇カ月前から空腹時の発汗・動悸・意識混濁を反復",p:"空腹時に出現, 食事摂取で改善(Whipple三徴)",q:"空腹時血糖 35mg/dL, 同時インスリン高値",r:"膵体尾部(機能性), 上腹部",s:"体重増加(インスリノーマ), 下痢(VIPoma), 潰瘍(ガストリノーマ)",t:"低血糖発作反復→前医で72時間絶食試験→インスリノーマ疑い→造影CT→膵腫瘤→当院紹介",pe:"低血糖時所見(発汗, 振戦, 意識障害), BMI(増加傾向), 腹部腫瘤(あれば)",tests:"72時間絶食試験(血糖+インスリン+Cペプチド), 造影CT/MRI(多血性腫瘤), EUS(小病変の検出), ソマトスタチン受容体シンチ(68Ga-DOTATATE PET), クロモグラニンA, 特異的ホルモン(インスリン/ガストリン/VIP)",probs:"#1 膵神経内分泌腫瘍(NET G_, 機能性/非機能性) #2 低血糖症(インスリノーマの場合) #3 MEN1合併の除外",course:"ステージング→切除可能: 手術(腫瘍核出/膵切除)→切除不能: ソマトスタチンアナログ(オクトレオチドLAR)→分子標的薬(エベロリムス/スニチニブ)→PRRT(177Lu-DOTATATE)→MEN1スクリーニング",disc:"膵NETのWHO分類(NET G1/G2/NEC G3)と治療選択, 機能性vs非機能性の鑑別, ENETS/NANETSガイドライン, PRRT(NETTER-1 trial)",refs:["Falconi M. Ann Oncol 2012;23:2444","Pavel M. Ann Oncol 2020;31:844"]},"腸間膜虚血":{prof:"75歳男性, 心房細動, 急性腹痛",cc:"突然の激しい腹痛",o:"〇時間前から突然の激しい腹痛が出現",p:"所見に比して痛みが激しい(pain out of proportion)",q:"激しい腹痛NRS 9/10, 腹部所見は比較的軽度(初期)",r:"臍周囲〜腹部全体",s:"嘔吐, 血便(進行時), ショック(進行時)",t:"突然の腹痛→前医で改善なし→造影CT→SMA閉塞→当院搬送",pe:"初期: 腹部所見と疼痛の乖離(pain out of proportion), 進行: 腹膜刺激徴候, 腸蠕動音減弱, 血便, ショック",tests:"造影CT(SMA/SMV閉塞, 腸管壁造影不良, 門脈ガス), 血液ガス(乳酸↑↑), D-dimer, 血算, 凝固, 心電図(AF)",probs:"#1 急性腸間膜虚血(動脈性塞栓/血栓/NOMI/静脈血栓) #2 腸管壊死リスク #3 心房細動(塞栓源)",course:"緊急対応(時間との戦い)→動脈塞栓: 血栓除去術/血管内治療→広範壊死: 腸切除→NOMI: 血管拡張薬(パパベリン)→静脈血栓: 抗凝固→second look手術→短腸症候群管理",disc:"急性腸間膜虚血の早期診断の重要性(致死率50-80%), pain out of proportionの認識, 4つの病型と治療戦略, 造影CTの診断能",refs:["Clair DG. N Engl J Med 2016;374:959","Bala M. World J Emerg Surg 2017;12:38"]},"消化管ポリポーシス":{prof:"25歳男性, 大腸ポリープ多発, 家族歴あり",cc:"血便, 大腸ポリープ多発(内視鏡指摘)",o:"〇年前から時々血便, 内視鏡で大腸に100個以上のポリープ",p:"ポリープは緩徐に増加",q:"大腸に100個以上の腺腫性ポリープ, 時に血便",r:"大腸全体",s:"腹痛, 貧血(慢性出血), 家族歴(大腸癌)",t:"血便→大腸内視鏡→多発ポリープ→FAP疑い→当院紹介",pe:"直腸指診(ポリープ触知), 腹部診察, CHRPE(先天性網膜色素上皮肥大), 歯牙異常, 皮膚腫瘤(デスモイド)",tests:"大腸内視鏡(ポリープ数・組織型), 上部消化管内視鏡(十二指腸腺腫), APC遺伝子検査, CT(デスモイド腫瘍), 甲状腺エコー",probs:"#1 家族性大腸腺腫症(FAP, APC遺伝子変異) #2 大腸癌リスク(100%) #3 消化管外病変(デスモイド/甲状腺/十二指腸)",course:"遺伝子診断→大腸全摘(予防的: 10-20代で施行, 回腸嚢肛門吻合/回腸瘻)→上部消化管サーベイランス→デスモイド監視→家族スクリーニング→遺伝カウンセリング",disc:"消化管ポリポーシスの分類(FAP/HNPCC/Peutz-Jeghers/若年性), FAPの予防的大腸全摘の時期, 消化管外症状(Gardner症候群), 遺伝カウンセリング",refs:["Kanth P. Gastroenterology 2017;152:1381","日本消化器病学会. 大腸ポリープ診療ガイドライン2020"]}},"g15":{"収縮性心膜炎":{prof:"60代男性, 結核既往, 右心不全症状",cc:"腹水, 下肢浮腫, 労作時呼吸困難",o:"〇カ月前から腹水・下肢浮腫が出現, 利尿薬で改善不十分",p:"利尿薬で一時改善, 再貯留",q:"腹水著明, 両下肢浮腫, 頸静脈怒張",r:"腹部, 両下肢",s:"倦怠感, 食欲低下, Kussmaul sign, 結核治療歴あり",t:"右心不全症状→利尿薬不応→心エコーでEF保持→収縮性心膜炎疑い→当院紹介",pe:"頸静脈怒張(Kussmaul sign), 心膜ノック音, 肝腫大, 腹水, 浮腫, 脈圧低下",tests:"心エコー(心膜肥厚, 呼吸性変動), 心臓MRI(心膜肥厚, late gadolinium enhancement), CT(心膜石灰化), 心臓カテーテル(dip-and-plateau), BNP",probs:"#1 収縮性心膜炎(結核後) #2 右心不全 #3 拘束型心筋症との鑑別",course:"診断確定(画像+血行動態)→利尿薬→根治的治療: 心膜切除術→術後管理→リハビリ",disc:"収縮性心膜炎 vs 拘束型心筋症の鑑別(MRI, カテーテル), 心膜切除術の適応とタイミング, 結核性の特徴",refs:["Adler Y. Eur Heart J 2015;36:2921","Welch TD. JACC Cardiovasc Imaging 2018;11:305"]},"肺性心（慢性）":{prof:"70代男性, COPD, 右心不全",cc:"下肢浮腫, 労作時呼吸困難の増悪",o:"COPD治療中, 〇カ月前から下肢浮腫と呼吸困難が増悪",p:"労作で増悪, 安静で軽減",q:"NYHA III, 両下肢浮腫, 頸静脈怒張",r:"両下肢, 胸部",s:"喀痰増加, チアノーゼ, 肝腫大",t:"COPD→呼吸困難増悪→下肢浮腫→右心不全疑い→当院紹介",pe:"頸静脈怒張, 三尖弁逆流雑音, 肝腫大(拍動性), 下肢浮腫, チアノーゼ, 樽状胸郭",tests:"心エコー(右室拡大, TR, RVSP上昇, 心室中隔偏位), BNP, 血液ガス, 胸部X線(右室拡大), 呼吸機能, 睡眠検査",probs:"#1 慢性肺性心(COPD関連) #2 肺高血圧症(Group 3) #3 右心不全 #4 低酸素血症",course:"原疾患治療(COPD最適化)→長期酸素療法(HOT: PaO2≤55)→利尿薬(右心不全)→肺高血圧治療薬(適応検討)→心臓リハビリ",disc:"慢性肺性心の病態(低酸素性肺血管収縮→肺高血圧→右心不全), HOTの適応と予後改善効果, COPD関連肺高血圧の治療",refs:["Cor pulmonale. Han MK. N Engl J Med 2020;383:1544","日本呼吸器学会. COPD診断と治療のためのガイドライン2022"]},"抗凝固療法管理":{prof:"75歳男性, 心房細動, DOAC服用中, 消化管出血",cc:"DOAC服用中の消化管出血",o:"心房細動でDOAC服用中, 〇日前から黒色便が出現",p:"DOAC継続中に出血",q:"Hb 9.0(前回12.5), 黒色便, バイタル安定",r:"上部消化管",s:"めまい, 動悸, 倦怠感",t:"DOAC服用中→黒色便→前医→Hb低下→当院紹介",pe:"バイタル(ショック徴候), 直腸診(黒色便), 腹部診察, 出血徴候(皮下出血等)",tests:"血算, 凝固(PT-INR, APTT), 腎機能(DOAC排泄), 上部消化管内視鏡, 出血源精査",probs:"#1 消化管出血(DOAC関連) #2 心房細動(抗凝固療法の中断リスク) #3 貧血",course:"DOAC中止→輸液・輸血→内視鏡的止血→出血源治療→抗凝固再開時期の判断(出血リスク vs 血栓リスク)→PPI併用→DOAC再開or変更",disc:"DOAC出血時の管理(中和薬: イダルシズマブ, アンデキサネットアルファ), 抗凝固療法再開のタイミング, CHA2DS2-VASc vs HAS-BLEDによるリスクバランス",refs:["Steffel J. Eur Heart J 2021;42:4194","Tomaselli GF. J Am Coll Cardiol 2020;76:594"]},"心原性失神":{prof:"50歳男性, 突然の失神, 家族歴(突然死)",cc:"運動中の突然の失神",o:"運動中に突然意識を消失, 数秒で自然回復",p:"前兆なし, 突然発症, 速やかに回復",q:"意識消失約10秒, 速やかに完全回復",r:"全身(循環不全)",s:"動悸(失神前), 胸痛なし, 痙攣なし, 家族に40代での突然死あり",t:"運動中失神→救急搬送→来院時意識清明→心原性失神疑い→精査入院",pe:"心雑音(HOCM, AS), 不整脈, 血圧(起立性変動なし), 12誘導心電図(Brugada, QT延長)",tests:"12誘導心電図(ST, QT, Brugada, WPW), 心エコー(HCM, ARVC, 弁膜症), ホルター心電図, 運動負荷心電図, 心臓MRI, 植込み型ループレコーダー(ILR), 遺伝子検査(必要時)",probs:"#1 心原性失神(不整脈性/構造的心疾患) #2 突然死リスク評価 #3 家族歴(若年突然死)",course:"原因検索→不整脈性→ICD/アブレーション→構造的→原疾患治療→原因不明→ILR留置→運動制限→家族スクリーニング",disc:"失神の鑑別(心原性 vs 反射性 vs 起立性), 心原性失神のレッドフラグ(運動中, 家族歴, 心電図異常), 突然死予防(ICD適応), 遺伝性不整脈のスクリーニング",refs:["Brignole M. Eur Heart J 2018;39:1883","Priori SG. Eur Heart J 2015;36:2793"]},"静脈疾患（慢性静脈不全・下肢静脈瘤）":{prof:"55歳女性, 立ち仕事, 下肢のだるさ・静脈瘤",cc:"下肢のだるさ, 静脈瘤, 皮膚変色",o:"〇年前から下肢の静脈瘤と重だるさが進行",p:"長時間立位で増悪, 挙上で軽減",q:"下肢伏在静脈瘤, CEAP C4a(色素沈着), 下肢倦怠感",r:"両下腿(左>右)",s:"浮腫(夕方増悪), 搔痒, 皮膚硬化, 潰瘍(C5-6の場合)",t:"下肢静脈瘤→皮膚変色→静脈うっ滞性皮膚炎→精査目的で当院紹介",pe:"静脈瘤の分布, 皮膚変色・硬化・潰瘍, 浮腫, Trendelenburg test, Perthes test, ABI(PAD合併除外)",tests:"下肢静脈エコー(逆流評価, DVT除外), ABI, 血液凝固(DVTリスク)",probs:"#1 慢性静脈不全(CEAP C_) #2 下肢静脈瘤 #3 静脈うっ滞性皮膚炎/潰瘍(あれば)",course:"保存療法(弾性ストッキング, 挙上, 運動)→症状持続/合併症→手術(ストリッピング, レーザー焼灼, 高周波焼灼)→静脈性潰瘍→圧迫療法+創傷管理",disc:"慢性静脈不全のCEAP分類, 弾性ストッキングのエビデンス, 血管内治療(レーザー/高周波)の適応, 静脈性潰瘍の管理",refs:["Wittens C. Eur J Vasc Endovasc Surg 2015;49:678","O'Donnell TF. J Vasc Surg 2014;60:3S"]},"肺塞栓症（循環器的管理）":{prof:"45歳女性, 経口避妊薬服用中, 突然の呼吸困難",cc:"突然の呼吸困難, 胸痛, 頻脈",o:"安静時に突然の呼吸困難と胸痛が出現",p:"安静で改善しない, 深呼吸で胸痛増悪",q:"SpO2 88%, HR 120/min, 呼吸困難(突然発症)",r:"胸部(胸膜性胸痛)",s:"頻脈, 低酸素血症, 下肢腫脹(片側), 咳嗽, 喀血(時に)",t:"突然の呼吸困難→救急搬送→造影CT→肺塞栓症→ICU入室",pe:"頻脈, 頻呼吸, SpO2低下, 頸静脈怒張, 右心負荷所見, 下肢腫脹(DVT), ショック徴候",tests:"造影CT(PE確認), 心エコー(右室拡大, TR, McConnell sign), D-dimer, 血液ガス, トロポニン, BNP, 下肢静脈エコー",probs:"#1 急性肺塞栓症(massive/submassive/low-risk) #2 DVT #3 リスク因子(OC服用)",course:"リスク層別化(sPESI, 右心機能, バイオマーカー)→massive→血栓溶解療法/外科的血栓除去→submassive→抗凝固+モニタリング→low-risk→抗凝固(DOAC)→DVT治療→リスク因子管理→抗凝固期間決定",disc:"急性PEのリスク層別化と治療選択, 血栓溶解療法の適応(massive PE), DOACによる治療のエビデンス, 抗凝固療法の期間(誘因の有無), CTEPH予防",refs:["Konstantinides SV. Eur Heart J 2020;41:543","日本循環器学会. 肺血栓塞栓症/深部静脈血栓症ガイドライン2017"]},"感染性動脈瘤":{prof:"70代男性, 発熱持続, 腹部拍動性腫瘤",cc:"発熱持続, 腹痛, 腰背部痛",o:"〇週間前から発熱が持続, 〇日前から腹痛・腰背部痛が出現",p:"発熱持続, 腹痛増悪傾向",q:"弛張熱38-39℃, 腹部拍動性腫瘤, 腰背部痛",r:"腹部(大動脈周囲), 腰背部",s:"体重減少, 倦怠感, 悪寒戦慄",t:"発熱持続→前医で抗菌薬→改善なし→腹部CT→大動脈瘤(急速拡大)→感染性動脈瘤疑い→当院搬送",pe:"腹部拍動性腫瘤, 圧痛, 腰背部叩打痛, バイタル(破裂リスク評価)",tests:"造影CT(動脈瘤の形態: 囊状, 周囲脂肪織混濁, ガス), 血液培養, CRP, PCT, 血算, PET-CT(活動性感染の評価)",probs:"#1 感染性大動脈瘤(部位: _, 起因菌: _) #2 菌血症 #3 破裂リスク",course:"血液培養→広域抗菌薬→緊急/準緊急手術(人工血管置換 or ステントグラフト+抗菌薬)→長期抗菌薬(6週以上)→画像フォロー",disc:"感染性動脈瘤の診断(CT所見, PET-CT), 外科的治療の緊急性(破裂リスク), 起因菌(Salmonella, Staphylococcus), 術後長期抗菌薬管理",refs:["Sörelius K. Eur J Vasc Endovasc Surg 2019;57:516","Wilson WR. Circulation 2016;134:e412"]},"心臓移植・補助人工心臓":{prof:"45歳男性, 拡張型心筋症, NYHA IV, 内科治療限界",cc:"重症心不全(内科治療限界), 心臓移植/VAD検討",o:"拡張型心筋症でGDMT最大化するもNYHA IV, EF 15%",p:"利尿薬増量, 強心薬依存状態",q:"EF 15%, INTERMACS profile 2-3, peak VO2 10 mL/kg/min",r:"全身(重症心不全)",s:"反復する心不全入院, 腎機能低下, 肝うっ血, 低栄養",t:"DCM→GDMT限界→強心薬依存→心臓移植/VAD検討→当科紹介",pe:"心不全徴候(重症), PS, 臓器障害評価, 精神心理的評価, 社会的支援",tests:"心エコー(EF, 弁逆流), 右心カテーテル(PVR, PCWP, CI), CPX(peak VO2), 腎肝機能, HLA, PRA, 全身感染症スクリーニング",probs:"#1 重症心不全(Stage D, INTERMACS_) #2 心臓移植/LVAD適応評価 #3 多臓器障害",course:"移植適応評価(年齢, 合併症, 社会的因子)→LVAD(BTT: bridge to transplant or DT: destination therapy)→移植待機→移植→免疫抑制→拒絶監視→長期フォロー",disc:"心臓移植の適応と禁忌, LVAD(BTT vs DT)の選択, 移植後免疫抑制療法と拒絶反応, 日本における心臓移植の現状(待機期間, 脳死ドナー不足)",refs:["Mehra MR. J Heart Lung Transplant 2016;35:1","日本循環器学会. 重症心不全に対する植込型補助人工心臓ガイドライン"]}},"g16":{"急性心筋梗塞（STEMI）":{prof:"65歳男性, 高血圧・糖尿病・脂質異常症",cc:"胸痛, 冷汗",o:"〇月〇日早朝, 安静時に突然発症した前胸部痛",p:"ニトログリセリン舌下で改善せず, 持続性",q:"絞扼感・圧迫感, NRS 8/10, 冷汗著明",r:"前胸部→左肩・左上腕に放散",s:"冷汗, 嘔気, 呼吸困難感. 胸膜痛なし",t:"突然発症→改善なし→救急要請→前医でST上昇→当院搬送",pe:"Killip分類, 血圧・脈拍, III音/IV音, 肺湿性ラ音, 頸静脈怒張, 末梢冷感",tests:"12誘導心電図(ST上昇誘導), 心筋トロポニンT/I, CK-MB, BNP, 心エコー(壁運動異常), 冠動脈造影",probs:"#1 急性心筋梗塞(STEMI, 責任血管: LAD/RCA/LCx) #2 心不全(Killip_) #3 高血圧症 #4 2型糖尿病",course:"緊急PCI(責任血管にDES留置)→DAPT開始→心リハ→二次予防薬→退院",disc:"急性期再灌流戦略(door-to-balloon time), PCI後の抗血栓療法, 二次予防のエビデンス",refs:["Ibanez B. Eur Heart J 2018;39:119","Kimura K. Circ J 2019;83:1085"]},"不安定狭心症":{prof:"60代男性, 高血圧, 喫煙歴",cc:"胸痛(増悪傾向)",o:"〇週間前から労作時胸痛が出現, 最近安静時にも出現",p:"安静で軽減するが発作頻度増加",q:"圧迫感, NRS 5-7/10",r:"前胸部, 左肩放散",s:"冷汗なし, 呼吸困難なし, 労作耐容能低下",t:"労作時胸痛→頻度増加→安静時にも出現→前医受診→入院",pe:"バイタル安定, 心雑音なし, 肺ラ音なし",tests:"12誘導心電図(ST変化), 心筋トロポニン, BNP, 心エコー, 冠動脈CT/造影",probs:"#1 不安定狭心症(Braunwald分類_) #2 冠動脈リスク因子",course:"抗血栓療法(DAPT)→薬物治療→冠動脈評価→PCI/CABG→二次予防",disc:"ACSの早期リスク層別化(GRACE/TIMIスコア), 侵襲的vs保存的治療戦略",refs:["Amsterdam EA. J Am Coll Cardiol 2014;64:e139","Collet JP. Eur Heart J 2021;42:1289"]},"急性心筋梗塞（NSTEMI）":{prof:"70歳男性, 高血圧・糖尿病・CKD",cc:"胸痛, 冷汗",o:"〇月〇日, 労作中に前胸部痛が出現, その後安静時にも持続",p:"ニトログリセリン舌下で一時軽減するが再燃, 完全には消失せず",q:"圧迫感, NRS 6/10, 冷汗あり",r:"前胸部→左肩に放散",s:"冷汗, 嘔気, 呼吸困難感. 胸膜痛なし",t:"労作中発症→安静でも持続→前医でST低下・トロポニン上昇→当院搬送",pe:"Killip分類, 血圧・脈拍, III音/IV音, 肺湿性ラ音, 末梢冷感",tests:"12誘導心電図(ST低下・T波陰転), 心筋トロポニンT/I(経時的), CK-MB, BNP, 心エコー(壁運動異常), 冠動脈造影",probs:"#1 急性心筋梗塞(NSTEMI) #2 冠動脈多枝病変(疑い) #3 高血圧症 #4 2型糖尿病 #5 CKD",course:"抗血栓療法(DAPT+ヘパリン)→リスク層別化(GRACE)→早期侵襲的戦略(24-72h以内にCAG)→PCI/CABG→二次予防",disc:"NSTEMI vs STEMIの治療戦略の違い, GRACEスコアによるリスク層別化と侵襲的治療のタイミング, 高リスク群の早期介入",refs:["Collet JP. Eur Heart J 2021;42:1289","Kimura K. Circ J 2019;83:1085"]},"安定狭心症":{prof:"62歳男性, 高血圧・脂質異常症, 喫煙歴",cc:"労作時胸痛",o:"〇カ月前から階段昇降時に前胸部の圧迫感",p:"労作で誘発, 安静2-3分で消失, ニトログリセリン舌下で速やかに軽減",q:"圧迫感, NRS 3-4/10, 発作時間5分以内",r:"前胸部, 左肩への放散あり",s:"息切れ(あれば), 冷汗なし, 安静時症状なし",t:"数カ月前から労作時胸痛→頻度不変→前医で負荷心電図陽性→当院紹介",pe:"安静時バイタル正常, 心雑音なし, 肺ラ音なし, 末梢動脈触知良好",tests:"安静時12誘導心電図, 運動負荷心電図, 心エコー(壁運動・EF), 冠動脈CT, 必要時CAG",probs:"#1 安定狭心症(CCS分類_) #2 冠動脈リスク因子(高血圧・脂質異常症・喫煙)",course:"抗狭心症薬(β遮断薬, Ca拮抗薬, 硝酸薬)→冠動脈評価→PCI/CABG適応評価→二次予防(スタチン, 抗血小板薬)→生活指導",disc:"安定狭心症の診断アルゴリズム(検査前確率), 薬物療法 vs 血行再建の適応(ISCHEMIA trial), 二次予防のエビデンス",refs:["Knuuti J. Eur Heart J 2020;41:407","JCS 2022 安定冠動脈疾患ガイドライン"]},"Prinzmetal狭心症":{prof:"45歳女性, 喫煙者, 冠危険因子少ない",cc:"安静時胸痛(早朝)",o:"〇カ月前から早朝(明け方)に胸痛で覚醒",p:"安静時に発症, ニトログリセリン舌下で速やかに軽減, 過換気・喫煙・寒冷で誘発",q:"絞扼感, NRS 7/10, 持続5-15分",r:"前胸部",s:"冷汗, 動悸(不整脈合併時), 失神(まれ)",t:"早朝の安静時胸痛が反復→前医で発作時ST上昇→冠攣縮疑い→当院紹介",pe:"発作間欠期はバイタル正常, 身体所見に特記なし",tests:"発作時12誘導心電図(一過性ST上昇), 24時間ホルター, 冠動脈造影(器質的狭窄除外), アセチルコリン/エルゴノビン負荷試験",probs:"#1 冠攣縮性狭心症(Prinzmetal型) #2 喫煙 #3 不整脈合併リスク",course:"Ca拮抗薬(長時間作用型)→硝酸薬→禁煙指導→β遮断薬は禁忌→発作時ニトログリセリン→長期フォロー",disc:"冠攣縮性狭心症の診断(誘発試験の適応と方法), β遮断薬禁忌の理由, 日本人における冠攣縮の疫学的特徴",refs:["JCS 2023 冠攣縮性狭心症の診断と治療に関するガイドライン","Beltrame JF. Eur Heart J 2017;38:2880"]},"心筋梗塞後症候群":{prof:"58歳男性, STEMI後2週間",cc:"胸痛(吸気時増悪), 発熱",o:"急性心筋梗塞(PCI後)〇週間後に胸痛と発熱が出現",p:"吸気・臥位で増悪, 前屈位で軽減",q:"鋭い胸痛, NRS 5/10, 体温37.8℃",r:"前胸部(広範囲)",s:"倦怠感, 関節痛, 呼吸困難(心膜液貯留あれば)",t:"STEMI→PCI施行→退院後〇週間→胸痛再出現・発熱→再入院",pe:"心膜摩擦音, 発熱, 胸膜摩擦音(合併時), 心タンポナーデ徴候の有無",tests:"12誘導心電図(びまん性ST上昇), CRP/ESR上昇, 心エコー(心膜液貯留), 胸部X線, 心筋トロポニン(再上昇の有無)",probs:"#1 心筋梗塞後症候群(Dressler症候群) #2 急性心筋梗塞後(PCI後) #3 心膜液貯留",course:"NSAIDs+コルヒチン→効果不十分時ステロイド→心膜液貯留モニタリング→抗凝固療法の調整(出血性心膜炎リスク)→外来フォロー",disc:"Dressler症候群の病態(自己免疫機序), NSAIDs+コルヒチンの有効性, 抗凝固療法中の心膜炎管理",refs:["Imazio M. N Engl J Med 2015;372:1048","Adler Y. Eur Heart J 2015;36:2921"]}},"g17":{"急性心不全":{prof:"75歳女性, 高血圧性心疾患, 心房細動",cc:"呼吸困難, 下肢浮腫",o:"〇日前から労作時呼吸困難, 昨夜起坐呼吸",p:"座位で軽減, 臥位で増悪",q:"NYHA IV, 起坐呼吸, 発作性夜間呼吸困難",r:"胸部全体",s:"両下肢浮腫, 体重増加(1週間で3kg), 尿量減少",t:"労作時息切れ→起坐呼吸→救急搬送",pe:"頸静脈怒張, III音, 両肺湿性ラ音, 両下肢圧痕性浮腫, 肝腫大",tests:"BNP/NT-proBNP, 胸部X線(肺うっ血), 心エコー(EF), 12誘導心電図, 血液ガス, 腎機能",probs:"#1 急性心不全(CS分類: Warm-Wet) #2 心房細動 #3 高血圧性心疾患",course:"酸素投与→利尿薬→血管拡張薬→原因検索→心不全薬最適化(ARNI/SGLT2i/β遮断薬/MRA)→退院指導",disc:"心不全の病態分類(CS/Forrester), 急性期治療と慢性期管理の移行, GDMT",refs:["McDonagh TA. Eur Heart J 2021;42:3599","Tsutsui H. Circ J 2019;83:2084"]},"慢性心不全":{prof:"68歳男性, 拡張型心筋症, EF30%",cc:"労作時呼吸困難(増悪)",o:"〇年前からの慢性心不全, 〇週間前から増悪",p:"安静で軽減, 労作で増悪",q:"NYHA II→IIIに増悪",r:"胸部, 両下肢",s:"下肢浮腫増悪, 夜間頻尿, 倦怠感",t:"慢性心不全→外来管理中→服薬アドヒアランス低下→増悪→入院",pe:"頸静脈怒張, III音, 両肺底部ラ音, 下肢浮腫, PS, 体重",tests:"BNP, 心エコー(EF), 胸部X線, 腎機能, 電解質, 鉄代謝, 甲状腺機能",probs:"#1 慢性心不全急性増悪(HFrEF, EF_%) #2 拡張型心筋症 #3 服薬アドヒアランス不良",course:"うっ血改善→GDMT最適化(ARNI, β遮断薬, MRA, SGLT2i)→心臓リハビリ→自己管理教育→外来フォロー",disc:"HFrEFの4本柱薬物治療(Fantastic Four), 心不全増悪の原因検索, デバイス治療の適応",refs:["McDonagh TA. Eur Heart J 2021;42:3599","Heidenreich PA. Circulation 2022;145:e895"]},"HFrEF":{prof:"65歳男性, 拡張型心筋症, EF25%",cc:"労作時呼吸困難, 易疲労",o:"〇年前からの心不全, NYHA II→IIIに増悪",p:"労作で増悪, 安静・座位で軽減",q:"NYHA III, 100m歩行で息切れ",r:"胸部, 両下肢",s:"起坐呼吸, 下肢浮腫, 夜間頻尿, 倦怠感",t:"心不全診断→外来GDMT導入中→〇カ月前からNYHA悪化→薬剤調整目的で入院",pe:"頸静脈怒張, III音, 両肺底部ラ音, 両下肢圧痕性浮腫, 冷たい四肢",tests:"BNP/NT-proBNP, 心エコー(EF, 壁運動, 弁逆流), 胸部X線, 腎機能, 電解質, 鉄代謝(フェリチン, TSAT), 甲状腺機能",probs:"#1 HFrEF(EF_%) #2 拡張型心筋症 #3 GDMT最適化不十分",course:"うっ血解除→GDMT4本柱最適化(ARNI, β遮断薬, MRA, SGLT2i)→鉄欠乏是正→デバイス適応評価(ICD/CRT)→心臓リハビリ→外来フォロー",disc:"HFrEFのGDMT 4本柱(Fantastic Four)の導入順序と忍容性評価, デバイス治療(ICD/CRT)の適応, 心臓移植/LVAD",refs:["McDonagh TA. Eur Heart J 2021;42:3599","Heidenreich PA. Circulation 2022;145:e895"]},"HFpEF":{prof:"75歳女性, 高血圧・肥満・心房細動",cc:"労作時呼吸困難, 下肢浮腫",o:"〇カ月前から労作時の息切れが増悪",p:"労作で増悪, 安静で軽減, 塩分摂取後に浮腫増悪",q:"NYHA II-III, EF≥50%",r:"胸部, 両下肢",s:"下肢浮腫, 易疲労, 体重増加, 腹部膨満",t:"高血圧経過観察中→労作時息切れ→前医でBNP上昇・EF正常→HFpEF疑い→当院紹介",pe:"血圧高値, 頸静脈怒張, IV音, 両下肢浮腫, 肥満",tests:"BNP/NT-proBNP, 心エコー(EF≥50%, E/e'上昇, 左房拡大, TR速度), 運動負荷心エコー, H2FPEFスコア",probs:"#1 HFpEF(H2FPEF/HFA-PEFFスコア_) #2 高血圧症 #3 肥満 #4 心房細動",course:"利尿薬(うっ血管理)→SGLT2i→血圧管理→体重管理・減量指導→心房細動管理→運動療法→合併症治療",disc:"HFpEFの診断アルゴリズム(H2FPEF/HFA-PEFF), SGLT2iのエビデンス(EMPEROR-Preserved/DELIVER), 表現型に応じた治療",refs:["Reddy YNV. Circulation 2018;138:861","Solomon SD. N Engl J Med 2022;387:1089"]},"心原性ショック":{prof:"68歳男性, 広範前壁STEMI後",cc:"血圧低下, 意識障害, 乏尿",o:"STEMI発症→緊急PCI後も血圧低下が持続",p:"カテコラミン投与で一時的にMAP維持",q:"BP 75/50mmHg, HR 115/min, CI<1.8 L/min/m², PCWP>18mmHg",r:"全身(ショック)",s:"末梢冷感, 網状皮斑, 乏尿, 意識混濁, 肺うっ血",t:"STEMI→PCI→ショック離脱せず→IABP挿入→CCU管理",pe:"末梢冷感, 網状皮斑, 頸静脈怒張, 肺湿性ラ音, III音, 乏尿, 意識レベル低下",tests:"動脈圧ライン, Swan-Ganzカテーテル(CI/PCWP), 乳酸, 心エコー(EF, 機械的合併症除外), 血液ガス, 腎機能, 肝機能",probs:"#1 心原性ショック(STEMI後, SCAI Stage_) #2 広範前壁心筋梗塞(PCI後) #3 多臓器不全(腎・肝)",course:"カテコラミン→IABP/Impella→機械的合併症精査→ECMO検討→臓器灌流維持→段階的離脱→心臓リハビリ",disc:"心原性ショックのSCAI分類, 機械的循環補助(IABP vs Impella vs ECMO)のエビデンス, ショックチームアプローチ",refs:["van Diepen S. Circulation 2017;136:e52","Thiele H. N Engl J Med 2017;377:2419"]},"右心不全":{prof:"60歳男性, 肺高血圧症",cc:"下肢浮腫, 腹部膨満, 労作時呼吸困難",o:"〇カ月前から下肢浮腫と腹部膨満が進行",p:"利尿薬で一時改善, 労作で増悪",q:"下肢浮腫著明, 腹水あり, 頸静脈怒張著明",r:"両下肢, 腹部, 頸部",s:"食欲低下, 肝腫大, 労作時息切れ, 肺うっ血は軽度",t:"肺高血圧→右心不全進行→利尿薬増量→改善不十分→入院",pe:"頸静脈怒張(Kussmaul sign), 肝腫大, 肝頸静脈逆流, 腹水, 両下肢浮腫, TR雑音, 肺ラ音は乏しい",tests:"BNP, 心エコー(RV拡大, TAPSE低下, TR, 推定RVSP), 胸部X線, 肝機能, 腎機能, 右心カテーテル",probs:"#1 右心不全 #2 肺高血圧症(Group_) #3 三尖弁逆流 #4 うっ血肝",course:"利尿薬(体液管理)→肺高血圧の原因検索→肺血管拡張薬(PH治療)→心不全管理→原疾患治療→外来フォロー",disc:"右心不全の病態と身体所見の特徴(左心不全との違い), 肺高血圧症の分類(Dana Point)と治療, TAPSEの臨床的意義",refs:["Konstam MA. Circulation 2018;137:364","Humbert M. Eur Heart J 2022;43:3618"]}},"g18":{"心房細動":{prof:"72歳男性, 高血圧, 糖尿病",cc:"動悸, 息切れ",o:"〇日前から動悸を自覚",p:"安静で軽減するが消失せず",q:"不整な動悸, 持続性",r:"胸部",s:"息切れ, めまい, 失神なし",t:"動悸出現→持続→前医でAF確認→当院紹介",pe:"脈拍(不整・頻脈), 血圧, 心雑音, 心不全徴候",tests:"12誘導心電図, 心エコー(左房径・弁膜症・EF), 甲状腺機能, BNP, 凝固",probs:"#1 心房細動(初発/発作性/持続性/永続性) #2 脳卒中リスク(CHA₂DS₂-VASc_点) #3 高血圧症",course:"レートコントロール→抗凝固療法(DOAC)→基礎疾患治療→リズムコントロール検討→アブレーション検討",disc:"CHA₂DS₂-VAScスコアによる抗凝固療法の適応, DOACの選択, レートvsリズムコントロール",refs:["Hindricks G. Eur Heart J 2021;42:373","Nogami A. Circ J 2021;85:1584"]},"心房粗動":{prof:"65歳男性, 高血圧, 心房細動の既往",cc:"動悸, 息切れ",o:"〇日前から規則的な動悸を自覚",p:"安静で軽減するが消失せず",q:"規則的な頻脈(HR 150/min), 持続性",r:"胸部",s:"息切れ, めまい, 運動耐容能低下",t:"動悸出現→持続→前医でHR 150の規則的頻脈→心房粗動疑い→当院紹介",pe:"規則的頻脈(HR 150前後=2:1伝導を示唆), 血圧, 心不全徴候",tests:"12誘導心電図(鋸歯状波, II/III/aVFで典型的flutter wave), 心エコー(左房, EF), 甲状腺機能, BNP",probs:"#1 心房粗動(典型的/非典型的, 通常型CTI依存性) #2 脳卒中リスク(CHA₂DS₂-VASc_点) #3 高血圧症",course:"レートコントロール→抗凝固療法(CHA₂DS₂-VAScに準じる)→カテーテルアブレーション(CTI線状焼灼)→外来フォロー",disc:"典型的心房粗動のメカニズム(CTI依存性マクロリエントリー), アブレーションの高い成功率, AF合併リスク",refs:["Page RL. Circulation 2016;133:e506","Nogami A. Circ J 2021;85:1584"]},"発作性上室頻拍":{prof:"30代女性, 基礎疾患なし",cc:"突然の動悸",o:"〇年前から突然始まる動悸発作を繰り返す",p:"突然始まり突然止まる, 息こらえ(Valsalva)で時に停止",q:"規則的な頻脈(HR 180/min), 発作は数分〜数時間",r:"胸部, 頸部(frog sign)",s:"不安感, ふらつき, 多尿(発作後)",t:"動悸発作反復→前医でValsalvaで停止→再発頻度増加→根治目的で当院紹介",pe:"発作時: 規則的頻脈, 頸静脈拍動(cannon A wave), 血圧低下(あれば). 間欠期: 正常",tests:"12誘導心電図(narrow QRS tachycardia, P波の位置), 発作時心電図, 24時間ホルター, 心エコー, 電気生理検査(EPS)",probs:"#1 発作性上室頻拍(AVNRT/AVRT) #2 動悸発作の反復",course:"急性期: 迷走神経刺激→ATP急速静注→Ca拮抗薬→根治: カテーテルアブレーション(遅伝導路/副伝導路焼灼)→外来フォロー",disc:"SVTの鑑別(AVNRT vs AVRT vs AT), ATP投与の診断的・治療的意義, カテーテルアブレーションの適応と成功率",refs:["Brugada J. Eur Heart J 2020;41:655","Nogami A. Circ J 2021;85:1584"]},"心室頻拍":{prof:"55歳男性, 陳旧性心筋梗塞, EF35%",cc:"動悸, ふらつき, 失神",o:"〇日前から動悸発作, 本日失神エピソード",p:"突然発症, 自然停止(非持続型)→今回は持続",q:"wide QRS tachycardia, HR 180/min",r:"胸部",s:"冷汗, 血圧低下, 意識消失, 呼吸困難",t:"陳旧性MI→ICD未植込み→動悸→失神→救急搬送→VT確認",pe:"頻脈, 血圧低下, 末梢冷感, 意識レベル評価, 房室解離の所見(cannon A wave, 変動するI音)",tests:"12誘導心電図(wide QRS tachycardia, 房室解離), 心エコー(EF, 壁運動異常), 冠動脈評価, 電気生理検査, 心臓MRI(瘢痕評価)",probs:"#1 心室頻拍(持続性, 単形性) #2 陳旧性心筋梗塞 #3 低心機能(EF_%) #4 心臓突然死リスク",course:"急性期: 電気的除細動(不安定時)/アミオダロン→基礎心疾患治療→ICD植込み→カテーテルアブレーション検討→β遮断薬",disc:"VTの鑑別診断(SVT with aberrancyとの鑑別: Brugada criteria), ICD適応(一次予防vs二次予防), VTアブレーション",refs:["Al-Khatib SM. Circulation 2018;138:e272","Nogami A. Circ J 2021;85:1584"]},"心室細動":{prof:"50歳男性, 院外心停止, バイスタンダーCPR施行",cc:"心停止(VF)",o:"〇月〇日, 目撃下に突然意識消失・倒れた",p:"バイスタンダーCPR, AED 1回除細動後ROSC",q:"心電図モニター上VF, 除細動後洞調律に復帰",r:"全身(心停止)",s:"意識消失, 呼吸停止, 脈拍消失",t:"突然倒れる→バイスタンダーCPR→AED除細動→ROSC→救急搬送→当院CCU",pe:"ROSC後: GCS評価, 瞳孔, バイタル, 神経学的所見, 12誘導心電図",tests:"12誘導心電図(ST変化, QT延長, Brugada pattern), 心エコー, 冠動脈造影, 血液ガス, 乳酸, 電解質, 頭部CT, 脳波(TTM中)",probs:"#1 心室細動(OHCA, ROSC後) #2 VFの原因検索(急性冠症候群/心筋症/チャネル病) #3 低酸素脳症リスク",course:"体温管理療法(TTM 33-36℃)→原因検索(CAG等)→原因治療→ICD植込み(二次予防)→神経学的予後評価→心臓リハビリ",disc:"心停止の蘇生後管理(TTM), VFの原因検索アルゴリズム, ICD二次予防の適応, 神経学的予後予測",refs:["Panchal AR. Circulation 2020;142:S366","Nolan JP. Resuscitation 2021;161:1"]},"完全房室ブロック":{prof:"78歳女性, めまい・失神",cc:"めまい, 失神, 徐脈",o:"〇週間前からめまい, 本日失神",p:"体位変換時に増悪, 安静で改善",q:"HR 35/min, 補充調律(wide QRS escape)",r:"全身(脳灌流低下)",s:"失神(Adams-Stokes発作), 倦怠感, 労作時息切れ",t:"めまい反復→失神→前医でHR 35, 完全AVB→当院搬送",pe:"徐脈, 血圧低下(あれば), cannon A wave, 変動するI音, 意識レベル",tests:"12誘導心電図(P波とQRSの完全解離), 24時間ホルター, 心エコー, 血液検査(電解質, 甲状腺, 薬剤確認), 心臓MRI(必要時)",probs:"#1 完全房室ブロック #2 Adams-Stokes発作 #3 原因検索(加齢性線維化/虚血/薬剤性/サルコイドーシス)",course:"一時的ペーシング(経皮/経静脈)→可逆的原因の除外→恒久的ペースメーカー植込み→外来フォロー(デバイスチェック)",disc:"房室ブロックの分類と部位診断, ペースメーカーの適応(Class I), 可逆的原因(薬剤・電解質・虚血)の検索",refs:["Kusumoto FM. Circulation 2019;140:e382","Nogami A. Circ J 2021;85:1584"]},"洞不全症候群":{prof:"72歳女性, めまい, 動悸と徐脈の交代",cc:"めまい, ふらつき, 動悸",o:"〇カ月前からめまいと動悸が交互に出現",p:"体動で増悪, 安静で軽減",q:"HR 40-45/min(徐脈時), 頻脈発作(AF/AT)あり",r:"全身(脳灌流低下)",s:"易疲労, 労作時息切れ, 眼前暗黒感, 一過性意識消失",t:"めまい・動悸→前医でホルター施行→洞停止+頻脈発作→当院紹介",pe:"徐脈(または頻脈), 血圧, 意識レベル, 心不全徴候",tests:"12誘導心電図, 24時間ホルター(洞停止, 洞房ブロック, 徐脈頻脈症候群), 心エコー, 甲状腺機能, 薬剤確認",probs:"#1 洞不全症候群(Rubenstein分類_型) #2 徐脈頻脈症候群(あれば) #3 症候性徐脈",course:"症候性→ペースメーカー植込み(AAI/DDD)→徐脈頻脈型: ペースメーカー+抗不整脈薬/アブレーション→外来フォロー",disc:"洞不全症候群のRubenstein分類(I-III型), ペースメーカーの適応と機種選択, 徐脈頻脈症候群の管理",refs:["Kusumoto FM. Circulation 2019;140:e382","Brignole M. Eur Heart J 2018;39:1883"]},"WPW症候群":{prof:"25歳男性, 基礎疾患なし, 動悸発作",cc:"動悸(突然発症)",o:"〇年前から突然始まる動悸発作を数回経験",p:"突然始まり突然止まる, 数分〜数十分持続",q:"規則的頻脈(HR 200/min)",r:"胸部",s:"ふらつき, 冷汗, 不安感, 失神(まれ)",t:"動悸発作反復→前医で心電図δ波指摘→精査・根治目的で当院紹介",pe:"発作間欠期: 正常. 発作時: 頻脈, 血圧変動",tests:"12誘導心電図(δ波, PQ短縮, wide QRS=顕性WPW), 発作時心電図, 24時間ホルター, 心エコー, 電気生理検査(EPS: 副伝導路の不応期評価)",probs:"#1 WPW症候群 #2 発作性上室頻拍(正方向性AVRT) #3 心房細動合併リスク(偽性VT)",course:"EPS→副伝導路の局在・リスク評価(SPERRI<250ms=高リスク)→カテーテルアブレーション(副伝導路焼灼)→外来フォロー",disc:"WPW症候群のリスク層別化(AF合併時のVFリスク), ジギタリス・ベラパミル禁忌の理由, アブレーションの適応と成功率",refs:["Brugada J. Eur Heart J 2020;41:655","Nogami A. Circ J 2021;85:1584"]},"QT延長症候群":{prof:"18歳女性, 運動中の失神, 家族歴あり(突然死)",cc:"失神(運動中)",o:"水泳中に突然意識消失, 速やかに回復",p:"運動・情動ストレスで誘発",q:"QTc 520ms",r:"全身(心停止/失神)",s:"動悸(TdP先行), 痙攣様運動(てんかんと誤診されやすい)",t:"運動中失神→前医でてんかん疑い→心電図でQT延長→家族歴(兄の突然死)→当院紹介",pe:"安静時身体所見は正常, 先天性聾の有無(Jervell-Lange-Nielsen), 失神の状況聴取",tests:"12誘導心電図(QTc延長, T波形態), 運動負荷心電図, 24時間ホルター, 遺伝子検査(KCNQ1/KCNH2/SCN5A), 家系調査",probs:"#1 先天性QT延長症候群(LQT_型) #2 失神(TdPに伴う) #3 突然死の家族歴",course:"β遮断薬(全型に有効)→生活指導(競技スポーツ制限, 遺伝型別トリガー回避)→高リスク: ICD植込み→遺伝カウンセリング→家族スクリーニング",disc:"先天性LQTSの遺伝型別特徴(LQT1: 運動, LQT2: 驚愕/睡眠, LQT3: 安静時), QT延長を来す薬剤(CredibleMeds), 遺伝カウンセリング",refs:["Priori SG. Eur Heart J 2015;36:2793","Schwartz PJ. Circulation 2013;127:2126"]}},"g19":{"感染性心内膜炎":{prof:"45歳男性, 歯科治療後, 発熱持続",cc:"発熱, 全身倦怠感",o:"歯科治療〇週間後から38℃台の発熱が持続",p:"解熱薬で一時的に解熱, 再燃",q:"弛張熱, 倦怠感著明",r:"全身症状",s:"体重減少, 関節痛, 皮疹, 指先の出血点",t:"歯科治療→発熱持続→前医で抗菌薬→改善なし→血液培養陽性→当院紹介",pe:"心雑音(新規or増悪), Osler結節, Janeway病変, 爪下出血, 眼底(Roth斑), 脾腫",tests:"血液培養(3セット以上), 心エコー(TTE→TEE, 疣贅), CRP/ESR, 血算, 腎機能",probs:"#1 感染性心内膜炎(Modified Duke基準) #2 菌血症(起因菌:_) #3 弁膜症",course:"血液培養採取→経験的抗菌薬→起因菌同定→最適抗菌薬4-6週→手術適応評価→外来フォロー",disc:"修正Duke基準による診断, 早期手術の適応, 塞栓症のリスク評価",refs:["Habib G. Eur Heart J 2015;36:3075","Baddour LM. Circulation 2015;132:1435"]},"大動脈弁狭窄症":{prof:"80歳男性, 労作時息切れ, 失神",cc:"労作時呼吸困難, 失神",o:"〇カ月前から労作時の息切れが進行, 先日失神",p:"労作で増悪, 安静で軽減",q:"NYHA III, 失神1回, 狭心症様胸痛あり",r:"胸部",s:"狭心症様胸痛, 失神, 労作時呼吸困難(AS三徴)",t:"労作時息切れ→失神→前医で心雑音指摘→心エコーで重症AS→当院紹介",pe:"収縮期駆出性雑音(右第2肋間→頸部放散), 遅脈(pulsus parvus et tardus), II音減弱, 左室拍動持続",tests:"心エコー(弁口面積, 平均圧較差, Vmax, EF), 12誘導心電図(左室肥大), 冠動脈造影(術前), CT(大動脈弁石灰化, TAVI評価)",probs:"#1 重症大動脈弁狭窄症(AVA_, mean PG_mmHg) #2 症候性AS(失神・心不全・狭心症) #3 高齢",course:"症候性重症AS→弁置換術(SAVR or TAVI)→術後管理→心臓リハビリ→外来フォロー",disc:"ASの重症度評価(AVA/圧較差/Vmax), 症候出現後の予後, SAVR vs TAVIの適応(年齢・手術リスク), low-flow low-gradient AS",refs:["Vahanian A. Eur Heart J 2022;43:561","Otto CM. J Am Coll Cardiol 2021;77:e25"]},"大動脈弁閉鎖不全症":{prof:"55歳男性, Marfan症候群疑い",cc:"動悸, 労作時呼吸困難",o:"〇年前から動悸を自覚, 最近労作時息切れが出現",p:"労作で増悪, 安静で軽減",q:"拡張期雑音あり, NYHA II",r:"胸部",s:"起坐呼吸(進行時), 夜間発汗, 動悸(脈圧増大による)",t:"動悸→前医で拡張期雑音指摘→心エコーで重症AR→当院紹介",pe:"拡張期灌水様雑音(左第3-4肋間), 脈圧増大, water-hammer pulse, de Musset徴候, Hill徴候, Austin-Flint雑音",tests:"心エコー(逆流の重症度, 左室拡大, EF), 心臓MRI(逆流量定量), 大動脈径評価, CT/MRA(大動脈基部拡大)",probs:"#1 重症大動脈弁閉鎖不全症 #2 左室拡大(LVDd/LVDs) #3 大動脈基部拡大(Marfan疑い)",course:"経過観察(無症候・LV機能保持)→症候出現/LV拡大進行→外科的弁置換術(AVR)/弁形成術→術後管理→外来フォロー",disc:"慢性AR vs 急性ARの病態の違い, 手術適応(症状, LV径, EF), 大動脈基部拡大を伴うARの管理(Marfan/二尖弁)",refs:["Vahanian A. Eur Heart J 2022;43:561","Otto CM. J Am Coll Cardiol 2021;77:e25"]},"僧帽弁狭窄症":{prof:"55歳女性, リウマチ熱の既往",cc:"労作時呼吸困難, 動悸",o:"〇年前から労作時息切れ, 最近増悪",p:"労作・頻脈(AF発症)で増悪",q:"NYHA II-III, 心房細動合併",r:"胸部",s:"動悸(AF), 喀血(重症時), 嗄声(Ortner症候群, まれ)",t:"労作時息切れ→AF発症で急激に増悪→前医でMS指摘→当院紹介",pe:"僧帽弁開放音(OS), 拡張期ランブル(心尖部, 左側臥位), I音亢進, 頸静脈怒張",tests:"心エコー(弁口面積, mean PG, Wilkinsスコア, 左房径), 12誘導心電図(AF, 左房負荷), 胸部X線(左房拡大, 肺うっ血)",probs:"#1 僧帽弁狭窄症(MVA_, 重症度_) #2 心房細動 #3 リウマチ性心疾患",course:"利尿薬→心房細動管理(レートコントロール+抗凝固)→重症: PTMC(Wilkins≤8)/MVR→外来フォロー",disc:"リウマチ性MSの病態と自然経過, PTMC(経皮的僧帽弁交連切開術)の適応(Wilkinsスコア), 先進国でのMS減少と途上国での重要性",refs:["Vahanian A. Eur Heart J 2022;43:561","Nishimura RA. J Am Coll Cardiol 2014;63:e57"]},"僧帽弁閉鎖不全症":{prof:"70歳男性, 僧帽弁逸脱",cc:"労作時呼吸困難, 易疲労",o:"〇カ月前から労作時の息切れが進行",p:"労作で増悪, 安静で軽減",q:"NYHA II-III, 収縮期雑音あり",r:"胸部",s:"起坐呼吸(進行時), 動悸(AF合併時), 下肢浮腫",t:"労作時息切れ→前医で収縮期雑音指摘→心エコーで重症MR→当院紹介",pe:"汎収縮期雑音(心尖部→腋窩放散), III音, 心尖拍動左方偏位, 肺ラ音(うっ血時)",tests:"心エコー(MRの成因・重症度, EROA, 逆流量, 左室径, EF, 左房径), 経食道心エコー(TEE), 心臓MRI",probs:"#1 重症僧帽弁閉鎖不全症(一次性: 弁逸脱/腱索断裂) #2 左室拡大 #3 心房細動(あれば)",course:"軽症: 経過観察→重症+症状/LV拡大/EF低下/AF: 僧帽弁形成術(MVr)優先→術後管理→外来フォロー",disc:"一次性MR vs 二次性MRの治療戦略の違い, 弁形成術(MVr) vs 弁置換術(MVR), MitraClipの適応(手術高リスク例)",refs:["Vahanian A. Eur Heart J 2022;43:561","Otto CM. J Am Coll Cardiol 2021;77:e25"]}},"g20":{"拡張型心筋症":{prof:"50歳男性, 家族歴あり",cc:"労作時呼吸困難, 下肢浮腫",o:"〇カ月前から労作時の息切れと下肢浮腫",p:"労作で増悪, 安静で軽減",q:"NYHA III, EF 25%, LVDd 68mm",r:"胸部, 両下肢",s:"易疲労, 起坐呼吸, 夜間頻尿, 食欲低下",t:"労作時息切れ→前医で心拡大指摘→心エコーでEF低下→DCM疑い→当院紹介",pe:"頸静脈怒張, III音/IV音, 心尖拍動左方偏位, 両肺底部ラ音, 機能性MR雑音, 下肢浮腫",tests:"心エコー(びまん性壁運動低下, EF, LVDd/Ds), BNP, 12誘導心電図, 胸部X線, 心臓MRI(LGE: 線維化), 冠動脈造影(虚血除外), 遺伝子検査(検討)",probs:"#1 拡張型心筋症 #2 心不全(HFrEF, EF_%) #3 機能性僧帽弁逆流 #4 突然死リスク",course:"GDMT4本柱(ARNI/β遮断薬/MRA/SGLT2i)→ICD/CRT適応評価→心臓リハビリ→重症: LVAD/心臓移植検討→家族スクリーニング",disc:"DCMの原因検索(特発性, 遺伝性, 二次性), GDMT最適化と段階的導入, デバイス治療の適応(ICD一次予防, CRT), 心臓移植の適応",refs:["Bozkurt B. J Am Coll Cardiol 2016;68:2996","Hershberger RE. Nat Rev Cardiol 2021;18:497"]},"肥大型心筋症":{prof:"28歳男性, 健診で心雑音, 家族歴あり(突然死)",cc:"労作時呼吸困難, 失神",o:"健診で心雑音指摘, 〇カ月前に運動中の失神あり",p:"運動・脱水・食後で増悪, 蹲踞で軽減(閉塞性)",q:"LVOT圧較差 50mmHg(安静時), 運動時増悪",r:"胸部",s:"労作時胸痛, 動悸(不整脈), 失神(労作時)",t:"健診異常→前医でHCM診断→失神エピソード→リスク評価目的で当院紹介",pe:"収縮期雑音(左胸骨下縁, Valsalvaで増強, 蹲踞で減弱), IV音, 二峰性脈(bisferiens pulse)",tests:"心エコー(中隔壁厚, LVOT圧較差, SAM, EF), 心臓MRI(LGE: 線維化, 壁厚), 24時間ホルター(NSVT), 運動負荷(血圧反応), 遺伝子検査",probs:"#1 肥大型心筋症(閉塞性/非閉塞性) #2 突然死リスク評価(HCM Risk-SCD) #3 左室流出路閉塞",course:"リスク層別化(HCM Risk-SCD)→薬物療法(β遮断薬, 非DHP系Ca拮抗薬, ジソピラミド)→高リスク: ICD→LVOTO高度: 中隔縮小術(Morrow/PTSMA)/マバカムテン→生活指導(競技スポーツ制限)→家族スクリーニング",disc:"HCMの突然死リスク層別化(HCM Risk-SCDスコア), 閉塞性HCMの治療(薬物→中隔縮小術), マバカムテン(心筋ミオシン阻害薬)の新規治療",refs:["Ommen SR. Circulation 2020;142:e558","Elliott PM. Eur Heart J 2014;35:2733"]},"心筋炎":{prof:"25歳男性, 感冒後",cc:"胸痛, 呼吸困難, 発熱",o:"感冒症状〇日後から胸痛と呼吸困難が出現",p:"吸気で増悪(心膜炎合併時), 安静で改善なし",q:"胸痛NRS 6/10, 発熱38℃, 頻脈",r:"前胸部",s:"動悸, 倦怠感, 呼吸困難(心不全合併時)",t:"感冒→胸痛・呼吸困難出現→前医でトロポニン上昇・壁運動異常→当院搬送",pe:"頻脈, 血圧低下(重症時), III音, 肺湿性ラ音(心不全合併時), 心膜摩擦音(心膜炎合併時)",tests:"心筋トロポニン上昇, BNP, CRP, 12誘導心電図(ST変化, 不整脈), 心エコー(壁運動異常, EF), 心臓MRI(T2高信号, LGE: Lake Louise基準), 心内膜生検(必要時)",probs:"#1 急性心筋炎(ウイルス性疑い) #2 心不全(合併あれば) #3 不整脈リスク",course:"モニタリング(CCU)→支持療法(心不全管理, 不整脈管理)→劇症型: 機械的循環補助(ECMO/Impella)→回復後心臓MRIフォロー→運動制限(3-6カ月)",disc:"心筋炎の診断(心臓MRIのLake Louise基準), 劇症型心筋炎の早期認識と機械的循環補助, 免疫チェックポイント阻害薬関連心筋炎",refs:["Caforio ALP. Eur Heart J 2013;34:2636","Ammirati E. Circulation 2018;138:1088"]},"心膜炎":{prof:"35歳男性, 感冒後",cc:"胸痛(吸気時・臥位で増悪)",o:"感冒〇日後から前胸部痛が出現",p:"吸気・臥位で増悪, 前屈位で軽減",q:"鋭い胸痛, NRS 6/10, 体温37.5℃",r:"前胸部(広範囲), 僧帽筋への放散",s:"発熱, 倦怠感, 呼吸困難(心嚢液貯留あれば)",t:"感冒→胸痛出現→前医受診→心電図でびまん性ST上昇→当院紹介",pe:"心膜摩擦音(3相性: 収縮期+拡張早期+心房収縮期), 発熱, 心タンポナーデ徴候の有無",tests:"12誘導心電図(びまん性ST上昇, PR低下), CRP/ESR, 心筋トロポニン(心筋心膜炎), 心エコー(心嚢液), 胸部X線",probs:"#1 急性心膜炎(ウイルス性/特発性) #2 心嚢液貯留(あれば) #3 心筋心膜炎(トロポニン上昇あれば)",course:"NSAIDs(イブプロフェン)+コルヒチン→2-4週で漸減→再発予防(コルヒチン3-6カ月)→心嚢液増加時ドレナージ→再発時ステロイド検討",disc:"急性心膜炎の診断基準, NSAIDs+コルヒチンの有効性(COPE/ICAP trial), 再発性心膜炎への対応, 特異的原因(結核・悪性腫瘍)の除外",refs:["Adler Y. Eur Heart J 2015;36:2921","Imazio M. N Engl J Med 2013;369:1522"]},"心タンポナーデ":{prof:"60歳男性, 悪性腫瘍, 呼吸困難",cc:"呼吸困難, 血圧低下",o:"〇日前から呼吸困難が急速に進行",p:"座位でやや軽減, 臥位で増悪",q:"BP 85/70mmHg, HR 120/min, 脈圧狭小",r:"胸部全体",s:"頸静脈怒張, 心音減弱, 血圧低下(Beck三徴)",t:"悪性腫瘍治療中→呼吸困難増悪→前医で心嚢液貯留→血圧低下→当院搬送",pe:"Beck三徴(低血圧, 頸静脈怒張, 心音減弱), 奇脈(>10mmHg), 頻脈, Kussmaul sign",tests:"心エコー(心嚢液, 右房・右室の拡張期虚脱, IVC拡張, 呼吸性変動), 12誘導心電図(低電位, 電気的交互脈), 胸部X線(心拡大)",probs:"#1 心タンポナーデ #2 心嚢液貯留(悪性/炎症性/外傷性) #3 原疾患(悪性腫瘍)",course:"緊急心嚢穿刺(エコーガイド下)→輸液(前負荷維持)→心嚢液分析(細胞診, 培養)→原因治療→再貯留予防(心膜開窓術検討)",disc:"心タンポナーデの病態生理(圧-容積関係), 心エコーによる血行動態評価, 心嚢穿刺の手技とリスク, 原因検索の重要性",refs:["Adler Y. Eur Heart J 2015;36:2921","Ristić AD. Eur Heart J 2014;35:895"]},"たこつぼ症候群":{prof:"70歳女性, 精神的ストレス後",cc:"胸痛, 呼吸困難",o:"家族の不幸(精神的ストレス)直後に突然の胸痛",p:"持続性, ニトログリセリンで改善なし",q:"圧迫感, NRS 7/10, STEMI様の症状",r:"前胸部",s:"呼吸困難, 冷汗, 嘔気",t:"精神的ストレス→胸痛→前医でST上昇→STEMI疑い→緊急CAG→冠動脈有意狭窄なし→たこつぼ疑い",pe:"バイタル(血圧低下あれば), III音(心不全合併時), 肺ラ音, 心尖部壁運動異常",tests:"12誘導心電図(ST上昇→T波陰転→QT延長), 心筋トロポニン(軽度上昇), 冠動脈造影(有意狭窄なし), 左室造影(心尖部バルーニング), 心エコー(心尖部無収縮, 基部過収縮), 心臓MRI",probs:"#1 たこつぼ症候群(InterTAK分類) #2 急性心不全(合併あれば) #3 精神的ストレス",course:"支持療法(心不全管理, 不整脈モニタリング)→LVOTO合併時: カテコラミン避ける→1-3カ月でLV機能回復確認→再発予防(ストレスマネジメント)→外来フォロー",disc:"たこつぼ症候群の診断基準(InterTAK), STEMIとの鑑別, 合併症(心不全, LVOTO, 不整脈, 心破裂), カテコラミン過剰仮説",refs:["Ghadri JR. Eur Heart J 2018;39:2032","Templin C. N Engl J Med 2015;373:929"]}},"g21":{"大動脈解離":{prof:"60歳男性, 高血圧(未治療)",cc:"突然の胸背部痛",o:"〇月〇日, 突然の激烈な胸背部痛(引き裂かれるような)",p:"体動で増悪, 安静でも持続, 鎮痛薬で改善不十分",q:"激痛, NRS 10/10, 引き裂かれるような・移動する痛み",r:"前胸部→背部→腰部(解離進展に伴い移動)",s:"冷汗, 血圧左右差, 意識障害(灌流障害時)",t:"突然発症→激痛持続→救急搬送",pe:"血圧左右差(>20mmHg), 脈拍左右差, 大動脈弁逆流雑音(A型), 神経学的所見, 下肢虚血所見",tests:"造影CT(偽腔, エントリー, 解離範囲), 心エコー(AR, 心嚢液), D-ダイマー, 血液ガス, 腎機能",probs:"#1 急性大動脈解離(Stanford A型/B型) #2 高血圧症(未治療) #3 灌流障害(臓器虚血の有無)",course:"A型: 緊急手術(上行大動脈置換)→ICU管理→リハビリ. B型: 保存的治療(降圧, 鎮痛)→合併症あればTEVAR→長期降圧管理→CT定期フォロー",disc:"Stanford分類と治療戦略の違い, A型の緊急手術適応, B型の合併症(灌流障害, 破裂, 拡大)とTEVARの適応, 長期的なCTサーベイランス",refs:["Erbel R. Eur Heart J 2014;35:2873","JCS 2020 大動脈瘤・大動脈解離診療ガイドライン"]},"大動脈瘤":{prof:"72歳男性, 高血圧, 喫煙歴, CT偶発発見",cc:"無症状(CT偶発発見)",o:"他疾患のCTで腹部大動脈瘤を偶然発見",p:"無症状",q:"腹部大動脈径 50mm",r:"腹部(腎動脈下)",s:"無症状. 腰背部痛(切迫破裂の場合)",t:"CT偶発発見→精査目的で当院紹介",pe:"腹部拍動性腫瘤の触知, 血管雑音, 末梢動脈触知",tests:"造影CT(瘤径, 形態, 部位, 腸骨動脈), 腹部エコー(スクリーニング・経過観察用), 心機能評価(術前)",probs:"#1 腹部大動脈瘤(最大径_mm) #2 破裂リスク評価 #3 高血圧症 #4 動脈硬化リスク因子",course:"小径(<55mm男性/<50mm女性): 経過観察(6-12カ月毎CT)→拡大速度>10mm/年or閾値超え: 待機的修復(EVAR or 開腹手術)→術後CT定期フォロー",disc:"大動脈瘤の破裂リスク(径と年間破裂率), 手術適応(径・拡大速度・形態), EVAR vs 開腹手術の長期成績, 禁煙・降圧の重要性",refs:["Chaikof EL. J Vasc Surg 2018;67:2","JCS 2020 大動脈瘤・大動脈解離診療ガイドライン"]},"閉塞性動脈硬化症":{prof:"68歳男性, 糖尿病・喫煙歴",cc:"間歇性跛行",o:"〇カ月前から歩行時の下肢痛(跛行距離200m)",p:"歩行で誘発, 立ち止まり数分で軽減",q:"下肢痛NRS 5/10, 跛行距離200m, Fontaine II度",r:"右腓腹部(閉塞部位の末梢)",s:"下肢冷感, しびれ, 重症時: 安静時疼痛, 潰瘍",t:"歩行時下肢痛→前医でABI低値→当院紹介",pe:"足背動脈・後脛骨動脈触知減弱/消失, ABI<0.9, 下肢皮膚色調変化, 毛細血管再充満時間延長, 潰瘍の有無",tests:"ABI, 下肢血管エコー, 造影CT/MRA(狭窄・閉塞部位), 血管機能検査(SPP, TcPO2: CLI評価時), 冠動脈・頸動脈評価(polyvascular disease)",probs:"#1 閉塞性動脈硬化症(Fontaine_度) #2 動脈硬化リスク因子(DM, 喫煙) #3 多血管疾患リスク",course:"生活指導(禁煙, 運動療法)→抗血小板薬→血管拡張薬→血行再建(EVT/バイパス: Fontaine III-IV or 保存的治療抵抗性)→フットケア",disc:"PADの重症度評価(Fontaine/Rutherford分類), ABI測定の重要性, 運動療法のエビデンス, CLI(重症下肢虚血)の管理, polyvascular disease",refs:["Gerhard-Herman MD. Circulation 2017;135:e686","Aboyans V. Eur Heart J 2018;39:763"]},"深部静脈血栓症":{prof:"45歳女性, 長期臥床後(術後)",cc:"左下肢腫脹, 疼痛",o:"腹部手術〇日後に左下肢の腫脹と疼痛が出現",p:"下肢挙上で軽減, 荷重で増悪",q:"左下肢の有痛性腫脹, 周径左右差3cm",r:"左下肢全体(腸骨-大腿-膝窩静脈)",s:"下肢熱感, 発赤, Homans sign陽性",t:"術後臥床→左下肢腫脹→DVT疑い→下肢エコー施行",pe:"左下肢腫脹・圧痛, 周径左右差, Homans sign, 皮膚色調変化(発赤), 表在静脈怒張",tests:"下肢静脈エコー(圧迫法), D-ダイマー, Wellsスコア, 造影CT(PE合併評価), 凝固系(プロテインC/S, アンチトロンビン: 若年・反復時)",probs:"#1 深部静脈血栓症(中枢型) #2 肺塞栓症リスク #3 術後状態 #4 凝固異常(あれば)",course:"抗凝固療法(ヘパリン→DOAC)→弾性ストッキング→PE合併: 追加治療→抗凝固期間決定(誘因の有無で3カ月 vs 延長)→再発予防",disc:"DVTの診断アルゴリズム(Wellsスコア+D-ダイマー), 抗凝固療法の薬剤選択と期間, PE合併の評価, 血栓性素因のスクリーニング適応",refs:["Konstantinides SV. Eur Heart J 2020;41:543","Kearon C. Chest 2016;149:315"]},"肺塞栓症":{prof:"55歳女性, DVT後, 突然の呼吸困難",cc:"突然の呼吸困難, 胸痛",o:"〇月〇日, 安静時に突然の呼吸困難と胸痛",p:"安静でも持続, 深呼吸で胸痛増悪",q:"SpO2 88%, HR 120/min, 胸膜痛",r:"胸部(胸膜痛), 右下肢(DVT)",s:"頻呼吸, 頻脈, 冷汗, 失神(大量PE), 喀血(肺梗塞)",t:"DVT治療中→突然呼吸困難→SpO2低下→救急搬送",pe:"頻呼吸, 頻脈, SpO2低下, 頸静脈怒張(右心負荷), II音P成分亢進, 下肢腫脹(DVT), 血圧低下(広範型)",tests:"造影CT(肺動脈内血栓), 心エコー(右室拡大, 右室壁運動異常, McConnell sign), D-ダイマー, 血液ガス, BNP, 心筋トロポニン, 下肢エコー",probs:"#1 急性肺塞栓症(広範型/亜広範型/非広範型, sPESIスコア_) #2 深部静脈血栓症 #3 右心不全(あれば)",course:"広範型(ショック): 血栓溶解療法(t-PA)→抗凝固→カテーテル治療/外科的血栓摘除. 非広範型: 抗凝固療法(ヘパリン→DOAC)→亜広範型: 増悪時rescue溶解療法→抗凝固期間決定",disc:"PEの重症度分類とリスク層別化(sPESI, 右心機能, トロポニン), 血栓溶解療法の適応, DOAC時代の治療戦略, CTEPH(慢性血栓塞栓性肺高血圧症)への注意",refs:["Konstantinides SV. Eur Heart J 2020;41:543","JCS 2017 肺血栓塞栓症および深部静脈血栓症の診断・治療・予防に関するガイドライン"]},"高血圧緊急症":{prof:"55歳男性, 高血圧(未治療・怠薬)",cc:"頭痛, 視力障害, 呼吸困難",o:"〇日前から頭痛, 本日視力障害と呼吸困難が出現",p:"安静でも改善なし",q:"BP 240/140mmHg, 臓器障害あり",r:"頭部, 胸部, 眼",s:"頭痛, 悪心・嘔吐, 視力障害, 意識障害, 呼吸困難, 乏尿",t:"降圧薬自己中断→血圧上昇→頭痛→視力障害→救急搬送",pe:"著明な高血圧, 眼底(Keith-Wagener III-IV, 乳頭浮腫, 出血, 白斑), 肺湿性ラ音(心不全), 意識レベル, 神経学的所見",tests:"血圧(両上肢), 眼底検査, 腎機能(AKI), 尿検査(蛋白尿, 血尿), 血算(MAHA), LDH, 心エコー, 頭部CT/MRI(PRES除外), 胸部X線",probs:"#1 高血圧緊急症(標的臓器障害: 脳/心/腎/眼) #2 悪性高血圧(あれば) #3 降圧薬怠薬",course:"ICU管理→静注降圧薬(ニカルジピン等)→最初の1時間で平均血圧の25%降下→24-48hかけて段階的降圧→経口薬移行→原因検索(二次性高血圧除外)→服薬アドヒアランス改善",disc:"高血圧緊急症 vs 切迫症の鑑別, 降圧速度の目標(急激な降圧の危険性), 標的臓器障害別の降圧薬選択, 二次性高血圧のスクリーニング",refs:["Whelton PK. J Am Coll Cardiol 2018;71:e127","van den Born BH. J Hypertens 2019;37:1657"]}},"g22":{"成人先天性心疾患":{prof:"30歳女性, 心房中隔欠損(ASD), 労作時息切れ",cc:"労作時呼吸困難, 動悸",o:"〇年前から労作時の息切れ, 最近増悪",p:"労作で増悪, 安静で軽減",q:"NYHA II, 動悸(AF発症)",r:"胸部",s:"動悸(心房細動), 反復性肺感染, 易疲労",t:"小児期に心雑音指摘→経過観察→労作時息切れ増悪+AF→当院紹介",pe:"II音固定性分裂, 肺動脈領域収縮期雑音(相対的PS), 右室拍動(胸骨左縁)",tests:"心エコー(ASD部位・サイズ, Qp/Qs, 右室拡大, 推定RVSP), 経食道心エコー, 心臓MRI(シャント量定量), 心臓カテーテル(PVR)",probs:"#1 心房中隔欠損症(二次孔型, Qp/Qs_) #2 右室容量負荷 #3 心房細動(合併あれば) #4 肺高血圧(あれば)",course:"右室容量負荷あり(Qp/Qs>1.5)→カテーテル閉鎖(Amplatzer)/外科的閉鎖→肺高血圧合併: PVR評価→Eisenmenger: 閉鎖禁忌→肺血管拡張薬",disc:"成人先天性心疾患(ACHD)の増加と専門管理の重要性, ASD閉鎖の適応とタイミング, Eisenmenger症候群への注意, 妊娠管理",refs:["Stout KK. Circulation 2019;139:e698","Baumgartner H. Eur Heart J 2021;42:563"]},"心臓腫瘍（粘液腫）":{prof:"50歳女性, 心エコー偶発発見",cc:"発熱, 体重減少, めまい",o:"〇カ月前から倦怠感・微熱, 先日めまいエピソード",p:"体位変動で症状変動(腫瘍が弁口を閉塞)",q:"間欠的なめまい・失神, 体位依存性",r:"全身(塞栓症), 胸部(弁閉塞)",s:"塞栓症状(脳梗塞, 末梢塞栓), 発熱, 体重減少, 関節痛(全身症状)",t:"倦怠感・微熱→前医で検査→心エコーで左房内腫瘤発見→当院紹介",pe:"体位で変動する拡張期雑音(tumor plop), 末梢塞栓の所見, 発熱",tests:"心エコー(TTE/TEE: 腫瘤の部位・大きさ・付着部・可動性), 心臓MRI, CT(塞栓評価), 血算, CRP/ESR, IL-6, 免疫グロブリン",probs:"#1 心臓腫瘍(左房粘液腫疑い) #2 塞栓症リスク #3 全身炎症症状",course:"外科的腫瘍摘出(緊急/準緊急)→病理確認(粘液腫)→術後心エコーフォロー(再発監視)→Carney complex除外(若年・多発・再発例)",disc:"心臓腫瘍の分類(良性vs悪性), 粘液腫の3徴(塞栓・弁閉塞・全身症状), Carney complexの概念, 手術の緊急度",refs:["Butany J. Can J Cardiol 2005;21:675","Reynen K. N Engl J Med 1995;333:1610"]},"心臓サルコイドーシス":{prof:"45歳女性, 肺サルコイドーシス既知, 動悸",cc:"動悸, 失神, 労作時息切れ",o:"肺サルコイドーシス経過観察中, 〇カ月前から動悸と息切れ",p:"労作で増悪",q:"NYHA II, 完全房室ブロック or VT",r:"胸部",s:"失神(AVBやVT), 浮腫(心不全進行時)",t:"肺サルコイドーシス→動悸・失神→前医で心電図異常→当院紹介",pe:"徐脈(AVB)または頻脈(VT), 心不全徴候, リンパ節腫脹, 皮膚所見(結節性紅斑), 眼所見(ぶどう膜炎)",tests:"12誘導心電図(AVB, 脚ブロック, 異常Q波), 心エコー(壁運動異常, 心室中隔菲薄化, EF低下), 心臓MRI(LGE), FDG-PET(活動性炎症), Gaシンチ, 心内膜生検, ACE, sIL-2R",probs:"#1 心臓サルコイドーシス #2 房室ブロック/心室性不整脈 #3 心不全(HFrEF) #4 肺サルコイドーシス",course:"ステロイド(活動性あり)→ペースメーカー(AVB)→ICD(VT/突然死リスク)→心不全治療(GDMT)→免疫抑制薬(ステロイド節約)→FDG-PETフォロー",disc:"心臓サルコイドーシスの診断基準(JCS/JSCMR), FDG-PETによる活動性評価, ステロイドの適応と効果, デバイス治療(PM/ICD)の適応",refs:["Birnie DH. J Am Coll Cardiol 2016;68:411","Terasaki F. J Cardiol 2019;74:1"]}},"g23":{"バセドウ病":{prof:"30代女性, 動悸・体重減少",cc:"動悸, 体重減少, 手指振戦",o:"〇カ月前から動悸と体重減少",p:"安静時にも動悸持続",q:"3カ月で5kg体重減少, 頻脈",r:"全身症状",s:"発汗過多, 易疲労, 下痢, 手指振戦, 眼球突出",t:"動悸・体重減少→前医で甲状腺機能検査→TSH低値・FT4高値→当院紹介",pe:"甲状腺腫大(びまん性, 血管雑音), 眼球突出, 手指振戦, 頻脈",tests:"TSH, FT3, FT4, TRAb, TPOAb, 甲状腺エコー(血流増加), 心電図",probs:"#1 バセドウ病 #2 甲状腺中毒症 #3 頻脈性不整脈(あれば)",course:"ATD開始(MMI or PTU)→甲状腺機能モニタリング→副作用チェック→寛解判定→長期フォロー",disc:"バセドウ病の3治療選択肢(ATD・RI・手術), TRAbと寛解予測, 甲状腺クリーゼの予防",refs:["Smith TJ. N Engl J Med 2016;375:1552","Ross DS. Thyroid 2016;26:1343"]},"橋本病":{prof:"45歳女性, 倦怠感, 体重増加",cc:"倦怠感, 体重増加, 寒がり",o:"〇カ月前から倦怠感と体重増加(3kg)",p:"安静でも倦怠感持続, 活動で増悪",q:"TSH 25 μIU/mL, FT4 0.5 ng/dL",r:"全身症状",s:"寒がり, 便秘, 皮膚乾燥, 脱毛, 月経過多, 嗄声, 浮腫",t:"倦怠感→前医で甲状腺機能検査→TSH高値・FT4低値→当院紹介",pe:"甲状腺腫大(びまん性, 硬, 表面不整), 非圧痕性浮腫(粘液水腫), 皮膚乾燥, 徐脈, 腱反射弛緩相延長(Woltman sign)",tests:"TSH, FT3, FT4, 抗TPO抗体, 抗Tg抗体, 甲状腺エコー(びまん性腫大, 低エコー), 脂質(高コレステロール), CK",probs:"#1 橋本病(慢性甲状腺炎) #2 甲状腺機能低下症 #3 脂質異常症(二次性)",course:"レボチロキシン(L-T4)補充→少量から開始(高齢者・心疾患合併)→TSH正常化を目標に漸増→定期的TSHフォロー",disc:"橋本病の自然経過(甲状腺機能正常→潜在性低下→顕性低下), L-T4補充の開始基準と目標, 潜在性甲状腺機能低下症の治療適応",refs:["Chaker L. Lancet 2017;390:1550","日本甲状腺学会ガイドライン 2021"]},"甲状腺癌":{prof:"40歳女性, 頸部腫瘤",cc:"前頸部のしこり",o:"〇カ月前に前頸部のしこりに気付く",p:"増大傾向, 痛みなし",q:"甲状腺結節 2cm, 硬, 可動性やや不良",r:"前頸部(甲状腺)",s:"嗄声(反回神経浸潤時), 嚥下障害(まれ), 頸部リンパ節腫脹",t:"自己触知→前医でエコー→結節性病変→FNA施行→悪性疑い→当院紹介",pe:"甲状腺結節(硬, 表面不整, 可動性低下), 頸部リンパ節腫脹, 気管偏位の有無, 嗄声(反回神経麻痺)",tests:"甲状腺エコー(結節の性状, TI-RADS), 穿刺吸引細胞診(FNA, Bethesda分類), 甲状腺機能(TSH, FT4), サイログロブリン, CT(浸潤・転移評価), カルシトニン(髄様癌疑い時)",probs:"#1 甲状腺癌(乳頭癌/濾胞癌/髄様癌/未分化癌) #2 頸部リンパ節転移(あれば) #3 甲状腺結節",course:"乳頭癌/濾胞癌: 甲状腺全摘(+リンパ節郭清)→RAI(放射性ヨウ素)治療→TSH抑制療法→サイログロブリンモニタリング→長期フォロー",disc:"甲状腺癌の組織型と予後(乳頭癌の良好な予後 vs 未分化癌の不良予後), FNAのBethesda分類と手術適応, RAI治療の適応, 分子標的薬(進行例)",refs:["Haugen BR. Thyroid 2016;26:1","日本甲状腺学会. 甲状腺腫瘍診療ガイドライン 2018"]},"亜急性甲状腺炎":{prof:"40代女性, 上気道感染後, 前頸部痛",cc:"前頸部痛, 発熱",o:"上気道感染〇週間後から前頸部の痛みと発熱",p:"嚥下・頸部伸展で増悪, 鎮痛薬で軽減",q:"有痛性甲状腺腫大, 体温38℃, ESR著明上昇",r:"前頸部(甲状腺, 痛みが移動することあり)",s:"発熱, 倦怠感, 動悸(破壊性甲状腺中毒症), 発汗",t:"上気道感染→前頸部痛→前医で甲状腺中毒症+ESR上昇→当院紹介",pe:"甲状腺の有痛性腫大(圧痛著明), 硬, 発熱, 頻脈(甲状腺中毒症期)",tests:"TSH, FT3, FT4(中毒症期: TSH↓FT4↑), ESR著明上昇, CRP上昇, WBC正常〜軽度上昇, 甲状腺エコー(低エコー域), Tc/I-123シンチ(取り込み低下)",probs:"#1 亜急性甲状腺炎(破壊性甲状腺中毒症期) #2 前頸部痛 #3 バセドウ病との鑑別",course:"軽症: NSAIDs→重症/NSAIDs無効: ステロイド(PSL 15-30mg)→漸減→一過性甲状腺機能低下期(L-T4補充)→回復→フォロー(再燃注意)",disc:"亜急性甲状腺炎の三相性経過(中毒症→低下症→回復), バセドウ病との鑑別(シンチ取り込み低下がキー), ステロイドの使用と漸減法",refs:["Nishihara E. Thyroid 2008;18:1063","Ross DS. Thyroid 2016;26:1343"]},"甲状腺クリーゼ":{prof:"35歳女性, バセドウ病(治療中断), 感染契機",cc:"高熱, 頻脈, 意識障害",o:"ATD中断後〇週間, 感染症を契機に急激に増悪",p:"急速に進行, 改善なし",q:"体温40℃, HR 160/min, 意識混濁, Burch-Wartofsky score>45",r:"全身(多臓器)",s:"高熱, 著明な頻脈, 発汗, 興奮→意識障害, 嘔吐・下痢, 黄疸, 心不全",t:"バセドウ病ATD中断→感染症→高熱・頻脈・意識障害→救急搬送",pe:"高熱, 著明な頻脈(AF合併多い), 発汗, 甲状腺腫大, 眼球突出, 意識障害, 振戦, 心不全徴候, 黄疸",tests:"TSH, FT3, FT4(著明上昇), 血算, 肝機能, 腎機能, 血糖, 電解質, 血液ガス, 血液培養(感染症精査), 心電図(AF, ST変化)",probs:"#1 甲状腺クリーゼ(Burch-Wartofsky score_) #2 バセドウ病(治療中断) #3 誘因(感染症) #4 多臓器不全",course:"ICU管理→ATD大量(MMI or PTU)→無機ヨウ素(ATD投与1h後)→β遮断薬(ランジオロール)→副腎皮質ステロイド→体温管理→誘因治療→全身管理",disc:"甲状腺クリーゼの診断基準(Burch-Wartofsky/日本基準), 治療の4本柱(ATD+ヨウ素+β遮断薬+ステロイド), 誘因の検索と除去, 死亡率と早期介入の重要性",refs:["Akamizu T. Thyroid 2012;22:661","Ross DS. Thyroid 2016;26:1343"]},"粘液水腫昏睡":{prof:"75歳女性, 甲状腺機能低下症(未治療), 冬季",cc:"意識障害, 低体温",o:"〇日前から反応低下, 本日ほぼ昏睡状態で発見",p:"寒冷環境, 感染症が誘因",q:"GCS E1V2M4, 体温32℃, HR 45/min, BP 80/50mmHg",r:"全身(多臓器不全)",s:"低体温, 徐脈, 低血圧, 低換気, 低血糖, 非圧痕性浮腫, 便秘",t:"甲状腺機能低下症未治療→冬季→感染症契機→意識障害→救急搬送",pe:"低体温, 徐脈, 低血圧, 非圧痕性浮腫(粘液水腫), 遅延性腱反射, 低換気, 腸蠕動音減弱",tests:"TSH著明上昇, FT4著明低下, 血液ガス(CO2貯留), 電解質(低Na), 血糖, コルチゾール(副腎不全合併除外), CK, 心電図(徐脈, QT延長), 感染症精査",probs:"#1 粘液水腫昏睡 #2 甲状腺機能低下症(重症) #3 低体温症 #4 副腎不全合併(あれば)",course:"ICU管理→L-T4静注(経口不可時)→副腎皮質ステロイド(コルチゾール測定前に投与開始)→復温(積極的加温は避ける)→呼吸管理→誘因治療→全身管理",disc:"粘液水腫昏睡の診断と死亡率の高さ, L-T4投与法(静注vs経管), 副腎不全合併の評価(ステロイド先行投与の理由), 復温の注意点",refs:["Jonklaas J. Thyroid 2014;24:1670","Wall CR. Thyroid 2000;10:871"]}},"g24":{"原発性アルドステロン症":{prof:"50歳男性, 治療抵抗性高血圧, 低K血症",cc:"高血圧, 筋力低下",o:"〇年前から治療抵抗性高血圧, 低K血症を指摘",p:"3剤以上の降圧薬で血圧コントロール不良",q:"BP 170/100mmHg(3剤内服下), K 2.8 mEq/L",r:"全身(高血圧合併症)",s:"筋力低下, 筋痙攣, 多尿, 口渇",t:"治療抵抗性高血圧→低K血症→前医でPA疑い→当院紹介",pe:"血圧高値, 特異的身体所見に乏しい(クッシング徴候なし)",tests:"PAC/PRA比(ARR>200, PAC>120), 機能確認試験(カプトプリル/生食負荷/フロセミド立位), 副腎CT, 副腎静脈サンプリング(AVS: 片側性vs両側性)",probs:"#1 原発性アルドステロン症 #2 治療抵抗性高血圧 #3 低K血症 #4 高血圧性臓器障害",course:"スクリーニング(ARR)→機能確認試験→副腎CT→AVS→片側性: 腹腔鏡下副腎摘出→両側性: MRA(スピロノラクトン/エプレレノン)→血圧・K管理",disc:"PAの診断フローチャート(スクリーニング→確認→局在), AVSの意義(CTでは不十分), 手術 vs 薬物治療の適応, PA特異的心血管リスク",refs:["Funder JW. J Clin Endocrinol Metab 2016;101:1889","日本内分泌学会. PA診療ガイドライン 2021"]},"クッシング症候群":{prof:"40歳女性, 中心性肥満, 月経不順",cc:"体重増加, 満月様顔貌, 皮膚線条",o:"〇年前から中心性肥満が進行, 満月様顔貌",p:"徐々に進行",q:"体重増加(2年で10kg), 中心性肥満, 赤色皮膚線条",r:"顔面, 体幹, 腹部",s:"月経不順, 多毛, ニキビ, 易出血性(皮下出血), 筋力低下(近位筋), 骨粗鬆症, 抑うつ",t:"体重増加+満月様顔貌→前医でコルチゾール高値→当院紹介",pe:"満月様顔貌, 中心性肥満, 野牛肩(buffalo hump), 赤色皮膚線条(幅>1cm), 近位筋萎縮, 皮膚菲薄化, 多毛",tests:"24時間尿中遊離コルチゾール, 深夜唾液コルチゾール, 1mg DST(デキサメタゾン抑制試験), ACTH, 8mg DST/CRH負荷(鑑別), 副腎CT, 下垂体MRI, IPSS",probs:"#1 クッシング症候群(ACTH依存性/非依存性) #2 副腎腺腫/下垂体腺腫/異所性ACTH #3 合併症(DM, 高血圧, 骨粗鬆症)",course:"原因検索(ACTH依存性→下垂体vs異所性, 非依存性→副腎腫瘍)→手術(経蝶形骨洞手術/副腎摘出)→術後副腎不全管理(ステロイド補充)→合併症治療→長期フォロー",disc:"クッシング症候群の系統的診断フロー(過剰確認→ACTH依存性判定→局在診断), 外因性(医原性)との鑑別, 術後副腎不全の管理, サブクリニカルクッシング",refs:["Nieman LK. J Clin Endocrinol Metab 2015;100:2807","Lacroix A. Lancet 2015;386:913"]},"褐色細胞腫":{prof:"35歳男性, 発作性高血圧, 頭痛, 発汗",cc:"発作性高血圧, 頭痛, 動悸",o:"〇カ月前から発作的な血圧上昇(200/120mmHg)と頭痛",p:"発作的に出現(数分〜数時間), 誘因不明",q:"発作時BP 220/130mmHg, HR 130/min, 発汗著明",r:"頭部, 胸部, 全身",s:"激しい頭痛, 動悸, 著明な発汗(三徴), 顔面蒼白, 不安感, 振戦",t:"発作性高血圧→前医で尿中カテコラミン高値→副腎腫瘤→当院紹介",pe:"発作時: 高血圧, 頻脈, 発汗, 顔面蒼白. 間欠期: 起立性低血圧, BMI低め",tests:"血中遊離メタネフリン分画, 24時間蓄尿(カテコラミン, メタネフリン), 副腎CT/MRI(T2高信号), I-123 MIBG シンチ, 遺伝子検査(MEN2, VHL, SDH)",probs:"#1 褐色細胞腫(副腎/傍神経節) #2 発作性高血圧 #3 遺伝性症候群の可能性(MEN2/VHL/SDH)",course:"α遮断薬先行(フェノキシベンザミン/ドキサゾシン)→β遮断薬追加(α遮断後)→循環血漿量補正→手術(腹腔鏡下副腎摘出)→術後副腎不全確認→遺伝カウンセリング→長期フォロー(再発・悪性化)",disc:"褐色細胞腫の10%ルール(両側・悪性・副腎外・家族性), 術前α/β遮断の順序と重要性, 遺伝子検査の適応(全例推奨), MIBGシンチの臨床的意義",refs:["Lenders JWM. Lancet 2005;366:665","Lenders JWM. J Clin Endocrinol Metab 2014;99:1915"]},"副腎不全（アジソン病）":{prof:"40歳女性, 倦怠感, 体重減少, 色素沈着",cc:"倦怠感, 体重減少, 食欲低下",o:"〇カ月前から倦怠感と食欲低下が進行",p:"ストレス・感染症で増悪, 安静で軽度改善",q:"体重減少(3カ月で5kg), 全身倦怠感著明",r:"全身",s:"色素沈着(口腔内, 手掌線, 瘢痕部), 低血圧, 塩分渇望, 嘔気, めまい",t:"倦怠感+体重減少→前医で色素沈着指摘→コルチゾール低値→当院紹介",pe:"皮膚・粘膜の色素沈着(口腔内, 乳輪, 手掌線, 爪床), 低血圧, 脱水, 体重減少",tests:"早朝コルチゾール(低値), ACTH(原発性: 著明高値), 迅速ACTH負荷試験(コルチゾール反応不良), 電解質(低Na, 高K), 抗21-水酸化酵素抗体, 副腎CT, 他の自己免疫疾患スクリーニング",probs:"#1 原発性副腎不全(アジソン病) #2 副腎皮質機能低下 #3 自己免疫性多腺性症候群(APS)の可能性",course:"ヒドロコルチゾン補充(15-25mg/日, 日内変動に合わせた分割投与)→フルドロコルチゾン(MC補充)→シックデイルール教育(ステロイドカバー)→緊急カード携帯→副腎クリーゼ予防教育",disc:"副腎不全の原因(自己免疫, 結核, 転移, 出血), ACTH負荷試験の解釈, ステロイド補充の実際(シックデイルール), 副腎クリーゼの予防と対応",refs:["Bornstein SR. J Clin Endocrinol Metab 2016;101:364","Husebye ES. Lancet 2021;397:613"]},"副腎偶発腫":{prof:"55歳女性, CT偶発発見",cc:"無症状(CT偶発発見)",o:"腹痛精査のCTで右副腎に腫瘤を偶然発見",p:"無症状",q:"右副腎腫瘤 25mm, 均一, 低吸収値",r:"右副腎",s:"無症状(機能性ホルモン過剰症状なし)",t:"他疾患CTで副腎腫瘤偶発発見→精査目的で当院紹介",pe:"クッシング徴候なし, 高血圧なし, 男性化/女性化徴候なし",tests:"副腎CT(サイズ, HU値: <10HUは腺腫示唆), 機能評価: 1mg DST(サブクリニカルクッシング除外), 血中遊離メタネフリン分画(褐色細胞腫除外), PAC/PRA(高血圧あれば), DHEA-S",probs:"#1 副腎偶発腫(良悪性鑑別要) #2 機能性/非機能性の鑑別",course:"機能評価+画像評価→良性・非機能性・小径(<4cm): 経過観察(6-12カ月CT+機能評価)→悪性疑い(>4cm, 高HU, 増大)/機能性: 手術→長期フォロー",disc:"副腎偶発腫の頻度と鑑別(腺腫, 褐色細胞腫, 副腎皮質癌, 転移), サイズとCT所見による良悪性判定, 全例の機能評価(サブクリニカルクッシング, 褐色細胞腫)の重要性",refs:["Fassnacht M. Eur J Endocrinol 2016;175:G1","Mayo-Smith WW. Radiology 2017;284:920"]}},"g25":{"先端巨大症":{prof:"45歳男性, 顔貌変化, 手足の増大",cc:"手足の増大, 顔貌変化, 頭痛",o:"〇年前から靴・指輪のサイズ増大, 顔貌変化を指摘される",p:"緩徐に進行",q:"GH基礎値高値, IGF-1高値(年齢・性別基準上限超)",r:"手足, 顔面, 全身",s:"頭痛, 視野障害(巨大腺腫), 発汗過多, いびき(舌肥大, SAS), 関節痛, 月経不順(女性), 耐糖能異常",t:"顔貌変化+手足増大→前医でIGF-1高値→下垂体MRIで腺腫→当院紹介",pe:"先端巨大症様顔貌(眉弓突出, 下顎前突, 鼻・口唇肥大), 手足の軟部組織肥大, 巨舌, 発汗, 視野検査(両耳側半盲)",tests:"GH(基礎値), IGF-1, 75g OGTT中GH(抑制不良: nadir>0.4ng/mL), 下垂体MRI(腺腫サイズ・浸潤), 視野検査, 下垂体前葉機能(TSH, LH/FSH, ACTH, PRL), 耐糖能, 大腸内視鏡",probs:"#1 先端巨大症(GH産生下垂体腺腫) #2 下垂体腺腫(マクロ/ミクロ) #3 合併症(DM, 高血圧, SAS, 大腸ポリープ, 心筋症)",course:"経蝶形骨洞手術(TSS)→術後GH/IGF-1評価→残存: 薬物療法(ソマトスタチンアナログ/GH受容体拮抗薬)→放射線治療(3次治療)→合併症管理→長期フォロー",disc:"先端巨大症の診断基準(IGF-1+OGTT), TSSの治癒率(ミクロ腺腫>マクロ腺腫), 薬物治療の選択, 合併症スクリーニング(心血管, 大腸, SAS)",refs:["Katznelson L. J Clin Endocrinol Metab 2014;99:3933","Melmed S. N Engl J Med 2006;355:2558"]},"プロラクチノーマ":{prof:"28歳女性, 無月経, 乳汁漏出",cc:"無月経, 乳汁漏出",o:"〇カ月前から月経停止, 〇カ月前から乳汁漏出",p:"持続性",q:"PRL 250 ng/mL(正常上限の10倍以上), 下垂体腺腫 15mm",r:"乳房, 全身(性腺機能低下)",s:"頭痛, 視野障害(巨大腺腫), 性欲低下, 骨密度低下",t:"無月経→前医でPRL高値→下垂体MRIで腺腫→当院紹介",pe:"乳汁漏出(圧迫で確認), 視野検査(両耳側半盲: 巨大腺腫), 乳房発達, 外性器萎縮の有無",tests:"PRL(高値: 腫瘍サイズと相関), 下垂体MRI(腺腫サイズ), 視野検査, 下垂体前葉機能, 骨密度, 妊娠反応(除外), 薬剤性高PRL血症の除外",probs:"#1 プロラクチノーマ(マクロ/ミクロ) #2 高プロラクチン血症 #3 続発性無月経 #4 骨密度低下",course:"ドパミン作動薬(カベルゴリン第一選択)→PRL正常化・腫瘍縮小確認→月経回復→妊娠希望時: 妊娠前に薬剤調整→手術: 薬剤不耐/抵抗性のみ",disc:"プロラクチノーマの第一選択が薬物治療(手術でない理由), カベルゴリンの有効性と安全性, 巨大腺腫の管理, 薬剤性高PRL血症の除外, hook effectへの注意",refs:["Melmed S. N Engl J Med 2020;382:151","Casanueva FF. Eur J Endocrinol 2006;155:323"]},"下垂体機能低下症":{prof:"50歳男性, 倦怠感, 性機能低下, 下垂体手術後",cc:"倦怠感, 性機能低下, 低血圧",o:"下垂体腫瘍術後〇年, 徐々に倦怠感が進行",p:"ストレスで増悪",q:"コルチゾール低値, TSH低値, LH/FSH低値, GH低値",r:"全身",s:"倦怠感, 低血圧, 低血糖, 寒がり, 性欲低下, 体毛減少, 筋力低下, 精神症状(抑うつ)",t:"下垂体手術後→ホルモン補充中→倦怠感増悪→補充量調整目的で当院紹介",pe:"血圧低下, 皮膚蒼白(ACTH欠損による色素減少=アジソン病と逆), 体毛減少, 筋萎縮, 乳房萎縮(女性)",tests:"下垂体前葉ホルモン(ACTH, TSH, LH/FSH, GH, PRL), 末梢ホルモン(コルチゾール, FT4, テストステロン/エストラジオール, IGF-1), 負荷試験(GHRP-2, CRH, TRH, LH-RH), 下垂体MRI, 抗PIT-1抗体(自己免疫性)",probs:"#1 汎下垂体機能低下症 #2 副腎不全(ACTH欠損) #3 甲状腺機能低下(TSH欠損) #4 性腺機能低下(LH/FSH欠損) #5 成長ホルモン分泌不全",course:"ホルモン補充: ヒドロコルチゾン(ACTH欠損)→L-T4(TSH欠損, コルチゾール補充後!)→性ホルモン補充→GH補充(適応あれば)→シックデイ教育→定期フォロー",disc:"下垂体機能低下症の原因(腫瘍, 手術, 放射線, 自己免疫, Sheehan), ホルモン補充の優先順位(コルチゾール→甲状腺→性→GH), コルチゾール補充前のL-T4開始が危険な理由",refs:["Fleseriu M. J Clin Endocrinol Metab 2016;101:3888","Higham CE. Nat Rev Endocrinol 2016;12:547"]},"尿崩症":{prof:"30歳男性, 口渇, 多飲多尿",cc:"多飲, 多尿, 口渇",o:"〇カ月前から著明な口渇と多尿(1日8-10L)",p:"水分摂取制限で脱水, 夜間も多尿で覚醒",q:"尿量10L/日, 尿比重<1.005, 尿浸透圧<300 mOsm/kg",r:"全身",s:"夜間頻尿, 脱水, 疲労, 高Na血症(水分摂取不十分時)",t:"多飲多尿→前医で尿比重低値→糖尿病否定→尿崩症疑い→当院紹介",pe:"脱水所見(皮膚ツルゴール低下, 口腔乾燥), バイタル, 体重",tests:"尿量, 尿浸透圧, 血漿浸透圧, 血清Na, 血糖(DM除外), 水制限試験→DDAVP負荷(中枢性vs腎性の鑑別), AVP/コペプチン, 下垂体MRI(T1高信号消失, 腫瘤)",probs:"#1 尿崩症(中枢性/腎性) #2 多飲多尿症候群 #3 原因検索(中枢性: 腫瘍/炎症/特発性)",course:"中枢性: DDAVP(デスモプレシン)補充→用量調整(尿量・Na)→原因検索(MRI, IgG4等)→原因治療→定期フォロー. 腎性: 原因治療(リチウム中止等)+サイアザイド+減塩",disc:"尿崩症の鑑別(中枢性vs腎性vs心因性多飲), 水制限試験とDDAVP負荷の解釈, コペプチン測定の有用性, 中枢性尿崩症の原因検索(特に胚細胞腫瘍)",refs:["Christ-Crain M. Nat Rev Dis Primers 2019;5:54","Di Iorgi N. Endocr Rev 2012;33:722"]},"SIADH":{prof:"65歳男性, 肺小細胞癌, 低Na血症",cc:"倦怠感, 嘔気, 意識障害",o:"〇日前から倦怠感と嘔気, 本日意識混濁",p:"水分摂取制限で改善傾向",q:"血清Na 118 mEq/L, 血漿浸透圧 250 mOsm/kg, 尿浸透圧>100 mOsm/kg",r:"全身(低Na血症による)",s:"頭痛, 嘔気, 筋痙攣, 意識障害(重症), 痙攣(重症)",t:"肺小細胞癌治療中→低Na血症指摘→意識混濁→入院",pe:"意識レベル評価, 体液量評価(浮腫なし, 脱水なし=正常循環血漿量), 神経学的所見, 腫瘍関連所見",tests:"血清Na, 血漿浸透圧, 尿浸透圧(>100), 尿中Na(>40), 甲状腺機能, コルチゾール(甲状腺・副腎機能低下除外), 尿酸(低値: SIADH示唆), 胸部CT(原因検索)",probs:"#1 SIADH(低Na血漿低浸透圧性, 正常循環血漿量) #2 低ナトリウム血症(急性/慢性) #3 肺小細胞癌(異所性ADH産生)",course:"軽症: 水分制限(800-1000mL/日)→重症/症候性: 3%NaCl慎重投与(ODS予防: 補正速度<10mEq/24h)→原因治療(腫瘍治療)→トルバプタン検討→長期管理",disc:"SIADHの診断基準(除外診断の重要性), 低Na血症の補正速度とODS(浸透圧性脱髄症候群)のリスク, トルバプタンの位置付け, 原因検索(薬剤, 肺疾患, CNS, 悪性腫瘍)",refs:["Verbalis JG. Am J Med 2007;120:S1","Ellison DH. N Engl J Med 2007;356:2064"]},"クッシング病":{prof:"35歳女性, 中心性肥満, 満月様顔貌",cc:"体重増加, 満月様顔貌, 月経不順",o:"〇年前から中心性肥満, 赤色皮膚線条が出現",p:"徐々に進行",q:"コルチゾール高値, ACTH高値(不適切高値), 下垂体腺腫",r:"顔面, 体幹, 腹部",s:"満月様顔貌, 赤色皮膚線条, 近位筋力低下, 易出血性, 多毛, 抑うつ, DM, 高血圧, 骨粗鬆症",t:"中心性肥満+満月様顔貌→前医でクッシング症候群確定→ACTH高値→下垂体MRIで微小腺腫→当院紹介",pe:"満月様顔貌, 中心性肥満, 野牛肩, 赤色皮膚線条, 近位筋萎縮, 皮膚菲薄化",tests:"24時間尿中コルチゾール, 深夜唾液コルチゾール, 1mg/8mg DST, ACTH, CRH負荷試験, 下垂体MRI, IPSS(下錐体静脈洞サンプリング: 下垂体vs異所性ACTH鑑別)",probs:"#1 クッシング病(ACTH産生下垂体腺腫) #2 コルチゾール過剰 #3 合併症(DM, 高血圧, 骨粗鬆症, 精神症状)",course:"経蝶形骨洞手術(TSS)→術後コルチゾール評価→寛解: 副腎不全期のステロイド補充→非寛解: 再手術/放射線/薬物(パシレオチド等)/両側副腎摘出→合併症管理",disc:"クッシング病の診断(クッシング症候群→ACTH依存性確認→下垂体由来確認), IPSSの役割, TSS後の寛解判定, Nelson症候群(両側副腎摘出後)のリスク",refs:["Nieman LK. J Clin Endocrinol Metab 2015;100:2807","Pivonello R. Lancet 2015;386:913"]}},"g26":{"原発性副甲状腺機能亢進症":{prof:"55歳女性, 高Ca血症(検診指摘)",cc:"無症状(検診で高Ca血症)",o:"検診で血清Ca高値を偶然指摘",p:"無症状(あるいは非特異的症状: 倦怠感, 便秘)",q:"血清Ca 11.5 mg/dL, intact PTH 120 pg/mL(不適切高値)",r:"全身",s:"倦怠感, 便秘, 口渇, 多尿, 腎結石(既往), 骨痛(進行時)",t:"検診高Ca→前医でPTH高値→PHPT疑い→当院紹介",pe:"特異的身体所見に乏しい, 脱水所見の有無, 腎結石関連症状",tests:"血清Ca(補正Ca), intact PTH, P(低値), 25(OH)VD, 腎機能, 尿中Ca, 骨密度(DXA: 橈骨遠位1/3含む), 腹部画像(腎結石), 頸部エコー, 99mTc-MIBIシンチ(局在診断)",probs:"#1 原発性副甲状腺機能亢進症 #2 高カルシウム血症 #3 骨密度低下 #4 腎結石(あれば)",course:"手術適応評価→適応あり: 副甲状腺摘出術(MIP/両側頸部郭清)→適応なし: 経過観察(Ca, 骨密度, 腎機能)→薬物(シナカルセト: 手術不適例)→術後低Ca管理(hungry bone syndrome)",disc:"PHPTの手術適応(NIH 2014基準: Ca>1.0基準超, 骨密度T<-2.5, 腎結石, eGFR<60, 年齢<50), 無症候性PHPTの管理, MIBIシンチの局在診断",refs:["Wilhelm SM. JAMA Surg 2016;151:959","Bilezikian JP. J Clin Endocrinol Metab 2014;99:3595"]},"副甲状腺機能低下症":{prof:"50歳女性, 甲状腺全摘後",cc:"手指しびれ, テタニー",o:"甲状腺全摘術〇日後から手指のしびれと筋痙攣",p:"過換気で増悪",q:"血清Ca 6.8 mg/dL, 低PTH",r:"手指, 口周囲, 全身(テタニー)",s:"手指しびれ, 口周囲のしびれ, 筋痙攣(テタニー), 痙攣(重症時)",t:"甲状腺全摘→術後低Ca→テタニー出現→Ca補充開始",pe:"Chvostek sign(顔面神経叩打で顔面筋攣縮), Trousseau sign(血圧計駆血で助産師手), テタニー, Erb sign(神経の電気刺激閾値低下)",tests:"血清Ca(低値), intact PTH(低値/測定感度以下), P(高値), Mg, 25(OH)VD, 尿中Ca, 心電図(QT延長), 頭部CT(大脳基底核石灰化: 慢性例)",probs:"#1 副甲状腺機能低下症(術後性) #2 低カルシウム血症 #3 テタニー",course:"急性期: グルコン酸Ca静注→活性型VD(アルファカルシドール/カルシトリオール)+Ca経口→血清Ca 8.0-8.5目標(尿路結石予防のため正常上限を目指さない)→PTH補充(テリパラチド: 難治例)→定期フォロー",disc:"術後性副甲状腺機能低下症の予防と管理, テタニーの病態生理(イオン化Caと神経筋興奮性), 長期管理の目標値(高Ca尿症・腎石灰化の回避), 特発性・自己免疫性の鑑別",refs:["Bollerslev J. Eur J Endocrinol 2015;173:G1","Brandi ML. J Clin Endocrinol Metab 2016;101:2273"]},"高カルシウム血症":{prof:"65歳男性, 肺癌, 倦怠感",cc:"倦怠感, 嘔気, 意識障害",o:"〇日前から倦怠感と嘔気が増悪, 本日意識混濁",p:"経口摂取不良で増悪(脱水)",q:"補正Ca 14.5 mg/dL, 意識レベル低下",r:"全身",s:"口渇, 多尿, 便秘, 嘔気・嘔吐, 意識障害, 腹痛",t:"肺癌治療中→倦怠感・嘔気→血清Ca著明高値→意識混濁→入院",pe:"脱水所見, 意識レベル評価, バイタル, 腹部診察(イレウス所見)",tests:"補正Ca(Alb), intact PTH, PTHrP, 25(OH)VD, 1,25(OH)2VD, P, 腎機能, 心電図(QT短縮), 骨転移評価(骨シンチ/CT), 蛋白電気泳動(MM除外)",probs:"#1 高Ca血症(悪性腫瘍関連: HHM/骨転移) #2 脱水 #3 肺癌 #4 意識障害",course:"生理食塩水大量輸液→ビスホスホネート(ゾレドロン酸)orデノスマブ→カルシトニン(即効性)→原疾患治療(化学療法等)→透析(難治性)→フォロー",disc:"高Ca血症の鑑別(悪性腫瘍: HHM/骨転移, PHPT, サルコイドーシス, VD中毒, MM), 高Ca血症クリーゼの管理, ビスホスホネートvsデノスマブ",refs:["Rosner MH. Clin J Am Soc Nephrol 2012;7:1722","Minisola S. BMJ 2015;350:h2723"]},"低カルシウム血症":{prof:"45歳女性, ビタミンD欠乏, 骨軟化症",cc:"筋痙攣, しびれ, 骨痛",o:"〇カ月前から下肢の痛みと筋痙攣",p:"歩行で骨痛増悪, 安静で軽減",q:"血清Ca 7.2 mg/dL, 25(OH)VD 8 ng/mL, ALP上昇",r:"四肢, 腰背部(骨痛)",s:"筋痙攣, 手指しびれ, 骨痛, 筋力低下(近位筋), 疲労",t:"骨痛・筋力低下→前医で低Ca・VD欠乏→骨軟化症疑い→当院紹介",pe:"Chvostek sign, Trousseau sign, 近位筋力低下, 骨圧痛, 歩容異常(あひる歩行)",tests:"血清Ca, P(低値: VD欠乏), Mg, ALP(上昇), intact PTH(二次性副甲状腺機能亢進), 25(OH)VD(低値), 1,25(OH)2VD, 腎機能, 尿中Ca, 骨密度, X線(Looser zone)",probs:"#1 低Ca血症(ビタミンD欠乏性) #2 骨軟化症 #3 二次性副甲状腺機能亢進症",course:"ビタミンD補充(天然型VD: エルゴカルシフェロール/コレカルシフェロール)→Ca補充→PTH正常化・ALP正常化を確認→原因検索(日光曝露不足, 吸収不良, 腎疾患)→骨密度フォロー",disc:"低Ca血症の鑑別診断(VD欠乏, 副甲状腺機能低下, 腎不全, Mg欠乏), ビタミンD欠乏のリスク因子と補充法, 骨軟化症の画像所見(Looser zone)",refs:["Minisola S. BMJ 2015;350:h2723","Fukumoto S. J Bone Miner Metab 2021;39:1"]}},"g27":{"多嚢胞性卵巣症候群":{prof:"25歳女性, 月経不順, 多毛, 肥満",cc:"月経不順, 多毛, 不妊",o:"初経から月経不順, 〇年前から多毛が目立つ",p:"体重増加で増悪",q:"月経周期60-90日(希発月経), BMI 28, Ferriman-Gallweyスコア高値",r:"全身(代謝異常), 顔面・体幹(多毛)",s:"ニキビ, 男性型脱毛, 不妊, 肥満, 黒色表皮腫(インスリン抵抗性)",t:"月経不順→不妊→前医でPCOS疑い→当院紹介",pe:"BMI, 多毛(顔面, 胸部, 下腹部), ニキビ, 黒色表皮腫(頸部, 腋窩), 甲状腺触診",tests:"LH/FSH比(LH>FSH), テストステロン, DHEA-S, 17-OHP(CAH除外), 甲状腺機能, PRL, HbA1c/OGTT, 脂質, 経膣エコー(多嚢胞卵巣: 12個以上の小卵胞)",probs:"#1 多嚢胞性卵巣症候群(Rotterdam基準: 2/3以上) #2 インスリン抵抗性 #3 不妊(排卵障害) #4 代謝症候群リスク",course:"生活指導(減量: 5-10%で排卵回復)→月経異常: OC/プロゲスチン→不妊: クロミフェン/レトロゾール→多毛: スピロノラクトン→インスリン抵抗性: メトホルミン→長期フォロー(DM, 心血管, 子宮体癌リスク)",disc:"PCOSの診断基準(Rotterdam), 長期的代謝リスク(DM, CVD), 排卵誘発法の選択, PCOSにおけるメトホルミンの位置付け, 子宮体癌リスク",refs:["Teede HJ. J Clin Endocrinol Metab 2023;108:2695","Escobar-Morreale HF. Nat Rev Endocrinol 2018;14:270"]},"MEN（多発性内分泌腺腫症）":{prof:"30歳男性, 甲状腺髄様癌, 褐色細胞腫, 家族歴あり",cc:"甲状腺結節, 発作性高血圧",o:"健診で甲状腺結節→FNAで髄様癌→精査で褐色細胞腫も発見",p:"発作的な高血圧・動悸(褐色細胞腫)",q:"甲状腺腫瘤+副腎腫瘤, カルシトニン高値+メタネフリン高値",r:"前頸部(甲状腺), 腹部(副腎)",s:"頭痛, 動悸, 発汗(褐色細胞腫), 下痢(髄様癌), 高Ca(MEN1)",t:"甲状腺結節→髄様癌→全身スクリーニング→褐色細胞腫発見→家系調査でRET変異→当院紹介",pe:"甲状腺結節, Marfan様体型(MEN2B), 粘膜神経腫(MEN2B), 副甲状腺機能亢進症状",tests:"カルシトニン, CEA, 血中メタネフリン分画, Ca/PTH, 遺伝子検査(RET: MEN2, MEN1: MEN1), 甲状腺エコー/CT, 副腎CT/MRI, MIBGシンチ",probs:"#1 MEN2A/2B(RET変異) or MEN1(MEN1変異) #2 甲状腺髄様癌 #3 褐色細胞腫 #4 副甲状腺機能亢進症(MEN1/2A)",course:"褐色細胞腫先行切除(副腎危機予防)→甲状腺全摘(髄様癌)→副甲状腺手術(必要時)→遺伝カウンセリング→家族スクリーニング(RET検査)→予防的甲状腺全摘(変異保因者)→長期フォロー",disc:"MENの分類(MEN1 vs MEN2A vs MEN2B), 手術順序(褐色細胞腫を先に!), RET変異のコドン別リスク分類と予防的甲状腺全摘の時期, 遺伝カウンセリングの重要性",refs:["Wells SA. N Engl J Med 2015;373:1149","Thakker RV. J Clin Endocrinol Metab 2012;97:2990"]},"カルチノイド症候群":{prof:"55歳男性, 小腸NET, 肝転移",cc:"顔面紅潮, 下痢, 喘鳴",o:"〇カ月前から突発的な顔面紅潮と水様性下痢",p:"アルコール, ストレス, 特定食品で誘発",q:"顔面紅潮発作(1日数回, 数分持続), 水様性下痢(1日5-10回)",r:"顔面・上半身(紅潮), 腹部(下痢)",s:"顔面紅潮, 下痢, 喘鳴(気管支攣縮), 右心不全(カルチノイド心疾患: TR/PS)",t:"顔面紅潮+下痢→前医で腹部CT→小腸腫瘤+肝転移→5-HIAA高値→当院紹介",pe:"顔面紅潮(発作的), 肝腫大, 心雑音(TR: 右心弁膜症), 喘鳴, テランジエクタシア(慢性例)",tests:"24時間尿中5-HIAA, 血中クロモグラニンA, CT(原発巣+肝転移), 68Ga-DOTATATE PET/CT(ソマトスタチン受容体シンチ), 心エコー(カルチノイド心疾患: TR, PS), 生検",probs:"#1 カルチノイド症候群(小腸NET, 肝転移) #2 神経内分泌腫瘍(NET G_) #3 カルチノイド心疾患(あれば)",course:"ソマトスタチンアナログ(オクトレオチドLAR)→肝転移: 切除/TAE/PRRT→カルチノイド心疾患: 弁置換術→カルチノイドクリーゼ予防(手術前オクトレオチド)→長期フォロー",disc:"カルチノイド症候群の病態(セロトニン過剰と肝転移の関係), ソマトスタチンアナログの抗腫瘍効果(PROMID/CLARINET), PRRT(177Lu-DOTATATE), カルチノイドクリーゼの予防",refs:["Pavel M. Ann Oncol 2020;31:844","Halperin DM. Lancet Oncol 2017;18:162"]}},"g28":{"2型糖尿病":{prof:"55歳男性, 肥満(BMI 28), 家族歴あり",cc:"口渇, 多飲, 体重減少",o:"健診でHbA1c高値を指摘, 〇カ月前から口渇",p:"食事量に関わらず口渇持続",q:"HbA1c 9.5%, 随時血糖 350 mg/dL",r:"全身",s:"多尿, 易疲労, 視力低下(あれば)",t:"健診異常→前医でHbA1c 9.5%→教育入院目的で当院紹介",pe:"BMI, 腹囲, 血圧, 眼底(糖尿病網膜症), 足背動脈触知, モノフィラメント検査, アキレス腱反射",tests:"HbA1c, 血糖(空腹時・随時), C-ペプチド, 抗GAD抗体(1型除外), 脂質, 腎機能, 尿アルブミン, 眼底検査, 頸動脈エコー, ABI",probs:"#1 2型糖尿病(血糖コントロール不良) #2 肥満症 #3 糖尿病合併症評価(網膜症・腎症・神経障害)",course:"合併症評価→食事・運動療法指導→薬物療法(メトホルミン→追加薬)→血糖モニタリング→自己管理教育→退院",disc:"2型糖尿病の包括的治療戦略, HbA1c目標の個別化, 心血管リスク管理, SGLT2i/GLP-1RAのエビデンス",refs:["American Diabetes Association. Diabetes Care 2024;47:S1","Araki E. J Diabetes Investig 2020;11:1612"]},"糖尿病ケトアシドーシス":{prof:"22歳女性, 1型糖尿病, インスリン中断",cc:"嘔気, 腹痛, 意識障害",o:"インスリン中断〇日後から嘔気・腹痛",p:"嘔吐で経口摂取困難, 増悪",q:"血糖 500 mg/dL, pH 7.15, HCO3 8 mEq/L",r:"腹部全体",s:"口渇, 多尿, Kussmaul呼吸, アセトン臭",t:"インスリン中断→嘔気・腹痛→意識混濁→救急搬送",pe:"脱水所見, Kussmaul呼吸, アセトン臭, 意識レベル, バイタル",tests:"血糖, 血液ガス(pH, HCO3), アニオンギャップ, ケトン体, 電解質(K補正要), 腎機能, 浸透圧",probs:"#1 糖尿病ケトアシドーシス #2 1型糖尿病(インスリン中断) #3 脱水 #4 電解質異常",course:"大量輸液(生食)→インスリン持続静注→K補正→血糖・AG正常化確認→皮下インスリン移行→患者教育",disc:"DKAの病態生理と初期治療(輸液・インスリン・K補正), 脳浮腫のリスク, 再発予防",refs:["Kitabchi AE. Diabetes Care 2009;32:1335","Joint British Diabetes Societies. Diabet Med 2022;39:e14788"]},"1型糖尿病":{prof:"18歳女性, 急激な口渇・多尿, 体重減少",cc:"口渇, 多尿, 体重減少",o:"〇週間前から急激な口渇・多尿と体重減少(2週間で3kg)",p:"水分摂取しても口渇持続",q:"随時血糖 450 mg/dL, HbA1c 10.2%",r:"全身",s:"多飲, 多尿, 体重減少, 倦怠感, 視力低下",t:"急激な口渇・体重減少→前医で高血糖→ケトン陽性→1型DM疑い→当院紹介",pe:"BMI正常〜低め(2型と異なり肥満でないことが多い), 脱水所見, Kussmaul呼吸(DKA合併時), 他の自己免疫疾患の有無",tests:"血糖, HbA1c, C-ペプチド(低値), 抗GAD抗体, 抗IA-2抗体, 抗ZnT8抗体, ケトン体, 血液ガス, 甲状腺機能(自己免疫性甲状腺疾患合併), 抗TPO抗体",probs:"#1 1型糖尿病(自己免疫性) #2 インスリン依存状態 #3 DKAリスク #4 自己免疫疾患合併(甲状腺等)",course:"インスリン導入(強化インスリン療法: 基礎-追加 or ポンプ療法)→CGM(持続血糖モニタリング)→カーボカウント指導→低血糖対策教育→DKA予防教育→心理サポート→定期的合併症スクリーニング",disc:"1型DMの病型分類(急性発症/緩徐進行(SPIDDM)/劇症), インスリン療法の実際(MDI vs CSII), CGMとSAPの有用性, 1型DM特有の問題(低血糖, DKA, 心理的負担)",refs:["American Diabetes Association. Diabetes Care 2024;47:S1","Holt RIG. Lancet 2021;397:2169"]},"高浸透圧高血糖症候群":{prof:"78歳男性, 2型糖尿病, 感染症契機",cc:"意識障害, 脱水",o:"肺炎治療中に〇日前から経口摂取不良→意識混濁",p:"徐々に進行",q:"血糖 850 mg/dL, 血漿浸透圧 380 mOsm/kg, pH 7.32(著明なアシドーシスなし)",r:"全身(脱水, 意識障害)",s:"著明な脱水, 意識障害, 痙攣(浸透圧変動), ケトーシスは軽度",t:"2型DM→肺炎→脱水進行→高血糖→意識障害→救急搬送",pe:"著明な脱水(皮膚ツルゴール著減, 口腔乾燥), 意識レベル低下(GCS), 頻脈, 低血圧, Kussmaul呼吸なし(DKAとの違い), 神経学的所見(局所神経症状あり得る)",tests:"血糖, 血漿浸透圧(>320), 血液ガス(pH>7.30: DKAとの鑑別), BUN/Cr(腎前性AKI), 電解質(Na補正値, K), ケトン体(軽度), 血算, 感染症精査",probs:"#1 高浸透圧高血糖症候群(HHS) #2 著明な脱水 #3 誘因(肺炎) #4 2型糖尿病 #5 急性腎障害",course:"大量輸液(生食: 水分欠乏量の50%を最初12hで)→インスリン少量持続静注→K補正→血糖・浸透圧の緩やかな補正(脳浮腫・CPM予防)→誘因治療→皮下インスリン移行",disc:"HHS vs DKAの病態と鑑別(浸透圧著明高値+ケトーシス軽度+高齢+2型DM), 輸液・インスリンの投与法の違い, 浸透圧の急激な補正のリスク, 死亡率の高さ(DKAより高い)",refs:["Kitabchi AE. Diabetes Care 2009;32:1335","Scott AR. Diabet Med 2015;32:714"]},"低血糖症":{prof:"70歳男性, 2型糖尿病(SU薬), 腎機能低下",cc:"冷汗, 振戦, 意識障害",o:"本日昼食前に冷汗・振戦が出現, その後意識混濁",p:"食事摂取で改善するが今回は意識障害で経口不能",q:"血糖 32 mg/dL, Whippleの三徴(低血糖症状+血糖低値+ブドウ糖投与で改善)",r:"全身",s:"自律神経症状(冷汗, 動悸, 振戦, 空腹感)→中枢神経症状(意識障害, 痙攣, 異常行動)",t:"SU薬内服中→食事量低下→低血糖→意識障害→救急搬送",pe:"冷汗, 振戦, 頻脈, 意識レベル低下(GCS), 局所神経症状(あれば), バイタル",tests:"血糖(即座に測定), 血中インスリン, C-ペプチド, SU薬血中濃度(医原性確認), 腎機能, 肝機能, コルチゾール(副腎不全除外), 腹部CT(インスリノーマ疑い時)",probs:"#1 低血糖症(SU薬誘発性) #2 医原性低血糖 #3 CKDによるSU薬蓄積 #4 意識障害",course:"緊急: ブドウ糖静注(50% 40mL)→意識回復確認→SU薬の遷延性低血糖(ブドウ糖持続点滴+経過観察)→薬剤調整(SU薬減量/中止)→低血糖教育(患者・家族)→再発予防",disc:"低血糖の原因分類(糖尿病治療薬, インスリノーマ, 副腎不全, 肝不全), Whippleの三徴, SU薬による遷延性低血糖の管理, 高齢者・CKD患者の薬剤選択",refs:["Cryer PE. J Clin Invest 2006;116:1470","Seaquist ER. Diabetes Care 2013;36:1384"]},"糖尿病合併症":{prof:"60歳男性, 2型糖尿病15年, HbA1c 8.5%",cc:"足趾潰瘍, 視力低下, 蛋白尿",o:"〇カ月前から右第1趾の潰瘍が治癒しない",p:"神経障害のため痛みを感じにくい",q:"HbA1c 8.5%, eGFR 35, 尿アルブミン 800mg/gCr, 増殖性網膜症",r:"足(神経障害・PAD), 眼(網膜症), 腎(腎症)",s:"足趾潰瘍(神経障害性), 視力低下(増殖性網膜症), 浮腫(腎症), しびれ(末梢神経障害), 起立性低血圧(自律神経障害)",t:"DM長期罹患→合併症進行→足潰瘍→前医から合併症管理目的で当院紹介",pe:"足: 潰瘍(Wagner分類), モノフィラメント検査, 振動覚, アキレス腱反射, 足背動脈. 眼: 眼底(増殖性変化). 腎: 浮腫. 自律神経: 起立性低血圧, 安静時頻脈",tests:"HbA1c, 腎機能(eGFR), 尿アルブミン, 眼底検査, 神経伝導検査, ABI/SPP, 心血管評価(心エコー, 頸動脈エコー), CVR-R(自律神経)",probs:"#1 糖尿病性神経障害(足潰瘍合併) #2 糖尿病性腎症(G4A3) #3 糖尿病性網膜症(増殖性) #4 2型糖尿病(血糖コントロール不良) #5 動脈硬化性疾患リスク",course:"血糖管理最適化→足潰瘍: デブリードマン+除圧+感染管理→網膜症: 汎網膜光凝固/抗VEGF→腎症: RAS阻害薬+SGLT2i+蛋白制限→フットケア教育→多職種チーム管理",disc:"糖尿病三大合併症(網膜症・腎症・神経障害)の病期分類と治療, 糖尿病性足病変の管理(多職種アプローチ), SGLT2iの腎保護エビデンス, 大血管合併症の包括管理",refs:["American Diabetes Association. Diabetes Care 2024;47:S1","Pop-Busui R. Diabetes Care 2017;40:136"]}},"g29":{"家族性高コレステロール血症":{prof:"35歳男性, LDL-C著明高値, 若年冠動脈疾患の家族歴",cc:"検診でLDL-C高値(250 mg/dL)",o:"学生時代からLDL-C高値を指摘されていた",p:"食事療法のみで改善不十分",q:"LDL-C 250 mg/dL, アキレス腱肥厚",r:"全身(動脈硬化)",s:"アキレス腱黄色腫, 眼瞼黄色腫, 角膜輪, 若年冠動脈疾患の家族歴",t:"検診高LDL→食事療法→改善なし→前医でFH疑い→当院紹介",pe:"アキレス腱肥厚(>9mm), 手背腱黄色腫, 眼瞼黄色腫, 角膜輪(若年者で有意), 血管雑音",tests:"脂質パネル(TC, LDL-C, HDL-C, TG), アキレス腱X線/エコー(肥厚), 冠動脈CT/CAG(冠動脈評価), 頸動脈エコー, 遺伝子検査(LDLR, PCSK9, APOB), 家系調査",probs:"#1 家族性高コレステロール血症(ヘテロ接合体, FH診断基準_点) #2 早発性冠動脈疾患リスク #3 アキレス腱黄色腫",course:"高力価スタチン(最大量)→エゼチミブ追加→目標未達: PCSK9阻害薬→ホモ接合体: LDLアフェレシス→家族スクリーニング→生涯治療の教育",disc:"FHの診断基準(日本動脈硬化学会), ヘテロ vs ホモの病態と予後, PCSK9阻害薬のエビデンス(FOURIER/ODYSSEY), 小児期からの治療開始の重要性",refs:["Mach F. Eur Heart J 2020;41:111","日本動脈硬化学会. 家族性高コレステロール血症診療ガイドライン 2022"]},"高トリグリセリド血症":{prof:"50歳男性, 肥満, 飲酒歴, TG著明高値",cc:"検診で中性脂肪著明高値",o:"検診でTG 800 mg/dL を指摘",p:"飲酒後・過食後に増悪",q:"TG 800 mg/dL, 乳び血清",r:"全身(膵炎リスク, 動脈硬化)",s:"無症状(多くの場合), 発疹性黄色腫(TG>1000), 腹痛(膵炎合併時)",t:"検診異常→前医でTG著明高値→膵炎リスク評価→当院紹介",pe:"BMI, 腹囲, 発疹性黄色腫(臀部, 背部, 四肢), 肝腫大(脂肪肝), 網膜脂血症",tests:"脂質パネル(直接法LDL-C or non-HDL-C), 血糖/HbA1c, 肝機能, 甲状腺機能, 腎機能, 膵酵素(リパーゼ), 腹部エコー(脂肪肝), アポリポ蛋白, リポ蛋白リパーゼ活性(遺伝性疑い時)",probs:"#1 高TG血症(TG≥500: 膵炎リスク) #2 二次性要因(肥満, 飲酒, DM, 甲状腺機能低下) #3 急性膵炎リスク",course:"二次性原因の是正(禁酒, 減量, DM管理)→TG≥500: フィブラート+n-3系脂肪酸→急性膵炎既往/TG>1000: 厳格な脂質管理→生活指導→定期フォロー",disc:"高TG血症の原因(原発性 vs 二次性), TG≥500での急性膵炎リスクと対応, フィブラート・n-3系脂肪酸の使い分け, スタチンとフィブラートの併用時の注意(横紋筋融解症)",refs:["Berglund L. J Clin Endocrinol Metab 2012;97:2969","日本動脈硬化学会. 動脈硬化性疾患予防ガイドライン 2022"]},"続発性脂質異常症":{prof:"48歳女性, 甲状腺機能低下症, 高LDL-C",cc:"検診でLDL-C高値",o:"検診でLDL-C 200 mg/dLを指摘, 以前は正常だった",p:"最近の体重増加・倦怠感と同時期に出現",q:"LDL-C 200 mg/dL, TC 290 mg/dL",r:"全身",s:"倦怠感, 体重増加, 寒がり, 便秘(甲状腺機能低下症の症状)",t:"検診異常→前医で脂質異常症→二次性原因精査→甲状腺機能低下判明→当院紹介",pe:"甲状腺腫大, 非圧痕性浮腫, 皮膚乾燥, 徐脈, 腱反射弛緩相延長",tests:"脂質パネル, TSH, FT4(甲状腺機能低下), 血糖/HbA1c, 腎機能(ネフローゼ除外), 尿蛋白, 肝機能, コルチゾール(クッシング除外)",probs:"#1 続発性脂質異常症(甲状腺機能低下症による) #2 甲状腺機能低下症(橋本病) #3 動脈硬化リスク",course:"原疾患治療(L-T4補充)→甲状腺機能正常化後に脂質再評価→改善不十分: スタチン追加→他の二次性原因の除外→定期フォロー",disc:"続発性脂質異常症の原因(甲状腺機能低下, ネフローゼ, DM, クッシング, 薬剤), 原疾患治療による脂質改善の可能性, スタチン開始前の二次性原因スクリーニングの重要性",refs:["日本動脈硬化学会. 動脈硬化性疾患予防ガイドライン 2022","Mach F. Eur Heart J 2020;41:111"]},"メタボリックシンドローム":{prof:"50歳男性, 内臓肥満, 高血圧, 耐糖能異常, 脂質異常",cc:"検診で複数の代謝異常指摘",o:"〇年前から腹囲増加, 血圧・血糖・脂質の異常を指摘",p:"運動不足, 過食で増悪",q:"腹囲 92cm, BP 145/90, TG 200, HDL-C 35, FPG 118",r:"全身(代謝異常, 動脈硬化)",s:"無症状(多くの場合), 倦怠感, 労作時息切れ",t:"検診で複合的代謝異常→前医で生活指導→改善不十分→当院紹介",pe:"腹囲(男性≥85cm, 女性≥90cm), BMI, 血圧, 黒色表皮腫(インスリン抵抗性)",tests:"腹囲, 血圧, TG, HDL-C, FPG/HbA1c/OGTT, 肝機能(脂肪肝), 尿酸, 腹部エコー(内臓脂肪/脂肪肝), 頸動脈エコー(IMT), ABI",probs:"#1 メタボリックシンドローム #2 内臓肥満 #3 動脈硬化性疾患リスク(心血管イベントリスク評価) #4 NAFLD/NASH(あれば)",course:"生活習慣改善(食事療法+運動療法: 体重3-5%減少目標)→効果判定(3-6カ月)→不十分: 各危険因子に対する薬物療法→多職種介入(管理栄養士, 運動指導士)→長期フォロー",disc:"メタボリックシンドロームの診断基準(日本基準 vs IDF), インスリン抵抗性の病態生理, 内臓脂肪減少の心血管リスク低減効果, NAFLD/NASHとの関連",refs:["Alberti KGMM. Circulation 2009;120:1640","日本内科学会. メタボリックシンドローム診断基準 2005"]}},"g30":{"肥満症":{prof:"45歳男性, BMI 35, 2型糖尿病, 高血圧",cc:"体重増加, 労作時息切れ",o:"〇年前から体重増加が続き, BMI 35に達した",p:"過食・運動不足で増悪",q:"BMI 35 kg/m², 体重 110kg, 腹囲 110cm",r:"全身",s:"労作時息切れ, 睡眠時無呼吸, 膝痛, 2型DM, 高血圧, 脂質異常症",t:"体重増加→合併症増加→前医で減量指導→改善不十分→当院紹介",pe:"BMI, 腹囲, 血圧, 黒色表皮腫, 関節所見(膝OA), SAS所見(Mallampati分類)",tests:"BMI, 体組成, 血糖/HbA1c, 脂質, 肝機能(NAFLD), 尿酸, 腎機能, 甲状腺機能(二次性除外), コルチゾール(クッシング除外), PSG(SAS), 腹部エコー",probs:"#1 肥満症(BMI≥25+肥満関連疾患) #2 高度肥満(BMI≥35) #3 合併症(DM, HT, DL, SAS, NAFLD)",course:"食事療法(カロリー制限)→運動療法→行動療法→薬物療法(GLP-1RA: セマグルチド)→BMI≥35+合併症: 肥満外科手術(スリーブ/バイパス)→多職種チーム管理→長期フォロー",disc:"肥満症の定義と診断(日本基準: BMI≥25+合併症), 減量の医学的意義(5-10%減量の効果), GLP-1RAの減量効果(STEP trials), 肥満外科手術の適応と効果, リバウンド予防",refs:["日本肥満学会. 肥満症診療ガイドライン 2022","Wilding JPH. N Engl J Med 2021;384:989"]},"肥満に伴う合併症":{prof:"50歳女性, BMI 38, SAS, NAFLD, 膝OA",cc:"いびき, 日中眠気, 膝痛, 肝機能異常",o:"〇年前から体重増加に伴い多臓器の問題が出現",p:"体重増加で各症状増悪",q:"AHI 35/h(重症SAS), ALT 65, 膝OA Kellgren-Lawrence III",r:"全身(多臓器)",s:"日中過眠(SAS), 肝機能異常(NAFLD/NASH), 両膝痛(OA), GERD, 月経不順",t:"体重増加→多臓器合併症→各科受診→包括的管理目的で当院紹介",pe:"BMI, 腹囲, Mallampati分類, 肝腫大, 膝関節所見(腫脹, 可動域制限), 下肢静脈うっ滞, 間擦疹",tests:"BMI/体組成, PSG(SAS), 肝機能/肝エコー/FIB-4(NAFLD/NASH), 膝X線(OA), HbA1c, 脂質, 尿酸, 心エコー(肥満心筋症)",probs:"#1 肥満症(BMI 38) #2 閉塞性SAS(重症) #3 NAFLD/NASH #4 変形性膝関節症 #5 代謝異常",course:"減量(食事+運動+行動療法)→SAS: CPAP→NAFLD: 減量+SGLT2i/ピオグリタゾン→膝OA: リハビリ+除痛→薬物(GLP-1RA)→肥満外科検討→多職種連携",disc:"肥満の多臓器合併症の包括的管理, 減量による各合併症改善のエビデンス, NAFLD/NASHのマネジメント, SASと肥満の相互作用",refs:["日本肥満学会. 肥満症診療ガイドライン 2022","Rinella ME. Hepatology 2023;77:1797"]},"二次性肥満":{prof:"38歳女性, 急激な体重増加, 月経不順",cc:"急激な体重増加(6カ月で15kg)",o:"〇カ月前から急激に体重が増加",p:"食事量は変わらないのに増加",q:"6カ月で15kg増加, 中心性肥満",r:"体幹部(中心性), 顔面(満月様顔貌)",s:"満月様顔貌, 赤色皮膚線条, 月経不順, 筋力低下, 抑うつ",t:"急激な体重増加→食事療法無効→前医でクッシング疑い→当院紹介",pe:"体重分布の特徴(中心性, 満月様顔貌, buffalo hump), 皮膚線条, 近位筋力, 甲状腺触診, 浮腫",tests:"1mg DST, 24時間尿中コルチゾール, ACTH, TSH/FT4, インスリン, GH/IGF-1, 性ホルモン, 下垂体MRI, 副腎CT, 薬剤歴確認(ステロイド, 抗精神病薬)",probs:"#1 二次性肥満(内分泌性疑い) #2 鑑別: クッシング症候群/甲状腺機能低下/インスリノーマ/視床下部性 #3 急激な体重増加",course:"内分泌疾患の系統的スクリーニング→原因疾患特定→原因治療(手術/薬剤変更等)→体重管理→合併症治療→定期フォロー",disc:"二次性肥満の鑑別診断(クッシング, 甲状腺機能低下, 薬剤性, インスリノーマ, 視床下部性), 急激な体重増加の場合は二次性を疑うことの重要性, 薬剤性肥満(ステロイド, 抗精神病薬, 抗てんかん薬)",refs:["日本肥満学会. 肥満症診療ガイドライン 2022","Lacroix A. Lancet 2015;386:913"]}},"g31":{"痛風発作":{prof:"45歳男性, 飲酒歴, 肥満",cc:"右第1MTP関節の激痛, 発赤腫脹",o:"昨夜の飲酒後, 今朝起床時に右母趾の激痛で歩行困難",p:"荷重・接触で増悪, 安静でもズキズキ持続",q:"激痛NRS 9/10, 発赤・腫脹・熱感著明",r:"右第1MTP関節(足の親指の付け根)",s:"発熱(微熱), 歩行困難",t:"飲酒→早朝に急性関節炎→前医受診→UA高値→当院紹介",pe:"右第1MTP関節の著明な発赤・腫脹・熱感・圧痛, 他関節の有無, 痛風結節(耳介, 肘, アキレス腱)",tests:"血清尿酸(発作中は低下することあり), CRP, 血算, 腎機能, 関節液検査(針状尿酸Na結晶, 負の複屈折: 確定診断), X線(慢性: 骨びらん), 関節エコー(double contour sign)",probs:"#1 急性痛風関節炎(右第1MTP) #2 高尿酸血症 #3 肥満・飲酒習慣",course:"急性期: NSAIDs全量(短期)/コルヒチン(0.5mg発作12h以内)/ステロイド→消炎後: 尿酸降下薬(フェブキソスタット/アロプリノール)→生活指導(飲酒制限, 減量)→UA<6.0目標",disc:"痛風発作の発作中は尿酸降下薬を開始しない理由(UA変動で発作遷延), コルヒチンカバー(尿酸降下薬開始時の発作予防), 尿酸管理目標(<6.0mg/dL), 生活習慣改善のエビデンス",refs:["FitzGerald JD. Arthritis Care Res 2020;72:744","日本痛風・核酸代謝学会. 高尿酸血症・痛風の治療ガイドライン 第3版"]},"痛風腎":{prof:"55歳男性, 長年の高尿酸血症, 腎機能低下",cc:"腎機能低下, 蛋白尿",o:"〇年前から高尿酸血症(UA 9-10), 最近eGFR低下を指摘",p:"高尿酸血症の放置で進行",q:"eGFR 45, 尿蛋白(+), UA 9.5 mg/dL",r:"腎(腎機能低下)",s:"痛風発作の既往(複数回), 腎結石(既往), 倦怠感",t:"高尿酸血症→痛風反復→腎機能低下→前医で痛風腎疑い→当院紹介",pe:"痛風結節(慢性), 血圧, 浮腫",tests:"尿酸, 腎機能(eGFR), 尿検査(蛋白尿, 尿中尿酸), 腎エコー(腎サイズ, 結石), 24時間蓄尿(尿酸排泄量: 排泄低下型vs産生過剰型の分類)",probs:"#1 痛風腎(慢性尿酸塩腎症) #2 CKD(G3b) #3 高尿酸血症(長期未治療) #4 尿路結石",course:"尿酸降下薬(腎機能に応じた用量調整)→UA<6.0目標→飲水励行→尿アルカリ化(尿路結石予防)→CKD管理(降圧, 蛋白制限)→定期腎機能フォロー",disc:"痛風腎の病態(尿酸塩沈着による間質性腎炎), 高尿酸血症とCKD進行の関連, 尿酸降下薬の腎保護効果(議論あり), フェブキソスタット vs アロプリノールのCKD患者での使い分け",refs:["日本痛風・核酸代謝学会. 高尿酸血症・痛風の治療ガイドライン 第3版","Johnson RJ. N Engl J Med 2018;378:1039"]},"無症候性高尿酸血症":{prof:"40歳男性, 検診でUA高値, 無症状",cc:"検診で尿酸高値(8.5 mg/dL)",o:"検診でUA 8.5を指摘, 症状なし",p:"無症状",q:"UA 8.5 mg/dL, 痛風発作の既往なし",r:"なし(無症状)",s:"無症状, 合併症なし",t:"検診UA高値→前医で経過観察→〇年間薬物治療なし→当院受診",pe:"痛風結節なし, 関節炎なし, 血圧, BMI",tests:"尿酸, 腎機能, 尿検査, 脂質, 血糖, 肝機能, 関節エコー(無症候性尿酸塩沈着の有無: 研究レベル)",probs:"#1 無症候性高尿酸血症 #2 心血管リスク因子の評価 #3 痛風発作リスク",course:"生活指導(プリン体制限, 飲酒制限, 減量, 飲水励行)→UA≥9.0 or 合併症あり: 薬物治療検討→UA≥8.0+腎障害: 薬物治療考慮→定期フォロー",disc:"無症候性高尿酸血症の薬物治療の適応(日本 vs 欧米のガイドラインの違い), 高尿酸血症と心血管リスク(因果関係 vs 相関), 生活習慣改善の重要性",refs:["日本痛風・核酸代謝学会. 高尿酸血症・痛風の治療ガイドライン 第3版","FitzGerald JD. Arthritis Care Res 2020;72:744"]},"偽痛風":{prof:"75歳女性, 膝関節の急性関節炎",cc:"右膝関節の痛み, 腫脹",o:"昨日から右膝の痛みと腫脹が急激に出現",p:"荷重で増悪, 安静でも持続",q:"右膝関節の発赤・腫脹・熱感, 関節可動域制限",r:"右膝関節(大関節に好発)",s:"発熱(あれば), 歩行困難",t:"急性膝関節炎→前医でUA正常→関節液からCPPD結晶→当院紹介",pe:"右膝関節の腫脹・熱感・圧痛・関節液貯留, 可動域制限, 他関節の有無",tests:"関節液検査(ピロリン酸Ca(CPPD)結晶: 菱形/四角形, 弱い正の複屈折), X線(軟骨石灰化: chondrocalcinosis), 血清尿酸(正常: 痛風と鑑別), CRP, 血算, Ca, P, Mg, 甲状腺機能, フェリチン",probs:"#1 偽痛風(CPPD結晶沈着症, 急性型) #2 軟骨石灰化 #3 基礎疾患検索(副甲状腺機能亢進, ヘモクロマトーシス, 低Mg)",course:"急性期: NSAIDs/コルヒチン/関節内ステロイド注射→関節液排液→基礎疾患スクリーニング(PHPT, ヘモクロマトーシス, 低Mg: 若年・多発例)→予防: 低用量コルヒチン(反復例)",disc:"偽痛風の診断(関節液CPPD結晶同定が確定診断), 痛風 vs 偽痛風の鑑別, X線の軟骨石灰化の分布(膝半月板, 三角靱帯, 恥骨結合), 若年発症時の代謝異常スクリーニング",refs:["Rosenthal AK. N Engl J Med 2016;374:2575","Zhang W. Ann Rheum Dis 2011;70:563"]}},"g32":{"ウィルソン病":{prof:"18歳男性, 肝機能異常, 振戦",cc:"肝機能異常, 振戦, 構音障害",o:"〇年前から肝機能異常, 最近振戦と構音障害が出現",p:"徐々に進行",q:"AST/ALT上昇, 血清セルロプラスミン低値, 尿中Cu排泄増加",r:"肝(肝障害), 脳(神経症状), 眼(Kayser-Fleischer輪)",s:"振戦, 構音障害, 歩行障害, 精神症状(性格変化, 学業低下), 溶血性貧血(急性型)",t:"肝機能異常→原因不明→振戦出現→前医でセルロプラスミン低値→ウィルソン病疑い→当院紹介",pe:"Kayser-Fleischer輪(細隙灯顕微鏡), 振戦(翼状振戦/flapping tremor), 構音障害, ジストニア, 肝腫大/縮小(進行度による), 脾腫",tests:"血清セルロプラスミン(低値), 血清Cu(遊離Cu上昇), 24時間尿中Cu(上昇), ペニシラミン負荷試験, 肝生検(Cu含量), 細隙灯顕微鏡(KF輪), 頭部MRI(基底核高信号: giant panda sign), 遺伝子検査(ATP7B)",probs:"#1 ウィルソン病(肝型+神経型) #2 銅代謝異常 #3 肝障害 #4 神経症状",course:"銅キレート薬(D-ペニシラミン or トリエンチン)→亜鉛製剤(維持療法/軽症)→食事指導(銅含有食品制限)→肝不全: 肝移植→生涯治療→家族スクリーニング",disc:"ウィルソン病の診断(Leipzigスコア), 治療薬の選択(キレート薬 vs 亜鉛), 肝不全型への肝移植の適応, 無症候性同胞の早期発見と治療開始の重要性",refs:["EASL. J Hepatol 2012;56:671","Roberts EA. Hepatology 2008;47:2089"]},"ヘモクロマトーシス":{prof:"50歳男性, 肝機能異常, 糖尿病, 皮膚色素沈着",cc:"肝機能異常, 糖尿病, 関節痛",o:"〇年前から肝機能異常とDMが出現, 最近関節痛と色素沈着が目立つ",p:"徐々に進行",q:"フェリチン 2000 ng/mL, TSAT 85%, 肝硬変(初期)",r:"肝(肝障害), 膵(DM), 皮膚(色素沈着), 関節, 心臓",s:"皮膚色素沈着(bronze diabetes), 肝障害, 糖尿病, 関節痛(第2-3 MCP), 心不全, 性腺機能低下",t:"肝障害+DM→前医でフェリチン著明高値→鉄過剰疑い→当院紹介",pe:"皮膚色素沈着(全身, 特に露出部), 肝腫大, 関節腫脹(第2-3 MCP: 握手痛), 精巣萎縮, 心不全徴候(進行時)",tests:"フェリチン, TSAT(>45%), 血清鉄, TIBC, 肝機能, HbA1c, 肝MRI(T2*/R2: 肝鉄定量), 肝生検(鉄染色), 遺伝子検査(HFE: C282Y/H63D), 心臓MRI(心鉄沈着), 性腺機能",probs:"#1 ヘモクロマトーシス(遺伝性/二次性) #2 肝硬変(鉄沈着性) #3 糖尿病(膵鉄沈着) #4 多臓器鉄沈着",course:"瀉血療法(500mL/1-2週, フェリチン<50目標)→維持瀉血(3-4カ月毎)→二次性: 原因治療+鉄キレート薬(デフェラシロクス)→臓器障害管理(DM, 肝硬変, 心不全)→HCCスクリーニング→家族スクリーニング",disc:"遺伝性(HFE関連) vs 二次性(輸血後, 無効造血)の鑑別, 瀉血療法の有効性と限界(関節症・DM・肝硬変は不可逆的), 肝硬変合併例のHCCリスク, 日本ではHFE変異は稀(二次性が多い)",refs:["Bacon BR. N Engl J Med 2011;365:2519","EASL. J Hepatol 2010;53:3"]},"アミロイドーシス":{prof:"65歳男性, ネフローゼ, 心不全, 末梢神経障害",cc:"下肢浮腫, 労作時呼吸困難, しびれ",o:"〇カ月前から下肢浮腫と息切れが進行",p:"徐々に進行, 利尿薬への反応不良",q:"蛋白尿3g/日, EF正常だが拡張障害著明, 心室壁肥厚",r:"心(心アミロイドーシス), 腎(腎アミロイドーシス), 末梢神経",s:"ネフローゼ症候群, 心不全(HFpEF様), 末梢神経障害(しびれ, 自律神経障害), 巨舌(AL), 起立性低血圧",t:"ネフローゼ+拡張障害性心不全+末梢神経障害→多臓器障害のパターン→アミロイドーシス疑い→当院紹介",pe:"下肢浮腫, 頸静脈怒張, 肝腫大, 巨舌(AL型), 起立性低血圧, 点状紫斑(眼周囲: raccoon eyes, AL型), 手根管症候群, 末梢神経障害所見",tests:"蛋白電気泳動, 免疫固定法, 遊離軽鎖(κ/λ比), 生検(脂肪吸引/直腸/腎/心内膜: Congo red陽性, 偏光: apple-green birefringence), 心エコー(壁肥厚, granular sparkling), 心臓MRI(LGE, ECV), 99mTc-PYPシンチ(ATTR), 遺伝子検査(TTR: 遺伝性ATTR)",probs:"#1 全身性アミロイドーシス(AL型/ATTR型) #2 心アミロイドーシス #3 腎アミロイドーシス(ネフローゼ) #4 末梢神経障害",course:"AL型: 化学療法(ダラツムマブ+ボルテゾミブ+デキサメタゾン)→自家移植(適格例)→臓器サポート. ATTR型: タファミジス(心アミロイド)→遺伝性: パチシラン/イノテルセン→臓器サポート(心不全管理, 透析)→支持療法",disc:"アミロイドーシスの分類(AL vs ATTR wild-type vs ATTR hereditary), 99mTc-PYPシンチによるATTRの非侵襲的診断, AL型の早期診断の重要性(NT-proBNP/トロポニン), ATTR心アミロイドの新規治療(タファミジス, RNA干渉薬)",refs:["Gillmore JD. Circulation 2016;133:2404","Garcia-Pavia P. Eur Heart J 2021;42:1554"]},"骨粗鬆症":{prof:"70歳女性, 閉経後, 腰背部痛",cc:"腰背部痛, 身長低下",o:"〇年前から腰背部痛, 身長が3cm低下",p:"前屈・荷重で増悪, 安静で軽減",q:"腰椎DXA T-score -3.2, 胸腰椎圧迫骨折(2椎体)",r:"腰背部",s:"円背(後弯), 身長低下, 転倒不安, 日常活動制限",t:"腰背部痛→前医でX線→圧迫骨折→骨密度低値→当院紹介",pe:"脊柱後弯, 胸腰椎棘突起叩打痛, 身長測定(低下), 転倒リスク評価(バランス, 筋力)",tests:"骨密度(DXA: 腰椎+大腿骨頸部), X線(胸腰椎: 圧迫骨折), TRACP-5b/P1NP(骨代謝マーカー), Ca, P, ALP, 25(OH)VD, 整形PTH, 腎機能, 血算(MM除外), 蛋白電気泳動(必要時)",probs:"#1 骨粗鬆症(DXA T-score≤-2.5) #2 椎体圧迫骨折 #3 転倒リスク #4 ビタミンD不足(あれば)",course:"Ca+VD補充→骨粗鬆症治療薬(ビスホスホネート/デノスマブ/テリパラチド/ロモソズマブ: 骨折リスクに応じた選択)→転倒予防(運動, 環境整備)→疼痛管理→定期骨密度フォロー",disc:"骨粗鬆症の診断基準(DXA T-score, 脆弱性骨折), FRAX®によるリスク評価, 薬剤の選択(骨折リスクに応じた治療: 低リスク→BP, 高リスク→テリパラチド/ロモソズマブ→BP), 顎骨壊死(MRONJ)・非定型大腿骨骨折のリスク管理",refs:["Shoback D. J Clin Endocrinol Metab 2020;105:587","日本骨粗鬆症学会. 骨粗鬆症の予防と治療ガイドライン 2015"]}},"g33":{"急性腎障害（AKI）全般":{prof:"70代男性, 術後, 脱水",cc:"乏尿, 全身倦怠感",o:"手術〇日後から尿量減少",p:"輸液で尿量増加傾向",q:"Cr 1.0→3.5に上昇, 尿量<0.5ml/kg/h",r:"全身(尿毒症症状)",s:"嘔気, 浮腫, 電解質異常",t:"術後→脱水→Cr上昇→腎臓内科コンサルト",pe:"体液量評価(JVP, 皮膚ツルゴール, 浮腫), 尿量モニタリング, 腹部診察",tests:"Cr推移, BUN, K, Na, 血液ガス, 尿検査・沈渣, FENa, 腎エコー(水腎症除外)",probs:"#1 急性腎障害(KDIGO Stage_, 病型: 腎前性/腎性/腎後性) #2 術後状態 #3 電解質異常",course:"原因検索(腎前性→輸液, 腎後性→閉塞解除, 腎性→原疾患治療)→腎毒性薬剤中止→透析適応評価→腎機能フォロー",disc:"AKIのKDIGO分類と病型鑑別(FENa), 早期介入の重要性, 透析導入の適応(AEIOU)",refs:["Kellum JA. N Engl J Med 2021;384:2589","KDIGO. Kidney Int Suppl 2012;2:1"]},"腎前性AKI":{prof:"80代女性, 嘔吐・下痢による脱水",cc:"乏尿, 倦怠感",o:"嘔吐・下痢〇日後から尿量減少",p:"輸液で尿量回復傾向",q:"Cr 1.0→2.8に上昇, BUN/Cr比>20",r:"全身(脱水症状)",s:"口渇, 皮膚ツルゴール低下, 起立性低血圧",t:"嘔吐下痢→脱水→乏尿→Cr上昇→救急受診",pe:"脱水所見(口腔乾燥, 皮膚ツルゴール↓, CRT延長), 起立性低血圧, 頻脈, JVP低下",tests:"Cr推移, BUN/Cr比, FENa(<1%), 尿浸透圧(>500), 尿Na(<20), 尿比重, 腎エコー, 血液ガス",probs:"#1 腎前性AKI(KDIGO Stage_) #2 脱水症 #3 電解質異常",course:"十分な輸液(細胞外液)→尿量・Crモニタリング→原因治療(嘔吐下痢)→腎毒性薬剤回避→腎機能回復確認",disc:"腎前性AKIの診断(FENa<1%, 尿浸透圧>500), 迅速な体液量補正の重要性, 腎性への移行リスク",refs:["Kellum JA. N Engl J Med 2021;384:2589","Makris K. Clin Biochem Rev 2016;37:85"]},"急性尿細管壊死":{prof:"65歳男性, 心臓手術後, 低血圧遷延",cc:"乏尿, Cr上昇",o:"術後〇日目から尿量減少, 輸液にも反応不良",p:"輸液負荷で尿量改善せず",q:"Cr 1.2→4.5に上昇, FENa>2%",r:"全身(尿毒症症状)",s:"浮腫, 電解質異常(高K), 代謝性アシドーシス",t:"術中低血圧→術後乏尿→輸液負荷反応なし→腎臓内科コンサルト",pe:"体液量過剰(浮腫, 肺ラ音), 尿量モニタリング, バイタル",tests:"Cr推移, FENa(>2%), 尿浸透圧(<350), 尿沈渣(泥褐色円柱, 顆粒円柱), 尿Na(>40), 腎エコー",probs:"#1 急性尿細管壊死(虚血性) #2 術後AKI(KDIGO Stage_) #3 体液過剰 #4 高カリウム血症",course:"原因除去(腎毒性薬剤中止)→体液管理→電解質補正→透析適応評価→利尿期の管理→腎機能回復フォロー",disc:"ATNの病態(虚血性vs腎毒性), FENa>2%の診断的意義, 泥褐色円柱の所見, 回復までの時間経過",refs:["Basile DP. Compr Physiol 2012;2:1303","Bellomo R. Lancet 2012;380:756"]},"急性間質性腎炎":{prof:"45歳女性, NSAIDs開始2週間後",cc:"発熱, 皮疹, Cr上昇",o:"NSAIDs開始〇週間後から発熱と皮疹, Cr上昇",p:"原因薬剤中止で改善傾向",q:"Cr 0.7→2.5に上昇, 好酸球増多",r:"全身(薬剤アレルギー症状)",s:"関節痛, 腰背部痛, 嘔気",t:"NSAIDs開始→発熱・皮疹出現→前医でCr上昇指摘→当院紹介",pe:"皮疹(斑状丘疹状), 発熱, CVA叩打痛, 関節所見",tests:"Cr推移, 尿検査(WBC円柱, 好酸球尿), 末梢血好酸球, IgE, 尿中NAG/β2MG, 腎エコー, ガリウムシンチ, 腎生検",probs:"#1 急性間質性腎炎(薬剤性: NSAIDs) #2 薬疹 #3 好酸球増多",course:"原因薬剤中止→腎機能モニタリング→改善不十分時ステロイド投与→腎生検(診断確定)→再投与禁忌指導",disc:"薬剤性AINの三徴(発熱・皮疹・好酸球増多), Hanrahanの診断基準, ステロイド投与の是非とタイミング",refs:["Praga M. Kidney Int 2010;77:956","Perazella MA. Nat Rev Nephrol 2010;6:461"]},"急速進行性糸球体腎炎":{prof:"70代女性, 数週間で急激なCr上昇",cc:"全身倦怠感, 血尿, 急激な腎機能低下",o:"〇週間前から倦怠感, 肉眼的血尿出現",p:"進行性で自然改善なし",q:"Cr 1.0→5.0に数週間で上昇, 尿蛋白・血尿著明",r:"全身(尿毒症), 腎",s:"浮腫, 体重増加, 食欲低下, 嘔気",t:"倦怠感→血尿→前医でCr急上昇→緊急紹介",pe:"浮腫, 血圧上昇, 貧血所見, 肺ラ音(体液過剰), 皮疹・関節所見(血管炎評価)",tests:"Cr推移, 尿沈渣(赤血球円柱, 変形赤血球), 尿蛋白定量, ANCA(MPO/PR3), 抗GBM抗体, 補体(C3/C4), ANA, 血液ガス, 緊急腎生検",probs:"#1 急速進行性糸球体腎炎(ANCA関連/抗GBM/免疫複合体型) #2 AKI(KDIGO Stage_) #3 体液過剰",course:"緊急腎生検→半月体の確認→免疫抑制療法(mPSLパルス+CY)→血漿交換(抗GBM型)→透析(必要時)→維持療法",disc:"RPGNの3分類(ANCA関連・抗GBM・免疫複合体型), 腎生検の緊急性, 治療開始までの時間と予後の関係",refs:["KDIGO. Kidney Int 2021;100:S1","Kitamura H. Clin Exp Nephrol 2020;24:1"]}},"g34":{"糖尿病性腎症":{prof:"60代男性, 2型糖尿病20年, HbA1c 8.5%",cc:"下肢浮腫, 蛋白尿増加",o:"〇年前から微量アルブミン尿, 〇カ月前から顕性蛋白尿",p:"血糖コントロール改善で蛋白尿やや減少",q:"尿蛋白2.0g/日, eGFR 35mL/min, Cr 1.8",r:"全身(浮腫), 腎",s:"下肢浮腫, 網膜症あり, 神経障害あり, 視力低下",t:"微量Alb尿→顕性蛋白尿→eGFR低下→腎臓内科紹介",pe:"血圧, 浮腫, 眼底(糖尿病網膜症), モノフィラメント検査, 足背動脈触知, ABI",tests:"尿蛋白/Cr比, eGFR推移, HbA1c, 脂質, 眼底検査, 腎エコー(腎萎縮なし=DKDの特徴), 心エコー",probs:"#1 糖尿病性腎症(顕性腎症期, CKD G3b) #2 2型糖尿病 #3 糖尿病網膜症 #4 高血圧症",course:"血糖管理最適化→RA系阻害薬→SGLT2i追加→MRA(フィネレノン)→蛋白尿・eGFRモニタリング→腎代替療法準備",disc:"糖尿病性腎症の病期分類と包括的管理, SGLT2i・フィネレノンの腎保護エビデンス, 集学的治療",refs:["KDIGO. Kidney Int 2020;98:S1","de Boer IH. Diabetes Care 2022;45:3075"]},"高血圧性腎硬化症":{prof:"75歳男性, 高血圧30年, 治療不十分",cc:"健診でCr上昇指摘",o:"数年前からCr緩徐に上昇",p:"降圧薬服用でeGFR低下速度やや緩徐化",q:"Cr 1.8, eGFR 32mL/min, 尿蛋白軽度(0.3g/日)",r:"腎",s:"夜間頻尿, 軽度下肢浮腫, 自覚症状乏しい",t:"高血圧長期罹患→健診でCr上昇→前医で経過観察→eGFR低下進行→当院紹介",pe:"血圧(収縮期優位の上昇), 眼底(高血圧性変化), 心肥大, 頸動脈雑音, ABI",tests:"eGFR推移, 尿蛋白定量(軽度), 尿沈渣(活動性乏しい), 腎エコー(両腎萎縮, 皮質菲薄化), 心エコー(LVH), 頸動脈エコー",probs:"#1 高血圧性腎硬化症(CKD G3b) #2 高血圧症(コントロール不良) #3 心肥大",course:"厳格な降圧(130/80未満)→RA系阻害薬中心→減塩指導→eGFRモニタリング→腎代替療法準備(Stage4以降)",disc:"腎硬化症の診断(除外診断), 蛋白尿が少ないCKDの特徴, 降圧目標と腎保護",refs:["Ku E. JAMA Intern Med 2019;179:342","日本腎臓学会. CKD診療ガイドライン2023"]},"慢性糸球体腎炎":{prof:"40代男性, 検診で尿異常を長年指摘",cc:"蛋白尿, 血尿(無症候性)",o:"〇年前から検診で蛋白尿・血尿指摘, 最近eGFR低下",p:"RA系阻害薬で蛋白尿やや減少",q:"尿蛋白1.0g/日, 顕微鏡的血尿, eGFR 50mL/min",r:"腎",s:"自覚症状乏しい, 軽度高血圧",t:"検診異常→放置→eGFR低下→前医で精査開始→腎生検目的で当院紹介",pe:"血圧, 浮腫の有無, 眼底",tests:"尿蛋白定量, 尿沈渣(変形赤血球, 赤血球円柱), 血清IgA, 補体, ANA, ANCA, 腎エコー, 腎生検",probs:"#1 慢性糸球体腎炎(腎生検で確定: IgA腎症/膜性腎症/FSGS等) #2 CKD G3a #3 高血圧症",course:"腎生検→組織診断→原疾患に応じた治療→RA系阻害薬→蛋白尿・eGFRモニタリング→長期フォロー",disc:"慢性糸球体腎炎の腎生検の適応と意義, 組織型別の治療戦略と予後, CKD進行抑制",refs:["KDIGO. Kidney Int 2021;100:S1","日本腎臓学会. エビデンスに基づくCKD診療ガイドライン2023"]},"多発性嚢胞腎":{prof:"45歳男性, 家族歴あり(父がADPKD)",cc:"両側腹部膨満, 血尿",o:"〇年前に画像検査で両腎多発嚢胞指摘",p:"腹部膨満が緩徐に進行",q:"両腎腫大(長径>17cm), eGFR 45mL/min, Cr 1.5",r:"両側腹部",s:"腰背部痛, 肉眼的血尿(嚢胞出血), 高血圧",t:"家族歴→画像で診断→経過観察→eGFR低下→当院腎臓内科フォロー",pe:"両側腹部に腎腫大触知, 血圧上昇, 肝嚢胞(合併あれば)",tests:"腎エコー/MRI(TKV測定), eGFR推移, 尿検査, 肝エコー(肝嚢胞), 頭部MRA(脳動脈瘤スクリーニング), 遺伝子検査",probs:"#1 常染色体優性多発性嚢胞腎(ADPKD) #2 CKD G3a #3 高血圧症 #4 脳動脈瘤スクリーニング",course:"降圧療法(130/80未満, RA系阻害薬)→トルバプタン適応評価(TKV>750mL, eGFR低下速度)→嚢胞感染時の対応→脳動脈瘤定期スクリーニング→腎代替療法準備",disc:"ADPKDの診断基準(画像+家族歴), トルバプタンの適応と効果(TEMPO/REPRISE), 脳動脈瘤のスクリーニング",refs:["Torres VE. N Engl J Med 2012;367:2407","Chebib FT. Clin J Am Soc Nephrol 2015;10:2022"]},"CKD保存期管理":{prof:"70代女性, CKD G4(eGFR 22), 糖尿病・高血圧",cc:"倦怠感, 食欲低下",o:"〇年前からCKD進行, 最近倦怠感増強",p:"食事療法で電解質安定化",q:"eGFR 22mL/min, Cr 2.3, K 5.2, Hb 9.5",r:"全身",s:"浮腫, 嘔気, 骨痛, 掻痒感",t:"CKD G3→G4進行→合併症出現→保存期管理強化",pe:"血圧, 浮腫, 貧血所見, 皮膚掻痒, 栄養状態",tests:"eGFR推移, 電解質(K, Ca, P), Hb, フェリチン/TSAT, PTH, 血液ガス(代謝性アシドーシス), 尿蛋白, 腎エコー",probs:"#1 CKD G4(eGFR 22) #2 腎性貧血 #3 CKD-MBD #4 代謝性アシドーシス #5 高カリウム血症",course:"食事療法(蛋白制限0.6-0.8g/kg, 塩分6g未満, K制限)→腎性貧血治療(ESA/HIF-PHI)→CKD-MBD管理→アシドーシス補正→VA作製→腎代替療法選択支援",disc:"CKD保存期の包括的管理(貧血・MBD・アシドーシス・栄養), 腎代替療法の選択肢と意思決定支援, VA作製のタイミング",refs:["KDIGO. Kidney Int Suppl 2013;3:1","日本腎臓学会. CKD診療ガイドライン2023"]}},"g35":{"IgA腎症":{prof:"25歳男性, 検診で尿異常",cc:"無症候性血尿・蛋白尿",o:"検診で尿潜血・蛋白尿を指摘",p:"上気道感染後に肉眼的血尿(随伴性血尿)",q:"尿蛋白0.5-1.0g/日, 顕微鏡的血尿",r:"腎",s:"浮腫なし, 血圧正常, 腎機能正常",t:"検診異常→前医で経過観察→蛋白尿増加→腎生検目的で当院紹介",pe:"血圧, 浮腫の有無, 関節所見, 皮疹",tests:"尿定量(蛋白・Cr比), 尿沈渣(赤血球円柱), 血清IgA, 補体(C3/C4), 腎機能, 腎生検",probs:"#1 IgA腎症(Oxford分類: M_E_S_T_C_) #2 慢性糸球体腎炎",course:"腎生検→組織診断→重症度に応じた治療(RA系阻害薬, ステロイド, 扁摘パルス)→蛋白尿モニタリング",disc:"IgA腎症の組織学的評価(Oxford分類)と予後予測, 扁摘パルスの日本からのエビデンス",refs:["KDIGO. Kidney Int 2021;100:S1","Kawamura T. Clin Exp Nephrol 2014;18:481"]},"微小変化型ネフローゼ症候群":{prof:"20代男性, 急激な全身浮腫",cc:"全身浮腫, 体重増加",o:"〇週間前から急激に顔面・下肢浮腫が出現",p:"利尿薬で一時改善, 再貯留",q:"尿蛋白10g/日, 血清Alb 1.5g/dL, 高度浮腫",r:"全身(顔面・下肢・陰嚢)",s:"体重増加(10kg/2週), 腹部膨満(腹水), 泡沫尿",t:"急激な浮腫→前医で尿蛋白大量→Alb低値→ネフローゼ症候群→腎生検目的で当院紹介",pe:"高度浮腫(顔面・眼瞼・下肢・陰嚢), 腹水, 胸水, 血圧(正常〜低め)",tests:"尿蛋白定量, 血清Alb, 脂質(高LDL), 腎機能, 凝固(AT-III↓), 選択指数(SI), 腎生検(光顕正常, IF陰性, EM足突起消失)",probs:"#1 ネフローゼ症候群(微小変化型) #2 低アルブミン血症 #3 血栓リスク #4 脂質異常症",course:"ステロイド(PSL 1mg/kg)→2-4週で寛解→緩徐に漸減→再発時: ステロイド再投与 or 免疫抑制薬(CyA)→血栓予防",disc:"MCD/MCNSのステロイド反応性と予後, 頻回再発・ステロイド依存性への対応, 血栓症予防",refs:["Vivarelli M. Clin J Am Soc Nephrol 2017;12:332","Kidney Disease: Improving Global Outcomes. Kidney Int 2021;100:S1"]},"膜性腎症":{prof:"55歳男性, 緩徐に進行する浮腫",cc:"下肢浮腫, 泡沫尿",o:"〇カ月前から下肢浮腫と泡沫尿",p:"緩徐に進行, 安静で浮腫やや改善",q:"尿蛋白5.0g/日, 血清Alb 2.2g/dL",r:"両下肢",s:"体重増加, 倦怠感, 二次性の除外(悪性腫瘍・SLE・HBV)",t:"浮腫→前医でネフローゼ症候群→二次性除外→腎生検目的で当院紹介",pe:"両下肢浮腫, 腹水の有無, リンパ節腫脹(悪性腫瘍除外), 血圧",tests:"尿蛋白定量, 血清Alb, 抗PLA2R抗体, 補体(正常), 腎機能, CT(悪性腫瘍スクリーニング), HBV/HCV, ANA, 腎生検(IF: IgG+C3顆粒状)",probs:"#1 膜性腎症(原発性/二次性) #2 ネフローゼ症候群 #3 血栓リスク #4 悪性腫瘍除外",course:"抗PLA2R抗体確認→リスク層別化→低リスク: 支持療法(RA系阻害薬)6カ月→中高リスク: リツキシマブ or CNI→寛解判定",disc:"抗PLA2R抗体の診断・予後予測的意義, MENTOR/RI-CYCLO試験, 二次性膜性腎症のスクリーニング",refs:["Cattran DC. Kidney Int 2017;91:576","Fervenza FC. N Engl J Med 2019;381:36"]},"巣状分節性糸球体硬化症":{prof:"30代男性, 大量蛋白尿",cc:"全身浮腫, 泡沫尿",o:"〇カ月前から浮腫と泡沫尿が出現",p:"ステロイド治療への反応不良",q:"尿蛋白8.0g/日, 血清Alb 2.0g/dL, eGFR 65",r:"全身(浮腫)",s:"高度蛋白尿, 高血圧, 血尿(時に)",t:"浮腫→ネフローゼ症候群→ステロイド投与→反応不良→腎生検でFSGS→当院紹介",pe:"全身浮腫, 血圧上昇, 眼底(高血圧性変化)",tests:"尿蛋白定量, 血清Alb, 腎機能, 脂質, 腎生検(糸球体の分節性硬化, IFでIgM/C3), 二次性除外(HIV, 薬剤, 肥満)",probs:"#1 巣状分節性糸球体硬化症(原発性) #2 ステロイド抵抗性ネフローゼ症候群 #3 高血圧症",course:"ステロイド(PSL 1mg/kg, 16週以上)→抵抗性: CNI(CyA/TAC)追加→蛋白尿モニタリング→RA系阻害薬→CKD進行抑制",disc:"FSGSの組織分類(Columbia分類), ステロイド抵抗性への対応, 二次性FSGSの除外(肥満関連・適応性), 腎予後",refs:["D'Agati VD. N Engl J Med 2011;365:2398","Rosenberg AZ. Clin J Am Soc Nephrol 2017;12:502"]},"ループス腎炎":{prof:"30代女性, SLE治療中, 蛋白尿増加",cc:"蛋白尿増加, 下肢浮腫",o:"SLE診断後〇年, 〇カ月前から蛋白尿増加",p:"SLEの活動性と連動",q:"尿蛋白3.0g/日, 血尿あり, eGFR 55, 補体低下",r:"腎, 全身(SLE症状)",s:"蝶形紅斑, 関節痛, 脱毛, 口腔内潰瘍",t:"SLE増悪→蛋白尿・血尿増加→補体低下→腎生検目的で入院",pe:"浮腫, 蝶形紅斑, 関節腫脹, 口腔内潰瘍, 血圧上昇",tests:"尿蛋白定量, 尿沈渣(赤血球円柱), 補体(C3/C4↓, CH50↓), 抗dsDNA抗体↑, 血算, 腎機能, 腎生検(ISN/RPS分類)",probs:"#1 ループス腎炎(ISN/RPS Class_) #2 SLE活動期(SLEDAI_点) #3 低補体血症",course:"腎生検→Class判定→ClassIII/IV: mPSLパルス+MMF(or IV-CY)→維持療法(MMF+HCQ+低用量PSL)→寛解維持→再燃モニタリング",disc:"ループス腎炎のISN/RPS分類と治療選択, AURORA/BLISS-LN試験(belimumab+voclosporin), 寛解維持療法",refs:["Fanouriakis A. Ann Rheum Dis 2020;79:713","Rovin BH. N Engl J Med 2021;385:2507"]}},"g36":{"血液透析":{prof:"65歳男性, CKD G5(eGFR 6), 糖尿病性腎症",cc:"倦怠感, 嘔気, 食欲不振",o:"CKD進行, 〇週間前から尿毒症症状出現",p:"食事制限で一時的に症状軽減",q:"eGFR 6mL/min, BUN 95, Cr 8.5, K 6.0",r:"全身",s:"掻痒感, 息切れ, 下肢浮腫, 味覚異常",t:"CKD G4→G5進行→尿毒症症状→HD導入目的入院",pe:"体液過剰(浮腫, 肺ラ音), バスキュラーアクセス(AVF/AVG)評価, 貧血所見, 栄養状態",tests:"eGFR, BUN, Cr, K, Ca, P, PTH, Hb, Alb, 血液ガス, 心エコー, 胸部X線, シャント評価(エコー)",probs:"#1 末期腎不全(HD導入) #2 糖尿病性腎症 #3 尿毒症 #4 腎性貧血 #5 CKD-MBD",course:"バスキュラーアクセス評価→透析開始(不均衡症候群予防)→透析条件設定→ドライウェイト調整→維持透析移行→シャント管理教育",disc:"HD導入のタイミング(症状ベース), 不均衡症候群の予防, シャントの種類と管理, 適正透析量(Kt/V)",refs:["Daugirdas JT. Handbook of Dialysis 5th ed. 2015","日本透析医学会. 透析会誌 2013;46:1107"]},"腹膜透析":{prof:"55歳女性, CKD G5, 残腎機能あり",cc:"倦怠感, 浮腫増悪",o:"CKD進行, 腎代替療法としてPD選択",p:"PD導入で尿毒症症状改善",q:"eGFR 8mL/min, 残尿あり",r:"全身",s:"浮腫, 食欲低下, ADL自立",t:"CKD G5→腎代替療法選択→PD希望→PD catheter挿入→PD導入",pe:"腹部(PDカテーテル出口部), 体液量評価, 栄養状態, ADL評価",tests:"eGFR, 残腎機能(24h蓄尿), PET(腹膜平衡試験), Kt/V(週間), D/P Cr比, Alb, 排液性状",probs:"#1 末期腎不全(PD導入) #2 残腎機能評価 #3 腹膜機能評価",course:"PDカテーテル挿入→PD開始(段階的増量)→PET評価→処方最適化(CAPD/APD)→出口部ケア教育→腹膜炎予防指導→定期評価",disc:"PDの利点(残腎機能保持, QOL, 在宅), PETによる腹膜機能分類と処方, 腹膜炎の診断と治療, PD-HD併用療法",refs:["Li PK. Perit Dial Int 2016;36:481","日本透析医学会. 腹膜透析ガイドライン2019"]},"腎移植":{prof:"40代男性, ESKD, HD導入3年, 生体腎移植予定",cc:"腎代替療法の最適化(移植希望)",o:"HD導入〇年, 生体腎ドナー(配偶者)あり",p:"HD中は安定だがQOL改善を希望",q:"HD 3回/週, ドライウェイト安定",r:"全身",s:"透析による生活制限, 就労困難",t:"ESKD→HD→移植希望→ドナー評価→移植外科紹介",pe:"全身状態, 心血管リスク評価, 感染症スクリーニング, 悪性腫瘍スクリーニング",tests:"血液型, HLAタイピング, クロスマッチ, DSA(ドナー特異的抗体), 心臓精査, 悪性腫瘍スクリーニング, 感染症(CMV/EBV/HBV/HCV/HIV)",probs:"#1 末期腎不全(生体腎移植予定) #2 移植前評価 #3 免疫学的評価",course:"レシピエント・ドナー評価→免疫学的評価→術前管理→移植手術→免疫抑制療法(導入+維持)→拒絶反応モニタリング→長期フォロー",disc:"腎移植の適応と禁忌, 免疫抑制療法(TAC+MMF+PSL), 拒絶反応の分類と治療, 長期合併症(感染症・悪性腫瘍・CVD)",refs:["Kidney Disease: Improving Global Outcomes. Transplantation 2009;15:S1","日本移植学会. 腎移植臨床登録集計報告2022"]},"透析導入の判断":{prof:"70代女性, CKD G5(eGFR 7), 尿毒症症状",cc:"嘔気, 食欲不振, 全身倦怠感",o:"CKD緩徐に進行, 〇週間前から食欲低下が顕著",p:"食事制限強化で症状やや改善するも限界",q:"eGFR 7mL/min, BUN 85, K 5.8, HCO3 15",r:"全身",s:"掻痒感, 体重減少, 集中力低下, 浮腫",t:"CKD進行→尿毒症症状顕在化→腎代替療法の意思決定",pe:"体液量評価, 栄養状態(SGA), 認知機能, ADL評価, 家族の支援体制",tests:"eGFR推移, BUN, K, HCO3, Alb, Hb, PTH, 心エコー, 栄養評価, ADL評価",probs:"#1 末期腎不全(腎代替療法導入検討) #2 尿毒症 #3 意思決定支援",course:"腎代替療法の選択肢説明(HD/PD/移植/保存的腎臓療法)→患者・家族との意思決定共有(SDM)→選択に応じた準備→導入",disc:"透析導入の適応(症状ベースvs eGFRベース), IDEAL trial, 保存的腎臓療法(CKM)の選択肢, 高齢者の意思決定支援",refs:["Cooper BA. N Engl J Med 2010;363:609","Davison SN. Kidney Int 2015;87:502"]}},"g37":{"尿路感染症":{prof:"30代女性, 既往に膀胱炎の反復",cc:"頻尿, 排尿時痛, 残尿感",o:"〇日前から排尿時痛と頻尿",p:"排尿後にやや軽減",q:"頻尿(1日15回以上), 排尿時の灼熱痛",r:"下腹部, 尿道",s:"血尿(肉眼的), 発熱なし, 腰背部痛なし",t:"排尿時痛→頻尿増悪→前医受診",pe:"下腹部圧痛, CVA叩打痛なし(上部UTI除外), 体温正常",tests:"尿検査(WBC↑, 亜硝酸塩+), 尿培養, 血算(正常), CRP(正常〜軽度上昇)",probs:"#1 急性単純性膀胱炎 #2 反復性UTI",course:"経験的抗菌薬(LVFX 3日 or セファレキシン7日)→培養結果確認→再発予防指導(十分な飲水, 排尿習慣)",disc:"単純性vs複雑性UTIの鑑別, 耐性菌リスクに応じた抗菌薬選択, 反復性UTIの予防戦略",refs:["Gupta K. Clin Infect Dis 2011;52:e103","JAID/JSC感染症治療ガイドライン2019"]},"尿路結石":{prof:"45歳男性, 肥満, 高尿酸血症",cc:"右側腹部痛, 血尿",o:"突然発症の右側腹部痛(疝痛発作)",p:"鎮痛薬で軽減, 体動で増悪",q:"激痛, NRS 9/10, 間欠的〜持続性",r:"右側腹部→鼠径部に放散",s:"嘔気, 嘔吐, 肉眼的血尿",t:"突然の右側腹部痛→疝痛→前医で鎮痛→CT撮影→尿路結石診断",pe:"右CVA叩打痛, 腹部圧痛(側腹部), 腸蠕動音正常",tests:"腹部CT(結石の位置・サイズ), 尿検査(血尿), 尿pH, Ca/Cr比, 尿酸, 腎機能, 血清Ca",probs:"#1 尿路結石(右尿管結石, サイズ_mm) #2 水腎症(あれば) #3 高尿酸血症",course:"疼痛管理(NSAIDs)→自然排石待機(<10mm)→排石促進(飲水・α1遮断薬)→排石不能時: ESWL/TUL→結石分析→再発予防",disc:"尿路結石の画像診断(CT), サイズ別の治療方針, 結石成分別の再発予防(シュウ酸Ca・尿酸・リン酸Ca)",refs:["Assimos D. J Urol 2016;196:1153","日本泌尿器科学会. 尿路結石症診療ガイドライン2013"]},"低ナトリウム血症":{prof:"75歳女性, サイアザイド内服中",cc:"倦怠感, ふらつき, 嘔気",o:"サイアザイド開始〇週間後から倦怠感",p:"臥位で症状やや改善",q:"Na 118mEq/L, 血清浸透圧 255mOsm/kg",r:"全身(中枢神経症状)",s:"頭痛, 嘔気, 歩行困難, 痙攣なし",t:"サイアザイド開始→倦怠感出現→血液検査でNa低値→緊急入院",pe:"意識レベル, 神経学的評価, 体液量評価(脱水vs正常vs過剰), 浮腫の有無",tests:"血清Na, 血清浸透圧, 尿浸透圧, 尿Na, TSH, コルチゾール, 血糖, ADH(SIADH疑い時)",probs:"#1 低ナトリウム血症(重症, 急性/慢性) #2 サイアザイド関連 #3 SIADH(除外)",course:"原因検索(体液量評価+尿検査)→薬剤性: 原因薬中止→補正速度管理(8-10mEq/L/24h以下)→重症: 3%NaCl→Naモニタリング(4-6h毎)",disc:"低Na血症の診断アルゴリズム(体液量+浸透圧+尿Na), 補正速度とODS(浸透圧性脱髄症候群)のリスク, SIADHの診断",refs:["Spasovski G. Eur J Endocrinol 2014;170:G1","Verbalis JG. Am J Med 2013;126:S1"]},"高カリウム血症":{prof:"70代男性, CKD G4, ACE阻害薬+スピロノラクトン",cc:"筋力低下, 動悸",o:"前医の血液検査でK 6.8を指摘",p:"薬剤中止で改善傾向",q:"K 6.8mEq/L, 心電図変化あり",r:"全身(筋力低下), 心臓",s:"四肢脱力, しびれ, 嘔気",t:"定期検査でK高値→心電図変化→緊急対応",pe:"筋力評価, 心電図モニター, バイタル, 腱反射",tests:"K, 血液ガス, Cr, 心電図(テント状T波, QRS幅, P波消失), 血糖, 溶血確認",probs:"#1 高カリウム血症(重症, 心電図変化あり) #2 CKD G4 #3 薬剤性(ACE-I+MRA)",course:"緊急対応: グルコン酸Ca静注(心筋保護)→GI療法(インスリン+ブドウ糖)→ポリスチレンスルホン酸→原因薬中止→K制限食→慢性管理(ジルコニウムシクロケイ酸Na)",disc:"高K血症の緊急対応の優先順位(心筋保護→細胞内シフト→体外排泄), 心電図変化の重症度分類, 新規K吸着薬の役割",refs:["Palmer BF. N Engl J Med 2021;385:1981","Clase CM. Kidney Int 2020;97:42"]},"代謝性アシドーシス":{prof:"50代男性, 糖尿病, 意識障害",cc:"嘔気, 過呼吸, 意識混濁",o:"〇日前から嘔気, 過呼吸が出現",p:"増悪傾向",q:"pH 7.18, HCO3 8mEq/L, AG 28",r:"全身",s:"Kussmaul呼吸, アセトン臭(あれば), 腹痛",t:"嘔気→過呼吸→意識混濁→救急搬送",pe:"呼吸パターン(Kussmaul), 意識レベル, 脱水所見, アセトン臭, バイタル",tests:"血液ガス(pH, HCO3, pCO2), アニオンギャップ(AG), 補正AG, 血糖, ケトン体, 乳酸, BUN/Cr, 浸透圧ギャップ, 尿ケトン",probs:"#1 AG上昇型代謝性アシドーシス(DKA/乳酸アシドーシス/中毒) #2 原因疾患",course:"原因検索(AG上昇型: MUDPILES)→原因治療(DKA: インスリン+輸液, LA: 循環改善, 中毒: 拮抗薬)→重症時NaHCO3→ABGモニタリング",disc:"AG上昇型vs非AG上昇型の鑑別, Delta-Delta(ΔAG/ΔHCO3)による混合性酸塩基平衡障害の診断, 代償の評価",refs:["Kraut JA. N Engl J Med 2014;371:1434","Seifter JL. N Engl J Med 2014;371:1821"]},"代謝性アルカローシス":{prof:"60代女性, 嘔吐反復, 利尿薬使用中",cc:"倦怠感, 筋力低下, テタニー",o:"嘔吐反復〇日後から筋力低下",p:"嘔吐停止で改善傾向",q:"pH 7.52, HCO3 38mEq/L, K 2.5, Cl 82",r:"全身",s:"手指のしびれ, 筋攣縮, 脱力",t:"嘔吐反復→倦怠感・筋力低下→血液ガスでアルカローシス→入院",pe:"脱水所見, Chvostek徴候, Trousseau徴候, 筋力評価, バイタル",tests:"血液ガス(pH, HCO3, pCO2), 電解質(K↓, Cl↓), 尿Cl(<20: Cl反応性, >20: Cl抵抗性), 腎機能, Mg",probs:"#1 代謝性アルカローシス(Cl反応性: 嘔吐/利尿薬) #2 低カリウム血症 #3 低クロール血症",course:"原因除去(嘔吐治療, 利尿薬減量)→生食輸液(Cl補充)→K補正(KCl)→重症時: アセタゾラミド or 希塩酸→ABGモニタリング",disc:"Cl反応性(尿Cl<20)vsCl抵抗性(尿Cl>20)の鑑別, 維持因子の理解(Cl欠乏・K欠乏・有効循環血漿量低下), 補正の原則",refs:["Luke RG. N Engl J Med 2012;367:1441","Galla JH. Kidney Int 2000;58:498"]}},"g38":{"気管支喘息":{prof:"35歳女性, アレルギー体質",cc:"咳嗽, 喘鳴, 呼吸困難",o:"〇年前から間欠的な咳嗽・喘鳴, 今回〇日前から増悪",p:"夜間・早朝に増悪, β2刺激薬で軽減",q:"呼気性喘鳴, 呼吸困難(会話困難)",r:"胸部全体",s:"咳嗽(乾性→湿性), 起坐呼吸, 発熱なし",t:"間欠的喘息→感冒契機に急性増悪→前医でβ2吸入→改善不十分→当院受診",pe:"喘鳴(呼気性), 呼吸補助筋使用, SpO2, 呼吸数, 会話可否, PEF",tests:"SpO2, 血液ガス, 胸部X線, 呼吸機能検査(寛解後), FeNO, IgE, 好酸球",probs:"#1 気管支喘息急性増悪(重症度_) #2 アレルギー性鼻炎(合併あれば)",course:"急性期: SABA反復吸入→全身ステロイド→酸素→改善後ICS/LABA導入→ステップアップ治療→アクションプラン作成",disc:"喘息の急性増悪の重症度評価と段階的治療, 長期管理のステップ治療, Type2炎症",refs:["GINA. Global Strategy for Asthma 2023","Ichinose M. Allergol Int 2020;69:519"]},"COPD":{prof:"70代男性, 喫煙歴40 pack-years",cc:"労作時呼吸困難, 慢性咳嗽",o:"〇年前から労作時の息切れ, 今回〇日前から増悪",p:"安静で軽減, 労作で増悪, 感染契機に急性増悪",q:"mMRC 3→4, 喀痰増加・膿性化",r:"胸部",s:"喀痰増加(膿性), 発熱あり/なし, 喘鳴",t:"慢性的な労作時呼吸困難→感冒後に急性増悪→前医で改善不十分→当院紹介",pe:"樽状胸郭, 呼吸補助筋使用, 口すぼめ呼吸, 呼気延長, 肺野ラ音/喘鳴, SpO2",tests:"呼吸機能検査(FEV1/FVC<0.7), 胸部X線/CT, 血液ガス, CRP/喀痰培養, BNP",probs:"#1 COPD急性増悪(GOLD Stage_, Group_) #2 喫煙関連肺疾患 #3 低酸素血症",course:"急性期: SABA+SAMA→全身ステロイド→抗菌薬→酸素→安定後: LAMA/LABA→呼吸リハ→禁煙支援",disc:"COPD急性増悪の評価と治療, GOLDアセスメント, 吸入薬の選択, HOTの適応",refs:["GOLD. Global Strategy for COPD 2024","Ichinose M. Int J COPD 2021;16:2927"]},"気管支拡張症":{prof:"50代女性, 反復する下気道感染",cc:"慢性湿性咳嗽, 膿性痰",o:"〇年前から持続する湿性咳嗽と膿性痰",p:"感染時に増悪, 抗菌薬で一時改善",q:"大量膿性痰(1日30mL以上), 血痰あり",r:"両側下肺野(特に左下葉)",s:"労作時息切れ, 副鼻腔炎(合併あれば), 反復性肺炎の既往",t:"反復する気道感染→前医で抗菌薬反復投与→胸部CTで気管支拡張→当院紹介",pe:"両下肺のcoarse crackles, 喘鳴, ばち指(あれば), 副鼻腔所見",tests:"胸部HRCT(気管支拡張の確認, signet ring sign), 喀痰培養(常在菌・NTM・緑膿菌), 呼吸機能, 免疫グロブリン(IgG/IgA/IgM), CBCd, ABPA除外(IgE/好酸球)",probs:"#1 気管支拡張症 #2 反復性気道感染 #3 副鼻腔炎(合併あれば)",course:"喀痰培養→気道クリアランス(排痰理学療法, マクロライド少量長期)→感染増悪時: 抗菌薬(起因菌に応じて)→原因検索→喀血時の対応",disc:"気管支拡張症の原因検索(感染後・免疫不全・線毛機能・ABPA), マクロライド少量長期投与のエビデンス, 喀血管理",refs:["Polverino E. Eur Respir J 2017;50:1700629","Hill AT. Thorax 2019;74:1"]},"慢性気管支炎":{prof:"65歳男性, 喫煙歴30 pack-years",cc:"慢性咳嗽, 喀痰",o:"2年以上にわたり年間3カ月以上の咳嗽・喀痰",p:"喫煙時に増悪, 禁煙で軽減",q:"白色〜黄色痰, 朝方に多い",r:"胸部",s:"労作時息切れ(軽度), 喘鳴なし",t:"長年の咳嗽・喀痰→COPDとの鑑別→呼吸機能検査目的で当院受診",pe:"呼吸音(正常〜粗い), 呼気延長なし, 喘鳴なし, SpO2正常",tests:"呼吸機能検査(FEV1/FVC: COPD除外), 胸部CT(気管支壁肥厚), 喀痰培養, 血算, CRP",probs:"#1 慢性気管支炎 #2 喫煙関連気道疾患 #3 COPD合併の評価",course:"禁煙指導(最重要)→気道感染予防(ワクチン)→増悪時抗菌薬→COPD合併時: 吸入薬→呼吸リハ",disc:"慢性気管支炎の定義(臨床的定義), COPDとの関係, 禁煙の効果, 感染増悪の管理",refs:["Kim V. Chronic Obstr Pulm Dis 2016;3:541","GOLD. Global Strategy for COPD 2024"]},"細気管支炎":{prof:"60代女性, 関節リウマチ治療中",cc:"乾性咳嗽, 労作時呼吸困難",o:"〇カ月前から乾性咳嗽と労作時息切れ",p:"安静で軽減, 労作で増悪",q:"SpO2 95%→労作後90%, 吸気性squeaks",r:"胸部(びまん性)",s:"RA関連症状, 発熱なし",t:"RA治療中→咳嗽・息切れ出現→胸部CTでモザイクパターン→呼吸器内科紹介",pe:"吸気性squeaks/crackles, SpO2, 呼吸機能(閉塞性パターン), RA関節所見",tests:"胸部HRCT(モザイクパターン, air trapping, 小葉中心性粒状影), 呼吸機能(FEV1↓, 閉塞性), 血液ガス, RA関連検査, 薬剤歴確認",probs:"#1 細気管支炎(RA関連/薬剤性/感染後) #2 関節リウマチ #3 閉塞性換気障害",course:"原因検索(RA関連・薬剤性・感染後)→原因薬中止(あれば)→マクロライド少量長期→吸入気管支拡張薬→重症時ステロイド→呼吸リハ",disc:"細気管支炎の分類(閉塞性・びまん性汎), HRCT所見の特徴, RA関連細気管支炎の管理",refs:["Devakonda A. Chest 2010;138:803","Ryu JH. Am J Respir Crit Care Med 2003;168:1277"]}},"g39":{"市中肺炎":{prof:"68歳男性, 糖尿病",cc:"発熱, 咳嗽, 呼吸困難",o:"〇日前から発熱と湿性咳嗽",p:"解熱薬で一時的に解熱するが再燃",q:"体温38.5℃, 膿性痰, SpO2 93%",r:"右下肺野",s:"呼吸困難, 食欲低下, 全身倦怠感",t:"発熱・咳嗽→前医で胸部X線→右下肺野浸潤影→抗菌薬→改善不十分→当院紹介",pe:"呼吸数増加, 右下肺でcoarse crackles, 打診で濁音, SpO2低下",tests:"胸部X線/CT, 喀痰グラム染色・培養, 血液培養2セット, 尿中抗原, CRP, PCT, A-DROPスコア",probs:"#1 市中肺炎(A-DROP_点) #2 低酸素血症 #3 糖尿病",course:"重症度判定(A-DROP)→経験的抗菌薬→培養結果で最適化→3日後効果判定→de-escalation→退院基準確認",disc:"市中肺炎の重症度評価(A-DROP), エンピリック治療の選択根拠, de-escalation",refs:["Mandell LA. Clin Infect Dis 2007;44:S27","日本呼吸器学会. 成人肺炎診療ガイドライン2024"]},"院内肺炎":{prof:"75歳男性, 脳梗塞後リハビリ入院中",cc:"発熱, 膿性痰, SpO2低下",o:"入院〇日目に発熱と膿性痰が出現",p:"抗菌薬で改善傾向",q:"体温38.5℃, SpO2 91%(room air), 膿性痰増加",r:"右下肺野",s:"嚥下機能低下, 食欲低下, 倦怠感",t:"リハビリ入院中→発熱・SpO2低下→胸部X線で浸潤影→HAP診断",pe:"右下肺crackles, 呼吸数増加, SpO2低下, 嚥下機能評価",tests:"胸部X線/CT, 喀痰グラム染色・培養(耐性菌考慮), 血液培養, CRP, PCT, I-DROPスコア, 嚥下評価",probs:"#1 院内肺炎(I-DROP_点) #2 嚥下機能低下 #3 脳梗塞後(リハビリ中)",course:"重症度判定(I-DROP)→経験的抗菌薬(耐性菌カバー: TAZ/PIPC or MEPM)→培養結果でde-escalation→嚥下評価・リハ→誤嚥予防策",disc:"HAP/VAPの定義と原因菌の違い(耐性菌リスク), エンピリック治療の選択, 誤嚥性肺炎との重複",refs:["Kalil AC. Clin Infect Dis 2016;63:e61","日本呼吸器学会. 成人肺炎診療ガイドライン2024"]},"非定型肺炎":{prof:"25歳男性, 乾性咳嗽が遷延",cc:"乾性咳嗽, 発熱",o:"〇週間前から乾性咳嗽と微熱",p:"市販の咳止めで改善せず",q:"体温37.5℃, 頑固な乾性咳嗽, 全身状態は比較的良好",r:"胸部(びまん性)",s:"頭痛, 咽頭痛, 皮疹(あれば), 全身倦怠感",t:"乾性咳嗽→遷延→前医で抗菌薬(AMPC)無効→胸部X線でびまん性浸潤影→当院紹介",pe:"呼吸音(聴診所見は比較的軽度), SpO2(保たれていることが多い), 皮疹, 鼓膜(水疱性鼓膜炎)",tests:"胸部X線/CT(すりガラス影, 小葉中心性陰影), マイコプラズマ迅速抗原, LAMP法, 寒冷凝集素, CRP, 白血球(正常〜軽度上昇)",probs:"#1 非定型肺炎(マイコプラズマ/クラミジア/レジオネラ) #2 遷延性咳嗽",course:"細胞壁合成阻害薬無効→マクロライド(AZM or CAM)→無効時テトラサイクリン(MINO)→キノロン→7-14日投与→咳嗽フォロー",disc:"定型vs非定型肺炎の鑑別ポイント(日本呼吸器学会スコア), マクロライド耐性マイコプラズマの問題, レジオネラの重症化リスク",refs:["Mandell LA. Clin Infect Dis 2007;44:S27","Miyashita N. J Infect Chemother 2020;26:832"]},"肺結核":{prof:"35歳男性, 東南アジア出身, 来日2年",cc:"慢性咳嗽, 体重減少, 盗汗",o:"〇カ月前から咳嗽・喀痰が持続",p:"安静でも改善なし",q:"微熱持続, 3カ月で5kg体重減少",r:"右上肺野",s:"盗汗, 食欲低下, 血痰(あれば)",t:"慢性咳嗽→前医で胸部X線→右上肺野に空洞影→排菌疑いで当院紹介",pe:"栄養状態, 体温, 肺野聴診(上肺野のラ音), リンパ節腫脹",tests:"喀痰抗酸菌塗抹(3連痰), 喀痰培養(固形+液体), PCR(TB-PCR), IGRA(QFT/T-SPOT), 胸部CT(空洞・散布巣), HIV検査",probs:"#1 肺結核(塗抹陽性/陰性, 排菌あり/なし) #2 感染管理(隔離)",course:"排菌確認→陰圧個室隔離→標準治療(HREZ 2カ月→HR 4カ月)→接触者健診→DOTS→排菌停止確認→隔離解除",disc:"肺結核の診断アルゴリズム(塗抹・培養・PCR), 標準治療レジメンと薬剤感受性, 院内感染対策, 保健所への届出",refs:["WHO. Global TB Report 2023","日本結核・非結核性抗酸菌症学会. 結核診療ガイドライン改訂第3版2022"]},"非結核性抗酸菌症":{prof:"65歳女性, やせ型, 中葉舌区に気管支拡張",cc:"慢性咳嗽, 喀痰",o:"〇年前から慢性咳嗽, 健診CTで指摘",p:"緩徐に進行, 自覚症状は軽度",q:"少量の喀痰, 時に血痰",r:"右中葉・左舌区",s:"体重減少(軽度), 倦怠感",t:"健診CT異常→喀痰検査でMAC陽性→経過観察→陰影増悪→当院紹介",pe:"やせ型体型, 肺野聴診(中葉舌区), 脊柱変形(あれば)",tests:"喀痰抗酸菌塗抹・培養(3連痰), 菌種同定(MAC/M.kansasii/M.abscessus), 胸部HRCT(結節気管支拡張型/線維空洞型), 呼吸機能",probs:"#1 非結核性抗酸菌症(MAC症) #2 気管支拡張症",course:"ATS/IDSA診断基準確認→治療適応判断(進行例)→多剤併用(CAM+EB+RFP)→治療期間(排菌陰性化後12カ月)→効果判定(喀痰・画像)",disc:"NTM症の診断基準(画像+微生物+除外), MAC症の治療適応(watchful waiting vs治療開始), CAM耐性の問題",refs:["Daley CL. Clin Infect Dis 2020;71:e1","日本結核・非結核性抗酸菌症学会. NTM症診療マニュアル2023"]},"肺真菌症":{prof:"60代男性, 化学療法後の好中球減少",cc:"発熱, 咳嗽, 胸痛",o:"化学療法後〇日目, 好中球減少期に発熱持続",p:"広域抗菌薬で改善なし",q:"体温39℃, 好中球<100/μL, 胸部CTでhalo sign",r:"右上肺野",s:"血痰, 胸膜痛, 呼吸困難",t:"化学療法→好中球減少→発熱→抗菌薬無効→CT: halo sign→侵襲性肺アスペルギルス症疑い",pe:"発熱, 肺野聴診, 胸膜摩擦音, SpO2",tests:"胸部CT(halo sign, air crescent sign), β-Dグルカン, ガラクトマンナン抗原(血清+BAL), BAL(培養・細胞診), 血液培養",probs:"#1 侵襲性肺アスペルギルス症 #2 好中球減少症(化学療法後) #3 発熱性好中球減少症",course:"アゾール系抗真菌薬(VRCZ)→効果判定(画像+バイオマーカー)→救援療法(L-AMB)→好中球回復まで継続→二次予防",disc:"侵襲性肺アスペルギルス症の診断(EORTC/MSG基準), 早期治療の重要性, 慢性肺アスペルギルス症との鑑別",refs:["Patterson TF. Clin Infect Dis 2016;63:e1","Donnelly JP. Clin Infect Dis 2020;71:1367"]},"ニューモシスチス肺炎":{prof:"45歳男性, HIV陽性(CD4<200), 未治療",cc:"亜急性の呼吸困難, 乾性咳嗽",o:"〇週間前から労作時息切れが緩徐に進行",p:"安静で軽減, 労作で増悪(進行性)",q:"SpO2 88%(room air), A-aDO2開大",r:"両側肺野(びまん性)",s:"発熱(微熱〜高熱), 体重減少, 口腔カンジダ",t:"呼吸困難→前医でSpO2低下→胸部CTですりガラス影→HIV検査陽性→当院紹介",pe:"頻呼吸, 両肺聴診(正常〜fine crackles), SpO2低下, 口腔カンジダ, 栄養状態",tests:"胸部CT(びまん性すりガラス影), β-Dグルカン↑, 喀痰・BALのPCR・Grocott染色, CD4数, HIV-RNA, LDH↑, 血液ガス(A-aDO2)",probs:"#1 ニューモシスチス肺炎 #2 HIV/AIDS(CD4<200) #3 低酸素血症",course:"ST合剤(TMP-SMX 高用量, 21日間)→中等症以上: PSL併用(PaO2<70)→HIV治療(ART)開始タイミング→二次予防(ST合剤)→CD4>200で中止",disc:"PCP診断のアプローチ(β-Dグルカン+CT+BAL), ステロイド併用の適応, non-HIV PCPの特徴, ART開始のタイミング(IRIS予防)",refs:["Salzer HJ. Clin Microbiol Rev 2018;31:e00019-17","Huang L. Proc Am Thorac Soc 2006;3:655"]}},"g40":{"特発性肺線維症（IPF）":{prof:"70代男性, 喫煙歴あり",cc:"労作時呼吸困難, 乾性咳嗽",o:"〇年前から緩徐に進行する労作時息切れ",p:"安静で軽減, 労作で増悪(進行性)",q:"mMRC 3, SpO2 94%→労作後85%",r:"両下肺野",s:"乾性咳嗽(頑固), ばち指, 体重減少",t:"労作時息切れ→健診CTで肺線維化→呼吸器内科紹介→UIPパターン確認",pe:"両下肺のfine crackles(velcro ラ音), ばち指, SpO2(労作後低下), チアノーゼ",tests:"胸部HRCT(UIPパターン: 蜂巣肺, 牽引性気管支拡張, 基底部・胸膜直下優位), 呼吸機能(%FVC, %DLco↓), 6MWT, KL-6, SP-D, 血液ガス",probs:"#1 特発性肺線維症(IPF) #2 慢性呼吸不全 #3 急性増悪リスク",course:"抗線維化薬(ニンテダニブ or ピルフェニドン)→呼吸リハ→HOT導入→急性増悪の予防・対応→肺移植適応評価→緩和ケア",disc:"IPFの診断基準(UIPパターンの画像的特徴), 抗線維化薬のエビデンス(INPULSIS/ASCEND), 急性増悪の管理, 予後予測(GAP index)",refs:["Raghu G. Am J Respir Crit Care Med 2022;205:e18","Richeldi L. N Engl J Med 2014;370:2071"]},"過敏性肺炎":{prof:"55歳女性, 鳥飼育(セキセイインコ)",cc:"咳嗽, 呼吸困難, 発熱",o:"鳥飼育開始〇カ月後から間欠的な咳嗽・発熱",p:"帰宅で増悪, 外出・入院で改善",q:"帰宅4-8時間後に発熱38℃台, 咳嗽",r:"両肺野(びまん性)",s:"倦怠感, 労作時息切れ, 関節痛なし",t:"鳥飼育開始→間欠的な症状→前医でCT異常→環境因子との関連指摘→当院紹介",pe:"両肺fine crackles, SpO2, squeaks(あれば), 発熱パターンと環境の関連",tests:"胸部HRCT(すりガラス影, モザイクパターン, 小葉中心性粒状影), 抗原特異的IgG抗体(鳥関連抗原), KL-6, SP-D, BAL(リンパ球増多, CD4/CD8↓), 呼吸機能, 環境誘発試験",probs:"#1 過敏性肺炎(鳥関連, 急性/亜急性/慢性) #2 抗原回避の必要性",course:"抗原回避(最重要: 飼育中止)→急性期: ステロイド(中等量)→抗原回避で改善確認→慢性型: 線維化評価→線維化進行時: 抗線維化薬検討",disc:"過敏性肺炎の新分類(ATS/JRS 2020: 線維化型vs非線維化型), 抗原同定と回避の重要性, 慢性型のIPFとの鑑別",refs:["Raghu G. Am J Respir Crit Care Med 2020;202:e36","Selman M. Lancet 2012;380:680"]},"膠原病関連ILD":{prof:"50代女性, 関節リウマチ, MTX内服中",cc:"乾性咳嗽, 労作時息切れ(新規)",o:"RA治療中, 〇カ月前から乾性咳嗽と息切れ",p:"労作で増悪, 安静で軽減",q:"SpO2 93%, %FVC 65%, %DLco 55%",r:"両下肺野",s:"RA関節症状, Raynaud現象, 皮膚所見",t:"RA外来中→咳嗽・息切れ出現→CTで間質性陰影→呼吸器内科紹介",pe:"両下肺fine crackles, 関節所見(RA), 皮膚所見, ばち指",tests:"胸部HRCT(UIP/NSIPパターン), 呼吸機能(%FVC, %DLco), KL-6, SP-D, RF, 抗CCP抗体, ANA, 筋炎関連抗体(抗ARS, 抗MDA5), BAL",probs:"#1 膠原病関連間質性肺疾患(RA-ILD) #2 薬剤性肺障害の除外(MTX) #3 関節リウマチ",course:"薬剤性除外(MTX中止・経過観察)→ILDの画像パターン評価→進行性: 免疫抑制療法(MMF or CY)→抗線維化薬(進行性線維化)→呼吸リハ→HOT",disc:"CTD-ILDの画像パターンと予後(UIPvsNSIP), 進行性線維化型ILDの概念と治療(INBUILD試験), MTX肺障害の鑑別",refs:["Flaherty KR. N Engl J Med 2019;381:1718","Fischer A. Eur Respir J 2015;46:976"]},"サルコイドーシス":{prof:"35歳女性, 健診でBHL指摘",cc:"乾性咳嗽, 結節性紅斑, 関節痛",o:"健診で両側肺門リンパ節腫脹(BHL)指摘, 〇カ月前から咳嗽",p:"自然経過で改善することあり",q:"微熱, 咳嗽, 結節性紅斑",r:"両側肺門, 全身(多臓器)",s:"眼症状(ぶどう膜炎), 皮疹, 関節痛, 倦怠感",t:"健診異常→BHL確認→精査目的で当院紹介",pe:"結節性紅斑, 皮疹(苔癬状, 瘢痕上), ぶどう膜炎(眼科), リンパ節腫脹, 肝脾腫",tests:"胸部CT(BHL, 肺野結節影), ACE, リゾチーム, 可溶性IL-2R, 血清Ca, 尿Ca, 眼科(ぶどう膜炎), ECG/ホルター(心サルコイドーシス), ガリウムシンチ/FDG-PET, 気管支鏡(BAL: CD4/CD8↑, TBLB)",probs:"#1 サルコイドーシス(病期_) #2 ぶどう膜炎(あれば) #3 心サルコイドーシス除外",course:"軽症: 経過観察→臓器障害あり: ステロイド→難治性: MTX/AZA→心サルコイドーシス: ステロイド+不整脈管理→定期臓器評価",disc:"サルコイドーシスの診断基準(組織診断+臨床所見), 心サルコイドーシスのスクリーニングの重要性, ステロイド治療の適応",refs:["Crouser ED. Am J Respir Crit Care Med 2020;201:e26","Statement on Sarcoidosis. Am J Respir Crit Care Med 1999;160:736"]},"薬剤性肺障害":{prof:"60代男性, 肺癌に対しニボルマブ投与中",cc:"乾性咳嗽, 呼吸困難(新規)",o:"ニボルマブ〇コース目, 〇週間前から咳嗽・息切れ",p:"増悪傾向",q:"SpO2 90%, 呼吸困難感増強",r:"両肺野(びまん性)",s:"発熱(あれば), 倦怠感, 皮疹(irAE)",t:"ICI投与中→咳嗽・SpO2低下→胸部CT: 新規間質影→薬剤性肺障害疑い",pe:"両肺fine crackles, SpO2低下, 呼吸数増加",tests:"胸部CT(新規GGO/浸潤影, パターン評価: OP/NSIP/DAD), SpO2, 呼吸機能, KL-6, SP-D, LDH, CRP, 感染症除外(喀痰培養・β-Dグルカン・CMV), BAL",probs:"#1 薬剤性肺障害(ICI関連肺臓炎, Grade_) #2 肺癌(原疾患) #3 感染症の除外",course:"被疑薬中止(ICI)→Grade分類→Grade1: 経過観察→Grade2: PSL 1mg/kg→Grade3-4: mPSLパルス→感染症除外→ICI再開可否判断",disc:"薬剤性肺障害のCTパターン分類, ICI関連肺臓炎のGrade分類と治療, 因果関係の評価(Naranjoスコア), 被疑薬の再投与判断",refs:["Camus P. Drug Safety 2004;27:1161","Naidoo J. J Clin Oncol 2017;35:709"]}},"g41":{"胸水（漏出性・滲出性）":{prof:"70代男性, 心不全, 片側胸水増量",cc:"呼吸困難, 体動時息切れ",o:"〇日前から呼吸困難が増悪",p:"座位で軽減, 臥位で増悪",q:"右胸水大量, SpO2 92%",r:"右胸部",s:"下肢浮腫, 起坐呼吸, 咳嗽",t:"心不全管理中→右胸水増量→利尿薬増量でも改善不十分→胸腔穿刺検討",pe:"右肺下部で呼吸音減弱, 打診で濁音, 声音振盪減弱, 下肢浮腫",tests:"胸部X線/CT, 胸腔穿刺(Light基準: 蛋白, LDH, 血清との比), 胸水細胞診, 胸水培養, 胸水ADA, pH, Glu, BNP(血清), 心エコー",probs:"#1 胸水貯留(漏出性: 心不全/滲出性: 悪性/感染) #2 鑑別診断 #3 基礎疾患",course:"胸腔穿刺→Light基準で分類→漏出性: 原疾患治療(利尿薬等)→滲出性: 原因精査(悪性腫瘍・結核・感染)→大量胸水: 胸腔ドレナージ→再貯留: 胸膜癒着術検討",disc:"Light基準による漏出性vs滲出性の分類, 滲出性胸水の鑑別(悪性・結核・膿胸・膠原病), 胸腔穿刺の適応と手技",refs:["Light RW. N Engl J Med 2002;346:1971","McGrath EE. Eur J Intern Med 2011;22:9"]},"自然気胸":{prof:"20代男性, 長身やせ型, 喫煙あり",cc:"突然の胸痛, 呼吸困難",o:"安静時に突然発症した右胸痛と息切れ",p:"安静で呼吸困難やや軽減",q:"右胸痛, SpO2 96%",r:"右胸部",s:"乾性咳嗽, 頸部皮下気腫(あれば)",t:"突然の胸痛→前医で胸部X線→右気胸→当院紹介",pe:"右呼吸音減弱, 打診で鼓音, 声音振盪減弱, 皮下気腫の有無, 気管偏位の有無",tests:"胸部X線(虚脱率評価), 胸部CT(ブラ確認), SpO2, 血液ガス(重症時)",probs:"#1 右自然気胸(原発性, 虚脱率_%/軽度・中等度・高度) #2 喫煙歴",course:"軽度(虚脱<15-20%): 安静・経過観察→中等度以上: 胸腔ドレナージ→air leak持続: 手術(VATS)→再発予防指導(禁煙, ブラ切除)",disc:"自然気胸の虚脱率評価と治療方針, 緊張性気胸の認識と緊急対応, 再発リスクと手術適応, 航空旅行・ダイビングの指導",refs:["MacDuff A. Thorax 2010;65:ii18","Tschopp JM. Eur Respir J 2015;46:321"]},"膿胸":{prof:"65歳男性, 糖尿病, 肺炎後",cc:"発熱遷延, 胸痛, 呼吸困難",o:"肺炎治療後〇日目, 発熱が再燃",p:"抗菌薬で改善不十分",q:"体温38.5℃, 右胸水増量, 膿性胸水",r:"右胸部",s:"倦怠感, 食欲低下, 体重減少",t:"肺炎治療→解熱不十分→CT: 被包化胸水→胸腔穿刺で膿性→膿胸診断",pe:"右肺下部呼吸音減弱, 打診濁音, 発熱持続, 炎症遷延",tests:"胸部CT(被包化胸水, 壁肥厚, split pleura sign), 胸腔穿刺(肉眼膿性, pH<7.2, Glu<60, LDH>1000), 胸水培養・グラム染色, 血液培養",probs:"#1 膿胸(肺炎随伴性) #2 糖尿病(感染リスク) #3 敗血症の評価",course:"胸腔ドレナージ→抗菌薬(嫌気性菌カバー)→ドレナージ不十分: tPA+DNase注入/VATSデブリドマン→長期抗菌薬→栄養管理",disc:"随伴性胸水から膿胸への進展(Light分類Stage), 胸腔ドレナージの適応(pH<7.2), 外科的介入のタイミング",refs:["Davies HE. N Engl J Med 2011;365:518","Rahman NM. N Engl J Med 2011;365:518"]},"中皮腫":{prof:"70代男性, アスベスト暴露歴(建設業)",cc:"胸痛, 呼吸困難, 胸水貯留",o:"〇カ月前から右胸痛と息切れ",p:"緩徐に増悪, 鎮痛薬で部分的に軽減",q:"持続性の鈍痛, 大量胸水",r:"右胸部",s:"体重減少, 食欲低下, 倦怠感",t:"胸痛→胸水→胸腔穿刺で悪性疑い→胸膜生検→中皮腫診断",pe:"右呼吸音減弱, 打診濁音, 胸壁の腫瘤(進行例), 体重減少",tests:"胸部CT(胸膜肥厚, 胸水), 胸腔穿刺(細胞診), 胸腔鏡下胸膜生検(確定診断), 免疫染色(calretinin+, WT-1+, CEA-), PET-CT, 呼吸機能",probs:"#1 悪性胸膜中皮腫(組織型: 上皮型/二相型/肉腫型, 病期_) #2 アスベスト暴露歴 #3 大量胸水",course:"病期評価→上皮型限局例: 集学的治療(P/D+化学療法)→進行例: 化学療法(CDDP+PEM)→免疫チェックポイント阻害薬(nivo+ipi)→胸水管理→緩和ケア→労災申請支援",disc:"中皮腫の診断(胸膜生検の重要性), 組織型と予後, CheckMate743試験(nivo+ipi), アスベスト関連の労災・石綿健康被害救済制度",refs:["Baas P. Lancet 2021;397:375","Scherpereel A. Lancet Oncol 2020;21:1561"]},"縦隔腫瘍":{prof:"30代男性, 健診で縦隔腫瘤指摘",cc:"無症候(健診発見), または胸部圧迫感",o:"健診の胸部X線で縦隔腫瘤影を指摘",p:"自覚症状なし(多い), 大きい場合は圧迫症状",q:"前縦隔腫瘤",r:"前縦隔",s:"重症筋無力症症状(あれば: 眼瞼下垂, 複視), 上大静脈症候群(顔面浮腫)",t:"健診異常→胸部CT: 前縦隔腫瘤→精査目的で当院紹介",pe:"眼瞼下垂, 顔面浮腫(SVC症候群), 頸部リンパ節, 皮膚所見(胚細胞腫瘍)",tests:"胸部造影CT(区画・性状), MRI, PET-CT, 腫瘍マーカー(AFP, β-hCG, LDH: 胚細胞腫瘍, 抗AChR抗体: 胸腺腫), 生検(CTガイド下/縦隔鏡)",probs:"#1 縦隔腫瘍(前縦隔: 胸腺腫/悪性リンパ腫/胚細胞腫瘍/甲状腺腫) #2 区画別鑑別 #3 合併症評価",course:"区画・画像所見・マーカーで鑑別→胸腺腫: 手術(±放射線)→悪性リンパ腫: 化学療法→胚細胞腫瘍: BEP→重症筋無力症合併: 神経内科連携",disc:"縦隔腫瘍の区画別鑑別(4Ts: Thymoma, Teratoma, Thyroid, Terrible lymphoma), 胸腺腫と重症筋無力症の関連, 画像所見からのアプローチ",refs:["Carter BW. Radiographics 2014;34:1452","Detterbeck FC. J Thorac Oncol 2014;9:S65"]}},"g42":{"肺高血圧症":{prof:"40代女性, 労作時呼吸困難(進行性)",cc:"労作時呼吸困難, 失神",o:"〇年前から労作時息切れ, 〇カ月前から増悪",p:"安静で軽減, 労作で増悪(WHO-FC III)",q:"6MWD 320m, SpO2労作後80%",r:"胸部",s:"下肢浮腫, 胸痛(労作時), 失神(労作時)",t:"労作時息切れ→前医で心エコー→推定PASP高値→右心カテーテル目的で当院紹介",pe:"II音肺動脈成分亢進, 三尖弁逆流雑音, 頸静脈怒張, 肝腫大, 下肢浮腫, チアノーゼ",tests:"心エコー(推定PASP, 右室拡大, TAPSE↓), 右心カテーテル(mPAP≥20mmHg, PAWP≤15), BNP, 6MWT, 呼吸機能, 換気血流シンチ(CTEPH除外), 造影CT, 自己抗体(SScスクリーニング)",probs:"#1 肺動脈性肺高血圧症(PAH, WHO-FC_, Nice分類Group_) #2 右心不全 #3 原因精査",course:"右心カテーテルで確定→Group分類→PAH: 肺血管拡張薬(ERA+PDE5i+PGI2, upfront combination)→利尿薬→抗凝固→反応不良: 肺移植検討",disc:"肺高血圧症のNice分類と右心カテーテルの重要性, PAHの初期併用療法(AMBITION trial), CTEPHの手術適応",refs:["Humbert M. Eur Heart J 2022;43:3618","Galiè N. Eur Respir J 2015;46:903"]},"肺塞栓症":{prof:"55歳女性, 下肢骨折後ギプス固定中",cc:"突然の呼吸困難, 胸痛",o:"〇日前, 安静時に突然発症した呼吸困難",p:"安静でも改善なし",q:"SpO2 88%, 頻呼吸, 頻脈",r:"胸部(胸膜痛)",s:"頻脈, 冷汗, 失神(あれば), 下肢腫脹",t:"安静中に突然の呼吸困難→頻脈→前医でD-dimer高値→造影CT→PE確認→当院搬送",pe:"頻脈, 頻呼吸, 低血圧(ショック時), 頸静脈怒張, 下肢浮腫(DVT), 下肢圧痛(Homans徴候)",tests:"造影CT(充填欠損), D-dimer, 血液ガス(低O2, 低CO2), 心エコー(右室拡大, McConnell sign), BNP, トロポニン, 下肢静脈エコー(DVT)",probs:"#1 急性肺塞栓症(重症度: 大量/亜大量/非大量) #2 深部静脈血栓症 #3 骨折後ギプス固定(リスク因子)",course:"重症度評価(sPESI/血行動態)→抗凝固療法(ヘパリン→DOAC)→大量PE: 血栓溶解療法(tPA)→カテーテル治療→IVCフィルター(適応あれば)→長期抗凝固(DOAC 3-6カ月以上)",disc:"PEの重症度分類とリスク層別化(ESCガイドライン), 抗凝固療法の選択とDOACの役割, 血栓溶解療法の適応, DVT予防",refs:["Konstantinides SV. Eur Heart J 2020;41:543","Kearon C. Chest 2016;149:315"]},"ARDS":{prof:"55歳男性, 重症肺炎, ICU管理中",cc:"急速に進行する低酸素血症",o:"肺炎発症〇日後に急速に呼吸状態悪化",p:"酸素投与で改善不十分, 人工呼吸器管理",q:"P/F比 85, FiO2 0.8, PEEP 12",r:"両側肺野(びまん性)",s:"両側浸潤影, 頻呼吸, 人工呼吸器依存",t:"重症肺炎→急速な酸素化悪化→挿管→Berlin定義でARDS診断",pe:"両肺湿性ラ音, 呼吸数(自発呼吸時), SpO2/FiO2, 人工呼吸器設定確認",tests:"P/F比, 胸部X線(両側浸潤影), 血液ガス, BNP(心原性肺水腫除外), 感染源検索(培養), CT(びまん性GGO/consolidation)",probs:"#1 ARDS(Berlin定義: 重症, P/F<100) #2 重症肺炎(原因) #3 多臓器不全リスク",course:"肺保護換気(TV 6mL/kg, Pplat<30)→適切なPEEP→腹臥位療法(16h/日)→筋弛緩薬(48h)→conservative fluid管理→離脱困難時: ECMO検討",disc:"Berlin定義によるARDSの診断と重症度分類, 肺保護換気戦略のエビデンス(ARDSNet), 腹臥位療法(PROSEVA), ECMOの適応(EOLIA)",refs:["Fan E. JAMA 2018;319:698","Guérin C. N Engl J Med 2013;368:2159"]},"急性呼吸不全":{prof:"70代男性, COPDベース, 肺炎合併",cc:"呼吸困難, SpO2低下",o:"〇日前から咳嗽・喀痰, 本日急激にSpO2低下",p:"酸素投与で一時改善",q:"SpO2 82%(room air), 呼吸数30回/分",r:"胸部",s:"頻呼吸, 起坐呼吸, 意識レベル低下(CO2ナルコーシス懸念)",t:"COPD増悪→肺炎合併→急速に呼吸状態悪化→救急搬送",pe:"呼吸様式(補助筋使用, 鼻翼呼吸), SpO2, 両肺聴診, 意識レベル(CO2ナルコーシス), チアノーゼ",tests:"血液ガス(PaO2, PaCO2, pH, A-aDO2), SpO2, 胸部X線, 血算, CRP, BNP, 乳酸",probs:"#1 急性呼吸不全(I型/II型) #2 COPD急性増悪 #3 肺炎",course:"酸素投与(低流量から, CO2ナルコーシス注意)→NPPV(II型呼吸不全)→原因治療(抗菌薬等)→挿管基準の評価→改善後: 離脱・原疾患治療",disc:"I型vsII型呼吸不全の鑑別と治療戦略, A-aDO2による病態評価, NPPVの適応と限界, 酸素療法の注意点(COPD患者)",refs:["Davidson AC. Thorax 2016;71:ii1","植田育也. 日呼吸会誌 2010;48:455"]},"慢性呼吸不全":{prof:"75歳男性, COPD(GOLD IV), 在宅酸素療法中",cc:"労作時呼吸困難増悪, HOT流量不足感",o:"COPD進行, 〇カ月前からHOT下でも息切れ増強",p:"安静でもSpO2低下, 労作で著明低下",q:"安静時PaO2 55mmHg(O2 2L), PaCO2 52mmHg",r:"全身",s:"労作耐容能低下, 右心不全症状(浮腫), 食欲低下, 体重減少(呼吸筋消耗)",t:"COPD→HOT導入→緩徐に悪化→HOT流量調整→入院精査",pe:"樽状胸郭, 呼吸補助筋使用, SpO2(安静時+労作時), チアノーゼ, 下肢浮腫, 体重・栄養状態",tests:"血液ガス(PaO2, PaCO2), SpO2(安静+労作+睡眠時), 呼吸機能, 6MWT, 胸部CT, 心エコー(肺性心), BNP, 栄養評価",probs:"#1 慢性呼吸不全(COPD) #2 在宅酸素療法管理 #3 肺性心 #4 呼吸筋消耗(サルコペニア)",course:"HOT流量再調整→NPPV導入評価(慢性II型)→呼吸リハビリテーション→栄養療法→増悪予防(ワクチン)→ACPの導入",disc:"HOTの適応基準と効果(NOTT/MRC trial), 慢性II型呼吸不全へのNPPV(HOT-HMV trial), 呼吸リハの意義, ACP",refs:["Cranston JM. Cochrane Database Syst Rev 2005;CD001744","Murphy PB. JAMA 2017;317:2177"]},"睡眠時無呼吸症候群":{prof:"50代男性, 肥満(BMI 32), 日中の過度な眠気",cc:"いびき, 日中の眠気, 起床時頭痛",o:"〇年前から配偶者にいびきと無呼吸を指摘",p:"側臥位で軽減, 飲酒・仰臥位で増悪",q:"AHI 35/h(重症), ESS 15点",r:"上気道",s:"夜間頻尿, 集中力低下, 起床時の口渇, 高血圧(治療抵抗性)",t:"いびき+眠気→前医で簡易検査→AHI高値→PSG目的で当院紹介",pe:"BMI, 頸囲(>42cm), Mallampati分類, 扁桃肥大, 小顎, 血圧",tests:"終夜ポリソムノグラフィ(PSG: AHI, 最低SpO2, arousal index), 簡易検査(RDI), ABG, 甲状腺機能, 心電図, 心エコー",probs:"#1 閉塞性睡眠時無呼吸症候群(重症, AHI_) #2 肥満症 #3 治療抵抗性高血圧",course:"CPAP導入(AHI≥20)→CPAP圧設定・アドヒアランス管理→減量指導→口腔内装置(軽症-中等症)→耳鼻科的手術(適応あれば)→合併症管理",disc:"OSAの診断基準と重症度分類, CPAPのエビデンスと長期アドヒアランス, 心血管リスクとの関連, 運転リスクの評価",refs:["Benjafield AV. Lancet Respir Med 2019;7:687","日本呼吸器学会. 睡眠時無呼吸症候群(SAS)の診療ガイドライン2020"]}},"g43":{"肺癌（腺癌）":{prof:"65歳女性, 非喫煙者, 健診CT異常",cc:"無症候(健診発見)",o:"健診CTで右下葉にGGN→充実性結節指摘",p:"緩徐に増大",q:"2.5cmの充実性結節, SUVmax 8.5",r:"右下葉",s:"咳嗽なし, 体重減少なし, 喀血なし",t:"健診CT異常→経過観察で増大→PET-CT: 集積→気管支鏡で腺癌確定→staging",pe:"呼吸音正常, リンパ節腫脹なし, ばち指なし",tests:"胸部CT(結節の性状), PET-CT, 気管支鏡(生検, EBUS-TBNA), 遺伝子検査(EGFR, ALK, ROS1, PD-L1), 頭部MRI, 骨シンチ, 呼吸機能",probs:"#1 肺腺癌(cT_N_M_, cStage_) #2 ドライバー遺伝子変異の評価 #3 手術適応評価",course:"ステージング→早期: 手術(区域/葉切除+リンパ節郭清)→術後病理→StageII-III: 術後補助化学療法(±免疫療法)→進行期: ドライバー変異に応じた分子標的薬 or 免疫療法+化学療法",disc:"肺腺癌のドライバー遺伝子(EGFR/ALK/ROS1/BRAF/MET/RET/KRAS)と個別化治療, PD-L1発現と免疫療法, 術後補助療法のエビデンス",refs:["Ettinger DS. J Natl Compr Canc Netw 2022;20:497","Planchard D. Ann Oncol 2018;29:iv192"]},"肺癌（扁平上皮癌）":{prof:"70代男性, 喫煙歴50 pack-years",cc:"血痰, 咳嗽",o:"〇カ月前から血痰が出現",p:"増悪傾向",q:"血痰反復, 咳嗽増強",r:"右肺門部",s:"体重減少, 嗄声(反回神経浸潤あれば), 胸痛",t:"血痰→前医で胸部CT: 肺門部腫瘤→気管支鏡で扁平上皮癌→staging目的で当院紹介",pe:"呼吸音(閉塞所見), 嗄声, リンパ節腫脹(鎖骨上), ばち指",tests:"胸部CT, PET-CT, 気管支鏡(生検・洗浄), PD-L1発現, 頭部MRI, 骨シンチ, 呼吸機能, 血清SCC/CYFRA",probs:"#1 肺扁平上皮癌(cT_N_M_, cStage_) #2 喫煙関連疾患 #3 随伴するCOPD",course:"ステージング→限局期: 手術 or 放射線化学療法(CDDP+DTX)→進行期: 化学療法+免疫療法(PD-L1に応じてpembrolizumab)→BSC",disc:"扁平上皮癌の特徴(中枢型, ドライバー変異少ない), PD-L1高発現の頻度と免疫療法の効果(KEYNOTE-024/407), 放射線化学療法の適応",refs:["Ettinger DS. J Natl Compr Canc Netw 2022;20:497","Reck M. N Engl J Med 2016;375:1823"]},"肺癌（小細胞癌）":{prof:"65歳男性, 重喫煙者, 急速に増大する肺腫瘤",cc:"咳嗽, 呼吸困難, 体重減少",o:"〇カ月前から咳嗽・息切れが急速に増悪",p:"急速に進行",q:"3カ月で10kg体重減少, 大量の縦隔リンパ節転移",r:"左肺門〜縦隔",s:"SVC症候群(顔面浮腫), SIADH(低Na), 副腎皮質刺激ホルモン産生(クッシング)",t:"急速な咳嗽・体重減少→CT: 肺門部腫瘤+大量リンパ節転移→気管支鏡: 小細胞癌→staging",pe:"SVC症候群(顔面浮腫・頸部静脈怒張), リンパ節腫脹, 肝腫大(転移), クッシング徴候(あれば)",tests:"胸部CT, PET-CT, 頭部MRI(脳転移), 骨シンチ, 気管支鏡(生検), NSE, ProGRP, 電解質(SIADH: 低Na)",probs:"#1 小細胞肺癌(限局型/進展型) #2 傍腫瘍症候群(SIADH/Lambert-Eaton等) #3 重喫煙歴",course:"限局型: 化学放射線療法(CDDP+VP-16+放射線)→PCI(予防的全脳照射)→進展型: 化学療法+免疫療法(CBDCA+VP-16+atezolizumab)→BSC",disc:"小細胞肺癌のLD/ED分類と治療戦略, IMpower133/CASPIAN(免疫療法の追加), PCI/PCIの適応, 傍腫瘍症候群",refs:["Rudin CM. J Clin Oncol 2021;39:619","Horn L. N Engl J Med 2018;379:2220"]},"肺転移":{prof:"55歳女性, 大腸癌術後3年, 定期CT",cc:"無症候(フォローCTで発見)",o:"大腸癌術後フォローCTで両肺に多発結節",p:"増大傾向",q:"両肺に5mm-15mmの多発結節",r:"両肺(末梢優位)",s:"咳嗽なし, 呼吸困難なし, CEA再上昇",t:"大腸癌術後→定期CT→肺多発結節→CEA上昇→転移再発診断",pe:"呼吸音正常, リンパ節腫脹なし, 肝腫大なし",tests:"胸部CT(結節の数・サイズ・分布), PET-CT, 腫瘍マーカー(CEA/CA19-9), 他臓器転移検索, 気管支鏡/CTガイド下生検(確定必要時)",probs:"#1 肺転移(原発: 大腸癌) #2 大腸癌再発 #3 他臓器転移の検索",course:"転移巣の評価(数・分布・切除可能性)→Oligometastases: 肺切除術検討→多発: 全身化学療法(原発に応じたレジメン)→効果判定→BSC",disc:"Oligometastasesの概念と肺切除の適応, 原発巣別の化学療法レジメン, 転移性肺腫瘍と原発性肺癌の鑑別",refs:["Pastorino U. J Thorac Oncol 2010;5:S170","Treasure T. J Thorac Oncol 2012;7:1023"]},"肺カルチノイド":{prof:"40代女性, 反復する血痰",cc:"血痰, 咳嗽",o:"〇年前から間欠的な血痰",p:"自然に止血, 反復",q:"少量の血痰, 間欠的",r:"右主気管支(中枢型)",s:"喘鳴(腫瘍による気道狭窄), カルチノイド症候群(稀: 顔面紅潮, 下痢)",t:"反復する血痰→前医で気管支鏡→気管支内腫瘤→生検: カルチノイド→当院紹介",pe:"呼吸音(限局性喘鳴あれば), 顔面紅潮, 皮膚所見",tests:"気管支鏡(気管支内ポリープ状腫瘤), 生検(病理: 定型/非定型), 胸部CT, PET-CT(非定型は集積あり), 尿5-HIAA, 血清クロモグラニンA, ソマトスタチン受容体シンチ",probs:"#1 肺カルチノイド(定型/非定型) #2 気管支内腫瘤 #3 カルチノイド症候群の評価",course:"定型: 手術(肺葉切除 or スリーブ切除)→良好な予後→非定型: 手術+リンパ節郭清→術後フォロー→進行例: ソマトスタチンアナログ/エベロリムス",disc:"定型vs非定型カルチノイドの病理学的鑑別と予後, 気管支鏡生検時の出血リスク, カルチノイド症候群のメカニズム",refs:["Caplin ME. Lancet Oncol 2015;16:e435","Travis WD. J Thorac Oncol 2015;10:1243"]}},"g44":{"鉄欠乏性貧血":{prof:"40代女性, 過多月経",cc:"動悸, 息切れ, 倦怠感",o:"〇カ月前から労作時の動悸・息切れ",p:"安静で軽減",q:"Hb 7.5 g/dL, 小球性低色素性",r:"全身",s:"匙状爪, 氷食症, めまい",t:"労作時症状→健診でHb低値→前医で精査→鉄欠乏確認→出血源精査目的で当院紹介",pe:"眼瞼結膜蒼白, 匙状爪, 頻脈, 収縮期雑音(機能性), 舌炎",tests:"血算(MCV↓, MCHC↓), 鉄代謝(Fe↓, TIBC↑, フェリチン↓), 網赤血球, 便潜血, 上下部消化管内視鏡",probs:"#1 鉄欠乏性貧血 #2 出血源(過多月経/消化管出血) #3 鉄欠乏の原因検索",course:"原因検索→鉄剤投与(経口 or 静注)→Hb/フェリチンモニタリング→原因疾患治療→貯蔵鉄回復まで継続",disc:"鉄欠乏性貧血の鑑別診断(出血源の系統的検索), 経口鉄剤 vs 静注鉄剤の使い分け",refs:["Camaschella C. N Engl J Med 2015;372:1832","日本鉄バイオサイエンス学会ガイドライン 2015"]},"巨赤芽球性貧血":{prof:"70代女性, 胃全摘後10年",cc:"倦怠感, しびれ, 歩行困難",o:"〇カ月前から労作時倦怠感と四肢しびれ",p:"安静で軽減, 増悪傾向",q:"Hb 7.0g/dL, MCV 125fL(大球性)",r:"全身, 四肢末梢(しびれ)",s:"舌炎(Hunter舌炎), 振動覚低下, 深部腱反射亢進",t:"胃全摘後→貧血指摘→大球性→B12欠乏疑い→当院紹介",pe:"眼瞼結膜蒼白, Hunter舌炎(平滑・発赤), 振動覚低下, 位置覚低下, 深部腱反射, Romberg徴候",tests:"血算(MCV↑, 過分葉好中球), 網赤血球(↓), ビタミンB12/葉酸, LDH↑, 間接ビリルビン↑(無効造血), 末梢血塗抹(過分葉好中球, 大卵円赤血球), 抗内因子抗体",probs:"#1 巨赤芽球性貧血(ビタミンB12欠乏) #2 胃全摘後(吸収障害) #3 亜急性連合性脊髄変性症(あれば)",course:"ビタミンB12補充(筋注: 初期は連日→週1→月1)→Hb/MCV改善確認→神経症状のフォロー→生涯補充継続",disc:"ビタミンB12欠乏の原因(胃切除・悪性貧血・吸収障害), 神経障害(亜急性連合性脊髄変性症)の可逆性, 葉酸欠乏との鑑別",refs:["Green R. N Engl J Med 2017;376:1435","Stabler SP. N Engl J Med 2013;368:149"]},"溶血性貧血":{prof:"35歳女性, 急激な貧血・黄疸",cc:"倦怠感, 黄疸, 褐色尿",o:"〇日前から急激に倦怠感と黄疸が出現",p:"急性発症, 進行性",q:"Hb 6.5g/dL, 間接Bil 5.0mg/dL, LDH 850",r:"全身(黄疸)",s:"褐色尿, 背部痛, 発熱(あれば), 脾腫",t:"急激な倦怠感→黄疸→前医でHb低値・LDH高値→溶血疑い→当院紹介",pe:"黄疸, 眼球結膜黄染, 脾腫, 頻脈, 貧血所見",tests:"血算, 網赤血球↑, LDH↑, 間接ビリルビン↑, ハプトグロビン↓, 直接/間接Coombs試験, 末梢血塗抹(球状赤血球, 破砕赤血球), 尿潜血(ヘモグロビン尿), 冷式凝集素",probs:"#1 溶血性貧血(自己免疫性: 温式/冷式, or 血管内溶血) #2 原因精査 #3 貧血(重症)",course:"原因検索(Coombs陽性: AIHA, 陰性: TMA・PNH・遺伝性)→AIHA: ステロイド(PSL 1mg/kg)→効果判定→不応: リツキシマブ or 脾摘→輸血(慎重: 交差適合困難)",disc:"溶血性貧血の鑑別(Coombs陽性vs陰性, 血管内vs血管外), AIHAの治療(ステロイド→リツキシマブ→脾摘), 二次性の除外(リンパ腫・SLE・薬剤)",refs:["Hill QA. Br J Haematol 2017;176:395","Barcellini W. Blood Transfus 2014;12:311"]},"再生不良性貧血":{prof:"25歳女性, 汎血球減少",cc:"倦怠感, 出血傾向, 反復する発熱",o:"〇カ月前から倦怠感, 最近出血斑と発熱",p:"増悪傾向",q:"Hb 6.0, WBC 1800(好中球500), PLT 1.2万",r:"全身",s:"紫斑, 歯肉出血, 月経過多, 易感染",t:"汎血球減少→前医で骨髄検査→低形成→再生不良性貧血診断→当院紹介",pe:"貧血所見, 紫斑・点状出血, 発熱, リンパ節腫脹なし, 肝脾腫なし",tests:"血算(汎血球減少), 網赤血球↓, 骨髄穿刺・生検(低形成, 脂肪髄), 染色体(MDS除外), PNHクローン(フローサイトメトリー), 肝炎ウイルス, 自己抗体",probs:"#1 再生不良性貧血(重症度: Stage_, Camitta分類) #2 汎血球減少 #3 感染症リスク #4 出血リスク",course:"重症度判定→重症: 免疫抑制療法(ATG+CyA+エルトロンボパグ)→若年重症: 同種骨髄移植→支持療法(輸血, G-CSF)→PNHクローンの経過観察",disc:"再生不良性貧血の重症度分類と治療選択(IST vs 移植), ATG+CyA+エルトロンボパグの三剤併用, PNHとの関連",refs:["Young NS. N Engl J Med 2018;379:1643","Peffault de Latour R. Blood 2022;140:2718"]},"骨髄異形成症候群":{prof:"72歳男性, 大球性貧血, 難治性",cc:"倦怠感, 輸血依存",o:"〇年前から貧血, 鉄剤・ESA無効",p:"輸血で一時改善, 依存性",q:"Hb 7.5, MCV 108, WBC 2800, PLT 8万",r:"全身",s:"易感染(好中球減少), 出血傾向(軽度)",t:"大球性貧血→前医で精査→MDS診断→リスク分類目的で当院紹介",pe:"貧血所見, 紫斑(軽度), 肝脾腫なし",tests:"血算(血球減少, 大球性), 末梢血塗抹(異形成: 偽Pelger-Huet, 環状鉄芽球), 骨髄穿刺・生検(異形成, 芽球%), 染色体(del5q, -7等), 遺伝子変異(SF3B1, TP53等), 血清EPO, フェリチン",probs:"#1 骨髄異形成症候群(WHO分類_, IPSS-R_) #2 輸血依存性貧血 #3 鉄過剰症(輸血関連)",course:"IPSS-Rでリスク分類→低リスク: ESA(±レナリドミド, del5q)→高リスク: アザシチジン→移植適応: 同種造血幹細胞移植→鉄キレート療法→輸血サポート",disc:"MDSの診断基準(WHO/ICC 2022)とIPSS-Rによるリスク分類, 低リスクvs高リスクの治療戦略, AMLへの移行リスク",refs:["Greenberg PL. Blood 2012;120:2454","Malcovati L. Blood 2023;141:1373"]},"慢性疾患性貧血":{prof:"60代女性, 関節リウマチ, 軽度貧血",cc:"倦怠感, 労作時息切れ(軽度)",o:"RA治療中, 〇カ月前から軽度貧血が持続",p:"RA活動性と連動",q:"Hb 9.5g/dL, MCV 85(正球性), TIBC低下",r:"全身",s:"RA関節症状, 微熱, CRP軽度上昇持続",t:"RA外来中→Hb低下傾向→鉄欠乏除外後→慢性疾患性貧血と診断",pe:"眼瞼結膜蒼白(軽度), RA関節所見, 脾腫なし",tests:"血算(MCV正常〜軽度低下), Fe(↓), TIBC(↓), フェリチン(正常〜↑), sTfR, ヘプシジン, CRP/ESR, 腎機能, 網赤血球",probs:"#1 慢性疾患性貧血(ACD) #2 関節リウマチ(活動性) #3 鉄欠乏性貧血の合併除外",course:"原疾患治療(RA活動性コントロール)→鉄欠乏合併: 鉄剤(静注)→ESA(適応あれば)→Hbモニタリング→重症: 輸血",disc:"ACDの病態(ヘプシジン↑→鉄利用障害, EPO反応低下), 鉄欠乏性貧血との鑑別(フェリチン・sTfR/logフェリチン比), 原疾患治療の重要性",refs:["Weiss G. N Engl J Med 2019;381:1148","Nemeth E. Blood 2014;123:326"]}},"g45":{"急性骨髄性白血病（AML）":{prof:"60代男性, 急激な汎血球減少",cc:"発熱, 出血傾向, 倦怠感",o:"〇週間前から倦怠感, 発熱, 出血斑が出現",p:"急速に進行",q:"WBC 35000(芽球80%), Hb 6.5, PLT 1.5万",r:"全身",s:"歯肉出血, 紫斑, 歯肉腫脹(M4/M5), DIC(あれば, APLで多い)",t:"急激な倦怠感→出血→血液検査で芽球出現→骨髄検査→AML診断→当院紹介",pe:"貧血所見, 紫斑・点状出血, 歯肉腫脹(単球系), 肝脾腫, リンパ節腫脹, 発熱",tests:"血算・末梢血塗抹(芽球), 骨髄穿刺・生検(芽球≥20%), フローサイトメトリー, 染色体(t(8;21), inv(16), t(15;17)等), 遺伝子変異(FLT3, NPM1, CEBPA, TP53), DIC検査(APL), 腰椎穿刺(CNS浸潤評価)",probs:"#1 急性骨髄性白血病(WHO/ICC分類_, 予後リスク_) #2 汎血球減少 #3 DIC(APLの場合) #4 腫瘍崩壊症候群リスク",course:"寛解導入療法(7+3: AraC+IDR/DNR)→CR確認→地固め療法→中間リスク以上: 同種移植→APL: ATRA+ATO→FLT3変異: ミドスタウリン追加→支持療法",disc:"AMLのELN2022リスク分類と治療戦略, APLの特殊性(ATRA+ATO), FLT3阻害薬の役割, 高齢者AMLの治療(HMA+venetoclax)",refs:["Döhner H. Blood 2022;140:2462","Lo-Coco F. N Engl J Med 2013;369:111"]},"急性リンパ性白血病（ALL）":{prof:"25歳男性, 骨痛, 汎血球減少",cc:"発熱, 骨痛, 出血傾向",o:"〇週間前から骨痛・発熱, 出血斑出現",p:"急速に進行",q:"WBC 85000(芽球90%), Hb 7.0, PLT 2万",r:"全身, 骨(四肢長管骨)",s:"リンパ節腫脹, 肝脾腫, 縦隔腫大(T-ALL)",t:"骨痛・発熱→血液検査で白血球著増→芽球出現→ALL診断",pe:"リンパ節腫脹(全身性), 肝脾腫, 紫斑, 骨圧痛, 精巣腫大(男児・再発時)",tests:"血算・末梢血塗抹, 骨髄穿刺(芽球≥25%), フローサイトメトリー(B-ALL/T-ALL), 染色体(Ph染色体: t(9;22)), BCR-ABL, MLL再構成, 腰椎穿刺(CNS浸潤)",probs:"#1 急性リンパ性白血病(B-ALL/T-ALL, Ph+/Ph-) #2 腫瘍崩壊症候群リスク(高WBC) #3 CNS浸潤評価",course:"寛解導入(multi-agent: VCR+PSL+L-asp+anthracycline)→CR確認→地固め+維持療法→Ph+: TKI追加→MRD評価→高リスク: 同種移植→CNS予防(IT MTX)",disc:"ALLのリスク分類(Ph+, MLL, hypodiploidy等), Ph+ ALLのTKI併用, MRD(微小残存病変)の重要性, BiTE抗体(blinatumomab)/CAR-T細胞療法",refs:["Fielding AK. Blood 2021;137:3285","Bassan R. Blood 2022;140:2667"]},"慢性骨髄性白血病（CML）":{prof:"50代男性, 健診でWBC増多",cc:"無症候(健診発見), または腹部膨満・倦怠感",o:"健診で白血球増多(WBC 55000)を指摘",p:"無症候〜軽度の腹部膨満",q:"WBC 55000(好中球増多, 好塩基球増多), 脾腫",r:"左上腹部(脾腫)",s:"倦怠感, 盗汗, 体重減少(あれば)",t:"健診WBC異常→血液検査精査→Ph染色体陽性→CML慢性期→当院紹介",pe:"脾腫(左季肋部), 肝腫大(あれば), 貧血所見(進行例)",tests:"血算・末梢血塗抹(好中球左方移動, 好塩基球増多), 骨髄穿刺, 染色体(Ph染色体: t(9;22)), BCR-ABL(定量PCR: IS%), 脾エコー",probs:"#1 慢性骨髄性白血病(慢性期/移行期/急性転化期) #2 Ph染色体陽性 #3 脾腫",course:"TKI開始(イマチニブ or 2nd gen TKI: ダサチニブ/ニロチニブ)→BCR-ABL IS%モニタリング(3カ月毎)→DMR達成→TKI中止(TFR)検討→移行期/急性転化: 移植検討",disc:"CMLのTKIによる分子標的治療の革命, ELN2020マイルストーンと治療効果判定, TFR(treatment-free remission)の条件, TKIの副作用プロファイル",refs:["Hochhaus A. Leukemia 2020;34:966","Hughes TP. N Engl J Med 2010;362:2251"]},"DLBCL":{prof:"65歳男性, 急速に増大する頸部リンパ節",cc:"頸部腫瘤, B症状(発熱・盗汗・体重減少)",o:"〇カ月前から頸部リンパ節腫大が急速に進行",p:"急速増大",q:"頸部リンパ節5cm, LDH 650, 可溶性IL-2R 3500",r:"頸部(左), 腋窩, 傍大動脈",s:"発熱(38℃以上), 盗汗, 体重減少(10%/6カ月), 倦怠感",t:"頸部腫瘤→急速増大→前医で生検→DLBCL→staging目的で当院紹介",pe:"頸部リンパ節腫大(硬, 可動性低下), 腋窩・鼠径リンパ節, 肝脾腫, Waldeyer輪",tests:"リンパ節生検(病理: 大型B細胞, CD20+), PET-CT(staging), 骨髄生検, LDH, 可溶性IL-2R, β2MG, 血算, 肝腎機能, HBV(再活性化リスク), 心エコー(DOX前)",probs:"#1 びまん性大細胞型B細胞リンパ腫(Ann Arbor Stage_, IPI_点) #2 B症状 #3 HBV再活性化リスク評価",course:"IPI評価→R-CHOP(6-8コース)→中間PET評価→CR確認→CNSリスク高: IT MTX/全身HD-MTX→再発: R-ICE→自家移植 or CAR-T",disc:"DLBCLのIPI/aaIPIによる予後予測, R-CHOP療法のエビデンス, cell of origin(GCB vs non-GCB), 再発難治例のCAR-T細胞療法",refs:["Tilly H. Ann Oncol 2015;26:v116","Sehn LH. N Engl J Med 2021;384:842"]},"濾胞性リンパ腫":{prof:"55歳女性, 緩徐に増大するリンパ節腫大",cc:"無痛性リンパ節腫大",o:"〇年前から頸部リンパ節腫大, 緩徐に増大",p:"自然に縮小したり増大したりを反復(wax and wane)",q:"頸部・腋窩に2-3cmのリンパ節多数",r:"多部位(頸部, 腋窩, 鼠径)",s:"B症状なし(多い), 倦怠感(軽度)",t:"緩徐なリンパ節腫大→前医で生検→濾胞性リンパ腫→staging",pe:"多発無痛性リンパ節腫大(弾性硬), 肝脾腫の有無",tests:"リンパ節生検(病理: 濾胞構造, bcl-2+, CD10+, Grade1-3a), PET-CT, 骨髄生検, FLIPI, LDH, β2MG, 血算",probs:"#1 濾胞性リンパ腫(Grade_, Ann Arbor Stage_, FLIPI_点) #2 低悪性度リンパ腫",course:"限局期: 放射線療法→進行期低腫瘍量: 経過観察(watch and wait)→高腫瘍量: R-bendamustine or R-CHOP→維持リツキシマブ→形質転換監視",disc:"濾胞性リンパ腫のwatch and waitの適応(GELF基準), 治療開始のタイミング, 形質転換(DLBCL)のリスク, 長期フォローの重要性",refs:["Dreyling M. Ann Oncol 2021;32:298","Marcus R. N Engl J Med 2017;377:1331"]},"ホジキンリンパ腫":{prof:"25歳男性, 頸部リンパ節腫大, 掻痒感",cc:"頸部リンパ節腫大, B症状",o:"〇カ月前から左頸部リンパ節腫大と掻痒感",p:"増大傾向, 飲酒後リンパ節痛(あれば)",q:"左頸部に3cmのリンパ節, 縦隔リンパ節腫大",r:"左頸部, 縦隔",s:"発熱(Pel-Ebstein熱), 盗汗, 掻痒感, 体重減少",t:"頸部リンパ節腫大→生検→ホジキンリンパ腫(古典型, Reed-Sternberg細胞)→staging",pe:"頸部リンパ節腫大(ゴム様硬), 縦隔腫大(SVC症候群あれば), 脾腫の有無",tests:"リンパ節生検(Reed-Sternberg細胞, CD30+, CD15+), PET-CT, 骨髄生検, LDH, ESR, 血算, 肝腎機能, 心エコー(DOX前), 呼吸機能(BLEO前)",probs:"#1 ホジキンリンパ腫(古典型, Ann Arbor Stage_, 予後因子) #2 B症状 #3 縦隔病変",course:"限局期(I-II): ABVD 2-4コース+放射線→進行期(III-IV): ABVD 6コース or BV-AVD→中間PET評価→CR確認→再発: BV or 免疫CP阻害薬→自家移植",disc:"ホジキンリンパ腫の高い治癒率, ABVD vs escalated BEACOPPの選択, PET-adaptedアプローチ, 長期合併症(二次癌・心毒性・不妊)",refs:["Eichenauer DA. Ann Oncol 2018;29:iv19","Ansell SM. N Engl J Med 2015;372:311"]}},"g46":{"多発性骨髄腫":{prof:"70代男性, 腰痛, 貧血",cc:"腰痛, 倦怠感, 体重減少",o:"〇カ月前から腰痛が出現, 鎮痛薬で改善不十分",p:"安静で軽減するが持続, 進行性",q:"IgG 5500, Hb 8.5, Cr 2.0, Ca 11.5",r:"腰椎, 全身骨",s:"貧血, 腎機能低下, 高カルシウム血症, 反復する感染症",t:"腰痛→前医で蛋白異常→M蛋白→骨髄検査で形質細胞増殖→当院紹介",pe:"骨圧痛(腰椎, 胸椎), 貧血所見, 脱水所見(高Ca), 神経所見(脊髄圧迫評価)",tests:"血清蛋白電気泳動(M蛋白), 免疫電気泳動(IgG-κ/λ), 遊離軽鎖(κ/λ比), 骨髄穿刺・生検(形質細胞%), FISH(del17p, t(4;14), t(14;16)), 全身CT or PET-CT(骨病変), β2MG, Alb, Cr, Ca, LDH",probs:"#1 多発性骨髄腫(R-ISS Stage_) #2 CRAB症状(Ca↑, Renal, Anemia, Bone) #3 骨病変",course:"R-ISS評価→導入療法(DRd: ダラツムマブ+レナリドミド+デキサメタゾン or VRd)→移植適応: 自家PBSCT→維持療法(Rd or Len単独)→骨修飾薬(ゾレドロン酸/デノスマブ)→支持療法",disc:"多発性骨髄腫のR-ISS分類と予後, 移植適応vs非適応の治療戦略, 新規薬剤(抗CD38・BiTE・CAR-T)の進歩, SLiM-CRAB基準",refs:["Rajkumar SV. Lancet Oncol 2014;15:e538","Dimopoulos MA. Blood 2020;136:2535"]},"MGUS":{prof:"65歳女性, 健診で蛋白異常指摘",cc:"無症候(健診で蛋白電気泳動異常)",o:"健診で総蛋白高値→蛋白電気泳動でM蛋白検出",p:"無症候, 経過観察中",q:"M蛋白 1.5g/dL, 骨髄形質細胞5%, 臓器障害なし",r:"全身(潜在的)",s:"無症候(CRAB症状なし)",t:"健診異常→M蛋白検出→骨髄検査: 形質細胞<10%→MGUS診断→経過観察",pe:"異常所見なし(多い), 骨痛なし, 貧血なし, 神経障害なし",tests:"血清蛋白電気泳動, 免疫固定法(M蛋白型), 遊離軽鎖(κ/λ比), 骨髄穿刺(形質細胞<10%), 血算, Cr, Ca, 骨サーベイ",probs:"#1 MGUS(IgG型/IgM型/light chain型) #2 多発性骨髄腫への進行リスク評価",course:"リスク層別化(M蛋白型・量, κ/λ比, 免疫型)→低リスク: 年1回フォロー→中高リスク: 6カ月毎フォロー→CRAB出現時: 治療介入",disc:"MGUSの定義と多発性骨髄腫への進行リスク(年1%), Mayo Clinicリスクモデル, IgM-MGUSの鑑別(リンパ増殖性疾患), フォロー間隔の決定",refs:["Kyle RA. N Engl J Med 2018;378:241","Rajkumar SV. Blood 2015;125:3069"]},"ワルデンシュトレームマクログロブリン血症":{prof:"70代男性, 倦怠感, 鼻出血, 視力低下",cc:"倦怠感, 出血症状, 視力低下",o:"〇カ月前から倦怠感と鼻出血が出現",p:"緩徐に進行",q:"IgM 4500, Hb 9.0, 血液粘稠度上昇",r:"全身",s:"鼻出血, 視力低下(過粘稠度症候群), 末梢神経障害(しびれ), リンパ節腫脹",t:"倦怠感+出血→IgM高値→骨髄でリンパ形質細胞浸潤→WM診断",pe:"眼底(過粘稠度: 網膜出血, ソーセージ様静脈), 末梢神経障害, リンパ節腫大, 肝脾腫, 出血所見",tests:"血清蛋白電気泳動(IgM-M蛋白), 血液粘稠度, 骨髄穿刺・生検(リンパ形質細胞浸潤), MYD88 L265P変異, CXCR4変異, 免疫グロブリン, 血算, 眼底検査",probs:"#1 ワルデンシュトレームマクログロブリン血症 #2 過粘稠度症候群(あれば) #3 末梢神経障害(IgM関連)",course:"無症候: 経過観察→過粘稠度症候群: 緊急血漿交換→化学療法(BR: bendamustine+rituximab)→BTK阻害薬(イブルチニブ/ザヌブルチニブ)→維持療法",disc:"WMの診断基準とMYD88変異の意義, 過粘稠度症候群の認識と緊急対応, BTK阻害薬の役割(iNNOVATE trial), リツキシマブによるIgMフレア",refs:["Kastritis E. Blood 2018;132:2492","Dimopoulos MA. Blood 2014;124:1404"]}},"g47":{"ITP":{prof:"30代女性, 紫斑, 血小板減少",cc:"紫斑, 歯肉出血, 月経過多",o:"〇週間前から四肢に紫斑が出現",p:"自然消退するが新規出現",q:"PLT 1.5万, 他の血球正常",r:"四肢(点状・斑状出血)",s:"歯肉出血, 月経過多, 鼻出血",t:"紫斑出現→前医で血小板低値→二次性除外→ITP診断→当院紹介",pe:"点状出血, 斑状出血(四肢), 口腔内出血, 脾腫なし(あれば他疾患考慮), リンパ節腫脹なし",tests:"血算(PLT↓, 他正常), 末梢血塗抹(巨大血小板), 骨髄穿刺(巨核球正常〜増加, 除外目的), PAIgG, ANA, 甲状腺機能, HCV, H.pylori, HIV",probs:"#1 特発性(免疫性)血小板減少性紫斑病(ITP) #2 出血リスク評価 #3 二次性の除外",course:"H.pylori検査→陽性: 除菌→PLT 3万以上で安定: 経過観察→重症出血 or PLT<2万: ステロイド(PSL 1mg/kg)→不応: TPO-RA(エルトロンボパグ/ロミプロスチム)→リツキシマブ→脾摘",disc:"ITPの診断(除外診断), 治療のescalation(ステロイド→TPO-RA→リツキシマブ→脾摘), H.pylori除菌(日本のエビデンス)",refs:["Provan D. Blood Adv 2019;3:3780","Neunert C. Blood Adv 2019;3:3829"]},"DIC":{prof:"65歳男性, 敗血症, 出血傾向",cc:"出血傾向, 多臓器不全",o:"敗血症発症〇日後から出血傾向と臓器障害進行",p:"原疾患治療で改善傾向",q:"PLT 3万, PT-INR 2.5, FDP 85, D-dimer 25, Fib 80",r:"全身(微小血栓+出血)",s:"紫斑, 穿刺部出血, 消化管出血, 腎機能障害",t:"敗血症→DIC合併→出血と臓器障害進行",pe:"広範な紫斑, 穿刺部出血, 消化管出血, 末梢循環不全, 臓器障害所見",tests:"DICスコア(JAAM/ISTH), PLT推移, PT-INR, FDP, D-dimer, フィブリノゲン, AT-III, TAT, PIC, トロンボモジュリン",probs:"#1 DIC(感染症関連) #2 敗血症(原疾患) #3 多臓器不全",course:"原疾患治療(最重要: 感染源コントロール)→AT-III補充(AT活性<70%)→リコンビナントトロンボモジュリン→出血時: 血小板・FFP輸血→ヘパリン(血栓型DIC)",disc:"DICの診断スコア(JAAM vs ISTH), 線溶亢進型vs線溶抑制型の治療戦略, 日本発のrTM(ART-123)のエビデンス, 基礎疾患別の特徴",refs:["Wada H. Thromb Haemost 2013;109:585","Levi M. N Engl J Med 2009;341:586"]},"血友病":{prof:"10代男性, 幼少期から関節出血反復",cc:"関節出血, 筋肉内出血",o:"幼少期から外傷後の止血困難, 関節出血反復",p:"凝固因子補充で止血",q:"APTT延長, FVIII活性<1%(重症型)",r:"関節(膝・肘・足関節)",s:"関節腫脹・疼痛, 筋肉内血腫, 口腔内出血",t:"幼少期の出血傾向→APTT延長→FVIII低値→血友病A診断→当院フォロー中→関節出血で受診",pe:"関節腫脹(急性出血時), 関節可動域制限(血友病性関節症), 筋肉内血腫, 出血部位確認",tests:"APTT(延長), PT(正常), FVIII活性(or FIX: 血友病B), インヒビター(ベセスダ法), 関節エコー/MRI",probs:"#1 血友病A(重症型, FVIII<1%) #2 血友病性関節症 #3 インヒビター評価",course:"出血時: 凝固因子補充(FVIII製剤)→定期補充療法(prophylaxis)→エミシズマブ(bispecific抗体)→インヒビター陽性: バイパス製剤(rFVIIa/aPCC)→関節ケア",disc:"血友病の定期補充療法のエビデンス, エミシズマブの革命(HAVEN trial), インヒビターの管理, 遺伝子治療の展望",refs:["Srivastava A. Haemophilia 2020;26:1","Oldenburg J. N Engl J Med 2017;377:809"]},"TTP/TMA":{prof:"35歳女性, 急激な血小板減少と溶血",cc:"意識障害, 紫斑, 発熱",o:"〇日前から倦怠感, 紫斑, 意識混濁が急速に出現",p:"急速進行",q:"PLT 1.2万, Hb 6.5, LDH 2500, 破砕赤血球+",r:"全身(脳・腎)",s:"発熱, 意識障害, 腎機能障害, 褐色尿",t:"急激な血小板減少+溶血→破砕赤血球→TMA疑い→緊急入院",pe:"意識レベル評価, 紫斑, 黄疸, 発熱, 神経所見(巣症状), 腎機能評価",tests:"血算(PLT↓), 末梢血塗抹(破砕赤血球), LDH↑, 間接Bil↑, ハプトグロビン↓, Coombs陰性, ADAMTS13活性(<10%: TTP), STEC(志賀毒素: HUS), 腎機能, 補体(aHUS)",probs:"#1 TTP(ADAMTS13<10%) or HUS/aHUS #2 血小板減少性紫斑病 #3 微小血管障害性溶血性貧血(MAHA) #4 臓器障害(脳・腎)",course:"TTP: 緊急血漿交換+ステロイド+カプラシズマブ→ADAMTS13活性モニタリング→リツキシマブ(再発予防)→HUS: 支持療法→aHUS: エクリズマブ",disc:"TMAの鑑別(TTP vs HUS vs aHUS vs 二次性), ADAMTS13活性測定の重要性, 血漿交換の緊急性, カプラシズマブの役割",refs:["Scully M. N Engl J Med 2019;380:335","George JN. N Engl J Med 2014;371:654"]},"抗リン脂質抗体症候群":{prof:"30代女性, 反復する流産, DVT",cc:"下肢腫脹(DVT), 反復性流産の既往",o:"〇年前に深部静脈血栓症, 流産3回の既往",p:"抗凝固療法で血栓再発予防",q:"ループスアンチコアグラント陽性, 抗カルジオリピン抗体高値",r:"下肢(DVT), 全身(血栓症)",s:"片頭痛, 網状皮斑, 血小板減少(軽度)",t:"反復流産+DVT→抗リン脂質抗体検査陽性(12週間後再確認)→APS確定→当院フォロー",pe:"下肢DVTの所見, 網状皮斑, livedo reticularis, 心雑音(Libman-Sacks心内膜炎), SLEの所見",tests:"ループスアンチコアグラント, 抗カルジオリピン抗体(IgG/IgM), 抗β2GP1抗体, 確認検査(12週間後), D-dimer, 下肢静脈エコー, ANA(SLE合併評価), 補体",probs:"#1 抗リン脂質抗体症候群(血栓型/産科型) #2 DVT既往 #3 反復流産 #4 SLE合併評価",course:"血栓型: 長期抗凝固療法(ワーファリン, INR 2-3)→産科型: 低用量アスピリン+ヘパリン→カタストロフィックAPS: 血漿交換+ステロイド+抗凝固→SLE合併: HCQ追加",disc:"APS分類基準(Sydney改訂), triple positive(高リスク)の概念, 産科APSの管理, DOACの位置づけ(TRAPS試験: ワーファリン優位), カタストロフィックAPS",refs:["Tektonidou MG. Ann Rheum Dis 2019;78:1296","Miyakis S. J Thromb Haemost 2006;4:295"]}},"g48":{"発熱性好中球減少症（FN）":{prof:"55歳男性, 化学療法後7日目",cc:"発熱, 悪寒",o:"化学療法後〇日目, 体温38.5℃の発熱",p:"抗菌薬投与で解熱傾向",q:"体温38.5℃, ANC 200/μL",r:"全身(感染巣不明のことが多い)",s:"悪寒, 倦怠感, 口腔粘膜炎, 肛門周囲痛(あれば)",t:"化学療法→好中球減少→発熱→FN→緊急対応",pe:"全身状態(ショック徴候), 口腔内, 皮膚(CVカテーテル挿入部), 肛門周囲, 肺, 副鼻腔",tests:"血液培養(2セット: 末梢+CV), 血算(ANC), CRP, PCT, 尿検査, 胸部X線, β-Dグルカン(遷延時)",probs:"#1 発熱性好中球減少症(MASCCスコア_点) #2 化学療法後骨髄抑制 #3 感染巣の検索",course:"MASCC評価→高リスク: 広域抗菌薬(TAZ/PIPC or CFPM or MEPM)→血液培養結果で最適化→48-72h不応: 抗真菌薬追加→G-CSF(適応あれば)→好中球回復まで",disc:"FNの定義(ANC<500+体温≥38.3℃), MASCCスコアによるリスク分類, エンピリック抗菌薬の選択, 48-72時間ルールと抗真菌薬追加のタイミング",refs:["Freifeld AG. Clin Infect Dis 2011;52:e56","Averbuch D. Haematologica 2013;98:1826"]},"腫瘍崩壊症候群":{prof:"45歳男性, DLBCL, 化学療法開始直後",cc:"嘔気, 筋痙攣, 乏尿",o:"化学療法開始〇時間後から嘔気と筋痙攣",p:"急速に進行",q:"K 6.5, P 8.0, UA 12.5, Ca 6.5, Cr 3.0",r:"全身",s:"嘔気, 不整脈リスク, 腎不全(急性)",t:"化学療法開始→急激な電解質異常→TLS診断→ICU管理",pe:"不整脈(心電図モニター), 筋痙攣, テタニー(低Ca), 乏尿, バイタル",tests:"K, P, Ca, UA, Cr, LDH, 血液ガス, 心電図, 尿量モニタリング, Cairo-Bishop基準",probs:"#1 腫瘍崩壊症候群(Laboratory/Clinical TLS) #2 急性腎障害 #3 高カリウム血症 #4 高リン血症",course:"大量輸液(3L/m²/日)→ラスブリカーゼ(高UA)→K補正(GI療法, グルコン酸Ca)→P管理(リン吸着薬)→透析(腎不全・難治性電解質異常)→電解質6時間毎モニタリング",disc:"TLSの予防(リスク分類とラスブリカーゼ/アロプリノール), Cairo-Bishop診断基準, 電解質異常の緊急管理, 透析の適応",refs:["Cairo MS. Br J Haematol 2010;149:578","Howard SC. N Engl J Med 2011;364:1844"]},"骨髄抑制管理":{prof:"60代女性, 乳癌化学療法中",cc:"倦怠感, 口腔粘膜炎, 易感染",o:"化学療法〇コース目, 投与後〇日目",p:"好中球のnadir(最下点)時期に一致",q:"ANC 800, Hb 8.0, PLT 6万",r:"全身",s:"口腔粘膜炎, 倦怠感, 出血傾向(軽度), 食欲低下",t:"化学療法→予定通りの骨髄抑制→Grade評価→支持療法",pe:"口腔内(粘膜炎のGrade), バイタル, 皮膚(紫斑), 感染徴候",tests:"血算(経時的: ANCのnadir, Hb, PLT), 網赤血球, CRP, 感染徴候評価",probs:"#1 化学療法後骨髄抑制(Grade_) #2 好中球減少 #3 貧血 #4 血小板減少",course:"好中球減少: G-CSF(一次/二次予防, ANC回復)→貧血: ESA/輸血→血小板減少: 血小板輸血(PLT<1万 or 出血時)→口腔粘膜炎: 口腔ケア→次コースの用量調整",disc:"CTCAE Gradeによる骨髄抑制の評価, G-CSFの一次/二次予防の適応(ASCO/NCCN), 化学療法の用量調整(RDI維持), 輸血トリガー",refs:["Crawford J. J Clin Oncol 2017;35:3903","Smith TJ. J Clin Oncol 2015;33:3199"]},"輸血療法":{prof:"65歳男性, MDS, 慢性輸血依存",cc:"倦怠感(輸血必要), フェリチン上昇",o:"MDS診断後, 月2回の赤血球輸血に依存",p:"輸血後Hb改善, 2週間で再低下",q:"Hb 6.5(輸血前), フェリチン 2500",r:"全身",s:"鉄過剰症状(肝障害, 心機能低下, 耐糖能異常, 皮膚色素沈着)",t:"MDS→輸血依存→鉄過剰→臓器障害評価",pe:"皮膚色素沈着, 肝腫大, 心機能評価, 糖尿病所見",tests:"Hb(輸血前後), フェリチン, TSAT, 肝MRI(T2*, 鉄沈着), 心MRI(T2*), 肝機能, HbA1c, 心エコー, 不規則抗体スクリーニング",probs:"#1 輸血依存性貧血(MDS) #2 輸血後鉄過剰症 #3 臓器鉄沈着(肝・心)",course:"輸血方針(Hbトリガー設定)→鉄キレート療法(デフェラシロクス: フェリチン>1000)→臓器鉄沈着モニタリング(MRI T2*)→輸血反応の管理→不規則抗体対策",disc:"輸血のトリガー値と目標Hb, 鉄過剰症の診断と臓器障害, 鉄キレート療法の適応とモニタリング, 輸血関連合併症(TACO/TRALI)",refs:["Carson JL. JAMA 2016;316:2025","Gattermann N. Eur J Haematol 2012;88:456"]},"造血幹細胞移植":{prof:"45歳男性, AML第一寛解, 同種移植予定",cc:"移植適応評価",o:"AML CR1達成, 中間リスク, 同種移植適応",p:"導入・地固め療法でCR1維持中",q:"骨髄芽球<5%, MRD陰性, PS 0",r:"全身",s:"移植前の感染症リスク, 臓器機能評価",t:"AML診断→CR1達成→リスク評価→HLAマッチドナー確認→移植準備",pe:"全身状態(PS), 口腔内(歯科評価), 心肺機能, 肝腎機能, 感染症スクリーニング",tests:"HLAタイピング(ドナー・レシピエント), MRD(骨髄), 心エコー(EF), 呼吸機能(DLco), 肝腎機能, 感染症(CMV/EBV/HBV/HCV/HIV), 歯科評価, 心理評価",probs:"#1 AML(CR1, 同種移植適応) #2 移植前評価・コンディショニング #3 GVHD予防",course:"前処置(MAC or RIC)→同種PBSCT/BMT→GVHD予防(TAC+MTX or PTCy)→生着確認→急性GVHD管理→感染症管理(CMV再活性化)→慢性GVHD→長期フォロー",disc:"同種移植の適応(AML ELNリスク分類), 前処置の選択(MAC vs RIC), GVHD(急性・慢性)の予防と治療, 移植後合併症(VOD/SOS, CMV再活性化)",refs:["Bazarbachi AH. Biol Blood Marrow Transplant 2020;26:e13","Luznik L. Blood 2022;139:1742"]}},"g49":{"脳梗塞（心原性）":{prof:"78歳男性, 心房細動(抗凝固未服用)",cc:"左片麻痺, 構音障害",o:"〇月〇日〇時, 起床時に左上下肢の脱力に気付く",p:"改善なし, 進行性",q:"NIHSS_点, 左上下肢MMT 1-2/5",r:"右中大脳動脈領域",s:"構音障害, 左半側空間無視, 意識清明/JCS I-1",t:"起床時発症(最終健常確認: 前夜〇時)→家族が気付き救急要請→当院搬送",pe:"NIHSS評価, 意識レベル(GCS), 瞳孔, 運動麻痺, 感覚, 失語, 半側空間無視, 心房細動(脈不整)",tests:"頭部CT(出血除外)→頭部MRI(DWI), MRA, 12誘導心電図(AF確認), 心エコー, 頸部血管エコー",probs:"#1 脳梗塞(心原性塞栓症) #2 非弁膜症性心房細動 #3 抗凝固療法未導入",course:"rt-PA静注(4.5h以内)/血栓回収療法→脳保護→早期リハビリ→抗凝固療法開始(DOAC)→二次予防→回復期リハ転院",disc:"急性期脳梗塞の再灌流療法の適応と時間窓, 心原性脳塞栓の二次予防(DOAC), リハビリテーション",refs:["Powers WJ. Stroke 2019;50:e344","日本脳卒中学会. 脳卒中治療ガイドライン2021"]},"脳梗塞（アテローム性）":{prof:"70代男性, 高血圧・糖尿病・脂質異常症, 喫煙歴",cc:"右上下肢脱力, 構音障害",o:"〇月〇日午後, 活動中に右上肢の脱力が出現し徐々に増悪",p:"数時間かけて進行性に増悪",q:"NIHSS_点, 右上下肢MMT 3/5",r:"左中大脳動脈領域",s:"構音障害, 右口角下垂, 感覚鈍麻. 意識清明",t:"活動中に右上肢脱力→進行性に増悪→救急搬送",pe:"NIHSS評価, 意識レベル(GCS), 頸部血管雑音, 運動麻痺, 感覚障害, 失語の有無",tests:"頭部CT(出血除外)→頭部MRI(DWI), MRA(主幹動脈狭窄・閉塞), 頸部血管エコー/CTA, 心電図, 心エコー, 凝固・脂質",probs:"#1 脳梗塞(アテローム血栓性) #2 頸動脈狭窄/頭蓋内動脈狭窄 #3 動脈硬化リスク因子(高血圧・糖尿病・脂質異常症)",course:"rt-PA静注(4.5h以内)/血栓回収療法→抗血小板療法(DAPT→SAPT)→スタチン→リスク因子管理→早期リハビリ→回復期リハ転院",disc:"アテローム血栓性脳梗塞の急性期治療と抗血小板療法の選択, BAD(branch atheromatous disease)の概念, 頸動脈狭窄に対するCEA/CASの適応",refs:["Powers WJ. Stroke 2019;50:e344","日本脳卒中学会. 脳卒中治療ガイドライン2021"]},"脳梗塞（ラクナ）":{prof:"65歳男性, 高血圧(コントロール不良)",cc:"右手の巧緻運動障害, 軽度構音障害",o:"〇月〇日朝, 箸が持ちにくいことに気付く",p:"急性発症, 軽度だが改善なし",q:"NIHSS 3点, 右手指MMT 4/5, 軽度構音障害",r:"左放線冠/内包後脚",s:"頭痛なし, 嘔吐なし, 意識清明",t:"朝に気付く→症状持続→当日外来受診→MRIで小梗塞→入院",pe:"軽度運動麻痺(pure motor hemiparesis), 感覚障害の有無, 失語・半側空間無視なし",tests:"頭部MRI(DWI: 小梗塞), MRA(主幹動脈正常), 心電図(洞調律), 心エコー, 頸部血管エコー",probs:"#1 脳梗塞(ラクナ梗塞) #2 高血圧症(コントロール不良) #3 小血管病",course:"抗血小板薬(クロピドグレル or シロスタゾール)→厳格な血圧管理→リスク因子管理→リハビリ→外来フォロー",disc:"ラクナ梗塞の臨床症候群(pure motor/pure sensory/ataxic hemiparesis等), 小血管病の病態と長期管理",refs:["Wardlaw JM. Lancet Neurol 2013;12:822","日本脳卒中学会. 脳卒中治療ガイドライン2021"]},"脳出血":{prof:"60代男性, 高血圧(未治療), 飲酒歴",cc:"突然の頭痛, 左片麻痺, 意識障害",o:"〇月〇日, 活動中に突然の激しい頭痛と左上下肢脱力",p:"急性発症, 数分で進行",q:"JCS II-20, NIHSS 18点, 左片麻痺(MMT 0-1/5), 共同偏視",r:"右被殻出血",s:"嘔吐, 頭痛, 意識レベル低下",t:"活動中に突然発症→意識障害→救急搬送",pe:"意識レベル(GCS), 瞳孔(左右差), 共同偏視, 運動麻痺, 項部硬直, バイタル(著明な高血圧)",tests:"頭部CT(血腫の部位・大きさ), CT-A(血管奇形除外), 凝固, 血算, 腎機能, 心電図",probs:"#1 脳出血(被殻出血, 血腫量_mL) #2 高血圧性脳出血 #3 意識障害",course:"気道確保→急性期降圧(SBP 140mmHg目標)→血腫増大予防→手術適応評価(血腫量・意識レベル)→脳浮腫管理→早期リハビリ",disc:"脳出血の急性期血圧管理(INTERACT2/ATACH-2), 手術適応(STICH trial), 再発予防",refs:["Hemphill JC. Stroke 2015;46:2032","日本脳卒中学会. 脳卒中治療ガイドライン2021"]},"くも膜下出血":{prof:"50代女性, 喫煙, 家族歴(SAH)",cc:"突然の激しい頭痛",o:"〇月〇日, 突然の「今までで最悪の頭痛」",p:"突然発症(thunderclap headache), 改善なし",q:"激痛, NRS 10/10, 嘔吐を伴う",r:"後頭部〜項部",s:"嘔吐, 羞明, 項部硬直, 一過性意識消失",t:"突然の激頭痛→嘔吐→意識消失→救急搬送",pe:"意識レベル(Hunt & Kosnik分類/WFNS), 項部硬直, Kernig徴候, 瞳孔, 眼底(硝子体出血)",tests:"頭部CT(くも膜下腔高吸収), CT-A/MRA(動脈瘤同定), 腰椎穿刺(CT陰性時: キサントクロミー), 心電図",probs:"#1 くも膜下出血(Hunt & Kosnik Grade_, Fisher Group_) #2 脳動脈瘤破裂 #3 脳血管攣縮リスク",course:"再破裂予防(早期クリッピング/コイリング)→脳血管攣縮予防(ファスジル/トリプルH)→水頭症管理→リハビリ",disc:"SAHの重症度分類と予後予測, 脳血管攣縮の予防と治療, 未破裂脳動脈瘤の管理",refs:["Connolly ES. Stroke 2012;43:1711","日本脳卒中学会. 脳卒中治療ガイドライン2021"]},"TIA":{prof:"68歳男性, 高血圧, 心房細動(未診断)",cc:"一過性の左上肢脱力と構音障害",o:"〇月〇日, 約15分間の左上肢脱力と構音障害が出現し自然軽快",p:"完全に自然消失",q:"来院時は神経学的異常なし, NIHSS 0点",r:"右大脳半球",s:"一過性視覚障害なし, 頭痛なし",t:"一過性症状→自然軽快→翌日外来受診",pe:"来院時神経学的異常なし, 頸部血管雑音, 心房細動の有無, 血圧",tests:"頭部MRI(DWI: 新規梗塞の有無), MRA, 頸部血管エコー, 心電図, Holter, 心エコー, 血算・凝固・脂質",probs:"#1 TIA(ABCD2スコア_点) #2 脳梗塞リスク評価 #3 心房細動の有無",course:"ABCD2スコア評価→高リスク: 入院精査→抗血小板療法(DAPT 21日→SAPT)→リスク因子管理→AF発見時: 抗凝固療法",disc:"TIAの早期リスク評価(ABCD2), TIA後の脳梗塞発症リスクと早期介入の重要性, CHANCE/POINT trial",refs:["Easton JD. Stroke 2009;40:2276","Johnston SC. N Engl J Med 2018;379:215"]}},"g50":{"パーキンソン病":{prof:"65歳男性, 右手振戦・動作緩慢",cc:"手の震え, 動きにくさ",o:"〇年前から右手の安静時振戦, 〇カ月前から歩行障害",p:"緩徐に進行, ストレスで振戦増悪",q:"安静時振戦(4-6Hz, pill-rolling), 歩行時すくみ",r:"右上肢から開始, 同側下肢へ進展",s:"便秘, 嗅覚低下, REM睡眠行動障害, 小字症",t:"右手振戦→動作緩慢→前医受診→パーキンソン病疑い→当院紹介",pe:"安静時振戦, 筋強剛(歯車様), 無動・寡動, 姿勢反射障害, 仮面様顔貌, 前傾姿勢, 小刻み歩行",tests:"頭部MRI(他疾患除外), DATスキャン(DAT低下), MIBG心筋シンチ(H/M比低下), 嗅覚検査",probs:"#1 パーキンソン病(Hoehn-Yahr_度) #2 非運動症状(便秘・嗅覚低下・睡眠障害) #3 ADL評価",course:"レボドパ or ドパミンアゴニスト開始→用量調整→運動合併症管理(wearing-off, ジスキネジア)→リハビリ→進行期: DBS/LCIG検討",disc:"パーキンソン病の診断基準(MDS), レボドパ vs ドパミンアゴニストの初期治療選択, 運動合併症の管理",refs:["Postuma RB. Mov Disord 2015;30:1591","日本神経学会. パーキンソン病診療ガイドライン2018"]},"多系統萎縮症":{prof:"55歳男性, 小脳失調・自律神経障害",cc:"ふらつき, 起立性低血圧, 排尿障害",o:"〇年前から歩行時のふらつき, 〇カ月前から失神",p:"緩徐に進行, 改善なし",q:"小脳性運動失調, 起立性低血圧(収縮期30mmHg以上低下)",r:"小脳, 自律神経系",s:"排尿障害(残尿増加), 便秘, 構音障害, REM睡眠行動障害",t:"小脳失調→起立性低血圧→排尿障害→前医で精査→当院紹介",pe:"小脳性運動失調(指鼻試験・踵膝試験), 起立試験, パーキンソニズムの有無, 構音障害, Babinski徴候",tests:"頭部MRI(小脳・橋萎縮, hot cross bun sign), 起立試験, 残尿測定, DATスキャン, MIBG心筋シンチ",probs:"#1 多系統萎縮症(MSA-C/MSA-P) #2 自律神経障害 #3 排尿障害",course:"対症療法(起立性低血圧: ドロキシドパ, 排尿障害: 間欠導尿)→リハビリ→嚥下機能評価→呼吸管理(声帯麻痺/CPAP)→多職種連携",disc:"MSAの臨床病型(MSA-C vs MSA-P)と診断基準, 自律神経障害の管理, 突然死のリスク(声帯外転麻痺)",refs:["Gilman S. Neurology 2008;71:670","Wenning GK. Lancet Neurol 2022;21:203"]},"進行性核上性麻痺":{prof:"68歳男性, 転倒を繰り返す, 垂直性眼球運動障害",cc:"頻回の後方転倒, 視線が下に向けにくい",o:"〇年前から転倒が増加, 〇カ月前から下方視障害",p:"緩徐に進行, レボドパ無効",q:"後方への易転倒性, 垂直性核上性眼球運動障害",r:"中脳, 基底核",s:"構音障害, 嚥下障害, 性格変化(無関心), 頸部後屈",t:"転倒増加→パーキンソン病疑い→レボドパ無効→PSP疑い→当院紹介",pe:"垂直性眼球運動障害(特に下方視), 頸部後屈(retrocollis), 体軸優位の筋強剛, 仮面様顔貌, 姿勢不安定(pull test陽性)",tests:"頭部MRI(中脳萎縮, hummingbird sign), DATスキャン, レボドパ試験(反応不良)",probs:"#1 進行性核上性麻痺(PSP-RS) #2 姿勢不安定・易転倒性 #3 嚥下障害",course:"レボドパ試験→転倒予防(リハビリ・環境調整)→嚥下評価→栄養管理→介護調整→緩和ケア",disc:"PSPの臨床亜型とパーキンソン病との鑑別, レボドパ反応性, 生命予後と嚥下機能",refs:["Höglinger GU. Mov Disord 2017;32:853","Boxer AL. Lancet Neurol 2017;16:552"]},"脊髄小脳変性症":{prof:"45歳男性, 家族歴あり(常染色体優性遺伝)",cc:"歩行時のふらつき, 構音障害",o:"〇年前から歩行時のふらつき, 緩徐に進行",p:"緩徐に進行, 改善なし",q:"小脳性運動失調(酩酊様歩行), 構音障害(断綴性言語)",r:"小脳(虫部・半球)",s:"書字困難, 眼振, 嚥下障害(進行期)",t:"歩行障害→進行→家族歴あり→遺伝子検査目的で当院紹介",pe:"小脳性運動失調(指鼻試験・踵膝試験・Romberg), 断綴性言語, 眼振(注視方向性), 測定障害, 企図振戦",tests:"頭部MRI(小脳萎縮), 遺伝子検査(SCA1/2/3/6/31等), 末梢神経伝導検査, 血液検査(二次性除外: VitB12, VitE, 甲状腺)",probs:"#1 脊髄小脳変性症(SCA_型/孤発性) #2 小脳性運動失調 #3 遺伝カウンセリング",course:"遺伝子診断→リハビリ(バランス訓練・歩行訓練)→対症療法(タルチレリン)→嚥下評価→遺伝カウンセリング→社会資源活用",disc:"SCDの臨床分類と遺伝子型, 孤発性SCDとMSA-Cの鑑別, リハビリテーションの意義",refs:["Klockgether T. Nat Rev Dis Primers 2019;5:24","日本神経学会. 脊髄小脳変性症・多系統萎縮症診療ガイドライン2018"]}},"g51":{"多発性硬化症":{prof:"30代女性, 視力低下・四肢のしびれ",cc:"左眼の視力低下, 両下肢のしびれ",o:"〇週間前から左眼の視力低下, 〇カ月前に両下肢のしびれ(別エピソード)",p:"数日かけて進行, 数週で部分改善",q:"左眼視力0.3, 両下肢のしびれ・脱力",r:"視神経, 脊髄",s:"Uhthoff現象(入浴で悪化), Lhermitte徴候, 疲労感, 排尿障害",t:"視力低下(再発)→前医でMRI→多発白質病変→MS疑い→当院紹介",pe:"視力・色覚, RAPD(Marcus Gunn瞳孔), 深部腱反射亢進, Babinski徴候, 感覚障害, EDSS評価",tests:"頭部・脊髄MRI(T2/FLAIR: 空間的多発), 造影MRI(時間的多発), 髄液(OCB, IgG index), VEP, 抗AQP4抗体・抗MOG抗体(除外)",probs:"#1 多発性硬化症(RRMS, EDSS_) #2 視神経炎 #3 脊髄炎",course:"急性期: ステロイドパルス→DMT導入(IFNβ/フィンゴリモド/ナタリズマブ等)→再発予防→リハビリ→EDSS定期評価",disc:"MSの診断基準(McDonald 2017: DIS+DIT), DMTの選択(escalation vs induction), NMOSDとの鑑別",refs:["Thompson AJ. Lancet 2018;391:1622","日本神経学会. 多発性硬化症・視神経脊髄炎スペクトラム障害診療ガイドライン2023"]},"NMOSD":{prof:"40代女性, 重度の視力低下・横断性脊髄炎",cc:"両眼の急激な視力低下, 両下肢麻痺",o:"〇日前から急激に両眼の視力が低下, 両下肢の脱力",p:"急速に進行(数日), ステロイド反応性",q:"両眼視力<0.1, 両下肢MMT 2/5, 膀胱直腸障害",r:"視神経(両側), 脊髄(3椎体以上の長大病変)",s:"難治性吃逆, 嘔吐, 排尿障害",t:"急激な視力低下+下肢麻痺→前医でMRI→長大脊髄病変→抗AQP4抗体陽性→当院搬送",pe:"視力・視野, 瞳孔反応(RAPD), 運動・感覚レベル, 膀胱直腸障害, area postrema症状",tests:"頭部・脊髄MRI(3椎体以上の脊髄病変), 抗AQP4抗体(CBA法), 髄液(細胞数↑, OCB陰性が多い), VEP",probs:"#1 NMOSD(抗AQP4抗体陽性) #2 視神経炎(両側性) #3 横断性脊髄炎",course:"急性期: ステロイドパルス→血漿交換(不応時)→再発予防(リツキシマブ/エクリズマブ/サトラリズマブ)→リハビリ",disc:"NMOSDとMSの鑑別, 抗AQP4抗体の病態的意義, 再発予防薬のエビデンス(PREVENT/SAkuraStar/SAkuraSky trial)",refs:["Wingerchuk DM. Neurology 2015;85:177","Pittock SJ. N Engl J Med 2019;381:614"]},"急性散在性脳脊髄炎（ADEM）":{prof:"8歳男児, ワクチン接種2週間後",cc:"発熱, 頭痛, 意識障害, 多巣性神経症状",o:"ワクチン接種〇週間後に発熱・頭痛, 〇日前から意識レベル低下",p:"急性発症, 数日で進行",q:"意識障害(GCS 12), 両下肢脱力, 失調",r:"大脳白質(多発), 脊髄",s:"頭痛, 嘔吐, 痙攣(小児で多い), 脳神経麻痺",t:"先行感染/ワクチン→発熱→神経症状出現→急速悪化→救急搬送",pe:"意識レベル, 髄膜刺激徴候, 多巣性神経徴候(運動・感覚・小脳), 視神経障害, 脳神経麻痺",tests:"頭部・脊髄MRI(T2/FLAIR: 散在性白質病変, 灰白質も), 髄液(細胞数↑, 蛋白↑), 抗AQP4/MOG抗体, EEG",probs:"#1 ADEM #2 意識障害 #3 先行イベント(感染/ワクチン)",course:"ステロイドパルス→効果不十分時: IVIG or 血漿交換→脳浮腫管理→リハビリ→MRIフォロー(MSへの移行監視)",disc:"ADEMの診断基準とMSとの鑑別(特に小児), 単相性 vs 再発性, 抗MOG抗体関連疾患との関係",refs:["Pohl D. Neurology 2016;87:S38","Krupp LB. Neurology 2013;81:S28"]}},"g52":{"ギラン・バレー症候群":{prof:"35歳男性, 先行感染後の四肢脱力",cc:"両下肢の脱力, しびれ(上行性)",o:"感冒〇週間後から両足のしびれ, 〇日前から歩行困難",p:"上行性に進行, 数日で四肢へ",q:"両下肢MMT 3/5→両上肢にも進展, 深部腱反射消失",r:"四肢末梢(遠位→近位), 左右対称",s:"呼吸困難(進行時), 自律神経障害(血圧変動, 頻脈), 顔面神経麻痺",t:"先行感染→下肢しびれ→歩行困難→上肢にも進展→救急搬送",pe:"四肢筋力(MRC sum score), 深部腱反射消失, 呼吸機能(VC, 咳嗽力), 脳神経(顔面神経), 自律神経",tests:"髄液(蛋白細胞解離), 神経伝導検査(脱髄型/軸索型), 抗ガングリオシド抗体(GM1, GQ1b等), VC連日測定, 心電図モニター",probs:"#1 ギラン・バレー症候群(AIDP/AMAN/AMSAN) #2 呼吸不全リスク #3 自律神経障害",course:"呼吸管理(VCモニタリング→挿管基準)→IVIG or 血漿交換→リハビリ→合併症予防(DVT, 疼痛)→機能回復フォロー",disc:"GBSの病型分類と抗体プロファイル, IVIG vs 血漿交換, 呼吸不全の予測因子(EGRIS), 予後予測(mEGOS)",refs:["Willison HJ. Lancet 2016;388:717","Walgaard C. Ann Neurol 2010;67:781"]},"CIDP":{prof:"50代男性, 2カ月以上進行する四肢脱力",cc:"両手の握力低下, 歩行障害",o:"〇カ月前から緩徐に進行する四肢末梢の脱力としびれ",p:"2カ月以上かけて緩徐に進行",q:"四肢遠位優位の筋力低下, 深部腱反射消失",r:"四肢(遠位・近位), 左右対称",s:"感覚障害(手袋靴下型), 疲労感, 歩行不安定",t:"緩徐進行性の四肢脱力→前医で精査→CIDPの疑い→当院紹介",pe:"四肢筋力(遠位>近位), 深部腱反射消失, 感覚障害(振動覚・位置覚低下), 末梢神経肥厚, Romberg陽性",tests:"神経伝導検査(多巣性脱髄: 伝導遅延, 伝導ブロック), 髄液(蛋白↑), 神経エコー/MRI(神経肥厚), 抗体(抗MAG等)",probs:"#1 CIDP(典型型/非典型型) #2 慢性脱髄性ニューロパチー #3 ADL障害",course:"IVIG(第一選択)→効果判定→維持IVIG or ステロイド→血漿交換(不応時)→リハビリ→長期維持療法",disc:"CIDPの診断基準(EFNS/PNS 2021), GBSとの鑑別(経過の違い), 治療反応性と長期管理, CIDP mimicsの除外",refs:["Van den Bergh PYK. J Peripher Nerv Syst 2021;26:242","Lehmann HC. Nat Rev Neurol 2019;15:263"]},"重症筋無力症":{prof:"30代女性, 眼瞼下垂・複視",cc:"夕方に悪化する眼瞼下垂, 複視",o:"〇カ月前から夕方に目が開きにくい, 〇週間前から複視",p:"日内変動(夕方増悪), 休息で軽減",q:"両側眼瞼下垂, 複視, 易疲労性",r:"外眼筋(初発), 四肢近位筋(進展時)",s:"構音障害, 嚥下障害, 呼吸困難(クリーゼ時)",t:"眼瞼下垂・複視→前医で抗AChR抗体陽性→当院紹介",pe:"眼瞼下垂(Simpson test), 複視, 四肢近位筋力, 嚥下機能, 呼吸機能(VC), アイスパック試験",tests:"抗AChR抗体(陰性時: 抗MuSK抗体), 反復神経刺激試験(waning), テンシロンテスト, 胸部CT(胸腺腫), VC",probs:"#1 重症筋無力症(MGFA分類: Class_) #2 眼筋型 or 全身型 #3 胸腺腫の有無",course:"ChEI(ピリドスチグミン)→免疫療法(PSL→ステロイドスペアリング: タクロリムス/AZA)→胸腺摘除(胸腺腫/早期発症)→クリーゼ対策",disc:"MGの病型分類(抗体別)と治療戦略, 胸腺摘除の適応, クリーゼの管理, fast-track治療",refs:["Gilhus NE. N Engl J Med 2016;375:2570","Sanders DB. Neurology 2016;87:419"]},"ALS":{prof:"60代男性, 上肢の筋力低下・筋萎縮",cc:"右手の筋力低下, 筋萎縮, 線維束攣縮",o:"〇カ月前から右手の筋力低下と筋萎縮が緩徐に進行",p:"緩徐に進行, 改善なし",q:"右手内在筋萎縮, 線維束攣縮, split hand",r:"右上肢(初発)→対側・下肢へ進展",s:"構音障害(球麻痺型), 嚥下障害, 呼吸機能低下, 感覚障害なし",t:"右手筋力低下→進行→前医で精査→上位・下位運動ニューロン徴候→ALS疑い→当院紹介",pe:"下位MN徴候(筋萎縮, 線維束攣縮), 上位MN徴候(腱反射亢進, Babinski, 痙縮), 球症状, 呼吸機能, 認知機能(FTD合併)",tests:"針筋電図(広範な脱神経), 神経伝導検査(感覚正常), 頭部・脊髄MRI(mimics除外), VC, 血液(CK, 抗GM1抗体等除外)",probs:"#1 ALS(Awaji基準/Gold Coast基準: definite/probable/possible) #2 球麻痺(あれば) #3 呼吸機能低下",course:"告知→リルゾール/エダラボン→リハビリ→嚥下評価→PEG検討→NPPV導入→多職種連携→ACP→緩和ケア",disc:"ALSの診断基準と鑑別(treatable mimics: MMN, CIDP等), 呼吸管理の意思決定, ACP(advance care planning)",refs:["van Es MA. Lancet 2017;390:2084","Shefner JM. Amyotroph Lateral Scler Frontotemporal Degener 2020;21:1"]},"多発性筋炎・皮膚筋炎":{prof:"50代女性, 近位筋の筋力低下, 皮疹",cc:"階段昇降困難, 両上肢挙上困難, ヘリオトロープ疹",o:"〇カ月前から近位筋の筋力低下が進行, 眼瞼周囲の紫紅色皮疹",p:"緩徐に進行, 筋痛あり",q:"近位筋MMT 3-4/5, CK 3000 U/L",r:"四肢近位筋(対称性), 顔面・手指(皮疹)",s:"嚥下障害, 間質性肺炎(あれば), Gottron丘疹, 機械工の手",t:"筋力低下+皮疹→前医でCK高値→筋炎疑い→当院紹介",pe:"近位筋筋力(頸屈筋, 三角筋, 腸腰筋), ヘリオトロープ疹, Gottron丘疹/徴候, 機械工の手, V sign, Shawl sign, 肺聴診",tests:"CK, アルドラーゼ, 筋炎特異的抗体(抗ARS/MDA5/TIF1γ/Mi-2), 筋電図, 筋MRI, 筋生検, 胸部CT(ILD), 悪性腫瘍スクリーニング",probs:"#1 皮膚筋炎/多発性筋炎(筋炎特異的抗体: _) #2 間質性肺炎(あれば) #3 悪性腫瘍合併リスク",course:"ステロイド(PSL 1mg/kg)→免疫抑制薬(AZA/MTX/タクロリムス)→ILD合併時: 積極的治療→悪性腫瘍検索→リハビリ→筋力・CKフォロー",disc:"筋炎特異的抗体による病型分類と治療戦略, 抗MDA5抗体陽性DM(急速進行性ILD), 悪性腫瘍合併のスクリーニング",refs:["Lundberg IE. Lancet 2021;397:200","Sato S. Curr Opin Rheumatol 2015;27:601"]}},"g53":{"てんかん（各種）":{prof:"25歳男性, 初発の強直間代発作",cc:"全身痙攣, 意識消失",o:"〇月〇日, 睡眠不足の翌朝に突然の意識消失・全身痙攣",p:"1-2分で自然停止, 発作後もうろう状態",q:"強直間代発作, 舌咬傷, 尿失禁",r:"全般性",s:"発作後頭痛, 筋肉痛, 健忘",t:"初発痙攣→救急搬送→発作後状態で来院",pe:"意識レベル(発作後), 舌咬傷, 外傷の有無, 神経学的所見(Todd麻痺), バイタル",tests:"血液(電解質, 血糖, Ca, Mg, CK, 薬物スクリーニング), 脳波(発作間欠期), 頭部MRI, 心電図(QT延長除外)",probs:"#1 てんかん(初発痙攣発作, 発作型: 全般性/焦点性) #2 症候性てんかんの除外 #3 誘発因子(睡眠不足等)",course:"初発発作→二次性原因除外→再発リスク評価→AED開始の判断(再発リスク高: 開始)→運転制限指導→生活指導",disc:"てんかんの分類(ILAE 2017), 初発痙攣発作後のAED開始基準, AEDの選択(焦点性 vs 全般性)",refs:["Fisher RS. Epilepsia 2017;58:512","Scheffer IE. Epilepsia 2017;58:512"]},"てんかん重積状態":{prof:"40代女性, 既知のてんかん, 服薬中断",cc:"持続する痙攣, 意識障害",o:"AED中断〇日後に痙攣が出現, 5分以上持続/反復",p:"痙攣が30分以上持続, 間欠期にも意識回復なし",q:"強直間代発作の重積, GCS 6",r:"全般性",s:"発熱(あれば), チアノーゼ, 誤嚥リスク",t:"痙攣持続→家族が救急要請→到着時も痙攣持続",pe:"痙攣の持続/間欠, 意識レベル, バイタル(低酸素, 高体温), 瞳孔, 外傷",tests:"血液ガス(アシドーシス), 電解質, 血糖, CK, AED血中濃度, 血液培養(感染疑い時), 脳波(NCSE除外), 頭部CT/MRI",probs:"#1 てんかん重積状態(全般性痙攣性) #2 AED中断 #3 全身合併症(横紋筋融解・アシドーシス・誤嚥)",course:"ABCの確保→ベンゾジアゼピン(ジアゼパム/ミダゾラム)→第二段階: ホスフェニトイン/レベチラセタム→不応時: 全身麻酔(ミダゾラム/プロポフォール持続)→原因治療→AED再調整",disc:"てんかん重積の段階的治療プロトコル, 非痙攣性てんかん重積(NCSE)の診断, 難治性重積への対応",refs:["Trinka E. Epilepsia 2015;56:1515","Glauser T. Epilepsy Curr 2016;16:48"]},"意識障害の鑑別":{prof:"70代男性, 意識障害で搬送",cc:"反応低下, 意識混濁",o:"家族が呼びかけに反応がないことに気付き救急要請",p:"急性発症",q:"JCS II-20, GCS E2V3M5",r:"全身(意識障害)",s:"発熱の有無, 外傷の有無, 嘔吐, 頭痛",t:"意識障害→救急搬送",pe:"GCS/JCS, 瞳孔(大きさ・対光反射), 眼球運動, 項部硬直, 運動麻痺(左右差), 外傷, バイタル, 簡易血糖",tests:"AIUEOTIPS系統的検索: 血糖, 血液ガス, 電解質(Na/Ca/Mg), 腎機能, 肝機能, NH3, 甲状腺機能, 薬物スクリーニング, 頭部CT, 心電図",probs:"#1 意識障害(原因検索中) #2 バイタル異常(あれば) #3 器質的原因 vs 代謝性原因",course:"ABC確保→簡易血糖→バイタル安定化→AIUEOTIPS系統的評価→頭部CT→必要時MRI/髄液→原因に応じた治療開始",disc:"意識障害の系統的アプローチ(AIUEOTIPS), 器質的原因 vs 代謝性原因の鑑別, 緊急治療を要する原因の迅速同定",refs:["Edlow JA. N Engl J Med 2021;384:555","Posner JB. Plum and Posner's Diagnosis of Stupor and Coma. 5th ed."]},"代謝性脳症":{prof:"65歳男性, 肝硬変, 意識変容",cc:"見当識障害, 異常行動, 羽ばたき振戦",o:"〇日前から見当識障害, 昨日から傾眠傾向",p:"緩徐に進行, 便秘後に増悪",q:"JCS I-3〜II-10, 羽ばたき振戦(+), 意識変容",r:"びまん性脳機能障害",s:"便秘, 消化管出血, 利尿薬増量, 感染",t:"肝硬変→便秘/感染契機→意識変容→当院受診",pe:"意識レベル, 羽ばたき振戦(asterixis), 黄疸, 腹水, 肝性口臭(fetor hepaticus)",tests:"NH3, 血液ガス, 電解質, 血糖, 腎機能, 肝機能, 感染検索, 頭部CT(器質的疾患除外), 脳波(三相波)",probs:"#1 肝性脳症(West-Haven分類Grade_) #2 肝硬変(Child-Pugh_) #3 誘因(_)",course:"誘因検索・除去(感染治療・消化管出血止血・便秘改善)→ラクツロース→リファキシミン→蛋白制限(急性期のみ)→BCAA→再発予防",disc:"肝性脳症の誘因と治療, West-Haven分類, ラクツロース+リファキシミンのエビデンス, 他の代謝性脳症との鑑別",refs:["Vilstrup H. Hepatology 2014;60:715","Rose CF. J Hepatol 2020;73:1526"]}},"g54":{"細菌性髄膜炎":{prof:"55歳男性, 急性発症の発熱・頭痛・意識障害",cc:"高熱, 激しい頭痛, 項部硬直",o:"〇日前から発熱・頭痛, 本日意識レベル低下",p:"急速に進行(数時間〜1日)",q:"体温39.5℃, 激しい頭痛, 項部硬直著明",r:"髄膜(びまん性)",s:"嘔吐, 羞明, 痙攣(あれば), 皮疹(髄膜炎菌)",t:"発熱・頭痛→急速悪化→項部硬直→救急搬送",pe:"意識レベル, 項部硬直, Kernig/Brudzinski徴候, 皮疹(点状出血/紫斑), 脳神経麻痺, 眼底(乳頭浮腫除外→LP)",tests:"血液培養2セット→腰椎穿刺(細胞数↑↑, 蛋白↑, 糖↓, グラム染色, 培養)→頭部CT(LP前: 占拠性病変除外), CRP, PCT, 血算",probs:"#1 細菌性髄膜炎(起因菌: 肺炎球菌/髄膜炎菌/リステリア) #2 意識障害 #3 脳圧亢進",course:"血培→デキサメタゾン+経験的抗菌薬(CTRX+VCM±ABPC)→グラム染色・培養で最適化→2-3週間→合併症管理(SIADH, 水頭症, 脳膿瘍)",disc:"細菌性髄膜炎の経験的治療(年齢・リスク別), デキサメタゾン併用のエビデンス(de Gans trial), LP前CT撮影の適応",refs:["van de Beek D. N Engl J Med 2006;354:44","Tunkel AR. Clin Infect Dis 2004;39:1267"]},"ウイルス性脳炎":{prof:"30代女性, 発熱・痙攣・異常行動",cc:"発熱, 痙攣, 異常行動, 意識障害",o:"〇日前から発熱と頭痛, 昨日から異常行動, 本日痙攣",p:"数日かけて進行",q:"体温38.5℃, GCS 10, 痙攣(部分発作), 異常行動(記銘力障害, 人格変化)",r:"側頭葉(HSV脳炎), びまん性",s:"嗅覚・味覚異常(側頭葉), 失語, 幻覚",t:"発熱→異常行動→痙攣→救急搬送",pe:"意識レベル, 痙攣の型, 失語, 記銘力障害, 項部硬直(軽度), 脳神経麻痺, 局所神経徴候",tests:"頭部MRI(側頭葉T2/FLAIR高信号: HSV), 髄液(リンパ球↑, 蛋白↑, 糖正常, HSV-PCR), 脳波(PLEDs), 血清/髄液抗体",probs:"#1 ウイルス性脳炎(単純ヘルペス脳炎疑い) #2 痙攣 #3 意識障害",course:"アシクロビル即時投与(HSV脳炎想定)→髄液PCR結果確認→抗痙攣薬→脳浮腫管理→リハビリ→高次脳機能評価",disc:"HSV脳炎の早期診断と治療開始の重要性, 自己免疫性脳炎との鑑別, 後遺症(高次脳機能障害)への対応",refs:["Steiner I. Eur J Neurol 2010;17:999","Venkatesan A. Neurology 2013;81:1159"]},"結核性髄膜炎":{prof:"45歳男性, HIV陽性, 亜急性の頭痛・意識障害",cc:"持続する頭痛, 微熱, 意識変容",o:"〇週間前から頭痛と微熱, 緩徐に意識レベル低下",p:"亜急性(数日〜数週), 緩徐に進行",q:"微熱持続, 頭痛, 脳神経麻痺(外転神経等)",r:"脳底部髄膜",s:"体重減少, 盗汗, 嘔吐",t:"亜急性の頭痛→微熱持続→意識変容→救急搬送",pe:"意識レベル, 項部硬直, 脳神経麻痺(III, VI, VII), 眼底(結核腫, 乳頭浮腫)",tests:"髄液(リンパ球↑, 蛋白↑↑, 糖↓↓, ADA↑, 抗酸菌塗抹/培養, TB-PCR), 頭部造影MRI(脳底部髄膜増強, 水頭症), 胸部CT, HIV検査",probs:"#1 結核性髄膜炎(MRC Grade_) #2 HIV感染症 #3 水頭症",course:"抗結核薬4剤(INH+RFP+PZA+EB)→デキサメタゾン併用→水頭症管理(VP shunt)→HIV治療(IRIS注意)→長期治療(9-12カ月)",disc:"結核性髄膜炎の診断の困難さと経験的治療の重要性, ステロイド併用のエビデンス(Thwaites trial), HIV合併時のIRIS",refs:["Thwaites GE. N Engl J Med 2004;351:1741","Marais S. Lancet Infect Dis 2010;10:251"]},"クリプトコッカス髄膜炎":{prof:"40代男性, HIV陽性(CD4<100), 頭痛",cc:"慢性頭痛, 発熱, 視力障害",o:"〇週間前から持続する頭痛, 微熱",p:"亜急性〜慢性, 緩徐に進行",q:"頭痛(頭蓋内圧亢進), 微熱, 嘔吐",r:"脳底部髄膜",s:"視力障害(乳頭浮腫), 意識変容, 脳神経麻痺",t:"慢性頭痛→HIV陽性判明→髄液検査→当院紹介",pe:"意識レベル, 項部硬直(軽度), 乳頭浮腫, 脳神経麻痺, 髄膜刺激徴候",tests:"髄液(開放圧↑↑, リンパ球↑, 蛋白↑, 糖↓, 墨汁染色, クリプトコッカス抗原, 培養), 血清クリプトコッカス抗原, 頭部MRI, CD4数",probs:"#1 クリプトコッカス髄膜炎 #2 HIV/AIDS(CD4<100) #3 頭蓋内圧亢進",course:"導入: AmB+5-FC(2週)→地固め: FLCZ 高用量(8週)→維持: FLCZ(長期)→頭蓋内圧管理(反復LP/ドレナージ)→ART開始(2-4週後, IRIS注意)",disc:"クリプトコッカス髄膜炎の段階的治療, 頭蓋内圧管理の重要性(死亡率低減), ART開始時期とIRIS",refs:["Perfect JR. Clin Infect Dis 2010;50:291","Molloy SF. N Engl J Med 2018;378:1004"]},"自己免疫性脳炎":{prof:"25歳女性, 精神症状・痙攣",cc:"急性発症の精神症状, 痙攣, 意識障害",o:"〇週間前から不眠・不安, 〇日前から幻覚・異常行動, 痙攣",p:"急性〜亜急性に進行",q:"精神症状(幻覚, 妄想, 興奮), 痙攣, 不随意運動(口顔面ジスキネジア)",r:"辺縁系(側頭葉内側)",s:"自律神経障害(頻脈, 高体温, 低換気), 記銘力障害",t:"精神症状→痙攣→精神科受診→器質的疾患疑い→当院転院",pe:"精神状態(興奮, 緊張病様), 口顔面ジスキネジア, 痙攣, 自律神経不安定, 意識レベル",tests:"髄液(軽度細胞増多), 頭部MRI(側頭葉内側T2高信号), 脳波(extreme delta brush), 抗NMDA受容体抗体, 卵巣奇形腫検索(骨盤MRI/エコー)",probs:"#1 自己免疫性脳炎(抗NMDA受容体抗体脳炎疑い) #2 痙攣 #3 卵巣奇形腫の有無",course:"免疫療法1st line(ステロイドパルス+IVIG or 血漿交換)→腫瘍検索・摘出→2nd line(リツキシマブ/CPA)→長期フォロー(再発監視)→リハビリ",disc:"抗NMDA受容体抗体脳炎の臨床像と段階的治療, 精神疾患との鑑別の重要性, 傍腫瘍症候群としての位置づけ",refs:["Dalmau J. Lancet Neurol 2019;18:1045","Graus F. Lancet Neurol 2016;15:391"]}},"g55":{"片頭痛":{prof:"30代女性, 月経関連の反復性頭痛",cc:"拍動性頭痛, 嘔気, 光過敏",o:"10代から反復性頭痛, 今回〇日前から増悪",p:"月経前後に増悪, 暗室で安静にすると軽減",q:"片側性拍動性, NRS 7/10, 4-72時間持続",r:"片側(右 or 左)前頭側頭部",s:"嘔気・嘔吐, 光過敏, 音過敏, 前兆(閃輝暗点)の有無",t:"反復性頭痛→頻度増加(月10日以上)→前医で鎮痛薬多用→当院紹介",pe:"神経学的所見正常(発作間欠期), バイタル正常, 二次性頭痛の除外(項部硬直なし, 乳頭浮腫なし)",tests:"頭部MRI(二次性頭痛除外), 頭痛ダイアリー, 血液検査(二次性原因除外)",probs:"#1 片頭痛(前兆あり/なし, 反復性/慢性) #2 薬物乱用頭痛(あれば) #3 月経関連片頭痛",course:"急性期治療(トリプタン, NSAIDs)→予防療法(月4回以上: バルプロ酸/アミトリプチリン/プロプラノロール/CGRP関連抗体)→生活指導→頭痛ダイアリー",disc:"片頭痛の診断基準(ICHD-3), 急性期治療と予防療法の選択, CGRP関連抗体の位置づけ, 薬物乱用頭痛の予防",refs:["Charles A. N Engl J Med 2017;377:553","Ashina M. Lancet 2021;397:1505"]},"群発頭痛":{prof:"35歳男性, 夜間の激烈な片側眼窩部痛",cc:"片側眼窩部の激痛, 流涙, 鼻閉",o:"〇週間前から毎晩決まった時間に右眼窩部の激痛(群発期)",p:"15-180分持続, 飲酒で誘発, 季節性",q:"激痛, NRS 10/10, じっとしていられない(興奮・歩き回る)",r:"片側眼窩部〜側頭部",s:"同側の流涙, 結膜充血, 鼻閉/鼻漏, 縮瞳, 眼瞼下垂(Horner様)",t:"毎晩の激頭痛→前医で鎮痛薬無効→当院紹介",pe:"発作時: 同側の自律神経症状(流涙, 結膜充血, 鼻閉, Horner徴候), 発作間欠期: 異常なし",tests:"頭部MRI(二次性除外, 下垂体病変除外), 頭痛ダイアリー",probs:"#1 群発頭痛(反復性/慢性) #2 三叉神経・自律神経性頭痛(TACs)",course:"急性期: スマトリプタン皮下注 or 100%酸素吸入→予防療法(ベラパミル→ステロイド短期併用)→群発期終了まで継続",disc:"群発頭痛の診断と鑑別(他のTACs), 急性期治療(酸素 vs トリプタン), 予防療法の選択",refs:["May A. N Engl J Med 2005;352:1800","Headache Classification Committee. Cephalalgia 2018;38:1"]},"緊張型頭痛":{prof:"40代女性, デスクワーク, 慢性頭痛",cc:"両側性の締め付けるような頭痛",o:"〇年前から頭痛が持続, ほぼ毎日",p:"午後に増悪, ストレス・疲労で悪化, 休息で軽減",q:"両側性, 圧迫感・締め付け感, NRS 3-5/10",r:"両側性(前頭部〜後頭部, 帽子をかぶったような)",s:"嘔気なし(あっても軽度), 光過敏・音過敏(あっても軽度), 肩こり",t:"慢性頭痛→OTC鎮痛薬多用→改善不十分→当院受診",pe:"頭蓋周囲筋の圧痛(側頭筋, 僧帽筋, 後頸筋), 神経学的所見正常",tests:"頭部MRI(二次性頭痛除外), 頭痛ダイアリー",probs:"#1 慢性緊張型頭痛 #2 薬物乱用頭痛(あれば) #3 ストレス・姿勢不良",course:"急性期: NSAIDs/アセトアミノフェン(頻度制限)→予防療法(アミトリプチリン)→非薬物療法(ストレス管理, 姿勢改善, 理学療法)→薬物乱用頭痛の離脱",disc:"緊張型頭痛の診断基準(ICHD-3), 片頭痛との鑑別, 慢性化の予防, 薬物乱用頭痛のリスク",refs:["Jensen R. Lancet Neurol 2008;7:70","Headache Classification Committee. Cephalalgia 2018;38:1"]},"BPPV":{prof:"55歳女性, 体位変換時の回転性めまい",cc:"寝返り時のめまい, 嘔気",o:"〇日前から寝返りや起き上がり時に回転性めまいが出現",p:"体位変換で誘発, 安静で1分以内に軽減",q:"回転性めまい, 数十秒持続, 体位変換時のみ",r:"(患側の)半規管",s:"嘔気, ふらつき. 難聴なし, 耳鳴なし",t:"体位変換時めまい→数日持続→耳鼻科/神経内科受診",pe:"Dix-Hallpike試験(後半規管型: 患側で回旋性眼振), supine roll test(外側半規管型), 神経学的異常なし",tests:"Dix-Hallpike/supine roll test, 頭部MRI(中枢性めまいの除外, 必要時), 聴力検査",probs:"#1 BPPV(後半規管型/外側半規管型, 患側: 右/左) #2 中枢性めまいの除外",course:"耳石置換法(Epley法: 後半規管型/Lempert法: 外側半規管型)→生活指導→再発時の自己施行指導→難治性: 経過観察 or 手術",disc:"BPPVの診断(Dix-Hallpike/supine roll test)と病型分類, 耳石置換法の手技, 中枢性めまいとの鑑別Red flags",refs:["Kim JS. N Engl J Med 2020;382:64","Bhattacharyya N. Otolaryngol Head Neck Surg 2017;156:S1"]},"メニエール病":{prof:"45歳女性, 反復する回転性めまい・難聴",cc:"回転性めまい, 耳鳴, 難聴, 耳閉感",o:"〇年前から反復する回転性めまい発作, 今回〇日前から",p:"発作は20分〜数時間持続, 自然軽減, 反復性",q:"回転性めまい(数時間), 低音障害型感音難聴",r:"片側(右/左)内耳",s:"耳鳴(低音), 耳閉感, 嘔気・嘔吐, 聴力の変動",t:"反復性めまい発作→片側難聴進行→耳鼻科受診→当院紹介",pe:"急性期: 水平性眼振(健側向き), 難聴(Weber: 健側偏位, Rinne: 患側陰性化), 神経学的異常なし",tests:"純音聴力検査(低音障害型感音難聴), グリセロール試験, 蝸電図, 頭部MRI(聴神経腫瘍除外), カロリック試験",probs:"#1 メニエール病(確実例/疑い例, 患側: 右/左) #2 低音障害型感音難聴 #3 内リンパ水腫",course:"急性期: 制吐薬+抗めまい薬→間欠期: 生活指導(減塩, ストレス管理)→イソソルビド→利尿薬→難治性: 内リンパ嚢開放術/ゲンタマイシン鼓室内投与",disc:"メニエール病の診断基準と鑑別, 内リンパ水腫の病態, 段階的治療戦略",refs:["Lopez-Escamez JA. Auris Nasus Larynx 2015;42:429","Nakashima T. Auris Nasus Larynx 2016;43:583"]}},"g56":{"アナフィラキシー":{prof:"25歳女性, 蜂刺傷後の全身症状",cc:"全身蕁麻疹, 呼吸困難, 血圧低下",o:"蜂に刺された〇分後から全身蕁麻疹, 喉の違和感, 血圧低下",p:"急速進行(数分〜30分)",q:"全身蕁麻疹, 喉頭浮腫, BP 80/50mmHg",r:"全身(皮膚, 呼吸器, 循環器, 消化器)",s:"嘔気・嘔吐, 腹痛, 喘鳴, 意識障害",t:"蜂刺傷→数分で全身症状→救急搬送",pe:"皮膚(蕁麻疹, 紅潮, 血管性浮腫), 気道(喉頭浮腫, 喘鳴, stridor), バイタル(低血圧, 頻脈), 意識レベル",tests:"臨床診断が優先(検査で治療を遅らせない), 事後: 血清トリプターゼ(発症後1-2h), 特異的IgE, 皮膚プリックテスト",probs:"#1 アナフィラキシー(Grade_) #2 アナフィラキシーショック(低血圧あれば) #3 原因検索(蜂毒/食物/薬物)",course:"アドレナリン筋注(大腿外側: 0.3-0.5mg)→仰臥位・下肢挙上→輸液→気道確保→H1/H2 blocker+ステロイド→経過観察(biphasic reaction: 8-12h)→エピペン処方→アレルギー科紹介",disc:"アナフィラキシーの診断基準と重症度, アドレナリン筋注の重要性と躊躇する理由, 二相性反応, エピペン指導",refs:["Cardona V. Allergy 2020;75:1582","Shaker MS. J Allergy Clin Immunol 2020;145:1082"]},"アレルギー性鼻炎":{prof:"20代男性, 毎春の鼻症状",cc:"くしゃみ, 水様性鼻汁, 鼻閉",o:"毎年春に症状出現, 今年も〇月から発症",p:"花粉飛散時期に増悪, 室内で軽減",q:"くしゃみ発作(連発), 水様性鼻汁, 鼻閉",r:"鼻腔(両側)",s:"眼の掻痒感, 流涙, 倦怠感, 集中力低下",t:"毎春の鼻症状→OTC薬で不十分→当院受診",pe:"鼻粘膜(蒼白浮腫状), 水様性鼻汁, 下鼻甲介腫大, allergic salute, Dennie-Morgan line",tests:"血清特異的IgE(スギ, ヒノキ等), 総IgE, 鼻汁好酸球, 皮膚プリックテスト",probs:"#1 アレルギー性鼻炎(季節性: スギ花粉症) #2 アレルギー性結膜炎 #3 QOL低下",course:"抗原回避→第2世代抗ヒスタミン薬+鼻噴霧ステロイド→ロイコトリエン拮抗薬→舌下免疫療法(根本治療)→重症: 生物学的製剤検討",disc:"アレルギー性鼻炎の重症度分類と段階的治療, 舌下免疫療法の適応とエビデンス, 喘息との関連(one airway, one disease)",refs:["Brozek JL. J Allergy Clin Immunol 2017;140:950","鼻アレルギー診療ガイドライン2024"]},"食物アレルギー":{prof:"3歳男児, 卵摂取後の蕁麻疹",cc:"卵摂取後の蕁麻疹, 嘔吐",o:"離乳食期から卵で皮疹, 今回加熱卵摂取後に蕁麻疹",p:"摂取後15-30分で出現",q:"全身蕁麻疹, 嘔吐, 咳嗽",r:"皮膚(全身), 消化器",s:"呼吸困難の有無, アナフィラキシー徴候",t:"卵摂取→蕁麻疹→嘔吐→小児科受診",pe:"蕁麻疹, 口唇・眼瞼腫脹, 喘鳴の有無, バイタル(アナフィラキシー評価)",tests:"血清特異的IgE(卵白, オボムコイド), 皮膚プリックテスト, 経口食物負荷試験(確定診断・耐性獲得評価)",probs:"#1 食物アレルギー(鶏卵) #2 アナフィラキシーリスク評価 #3 栄養指導",course:"原因食物の必要最小限除去→栄養指導→経口免疫療法検討→定期的な経口負荷試験(耐性獲得確認)→エピペン処方(重症例)→緊急時対応計画",disc:"食物アレルギーの診断(特異的IgE vs 経口負荷試験), 必要最小限除去の原則, 経口免疫療法のエビデンスとリスク, 自然耐性獲得",refs:["Sicherer SH. J Allergy Clin Immunol 2020;146:31","食物アレルギー診療ガイドライン2021"]},"薬物アレルギー":{prof:"45歳女性, 抗菌薬投与後の皮疹",cc:"抗菌薬投与後の全身皮疹, 発熱",o:"セフェム系抗菌薬投与〇日後に全身に紅斑性丘疹",p:"薬剤投与後に出現, 中止で改善傾向",q:"全身性紅斑性丘疹, 体温38℃",r:"体幹→四肢に拡大",s:"掻痒感, 粘膜疹の有無(SJS/TEN除外), 肝機能障害",t:"抗菌薬投与→皮疹出現→被疑薬中止→当院コンサルト",pe:"皮疹の型(紅斑丘疹型/蕁麻疹型/水疱型), 粘膜病変(口腔, 眼, 陰部), Nikolsky sign, 体表面積, バイタル",tests:"血算・好酸球, 肝腎機能, CRP, DLST(リンパ球刺激試験, 急性期後), 皮膚生検(必要時), HLA型(SJS/TEN高リスク薬)",probs:"#1 薬物アレルギー(被疑薬: _, 皮疹型: _) #2 重症薬疹の除外(SJS/TEN/DIHS) #3 代替薬選択",course:"被疑薬中止→重症度評価→軽症: 抗ヒスタミン薬+経過観察→重症(SJS/TEN/DIHS): ステロイド+専門治療→被疑薬記録→代替薬選択→アレルギーカード作成",disc:"薬疹の分類と重症薬疹(SJS/TEN/DIHS)のred flags, DLSTの限界, ペニシリンアレルギーの過剰診断問題",refs:["Blumenthal KG. JAMA 2019;321:188","Pichler WJ. Ann Intern Med 2003;139:683"]},"蕁麻疹・血管性浮腫":{prof:"35歳女性, 反復する蕁麻疹",cc:"反復する膨疹, 掻痒感",o:"〇カ月前から反復する蕁麻疹, ほぼ毎日出現",p:"個々の膨疹は24時間以内に消退, 新たに出現を繰り返す",q:"膨疹(大小さまざま), 掻痒感著明",r:"体幹, 四肢(全身)",s:"血管性浮腫(口唇, 眼瞼)の合併あり/なし, 呼吸困難なし",t:"反復する蕁麻疹→OTC抗ヒスタミン薬で不十分→当院受診",pe:"膨疹(大きさ, 分布), 血管性浮腫, デルモグラフィズム, 甲状腺腫大",tests:"血算・好酸球, CRP, IgE, 甲状腺機能(TPOAb), 補体(C4: HAE除外), 皮膚生検(蕁麻疹様血管炎除外, 必要時)",probs:"#1 慢性蕁麻疹(特発性) #2 血管性浮腫(あれば) #3 自己免疫性蕁麻疹の評価",course:"第2世代抗ヒスタミン薬→増量(最大4倍)→オマリズマブ(抗IgE抗体)→シクロスポリン→誘因回避→慢性蕁麻疹の自然経過説明",disc:"慢性蕁麻疹の分類(特発性 vs 誘発性), 段階的治療(国際ガイドライン), オマリズマブの位置づけ, HAEとの鑑別",refs:["Zuberbier T. Allergy 2022;77:734","Maurer M. N Engl J Med 2013;368:924"]}},"g57":{"職業性喘息":{prof:"40代男性, 塗装業, 職場での喘息症状",cc:"咳嗽, 喘鳴, 呼吸困難(職場で増悪)",o:"〇年前から職場で咳嗽・喘鳴, 休日や休暇中は軽快",p:"就業日に増悪, 休日に改善(work-related pattern)",q:"呼気性喘鳴, 呼吸困難",r:"胸部",s:"鼻炎症状, 眼の刺激感",t:"職場での喘息症状→前医で喘息治療→職業性を疑い→当院紹介",pe:"聴診(喘鳴), 呼吸機能(就業前後の変動), 皮膚所見",tests:"呼吸機能検査(就業前後PEF変動: >20%), 気道過敏性試験, 特異的IgE(イソシアネート等), 連日PEFモニタリング, FeNO",probs:"#1 職業性喘息(感作型: イソシアネート疑い) #2 職業曝露 #3 気道過敏性亢進",course:"曝露回避(配置転換 or 防護)→喘息治療(ICS/LABA)→PEFモニタリング→労災申請支援→長期フォロー",disc:"職業性喘息の診断アプローチ(連日PEFモニタリング), 感作型 vs 刺激型, 曝露回避後の予後, 労災・補償の問題",refs:["Tarlo SM. Chest 2008;134:S1","Vandenplas O. Eur Respir J 2014;43:1573"]},"過敏性肺炎":{prof:"55歳男性, 鳥飼育歴, 慢性咳嗽",cc:"乾性咳嗽, 労作時呼吸困難, 発熱",o:"鳥飼育開始〇年後から乾性咳嗽, 〇カ月前から労作時呼吸困難",p:"帰宅後数時間で増悪(急性型), 慢性的に進行(慢性型)",q:"乾性咳嗽, 労作時呼吸困難, 微熱",r:"両側肺野",s:"体重減少, 倦怠感, ばち指(慢性型)",t:"慢性咳嗽→前医でCT異常→原因不明のILD→抗原曝露歴から過敏性肺炎疑い→当院紹介",pe:"両肺fine crackles, SpO2低下(労作時), ばち指(慢性型), 体重減少",tests:"胸部HRCT(小葉中心性すりガラス影, モザイクパターン, 線維化), BAL(リンパ球↑, CD4/8比低下), 血清抗体(鳥関連抗原), KL-6, SP-D",probs:"#1 過敏性肺炎(急性/亜急性/慢性, 線維化型/非線維化型) #2 抗原曝露(鳥類) #3 呼吸機能障害",course:"抗原回避(最重要)→急性/亜急性: ステロイド→慢性線維化型: 抗線維化薬検討→呼吸リハビリ→在宅酸素(必要時)→環境調整指導",disc:"過敏性肺炎の診断アプローチ(ATS/JRS/ALAT 2020ガイドライン), 線維化型HPの予後, 特発性肺線維症との鑑別",refs:["Raghu G. Am J Respir Crit Care Med 2020;202:e36","Selman M. Lancet 2012;380:680"]},"化学物質過敏症":{prof:"40代女性, 建物改装後の多彩な症状",cc:"頭痛, 倦怠感, 咽頭痛, 皮膚症状(化学物質曝露後)",o:"新築住宅/職場改装後から多彩な症状が出現",p:"特定の化学物質(ホルムアルデヒド等)への曝露で増悪, 離れると軽減",q:"多系統にわたる不定愁訴",r:"全身(多系統)",s:"頭痛, 倦怠感, めまい, 嘔気, 集中力低下, 筋肉痛, 呼吸困難感",t:"環境曝露後に多彩な症状→多科受診→器質的疾患なし→当院紹介",pe:"一般的身体所見は正常であることが多い, 精神状態の評価",tests:"環境測定(室内VOC濃度), アレルギー検査(通常陰性), 呼吸機能, 血液一般(通常正常), 心理評価, 他疾患の除外",probs:"#1 化学物質過敏症(MCS) #2 環境要因の評価 #3 QOL低下・心理的影響",course:"原因物質の同定と回避→環境改善(換気, 低VOC製品使用)→対症療法→心理的サポート→社会的支援→段階的曝露耐性獲得",disc:"MCSの概念と論争(定義の困難さ), 環境医学的アプローチ, 他疾患(不安障害等)との鑑別, シックハウス症候群との関連",refs:["Cullen MR. J Allergy Clin Immunol 1987;80:634","WHO. IPCS/Report 1996"]}},"g58":{"関節リウマチ":{prof:"45歳女性, 両手指の朝のこわばり・関節腫脹",cc:"両手指の関節痛, 朝のこわばり",o:"〇カ月前から両手指MCP/PIP関節の腫脹・疼痛, 1時間以上の朝のこわばり",p:"朝に増悪(こわばり>1h), 動かすと軽減",q:"3カ所以上の関節腫脹, 左右対称性",r:"両手MCP/PIP関節, 手関節(左右対称)",s:"倦怠感, 微熱, 握力低下",t:"関節痛→朝のこわばり→前医でRF/抗CCP陽性→当院紹介",pe:"手指MCP/PIP/手関節の腫脹・圧痛, 関節可動域, 握力, DIP関節(OAとの鑑別), 関節外症状(リウマチ結節)",tests:"RF, 抗CCP抗体, CRP, ESR, MMP-3, 血算, 手足X線(骨びらん), 関節エコー(滑膜炎・Power Doppler), 胸部X線",probs:"#1 関節リウマチ(ACR/EULAR 2010基準: _点, 疾患活動性: DAS28_) #2 関節破壊リスク(抗CCP高値, 骨びらん) #3 合併症評価(ILD等)",course:"早期診断→MTX開始(アンカードラッグ)→疾患活動性評価(T2T)→目標未達: bDMARDs/JAK阻害薬→関節破壊モニタリング→合併症管理",disc:"RAの早期診断と早期治療(window of opportunity), T2T戦略, MTXからbDMARDs/JAK阻害薬への切り替え基準",refs:["Smolen JS. Lancet 2016;388:2023","Aletaha D. Ann Rheum Dis 2010;69:1580"]},"強直性脊椎炎":{prof:"25歳男性, 腰背部痛(炎症性), HLA-B27陽性",cc:"腰背部痛, 朝のこわばり",o:"〇年前(20歳頃)から腰背部痛, 緩徐に進行",p:"安静で増悪, 運動で改善, 夜間後半〜早朝に増悪(炎症性腰痛)",q:"3カ月以上持続する腰痛, 45歳未満発症",r:"仙腸関節, 腰椎〜胸椎",s:"末梢関節炎(あれば), 付着部炎(アキレス腱), 前部ぶどう膜炎",t:"慢性腰痛→整形外科でMRI→仙腸関節炎→HLA-B27陽性→当院紹介",pe:"仙腸関節圧痛, 脊椎可動域制限(Schober test), 胸郭拡張制限, 付着部炎, 前部ぶどう膜炎の既往",tests:"仙腸関節MRI(骨髄浮腫), 骨盤X線(仙腸関節炎), HLA-B27, CRP/ESR, 脊椎X線(syndesmophyte)",probs:"#1 強直性脊椎炎(mNY基準/ASAS基準) #2 仙腸関節炎 #3 関節外症状(ぶどう膜炎・IBD)",course:"NSAIDs(第一選択)→効果不十分: TNF阻害薬/IL-17阻害薬→理学療法(姿勢・可動域維持)→関節外症状管理→定期評価(ASDAS/BASDAI)",disc:"炎症性腰痛の特徴とaxSpAの診断, NSAIDsからbDMARDsへのエスカレーション, HLA-B27の意義",refs:["Sieper J. Lancet 2017;390:73","Ward MM. Arthritis Rheumatol 2019;71:1599"]},"乾癬性関節炎":{prof:"40代男性, 乾癬, 指趾関節腫脹",cc:"指趾の腫脹(ソーセージ指), 乾癬の悪化",o:"乾癬に〇年後から指趾関節の腫脹・疼痛が出現",p:"緩徐に進行",q:"指趾炎(dactylitis), DIP関節炎, 爪病変",r:"末梢関節(DIP, 非対称), 脊椎(あれば)",s:"乾癬(皮疹), 爪変形(陥凹, 剥離), 付着部炎",t:"乾癬→指趾関節痛→前医でPsA疑い→当院紹介",pe:"DIP関節腫脹, 指趾炎(sausage digit), 爪病変(pitting, onycholysis), 乾癬(皮疹), 脊椎可動域, 付着部炎",tests:"X線(pencil-in-cup変形, periostitis), MRI/関節エコー(滑膜炎, 付着部炎), RF(通常陰性), CRP, HLA-B27",probs:"#1 乾癬性関節炎(末梢型/脊椎型/指趾炎型) #2 乾癬 #3 爪病変",course:"NSAIDs→csDMARDs(MTX: 末梢関節)→bDMARDs(TNF阻害薬/IL-17/IL-23阻害薬)→皮膚科と連携→関節破壊モニタリング",disc:"PsAの臨床パターン(CASPAR基準), 皮膚と関節の統合的治療, bDMARDsの選択(皮膚・関節・脊椎の各ドメイン)",refs:["Ritchlin CT. N Engl J Med 2017;376:957","Gossec L. Ann Rheum Dis 2020;79:700"]},"反応性関節炎":{prof:"25歳男性, 尿道炎後の関節炎",cc:"膝関節腫脹, 結膜炎, 排尿時痛",o:"尿道炎〇週間後に右膝関節腫脹, 結膜炎出現",p:"先行感染後1-4週で発症",q:"大関節の非対称性関節炎, 結膜炎",r:"下肢優位(膝, 足), 仙腸関節",s:"付着部炎(アキレス腱), 口腔内潰瘍, 指趾炎, 皮疹(膿漏性角皮症)",t:"尿道炎→関節炎+結膜炎→前医でReA疑い→当院紹介",pe:"関節腫脹(大関節, 非対称), 結膜炎, 付着部炎, 皮膚粘膜所見, 仙腸関節圧痛",tests:"関節液(細菌培養陰性, WBC↑), CRP/ESR, HLA-B27, 尿PCR(クラミジア/淋菌), 便培養(腸炎後型), X線",probs:"#1 反応性関節炎(先行感染: 尿道炎/腸炎) #2 HLA-B27関連 #3 付着部炎",course:"NSAIDs(第一選択)→先行感染の治療(クラミジア: DOXY)→遷延・慢性化: SASP/MTX→重症: TNF阻害薬→多くは自然寛解(6-12カ月)",disc:"反応性関節炎の診断(先行感染との関連), Reiter三徴(関節炎・尿道炎・結膜炎), 予後(自然寛解 vs 慢性化)",refs:["Carter JD. Curr Rheumatol Rep 2009;11:377","Hannu T. Best Pract Res Clin Rheumatol 2011;25:347"]}},"g59":{"SLE":{prof:"25歳女性, 発熱・関節痛・皮疹",cc:"発熱, 関節痛, 顔面紅斑",o:"〇カ月前から発熱, 関節痛, 顔面に蝶形紅斑",p:"安静で関節痛やや軽減, 日光曝露で皮疹増悪",q:"多関節痛(手指MCP/PIP, 手関節), 体温37-38℃台",r:"顔面(蝶形紅斑), 両手関節, 口腔",s:"口腔内潰瘍, 脱毛, 易疲労, レイノー現象",t:"関節痛+皮疹→前医でANA陽性→精査目的で当院紹介",pe:"蝶形紅斑, 口腔内潰瘍, 関節腫脹(非破壊性), 脱毛, 漿膜炎, 下肢浮腫",tests:"ANA, 抗dsDNA抗体, 補体(C3/C4/CH50), 血算, 尿検査, 腎機能, 抗Sm抗体, 抗リン脂質抗体",probs:"#1 SLE(EULAR/ACR 2019基準: _点) #2 ループス腎炎(Class_, あれば) #3 血液学的異常(あれば)",course:"診断確定→臓器障害評価→HCQ(全例)→ステロイド→免疫抑制薬(重症臓器障害)→寛解維持→妊孕性カウンセリング",disc:"SLEの分類基準(EULAR/ACR 2019)と疾患活動性評価(SLEDAI), 臓器障害別の治療戦略",refs:["Fanouriakis A. Ann Rheum Dis 2019;78:736","Aringer M. Arthritis Rheumatol 2019;71:1400"]},"シェーグレン症候群":{prof:"50代女性, 乾燥症状",cc:"口腔乾燥, 眼乾燥, 関節痛",o:"〇年前から口渇と眼の乾燥感, 〇カ月前から関節痛",p:"緩徐に進行, 乾燥環境で増悪",q:"唾液分泌低下, 涙液分泌低下",r:"唾液腺, 涙腺, 全身(腺外病変)",s:"う蝕多発, 耳下腺腫大, 関節痛, Raynaud現象, 倦怠感",t:"乾燥症状→前医で抗SS-A抗体陽性→当院紹介",pe:"Schirmer試験(<5mm/5min), Saxon試験, 耳下腺腫大, 口腔内乾燥(舌乳頭萎縮), 紫斑(あれば), 関節腫脹",tests:"抗SS-A/SS-B抗体, ANA, RF, IgG, 血算, 唾液腺造影/エコー, 口唇小唾液腺生検(focus score), Schirmer試験, ローズベンガル試験",probs:"#1 シェーグレン症候群(一次性/二次性, ACR/EULAR 2016基準) #2 乾燥症状(sicca) #3 腺外病変(ILD/腎/神経/リンパ腫リスク)",course:"乾燥対策(人工唾液・人工涙液, 唾液分泌促進薬)→腺外病変評価→全身症状: ステロイド/免疫抑制薬→リンパ腫サーベイランス→定期フォロー",disc:"シェーグレン症候群の診断基準と腺外病変, 悪性リンパ腫発症リスクのモニタリング, IgG4関連疾患との鑑別",refs:["Shiboski CH. Ann Rheum Dis 2017;76:9","Brito-Zeron P. Lancet 2020;395:1544"]},"全身性強皮症":{prof:"40代女性, Raynaud現象, 皮膚硬化",cc:"指先の冷感・変色, 手指皮膚硬化",o:"〇年前からRaynaud現象, 〇カ月前から手指皮膚硬化が進行",p:"緩徐に進行, 寒冷で増悪",q:"Raynaud現象, 手指腫脹→硬化, 指尖部潰瘍",r:"手指(初発), 体幹(びまん型)",s:"嚥下困難, 胸やけ(逆流性食道炎), 労作時呼吸困難",t:"Raynaud+皮膚硬化→前医で抗Scl-70/セントロメア抗体→当院紹介",pe:"皮膚硬化(modified Rodnan skin score), Raynaud現象, 手指潰瘍, 毛細血管拡張, 爪郭毛細血管異常(NFC), 肺聴診(fine crackles)",tests:"抗Scl-70(トポイソメラーゼI)/抗セントロメア抗体, ANA, 胸部HRCT(ILD), 肺機能(FVC, DLCO), 心エコー(肺高血圧), 食道造影/上部内視鏡",probs:"#1 全身性強皮症(びまん型/限局型, 抗体: _) #2 間質性肺炎(あれば) #3 肺動脈性肺高血圧(スクリーニング) #4 Raynaud現象・指尖潰瘍",course:"臓器評価→Raynaud: Ca拮抗薬+PDE5阻害薬→ILD: MMF/ニンテダニブ→PAH: エンドセリン拮抗薬+PDE5i→皮膚硬化: MTX→強皮症腎クリーゼ監視→リハビリ",disc:"強皮症の病型分類(diffuse vs limited)と自己抗体, ILDとPAHの早期発見, 強皮症腎クリーゼ(ACE阻害薬)",refs:["Denton CP. Lancet 2017;390:1685","Kowal-Bielecka O. Ann Rheum Dis 2017;76:1327"]},"多発性筋炎・皮膚筋炎":{prof:"50代女性, 近位筋の筋力低下, 皮疹",cc:"階段昇降困難, 両上肢挙上困難, ヘリオトロープ疹",o:"〇カ月前から近位筋の筋力低下が進行, 眼瞼周囲の紫紅色皮疹",p:"緩徐に進行, 筋痛あり",q:"近位筋MMT 3-4/5, CK 3000 U/L",r:"四肢近位筋(対称性), 顔面・手指(皮疹)",s:"嚥下障害, 間質性肺炎(あれば), Gottron丘疹, 機械工の手",t:"筋力低下+皮疹→前医でCK高値→筋炎疑い→当院紹介",pe:"近位筋筋力(頸屈筋, 三角筋, 腸腰筋), ヘリオトロープ疹, Gottron丘疹/徴候, 機械工の手, V sign, Shawl sign, 肺聴診",tests:"CK, アルドラーゼ, 筋炎特異的抗体(抗ARS/MDA5/TIF1γ/Mi-2), 筋電図, 筋MRI, 筋生検, 胸部CT(ILD), 悪性腫瘍スクリーニング",probs:"#1 皮膚筋炎/多発性筋炎(筋炎特異的抗体: _) #2 間質性肺炎(あれば) #3 悪性腫瘍合併リスク",course:"ステロイド(PSL 1mg/kg)→免疫抑制薬(AZA/MTX/タクロリムス)→ILD合併時: 積極的治療→悪性腫瘍検索→リハビリ→筋力・CKフォロー",disc:"筋炎特異的抗体による病型分類と治療戦略, 抗MDA5抗体陽性DM(急速進行性ILD), 悪性腫瘍合併のスクリーニング",refs:["Lundberg IE. Lancet 2021;397:200","Sato S. Curr Opin Rheumatol 2015;27:601"]},"MCTD":{prof:"30代女性, Raynaud現象・手指腫脹・関節痛",cc:"Raynaud現象, ソーセージ様手指腫脹, 関節痛",o:"〇年前からRaynaud現象, 〇カ月前から手指腫脹と多関節痛",p:"緩徐に進行",q:"Raynaud現象, 手指腫脹, 多関節痛",r:"手指, 関節(多発), 全身",s:"筋力低下, 嚥下困難, 肺高血圧症状(労作時呼吸困難)",t:"Raynaud+手指腫脹+関節痛→前医で抗U1-RNP抗体高値→当院紹介",pe:"手指のソーセージ様腫脹, Raynaud現象, 関節腫脹, 筋力低下(近位筋), 皮膚硬化(限定的), 肺聴診",tests:"抗U1-RNP抗体(高力価), ANA(斑紋型), CK, 血算, 補体, 肺機能(DLCO), 心エコー(PAH), 胸部CT",probs:"#1 MCTD(混合性結合組織病) #2 肺動脈性肺高血圧(あれば) #3 多臓器評価",course:"症状に応じた治療(関節炎: NSAIDs/少量PSL, 筋炎: PSL+免疫抑制薬, PAH: エンドセリン拮抗薬等)→Raynaud: Ca拮抗薬→PAHスクリーニング定期的",disc:"MCTDの診断基準と重複症候群との鑑別, 肺動脈性肺高血圧のスクリーニングと早期介入の重要性",refs:["Tani C. J Autoimmun 2014;48-49:46","Gunnarsson R. Arthritis Res Ther 2006;8:R137"]},"成人Still病":{prof:"28歳女性, 高熱・皮疹・関節痛",cc:"弛張熱, サーモンピンク疹, 関節痛",o:"〇週間前から39℃以上の弛張熱(1日2峰性)と皮疹",p:"夕方に発熱, 朝に解熱(弛張熱), 発熱時に皮疹出現",q:"39-40℃の弛張熱, サーモンピンク色の消退する皮疹",r:"全身(発熱, 皮疹), 多関節",s:"咽頭痛, リンパ節腫脹, 肝脾腫, 漿膜炎",t:"高熱持続→感染症精査で陰性→前医で不明熱→当院紹介",pe:"サーモンピンク疹(Koebner現象), 咽頭発赤, リンパ節腫脹, 関節腫脹, 肝脾腫",tests:"フェリチン(著明高値, >1000), 糖鎖フェリチン比(<20%), CRP↑, ESR↑, 白血球増多(好中球優位), LDH, 肝機能, 血液培養(除外), CT(リンパ腫除外)",probs:"#1 成人Still病(山口基準) #2 反応性血球貪食症候群(HLH合併リスク) #3 鑑別: 感染症/悪性リンパ腫/他の自己免疫疾患",course:"NSAIDs(軽症)→ステロイド(PSL 0.5-1mg/kg)→ステロイド依存/抵抗性: トシリズマブ(IL-6阻害)→MTX→HLH合併時: 集中治療",disc:"成人Still病の診断基準(山口基準)と除外診断, フェリチンの診断的価値, IL-6阻害薬のエビデンス, マクロファージ活性化症候群(MAS)のリスク",refs:["Gerfaud-Valentin M. Autoimmun Rev 2014;13:708","Jamilloux Y. Autoimmun Rev 2018;17:855"]}},"g60":{"ANCA関連血管炎（GPA/MPA/EGPA）":{prof:"65歳男性, 腎機能低下・肺出血",cc:"血痰, 腎機能低下, 発熱, 全身倦怠感",o:"〇カ月前から倦怠感, 〇週間前から血痰と急速な腎機能低下",p:"急速に進行",q:"Cr 1.0→4.0(〇週間で), 血痰, 体重減少",r:"腎(急速進行性糸球体腎炎), 肺(肺胞出血), 上気道",s:"発熱, 体重減少, 関節痛, 鼻出血(GPA), 多発性単神経炎, 紫斑",t:"血痰+急速な腎機能低下→前医でANCA陽性→当院緊急紹介",pe:"肺聴診(crackles), 紫斑, 鼻/副鼻腔(鞍鼻: GPA), 末梢神経障害, 尿検査(血尿・蛋白尿・円柱)",tests:"MPO-ANCA/PR3-ANCA, 腎機能, 尿沈渣(赤血球円柱), 胸部CT(肺胞出血/結節), 腎生検(壊死性半月体形成性糸球体腎炎), 血液ガス",probs:"#1 ANCA関連血管炎(MPA/GPA/EGPA, ANCA型: MPO/PR3) #2 急速進行性糸球体腎炎 #3 肺胞出血",course:"寛解導入(ステロイドパルス+CPA or リツキシマブ)→血漿交換(重症腎不全/肺胞出血)→寛解維持(AZA or リツキシマブ)→感染症予防(ST合剤)→再発監視",disc:"ANCA関連血管炎の分類(GPA/MPA/EGPA)と臨床的特徴, 寛解導入治療(RAVE trial/RITUXVAS), 再発リスクと維持療法",refs:["Kitching AR. Nat Rev Dis Primers 2020;6:71","Yates M. Ann Rheum Dis 2016;75:1583"]},"結節性多発動脈炎":{prof:"50代男性, 発熱・体重減少・多発性単神経炎",cc:"発熱, 体重減少, 下肢のしびれ・脱力",o:"〇カ月前から発熱と体重減少, 〇週間前から下垂足",p:"亜急性に進行",q:"発熱, 下垂足(腓骨神経麻痺), 腹痛",r:"中型動脈(腎, 腸間膜, 末梢神経, 皮膚)",s:"皮膚結節・網状皮斑, 筋痛, 高血圧(腎動脈病変), 精巣痛(男性)",t:"発熱+体重減少+下垂足→前医で精査→血管炎疑い→当院紹介",pe:"皮膚(結節, 網状皮斑, 潰瘍), 末梢神経障害(多発性単神経炎), 血圧, 精巣圧痛, 腹部圧痛",tests:"CRP↑, ESR↑, ANCA陰性, HBV(HBV関連PAN除外), 血管造影/CTA(小動脈瘤, 狭窄), 神経伝導検査, 生検(皮膚/腓腹神経: 中型動脈壊死性血管炎)",probs:"#1 結節性多発動脈炎 #2 多発性単神経炎 #3 HBV関連の有無",course:"ステロイド(PSL 1mg/kg)→重症(FFS≧1): CPA追加→HBV関連: 抗ウイルス薬+血漿交換→寛解維持→臓器障害フォロー",disc:"PANの診断(ACR基準)とANCA関連血管炎との鑑別(ANCA陰性・糸球体腎炎なし), Five-Factor Score(FFS)による予後予測",refs:["De Virgilio A. Autoimmun Rev 2016;15:564","Guillevin L. Medicine 2011;90:19"]},"巨細胞性動脈炎":{prof:"72歳女性, 新規の側頭部頭痛, 顎跛行",cc:"片側性側頭部頭痛, 顎跛行, 視力障害",o:"〇週間前から新規の片側性側頭部頭痛, 咀嚼時の顎痛",p:"持続性, 緩徐に増悪",q:"側頭部の激しい頭痛, 顎跛行",r:"側頭動脈, 大動脈弓分枝",s:"視力低下(一過性黒内障→永続的視力喪失のリスク), PMR症状(肩・腰帯のこわばり), 発熱, 体重減少",t:"新規頭痛+顎跛行→前医でESR著明高値→GCA疑い→当院緊急紹介",pe:"側頭動脈(索状硬化, 拍動消失, 圧痛), 視力・視野, 眼底(虚血性視神経症), PMR症状, 大動脈雑音",tests:"ESR↑↑(>50mm/h), CRP↑↑, 血算(血小板増多, 貧血), 側頭動脈エコー(halo sign), 側頭動脈生検(巨細胞を伴う肉芽腫性動脈炎), PET-CT/CTA(大血管型)",probs:"#1 巨細胞性動脈炎 #2 視力喪失リスク #3 PMR合併(あれば)",course:"ステロイド即時開始(PSL 40-60mg/日, 視力障害あれば pulse)→緩徐減量→再燃時: トシリズマブ(GiACTA trial)→骨粗鬆症予防→大動脈瘤サーベイランス",disc:"GCAの緊急性(視力喪失の不可逆性), 側頭動脈生検 vs エコーの診断精度, トシリズマブのステロイドスペアリング効果",refs:["Weyand CM. N Engl J Med 2014;371:50","Stone JH. N Engl J Med 2017;377:317"]},"高安動脈炎":{prof:"25歳女性, 上肢の脈拍減弱, 全身倦怠感",cc:"上肢の脱力・冷感, 倦怠感, 発熱",o:"〇カ月前から倦怠感と微熱, 〇週間前から左上肢の脱力と冷感",p:"緩徐に進行",q:"左上肢の脈拍減弱, 血圧左右差(>10mmHg)",r:"大動脈弓・大動脈分枝",s:"めまい, 間欠性跛行, 胸痛, 視力障害(頸動脈病変)",t:"上肢脈拍減弱→若年女性→高安動脈炎疑い→当院紹介",pe:"脈拍左右差, 血圧左右差, 血管雑音(頸動脈, 鎖骨下, 腎動脈, 大動脈), 大動脈弁閉鎖不全(あれば)",tests:"CRP/ESR↑, 血算, CTA/MRA(大動脈壁肥厚, 狭窄, 拡張, 動脈瘤), PET-CT(活動性炎症), 心エコー(AR評価)",probs:"#1 高安動脈炎(Numano分類: Type_) #2 血管狭窄/動脈瘤 #3 高血圧(腎動脈狭窄)",course:"ステロイド(PSL 0.5-1mg/kg)→免疫抑制薬(MTX/AZA)→難治性: トシリズマブ→血管狭窄: 血管内治療/バイパス→定期的画像フォロー",disc:"高安動脈炎の診断と画像評価(CTA/MRA/PET), GCAとの関連, 血管病変に対する外科的介入の時期",refs:["Tombetti E. Nat Rev Rheumatol 2019;15:148","日本循環器学会. 血管炎症候群の診療ガイドライン2017"]},"IgA血管炎":{prof:"7歳男児, 紫斑・腹痛・関節痛",cc:"下肢の紫斑, 腹痛, 関節痛",o:"〇日前から両下肢に触知可能紫斑, 腹痛と関節痛",p:"上気道感染〇週間後に発症",q:"触知可能紫斑(下腿〜臀部), 腹痛(疝痛), 関節腫脹",r:"下肢(紫斑), 腹部, 膝・足関節",s:"血便(腸重積のリスク), 血尿・蛋白尿(腎炎合併)",t:"紫斑+腹痛+関節痛→小児科受診→IgA血管炎疑い",pe:"触知可能紫斑(重力依存部位), 関節腫脹(膝・足), 腹部圧痛, 精巣(精巣炎)",tests:"血算, 凝固(正常), CRP, 尿検査(血尿・蛋白尿), 腎機能, 血清IgA, 便潜血, 腹部エコー(腸重積除外), 皮膚生検(IgA沈着)",probs:"#1 IgA血管炎(Henoch-Schönlein紫斑病) #2 IgA血管炎性腎炎(あれば) #3 腸重積リスク",course:"対症療法(安静, NSAIDs)→腹痛重症: ステロイド→腎炎合併時: ACEi/ARB, 重症: ステロイド+免疫抑制薬→尿検査フォロー(6カ月以上)",disc:"IgA血管炎の診断(EULAR/PRINTO/PRES基準)と合併症(腎炎, 腸重積), 腎予後のモニタリング, 成人IgA血管炎の特徴",refs:["Ozen S. Ann Rheum Dis 2010;69:790","Pillebout E. J Am Soc Nephrol 2002;13:1271"]}},"g61":{"リウマチ性多発筋痛症":{prof:"70代女性, 両肩・腰帯のこわばり, 発熱",cc:"両肩・腰帯の痛みとこわばり, 微熱",o:"〇週間前から急性発症の両肩・両大腿の痛みとこわばり",p:"朝に著明なこわばり(>45分), 安静後に増悪",q:"両肩挙上困難, 寝返り困難",r:"肩帯(両側), 腰帯(両側)",s:"発熱(微熱), 倦怠感, 体重減少, 食欲低下",t:"急性発症の両肩痛→前医でESR/CRP著明高値→PMR疑い→当院紹介",pe:"肩関節可動域制限(他動: 滑液包炎), 筋力正常(痛みで制限), 筋萎縮なし, 側頭動脈(GCA除外)",tests:"ESR↑↑, CRP↑↑, 血算(貧血あれば), CK正常, RF/抗CCP陰性, 肩/股関節エコー/MRI(滑液包炎, 滑膜炎)",probs:"#1 リウマチ性多発筋痛症(ACR/EULAR 2012分類基準) #2 GCA合併の除外 #3 悪性腫瘍の除外",course:"PSL 15-20mg/日(著効: diagnostic test)→緩徐減量(1-2年以上)→再燃時: 増量→GCA症状監視→骨粗鬆症予防→ステロイドスペアリング検討",disc:"PMRの診断(ステロイドへの劇的反応), GCAとのオーバーラップ, ステロイド減量のコツと再燃, 鑑別(RA, RS3PE, 悪性腫瘍, 感染症)",refs:["Dejaco C. Ann Rheum Dis 2015;74:1799","Dasgupta B. Ann Rheum Dis 2010;69:36"]},"痛風関節炎":{prof:"50代男性, 肥満, 飲酒歴, 高尿酸血症",cc:"母趾MTP関節の急性激痛, 腫脹, 発赤",o:"昨夜突然の右母趾MTP関節の激痛で覚醒",p:"急性発症(数時間でピーク), 触れられないほどの痛み",q:"激痛, NRS 9/10, 著明な発赤・腫脹・熱感",r:"第1 MTP関節(podagra)",s:"発熱(あれば), 過去の発作歴, 痛風結節",t:"突然の母趾激痛→歩行困難→当日受診",pe:"第1 MTP関節: 発赤, 腫脹, 熱感, 著明な圧痛, 痛風結節(耳介, 肘頭, 指), 他関節",tests:"血清尿酸(発作時は正常のことあり), CRP↑, 血算(白血球↑), 関節液(尿酸ナトリウム結晶: 針状, 負の複屈折), X線(骨びらん, punched-out lesion), 腎機能",probs:"#1 痛風関節炎(急性発作) #2 高尿酸血症 #3 メタボリック症候群(肥満, 脂質, 高血圧)",course:"急性期: コルヒチン(早期) or NSAIDs or ステロイド→発作消退後(2-4週): 尿酸降下薬(フェブキソスタット/アロプリノール, 目標UA<6mg/dL)→生活指導(減量, 禁酒, プリン体制限)",disc:"痛風の診断(関節液結晶分析がgold standard), 尿酸降下薬の開始時期と目標値, treat-to-target, 偽痛風との鑑別",refs:["Dalbeth N. Lancet 2021;397:1843","FitzGerald JD. Arthritis Care Res 2020;72:744"]},"偽痛風":{prof:"75歳女性, 膝関節の急性腫脹",cc:"右膝関節の急性疼痛, 腫脹",o:"〇日前から右膝関節の疼痛と腫脹",p:"急性発症, 痛風類似",q:"膝関節腫脹, 関節液貯留, 熱感",r:"膝関節(最多), 手関節, 肩関節",s:"発熱(あれば), 化膿性関節炎との鑑別重要",t:"膝関節急性腫脹→化膿性関節炎除外目的→当院受診",pe:"膝関節: 腫脹, 熱感, 圧痛, 関節液貯留, 可動域制限",tests:"関節穿刺(関節液: ピロリン酸カルシウム結晶: 菱形, 弱い正の複屈折), グラム染色・培養(化膿性関節炎除外), X線(軟骨石灰化: chondrocalcinosis), CRP, 血算",probs:"#1 偽痛風(CPPD結晶関節炎) #2 化膿性関節炎の除外 #3 軟骨石灰化症",course:"関節穿刺(除圧)→NSAIDs or コルヒチン or 関節内ステロイド注射→基礎疾患検索(副甲状腺機能亢進症, ヘモクロマトーシス, 低Mg)→再発予防(コルヒチン)",disc:"CPPDの診断(関節液結晶分析)と痛風・化膿性関節炎との鑑別, 二次性CPPDの原因検索, crowned dens syndrome",refs:["Rosenthal AK. N Engl J Med 2016;374:2575","Zhang W. Ann Rheum Dis 2011;70:563"]},"骨関節炎":{prof:"65歳女性, 肥満, 両膝関節痛",cc:"両膝の痛み, 歩行困難",o:"〇年前から両膝痛, 緩徐に進行",p:"動作開始時に増悪(starting pain), 長時間歩行で増悪, 安静で軽減",q:"膝関節痛(NRS 5/10), 可動域制限, 朝のこわばり(<30分)",r:"両膝関節(内側優位), 両手DIP関節",s:"関節腫脹(骨棘), 関節可動域制限, 膝折れ",t:"膝痛増悪→前医で保存療法→改善不十分→当院紹介",pe:"膝: 内反変形(O脚), 関節裂隙圧痛, 骨棘(触知), 関節水腫, 可動域制限, 手: Heberden結節(DIP), Bouchard結節(PIP)",tests:"X線(関節裂隙狭小化, 骨棘, 骨硬化, 骨嚢胞: KL分類), MRI(軟骨損傷, 必要時), 血液(炎症マーカー正常: RA除外)",probs:"#1 変形性膝関節症(KL Grade_) #2 肥満 #3 ADL障害",course:"体重減少→運動療法(大腿四頭筋強化)→NSAIDs(必要時)→ヒアルロン酸関節内注射→装具→進行例: TKA検討",disc:"OAの保存的治療(運動・減量のエビデンス), 薬物療法の限界, 手術適応(TKA/UKA)の判断",refs:["Hunter DJ. N Engl J Med 2015;372:1040","Kolasinski SL. Arthritis Rheumatol 2020;72:220"]},"線維筋痛症":{prof:"45歳女性, 全身の慢性疼痛, 疲労",cc:"全身の痛み, 倦怠感, 不眠",o:"〇年前から全身に広がる持続的な痛みと著明な倦怠感",p:"ストレス・天候で増悪, 改善なし",q:"全身の広範囲の疼痛(3カ月以上), WPI/SSスコア高値",r:"全身(体幹, 四肢, 左右, 上下)",s:"睡眠障害, 認知機能障害(fibro fog), 抑うつ, IBS, 頭痛",t:"慢性全身痛→多科受診→器質的疾患なし→線維筋痛症疑い→当院紹介",pe:"広範囲の圧痛点, 関節腫脹なし, 筋力正常, 神経学的異常なし, 精神状態評価",tests:"血液検査(CRP正常, RF陰性, 甲状腺正常, CK正常: 除外診断), ACR 2016/2010基準(WPI, SSスコア)",probs:"#1 線維筋痛症(ACR基準) #2 睡眠障害 #3 併存症(抑うつ, IBS, 頭痛)",course:"患者教育(疾患概念の説明)→薬物療法(プレガバリン/デュロキセチン/アミトリプチリン)→非薬物療法(有酸素運動, CBT)→睡眠衛生→多職種アプローチ",disc:"線維筋痛症の診断基準と他疾患の除外, 中枢感作の概念, 非薬物療法の重要性(運動・CBTのエビデンス)",refs:["Clauw DJ. JAMA 2014;311:1547","Macfarlane GJ. Ann Rheum Dis 2017;76:318"]}},"g62":{"尿路感染症・腎盂腎炎":{prof:"50代女性, 糖尿病",cc:"発熱, 腰背部痛, 排尿時痛",o:"〇日前から頻尿・排尿時痛, 昨日から高熱と腰背部痛",p:"排尿後にやや軽減, 解熱薬で一時解熱",q:"体温39℃, 右CVA叩打痛陽性",r:"右腰背部",s:"嘔気, 頻尿, 残尿感, 悪寒戦慄",t:"膀胱炎症状→高熱出現→右腰背部痛→前医受診→当院紹介",pe:"CVA叩打痛, 体温, 下腹部圧痛, バイタル(敗血症評価), 脱水所見",tests:"尿検査, 尿グラム染色, 尿培養, 血液培養2セット, 血算, CRP, 腎機能, 腹部エコー/CT",probs:"#1 急性腎盂腎炎 #2 複雑性UTI(糖尿病合併) #3 敗血症(qSOFA_点)",course:"尿培養採取→経験的抗菌薬(CTRX)→培養結果で最適化→解熱確認→経口スイッチ→7-14日",disc:"上部UTIと下部UTIの鑑別, 複雑性UTIの定義, 抗菌薬の選択と投与期間, 再発予防",refs:["Gupta K. Clin Infect Dis 2011;52:e103","JAID/JSC感染症治療ガイドライン2019"]},"院内肺炎":{prof:"75歳男性, 術後5日, 発熱",cc:"発熱, 膿性痰, 低酸素血症",o:"入院〇日目に発熱と膿性痰が出現",p:"緩徐に増悪",q:"体温38.5℃, 膿性痰, SpO2 90%",r:"両側下肺野",s:"呼吸困難, 食欲低下",t:"術後→発熱→胸部X線で新規浸潤影→HAP診断",pe:"両側下肺crackles, 呼吸数増加, SpO2低下, 喀痰の性状",tests:"胸部X線/CT, 喀痰グラム染色・培養(気管吸引液/BAL), 血液培養2セット, CRP, PCT, I-DROPスコア, 耐性菌リスク評価",probs:"#1 院内肺炎(HAP) #2 耐性菌リスク(MRSA/緑膿菌) #3 術後状態",course:"耐性菌リスク評価→経験的抗菌薬(抗緑膿菌β-ラクタム±VCM/LZD)→培養結果でde-escalation→3日後効果判定→治療期間7-8日",disc:"HAP/VAPの定義と起因菌の特徴, 耐性菌リスクに応じた抗菌薬選択, de-escalation戦略, 予防策(口腔ケア, HOB挙上)",refs:["Kalil AC. Clin Infect Dis 2016;63:e61","日本呼吸器学会. 成人肺炎診療ガイドライン2024"]},"骨髄炎":{prof:"55歳男性, 糖尿病, 足部潰瘍",cc:"足部の疼痛・腫脹, 発熱, 排膿",o:"糖尿病性足潰瘍が〇週間前から増悪, 骨が見える",p:"緩徐に進行",q:"足部潰瘍底に骨露出(probe-to-bone陽性), 発熱",r:"中足骨",s:"発赤, 熱感, 排膿",t:"糖尿病足→潰瘍悪化→probe-to-bone陽性→骨髄炎疑い→当院紹介",pe:"潰瘍の深さ・大きさ, probe-to-bone test, 骨露出, 周囲蜂窩織炎, 血管拍動(PAD評価), 神経障害",tests:"CRP, ESR↑, 血液培養, 骨培養(最重要: 手術/生検時), X線(骨破壊), MRI(骨髄浮腫: 最も有用), 血管評価(ABI)",probs:"#1 骨髄炎(糖尿病足) #2 糖尿病性足病変 #3 末梢動脈疾患(PAD)評価",course:"骨培養(手術的生検 or デブリドマン)→培養に基づく抗菌薬(4-6週)→外科的デブリドマン→血糖管理→創傷管理→PAD治療→フットケア教育",disc:"骨髄炎の診断(MRI vs probe-to-bone), 培養の重要性(骨検体 > 軟部組織スワブ), 抗菌薬治療期間, 外科的介入の適応",refs:["Lipsky BA. Clin Infect Dis 2012;54:e132","Lew DP. Lancet 2004;364:369"]},"腹腔内感染症":{prof:"60代男性, 腹痛, 発熱",cc:"腹痛, 発熱, 腹膜刺激徴候",o:"〇日前から腹痛が出現, 増悪, 発熱",p:"局所痛から全体に拡大, 増悪",q:"体温38.5℃, 腹部全体の圧痛, 反跳痛",r:"右下腹部(虫垂)/左下腹部(憩室)/汎発性",s:"嘔気・嘔吐, 排ガス停止, 腹部膨満",t:"腹痛→増悪→発熱→救急搬送",pe:"腹部圧痛, 筋性防御, 反跳痛, 腸蠕動音(減弱/消失), バイタル(敗血症評価), 直腸診",tests:"血算(白血球↑), CRP, 乳酸, 血液培養, 腹部CT(遊離ガス, 膿瘍, 虫垂腫大, 憩室炎), 尿検査",probs:"#1 腹腔内感染症(虫垂炎/憩室炎/消化管穿孔/胆嚢炎/膿瘍) #2 腹膜炎(限局性/汎発性) #3 敗血症(あれば)",course:"輸液・蘇生→抗菌薬(嫌気性菌カバー: ABPC/SBT or CMZ or MEPM+MNZ)→外科コンサルト(ソースコントロール: 手術/ドレナージ)→培養結果で最適化",disc:"腹腔内感染症の感染源同定とソースコントロールの重要性, 経験的抗菌薬(嫌気性菌カバーの必要性), 外科的介入のタイミング",refs:["Solomkin JS. Clin Infect Dis 2010;50:133","Sartelli M. World J Emerg Surg 2017;12:29"]},"皮膚軟部組織感染症":{prof:"50代男性, 糖尿病, 下肢の発赤・腫脹",cc:"下肢の発赤, 腫脹, 疼痛, 発熱",o:"〇日前から右下腿に発赤と腫脹, 昨日から発熱",p:"急速に拡大",q:"体温38.5℃, 右下腿の境界明瞭な発赤・熱感・腫脹",r:"右下腿",s:"悪寒, 倦怠感, 水疱(あれば), 壊死(あれば)",t:"下肢発赤・腫脹→発熱→当院受診",pe:"発赤の範囲(マーキング), 熱感, 腫脹, 水疱/水疱, 壊死, 握雪感(壊死性筋膜炎: NECのサイン), リンパ節腫脹, バイタル",tests:"血算, CRP, CK(壊死性筋膜炎), 乳酸, 血液培養2セット, 創部培養(膿瘍ドレナージ時), CT/MRI(深部進展評価), LRINEC score",probs:"#1 蜂窩織炎/丹毒(or 壊死性筋膜炎の除外) #2 糖尿病 #3 敗血症リスク",course:"蜂窩織炎: CEZ→経口スイッチ→壊死性筋膜炎疑い: 緊急手術(デブリドマン)+広域抗菌薬(MEPM+VCM+CLDM)→繰り返し手術→膿瘍: I&D",disc:"蜂窩織炎 vs 壊死性筋膜炎の鑑別(hard signs, LRINEC score), 壊死性筋膜炎の緊急手術の重要性, 膿瘍のI&Dの適応",refs:["Stevens DL. Clin Infect Dis 2014;59:147","Baddour LM. Clin Infect Dis 2019;68:e1"]},"結核":{prof:"60代男性, 慢性咳嗽, 体重減少, 移民/接触歴",cc:"慢性咳嗽(2週間以上), 微熱, 体重減少, 盗汗",o:"〇カ月前から慢性咳嗽, 微熱, 体重減少(3カ月で5kg)",p:"緩徐に進行",q:"慢性咳嗽(血痰あれば), 微熱, 盗汗",r:"両上肺野",s:"盗汗, 倦怠感, 食欲低下",t:"慢性咳嗽→前医でX線異常→喀痰抗酸菌陽性→当院紹介",pe:"やせ, 呼吸音(上肺野crackles), リンパ節腫脹, 体温",tests:"喀痰抗酸菌塗抹・培養(3連痰), TB-PCR, 胸部X線/CT(上葉空洞, 浸潤影), IGRA(QFT/T-SPOT), ツベルクリン反応, HIV検査",probs:"#1 肺結核(塗抹陽性/陰性, 薬剤感受性) #2 排菌状態の評価 #3 接触者調査",course:"標準治療(2HRZE/4HR: INH+RFP+PZA+EB→INH+RFP)→排菌陽性: 陰圧個室隔離→接触者調査→直接監視下治療(DOTS)→副作用モニタリング(肝機能, 視力)",disc:"結核の診断と標準治療レジメン, 排菌管理と感染対策, 薬剤耐性結核(MDR-TB)への対応, LTBI治療",refs:["WHO. Global Tuberculosis Report 2023","日本結核・非結核性抗酸菌症学会. 結核医療の基準 2021"]},"梅毒":{prof:"30代男性, 陰部の無痛性潰瘍",cc:"陰部の無痛性潰瘍(硬性下疳), 全身性皮疹",o:"〇週間前から陰部に無痛性の潰瘍, その後全身に皮疹",p:"第1期(下疳)→自然消退→第2期(皮疹)",q:"硬性下疳(第1期), バラ疹(第2期)",r:"陰部(第1期), 全身(第2期: 手掌・足底含む)",s:"発熱, リンパ節腫脹, 扁平コンジローマ, 脱毛",t:"陰部潰瘍→消退→全身皮疹→RPR/TPHA陽性→当院紹介",pe:"硬性下疳(無痛性潰瘍, 硬結), 鼠径リンパ節腫脹(非圧痛), バラ疹(手掌・足底含む), 扁平コンジローマ, 粘膜斑",tests:"RPR/VDRL(定量), TPHA/FTA-ABS, 暗視野顕微鏡(下疳から), HIV検査(必須: 合併多い), 髄液(神経梅毒疑い時)",probs:"#1 梅毒(第_期) #2 HIV合併の除外 #3 他のSTIスクリーニング",course:"ペニシリンG(ベンザチンPCG筋注 or AMPC経口: 日本)→治療後: RPRフォロー(6/12/24カ月)→パートナー治療→HIV等STI検査→神経梅毒疑い: PCG点滴",disc:"梅毒の病期分類と治療, RPRの治療効果判定, 神経梅毒の診断, 近年の梅毒再興と公衆衛生的意義",refs:["Ghanem KG. N Engl J Med 2020;382:845","日本性感染症学会. 性感染症診断・治療ガイドライン2020"]}},"g63":{"インフルエンザ":{prof:"35歳男性, 急性発症の発熱・筋肉痛",cc:"高熱, 頭痛, 筋肉痛, 咳嗽",o:"〇日前から突然の高熱(39℃)と全身筋肉痛",p:"急性発症, 解熱薬で一時解熱",q:"体温39℃, 全身筋肉痛, 倦怠感著明",r:"全身",s:"咳嗽, 咽頭痛, 鼻汁, 食欲低下",t:"急性発症の高熱+筋肉痛→インフルエンザ迅速検査陽性",pe:"発熱, 咽頭発赤, 呼吸音(肺炎合併の除外), バイタル",tests:"インフルエンザ迅速抗原検査(A/B), 血算, CRP(二次性細菌感染の評価), 胸部X線(肺炎疑い時), SpO2",probs:"#1 インフルエンザ(A型/B型) #2 二次性細菌感染の除外 #3 合併症リスク評価",course:"抗インフルエンザ薬(オセルタミビル/バロキサビル: 発症48h以内)→対症療法→水分補給→合併症(肺炎, 脳症)の監視→飛沫予防策→職場/学校の出席停止",disc:"インフルエンザの診断と抗ウイルス薬の適応(48時間ルール), ハイリスク群の管理, ワクチンの重要性",refs:["Uyeki TM. Clin Infect Dis 2019;68:e1","日本感染症学会. インフルエンザ診療ガイド"]},"COVID-19":{prof:"50代男性, 発熱・咳嗽・呼吸困難",cc:"発熱, 乾性咳嗽, 呼吸困難",o:"〇日前から発熱と乾性咳嗽, 〇日前から呼吸困難が出現",p:"発症5-7日目に増悪することが多い",q:"体温38.5℃, SpO2 93%, 呼吸困難(労作時)",r:"両側肺野",s:"倦怠感, 味覚・嗅覚障害, 下痢, 筋肉痛",t:"発熱・咳嗽→COVID-19抗原/PCR陽性→低酸素血症→入院",pe:"SpO2(silent hypoxia注意), 呼吸数, 呼吸補助筋使用, 肺聴診(crackles), バイタル",tests:"SARS-CoV-2 PCR/抗原, 胸部CT(すりガラス影, crazy paving), 血液ガス, 血算(リンパ球減少), CRP, フェリチン, Dダイマー, LDH, 腎機能",probs:"#1 COVID-19肺炎(重症度: 軽症/中等症I/II/重症) #2 低酸素血症 #3 凝固異常・血栓リスク",course:"軽症: 対症療法+抗ウイルス薬(ニルマトレルビル/リトナビル等)→中等症: レムデシビル+デキサメタゾン→重症: 酸素+ステロイド+トシリズマブ/バリシチニブ→抗凝固→腹臥位→人工呼吸器(必要時)→後遺症フォロー",disc:"COVID-19の重症度分類と治療薬の選択, デキサメタゾンのエビデンス(RECOVERY trial), Long COVIDの管理",refs:["NIH COVID-19 Treatment Guidelines 2024","WHO Living Guideline on COVID-19 Therapeutics 2024"]},"EBV感染症":{prof:"18歳男性, 発熱・咽頭痛・リンパ節腫脹",cc:"発熱, 咽頭痛, 頸部リンパ節腫脹",o:"〇日前から発熱, 咽頭痛, 頸部リンパ節腫脹",p:"数日かけて増悪",q:"高熱(38-39℃), 著明な咽頭扁桃腫大(白苔), 両側頸部リンパ節腫脹",r:"咽頭, 頸部リンパ節, 脾臓",s:"倦怠感(著明, 遷延), 発疹(AMPC投与後に出現), 肝脾腫",t:"発熱+咽頭痛→前医でAMPC処方→皮疹出現→EBV感染症疑い→当院紹介",pe:"咽頭扁桃腫大(白苔付着), 頸部リンパ節腫脹(後頸部含む), 脾腫, 肝腫大, 皮疹, 眼瞼浮腫",tests:"血算(異型リンパ球↑), 肝機能(AST/ALT↑), EBV-VCA IgM/IgG, EBNA抗体, 末梢血スメア, 腹部エコー(脾腫), 溶連菌迅速(除外)",probs:"#1 伝染性単核球症(EBV初感染) #2 肝機能障害 #3 脾腫(脾破裂リスク)",course:"対症療法(安静, 解熱鎮痛薬)→AMPC/ABPC禁忌(薬疹誘発)→脾腫: 接触スポーツ禁止(4-8週)→遷延性倦怠感→まれ: 気道閉塞(ステロイド考慮)",disc:"伝染性単核球症の診断と鑑別(溶連菌, CMV, HIV急性感染), AMPC投与による薬疹の機序, 脾破裂のリスク管理",refs:["Luzuriaga K. N Engl J Med 2010;362:1993","Dunmire SK. Curr Top Microbiol Immunol 2015;390:211"]},"CMV感染症":{prof:"55歳男性, 腎移植後, 免疫抑制下",cc:"発熱, 倦怠感, 白血球減少",o:"腎移植〇カ月後に発熱と倦怠感が出現",p:"緩徐に進行",q:"微熱持続, 白血球減少, 肝機能障害",r:"全身(ウイルス血症), 消化管, 網膜, 肺",s:"下痢(CMV腸炎), 視力障害(CMV網膜炎), 呼吸困難(CMV肺炎)",t:"移植後→免疫抑制下→発熱+白血球減少→CMV抗原血症陽性",pe:"発熱, 腹部圧痛(腸炎時), 眼底(網膜出血・滲出: 網膜炎), 肺聴診",tests:"CMV抗原血症(C7-HRP/C10-C11), CMV-PCR(定量), 血算, 肝機能, 内視鏡+生検(CMV腸炎: 核内封入体), 眼底検査",probs:"#1 CMV感染症(ウイルス血症/臓器障害) #2 免疫抑制状態(腎移植後) #3 免疫抑制薬の調整",course:"ガンシクロビル静注(14-21日)→バルガンシクロビル経口へ移行→CMV-PCRフォロー→免疫抑制薬減量→二次予防",disc:"CMV感染とCMV disease の区別, 移植後CMVの予防戦略(予防投与 vs 先制治療), ガンシクロビル耐性CMV",refs:["Kotton CN. Transplantation 2018;102:900","Razonable RR. Clin Microbiol Rev 2019;32:e00036"]},"HIV/AIDS":{prof:"30代男性, 体重減少, 持続性リンパ節腫脹",cc:"体重減少, 発熱, 下痢",o:"〇カ月前から体重減少(10kg), 持続する下痢と微熱",p:"緩徐に進行",q:"体重減少, 持続性全身性リンパ節腫脹, 口腔カンジダ",r:"全身",s:"盗汗, 口腔カンジダ, 帯状疱疹(既往), 反復する感染",t:"体重減少+口腔カンジダ→HIV検査陽性→当院紹介",pe:"全身性リンパ節腫脹, 口腔カンジダ, 脂漏性皮膚炎, 体重・BMI, カポジ肉腫(あれば)",tests:"HIV抗体/抗原(第4世代), HIV-RNA定量, CD4数, 耐性検査, HLA-B*5701, HBV/HCV/梅毒/Toxo/CMV IgG, 胸部X線, 結核スクリーニング",probs:"#1 HIV感染症(CDC Stage_, CD4_/μL, VL_copies/mL) #2 日和見感染の評価 #3 合併症スクリーニング",course:"ART開始(テノホビル+エムトリシタビン+ドルテグラビル等)→VL抑制確認→CD4回復→日和見感染予防(CD4<200: ST合剤)→定期フォロー→パートナーへのU=U説明",disc:"ARTの開始時期(診断後速やかに), 推奨レジメンの選択, 日和見感染の予防と治療, U=U(Undetectable=Untransmittable)の概念",refs:["Panel on Antiretroviral Guidelines for Adults. NIH 2024","Saag MS. JAMA 2018;320:379"]},"水痘・帯状疱疹":{prof:"70代女性, 片側性帯状分布の水疱・疼痛",cc:"右胸部の帯状分布の疼痛と水疱",o:"〇日前から右胸部にピリピリした痛み, 〇日後に水疱出現",p:"先行する神経痛→水疱出現",q:"片側性, 帯状分布の水疱(Th5-6デルマトーム), 疼痛著明",r:"右胸部(片側, 正中を超えない)",s:"発熱(あれば), 頭痛(三叉神経領域の場合)",t:"片側性疼痛→水疱出現→当院受診",pe:"帯状分布の水疱・紅斑(片側性), Ramsay Hunt症候群(耳介: 顔面神経麻痺+難聴), 眼部帯状疱疹(角膜炎: Hutchinson sign), DIS(播種性)",tests:"臨床診断が主, VZV PCR/Tzanck test(非典型時), 眼科診察(三叉神経V1), 免疫状態評価(DIS時)",probs:"#1 帯状疱疹(デルマトーム: _) #2 帯状疱疹後神経痛(PHN)リスク #3 合併症(眼部/Ramsay Hunt/DIS)",course:"抗ウイルス薬(バラシクロビル, 72h以内: 早期開始)→疼痛管理(NSAIDs→プレガバリン/アミトリプチリン: PHN)→眼部: 眼科コンサルト→重症/免疫不全: ACV静注",disc:"帯状疱疹の早期治療の重要性, PHNの予防と治療, 帯状疱疹ワクチン(Shingrix)の推奨",refs:["Cohen JI. N Engl J Med 2013;369:255","日本ペインクリニック学会. 帯状疱疹ガイドライン 2022"]},"ウイルス性肝炎（A/B/C/E型）":{prof:"35歳男性, 黄疸, 肝機能障害",cc:"黄疸, 倦怠感, 食欲低下",o:"〇週間前から倦怠感と食欲低下, 〇日前から黄疸",p:"急性発症→増悪",q:"黄疸, AST/ALT>1000, 全身倦怠感",r:"肝臓",s:"嘔気, 褐色尿, 灰白色便, 掻痒感",t:"倦怠感→黄疸→前医で肝機能異常→ウイルス性肝炎疑い→当院紹介",pe:"黄疸(眼球結膜・皮膚), 肝腫大(急性期), 脾腫, 腹水(劇症化時), 羽ばたき振戦(肝性脳症)",tests:"AST/ALT, T-Bil, PT-INR(劇症化指標), 血算, HBs抗原/IgM-HBc抗体(B型), HCV抗体/HCV-RNA(C型), IgM-HA抗体(A型), IgA-HEV抗体(E型), 腹部エコー",probs:"#1 急性ウイルス性肝炎(A/B/C/E型) #2 劇症肝炎リスク評価(PT-INR) #3 慢性化リスク(B型/C型)",course:"急性期: 安静・対症療法→劇症化監視(PT, 意識レベル)→B型急性: 通常自然治癒, 重症: 核酸アナログ→C型: DAA(慢性化時)→A/E型: 対症療法→劇症肝炎: 肝移植検討",disc:"ウイルス性肝炎の型別特徴と感染経路, 劇症肝炎の早期認識, B型肝炎の慢性化リスク(成人は低い), C型肝炎のDAA治療",refs:["Liang TJ. N Engl J Med 2013;368:1907","Terrault NA. Hepatology 2018;67:1560"]}},"g64":{"カンジダ症":{prof:"60代男性, 長期抗菌薬・CVカテーテル留置中, 発熱",cc:"発熱持続(抗菌薬無効), カテーテル感染疑い",o:"広域抗菌薬投与〇日目, 発熱が持続",p:"抗菌薬で改善しない発熱",q:"38℃以上の持続熱, 血液培養からカンジダ検出",r:"全身(カンジダ血症), 眼内(眼内炎)",s:"視力障害(眼内炎合併時)",t:"長期抗菌薬→発熱持続→血液培養カンジダ陽性→当院コンサルト",pe:"バイタル, カテーテル挿入部(発赤, 排膿), 眼底(眼内炎: 綿花様白斑),  肝脾腫(慢性播種性), 皮疹",tests:"血液培養(カンジダ種同定+感受性), β-D-グルカン, 眼底検査(全例必須), 心エコー(IE除外), 腹部エコー/CT(慢性播種性除外)",probs:"#1 カンジダ血症 #2 CVカテーテル関連血流感染 #3 眼内炎合併の有無",course:"カテーテル抜去→抗真菌薬(エキノキャンディン系: ミカファンギン→感受性でFLCZへstep-down)→血液培養陰性化確認後14日以上→眼内炎あれば延長→フォロー血培",disc:"カンジダ血症の管理(カテーテル抜去+抗真菌薬), エキノキャンディン vs アゾールの使い分け, 眼内炎スクリーニングの重要性",refs:["Pappas PG. Clin Infect Dis 2016;62:e1","Kullberg BJ. N Engl J Med 2015;373:1445"]},"アスペルギルス症":{prof:"55歳男性, 急性白血病, 好中球減少, 発熱",cc:"発熱持続(広域抗菌薬無効), 咳嗽, 胸痛",o:"化学療法後好中球減少中, 広域抗菌薬〇日目に発熱持続",p:"抗菌薬無効の発熱, 呼吸器症状出現",q:"発熱持続, 咳嗽, 胸膜痛",r:"肺(最多), 副鼻腔, 中枢神経",s:"血痰, 呼吸困難",t:"好中球減少中の発熱→抗菌薬無効→CT→侵襲性肺アスペルギルス症疑い",pe:"肺聴診(局所性crackles), 副鼻腔圧痛, バイタル, SpO2",tests:"胸部CT(halo sign, air crescent sign, 結節影), 血清ガラクトマンナン抗原, β-D-グルカン, BAL(培養, ガラクトマンナン, PCR), 喀痰培養",probs:"#1 侵襲性肺アスペルギルス症(IPA) #2 好中球減少症(原疾患: _) #3 発熱性好中球減少症",course:"ボリコナゾール(第一選択)→効果不十分: リポソーマルAmB or エキノキャンディン併用→好中球回復促進→CT/ガラクトマンナンフォロー→二次予防",disc:"侵襲性アスペルギルス症の早期診断(CT, ガラクトマンナン), ボリコナゾールのTDMの重要性, 予防投与の適応",refs:["Patterson TF. Clin Infect Dis 2016;63:e1","Ullmann AJ. Clin Microbiol Infect 2018;24:e1"]},"クリプトコッカス症":{prof:"45歳男性, HIV陽性(CD4<100), 頭痛・発熱",cc:"慢性頭痛, 微熱, 意識障害",o:"〇週間前から頭痛と微熱が持続",p:"亜急性に進行",q:"頭痛(頭蓋内圧亢進), 微熱",r:"髄膜(最多), 肺",s:"嘔吐, 視力障害, 意識変容",t:"慢性頭痛→HIV判明→髄液クリプトコッカス抗原陽性→当院紹介",pe:"項部硬直(軽度), 乳頭浮腫, 意識レベル, 脳神経麻痺",tests:"髄液(開放圧↑↑, 墨汁染色, クリプトコッカス抗原, 培養), 血清クリプトコッカス抗原, 頭部MRI, CD4数",probs:"#1 クリプトコッカス髄膜炎 #2 HIV/AIDS #3 頭蓋内圧亢進",course:"導入: AmB+5-FC(2週)→地固め: FLCZ高用量(8週)→維持: FLCZ長期→頭蓋内圧管理(反復LP)→ART開始(2-4週後)",disc:"クリプトコッカス髄膜炎の段階的抗真菌療法, 頭蓋内圧管理の重要性, ART開始時期とIRIS",refs:["Perfect JR. Clin Infect Dis 2010;50:291","Molloy SF. N Engl J Med 2018;378:1004"]},"ニューモシスチス肺炎":{prof:"40代男性, HIV陽性(CD4<200), 労作時呼吸困難",cc:"労作時呼吸困難, 乾性咳嗽, 発熱",o:"〇週間前から緩徐に進行する労作時呼吸困難と微熱",p:"緩徐に進行(数週間)",q:"労作時呼吸困難, SpO2低下(労作時), 乾性咳嗽",r:"両側肺野(びまん性)",s:"発熱(微熱), 倦怠感, 体重減少",t:"労作時呼吸困難→HIV判明(CD4<200)→PCP疑い→当院紹介",pe:"SpO2(安静時→労作時で低下著明), 肺聴診(初期は正常, 進行するとcrackles), 口腔カンジダ(HIV合併)",tests:"胸部CT(びまん性すりガラス影), β-D-グルカン↑, LDH↑, KL-6, 血液ガス(A-aDO2開大), BAL(Grocott染色, PCR), 喀痰PCR, CD4数",probs:"#1 ニューモシスチス肺炎(PCP) #2 HIV/AIDS(CD4<200) #3 低酸素血症",course:"ST合剤(TMP-SMX, 21日間)→中等症以上(PaO2<70): ステロイド併用(Day1-5: PSL 40mg bid→漸減)→代替: ペンタミジン/アトバコン→ART開始→ST合剤二次予防",disc:"PCPの診断(βDG, CT, BAL), ST合剤+ステロイド併用の適応(A-aDO2>35/PaO2<70), HIV陰性患者のPCP(より重症)",refs:["Huang L. N Engl J Med 2011;364:e61","Thomas CF. N Engl J Med 2004;350:2487"]},"マラリア":{prof:"30代男性, アフリカ渡航帰国後の発熱",cc:"高熱(周期性), 悪寒戦慄, 頭痛",o:"アフリカ渡航から帰国〇日後に高熱と悪寒",p:"周期性発熱(48h/72h), 解熱期は比較的良好",q:"39-40℃の高熱, 著明な悪寒戦慄, 発汗",r:"全身",s:"頭痛, 筋肉痛, 嘔吐, 下痢, 黄疸",t:"アフリカ渡航帰国→発熱→マラリア疑い→当院受診",pe:"発熱, 脾腫, 貧血, 黄疸, 意識レベル(重症マラリア), バイタル",tests:"末梢血塗抹(厚層・薄層: マラリア原虫種同定, 寄生率), マラリア迅速診断キット(RDT), 血算(貧血, 血小板減少), LDH, T-Bil, 腎機能, 血糖, 乳酸",probs:"#1 マラリア(原虫種: 熱帯熱/三日熱/四日熱/卵形, 寄生率_%) #2 重症マラリアの評価 #3 貧血・血小板減少",course:"熱帯熱マラリア: アルテスネート静注(重症) or ACT(非重症)→非熱帯熱: クロロキン→寄生率モニタリング→三日熱: プリマキン(再発予防, G6PD確認)→渡航者への予防啓発",disc:"マラリアの緊急性(熱帯熱マラリアの致死性), 重症マラリアの定義, 治療薬の選択(ACT vs クロロキン), 予防内服",refs:["WHO. World Malaria Report 2023","White NJ. N Engl J Med 2014;371:411"]},"C.difficile感染症":{prof:"70代女性, 抗菌薬投与後の下痢",cc:"水様性下痢, 腹痛, 発熱",o:"広域抗菌薬投与〇日後から水様性下痢(1日10回以上)",p:"抗菌薬投与中に出現, 増悪",q:"水様性下痢(悪臭), 腹痛, 発熱",r:"大腸(全体)",s:"脱水, 白血球著増(>15000), 腎機能低下(重症指標), 腹部膨満(イレウス/中毒性巨大結腸症)",t:"抗菌薬投与中→水様下痢→CDI疑い→検査提出",pe:"腹部圧痛(びまん性), 腸蠕動音, 脱水所見, 腹部膨満(中毒性巨大結腸症の除外), バイタル",tests:"便CDトキシン(GDH+トキシンA/B, NAAT), 血算(白血球↑↑), Cr, アルブミン, 腹部X線/CT(壁肥厚, 中毒性巨大結腸症除外), 大腸内視鏡(偽膜, 必要時)",probs:"#1 C.difficile感染症(初発/再発, 重症度: 非重症/重症/劇症型) #2 抗菌薬関連下痢症 #3 脱水・電解質異常",course:"被疑抗菌薬中止→非重症: バンコマイシン経口 or フィダキソマイシン→重症: バンコマイシン経口+メトロニダゾール静注→劇症型: 外科コンサルト→再発: フィダキソマイシン/FMT→感染対策(接触予防策, 手洗い)",disc:"CDIの重症度分類と治療選択, 再発CDIの管理(FMTのエビデンス), 感染対策(アルコール無効, 手洗いの重要性)",refs:["McDonald LC. Clin Infect Dis 2018;66:987","Johnson S. Clin Infect Dis 2021;73:e1029"]}},"g65":{"敗血症":{prof:"70代女性, 尿路感染, 発熱・意識変容",cc:"発熱, 意識変容, 頻脈",o:"〇日前から発熱と排尿時痛, 本日意識変容",p:"急速に進行",q:"体温39℃, HR 110, RR 24, 意識変容",r:"全身",s:"悪寒戦慄, 乏尿",t:"発熱→意識変容→qSOFA陽性→救急搬送",pe:"バイタル(発熱, 頻脈, 頻呼吸, 低血圧), 意識レベル, 感染巣の検索(CVA叩打痛等), 末梢循環",tests:"qSOFA/SOFAスコア, 乳酸, 血液培養2セット, 尿培養, 血液ガス, 血算, CRP, PCT, 凝固, 腎機能, 肝機能, 画像(感染巣検索)",probs:"#1 敗血症(感染巣: 尿路, SOFA_点) #2 急性腎障害 #3 臓器障害評価",course:"Hour-1 bundle(血培→広域抗菌薬→輸液30mL/kg→乳酸測定)→感染巣同定→臓器サポート→培養結果でde-escalation→治療期間決定",disc:"Sepsis-3の定義(感染+臓器障害), Hour-1 bundleの遵守, qSOFA vs NEWS, 抗菌薬の早期投与の重要性",refs:["Evans L. Crit Care Med 2021;49:e1063","Singer M. JAMA 2016;315:801"]},"菌血症":{prof:"60代男性, CVカテーテル留置中, 発熱",cc:"突然の悪寒戦慄を伴う発熱",o:"CVカテーテル留置〇日目に突然の悪寒戦慄と高熱",p:"突然発症",q:"体温39.5℃, 悪寒戦慄, シェイキングチル",r:"全身",s:"カテーテル挿入部の発赤(あれば)",t:"カテーテル留置中→突然の悪寒戦慄→菌血症疑い",pe:"バイタル, カテーテル挿入部(発赤, 排膿, 圧痛), 他の感染巣検索, 心雑音(IE除外)",tests:"血液培養2セット以上(末梢+カテーテル: DTP計算), カテーテル先端培養(抜去時), CRP, PCT, 血算, 心エコー(IE除外, 黄色ブドウ球菌時)",probs:"#1 カテーテル関連血流感染(CRBSI)疑い #2 菌血症(起因菌: _) #3 合併症(IE, 転移性感染)",course:"血培2セット→カテーテル抜去(可能なら)→経験的抗菌薬(VCM+CFPM等)→起因菌同定後最適化→S.aureus: IE除外+4-6週治療→フォロー血培陰性化確認",disc:"菌血症の管理(フォロー血培, IE除外, 治療期間), CRBSI vs 他の感染巣, 黄色ブドウ球菌菌血症の特殊性(長期治療)",refs:["Mermel LA. Clin Infect Dis 2009;49:1","Holland TL. JAMA 2014;312:1330"]},"CRBSI":{prof:"55歳男性, TPN管理中, CVカテーテル, 発熱",cc:"発熱, カテーテル挿入部の発赤",o:"CVカテーテル留置〇日目に発熱, 挿入部に発赤出現",p:"カテーテル留置期間と相関",q:"38.5℃以上の発熱, 挿入部発赤・排膿",r:"カテーテル挿入部, 全身(菌血症)",s:"悪寒戦慄",t:"CVカテーテル留置中→発熱→カテーテル感染疑い",pe:"カテーテル挿入部(発赤, 排膿, 硬結, 圧痛), バイタル, 他の感染巣の除外",tests:"血液培養(カテーテルハブ+末梢: DTP>2h), カテーテル先端培養(Maki法: 15CFU以上), CRP, 血算",probs:"#1 CRBSI(起因菌: CNS/S.aureus/Candida) #2 カテーテル管理 #3 合併症(IE, 化膿性血栓性静脈炎)",course:"カテーテル抜去(第一選択)→血液培養に基づく抗菌薬→S.aureus: 4-6週+IE除外→CNS: 5-7日(合併症なし)→Candida: 抗真菌薬+眼科→カテーテル入替(必要時, ガイドワイヤー交換は避ける)",disc:"CRBSIの診断基準(DTP, カテーテル先端培養), カテーテル抜去の適応, 起因菌別の治療期間, 予防策(バンドルアプローチ)",refs:["Mermel LA. Clin Infect Dis 2009;49:1","O'Grady NP. Clin Infect Dis 2011;52:e162"]},"薬剤耐性菌（MRSA/ESBL/CRE）":{prof:"70代男性, 長期入院, 耐性菌検出",cc:"耐性菌検出(感染 or 保菌), 治療薬選択困難",o:"入院中の培養検査で耐性菌(MRSA/ESBL産生菌/CRE)が検出",p:"既存感染症が標準治療に反応しない",q:"培養からMRSA or ESBL産生菌 or CRE検出",r:"原感染巣による(肺/尿路/血流/創部)",s:"長期入院歴, 広域抗菌薬使用歴, 免疫抑制状態",t:"培養で耐性菌→感染症科コンサルト",pe:"原感染巣に応じた身体所見, バイタル(敗血症の評価), 感染経路の評価",tests:"培養・感受性試験(MIC), 耐性遺伝子検査(必要時), 保菌スクリーニング(鼻腔/直腸スワブ), 感染マーカー",probs:"#1 薬剤耐性菌感染症(MRSA/ESBL/CRE) #2 抗菌薬選択(感受性に基づく) #3 感染対策(院内伝播防止)",course:"MRSA: VCM or DAPTOMYCIN or LZD→ESBL: MEPM(重症) or CMZ/PIPC-TAZ(軽症)→CRE: MEPM(MIC低値)/CFDC/CAZ-AVI→TDM実施→感染対策(接触予防策)→抗菌薬適正使用(ASP)",disc:"薬剤耐性菌の疫学と耐性機序, 治療薬の選択(MRSA: VCM TDM, ESBL: カルバペネムの位置づけ, CRE: 新規抗菌薬), AMR対策",refs:["Liu C. Clin Infect Dis 2011;52:285","Doi Y. Clin Infect Dis 2017;64:S218"]},"旅行者感染症":{prof:"30代男性, 東南アジア渡航帰国後の発熱・下痢",cc:"発熱, 下痢, 腹痛",o:"東南アジア渡航から帰国〇日後に発熱と下痢",p:"帰国後急性発症",q:"発熱(38-39℃), 水様性〜粘血便, 腹痛",r:"全身, 消化管",s:"嘔吐, 脱水, 筋肉痛, 発疹(デング熱), 黄疸(マラリア)",t:"渡航帰国→発熱+下痢→当院受診",pe:"バイタル, 脱水所見, 脾腫(マラリア), 発疹(デング), 黄疸, リンパ節腫脹, 肝腫大",tests:"マラリア検査(塗抹+RDT: 発熱なら必ず), デング熱(NS1抗原, IgM), 便培養・寄生虫検査, 血算(血小板減少: デング), 肝腎機能, 血液培養(腸チフス), 渡航歴の詳細聴取",probs:"#1 旅行者感染症(渡航先: _, 鑑別: マラリア/デング熱/腸チフス/旅行者下痢症) #2 脱水 #3 重症化リスク評価",course:"マラリア除外(最優先)→脱水補正→旅行者下痢症: FQ or AZM→デング熱: 対症療法+血小板モニタリング→腸チフス: CTRX or FQ→重症: 入院管理",disc:"旅行者の発熱の鑑別(潜伏期間別), マラリア除外の重要性(致死性), 渡航地域別のリスク評価, 渡航前ワクチンと予防内服",refs:["Ryan ET. N Engl J Med 2002;347:505","CDC. Yellow Book 2024"]}},"g66":{"敗血症性ショック":{prof:"65歳男性, 胆道感染症",cc:"発熱, 意識障害, 血圧低下",o:"〇日前から発熱→本日急激に血圧低下・意識混濁",p:"輸液で一時的にMAP維持, 再低下",q:"体温39.5℃, BP 75/45mmHg, HR 125/min",r:"全身(ショック)",s:"悪寒戦慄, 黄疸, 右季肋部痛, 乏尿",t:"腹痛・発熱→急激に増悪→救急搬送",pe:"意識レベル, バイタル, 末梢冷感・網状皮斑, 右季肋部圧痛, Murphy sign, 黄疸",tests:"乳酸, 血液培養, 血液ガス, CRP, PCT, 血算, 凝固(DIC評価), 腎機能, 肝機能, 腹部CT",probs:"#1 敗血症性ショック(感染巣: 胆道) #2 急性胆管炎(TG18: GradeIII) #3 DIC #4 急性腎障害",course:"Hour-1 bundle(血培→抗菌薬→輸液30mL/kg→乳酸→昇圧薬)→感染源コントロール→臓器サポート→de-escalation",disc:"SSC Guidelines 2021のバンドルアプローチ, 感染源コントロールの重要性, 敗血症性ショックの血行動態管理",refs:["Evans L. Crit Care Med 2021;49:e1063","Miura F. J Hepatobiliary Pancreat Sci 2018;25:55"]},"循環血液量減少性ショック":{prof:"40代男性, 吐下血, 出血性ショック",cc:"吐血, 血圧低下, 頻脈",o:"〇時間前から吐血, その後血圧低下",p:"急速に進行",q:"BP 80/50mmHg, HR 120/min, 吐血(暗赤色)",r:"全身(ショック)",s:"冷汗, 意識レベル低下, 乏尿",t:"吐血→大量出血→血圧低下→救急搬送",pe:"ショック徴候(頻脈, 低血圧, 冷汗, 末梢冷感, CRT延長), 出血部位評価(腹部, 直腸診), 意識レベル",tests:"血液ガス(乳酸↑, Hb低下), 血液型・交差試験, 血算, 凝固, BUN/Cr, 上部消化管内視鏡(出血源同定)",probs:"#1 出血性ショック(出血源: 上部消化管出血) #2 循環血液量減少 #3 凝固異常(大量出血時)",course:"ABC確保→大量輸液(晶質液+赤血球輸血)→MTP(大量輸血プロトコル: RBC:FFP:PC=1:1:1)→内視鏡的止血→IVR/手術→ショック離脱→原疾患治療",disc:"出血性ショックのClass分類(ATLS), 大量輸血プロトコルの意義, Permissive hypotensionの概念, 出血源の迅速同定",refs:["Cannon JW. N Engl J Med 2018;378:370","ATLS Student Manual, 10th ed."]},"心原性ショック":{prof:"70代男性, 急性心筋梗塞後, 血圧低下",cc:"胸痛後の血圧低下, 呼吸困難, 末梢冷感",o:"急性心筋梗塞発症〇時間後に血圧低下",p:"PCI後も血行動態改善なし",q:"BP 75/50mmHg, HR 110, CI<2.2, PCWP>18",r:"心臓(左室), 全身",s:"呼吸困難(肺水腫), 冷汗, 意識障害, 乏尿",t:"AMI発症→PCI→血圧低下持続→心原性ショック",pe:"ショック徴候, III/IV音, 肺湿性ラ音, 頸静脈怒張, 末梢冷感・チアノーゼ, 意識レベル",tests:"心エコー(EF↓↓, 壁運動異常, 機械的合併症), Swan-Ganzカテーテル(CI, PCWP), 乳酸, BNP, 心筋マーカー, 血液ガス",probs:"#1 心原性ショック(AMI後, Killip IV) #2 急性心筋梗塞 #3 多臓器不全リスク",course:"緊急PCI→昇圧薬(ノルアドレナリン)→強心薬(ドブタミン)→IABP/Impella/VA-ECMO→機械的合併症(VSD, 乳頭筋断裂): 緊急手術→臓器サポート",disc:"心原性ショックの血行動態管理, 機械的循環補助(IABP vs Impella vs ECMO), SHOCK trial",refs:["van Diepen S. Circulation 2017;136:e231","Thiele H. N Engl J Med 2012;367:1287"]},"閉塞性ショック":{prof:"65歳男性, 術後, 突然の低酸素血症・血圧低下",cc:"突然の呼吸困難, 血圧低下, 頻脈",o:"術後〇日目に突然の呼吸困難と血圧低下",p:"突然発症, 急速に進行",q:"BP 70/40mmHg, HR 130, SpO2 80%, 突然発症",r:"全身(ショック), 肺(PE)/ 心膜(タンポナーデ)/ 胸腔(緊張性気胸)",s:"頸静脈怒張, チアノーゼ",t:"術後→突然の低酸素・低血圧→閉塞性ショック疑い",pe:"頸静脈怒張(共通), 心音減弱(タンポナーデ)/呼吸音消失+気管偏位(緊張性気胸)/下肢腫脹(PE), 奇脈",tests:"心エコー(右心負荷/心嚢液貯留/IVC拡張), 造影CT(PE), 胸部X線(気胸), 血液ガス, Dダイマー, 心電図(S1Q3T3/電気的交互脈)",probs:"#1 閉塞性ショック(原因: PE/心タンポナーデ/緊張性気胸) #2 急性右心不全 #3 低酸素血症",course:"PE: 抗凝固→血栓溶解(massive PE)/カテーテル治療→心タンポナーデ: 心嚢穿刺→緊張性気胸: 緊急脱気(針→胸腔ドレーン)→原因に対する根本治療",disc:"閉塞性ショックの3大原因の迅速鑑別(エコーが鍵), 各原因に対する緊急介入, massive PEの治療戦略",refs:["Konstantinides SV. Eur Heart J 2020;41:543","Spodick DH. N Engl J Med 2003;349:684"]},"アナフィラキシーショック":{prof:"35歳女性, 造影剤投与後",cc:"造影剤投与直後の血圧低下, 全身蕁麻疹, 呼吸困難",o:"造影CT施行中, 造影剤投与〇分後に全身蕁麻疹と血圧低下",p:"急速進行(数分)",q:"BP 60/40mmHg, HR 130, 全身蕁麻疹, 喉頭浮腫",r:"全身",s:"喘鳴, stridor, 意識障害, 嘔吐",t:"造影剤投与→数分で全身症状→アナフィラキシーショック",pe:"ショック徴候, 蕁麻疹, 血管性浮腫(口唇・喉頭), 喘鳴/stridor, 意識レベル, SpO2",tests:"臨床診断(検査で治療を遅延させない), 事後: トリプターゼ(1-2h後), 造影剤特異的リンパ球刺激試験",probs:"#1 アナフィラキシーショック(造影剤) #2 気道緊急 #3 循環不全",course:"造影剤投与中止→アドレナリン筋注(0.3-0.5mg: 反復可)→仰臥位+下肢挙上→大量輸液(NS 1-2L急速)→気道確保(挿管準備)→H1/H2 blocker+ステロイド→経過観察(8-12h)→アレルギーカード→次回造影時: 前投薬",disc:"アナフィラキシーショックの初期対応(アドレナリンが最優先), 造影剤アレルギーの前投薬プロトコル, 二相性反応の監視",refs:["Cardona V. Allergy 2020;75:1582","ACR Committee on Drugs and Contrast Media. ACR Manual 2024"]},"熱中症":{prof:"75歳男性, 猛暑日に屋外作業, 意識障害",cc:"高体温, 意識障害, 発汗停止",o:"猛暑日に屋外作業中, 突然の意識障害と高体温",p:"急速に進行",q:"深部体温40.5℃, 意識障害(GCS 8), 発汗停止(古典型)or 発汗あり(労作性)",r:"全身(中枢神経, 多臓器)",s:"痙攣, DIC, 横紋筋融解, 急性腎障害, 肝障害",t:"屋外作業中→倒れる→救急搬送",pe:"深部体温(直腸温>40℃), 意識レベル, 発汗の有無, 皮膚(紅潮/蒼白), バイタル, 筋硬直",tests:"深部体温, 血液ガス, 電解質, 血糖, CK(横紋筋融解), 凝固(DIC), 腎機能, 肝機能, 乳酸, 尿ミオグロビン",probs:"#1 熱中症(III度: 熱射病) #2 多臓器障害(DIC, 横紋筋融解, AKI, 肝障害) #3 高体温",course:"冷却(最優先: 氷水浸漬/蒸散法→深部体温39℃目標)→輸液→電解質補正→DIC管理→横紋筋融解: 大量輸液→臓器サポート→ICU管理",disc:"熱中症の重症度分類(I-III度/日本救急医学会), 冷却法の選択(氷水浸漬が最も有効), 多臓器障害の管理, 予防教育",refs:["Epstein Y. N Engl J Med 2019;380:2449","日本救急医学会. 熱中症診療ガイドライン2015"]}},"g67":{"意識障害の初期対応":{prof:"60代男性, 意識障害で搬送",cc:"意識障害",o:"家族が意識がない状態を発見, 救急要請",p:"発見時既に意識障害",q:"JCS III-100, GCS E1V2M4",r:"全身",s:"外傷の有無, 嘔吐, 失禁",t:"意識障害→救急搬送",pe:"ABC確認, GCS/JCS, 瞳孔(大きさ・対光反射・左右差), 簡易血糖, 体温, 眼球運動(人形の目), 運動反応(左右差), 項部硬直, 外傷, バイタル",tests:"血糖(即座), 血液ガス, 電解質(Na, Ca, Mg), BUN/Cr, NH3, 血算, 肝機能, 甲状腺, 薬物スクリーニング, 頭部CT→MRI, 心電図, 髄液(髄膜炎疑い時)",probs:"#1 意識障害(GCS_, 原因検索中) #2 AIUEOTIPS系統的鑑別 #3 気道・循環の安定化",course:"ABC確保→血糖チェック(低血糖→ブドウ糖)→バイタル安定化→AIUEOTIPS系統的評価→頭部CT→原因に応じた治療→ICU管理",disc:"意識障害の系統的アプローチ(AIUEOTIPS), 緊急介入が必要な原因(低血糖, 頭蓋内出血, 細菌性髄膜炎, 中毒)の迅速同定",refs:["Edlow JA. N Engl J Med 2021;384:555","日本救急医学会. 救急診療指針 改訂第5版"]},"急性期脳卒中管理":{prof:"72歳男性, 急性発症の片麻痺",cc:"突然の左片麻痺, 構音障害",o:"〇月〇日〇時, 突然の左上下肢脱力",p:"突然発症, 改善なし",q:"NIHSS 15点, 左片麻痺",r:"右大脳半球",s:"構音障害, 意識障害",t:"突然発症→家族が発見→救急搬送(last known well: _時)",pe:"NIHSS, GCS, バイタル, 血糖, 頭頸部血管雑音",tests:"頭部CT(出血除外)→CT-A(LVO: 大血管閉塞)→CT灌流/MRI(ペナンブラ評価)→血算, 凝固, 電解質, 血糖, 心電図",probs:"#1 急性脳卒中(脳梗塞/脳出血) #2 再灌流療法の適応評価 #3 合併症予防",course:"rt-PA(4.5h以内, 適応あれば)→血栓回収療法(LVO, 24h以内: DAWN/DEFUSE3基準)→脳出血: 降圧管理→抗浮腫→DVT予防→嚥下評価→早期リハビリ→二次予防",disc:"急性期脳卒中の時間依存的治療(time is brain), rt-PA適応基準と禁忌, 血栓回収療法の拡大時間窓(DAWN/DEFUSE3), 脳卒中ユニットの重要性",refs:["Powers WJ. Stroke 2019;50:e344","Nogueira RG. N Engl J Med 2018;378:11"]},"てんかん重積状態":{prof:"45歳男性, てんかん既往, 痙攣持続",cc:"5分以上持続する痙攣",o:"〇分前から痙攣が持続, 意識回復なし",p:"痙攣持続, 間欠期も意識回復なし",q:"強直間代発作の重積, GCS 3-6",r:"全般性",s:"チアノーゼ, 発熱",t:"痙攣持続→救急搬送",pe:"痙攣の持続, 意識レベル, バイタル(低酸素, 高体温), 瞳孔, 外傷",tests:"血糖, 血液ガス, 電解質, CK, AED血中濃度, 脳波, 頭部CT(必要時)",probs:"#1 てんかん重積状態 #2 全身合併症 #3 原因検索",course:"ABCの確保→Stage 1(0-5min): ジアゼパム/ミダゾラム→Stage 2(5-20min): ホスフェニトイン/レベチラセタム→Stage 3(20-40min): ミダゾラム/プロポフォール持続静注→原因治療",disc:"てんかん重積の段階的治療, 時間依存的プロトコルの重要性, 非痙攣性てんかん重積(NCSE)の診断",refs:["Trinka E. Epilepsia 2015;56:1515","Glauser T. Epilepsy Curr 2016;16:48"]},"高血糖・低血糖緊急症":{prof:"60代男性, 糖尿病, 意識障害",cc:"意識障害(高血糖 or 低血糖)",o:"糖尿病治療中, 本日意識障害で発見",p:"急性発症(低血糖) or 亜急性(高浸透圧)",q:"血糖 30mg/dL(低血糖) or 800mg/dL(HHS), 意識障害",r:"全身(中枢神経)",s:"低血糖: 発汗, 振戦, 動悸 / HHS: 口渇, 多尿, 脱水著明",t:"意識障害→救急搬送→血糖測定",pe:"意識レベル, バイタル, 脱水所見, 発汗(低血糖), 局所神経徴候(低血糖でも出現しうる), 感染巣",tests:"血糖(即座), 血液ガス(pH, HCO3), 電解質(Na補正, K), 浸透圧(HHS: >320), ケトン体, BUN/Cr, 血算, 感染検索",probs:"#1 低血糖性昏睡 or 高血糖高浸透圧状態(HHS) or DKA #2 糖尿病 #3 誘因検索(感染/薬剤/食事)",course:"低血糖: ブドウ糖静注(50% 40mL)→原因検索(SU薬: 遷延注意)→HHS: 大量輸液(生食→0.45%NaCl)→インスリン少量持続→電解質補正→誘因治療",disc:"低血糖の緊急性と原因検索(SU薬, インスリン過量), HHSとDKAの鑑別と治療の違い, HHSの高死亡率",refs:["Kitabchi AE. Diabetes Care 2009;32:1335","Pasquel FJ. Nat Rev Endocrinol 2014;10:723"]},"肝性脳症":{prof:"65歳男性, 肝硬変, 意識変容",cc:"見当識障害, 羽ばたき振戦, 異常行動",o:"肝硬変管理中, 〇日前から見当識障害と異常行動",p:"急性〜亜急性, 誘因あり",q:"West-Haven Grade II-III, 羽ばたき振戦(+)",r:"びまん性脳機能障害",s:"便秘, 消化管出血, 感染, 利尿薬過量",t:"肝硬変→意識変容→当院受診/搬送",pe:"意識レベル, 羽ばたき振戦, 黄疸, 腹水, 肝性口臭",tests:"NH3, 血液ガス, 電解質, 血糖, 腎機能, 肝機能, 頭部CT(除外), 脳波(三相波), 感染検索",probs:"#1 肝性脳症(West-Haven Grade_) #2 肝硬変 #3 誘因(_)",course:"誘因除去(感染治療, 出血止血, 便秘改善, 電解質補正)→ラクツロース(排便2-3回/日目標)→リファキシミン→栄養管理(BCAA)→再発予防",disc:"肝性脳症の誘因と系統的検索, ラクツロース+リファキシミンのエビデンス, 最小限肝性脳症(covert HE)の概念",refs:["Vilstrup H. Hepatology 2014;60:715","Rose CF. J Hepatol 2020;73:1526"]}},"g68":{"急性呼吸不全":{prof:"70代男性, COPD, 呼吸困難増悪",cc:"呼吸困難, 低酸素血症, CO2貯留",o:"〇日前から呼吸困難が増悪",p:"急性に増悪",q:"SpO2 85%(RA), PaCO2 60mmHg, 呼吸補助筋使用",r:"両肺",s:"頻呼吸, チアノーゼ, 意識障害(CO2ナルコーシス)",t:"呼吸困難増悪→救急搬送",pe:"呼吸数, SpO2, 呼吸補助筋使用, 肺聴診(wheezes/crackles), 意識レベル(CO2ナルコーシス), チアノーゼ",tests:"血液ガス(I型/II型呼吸不全の鑑別), 胸部X線/CT, 血算, BNP(心不全除外), Dダイマー(PE除外), 心電図",probs:"#1 急性呼吸不全(I型/II型) #2 原因検索(COPD増悪/肺炎/心不全/PE等) #3 気道・換気管理",course:"酸素投与(II型: 低流量から)→NPPV(II型呼吸不全: COPD増悪, 心不全)→改善なし: 気管挿管+人工呼吸管理→原因治療→ウィーニング",disc:"呼吸不全の分類(I型 vs II型), 酸素投与の注意点(CO2ナルコーシスリスク), NPPVの適応と限界, 人工呼吸管理の基本",refs:["Davidson AC. Thorax 2016;71:ii1","日本呼吸器学会. NPPV(非侵襲的陽圧換気療法)ガイドライン"]},"ARDS":{prof:"55歳男性, 肺炎後, 進行性低酸素血症",cc:"進行性呼吸困難, 低酸素血症(高濃度酸素でも改善不良)",o:"肺炎発症〇日後に急速に呼吸状態が悪化",p:"急性発症(1週間以内), 急速進行",q:"P/F比<200(中等症), 両側浸潤影, 高濃度酸素でもSpO2維持困難",r:"両側肺野(びまん性)",s:"頻呼吸, 呼吸補助筋使用",t:"肺炎→急速悪化→P/F比低下→ARDS診断→ICU管理",pe:"頻呼吸, 呼吸努力著明, 両肺crackles, SpO2低下, チアノーゼ",tests:"血液ガス(P/F比), 胸部X線(両側浸潤影), 心エコー(心原性肺水腫除外), BNP(低値: 非心原性), PCWP(<18mmHg)",probs:"#1 ARDS(Berlin定義: 軽症/中等症/重症, P/F_) #2 原因(肺炎/敗血症/外傷等) #3 多臓器不全リスク",course:"肺保護換気(TV 6mL/kg, Pplat<30cmH2O)→PEEP最適化→腹臥位(P/F<150, 16h/日)→筋弛緩(48h, 重症)→水分管理(保守的)→原因治療→ECMO検討(最重症)",disc:"ARDSのBerlin定義, 肺保護換気戦略(ARDSNet), 腹臥位のエビデンス(PROSEVA trial), ECMO(EOLIA trial)",refs:["Fan E. JAMA 2018;319:698","Guérin C. N Engl J Med 2013;368:2159"]},"喘息重積発作":{prof:"30代女性, 重症喘息, 呼吸困難",cc:"重度の呼吸困難, 会話不能, チアノーゼ",o:"喘息増悪〇日, SABAで改善せず増悪",p:"急速に増悪",q:"SpO2<90%, 会話不能, silent chest(重症徴候)",r:"両肺",s:"起坐呼吸, 冷汗, 意識障害(切迫)",t:"喘息増悪→SABA無効→呼吸困難著明→救急搬送",pe:"重症徴候: silent chest, 呼吸補助筋使用, 会話不能, 意識レベル低下, SpO2<90%, 奇脈(>25mmHg), 頻脈",tests:"SpO2, 血液ガス(PaCO2上昇は重篤な徴候), PEF(測定可能なら), 胸部X線(気胸除外), 血算, 電解質",probs:"#1 喘息重積発作(致死的喘息のリスク) #2 低酸素血症 #3 CO2貯留(呼吸筋疲労)",course:"酸素投与→SABA反復(ネブライザー連続)→イプラトロピウム併用→全身ステロイド(ヒドロコルチゾン or mPSL)→硫酸Mg静注→改善なし: NPPV→気管挿管(最終手段)→ICU管理",disc:"喘息重積発作の重症度評価(PaCO2正常化は危険徴候), 段階的治療, 気管挿管の適応とリスク, near-fatal asthmaの管理",refs:["GINA. Severe Asthma Management 2023","Rodrigo GJ. Chest 2004;125:1081"]},"COPD急性増悪":{prof:"70代男性, 重症COPD, 感染契機の増悪",cc:"呼吸困難増悪, 膿性痰, CO2貯留",o:"感冒〇日後から呼吸困難と膿性痰が増悪",p:"急性に増悪",q:"mMRC 4, SpO2 88%, PaCO2 55mmHg",r:"両肺",s:"膿性痰増加, 喘鳴, 起坐呼吸",t:"呼吸困難増悪→前医でSABA+ステロイド→改善不十分→当院搬送",pe:"呼吸補助筋使用, 口すぼめ呼吸, 喘鳴, 肺過膨張, SpO2低下, 意識レベル(CO2ナルコーシス)",tests:"血液ガス(II型呼吸不全), 胸部X線(肺炎合併/気胸除外), 喀痰培養, CRP, BNP(心不全合併除外), 心電図",probs:"#1 COPD急性増悪(Anthonisen分類: Type_) #2 II型呼吸不全 #3 感染症契機",course:"酸素(低流量: SpO2 88-92%目標)→SABA+SAMA(ネブライザー)→全身ステロイド(5日間)→抗菌薬(Anthonisen Type I)→NPPV(pH<7.35)→改善後: 吸入薬最適化→呼吸リハビリ→禁煙支援",disc:"COPD急性増悪の重症度評価と治療, NPPV導入基準(pH<7.35), 抗菌薬の適応(Anthonisen基準), 退院後の再増悪予防",refs:["GOLD Report 2024","Wedzicha JA. N Engl J Med 2017;377:1254"]},"張力性気胸":{prof:"25歳男性, 外傷後, 急激な呼吸困難",cc:"突然の呼吸困難, 血圧低下",o:"胸部外傷後に急激に呼吸困難と血圧低下",p:"急速に進行(分単位)",q:"SpO2<85%, BP 70/40, 頸静脈怒張, 患側呼吸音消失",r:"患側胸腔",s:"チアノーゼ, ショック",t:"外傷→急激に増悪→救急搬送",pe:"患側: 呼吸音消失, 打診で鼓音, 気管偏位(健側へ), 頸静脈怒張, 皮下気腫, ショック徴候",tests:"臨床診断で治療(検査で遅延させない)→治療後: 胸部X線, 血液ガス",probs:"#1 張力性気胸(患側: 右/左) #2 閉塞性ショック #3 外傷",course:"緊急脱気(太い針: 第2肋間鎖骨中線 or 第4-5肋間前腋窩線)→胸腔ドレーン挿入→エアリークフォロー→持続する場合: 外科コンサルト",disc:"張力性気胸の臨床診断(検査待ちは禁忌), 緊急脱気の手技, 自然気胸との管理の違い",refs:["Roberts DJ. N Engl J Med 2019;380:1679","ATLS Student Manual, 10th ed."]},"大量胸水":{prof:"65歳男性, 肺癌, 進行性呼吸困難",cc:"進行性呼吸困難, 患側呼吸音減弱",o:"〇週間かけて呼吸困難が進行",p:"緩徐に進行",q:"SpO2 90%, 患側呼吸音消失, 打診で濁音",r:"患側胸腔(右/左)",s:"起坐呼吸, 患側胸痛(あれば)",t:"呼吸困難増悪→胸部X線で大量胸水→当院紹介",pe:"患側: 呼吸音減弱〜消失, 打診で濁音, 気管偏位(健側へ), 声音振盪減弱, SpO2低下",tests:"胸部X線(meniscus sign), 胸部エコー(穿刺ガイド), 胸水穿刺(Light基準: 滲出性/漏出性, 細胞診, 培養, pH, LDH, 蛋白, 糖), 胸部CT(原因検索)",probs:"#1 大量胸水(原因: 悪性/感染/心不全/肝硬変) #2 低酸素血症 #3 原因検索",course:"胸腔穿刺(ドレナージ: 1回1.5L以下, 再膨張性肺水腫予防)→原因に応じた治療→悪性: 胸膜癒着術/留置カテーテル→感染性(膿胸): ドレナージ+抗菌薬→漏出性: 原疾患治療",disc:"胸水の鑑別(Light基準), 安全な胸腔穿刺の手技, 再膨張性肺水腫の予防, 悪性胸水の管理戦略",refs:["Feller-Kopman D. N Engl J Med 2018;378:740","Light RW. N Engl J Med 2002;346:1971"]}},"g69":{"急性薬物中毒":{prof:"25歳女性, 大量服薬, 意識障害",cc:"意識障害, 大量服薬(overdose)",o:"〇時間前にOTC薬/処方薬を大量服薬",p:"服薬後に意識レベル低下",q:"GCS 10, 服薬内容・量は不明/判明",r:"全身(中枢神経, 心血管, 代謝)",s:"嘔吐, 痙攣, 不整脈",t:"大量服薬→家族が発見→救急搬送",pe:"意識レベル, バイタル, 瞳孔(縮瞳: オピオイド/散瞳: 抗コリン), 体温, 発汗, 腸蠕動音, toxidrome評価",tests:"血糖, 血液ガス, 電解質, 腎機能, 肝機能(アセトアミノフェン), 血中薬物濃度(アセトアミノフェン, サリチル酸, エタノール), 凝固, 心電図(QT延長, QRS幅), 尿薬物スクリーニング",probs:"#1 急性薬物中毒(被疑薬: _) #2 意識障害 #3 臓器障害(肝/腎/心)",course:"ABC確保→除染(活性炭: 1h以内, 禁忌なし)→特異的解毒薬(アセトアミノフェン: NAC, BZD: フルマゼニル(慎重), オピオイド: ナロキソン)→全身管理→精神科コンサルト→社会的支援",disc:"急性中毒の初期対応(ABC+toxidrome), 活性炭の適応と禁忌, 主要な解毒薬, アセトアミノフェン中毒の時間依存的管理(Rumack-Matthewノモグラム)",refs:["Mégarbane B. N Engl J Med 2023;388:2060","日本中毒学会. 急性中毒標準診療ガイド"]},"重篤な酸塩基平衡障害":{prof:"55歳男性, DKA, 重度代謝性アシドーシス",cc:"呼吸促迫, 意識障害",o:"糖尿病コントロール不良→DKA→pH 7.05",p:"急性発症",q:"pH 7.05, HCO3 5 mEq/L, AG 30, Kussmaul呼吸",r:"全身(代謝)",s:"嘔吐, 脱水, 意識障害",t:"意識障害→救急搬送→血液ガスで重度アシドーシス",pe:"Kussmaul呼吸(深大な呼吸), 脱水所見, 意識レベル, バイタル",tests:"血液ガス(pH, PaCO2, HCO3), 電解質(Na, K, Cl), AG(+補正AG), 血糖, ケトン体, 乳酸, BUN/Cr, 浸透圧ギャップ, 尿ケトン",probs:"#1 重度代謝性アシドーシス(AG開大型: DKA/乳酸アシドーシス/中毒) #2 原因疾患 #3 電解質異常(K)",course:"原因治療(DKA: インスリン+輸液/乳酸アシドーシス: 循環改善/中毒: 解毒)→重炭酸Na投与(pH<6.9のみ, 議論あり)→電解質補正(K)→モニタリング",disc:"酸塩基平衡の系統的解釈(AG, 補正AG, delta gap), AG開大型代謝性アシドーシスの鑑別(MUDPILES/GOLD MARK), 重炭酸Na投与の是非",refs:["Kraut JA. N Engl J Med 2014;371:1434","Seifter JL. N Engl J Med 2014;371:1821"]},"重篤な電解質異常":{prof:"70代女性, 利尿薬使用中, 意識障害",cc:"意識障害, 痙攣(低Na血症)",o:"利尿薬増量〇日後に意識障害",p:"急性(症候性低Na) or 慢性(無症状)",q:"Na 110 mEq/L, 痙攣, 意識障害",r:"全身(中枢神経)",s:"嘔気, 頭痛(軽度低Na時), 痙攣, 昏睡(重度)",t:"意識障害/痙攣→救急搬送→Na低値判明",pe:"意識レベル, 痙攣, 体液量評価(脱水/正常/過剰), バイタル",tests:"血清Na/K/Ca/Mg/P, 血漿浸透圧, 尿Na/浸透圧/Cr, 血糖, 甲状腺機能, コルチゾール, ADH, 血液ガス, 心電図(K異常時)",probs:"#1 重篤な低Na血症(原因: SIADH/利尿薬/副腎不全) #2 症候性(痙攣/意識障害) #3 浸透圧性脱髄症候群のリスク",course:"症候性(痙攣): 3%NaCl 100mL急速投与(20min)→目標: 1-2h以内にNa 4-6mEq/L上昇→24hで10mEq/L以下の補正→原因治療(SIADH: 水制限/トルバプタン, 利尿薬中止)→慢性低Na: 緩徐補正(ODS予防)",disc:"低Na血症の系統的鑑別(体液量+尿Na), 急性 vs 慢性の治療戦略の違い, 浸透圧性脱髄症候群(ODS)の予防, 高K血症の緊急管理",refs:["Spasovski G. Nephrol Dial Transplant 2014;29:i1","Adrogué HJ. N Engl J Med 2000;342:1581"]},"横紋筋融解症":{prof:"30代男性, 激しい運動後",cc:"筋肉痛, 褐色尿, 乏尿",o:"マラソン翌日から著明な筋肉痛と褐色尿(コーラ色)",p:"運動後に急性発症",q:"CK>10000 U/L, ミオグロビン尿(褐色尿), Cr上昇",r:"四肢(運動に関連した筋群)",s:"筋腫脹, 乏尿, 不整脈(高K)",t:"激しい運動→筋肉痛→褐色尿→乏尿→救急搬送",pe:"筋腫脹・圧痛, 褐色尿, 脱水所見, バイタル, コンパートメント症候群の評価",tests:"CK(著明高値), ミオグロビン(血中/尿中), Cr/BUN, K(高K), Ca(低Ca), P(高P), 尿定性(潜血陽性・赤血球陰性), 血液ガス, 心電図",probs:"#1 横紋筋融解症(原因: 運動/外傷/薬物/感染) #2 急性腎障害(ミオグロビン腎症) #3 高カリウム血症",course:"大量輸液(生食: 200-300mL/h→尿量200-300mL/h目標)→高K管理(GI, カルシウム)→重炭酸Na(尿アルカリ化: 議論あり)→腎不全: 透析→コンパートメント症候群: 筋膜切開→原因除去",disc:"横紋筋融解症の原因(運動, 圧挫, 薬物, 感染)と早期大量輸液の重要性, AKI予防, 高K血症の緊急管理",refs:["Bosch X. N Engl J Med 2009;361:62","Chavez LO. Crit Care 2016;20:135"]},"急性副腎不全":{prof:"55歳女性, 長期ステロイド使用中, 急な中断",cc:"ショック, 低血圧, 意識障害",o:"感染症契機にステロイド急な中断〇日後にショック",p:"急性発症",q:"BP 70/40mmHg, Na 125, K 5.8, 血糖 50mg/dL",r:"全身(副腎)",s:"嘔気・嘔吐, 腹痛, 発熱, 低血糖",t:"ステロイド中断→感染→ショック→救急搬送",pe:"ショック徴候(低血圧, 頻脈), 脱水, 色素沈着(一次性), 意識レベル, 体温",tests:"コルチゾール(ストレス下で低値: <18μg/dL), ACTH, 電解質(低Na, 高K), 血糖(低血糖), 血液ガス, ACTH負荷試験(安定後), 副腎CT(両側出血/腫瘍)",probs:"#1 急性副腎不全(副腎クリーゼ) #2 ショック #3 誘因(感染/ステロイド中断/副腎出血)",course:"ヒドロコルチゾン100mg静注(即座)→輸液(生食, 低血糖補正)→電解質補正→誘因治療(感染)→ステロイド減量(安定後: stress dose→維持量)→患者教育(シックデイルール)",disc:"副腎クリーゼの診断と緊急治療(「疑ったら即座にヒドロコルチゾン」), 一次性 vs 二次性副腎不全の鑑別, ステロイドカバーの重要性, シックデイルール",refs:["Bornstein SR. J Clin Endocrinol Metab 2016;101:364","Rushworth RL. Endocr Rev 2019;40:336"]},"甲状腺クリーゼ":{prof:"35歳女性, バセドウ病(未治療), 高熱・頻脈",cc:"高熱, 著明な頻脈, 意識障害",o:"バセドウ病未治療, 感染契機に急性増悪",p:"急速に進行(数時間〜数日)",q:"体温40℃, HR 160(心房細動), 意識障害, 発汗著明",r:"全身(多臓器)",s:"嘔吐, 下痢, 黄疸(肝障害), 心不全",t:"バセドウ病(未治療)→感染→高熱+頻脈+意識障害→救急搬送",pe:"高体温, 著明な頻脈(心房細動), 発汗, 振戦, 甲状腺腫大, 眼球突出, 意識障害, 心不全徴候, 黄疸",tests:"TSH(感度以下), FT3/FT4(著明高値), 肝機能(黄疸), 心電図(AF, 頻脈), BNP, 血液ガス, Burch-Wartofsky Point Scale(BWPS≧45: 甲状腺クリーゼ)",probs:"#1 甲状腺クリーゼ(BWPS_点) #2 バセドウ病 #3 多臓器障害(心不全, 肝障害)",course:"抗甲状腺薬(MMI高用量 or PTU)→無機ヨード(ATD投与1h後)→β遮断薬(プロプラノロール: T4→T3変換阻害も)→ステロイド(ヒドロコルチゾン)→冷却→誘因治療→ICU管理",disc:"甲状腺クリーゼの診断(BWPS/日本甲状腺学会基準)と多面的治療, 治療薬投与の順序の重要性(ATD→ヨード), 誘因の同定",refs:["Satoh T. Thyroid 2016;26:1343","Burch HB. Endocrinol Metab Clin North Am 1993;22:263"]}},"g70":{"多発外傷（内科的管理）":{prof:"30代男性, 交通事故, 多発外傷",cc:"多部位外傷, 意識障害, ショック",o:"交通事故で多部位の外傷, 意識障害あり",p:"急性(受傷後)",q:"GCS 10, BP 85/50, HR 130, 多部位損傷",r:"全身(頭部, 胸部, 腹部, 四肢)",s:"出血, 骨折, 臓器損傷",t:"交通事故→救急搬送→外傷初期診療",pe:"Primary survey(ABCDE), 簡易血糖, FAST, 骨盤動揺, 四肢変形・開放骨折, 外出血",tests:"血液型・交差試験, 血算, 凝固(DIC), 血液ガス(乳酸, BE), FAST, 全身CT(pan-scan), 胸腹部X線, 骨盤X線",probs:"#1 多発外傷(ISS_) #2 出血性ショック #3 外傷性凝固障害",course:"ABCDE→止血(外科/IVR)→MTP(大量輸血: RBC:FFP:PC=1:1:1)→ダメージコントロール(DCR/DCS)→ICU管理→二次survey→根治手術→リハビリ",disc:"外傷初期診療の体系的アプローチ(JATEC), ダメージコントロール蘇生(DCR), 外傷性凝固障害(lethal triad: 低体温・アシドーシス・凝固障害), 内科的管理(DIC, AKI, ARDS等)",refs:["ATLS Student Manual, 10th ed.","日本外傷学会. 外傷初期診療ガイドライン JATEC"]},"熱傷（内科的管理）":{prof:"45歳男性, 火災で広範囲熱傷",cc:"広範囲熱傷, 気道熱傷疑い",o:"火災現場で受傷, 意識は保たれている",p:"受傷後",q:"体表面積30%のII-III度熱傷, 顔面熱傷あり",r:"体幹, 上肢, 顔面",s:"嗄声, 喘鳴(気道熱傷), 煤混じり喀痰",t:"火災→広範囲熱傷→救急搬送",pe:"熱傷面積(9の法則/Lund-Browder), 深度(I/II/III度), 気道評価(口腔内煤・嗄声・喘鳴), 四肢循環(全周性熱傷→区画症候群), CO中毒(SpCO)",tests:"CO-Hb(CO中毒), 血液ガス(代謝性アシドーシス), 電解質, 腎機能, 乳酸, CK, 尿ミオグロビン, 気道評価(喉頭鏡/気管支鏡)",probs:"#1 広範囲熱傷(TBSA_%_, 深度_) #2 気道熱傷/CO中毒 #3 大量輸液管理",course:"気道確保(気道熱傷疑い: 早期挿管)→Parkland公式(4mL/kg/TBSA%, 前半24hの半分を最初8hで)→尿量モニタリング(0.5-1mL/kg/h)→疼痛管理→創部管理→感染予防→栄養管理→リハビリ",disc:"熱傷の初期輸液(Parkland公式)と尿量モニタリング, 気道熱傷の早期認識と挿管の判断, CO中毒の管理, 全周性熱傷の減張切開",refs:["American Burn Association. J Am Coll Surg 2018;226:860","ISBI. Burns 2018;44:1617"]},"溺水":{prof:"5歳男児, プールでの溺水",cc:"溺水後の意識障害, 低酸素血症",o:"プールで溺水, 〇分間水没, 引き上げ後にCPR施行",p:"急性",q:"意識障害(GCS 8), SpO2 80%, 低体温(あれば)",r:"肺(肺損傷), 全身(低酸素脳症)",s:"咳嗽, 泡沫状痰, チアノーゼ, 嘔吐",t:"溺水→救出→バイスタンダーCPR→救急搬送",pe:"意識レベル(GCS), 呼吸状態(SpO2, 呼吸パターン), バイタル(低体温), 肺聴診(crackles/wheezes), 瞳孔, 外傷",tests:"血液ガス(低酸素, アシドーシス), 胸部X線(肺水腫, 誤嚥), 血算, 電解質, 腎機能, 体温(深部), 心電図, 頭部CT(低酸素脳症評価)",probs:"#1 溺水(淡水/海水) #2 低酸素脳症リスク #3 肺損傷(誤嚥性肺炎, 肺水腫)",course:"ABCの確保→酸素投与/人工呼吸管理→低体温是正→ARDS管理→低酸素脳症の評価→ICU管理→経過観察(6-8h以上: 二次的悪化監視)",disc:"溺水の病態生理(肺サーファクタント障害, ARDS), 低体温の管理(低体温は保護的な場合あり: 復温は慎重に), 予後予測因子(水没時間)",refs:["Szpilman D. N Engl J Med 2012;366:2102","Topjian AA. Circulation 2020;142:S366"]},"異物誤嚥":{prof:"80歳女性, 認知症, 食事中の窒息",cc:"食事中の突然の窒息, チアノーゼ",o:"食事中に突然咳き込み, その後発声不能",p:"突然発症",q:"完全気道閉塞(発声不能, チアノーゼ) or 不完全閉塞(咳嗽可能)",r:"気道(喉頭/気管/気管支)",s:"チアノーゼ, 意識消失(完全閉塞時)",t:"食事中→窒息→施設スタッフが救急要請",pe:"発声可否(完全 vs 不完全閉塞), 咳嗽の有無, チアノーゼ, 意識レベル, SpO2, 呼吸音(左右差: 片側気管支異物)",tests:"胸部X線/CT(異物の位置, 無気肺), SpO2, 血液ガス(必要時)",probs:"#1 気道異物(完全閉塞/不完全閉塞) #2 窒息 #3 誤嚥性肺炎リスク",course:"完全閉塞: 背部叩打+腹部突き上げ(Heimlich)→意識消失: CPR→異物除去不能: 喉頭鏡直視下除去/輪状甲状靱帯切開→不完全閉塞: 咳嗽促進→気管支鏡的異物除去→誤嚥性肺炎予防→嚥下評価→食事形態見直し",disc:"気道異物の緊急対応(完全閉塞 vs 不完全閉塞), Heimlich法の手技, 高齢者の誤嚥予防策, 嚥下機能評価の重要性",refs:["American Heart Association. Circulation 2020;142:S366","日本気管食道科学会. 気道異物除去ガイドライン"]},"心肺蘇生（BLS/ACLS）":{prof:"60代男性, 突然の意識消失・心停止",cc:"突然の意識消失, 脈拍触知不能",o:"〇月〇日, 目撃下で突然倒れ, 反応なし",p:"突然発症",q:"心停止(脈拍なし, 呼吸なし), 初期波形: VF/pulseless VT/PEA/Asystole",r:"全身(心停止)",s:"目撃の有無, バイスタンダーCPRの有無, AEDの使用",t:"突然倒れる→目撃者がCPR開始→AED→救急搬送",pe:"反応確認→呼吸確認(正常呼吸なし/死戦期呼吸)→脈拍確認(10秒以内)→CPR開始",tests:"心電図モニター(VF/pVT/PEA/Asystole), 血液ガス(ROSC後), 電解質, 血糖, 血液培養, 12誘導心電図(ROSC後), 心エコー(ROSC後), 冠動脈造影(STEMI疑い), 頭部CT",probs:"#1 心停止(初期波形: VF/pVT/PEA/Asystole) #2 原因検索(5H5T) #3 ROSC後管理",course:"BLS: C-A-B(胸骨圧迫→気道→呼吸)→AED/除細動(VF/pVT)→ACLS: アドレナリン1mg q3-5min→VF/pVT: アミオダロン→ROSC→体温管理療法(TTM: 32-36℃, 24h)→冠動脈造影(適応あれば)→集中治療→神経学的予後評価(72h以降)",disc:"高品質CPRの要素(中断最小化, 十分な深さと速さ), 除細動のタイミング, 5H5Tによる可逆的原因の検索, ROSC後の体温管理療法(TTM)のエビデンス",refs:["Panchal AR. Circulation 2020;142:S366","日本蘇生協議会. JRC蘇生ガイドライン2020"]}},"g71":{"全身性炎症反応症候群":{prof:"60代男性, 肺炎後, 全身状態悪化",cc:"発熱, 頻脈, 頻呼吸",o:"肺炎発症○日後から全身状態が悪化",p:"原疾患治療で改善傾向",q:"体温38.5℃, HR>90, RR>20, WBC>12000",r:"全身",s:"意識変容, 乏尿, 末梢循環不全",t:"感染症→SIRS→臓器障害評価→当科コンサルト",pe:"バイタル(SIRS基準4項目), 意識レベル, 末梢循環, 感染巣検索",tests:"血算, CRP, PCT, 乳酸, 血液ガス, 血液培養, 画像(感染巣検索)",probs:"#1 SIRS(感染性/非感染性) #2 臓器障害評価 #3 敗血症への進展リスク",course:"SIRS基準評価→感染源同定→抗菌薬(感染性)→臓器サポート→qSOFA/SOFAでモニタリング",disc:"SIRS基準とSepsis-3の関係, SIRS概念の変遷(感度は高いが特異度が低い), qSOFA/SOFAの臨床的意義",refs:["Bone RC. Chest 1992;101:1644","Singer M. JAMA 2016;315:801"]},"多臓器不全":{prof:"70代男性, 敗血症後, 多臓器障害",cc:"意識障害, 乏尿, 呼吸不全",o:"敗血症発症○日後から複数臓器の障害が進行",p:"臓器サポートで一部改善",q:"SOFAスコア12点, 腎・肺・肝・凝固の障害",r:"全身(多臓器)",s:"人工呼吸器管理, 持続透析, 昇圧薬使用",t:"敗血症→多臓器障害進行→ICU管理",pe:"意識レベル, バイタル, 尿量, 呼吸器設定, 末梢循環, 黄疸",tests:"SOFAスコア(経時的), 乳酸, 血液ガス, 腎機能, 肝機能, 凝固, BNP",probs:"#1 多臓器不全(MOF/MODS) #2 原疾患(敗血症等) #3 各臓器障害の管理",course:"原疾患治療→臓器別サポート(呼吸: 人工呼吸, 腎: CRRT, 循環: 昇圧薬)→栄養管理→感染管理→リハビリ→予後評価",disc:"MODSの病態(炎症カスケード, 臓器クロストーク), SOFAスコアによる重症度評価, 集中治療の限界とACP",refs:["Vincent JL. Crit Care Med 1996;24:707","Singer M. JAMA 2016;315:801"]},"悪液質":{prof:"65歳男性, 進行膵癌, 体重減少・筋萎縮",cc:"体重減少, 筋力低下, 食欲不振",o:"○カ月で体重が10%以上減少",p:"栄養介入でも進行",q:"BMI低下, 骨格筋量減少, Alb低値, CRP上昇",r:"全身",s:"倦怠感, ADL低下, 免疫機能低下",t:"進行癌→体重減少著明→悪液質評価→栄養サポートチーム介入",pe:"体重・BMI推移, 体組成(上腕周囲長, 下腿周囲長), 筋力(握力), 浮腫, 皮下脂肪",tests:"Alb, プレアルブミン, CRP, 体組成分析(BIA), 血算, 栄養評価(SGA/PG-SGA)",probs:"#1 癌性悪液質(前悪液質/悪液質/不応性悪液質) #2 低栄養 #3 サルコペニア",course:"悪液質ステージ評価→栄養介入(高蛋白・高カロリー)→運動療法(可能な範囲)→薬物療法(コルチコステロイド, プロゲスチン, グレリン様薬)→緩和ケア統合",disc:"癌性悪液質の定義と3段階分類(Fearon 2011), 栄養介入の限界(不応性悪液質), 全身炎症と代謝異常の役割",refs:["Fearon K. Lancet Oncol 2011;12:489","Argilés JM. Nat Rev Cancer 2014;14:754"]},"体重減少":{prof:"55歳男性, 意図しない体重減少",cc:"6カ月で5%以上の体重減少",o:"○カ月前から意図せず体重が減少",p:"食事量低下 and/or 消費亢進",q:"6カ月で8kg減少(体重の10%)",r:"全身",s:"食欲低下, 倦怠感, 発熱, 盗汗",t:"意図しない体重減少→前医で精査開始→当院紹介",pe:"体重・BMI, 栄養状態, リンパ節, 甲状腺, 腹部腫瘤, 精神状態",tests:"血算, CRP, ESR, 肝腎機能, 甲状腺, 血糖/HbA1c, HIV, 胸腹部CT, 上下部内視鏡, 腫瘍マーカー, うつスクリーニング",probs:"#1 意図しない体重減少(原因検索) #2 鑑別: 悪性腫瘍/感染症/内分泌/消化器/精神",course:"系統的原因検索(悪性腫瘍→内分泌→消化器→感染症→精神→その他)→原因に応じた治療→栄養サポート→フォロー",disc:"意図しない体重減少の系統的アプローチ, 原因不明例の予後と経過観察, 高齢者における多因子性",refs:["Wong CJ. Am J Med 2014;127:1054","Gaddey HL. Am Fam Physician 2014;89:718"]},"老年期うつ":{prof:"78歳女性, 配偶者死別後, 意欲低下・食欲不振",cc:"意欲低下, 食欲不振, 不眠",o:"配偶者死別○カ月後から意欲低下と食欲不振",p:"緩徐に進行, 社会的孤立で増悪",q:"GDS 10/15, 食欲低下, 2カ月で3kg体重減少",r:"精神面, 全身(食欲・睡眠)",s:"不眠, 認知機能低下(偽性認知症), 身体愁訴(頭痛, 腰痛), 希死念慮",t:"意欲低下→食欲不振→体重減少→かかりつけ医→うつ病評価目的で当院紹介",pe:"精神状態(表情, 言動, 精神運動抑制), GDS/PHQ-9, 認知機能(MMSE: 偽性認知症除外), 身体診察(器質的疾患除外), 希死念慮の評価",tests:"GDS/PHQ-9, MMSE/MoCA, 血算, 甲状腺機能, VitB12, Ca, 肝腎機能, 頭部MRI(器質的疾患除外)",probs:"#1 老年期うつ病 #2 偽性認知症の鑑別 #3 身体合併症 #4 社会的孤立",course:"抗うつ薬(SSRI: 少量から開始, 高齢者の薬物動態考慮)→精神療法→社会的支援(介護保険, 通所サービス)→希死念慮評価→定期フォロー",disc:"老年期うつ病の特徴(身体症状前景, 偽性認知症), 高齢者への抗うつ薬選択と注意点, 社会的処方の重要性",refs:["Alexopoulos GS. Lancet 2005;365:1961","日本うつ病学会. うつ病治療ガイドライン2016"]},"廃用症候群":{prof:"80歳女性, 肺炎入院後, ADL低下",cc:"筋力低下, 起立困難, ADL低下",o:"肺炎で○週間の安静臥床後に歩行困難",p:"安静期間に比例して進行",q:"Barthel index 100→45, 握力低下, 起立不能",r:"全身(筋骨格系, 循環, 精神)",s:"筋萎縮, 関節拘縮, 起立性低血圧, 深部静脈血栓, 褥瘡, せん妄, 便秘",t:"入院→安静臥床→ADL低下→リハビリ依頼",pe:"ADL評価(Barthel index/FIM), 筋力(MMT), 関節可動域, 起立性低血圧, 褥瘡, 嚥下機能, 認知機能",tests:"血算, Alb, 体組成, 骨密度(長期臥床後), DVT評価(下肢エコー), 嚥下評価",probs:"#1 廃用症候群 #2 サルコペニア(入院関連) #3 ADL低下 #4 褥瘡・DVTリスク",course:"早期離床(最重要)→段階的リハビリ(PT/OT/ST)→栄養介入(蛋白質1.2g/kg)→DVT予防→褥瘡予防→退院支援→回復期リハ転院",disc:"廃用症候群の予防(入院早期からの離床), 入院関連機能低下(HAD)の概念, 多職種連携による包括的リハビリ",refs:["Kortebein P. JAMA 2007;297:1772","Covinsky KE. JAMA 2011;306:1782"]}},"g72":{"薬物有害反応（高齢者）":{prof:"82歳女性, 多剤服用, ふらつき・転倒",cc:"ふらつき, 転倒, 食欲低下",o:"○カ月前から降圧薬追加後にふらつきが出現",p:"薬剤追加・変更後に出現",q:"起立性低血圧, 転倒2回, 食欲低下",r:"全身",s:"眠気, 便秘, 口腔乾燥, 認知機能低下",t:"多剤服用→ふらつき→転倒→薬物有害反応評価目的で当院紹介",pe:"起立性血圧測定, 認知機能, ADL, 転倒リスク評価, 口腔乾燥, 薬剤リスト確認",tests:"処方薬一覧, 血中薬物濃度(該当薬), 腎機能(eGFR: 薬物クリアランス), 肝機能, 電解質, 心電図(QT延長), 血糖",probs:"#1 薬物有害反応(ADR, 被疑薬: _) #2 ポリファーマシー #3 転倒リスク",course:"薬剤リスト作成→被疑薬の同定(時系列)→STOPP/START基準で評価→段階的減薬→モニタリング→処方カスケード(副作用に対する処方)の検出",disc:"高齢者の薬物有害反応の特徴(非典型的症状), 処方カスケードの概念, STOPP/START基準とBeers基準, 腎機能に応じた用量調整",refs:["日本老年医学会. 高齢者の安全な薬物療法GL2015","O'Mahony D. Age Ageing 2015;44:213"]},"薬物相互作用":{prof:"70代男性, 心房細動+結核, 多剤併用",cc:"ワルファリンコントロール不良(RFP併用)",o:"結核治療開始後にPT-INRが著明低下",p:"RFP(CYP3A4誘導)による薬物相互作用",q:"PT-INR 3.0→1.2(RFP開始後)",r:"全身(凝固異常リスク)",s:"血栓リスク上昇, 効果減弱",t:"ワルファリン管理中→RFP追加→INR著明低下→相互作用評価",pe:"出血徴候, 血栓徴候, 服薬状況確認",tests:"処方薬一覧, PT-INR, 薬物血中濃度(該当薬), CYP代謝経路の確認, 腎機能, 肝機能",probs:"#1 薬物相互作用(薬物A×薬物B, 機序: CYP誘導/阻害/排泄競合等) #2 治療効果の変動 #3 有害事象リスク",course:"相互作用データベース確認→機序の同定(薬物動態的/薬力学的)→用量調整 or 代替薬選択→モニタリング強化→患者教育",disc:"主要なCYP450酵素と代表的阻害薬・誘導薬, P-gp/OATP等のトランスポーター相互作用, 高齢者・多剤併用における相互作用リスク管理",refs:["Hansten PD. Drug Interactions Analysis and Management","日本医療薬学会. 薬物相互作用マネジメント"]},"減薬支援":{prof:"85歳女性, 12剤服用, 認知機能低下",cc:"処方薬の整理・減薬の依頼",o:"多疾患併存で各専門科から処方→12剤服用",p:"薬剤追加のたびに副作用リスク上昇",q:"12剤服用中, 重複・不要処方の可能性",r:"全身(多臓器の処方)",s:"服薬アドヒアランス低下, 副作用(ふらつき, 食欲低下), 経済的負担",t:"多剤服用→副作用疑い→かかりつけ医から処方整理依頼",pe:"ADL, 認知機能, 服薬管理能力, 副作用徴候, バイタル",tests:"処方薬一覧(お薬手帳), 腎機能, 肝機能, 電解質, 各薬剤の適応再評価",probs:"#1 ポリファーマシー(12剤) #2 潜在的不適切処方 #3 服薬アドヒアランス低下",course:"全処方リスト作成→各薬剤の適応・エビデンス再評価→STOPP/START基準→deprescribing protocol(1剤ずつ段階的)→減薬後モニタリング→多職種連携(薬剤師)",disc:"Deprescribingの原則と手順, 減薬の優先順位(リスク高/ベネフィット低い薬剤から), 患者・家族への説明と合意形成, 減薬後のモニタリング",refs:["Scott IA. JAMA Intern Med 2015;175:827","Reeve E. Br J Clin Pharmacol 2014;78:738"]},"腹水（非癌性）":{prof:"60代男性, 肝硬変, 腹部膨満",cc:"腹部膨満, 体重増加",o:"肝硬変管理中, ○カ月前から腹水増加",p:"利尿薬で一時改善するが再貯留",q:"大量腹水, 腹囲増大, 体重増加5kg",r:"腹部全体",s:"下肢浮腫, 食欲低下, 呼吸困難(横隔膜挙上)",t:"肝硬変→腹水増悪→利尿薬抵抗性→穿刺排液目的で入院",pe:"腹部膨満, 波動, 移動性濁音, 下肢浮腫, 肝硬変徴候, 体重推移",tests:"腹水穿刺(SAAG, 蛋白, 細胞数, 培養, 細胞診), 腎機能, 電解質(Na), Alb, 肝機能, 腹部エコー",probs:"#1 腹水(肝硬変性, SAAG≥1.1) #2 自然発症性細菌性腹膜炎(SBP)除外 #3 肝腎症候群リスク",course:"減塩(5-6g/日)→利尿薬(スピロノラクトン+フロセミド)→難治性: 大量穿刺排液+アルブミン補充→TIPS検討→肝移植評価→SBP予防(ST合剤/キノロン)",disc:"腹水の鑑別(SAAG), 利尿薬の使い方と難治性腹水の定義, SBPの診断と予防, 肝腎症候群(HRS)の早期認識",refs:["Runyon BA. Hepatology 2013;57:1651","EASL. J Hepatol 2018;69:406"]}},"g73":{"インフォームドコンセント困難例":{prof:"80歳男性, 重度認知症, 大腸癌発見, 手術適応",cc:"認知症のため意思決定能力に懸念",o:"大腸癌スクリーニングで進行癌発見, 手術適応だが本人の意思確認困難",p:"認知症進行に伴い判断能力が低下",q:"MMSE 12/30, 意思決定能力の評価が必要",r:"倫理的側面",s:"家族間の意見の相違, 本人の推定意思が不明確",t:"大腸癌発見→手術適応→認知症で同意能力に懸念→倫理コンサルト",pe:"意思決定能力評価(理解・認識・論理的思考・意思表示の4要素), 認知機能(MMSE/HDS-R), ADL, 事前指示書の有無",tests:"認知機能検査, ADL評価, 頭部MRI(必要時), 精神科コンサルト(意思決定能力評価)",probs:"#1 意思決定能力の評価と判断 #2 代理意思決定者の選定 #3 本人の最善の利益と推定意思",course:"意思決定能力評価(4要素)→能力あり: 本人の意思を尊重→能力なし: 代理意思決定者の確認→事前指示書/ACP記録確認→本人の推定意思+最善の利益→多職種カンファレンス→倫理コンサルテーション(必要時)",disc:"意思決定能力の評価方法(Appelbaum基準), 代理意思決定の原則(代行判断→最善の利益), 倫理コンサルテーションの活用, 成年後見制度",refs:["Appelbaum PS. N Engl J Med 2007;357:1834","厚生労働省. 人生の最終段階における医療の決定プロセスに関するガイドライン2018"]},"終末期・緩和ケア":{prof:"75歳男性, 進行肺癌Stage IV, PS 3",cc:"積極的治療中止の検討, 症状緩和の依頼",o:"進行肺癌4次治療後にPD, PS低下, 積極的治療の限界",p:"腫瘍の進行に伴い全身状態悪化",q:"PS 3, 体重減少, 疼痛・呼吸困難の増悪",r:"全身(身体的・精神的・社会的・スピリチュアル)",s:"疼痛, 呼吸困難, 倦怠感, 不安, 抑うつ, スピリチュアルペイン",t:"積極的治療限界→緩和ケアチーム介入→症状緩和+ACP",pe:"PS評価, 疼痛(NRS), 呼吸困難(mMRC), 栄養状態, 精神状態, 社会的支援, スピリチュアルアセスメント",tests:"必要最小限(予後予測: PPI/PaP score, 症状評価: ESAS/STAS)",probs:"#1 終末期管理(予後○週〜○カ月) #2 症状緩和(疼痛・呼吸困難) #3 ACP #4 家族ケア",course:"全人的苦痛(トータルペイン)の評価→症状緩和(WHO除痛ラダー, 呼吸困難: モルヒネ)→精神的支援→ACP→療養場所の選択(在宅/施設/病院)→看取りの体制→グリーフケア",disc:"緩和ケアの全人的アプローチ(身体・精神・社会・スピリチュアル), 予後予測ツール(PPI, Surprise Question), 早期からの緩和ケア統合のエビデンス(Temel 2010)",refs:["Temel JS. N Engl J Med 2010;363:733","日本緩和医療学会. 緩和ケアガイドライン"]},"意思決定支援":{prof:"70代女性, 進行胃癌, 化学療法継続か緩和ケア移行か",cc:"治療方針についての意思決定支援の依頼",o:"進行胃癌2次治療後PD, 3次治療の選択肢提示, 患者が決められない",p:"治療選択の複雑さと不確実性",q:"複数の治療選択肢(3次治療 vs BSC)に対する迷い",r:"意思決定プロセス",s:"不安, 家族の意見との相違, 情報過多による混乱",t:"治療方針→複数選択肢→患者の迷い→意思決定支援依頼",pe:"患者の理解度, 価値観・希望の確認, 家族関係, 意思決定のスタイル(自律的/委任的/共同的)",tests:"特になし(意思決定プロセスの支援が主)",probs:"#1 意思決定支援(共同意思決定: SDM) #2 患者の価値観と医学的判断の統合 #3 家族を含めた合意形成",course:"情報提供(治療選択肢の利益とリスク)→患者の価値観・希望の引き出し→option talk→decision talk→合意形成→意思の記録→定期的な見直し",disc:"Shared Decision Making(SDM)の3段階(choice talk→option talk→decision talk), 意思決定エイド, ナッジの倫理的側面",refs:["Elwyn G. BMJ 2012;344:e256","厚生労働省. 人生の最終段階における医療の決定プロセスに関するガイドライン2018"]},"代理意思決定":{prof:"60代男性, 重症脳出血, 意識不明, 気管切開の判断",cc:"本人の意思確認不能, 代理意思決定の支援",o:"重症脳出血で意識回復見込み乏しく, 気管切開の適応",p:"急性発症で事前の意思表示なし",q:"GCS 5, 人工呼吸器管理, 予後不良",r:"倫理的・法的側面",s:"家族間の意見不一致, 事前指示書なし, DNARの議論",t:"重症脳出血→意識不明→代理意思決定の必要性→倫理コンサルト",pe:"神経学的予後評価, 家族関係の把握, 事前指示書・ACPの有無確認, 代理意思決定者の確認",tests:"神経学的予後評価(画像・脳波), 全身状態評価",probs:"#1 代理意思決定(本人の意思確認不能) #2 推定意思の探索 #3 家族間の合意形成",course:"代理意思決定者の確認(法的代理人/家族)→本人の推定意思の探索(過去の発言, 価値観, 生き方)→代行判断(推定意思に基づく)→最善の利益の判断→家族カンファレンス→倫理コンサルト→意思決定の記録",disc:"代理意思決定の3つの基準(事前指示→代行判断→最善の利益), 家族カンファレンスの進め方, 意見不一致時の対応, 法的枠組み(成年後見制度)",refs:["Beauchamp TL. Principles of Biomedical Ethics 8th ed.","厚生労働省. 人生の最終段階GL2018"]}},"g74":{"訪問診療":{prof:"85歳男性, 心不全・COPD, 通院困難",cc:"通院困難, 在宅医療への移行",o:"心不全+COPDで入退院を繰り返し, ADL低下で通院困難に",p:"外来通院の負担増大, 在宅管理が適切と判断",q:"PS 3, Barthel index 40, 要介護4",r:"在宅環境全般",s:"呼吸困難(HOT中), 浮腫, 服薬管理困難, 独居 or 老老介護",t:"入退院繰り返し→通院困難→訪問診療導入検討→在宅主治医紹介",pe:"ADL/IADL, 住環境評価, 介護力, 医療機器(HOT等), 服薬管理状況, 栄養状態",tests:"必要最小限(在宅で可能な検査: 血液, 尿, SpO2, 心電図, エコー)",probs:"#1 訪問診療導入(通院困難) #2 在宅での疾病管理(心不全+COPD) #3 多職種連携体制構築",course:"在宅主治医の選定→訪問看護導入→ケアプラン作成(ケアマネ)→医療機器管理→緊急時対応計画→定期訪問(月2回以上)→病状変化時の対応フロー",disc:"訪問診療と往診の違い, 在宅医療で管理可能な疾患の範囲, 多職種連携(訪問看護・薬局・リハ・ケアマネ), 在宅看取りの体制",refs:["日本在宅医学会. 在宅医療テキスト","厚生労働省. 在宅医療推進事業"]},"地域連携パス":{prof:"70代男性, 大腿骨頸部骨折術後, 回復期転院予定",cc:"急性期→回復期リハビリへの連携",o:"大腿骨頸部骨折の手術施行, 回復期リハ病院への転院調整",p:"クリティカルパスに沿った経過",q:"術後○日目, 部分荷重開始, ADL部分介助",r:"医療連携(急性期→回復期→維持期)",s:"骨粗鬆症治療, 転倒予防, 在宅環境整備",t:"骨折手術→回復期転院→地域連携パスの作成→かかりつけ医への引き継ぎ",pe:"ADL評価(FIM), 歩行能力, 認知機能, 社会的背景, 退院先の環境",tests:"血液検査(栄養状態), 骨密度(後日), X線(骨癒合), リハビリ進捗評価",probs:"#1 地域連携パスに基づく医療連携 #2 回復期リハビリ目標設定 #3 退院後の管理計画",course:"急性期治療→地域連携パス作成(目標・スケジュール)→転院先との情報共有(診療情報提供書)→回復期リハビリ→在宅復帰 or 施設→かかりつけ医への引き継ぎ",disc:"地域連携パスの意義と運用(脳卒中・大腿骨頸部骨折等), 急性期-回復期-維持期の連続的ケア, 診療情報の共有方法",refs:["厚生労働省. 地域連携クリティカルパス","日本リハビリテーション医学会ガイドライン"]},"施設入所支援":{prof:"90歳女性, 認知症・要介護5, 在宅限界",cc:"在宅介護の限界, 施設入所の検討",o:"認知症進行+ADL全介助で在宅介護が限界に",p:"介護負担増大, 家族の疲弊",q:"要介護5, MMSE 8/30, ADL全介助, 主介護者の健康問題",r:"社会的・介護的側面",s:"BPSD(徘徊, 暴言), 誤嚥リスク, 褥瘡, 家族の介護うつ",t:"在宅介護限界→ケアマネ相談→施設入所検討→医療情報提供",pe:"ADL/IADL, 認知機能, BPSD, 嚥下機能, 褥瘡リスク, 家族の介護負担",tests:"特になし(医療情報提供書の作成が主)",probs:"#1 施設入所支援(在宅限界) #2 適切な施設の選定 #3 医療ニーズの引き継ぎ",course:"現状評価(ADL・認知機能・医療ニーズ)→施設の種類検討(特養/老健/有料老人ホーム/グループホーム)→医療情報提供書作成→入所判定への情報提供→入所後の医療連携→家族ケア",disc:"介護保険施設の種類と入所基準(特養: 要介護3以上, 老健: リハビリ目的), 医療依存度と施設の選択, 入所後の医療提供体制",refs:["厚生労働省. 介護保険制度","日本老年医学会. 高齢者ケアの意思決定プロセスGL"]},"退院支援":{prof:"75歳女性, 脳梗塞後, 回復期転院予定",cc:"退院に向けた調整",o:"脳梗塞後リハビリ中, 退院先の検討",p:"ADL改善傾向だが自宅復帰に不安",q:"Barthel index 65, 要介護3, 独居",r:"社会的・医療的側面",s:"ADL部分介助, 嚥下機能やや低下, 介護サービス未導入",t:"脳梗塞→急性期→回復期→退院先検討→退院支援カンファレンス",pe:"ADL/IADL, 歩行能力, 嚥下機能, 認知機能, 住環境, 家族の介護力, 社会資源",tests:"退院時サマリー作成, 必要な在宅医療機器の確認",probs:"#1 退院支援(自宅 vs 施設 vs 回復期リハ転院) #2 介護保険サービス導入 #3 在宅医療・訪問看護の調整",course:"退院前カンファレンス(多職種+ケアマネ+家族)→退院先決定→介護保険申請/サービス調整→住宅改修→在宅主治医・訪問看護連携→退院時指導→退院後フォロー",disc:"退院支援のプロセス(入院早期からのスクリーニング), 退院困難患者の要因分析, 多職種連携(MSW, ケアマネ, PT/OT/ST), 退院前訪問指導",refs:["厚生労働省. 退院支援に関する手引き","日本医療社会福祉協会ガイドライン"]}},"g75":{"化学療法の副作用管理":{prof:"55歳女性, 乳癌, EC療法中",cc:"嘔気, 倦怠感, 末梢神経障害",o:"化学療法○コース目, 各種副作用の管理",p:"コースごとに累積毒性",q:"CTCAE Grade別の副作用評価",r:"全身(多臓器の副作用)",s:"骨髄抑制, 嘔気嘔吐, 末梢神経障害, 脱毛, 口腔粘膜炎, 倦怠感",t:"化学療法中→副作用出現→支持療法調整→次コースの可否判断",pe:"バイタル, 口腔内(粘膜炎), 末梢神経(しびれ, 深部腱反射), 皮膚(手足症候群), 浮腫, PS評価",tests:"血算(nadir評価), 腎機能, 肝機能, 電解質, 心機能(アントラサイクリン: 心エコー), 聴力(シスプラチン)",probs:"#1 化学療法副作用管理(CTCAE Grade評価) #2 支持療法の最適化 #3 用量調整・治療継続の判断",course:"レジメン別の予想副作用リスト→制吐療法(CINV: 高度催吐→NK1+5HT3+DEX)→骨髄抑制対策(G-CSF)→末梢神経障害(用量調整)→口腔ケア→栄養サポート→次コースの用量調整",disc:"CTCAE Gradeによる副作用評価, レジメン別制吐療法(ASCO/MASCC/ESMO GL), G-CSF一次予防の適応, dose intensity維持の重要性(RDI>85%)",refs:["Hesketh PJ. N Engl J Med 2008;358:2482","NCCN Antiemesis Guidelines 2024"]},"免疫チェックポイント阻害薬有害事象":{prof:"65歳男性, 肺癌, ニボルマブ投与中",cc:"下痢, 皮疹, 肝機能障害",o:"ICI投与○コース目, 免疫関連有害事象(irAE)出現",p:"ICI投与開始後○週で出現",q:"CTCAE Grade別の評価(下痢Grade2, 皮疹Grade1, ALT上昇Grade2)",r:"多臓器(免疫関連)",s:"大腸炎, 肝炎, 内分泌障害(甲状腺炎, 下垂体炎, 副腎炎), 肺臓炎, 心筋炎, 神経障害, 腎炎",t:"ICI投与中→irAE出現→Grade評価→ICI継続/中断の判断",pe:"皮疹(範囲・性状), 腹部(大腸炎), 呼吸音(肺臓炎), 甲状腺, 神経学的所見, 心雑音",tests:"血算, 肝機能, 甲状腺機能(TSH/FT4), コルチゾール/ACTH, 腎機能, CRP, 便検査(CDI除外), 胸部CT(肺臓炎), 心筋トロポニン/BNP(心筋炎), 心電図",probs:"#1 免疫関連有害事象(irAE, 臓器: _, Grade_) #2 ICI継続/中断の判断 #3 ステロイド治療の適応",course:"Grade評価→Grade1: ICI継続+モニタリング→Grade2: ICI中断+PSL 0.5-1mg/kg→Grade3-4: ICI中止+PSL 1-2mg/kg(mPSLパルス)→ステロイド不応: インフリキシマブ/MMF→ステロイド漸減→ICI再開の判断",disc:"irAEの臓器別特徴とGrade別管理, ステロイド治療の実際, ICI再開の判断基準, 致死的irAE(心筋炎, 肺臓炎)の早期認識",refs:["Brahmer JR. J Clin Oncol 2018;36:1714","Haanen JBAG. Ann Oncol 2017;28:iv119"]},"支持療法":{prof:"60代男性, 進行大腸癌, 化学療法中",cc:"全身倦怠感, 貧血, 食欲不振",o:"化学療法中の全身状態維持と副作用対策",p:"治療コースの蓄積に伴い増悪",q:"Hb 8.5, Alb 2.8, 体重減少, PS 2",r:"全身",s:"貧血, 低栄養, 感染リスク, 血栓リスク, 精神的苦痛",t:"化学療法中→全身状態低下→支持療法の最適化",pe:"PS評価, 栄養状態(体重, BMI, SGA), 口腔内, 皮膚, 精神状態, ADL",tests:"血算, Alb, プレアルブミン, 腎機能, 電解質, 鉄代謝(貧血精査), VitD",probs:"#1 支持療法(栄養・貧血・感染予防・精神的支援) #2 治療継続のための全身状態維持 #3 QOL改善",course:"栄養サポート(NST介入, ONS)→貧血管理(ESA/鉄剤/輸血)→感染予防(ワクチン, 口腔ケア)→VTE予防(リスク評価)→精神的支援(がん相談, 心理士)→リハビリ",disc:"がん支持療法の包括的アプローチ, 栄養介入のエビデンス(ESPEN GL), がん関連貧血の管理, がん関連倦怠感(CRF)への対応",refs:["ESPEN Guidelines on Nutrition in Cancer 2017","NCCN Cancer-Related Fatigue Guidelines 2024"]},"栄養管理":{prof:"70代男性, 脳梗塞後, 嚥下障害, 経管栄養",cc:"経口摂取不良, 栄養管理方針の検討",o:"脳梗塞後の嚥下障害で経口摂取不十分",p:"嚥下リハビリで緩徐に改善傾向",q:"Alb 2.5, BMI 17.5, 経管栄養併用中",r:"消化管・全身(栄養)",s:"低栄養, 筋萎縮, 免疫低下, 褥瘡リスク, 微量元素欠乏",t:"脳梗塞後→嚥下障害→経管栄養導入→NST介入→栄養管理計画",pe:"栄養評価(SGA/MNA), 体重, BMI, 上腕周囲長, 皮下脂肪厚, 嚥下機能, 口腔内, 浮腫",tests:"Alb, プレアルブミン(トランスサイレチン), トランスフェリン, 血算, 電解質, Mg, Zn, VitB1, 血糖, 腎機能, 窒素バランス",probs:"#1 低栄養(SGA C/MNA<17) #2 栄養経路の選択(経口/経管/経静脈) #3 嚥下障害 #4 refeeding症候群リスク",course:"栄養必要量の算定(Harris-Benedict/間接熱量測定)→栄養経路選択(経口>経管>静脈)→段階的栄養増量(refeeding予防)→微量元素補充→嚥下リハビリ→NST定期評価→退院後の栄養管理",disc:"栄養スクリーニングと評価(SGA/MNA), 栄養投与経路の選択基準, refeeding症候群の予防, 微量元素(Zn, Se, VitB1)の重要性",refs:["ESPEN Guidelines 2019","日本臨床栄養代謝学会. 静脈経腸栄養ガイドライン"]}},"g76":{"消化管手術":{prof:"65歳男性, 胃癌cStage IB, 手術予定",cc:"術前内科的評価の依頼",o:"胃癌に対する幽門側胃切除術が予定",p:"現在安定, 合併症の管理中",q:"高血圧(内服中), 2型糖尿病(HbA1c 7.5%), BMI 26",r:"全身(周術期リスク)",s:"労作時息切れ(軽度), 糖尿病合併症",t:"胃癌診断→手術予定→術前内科評価依頼",pe:"心肺機能, 栄養状態, ASA-PS分類, 気道評価, 糖尿病合併症評価",tests:"心電図, 心エコー, 呼吸機能, 血算, 凝固, 腎機能, 肝機能, 血糖/HbA1c, Alb, 胸部X線, 栄養評価",probs:"#1 術前内科的リスク評価(消化管手術) #2 周術期血糖管理 #3 周術期合併症予防",course:"リスク評価(ASA-PS, RCRI)→糖尿病: 周術期血糖管理計画→降圧薬: 継続/休薬判断→VTE予防→術後管理計画(早期離床, 栄養)→退院基準",disc:"消化管手術の術前評価のポイント, 周術期血糖管理(目標140-180mg/dL), ERAS(Enhanced Recovery After Surgery)プロトコル",refs:["Gustafsson UO. World J Surg 2019;43:659","ADA. Diabetes Care 2024;47:S1"]},"心臓外科手術":{prof:"72歳男性, 重症AS, AVR予定",cc:"術前内科的評価・全身管理の依頼",o:"重症大動脈弁狭窄症に対する弁置換術が予定",p:"心不全症状あるが管理中",q:"NYHA III, EF 45%, 高血圧, CKD G3a, COPD",r:"全身(周術期リスク: 高リスク)",s:"呼吸機能低下, 腎機能低下, 頸動脈狭窄",t:"重症AS→AVR予定→多合併症→術前内科評価",pe:"心不全徴候, 頸動脈雑音, 呼吸機能, 腎機能, 栄養状態, フレイル評価",tests:"心エコー(詳細), 冠動脈造影, 呼吸機能, 頸動脈エコー, 腎機能, 凝固, 歯科評価(IE予防), STS score",probs:"#1 術前心機能評価 #2 多臓器合併症の最適化(CKD, COPD) #3 術後合併症予防(AF, AKI, 感染)",course:"STS score/EuroSCOREリスク評価→SAVR vs TAVI検討→合併症最適化(心不全治療, COPD管理)→歯科治療(IE予防)→術後管理計画(AF予防, AKI予防, リハビリ)",disc:"心臓手術の術前リスク評価(STS score, EuroSCORE), SAVR vs TAVIの適応, 多合併症患者の周術期管理",refs:["Nishimura RA. Circulation 2017;135:e1159","日本心臓血管外科学会ガイドライン"]},"血管外科手術":{prof:"70代男性, AAA 55mm, 待機的修復予定",cc:"術前内科的評価の依頼",o:"腹部大動脈瘤55mmに対する待機的修復術(EVAR or 開腹)が予定",p:"現在無症候",q:"AAA 55mm, 冠動脈疾患既往, COPD, CKD G3a",r:"全身(周術期心血管リスク)",s:"冠動脈疾患(PCI後), 呼吸機能低下, 腎機能低下(造影剤リスク)",t:"AAA→手術予定→冠動脈リスク+CKD+COPD→術前内科評価",pe:"血圧, 末梢動脈拍動, ABI, 心肺機能, 腎機能",tests:"心機能評価(心エコー, 負荷検査), 冠動脈評価(必要時CAG), 呼吸機能, 腎機能(造影剤腎症リスク), 頸動脈エコー, 凝固, 抗血小板薬管理",probs:"#1 術前心血管リスク評価(RCRI) #2 造影剤腎症予防(CKD) #3 EVAR vs 開腹の選択に関する内科的意見",course:"RCRI/METs評価→心機能精査(必要時)→CKD: 造影剤腎症予防(輸液)→COPD: 呼吸機能最適化→抗血小板薬の休薬計画→VTE予防→術後管理",disc:"血管外科手術の心血管リスク評価(ACC/AHA GL), EVAR vs 開腹手術の内科的観点, 造影剤腎症の予防",refs:["Fleisher LA. Circulation 2014;130:e278","Chaikof EL. J Vasc Surg 2018;67:2"]},"腫瘍外科手術":{prof:"60代女性, 膵頭部癌, 膵頭十二指腸切除予定",cc:"高侵襲手術の術前内科的評価",o:"膵頭部癌に対する膵頭十二指腸切除術(PD)が予定",p:"術前化学療法後, 全身状態は保たれている",q:"PS 1, DM, 軽度黄疸(ステント留置後), BMI 22",r:"全身(高侵襲手術のリスク)",s:"術前栄養低下, 減黄後の肝機能, 糖尿病, 術後膵液瘻リスク",t:"膵癌→術前化学療法→PD予定→術前内科評価",pe:"栄養状態(体重減少, Alb), 黄疸, 糖尿病評価, 心肺機能, フレイル評価",tests:"心エコー, 呼吸機能, 血算, 肝機能(減黄後), 腎機能, 凝固, HbA1c, Alb, プレアルブミン, 栄養評価",probs:"#1 高侵襲手術の術前評価 #2 栄養最適化(術前プレハビリテーション) #3 周術期糖尿病管理 #4 術後合併症予防",course:"心肺機能評価→栄養最適化(術前免疫栄養: アルギニン+n-3脂肪酸)→プレハビリテーション(運動+栄養)→血糖管理計画→VTE予防→術後早期回復(ERAS)",disc:"高侵襲手術の術前最適化(prehabilitation), 免疫栄養のエビデンス, 膵切除後の代謝管理(膵性糖尿病, 膵外分泌不全)",refs:["Bozzetti F. Clin Nutr 2009;28:340","Lassen K. Ann Surg 2013;258:879"]},"腹腔鏡手術":{prof:"50代女性, 胆石症, 腹腔鏡下胆嚢摘出術予定",cc:"術前内科的評価(腹腔鏡手術)",o:"症候性胆石症に対する腹腔鏡下胆嚢摘出術が予定",p:"胆石発作は鎮痛で管理, 待機的手術",q:"高血圧(内服中), BMI 32, GERD",r:"全身(腹腔鏡特有のリスク)",s:"気腹による心血管負荷, 頭低位による眼圧上昇, 横隔膜挙上による換気障害",t:"胆石症→腹腔鏡手術予定→術前評価",pe:"心肺機能, BMI, 腹部所見, 気道評価(肥満例)",tests:"心電図, 胸部X線, 血算, 肝機能, 腎機能, 凝固, 血糖, SpO2",probs:"#1 腹腔鏡手術の術前評価 #2 気腹に伴う心肺負荷 #3 肥満に伴うリスク(気道管理, 体位)",course:"心肺リスク評価→気腹の影響説明(CO2吸収, 横隔膜挙上)→肥満: 気道管理計画→GERD: 誤嚥予防→VTE予防→術後管理(肩痛: 横隔膜刺激)",disc:"腹腔鏡手術特有の生理学的変化(気腹圧, CO2吸収, 体位), 肥満患者の腹腔鏡手術リスク, 開腹への移行判断",refs:["Neudecker J. Surg Endosc 2002;16:1121","日本内視鏡外科学会ガイドライン"]},"その他外科紹介":{prof:"55歳男性, 鼠径ヘルニア, 内科合併症あり",cc:"外科手術に際しての内科的評価",o:"鼠径ヘルニアに対する手術が予定, 内科合併症の評価依頼",p:"現在安定した状態",q:"高血圧, 2型糖尿病, 抗凝固薬服用中(心房細動)",r:"全身(術前評価)",s:"抗凝固薬の周術期管理, 血糖管理, 術後合併症予防",t:"外科手術予定→内科合併症あり→術前コンサルト",pe:"心肺機能, ASA-PS分類, 出血リスク・血栓リスク評価",tests:"心電図, 胸部X線, 血算, 凝固(PT-INR), 腎機能, HbA1c, BNP(心不全評価)",probs:"#1 術前内科的リスク評価 #2 抗凝固薬の周術期管理 #3 周術期血糖管理",course:"リスク評価(RCRI/METs)→抗凝固薬: 休薬・ヘパリン置換の判断(CHA2DS2-VASc vs 出血リスク)→血糖管理計画→VTE予防→術後管理計画",disc:"術前内科コンサルテーションの要点, 抗凝固薬・抗血小板薬の周術期管理(ACC/AHA GL), 術前心血管リスク評価の標準化",refs:["Fleisher LA. Circulation 2014;130:e278","Douketis JD. Chest 2022;162:e545"]}},"g77":{"死後診断確定症例":{prof:"70代男性, 急死, 病理解剖で診断確定",cc:"臨床経過と病理所見の対比",o:"入院中に急変死亡, 死因精査のため病理解剖を施行",p:"急性経過で死亡",q:"臨床診断と病理診断の対比",r:"全身(病理解剖所見)",s:"生前の診断困難であった所見, 予期せぬ病変",t:"急変死→病理解剖→臨床病理検討会(CPC)",pe:"生前の身体所見の再検討, 画像所見との対比",tests:"病理解剖所見(肉眼・組織), 生前の検査結果との対比, 免疫染色, 培養(必要時)",probs:"#1 死因の確定 #2 臨床診断と病理診断の乖離 #3 診療プロセスの振り返り",course:"病理解剖→肉眼所見→組織学的検索→臨床情報との対比→死因の確定→CPC発表→診療改善への反映",disc:"病理解剖の意義(臨床診断の検証, 医学教育, 疾患理解の深化), CPCの学術的価値, 死因統計への貢献",refs:["Shojania KG. JAMA 2003;289:2849","日本病理学会. 病理解剖指針"]},"臨床診断乖離症例":{prof:"60代女性, 心不全として管理中に死亡, 実は心アミロイドーシス",cc:"臨床診断と病理診断の不一致",o:"HFpEFとして管理中に心不全増悪で死亡, 病理解剖で心アミロイドーシス判明",p:"生前はHFpEFとして管理",q:"臨床診断: HFpEF, 病理診断: 心アミロイドーシス(ATTR)",r:"心臓(主病変)",s:"診断の遅延がもたらした影響の検討",t:"心不全管理→死亡→病理解剖→アミロイドーシス判明→CPC",pe:"生前所見の再検討(心エコーの壁肥厚パターン, granular sparkling, 低電位心電図)",tests:"病理所見(Congo red, 免疫染色), 生前検査の再解釈, 99mTc-PYPシンチ(施行されていたか)",probs:"#1 診断乖離の原因分析 #2 見逃されたred flagsの検討 #3 類似症例の診断改善策",course:"臨床経過の振り返り→病理所見の提示→診断乖離の原因分析→red flagsの同定→学習ポイントの抽出→診療プロセスの改善提案",disc:"臨床診断の正確性と限界(病理解剖研究), 認知バイアス(確証バイアス, アンカリング)の影響, 診断エラーからの学習",refs:["Shojania KG. JAMA 2003;289:2849","Graber ML. BMJ Qual Saf 2013;22:ii21"]},"稀少疾患確定診断症例":{prof:"30代男性, 原因不明の多臓器障害, 診断確定までの過程",cc:"診断困難症例の検討",o:"原因不明の多臓器障害(腎・神経・皮膚)で長期精査",p:"通常の精査では診断に至らず",q:"複数の専門科にまたがる症候, 通常の検査では説明困難",r:"多臓器",s:"診断までの時間(diagnostic odyssey), 患者・家族の不安",t:"原因不明の多臓器障害→長期精査→遺伝子検査/特殊検査→稀少疾患確定",pe:"系統的な身体診察(多臓器の異常所見パターン), 家族歴の詳細聴取",tests:"一般検査→専門検査→遺伝子検査(全エクソーム/全ゲノム), 生検, 特殊検査",probs:"#1 稀少疾患の診断プロセス #2 診断アプローチの系統化 #3 遺伝カウンセリング",course:"症候の系統的整理→鑑別診断の網羅的リスト→段階的精査→専門家コンサルト→遺伝子検査→確定診断→治療(可能なら)→遺伝カウンセリング→患者会紹介",disc:"稀少疾患の診断アプローチ(reverse phenotyping, 全エクソーム解析), 診断の遅延(diagnostic delay)の問題, 指定難病制度と医療費助成",refs:["Boycott KM. Nat Rev Genet 2013;14:681","厚生労働省. 指定難病制度"]},"CPC症例":{prof:"症例検討会の対象患者",cc:"臨床病理検討会(CPC)の症例提示",o:"教育的意義の高い症例について臨床経過と病理所見を検討",p:"臨床経過→病理所見→総合討論の構成",q:"臨床的に重要な学習ポイントを含む症例",r:"症例に依存(全身いずれの臓器も対象)",s:"診断プロセス, 治療選択, 予後判断に関する学習ポイント",t:"臨床経過→死亡 or 手術→病理所見→CPC開催",pe:"臨床所見の時系列的整理, 画像所見の再検討, 病理所見との対比",tests:"生前検査の系統的レビュー, 病理所見(肉眼・組織・免疫染色), 臨床病理相関",probs:"#1 CPC症例の学習ポイント抽出 #2 診断推論プロセスの検討 #3 Evidence-based approachの振り返り",course:"症例提示(臨床経過)→鑑別診断の討論→病理所見の提示→臨床病理相関の考察→学習ポイントのまとめ→take-home message",disc:"CPCの教育的意義(診断推論, 病態理解), 内科専門医資格における症例報告の重要性, CPC報告書の書き方",refs:["Dantzig AH. Am J Med 2005;118:189","日本内科学会. 内科専門医制度"]}}};

// フロントエンド疾患名 → TMPL疾患名のエイリアス（名称ズレ・サブタイプ対応）
const DISEASE_ALIAS = {
  "フレイル": "フレイル・サルコペニア",
  "サルコペニア": "フレイル・サルコペニア",
  "アルツハイマー型認知症": "認知症",
  "レビー小体型認知症": "認知症",
  "血管性認知症": "認知症",
  "前頭側頭型認知症": "認知症",
  "BPSD": "認知症",
  "転倒・骨折リスク": "転倒・大腿骨近位部骨折",
  "NAFLD/NASH": "NAFLD・NASH",
  "胆石症・胆嚢炎": "胆石症・急性胆嚢炎",
  "急性胆管炎": "総胆管結石・急性胆管炎",
  "胆管癌": "胆嚢癌・胆管癌",
  "胆嚢癌": "胆嚢癌・胆管癌",
  "膵嚢胞性疾患": "膵嚢胞性疾患（IPMN）",
  "固形腫瘍（原発不明）": "原発不明癌",
  "がん関連静脈血栓症": "腫瘍関連静脈血栓塞栓症",
  "ACP": "アドバンス・ケア・プランニング",
};

function findTemplate(groupId, diseaseName) {
  // 1) 指定グループで完全一致
  const groupData = TMPL[groupId];
  if (groupData && groupData[diseaseName]) {
    return groupData[diseaseName];
  }
  // 2) 全グループを横断検索（グループIDズレ対応）
  for (const gid of Object.keys(TMPL)) {
    if (gid === groupId) continue;
    if (TMPL[gid][diseaseName]) return TMPL[gid][diseaseName];
  }
  // 3) エイリアス名で再検索
  const alias = DISEASE_ALIAS[diseaseName];
  if (alias) {
    for (const gid of Object.keys(TMPL)) {
      if (TMPL[gid][alias]) return TMPL[gid][alias];
    }
  }
  // 4) 部分一致フォールバック（疾患名が含まれる or 含む）
  for (const gid of Object.keys(TMPL)) {
    for (const tName of Object.keys(TMPL[gid])) {
      if (tName.includes(diseaseName) || diseaseName.includes(tName)) {
        return TMPL[gid][tName];
      }
    }
  }
  return null;
}

function formatTemplate(groupName, diseaseName, data) {
  return {
    groupName,
    diseaseName,
    sections: [
      {title:"典型的な患者像", content: data.prof, icon:"👤"},
      {title:"推奨される主訴（25文字以内）", content: data.cc, icon:"💬"},
      {title:"現病歴の構成（OPQRST）", content:
        "O（Onset）: " + data.o + "\n" +
        "P（Palliative/Provoke）: " + data.p + "\n" +
        "Q（Quality/Quantity）: " + data.q + "\n" +
        "R（Region）: " + data.r + "\n" +
        "S（Symptoms）: " + data.s + "\n" +
        "T（Time course）: " + data.t, icon:"📝"},
      {title:"入院時現症のポイント", content: data.pe, icon:"🩺"},
      {title:"検査所見のポイント", content: data.tests, icon:"🔬"},
      {title:"プロブレムリストの例", content: data.probs, icon:"📋"},
      {title:"入院後経過の構成", content: data.course, icon:"📈"},
      {title:"総合考察の方向性", content: data.disc, icon:"💡"},
      {title:"推奨引用文献", content: Array.isArray(data.refs) ? data.refs.join("\n") : data.refs, icon:"📚"},
    ]
  };
}

function generateGenericTemplate(groupName, diseaseName) {
  return formatTemplate(groupName, diseaseName, {
    prof: "年齢・性別, 基礎疾患を具体的に設定",
    cc: "[この疾患の典型的な主訴を25文字以内で記載]",
    o: "〇日/週/カ月前から[主要症状]が出現",
    p: "[増悪因子/軽減因子を具体的に記載]",
    q: "[症状の性質・程度をNRS等で定量的に記載]",
    r: "[症状の部位・放散を記載]",
    s: "[随伴症状を陽性・陰性の両方で記載]",
    t: "[発症→経過→現在までの時系列を簡潔に]",
    pe: "バイタルサイン, この疾患に特異的な身体所見を系統的に記載",
    tests: "確定診断・重症度評価に必要な検査を優先度順に記載",
    probs: "#1 [確定診断名(重症度/分類)] #2 [合併症] #3 [基礎疾患]",
    course: "診断確定→治療開始→効果判定→維持/退院→フォローアップ",
    disc: "この疾患の診断プロセス, エビデンスに基づく治療選択, 予後と長期管理について論じる",
    refs: ["[著者名. 雑誌名 年;巻:頁] — ガイドラインや高インパクト論文を2-3件引用"]
  });
}

// ═══════════════════════════════════════════════════════════════
//  ログインページ HTML（埋め込み）
// ═══════════════════════════════════════════════════════════════
const LOGIN_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#1B4F3A">
<title>内科専門医 取得ナビ</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
html{-webkit-text-size-adjust:100%}
body{font-family:'Noto Sans JP','Hiragino Sans','Meiryo',sans-serif;-webkit-font-smoothing:antialiased;background:#F5F4F0;color:#1A1917;min-height:100dvh}
button,input{font-family:inherit}button{cursor:pointer;-webkit-tap-highlight-color:transparent}
input{-webkit-appearance:none;appearance:none}
:root{
  --bg:#F5F4F0;--s0:#FEFEFC;--s1:#F0EDE7;--br:#DDD9D2;--br2:#C8C4BC;
  --tx:#1A1917;--m:#6B6760;--ac:#1B4F3A;--acl:#E8F0EC;--ac2:#155230;
  --ok:#166534;--okl:#DCFCE7;--okb:#86EFAC;
  --dn:#991B1B;--dnl:#FEE2E2;--dnb:#FCA5A5;
  --mono:'DM Mono','Courier New',monospace;
  --ease:.18s cubic-bezier(.4,0,.2,1);
  --sab:env(safe-area-inset-bottom,0px);--sal:env(safe-area-inset-left,0px);--sar:env(safe-area-inset-right,0px);
}
.wrap{min-height:100dvh;display:flex;align-items:center;justify-content:center;
  padding:20px 16px;padding-bottom:calc(20px + var(--sab))}
.card{background:var(--s0);border:1px solid var(--br);border-radius:14px;
  box-shadow:0 1px 3px rgba(0,0,0,.05),0 6px 20px rgba(0,0,0,.07);
  width:100%;max-width:440px;padding:clamp(24px,5vw,44px);animation:fadeUp .28s ease both}
@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
.logo{display:flex;align-items:center;gap:10px;margin-bottom:28px}
.logo-mark{width:38px;height:38px;border-radius:9px;background:var(--ac);display:flex;align-items:center;justify-content:center;flex-shrink:0}
.logo-mark svg{width:21px;height:21px}
.logo-name{font-size:12px;font-weight:700;letter-spacing:.07em;color:var(--ac)}
.logo-sub{font-size:10px;color:var(--m);letter-spacing:.04em;margin-top:2px}
.form-title{font-size:clamp(18px,4vw,22px);font-weight:700;margin-bottom:6px;color:var(--tx)}
.form-sub{font-size:13px;color:var(--m);margin-bottom:24px;line-height:1.6}
.field{margin-bottom:16px}
.field label{display:block;font-size:11px;font-weight:600;color:var(--m);letter-spacing:.08em;margin-bottom:7px;text-transform:uppercase}
.field input{width:100%;padding:12px 14px;border:1.5px solid var(--br);border-radius:9px;background:var(--bg);font-size:16px;color:var(--tx);transition:var(--ease);outline:none}
.field input:focus{border-color:var(--ac);background:var(--s0);box-shadow:0 0 0 3px rgba(27,79,58,.10)}
.field input::placeholder{color:var(--br2)}
.field-hint{font-size:12px;color:var(--m);margin-top:5px;line-height:1.5}
.btn-p{width:100%;padding:14px;background:var(--ac);color:#fff;border:none;border-radius:9px;font-size:15px;font-weight:500;transition:var(--ease);min-height:48px}
.btn-p:hover{background:var(--ac2)}.btn-p:active{opacity:.9;transform:scale(.99)}.btn-p:disabled{opacity:.45;cursor:not-allowed}
.alert{padding:11px 14px;border-radius:9px;font-size:13px;margin-bottom:16px;display:flex;align-items:flex-start;gap:9px;line-height:1.5}
.alert svg{flex-shrink:0;margin-top:1px}
.alert-err{background:var(--dnl);color:var(--dn);border:1px solid var(--dnb)}
.alert-ok{background:var(--okl);color:var(--ok);border:1px solid var(--okb)}
.alert-info{background:#EEF4FF;color:#1E40AF;border:1px solid #BFDBFE}
.divider{border:none;border-top:1px solid var(--br);margin:22px 0}
.tlink{color:var(--ac);text-decoration:none;cursor:pointer}.tlink:hover{text-decoration:underline}
.success-icon{width:54px;height:54px;border-radius:50%;background:var(--okl);border:2px solid var(--okb);display:flex;align-items:center;justify-content:center;margin:0 auto 16px;font-size:26px}
.pw-display{background:var(--bg);border:1.5px dashed var(--br);border-radius:9px;padding:14px 20px;margin:14px 0;font-family:var(--mono);font-size:clamp(18px,5vw,24px);font-weight:500;color:var(--ac);letter-spacing:.12em;text-align:center}
.hidden{display:none}
</style>
</head>
<body>
<div class="wrap">
<div class="card">
  <div class="logo">
    <div class="logo-mark"><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="5" rx="1.5" fill="#fff" opacity="0.4"/><rect x="3" y="9.5" width="18" height="5" rx="1.5" fill="#fff" opacity="0.7"/><rect x="3" y="16" width="18" height="5" rx="1.5" fill="#fff"/></svg></div>
    <div><div class="logo-name">NAIKA NAVI</div><div class="logo-sub">内科専門医 取得ナビ</div></div>
  </div>

  <!-- ── LOGIN ── -->
  <div id="v-login">
    <p class="form-title">ログイン</p>
    <p class="form-sub">アカウントにサインインして進捗を確認する</p>
    <div class="alert alert-err hidden" id="login-err">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
      <span id="login-err-msg"></span>
    </div>
    <div class="field"><label>メールアドレス</label><input type="email" id="un" placeholder="例: taro@example.com" autocomplete="email" autocorrect="off" autocapitalize="none" inputmode="email"></div>
    <div class="field"><label>パスワード</label><input type="password" id="pw" placeholder="••••••••" autocomplete="current-password"></div>
    <button class="btn-p" id="login-btn" onclick="doLogin()">サインイン</button>
    <p style="text-align:center;margin-top:12px"><a class="tlink" onclick="show('reset')" style="font-size:13px">パスワードを忘れた方 →</a></p>
    <div class="divider"></div>
    <p style="font-size:13px;color:var(--m);text-align:center;line-height:1.9">BOOTHで購入済みの方は<a class="tlink" onclick="show('register')">アカウント発行 →</a></p>
    <p style="font-size:13px;color:var(--m);text-align:center;margin-top:6px">まだ購入していない方は<a class="tlink" href="https://naikanavi.booth.pm/items/8058590" target="_blank" rel="noopener" style="font-size:13px">BOOTHで購入 →</a></p>
    <p style="font-size:11px;color:#aaa;text-align:center;margin-top:16px;line-height:1.6"><a href="/terms" target="_blank" rel="noopener" style="color:#888;text-decoration:underline">利用規約</a> ・ <a href="/privacy" target="_blank" rel="noopener" style="color:#888;text-decoration:underline">プライバシーポリシー</a></p>
  </div>

  <!-- ── REGISTER ── -->
  <div id="v-register" class="hidden">
    <div id="reg-form">
      <p class="form-title">アカウントを作成</p>
      <p class="form-sub">BOOTHで購入後に届いたメールの注文番号を入力してください</p>
      <div class="alert alert-info"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>注文番号1つにつきアカウント1つが発行されます</div>
      <div class="alert alert-err hidden" id="reg-err">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span id="reg-err-msg"></span>
      </div>
      <div class="hidden" id="reg-notfound" style="background:#FEE2E2;border:1px solid #FCA5A5;border-radius:10px;padding:14px 16px;margin-bottom:14px;text-align:center">
        <div style="font-size:13px;color:#991B1B;font-weight:600;margin-bottom:6px">注文番号が見つかりません</div>
        <div style="font-size:12px;color:#888;line-height:1.6;margin-bottom:8px">番号をお確かめください。BOOTHの購入履歴または確認メールに記載されています。</div>
        <div style="font-size:12px;color:#888;line-height:1.6">購入直後の場合は反映に少しお時間をいただくことがあります。<br><a href="#" onclick="startRetryMode();return false" style="color:#1B4F3A;font-weight:600;text-decoration:underline">たった今購入した方はこちら（自動で再確認します）→</a></div>
      </div>
      <div class="hidden" id="reg-waiting" style="background:#FFF8E1;border:1px solid #FFE082;border-radius:10px;padding:14px 16px;margin-bottom:14px;text-align:center">
        <div style="font-size:14px;font-weight:600;color:#F57F17;margin-bottom:6px">⏳ 注文番号を確認中です…</div>
        <div style="font-size:12px;color:#888;line-height:1.6">購入直後は登録の反映に少しお時間をいただく場合があります。<br>通常30秒〜1分ほどで準備が完了しますので、このままお待ちください。</div>
        <div style="margin-top:10px;font-size:12px;color:#aaa" id="reg-retry-count"></div>
        <button onclick="cancelRegRetry()" style="margin-top:10px;background:none;border:1px solid #ccc;color:#888;padding:6px 18px;border-radius:6px;font-size:12px;cursor:pointer">キャンセル</button>
      </div>
      <div class="field"><label>注文番号</label><input type="text" id="order-no" placeholder="例: 7843210" inputmode="numeric"><div class="field-hint">BOOTHからのメールに記載されています</div></div>
      <div class="field"><label>メールアドレス</label><input type="email" id="reg-un" placeholder="例: taro@example.com" autocorrect="off" autocapitalize="none" inputmode="email"><div class="field-hint">ログインに使用します。BOOTHに登録しているメールアドレスを推奨</div></div>
      <p style="font-size:11px;color:#aaa;text-align:center;margin:8px 0 4px;line-height:1.6">アカウント発行をもって<a href="/terms" target="_blank" rel="noopener" style="color:#888;text-decoration:underline">利用規約</a>および<a href="/privacy" target="_blank" rel="noopener" style="color:#888;text-decoration:underline">プライバシーポリシー</a>に同意したものとみなされます</p>
      <button class="btn-p" id="reg-btn" onclick="doRegister()">アカウントを発行する</button>
      <div class="divider"></div>
      <p style="text-align:center"><a class="tlink" onclick="show('login')" style="font-size:13px">← ログインに戻る</a></p>
      <p style="font-size:13px;color:var(--m);text-align:center;margin-top:6px">まだ購入していない方は<a class="tlink" href="https://naikanavi.booth.pm/items/8058590" target="_blank" rel="noopener" style="font-size:13px">BOOTHで購入 →</a></p>
    </div>
    <div id="reg-done" class="hidden" style="text-align:center">
      <div class="success-icon">✓</div>
      <p class="form-title" style="margin-bottom:6px">発行完了！</p>
      <p style="font-size:13px;color:var(--m);margin-bottom:3px">メールアドレス: <strong id="done-un" style="color:var(--tx);font-family:var(--mono)"></strong></p>
      <p style="font-size:13px;color:var(--m)">発行されたパスワード（一度だけ表示）</p>
      <div class="pw-display" id="done-pw"></div>
      <div class="alert alert-ok" style="text-align:left"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>このパスワードを必ずメモしてください。このページを閉じると二度と表示されません。</div>
      <button class="btn-p" onclick="show('login')" style="margin-top:6px">ログインする →</button>
    </div>
  </div>

  <!-- ── RESET PASSWORD ── -->
  <div id="v-reset" class="hidden">
    <div id="reset-form">
      <p class="form-title">パスワード再発行</p>
      <p class="form-sub">登録時のメールアドレスとBOOTHの注文番号で本人確認を行います</p>
      <div class="alert alert-err hidden" id="reset-err">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <span id="reset-err-msg"></span>
      </div>
      <div class="field"><label>メールアドレス</label><input type="email" id="reset-email" placeholder="登録時のメールアドレス" autocomplete="email" inputmode="email"></div>
      <div class="field"><label>注文番号</label><input type="text" id="reset-order" placeholder="BOOTHの注文番号" inputmode="numeric"></div>
      <button class="btn-p" id="reset-btn" onclick="doReset()">パスワードを再発行する</button>
      <div class="divider"></div>
      <p style="text-align:center"><a class="tlink" onclick="show('login')" style="font-size:13px">← ログインに戻る</a></p>
    </div>
    <div id="reset-done" class="hidden" style="text-align:center">
      <div class="success-icon">✓</div>
      <p class="form-title" style="margin-bottom:6px">再発行完了！</p>
      <p style="font-size:13px;color:var(--m)">新しいパスワード（一度だけ表示）</p>
      <div class="pw-display" id="reset-done-pw"></div>
      <div class="alert alert-ok" style="text-align:left"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><polyline points="20 6 9 17 4 12"/></svg>このパスワードを必ずメモしてください。このページを閉じると二度と表示されません。</div>
      <button class="btn-p" onclick="show('login')" style="margin-top:6px">ログインする →</button>
    </div>
  </div>
</div>
</div>

<script>
'use strict';
function show(v) {
  document.getElementById('v-login').classList.toggle('hidden', v !== 'login');
  document.getElementById('v-register').classList.toggle('hidden', v !== 'register');
  document.getElementById('v-reset').classList.toggle('hidden', v !== 'reset');
  document.querySelectorAll('.alert-err').forEach(e => e.classList.add('hidden'));
  if (typeof stopRegRetry === 'function') stopRegRetry();
  var nf = document.getElementById('reg-notfound'); if(nf) nf.classList.add('hidden');
  if (v === 'register') {
    document.getElementById('reg-form').style.display = '';
    document.getElementById('reg-done').classList.add('hidden');
  }
  if (v === 'reset') {
    document.getElementById('reset-form').style.display = '';
    document.getElementById('reset-done').classList.add('hidden');
  }
}

function showErr(id, msg) {
  const el = document.getElementById(id);
  el.classList.remove('hidden');
  el.querySelector('span').textContent = msg;
}

async function doLogin() {
  const un = document.getElementById('un').value.trim();
  const pw = document.getElementById('pw').value;
  const btn = document.getElementById('login-btn');
  document.getElementById('login-err').classList.add('hidden');
  if (!un || !pw) { showErr('login-err', 'メールアドレスとパスワードを入力してください'); return; }
  btn.textContent = 'サインイン中…'; btn.disabled = true;
  try {
    const res = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: un, password: pw })
    });
    const j = await res.json();
    if (!res.ok) { showErr('login-err', j.error || 'ログインに失敗しました'); return; }
    // Cookie はサーバーが Set-Cookie で設定済み
    // localStorage にもトークンを保存（アプリ内API呼び出し用）
    localStorage.setItem('naika_session', JSON.stringify({ token: j.token, username: j.username }));
    // リロードすると Worker が Cookie を見てアプリ HTML を返す
    location.reload();
  } catch(e) {
    showErr('login-err', '通信エラーが発生しました。再度お試しください。');
  } finally {
    btn.textContent = 'サインイン'; btn.disabled = false;
  }
}

let regRetryTimer = null;
let regRetryCount = 0;
const REG_RETRY_INTERVAL = 10; // 10秒ごと
const REG_RETRY_MAX = 12;      // 最大2分（10秒×12回）

function stopRegRetry() {
  if (regRetryTimer) { clearTimeout(regRetryTimer); regRetryTimer = null; }
  regRetryCount = 0;
  regRetryMode = false;
  document.getElementById('reg-waiting').classList.add('hidden');
}

function cancelRegRetry() {
  stopRegRetry();
  document.getElementById('reg-btn').textContent = 'アカウントを発行する';
  document.getElementById('reg-btn').disabled = false;
  showErr('reg-err', '確認をキャンセルしました。番号をお確かめの上、再度お試しください。');
}

let regRetryMode = false;

async function doRegister() {
  const on = document.getElementById('order-no').value.trim();
  const un = document.getElementById('reg-un').value.trim();
  const btn = document.getElementById('reg-btn');
  document.getElementById('reg-err').classList.add('hidden');
  document.getElementById('reg-notfound').classList.add('hidden');
  stopRegRetry();
  if (!on || !un) { showErr('reg-err', 'すべての項目を入力してください'); return; }
  if (!/^\\d+$/.test(on)) { showErr('reg-err', '注文番号は数字のみで入力してください'); return; }
  if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(un)) { showErr('reg-err', '正しいメールアドレスを入力してください'); return; }

  if (regRetryMode) {
    // リトライモード: 自動再試行を開始
    btn.textContent = '確認中…'; btn.disabled = true;
    await tryRegister(on, un, btn);
  } else {
    // 通常モード: 1回だけ試す
    btn.textContent = '確認中…'; btn.disabled = true;
    try {
      const res = await fetch('/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderNumber: on, username: un })
      });
      const j = await res.json();

      if (res.status === 404) {
        // 見つからない → エラー表示 + 「購入直後の方」リンク
        document.getElementById('reg-notfound').classList.remove('hidden');
        btn.textContent = 'アカウントを発行する'; btn.disabled = false;
        return;
      }
      if (!res.ok) {
        showErr('reg-err', j.error || 'アカウント発行に失敗しました');
        btn.textContent = 'アカウントを発行する'; btn.disabled = false;
        return;
      }
      // 成功
      document.getElementById('reg-form').style.display = 'none';
      document.getElementById('reg-done').classList.remove('hidden');
      document.getElementById('done-un').textContent = j.username;
      document.getElementById('done-pw').textContent = j.password;
      btn.textContent = 'アカウントを発行する'; btn.disabled = false;
    } catch(e) {
      showErr('reg-err', '通信エラーが発生しました。再度お試しください。');
      btn.textContent = 'アカウントを発行する'; btn.disabled = false;
    }
  }
}

function startRetryMode() {
  regRetryMode = true;
  document.getElementById('reg-notfound').classList.add('hidden');
  doRegister();
}

async function tryRegister(on, un, btn) {
  try {
    const res = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ orderNumber: on, username: un })
    });
    const j = await res.json();

    if (res.status === 404 && regRetryCount < REG_RETRY_MAX) {
      // 注文番号がまだ未登録 → 自動リトライ
      regRetryCount++;
      document.getElementById('reg-err').classList.add('hidden');
      document.getElementById('reg-waiting').classList.remove('hidden');
      document.getElementById('reg-retry-count').textContent =
        '確認中… (' + (regRetryCount * REG_RETRY_INTERVAL) + '秒経過)';
      btn.textContent = '確認中…'; btn.disabled = true;
      regRetryTimer = setTimeout(() => tryRegister(on, un, btn), REG_RETRY_INTERVAL * 1000);
      return;
    }

    // リトライ上限を超えた場合
    if (res.status === 404) {
      stopRegRetry();
      showErr('reg-err', '注文番号が見つかりません。番号をお確かめの上、しばらくしてから再度お試しください。');
      btn.textContent = 'アカウントを発行する'; btn.disabled = false;
      return;
    }

    if (!res.ok) {
      stopRegRetry();
      showErr('reg-err', j.error || 'アカウント発行に失敗しました');
      btn.textContent = 'アカウントを発行する'; btn.disabled = false;
      return;
    }

    // 成功！
    stopRegRetry();
    document.getElementById('reg-form').style.display = 'none';
    document.getElementById('reg-done').classList.remove('hidden');
    document.getElementById('done-un').textContent = j.username;
    document.getElementById('done-pw').textContent = j.password;
    btn.textContent = 'アカウントを発行する'; btn.disabled = false;
  } catch(e) {
    stopRegRetry();
    showErr('reg-err', '通信エラーが発生しました。再度お試しください。');
    btn.textContent = 'アカウントを発行する'; btn.disabled = false;
  }
}

async function doReset() {
  const email = document.getElementById('reset-email').value.trim().toLowerCase();
  const order = document.getElementById('reset-order').value.trim();
  const btn = document.getElementById('reset-btn');
  document.getElementById('reset-err').classList.add('hidden');
  if (!email || !order) { showErr('reset-err', 'メールアドレスと注文番号を入力してください'); return; }
  btn.textContent = '確認中…'; btn.disabled = true;
  try {
    const res = await fetch('/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, orderNumber: order })
    });
    const j = await res.json();
    if (!res.ok) { showErr('reset-err', j.error || 'パスワードの再発行に失敗しました'); return; }
    document.getElementById('reset-form').style.display = 'none';
    document.getElementById('reset-done').classList.remove('hidden');
    document.getElementById('reset-done-pw').textContent = j.password;
  } catch(e) {
    showErr('reset-err', '通信エラーが発生しました。再度お試しください。');
  } finally {
    btn.textContent = 'パスワードを再発行する'; btn.disabled = false;
  }
}

// Enter key
document.addEventListener('keydown', e => {
  if (e.key !== 'Enter') return;
  if (!document.getElementById('v-login').classList.contains('hidden')) doLogin();
  else if (!document.getElementById('v-register').classList.contains('hidden')
           && document.getElementById('reg-form').style.display !== 'none') doRegister();
  else if (!document.getElementById('v-reset').classList.contains('hidden')
           && document.getElementById('reset-form').style.display !== 'none') doReset();
});
</script>
</body>
</html>`;

// ═══════════════════════════════════════════════════════════════
//  管理者ダッシュボード HTML
// ═══════════════════════════════════════════════════════════════
const ADMIN_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>NAIKA NAVI — 管理者ダッシュボード</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Noto Sans JP',sans-serif;background:#F8F7F4;color:#1A1917;font-size:14px;-webkit-font-smoothing:antialiased}
.hdr{background:#1B4F3A;color:#fff;padding:16px 24px;display:flex;align-items:center;justify-content:space-between;position:sticky;top:0;z-index:100}
.hdr h1{font-size:15px;font-weight:600;letter-spacing:.05em}
.hdr-actions{display:flex;gap:8px;align-items:center}
.hdr-btn{background:rgba(255,255,255,.15);color:#fff;border:1px solid rgba(255,255,255,.25);padding:7px 14px;border-radius:6px;font-size:12px;cursor:pointer;text-decoration:none;font-family:inherit}
.hdr-btn:hover{background:rgba(255,255,255,.25)}
.stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;padding:20px 24px}
.stat{background:#fff;border:1px solid #E5E2DC;border-radius:10px;padding:18px 20px}
.stat-n{font-size:28px;font-weight:700;color:#1B4F3A;font-family:'DM Mono',monospace}
.stat-l{font-size:11px;color:#6B6760;margin-top:4px;letter-spacing:.06em}
.toolbar{padding:8px 24px 12px;display:flex;gap:10px;flex-wrap:wrap;align-items:center}
.search{flex:1;min-width:200px;padding:10px 14px;border:1.5px solid #DDD9D2;border-radius:8px;font-size:14px;background:#fff;outline:none;font-family:inherit}
.search:focus{border-color:#1B4F3A;box-shadow:0 0 0 3px rgba(27,79,58,.1)}
.filter-sel{padding:10px 12px;border:1.5px solid #DDD9D2;border-radius:8px;font-size:13px;background:#fff;outline:none;font-family:inherit;cursor:pointer;min-width:140px}
.tbl-wrap{padding:0 24px 80px;overflow-x:auto}
table{width:100%;border-collapse:collapse;background:#fff;border-radius:10px;overflow:hidden;border:1px solid #E5E2DC;min-width:900px}
th{background:#F0EDE7;font-size:11px;font-weight:600;color:#6B6760;text-align:left;padding:10px 14px;letter-spacing:.06em;white-space:nowrap;position:sticky;top:0}
td{padding:10px 14px;border-top:1px solid #F0EDE7;font-size:13px;white-space:nowrap}
tr:hover td{background:#FAFAF8}
.mono{font-family:'DM Mono',monospace;font-size:12px}
.badge{display:inline-block;padding:3px 10px;border-radius:12px;font-size:11px;font-weight:600}
.badge-ok{background:#DCFCE7;color:#166534}
.badge-no{background:#FEE2E2;color:#991B1B}
.badge-dept{background:#EEF4FF;color:#1E40AF}
.del-btn{background:transparent;border:1px solid #FCA5A5;color:#991B1B;padding:5px 10px;border-radius:6px;font-size:11px;cursor:pointer}
.del-btn:hover{background:#FEE2E2}
.empty{text-align:center;padding:60px 20px;color:#6B6760}
.loading{text-align:center;padding:60px;color:#6B6760}
</style>
</head>
<body>
<div class="hdr">
  <h1>NAIKA NAVI — 管理者ダッシュボード</h1>
  <div class="hdr-actions">
    <a class="hdr-btn" id="csv-btn" href="#">📊 CSVエクスポート</a>
    <a class="hdr-btn" href="/">← サイトへ</a>
  </div>
</div>
<div id="stats" class="stats"></div>
<div id="chart-wrap" style="padding:0 24px 10px">
  <div style="background:#fff;border:1px solid #E5E2DC;border-radius:10px;padding:14px 20px">
    <div style="font-size:13px;font-weight:600;color:#1A1917;margin-bottom:8px">売上推移（本体＋クレジット・日別）</div>
    <canvas id="chart" height="110" style="width:100%"></canvas>
  </div>
</div>
<div id="credit-wrap" style="padding:0 24px 16px">
  <div style="background:#fff;border:1px solid #E5E2DC;border-radius:10px;overflow:hidden">
    <div style="padding:14px 20px;font-size:13px;font-weight:600;color:#1A1917;border-bottom:1px solid #E5E2DC">クレジットパック 購入履歴</div>
    <div id="credit-empty" style="padding:24px;text-align:center;color:#6B6760;font-size:13px">購入履歴なし</div>
    <table id="credit-tbl" style="display:none;width:100%;border-collapse:collapse;min-width:600px">
      <thead><tr>
        <th style="background:#F0EDE7;font-size:11px;font-weight:600;color:#6B6760;text-align:left;padding:10px 14px">注文番号</th>
        <th style="background:#F0EDE7;font-size:11px;font-weight:600;color:#6B6760;text-align:left;padding:10px 14px">パック</th>
        <th style="background:#F0EDE7;font-size:11px;font-weight:600;color:#6B6760;text-align:left;padding:10px 14px">金額</th>
        <th style="background:#F0EDE7;font-size:11px;font-weight:600;color:#6B6760;text-align:left;padding:10px 14px">チャージ</th>
        <th style="background:#F0EDE7;font-size:11px;font-weight:600;color:#6B6760;text-align:left;padding:10px 14px">ユーザー</th>
        <th style="background:#F0EDE7;font-size:11px;font-weight:600;color:#6B6760;text-align:left;padding:10px 14px">登録日時</th>
      </tr></thead>
      <tbody id="credit-tbody"></tbody>
    </table>
  </div>
</div>
<div class="toolbar">
  <input class="search" id="q" placeholder="メール・氏名・診療科・都道府県で検索…" oninput="filterUsers()">
  <select class="filter-sel" id="f-dept" onchange="filterUsers()"><option value="">診療科：すべて</option></select>
  <select class="filter-sel" id="f-pref" onchange="filterUsers()"><option value="">都道府県：すべて</option></select>
  <select class="filter-sel" id="f-profile" onchange="filterUsers()">
    <option value="">プロフィール：すべて</option>
    <option value="yes">入力済み</option>
    <option value="no">未入力</option>
  </select>
</div>
<div class="tbl-wrap">
  <div class="loading" id="loading">読み込み中…</div>
  <table id="tbl" style="display:none">
    <thead><tr>
      <th>メール</th><th>氏名</th><th>登録日</th><th>注文番号</th>
      <th>免許取得年</th><th>診療科</th><th>勤務先種別</th><th>都道府県</th>
      <th>性別</th><th>生年</th><th>卒業大学</th><th>クレジット</th><th>プロフィール</th><th></th>
    </tr></thead>
    <tbody id="tbody"></tbody>
  </table>
</div>

<script>
'use strict';
const AK = '{{ADMIN_KEY}}';
let allUsers = [];
let allOrders = [];
const PRICE = 9800;
const BOOTH_FEE_RATE = 0.056;
const BOOTH_FEE_FIXED = 45;
const CREDIT_PRICES = {5:980, 20:2980, 50:4980};
function orderPrice(o) {
  if (o.isCreditPack) return CREDIT_PRICES[o.creditAmount] || 980;
  return PRICE;
}
function boothNet(price) { return price - Math.ceil(price * BOOTH_FEE_RATE) - BOOTH_FEE_FIXED; }

async function load() {
  try {
    const [uRes, oRes] = await Promise.all([
      fetch('/admin/users?adminKey=' + encodeURIComponent(AK)),
      fetch('/admin/orders?adminKey=' + encodeURIComponent(AK))
    ]);
    if (!uRes.ok) { document.getElementById('loading').textContent = 'エラー: ' + uRes.status; return; }
    allUsers = await uRes.json();
    allOrders = oRes.ok ? await oRes.json() : [];
    allUsers.sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''));
    allOrders.sort((a,b) => (a.storedAt||'').localeCompare(b.storedAt||''));
    buildFilters();
    renderStats();
    renderChart();
    filterUsers();
    document.getElementById('loading').style.display = 'none';
    document.getElementById('tbl').style.display = '';
  } catch(e) { document.getElementById('loading').textContent = '通信エラー'; }
}

function renderStats() {
  const total = allUsers.length;
  const profiled = allUsers.filter(u => u.profile).length;
  const mainOrders = allOrders.filter(o => !o.isCreditPack);
  const creditOrders = allOrders.filter(o => o.isCreditPack);
  const mainGross = mainOrders.length * PRICE;
  const creditGross = creditOrders.reduce((s,o) => s + orderPrice(o), 0);
  const grossRevenue = mainGross + creditGross;
  const netRevenue = mainOrders.reduce((s) => s + boothNet(PRICE), 0) + creditOrders.reduce((s,o) => s + boothNet(orderPrice(o)), 0);
  const depts = {};
  allUsers.forEach(u => { if(u.profile?.department) depts[u.profile.department] = (depts[u.profile.department]||0)+1; });
  const topDept = Object.entries(depts).sort((a,b)=>b[1]-a[1])[0];
  const fmt = n => n.toLocaleString();
  document.getElementById('stats').innerHTML =
    '<div class="stat"><div class="stat-n">'+mainOrders.length+'</div><div class="stat-l">本体 販売数</div></div>' +
    '<div class="stat"><div class="stat-n">&yen;'+fmt(mainGross)+'</div><div class="stat-l">本体 売上</div></div>' +
    '<div class="stat"><div class="stat-n">'+creditOrders.length+'</div><div class="stat-l">クレジットパック 販売数</div></div>' +
    '<div class="stat"><div class="stat-n">&yen;'+fmt(creditGross)+'</div><div class="stat-l">クレジット 売上</div></div>' +
    '<div class="stat"><div class="stat-n">&yen;'+fmt(grossRevenue)+'</div><div class="stat-l">売上合計（税込）</div></div>' +
    '<div class="stat"><div class="stat-n">&yen;'+fmt(netRevenue)+'</div><div class="stat-l">手取り合計（手数料差引後）</div></div>' +
    '<div class="stat"><div class="stat-n">'+total+'</div><div class="stat-l">登録ユーザー数</div></div>' +
    '<div class="stat"><div class="stat-n">'+(total?Math.round(profiled/total*100):0)+'%</div><div class="stat-l">プロフィール入力率</div></div>' +
    '<div class="stat"><div class="stat-n">'+(topDept?topDept[0]:'\u2014')+'</div><div class="stat-l">最多診療科'+(topDept?' ('+topDept[1]+'人)':'')+'</div></div>';
  renderCreditTable(creditOrders);
}

function renderChart() {
  const canvas = document.getElementById('chart');
  if (!canvas || allOrders.length === 0) {
    canvas.parentElement.querySelector('div').textContent = '売上推移（データなし）';
    return;
  }
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.parentElement.getBoundingClientRect();
  canvas.width = (rect.width - 40) * dpr;
  canvas.height = 110 * dpr;
  canvas.style.width = (rect.width - 40) + 'px';
  canvas.style.height = '110px';
  ctx.scale(dpr, dpr);
  const W = rect.width - 40, H = 110;

  // Aggregate by date (count + revenue)
  const daily = {};
  const dailyRev = {};
  allOrders.forEach(o => {
    const d = (o.storedAt||'').slice(0,10);
    if (d) {
      daily[d] = (daily[d]||0) + 1;
      dailyRev[d] = (dailyRev[d]||0) + orderPrice(o);
    }
  });

  // Fill gaps
  const dates = Object.keys(daily).sort();
  if (dates.length === 0) return;
  const start = new Date(dates[0]);
  const end = new Date(dates[dates.length-1]);
  const allDates = [];
  for (let d = new Date(start); d <= end; d.setDate(d.getDate()+1)) {
    allDates.push(d.toISOString().slice(0,10));
  }
  if (allDates.length === 0) allDates.push(dates[0]);

  const vals = allDates.map(d => daily[d]||0);
  const cumVals = []; let cum = 0;
  vals.forEach(v => { cum += v; cumVals.push(cum); });
  const maxCum = Math.max(...cumVals, 1);
  const maxDaily = Math.max(...vals, 1);

  const padL = 50, padR = 50, padT = 10, padB = 30;
  const cw = W - padL - padR;
  const ch = H - padT - padB;
  const barW = Math.max(4, Math.min(30, cw / allDates.length - 2));

  // Grid lines
  ctx.strokeStyle = '#eee';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 4; i++) {
    const y = padT + ch * (1 - i/4);
    ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(W-padR, y); ctx.stroke();
  }

  // Bars (daily sales)
  vals.forEach((v, i) => {
    const x = padL + (i+0.5) * cw / allDates.length - barW/2;
    const h = (v / maxDaily) * ch * 0.6;
    ctx.fillStyle = 'rgba(27,79,58,0.25)';
    ctx.fillRect(x, padT + ch - h, barW, h);
  });

  // Cumulative line
  ctx.strokeStyle = '#1B4F3A';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  cumVals.forEach((v, i) => {
    const x = padL + (i+0.5) * cw / allDates.length;
    const y = padT + ch * (1 - v / maxCum);
    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
  });
  ctx.stroke();

  // Dots
  cumVals.forEach((v, i) => {
    const x = padL + (i+0.5) * cw / allDates.length;
    const y = padT + ch * (1 - v / maxCum);
    ctx.fillStyle = '#1B4F3A';
    ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI*2); ctx.fill();
  });

  // Y axis labels (cumulative)
  ctx.fillStyle = '#888'; ctx.font = '10px sans-serif'; ctx.textAlign = 'right';
  for (let i = 0; i <= 4; i++) {
    const y = padT + ch * (1 - i/4);
    const label = Math.round(maxCum * i / 4);
    ctx.fillText(label + '件', padL - 6, y + 3);
  }

  // Revenue label on right
  ctx.textAlign = 'left';
  ctx.fillStyle = '#1B4F3A'; ctx.font = 'bold 11px sans-serif';
  const lastY = padT + ch * (1 - cum / maxCum);
  const totalRev = allOrders.reduce((s,o) => s + orderPrice(o), 0);
  ctx.fillText('\u00A5' + totalRev.toLocaleString(), W - padR + 6, lastY + 4);

  // X axis labels
  ctx.fillStyle = '#888'; ctx.font = '10px sans-serif'; ctx.textAlign = 'center';
  const step = Math.max(1, Math.floor(allDates.length / 7));
  allDates.forEach((d, i) => {
    if (i % step === 0 || i === allDates.length - 1) {
      const x = padL + (i+0.5) * cw / allDates.length;
      ctx.fillText(d.slice(5).replace('-','/'), x, H - 6);
    }
  });
}

function renderCreditTable(creditOrders) {
  const tbl = document.getElementById('credit-tbl');
  const empty = document.getElementById('credit-empty');
  const tbody = document.getElementById('credit-tbody');
  if (!creditOrders.length) { tbl.style.display='none'; empty.style.display=''; return; }
  tbl.style.display=''; empty.style.display='none';
  const fmt = n => n.toLocaleString();
  tbody.innerHTML = creditOrders.map(o => {
    const price = orderPrice(o);
    const label = o.creditAmount + 'クレジットパック';
    const status = o.creditRedeemed ? '<span class="badge badge-ok">済</span>' : '<span class="badge badge-no">未</span>';
    const user = o.creditRedeemedBy || '—';
    const date = o.storedAt ? new Date(o.storedAt).toLocaleString('ja-JP') : '—';
    return '<tr>' +
      '<td style="padding:10px 14px;border-top:1px solid #F0EDE7;font-size:12px;font-family:DM Mono,monospace">#'+esc(o.orderNumber)+'</td>' +
      '<td style="padding:10px 14px;border-top:1px solid #F0EDE7;font-size:13px">'+label+'</td>' +
      '<td style="padding:10px 14px;border-top:1px solid #F0EDE7;font-size:13px;font-family:DM Mono,monospace">&yen;'+fmt(price)+'</td>' +
      '<td style="padding:10px 14px;border-top:1px solid #F0EDE7;font-size:13px">'+status+'</td>' +
      '<td style="padding:10px 14px;border-top:1px solid #F0EDE7;font-size:12px;font-family:DM Mono,monospace">'+esc(user)+'</td>' +
      '<td style="padding:10px 14px;border-top:1px solid #F0EDE7;font-size:12px;font-family:DM Mono,monospace">'+date+'</td>' +
    '</tr>';
  }).join('');
}

function buildFilters() {
  const depts = new Set(), prefs = new Set();
  allUsers.forEach(u => { if(u.profile?.department) depts.add(u.profile.department); if(u.profile?.prefecture) prefs.add(u.profile.prefecture); });
  const dSel = document.getElementById('f-dept');
  [...depts].sort().forEach(d => { const o=document.createElement('option'); o.value=d; o.textContent=d; dSel.appendChild(o); });
  const pSel = document.getElementById('f-pref');
  [...prefs].sort().forEach(p => { const o=document.createElement('option'); o.value=p; o.textContent=p; pSel.appendChild(o); });
}

function filterUsers() {
  const q = document.getElementById('q').value.toLowerCase();
  const fd = document.getElementById('f-dept').value;
  const fp = document.getElementById('f-pref').value;
  const fpr = document.getElementById('f-profile').value;
  const filtered = allUsers.filter(u => {
    if (q && !u.username.toLowerCase().includes(q) && !(u.profile?.displayName||'').toLowerCase().includes(q) && !(u.profile?.department||'').includes(q) && !(u.profile?.prefecture||'').includes(q)) return false;
    if (fd && u.profile?.department !== fd) return false;
    if (fp && u.profile?.prefecture !== fp) return false;
    if (fpr === 'yes' && !u.profile) return false;
    if (fpr === 'no' && u.profile) return false;
    return true;
  });
  renderTable(filtered);
}

function renderTable(users) {
  const tbody = document.getElementById('tbody');
  if (!users.length) { tbody.innerHTML = '<tr><td colspan="14" class="empty">該当するユーザーがいません</td></tr>'; return; }
  tbody.innerHTML = users.map(u => {
    const p = u.profile || {};
    const date = u.createdAt ? new Date(u.createdAt).toLocaleDateString('ja-JP') : '—';
    return '<tr>' +
      '<td class="mono" style="font-weight:600;font-size:11px">'+esc(u.username)+'</td>' +
      '<td>'+(p.displayName ? esc(p.displayName) : '—')+'</td>' +
      '<td class="mono">'+date+'</td>' +
      '<td class="mono">'+(u.orderNumber ? '#'+esc(u.orderNumber) : '—')+'</td>' +
      '<td class="mono">'+(p.licenseYear||'—')+'</td>' +
      '<td>'+(p.department ? '<span class="badge badge-dept">'+esc(p.department)+'</span>' : '—')+'</td>' +
      '<td>'+esc(p.workplaceType||'—')+'</td>' +
      '<td>'+esc(p.prefecture||'—')+'</td>' +
      '<td>'+esc(p.gender==='male'?'男性':p.gender==='female'?'女性':(p.gender||'—'))+'</td>' +
      '<td class="mono">'+(p.birthYear||'—')+'</td>' +
      '<td>'+esc(p.medSchool||'—')+'</td>' +
      '<td class="mono" style="text-align:center;font-weight:600;color:'+(u.creditBalance>0?'#1B4F3A':'#999')+'">'+(u.creditBalance||0)+'</td>' +
      '<td>'+(u.profile ? '<span class="badge badge-ok">入力済</span>' : '<span class="badge badge-no">未入力</span>')+'</td>' +
      '<td><button class="del-btn" onclick="delUser(&apos;'+esc(u.username)+'&apos;)">削除</button></td>' +
    '</tr>';
  }).join('');
}

function esc(s) { const d=document.createElement('div'); d.textContent=s; return d.innerHTML; }

async function delUser(un) {
  if (!confirm(un + ' を削除しますか？\\nデータも完全に削除されます。')) return;
  await fetch('/admin/delete-user', { method:'DELETE', headers:{'Content-Type':'application/json'}, body:JSON.stringify({adminKey:AK,username:un}) });
  allUsers = allUsers.filter(u => u.username !== un);
  renderStats(); filterUsers();
}

document.getElementById('csv-btn').href = '/admin/export-csv?adminKey=' + encodeURIComponent(AK);
load();
</script>
</body>
</html>`;

// ═══════════════════════════════════════════════════════════════
//  利用規約 HTML
// ═══════════════════════════════════════════════════════════════
const TERMS_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>利用規約 — 内科専門医 取得ナビ</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Hiragino Sans','Noto Sans JP',sans-serif;background:#F8F7F4;color:#333;line-height:1.85}
.w{max-width:720px;margin:0 auto;padding:40px 24px 80px}.back{display:inline-block;margin-bottom:24px;color:#1B4F3A;text-decoration:none;font-size:14px}
h1{font-size:22px;font-weight:700;margin-bottom:8px;color:#1B4F3A}
.up{font-size:12px;color:#999;margin-bottom:32px}
h2{font-size:16px;font-weight:700;margin:28px 0 10px;color:#1A1917;padding-bottom:6px;border-bottom:1px solid #E5E2DC}
p,li{font-size:14px;color:#444;margin-bottom:8px}
ol,ul{padding-left:24px}ol li{margin-bottom:6px}
</style>
</head>
<body>
<div class="w">
<a class="back" href="/">← トップへ戻る</a>
<h1>利用規約</h1>
<p class="up">最終更新日: 2026年3月6日</p>

<h2>第1条（適用）</h2>
<p>本利用規約（以下「本規約」）は、内科専門医 取得ナビ（以下「本サービス」）の利用条件を定めるものです。ユーザーは本規約に同意の上、本サービスを利用するものとします。</p>

<h2>第2条（サービス内容）</h2>
<p>本サービスは、内科専門医試験の修了要件（症例登録・疾患群・病歴要約）の進捗を管理するためのWebアプリケーションです。本サービスは学習支援ツールであり、試験の合格を保証するものではありません。</p>
<p>本サービスは進捗管理を目的とした個人利用のツールであり、電子カルテ・診療録の代替ではありません。患者の個人情報（氏名・患者ID・生年月日等）を入力・保存する目的で使用することはできません。</p>

<h2>第3条（アカウント）</h2>
<ol>
<li>アカウントはBOOTHでの購入時に発行される注文番号1つにつき1つ発行されます。</li>
<li>ユーザーはアカウント情報を自己の責任において管理するものとします。</li>
<li>アカウントの譲渡・共有は禁止します。</li>
</ol>

<h2>第4条（ユーザー情報の登録）</h2>
<ol>
<li>ユーザーは、本サービスの利用開始時にプロフィール情報（医師免許取得年、診療科、勤務先種別、都道府県等）の登録を求められます。</li>
<li>登録する情報は正確かつ最新のものとし、虚偽の情報を登録してはなりません。</li>
<li>収集した情報の取扱いについては<a href="/privacy">プライバシーポリシー</a>に定めます。</li>
</ol>

<h2>第5条（禁止事項）</h2>
<p>ユーザーは以下の行為を行ってはなりません。</p>
<ol>
<li>本サービスの不正利用、リバースエンジニアリング、スクレイピング</li>
<li>他のユーザーのアカウントへの不正アクセス</li>
<li>本サービスのコンテンツの無断複製・再配布</li>
<li>サーバーに過度の負荷をかける行為</li>
<li>法令に違反する行為、その他運営者が不適切と判断する行為</li>
<li>患者の個人情報（氏名、患者ID、生年月日、住所等、個人を特定しうる情報）を本サービスに入力する行為</li>
</ol>

<h2>第6条（知的財産権）</h2>
<p>本サービスのコンテンツ（デザイン、コード、テキスト）に関する知的財産権は運営者に帰属します。ユーザーが本サービスに入力したデータの所有権はユーザーに帰属します。</p>

<h2>第7条（免責事項）</h2>
<ol>
<li>本サービスは「現状有姿」で提供され、特定の目的への適合性を保証しません。</li>
<li>本サービスの利用により生じた損害について、運営者は一切の責任を負いません。</li>
<li>運営者は事前通知なくサービスの変更・中断・終了を行うことがあります。</li>
<li>本サービスに入力されたデータの保全・バックアップはユーザー自身の責任とします。ユーザーは必要に応じて自身でデータの記録・メモを行ってください。データの消失・破損について運営者は一切の責任を負いません。</li>
<li>万一、患者の個人情報が本サービスに入力された場合、それに起因するいかなる損害（個人情報の漏洩、法的責任等を含む）についても、運営者は一切の責任を負いません。</li>
</ol>

<h2>第8条（返金）</h2>
<p>デジタルコンテンツの性質上、購入後の返金は原則として行いません。ただし、技術的な問題により本サービスが全く利用できない場合は個別に対応します。</p>

<h2>第9条（規約の変更）</h2>
<p>運営者は本規約を変更できるものとします。変更後の規約は本サービス上で公開した時点で効力を生じます。</p>

<h2>第10条（準拠法・管轄）</h2>
<p>本規約は日本法に準拠し、紛争が生じた場合は東京地方裁判所を第一審の専属的合意管轄裁判所とします。</p>

<h2>第11条（お問い合わせ）</h2>
<p>本規約に関するお問い合わせは、下記メールアドレスまでご連絡ください。</p>
<p>メール：<a href="mailto:naikanavi.info@gmail.com">naikanavi.info@gmail.com</a></p>
</div>
</body>
</html>`;

// ═══════════════════════════════════════════════════════════════
//  プライバシーポリシー HTML
// ═══════════════════════════════════════════════════════════════
const PRIVACY_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>プライバシーポリシー — 内科専門医 取得ナビ</title>
<link rel="icon" type="image/svg+xml" href="/favicon.svg">
<style>
*{box-sizing:border-box;margin:0;padding:0}body{font-family:'Hiragino Sans','Noto Sans JP',sans-serif;background:#F8F7F4;color:#333;line-height:1.85}
.w{max-width:720px;margin:0 auto;padding:40px 24px 80px}.back{display:inline-block;margin-bottom:24px;color:#1B4F3A;text-decoration:none;font-size:14px}
h1{font-size:22px;font-weight:700;margin-bottom:8px;color:#1B4F3A}
.up{font-size:12px;color:#999;margin-bottom:32px}
h2{font-size:16px;font-weight:700;margin:28px 0 10px;color:#1A1917;padding-bottom:6px;border-bottom:1px solid #E5E2DC}
h3{font-size:14px;font-weight:600;margin:18px 0 8px;color:#1A1917}
p,li{font-size:14px;color:#444;margin-bottom:8px}
ol,ul{padding-left:24px}li{margin-bottom:6px}
table{width:100%;border-collapse:collapse;margin:12px 0 20px;font-size:13px}
table th,table td{border:1px solid #E5E2DC;padding:10px 14px;text-align:left}
table th{background:#F0EDE7;font-weight:600;color:#555;font-size:12px}
</style>
</head>
<body>
<div class="w">
<a class="back" href="/">← トップへ戻る</a>
<h1>プライバシーポリシー</h1>
<p class="up">最終更新日: 2026年3月6日</p>

<h2>1. はじめに</h2>
<p>本プライバシーポリシーは、内科専門医 取得ナビ（以下「本サービス」）におけるユーザーの個人情報の取扱いについて定めるものです。運営者は個人情報の保護に関する法律（個人情報保護法）を遵守し、適切な管理を行います。</p>

<h2>2. 収集する情報</h2>
<table>
<tr><th>情報の種類</th><th>収集項目</th><th>収集方法</th></tr>
<tr><td>アカウント情報</td><td>メールアドレス、パスワード（ハッシュ化）、注文番号</td><td>アカウント発行時</td></tr>
<tr><td>プロフィール情報</td><td>氏名、医師免許取得年、診療科、勤務先種別、都道府県、性別、生年、卒業大学</td><td>初回利用時の入力</td></tr>
<tr><td>利用データ</td><td>症例登録データ、進捗情報</td><td>サービス利用中</td></tr>
<tr><td>技術情報</td><td>アクセスログ、IPアドレス</td><td>自動取得</td></tr>
</table>

<h2>3. 本サービスで取り扱わない情報</h2>
<p>本サービスは進捗管理ツールであり、以下の情報を収集・保存する目的では設計されていません。ユーザーはこれらの情報を本サービスに入力しないでください。</p>
<ul>
<li>患者の氏名、患者ID、生年月日、住所その他の個人を特定しうる情報</li>
<li>診療録・カルテに該当する情報</li>
<li>その他、第三者の個人情報</li>
</ul>
<p>万一これらの情報が入力された場合でも、運営者はその管理・保護について一切の責任を負いません。ユーザーは自身の責任において、患者の個人情報が含まれないよう管理してください。</p>

<h2>4. 利用目的</h2>
<p>収集した情報は以下の目的で利用します。</p>
<ol>
<li><strong>サービスの提供・改善</strong>：アカウント管理、データ保存、機能改善</li>
<li><strong>統計・分析</strong>：利用状況の分析、ユーザー属性の統計処理（個人を特定しない形式）</li>
<li><strong>広告・マーケティング</strong>：ユーザー属性に基づく医療関連の情報提供、広告の最適化、提携先への統計データの提供</li>
<li><strong>お知らせ</strong>：サービスの更新、新機能、関連サービスのご案内</li>
</ol>

<h2>5. 第三者提供</h2>
<ol>
<li>個人を特定できる情報を、ユーザーの同意なく第三者に提供することはありません。</li>
<li>ただし、以下の場合は除きます：
  <ul>
  <li>法令に基づく場合</li>
  <li>人の生命・身体・財産の保護に必要な場合</li>
  <li>個人を特定できない統計データとして提供する場合</li>
  </ul>
</li>
<li>ユーザー属性の統計情報（診療科別・年次別・地域別のユーザー数等）は、個人を特定できない形で提携先・広告主に提供することがあります。</li>
</ol>

<h2>6. データの保管</h2>
<ol>
<li>データはCloudflareのインフラストラクチャ上に保管されます。</li>
<li>パスワードはハッシュ化して保存し、平文では保持しません。</li>
<li>適切な技術的・組織的措置を講じてデータを保護します。</li>
</ol>

<h2>7. ユーザーの権利</h2>
<p>ユーザーは以下の権利を有します。</p>
<ol>
<li><strong>開示請求</strong>：自己の個人情報の開示を求めることができます。</li>
<li><strong>訂正・削除</strong>：個人情報の訂正・削除を求めることができます。</li>
<li><strong>利用停止</strong>：個人情報の利用停止を求めることができます。</li>
</ol>
<p>上記の請求は、<a href="mailto:naikanavi.info@gmail.com">naikanavi.info@gmail.com</a> までご連絡ください。</p>

<h2>8. Cookieの使用</h2>
<p>本サービスではセッション管理のためにCookieを使用します。Cookieはログイン状態の維持にのみ使用し、トラッキング目的では使用しません。</p>

<h2>9. ポリシーの変更</h2>
<p>本ポリシーは必要に応じて改定します。重要な変更がある場合はサービス上で通知します。</p>

<h2>10. お問い合わせ</h2>
<p>個人情報の取扱いに関するお問い合わせは、下記メールアドレスまでご連絡ください。</p>
<p>メール：<a href="mailto:naikanavi.info@gmail.com">naikanavi.info@gmail.com</a></p>
</div>
</body>
</html>`;

// ═══════════════════════════════════════════════════════════════
//  メイン ハンドラー
// ═══════════════════════════════════════════════════════════════
export default {
  async fetch(request, env) {
    const url  = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS")
      return new Response(null, { headers: getCors(request) });

    // ══════════════════════════════════════════════════
    //  ページ配信: GET / （認証状態でログイン画面 or アプリ）
    // ══════════════════════════════════════════════════
    if ((path === "/" || path === "/app") && request.method === "GET") {
      const token = getCookieToken(request);
      const sess  = await validateSession(token, env);

      if (!sess) {
        // 未認証 → ログインページ（無効 Cookie があれば削除）
        return html(LOGIN_HTML, 200, token ? { "Set-Cookie": clearCookie() } : {});
      }

      // 認証OK → アプリ HTML を KV から取得して配信
      const appHtml = await env.NAIKA_KV.get("app:html");
      if (!appHtml) {
        return html("<h2>アプリがまだデプロイされていません</h2><p>管理者が <code>/admin/upload-html</code> でHTMLをアップロードする必要があります。</p>", 500);
      }
      return html(appHtml);
    }

    // ══════════════════════════════════════════════════
    //  管理者: アプリ HTML をKVにアップロード
    //  POST /admin/upload-html
    //  Header: X-Admin-Key: {ADMIN_KEY}
    //  Body: raw HTML
    // ══════════════════════════════════════════════════
    if (path === "/admin/upload-html" && request.method === "POST") {
      const key = request.headers.get("X-Admin-Key");
      if (key !== env.ADMIN_KEY) return json({ error:"Forbidden" }, 403);
      const body = await request.text();
      if (!body || body.length < 100) return json({ error:"HTML body is empty or too short" }, 400);
      await env.NAIKA_KV.put("app:html", body);
      return json({ ok:true, size: body.length });
    }

    // ══════════════════════════════════════════════════
    //  favicon
    // ══════════════════════════════════════════════════
    if (path === "/favicon.svg") {
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
  <rect width="48" height="48" rx="12" fill="#1B4F3A"/>
  <rect x="12" y="10" width="24" height="8" rx="2" fill="#fff" opacity="0.4"/>
  <rect x="12" y="20" width="24" height="8" rx="2" fill="#fff" opacity="0.7"/>
  <rect x="12" y="30" width="24" height="8" rx="2" fill="#fff"/>
</svg>`;
      return new Response(svg, {
        headers: { "Content-Type":"image/svg+xml", "Cache-Control":"public, max-age=86400" }
      });
    }
    if (path === "/favicon.ico") {
      return new Response(null, { status: 204 });
    }
    if (path === "/apple-touch-icon.png" || path === "/apple-touch-icon-precomposed.png") {
      const b64 = "iVBORw0KGgoAAAANSUhEUgAAALQAAAC0CAYAAAA9zQYyAAACzElEQVR42u3d0W0aYRCF0f1H7iJUElqIFLpwTe4iSG7BVBLqcN55iM2ywM7dcxpAHj6NZx+AMT3Rj98/PyfinI+n8azXHuIlKfIhYpLiHkImKewhZJLCHkImKewSM2uxREslZpKiHkIm6QQpMZO0rUvMJEVdYiYp6hIzSVGXmEmKuoyJJGU7k7SlS8wkRV1iJilqNzTZN7TtTOctbUOTu6FtZ7pvaRuazA1tO5OwpW1ocm9oiAjauUHK2WFD4+QAQYOg4TrDAyE2NAgaBA2CRtAgaBA0CBoEjaBB0CBoEDQIGkFDUy/d/4C/fz5evY3L2h32bza0mGN0nmsZOknzLcMmac4eCokiaAQNggZBg6ARNAgaBA2CBkEjaBA0CBoEDYJG0CBoEPQ8nT+VbM6CFrX5buPkELW5XvLDm7ihQdAgaBA0goYMCV+n++5tXNbusP9lQ4s5Rue5lqGTNN8ybJLm7KGQKIJG0CBoEDQIGkGDoEHQIGgQNIIGQYOgQdAgaAQNggZBz9P5U8nmLGhRm+82Tg5Rm+slX6eLGxoEDYIGQSNoyJDwdbrexYXtDnsbWsw5Os+1DJ2k+ZZhkzRnD4VEETSCBkGDoEHQCBoEDYIGQYOgETQIGgQNggZBI2gQNAh6ns6fSjZnQYvafLdxcojaXC/5Ol3c0CBoEDQIGkGDoEHQIGgQNIIGQYOgQdAgaLYV9Pl4GsZAgvPxNGxonBwgaBA0zAjagyEJD4Q2NE4OaBG0s4Pu54YNTfbJYUvTeTvb0OQ/FNrSdN3ONjT5G9qWput2/u+GFjXdYv7y5BA1nWJ2Q7ONG9qWpuN2/vaGFjUdYr7q5BA1a4/56hta1Kw55lkPhaJmrTFP0zTdFKdf0GItIc/e0LY1a4355qBFzZpivvnkcIKwlpDvErSwefZ/97ueC8Lm0Wfqw+5fcYv4Ea/z1Ac6kYt3af8AzNn9pAwtCJ8AAAAASUVORK5CYII=";
      const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
      return new Response(bin, {
        headers: { "Content-Type":"image/png", "Cache-Control":"public, max-age=86400" }
      });
    }

    // ══════════════════════════════════════════════════
    //  管理者ダッシュボード
    //  GET /admin?key={ADMIN_KEY}
    // ══════════════════════════════════════════════════
    if (path === "/admin" && request.method === "GET") {
      const key = url.searchParams.get("key");
      if (key !== env.ADMIN_KEY) {
        return html(`<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Admin</title>
        <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f5f5f5}
        .c{background:#fff;padding:40px;border-radius:12px;box-shadow:0 2px 12px rgba(0,0,0,.1);text-align:center;max-width:400px;width:90%}
        h2{margin-bottom:16px;color:#333}input{width:100%;padding:12px;border:1.5px solid #ddd;border-radius:8px;font-size:16px;margin-bottom:12px}
        button{width:100%;padding:12px;background:#1B4F3A;color:#fff;border:none;border-radius:8px;font-size:15px;cursor:pointer}button:hover{background:#155230}
        </style></head><body><div class="c"><h2>管理者ログイン</h2>
        <input type="password" id="k" placeholder="Admin Key"><button onclick="location.href='/admin?key='+document.getElementById('k').value">ログイン</button>
        </div></body></html>`, 200);
      }
      return html(ADMIN_HTML.replace('{{ADMIN_KEY}}', key));
    }

    // ══════════════════════════════════════════════════
    //  利用規約
    // ══════════════════════════════════════════════════
    if (path === "/terms" && request.method === "GET") {
      return html(TERMS_HTML);
    }

    // ══════════════════════════════════════════════════
    //  プライバシーポリシー
    // ══════════════════════════════════════════════════
    if (path === "/privacy" && request.method === "GET") {
      return html(PRIVACY_HTML);
    }

    // ══════════════════════════════════════════════════
    //  管理者: CSV エクスポート
    // ══════════════════════════════════════════════════
    if (path === "/admin/export-csv" && request.method === "GET") {
      const adminKey = url.searchParams.get("adminKey");
      if (adminKey !== env.ADMIN_KEY) return json({ error:"Forbidden" }, 403);
      const list  = await env.NAIKA_KV.list({ prefix:"user:" });
      const rows = [["email","displayName","createdAt","orderNumber","licenseYear","department","workplaceType","prefecture","gender","birthYear","medSchool","creditBalance","profileCompletedAt"]];
      for (const k of list.keys) {
        const u = JSON.parse(await env.NAIKA_KV.get(k.name));
        const p = u.profile || {};
        const un = k.name.replace("user:","");
        const cr = await getCredits(env, un);
        rows.push([
          un, p.displayName||"", u.createdAt||"", u.orderNumber||"",
          p.licenseYear||"", p.department||"", p.workplaceType||"", p.prefecture||"",
          p.gender||"", p.birthYear||"", p.medSchool||"", cr.balance||0, p.completedAt||""
        ]);
      }
      const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
      return new Response(csv, {
        headers: { "Content-Type":"text/csv; charset=utf-8", "Content-Disposition":"attachment; filename=naika_users.csv" }
      });
    }

    // ══════════════════════════════════════════════════
    //  n8n用: 注文番号を登録
    //  POST /n8n/store-order
    // ══════════════════════════════════════════════════
    if (path === "/n8n/store-order" && request.method === "POST") {
      const key = request.headers.get("X-Api-Key");
      if (key !== env.N8N_KEY) return json({ error:"Forbidden" }, 403);
      const { orderNumber, productName, buyerEmail } = await request.json();
      if (!orderNumber) return json({ error:"orderNumber required" }, 400);
      const existing = await env.NAIKA_KV.get(`order:${orderNumber}`);
      if (existing) return json({ ok:true, message:"already stored", orderNumber });
      const pack = detectCreditPack(productName);
      await env.NAIKA_KV.put(`order:${orderNumber}`, JSON.stringify({
        orderNumber, productName: productName || "", buyerEmail: buyerEmail || "",
        storedAt: new Date().toISOString(), used: false, username: null,
        isCreditPack: !!pack, creditAmount: pack ? pack.amount : 0,
        creditRedeemed: false,
      }));
      return json({ ok:true, orderNumber, isCreditPack: !!pack });
    }

    // ══════════════════════════════════════════════════
    //  購入者用: アカウント発行
    //  POST /register
    // ══════════════════════════════════════════════════
    if (path === "/register" && request.method === "POST") {
      const body = await request.json();
      const orderNumber = body.orderNumber;
      const username = (body.username || body.email || "").trim().toLowerCase();
      if (!orderNumber || !username)
        return json({ error:"注文番号とメールアドレスを入力してください" }, 400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(username))
        return json({ error:"正しいメールアドレスを入力してください" }, 400);
      const orderRaw = await env.NAIKA_KV.get(`order:${orderNumber}`);
      if (!orderRaw)
        return json({ error:"注文番号が見つかりません。BOOTHから届いたメールの番号を確認してください" }, 404);
      const order = JSON.parse(orderRaw);
      if (order.used)
        return json({ error:`この注文番号は既に使用済みです（登録ユーザー: ${order.username}）` }, 409);
      // クレジットパック注文番号ではアカウント発行不可
      if (order.isCreditPack || detectCreditPack(order.productName))
        return json({ error:"この注文番号はクレジットパック用です。アカウント発行には本体商品の注文番号をお使いください" }, 400);
      const existUser = await env.NAIKA_KV.get(`user:${username}`);
      if (existUser)
        return json({ error:"このメールアドレスは既に登録されています。ログインしてください" }, 409);
      const password = makePass();
      const hash     = await sha256(password + username + "naika_salt");
      await env.NAIKA_KV.put(`user:${username}`, JSON.stringify({
        passwordHash: hash, createdAt: new Date().toISOString(), orderNumber,
        note: `BOOTH注文 #${orderNumber}`,
      }));
      await env.NAIKA_KV.put(`order:${orderNumber}`, JSON.stringify({
        ...order, used:true, username, registeredAt: new Date().toISOString()
      }));
      // 初回1クレジットを付与（お試し用）
      await addCredits(env, username, 1, "welcome-bonus");
      return json({ ok:true, username, password });
    }

    // ══════════════════════════════════════════════════
    //  ログイン（Cookie + トークン発行）
    //  POST /login
    // ══════════════════════════════════════════════════
    if (path === "/login" && request.method === "POST") {
      const body = await request.json();
      const username = (body.username || body.email || "").trim().toLowerCase();
      const password = body.password;
      const raw = await env.NAIKA_KV.get(`user:${username}`);
      if (!raw) return json({ error:"メールアドレスまたはパスワードが違います" }, 401);
      const user = JSON.parse(raw);
      const hash = await sha256(password + username + "naika_salt");
      if (hash !== user.passwordHash)
        return json({ error:"メールアドレスまたはパスワードが違います" }, 401);
      const token   = makeToken();
      const expires = Date.now() + 1000*COOKIE_MAX_AGE;
      await env.NAIKA_KV.put(`sess:${token}`,
        JSON.stringify({ username, expires }),
        { expirationTtl: COOKIE_MAX_AGE }
      );
      // Cookie をセット + JSON レスポンス
      return json({ ok:true, token, username }, 200, {
        "Set-Cookie": sessionCookie(token)
      });
    }

    // ══════════════════════════════════════════════════
    //  パスワード再発行
    //  POST /reset-password
    //  Body: { email, orderNumber }
    // ══════════════════════════════════════════════════
    if (path === "/reset-password" && request.method === "POST") {
      const { email, orderNumber } = await request.json();
      if (!email || !orderNumber)
        return json({ error:"メールアドレスと注文番号を入力してください" }, 400);
      const username = email.trim().toLowerCase();
      // ユーザー存在確認
      const userRaw = await env.NAIKA_KV.get(`user:${username}`);
      if (!userRaw)
        return json({ error:"この組み合わせに一致するアカウントが見つかりません" }, 404);
      const user = JSON.parse(userRaw);
      // 注文番号の照合
      if (user.orderNumber !== orderNumber)
        return json({ error:"この組み合わせに一致するアカウントが見つかりません" }, 404);
      // 新しいパスワードを生成
      const password = makePass();
      const hash = await sha256(password + username + "naika_salt");
      await env.NAIKA_KV.put(`user:${username}`, JSON.stringify({
        ...user,
        passwordHash: hash,
        passwordResetAt: new Date().toISOString(),
      }));
      // 既存セッションを無効化
      const sessions = await env.NAIKA_KV.list({ prefix:"sess:" });
      await Promise.all(sessions.keys.map(async k => {
        const s = JSON.parse(await env.NAIKA_KV.get(k.name) || "{}");
        if (s.username === username) await env.NAIKA_KV.delete(k.name);
      }));
      return json({ ok:true, password });
    }

    // ══════════════════════════════════════════════════
    //  管理者: アカウント発行
    // ══════════════════════════════════════════════════
    if (path === "/admin/create-user" && request.method === "POST") {
      const body = await request.json(); const adminKey = body.adminKey; const username = (body.username || body.email || "").trim().toLowerCase(); const password = body.password; const note = body.note;
      if (adminKey !== env.ADMIN_KEY) return json({ error:"Forbidden" }, 403);
      const existing = await env.NAIKA_KV.get(`user:${username}`);
      if (existing) return json({ error:"既に登録済みのメールアドレスです" }, 409);
      const hash = await sha256(password + username + "naika_salt");
      await env.NAIKA_KV.put(`user:${username}`, JSON.stringify({
        passwordHash:hash, createdAt:new Date().toISOString(), note:note||""
      }));
      // 初回1クレジットを付与（お試し用）
      await addCredits(env, username, 1, "welcome-bonus");
      return json({ ok:true, username });
    }

    // 管理者: ユーザー一覧（プロフィール込み）
    if (path === "/admin/users" && request.method === "GET") {
      const adminKey = url.searchParams.get("adminKey");
      if (adminKey !== env.ADMIN_KEY) return json({ error:"Forbidden" }, 403);
      const list  = await env.NAIKA_KV.list({ prefix:"user:" });
      const users = await Promise.all(list.keys.map(async k => {
        const u = JSON.parse(await env.NAIKA_KV.get(k.name));
        const un = k.name.replace("user:","");
        const cr = await getCredits(env, un);
        return {
          username: un,
          createdAt: u.createdAt,
          note: u.note || "",
          orderNumber: u.orderNumber || "",
          profile: u.profile || null,
          creditBalance: cr.balance || 0,
        };
      }));
      return json(users);
    }

    // 管理者: 注文番号一覧
    if (path === "/admin/orders" && request.method === "GET") {
      const adminKey = url.searchParams.get("adminKey");
      if (adminKey !== env.ADMIN_KEY) return json({ error:"Forbidden" }, 403);
      const list   = await env.NAIKA_KV.list({ prefix:"order:" });
      const orders = await Promise.all(list.keys.map(async k => JSON.parse(await env.NAIKA_KV.get(k.name))));
      return json(orders.sort((a,b)=>b.storedAt.localeCompare(a.storedAt)));
    }

    // 管理者: ユーザー削除
    if (path === "/admin/delete-user" && request.method === "DELETE") {
      const { adminKey, username } = await request.json();
      if (adminKey !== env.ADMIN_KEY) return json({ error:"Forbidden" }, 403);
      await env.NAIKA_KV.delete(`user:${username}`);
      await env.NAIKA_KV.delete(`data:${username}`);
      const sessions = await env.NAIKA_KV.list({ prefix:"sess:" });
      await Promise.all(sessions.keys.map(async k => {
        const s = JSON.parse(await env.NAIKA_KV.get(k.name)||"{}");
        if (s.username===username) await env.NAIKA_KV.delete(k.name);
      }));
      return json({ ok:true });
    }

    //  DELETE /admin/delete-order — 注文を個別削除
    if (path === "/admin/delete-order" && request.method === "DELETE") {
      const { adminKey, orderNumber } = await request.json();
      if (adminKey !== env.ADMIN_KEY) return json({ error:"Forbidden" }, 403);
      await env.NAIKA_KV.delete(`order:${orderNumber}`);
      return json({ ok:true, deleted: orderNumber });
    }

    //  DELETE /admin/delete-all-orders — 全注文を一括削除
    if (path === "/admin/delete-all-orders" && request.method === "DELETE") {
      const { adminKey } = await request.json();
      if (adminKey !== env.ADMIN_KEY) return json({ error:"Forbidden" }, 403);
      const list = await env.NAIKA_KV.list({ prefix:"order:" });
      await Promise.all(list.keys.map(k => env.NAIKA_KV.delete(k.name)));
      return json({ ok:true, deleted: list.keys.length });
    }

    // ══════════════════════════════════════════════════
    //  認証が必要なエンドポイント（Bearer トークン）
    // ══════════════════════════════════════════════════
    const auth    = request.headers.get("Authorization")||"";
    const token   = auth.replace("Bearer ","").trim();
    if (!token) return json({ error:"Unauthorized" }, 401);
    const sessRaw = await env.NAIKA_KV.get(`sess:${token}`);
    if (!sessRaw) return json({ error:"セッション期限切れ。再ログインしてください" }, 401);
    const sess    = JSON.parse(sessRaw);
    if (Date.now()>sess.expires) {
      await env.NAIKA_KV.delete(`sess:${token}`);
      return json({ error:"セッション期限切れ。再ログインしてください" }, 401);
    }
    const { username } = sess;

    // ══════════════════════════════════════════════════
    //  クレジット残高取得
    //  GET /credits
    // ══════════════════════════════════════════════════
    if (path === "/credits" && request.method === "GET") {
      const credits = await getCredits(env, username);
      const tmplFreeUsed = await getTemplateFreeUsed(env, username);
      return json({ ok:true, balance: credits.balance, totalPurchased: credits.totalPurchased, templateFreeRemaining: Math.max(0, TEMPLATE_FREE_LIMIT - tmplFreeUsed) });
    }

    // ══════════════════════════════════════════════════
    //  クレジット追加（BOOTH注文番号でチャージ）
    //  POST /credits/redeem
    //  Body: { orderNumber }
    // ══════════════════════════════════════════════════
    if (path === "/credits/redeem" && request.method === "POST") {
      const { orderNumber } = await request.json();
      if (!orderNumber) return json({ error:"注文番号を入力してください" }, 400);

      // テスト用注文番号（何度でもチャージ可能）
      if (orderNumber === TEST_CREDIT_ORDER) {
        const credits = await addCredits(env, username, TEST_CREDIT_AMOUNT, `test-${Date.now()}`);
        return json({ ok:true, added: TEST_CREDIT_AMOUNT, balance: credits.balance, packLabel: "テスト用10クレジットパック" });
      }

      const orderRaw = await env.NAIKA_KV.get(`order:${orderNumber}`);
      if (!orderRaw)
        return json({ error:"注文番号が見つかりません。BOOTHから届いたメールの番号を確認してください" }, 404);
      const order = JSON.parse(orderRaw);
      // クレジットパックかどうか判定
      const pack = detectCreditPack(order.productName);
      if (!pack)
        return json({ error:"この注文番号はクレジットパック商品ではありません" }, 400);
      // 既にチャージ済みかチェック
      if (order.creditRedeemed)
        return json({ error:`この注文番号は既にチャージ済みです（${order.creditRedeemedBy} が使用）` }, 409);
      // チャージ実行
      const credits = await addCredits(env, username, pack.amount, orderNumber);
      // 注文をチャージ済みに更新
      await env.NAIKA_KV.put(`order:${orderNumber}`, JSON.stringify({
        ...order, creditRedeemed: true, creditRedeemedBy: username,
        creditRedeemedAt: new Date().toISOString(), creditAmount: pack.amount,
      }));
      return json({ ok:true, added: pack.amount, balance: credits.balance, packLabel: pack.label });
    }

    // ══════════════════════════════════════════════════
    //  テンプレート生成（1クレジット消費）
    //  POST /credits/generate-template
    //  Body: { groupId, diseaseName, groupName }
    // ══════════════════════════════════════════════════
    if (path === "/credits/generate-template" && request.method === "POST") {
      const { groupId, diseaseName, groupName } = await request.json();
      if (!groupId || !diseaseName) return json({ error:"疾患群と疾患名を選択してください" }, 400);
      // 無料枠 or クレジット消費
      const result = await useTemplateFreeOrCredit(env, username);
      if (!result.ok) return json({ error:"クレジットが不足しています。BOOTHでクレジットパックを購入してチャージしてください", needCredits: true }, 402);
      // テンプレート生成
      const tmplData = findTemplate(groupId, diseaseName);
      let template;
      if (tmplData) {
        template = formatTemplate(groupName || groupId, diseaseName, tmplData);
      } else {
        template = generateGenericTemplate(groupName || groupId, diseaseName);
        template.isGeneric = true;
      }
      // 履歴に保存
      await saveTemplateHistory(env, username, groupId, groupName || groupId, diseaseName, template);
      return json({ ok:true, template, balance: result.balance, freeRemaining: result.freeRemaining });
    }

    // ══════════════════════════════════════════════════
    //  テンプレート生成履歴
    //  GET /credits/template-history
    // ══════════════════════════════════════════════════
    if (path === "/credits/template-history" && request.method === "GET") {
      const history = await getTemplateHistory(env, username);
      return json({ ok:true, history });
    }

    // ══════════════════════════════════════════════════
    //  問題演習 — 問題生成
    //  POST /credits/quiz/generate
    //  Body: { mode: 'random'|'group'|'weak', groupId?: string, count?: number }
    // ══════════════════════════════════════════════════
    if (path === "/credits/quiz/generate" && request.method === "POST") {
      const body = await request.json();
      const mode = body.mode || 'random';
      const groupId = body.groupId || null;
      const count = Math.min(body.count || QUIZ_PER_CREDIT, 20); // max 20 questions

      if (mode === 'group' && !TMPL[groupId]) {
        return json({ error: "指定された疾患群が見つかりません" }, 400);
      }

      // Determine weak groups from stats
      let weakGroups = null;
      if (mode === 'weak') {
        const stats = await getQuizStats(env, username);
        const entries = Object.entries(stats.byGroup)
          .filter(([_, v]) => v.attempts >= 1)
          .map(([gId, v]) => ({ gId, rate: v.correct / v.attempts }))
          .sort((a, b) => a.rate - b.rate);
        weakGroups = entries.slice(0, 5).map(e => e.gId);
        if (weakGroups.length === 0) weakGroups = null; // fallback to random
      }

      // Check free trial or credit
      const payment = await useQuizFreeOrCredit(env, username, count);
      if (!payment.ok) {
        return json({
          error: "クレジットが不足しています。BOOTHでクレジットパックを購入してチャージしてください。",
          needCredits: true,
          balance: payment.balance,
          freeRemaining: payment.freeRemaining,
          creditsNeeded: payment.needed
        }, 402);
      }

      // Generate questions
      const questions = generateQuizQuestions(mode, groupId, count, weakGroups);

      return json({
        ok: true,
        questions,
        meta: {
          mode,
          groupId,
          count: questions.length,
          source: payment.source,
          freeRemaining: payment.freeRemaining,
          balance: payment.balance
        }
      });
    }

    // ══════════════════════════════════════════════════
    //  問題演習 — 結果記録
    //  POST /credits/quiz/record
    //  Body: { results: [{ groupId, diseaseName, correct: bool }...] }
    // ══════════════════════════════════════════════════
    if (path === "/credits/quiz/record" && request.method === "POST") {
      const { results } = await request.json();
      if (!results || !Array.isArray(results)) {
        return json({ error: "results配列が必要です" }, 400);
      }
      const stats = await saveQuizResults(env, username, results);
      // Compute summary
      const recentCorrect = stats.recent.filter(r => r.c).length;
      const recentTotal = stats.recent.length;
      return json({
        ok: true,
        summary: {
          totalAttempts: stats.totalAttempts,
          totalCorrect: stats.totalCorrect,
          totalRate: stats.totalAttempts > 0 ? Math.round(stats.totalCorrect / stats.totalAttempts * 100) : 0,
          recentRate: recentTotal > 0 ? Math.round(recentCorrect / recentTotal * 100) : 0,
          recentTotal
        }
      });
    }

    // ══════════════════════════════════════════════════
    //  問題演習 — スタッツ取得
    //  GET /credits/quiz/stats
    // ══════════════════════════════════════════════════
    if (path === "/credits/quiz/stats" && request.method === "GET") {
      const stats = await getQuizStats(env, username);
      const credits = await getCredits(env, username);

      // Compute per-group stats with labels
      const groupStats = {};
      for (const [gId, v] of Object.entries(stats.byGroup)) {
        groupStats[gId] = {
          label: GROUP_LABELS[gId] || gId,
          attempts: v.attempts,
          correct: v.correct,
          rate: v.attempts > 0 ? Math.round(v.correct / v.attempts * 100) : 0
        };
      }

      // Weak groups (accuracy < 60%, min 1 attempt)
      const weakGroups = Object.entries(groupStats)
        .filter(([_, v]) => v.attempts >= 1 && v.rate < 60)
        .sort((a, b) => a[1].rate - b[1].rate)
        .map(([gId, v]) => ({ gId, ...v }));

      // Recent 100 accuracy
      const recentCorrect = stats.recent.filter(r => r.c).length;
      const recentTotal = stats.recent.length;

      return json({
        ok: true,
        stats: {
          totalAttempts: stats.totalAttempts,
          totalCorrect: stats.totalCorrect,
          totalRate: stats.totalAttempts > 0 ? Math.round(stats.totalCorrect / stats.totalAttempts * 100) : 0,
          recentRate: recentTotal > 0 ? Math.round(recentCorrect / recentTotal * 100) : 0,
          recentTotal,
          freeUsed: stats.freeUsed,
          freeRemaining: Math.max(0, QUIZ_FREE_LIMIT - stats.freeUsed),
          balance: credits.balance,
          quizCreditsRemaining: Math.floor(credits.balance), // each credit = 5 questions
          groupStats,
          weakGroups,
          groupList: Object.entries(GROUP_LABELS).map(([id, label]) => ({ id, label }))
        }
      });
    }



    // パスワード変更
    if (path === "/change-password" && request.method === "PUT") {
      const { currentPassword, newPassword } = await request.json();
      if (!currentPassword || !newPassword)
        return json({ error: "currentPassword と newPassword を入力してください" }, 400);
      if (newPassword.length < 8)
        return json({ error: "新しいパスワードは8文字以上にしてください" }, 400);
      if (currentPassword === newPassword)
        return json({ error: "新しいパスワードは現在のパスワードと異なるものにしてください" }, 400);
      const userRaw = await env.NAIKA_KV.get(`user:${username}`);
      if (!userRaw) return json({ error: "ユーザーが見つかりません" }, 404);
      const user = JSON.parse(userRaw);
      const currentHash = await sha256(currentPassword + username + "naika_salt");
      if (currentHash !== user.passwordHash)
        return json({ error: "現在のパスワードが正しくありません" }, 401);
      const newHash = await sha256(newPassword + username + "naika_salt");
      await env.NAIKA_KV.put(`user:${username}`, JSON.stringify({
        ...user, passwordHash: newHash, passwordChangedAt: new Date().toISOString(),
      }));
      return json({ ok: true, message: "パスワードを変更しました" });
    }

    // データ取得
    if (path==="/data" && request.method==="GET") {
      const raw = await env.NAIKA_KV.get(`data:${username}`);
      return json({ ok:true, data:raw?JSON.parse(raw):null, username });
    }

    // データ保存
    if (path==="/data" && request.method==="PUT") {
      const { data } = await request.json();
      await env.NAIKA_KV.put(`data:${username}`, JSON.stringify(data));
      return json({ ok:true });
    }

    // ログアウト（Cookie も削除）
    if (path==="/logout" && request.method==="POST") {
      await env.NAIKA_KV.delete(`sess:${token}`);
      return json({ ok:true }, 200, { "Set-Cookie": clearCookie() });
    }

    // プロフィール取得
    if (path === "/profile" && request.method === "GET") {
      const userRaw = await env.NAIKA_KV.get(`user:${username}`);
      if (!userRaw) return json({ error:"User not found" }, 404);
      const user = JSON.parse(userRaw);
      return json({ ok:true, profile: user.profile || null, onboardingState: user.onboardingState || null });
    }

    // プロフィール保存
    if (path === "/profile" && request.method === "PUT") {
      const { profile } = await request.json();
      if (!profile) return json({ error:"profile is required" }, 400);
      const userRaw = await env.NAIKA_KV.get(`user:${username}`);
      if (!userRaw) return json({ error:"User not found" }, 404);
      const user = JSON.parse(userRaw);
      // バリデーション（必須フィールド）
      const required = ["displayName","licenseYear","department","workplaceType","prefecture"];
      for (const f of required) {
        if (!profile[f]) return json({ error:`${f} は必須です` }, 400);
      }
      user.profile = {
        ...profile,
        completedAt: user.profile?.completedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await env.NAIKA_KV.put(`user:${username}`, JSON.stringify(user));
      return json({ ok:true, profile: user.profile });
    }

    // オンボーディング状態更新（スキップカウント・非表示フラグ）
    if (path === "/profile/onboarding-state" && request.method === "PUT") {
      const { action } = await request.json();
      const userRaw = await env.NAIKA_KV.get(`user:${username}`);
      if (!userRaw) return json({ error:"User not found" }, 404);
      const user = JSON.parse(userRaw);
      if (!user.onboardingState) user.onboardingState = { optionalSkipCount:0, optionalDismissed:false };
      if (action === "skip") {
        user.onboardingState.optionalSkipCount = (user.onboardingState.optionalSkipCount || 0) + 1;
      } else if (action === "dismiss") {
        user.onboardingState.optionalDismissed = true;
      }
      await env.NAIKA_KV.put(`user:${username}`, JSON.stringify(user));
      return json({ ok:true, onboardingState: user.onboardingState });
    }

    return json({ error:"Not found" }, 404);
  }
};
