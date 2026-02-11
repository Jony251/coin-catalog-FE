import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import Constants from 'expo-constants';

// Firebase конфигурация загружается из .env через app.config.js
const extra = Constants.expoConfig?.extra || {};

console.log('🔧 Firebase config check:', {
  hasApiKey: !!extra.firebaseApiKey,
  hasProjectId: !!extra.firebaseProjectId,
  hasAppId: !!extra.firebaseAppId,
  projectId: extra.firebaseProjectId || 'MISSING',
  extraKeys: Object.keys(extra),
});

const firebaseConfig = {
  apiKey: extra.firebaseApiKey,
  authDomain: extra.firebaseAuthDomain,
  projectId: extra.firebaseProjectId,
  storageBucket: extra.firebaseStorageBucket,
  messagingSenderId: extra.firebaseMessagingSenderId,
  appId: extra.firebaseAppId,
  measurementId: extra.firebaseMeasurementId
};

if (!firebaseConfig.apiKey) {
  console.error('❌ Firebase API key not found! Make sure .env file exists with FIREBASE_API_KEY');
  console.error('❌ Restart Expo dev server after creating/editing .env file!');
}

// Инициализация Firebase
let app;
let auth;
let db;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  
  // Инициализируем Firestore с расширенным офлайн кэшированием
  // Это позволяет работать полностью офлайн после первой загрузки
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
  
  console.log('✅ Firebase initialized with offline persistence');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  // Fallback на обычную инициализацию
  try {
    db = getFirestore(app);
    console.log('⚠️ Firebase initialized without enhanced persistence');
  } catch (fallbackError) {
    console.error('❌ Fallback initialization failed:', fallbackError);
  }
}

export { auth, db };
export default app;
