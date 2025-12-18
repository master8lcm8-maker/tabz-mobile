// components/lib/api.ts

// Default backend base URL (can be overridden via setBaseUrl)
let BASE_URL = "http://10.0.0.239:3000";

// 🔐 Fallback token (only used if nothing else is set)
const OWNER_FALLBACK_TOKEN =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOjMsImVtYWlsIjoib3duZXIzQHRhYnouYXBwIiwicm9sZSI6ImJ1eWVyIiwiaWF0IjoxNzY1NTkzNDg4LCJleHAiOjE3NjYxOTgyODh9.5dP5v6k_mmyCVRzIhLyFE00lV6kaV8SWFpLhtGMJJs4";

let accessToken: string | null = null;

// DEV user resolver (locked behavior from your file)
let devUserId: string = "3";
export function setDevUserId(userId: string) {
  devUserId = String(userId || "3");
}
function getUserHeader() {
  return { "x-user-id": devUserId };
}

// ---------------------------
// BASE URL HELPERS (FIXES YOUR CRASH)
// ---------------------------
export function setBaseUrl(url: string) {
  const u = String(url || "").trim();
  if (u) BASE_URL = u;
}
export function getBaseUrl() {
  return BASE_URL;
}

// ---------------------------
// TOKEN HELPERS
// ---------------------------
export function setAuthToken(token: string | null) {
  accessToken = token ? String(token).trim() : null;
}

export function getAuthToken(): string | null {
  return accessToken;
}

export function getEffectiveToken(): string {
  return accessToken ?? OWNER_FALLBACK_TOKEN;
}

function getAuthHeader() {
  const token = getEffectiveToken();
  return { Authorization: `Bearer ${token}` };
}

// ---------------------------
// REQUEST WRAPPER
// ---------------------------
async function request(method: "GET" | "POST", path: string, body?: any) {
  const url = BASE_URL + path;

  const init: RequestInit = {
    method,
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeader(),
      ...getUserHeader(),
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  };

  if (body !== undefined) {
    (init as any).body = JSON.stringify(body);
  }

  console.log(`🔍 ${method}`, url, body ?? "");

  const res = await fetch(url, init);

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new Error(`${method} ${path} failed: ${res.status} - ${JSON.stringify(data)}`);
  }

  return data;
}

export function apiGet(path: string) {
  return request("GET", path);
}

export function apiPost(path: string, body: any = {}) {
  return request("POST", path, body);
}

// ---------------------------
// LOGIN
// ---------------------------
export async function loginWithPassword(email: string, password: string) {
  const url = `${BASE_URL}/auth/login`;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // ignore
  }

  if (!res.ok) {
    throw new Error(`Login failed: ${res.status} - ${JSON.stringify(data)}`);
  }

  const token: string = data?.access_token || data?.accessToken || data?.token;
  if (!token) throw new Error("No access_token returned by backend");

  setAuthToken(token);
  return token;
}
