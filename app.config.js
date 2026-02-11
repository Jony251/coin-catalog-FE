import 'dotenv/config';

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
      apiUrl: process.env.API_URL || "http://192.168.10.6:3000",
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
