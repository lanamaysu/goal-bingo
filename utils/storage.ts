/**
 * Centralized storage helper for the app's v2 storage schema.
 *
 * Responsibilities:
 * - Read/write v2 keys for sheet/api
 * - Clean legacy keys
 * - Provide a simple initializer used when parsing URL params
 */

const NEW_SHEET_KEY = 'bingo_v2_sheetUrl';
const NEW_API_KEY = 'bingo_v2_geminiApiKey';
const NEW_USER_KEY = 'bingo_v2_userId';
const NEW_THEME_KEY = 'bingo_v2_theme';
const NEW_APP_THEME_KEY = 'bingo_v2_appTheme';

const LEGACY_KEYS = [
  'bingoGlobalSheetUrl',
  'bingoGasDeploymentId',
  'bingoGeminiApiKey',
  'bingoAppTheme',
  'bingoUserId',
  'bingoTheme',
];

export const getSheetUrl = (): string => {
  try {
    return localStorage.getItem(NEW_SHEET_KEY) || '';
  } catch (e) {
    return '';
  }
};

export const setSheetUrl = (url: string): void => {
  try {
    if (url) localStorage.setItem(NEW_SHEET_KEY, url);
    else localStorage.removeItem(NEW_SHEET_KEY);
  } catch (e) {
    // ignore
  }
};

// In-memory API key storage (avoid persisting to localStorage for security)
let memoryApiKey = '';

export const getApiKey = (): string => {
  return memoryApiKey;
};

export const setApiKey = (key: string): void => {
  // Clear any previously persisted copy and keep only in-memory
  try {
    localStorage.removeItem(NEW_API_KEY);
  } catch (e) {
    // ignore
  }
  memoryApiKey = key || '';
};

export const clearLegacyKeys = (): void => {
  try {
    LEGACY_KEYS.forEach((k) => localStorage.removeItem(k));
  } catch (e) {
    // ignore
  }
};

export const getUserId = (): string => {
  try {
    return localStorage.getItem(NEW_USER_KEY) || '';
  } catch (e) {
    return '';
  }
};

export const setUserId = (id: string | null): void => {
  try {
    if (id) localStorage.setItem(NEW_USER_KEY, id);
    else localStorage.removeItem(NEW_USER_KEY);
  } catch (e) {
    // ignore
  }
};

export const removeUserId = (): void => {
  try {
    localStorage.removeItem(NEW_USER_KEY);
  } catch (e) {
    // ignore
  }
};

export const getTheme = (): string => {
  try {
    return localStorage.getItem(NEW_THEME_KEY) || '';
  } catch (e) {
    return '';
  }
};

export const setTheme = (t: string | null): void => {
  try {
    if (t) localStorage.setItem(NEW_THEME_KEY, t);
    else localStorage.removeItem(NEW_THEME_KEY);
  } catch (e) {
    // ignore
  }
};

export const getAppTheme = (): string => {
  try {
    return localStorage.getItem(NEW_APP_THEME_KEY) || '';
  } catch (e) {
    return '';
  }
};

export const setAppTheme = (t: string | null): void => {
  try {
    if (t) localStorage.setItem(NEW_APP_THEME_KEY, t);
    else localStorage.removeItem(NEW_APP_THEME_KEY);
  } catch (e) {
    // ignore
  }
};

export const clearAllKeys = (): void => {
  try {
    // remove v2 keys and known legacy keys
    [NEW_SHEET_KEY, NEW_API_KEY, ...LEGACY_KEYS].forEach((k) => localStorage.removeItem(k));
    // remove any other bingo-prefixed keys
    Object.keys(localStorage).forEach((k) => {
      if (k.startsWith('bingo')) localStorage.removeItem(k);
    });
  } catch (e) {
    // ignore
  }
};

/**
 * Initialize storage from a URL (e.g., syncUrl param).
 * Writes the v2 sheet key and returns true if written.
 */
export const initFromUrlParam = (url: string): boolean => {
  if (!url) return false;
  try {
    setSheetUrl(url);
    return true;
  } catch (e) {
    return false;
  }
};

export const STORAGE_KEYS = {
  NEW_SHEET_KEY,
  NEW_API_KEY,
  NEW_USER_KEY,
  NEW_THEME_KEY,
  NEW_APP_THEME_KEY,
};

export default {
  getSheetUrl,
  setSheetUrl,
  getApiKey,
  setApiKey,
  clearLegacyKeys,
  getUserId,
  setUserId,
  removeUserId,
  getTheme,
  setTheme,
  getAppTheme,
  setAppTheme,
  clearAllKeys,
  initFromUrlParam,
};
