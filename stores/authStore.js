import { create } from 'zustand';
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import firebaseService from '../services/FirebaseService';

const AUTH_KEY = 'coin_catalog_auth';
const isWeb = Platform.OS === 'web';

// API URL из .env или localhost
const API_URL = Constants.expoConfig?.extra?.apiUrl || 'http://localhost:3000';

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
          console.log('Offline session detected, Firebase now available — clearing stale session');
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
                console.log('Profile refreshed from Firebase, isPro:', user.isPro);
              }
            }
          } catch (refreshError) {
            console.warn('Could not refresh profile from Firebase:', refreshError.message);
          }
        }
        
        return user;
      } else {
        set({ isGuest: true, isLoading: false });
        return null;
      }
    } catch (error) {
      console.error('Error loading user:', error);
      set({ isGuest: true, isLoading: false });
      return null;
    }
  },

  // Login
  login: async (email, password) => {
    console.log('Login called with:', { email, hasPassword: !!password });
    
    // Пробуем Firebase сначала
    if (firebaseService.isAvailable()) {
      console.log('Attempting Firebase login');
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
          console.warn('Error loading collection from Firebase:', error);
        }
        
        console.log('Login successful (Firebase)');
        return { success: true };
      } else {
        console.warn('Firebase login failed:', firebaseResult.error);
        return { success: false, error: firebaseResult.error };
      }
    }
    
    // Fallback на локальную авторизацию
    try {
      console.log('Using offline login');
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
      
      console.log('Login successful (offline)');
      return { success: true, warning: 'Работа в офлайн режиме' };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: 'Ошибка входа' };
    }
  },

  // Register
  register: async (email, password, nickname, photo = null) => {
    console.log('Register called with:', { email, hasPassword: !!password, nickname, hasPhoto: !!photo });
    
    // Пробуем Firebase сначала
    if (firebaseService.isAvailable()) {
      console.log('Attempting Firebase registration');
      const firebaseResult = await firebaseService.register(email, password, nickname, photo);
      
      if (firebaseResult.success) {
        // НЕ сохраняем пользователя локально - он должен подтвердить email
        console.log('Registration successful (Firebase) - awaiting email verification');
        return { success: true, requiresVerification: true };
      } else {
        console.warn('Firebase registration failed:', firebaseResult.error);
        return { success: false, error: firebaseResult.error };
      }
    }
    
    // Fallback на локальную регистрацию (только для разработки)
    try {
      console.log('Using offline registration');
      
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
      
      console.log('Registration successful (offline)');
      return { success: true, warning: 'Работа в офлайн режиме' };
    } catch (storageError) {
      console.error('Storage error:', storageError);
      return { success: false, error: 'Ошибка сохранения данных' };
    }
  },

  // Logout
  logout: async () => {
    try {
      console.log('Logout called');
      
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
      
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
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
      console.error('Error getting token:', error);
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

      // PRO статус устанавливается ТОЛЬКО через backend
      const token = await firebaseService.getCurrentUser()?.getIdToken();
      if (!token) {
        return { success: false, error: 'Не авторизован' };
      }

      const response = await fetch(`${API_URL}/api/v1/auth/activate-pro`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ proCode }),
      });

      const result = await response.json();
      
      if (result.success) {
        const updatedUser = { ...user, isPro: true };
        set({ user: updatedUser, isPro: true });
        
        const stored = await storage.getItem(AUTH_KEY);
        if (stored) {
          const data = JSON.parse(stored);
          data.user = updatedUser;
          await storage.setItem(AUTH_KEY, JSON.stringify(data));
        }
        
        console.log('PRO status activated via backend');
        return { success: true };
      }
      
      return { success: false, error: result.error || 'Ошибка активации PRO' };
    } catch (error) {
      console.error('Error updating PRO status:', error);
      return { success: false, error: error.message };
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
      console.error('Error checking PRO status:', error);
      return { success: false, isPro: false };
    }
  },
}));
