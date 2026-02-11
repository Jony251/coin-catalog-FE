# Использование Firebase в приложении

## Как это работает

### Архитектура

```
┌─────────────────────────────────────────────────┐
│                 Приложение                       │
├─────────────────────────────────────────────────┤
│  Локальная база данных (SQLite/localStorage)    │
│  - Каталог монет                                 │
│  - Правители и периоды                           │
│  - Описания и изображения                        │
└─────────────────────────────────────────────────┘
                      ↕ Синхронизация
┌─────────────────────────────────────────────────┐
│              Firebase Cloud                      │
├─────────────────────────────────────────────────┤
│  Authentication - Пользователи                   │
│  Firestore - Коллекции пользователей            │
│           - Списки желаний                       │
└─────────────────────────────────────────────────┘
```

## Регистрация и вход

### Регистрация нового пользователя

```javascript
// Автоматически использует Firebase, если настроен
const result = await authStore.register(
  'user@example.com',
  'password123',
  'Имя пользователя'
);

if (result.success) {
  // Пользователь зарегистрирован в Firebase
  // Данные сохранены локально
  console.log('Регистрация успешна');
} else {
  console.error('Ошибка:', result.error);
}
```

### Вход пользователя

```javascript
const result = await authStore.login(
  'user@example.com',
  'password123'
);

if (result.success) {
  // Пользователь вошел через Firebase
  // Автоматически загружаются данные из облака
  console.log('Вход выполнен');
}
```

## Синхронизация коллекции

### Автоматическая синхронизация

Синхронизация происходит автоматически:
- При входе пользователя
- При добавлении/удалении монет
- При изменении списка желаний

### Ручная синхронизация

```javascript
import syncService from './services/SyncService';

// Синхронизировать коллекцию
const result = await syncService.syncCollection(localCoins);

if (result.success) {
  console.log('Синхронизировано монет:', result.mergedCoins.length);
  console.log('Время синхронизации:', result.syncTime);
}
```

### Синхронизация списка желаний

```javascript
const result = await syncService.syncWishlist(localWishlist);

if (result.success) {
  console.log('Список желаний синхронизирован');
}
```

## Офлайн режим

### Как работает офлайн режим

1. **Firebase недоступен** → Приложение работает локально
2. **Нет интернета** → Все данные сохраняются локально
3. **Интернет появился** → Автоматическая синхронизация

### Проверка статуса

```javascript
import firebaseService from './services/FirebaseService';

if (firebaseService.isAvailable()) {
  console.log('Firebase подключен');
} else {
  console.log('Работа в офлайн режиме');
}
```

## Добавление монеты в коллекцию

```javascript
import firebaseService from './services/FirebaseService';

// Добавляем монету локально
await userCollectionService.addCoin(coinId, quantity, condition);

// Если пользователь авторизован - синхронизируем с Firebase
const user = authStore.user;
if (user && user.id && firebaseService.isAvailable()) {
  await firebaseService.addCoinToCollection(user.id, {
    coinId,
    quantity,
    condition,
    addedAt: new Date().toISOString(),
  });
}
```

## Удаление монеты из коллекции

```javascript
// Удаляем локально
await userCollectionService.removeCoin(coinId);

// Синхронизируем с Firebase
if (user && user.id && firebaseService.isAvailable()) {
  await firebaseService.removeCoinFromCollection(user.id, coinId);
}
```

## Загрузка данных из облака

```javascript
// При входе пользователя автоматически загружаются данные
const user = authStore.user;

if (user && user.id) {
  // Загружаем коллекцию
  const collectionResult = await firebaseService.loadUserCollection(user.id);
  if (collectionResult.success) {
    console.log('Загружено монет:', collectionResult.coins.length);
  }

  // Загружаем список желаний
  const wishlistResult = await firebaseService.loadWishlist(user.id);
  if (wishlistResult.success) {
    console.log('Загружено желаний:', wishlistResult.coins.length);
  }
}
```

## Обработка конфликтов

При синхронизации используется стратегия "последнее изменение побеждает":

1. Сравниваются даты `addedAt` локальной и облачной версий
2. Выбирается более свежая версия
3. Объединенные данные сохраняются в облако

```javascript
// Пример объединения данных
const mergedCoins = syncService.mergeCollections(
  localCoins,   // Локальные данные
  cloudCoins    // Данные из Firebase
);
```

## Проверка времени последней синхронизации

```javascript
const lastSync = syncService.getLastSyncTime();

if (lastSync) {
  console.log('Последняя синхронизация:', lastSync.toLocaleString());
} else {
  console.log('Синхронизация еще не выполнялась');
}
```

## Отладка

### Включение логов Firebase

Все операции Firebase логируются в консоль:

```javascript
// Регистрация
console.log('Firebase registration successful:', userId);

// Вход
console.log('Firebase login successful:', userId);

// Синхронизация
console.log('Collection synced to Firebase:', coinsCount, 'coins');
```

### Проверка данных в Firebase Console

1. Откройте https://console.firebase.google.com/
2. Выберите проект "Coin Catalog"
3. Перейдите в **Firestore Database**
4. Проверьте коллекции:
   - `users/{userId}` - данные пользователя
   - `collections/{userId}` - коллекция монет
   - `wishlists/{userId}` - список желаний

## Миграция существующих пользователей

Если у вас уже есть локальные пользователи:

1. Пользователь входит с существующими данными
2. Система автоматически создает аккаунт в Firebase
3. Локальные данные синхронизируются с облаком
4. При следующем входе данные загружаются из Firebase

## Безопасность

### Правила Firestore

Пользователи могут читать и изменять только свои данные:

```javascript
// Правило в Firestore
allow read, write: if request.auth != null && request.auth.uid == userId;
```

### Хранение паролей

- Пароли хранятся в Firebase Authentication
- Локально пароли НЕ сохраняются
- Используется безопасное хранилище (SecureStore на мобильных)

## Ограничения бесплатного плана

Firebase Spark (бесплатный):
- ✅ 50,000 чтений в день
- ✅ 20,000 записей в день
- ✅ 1 GB хранилища
- ✅ 10 GB передачи данных в месяц

Для большинства пользователей этого достаточно.

## Что дальше?

После настройки Firebase:

1. ✅ Регистрация работает через Firebase
2. ✅ Вход работает через Firebase
3. ✅ Коллекции синхронизируются автоматически
4. ✅ Офлайн режим работает как раньше
5. ✅ Данные доступны на всех устройствах

Приложение готово к использованию!
