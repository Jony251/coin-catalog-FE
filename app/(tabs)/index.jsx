import { useState, useEffect, useLayoutEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useRouter, useNavigation } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { searchCoins } from '../../services/database';
import { firestoreDatabaseService } from '../../services/FirestoreDatabaseService';
import { useAuthStore } from '../../stores/authStore';
import { getRulerImage } from '../../utils/images';

const { width } = Dimensions.get('window');
const isWeb = Platform.OS === 'web';
// Smaller cards for web (4 columns), larger for mobile (2 columns)
const NUM_COLUMNS = isWeb ? 3 : 2;
const CARD_WIDTH = isWeb ? (width - 50) / 3 : (width - 30) / 2;

export default function CatalogScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const isGuest = useAuthStore((state) => state.isGuest);
  
  const [rulers, setRulers] = useState([]);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState('russia');
  const [selectedPeriod, setSelectedPeriod] = useState('russian_empire');
  const [countries, setCountries] = useState([]);
  const [periods, setPeriods] = useState([]);

  // Add logo and search to header
  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: '',
      headerLeft: () => (
        <View style={styles.headerLogoContainer}>
          <Image 
            source={require('../../assets/logo.png')}
            style={styles.headerLogo}
            resizeMode="contain"
          />
        </View>
      ),
      headerRight: () => (
        <View style={styles.headerSearchContainer}>
          <Ionicons name="search" size={16} color="#f5f0f0ff" style={styles.headerSearchIcon} />
          <TextInput
            style={styles.headerSearchInput}
            placeholder="Поиск..."
            value={search}
            onChangeText={setSearch}
            placeholderTextColor="rgba(245, 240, 240, 0.84)"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color="rgba(255,255,255,0.8)" />
            </TouchableOpacity>
          )}
        </View>
      ),
    });
  }, [navigation, search]);

  useEffect(() => {
    loadCountries();
  }, []);

  useEffect(() => {
    if (selectedCountry) {
      loadPeriods();
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedPeriod) {
      loadRulersByPeriod(selectedPeriod);
    }
  }, [selectedPeriod]);

  useEffect(() => {
    if (search.length > 2) {
      handleSearch();
    } else {
      setSearchResults([]);
    }
  }, [search]);

  const loadCountries = async () => {
    try {
      console.log('Loading countries...');
      const data = await firestoreDatabaseService.getCountries();
      console.log('Countries loaded:', data.length);
      setCountries(data);
      if (data.length > 0 && !selectedCountry) {
        setSelectedCountry(data[0].id);
      }
      if (data.length === 0) {
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading countries:', error);
      setLoading(false);
    }
  };

  const loadPeriods = async () => {
    try {
      console.log('Loading periods for:', selectedCountry);
      const data = await firestoreDatabaseService.getPeriodsByCountry(selectedCountry);
      console.log('Periods loaded:', data.length);
      setPeriods(data);
      // Автоматически выбираем первый период при смене страны
      if (data.length > 0) {
        setSelectedPeriod(data[0].id);
      } else {
        setSelectedPeriod(null);
        setRulers([]);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error loading periods:', error);
      setLoading(false);
    }
  };

  const loadRulersByPeriod = async (periodId) => {
    try {
      setLoading(true);
      const data = await firestoreDatabaseService.getRulersByPeriod(periodId);
      setRulers(data.map(r => r.toDatabase()));
    } catch (error) {
      console.error('Error loading rulers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    try {
      const data = await searchCoins(search);
      setSearchResults(data);
    } catch (error) {
      console.error('Error searching:', error);
    }
  };

  // Track failed images
  const [failedImages, setFailedImages] = useState({});

  // Render ruler card in grid
  const renderRulerCard = ({ item }) => {
    // Get local image source (with fallback to URL)
    const imageSource = getRulerImage(item.id, item.imageUrl);
    
    return (
      <TouchableOpacity
        style={styles.rulerCard}
        onPress={() => router.push(`/ruler/${item.id}`)}
      >
        <View style={styles.rulerImageContainer}>
          <Image 
            source={imageSource}
            style={styles.rulerImage}
          />
        </View>
        <View style={styles.rulerInfo}>
          <Text style={styles.rulerName} numberOfLines={1}>{item.name}</Text>
          <Text style={styles.rulerYears}>{item.startYear} — {item.endYear}</Text>
          {!isWeb && item.title && (
            <Text style={styles.rulerTitle} numberOfLines={1}>{item.title}</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render search result item
  const renderSearchItem = ({ item }) => (
    <TouchableOpacity
      style={styles.searchResultCard}
      onPress={() => router.push(`/coin/${item.id}`)}
    >
      <View style={styles.coinImageContainer}>
        <View style={styles.coinImagePlaceholder}>
          <Ionicons name="ellipse-outline" size={30} color="#ccc" />
        </View>
      </View>
      <View style={styles.coinInfo}>
        <Text style={styles.coinName} numberOfLines={2}>{item.name}</Text>
        <Text style={styles.coinDetails}>{item.denomination} • {item.year}</Text>
        <Text style={styles.coinMetal}>{item.metal}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>


      {/* Search results or Rulers grid */}
      {search.length > 2 ? (
        // Search results
        <FlatList
          data={searchResults}
          renderItem={renderSearchItem}
          keyExtractor={(item) => item.id}
          style={styles.searchList}
          contentContainerStyle={styles.searchContent}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>Монеты не найдены</Text>
            </View>
          }
        />
      ) : (
        // Rulers grid
        <>
          <View style={styles.contentHeader}>
            <Text style={styles.contentTitle}>Каталог монет</Text>
            
            {/* Country selector */}
            {countries.length > 1 && (
              <View style={styles.countrySelector}>
                {countries.map((country) => (
                  <TouchableOpacity
                    key={country.id}
                    style={[
                      styles.countryButton,
                      selectedCountry === country.id && styles.countryButtonActive,
                    ]}
                    onPress={() => setSelectedCountry(country.id)}
                  >
                    <Text
                      style={[
                        styles.countryButtonText,
                        selectedCountry === country.id && styles.countryButtonTextActive,
                      ]}
                    >
                      {country.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
            
            {/* Period selector */}
            <View style={styles.periodSelector}>
              {periods.map((period) => (
                <TouchableOpacity
                  key={period.id}
                  style={[
                    styles.periodButton,
                    selectedPeriod === period.id && styles.periodButtonActive,
                  ]}
                  onPress={() => setSelectedPeriod(period.id)}
                >
                  <Text
                    style={[
                      styles.periodButtonText,
                      selectedPeriod === period.id && styles.periodButtonTextActive,
                    ]}
                  >
                    {period.name}
                  </Text>
                  <Text
                    style={[
                      styles.periodButtonYears,
                      selectedPeriod === period.id && styles.periodButtonYearsActive,
                    ]}
                  >
                    {period.startYear}—{period.endYear}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <FlatList
            data={rulers}
            renderItem={renderRulerCard}
            keyExtractor={(item) => item.id}
            numColumns={NUM_COLUMNS}
            key={NUM_COLUMNS}
            style={styles.rulersList}
            contentContainerStyle={styles.rulersContent}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {loading ? 'Загрузка...' : 'Каталог пуст'}
                </Text>
              </View>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  // Header logo styles
  headerLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 0,
  },
  headerLogo: {
    width: 130,
    height: 50,
  },
  // Header search styles
  headerSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 32,
    width: 180,
    marginRight: 10,
  },
  headerSearchIcon: {
    marginRight: 6,
  },
  headerSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#fff',
    paddingVertical: 4,
    outlineStyle: 'none',
  },
  // Content header
  contentHeader: {
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  contentTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  contentSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  // Country selector
  countrySelector: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  countryButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#e0e0e0',
  },
  countryButtonActive: {
    backgroundColor: '#2196F3',
    borderColor: '#2196F3',
  },
  countryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  countryButtonTextActive: {
    color: '#fff',
  },
  // Period selector
  periodSelector: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  periodButton: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    alignItems: 'center',
  },
  periodButtonActive: {
    backgroundColor: '#B8860B',
    borderColor: '#B8860B',
  },
  periodButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  periodButtonTextActive: {
    color: '#fff',
  },
  periodButtonYears: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  periodButtonYearsActive: {
    color: 'rgba(255,255,255,0.9)',
  },
  rulersList: {
    flex: 1,
  },
  rulersContent: {
    paddingHorizontal: 5,
    paddingBottom: 100,
    flexGrow: 1,
  },
  rulerCard: {
    width: CARD_WIDTH,
    backgroundColor: '#fff',
    borderRadius: 12,
    margin: 5,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  rulerImageContainer: {
    width: '100%',
    height: CARD_WIDTH * 1.1,
    backgroundColor: '#FFF8E1',
  },
  rulerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  rulerImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
  },
  rulerInfo: {
    padding: 10,
  },
  rulerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  rulerYears: {
    fontSize: 13,
    color: '#B8860B',
    fontWeight: '600',
    marginTop: 2,
  },
  rulerTitle: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  // Search results styles
  searchList: {
    flex: 1,
  },
  searchContent: {
    padding: 10,
  },
  searchResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  coinImageContainer: {
    width: 50,
    height: 50,
    marginRight: 12,
  },
  coinImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinInfo: {
    flex: 1,
  },
  coinName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  coinDetails: {
    fontSize: 12,
    color: '#666',
  },
  coinMetal: {
    fontSize: 11,
    color: '#888',
    marginTop: 2,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
});
