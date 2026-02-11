import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getRulerById, getDenominationsByRuler } from '../../services/database';
import { useAuthStore } from '../../stores/authStore';
import { getRulerImage } from '../../utils/images';

export default function RulerScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const isGuest = useAuthStore((state) => state.isGuest);
  const insets = useSafeAreaInsets();
  
  const [ruler, setRuler] = useState(null);
  const [denominations, setDenominations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const rulerData = await getRulerById(id);
      setRuler(rulerData);
      
      const denomData = await getDenominationsByRuler(id);
      setDenominations(denomData);
    } catch (error) {
      console.error('Error loading ruler:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get icon for denomination type
  const getDenominationIcon = (type) => {
    switch (type) {
      case 'gold': return { name: 'star', color: '#FFD700' };
      case 'silver_ruble': return { name: 'ellipse', color: '#C0C0C0' };
      case 'silver_small': return { name: 'ellipse-outline', color: '#A8A8A8' };
      case 'copper': return { name: 'ellipse', color: '#B87333' };
      case 'commemorative': return { name: 'trophy', color: '#9C27B0' };
      default: return { name: 'disc', color: '#607D8B' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Загрузка...</Text>
      </View>
    );
  }

  if (!ruler) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Правитель не найден</Text>
      </View>
    );
  }

  const bottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 80) : insets.bottom + 20;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 180 }}>
      {/* Ruler header with image */}
      <View style={styles.headerContainer}>
        <View style={styles.rulerImageContainer}>
          <Image 
            source={getRulerImage(ruler.id, ruler.imageUrl)}
            style={styles.rulerImage}
          />
        </View>
        
        <View style={styles.rulerTitleContainer}>
          <Text style={styles.rulerName}>{ruler.name}</Text>
          <Text style={styles.rulerNameEn}>{ruler.nameEn}</Text>
          {ruler.title && (
            <Text style={styles.rulerTitleText}>{ruler.title}</Text>
          )}
          <View style={styles.yearsContainer}>
            <View style={styles.yearBadge}>
              <Text style={styles.yearLabel}>Правление</Text>
              <Text style={styles.yearValue}>{ruler.startYear} — {ruler.endYear}</Text>
            </View>
            <View style={styles.yearBadge}>
              <Text style={styles.yearLabel}>Жизнь</Text>
              <Text style={styles.yearValue}>{ruler.birthYear} — {ruler.deathYear}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Description */}
      {ruler.description && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>О правителе</Text>
          <Text style={styles.descriptionText}>{ruler.description}</Text>
        </View>
      )}

      {/* Succession */}
      {ruler.succession && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Престолонаследие</Text>
          <Text style={styles.descriptionText}>{ruler.succession}</Text>
        </View>
      )}

      {/* Coinage info */}
      {ruler.coinage && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Монетное дело</Text>
          <Text style={styles.descriptionText}>{ruler.coinage}</Text>
        </View>
      )}

      {/* Denominations */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Номиналы монет</Text>
        <Text style={styles.sectionSubtitle}>
          Выберите тип монет для просмотра каталога
        </Text>
        
        <View style={styles.denominationsGrid}>
          {denominations.map((denom) => {
            const icon = getDenominationIcon(denom.type);
            return (
              <TouchableOpacity
                key={denom.type}
                style={styles.denominationCard}
                onPress={() => router.push(`/denomination/${id}/${denom.type}`)}
              >
                <View style={[styles.denominationIcon, { backgroundColor: icon.color + '20' }]}>
                  <Ionicons name={icon.name} size={32} color={icon.color} />
                </View>
                <Text style={styles.denominationName}>{denom.name}</Text>
                <Text style={styles.denominationCount}>{denom.count} монет</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {denominations.length === 0 && (
          <View style={styles.emptyDenominations}>
            <Ionicons name="albums-outline" size={48} color="#ccc" />
            <Text style={styles.emptyText}>Монеты не добавлены</Text>
          </View>
        )}
      </View>
      </ScrollView>

      {/* Fixed button at bottom */}
      <View style={[styles.fixedButtonContainer, { paddingBottom: bottomPadding }]}>
        <TouchableOpacity
          style={styles.viewAllButton}
          onPress={() => router.push(`/ruler/${id}/coins`)}
        >
          <Text style={styles.viewAllButtonText}>Все монеты правителя</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adBanner: {
    backgroundColor: '#fff3cd',
    padding: 10,
    alignItems: 'center',
  },
  adText: {
    color: '#856404',
    fontSize: 12,
  },
  headerContainer: {
    backgroundColor: '#fff',
    paddingTop: 30,
    paddingBottom: 25,
    paddingHorizontal: 20,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  rulerImageContainer: {
    width: 180,
    height: 220,
    borderRadius: 15,
    overflow: 'hidden',
    marginBottom: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    borderWidth: 3,
    borderColor: '#B8860B',
  },
  rulerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  rulerImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF8E1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rulerTitleContainer: {
    alignItems: 'center',
  },
  rulerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  rulerNameEn: {
    fontSize: 17,
    color: '#666',
    marginTop: 6,
    fontWeight: '500',
  },
  rulerTitleText: {
    fontSize: 15,
    color: '#B8860B',
    marginTop: 10,
    fontStyle: 'italic',
    fontWeight: '600',
  },
  yearsContainer: {
    flexDirection: 'row',
    marginTop: 15,
  },
  yearBadge: {
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
    marginHorizontal: 6,
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#B8860B',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  yearLabel: {
    fontSize: 12,
    color: '#B8860B',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  yearValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginTop: 4,
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginVertical: 8,
    padding: 18,
    borderRadius: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#888',
    marginBottom: 15,
  },
  descriptionText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
  },
  denominationsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
  },
  denominationCard: {
    width: '31%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 14,
    margin: '1%',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  denominationIcon: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    elevation: 2,
  },
  denominationName: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1a1a1a',
    textAlign: 'center',
    lineHeight: 18,
  },
  denominationCount: {
    fontSize: 12,
    color: '#B8860B',
    marginTop: 4,
    fontWeight: '600',
  },
  emptyDenominations: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: '#888',
    marginTop: 10,
  },
  fixedButtonContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  viewAllButton: {
    flexDirection: 'row',
    backgroundColor: '#B8860B',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#B8860B',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  viewAllButtonText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: 'bold',
    marginRight: 8,
    letterSpacing: 0.5,
  },
});
