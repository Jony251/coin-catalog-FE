import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../../stores/authStore';
import PricingPlans from '../../components/PricingPlans';

export default function RegisterScreen() {
  const router = useRouter();
  const register = useAuthStore((state) => state.register);
  
  const [nickname, setNickname] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [captchaVerified, setCaptchaVerified] = useState(false);
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const [captchaQuestion, setCaptchaQuestion] = useState({ num1: 0, num2: 0, answer: 0 });
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('free');

  const generateCaptcha = () => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    setCaptchaQuestion({ num1, num2, answer: num1 + num2 });
    setCaptchaAnswer('');
    setCaptchaVerified(false);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const verifyCaptcha = (answer) => {
    if (parseInt(answer) === captchaQuestion.answer) {
      setCaptchaVerified(true);
    } else if (answer.length > 0 && parseInt(answer) !== captchaQuestion.answer) {
      // Неверный ответ - сбрасываем
      setCaptchaVerified(false);
    }
  };

  const handleCaptchaChange = (text) => {
    setCaptchaAnswer(text);
    // Автоматическая проверка при вводе
    if (text.trim() !== '') {
      verifyCaptcha(text);
    } else {
      setCaptchaVerified(false);
    }
  };

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Ошибка', 'Необходимо разрешение на доступ к галерее');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setPhoto(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    console.log('=== handleRegister called ===');
    console.log('Form data:', { nickname, email, hasPassword: !!password, hasConfirmPassword: !!confirmPassword, captchaVerified, hasPhoto: !!photo });
    
    // Валидация ника
    if (!nickname || !nickname.trim()) {
      console.log('Validation failed: nickname empty');
      Alert.alert('Ошибка', 'Введите никнейм');
      return;
    }

    if (nickname.trim().length < 3) {
      Alert.alert('Ошибка', 'Никнейм должен быть не менее 3 символов');
      return;
    }

    // Валидация email
    if (!email || !email.trim()) {
      Alert.alert('Ошибка', 'Введите email');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Ошибка', 'Введите корректный email');
      return;
    }

    // Валидация пароля
    if (!password || !password.trim()) {
      Alert.alert('Ошибка', 'Введите пароль');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Ошибка', 'Пароль должен быть не менее 6 символов');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Ошибка', 'Пароли не совпадают');
      return;
    }

    // Проверка капчи
    if (!captchaVerified) {
      Alert.alert('Ошибка', 'Пожалуйста, пройдите проверку "Я не робот"');
      return;
    }

    try {
      setLoading(true);
      console.log('Calling register with:', { email, password: '***', nickname, hasPhoto: !!photo });
      const result = await register(email, password, nickname, photo);
      
      console.log('Registration result:', result);

      if (result.success) {
        console.log('Registration successful, showing verification message');
        
        const verificationMessage = 'Регистрация успешна!\n\nНа ваш email отправлено письмо с подтверждением.\n\nПожалуйста, подтвердите email в течение 24 часов, иначе аккаунт будет удален.';
        
        if (Platform.OS === 'web') {
          window.alert(verificationMessage);
          router.replace('/auth/login');
        } else {
          Alert.alert('Успешно!', verificationMessage, [
            { text: 'OK', onPress: () => router.replace('/auth/login') }
          ]);
        }
      } else {
        console.error('Registration failed:', result.error);
        if (Platform.OS === 'web') {
          window.alert('Ошибка: ' + (result.error || 'Не удалось зарегистрироваться'));
        } else {
          Alert.alert('Ошибка', result.error || 'Не удалось зарегистрироваться');
        }
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (Platform.OS === 'web') {
        window.alert('Ошибка: Произошла ошибка при регистрации');
      } else {
        Alert.alert('Ошибка', 'Произошла ошибка при регистрации');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logo}>
              <Image 
                source={require('../../assets/logo.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>Регистрация</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {/* Photo Upload */}
            <TouchableOpacity style={styles.photoUpload} onPress={pickImage}>
              {photo ? (
                <Image source={{ uri: photo }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Ionicons name="camera" size={40} color="#B8860B" />
                  <Text style={styles.photoPlaceholderText}>Добавить фото</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Никнейм *"
                value={nickname}
                onChangeText={setNickname}
                placeholderTextColor="#888"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email *"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#888"
              />
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Пароль *"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#888"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#888"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#888" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Повторите пароль *"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                placeholderTextColor="#888"
              />
            </View>

            {/* Captcha */}
            <View style={styles.captchaContainer}>
              <View style={styles.captchaQuestion}>
                <Ionicons name="shield-checkmark" size={20} color="#B8860B" />
                <Text style={styles.captchaText}>
                  Я не робот: {captchaQuestion.num1} + {captchaQuestion.num2} = ?
                </Text>
              </View>
              <View style={styles.captchaInputRow}>
                <TextInput
                  style={[styles.captchaInput, captchaVerified && styles.captchaInputSuccess]}
                  placeholder="Введите ответ"
                  value={captchaAnswer}
                  onChangeText={handleCaptchaChange}
                  keyboardType="numeric"
                  placeholderTextColor="#888"
                  editable={!captchaVerified}
                />
                {captchaVerified && (
                  <Ionicons name="checkmark-circle" size={24} color="#4CAF50" style={styles.captchaCheckmark} />
                )}
                <TouchableOpacity onPress={generateCaptcha} style={styles.captchaRefresh}>
                  <Ionicons name="refresh" size={20} color="#666" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.button, loading && styles.buttonDisabled]}
              onPress={handleRegister}
              disabled={loading}
            >
              <Text style={styles.buttonText}>
                {loading ? 'Регистрация...' : 'Зарегистрироваться'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.linkButton}
              onPress={() => router.replace('/auth/login')}
            >
              <Text style={styles.linkText}>
                Уже есть аккаунт? <Text style={styles.linkTextBold}>Войти</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* Pricing Plans */}
          <PricingPlans 
            selectedPlan={selectedPlan}
            onSelectPlan={setSelectedPlan}
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  form: {
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#B8860B',
    borderRadius: 10,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    alignItems: 'center',
    marginTop: 20,
  },
  linkText: {
    color: '#888',
    fontSize: 14,
  },
  linkTextBold: {
    color: '#B8860B',
    fontWeight: 'bold',
  },
  benefits: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  benefitText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 10,
  },
  photoUpload: {
    alignSelf: 'center',
    marginBottom: 20,
  },
  photoPreview: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  photoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#B8860B',
    borderStyle: 'dashed',
  },
  photoPlaceholderText: {
    fontSize: 12,
    color: '#B8860B',
    marginTop: 5,
  },
  captchaContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  captchaQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  captchaText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 10,
  },
  captchaInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  captchaInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    height: 40,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  captchaInputSuccess: {
    borderColor: '#4CAF50',
    borderWidth: 2,
    backgroundColor: '#f1f8f4',
  },
  captchaCheckmark: {
    marginLeft: 10,
  },
  captchaRefresh: {
    padding: 8,
  },
});
