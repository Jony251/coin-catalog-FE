/**
 * Сервис для работы с каталогом монет через Firebase Firestore
 * Заменяет локальное SQLite хранилище на облачное
 */

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  limit as firestoreLimit
} from 'firebase/firestore';
import { db } from '../config/firebase.js';
import { Country, Period, Ruler, Coin } from '../models/index.js';

class FirestoreDatabaseService {
  constructor() {
    this.isInitialized = false;
    this.cache = {
      countries: null,
      periods: {},
      rulers: {},
      coins: {},
    };
  }

  /**
   * Инициализация сервиса
   * Offline persistence уже настроен в firebase.js
   */
  async initialize() {
    if (this.isInitialized) return;

    this.isInitialized = true;
    console.log('✅ FirestoreDatabaseService initialized');
    console.log('📦 Offline caching enabled - данные доступны без интернета');
  }

  /**
   * Получить все страны
   */
  async getCountries() {
    if (!this.isInitialized) await this.initialize();

    // Проверяем кэш
    if (this.cache.countries) {
      return this.cache.countries;
    }

    try {
      const snapshot = await getDocs(collection(db, 'countries'));
      const countries = snapshot.docs.map(doc => 
        Country.fromDatabase({ id: doc.id, ...doc.data() })
      );
      
      // Кэшируем результат
      this.cache.countries = countries;
      
      console.log(`📍 Загружено стран: ${countries.length}`);
      return countries;
    } catch (error) {
      console.error('Error loading countries:', error);
      return [];
    }
  }

  /**
   * Получить периоды по стране
   */
  async getPeriodsByCountry(countryId) {
    if (!this.isInitialized) await this.initialize();

    // Проверяем кэш
    if (this.cache.periods[countryId]) {
      return this.cache.periods[countryId];
    }

    try {
      const q = query(
        collection(db, 'periods'),
        where('countryId', '==', countryId),
        orderBy('sortOrder', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const periods = snapshot.docs.map(doc => 
        Period.fromDatabase({ id: doc.id, ...doc.data() })
      );
      
      // Кэшируем результат
      this.cache.periods[countryId] = periods;
      
      console.log(`📅 Загружено периодов для ${countryId}: ${periods.length}`);
      return periods;
    } catch (error) {
      console.error('Error loading periods:', error);
      return [];
    }
  }

  /**
   * Получить правителей по периоду
   */
  async getRulersByPeriod(periodId) {
    if (!this.isInitialized) await this.initialize();

    // Проверяем кэш
    if (this.cache.rulers[periodId]) {
      return this.cache.rulers[periodId];
    }

    try {
      const q = query(
        collection(db, 'rulers'),
        where('periodId', '==', periodId),
        orderBy('startYear', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const rulers = snapshot.docs.map(doc => 
        Ruler.fromDatabase({ id: doc.id, ...doc.data() })
      );
      
      // Кэшируем результат
      this.cache.rulers[periodId] = rulers;
      
      console.log(`👑 Загружено правителей для ${periodId}: ${rulers.length}`);
      return rulers;
    } catch (error) {
      console.error('Error loading rulers:', error);
      return [];
    }
  }

  /**
   * Получить правителя по ID
   */
  async getRulerById(rulerId) {
    if (!this.isInitialized) await this.initialize();

    try {
      const docRef = doc(db, 'rulers', rulerId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return Ruler.fromDatabase({ id: docSnap.id, ...docSnap.data() });
      }
      
      return null;
    } catch (error) {
      console.error('Error loading ruler:', error);
      return null;
    }
  }

  /**
   * Получить монеты по правителю
   */
  async getCoinsByRuler(rulerId) {
    if (!this.isInitialized) await this.initialize();

    // Проверяем кэш
    const cacheKey = `ruler_${rulerId}`;
    if (this.cache.coins[cacheKey]) {
      return this.cache.coins[cacheKey];
    }

    try {
      const q = query(
        collection(db, 'coins'),
        where('rulerId', '==', rulerId),
        orderBy('year', 'asc')
      );
      
      const snapshot = await getDocs(q);
      const coins = snapshot.docs.map(doc => 
        Coin.fromDatabase({ id: doc.id, ...doc.data() })
      );
      
      // Кэшируем результат
      this.cache.coins[cacheKey] = coins;
      
      console.log(`🪙 Загружено монет для правителя ${rulerId}: ${coins.length}`);
      return coins;
    } catch (error) {
      console.error('Error loading coins:', error);
      return [];
    }
  }

  /**
   * Получить монеты по типу номинала и правителю
   */
  async getCoinsByDenomination(rulerId, denominationType) {
    if (!this.isInitialized) await this.initialize();

    try {
      // Получаем все монеты правителя
      const coins = await this.getCoinsByRuler(rulerId);
      
      // Фильтруем по типу
      const filtered = coins.filter(coin => {
        let type = 'copper';
        
        if (coin.isCommemorative()) {
          type = 'commemorative';
        } else {
          const metalType = coin.getMetalType();
          const value = coin.denominationValue || 0;
          
          if (metalType === 'gold') {
            type = 'gold';
          } else if (metalType === 'silver') {
            type = value >= 0.5 ? 'silver_ruble' : 'silver_small';
          } else if (metalType === 'copper') {
            type = 'copper';
          }
        }
        
        return type === denominationType;
      });
      
      console.log(`🪙 Загружено монет ${denominationType} для ${rulerId}: ${filtered.length}`);
      return filtered;
    } catch (error) {
      console.error('Error loading coins by denomination:', error);
      return [];
    }
  }

  /**
   * Получить монету по ID
   */
  async getCoinById(coinId) {
    if (!this.isInitialized) await this.initialize();

    try {
      const docRef = doc(db, 'coins', coinId);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        return Coin.fromDatabase({ id: docSnap.id, ...docSnap.data() });
      }
      
      return null;
    } catch (error) {
      console.error('Error loading coin:', error);
      return null;
    }
  }

  /**
   * Поиск монет по запросу
   */
  async searchCoins(searchQuery) {
    if (!this.isInitialized) await this.initialize();

    try {
      // Firestore не поддерживает полнотекстовый поиск
      // Загружаем все монеты и фильтруем на клиенте
      const snapshot = await getDocs(
        query(collection(db, 'coins'), firestoreLimit(1000))
      );
      
      const allCoins = snapshot.docs.map(doc => 
        Coin.fromDatabase({ id: doc.id, ...doc.data() })
      );
      
      // Фильтруем на клиенте
      const searchLower = searchQuery.toLowerCase();
      const results = allCoins.filter(coin => 
        coin.name?.toLowerCase().includes(searchLower) ||
        coin.denomination?.toLowerCase().includes(searchLower) ||
        coin.metal?.toLowerCase().includes(searchLower) ||
        coin.year?.toString().includes(searchQuery)
      );
      
      console.log(`🔍 Найдено монет: ${results.length}`);
      return results.slice(0, 50); // Ограничиваем результаты
    } catch (error) {
      console.error('Error searching coins:', error);
      return [];
    }
  }

  /**
   * Получить номиналы для правителя (группировка по типам)
   */
  async getDenominationsByRuler(rulerId) {
    if (!this.isInitialized) await this.initialize();

    try {
      const coins = await this.getCoinsByRuler(rulerId);
      
      const groups = {};
      
      for (const coin of coins) {
        let type = 'copper';
        
        if (coin.isCommemorative()) {
          type = 'commemorative';
        } else {
          const metalType = coin.getMetalType();
          const value = coin.denominationValue || 0;
          
          if (metalType === 'gold') {
            type = 'gold';
          } else if (metalType === 'silver') {
            type = value >= 0.5 ? 'silver_ruble' : 'silver_small';
          } else if (metalType === 'copper') {
            type = 'copper';
          }
        }
        
        if (!groups[type]) {
          groups[type] = {
            type,
            name: this._getDenominationTypeName(type),
            count: 0,
          };
        }
        groups[type].count++;
      }
      
      const order = ['gold', 'silver_ruble', 'silver_small', 'copper', 'commemorative', 'token'];
      return Object.values(groups).sort((a, b) => order.indexOf(a.type) - order.indexOf(b.type));
    } catch (error) {
      console.error('Error loading denominations:', error);
      return [];
    }
  }

  /**
   * Получить название типа номинала
   */
  _getDenominationTypeName(type) {
    const names = {
      gold: 'Золотые монеты',
      silver_ruble: 'Серебряные рубли',
      silver_small: 'Серебряная мелочь',
      copper: 'Медные монеты',
      commemorative: 'Памятные монеты',
      token: 'Жетоны',
    };
    return names[type] || type;
  }

  /**
   * Очистить кэш
   */
  clearCache() {
    this.cache = {
      countries: null,
      periods: {},
      rulers: {},
      coins: {},
    };
    console.log('🗑️ Cache cleared');
  }
}

// Экспортируем singleton
export const firestoreDatabaseService = new FirestoreDatabaseService();
export default firestoreDatabaseService;
