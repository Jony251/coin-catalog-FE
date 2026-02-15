import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import firebaseService from '../services/FirebaseService';
import { runtimeConfig } from '../config/runtime';
import { logger } from '../utils/logger';
import { fetchJsonWithTimeout, getErrorMessage } from '../utils/network';

const AUTH_KEY = 'coin_catalog_auth';
const isWeb = Platform.OS === 'web';

// API URL из runtime-конфигурации
const API_URL = runtimeConfig.apiUrl;
const OFFLINE_AUTH_ALLOWED = runtimeConfig.allowOfflineAuth;

function buildApiUrl(path) {
  if (!API_URL) return '';
  return `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
}

// Storage helpers for cross-platform
const storage = {
  getItem: async (key) => {
    if (isWeb) {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  setItem: async (key, value) => {
    if (isWeb) {
      localStorage.setItem(key, value);
      return;
    }
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key) => {
    if (isWeb) {
      localStorage.removeItem(key);
      return;
    }
    await SecureStore.deleteItemAsync(key);
  },
};

export const useAuthStore = create((set, get) => ({
  user: null,
  isGuest: true,
  isLoading: true,
  isPro: false,

  // Load user from storage on app start
  loadUser: async () => {
    try {
      const stored = await storage.getItem(AUTH_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        let user = data.user;
        
        // Если юзер залогинился через offline, а Firebase теперь доступен — сбрасываем
        if (data.provider === 'local' && firebaseService.isAvailable()) {
          logger.info('auth', 'Offline session detected, clearing stale local session');
          await storage.removeItem(AUTH_KEY);
          set({ isGuest: true, isLoading: false });
          return null;
        }
        
        set({ user, isGuest: false, isLoading: false, isPro: user.isPro || false });
        
        // Обновляем профиль из Firebase если доступен
        if (data.provider === 'firebase' && firebaseService.isAvailable()) {
          try {
            const currentUser = firebaseService.getCurrentUser();
            if (currentUser) {
              const freshProfile = await firebaseService.getUserProfile(currentUser.uid);
              if (freshProfile) {
                user = {
                  ...user,
                  isPro: freshProfile.isPro || false,
                  name: freshProfile.displayName || freshProfile.nickname || user.name,
                };
                data.user = user;
                await storage.setItem(AUTH_KEY, JSON.stringify(data));
                set({ user, isPro: user.isPro || false });
                logger.debug('auth', 'Profile refreshed from Firebase');
              }
            }
          } catch (refreshError) {
            logger.warn('auth', 'Could not refresh profile from Firebase', refreshError?.message);
          }
        }
        
        return user;
      } else {
        set({ isGuest: true, isLoading: false });
        return null;
      }
    } catch (error) {
      logger.error('auth', 'Error loading user', error);
      set({ isGuest: true, isLoading: false });
      return null;
    }
  },

  // Login
  login: async (email, password) => {
    logger.debug('auth', 'Login requested', { email, hasPassword: !!password });
    
    // Пробуем Firebase сначала
    if (firebaseService.isAvailable()) {
      logger.debug('auth', 'Attempting Firebase login');
      const firebaseResult = await firebaseService.login(email, password);
      
      if (firebaseResult.success) {
        // Сохраняем пользователя локально
        await storage.setItem(AUTH_KEY, JSON.stringify({
          user: firebaseResult.user,
          provider: 'firebase',
        }));
        
        set({ user: firebaseResult.user, isGuest: false, isPro: firebaseResult.user.isPro || false });
        
        // Устанавливаем userId и загружаем коллекцию из Firebase
        try {
          const { setUserId } = await import('../services/database');
          const { userCollectionService } = await import('../services/UserCollectionService');
          
          await setUserId(firebaseResult.user.id);
          await userCollectionService.loadFromFirebase();
        } catch (error) {
          logger.warn('auth', 'Error loading collection from Firebase', error);
        }

        logger.debug('auth', 'Firebase login successful');
        return { success: true };
      } else {
        logger.warn('auth', 'Firebase login failed', firebaseResult.error);
        return { success: false, error: firebaseResult.error };
      }
    }

    if (!OFFLINE_AUTH_ALLOWED) {
      return {
        success: false,
        error: 'Сервис авторизации временно недоступен. Попробуйте позже.',
      };
    }

    // Fallback на локальную авторизацию
    try {
      logger.warn('auth', 'Using offline login fallback');
      const user = { 
        email, 
        name: email.split('@')[0],
        id: Date.now().toString(),
      };
      
      await storage.setItem(AUTH_KEY, JSON.stringify({ 
        user,
        provider: 'local',
      }));
      set({ user, isGuest: false });

      logger.debug('auth', 'Offline login successful');
      return { success: true, warning: 'Работа в офлайн режиме' };
    } catch (error) {
      logger.error('auth', 'Login error', error);
      return { success: false, error: 'Ошибка входа' };
    }
  },

  // Register
  register: async (email, password, nickname, photo = null) => {
    logger.debug('auth', 'Register requested', { email, nickname, hasPhoto: !!photo });
    
    // Пробуем Firebase сначала
    if (firebaseService.isAvailable()) {
      logger.debug('auth', 'Attempting Firebase registration');
      const firebaseResult = await firebaseService.register(email, password, nickname, photo);
      
      if (firebaseResult.success) {
        // НЕ сохраняем пользователя локально - он должен подтвердить email
        logger.debug('auth', 'Firebase registration succeeded; waiting email verification');
        return { success: true, requiresVerification: true };
      } else {
        logger.warn('auth', 'Firebase registration failed', firebaseResult.error);
        return { success: false, error: firebaseResult.error };
      }
    }

    if (!OFFLINE_AUTH_ALLOWED) {
      return {
        success: false,
        error: 'Регистрация временно недоступна. Попробуйте позже.',
      };
    }

    // Fallback на локальную регистрацию (только для разработки)
    try {
      logger.warn('auth', 'Using offline registration fallback');
      
      const user = { 
        email, 
        name: nickname || email.split('@')[0],
        id: Date.now().toString(),
        photo,
      };
      
      await storage.setItem(AUTH_KEY, JSON.stringify({ 
        user,
        provider: 'local',
      }));
      set({ user, isGuest: false });

      logger.debug('auth', 'Offline registration successful');
      return { success: true, warning: 'Работа в офлайн режиме' };
    } catch (storageError) {
      logger.error('auth', 'Storage error during registration', storageError);
      return { success: false, error: 'Ошибка сохранения данных' };
    }
  },

  // Logout
  logout: async () => {
    try {
      logger.debug('auth', 'Logout requested');
      
      // Проверяем провайдера
      const stored = await storage.getItem(AUTH_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.provider === 'firebase' && firebaseService.isAvailable()) {
          // Выходим из Firebase
          await firebaseService.logout();
        }
      }
      
      // Очищаем локальное хранилище
      await storage.removeItem(AUTH_KEY);
      
      // Очищаем userId в коллекции
      const { setUserId } = await import('../services/database');
      await setUserId(null);
      
      // Обновляем состояние
      set({ user: null, isGuest: true, isPro: false });

      logger.debug('auth', 'Logout successful');
    } catch (error) {
      logger.error('auth', 'Logout error', error);
    }
  },

  // Получить токен для API запросов
  getToken: async () => {
    try {
      const stored = await storage.getItem(AUTH_KEY);
      if (stored) {
        const { token } = JSON.parse(stored);
        return token;
      }
      return null;
    } catch (error) {
      logger.error('auth', 'Error getting token', error);
      return null;
    }
  },

  // Обновить статус PRO (через backend API)
  updateProStatus: async (proCode) => {
    try {
      const { user } = get();
      if (!user) {
        return { success: false, error: 'Пользователь не авторизован' };
      }

      if (!API_URL) {
        return { success: false, error: 'API URL не настроен' };
      }

      const normalizedCode = String(proCode || '').trim();
      if (!normalizedCode) {
        return { success: false, error: 'Введите PRO код' };
      }

      // PRO статус устанавливается ТОЛЬКО через backend
      const token = await firebaseService.getCurrentUser()?.getIdToken();
      if (!token) {
        return { success: false, error: 'Не авторизован' };
      }

      const endpoint = buildApiUrl('/api/v1/auth/activate-pro');
      const result = await fetchJsonWithTimeout(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ proCode: normalizedCode }),
      }, runtimeConfig.requestTimeoutMs);
      
      if (result.success) {
        const updatedUser = { ...user, isPro: true };
        set({ user: updatedUser, isPro: true });
        
        const stored = await storage.getItem(AUTH_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          data.user = updatedUser;
          await storage.setItem(AUTH_KEY, JSON.stringify(data));
        }

        logger.info('auth', 'PRO status activated via backend');
        return { success: true };
      }
      
      return { success: false, error: result.error || 'Ошибка активации PRO' };
    } catch (error) {
      logger.error('auth', 'Error updating PRO status', error);
      return { success: false, error: getErrorMessage(error, 'Ошибка активации PRO') };
    }
  },

  // Проверить статус PRO
  checkProStatus: async () => {
    try {
      const { user } = get();
      if (!user) {
        return { success: false, isPro: false };
      }

      if (firebaseService.isAvailable()) {
        const result = await firebaseService.checkProStatus(user.id);
        
        if (result.success) {
          set({ isPro: result.isPro });
          return result;
        }
      }
      
      return { success: false, isPro: false };
    } catch (error) {
      logger.error('auth', 'Error checking PRO status', error);
      return { success: false, isPro: false };
    }
  },
}));
