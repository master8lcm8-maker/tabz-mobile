// components/lib/api.ts
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

// Persisted keys
const BASEURL_KEY = "TABZ_API_BASE_URL";
const AUTH_TOKEN_KEY = "TABZ_AUTH_TOKEN";

// Default backend base URL (can be overridden via setBaseUrl / hydrateBaseUrl / env)
const DEFAULT_BASE_URL =
  process.env.EXPO_PUBLIC_TABZ_API_BASE_URL || "";

// Base URL used by all requests (hydrated from storage/env on boot)
export let BASE_URL = DEFAULT_BASE_URL;

// ---------------------------
// DEV FALLBACK TOKEN (NATIVE ONLY)
// - MUST NOT be hardcoded in source.
// - Provide via env: EXPO_PUBLIC_DEV_FALLBACK_TOKEN
// - WEB never falls back.
// ---------------------------
const DEV_FALLBACK_TOKEN = (() => {
  try {
    const v = (process as any)?.env?.EXPO_PUBLIC_DEV_FALLBACK_TOKEN;
    return typeof v === "string" ? v.trim() : "";
  } catch {
    return "";
  }
})();

let accessToken: string | null = null;

// --------------------------------------------------
// HYDRATION GATE (prevents API calls before init)
// - request() and loginWithPassword() will await this.
// - If hydrateSession() is never called, we fail open
//   after a short timeout so native/dev doesn't hang.
// --------------------------------------------------
let hydrationReleased = false;
let hydrationResolve: (() => void) | null = null;

const hydrationPromise: Promise<void> = new Promise<void>((resolve) => {
  hydrationResolve = () => {
    hydrationReleased = true;
    resolve();
  };
});

// Fail-open safety: avoid indefinite hang if hydrateSession is not called.
// IMPORTANT: On WEB we must NEVER fail-open. Web must hydrate from localStorage
// before any authed request, otherwise we send empty Bearer and get 401.
const HYDRATION_FAILOPEN_MS = Platform.OS === "web" ? 0 : 1500;

const hydrationFailOpenTimer =
  HYDRATION_FAILOPEN_MS > 0 && typeof setTimeout === "function"
    ? setTimeout(() => {
        if (!hydrationReleased && hydrationResolve) {
          hydrationResolve();
          hydrationResolve = null;
        }
      }, HYDRATION_FAILOPEN_MS)
    : null;

async function awaitHydration(): Promise<void> {
  await hydrationPromise;
}

// DEV user resolver (locked behavior)
let devUserId: string = "3";
export function setDevUserId(userId: string) {
  devUserId = String(userId || "3");
}

// ---------------------------
// ENV BASE URL (ALL PLATFORMS)
// ---------------------------
export function getEnvBaseUrl(): string {
  try {
    const v = (process as any)?.env?.EXPO_PUBLIC_BASE_URL;
    return typeof v === "string" ? v.trim() : "";
  } catch {
    return "";
  }
}

// ---------------------------
// TOKEN / BASE URL PERSISTENCE
// ---------------------------
async function storageSet(key: string, val: string) {
  if (Platform.OS === "web") {
    try {
      localStorage.setItem(key, val);
    } catch {}
    return;
  }
  await AsyncStorage.setItem(key, val);
}

async function storageGet(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
  return await AsyncStorage.getItem(key);
}

async function storageRemove(key: string) {
  if (Platform.OS === "web") {
    try {
      localStorage.removeItem(key);
    } catch {}
    return;
  }
  await AsyncStorage.removeItem(key);
}

// ---------------------------
// BASE URL HELPERS
// ---------------------------
export function setBaseUrl(url: string) {
  const u = String(url || "").trim();
  if (!u) return;

  BASE_URL = u;
  storageSet(BASEURL_KEY, u).catch(() => {});
}

export function getBaseUrl() {
  return BASE_URL;
}

// Call once on app boot
export async function hydrateBaseUrl(): Promise<string> {
  // Highest priority: EXPO_PUBLIC_BASE_URL
  const envUrl = getEnvBaseUrl();
  if (envUrl) {
    BASE_URL = envUrl;
    return BASE_URL;
  }

  // Next: persisted override
  const saved = await storageGet(BASEURL_KEY);
  const u = saved ? String(saved).trim() : "";
  if (u) BASE_URL = u;

  // Fallback: prod default
  if (!BASE_URL) BASE_URL = DEFAULT_BASE_URL;

  return BASE_URL;
}

// ---------------------------
// AUTH TOKEN HELPERS
// ---------------------------
export async function hydrateAuthToken(): Promise<string | null> {
  const saved = await storageGet(AUTH_TOKEN_KEY);
  const t = saved ? String(saved).trim() : null;
  accessToken = t && t.length > 0 ? t : null;
  return accessToken;
}

// One-call boot hydration (layout uses this)
export async function hydrateSession(): Promise<void> {
  try {
    await hydrateBaseUrl();
    await hydrateAuthToken();
  } finally {
    // Release the hydration gate exactly once
    if (!hydrationReleased && hydrationResolve) {
      hydrationResolve();
      hydrationResolve = null;
    }
    if (hydrationFailOpenTimer) {
      try {
        clearTimeout(hydrationFailOpenTimer as any);
      } catch {}
    }
  }
}

export async function clearAuthToken() {
  accessToken = null;
  await storageRemove(AUTH_TOKEN_KEY);
}

export async function setAuthToken(token: string | null) {
  accessToken = token ? String(token).trim() : null;

  if (accessToken) {
    await storageSet(AUTH_TOKEN_KEY, accessToken);
  } else {
    await storageRemove(AUTH_TOKEN_KEY);
  }
}

export function getAuthToken(): string | null {
  return accessToken;
}

/**
 * CRITICAL RULE:
 * - WEB: MUST have accessToken (TABZ_AUTH_TOKEN). NEVER fallback.
 * - NATIVE: may use env-provided fallback ONLY if EXPO_PUBLIC_DEV_FALLBACK_TOKEN is set.
 *           Otherwise fail loud to avoid silent auth-as-someone bugs.
 */
function getEffectiveTokenOrThrow(): string {
  const t = accessToken ? String(accessToken).trim() : "";

  if (Platform.OS === "web") {
    if (!t) {
      throw new Error(
        "AUTH_MISSING_WEB: No TABZ_AUTH_TOKEN set. On web we NEVER use fallback."
      );
    }
    return t;
  }

  // Native: prefer real token
  if (t) return t;

  // Native dev fallback: env only
  if (DEV_FALLBACK_TOKEN) return DEV_FALLBACK_TOKEN;

  throw new Error(
    "AUTH_MISSING_NATIVE: No TABZ_AUTH_TOKEN set and no EXPO_PUBLIC_DEV_FALLBACK_TOKEN provided."
  );
}

// ---------------------------
// REQUEST WRAPPER
// ---------------------------
function buildAuthHeaders(token: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
  };

  // native dev behavior: support x-user-id for your backend dev routing
  if (Platform.OS !== "web") {
    headers["x-user-id"] = devUserId;
  }

  return headers;
}

function buildJsonHeaders(token: string): Record<string, string> {
  return {
    ...buildAuthHeaders(token),
    "Content-Type": "application/json",
  };
}

function unwrapResponse<T = any>(data: any): T {
  if (
    data &&
    typeof data === "object" &&
    !Array.isArray(data) &&
    "value" in data
  ) {
    return (data as any).value as T;
  }
  return data as T;
}

async function request(method: "GET" | "POST", path: string, body?: any) {
  // ðŸ”’ Ensure BASE_URL + token hydration happened before we fire requests
  await awaitHydration();

  const url = BASE_URL + path;
  const token = getEffectiveTokenOrThrow();

  const init: RequestInit = {
    method,
    headers: buildJsonHeaders(token),
  };

  if (body !== undefined) {
    (init as any).body = JSON.stringify(body);
  }

  const res = await fetch(url, init);

  let data: any = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    throw new Error(
      `${method} ${path} failed: ${res.status} - ${JSON.stringify(data)}`
    );
  }

  return unwrapResponse(data);
}

export function apiGet(path: string) {
  return request("GET", path);
}

export function apiPost(path: string, body: any = {}) {
  return request("POST", path, body);
}

/**
 * Multipart upload helper (for /profiles/me/avatar and /profiles/me/cover)
 * - WEB: pass a File object
 * - NATIVE: pass { uri, name, type }
 */
export type NativeFile = { uri: string; name: string; type: string };

export async function apiUploadMultipart(
  path: string,
  file: File | Blob | NativeFile,
  fieldName: string = "file"
) {
  // ðŸ”’ Ensure BASE_URL + token hydration happened before we fire requests
  await awaitHydration();

  const url = BASE_URL + path;
  const token = getEffectiveTokenOrThrow();

  const fd = new FormData();

  if (Platform.OS === "web") {
    // Browser: File/Blob
    const f = file as any;
    const name =
      typeof f?.name === "string" && f.name.trim().length > 0
        ? f.name
        : "upload.png";
    fd.append(fieldName, f, name);
  } else {
    // React Native / Expo: { uri, name, type }
    const nf = file as NativeFile;
    fd.append(fieldName, {
      uri: nf.uri,
      name: nf.name || "upload.png",
      type: nf.type || "image/png",
    } as any);
  }

  const res = await fetch(url, {
    method: "POST",
    headers: {
      ...buildAuthHeaders(token),
      // IMPORTANT: do NOT set Content-Type for multipart; fetch sets boundary.
    } as any,
    body: fd as any,
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {}

  if (!res.ok) {
    throw new Error(
      `POST ${path} failed: ${res.status} - ${JSON.stringify(data)}`
    );
  }

  return unwrapResponse(data);
}

// Convenience wrappers
export function uploadMyAvatar(file: File | Blob | NativeFile) {
  return apiUploadMultipart("/profiles/me/avatar", file, "file");
}
export function uploadMyCover(file: File | Blob | NativeFile) {
  return apiUploadMultipart("/profiles/me/cover", file, "file");
}

// ---------------------------
// LOGIN (WEB-FIRST)
// ---------------------------
export async function loginWithPassword(
  email: string,
  password: string
): Promise<string> {
  // ðŸ”’ Ensure BASE_URL hydration occurred before login attempts.
  await awaitHydration();

  const endpoints = [
    "/auth/login-owner",
    "/auth/login-buyer",
    "/auth/login-staff",
    "/auth/login",
  ];

  let lastErr: any = null;

  for (const ep of endpoints) {
    try {
      const res = await fetch(`${BASE_URL}${ep}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      let data: any = null;
      try {
        data = await res.json();
      } catch {}

      if (!res.ok) {
        lastErr = { ep, status: res.status, data };
        continue;
      }

      const token = data?.access_token || data?.accessToken || data?.token;

      if (!token) {
        lastErr = { ep, status: res.status, data };
        continue;
      }

      await setAuthToken(token);
      return token;
    } catch (e: any) {
      lastErr = { ep, error: String(e?.message || e) };
    }
  }

  throw new Error(
    `Login failed on all endpoints. Last error: ${JSON.stringify(lastErr)}`
  );
}

// ==================================================
// ROLE GUARD UTILITIES
// ==================================================
export type JwtClaims = {
  sub?: number;
  userId?: number;
  role?: string;
  email?: string;
  iat?: number;
  exp?: number;
  [k: string]: any;
};

function base64UrlToBase64(input: string) {
  let s = String(input || "").replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4 !== 0) s += "=";
  return s;
}

function safeDecodeBase64ToUtf8(b64: string): string | null {
  try {
    if (typeof atob === "function") return atob(b64);
  } catch {}

  try {
    const B = (global as any)?.Buffer || require("buffer").Buffer;
    return B.from(b64, "base64").toString("utf8");
  } catch {}

  return null;
}

export function decodeJwtClaims(token?: string | null): JwtClaims | null {
  const t = String(token || "").trim();
  if (!t) return null;

  const parts = t.split(".");
  if (parts.length < 2) return null;

  const payloadJson = safeDecodeBase64ToUtf8(base64UrlToBase64(parts[1]));
  if (!payloadJson) return null;

  try {
    const obj = JSON.parse(payloadJson);
    return obj && typeof obj === "object" ? obj : null;
  } catch {
    return null;
  }
}

export function getActiveClaims(): JwtClaims | null {
  const token = getEffectiveTokenOrThrow();
  return decodeJwtClaims(token);
}

export function requireRole(required: "owner" | "buyer" | "staff"): JwtClaims {
  const claims = getActiveClaims();
  const role = String(claims?.role || "").toLowerCase();

  if (role !== required) {
    throw new Error(`ROLE_GUARD: required=${required} tokenRole=${role}`);
  }

  return claims!;
}

// ==================================================
// STAFF ORDERS (M28.2)
// ==================================================
export type StaffOrderRow = {
  orderId: number;
  createdAt: string;
  status: string;
  itemName: string;
  quantity: number;
  amountCents: number;
  feeCents: number;
  payoutCents: number;
  buyerId: number;
  venueId: number;
  venueName: string;
  [k: string]: any;
};

export async function getStaffOrders(): Promise<StaffOrderRow[]> {
  return apiGet("/store-items/staff/orders");
}

export async function staffMarkOrder(
  orderId: number,
  status: string
): Promise<any> {
  const id = Number(orderId);
  if (!id) throw new Error("staffMarkOrder: invalid orderId");

  const s = String(status || "").trim();
  if (!s) throw new Error("staffMarkOrder: status required");

  return apiPost(`/store-items/staff/orders/${id}/mark`, { status: s });
}

// ==================================================
// BANK INFO GUARD
// ==================================================
export type BankInfoSummary = {
  hasBankInfo: boolean;
  bankName: string | null;
  last4: string | null;
  raw?: any;
};

export async function getBankInfoSummary(): Promise<BankInfoSummary> {
  const info: any = await apiGet("/wallet/bank-info");

  if (!info || typeof info !== "object") {
    return { hasBankInfo: false, bankName: null, last4: null };
  }

  return {
    hasBankInfo: true,
    bankName: info.bankNameEnc ?? info.bankName ?? null,
    last4: info.accountLast4 ?? null,
    raw: info,
  };
}


