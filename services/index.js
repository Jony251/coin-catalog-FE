/**
 * Services barrel export
 * 
 * Usage:
 * import { firestoreDatabaseService, userCollectionService } from '../services';
 */

export { firestoreDatabaseService } from './FirestoreDatabaseService';
export { userCollectionService } from './UserCollectionService';
export { default as firebaseService } from './FirebaseService';

// Для обратной совместимости со старым API
export * from './database';
