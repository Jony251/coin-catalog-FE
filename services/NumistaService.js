/**
 * NumistaService - сервис для работы с Numista API
 * API Documentation: https://ru.numista.com/api/doc/index.php
 */
import { runtimeConfig } from '../config/runtime';
import { logger } from '../utils/logger';
import { fetchJsonWithTimeout } from '../utils/network';

const NUMISTA_API_BASE = 'https://api.numista.com/api/v3';

class NumistaService {
  constructor() {
    this.apiKey = runtimeConfig.numista.apiKey || '';
    this.userId = runtimeConfig.numista.userId || '';
    this.requestCount = 0;
    this.maxRequests = 2000; // 2000 запросов в месяц
  }

  /**
   * Базовый запрос к API
   */
  async makeRequest(endpoint, params = {}) {
    if (!this.apiKey) {
      throw new Error('Numista API key is not configured');
    }

    if (this.requestCount >= this.maxRequests) {
      throw new Error('Превышен лимит запросов к Numista API');
    }

    const queryParams = new URLSearchParams({
      ...params,
      lang: 'ru', // Русский язык
    });

    const url = `${NUMISTA_API_BASE}${endpoint}?${queryParams}`;

    try {
      const result = await fetchJsonWithTimeout(
        url,
        {
        headers: {
          'Numista-API-Key': this.apiKey,
          'Content-Type': 'application/json',
        },
        },
        runtimeConfig.requestTimeoutMs
      );

      this.requestCount++;
      logger.debug('numista', `API request ${this.requestCount}/${this.maxRequests}`);

      return result;
    } catch (error) {
      logger.error('numista', 'Numista API request failed', error);
      throw error;
    }
  }

  /**
   * Поиск монет по параметрам
   * @param {Object} filters - Фильтры поиска
   * @param {string} filters.issuer - Код страны (RU для России)
   * @param {number} filters.year - Год выпуска
   * @param {string} filters.ruler - Правитель
   * @param {number} filters.page - Страница результатов
   * @param {number} filters.count - Количество результатов (макс 50)
   */
  async searchCoins(filters = {}) {
    const params = {
      page: filters.page || 1,
      count: Math.min(filters.count || 50, 50),
    };

    if (filters.issuer) params.issuer = filters.issuer;
    if (filters.year) params.year = filters.year;
    if (filters.ruler) params.ruler = filters.ruler;

    return await this.makeRequest('/types', params);
  }

  /**
   * Получить детальную информацию о монете
   * @param {string} typeId - ID типа монеты в Numista
   */
  async getCoinDetails(typeId) {
    return await this.makeRequest(`/types/${typeId}`);
  }

  /**
   * Получить изображения монеты
   * @param {string} typeId - ID типа монеты в Numista
   */
  async getCoinImages(typeId) {
    const details = await this.getCoinDetails(typeId);
    
    return {
      obverse: details.obverse_thumbnail || details.obverse,
      reverse: details.reverse_thumbnail || details.reverse,
    };
  }

  /**
   * Получить оценку стоимости монеты
   * @param {string} typeId - ID типа монеты в Numista
   */
  async getCoinPrice(typeId) {
    try {
      const data = await this.makeRequest(`/types/${typeId}/prices`);
      return data.prices || [];
    } catch (error) {
      logger.warn('numista', `Не удалось получить цены для монеты ${typeId}`, error);
      return [];
    }
  }

  /**
   * Поиск монет Российской Империи по правителю
   * @param {string} rulerName - Имя правителя (на английском)
   * @param {number} startYear - Начало правления
   * @param {number} endYear - Конец правления
   */
  async searchRussianEmpireCoins(rulerName, startYear, endYear) {
    logger.info('numista', `Поиск монет для ${rulerName} (${startYear}-${endYear})...`);
    
    const allCoins = [];
    let page = 1;
    let hasMore = true;

    while (hasMore && page <= 10) { // Ограничение 10 страниц
      try {
        const result = await this.searchCoins({
          issuer: 'russia', // Код для Российской Империи
          page,
          count: 50,
        });

        if (!result.types || result.types.length === 0) {
          hasMore = false;
          break;
        }

        // Фильтруем по годам правления
        const filteredCoins = result.types.filter(coin => {
          const year = coin.min_year || coin.max_year;
          return year >= startYear && year <= endYear;
        });

        allCoins.push(...filteredCoins);
        
        logger.debug('numista', `Страница ${page}: найдено ${filteredCoins.length} монет`);

        // Проверяем, есть ли еще страницы
        hasMore = result.types.length === 50;
        page++;

        // Задержка между запросами (чтобы не превысить rate limit)
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        logger.error('numista', `Ошибка при загрузке страницы ${page}`, error);
        hasMore = false;
      }
    }

    logger.info('numista', `Всего найдено ${allCoins.length} монет для ${rulerName}`);
    return allCoins;
  }

  /**
   * Конвертировать монету из Numista в формат Firestore
   * @param {Object} numistaCoin - Монета из Numista API
   * @param {string} rulerId - ID правителя в нашей системе
   */
  convertToFirestoreFormat(numistaCoin, rulerId) {
    const year = numistaCoin.min_year || numistaCoin.max_year || 0;
    
    // Определяем номинал
    const denomination = numistaCoin.title || '';
    let denominationValue = 0;
    
    // Парсим номинал (например, "1 рубль" -> 1)
    const valueMatch = denomination.match(/(\d+(?:\.\d+)?)/);
    if (valueMatch) {
      denominationValue = parseFloat(valueMatch[1]);
      
      // Конвертируем копейки в рубли
      if (denomination.toLowerCase().includes('копе')) {
        denominationValue = denominationValue / 100;
      }
    }

    // Определяем металл
    let metal = 'Неизвестно';
    if (numistaCoin.composition) {
      const comp = numistaCoin.composition.toLowerCase();
      if (comp.includes('gold') || comp.includes('золот')) metal = 'Золото';
      else if (comp.includes('silver') || comp.includes('серебр')) metal = 'Серебро';
      else if (comp.includes('copper') || comp.includes('медь')) metal = 'Медь';
    }

    // Определяем редкость
    let rarity = 'Common';
    let rarityScore = 3;
    
    if (numistaCoin.rarity) {
      const r = numistaCoin.rarity.toLowerCase();
      if (r.includes('common')) { rarity = 'Common'; rarityScore = 3; }
      else if (r.includes('rare')) { rarity = 'R'; rarityScore = 6; }
      else if (r.includes('very rare')) { rarity = 'R1'; rarityScore = 7; }
      else if (r.includes('extremely rare')) { rarity = 'R2'; rarityScore = 8; }
    }

    return {
      id: `numista-${numistaCoin.id}`,
      rulerId,
      name: numistaCoin.title || 'Без названия',
      year,
      denomination,
      denominationValue,
      metal,
      weight: numistaCoin.weight || 0,
      diameter: numistaCoin.diameter || 0,
      mint: numistaCoin.mint || '',
      rarity,
      rarityScore,
      estimatedValueMin: 0,
      estimatedValueMax: 0,
      numistaId: numistaCoin.id,
      numistaUrl: `https://ru.numista.com/catalogue/pieces${numistaCoin.id}.html`,
      imageObverse: numistaCoin.obverse_thumbnail || null,
      imageReverse: numistaCoin.reverse_thumbnail || null,
      source: 'numista',
      updatedAt: new Date().toISOString(),
    };
  }

  /**
   * Получить статистику использования API
   */
  getUsageStats() {
    return {
      requestCount: this.requestCount,
      maxRequests: this.maxRequests,
      remaining: this.maxRequests - this.requestCount,
      percentage: ((this.requestCount / this.maxRequests) * 100).toFixed(2),
    };
  }
}

// Экспорт singleton instance
export const numistaService = new NumistaService();
