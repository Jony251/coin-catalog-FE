import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Компонент отображения преимуществ PRO-аккаунта
 * @param {boolean} showTitle - Показывать ли заголовок
 * @param {string} variant - Вариант отображения: 'compact' | 'full'
 */
export default function ProBenefits({ showTitle = true, variant = 'full' }) {
  const benefits = [
    {
      icon: 'close-circle-outline',
      text: 'Без рекламы',
      color: '#4CAF50',
    },
    {
      icon: 'library-outline',
      text: 'Расширенный каталог',
      color: '#4CAF50',
    },
    {
      icon: 'sync-outline',
      text: 'Синхронизация данных',
      color: '#4CAF50',
    },
    {
      icon: 'camera-outline',
      text: 'Загрузка фото своей коллекции',
      color: '#B8860B',
    },
    {
      icon: 'create-outline',
      text: 'Изменение данных в личной коллекции',
      color: '#B8860B',
      badge: 'Скоро',
    },
    {
      icon: 'cash-outline',
      text: 'Управление ценами (покупка/продажа)',
      color: '#B8860B',
    },
    {
      icon: 'swap-horizontal-outline',
      text: 'Обмен монет между пользователями',
      color: '#B8860B',
      badge: 'В разработке',
    },
  ];

  return (
    <View style={[styles.container, variant === 'compact' && styles.containerCompact]}>
      {showTitle && (
        <Text style={styles.title}>Преимущества PRO-аккаунта:</Text>
      )}
      
      <View style={styles.benefitsList}>
        {benefits.map((benefit, index) => (
          <View key={index} style={styles.benefitItem}>
            <Ionicons 
              name={benefit.icon} 
              size={20} 
              color={benefit.color} 
              style={styles.benefitIcon}
            />
            <Text style={styles.benefitText}>{benefit.text}</Text>
            {benefit.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{benefit.badge}</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      <View style={styles.proNote}>
        <Ionicons name="star" size={16} color="#B8860B" />
        <Text style={styles.proNoteText}>
          Получите доступ ко всем функциям с PRO-аккаунтом
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  containerCompact: {
    padding: 15,
  },
  title: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  benefitsList: {
    marginBottom: 15,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 4,
  },
  benefitIcon: {
    marginRight: 12,
  },
  benefitText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  badge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  badgeText: {
    fontSize: 11,
    color: '#B8860B',
    fontWeight: '600',
  },
  proNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    padding: 12,
    borderRadius: 8,
    marginTop: 5,
  },
  proNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#B8860B',
    marginLeft: 8,
    fontWeight: '500',
  },
});
