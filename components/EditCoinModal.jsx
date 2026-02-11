import { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

/**
 * Модальное окно для редактирования параметров монеты (только для PRO)
 */
export default function EditCoinModal({ visible, onClose, onSave, coin, isPro }) {
  const [condition, setCondition] = useState(coin?.condition || 'good');
  const [grade, setGrade] = useState(coin?.grade || '');
  const [purchasePrice, setPurchasePrice] = useState(coin?.purchasePrice?.toString() || '');
  const [purchaseDate, setPurchaseDate] = useState(coin?.purchaseDate || '');
  const [notes, setNotes] = useState(coin?.notes || '');
  const [userWeight, setUserWeight] = useState(coin?.userWeight?.toString() || '');
  const [userDiameter, setUserDiameter] = useState(coin?.userDiameter?.toString() || '');
  const [userObverseImage, setUserObverseImage] = useState(coin?.userObverseImage || null);
  const [userReverseImage, setUserReverseImage] = useState(coin?.userReverseImage || null);

  // Синхронизируем состояние при открытии модала или изменении данных монеты
  useEffect(() => {
    if (visible && coin) {
      setCondition(coin.condition || 'good');
      setGrade(coin.grade || '');
      setPurchasePrice(coin.purchasePrice?.toString() || '');
      setPurchaseDate(coin.purchaseDate || '');
      setNotes(coin.notes || '');
      setUserWeight(coin.userWeight?.toString() || '');
      setUserDiameter(coin.userDiameter?.toString() || '');
      setUserObverseImage(coin.userObverseImage || null);
      setUserReverseImage(coin.userReverseImage || null);
    }
  }, [visible, coin]);

  const pickImage = async (side) => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: Platform.OS === 'web',
    });

    if (!result.canceled && result.assets[0]) {
      const uri = Platform.OS === 'web' && result.assets[0].base64
        ? `data:image/jpeg;base64,${result.assets[0].base64}`
        : result.assets[0].uri;
      if (side === 'obverse') {
        setUserObverseImage(uri);
      } else {
        setUserReverseImage(uri);
      }
    }
  };

  const conditions = [
    { value: 'excellent', label: 'Отличное', icon: 'star' },
    { value: 'good', label: 'Хорошее', icon: 'star-half' },
    { value: 'fair', label: 'Удовлетворительное', icon: 'star-outline' },
    { value: 'poor', label: 'Плохое', icon: 'close-circle-outline' },
  ];

  const handleSave = () => {
    const data = {
      condition,
      notes,
      userWeight: userWeight ? parseFloat(userWeight) : null,
      userDiameter: userDiameter ? parseFloat(userDiameter) : null,
    };

    // PRO-поля
    if (isPro) {
      data.grade = grade || null;
      data.purchasePrice = purchasePrice ? parseFloat(purchasePrice) : null;
      data.purchaseDate = purchaseDate || null;
      data.userObverseImage = userObverseImage || null;
      data.userReverseImage = userReverseImage || null;
    }

    onSave(data);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {isPro ? 'Редактировать монету' : 'Параметры монеты'}
            </Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody}>
            {/* Состояние монеты */}
            <Text style={styles.sectionTitle}>Состояние</Text>
            <View style={styles.conditionsContainer}>
              {conditions.map((cond) => (
                <TouchableOpacity
                  key={cond.value}
                  style={[
                    styles.conditionButton,
                    condition === cond.value && styles.conditionButtonActive,
                  ]}
                  onPress={() => setCondition(cond.value)}
                >
                  <Ionicons
                    name={cond.icon}
                    size={24}
                    color={condition === cond.value ? '#B8860B' : '#666'}
                  />
                  <Text
                    style={[
                      styles.conditionText,
                      condition === cond.value && styles.conditionTextActive,
                    ]}
                  >
                    {cond.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* PRO-поля */}
            {isPro && (
              <>
                {/* Грейдинг */}
                <Text style={styles.sectionTitle}>
                  Грейдинг <Text style={styles.proBadge}>PRO</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Например: MS-65, AU-50"
                  value={grade}
                  onChangeText={setGrade}
                />

                {/* Цена покупки */}
                <Text style={styles.sectionTitle}>
                  Цена покупки <Text style={styles.proBadge}>PRO</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Введите цену"
                  value={purchasePrice}
                  onChangeText={setPurchasePrice}
                  keyboardType="numeric"
                />

                {/* Дата покупки */}
                <Text style={styles.sectionTitle}>
                  Дата покупки <Text style={styles.proBadge}>PRO</Text>
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="ГГГГ-ММ-ДД"
                  value={purchaseDate}
                  onChangeText={setPurchaseDate}
                />
              </>
            )}

            {/* Физические параметры */}
            <Text style={styles.sectionTitle}>Физические параметры</Text>
            <Text style={styles.sectionHint}>
              Для старых монет, где параметры могли измениться
            </Text>
            
            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Вес (г)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Вес"
                  value={userWeight}
                  onChangeText={setUserWeight}
                  keyboardType="decimal-pad"
                />
              </View>
              
              <View style={styles.halfInput}>
                <Text style={styles.inputLabel}>Диаметр (мм)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Диаметр"
                  value={userDiameter}
                  onChangeText={setUserDiameter}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            {/* Заметки */}
            <Text style={styles.sectionTitle}>Заметки</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Добавьте заметки о монете"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
            />

            {/* Фото монеты - только для PRO */}
            {isPro && (
              <>
                <Text style={styles.sectionTitle}>
                  Фото монеты <Text style={styles.proBadge}>PRO</Text>
                </Text>
                <View style={styles.photoRow}>
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={() => pickImage('obverse')}
                  >
                    {userObverseImage ? (
                      <Image source={{ uri: userObverseImage }} style={styles.photoPreview} />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <Ionicons name="camera-outline" size={28} color="#B8860B" />
                        <Text style={styles.photoLabel}>Аверс</Text>
                      </View>
                    )}
                    {userObverseImage && (
                      <TouchableOpacity
                        style={styles.photoRemove}
                        onPress={() => setUserObverseImage(null)}
                      >
                        <Ionicons name="close-circle" size={22} color="#E91E63" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.photoButton}
                    onPress={() => pickImage('reverse')}
                  >
                    {userReverseImage ? (
                      <Image source={{ uri: userReverseImage }} style={styles.photoPreview} />
                    ) : (
                      <View style={styles.photoPlaceholder}>
                        <Ionicons name="camera-outline" size={28} color="#B8860B" />
                        <Text style={styles.photoLabel}>Реверс</Text>
                      </View>
                    )}
                    {userReverseImage && (
                      <TouchableOpacity
                        style={styles.photoRemove}
                        onPress={() => setUserReverseImage(null)}
                      >
                        <Ionicons name="close-circle" size={22} color="#E91E63" />
                      </TouchableOpacity>
                    )}
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!isPro && (
              <View style={styles.proNotice}>
                <Ionicons name="lock-closed" size={20} color="#B8860B" />
                <Text style={styles.proNoticeText}>
                  Грейдинг, цены и фото доступны в PRO-версии
                </Text>
              </View>
            )}
          </ScrollView>

          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={onClose}
            >
              <Text style={styles.cancelButtonText}>Отмена</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>Сохранить</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: 'center',
        width: '100%',
      },
    }),
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 5,
  },
  modalBody: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 15,
    marginBottom: 10,
  },
  proBadge: {
    fontSize: 12,
    color: '#B8860B',
    fontWeight: 'bold',
    backgroundColor: '#FFF8DC',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  conditionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  conditionButton: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  conditionButtonActive: {
    borderColor: '#B8860B',
    backgroundColor: '#FFF8DC',
  },
  conditionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
  conditionTextActive: {
    color: '#B8860B',
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  sectionHint: {
    fontSize: 12,
    color: '#888',
    marginBottom: 10,
    fontStyle: 'italic',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 10,
  },
  halfInput: {
    flex: 1,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  photoRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 10,
  },
  photoButton: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0d5b5',
    borderStyle: 'dashed',
    overflow: 'hidden',
    position: 'relative',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  photoPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8DC',
  },
  photoLabel: {
    fontSize: 13,
    color: '#B8860B',
    marginTop: 4,
    fontWeight: '500',
  },
  photoRemove: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#fff',
    borderRadius: 12,
  },
  proNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8DC',
    padding: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  proNoticeText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#B8860B',
    flex: 1,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 10,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#B8860B',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
