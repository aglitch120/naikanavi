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
    "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Key,X-Admin-Key",
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
        return json({ error: "注文番号が見つかりません。購入時の注文確認メールに記載の番号をご確認ください。" }, 404, request);
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
    //  パスワードリセット
    //  POST /api/reset-password
    //  Body: { orderNumber, email }
    //  → 注文番号+メールが一致すれば新パスワード発行
    // ══════════════════════════════════════════════════
    if (path === "/api/reset-password" && request.method === "POST") {
      const body = await request.json();
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

      // 新パスワード生成
      const newPassword = generatePassword();
      const newPasswordHash = await sha256(newPassword + email + SALT);

      // ユーザー情報更新
      await env.IWOR_KV.put(
        userKey(email),
        JSON.stringify({
          ...user,
          passwordHash: newPasswordHash,
          passwordResetAt: new Date().toISOString(),
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
      const auth = request.headers.get("Authorization") || "";
      const token = auth.replace("Bearer ", "").trim();
      if (!token) return json({ error: "Unauthorized" }, 401, request);

      const sessionRaw = await env.IWOR_KV.get(`session:${token}`);
      if (!sessionRaw) return json({ error: "Invalid session" }, 401, request);

      const session = JSON.parse(sessionRaw);
      const userRaw = await env.IWOR_KV.get(userKey(session.email));
      if (!userRaw) return json({ error: "User not found" }, 404, request);

      const user = JSON.parse(userRaw);
      const body = await request.json();

      // プロフィールフィールドを更新（既存フィールドは保持）
      const updatedUser = {
        ...user,
        role: String(body.role || "").trim() || user.role,
        university: String(body.university || "").trim() || user.university,
        graduationYear: String(body.graduationYear || "").trim() || user.graduationYear,
        hospitalSize: String(body.hospitalSize || "").trim() || user.hospitalSize,
        specialty: String(body.specialty || "").trim() || user.specialty,
        profileUpdatedAt: new Date().toISOString(),
      };

      await env.IWOR_KV.put(userKey(session.email), JSON.stringify(updatedUser));

      return json({ ok: true }, 200, request);
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
    //  J-OSLERデータ保存
    //  PUT /api/josler
    //  Authorization: Bearer {sessionToken}
    // ══════════════════════════════════════════════════
    if (path === "/api/josler" && request.method === "PUT") {
      const auth = request.headers.get("Authorization") || "";
      const token = auth.replace("Bearer ", "").trim();
      if (!token) return json({ error: "Unauthorized" }, 401, request);

      const sessionRaw = await env.IWOR_KV.get(`session:${token}`);
      if (!sessionRaw) return json({ error: "Invalid session" }, 401, request);

      const session = JSON.parse(sessionRaw);
      const body = await request.json();

      await env.IWOR_KV.put(`josler:${session.email}`, JSON.stringify({
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
      const auth = request.headers.get("Authorization") || "";
      const token = auth.replace("Bearer ", "").trim();
      if (!token) return json({ error: "Unauthorized" }, 401, request);

      const sessionRaw = await env.IWOR_KV.get(`session:${token}`);
      if (!sessionRaw) return json({ error: "Invalid session" }, 401, request);

      const session = JSON.parse(sessionRaw);
      const raw = await env.IWOR_KV.get(`josler:${session.email}`);

      if (!raw) return json({ ok: true, data: null }, 200, request);

      const parsed = JSON.parse(raw);
      return json({ ok: true, data: parsed.data, updatedAt: parsed.updatedAt }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  マッチングプロフィール保存
    //  PUT /api/matching-profile
    //  Authorization: Bearer {sessionToken}
    // ══════════════════════════════════════════════════
    if (path === "/api/matching-profile" && request.method === "PUT") {
      const auth = request.headers.get("Authorization") || "";
      const token = auth.replace("Bearer ", "").trim();
      if (!token) return json({ error: "Unauthorized" }, 401, request);

      const sessionRaw = await env.IWOR_KV.get(`session:${token}`);
      if (!sessionRaw) return json({ error: "Invalid session" }, 401, request);

      const session = JSON.parse(sessionRaw);
      const body = await request.json();

      await env.IWOR_KV.put(`matching-profile:${session.email}`, JSON.stringify({
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
      const auth = request.headers.get("Authorization") || "";
      const token = auth.replace("Bearer ", "").trim();
      if (!token) return json({ error: "Unauthorized" }, 401, request);

      const sessionRaw = await env.IWOR_KV.get(`session:${token}`);
      if (!sessionRaw) return json({ error: "Invalid session" }, 401, request);

      const session = JSON.parse(sessionRaw);
      const raw = await env.IWOR_KV.get(`matching-profile:${session.email}`);

      if (!raw) return json({ ok: true, data: null }, 200, request);

      const parsed = JSON.parse(raw);
      return json({ ok: true, data: parsed.data, updatedAt: parsed.updatedAt }, 200, request);
    }

    // ══════════════════════════════════════════════════
    //  AI面接フィードバック
    //  POST /api/interview-feedback
    //  認証: Bearer {sessionToken} — PRO無制限
    //  認証なし: IPベースで5ラリー/日（FREE体験用）
    //  Body: { mode, systemPrompt, userMessage, profile }
    // ══════════════════════════════════════════════════
    if (path === "/api/interview-feedback" && request.method === "POST") {
      const auth = request.headers.get("Authorization") || "";
      const token = auth.replace("Bearer ", "").trim();
      let isPro = false;

      // PRO認証チェック（任意）
      if (token) {
        const sessionRaw = await env.IWOR_KV.get(`session:${token}`);
        if (sessionRaw) isPro = true;
      }

      // FREE: IPベースレート制限（5ラリー/日）
      if (!isPro) {
        const clientIP = request.headers.get("CF-Connecting-IP") || "unknown";
        const rateKey = `rate:interview:${clientIP}:${new Date().toISOString().slice(0, 10)}`;
        const countRaw = await env.IWOR_KV.get(rateKey);
        const count = countRaw ? parseInt(countRaw, 10) : 0;

        if (count >= 5) {
          return json({
            error: "rate_limited",
            message: "無料体験は1日5ラリーまでです。PRO会員で無制限に使えます。",
            remaining: 0,
          }, 429, request);
        }

        // カウント増加（24時間TTL）
        await env.IWOR_KV.put(rateKey, String(count + 1), { expirationTtl: 86400 });
      }

      const body = await request.json();
      const { mode, systemPrompt, userMessage, question, answer, profile } = body;

      // 面接会話モード
      if (mode === "interview") {
        if (!systemPrompt || !userMessage) {
          return json({ error: "systemPrompt and userMessage required" }, 400, request);
        }
        try {
          const aiResponse = await env.AI.run(
            "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
            {
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userMessage },
              ],
              max_tokens: 300,
            }
          );
          const feedback = aiResponse?.response || "";
          return json({ ok: true, feedback, isPro, source: "workers-ai" }, 200, request);
        } catch (err) {
          console.error("Workers AI error:", err);
          return json({ error: "AI processing failed", detail: err.message }, 500, request);
        }
      }

      // フィードバックモード（旧互換 + mode="feedback"）
      const q = question || systemPrompt || "";
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

      const feedbackPrompt = `あなたは医学部マッチング面接の指導経験豊富な面接コーチです。
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
              { role: "system", content: feedbackPrompt },
              { role: "user", content: `面接質問: ${q}\n\n受験者の回答:\n${a}` },
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

    // ═══════════════════════════════════════════════════════════════
    //  GET /api/journal — 論文フィード（サーバーサイドキャッシュ）
    // ═══════════════════════════════════════════════════════════════
    if (path === "/api/journal" && request.method === "GET") {
      const CACHE_KEY = "journal:articles";
      const CACHE_TTL = 3600; // 1時間（秒）

      // KVキャッシュ確認
      try {
        const cached = await env.IWOR_KV.get(CACHE_KEY, "json");
        if (cached && cached.fetchedAt) {
          const age = (Date.now() - cached.fetchedAt) / 1000;
          if (age < CACHE_TTL) {
            return json({ ok: true, articles: cached.articles, cached: true, age: Math.round(age) }, 200, request);
          }
        }
      } catch (e) {
        // キャッシュ読み取り失敗は無視してフェッチへ
      }

      // PubMedから取得
      const JOURNALS = [
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
      ];

      try {
        const issns = JOURNALS.map(j => j.issn);
        const q = encodeURIComponent(`(${issns.map(i => `${i}[ISSN]`).join(" OR ")}) AND ("last 60 days"[dp])`);
        const sUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${q}&retmax=100&sort=date&retmode=json`;
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
          const jTitle = (d.fulljournalname || d.source || "").toLowerCase();
          const mj = JOURNALS.find(j =>
            jTitle.includes(j.shortName.toLowerCase()) || d.issn === j.issn
          );
          articles.push({
            pmid: id,
            title: d.title || "",
            authors: (d.authors || []).slice(0, 3).map(a => a.name).join(", ") + ((d.authors || []).length > 3 ? " et al." : ""),
            journal: mj?.shortName || d.source || "",
            journalId: mj?.id || "",
            date: (d.pubdate || d.sortpubdate || "").split(" ").slice(0, 2).join(" "),
            doi: (d.elocationid || "").replace("doi: ", ""),
            impactFactor: mj?.impactFactor || 0,
          });
        }

        articles.sort((a, b) => b.impactFactor - a.impactFactor || b.date.localeCompare(a.date));

        // KVに保存
        const cacheData = { articles, fetchedAt: Date.now() };
        await env.IWOR_KV.put(CACHE_KEY, JSON.stringify(cacheData));

        return json({ ok: true, articles, cached: false }, 200, request);
      } catch (err) {
        console.error("Journal fetch error:", err);
        // フェッチ失敗時は古いキャッシュを返す
        try {
          const stale = await env.IWOR_KV.get(CACHE_KEY, "json");
          if (stale?.articles) {
            return json({ ok: true, articles: stale.articles, cached: true, stale: true }, 200, request);
          }
        } catch (e) {}
        return json({ error: "PubMed fetch failed" }, 502, request);
      }
    }

    // ── 404 ──
    return json({ error: "Not Found" }, 404, request);
  },
};
