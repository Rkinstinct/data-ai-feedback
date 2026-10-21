// feedback-api — anonymous course feedback backend (Ariel DATA & AI)
// Anonymity by design: the only data stored is the answer fields themselves.
// No name, email, IP, user-agent, timestamp or any request metadata is persisted.

const ALLOWED_ORIGINS = [
  "https://rkinstinct.github.io",
  "http://localhost:8000",
  "http://127.0.0.1:8000",
];

const RATING_FIELDS = [
  "instructor_erez", "instructor_sima", "instructor_leon",
  "relevance_rating", "environment_rating", "overall_rating",
];
const COMMENT_FIELDS = [
  "instructor_comments", "relevance_comments", "environment_comments",
  "overall_comments", "improvement_comments",
];
const MAX_COMMENT_LEN = 2000;
const DAILY_CAP = 500; // global anti-flood cap; aggregate only, not tied to any person

function corsHeaders(request) {
  const origin = request.headers.get("Origin");
  const h = {
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type,Authorization",
    "Access-Control-Max-Age": "86400",
  };
  if (origin && ALLOWED_ORIGINS.includes(origin)) h["Access-Control-Allow-Origin"] = origin;
  return h;
}

function json(request, body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", ...corsHeaders(request) },
  });
}

async function sha256hex(text) {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqualHex(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

async function adminOk(request, env) {
  if (!env.ADMIN_PASSWORD) return { ok: false, reason: "not_configured" };
  const auth = request.headers.get("Authorization") || "";
  const pw = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!pw) return { ok: false, reason: "missing" };
  const [given, stored] = await Promise.all([sha256hex(pw), sha256hex(env.ADMIN_PASSWORD)]);
  return safeEqualHex(given, stored) ? { ok: true } : { ok: false, reason: "bad_password" };
}

async function handleSubmit(request, env) {
  let data;
  try { data = await request.json(); } catch { return json(request, { error: "בקשה לא תקינה" }, 400); }

  // Honeypot: real users never fill this hidden field
  if (data && data.website) return json(request, { ok: true }); // silently accept, store nothing

  const clean = {};
  for (const f of RATING_FIELDS) {
    const v = data ? data[f] : undefined;
    const n = typeof v === "string" ? parseInt(v, 10) : v;
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      return json(request, { error: "יש לבחור דירוג בכל השאלות (1-5)" }, 400);
    }
    clean[f] = n;
  }
  for (const f of COMMENT_FIELDS) {
    let v = data && data[f] != null ? String(data[f]) : "";
    v = v.trim().slice(0, MAX_COMMENT_LEN);
    clean[f] = v || null;
  }

  // Global daily flood cap (aggregate counter only)
  const day = new Date().toISOString().slice(0, 10);
  const row = await env.DB.prepare("SELECT value FROM meta WHERE key = 'day'").first();
  let count = 0;
  if (row && typeof row.value === "string" && row.value.startsWith(day + ":")) {
    count = parseInt(row.value.slice(day.length + 1), 10) || 0;
  }
  if (count >= DAILY_CAP) return json(request, { error: "המערכת עמוסה כרגע, נא לנסות מאוחר יותר" }, 429);
  await env.DB.prepare(
    "INSERT INTO meta (key, value) VALUES ('day', ?1) ON CONFLICT(key) DO UPDATE SET value = ?1"
  ).bind(`${day}:${count + 1}`).run();

  await env.DB.prepare(
    `INSERT INTO responses (id, ${RATING_FIELDS.concat(COMMENT_FIELDS).join(", ")})
     VALUES (?${",?".repeat(RATING_FIELDS.length + COMMENT_FIELDS.length)})`
  ).bind(crypto.randomUUID(), ...RATING_FIELDS.concat(COMMENT_FIELDS).map((f) => clean[f])).run();

  return json(request, { ok: true });
}

async function handleResults(request, env) {
  const auth = await adminOk(request, env);
  if (!auth.ok) {
    if (auth.reason === "not_configured") return json(request, { error: "not_configured" }, 503);
    return json(request, { error: "unauthorized" }, 401);
  }
  const { results } = await env.DB.prepare(
    `SELECT id, ${RATING_FIELDS.concat(COMMENT_FIELDS).join(", ")} FROM responses`
  ).all();
  // Shuffle so no submission order (and thus no timing inference) is exposed
  const rows = results || [];
  for (let i = rows.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  return json(request, { count: rows.length, responses: rows });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request) });
    try {
      if (url.pathname === "/api/health") return json(request, { ok: true, service: "feedback-api" });
      if (url.pathname === "/api/submit" && request.method === "POST") return await handleSubmit(request, env);
      if (url.pathname === "/api/admin/check" && request.method === "POST") {
        const auth = await adminOk(request, env);
        return json(request, auth.ok ? { ok: true } : { ok: false, reason: auth.reason }, auth.ok ? 200 : auth.reason === "not_configured" ? 503 : 401);
      }
      if (url.pathname === "/api/admin/results" && request.method === "GET") return await handleResults(request, env);
      return json(request, { error: "not_found" }, 404);
    } catch (e) {
      return json(request, { error: "server_error" }, 500);
    }
  },
};
