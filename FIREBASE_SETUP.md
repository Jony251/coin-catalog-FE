# Настройка Firebase для Coin Catalog

## Шаг 1: Создание проекта Firebase

1. Перейдите на https://console.firebase.google.com/
2. Нажмите "Add project" (Добавить проект)
3. Введите название проекта: **Coin Catalog**
4. Отключите Google Analytics (необязательно для начала)
5. Нажмите "Create project"

## Шаг 2: Настройка Authentication

1. В левом меню выберите **Authentication**
2. Нажмите "Get started"
3. Выберите метод входа **Email/Password**
4. Включите переключатель "Enable"
5. Нажмите "Save"

## Шаг 3: Настройка Firestore Database

1. В левом меню выберите **Firestore Database**
2. Нажмите "Create database"
3. Выберите режим: **Start in test mode** (для разработки)
4. Выберите регион: **europe-west** (ближайший к вам)
5. Нажмите "Enable"

### Правила безопасности Firestore (важно!)

После создания базы данных, перейдите в раздел **Rules** и замените правила на:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Пользователи могут читать и изменять только свои данные
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Коллекции монет пользователей
    match /collections/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Списки желаний пользователей
    match /wishlists/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Нажмите "Publish" для сохранения правил.

## Шаг 4: Получение конфигурации для веб-приложения

1. В настройках проекта (иконка шестеренки → Project settings)
2. Прокрутите вниз до раздела "Your apps"
3. Нажмите на иконку **Web** (</>)
4. Введите название приложения: **Coin Catalog Web**
5. Нажмите "Register app"
6. Скопируйте конфигурацию `firebaseConfig`

## Шаг 5: Добавление конфигурации в приложение

Откройте файл `config/firebase.js` и замените значения:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",              // Замените на ваш API Key
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

## Шаг 6: Проверка работы

После настройки:

1. Перезапустите приложение
2. Попробуйте зарегистрироваться
3. Проверьте в Firebase Console:
   - **Authentication** → Users (должен появиться новый пользователь)
   - **Firestore Database** → Data (должны появиться коллекции)

## Структура данных в Firestore

### Коллекция `users`
```
users/{userId}
  - email: string
  - displayName: string
  - createdAt: timestamp
  - updatedAt: timestamp
```

### Коллекция `collections`
```
collections/{userId}
  - userId: string
  - coins: array
    - coinId: string
    - quantity: number
    - condition: string
    - notes: string
    - addedAt: string
  - updatedAt: timestamp
```

### Коллекция `wishlists`
```
wishlists/{userId}
  - userId: string
  - coins: array
    - coinId: string
    - priority: string
    - notes: string
    - addedAt: string
  - updatedAt: timestamp
```

## Важные замечания

1. **Безопасность**: В production режиме обязательно настройте строгие правила безопасности
2. **Лимиты**: Бесплатный план Firebase имеет лимиты:
   - 50,000 чтений в день
   - 20,000 записей в день
   - 1 GB хранилища
3. **Офлайн режим**: Приложение продолжит работать локально, если Firebase недоступен
4. **Синхронизация**: Данные синхронизируются автоматически при входе пользователя

## Тестирование

Для тестирования без Firebase:
- Приложение автоматически переключится в офлайн режим
- Все данные будут храниться локально
- При настройке Firebase данные можно будет синхронизировать
