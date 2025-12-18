// D:\TABZ\tabz-mobile\lib\tabz-api.ts
// Phase 2.1: Single source of truth for TABZ API baseUrl + auth token (persistent)

export const DEFAULT_BASE_URL = 'http://10.0.0.239:3000';

let AUTH_TOKEN: string | null = null;
let API_BASE_URL: string = DEFAULT_BASE_URL;

const TOKEN_KEY = 'TABZ_AUTH_TOKEN';
const BASEURL_KEY = 'TABZ_API_BASE_URL';

// --- Storage (tries SecureStore, then AsyncStorage, then in-memory) ---
async function storageGet(key: string): Promise<string | null> {
  // 1) expo-secure-store
  try {
    const SecureStore = await import('expo-secure-store');
    const v = await SecureStore.getItemAsync(key);
    return v ?? null;
  } catch {}

  // 2) AsyncStorage
  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    const v = await AsyncStorage.default.getItem(key);
    return v ?? null;
  } catch {}

  return null;
}

async function storageSet(key: string, value: string): Promise<void> {
  try {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.setItemAsync(key, value);
    return;
  } catch {}

  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.default.setItem(key, value);
    return;
  } catch {}
}

async function storageDel(key: string): Promise<void> {
  try {
    const SecureStore = await import('expo-secure-store');
    await SecureStore.deleteItemAsync(key);
    return;
  } catch {}

  try {
    const AsyncStorage = await import('@react-native-async-storage/async-storage');
    await AsyncStorage.default.removeItem(key);
    return;
  } catch {}
}

// --- Base URL ---
export function setBaseUrl(url: string) {
  const u = (url || '').trim();
  if (u) API_BASE_URL = u;
}

export function getBaseUrl() {
  return API_BASE_URL || DEFAULT_BASE_URL;
}

export async function loadBaseUrl() {
  const saved = await storageGet(BASEURL_KEY);
  if (saved && saved.trim()) API_BASE_URL = saved.trim();
  return getBaseUrl();
}

export async function saveBaseUrl(url: string) {
  setBaseUrl(url);
  await storageSet(BASEURL_KEY, getBaseUrl());
  return getBaseUrl();
}

// --- Token ---
export function setAuthToken(token: string | null) {
  AUTH_TOKEN = (token || '').trim() || null;
}

export function getAuthToken() {
  return AUTH_TOKEN;
}

export function hasAuthToken() {
  return !!AUTH_TOKEN;
}

export async function loadAuthToken() {
  const saved = await storageGet(TOKEN_KEY);
  setAuthToken(saved);
  return AUTH_TOKEN;
}

export async function saveAuthToken(token: string) {
  setAuthToken(token);
  if (AUTH_TOKEN) await storageSet(TOKEN_KEY, AUTH_TOKEN);
  return AUTH_TOKEN;
}

export async function clearAuthToken() {
  AUTH_TOKEN = null;
  await storageDel(TOKEN_KEY);
}

// --- Headers ---
export function getAuthHeaders() {
  if (!AUTH_TOKEN) {
    throw new Error('No auth token set. Login required.');
  }

  return {
    Authorization: `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
  };
}
