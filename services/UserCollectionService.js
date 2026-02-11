import { Platform } from 'react-native';
import { UserCoin } from '../models';
import firebaseService from './FirebaseService';
import { firestoreDatabaseService } from './FirestoreDatabaseService';
import { openDatabaseAsync } from './SQLiteAdapter';
import { db as firestoreDb } from '../config/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

/**
 * UserCollectionService - сервис для управления коллекцией пользователя
 * Поддерживает локальное хранение и синхронизацию с сервером
 */
class UserCollectionService {
  constructor() {
    this.db = null;
    this.isWeb = Platform.OS === 'web';
    this.isInitialized = false;
    this.userId = null; // ID пользователя (для будущей авторизации)
    this._isLoadingFromServer = false; // Флаг: загрузка с сервера (не синхронизировать обратно)
    
    // In-memory storage для веб
    this.webStorage = {
      userCoins: [],
    };
  }

  /**
   * Инициализация сервиса
   */
  async initialize(userId = null) {
    if (this.isInitialized) return;

    this.userId = userId;

    try {
      if (this.isWeb) {
        await this._initializeWeb();
      } else {
        await this._initializeSQLite();
      }
      
      this.isInitialized = true;
      console.log('UserCollectionService initialized');
    } catch (error) {
      console.error('UserCollectionService initialization error:', error);
      throw error;
    }
  }

  /**
   * Инициализация для веб (localStorage)
   */
  async _initializeWeb() {
    try {
      const saved = localStorage.getItem('coin_catalog_user_collection');
      if (saved) {
        const data = JSON.parse(saved);
        this.webStorage.userCoins = data.map(item => UserCoin.fromDatabase(item));
      }
    } catch (e) {
      console.log('No saved user collection data');
    }
  }

  /**
   * Инициализация SQLite
   */
  async _initializeSQLite() {
    this.db = await openDatabaseAsync('coin_catalog.db');
    await this._createUserTables();
  }

  /**
   * Создание таблиц для коллекции пользователя
   */
  async _createUserTables() {
    await this.db.execAsync(`
      -- Коллекция пользователя
      CREATE TABLE IF NOT EXISTS user_coins (
        id TEXT PRIMARY KEY,
        userId TEXT,
        catalogCoinId TEXT NOT NULL,
        isWishlist INTEGER DEFAULT 0,
        condition TEXT,
        grade TEXT,
        purchasePrice REAL,
        purchaseDate TEXT,
        notes TEXT,
        userObverseImage TEXT,
        userReverseImage TEXT,
        userWeight REAL,
        userDiameter REAL,
        createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
        updatedAt TEXT,
        syncedAt TEXT,
        needsSync INTEGER DEFAULT 0,
        isDeleted INTEGER DEFAULT 0,
        FOREIGN KEY (catalogCoinId) REFERENCES catalog_coins(id)
      );

      -- Индексы
      CREATE INDEX IF NOT EXISTS idx_user_coins_catalog ON user_coins(catalogCoinId);
      CREATE INDEX IF NOT EXISTS idx_user_coins_user ON user_coins(userId);
      CREATE INDEX IF NOT EXISTS idx_user_coins_wishlist ON user_coins(isWishlist);
      CREATE INDEX IF NOT EXISTS idx_user_coins_sync ON user_coins(needsSync);
    `);
    
    // Миграция: добавляем новые колонки если их нет
    await this._migrateUserCoinsTable();
  }

  /**
   * Миграция таблицы user_coins - добавление новых колонок
   */
  async _migrateUserCoinsTable() {
    try {
      // Проверяем существование колонки userWeight
      const tableInfo = await this.db.getAllAsync('PRAGMA table_info(user_coins)');
      const hasUserWeight = tableInfo.some(col => col.name === 'userWeight');
      const hasUserDiameter = tableInfo.some(col => col.name === 'userDiameter');
      
      if (!hasUserWeight) {
        console.log('Adding userWeight column to user_coins table');
        await this.db.execAsync('ALTER TABLE user_coins ADD COLUMN userWeight REAL');
      }
      
      if (!hasUserDiameter) {
        console.log('Adding userDiameter column to user_coins table');
        await this.db.execAsync('ALTER TABLE user_coins ADD COLUMN userDiameter REAL');
      }
      
      if (hasUserWeight && hasUserDiameter) {
        console.log('user_coins table is up to date');
      }
    } catch (error) {
      console.error('Migration error:', error);
      // Не бросаем ошибку - возможно таблица еще не создана
    }
  }

  /**
   * Сохранить веб-хранилище в localStorage
   */
  _saveWebStorage() {
    if (this.isWeb) {
      const data = this.webStorage.userCoins.map(coin => coin.toDatabase());
      localStorage.setItem('coin_catalog_user_collection', JSON.stringify(data));
    }
  }

  // ==================== CRUD ОПЕРАЦИИ ====================

  /**
   * Добавить монету в коллекцию
   */
  async addCoin(catalogCoinId, data = {}) {
    if (!this.isInitialized) await this.initialize();

    const userCoin = new UserCoin({
      id: `uc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId: this.userId,
      catalogCoinId,
      isWishlist: data.isWishlist || false,
      condition: data.condition || null,
      grade: data.grade || null,
      purchasePrice: data.purchasePrice || null,
      purchaseDate: data.purchaseDate || null,
      notes: data.notes || null,
      userObverseImage: data.userObverseImage || null,
      userReverseImage: data.userReverseImage || null,
      userWeight: data.userWeight || null,
      userDiameter: data.userDiameter || null,
      createdAt: new Date(),
      needsSync: true,
    });

    userCoin.validate();

    if (this.isWeb) {
      // Удаляем из вишлиста если добавляем в коллекцию
      if (!userCoin.isWishlist) {
        this.webStorage.userCoins = this.webStorage.userCoins.filter(
          c => !(c.catalogCoinId === catalogCoinId && c.isWishlist)
        );
      }
      
      this.webStorage.userCoins.push(userCoin);
      this._saveWebStorage();
    } else {
      // Удаляем из вишлиста если добавляем в коллекцию
      if (!userCoin.isWishlist) {
        await this.db.runAsync(
          'DELETE FROM user_coins WHERE catalogCoinId = ? AND isWishlist = 1',
          [catalogCoinId]
        );
      }

      const dbData = userCoin.toDatabase();
      await this.db.runAsync(
        `INSERT INTO user_coins (
          id, userId, catalogCoinId, isWishlist, condition, grade, 
          purchasePrice, purchaseDate, notes, userObverseImage, userReverseImage,
          userWeight, userDiameter,
          createdAt, updatedAt, syncedAt, needsSync, isDeleted
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          dbData.id, dbData.userId, dbData.catalogCoinId, dbData.isWishlist,
          dbData.condition, dbData.grade, dbData.purchasePrice, dbData.purchaseDate,
          dbData.notes, dbData.userObverseImage, dbData.userReverseImage,
          dbData.userWeight, dbData.userDiameter,
          dbData.createdAt, dbData.updatedAt, dbData.syncedAt, dbData.needsSync, dbData.isDeleted
        ]
      );
    }

    // Синхронизация с Firestore (пропускаем если загружаем с сервера)
    if (!this._isLoadingFromServer) {
      await this._syncToServer(userCoin);
    } else {
      userCoin.markAsSynced();
    }

    return userCoin;
  }

  /**
   * Обновить монету в коллекции
   */
  async updateCoin(userCoinId, data) {
    if (!this.isInitialized) await this.initialize();

    if (this.isWeb) {
      const coin = this.webStorage.userCoins.find(c => c.id === userCoinId);
      if (!coin) throw new Error('UserCoin not found');
      
      coin.update(data);
      this._saveWebStorage();
      
      // Синхронизация с Firestore
      await this._syncToServer(coin);
      
      return coin;
    } else {
      const row = await this.db.getFirstAsync(
        'SELECT * FROM user_coins WHERE id = ?',
        [userCoinId]
      );
      
      if (!row) throw new Error('UserCoin not found');
      
      const coin = UserCoin.fromDatabase(row);
      coin.update(data);
      
      const dbData = coin.toDatabase();
      await this.db.runAsync(
        `UPDATE user_coins SET
          condition = ?, grade = ?, purchasePrice = ?, purchaseDate = ?,
          notes = ?, userObverseImage = ?, userReverseImage = ?,
          userWeight = ?, userDiameter = ?,
          updatedAt = ?, needsSync = ?
         WHERE id = ?`,
        [
          dbData.condition, dbData.grade, dbData.purchasePrice, dbData.purchaseDate,
          dbData.notes, dbData.userObverseImage, dbData.userReverseImage,
          dbData.userWeight, dbData.userDiameter,
          dbData.updatedAt, dbData.needsSync, dbData.id
        ]
      );
      
      // Синхронизация с Firestore
      await this._syncToServer(coin);
      
      return coin;
    }
  }

  /**
   * Удалить монету из коллекции
   */
  async removeCoin(catalogCoinId) {
    if (!this.isInitialized) await this.initialize();

    try {
      if (this.isWeb) {
        const coin = this.webStorage.userCoins.find(c => c.catalogCoinId === catalogCoinId);
        
        this.webStorage.userCoins = this.webStorage.userCoins.filter(
          c => c.catalogCoinId !== catalogCoinId
        );
        this._saveWebStorage();
        
        // Синхронизация удаления с Firestore
        if (coin) {
          try {
            coin.markAsDeleted();
            await this._syncToServer(coin);
          } catch (syncError) {
            console.warn('Sync error on remove (web):', syncError.message);
          }
        }
      } else {
        // Проверяем что БД доступна
        if (!this.db) {
          console.error('Database not initialized');
          return;
        }

        let row = null;
        try {
          row = await this.db.getFirstAsync(
            'SELECT * FROM user_coins WHERE catalogCoinId = ?',
            [catalogCoinId]
          );
        } catch (error) {
          console.error('Error fetching coin for removal:', error);
        }
        
        // Сначала удаляем из БД
        try {
          await this.db.runAsync(
            'DELETE FROM user_coins WHERE catalogCoinId = ?',
            [catalogCoinId]
          );
        } catch (error) {
          console.error('Error deleting coin from database:', error);
          throw error;
        }
        
        // Синхронизация удаления с Firestore
        if (row) {
          try {
            const coin = UserCoin.fromDatabase(row);
            coin.markAsDeleted();
            await this._syncToServer(coin);
          } catch (syncError) {
            console.warn('Sync error on remove:', syncError.message);
            // Не бросаем ошибку - монета уже удалена локально
          }
        }
      }
    } catch (error) {
      console.error('Error removing coin:', error);
      throw error;
    }
  }

  /**
   * Получить коллекцию пользователя
   */
  async getUserCoins(isWishlist = false) {
    if (!this.isInitialized) await this.initialize();

    try {
      if (this.isWeb) {
        const userCoins = this.webStorage.userCoins.filter(uc => 
          uc.isWishlist === isWishlist && !uc.isDeleted
        );
        
        // Обогащаем данными из каталога
        const enrichedCoins = await Promise.all(
          userCoins.map(async (uc) => {
            const catalogCoin = await firestoreDatabaseService.getCoinById(uc.catalogCoinId);
            return new UserCoin({
              ...uc,
              catalogCoin,
            });
          })
        );
        
        return enrichedCoins.sort((a, b) => b.createdAt - a.createdAt);
      } else {
        // Проверяем что БД доступна
        if (!this.db) {
          console.error('Database not initialized in getUserCoins');
          return [];
        }

        const rows = await this.db.getAllAsync(
          `SELECT 
            uc.*,
            c.id as coin_id, c.rulerId, c.catalogNumber, c.name, c.nameEn, c.year,
            c.denomination, c.denominationValue, c.currency, c.metal, c.weight,
            c.diameter, c.mint, c.mintMark, c.mintage, c.rarity, c.rarityScore,
            c.estimatedValueMin, c.estimatedValueMax, c.obverseImage, c.reverseImage,
            c.description
           FROM user_coins uc
           JOIN catalog_coins c ON uc.catalogCoinId = c.id
           WHERE uc.isWishlist = ? AND uc.isDeleted = 0
           ORDER BY uc.createdAt DESC`,
          [isWishlist ? 1 : 0]
        );
      
      return rows.map(row => {
        const userCoin = UserCoin.fromDatabase(row);
        userCoin.catalogCoin = {
          id: row.coin_id,
          rulerId: row.rulerId,
          catalogNumber: row.catalogNumber,
          name: row.name,
          nameEn: row.nameEn,
          year: row.year,
          denomination: row.denomination,
          denominationValue: row.denominationValue,
          currency: row.currency,
          metal: row.metal,
          weight: row.weight,
          diameter: row.diameter,
          mint: row.mint,
          mintMark: row.mintMark,
          mintage: row.mintage,
          rarity: row.rarity,
          rarityScore: row.rarityScore,
          estimatedValueMin: row.estimatedValueMin,
          estimatedValueMax: row.estimatedValueMax,
          obverseImage: row.obverseImage,
          reverseImage: row.reverseImage,
          description: row.description,
        };
        return userCoin;
      });
      }
    } catch (error) {
      console.error('Error getting user coins:', error);
      return [];
    }
  }

  /**
   * Проверить, есть ли монета в коллекции
   */
  async isInCollection(catalogCoinId) {
    if (!this.isInitialized) await this.initialize();

    try {
      if (this.isWeb) {
        const owned = this.webStorage.userCoins.find(
          c => c.catalogCoinId === catalogCoinId && !c.isWishlist && !c.isDeleted
        );
        const wishlisted = this.webStorage.userCoins.find(
          c => c.catalogCoinId === catalogCoinId && c.isWishlist && !c.isDeleted
        );
        return { owned: !!owned, wishlisted: !!wishlisted };
      } else {
        // Проверяем что БД доступна
        if (!this.db) {
          console.error('Database not initialized in isInCollection');
          return { owned: false, wishlisted: false };
        }

        const owned = await this.db.getFirstAsync(
          'SELECT id FROM user_coins WHERE catalogCoinId = ? AND isWishlist = 0 AND isDeleted = 0',
          [catalogCoinId]
        );
        const wishlisted = await this.db.getFirstAsync(
          'SELECT id FROM user_coins WHERE catalogCoinId = ? AND isWishlist = 1 AND isDeleted = 0',
          [catalogCoinId]
        );
        return { owned: !!owned, wishlisted: !!wishlisted };
      }
    } catch (error) {
      console.error('Error checking collection:', error);
      return { owned: false, wishlisted: false };
    }
  }

  /**
   * Переместить из вишлиста в коллекцию
   */
  async moveToCollection(userCoinId) {
    if (!this.isInitialized) await this.initialize();

    if (this.isWeb) {
      const coin = this.webStorage.userCoins.find(c => c.id === userCoinId);
      if (coin) {
        coin.isWishlist = false;
        coin.markForSync();
        this._saveWebStorage();
        
        // Синхронизация с Firestore
        await this._syncToServer(coin);
      }
    } else {
      const row = await this.db.getFirstAsync(
        'SELECT * FROM user_coins WHERE id = ?',
        [userCoinId]
      );
      
      if (row) {
        const coin = UserCoin.fromDatabase(row);
        coin.isWishlist = false;
        coin.markForSync();
        
        const dbData = coin.toDatabase();
        await this.db.runAsync(
          'UPDATE user_coins SET isWishlist = 0, updatedAt = ?, needsSync = ? WHERE id = ?',
          [dbData.updatedAt, dbData.needsSync, coin.id]
        );
        
        // Синхронизация с Firestore
        await this._syncToServer(coin);
      }
    }
  }

  /**
   * Очистить всю коллекцию
   */
  async clearAll() {
    if (!this.isInitialized) await this.initialize();

    if (this.isWeb) {
      this.webStorage.userCoins = [];
      this._saveWebStorage();
    } else {
      await this.db.runAsync('DELETE FROM user_coins');
    }

    // Очищаем коллекцию в Firestore одним вызовом
    if (this._canSync() && this.userId) {
      try {
        const collectionRef = doc(firestoreDb, 'collections', this.userId);
        await setDoc(collectionRef, {
          userId: this.userId,
          coins: [],
          updatedAt: new Date().toISOString(),
        });
        console.log('✅ Collection cleared in Firestore');
      } catch (error) {
        console.error('Error clearing Firestore collection:', error.message);
      }
    }
  }

  // ==================== СТАТИСТИКА ====================

  /**
   * Получить статистику коллекции
   */
  async getCollectionStats() {
    const collection = await this.getUserCoins(false);
    const wishlist = await this.getUserCoins(true);
    
    const totalValue = collection.reduce((sum, coin) => {
      const value = coin.getCurrentValue();
      return sum + (value || 0);
    }, 0);
    
    const totalPurchasePrice = collection.reduce((sum, coin) => {
      return sum + (coin.purchasePrice || 0);
    }, 0);
    
    const profitLoss = totalValue - totalPurchasePrice;
    
    return {
      collectionCount: collection.length,
      wishlistCount: wishlist.length,
      totalValue,
      totalPurchasePrice,
      profitLoss,
      profitLossPercent: totalPurchasePrice > 0 ? (profitLoss / totalPurchasePrice) * 100 : 0,
    };
  }

  // ==================== СИНХРОНИЗАЦИЯ (напрямую через Firestore Client SDK) ====================

  /**
   * Проверить доступность Firestore для синхронизации
   */
  _canSync() {
    const currentUser = firebaseService.getCurrentUser();
    if (!currentUser || !firestoreDb) {
      return false;
    }
    return true;
  }

  /**
   * Синхронизировать всю коллекцию в Firestore напрямую
   * Записывает полный массив монет в документ collections/{userId}
   */
  async _syncToServer(userCoin) {
    if (!this.userId || !this._canSync()) {
      console.log('Cannot sync - no userId or Firebase not available');
      return;
    }

    try {
      console.log('Syncing to Firestore:', userCoin.id, userCoin.isDeleted ? '(deleted)' : '');

      // Читаем текущий документ коллекции из Firestore
      const collectionRef = doc(firestoreDb, 'collections', this.userId);
      const collectionDoc = await getDoc(collectionRef);
      
      let existingCoins = [];
      if (collectionDoc.exists()) {
        existingCoins = collectionDoc.data().coins || [];
      }

      if (userCoin.isDeleted) {
        // Удаляем монету из массива
        existingCoins = existingCoins.filter(
          c => c.id !== userCoin.id && c.catalogCoinId !== userCoin.catalogCoinId
        );
      } else {
        // Данные монеты для Firestore
        const coinData = {
          id: userCoin.id,
          catalogCoinId: userCoin.catalogCoinId,
          condition: userCoin.condition || null,
          grade: userCoin.grade || null,
          purchasePrice: userCoin.purchasePrice || null,
          purchaseDate: userCoin.purchaseDate || null,
          notes: userCoin.notes || '',
          userObverseImage: userCoin.userObverseImage || null,
          userReverseImage: userCoin.userReverseImage || null,
          userWeight: userCoin.userWeight || null,
          userDiameter: userCoin.userDiameter || null,
          isWishlist: userCoin.isWishlist || false,
          addedAt: userCoin.createdAt instanceof Date 
            ? userCoin.createdAt.toISOString() 
            : (userCoin.createdAt || new Date().toISOString()),
          updatedAt: new Date().toISOString(),
        };

        // Обновляем или добавляем
        const existingIndex = existingCoins.findIndex(
          c => c.id === userCoin.id || c.catalogCoinId === userCoin.catalogCoinId
        );

        if (existingIndex >= 0) {
          existingCoins[existingIndex] = coinData;
        } else {
          existingCoins.push(coinData);
        }
      }

      // Записываем обратно в Firestore
      await setDoc(collectionRef, {
        userId: this.userId,
        coins: existingCoins,
        updatedAt: new Date().toISOString(),
      });

      userCoin.markAsSynced();
      console.log('✅ Firestore sync successful');
    } catch (error) {
      console.error('❌ Firestore sync error:', error.message);
    }
  }

  /**
   * Синхронизировать все несинхронизированные монеты
   */
  async syncAll() {
    if (!this.isInitialized) await this.initialize();
    if (!this._canSync()) {
      console.log('Cannot syncAll - Firebase not available');
      return;
    }

    let coinsToSync = [];
    
    if (this.isWeb) {
      coinsToSync = this.webStorage.userCoins.filter(c => c.needsSync);
    } else {
      const rows = await this.db.getAllAsync(
        'SELECT * FROM user_coins WHERE needsSync = 1'
      );
      coinsToSync = rows.map(row => UserCoin.fromDatabase(row));
    }
    
    if (coinsToSync.length === 0) {
      console.log('No coins to sync');
      return;
    }

    console.log(`Syncing ${coinsToSync.length} coins to Firestore...`);
    
    // Оптимизация: читаем документ один раз, обновляем все монеты, записываем один раз
    try {
      const collectionRef = doc(firestoreDb, 'collections', this.userId);
      const collectionDoc = await getDoc(collectionRef);
      
      let existingCoins = [];
      if (collectionDoc.exists()) {
        existingCoins = collectionDoc.data().coins || [];
      }

      for (const coin of coinsToSync) {
        if (coin.isDeleted) {
          existingCoins = existingCoins.filter(
            c => c.id !== coin.id && c.catalogCoinId !== coin.catalogCoinId
          );
        } else {
          const coinData = {
            id: coin.id,
            catalogCoinId: coin.catalogCoinId,
            condition: coin.condition || null,
            grade: coin.grade || null,
            purchasePrice: coin.purchasePrice || null,
            purchaseDate: coin.purchaseDate || null,
            notes: coin.notes || '',
            userObverseImage: coin.userObverseImage || null,
            userReverseImage: coin.userReverseImage || null,
            userWeight: coin.userWeight || null,
            userDiameter: coin.userDiameter || null,
            isWishlist: coin.isWishlist || false,
            addedAt: coin.createdAt instanceof Date 
              ? coin.createdAt.toISOString() 
              : (coin.createdAt || new Date().toISOString()),
            updatedAt: new Date().toISOString(),
          };

          const existingIndex = existingCoins.findIndex(
            c => c.id === coin.id || c.catalogCoinId === coin.catalogCoinId
          );

          if (existingIndex >= 0) {
            existingCoins[existingIndex] = coinData;
          } else {
            existingCoins.push(coinData);
          }
        }

        coin.markAsSynced();
      }

      await setDoc(collectionRef, {
        userId: this.userId,
        coins: existingCoins,
        updatedAt: new Date().toISOString(),
      });

      // Обновляем syncedAt в локальной БД
      if (!this.isWeb) {
        for (const coin of coinsToSync) {
          await this.db.runAsync(
            'UPDATE user_coins SET needsSync = 0, syncedAt = ? WHERE id = ?',
            [new Date().toISOString(), coin.id]
          );
        }
      } else {
        this._saveWebStorage();
      }

      console.log(`✅ Batch sync complete: ${coinsToSync.length} coins synced to Firestore`);
    } catch (error) {
      console.error('❌ Batch sync error:', error.message);
    }
  }

  /**
   * Загрузить коллекцию напрямую из Firestore и объединить с локальной
   * - Добавляет новые монеты с сервера
   * - Обновляет существующие монеты данными с сервера (если серверная версия новее)
   * - Удаляет локальные монеты, которых нет на сервере (удалены на другом устройстве)
   */
  async loadFromFirebase() {
    if (!this.userId) {
      console.log('Cannot load from Firestore - no userId');
      return;
    }

    if (!this._canSync()) {
      console.log('Cannot load from Firestore - Firebase not available');
      return;
    }

    this._isLoadingFromServer = true;
    try {
      console.log('Loading collection from Firestore...');
      const collectionRef = doc(firestoreDb, 'collections', this.userId);
      const collectionDoc = await getDoc(collectionRef);
      
      let serverCoins = [];
      if (collectionDoc.exists()) {
        serverCoins = collectionDoc.data().coins || [];
      }
      
      console.log(`Loaded ${serverCoins.length} coins from Firestore`);

      // Получаем все локальные монеты
      const localOwned = await this.getUserCoins(false);
      const localWishlist = await this.getUserCoins(true);
      const localAll = [...localOwned, ...localWishlist];

      // Множество серверных catalogCoinId для проверки удалений
      const serverCoinIds = new Set(serverCoins.map(c => c.catalogCoinId || c.coinId));

      // 1. Добавляем новые и обновляем существующие
      let added = 0, updated = 0;
      for (const serverCoin of serverCoins) {
        const catalogCoinId = serverCoin.catalogCoinId || serverCoin.coinId;
        const localCoin = localAll.find(lc => lc.catalogCoinId === catalogCoinId);
        
        const serverData = {
          isWishlist: serverCoin.isWishlist || false,
          condition: serverCoin.condition || null,
          grade: serverCoin.grade || null,
          purchasePrice: serverCoin.purchasePrice || null,
          purchaseDate: serverCoin.purchaseDate || null,
          notes: serverCoin.notes || '',
          userObverseImage: serverCoin.userObverseImage || null,
          userReverseImage: serverCoin.userReverseImage || null,
          userWeight: serverCoin.userWeight || null,
          userDiameter: serverCoin.userDiameter || null,
        };

        if (!localCoin) {
          // Монеты нет локально — добавляем
          await this.addCoin(catalogCoinId, serverData);
          added++;
        } else {
          // Монета есть локально — обновляем данными с сервера
          const serverUpdatedAt = serverCoin.updatedAt ? new Date(serverCoin.updatedAt) : new Date(0);
          const localUpdatedAt = localCoin.updatedAt ? new Date(localCoin.updatedAt) : new Date(0);
          
          // Обновляем если серверная версия новее или локальная не синхронизирована
          if (serverUpdatedAt > localUpdatedAt || !localCoin.needsSync) {
            await this._updateLocalCoin(localCoin.id, serverData);
            updated++;
          }
        }
      }

      // 2. Удаляем локальные монеты, которых нет на сервере
      // (только если на сервере есть хотя бы одна монета — чтобы не удалить всё при ошибке)
      let deleted = 0;
      if (serverCoins.length > 0) {
        for (const localCoin of localAll) {
          if (!serverCoinIds.has(localCoin.catalogCoinId)) {
            // Если монета не нуждается в синхронизации — значит она была удалена на сервере
            if (!localCoin.needsSync) {
              await this._deleteLocalCoin(localCoin.catalogCoinId);
              deleted++;
            }
          }
        }
      }

      console.log(`Sync complete: added=${added}, updated=${updated}, deleted=${deleted}`);
    } catch (error) {
      console.error('Error loading from Firestore:', error.message);
    } finally {
      this._isLoadingFromServer = false;
    }
  }

  /**
   * Обновить локальную монету без синхронизации на сервер
   */
  async _updateLocalCoin(userCoinId, data) {
    if (this.isWeb) {
      const coin = this.webStorage.userCoins.find(c => c.id === userCoinId);
      if (coin) {
        coin.update(data);
        coin.markAsSynced(); // Не нужно синхронизировать обратно
        this._saveWebStorage();
      }
    } else {
      const row = await this.db.getFirstAsync(
        'SELECT * FROM user_coins WHERE id = ?',
        [userCoinId]
      );
      if (row) {
        const coin = UserCoin.fromDatabase(row);
        coin.update(data);
        coin.markAsSynced();
        const dbData = coin.toDatabase();
        await this.db.runAsync(
          `UPDATE user_coins SET
            condition = ?, grade = ?, purchasePrice = ?, purchaseDate = ?,
            notes = ?, userObverseImage = ?, userReverseImage = ?,
            userWeight = ?, userDiameter = ?, isWishlist = ?,
            updatedAt = ?, needsSync = ?, syncedAt = ?
           WHERE id = ?`,
          [
            dbData.condition, dbData.grade, dbData.purchasePrice, dbData.purchaseDate,
            dbData.notes, dbData.userObverseImage, dbData.userReverseImage,
            dbData.userWeight, dbData.userDiameter, dbData.isWishlist,
            dbData.updatedAt, 0, new Date().toISOString(), dbData.id
          ]
        );
      }
    }
  }

  /**
   * Удалить монету локально без синхронизации на сервер
   */
  async _deleteLocalCoin(catalogCoinId) {
    if (this.isWeb) {
      this.webStorage.userCoins = this.webStorage.userCoins.filter(
        c => c.catalogCoinId !== catalogCoinId
      );
      this._saveWebStorage();
    } else {
      await this.db.runAsync(
        'DELETE FROM user_coins WHERE catalogCoinId = ?',
        [catalogCoinId]
      );
    }
  }
}

// Экспортируем singleton
export const userCollectionService = new UserCollectionService();
