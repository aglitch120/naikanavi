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
//    PUT  /api/dashboard        — ダッシュボードデータ保存
//    GET  /api/dashboard        — ダッシュボードデータ読み込み
//    POST /api/interview-feedback — AI面接フィードバック（Workers AI）
//    GET  /api/admin/orders     — 管理者: 注文一覧
//    GET  /api/admin/users      — 管理者: ユーザー一覧
//    POST /api/admin/add-order  — 管理者: 手動で注文追加
//    DELETE /api/admin/order    — 管理者: 注文削除
// ═══════════════════════════════════════════════════════════════

const ALLOWED_ORIGINS = ["https://iwor.jp", "http://localhost:3000"];

function getCors(request) {
  const origin = request?.headers?.get("Origin") || "";
  const allowed = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
  return {
    "Access-Control-Allow-Origin": allowed,
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,X-Api-Key,X-Admin-Key",
    "Vary": "Origin",
  };
}

const json = (data, status = 200, request = null) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json", ...getCors(request) },
  });

// ── 暗号化ユーティリティ ──
async function sha256(str) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, "0")).join("");
}

function generatePassword() {
  const chars = "abcdefghjkmnpqrstuvwxyz23456789";
  const arr = new Uint8Array(8);
  crypto.getRandomValues(arr);
  return Array.from(arr).map(b => chars[b % chars.length]).join("");
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

      const { orderNumber, productName, buyerEmail } = await request.json();
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
      const body = await request.json();
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
        return json({ error: "注文番号が見つかりません。BOOTHの注文確認メールに記載の番号をご確認ください。" }, 404, request);
      }
      const order = JSON.parse(orderRaw);

      if (order.used) {
        return json({ error: `この注文番号は登録済みです。ログインしてください。` }, 409, request);
      }

      // メール重複チェック
      const existingUser = await env.IWOR_KV.get(userKey(email));
      if (existingUser) {
        return json({ error: "このメールアドレスは既に登録されています。ログインしてください。" }, 409, request);
      }

      // パスワード生成＆ハッシュ化
      const password = generatePassword();
      const passwordHash = await sha256(password + email + SALT);

      // 有効期限計算
      const now = new Date();
      const expiresAt = new Date(now.getTime() + order.durationDays * 24 * 60 * 60 * 1000);

      // ユーザー作成
      await env.IWOR_KV.put(
        userKey(email),
        JSON.stringify({
          email,
          passwordHash,
          plan: order.plan,
          durationDays: order.durationDays,
          orderNumber,
          registeredAt: now.toISOString(),
          expiresAt: expiresAt.toISOString(),
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
      const body = await request.json();
      const email = String(body.email || "").trim().toLowerCase();
      const password = String(body.password || "");

      if (!email || !password) {
        return json({ error: "メールアドレスとパスワードを入力してください" }, 400, request);
      }

      const userRaw = await env.IWOR_KV.get(userKey(email));
      if (!userRaw) {
        return json({ error: "アカウントが見つかりません。先に会員登録してください。" }, 404, request);
      }

      const user = JSON.parse(userRaw);
      const inputHash = await sha256(password + email + SALT);

      if (inputHash !== user.passwordHash) {
        return json({ error: "パスワードが正しくありません。" }, 401, request);
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
    //  管理者: 注文一覧
    //  GET /api/admin/orders?key={ADMIN_KEY}
    // ══════════════════════════════════════════════════
    if (path === "/api/admin/orders" && request.method === "GET") {
      const key = url.searchParams.get("key");
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
    //  GET /api/admin/users?key={ADMIN_KEY}
    // ══════════════════════════════════════════════════
    if (path === "/api/admin/users" && request.method === "GET") {
      const key = url.searchParams.get("key");
      if (key !== env.ADMIN_KEY) return json({ error: "Forbidden" }, 403, request);

      const list = await env.IWOR_KV.list({ prefix: "user:" });
      const users = [];
      for (const item of list.keys) {
        const raw = await env.IWOR_KV.get(item.name);
        if (raw) {
          const user = JSON.parse(raw);
          delete user.passwordHash; // パスワードハッシュは返さない
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

      const { orderNumber, productName, buyerEmail } = await request.json();
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
    //  DELETE /api/admin/order?key={ADMIN_KEY}&order={orderNumber}
    // ══════════════════════════════════════════════════
    if (path === "/api/admin/order" && request.method === "DELETE") {
      const key = url.searchParams.get("key");
      if (key !== env.ADMIN_KEY) return json({ error: "Forbidden" }, 403, request);

      const orderNumber = url.searchParams.get("order");
      if (!orderNumber) return json({ error: "order param required" }, 400, request);

      await env.IWOR_KV.delete(orderKey(orderNumber));
      return json({ ok: true, deleted: orderNumber }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  ダッシュボードデータ保存
    //  PUT /api/dashboard
    //  Authorization: Bearer {sessionToken}
    // ══════════════════════════════════════════════════
    if (path === "/api/dashboard" && request.method === "PUT") {
      const auth = request.headers.get("Authorization") || "";
      const token = auth.replace("Bearer ", "").trim();
      if (!token) return json({ error: "Unauthorized" }, 401, request);

      const sessionRaw = await env.IWOR_KV.get(`session:${token}`);
      if (!sessionRaw) return json({ error: "Invalid session" }, 401, request);

      const session = JSON.parse(sessionRaw);
      const body = await request.json();

      await env.IWOR_KV.put(`dashboard:${session.email}`, JSON.stringify({
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
      const auth = request.headers.get("Authorization") || "";
      const token = auth.replace("Bearer ", "").trim();
      if (!token) return json({ error: "Unauthorized" }, 401, request);

      const sessionRaw = await env.IWOR_KV.get(`session:${token}`);
      if (!sessionRaw) return json({ error: "Invalid session" }, 401, request);

      const session = JSON.parse(sessionRaw);
      const raw = await env.IWOR_KV.get(`dashboard:${session.email}`);

      if (!raw) return json({ ok: true, data: null }, 200, request);

      const parsed = JSON.parse(raw);
      return json({ ok: true, data: parsed.data, updatedAt: parsed.updatedAt }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  AI面接フィードバック
    //  POST /api/interview-feedback
    //  Authorization: Bearer {sessionToken}
    //  Body: { question, answer, profile }
    // ══════════════════════════════════════════════════
    if (path === "/api/interview-feedback" && request.method === "POST") {
      const auth = request.headers.get("Authorization") || "";
      const token = auth.replace("Bearer ", "").trim();
      if (!token) return json({ error: "Unauthorized" }, 401, request);

      const sessionRaw = await env.IWOR_KV.get(`session:${token}`);
      if (!sessionRaw) return json({ error: "Invalid session" }, 401, request);

      const body = await request.json();
      const { question, answer, profile } = body;
      if (!question || !answer) {
        return json({ error: "question and answer required" }, 400, request);
      }

      // プロフィール情報をコンテキストに変換
      const profileCtx = profile
        ? [
            profile.preferredSpecialty && `志望科: ${profile.preferredSpecialty}`,
            profile.university && `大学: ${profile.university}`,
            profile.strengths && `強み: ${profile.strengths}`,
            profile.motivation && `志望動機: ${profile.motivation}`,
          ].filter(Boolean).join("\n")
        : "";

      const systemPrompt = `あなたは医学部マッチング面接の指導経験豊富な面接コーチです。
医学生の面接回答に対して、実践的で具体的なフィードバックを日本語で提供してください。

以下の構成で回答してください（各セクション2-3文、合計300字程度）:

【全体評価】回答の印象と完成度を一言で
【良い点】具体的に良かった部分
【改善ポイント】具体的な改善案（例文があれば短く示す）
【次のステップ】次に意識すべきこと

${profileCtx ? `\n受験者プロフィール:\n${profileCtx}` : ""}

注意:
- 医学部マッチング面接の文脈で評価する
- 具体的で実行可能なアドバイスを心がける
- 厳しすぎず、建設的なトーンで`;

      try {
        const aiResponse = await env.AI.run(
          "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
          {
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `面接質問: ${question}\n\n受験者の回答:\n${answer}` },
            ],
            max_tokens: 800,
          }
        );

        const feedback = aiResponse?.response || "フィードバックを生成できませんでした。もう一度お試しください。";
        return json({ ok: true, feedback }, 200, request);
      } catch (err) {
        console.error("Workers AI error:", err);
        return json({ error: "AI processing failed", detail: err.message }, 500, request);
      }
    }

    // ── 404 ──
    return json({ error: "Not Found" }, 404, request);
  },
};
