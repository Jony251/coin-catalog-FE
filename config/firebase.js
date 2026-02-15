import { getApp, getApps, initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';
import { Platform } from 'react-native';
import { runtimeConfig } from './runtime';
import { logger } from '../utils/logger';

const firebaseConfig = runtimeConfig.firebase;

let app = null;
let auth = null;
let db = null;

if (!runtimeConfig.isFirebaseConfigured) {
  logger.warn(
    'firebase',
    `Firebase disabled. Missing config keys: ${runtimeConfig.missingFirebaseKeys.join(', ')}`
  );
} else {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    auth = getAuth(app);

    // Enhanced multi-tab cache is supported on web only.
    if (Platform.OS === 'web') {
      try {
        db = initializeFirestore(app, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      } catch (cacheError) {
        logger.warn(
          'firebase',
          'Enhanced Firestore cache unavailable, using default Firestore client',
          cacheError?.message || cacheError
        );
      }
    }

    db = db || getFirestore(app);
  } catch (error) {
    logger.error('firebase', 'Firebase initialization failed', error);
    app = null;
    auth = null;
    db = null;
  }
}

export { app, auth, db };
export default app;
