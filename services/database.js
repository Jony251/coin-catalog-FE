/**
 * УСТАРЕВШИЙ ФАЙЛ - Обёртка для обратной совместимости
 * Теперь использует Firebase Firestore вместо SQLite
 * 
 * Для новых компонентов используйте напрямую:
 * import { firestoreDatabaseService } from './FirestoreDatabaseService';
 * import { userCollectionService } from './UserCollectionService';
 */

import { firestoreDatabaseService } from './FirestoreDatabaseService';
import { userCollectionService } from './UserCollectionService';

// Initialize database
export async function initDatabase(userId = null) {
  // Инициализируем оба сервиса
  await firestoreDatabaseService.initialize();
  await userCollectionService.initialize(userId);
  console.log('Database initialized (using Firestore)', userId ? `for user ${userId}` : '');
}

// Set user ID for collection service
export async function setUserId(userId) {
  userCollectionService.userId = userId;
  console.log('UserCollectionService userId set to:', userId);
}

// Get all rulers
export async function getRulers() {
  const rulers = await firestoreDatabaseService.getRulers();
  // Преобразуем объекты Ruler в простые объекты для совместимости
  return rulers.map(r => r.toDatabase());
}

// Get coins by ruler
export async function getCoinsByRuler(rulerId) {
  const coins = await firestoreDatabaseService.getCoinsByRuler(rulerId);
  return coins.map(c => c.toDatabase());
}

// Search coins
export async function searchCoins(query) {
  const coins = await firestoreDatabaseService.searchCoins(query);
  return coins.map(c => c.toDatabase());
}

// Get coin by ID
export async function getCoinById(id) {
  const coin = await firestoreDatabaseService.getCoinById(id);
  if (!coin) return null;
  return {
    ...coin.toDatabase(),
    ruler: coin.ruler,
    rulerEn: coin.rulerEn,
  };
}

// Check if coin is in user's collection
export async function isInCollection(catalogCoinId) {
  return await userCollectionService.isInCollection(catalogCoinId);
}

// Add coin to collection or wishlist
export async function addToCollection(catalogCoinId, isWishlist = false, data = {}) {
  const userCoin = await userCollectionService.addCoin(catalogCoinId, {
    ...data,
    isWishlist,
  });
  return userCoin.id;
}

// Get user's coins (collection or wishlist)
export async function getUserCoins(isWishlistParam = false) {
  const userCoins = await userCollectionService.getUserCoins(isWishlistParam);
  return userCoins.map(uc => ({
    userCoinId: uc.id,
    ...uc.toDatabase(),
    ...uc.catalogCoin,
  }));
}

// Update coin in collection (для PRO-пользователей)
export async function updateCoin(userCoinId, data) {
  return await userCollectionService.updateCoin(userCoinId, data);
}

// Remove from collection by catalogCoinId
export async function removeFromCollection(catalogCoinId) {
  await userCollectionService.removeCoin(catalogCoinId);
}

// Move from wishlist to collection
export async function moveToCollection(userCoinId) {
  await userCollectionService.moveToCollection(userCoinId);
}

// Clear all user data
export async function clearAllData() {
  await userCollectionService.clearAll();
}

// Get ruler by ID
export async function getRulerById(id) {
  const ruler = await firestoreDatabaseService.getRulerById(id);
  return ruler ? ruler.toDatabase() : null;
}

// Get denominations (grouped coin types) for a ruler
export async function getDenominationsByRuler(rulerId) {
  return await firestoreDatabaseService.getDenominationsByRuler(rulerId);
}

// Get coins by denomination type for a ruler
export async function getCoinsByDenomination(rulerId, denominationType) {
  const coins = await firestoreDatabaseService.getCoinsByDenomination(rulerId, denominationType);
  return coins.map(c => c.toDatabase());
}
