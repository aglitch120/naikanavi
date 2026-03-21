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

      const body = await parseBody(request);
      if (!body) return json({ error: "Invalid JSON" }, 400, request);
      const { mode, userMessage, question, answer, profile } = body;

      // 面接会話モード（systemPromptはサーバー側で固定）
      const INTERVIEW_SYSTEM_PROMPT = `あなたは医学部マッチング面接の面接官です。
医学生が面接練習をしています。リアルな面接官として振る舞い、日本語で応答してください。
- 1回の応答は2〜3文で簡潔に
- 面接官らしい口調を維持
- 適切にフォローアップ質問をする`;

      if (mode === "interview") {
        if (!userMessage) {
          return json({ error: "userMessage required" }, 400, request);
        }
        try {
          const aiResponse = await env.AI.run(
            "@cf/meta/llama-3.1-8b-instruct-fp8-fast",
            {
              messages: [
                { role: "system", content: INTERVIEW_SYSTEM_PROMPT },
                { role: "user", content: userMessage },
              ],
              max_tokens: 300,
            }
          );
          const feedback = aiResponse?.response || "";
          return json({ ok: true, feedback, isPro, source: "workers-ai" }, 200, request);
        } catch (err) {
          console.error("Workers AI error:", err);
          return json({ error: "AI processing failed" }, 500, request);
        }
      }

      // フィードバックモード（旧互換 + mode="feedback"）
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
        return json({ error: "AI processing failed" }, 500, request);
      }
    }

    // ═══════════════════════════════════════════════════════════════
    //  GET /api/journal — 論文フィード（サーバーサイドキャッシュ）
    // ═══════════════════════════════════════════════════════════════
    if (path === "/api/journal" && request.method === "GET") {
      const url = new URL(request.url);
      const lang = url.searchParams.get("lang") || "en";
      const CACHE_KEY = `journal:articles:${lang}`;
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

      const JOURNALS = lang === "ja" ? JA_JOURNALS : EN_JOURNALS;

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

    // ── 404 ──
    return json({ error: "Not Found" }, 404, request);
  },

  // ══════════════════════════════════════════════════
  //  Cron Trigger: 競合監視（日次）
  //  PR TIMES RSS（医療カテゴリ）をフェッチしキーワードマッチ
  // ══════════════════════════════════════════════════
  async scheduled(event, env, ctx) {
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
