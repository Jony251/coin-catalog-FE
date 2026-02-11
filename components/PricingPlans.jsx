import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * Компонент выбора плана (Обычный / PRO)
 * @param {string} selectedPlan - Выбранный план: 'free' | 'pro'
 * @param {function} onSelectPlan - Callback при выборе плана
 */
export default function PricingPlans({ selectedPlan = 'free', onSelectPlan }) {
  const plans = [
    {
      id: 'free',
      name: 'Обычный',
      price: 'Бесплатно',
      icon: 'person-outline',
      color: '#666',
      features: [
        'Просмотр каталога монет',
        'Базовая коллекция',
        'Поиск по каталогу',
      ],
    },
    {
      id: 'pro',
      name: 'PRO',
      price: 'Премиум',
      icon: 'star',
      color: '#B8860B',
      badge: 'Рекомендуем',
      features: [
        'Все функции обычного',
        'Без рекламы',
        'Расширенный каталог',
        'Синхронизация данных',
        'Загрузка фото коллекции',
        'Управление ценами',
        'Обмен монет',
      ],
    },
  ];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Выберите план:</Text>
      
      <View style={styles.plansContainer}>
        {plans.map((plan) => (
          <TouchableOpacity
            key={plan.id}
            style={[
              styles.planCard,
              selectedPlan === plan.id && styles.planCardSelected,
              plan.id === 'pro' && styles.planCardPro,
            ]}
            onPress={() => onSelectPlan(plan.id)}
            activeOpacity={0.7}
          >
            {plan.badge && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{plan.badge}</Text>
              </View>
            )}

            <View style={styles.planHeader}>
              <Ionicons 
                name={plan.icon} 
                size={32} 
                color={selectedPlan === plan.id ? '#B8860B' : plan.color} 
              />
              <Text style={[
                styles.planName,
                selectedPlan === plan.id && styles.planNameSelected,
              ]}>
                {plan.name}
              </Text>
              <Text style={[
                styles.planPrice,
                selectedPlan === plan.id && styles.planPriceSelected,
              ]}>
                {plan.price}
              </Text>
            </View>

            <View style={styles.featuresContainer}>
              {plan.features.map((feature, index) => (
                <View key={index} style={styles.featureItem}>
                  <Ionicons 
                    name="checkmark-circle" 
                    size={16} 
                    color={selectedPlan === plan.id ? '#B8860B' : '#4CAF50'} 
                  />
                  <Text style={[
                    styles.featureText,
                    selectedPlan === plan.id && styles.featureTextSelected,
                  ]}>
                    {feature}
                  </Text>
                </View>
              ))}
            </View>

            {selectedPlan === plan.id && (
              <View style={styles.selectedIndicator}>
                <Ionicons name="checkmark-circle" size={24} color="#B8860B" />
                <Text style={styles.selectedText}>Выбрано</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.note}>
        <Ionicons name="information-circle-outline" size={18} color="#666" />
        <Text style={styles.noteText}>
          PRO-аккаунт можно активировать позже в настройках
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
    textAlign: 'center',
  },
  plansContainer: {
    flexDirection: 'row',
    gap: 15,
  },
  planCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  planCardSelected: {
    borderColor: '#B8860B',
    backgroundColor: '#FFF8E1',
    elevation: 6,
    shadowOpacity: 0.2,
  },
  planCardPro: {
    borderColor: '#FFE082',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 10,
    backgroundColor: '#B8860B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    elevation: 3,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 15,
    paddingTop: 10,
  },
  planName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },
  planNameSelected: {
    color: '#B8860B',
  },
  planPrice: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
  planPriceSelected: {
    color: '#B8860B',
    fontWeight: '600',
  },
  featuresContainer: {
    marginBottom: 10,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  featureText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    lineHeight: 18,
  },
  featureTextSelected: {
    color: '#333',
    fontWeight: '500',
  },
  selectedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#FFE082',
  },
  selectedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#B8860B',
    marginLeft: 6,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 15,
    paddingHorizontal: 20,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    textAlign: 'center',
  },
});
