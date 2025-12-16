// components/lib/api.ts

// 🚩 BACKEND BASE URL
// Expo Web + your LAN backend (LOCKED)
export const BASE_URL = "http://10.0.0.239:3000";

// 🔐 Fallback Owner3 token — LOCKED working token
const OWNER_FALLBACK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoib3duZXIzQHRhYnouYXBwIiwicm9sZSI6ImJ1eWVyIiwiaWF0IjoxNzY1NTkzNDg4LCJleHAiOjE3NjYxOTgyODh9.5dP5v6k_mmyCVRzIhLyFE00lV6kaV8SWFpLhtGMJJs4";

// 🔑 Stores real login tokens (if login is used later)
let accessToken: string | null = null;

// 🔒 DEV user resolver (LOCKED): always resolve as userId=3 unless explicitly overridden
let devUserId: string = "3";

export function setDevUserId(userId: string) {
  devUserId = String(userId || "3");
}

function getUserHeader() {
  return { "x-user-id": devUserId };
}

// ----------------------------------------------------------------------------
// TOKEN HELPERS
// ----------------------------------------------------------------------------
export function setAuthToken(token: string | null) {
  accessToken = token;
}

export function getAuthToken(): string | null {
  return accessToken;
}

function getAuthHeader() {
  const token = accessToken ?? OWNER_FALLBACK_TOKEN;
  return { Authorization: `Bearer ${token}` };
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
      ...getAuthHeader(),
      ...getUserHeader(), // ✅ LOCKED: enforce userId=3 via x-user-id
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
// LOGIN ENDPOINT
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
