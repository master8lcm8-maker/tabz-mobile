// lib/api.ts

// 🚩 BACKEND BASE URL
// For Expo Web: localhost
// For real phone: change to your LAN IP (e.g. http://10.0.0.239:3000)
export const BASE_URL = "http://localhost:3000";

// ============================================================
// OPTION A (Stabilization) — DEV IDENTITY MODE
// Backend is stabilized to use ?userId= or x-user-id.
// JWT auth is quarantined, so Authorization headers are OFF by default.
// ============================================================
export const DEV_IDENTITY_MODE = true; // ✅ keep true during stabilization
export const DEFAULT_DEV_USER_ID = 3;

// If you ever re-enable auth later, flip this to true.
export const USE_AUTH_HEADER = false;

// 🔐 Fallback token (kept for future auth re-enable; not used in Option A)
const OWNER_FALLBACK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoib3duZXIzQHRhYnouYXBwIiwicm9sZSI6ImJ1eWVyIiwiaWF0IjoxNzY1NDQ4NjA1LCJleHAiOjE3NjYwNTM0MDV9.JvrLv35FAi9Wkvbm_E1DBqMVlmebbgPkHokvk68L4kk";

// 🔑 Stores real login tokens (if login is used later)
let accessToken: string | null = null;

// 🔧 Dev user id override (Option A)
let devUserId: number = DEFAULT_DEV_USER_ID;

// ----------------------------------------------------------------------------
// TOKEN HELPERS
// ----------------------------------------------------------------------------
export function setAuthToken(token: string | null) {
  accessToken = token;
}

export function getAuthToken(): string | null {
  return accessToken;
}

// ----------------------------------------------------------------------------
// DEV USER HELPERS (Option A)
// ----------------------------------------------------------------------------
export function setDevUserId(userId: number) {
  const n = Number(userId);
  if (Number.isFinite(n) && n > 0) devUserId = n;
}

export function getDevUserId(): number {
  return devUserId;
}

function getAuthHeaderIfEnabled() {
  if (!USE_AUTH_HEADER) return {};
  const token = accessToken ?? OWNER_FALLBACK_TOKEN;
  return { Authorization: `Bearer ${token}` };
}

function getDevIdentityHeaderIfEnabled() {
  if (!DEV_IDENTITY_MODE) return {};
  return { "x-user-id": String(devUserId) };
}

// ----------------------------------------------------------------------------
// REQUEST WRAPPER
// ----------------------------------------------------------------------------
async function request(method: "GET" | "POST", path: string, body?: any) {
  const url = BASE_URL + path;

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...getDevIdentityHeaderIfEnabled(),
      ...getAuthHeaderIfEnabled(),
    },
  };

  if (body !== undefined) {
    (init as any).body = JSON.stringify(body);
  }

  console.log(`🔍 ${method}`, url, body ?? "");

  try {
    const res = await fetch(url, init);
    console.log("📨 Response:", res.status);

    let data: any = null;
    try {
      data = await res.json();
      console.log("📦 JSON:", data);
    } catch (err) {
      console.log("❌ JSON PARSE ERROR:", err);
    }

    if (!res.ok) {
      throw new Error(
        `${method} ${path} failed: ${res.status} - ${JSON.stringify(data)}`
      );
    }

    return data;
  } catch (err) {
    console.log(`🔥 ERROR ${method} ${path}:`, err);
    throw err;
  }
}

export function apiGet(path: string) {
  return request("GET", path);
}

export function apiPost(path: string, body: any = {}) {
  return request("POST", path, body);
}

// ----------------------------------------------------------------------------
// LOGIN ENDPOINT (kept for later; may be unavailable during Option A quarantine)
// ----------------------------------------------------------------------------
export async function loginWithPassword(email: string, password: string) {
  const url = `${BASE_URL}/auth/login`;

  console.log("🔐 POST", url, email);

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  console.log("📨 Login status:", res.status);

  let data: any = null;
  try {
    data = await res.json();
    console.log("📦 Login JSON:", data);
  } catch (err) {
    console.log("❌ Login JSON parse error:", err);
  }

  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} - ${JSON.stringify(data)}`);
  }

  const token: string = data?.access_token || data?.accessToken || data?.token;

  if (!token) throw new Error("No access_token returned by backend");

  // Save real token
  setAuthToken(token);
}
