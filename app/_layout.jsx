import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { View, Platform } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { initDatabase } from '../services/database';
import { useAuthStore } from '../stores/authStore';
import DataLoadingScreen from '../components/DataLoadingScreen';
import { runtimeConfig } from '../config/runtime';
import { logger } from '../utils/logger';

// Fixed height for Android navigation bar
const ANDROID_NAV_BAR_HEIGHT = 48;

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const loadUser = useAuthStore((state) => state.loadUser);
  const isGuest = useAuthStore((state) => state.isGuest);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (runtimeConfig.hasUnsafeProductionApiUrl) {
      logger.warn(
        'config',
        'Production build uses missing/unsafe API_URL. Set HTTPS public backend URL before release.'
      );
    }
  }, []);

  useEffect(() => {
    // Initialize database and load user on app start
    const init = async () => {
      try {
        logger.info('app', 'Initializing application');
        await initDatabase(); // Сначала инициализируем без userId
        const userData = await loadUser(); // Загружаем пользователя
        
        // Если пользователь авторизован, переинициализируем с userId и синхронизируем
        if (userData && userData.id) {
          const { setUserId } = await import('../services/database');
          await setUserId(userData.id);
          
          // Синхронизация коллекции в фоне
          try {
            const { userCollectionService } = await import('../services/UserCollectionService');
            // 1. Отправляем локальные изменения на сервер
            await userCollectionService.syncAll();
            // 2. Загружаем обновления с сервера
            await userCollectionService.loadFromFirebase();
            logger.debug('app', 'Collection sync completed');
          } catch (syncError) {
            logger.warn('app', 'Collection sync error (non-critical)', syncError?.message);
          }
        }

        logger.info('app', 'Application initialized');
      } catch (error) {
        logger.error('app', 'Initialization error', error);
      } finally {
        setIsDataLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    // Защита роутов - только авторизованные пользователи
    if (isLoading) return; // Ждем загрузки

    const inAuthGroup = segments[0] === 'auth';
    const onWelcome = segments[0] === 'welcome' || segments.length === 0;
    const inTabs = segments[0] === '(tabs)';

    if (isGuest && !inAuthGroup && !onWelcome) {
      // Неавторизованный пользователь пытается попасть куда-то кроме auth/welcome - редирект на welcome
      router.replace('/welcome');
    } else if (!isGuest && (inAuthGroup || onWelcome)) {
      // Авторизованный пользователь на auth/welcome - редирект на главную
      router.replace('/(tabs)');
    }
  }, [isGuest, isLoading, segments]);

  // Показываем экран загрузки при первом запуске
  if (isDataLoading) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <DataLoadingScreen message="Загрузка каталога монет..." />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#eeb525ff',
          },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      >
        <Stack.Screen 
          name="welcome" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="coin/[id]" 
          options={{ 
            title: 'Монета',
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="ruler/[id]" 
          options={{ 
            title: 'Правитель',
          }} 
        />
        <Stack.Screen 
          name="ruler/[id]/coins" 
          options={{ 
            title: 'Монеты',
            presentation: 'card',
          }} 
        />
        <Stack.Screen 
          name="denomination/[rulerId]/[type]" 
          options={{ 
            title: 'Номинал',
          }} 
        />
        <Stack.Screen 
          name="auth/login" 
          options={{ 
            presentation: Platform.OS === 'web' ? 'card' : 'modal',
            title: 'Вход',
            headerShown: false,
          }} 
        />
        <Stack.Screen 
          name="auth/register" 
          options={{ 
            presentation: Platform.OS === 'web' ? 'card' : 'modal',
            title: 'Регистрация',
            headerShown: false,
          }} 
        />
      </Stack>
    </SafeAreaProvider>
  );
}
