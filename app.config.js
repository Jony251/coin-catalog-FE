import 'dotenv/config';

const appEnv = String(process.env.APP_ENV || process.env.NODE_ENV || 'development').toLowerCase();
const isProduction = appEnv === 'production';

const parseBoolean = (value, defaultValue) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true') return true;
    if (normalized === 'false') return false;
  }
  return defaultValue;
};

const parseTimeout = (value, defaultValue = 15000) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : defaultValue;
};

export default {
  expo: {
    name: "Coin Catalog",
    slug: "coin-catalog",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/logo.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    scheme: "coin-catalog",
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#B8860B"
    },
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.coincatalog.app"
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#B8860B"
      },
      package: "com.coincatalog.app",
      softwareKeyboardLayoutMode: "pan"
    },
    web: {
      favicon: "./assets/favicon.png",
      bundler: "metro"
    },
    plugins: [
      "expo-router",
      "expo-sqlite",
      "expo-secure-store"
    ],
    extra: {
      appEnv,
      apiUrl: process.env.API_URL || "",
      allowOfflineAuth: parseBoolean(process.env.ALLOW_OFFLINE_AUTH, !isProduction),
      enableVerboseLogging: parseBoolean(process.env.ENABLE_VERBOSE_LOGGING, !isProduction),
      requestTimeoutMs: parseTimeout(process.env.REQUEST_TIMEOUT_MS, 15000),
      firebaseApiKey: process.env.FIREBASE_API_KEY,
      firebaseAuthDomain: process.env.FIREBASE_AUTH_DOMAIN,
      firebaseProjectId: process.env.FIREBASE_PROJECT_ID,
      firebaseStorageBucket: process.env.FIREBASE_STORAGE_BUCKET,
      firebaseMessagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
      firebaseAppId: process.env.FIREBASE_APP_ID,
      firebaseMeasurementId: process.env.FIREBASE_MEASUREMENT_ID,
      numistaApiKey: process.env.NUMISTA_API_KEY,
      numistaUserId: process.env.NUMISTA_USER_ID
    }
  }
};
