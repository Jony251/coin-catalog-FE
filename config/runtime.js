import Constants from 'expo-constants';

const DEFAULT_REQUEST_TIMEOUT_MS = 15000;
const PRIVATE_IP_REGEX = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/i;

const extra = Constants.expoConfig?.extra || {};

function toBoolean(value, defaultValue = false) {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return defaultValue;
}

function toNumber(value, defaultValue) {
  const parsed = Number(value);
  if (Number.isFinite(parsed) && parsed > 0) {
    return parsed;
  }
  return defaultValue;
}

function normalizeBaseUrl(value) {
  if (typeof value !== 'string') return '';
  return value.trim().replace(/\/+$/, '');
}

function isPrivateHost(urlString) {
  try {
    const { hostname } = new URL(urlString);
    return PRIVATE_IP_REGEX.test(hostname);
  } catch {
    return false;
  }
}

const nodeEnv = typeof process !== 'undefined' ? process.env.NODE_ENV : '';
const appEnv = String(extra.appEnv || nodeEnv || 'development').toLowerCase();
const isProduction = appEnv === 'production';
const apiUrl = normalizeBaseUrl(extra.apiUrl || '');
const requestTimeoutMs = toNumber(extra.requestTimeoutMs, DEFAULT_REQUEST_TIMEOUT_MS);

const firebase = {
  apiKey: extra.firebaseApiKey || '',
  authDomain: extra.firebaseAuthDomain || '',
  projectId: extra.firebaseProjectId || '',
  storageBucket: extra.firebaseStorageBucket || '',
  messagingSenderId: extra.firebaseMessagingSenderId || '',
  appId: extra.firebaseAppId || '',
  measurementId: extra.firebaseMeasurementId || '',
};

const requiredFirebaseFields = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingFirebaseKeys = requiredFirebaseFields.filter((key) => !firebase[key]);
const isFirebaseConfigured = missingFirebaseKeys.length === 0;

const enableVerboseLogging = toBoolean(extra.enableVerboseLogging, !isProduction);
const allowOfflineAuth = toBoolean(extra.allowOfflineAuth, !isProduction);
const hasUnsafeProductionApiUrl =
  isProduction &&
  (!apiUrl || apiUrl.startsWith('http://') || isPrivateHost(apiUrl));

export const runtimeConfig = {
  appEnv,
  isProduction,
  apiUrl,
  requestTimeoutMs,
  enableVerboseLogging,
  allowOfflineAuth,
  hasUnsafeProductionApiUrl,
  isFirebaseConfigured,
  missingFirebaseKeys,
  firebase,
  numista: {
    apiKey: extra.numistaApiKey || '',
    userId: extra.numistaUserId || '',
  },
};

