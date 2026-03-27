// ═══════════════════════════════════════════════════════════════
//  iwor PRO — Cloudflare Worker API v2
//
//  KV namespace binding: IWOR_KV
//  Secrets: ADMIN_KEY, GAS_KEY
//
//  エンドポイント:
//    POST /api/store-order      — GASから注文を保存
//    POST /api/register         — 注文番号+メールで会員登録（1回限り）
//    POST /api/login            — メール+パスワードでログイン
//    PUT  /api/profile          — プロフィール更新（sessionToken認証）
//    PUT  /api/dashboard        — ダッシュボードデータ保存
//    GET  /api/dashboard        — ダッシュボードデータ読み込み
//    PUT  /api/matching-profile — マッチングプロフィール保存（sessionToken認証）
//    GET  /api/matching-profile — マッチングプロフィール読み込み（sessionToken認証）
//    PUT  /api/josler           — J-OSLERデータ保存
//    GET  /api/josler           — J-OSLERデータ読み込み
//    POST /api/interview-feedback — AI面接フィードバック（Workers AI）
//    GET  /api/journal            — 論文フィード（PubMedキャッシュ）
//    PUT  /api/epoc             — EPOCデータ保存
//    GET  /api/epoc             — EPOCデータ読み込み
//    PUT  /api/credits          — 専門医単位データ保存
//    GET  /api/credits          — 専門医単位データ読み込み
//    GET  /api/admin/orders     — 管理者: 注文一覧
//    GET  /api/admin/users      — 管理者: ユーザー一覧
//    POST /api/admin/add-order  — 管理者: 手動で注文追加
//    DELETE /api/admin/order    — 管理者: 注文削除
//    GET  /api/competitors/alerts — 競合アラート一覧（管理者認証）
//    POST /api/competitors/dismiss — 競合アラート非表示（管理者認証）
// ═══════════════════════════════════════════════════════════════

// ── ジャーナルDB構築（cronおよび手動トリガーから呼ばれる） ──
async function buildJournalDb(env) {
  const EN_JOURNALS = [
    { id:"lancet", shortName:"Lancet", issn:"0140-6736", impactFactor:98.4 },
    { id:"nejm", shortName:"NEJM", issn:"0028-4793", impactFactor:78.5 },
    { id:"jama", shortName:"JAMA", issn:"0098-7484", impactFactor:55.0 },
    { id:"bmj", shortName:"BMJ", issn:"0959-8138", impactFactor:42.7 },
    { id:"nat-med", shortName:"Nat Med", issn:"1078-8956", impactFactor:82.9 },
    { id:"ann-intern", shortName:"Ann Intern Med", issn:"0003-4819", impactFactor:39.2 },
    { id:"lancet-dig", shortName:"Lancet Dig Health", issn:"2589-7500", impactFactor:23.8 },
    { id:"jama-intern", shortName:"JAMA Intern Med", issn:"2168-6106", impactFactor:39.2 },
    { id:"plos-med", shortName:"PLOS Med", issn:"1549-1676", impactFactor:15.8 },
    { id:"jacc", shortName:"JACC", issn:"0735-1097", impactFactor:21.7 },
    { id:"eur-heart", shortName:"Eur Heart J", issn:"0195-668X", impactFactor:37.6 },
    { id:"circulation", shortName:"Circulation", issn:"0009-7322", impactFactor:35.5 },
    { id:"jco", shortName:"JCO", issn:"0732-183X", impactFactor:42.1 },
    { id:"lancet-onc", shortName:"Lancet Oncol", issn:"1470-2045", impactFactor:41.3 },
    { id:"lancet-resp", shortName:"Lancet Respir Med", issn:"2213-2600", impactFactor:38.9 },
    { id:"ajrccm", shortName:"AJRCCM", issn:"1073-449X", impactFactor:19.3 },
    { id:"lancet-id", shortName:"Lancet Infect Dis", issn:"1473-3099", impactFactor:36.4 },
    { id:"cid", shortName:"CID", issn:"1058-4838", impactFactor:11.8 },
    { id:"gastro", shortName:"Gastroenterology", issn:"0016-5085", impactFactor:25.7 },
    { id:"hepatology", shortName:"Hepatology", issn:"0270-9139", impactFactor:12.9 },
    { id:"jasn", shortName:"JASN", issn:"1046-6673", impactFactor:10.3 },
    { id:"kid-int", shortName:"Kidney Int", issn:"0085-2538", impactFactor:14.8 },
    { id:"lancet-neuro", shortName:"Lancet Neurol", issn:"1474-4422", impactFactor:46.3 },
    { id:"neurology", shortName:"Neurology", issn:"0028-3878", impactFactor:8.8 },
    { id:"ccm", shortName:"Crit Care Med", issn:"0090-3493", impactFactor:7.7 },
    { id:"intensive-care", shortName:"Intensive Care Med", issn:"0342-4642", impactFactor:27.1 },
    { id:"diabetes-care", shortName:"Diabetes Care", issn:"0149-5992", impactFactor:14.8 },
    { id:"blood", shortName:"Blood", issn:"0006-4971", impactFactor:20.3 },
    { id:"ard", shortName:"Ann Rheum Dis", issn:"0003-4967", impactFactor:20.3 },
    { id:"jcem", shortName:"JCEM", issn:"0021-972X", impactFactor:5.8 },
    { id:"thyroid", shortName:"Thyroid", issn:"1050-7256", impactFactor:5.2 },
    { id:"jaad", shortName:"JAAD", issn:"0190-9622", impactFactor:11.5 },
    { id:"bjd", shortName:"Br J Dermatol", issn:"0007-0963", impactFactor:8.1 },
    { id:"ajp", shortName:"Am J Psychiatry", issn:"0002-953X", impactFactor:13.4 },
    { id:"lancet-psych", shortName:"Lancet Psychiatry", issn:"2215-0366", impactFactor:64.3 },
    { id:"pediatrics", shortName:"Pediatrics", issn:"0031-4005", impactFactor:8.0 },
    { id:"jpeds", shortName:"J Pediatr", issn:"0022-3476", impactFactor:3.7 },
    { id:"eur-urol", shortName:"Eur Urol", issn:"0302-2838", impactFactor:25.3 },
    { id:"radiology", shortName:"Radiology", issn:"0033-8419", impactFactor:12.1 },
    { id:"anesthesiology", shortName:"Anesthesiology", issn:"0003-3022", impactFactor:8.0 },
    { id:"ann-emerg", shortName:"Ann Emerg Med", issn:"0196-0644", impactFactor:5.6 },
    { id:"jags", shortName:"JAGS", issn:"0002-8614", impactFactor:6.3 },
    { id:"jbjs", shortName:"JBJS", issn:"0021-9355", impactFactor:5.3 },
    { id:"ophthalmology", shortName:"Ophthalmology", issn:"0161-6420", impactFactor:13.7 },
    // 2026-03-22: 35誌追加
    { id:"eur-resp-j", shortName:"Eur Respir J", issn:"0903-1936", impactFactor:16.7 },
    { id:"chest", shortName:"CHEST", issn:"0012-3692", impactFactor:9.6 },
    { id:"thorax", shortName:"Thorax", issn:"0040-6376", impactFactor:9.0 },
    { id:"gut", shortName:"Gut", issn:"0017-5749", impactFactor:24.5 },
    { id:"j-hepatol", shortName:"J Hepatol", issn:"0168-8278", impactFactor:25.7 },
    { id:"am-j-gastro", shortName:"Am J Gastroenterol", issn:"0002-9270", impactFactor:10.2 },
    { id:"clin-micro-rev", shortName:"Clin Microbiol Rev", issn:"0893-8512", impactFactor:20.6 },
    { id:"jid", shortName:"J Infect Dis", issn:"0022-1899", impactFactor:6.4 },
    { id:"jac", shortName:"JAC", issn:"0305-7453", impactFactor:5.4 },
    { id:"jama-neurol", shortName:"JAMA Neurol", issn:"2168-6149", impactFactor:22.0 },
    { id:"brain", shortName:"Brain", issn:"0006-8950", impactFactor:13.5 },
    { id:"ann-neurol", shortName:"Ann Neurol", issn:"0364-5134", impactFactor:11.2 },
    { id:"am-j-kidney", shortName:"Am J Kidney Dis", issn:"0272-6386", impactFactor:9.4 },
    { id:"cjasn", shortName:"CJASN", issn:"1555-9041", impactFactor:8.6 },
    { id:"ndt", shortName:"NDT", issn:"0931-0509", impactFactor:5.3 },
    { id:"lancet-child", shortName:"Lancet Child Adolesc Health", issn:"2352-4642", impactFactor:16.3 },
    { id:"jama-pediatr", shortName:"JAMA Pediatr", issn:"2168-6203", impactFactor:16.0 },
    { id:"arch-dis-child", shortName:"Arch Dis Child", issn:"0003-9888", impactFactor:3.6 },
    { id:"jama-dermatol", shortName:"JAMA Dermatol", issn:"2168-6068", impactFactor:11.8 },
    { id:"j-invest-dermatol", shortName:"J Invest Dermatol", issn:"0022-202X", impactFactor:7.6 },
    { id:"jama-psych", shortName:"JAMA Psychiatry", issn:"2168-622X", impactFactor:22.5 },
    { id:"biol-psych", shortName:"Biol Psychiatry", issn:"0006-3223", impactFactor:12.8 },
    { id:"mol-psych", shortName:"Mol Psychiatry", issn:"1359-4184", impactFactor:11.0 },
    { id:"lancet-diab", shortName:"Lancet Diabetes Endocrinol", issn:"2213-8587", impactFactor:44.9 },
    { id:"diabetologia", shortName:"Diabetologia", issn:"0012-186X", impactFactor:8.2 },
    { id:"age-ageing", shortName:"Age Ageing", issn:"0002-0729", impactFactor:12.0 },
    { id:"j-amda", shortName:"JAMDA", issn:"1525-8610", impactFactor:7.0 },
    { id:"j-gerontol-a", shortName:"J Gerontol A", issn:"1079-5006", impactFactor:5.1 },
    { id:"mayo-clin-proc", shortName:"Mayo Clin Proc", issn:"0025-6196", impactFactor:8.0 },
    { id:"ajog", shortName:"AJOG", issn:"0002-9378", impactFactor:9.8 },
    { id:"obst-gynecol", shortName:"Obstet Gynecol", issn:"0029-7844", impactFactor:7.2 },
    { id:"bjog", shortName:"BJOG", issn:"1470-0328", impactFactor:6.4 },
    { id:"fertil-steril", shortName:"Fertil Steril", issn:"0015-0282", impactFactor:6.3 },
    { id:"hum-reprod", shortName:"Hum Reprod", issn:"0268-1161", impactFactor:6.1 },
    // 2026-03-22: 63誌追加（各分野5-10誌充足）
    { id:"circ-res", shortName:"Circ Res", issn:"0009-7330", impactFactor:14.5 },
    { id:"jama-cardiol", shortName:"JAMA Cardiol", issn:"2380-6583", impactFactor:14.8 },
    { id:"eur-j-heart-fail", shortName:"Eur J Heart Fail", issn:"1388-9842", impactFactor:16.2 },
    { id:"heart", shortName:"Heart", issn:"1355-6037", impactFactor:5.0 },
    { id:"j-am-heart-assoc", shortName:"JAHA", issn:"2047-9980", impactFactor:5.0 },
    { id:"lancet-gastro", shortName:"Lancet Gastroenterol Hepatol", issn:"2468-1253", impactFactor:35.7 },
    { id:"clin-gastro-hepatol", shortName:"Clin Gastroenterol Hepatol", issn:"1542-3565", impactFactor:11.6 },
    { id:"j-crohns-colitis", shortName:"J Crohns Colitis", issn:"1873-9946", impactFactor:8.3 },
    { id:"aliment-pharmacol", shortName:"Aliment Pharmacol Ther", issn:"0269-2813", impactFactor:6.6 },
    { id:"eur-resp-rev", shortName:"Eur Respir Rev", issn:"0905-9180", impactFactor:9.0 },
    { id:"j-thorac-oncol", shortName:"J Thorac Oncol", issn:"1556-0864", impactFactor:20.4 },
    { id:"respirology", shortName:"Respirology", issn:"1323-7799", impactFactor:6.1 },
    { id:"am-j-resp-cell", shortName:"Am J Respir Cell Mol Biol", issn:"1044-1549", impactFactor:5.9 },
    { id:"respir-med", shortName:"Respir Med", issn:"0954-6111", impactFactor:3.4 },
    { id:"lancet-hiv", shortName:"Lancet HIV", issn:"2352-3018", impactFactor:15.8 },
    { id:"emerging-infect", shortName:"Emerg Infect Dis", issn:"1080-6040", impactFactor:7.2 },
    { id:"j-clin-micro", shortName:"J Clin Microbiol", issn:"0095-1137", impactFactor:6.8 },
    { id:"int-j-antimicrob", shortName:"Int J Antimicrob Agents", issn:"0924-8579", impactFactor:5.3 },
    { id:"open-forum-id", shortName:"Open Forum Infect Dis", issn:"2328-8957", impactFactor:4.2 },
    { id:"stroke", shortName:"Stroke", issn:"0039-2499", impactFactor:7.9 },
    { id:"j-neurol-neurosurg-psych", shortName:"JNNP", issn:"0022-3050", impactFactor:8.2 },
    { id:"neurology-neuroimmunol", shortName:"Neurol Neuroimmunol Neuroinflamm", issn:"2332-7812", impactFactor:7.8 },
    { id:"mov-disord", shortName:"Mov Disord", issn:"0885-3185", impactFactor:9.3 },
    { id:"epilepsia", shortName:"Epilepsia", issn:"0013-9580", impactFactor:5.6 },
    { id:"nat-rev-nephrol", shortName:"Nat Rev Nephrol", issn:"1759-5061", impactFactor:28.6 },
    { id:"kid-int-rep", shortName:"Kidney Int Rep", issn:"2468-0249", impactFactor:4.5 },
    { id:"clin-kidney-j", shortName:"Clin Kidney J", issn:"2048-8505", impactFactor:3.9 },
    { id:"kid-360", shortName:"Kidney360", issn:"2641-7650", impactFactor:3.2 },
    { id:"nephron", shortName:"Nephron", issn:"2235-3186", impactFactor:2.4 },
    { id:"lancet-haematol", shortName:"Lancet Haematol", issn:"2352-3026", impactFactor:11.6 },
    { id:"am-j-hematol", shortName:"Am J Hematol", issn:"0361-8609", impactFactor:10.1 },
    { id:"blood-cancer-j", shortName:"Blood Cancer J", issn:"2044-5385", impactFactor:12.9 },
    { id:"j-thromb-haemost", shortName:"J Thromb Haemost", issn:"1538-7933", impactFactor:10.4 },
    { id:"brit-j-haematol", shortName:"Br J Haematol", issn:"0007-1048", impactFactor:5.7 },
    { id:"nat-rev-clin-oncol", shortName:"Nat Rev Clin Oncol", issn:"1759-4774", impactFactor:81.1 },
    { id:"ann-oncol", shortName:"Ann Oncol", issn:"0923-7534", impactFactor:32.0 },
    { id:"jama-oncol", shortName:"JAMA Oncol", issn:"2374-2437", impactFactor:28.4 },
    { id:"cancer-discov", shortName:"Cancer Discov", issn:"2159-8274", impactFactor:29.7 },
    { id:"cancer-cell", shortName:"Cancer Cell", issn:"1535-6108", impactFactor:48.8 },
    { id:"clin-cancer-res", shortName:"Clin Cancer Res", issn:"1078-0432", impactFactor:10.0 },
    { id:"eur-j-cancer", shortName:"Eur J Cancer", issn:"0959-8049", impactFactor:8.4 },
    { id:"diabetes", shortName:"Diabetes", issn:"0012-1797", impactFactor:7.7 },
    { id:"eur-j-endocrinol", shortName:"Eur J Endocrinol", issn:"0804-4643", impactFactor:5.8 },
    { id:"diab-obes-metab", shortName:"Diabetes Obes Metab", issn:"1462-8902", impactFactor:5.8 },
    { id:"obesity", shortName:"Obesity", issn:"1930-7381", impactFactor:5.3 },
    { id:"j-diab-investig", shortName:"J Diabetes Investig", issn:"2040-1116", impactFactor:3.2 },
    { id:"nat-rev-urol", shortName:"Nat Rev Urol", issn:"1759-4812", impactFactor:13.4 },
    { id:"prostate-cancer", shortName:"Prostate Cancer Prostatic Dis", issn:"1365-7852", impactFactor:5.2 },
    { id:"j-nucl-med", shortName:"J Nucl Med", issn:"0161-5505", impactFactor:9.1 },
    { id:"eur-j-nucl-med", shortName:"Eur J Nucl Med Mol Imaging", issn:"1619-7070", impactFactor:9.1 },
    { id:"prog-retin-eye", shortName:"Prog Retin Eye Res", issn:"1350-9462", impactFactor:18.6 },
    { id:"am-j-ophthalmol", shortName:"Am J Ophthalmol", issn:"0002-9394", impactFactor:4.1 },
    { id:"spine-j", shortName:"Spine J", issn:"1529-9430", impactFactor:3.5 },
    { id:"resuscitation", shortName:"Resuscitation", issn:"0300-9572", impactFactor:6.5 },
    { id:"crit-care", shortName:"Crit Care", issn:"1364-8535", impactFactor:15.1 },
    { id:"ann-intensive-care", shortName:"Ann Intensive Care", issn:"2110-5820", impactFactor:8.1 },
    { id:"reg-anesth-pain", shortName:"Reg Anesth Pain Med", issn:"1098-7339", impactFactor:9.8 },
    { id:"j-clin-anesth", shortName:"J Clin Anesth", issn:"0952-8180", impactFactor:5.0 },
    { id:"j-autoimmun", shortName:"J Autoimmun", issn:"0896-8411", impactFactor:12.8 },
    { id:"aging-clin-exp", shortName:"Aging Clin Exp Res", issn:"1594-0667", impactFactor:4.0 },
    { id:"j-hosp-med", shortName:"J Hosp Med", issn:"1553-5592", impactFactor:3.5 },
    { id:"j-eur-acad-dermatol", shortName:"JEADV", issn:"0926-9959", impactFactor:6.2 },
    { id:"j-natl-cancer-inst", shortName:"JNCI", issn:"0027-8874", impactFactor:9.9 },
  ];
  const JA_JOURNALS = [
    { id:"naika", shortName:"日本内科学会雑誌", issn:"0021-5384", impactFactor:0.3 },
    { id:"igaku-zasshi", shortName:"日本医事新報", issn:"0385-9215", impactFactor:0.2 },
    { id:"rinsho", shortName:"臨床雑誌内科", issn:"0022-1961", impactFactor:0.2 },
    { id:"jjsem", shortName:"日本救急医学会雑誌", issn:"0915-924X", impactFactor:0.3 },
    { id:"jsim", shortName:"日本集中治療医学会雑誌", issn:"1340-7988", impactFactor:0.3 },
    { id:"circ-j", shortName:"Circ J", issn:"1346-9843", impactFactor:3.2 },
    { id:"jjc", shortName:"日本循環器学会誌", issn:"0047-1828", impactFactor:0.5 },
    { id:"jga", shortName:"日本消化器病学会雑誌", issn:"0446-6586", impactFactor:0.3 },
    { id:"jjca", shortName:"日本癌学会誌", issn:"0021-4922", impactFactor:0.5 },
    { id:"jpn-j-surg", shortName:"日本外科学会雑誌", issn:"0301-4894", impactFactor:0.3 },
  ];

  for (const { langKey, journals } of [
    { langKey: "en", journals: EN_JOURNALS },
    { langKey: "ja", journals: JA_JOURNALS },
  ]) {
    const DB_KEY = `journal:db:${langKey}`;
    const ARCHIVE_KEY = `journal:archive:${langKey}`;

    // 既存DB読み込み（差分更新）
    let existingDb = {};
    try {
      const raw = await env.IWOR_KV.get(DB_KEY, "json");
      if (raw?.articles) {
        for (const a of raw.articles) existingDb[a.pmid] = a;
      }
    } catch {}

    // PubMed検索 — レート制限対策: バッチ間に1.5秒delay
    const delay = ms => new Promise(r => setTimeout(r, ms));
    const issns = journals.map(j => j.issn);
    const BATCH_SIZE = 10; // URL長制限+レート制限対策
    let ids = [];
    for (let i = 0; i < issns.length; i += BATCH_SIZE) {
      if (i > 0) await delay(1500); // PubMed rate limit: 3 req/sec without API key
      const batch = issns.slice(i, i + BATCH_SIZE);
      const ptFilter = '("Journal Article"[pt] OR "Meta-Analysis"[pt] OR "Systematic Review"[pt] OR "Review"[pt] OR "Randomized Controlled Trial"[pt] OR "Clinical Trial"[pt] OR "Guideline"[pt] OR "Practice Guideline"[pt] OR "Multicenter Study"[pt] OR "Observational Study"[pt] OR "Comparative Study"[pt])';
      const ptExclude = 'NOT ("Letter"[pt] OR "Comment"[pt] OR "Editorial"[pt] OR "Erratum"[pt] OR "News"[pt] OR "Biography"[pt] OR "Published Erratum"[pt] OR "Retracted Publication"[pt])';
      const q = encodeURIComponent(`(${batch.map(issn => `${issn}[ISSN]`).join(" OR ")}) AND ("last 90 days"[dp]) AND ${ptFilter} ${ptExclude}`);
      const sUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${q}&retmax=100&sort=date&retmode=json`;
      try {
        const sRes = await fetch(sUrl);
        if (!sRes.ok) { console.error(`PubMed search error: ${sRes.status}`); continue; }
        const sText = await sRes.text();
        let sData;
        try { sData = JSON.parse(sText); } catch { console.error("PubMed search non-JSON:", sText.slice(0, 100)); continue; }
        const batchIds = sData?.esearchresult?.idlist || [];
        ids = ids.concat(batchIds);
      } catch (err) {
        console.error(`PubMed batch fetch error:`, err);
      }
    }

    if (ids.length === 0) continue;

    // 新規PMIDのみ取得
    const newIds = ids.filter(id => !existingDb[id]);
    let newArticles = [];

    // esummaryもバッチ分割（100件ずつ、delay付き）
    if (newIds.length > 0) {
      const SUMMARY_BATCH = 80;
      let fDataAll = {};
      for (let i = 0; i < newIds.length; i += SUMMARY_BATCH) {
        if (i > 0) await delay(1500);
        const batch = newIds.slice(i, i + SUMMARY_BATCH);
        const fUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${batch.join(",")}&retmode=json`;
        try {
          const fRes = await fetch(fUrl);
          if (!fRes.ok) { console.error(`PubMed summary error: ${fRes.status}`); continue; }
          const fText = await fRes.text();
          let fData;
          try { fData = JSON.parse(fText); } catch { console.error("PubMed summary non-JSON:", fText.slice(0, 100)); continue; }
          if (fData?.result) Object.assign(fDataAll, fData.result);
        } catch (err) {
          console.error(`PubMed summary batch error:`, err);
        }
      }
      const fData = { result: fDataAll };
      for (const id of newIds) {
        const d = fData?.result?.[id];
        if (!d || !d.title) continue;
        const jTitle = (d.fulljournalname || d.source || "").toLowerCase();
        const mj = journals.find(j =>
          jTitle.includes(j.shortName.toLowerCase()) || d.issn === j.issn
        );
        // Publication type detection
        const pubTypes = (d.pubtype || []).map(t => t.toLowerCase());
        let articleType = "article";
        if (pubTypes.some(t => t.includes("meta-analysis"))) articleType = "meta-analysis";
        else if (pubTypes.some(t => t.includes("systematic review"))) articleType = "systematic-review";
        else if (pubTypes.some(t => t.includes("randomized controlled"))) articleType = "rct";
        else if (pubTypes.some(t => t.includes("clinical trial"))) articleType = "clinical-trial";
        else if (pubTypes.some(t => t.includes("review"))) articleType = "review";
        else if (pubTypes.some(t => t.includes("guideline"))) articleType = "guideline";
        else if (pubTypes.some(t => t.includes("observational"))) articleType = "observational";
        else if (pubTypes.some(t => t.includes("multicenter"))) articleType = "multicenter";
        else if (pubTypes.some(t => t.includes("comparative"))) articleType = "comparative";

        newArticles.push({
          pmid: id,
          title: d.title || "",
          authors: (d.authors || []).slice(0, 3).map(a => a.name).join(", ") + ((d.authors || []).length > 3 ? " et al." : ""),
          journal: mj?.shortName || d.source || "",
          journalId: mj?.id || "",
          date: (d.pubdate || d.sortpubdate || "").split(" ").slice(0, 2).join(" "),
          doi: (d.elocationid || "").replace("doi: ", ""),
          impactFactor: mj?.impactFactor || 0,
          articleType,
        });
      }
    }

    // DeepL翻訳（英語論文の新規分のみ）
    if (langKey === "en" && newArticles.length > 0) {
      const DEEPL_KEY = env.DEEPL_API_KEY || "";
      for (const article of newArticles) {
        try {
          if (DEEPL_KEY) {
            const dlRes = await fetch("https://api-free.deepl.com/v2/translate", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `DeepL-Auth-Key ${DEEPL_KEY}`,
              },
              body: JSON.stringify({
                text: [article.title],
                source_lang: "EN",
                target_lang: "JA",
              }),
            });
            if (dlRes.ok) {
              const dlData = await dlRes.json();
              if (dlData?.translations?.[0]?.text) {
                article.titleJa = dlData.translations[0].text;
                continue;
              }
            }
          }
          // フォールバック: Workers AI
          const trResult = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [
              { role: "system", content: "あなたは医学論文の翻訳者です。以下の英語の医学論文タイトルを、自然で正確な日本語に翻訳してください。医学専門用語は日本の医学文献で一般的に使われる訳語を使用してください。固有名詞（薬剤名、試験名、略語）はそのまま残してください。翻訳のみを出力し、余計な説明は不要です。" },
              { role: "user", content: article.title },
            ],
            max_tokens: 200,
          });
          if (trResult?.response) {
            const cleaned = trResult.response.trim().replace(/^["「]|["」]$/g, '').replace(/^翻訳[：:]\s*/i, '');
            if (cleaned.length > 3) article.titleJa = cleaned;
          }
        } catch {}
      }
    }

    // DBマージ
    for (const a of newArticles) existingDb[a.pmid] = a;

    // 未翻訳の既存記事にも翻訳を適用（バッチ上限50件/回）
    if (langKey === "en") {
      const DEEPL_KEY = env.DEEPL_API_KEY || "";
      // titleJaがない OR titleJaが英語のまま（翻訳失敗）のものを再翻訳
      const isEnglishOnly = (s) => s && /^[A-Za-z0-9\s\-\(\)\[\]:,\.;\/&'"]+$/.test(s);
      const untranslated = Object.values(existingDb).filter(a => !a.titleJa || isEnglishOnly(a.titleJa)).slice(0, 50);
      for (const article of untranslated) {
        try {
          if (DEEPL_KEY) {
            const dlRes = await fetch("https://api-free.deepl.com/v2/translate", {
              method: "POST",
              headers: { "Content-Type": "application/json", "Authorization": `DeepL-Auth-Key ${DEEPL_KEY}` },
              body: JSON.stringify({ text: [article.title], source_lang: "EN", target_lang: "JA" }),
            });
            if (dlRes.ok) {
              const dlData = await dlRes.json();
              if (dlData?.translations?.[0]?.text) { article.titleJa = dlData.translations[0].text; continue; }
            }
          }
          const trResult = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [
              { role: "system", content: "あなたは医学論文の翻訳者です。以下の英語の医学論文タイトルを自然で正確な日本語に翻訳してください。翻訳のみを出力してください。" },
              { role: "user", content: article.title },
            ],
            max_tokens: 200,
          });
          if (trResult?.response) {
            const cleaned = trResult.response.trim().replace(/^["「]|["」]$/g, '').replace(/^翻訳[：:]\s*/i, '');
            if (cleaned.length > 3) article.titleJa = cleaned;
          }
        } catch {}
      }
      console.log(`Translated ${untranslated.length} previously untranslated articles`);
    }

    const allArticles = Object.values(existingDb)
      .sort((a, b) => (b.impactFactor || 0) - (a.impactFactor || 0) || (b.date || "").localeCompare(a.date || ""));

    // DB保存（最大500件、翻訳済み）
    await env.IWOR_KV.put(DB_KEY, JSON.stringify({
      articles: allArticles.slice(0, 500),
      updatedAt: Date.now(),
      totalFetched: allArticles.length,
      newCount: newArticles.length,
    }));

    // アーカイブ追加（1年分、最大5000件）
    try {
      const archiveRaw = await env.IWOR_KV.get(ARCHIVE_KEY, "json");
      const archive = archiveRaw?.articles || [];
      const archivePmids = new Set(archive.map(a => a.pmid));
      const archiveNew = newArticles.filter(a => !archivePmids.has(a.pmid));
      if (archiveNew.length > 0) {
        const merged = [...archiveNew, ...archive].slice(0, 5000);
        await env.IWOR_KV.put(ARCHIVE_KEY, JSON.stringify({ articles: merged, updatedAt: Date.now() }), { expirationTtl: 31536000 });
      }
    } catch {}

    console.log(`Journal DB [${langKey}]: ${newArticles.length} new, ${allArticles.length} total`);
  }
}

const ALLOWED_ORIGINS = ["https://iwor.jp", "http://localhost:3000"];

function getCors(request) {
  const origin = request?.headers?.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Key,X-Admin-Key",
    "Vary": "Origin",
  };
}

const json = (data, status = 200, request = null) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      ...getCors(request),
    },
  });

// ── 暗号化ユーティリティ ──

// Legacy SHA-256 ハッシュ（移行期間中の旧フォーマット検証用）
// 全ユーザーがログイン済みになったら削除可能
async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// PBKDF2: ランダムソルト生成（16バイト = 32文字hex）
function generateSalt() {
  const salt = new Uint8Array(16);
  crypto.getRandomValues(salt);
  return Array.from(salt).map(b => b.toString(16).padStart(2, "0")).join("");
}

// PBKDF2: パスワードハッシュ（100,000 iterations, SHA-256, 256-bit output）
async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw", encoder.encode(password), "PBKDF2", false, ["deriveBits"]
  );
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", salt: encoder.encode(salt), iterations: 100000, hash: "SHA-256" },
    keyMaterial, 256
  );
  return Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, "0")).join("");
}

// パスワード検証（PBKDF2 + レガシーSHA-256自動移行対応）
// storedSalt が存在すれば PBKDF2、なければレガシー SHA-256 で検証
async function verifyPassword(password, email, storedHash, storedSalt) {
  if (storedSalt) {
    const hash = await hashPassword(password, storedSalt);
    return hash === storedHash;
  } else {
    // レガシー SHA-256 フォーマット
    const legacyHash = await sha256(password + email + SALT);
    return legacyHash === storedHash;
  }
}

function generatePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const len = chars.length; // 30
  const limit = 256 - (256 % len); // rejection sampling boundary
  const result = [];
  while (result.length < 10) {
    const arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    for (const b of arr) {
      if (b < limit && result.length < 10) result.push(chars[b % len]);
    }
  }
  return result.join("");
}

// ── プラン判定 ──
function detectPlan(productName) {
  if (!productName) return { plan: "pro_1y", durationDays: 365 };
  if (productName.includes("3年") || productName.includes("3year"))
    return { plan: "pro_3y", durationDays: 1095 };
  if (productName.includes("2年") || productName.includes("2year"))
    return { plan: "pro_2y", durationDays: 730 };
  return { plan: "pro_1y", durationDays: 365 };
}

// ── KVキー ──
const orderKey = (n) => `order:${n}`;
const userKey = (email) => `user:${email}`;

const SALT = "iwor_pro_2026";

// ── 安全なJSONパース ──
async function parseBody(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

// ── セッション認証＋プラン有効期限チェック ──
async function authenticate(request, env, { checkExpiry = true } = {}) {
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace("Bearer ", "").trim();
  if (!token) return { error: "Unauthorized", status: 401 };

  const sessionRaw = await env.IWOR_KV.get(`session:${token}`);
  if (!sessionRaw) return { error: "Invalid session", status: 401 };

  const session = JSON.parse(sessionRaw);
  const userRaw = await env.IWOR_KV.get(userKey(session.email));
  if (!userRaw) return { error: "User not found", status: 404 };

  const user = JSON.parse(userRaw);

  // パスワードリセット後のセッション無効化チェック
  // セッション作成時刻がパスワード変更時刻より前なら無効
  if (user.passwordChangedAt && session.createdAt) {
    if (new Date(session.createdAt) < new Date(user.passwordChangedAt)) {
      return { error: "パスワードが変更されました。再度ログインしてください。", status: 401 };
    }
  }

  if (checkExpiry && user.expiresAt && new Date() > new Date(user.expiresAt)) {
    return { error: "PRO期限が切れています。更新してください。", status: 403 };
  }

  return { session, user, email: session.email };
}

// ── ペイロードサイズ制限（デフォルト1MB） ──
const MAX_PAYLOAD = 1024 * 1024;
function checkPayloadSize(data) {
  return JSON.stringify(data).length <= MAX_PAYLOAD;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === "OPTIONS") {
      return new Response(null, { headers: getCors(request) });
    }

    // ══════════════════════════════════════════════════
    //  GAS → 注文保存
    //  POST /api/store-order
    // ══════════════════════════════════════════════════
    if (path === "/api/store-order" && request.method === "POST") {
      const key = request.headers.get("X-Api-Key");
      if (key !== env.GAS_KEY) return json({ error: "Forbidden" }, 403, request);

      const storeBody = await parseBody(request);
      if (!storeBody) return json({ error: "Invalid JSON" }, 400, request);
      const { orderNumber, productName, buyerEmail } = storeBody;
      if (!orderNumber) return json({ error: "orderNumber required" }, 400, request);

      const existing = await env.IWOR_KV.get(orderKey(orderNumber));
      if (existing) return json({ ok: true, message: "already stored", orderNumber }, 200, request);

      const plan = detectPlan(productName);

      await env.IWOR_KV.put(
        orderKey(orderNumber),
        JSON.stringify({
          orderNumber,
          productName: productName || "",
          buyerEmail: buyerEmail || "",
          plan: plan.plan,
          durationDays: plan.durationDays,
          storedAt: new Date().toISOString(),
          used: false,
          registeredEmail: null,
        })
      );

      return json({ ok: true, orderNumber, plan: plan.plan }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  会員登録
    //  POST /api/register
    //  Body: { orderNumber, email }
    //  → パスワード自動生成、返却
    // ══════════════════════════════════════════════════
    if (path === "/api/register" && request.method === "POST") {
      // レート制限: IP単位で5回/15分
      const registerIP = request.headers.get("CF-Connecting-IP") || "unknown";
      const registerRateKey = `rate:register:${registerIP}`;
      const registerCountRaw = await env.IWOR_KV.get(registerRateKey);
      const registerCount = registerCountRaw ? parseInt(registerCountRaw, 10) : 0;
      if (registerCount >= 5) {
        return json({ error: "登録試行回数が上限に達しました。15分後に再度お試しください。" }, 429, request);
      }
      await env.IWOR_KV.put(registerRateKey, String(registerCount + 1), { expirationTtl: 900 });

      const body = await parseBody(request);
      if (!body) return json({ error: "Invalid JSON" }, 400, request);
      const orderNumber = String(body.orderNumber || "").trim();
      const email = String(body.email || "").trim().toLowerCase();

      // バリデーション
      if (!orderNumber || !/^\d{5,12}$/.test(orderNumber)) {
        return json({ error: "注文番号を正しく入力してください（数字5〜12桁）" }, 400, request);
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ error: "メールアドレスを正しく入力してください" }, 400, request);
      }

      // 注文番号チェック
      const orderRaw = await env.IWOR_KV.get(orderKey(orderNumber));
      if (!orderRaw) {
        return json({ error: "登録情報を確認できませんでした。入力内容をご確認ください。" }, 400, request);
      }
      const order = JSON.parse(orderRaw);

      if (order.used) {
        return json({ error: "登録情報を確認できませんでした。入力内容をご確認ください。" }, 400, request);
      }

      // メール重複チェック
      const existingUser = await env.IWOR_KV.get(userKey(email));
      if (existingUser) {
        return json({ error: "登録情報を確認できませんでした。入力内容をご確認ください。" }, 400, request);
      }

      // パスワード生成＆PBKDF2ハッシュ化
      const password = generatePassword();
      const salt = generateSalt();
      const passwordHash = await hashPassword(password, salt);

      // 有効期限計算
      const now = new Date();
      const expiresAt = new Date(now.getTime() + order.durationDays * 24 * 60 * 60 * 1000);

      // ユーザー作成
      await env.IWOR_KV.put(
        userKey(email),
        JSON.stringify({
          email,
          passwordHash,
          salt,
          plan: order.plan,
          durationDays: order.durationDays,
          orderNumber,
          registeredAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
          university: String(body.university || "").trim() || undefined,
          licenseYear: String(body.licenseYear || "").trim() || undefined,
          hospital: String(body.hospital || "").trim() || undefined,
        })
      );

      // 注文を使用済みに
      await env.IWOR_KV.put(
        orderKey(orderNumber),
        JSON.stringify({
          ...order,
          used: true,
          registeredEmail: email,
          registeredAt: now.toISOString(),
        })
      );

      // セッショントークン生成
      const regTokenBytes = new Uint8Array(32);
      crypto.getRandomValues(regTokenBytes);
      const regSessionToken = Array.from(regTokenBytes).map(b => b.toString(16).padStart(2, "0")).join("");
      await env.IWOR_KV.put(`session:${regSessionToken}`, JSON.stringify({
        email,
        createdAt: new Date().toISOString(),
      }), { expirationTtl: 86400 * 90 });

      return json({
        ok: true,
        email,
        password,
        plan: order.plan,
        expiresAt: expiresAt.toISOString(),
        sessionToken: regSessionToken,
      }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  ログイン
    //  POST /api/login
    //  Body: { email, password }
    // ══════════════════════════════════════════════════
    if (path === "/api/login" && request.method === "POST") {
      // レート制限: IP単位で10回/15分
      const loginIP = request.headers.get("CF-Connecting-IP") || "unknown";
      const loginRateKey = `rate:login:${loginIP}`;
      const loginCountRaw = await env.IWOR_KV.get(loginRateKey);
      const loginCount = loginCountRaw ? parseInt(loginCountRaw, 10) : 0;
      if (loginCount >= 10) {
        return json({ error: "ログイン試行回数が上限に達しました。15分後に再度お試しください。" }, 429, request);
      }

      const body = await parseBody(request);
      if (!body) return json({ error: "Invalid JSON" }, 400, request);
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");

      if (!email || !password) {
        return json({ error: "メールアドレスとパスワードを入力してください" }, 400, request);
      }

      const userRaw = await env.IWOR_KV.get(userKey(email));
      if (!userRaw) {
        await env.IWOR_KV.put(loginRateKey, String(loginCount + 1), { expirationTtl: 900 });
        return json({ error: "メールアドレスまたはパスワードが正しくありません。" }, 401, request);
      }

      const user = JSON.parse(userRaw);
      const passwordValid = await verifyPassword(password, email, user.passwordHash, user.salt);

      if (!passwordValid) {
        await env.IWOR_KV.put(loginRateKey, String(loginCount + 1), { expirationTtl: 900 });
        return json({ error: "メールアドレスまたはパスワードが正しくありません。" }, 401, request);
      }

      // レガシー SHA-256 → PBKDF2 自動移行
      // salt フィールドが無い = 旧フォーマット → ログイン成功時に PBKDF2 で再ハッシュ
      if (!user.salt) {
        const newSalt = generateSalt();
        const newHash = await hashPassword(password, newSalt);
        user.passwordHash = newHash;
        user.salt = newSalt;
        user.hashMigratedAt = new Date().toISOString();
        await env.IWOR_KV.put(userKey(email), JSON.stringify(user));
      }

      // 期限チェック
      const expired = user.expiresAt && new Date() > new Date(user.expiresAt);

      // セッショントークン生成（データ同期用）
      let sessionToken = null;
      if (!expired) {
        const tokenBytes = new Uint8Array(32);
        crypto.getRandomValues(tokenBytes);
        sessionToken = Array.from(tokenBytes).map(b => b.toString(16).padStart(2, "0")).join("");
        await env.IWOR_KV.put(`session:${sessionToken}`, JSON.stringify({
          email: user.email,
          createdAt: new Date().toISOString(),
        }), { expirationTtl: 86400 * 90 }); // 90日有効
      }

      return json({
        ok: true,
        email: user.email,
        plan: user.plan,
        expiresAt: user.expiresAt,
        expired,
        sessionToken,
      }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  パスワードリセット
    //  POST /api/reset-password
    //  Body: { orderNumber, email }
    //  → 注文番号+メールが一致すれば新パスワード発行
    // ══════════════════════════════════════════════════
    if (path === "/api/reset-password" && request.method === "POST") {
      // レート制限: IP単位で5回/15分
      const resetIP = request.headers.get("CF-Connecting-IP") || "unknown";
      const resetRateKey = `rate:reset:${resetIP}`;
      const resetCountRaw = await env.IWOR_KV.get(resetRateKey);
      const resetCount = resetCountRaw ? parseInt(resetCountRaw, 10) : 0;
      if (resetCount >= 5) {
        return json({ error: "リセット試行回数が上限に達しました。15分後に再度お試しください。" }, 429, request);
      }
      await env.IWOR_KV.put(resetRateKey, String(resetCount + 1), { expirationTtl: 900 });

      const body = await parseBody(request);
      if (!body) return json({ error: "Invalid JSON" }, 400, request);
      const orderNumber = String(body.orderNumber || "").trim();
      const email = String(body.email || "").trim().toLowerCase();

      if (!orderNumber || !/^\d{5,12}$/.test(orderNumber)) {
        return json({ error: "注文番号を正しく入力してください（数字5〜12桁）" }, 400, request);
      }
      if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return json({ error: "メールアドレスを正しく入力してください" }, 400, request);
      }

      // 注文番号チェック
      const orderRaw = await env.IWOR_KV.get(orderKey(orderNumber));
      if (!orderRaw) {
        return json({ error: "注文番号が見つかりません。" }, 404, request);
      }
      const order = JSON.parse(orderRaw);

      // 注文が使用済みで、登録メールと一致するか確認
      if (!order.used || order.registeredEmail !== email) {
        return json({ error: "注文番号とメールアドレスの組み合わせが一致しません。" }, 400, request);
      }

      // ユーザー存在チェック
      const userRaw = await env.IWOR_KV.get(userKey(email));
      if (!userRaw) {
        return json({ error: "アカウントが見つかりません。" }, 404, request);
      }
      const user = JSON.parse(userRaw);

      // 新パスワード生成 + PBKDF2ハッシュ
      const newPassword = generatePassword();
      const newSalt = generateSalt();
      const newPasswordHash = await hashPassword(newPassword, newSalt);

      // ユーザー情報更新（passwordChangedAt でセッション無効化）
      await env.IWOR_KV.put(
        userKey(email),
        JSON.stringify({
          ...user,
          passwordHash: newPasswordHash,
          salt: newSalt,
          passwordResetAt: new Date().toISOString(),
          passwordChangedAt: new Date().toISOString(),
        })
      );

      return json({
        ok: true,
        email,
        password: newPassword,
      }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  プロフィール更新
    //  PUT /api/profile
    //  Authorization: Bearer {sessionToken}
    //  Body: { role, university?, graduationYear?, hospitalSize?, specialty? }
    // ══════════════════════════════════════════════════
    if (path === "/api/profile" && request.method === "PUT") {
      const authResult = await authenticate(request, env);
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      const body = await parseBody(request);
      if (!body) return json({ error: "Invalid JSON" }, 400, request);

      const { user, email } = authResult;
      const updatedUser = {
        ...user,
        role: String(body.role || "").trim() || user.role,
        university: String(body.university || "").trim() || user.university,
        graduationYear: String(body.graduationYear || "").trim() || user.graduationYear,
        hospitalSize: String(body.hospitalSize || "").trim() || user.hospitalSize,
        specialty: String(body.specialty || "").trim() || user.specialty,
        profileUpdatedAt: new Date().toISOString(),
      };

      await env.IWOR_KV.put(userKey(email), JSON.stringify(updatedUser));

      return json({ ok: true }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  管理者: 注文一覧
    //  GET /api/admin/orders  (X-Admin-Key header)
    // ══════════════════════════════════════════════════
    if (path === "/api/admin/orders" && request.method === "GET") {
      const key = request.headers.get("X-Admin-Key");
      if (key !== env.ADMIN_KEY) return json({ error: "Forbidden" }, 403, request);

      const list = await env.IWOR_KV.list({ prefix: "order:" });
      const orders = [];
      for (const item of list.keys) {
        const raw = await env.IWOR_KV.get(item.name);
        if (raw) orders.push(JSON.parse(raw));
      }
      orders.sort((a, b) => new Date(b.storedAt) - new Date(a.storedAt));

      return json({ orders, total: orders.length }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  管理者: ユーザー一覧
    //  GET /api/admin/users  (X-Admin-Key header)
    // ══════════════════════════════════════════════════
    if (path === "/api/admin/users" && request.method === "GET") {
      const key = request.headers.get("X-Admin-Key");
      if (key !== env.ADMIN_KEY) return json({ error: "Forbidden" }, 403, request);

      const list = await env.IWOR_KV.list({ prefix: "user:" });
      const users = [];
      for (const item of list.keys) {
        const raw = await env.IWOR_KV.get(item.name);
        if (raw) {
          const user = JSON.parse(raw);
          delete user.passwordHash; // パスワードハッシュは返さない
          delete user.salt; // ソルトも返さない
          users.push(user);
        }
      }
      users.sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt));

      return json({ users, total: users.length }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  管理者: 手動注文追加
    //  POST /api/admin/add-order
    // ══════════════════════════════════════════════════
    if (path === "/api/admin/add-order" && request.method === "POST") {
      const key = request.headers.get("X-Admin-Key");
      if (key !== env.ADMIN_KEY) return json({ error: "Forbidden" }, 403, request);

      const addBody = await parseBody(request);
      if (!addBody) return json({ error: "Invalid JSON" }, 400, request);
      const { orderNumber, productName, buyerEmail } = addBody;
      if (!orderNumber) return json({ error: "orderNumber required" }, 400, request);

      const plan = detectPlan(productName || "iwor PRO 1年パス");

      await env.IWOR_KV.put(
        orderKey(orderNumber),
        JSON.stringify({
          orderNumber,
          productName: productName || "手動追加",
          buyerEmail: buyerEmail || "",
          plan: plan.plan,
          durationDays: plan.durationDays,
          storedAt: new Date().toISOString(),
          used: false,
          registeredEmail: null,
        })
      );

      return json({ ok: true, orderNumber }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  管理者: 注文削除
    //  DELETE /api/admin/order?order={orderNumber}  (X-Admin-Key header)
    // ══════════════════════════════════════════════════
    if (path === "/api/admin/order" && request.method === "DELETE") {
      const key = request.headers.get("X-Admin-Key");
      if (key !== env.ADMIN_KEY) return json({ error: "Forbidden" }, 403, request);

      const orderNumber = url.searchParams.get("order");
      if (!orderNumber) return json({ error: "order param required" }, 400, request);

      await env.IWOR_KV.delete(orderKey(orderNumber));
      return json({ ok: true, deleted: orderNumber }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  ソーシャルプルーフ シードデータ投入
    //  POST /api/admin/seed-leaderboard (X-Admin-Key header)
    // ══════════════════════════════════════════════════
    if (path === "/api/admin/seed-leaderboard" && request.method === "POST") {
      const key = request.headers.get("X-Admin-Key");
      if (key !== env.ADMIN_KEY) return json({ error: "Forbidden" }, 403, request);

      const body = await parseBody(request);
      if (!body?.leaderboard) return json({ error: "leaderboard array required" }, 400, request);

      // リーダーボード上書き
      const lb = body.leaderboard.slice(0, 200);
      await env.IWOR_KV.put("streak:leaderboard", JSON.stringify(lb));

      // 個別ストリークデータも書き込み
      for (const entry of lb) {
        if (entry.email?.startsWith("seed_")) {
          await env.IWOR_KV.put(`streak:${entry.email}`, JSON.stringify({
            count: entry.count,
            best: entry.count,
            lastDate: new Date().toISOString().split("T")[0],
            displayName: entry.displayName,
            updatedAt: new Date().toISOString(),
          }));
        }
      }

      return json({ ok: true, seeded: lb.length }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  ダッシュボードデータ保存
    //  PUT /api/dashboard
    //  Authorization: Bearer {sessionToken}
    // ══════════════════════════════════════════════════
    if (path === "/api/dashboard" && request.method === "PUT") {
      const authResult = await authenticate(request, env);
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      const body = await parseBody(request);
      if (!body) return json({ error: "Invalid JSON" }, 400, request);
      if (!checkPayloadSize(body.data)) return json({ error: "Payload too large" }, 413, request);

      await env.IWOR_KV.put(`dashboard:${authResult.email}`, JSON.stringify({
        data: body.data,
        updatedAt: new Date().toISOString(),
      }));

      return json({ ok: true, updatedAt: new Date().toISOString() }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  ダッシュボードデータ読み込み
    //  GET /api/dashboard
    //  Authorization: Bearer {sessionToken}
    // ══════════════════════════════════════════════════
    if (path === "/api/dashboard" && request.method === "GET") {
      const authResult = await authenticate(request, env);
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      const raw = await env.IWOR_KV.get(`dashboard:${authResult.email}`);

      if (!raw) return json({ ok: true, data: null }, 200, request);

      const parsed = JSON.parse(raw);
      return json({ ok: true, data: parsed.data, updatedAt: parsed.updatedAt }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  J-OSLERデータ保存
    //  PUT /api/josler
    //  Authorization: Bearer {sessionToken}
    // ══════════════════════════════════════════════════
    if (path === "/api/josler" && request.method === "PUT") {
      const authResult = await authenticate(request, env);
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      const body = await parseBody(request);
      if (!body) return json({ error: "Invalid JSON" }, 400, request);
      if (!checkPayloadSize(body.data)) return json({ error: "Payload too large" }, 413, request);

      await env.IWOR_KV.put(`josler:${authResult.email}`, JSON.stringify({
        data: body.data,
        updatedAt: new Date().toISOString(),
      }));

      return json({ ok: true, updatedAt: new Date().toISOString() }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  J-OSLERデータ読み込み
    //  GET /api/josler
    //  Authorization: Bearer {sessionToken}
    // ══════════════════════════════════════════════════
    if (path === "/api/josler" && request.method === "GET") {
      const authResult = await authenticate(request, env);
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      const raw = await env.IWOR_KV.get(`josler:${authResult.email}`);

      if (!raw) return json({ ok: true, data: null }, 200, request);

      const parsed = JSON.parse(raw);
      return json({ ok: true, data: parsed.data, updatedAt: parsed.updatedAt }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  J-OSLER ベンチマーク（同期比較）
    //  GET /api/josler/benchmark
    //  PRO認証必須
    // ══════════════════════════════════════════════════
    if (path === "/api/josler/benchmark" && request.method === "GET") {
      const authResult = await authenticate(request, env);
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      // ベンチマークキャッシュ（1時間）
      const BM_CACHE_KEY = "josler:benchmark:cache";
      try {
        const cached = await env.IWOR_KV.get(BM_CACHE_KEY, "json");
        if (cached && cached.updatedAt && (Date.now() - cached.updatedAt) < 3600000) {
          // 自分のデータと比較
          const myRaw = await env.IWOR_KV.get(`josler:${authResult.email}`);
          const myData = myRaw ? JSON.parse(myRaw)?.data : null;
          return json({ ok: true, benchmark: cached.benchmark, myData: myData ? { cases: myData.totalCases || 0, groups: myData.totalGroups || 0, summaries: myData.totalSummaries || 0 } : null }, 200, request);
        }
      } catch {}

      // 全ユーザーのJOSLERデータを集計
      const allKeys = await env.IWOR_KV.list({ prefix: "josler:" });
      const stats = { cases: [], groups: [], summaries: [] };

      for (const key of allKeys.keys) {
        if (key.name === BM_CACHE_KEY) continue;
        try {
          const raw = await env.IWOR_KV.get(key.name, "json");
          if (raw?.data) {
            stats.cases.push(raw.data.totalCases || 0);
            stats.groups.push(raw.data.totalGroups || 0);
            stats.summaries.push(raw.data.totalSummaries || 0);
          }
        } catch {}
      }

      const calcStats = (arr) => {
        if (arr.length === 0) return { avg: 0, median: 0, p25: 0, p75: 0, count: 0 };
        arr.sort((a, b) => a - b);
        const avg = Math.round(arr.reduce((a, b) => a + b, 0) / arr.length);
        const median = arr[Math.floor(arr.length / 2)];
        const p25 = arr[Math.floor(arr.length * 0.25)];
        const p75 = arr[Math.floor(arr.length * 0.75)];
        return { avg, median, p25, p75, count: arr.length };
      };

      const benchmark = {
        cases: calcStats(stats.cases),
        groups: calcStats(stats.groups),
        summaries: calcStats(stats.summaries),
        totalUsers: stats.cases.length,
      };

      // キャッシュ保存
      await env.IWOR_KV.put(BM_CACHE_KEY, JSON.stringify({ benchmark, updatedAt: Date.now() }));

      const myRaw = await env.IWOR_KV.get(`josler:${authResult.email}`);
      const myData = myRaw ? JSON.parse(myRaw)?.data : null;

      return json({ ok: true, benchmark, myData: myData ? { cases: myData.totalCases || 0, groups: myData.totalGroups || 0, summaries: myData.totalSummaries || 0 } : null }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  EPOC ベンチマーク（同期比較）
    //  GET /api/epoc/benchmark
    //  PRO認証必須
    // ══════════════════════════════════════════════════
    if (path === "/api/epoc/benchmark" && request.method === "GET") {
      const authResult = await authenticate(request, env);
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      const BM_CACHE_KEY = "epoc:benchmark:cache";
      try {
        const cached = await env.IWOR_KV.get(BM_CACHE_KEY, "json");
        if (cached && cached.updatedAt && (Date.now() - cached.updatedAt) < 3600000) {
          return json({ ok: true, benchmark: cached.benchmark }, 200, request);
        }
      } catch {}

      const allKeys = await env.IWOR_KV.list({ prefix: "epoc:" });
      const stats = { symptoms: [], diseases: [], procedures: [] };

      for (const key of allKeys.keys) {
        if (key.name === BM_CACHE_KEY) continue;
        try {
          const raw = await env.IWOR_KV.get(key.name, "json");
          if (raw?.data) {
            stats.symptoms.push(raw.data.totalSymptoms || 0);
            stats.diseases.push(raw.data.totalDiseases || 0);
            stats.procedures.push(raw.data.totalProcedures || 0);
          }
        } catch {}
      }

      const calcStats = (arr) => {
        if (arr.length === 0) return { avg: 0, median: 0, p25: 0, p75: 0, count: 0 };
        arr.sort((a, b) => a - b);
        return {
          avg: Math.round(arr.reduce((a, b) => a + b, 0) / arr.length),
          median: arr[Math.floor(arr.length / 2)],
          p25: arr[Math.floor(arr.length * 0.25)],
          p75: arr[Math.floor(arr.length * 0.75)],
          count: arr.length,
        };
      };

      const benchmark = {
        symptoms: calcStats(stats.symptoms),
        diseases: calcStats(stats.diseases),
        procedures: calcStats(stats.procedures),
        totalUsers: stats.symptoms.length,
      };

      await env.IWOR_KV.put(BM_CACHE_KEY, JSON.stringify({ benchmark, updatedAt: Date.now() }));
      return json({ ok: true, benchmark }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  マッチングプロフィール保存
    //  PUT /api/matching-profile
    //  Authorization: Bearer {sessionToken}
    // ══════════════════════════════════════════════════
    if (path === "/api/matching-profile" && request.method === "PUT") {
      const authResult = await authenticate(request, env);
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      const body = await parseBody(request);
      if (!body) return json({ error: "Invalid JSON" }, 400, request);
      if (!checkPayloadSize(body.data)) return json({ error: "Payload too large" }, 413, request);

      await env.IWOR_KV.put(`matching-profile:${authResult.email}`, JSON.stringify({
        data: body.data,
        updatedAt: new Date().toISOString(),
      }));

      return json({ ok: true, updatedAt: new Date().toISOString() }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  マッチングプロフィール読み込み
    //  GET /api/matching-profile
    //  Authorization: Bearer {sessionToken}
    // ══════════════════════════════════════════════════
    if (path === "/api/matching-profile" && request.method === "GET") {
      const authResult = await authenticate(request, env);
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      const raw = await env.IWOR_KV.get(`matching-profile:${authResult.email}`);

      if (!raw) return json({ ok: true, data: null }, 200, request);

      const parsed = JSON.parse(raw);
      return json({ ok: true, data: parsed.data, updatedAt: parsed.updatedAt }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  お気に入り同期（PRO認証必須）
    //  PUT /api/favorites — 保存
    //  GET /api/favorites — 読み込み
    // ══════════════════════════════════════════════════
    if (path === "/api/favorites" && request.method === "PUT") {
      const authResult = await authenticate(request, env);
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);
      const body = await parseBody(request);
      if (!body || !body.favorites) return json({ error: "favorites required" }, 400, request);
      await env.IWOR_KV.put(`favorites:${authResult.email}`, JSON.stringify({
        favorites: body.favorites,
        updatedAt: new Date().toISOString(),
      }));
      return json({ ok: true }, 200, request);
    }

    if (path === "/api/favorites" && request.method === "GET") {
      const authResult = await authenticate(request, env);
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);
      const raw = await env.IWOR_KV.get(`favorites:${authResult.email}`);
      if (!raw) return json({ ok: true, favorites: null }, 200, request);
      const parsed = JSON.parse(raw);
      return json({ ok: true, favorites: parsed.favorites, updatedAt: parsed.updatedAt }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  AI面接フィードバック
    //  POST /api/interview-feedback
    //  認証: Bearer {sessionToken} — PRO 20ラリー/日
    //  認証なし: IPベースで3ラリー/日（FREE体験用）
    //  Body: { mode, systemPrompt, userMessage, question, answer, profile }
    //  AI: Claude Haiku 4.5（自然な日本語のため）
    // ══════════════════════════════════════════════════
    if (path === "/api/interview-feedback" && request.method === "POST") {
      const auth = request.headers.get("Authorization") || "";
      const token = auth.replace("Bearer ", "").trim();
      let isPro = false;
      let userEmail = "";

      // PRO認証チェック（セッション有効期限も確認）
      if (token) {
        const sessionRaw = await env.IWOR_KV.get(`session:${token}`);
        if (sessionRaw) {
          try {
            const session = JSON.parse(sessionRaw);
            if (session.expiresAt && new Date(session.expiresAt) > new Date()) {
              isPro = true;
              userEmail = session.email || "";
            } else if (!session.expiresAt) {
              isPro = true; // 旧形式互換
            }
          } catch { isPro = true; } // パース失敗時はKV存在=PRO扱い
        }
      }

      const today = new Date().toISOString().slice(0, 10);

      // レート制限
      if (isPro) {
        // PRO: 1日20ラリー上限（コスト安全弁）
        const proRateKey = `rate:interview:pro:${userEmail || token}:${today}`;
        const proCount = parseInt(await env.IWOR_KV.get(proRateKey) || "0", 10);
        if (proCount >= 20) {
          return json({
            error: "rate_limited",
            message: "本日の上限（20回）に達しました。明日またお試しください。",
            remaining: 0,
          }, 429, request);
        }
        await env.IWOR_KV.put(proRateKey, String(proCount + 1), { expirationTtl: 86400 });
      } else {
        // FREE: IPベースで1日3セッション（各セッション内はラリー無制限）
        // sessionIdがあれば同一セッション内→カウントしない
        const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
        const body2 = await request.clone().json().catch(() => ({}));
        const sessionId = body2.sessionId || "";

        if (!sessionId) {
          // セッション開始時のみカウント（mode=interviewの最初のリクエスト）
          const rateKey = `rate:interview:${clientIP}:${today}`;
          const count = parseInt(await env.IWOR_KV.get(rateKey) || "0", 10);
          if (count >= 3) {
            return json({
              error: "rate_limited",
              message: "無料体験は1日3セッションまでです。PROプランで無制限に練習できます。",
              remaining: 0,
            }, 429, request);
          }
          // セッション開始時のみカウント増加（後続はsessionIdがあるのでスキップ）
        }
      }

      const body = await parseBody(request);
      if (!body) return json({ error: "Invalid JSON" }, 400, request);
      const { mode, systemPrompt, userMessage, question, answer, profile } = body;

      // Claude Haiku API呼び出し共通関数
      async function callClaude(system, userMsg, maxTokens = 400) {
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: maxTokens,
            system: system,
            messages: [{ role: "user", content: userMsg }],
          }),
        });
        if (!res.ok) {
          const errText = await res.text();
          throw new Error(`Claude API error ${res.status}: ${errText}`);
        }
        const data = await res.json();
        return data.content?.[0]?.text || "";
      }

      // ── 面接会話モード ──
      if (mode === "interview") {
        if (!userMessage) {
          return json({ error: "userMessage required" }, 400, request);
        }
        // systemPromptはフロントエンドから送られる（設定に応じて動的生成）
        const sysPrompt = systemPrompt || `あなたは日本の臨床研修マッチング面接の面接官です。
医学生の面接練習をしています。リアルな面接官として自然な日本語で応答してください。
1回の応答は2〜3文で簡潔に。面接官らしい口調を維持。`;

        try {
          const feedback = await callClaude(sysPrompt, userMessage, 300);
          return json({ ok: true, feedback, isPro, source: "claude-haiku" }, 200, request);
        } catch (err) {
          console.error("Claude API error:", err);
          // フォールバック: Workers AIを試行
          try {
            const aiResponse = await env.AI.run(
              "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
              { messages: [{ role: "system", content: sysPrompt }, { role: "user", content: userMessage }], max_tokens: 300 }
            );
            return json({ ok: true, feedback: aiResponse?.response || "", isPro, source: "workers-ai-fallback" }, 200, request);
          } catch (fbErr) {
            console.error("Fallback Workers AI error:", fbErr);
            return json({ error: "AI processing failed" }, 500, request);
          }
        }
      }

      // ── フィードバック/レポートモード ──
      const q = question || "";
      const a = answer || userMessage || "";
      if (!q || !a) {
        return json({ error: "question and answer required" }, 400, request);
      }

      const profileCtx = profile
        ? [
            profile.preferredSpecialty && `志望科: ${profile.preferredSpecialty}`,
            profile.university && `大学: ${profile.university}`,
            profile.strengths && `強み: ${profile.strengths}`,
            profile.motivation && `志望動機: ${profile.motivation}`,
          ].filter(Boolean).join("\n")
        : "";

      const feedbackPrompt = `あなたは日本の臨床研修マッチング面接の指導経験20年の面接コーチです。
面接の会話ログを分析し、実践的で具体的なフィードバックをJSON形式で出力してください。

必ず以下のJSON形式のみを出力してください（JSON以外のテキストは一切含めない）:

{
  "overallGrade": "B+",
  "goodPoints": [
    "志望動機に見学体験を具体的に盛り込めている",
    "将来のビジョンが明確で一貫性がある",
    "質問への応答が適切な長さにまとまっている"
  ],
  "improvements": [
    "「なぜ当院か」の回答が抽象的。面接官が深堀りせず次に進んだのは、興味を持たれなかった可能性がある",
    "短所の回答が表面的。もっと自分自身と向き合い、具体的なエピソードで語る必要がある",
    "逆質問の準備が不足。病院のプログラムについて調べた上での質問が望ましい"
  ],
  "questionFeedback": [
    {"question": "当院を志望した理由は？", "rating": 3, "comment": "概ね適切だが他院でも言える内容。見学時の具体エピソードが欲しい"},
    {"question": "長所と短所は？", "rating": 2, "comment": "短所の回答が浅く、面接官が深堀りしなかった。改善への取り組みを具体的に"}
  ],
  "nextAdvice": "次回は志望病院の見学体験を3つ以上メモしておき、志望動機に自然に織り込めるよう練習しましょう。また、短所について「どう克服しようとしているか」の具体例を準備してください。"
}

${profileCtx ? `\n受験者プロフィール:\n${profileCtx}` : ""}

評価基準:
- overallGrade: A+(素晴らしい), A(良い), B+(まずまず), B(普通), B-(もう一歩), C(要改善), D(大幅改善必要)
- rating: 1(不十分)-5(素晴らしい)
- 面接官が深堀りしなかった回答 → 面接官が興味を持たなかったと明確に指摘
- 甘い回答・準備不足 → 「もっと深く考える必要がある」と率直に指摘
- 良い点も悪い点も媚びずに評価。日本のマッチング面接の文脈で判断`;

      try {
        const feedback = await callClaude(feedbackPrompt, `面接の質問テーマ: ${q}\n\n面接の会話ログ:\n${a}`, 1200);
        return json({ ok: true, feedback, isPro }, 200, request);
      } catch (err) {
        console.error("Claude API error:", err);
        // フォールバック
        try {
          const aiResponse = await env.AI.run(
            "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
            { messages: [{ role: "system", content: feedbackPrompt }, { role: "user", content: `面接質問: ${q}\n\n受験者の回答:\n${a}` }], max_tokens: 800 }
          );
          return json({ ok: true, feedback: aiResponse?.response || "フィードバックを生成できませんでした。", isPro }, 200, request);
        } catch (fbErr) {
          console.error("Fallback error:", fbErr);
          return json({ error: "AI processing failed" }, 500, request);
        }
      }
    }

    // ═══════════════════════════════════════════════════════════════
    //  POST /api/journal/build — 手動DB構築（Admin）
    // ═══════════════════════════════════════════════════════════════
    if (path === "/api/journal/build" && request.method === "POST") {
      const adminKey = request.headers.get("X-Admin-Key") || new URL(request.url).searchParams.get("key") || "";
      if (!adminKey || adminKey !== env.ADMIN_KEY) {
        return json({ error: "Unauthorized" }, 401, request);
      }
      // Run build synchronously (fetch handler doesn't have ctx)
      try {
        await buildJournalDb(env);
        return json({ ok: true, message: "Journal DB build completed" }, 200, request);
      } catch (err) {
        return json({ ok: false, error: String(err) }, 500, request);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    //  GET /api/journal — 論文フィード（KVから完成データ配信）
    // ═══════════════════════════════════════════════════════════════
    if (path === "/api/journal" && request.method === "GET") {
      const url = new URL(request.url);
      const contentType = url.searchParams.get("type") || "articles";

      // ── ガイドライン検索モード ──
      if (contentType === "guidelines") {
        const specialties = (url.searchParams.get("specialties") || "").split(",").filter(Boolean);
        const GL_CACHE_KEY = `journal:guidelines:${specialties.sort().join(",")}`;
        const GL_CACHE_TTL = 86400; // 24時間

        try {
          const cached = await env.IWOR_KV.get(GL_CACHE_KEY, "json");
          if (cached && cached.fetchedAt && (Date.now() - cached.fetchedAt) / 1000 < GL_CACHE_TTL) {
            return json({ ok: true, articles: cached.articles, cached: true }, 200, request);
          }
        } catch {}

        // 診療科→学会名マッピング（全主要学会）
        const SOCIETY_MAP = {
          "循環器": ["Japanese Circulation Society", "Japan Atherosclerosis Society", "Japanese Society of Hypertension"],
          "呼吸器": ["Japanese Respiratory Society", "Japanese Society of Allergology"],
          "消化器": ["Japanese Society of Gastroenterology", "Japan Society of Hepatology"],
          "腎臓": ["Japanese Society of Nephrology"],
          "神経": ["Japanese Society of Neurology", "Japan Stroke Society"],
          "血液": ["Japanese Society of Hematology"],
          "感染症": ["Japanese Association for Infectious Diseases", "Japanese Society of Chemotherapy"],
          "内分泌": ["Japan Diabetes Society", "Japan Thyroid Association", "Japan Endocrine Society"],
          "リウマチ": ["Japan College of Rheumatology"],
          "腫瘍": ["Japanese Society of Clinical Oncology", "Japanese Society of Medical Oncology"],
          "皮膚科": ["Japanese Dermatological Association"],
          "精神科": ["Japanese Society of Psychiatry and Neurology"],
          "小児科": ["Japan Pediatric Society"],
          "救急": ["Japanese Association for Acute Medicine"],
          "集中治療": ["Japanese Society of Intensive Care Medicine"],
          "麻酔科": ["Japanese Society of Anesthesiologists"],
          "総合内科": ["Japanese Society of Internal Medicine"],
        };

        const societies = specialties.length > 0
          ? specialties.flatMap(sp => SOCIETY_MAP[sp] || [])
          : Object.values(SOCIETY_MAP).flat();

        if (societies.length === 0) {
          return json({ ok: true, articles: [], cached: false }, 200, request);
        }

        try {
          // 2段クエリ: Affiliation + (guideline OR consensus OR recommendation)
          const affTerms = societies.map(s => `"${s}"[Affiliation]`).join(" OR ");
          const q = encodeURIComponent(`(${affTerms}) AND (guideline[Title] OR practice guideline[Publication Type] OR consensus[Title] OR recommendation[Title] OR "clinical practice"[Title]) AND ("last 3 years"[dp])`);
          const sUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${q}&retmax=50&sort=date&retmode=json`;
          const sRes = await fetch(sUrl);
          const sData = await sRes.json();
          const ids = sData?.esearchresult?.idlist || [];

          if (ids.length === 0) {
            return json({ ok: true, articles: [], cached: false }, 200, request);
          }

          const fUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi?db=pubmed&id=${ids.join(",")}&retmode=json`;
          const fRes = await fetch(fUrl);
          const fData = await fRes.json();

          const articles = [];
          for (const id of ids) {
            const d = fData?.result?.[id];
            if (!d || !d.title) continue;
            articles.push({
              pmid: id,
              title: d.title || "",
              authors: (d.authors || []).slice(0, 3).map(a => a.name).join(", ") + ((d.authors || []).length > 3 ? " et al." : ""),
              journal: d.source || "",
              journalId: "",
              date: (d.pubdate || "").split(" ").slice(0, 2).join(" "),
              doi: (d.elocationid || "").replace("doi: ", ""),
              impactFactor: 0,
              isGuideline: true,
            });
          }

          // ガイドライン翻訳（DeepL → AI fallback、最大30件）
          const DEEPL_KEY = env.DEEPL_API_KEY || "";
          for (const article of articles.slice(0, 30)) {
            try {
              if (DEEPL_KEY) {
                const dlRes = await fetch("https://api-free.deepl.com/v2/translate", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", "Authorization": `DeepL-Auth-Key ${DEEPL_KEY}` },
                  body: JSON.stringify({ text: [article.title], source_lang: "EN", target_lang: "JA" }),
                });
                if (dlRes.ok) {
                  const dlData = await dlRes.json();
                  if (dlData?.translations?.[0]?.text) { article.titleJa = dlData.translations[0].text; continue; }
                }
              }
              const trResult = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
                messages: [
                  { role: "system", content: "Translate the following medical guideline title to Japanese. Output only the translation." },
                  { role: "user", content: article.title },
                ],
                max_tokens: 200,
              });
              if (trResult?.response) {
                const cleaned = trResult.response.trim().replace(/^["「]|["」]$/g, '');
                if (cleaned.length > 3) article.titleJa = cleaned;
              }
            } catch {}
          }

          const cacheData = { articles, fetchedAt: Date.now() };
          await env.IWOR_KV.put(GL_CACHE_KEY, JSON.stringify(cacheData), { expirationTtl: 86400 });

          return json({ ok: true, articles, cached: false }, 200, request);
        } catch (err) {
          console.error("Guideline fetch error:", err);
          return json({ ok: true, articles: [], cached: false }, 200, request);
        }
      }

      // ── 通常の論文フィードモード（KVから完成データを返すだけ） ──
      const lang = url.searchParams.get("lang") || "en";
      const sort = url.searchParams.get("sort") || "date";
      const DB_KEY = `journal:db:${lang}`;
      const ARCHIVE_KEY = `journal:archive:${lang}`;

      try {
        let allArticles = [];
        const db = await env.IWOR_KV.get(DB_KEY, "json");
        if (db?.articles) {
          allArticles = db.articles;
        }

        // ブックマーク並び替え時はアーカイブも含める
        if (sort !== "date" && allArticles.length > 0) {
          try {
            const archive = await env.IWOR_KV.get(ARCHIVE_KEY, "json");
            if (archive?.articles) {
              const existingPmids = new Set(allArticles.map(a => a.pmid));
              const archiveNew = archive.articles.filter(a => !existingPmids.has(a.pmid));
              allArticles = [...allArticles, ...archiveNew];
            }
          } catch {}
        }

        if (sort.startsWith("bm-")) {
          const bmTimeRaw = await env.IWOR_KV.get("journal:bookmark-events");
          const bmEvents = bmTimeRaw ? JSON.parse(bmTimeRaw) : {};
          const now = Date.now();
          const periods = { "bm-today": 86400000, "bm-week": 604800000, "bm-month": 2592000000, "bm-year": 31536000000 };
          const period = periods[sort] || 31536000000;
          allArticles.sort((a, b) => {
            const aEvents = (bmEvents[a.pmid] || []).filter(t => now - t < period).length;
            const bEvents = (bmEvents[b.pmid] || []).filter(t => now - t < period).length;
            return bEvents - aEvents || (b.impactFactor || 0) - (a.impactFactor || 0);
          });
        }

        return json({ ok: true, articles: allArticles.slice(0, 200), cached: true, updatedAt: db?.updatedAt || null, total: allArticles.length }, 200, request);
      } catch (err) {
        console.error("Journal DB read error:", err);
        return json({ ok: true, articles: [], cached: false }, 200, request);
      }
    }

    // ══════════════════════════════════════════════════
    //  EPOCデータ保存
    //  PUT /api/epoc
    //  Authorization: Bearer {sessionToken}
    // ══════════════════════════════════════════════════
    if (path === "/api/epoc" && request.method === "PUT") {
      const authResult = await authenticate(request, env, { checkExpiry: false });
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      const body = await parseBody(request);
      if (!body) return json({ error: "Invalid JSON" }, 400, request);
      if (!checkPayloadSize(body.data)) return json({ error: "Payload too large" }, 413, request);

      await env.IWOR_KV.put(`epoc:${authResult.email}`, JSON.stringify({
        data: body.data,
        updatedAt: new Date().toISOString(),
      }));

      return json({ ok: true, updatedAt: new Date().toISOString() }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  EPOCデータ読み込み
    //  GET /api/epoc
    //  Authorization: Bearer {sessionToken}
    // ══════════════════════════════════════════════════
    if (path === "/api/epoc" && request.method === "GET") {
      const authResult = await authenticate(request, env, { checkExpiry: false });
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      const raw = await env.IWOR_KV.get(`epoc:${authResult.email}`);

      if (!raw) return json({ ok: true, data: null }, 200, request);

      const parsed = JSON.parse(raw);
      return json({ ok: true, data: parsed.data, updatedAt: parsed.updatedAt }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  ストリーク同期
    //  PUT /api/streak
    //  Authorization: Bearer {sessionToken}
    //  Body: { count, best, lastDate, displayName }
    // ══════════════════════════════════════════════════
    if (path === "/api/streak" && request.method === "PUT") {
      const authResult = await authenticate(request, env, { checkExpiry: false });
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      const body = await parseBody(request);
      if (!body) return json({ error: "Invalid JSON" }, 400, request);

      const { email } = authResult;
      const count = parseInt(body.count, 10);
      const best = parseInt(body.best, 10);
      const lastDate = String(body.lastDate || "").trim();
      let displayName = String(body.displayName || "匿名医師").trim();

      // バリデーション
      if (isNaN(count) || count < 0 || isNaN(best) || best < 0) {
        return json({ error: "Invalid streak data" }, 400, request);
      }
      if (!/^\d{4}-\d{2}-\d{2}$/.test(lastDate)) {
        return json({ error: "Invalid date format" }, 400, request);
      }

      // lastDate === 今日（UTC+9）
      const now = new Date();
      const jst = new Date(now.getTime() + 9 * 60 * 60 * 1000);
      const todayJST = jst.toISOString().split("T")[0];
      if (lastDate !== todayJST) {
        return json({ error: "lastDate must be today (JST)" }, 400, request);
      }

      // displayName sanitize（HTMLタグ除去、8文字）
      displayName = displayName.replace(/<[^>]*>/g, "").slice(0, 8) || "匿名医師";

      // 既存値チェック（+1制限）
      const existingRaw = await env.IWOR_KV.get(`streak:${email}`);
      let finalCount = count;
      if (existingRaw) {
        const existing = JSON.parse(existingRaw);
        if (count > existing.count + 1) {
          finalCount = existing.count + 1;
        }
      }
      const finalBest = Math.max(finalCount, best);

      // KV書き込み
      await env.IWOR_KV.put(`streak:${email}`, JSON.stringify({
        count: finalCount, best: finalBest, lastDate, displayName,
        updatedAt: new Date().toISOString(),
      }));

      // leaderboard更新
      let leaderboard = [];
      try {
        const lbRaw = await env.IWOR_KV.get("streak:leaderboard");
        if (lbRaw) leaderboard = JSON.parse(lbRaw);
      } catch {}
      const idx = leaderboard.findIndex(e => e.email === email);
      const entry = { email, displayName, count: finalCount };
      if (idx >= 0) leaderboard[idx] = entry;
      else leaderboard.push(entry);
      leaderboard.sort((a, b) => b.count - a.count);
      leaderboard = leaderboard.slice(0, 200);
      await env.IWOR_KV.put("streak:leaderboard", JSON.stringify(leaderboard));

      const rank = leaderboard.findIndex(e => e.email === email) + 1;
      return json({ ok: true, rank, totalUsers: leaderboard.length }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  ストリークランキング取得
    //  GET /api/streak/ranking
    //  認証: 任意（認証ありでPRO/FREE分岐）
    // ══════════════════════════════════════════════════
    if (path === "/api/streak/ranking" && request.method === "GET") {
      let leaderboard = [];
      try {
        const lbRaw = await env.IWOR_KV.get("streak:leaderboard");
        if (lbRaw) leaderboard = JSON.parse(lbRaw);
      } catch {}

      // 認証試行（任意）
      let email = null;
      let isPro = false;
      const auth = request.headers.get("Authorization") || "";
      const token = auth.replace("Bearer ", "").trim();
      if (token) {
        const sessionRaw = await env.IWOR_KV.get(`session:${token}`);
        if (sessionRaw) {
          const session = JSON.parse(sessionRaw);
          email = session.email;
          const userRaw = await env.IWOR_KV.get(userKey(session.email));
          if (userRaw) {
            const user = JSON.parse(userRaw);
            isPro = !!(user.expiresAt && new Date() <= new Date(user.expiresAt));
          }
        }
      }

      // 自分の順位
      let myRank = null;
      let myStreak = 0;
      if (email) {
        const idx = leaderboard.findIndex(e => e.email === email);
        if (idx >= 0) {
          myRank = idx + 1;
          myStreak = leaderboard[idx].count;
        } else {
          // leaderboardに居ない場合、個別KVから取得
          try {
            const raw = await env.IWOR_KV.get(`streak:${email}`);
            if (raw) myStreak = JSON.parse(raw).count || 0;
          } catch {}
        }
      }

      // PRO: top50、FREE: top3（emailは除去）
      const limit = isPro ? 50 : 3;
      const board = leaderboard.slice(0, limit).map((e, i) => ({
        displayName: e.displayName,
        count: e.count,
        rank: i + 1,
      }));

      return json({
        leaderboard: board,
        myRank,
        myStreak,
        totalUsers: leaderboard.length,
        isPro,
      }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  学会カレンダー: 参加予定登録/解除
    //  PUT /api/conferences/attend
    //  Authorization: Bearer {sessionToken}
    //  Body: { conferenceId, action: "add"|"remove" }
    // ══════════════════════════════════════════════════
    if (path === "/api/conferences/attend" && request.method === "PUT") {
      const authResult = await authenticate(request, env, { checkExpiry: false });
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      const body = await parseBody(request);
      if (!body) return json({ error: "Invalid JSON" }, 400, request);

      const { email, user } = authResult;
      const conferenceId = String(body.conferenceId || "").trim();
      const action = String(body.action || "").trim();

      if (!conferenceId || !["add", "remove"].includes(action)) {
        return json({ error: "conferenceId and action (add/remove) required" }, 400, request);
      }

      // ユーザーの参加リスト取得
      let userData = { attending: [] };
      try {
        const raw = await env.IWOR_KV.get(`conf-user:${email}`);
        if (raw) userData = JSON.parse(raw);
      } catch {}

      const isPro = !!(user.expiresAt && new Date() <= new Date(user.expiresAt));

      if (action === "add") {
        if (userData.attending.includes(conferenceId)) {
          return json({ ok: true, attending: userData.attending }, 200, request);
        }
        // FREE: 最大3件
        if (!isPro && userData.attending.length >= 3) {
          return json({ error: "pro_required", message: "PRO会員なら無制限に追加できます" }, 403, request);
        }
        userData.attending.push(conferenceId);
      } else {
        userData.attending = userData.attending.filter(id => id !== conferenceId);
      }

      await env.IWOR_KV.put(`conf-user:${email}`, JSON.stringify(userData));

      // カウント更新
      const countKey = `conf-count:${conferenceId}`;
      let count = 0;
      try {
        const raw = await env.IWOR_KV.get(countKey);
        if (raw) count = parseInt(raw, 10) || 0;
      } catch {}
      count = Math.max(0, count + (action === "add" ? 1 : -1));
      await env.IWOR_KV.put(countKey, String(count));

      return json({ ok: true, attending: userData.attending, count }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  学会カレンダー: 参加予定者数一括取得
    //  GET /api/conferences/counts?ids=naika-2026,geka-2026,...
    //  認証: 任意（PRO/FREE分岐）
    // ══════════════════════════════════════════════════
    if (path === "/api/conferences/counts" && request.method === "GET") {
      const idsParam = url.searchParams.get("ids") || "";
      const ids = idsParam.split(",").filter(Boolean).slice(0, 50);

      // 認証試行（任意）
      let isPro = false;
      const authHeader = request.headers.get("Authorization") || "";
      const authToken = authHeader.replace("Bearer ", "").trim();
      if (authToken) {
        const sessionRaw = await env.IWOR_KV.get(`session:${authToken}`);
        if (sessionRaw) {
          const session = JSON.parse(sessionRaw);
          const uRaw = await env.IWOR_KV.get(userKey(session.email));
          if (uRaw) {
            const u = JSON.parse(uRaw);
            isPro = !!(u.expiresAt && new Date() <= new Date(u.expiresAt));
          }
        }
      }

      const counts = {};
      for (const id of ids) {
        try {
          const raw = await env.IWOR_KV.get(`conf-count:${id}`);
          const n = raw ? parseInt(raw, 10) || 0 : 0;
          counts[id] = isPro ? n : (n >= 10 ? "10+" : `${n}+`);
        } catch {
          counts[id] = isPro ? 0 : "0+";
        }
      }

      return json({ counts, blurred: !isPro }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  学会カレンダー: 自分の参加予定リスト
    //  GET /api/conferences/my
    //  Authorization: Bearer {sessionToken}
    // ══════════════════════════════════════════════════
    if (path === "/api/conferences/my" && request.method === "GET") {
      const authResult = await authenticate(request, env, { checkExpiry: false });
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      let userData = { attending: [] };
      try {
        const raw = await env.IWOR_KV.get(`conf-user:${authResult.email}`);
        if (raw) userData = JSON.parse(raw);
      } catch {}

      return json({ attending: userData.attending }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  専門医単位データ保存
    //  PUT /api/credits
    //  Authorization: Bearer {sessionToken}
    // ══════════════════════════════════════════════════
    if (path === "/api/credits" && request.method === "PUT") {
      const authResult = await authenticate(request, env, { checkExpiry: false });
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      const body = await parseBody(request);
      if (!body) return json({ error: "Invalid JSON" }, 400, request);
      if (!checkPayloadSize(body.data)) return json({ error: "Payload too large" }, 413, request);

      await env.IWOR_KV.put(`credits:${authResult.email}`, JSON.stringify({
        data: body.data,
        updatedAt: new Date().toISOString(),
      }));

      return json({ ok: true, updatedAt: new Date().toISOString() }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  専門医単位データ読み込み
    //  GET /api/credits
    //  Authorization: Bearer {sessionToken}
    // ══════════════════════════════════════════════════
    if (path === "/api/credits" && request.method === "GET") {
      const authResult = await authenticate(request, env, { checkExpiry: false });
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      const raw = await env.IWOR_KV.get(`credits:${authResult.email}`);

      if (!raw) return json({ ok: true, data: null }, 200, request);

      const parsed = JSON.parse(raw);
      return json({ ok: true, data: parsed.data, updatedAt: parsed.updatedAt }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  病院「気になる」トグル
    //  PUT /api/hospital/interest
    //  Authorization: Bearer {sessionToken}
    //  Body: { hospitalId, action: 'add'|'remove' }
    // ══════════════════════════════════════════════════
    if (path === "/api/hospital/interest" && request.method === "PUT") {
      const authResult = await authenticate(request, env, { checkExpiry: false });
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      const body = await parseBody(request);
      if (!body) return json({ error: "Invalid JSON" }, 400, request);

      const hospitalId = parseInt(body.hospitalId, 10);
      const action = body.action;
      if (isNaN(hospitalId) || (action !== "add" && action !== "remove")) {
        return json({ error: "Invalid params" }, 400, request);
      }

      const { email } = authResult;
      const userKey = `hospital_interest_user:${email}:${hospitalId}`;

      // 集計カウンタ読み込み
      let counts = {};
      try {
        const raw = await env.IWOR_KV.get("hospital_interest_counts");
        if (raw) counts = JSON.parse(raw);
      } catch {}

      const key = String(hospitalId);
      if (action === "add") {
        await env.IWOR_KV.put(userKey, "1");
        counts[key] = (counts[key] || 0) + 1;
      } else {
        const existed = await env.IWOR_KV.get(userKey);
        if (existed) {
          await env.IWOR_KV.delete(userKey);
          counts[key] = Math.max(0, (counts[key] || 0) - 1);
        }
      }

      await env.IWOR_KV.put("hospital_interest_counts", JSON.stringify(counts));
      return json({ ok: true, count: counts[key] || 0 }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  病院「気になる」集計取得
    //  GET /api/hospital/interest-counts
    //  認証不要（PRO判定はフロントエンド側）
    // ══════════════════════════════════════════════════
    if (path === "/api/hospital/interest-counts" && request.method === "GET") {
      let counts = {};
      try {
        const raw = await env.IWOR_KV.get("hospital_interest_counts");
        if (raw) counts = JSON.parse(raw);
      } catch {}

      return json({ ok: true, counts }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  競合アラート一覧
    //  GET /api/competitors/alerts?level=critical&competitor=HOKUTO
    //  管理者認証（X-Admin-Key）
    // ══════════════════════════════════════════════════
    if (path === "/api/competitors/alerts" && request.method === "GET") {
      const key = request.headers.get("X-Admin-Key");
      if (key !== env.ADMIN_KEY) return json({ error: "Forbidden" }, 403, request);

      const indexRaw = await env.IWOR_KV.get("competitor:alerts:index");
      const index = indexRaw ? JSON.parse(indexRaw) : [];

      // 最新100件を返す
      const recentIds = index.slice(-100).reverse();
      const alerts = [];
      for (const id of recentIds) {
        const raw = await env.IWOR_KV.get(`competitor:alert:${id}`);
        if (raw) alerts.push(JSON.parse(raw));
      }

      // クエリパラメータでフィルタ
      const filterLevel = url.searchParams.get("level");
      const filterCompetitor = url.searchParams.get("competitor");
      let filtered = alerts;
      if (filterLevel) filtered = filtered.filter(a => a.threatLevel === filterLevel);
      if (filterCompetitor) filtered = filtered.filter(a => a.competitor === filterCompetitor);

      return json({ ok: true, alerts: filtered, total: alerts.length }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  競合アラート非表示
    //  POST /api/competitors/dismiss
    //  Body: { id: "alert_..." }
    // ══════════════════════════════════════════════════
    if (path === "/api/competitors/dismiss" && request.method === "POST") {
      const key = request.headers.get("X-Admin-Key");
      if (key !== env.ADMIN_KEY) return json({ error: "Forbidden" }, 403, request);

      const body = await parseBody(request);
      if (!body || !body.id) return json({ error: "id required" }, 400, request);

      const raw = await env.IWOR_KV.get(`competitor:alert:${body.id}`);
      if (!raw) return json({ error: "Not found" }, 404, request);

      const alert = JSON.parse(raw);
      alert.dismissed = true;
      await env.IWOR_KV.put(`competitor:alert:${body.id}`, JSON.stringify(alert));

      return json({ ok: true }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  当直シフト NG日アンケート
    //  POST /api/shift/survey — アンケート作成（admin）
    //  GET  /api/shift/survey?id=xxx — アンケート取得
    //  POST /api/shift/survey/respond — 回答送信
    // ══════════════════════════════════════════════════

    // アンケート作成
    if (path === "/api/shift/survey" && request.method === "POST") {
      const body = await parseBody(request);
      if (!body || !body.groupName || !body.year || !body.month || !body.doctors) {
        return json({ error: "groupName, year, month, doctors required" }, 400, request);
      }
      const surveyId = crypto.randomUUID().slice(0, 8);
      // 各医師に個別トークンを生成
      const doctorTokens = {};
      const doctorsWithTokens = body.doctors.map(d => {
        const token = crypto.randomUUID().slice(0, 12);
        doctorTokens[d.id] = token;
        return { ...d, token };
      });
      const survey = {
        id: surveyId,
        groupName: body.groupName,
        year: body.year,
        month: body.month,
        doctors: doctorsWithTokens,
        deadline: body.deadline || null,
        createdAt: new Date().toISOString(),
        responses: {},
      };
      await env.IWOR_KV.put(`shift:survey:${surveyId}`, JSON.stringify(survey), { expirationTtl: 60 * 60 * 24 * 90 });
      // 個別URLリストを返す
      const urls = doctorsWithTokens.map(d => ({
        doctorId: d.id,
        name: d.name,
        url: `https://iwor.jp/shift/survey?id=${surveyId}&token=${d.token}`,
      }));
      return json({ ok: true, surveyId, urls }, 200, request);
    }

    // アンケート取得
    if (path === "/api/shift/survey" && request.method === "GET") {
      const surveyId = url.searchParams.get("id");
      if (!surveyId) return json({ error: "id required" }, 400, request);
      const raw = await env.IWOR_KV.get(`shift:survey:${surveyId}`);
      if (!raw) return json({ error: "not found" }, 404, request);
      const survey = JSON.parse(raw);
      const token = url.searchParams.get("token");
      if (token) {
        // 個別トークンアクセス: 対象医師の情報のみ返す
        const doctor = survey.doctors.find(d => d.token === token);
        if (!doctor) return json({ error: "invalid token" }, 403, request);
        const alreadyResponded = !!survey.responses[doctor.id];
        return json({ ok: true, survey: {
          id: survey.id, groupName: survey.groupName, year: survey.year, month: survey.month,
          deadline: survey.deadline, doctorName: doctor.name, doctorId: doctor.id,
          alreadyResponded,
        }}, 200, request);
      }
      // Admin: トークンを含めた全情報を返す（パスワードは除外）
      const safe = { ...survey, doctors: survey.doctors.map(d => ({ id: d.id, name: d.name, responded: !!survey.responses[d.id] })) };
      return json({ ok: true, survey: safe }, 200, request);
    }

    // 回答送信（個別トークン認証）
    if (path === "/api/shift/survey/respond" && request.method === "POST") {
      const body = await parseBody(request);
      if (!body || !body.surveyId || !body.token || !body.ngDays) {
        return json({ error: "surveyId, token, ngDays required" }, 400, request);
      }
      const raw = await env.IWOR_KV.get(`shift:survey:${body.surveyId}`);
      if (!raw) return json({ error: "survey not found" }, 404, request);
      const survey = JSON.parse(raw);

      // トークンで医師を特定
      const doctor = survey.doctors.find(d => d.token === body.token);
      if (!doctor) return json({ error: "invalid token" }, 403, request);

      // 回答済みチェック（1回限り）
      if (survey.responses[doctor.id]) {
        return json({ error: "already responded", doctorName: doctor.name }, 400, request);
      }

      // 締切チェック
      if (survey.deadline && new Date() > new Date(survey.deadline + "T23:59:59")) {
        return json({ error: "deadline passed" }, 400, request);
      }

      // 回答保存（トークンで特定した医師のIDで保存）
      survey.responses[doctor.id] = {
        name: doctor.name,
        ngDays: body.ngDays,
        respondedAt: new Date().toISOString(),
      };
      await env.IWOR_KV.put(`shift:survey:${body.surveyId}`, JSON.stringify(survey), { expirationTtl: 60 * 60 * 24 * 90 });
      return json({ ok: true }, 200, request);
    }

    // Admin: 回答取得（全回答+パスワード検証）
    if (path === "/api/shift/survey/results" && request.method === "POST") {
      const body = await parseBody(request);
      if (!body || !body.surveyId) return json({ error: "surveyId required" }, 400, request);
      const raw = await env.IWOR_KV.get(`shift:survey:${body.surveyId}`);
      if (!raw) return json({ error: "not found" }, 404, request);
      const survey = JSON.parse(raw);
      if (survey.password && body.password !== survey.password) {
        return json({ error: "invalid password" }, 403, request);
      }
      return json({ ok: true, survey }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  自己分析フォローアップ質問生成
    //  POST /api/generate-pr — AI自己PR/志望動機生成（文字数調整付き）
    //  Body: { type: 'pr'|'motivation', profile: {...}, maxChars: 400 }
    //  PRO認証必要
    // ══════════════════════════════════════════════════
    if (path === "/api/generate-pr" && request.method === "POST") {
      const body = await parseBody(request);
      if (!body || !body.type || !body.profile) return json({ error: "type and profile required" }, 400, request);

      const { type, profile, maxChars = 400 } = body;
      const p = profile;

      const prompts = {
        pr: `以下の医学生のプロフィールから、マッチング面接用の自己PRを${maxChars}文字以内で生成してください。
強み: ${p.strengths || p.strengthsList?.join('、') || '未設定'}
エピソード: ${p.strengthsEpisode || '未設定'}
部活: ${p.clubs || 'なし'} ${p.clubRole ? `(${p.clubRole})` : ''}
志望科: ${p.preferredSpecialty || '未設定'}
医師を目指した理由: ${p.doctorTrigger || p.motivation || '未設定'}

以下のルールを厳守:
- ${maxChars}文字以内（厳守）
- ですます調で統一
- 具体的なエピソードを含める
- 最後に「このような経験を活かし、貴院で〜」で締める
- 出力は本文のみ。「以下の文章を生成します」「志望動機として」等のメタ説明は絶対に含めない
- 英語を混ぜない。すべて日本語で書く
- 「participation」等の英単語を使わない`,

        motivation: `以下の医学生のプロフィールから、マッチング用の志望動機を${maxChars}文字以内で書いてください。
志望科: ${p.preferredSpecialty || '未設定'}
希望地域: ${p.preferredRegions?.join('・') || '未設定'}
医師を目指した理由: ${p.doctorTrigger || p.motivation || '未設定'}
将来像: ${p.goal5y || p.futureVision || '未設定'}
キャリアタイプ: ${p.careerTypes?.join('・') || p.doctorType?.join('・') || '未設定'}
強み: ${p.strengths || p.strengthsList?.join('、') || '未設定'}

以下のルールを厳守:
- ${maxChars}文字以内（厳守）
- ですます調で統一
- 具体的な理由と将来ビジョンを含める
- 「貴院の〇〇に惹かれ」のような病院特化部分は【病院名・特徴を記入】とプレースホルダにする
- 出力は本文のみ。「以下の文章を生成します」「志望動機として」等のメタ説明は絶対に含めない
- 英語を混ぜない。すべて日本語で書く`,
      };

      const prompt = prompts[type] || prompts.pr;

      const sysPrompt = "あなたは医師臨床研修マッチングの専門コンサルタントです。依頼された文章をそのまま出力してください。前置き・説明は一切不要です。本文のみを出力。すべて自然な日本語で書いてください。文字数制限は絶対に守ってください。";

      try {
        // Claude Haikuで生成（自然な日本語+文字数遵守）
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 600,
            system: sysPrompt,
            messages: [{ role: "user", content: prompt }],
          }),
        });

        let text = "";
        if (res.ok) {
          const data = await res.json();
          text = (data.content?.[0]?.text || "").trim();
        } else {
          // フォールバック: Workers AI
          const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [{ role: "system", content: sysPrompt }, { role: "user", content: prompt }],
            max_tokens: 600,
          });
          text = (result.response || "").trim();
        }

        // メタ説明の除去
        text = text.replace(/^.*?(生成します|以下に|以下の文章|志望動機として)[。．.、,]?\s*/s, '');
        // 文字数オーバーなら切り詰め
        const trimmed = text.length > maxChars ? text.slice(0, maxChars - 3) + "..." : text;
        return json({ ok: true, text: trimmed, chars: trimmed.length }, 200, request);
      } catch (err) {
        return json({ ok: false, error: String(err) }, 500, request);
      }
    }

    //  POST /api/self-analysis
    //  Body: { answers: { question: string, answer: string }[] }
    //  認証不要（個人情報なし・キャリア質問のみ）
    // ══════════════════════════════════════════════════
    if (path === "/api/self-analysis" && request.method === "POST") {
      const body = await parseBody(request);
      if (!body || !body.answers) return json({ error: "answers required" }, 400, request);

      const answers = body.answers.slice(-3); // 直近3回答のみ使用（コスト制限）
      const context = answers.map(a => `Q: ${a.question}\nA: ${a.answer}`).join("\n\n");

      const sysPrompt = "あなたは医師臨床研修マッチングのプロフェッショナルコンサルタントです。10年以上の経験で数百人の医学生を指導してきました。\n\n相手の回答パターンを分析し、以下の観点で最も効果的な1つのフォローアップ質問を生成してください：\n- 回答間の矛盾や一貫性の欠如があれば指摘する質問\n- 表面的な回答を具体的エピソードに落とし込む質問\n- 面接官が「この学生は深く考えている」と感じるレベルの洞察を引き出す質問\n- 医師のコアコンピテンシー（プロフェッショナリズム・患者中心・チーム医療・生涯学習）に紐づく質問\n\n質問は40文字以内で鋭く。選択肢は具体的なシナリオベースで4つ。出力はJSONのみ: {\"question\": \"...\", \"choices\": [\"...\", \"...\", \"...\", \"...\"]}";
      const userMsg = `以下のキャリアに関する回答を踏まえて、より深い自己分析を促すフォローアップ質問を1つ生成してください。\n\n${context}`;

      try {
        let text = "";
        // Claude Haikuで生成
        const res = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "x-api-key": env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "content-type": "application/json",
          },
          body: JSON.stringify({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 200,
            system: sysPrompt,
            messages: [{ role: "user", content: userMsg }],
          }),
        });
        if (res.ok) {
          const data = await res.json();
          text = data.content?.[0]?.text || "";
        } else {
          // フォールバック: Workers AI
          const result = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
            messages: [{ role: "system", content: sysPrompt }, { role: "user", content: userMsg }],
            max_tokens: 200,
          });
          text = result.response || "";
        }

        let parsed;
        try {
          const jsonMatch = text.match(/\{[\s\S]*\}/);
          parsed = jsonMatch ? JSON.parse(jsonMatch[0]) : null;
        } catch {
          parsed = null;
        }

        return json({ ok: true, followUp: parsed }, 200, request);
      } catch (err) {
        console.error("Self-analysis AI error:", err);
        return json({ ok: true, followUp: null }, 200, request);
      }
    }

    // ══════════════════════════════════════════════════
    //  論文コメント・ブックマーク集計
    //  GET /api/journal/comments?pmid=12345
    //  POST /api/journal/comments  Body: { pmid, text, displayName }（PRO認証）
    //  GET /api/journal/stats?pmids=12345,67890（ブックマーク数・コメント数）
    // ══════════════════════════════════════════════════

    // コメント取得
    if (path === "/api/journal/comments" && request.method === "GET") {
      const pmid = url.searchParams.get("pmid");
      if (!pmid) return json({ error: "pmid required" }, 400, request);
      const raw = await env.IWOR_KV.get(`journal:comments:${pmid}`);
      const comments = raw ? JSON.parse(raw) : [];
      return json({ ok: true, comments }, 200, request);
    }

    // コメント投稿（PRO認証）
    if (path === "/api/journal/comments" && request.method === "POST") {
      const authResult = await authenticate(request, env);
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      const body = await parseBody(request);
      if (!body || !body.pmid || !body.text) return json({ error: "pmid and text required" }, 400, request);

      const pmid = String(body.pmid);
      const raw = await env.IWOR_KV.get(`journal:comments:${pmid}`);
      const comments = raw ? JSON.parse(raw) : [];

      comments.push({
        id: `c_${Date.now()}`,
        text: String(body.text).slice(0, 500),
        displayName: String(body.displayName || '匿名医師').slice(0, 10),
        email: authResult.email,
        createdAt: new Date().toISOString(),
      });

      await env.IWOR_KV.put(`journal:comments:${pmid}`, JSON.stringify(comments), { expirationTtl: 7776000 }); // 90日

      // コメント数インデックス更新
      const statsRaw = await env.IWOR_KV.get("journal:stats");
      const stats = statsRaw ? JSON.parse(statsRaw) : {};
      if (!stats[pmid]) stats[pmid] = { comments: 0, bookmarks: 0 };
      stats[pmid].comments = comments.length;
      await env.IWOR_KV.put("journal:stats", JSON.stringify(stats));

      return json({ ok: true, comment: comments[comments.length - 1] }, 200, request);
    }

    // ブックマーク登録/解除（PRO認証）
    if (path === "/api/journal/bookmark" && request.method === "PUT") {
      const authResult = await authenticate(request, env);
      if (authResult.error) return json({ error: authResult.error }, authResult.status, request);

      const body = await parseBody(request);
      if (!body || !body.pmid) return json({ error: "pmid required" }, 400, request);

      const pmid = String(body.pmid);
      const action = body.action === 'remove' ? 'remove' : 'add';

      // ブックマーク数更新
      const statsRaw = await env.IWOR_KV.get("journal:stats");
      const stats = statsRaw ? JSON.parse(statsRaw) : {};
      if (!stats[pmid]) stats[pmid] = { comments: 0, bookmarks: 0 };
      stats[pmid].bookmarks = Math.max(0, stats[pmid].bookmarks + (action === 'add' ? 1 : -1));
      await env.IWOR_KV.put("journal:stats", JSON.stringify(stats));

      // ブックマークイベント記録（時間帯別ソート用）
      if (action === 'add') {
        const bmEventsRaw = await env.IWOR_KV.get("journal:bookmark-events");
        const bmEvents = bmEventsRaw ? JSON.parse(bmEventsRaw) : {};
        if (!bmEvents[pmid]) bmEvents[pmid] = [];
        bmEvents[pmid].push(Date.now());
        // 1年以上前のイベントを削除
        const oneYearAgo = Date.now() - 31536000000;
        bmEvents[pmid] = bmEvents[pmid].filter(t => t > oneYearAgo).slice(-1000);
        await env.IWOR_KV.put("journal:bookmark-events", JSON.stringify(bmEvents));
      }

      return json({ ok: true, bookmarks: stats[pmid].bookmarks }, 200, request);
    }

    // 記事統計一括取得
    if (path === "/api/journal/stats" && request.method === "GET") {
      const statsRaw = await env.IWOR_KV.get("journal:stats");
      const stats = statsRaw ? JSON.parse(statsRaw) : {};
      const pmids = (url.searchParams.get("pmids") || "").split(",").filter(Boolean);
      const result = {};
      for (const pmid of pmids) {
        result[pmid] = stats[pmid] || { comments: 0, bookmarks: 0 };
      }
      return json({ ok: true, stats: result }, 200, request);
    }

    // ── 404 ──
    return json({ error: "Not Found" }, 404, request);
  },

  // ══════════════════════════════════════════════════
  //  Cron Trigger: 競合監視（日次）
  //  PR TIMES RSS（医療カテゴリ）をフェッチしキーワードマッチ
  // ══════════════════════════════════════════════════
  async scheduled(event, env, ctx) {
    // ジャーナルDB構築（PubMed取得 + DeepL翻訳 + KV保存）
    try {
      await buildJournalDb(env);
    } catch (err) {
      console.error("Journal DB build error:", err);
    }

    // 競合監視（PR TIMES RSS）
    const PRTIMES_RSS = "https://prtimes.jp/topics/keyword/%E5%8C%BB%E7%99%82/feed";

    // 監視キーワード定義
    const TIER1_KEYWORDS = ["MOTiCAN", "HOKUTO", "ホクト"];
    const TIER2_KEYWORDS = ["ヒポクラ", "Antaa", "アンター", "m3", "エムスリー"];
    const TIER3_KEYWORDS = ["Ubie", "ユビー"];
    const GENERIC_KEYWORDS = ["医師向けアプリ", "医師AI", "J-OSLER", "ヘルステック調達", "医療AI", "臨床支援"];
    const ESCALATION_KEYWORDS = ["資金調達", "新機能", "買収", "提携", "リリース", "億円"];

    // 競合名マッピング
    const COMPETITOR_MAP = {
      "MOTiCAN": "MOTiCAN", "HOKUTO": "HOKUTO", "ホクト": "HOKUTO",
      "ヒポクラ": "ヒポクラ", "Antaa": "Antaa", "アンター": "Antaa",
      "m3": "m3", "エムスリー": "m3", "Ubie": "Ubie", "ユビー": "Ubie",
    };

    function classifyThreat(matchedKeywords) {
      const hasTier1 = matchedKeywords.some(k => TIER1_KEYWORDS.includes(k));
      const hasTier2 = matchedKeywords.some(k => TIER2_KEYWORDS.includes(k));
      const hasEscalation = matchedKeywords.some(k => ESCALATION_KEYWORDS.includes(k));

      if (hasTier1 && hasEscalation) return "critical";
      if (hasTier1 || (hasTier2 && hasEscalation)) return "high";
      if (hasTier2 || hasEscalation) return "medium";
      return "low";
    }

    function identifyCompetitor(matchedKeywords) {
      for (const k of matchedKeywords) {
        if (COMPETITOR_MAP[k]) return COMPETITOR_MAP[k];
      }
      return "その他";
    }

    try {
      const res = await fetch(PRTIMES_RSS, {
        headers: { "User-Agent": "iwor-competitive-intel/1.0" },
      });
      if (!res.ok) {
        console.error("PR TIMES fetch failed:", res.status);
        return;
      }

      const xml = await res.text();

      // 簡易XMLパース（<item>ブロックを抽出）
      const items = [];
      const itemRegex = /<item>([\s\S]*?)<\/item>/g;
      let match;
      while ((match = itemRegex.exec(xml)) !== null) {
        const block = match[1];
        const title = (block.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/) || block.match(/<title>(.*?)<\/title>/) || [])[1] || "";
        const link = (block.match(/<link>(.*?)<\/link>/) || [])[1] || "";
        const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";
        const desc = (block.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/) || block.match(/<description>(.*?)<\/description>/) || [])[1] || "";
        items.push({ title, link, pubDate, desc });
      }

      // 既存アラートインデックス取得
      const indexRaw = await env.IWOR_KV.get("competitor:alerts:index");
      const index = indexRaw ? JSON.parse(indexRaw) : [];
      const existingUrls = new Set();
      for (const id of index.slice(-200)) {
        const raw = await env.IWOR_KV.get(`competitor:alert:${id}`);
        if (raw) {
          const a = JSON.parse(raw);
          existingUrls.add(a.url);
        }
      }

      const ALL_KEYWORDS = [...TIER1_KEYWORDS, ...TIER2_KEYWORDS, ...TIER3_KEYWORDS, ...GENERIC_KEYWORDS, ...ESCALATION_KEYWORDS];
      const newAlerts = [];

      for (const item of items) {
        if (existingUrls.has(item.link)) continue;

        const text = item.title + " " + item.desc;
        const matched = ALL_KEYWORDS.filter(k => text.includes(k));
        if (matched.length === 0) continue;

        const id = `alert_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
        const alert = {
          id,
          title: item.title,
          url: item.link,
          source: "prtimes",
          matchedKeywords: matched,
          threatLevel: classifyThreat(matched),
          competitor: identifyCompetitor(matched),
          publishedAt: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          fetchedAt: new Date().toISOString(),
          dismissed: false,
        };

        await env.IWOR_KV.put(`competitor:alert:${id}`, JSON.stringify(alert), { expirationTtl: 7776000 });
        index.push(id);
        newAlerts.push(alert);
      }

      // インデックス更新（最新500件に制限）
      const trimmedIndex = index.slice(-500);
      await env.IWOR_KV.put("competitor:alerts:index", JSON.stringify(trimmedIndex));

      if (newAlerts.length > 0) {
        console.log(`Competitive intel: ${newAlerts.length} new alerts found`);
        // 将来: Slack/Discord webhook通知をここに追加
      }
    } catch (err) {
      console.error("Competitive intel cron error:", err);
    }
  },
};
