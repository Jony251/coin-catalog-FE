import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendEmailVerification
} from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { auth, db } from '../config/firebase';

/**
 * FirebaseService - сервис для работы с Firebase
 * Управляет аутентификацией и синхронизацией данных пользователя
 */
class FirebaseService {
  constructor() {
    this.auth = auth;
    this.db = db;
    this.currentUser = null;
  }

  /**
   * Проверка доступности Firebase
   */
  isAvailable() {
    return this.auth && this.db;
  }

  /**
   * Регистрация нового пользователя
   */
  async register(email, password, nickname, photo = null) {
    try {
      console.log('FirebaseService.register called with:', { email, nickname, hasPhoto: !!photo });
      
      if (!this.isAvailable()) {
        console.error('Firebase not available');
        throw new Error('Firebase not initialized');
      }

      console.log('Creating user in Firebase Auth...');
      // Создаем пользователя в Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        this.auth,
        email,
        password
      );
      console.log('User created in Firebase Auth:', userCredential.user.uid);

      const user = userCredential.user;

      // Обновляем профиль с именем
      if (nickname) {
        console.log('Updating user profile with nickname...');
        await updateProfile(user, { displayName: nickname });
        console.log('Profile updated');
      }

      // Создаем документ пользователя в Firestore
      console.log('Creating user document in Firestore...');
      await setDoc(doc(this.db, 'users', user.uid), {
        email: user.email,
        nickname: nickname || email.split('@')[0],
        displayName: nickname || email.split('@')[0],
        photo: photo || null,
        emailVerified: false,
        isPro: false,
        proActivatedAt: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        verificationDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });

      // Отправляем email верификацию
      console.log('Sending email verification...');
      await sendEmailVerification(user);
      console.log('Email verification sent to:', user.email);
      
      console.log('Firebase registration successful:', user.uid);

      return {
        success: true,
        user: {
          id: user.uid,
          email: user.email,
          name: nickname || email.split('@')[0],
          emailVerified: false,
        },
      };
    } catch (error) {
      console.error('Firebase registration error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', JSON.stringify(error, null, 2));
      
      let errorMessage = 'Ошибка регистрации';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email уже используется';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Слишком слабый пароль';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Некорректный email';
      } else if (error.message) {
        errorMessage = `Ошибка: ${error.message}`;
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Вход пользователя
   */
  async login(email, password) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firebase not initialized');
      }

      const userCredential = await signInWithEmailAndPassword(
        this.auth,
        email,
        password
      );

      const user = userCredential.user;

      // Получаем данные пользователя из Firestore
      const userDoc = await getDoc(doc(this.db, 'users', user.uid));
      const userData = userDoc.data();

      console.log('Firebase login successful:', user.uid);

      return {
        success: true,
        user: {
          id: user.uid,
          email: user.email,
          name: userData?.displayName || user.displayName || email.split('@')[0],
          isPro: userData?.isPro || false,
          photo: userData?.photo || null,
        },
      };
    } catch (error) {
      console.error('Firebase login error:', error);
      
      let errorMessage = 'Ошибка входа';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Пользователь не найден';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Неверный пароль';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Некорректный email';
      }

      return { success: false, error: errorMessage };
    }
  }

  /**
   * Выход пользователя
   */
  async logout() {
    try {
      if (!this.isAvailable()) {
        return { success: true };
      }

      await signOut(this.auth);
      console.log('Firebase logout successful');
      return { success: true };
    } catch (error) {
      console.error('Firebase logout error:', error);
      return { success: false, error: 'Ошибка выхода' };
    }
  }

  /**
   * Получить текущего пользователя
   */
  getCurrentUser() {
    return this.auth?.currentUser;
  }

  /**
   * Получить профиль пользователя из Firestore
   */
  async getUserProfile(userId) {
    try {
      if (!this.isAvailable()) return null;
      const userDoc = await getDoc(doc(this.db, 'users', userId));
      if (userDoc.exists()) {
        return userDoc.data();
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Подписка на изменения состояния аутентификации
   */
  onAuthStateChange(callback) {
    if (!this.isAvailable()) {
      return () => {};
    }

    return onAuthStateChanged(this.auth, callback);
  }

  // ==================== СИНХРОНИЗАЦИЯ КОЛЛЕКЦИИ ====================

  /**
   * Сохранить коллекцию пользователя в Firestore
   */
  async syncUserCollection(userId, coins) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firebase not initialized');
      }

      const collectionRef = doc(this.db, 'collections', userId);
      
      await setDoc(collectionRef, {
        userId,
        coins: coins.map(coin => ({
          coinId: coin.coinId,
          quantity: coin.quantity || 1,
          condition: coin.condition || 'good',
          grade: coin.grade || null,
          purchasePrice: coin.purchasePrice || null,
          purchaseDate: coin.purchaseDate || null,
          notes: coin.notes || '',
          userObverseImage: coin.userObverseImage || null,
          userReverseImage: coin.userReverseImage || null,
          userWeight: coin.userWeight || null,
          userDiameter: coin.userDiameter || null,
          isWishlist: coin.isWishlist || false,
          addedAt: coin.addedAt || new Date().toISOString(),
        })),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      console.log('Collection synced to Firebase:', coins.length, 'coins');
      return { success: true };
    } catch (error) {
      console.error('Firebase sync error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Загрузить коллекцию пользователя из Firestore
   */
  async loadUserCollection(userId) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firebase not initialized');
      }

      const collectionRef = doc(this.db, 'collections', userId);
      const collectionDoc = await getDoc(collectionRef);

      if (collectionDoc.exists()) {
        const data = collectionDoc.data();
        console.log('Collection loaded from Firebase:', data.coins?.length || 0, 'coins');
        return { success: true, coins: data.coins || [] };
      }

      return { success: true, coins: [] };
    } catch (error) {
      console.error('Firebase load error:', error);
      return { success: false, error: error.message, coins: [] };
    }
  }

  /**
   * Добавить монету в коллекцию в Firestore
   */
  async addCoinToCollection(userId, coin) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firebase not initialized');
      }

      const collectionRef = doc(this.db, 'collections', userId);
      const collectionDoc = await getDoc(collectionRef);

      let coins = [];
      if (collectionDoc.exists()) {
        coins = collectionDoc.data().coins || [];
      }

      // Добавляем новую монету
      coins.push({
        coinId: coin.coinId,
        quantity: coin.quantity || 1,
        condition: coin.condition || 'good',
        notes: coin.notes || '',
        addedAt: new Date().toISOString(),
      });

      await setDoc(collectionRef, {
        userId,
        coins,
        updatedAt: serverTimestamp(),
      });

      console.log('Coin added to Firebase collection');
      return { success: true };
    } catch (error) {
      console.error('Firebase add coin error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Удалить монету из коллекции в Firestore
   */
  async removeCoinFromCollection(userId, coinId) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firebase not initialized');
      }

      const collectionRef = doc(this.db, 'collections', userId);
      const collectionDoc = await getDoc(collectionRef);

      if (collectionDoc.exists()) {
        let coins = collectionDoc.data().coins || [];
        coins = coins.filter(c => c.coinId !== coinId);

        await setDoc(collectionRef, {
          userId,
          coins,
          updatedAt: serverTimestamp(),
        });

        console.log('Coin removed from Firebase collection');
      }

      return { success: true };
    } catch (error) {
      console.error('Firebase remove coin error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Синхронизация списка желаний
   */
  async syncWishlist(userId, wishlist) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firebase not initialized');
      }

      const wishlistRef = doc(this.db, 'wishlists', userId);
      
      await setDoc(wishlistRef, {
        userId,
        coins: wishlist.map(coin => ({
          coinId: coin.coinId,
          priority: coin.priority,
          notes: coin.notes,
          addedAt: coin.addedAt,
        })),
        updatedAt: serverTimestamp(),
      }, { merge: true });

      console.log('Wishlist synced to Firebase:', wishlist.length, 'coins');
      return { success: true };
    } catch (error) {
      console.error('Firebase wishlist sync error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Загрузить список желаний из Firestore
   */
  async loadWishlist(userId) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firebase not initialized');
      }

      const wishlistRef = doc(this.db, 'wishlists', userId);
      const wishlistDoc = await getDoc(wishlistRef);

      if (wishlistDoc.exists()) {
        const data = wishlistDoc.data();
        console.log('Wishlist loaded from Firebase:', data.coins?.length || 0, 'coins');
        return { success: true, coins: data.coins || [] };
      }

      return { success: true, coins: [] };
    } catch (error) {
      console.error('Firebase wishlist load error:', error);
      return { success: false, error: error.message, coins: [] };
    }
  }

  // ==================== PRO АККАУНТ ====================

  /**
   * Проверить статус PRO пользователя
   */
  async checkProStatus(userId) {
    try {
      if (!this.isAvailable()) {
        throw new Error('Firebase not initialized');
      }

      const userRef = doc(this.db, 'users', userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const data = userDoc.data();
        return { 
          success: true, 
          isPro: data.isPro || false,
          proActivatedAt: data.proActivatedAt || null,
        };
      }

      return { success: false, isPro: false };
    } catch (error) {
      console.error('Error checking PRO status:', error);
      return { success: false, error: error.message, isPro: false };
    }
  }
}

// Экспортируем singleton
const firebaseService = new FirebaseService();
export default firebaseService;
