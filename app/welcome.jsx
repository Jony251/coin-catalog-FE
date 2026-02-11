import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function WelcomeScreen() {
  const router = useRouter();

  const openBlueCatWebsite = () => {
    // TODO: ADD THE URL TO THE BLUE CAT WEBSITE 
    const url = '#';
    Linking.openURL(url).catch(err => console.error('Failed to open URL:', err));
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero Section */}
      <View style={styles.hero}>
        <View style={styles.logoContainer}>
          <Image 
            source={require('../assets/logo.png')} 
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.title}>Каталог монет</Text>
        <Text style={styles.subtitle}>Ваша коллекция в одном приложении</Text>
      </View>

      {/* About Numismatics */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>О нумизматике</Text>
        <Text style={styles.description}>
          Нумизматика — это увлекательное хобби и наука о монетах, их истории и коллекционировании. 
          Каждая монета — это маленький кусочек истории, отражающий эпоху, культуру и экономику своего времени.
        </Text>
      </View>

      {/* Features */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Возможности приложения</Text>
        
        <View style={styles.featureCard}>
          <Ionicons name="book-outline" size={32} color="#B8860B" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Полный каталог</Text>
            <Text style={styles.featureText}>
              Обширная база монет разных стран и эпох — все в одном месте
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="albums-outline" size={32} color="#B8860B" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Личная коллекция</Text>
            <Text style={styles.featureText}>
              Отмечайте монеты, которые у вас есть, и отслеживайте свою коллекцию
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="heart-outline" size={32} color="#B8860B" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Список желаний</Text>
            <Text style={styles.featureText}>
              Создавайте wishlist монет, которые хотите приобрести
            </Text>
          </View>
        </View>

        <View style={styles.featureCard}>
          <Ionicons name="cloud-outline" size={32} color="#B8860B" />
          <View style={styles.featureContent}>
            <Text style={styles.featureTitle}>Синхронизация</Text>
            <Text style={styles.featureText}>
              Ваша коллекция всегда с вами на всех устройствах
            </Text>
          </View>
        </View>
      </View>

      {/* Historical Facts */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Интересные факты</Text>
        
        <View style={styles.factCard}>
          <Ionicons name="information-circle" size={24} color="#B8860B" />
          <Text style={styles.factText}>
            Первые монеты появились в VII веке до н.э. в Лидии (современная Турция)
          </Text>
        </View>

        <View style={styles.factCard}>
          <Ionicons name="information-circle" size={24} color="#B8860B" />
          <Text style={styles.factText}>
            Самая дорогая монета в мире — Double Eagle 1933 года, проданная за $18.9 млн
          </Text>
        </View>

        <View style={styles.factCard}>
          <Ionicons name="information-circle" size={24} color="#B8860B" />
          <Text style={styles.factText}>
            В России первые монеты появились в X веке при князе Владимире
          </Text>
        </View>
      </View>

      {/* CTA Buttons */}
      <View style={styles.ctaSection}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => router.push('/auth/register')}
        >
          <Text style={styles.primaryButtonText}>Создать аккаунт</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => router.push('/auth/login')}
        >
          <Text style={styles.secondaryButtonText}>Уже есть аккаунт? Войти</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Начните свое путешествие в мир нумизматики
        </Text>
        <View style={styles.copyrightContainer}>
          <Text style={styles.footerText}>Все права защищены © 2025 </Text>
          <TouchableOpacity onPress={openBlueCatWebsite}>
            <Text style={styles.linkText}>Blue Cat</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    paddingBottom: 40,
  },
  hero: {
    backgroundColor: '#fff',
    paddingVertical: 60,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  logoContainer: {
    marginBottom: 20,
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 15,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: '#555',
    textAlign: 'justify',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#B8860B',
  },
  featureContent: {
    flex: 1,
    marginLeft: 15,
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  factCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
  },
  factText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    marginLeft: 10,
    lineHeight: 20,
  },
  ctaSection: {
    padding: 20,
    marginTop: 15,
  },
  primaryButton: {
    backgroundColor: '#B8860B',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  },
  secondaryButton: {
    backgroundColor: '#fff',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#B8860B',
    marginBottom: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#B8860B',
    fontSize: 16,
    fontWeight: '600',
  },
  guestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  guestButtonText: {
    color: '#666',
    fontSize: 14,
    marginRight: 6,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  copyrightContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 5,
  },
  linkText: {
    fontSize: 14,
    color: '#B8860B',
    fontStyle: 'italic',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});
