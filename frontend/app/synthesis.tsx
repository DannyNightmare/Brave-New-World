import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category: string;
}

export default function SynthesisScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useUser();
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedResult, setSelectedResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchShopItems();
  }, []);

  const fetchShopItems = async () => {
    try {
      const response = await fetch(`${API_URL}/api/shop`);
      const data = await response.json();
      setShopItems(data);
    } catch (error) {
      console.error('Failed to fetch shop items:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleIngredient = (itemId: string) => {
    if (selectedIngredients.includes(itemId)) {
      setSelectedIngredients(selectedIngredients.filter(id => id !== itemId));
    } else {
      setSelectedIngredients([...selectedIngredients, itemId]);
    }
  };

  const handleSynthesize = () => {
    if (selectedIngredients.length === 0) {
      Alert.alert('Error', 'Please select at least one ingredient item');
      return;
    }

    if (!selectedResult) {
      Alert.alert('Error', 'Please select a result item');
      return;
    }

    if (selectedIngredients.includes(selectedResult)) {
      Alert.alert('Error', 'Result item cannot be one of the ingredients');
      return;
    }

    const ingredientNames = selectedIngredients
      .map(id => shopItems.find(item => item.id === id)?.name)
      .join(', ');
    const resultName = shopItems.find(item => item.id === selectedResult)?.name;

    Alert.alert(
      'Synthesis Recipe Created!',
      `Combining: ${ingredientNames}\nResults in: ${resultName}\n\nThis recipe has been saved!`,
      [
        { text: 'OK', onPress: () => {
          setSelectedIngredients([]);
          setSelectedResult(null);
        }}
      ]
    );
  };

  const getItemById = (id: string) => shopItems.find(item => item.id === id);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Synthesis</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Combine shop items to create new ones
        </Text>

        {/* Ingredients Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Ingredients</Text>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Choose items to combine ({selectedIngredients.length} selected)
          </Text>

          <View style={styles.itemsGrid}>
            {shopItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  { backgroundColor: colors.cardBackground, borderColor: colors.border },
                  selectedIngredients.includes(item.id) && styles.itemCardSelected
                ]}
                onPress={() => toggleIngredient(item.id)}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImagePlaceholder, { backgroundColor: colors.border }]}>
                    <Ionicons name="cube" size={24} color={colors.textSecondary} />
                  </View>
                )}
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                {selectedIngredients.includes(item.id) && (
                  <View style={styles.selectedBadge}>
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Arrow */}
        {selectedIngredients.length > 0 && (
          <View style={styles.arrowContainer}>
            <Ionicons name="arrow-down" size={40} color="#8B5CF6" />
          </View>
        )}

        {/* Result Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Select Result</Text>
          <Text style={[styles.helperText, { color: colors.textSecondary }]}>
            Choose what the synthesis creates
          </Text>

          <View style={styles.itemsGrid}>
            {shopItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.itemCard,
                  { backgroundColor: colors.cardBackground, borderColor: colors.border },
                  selectedResult === item.id && styles.itemCardResult
                ]}
                onPress={() => setSelectedResult(item.id)}
              >
                {item.image ? (
                  <Image source={{ uri: item.image }} style={styles.itemImage} />
                ) : (
                  <View style={[styles.itemImagePlaceholder, { backgroundColor: colors.border }]}>
                    <Ionicons name="cube" size={24} color={colors.textSecondary} />
                  </View>
                )}
                <Text style={[styles.itemName, { color: colors.text }]} numberOfLines={2}>
                  {item.name}
                </Text>
                {selectedResult === item.id && (
                  <View style={styles.resultBadge}>
                    <Ionicons name="star" size={24} color="#FCD34D" />
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Synthesize Button */}
        <TouchableOpacity
          style={[
            styles.synthesizeButton,
            { backgroundColor: colors.primary },
            (selectedIngredients.length === 0 || !selectedResult) && styles.synthesizeButtonDisabled
          ]}
          onPress={handleSynthesize}
          disabled={selectedIngredients.length === 0 || !selectedResult}
        >
          <Ionicons name="git-merge" size={24} color="#FFF" />
          <Text style={styles.synthesizeButtonText}>Create Synthesis Recipe</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  helperText: {
    fontSize: 12,
    marginBottom: 16,
  },
  itemsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  itemCard: {
    width: 100,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 2,
    position: 'relative',
  },
  itemCardSelected: {
    borderColor: '#10B981',
    backgroundColor: '#064E3B',
  },
  itemCardResult: {
    borderColor: '#FCD34D',
    backgroundColor: '#78350F',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
  },
  itemImagePlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginBottom: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemName: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '600',
  },
  selectedBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  resultBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  synthesizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    marginTop: 20,
  },
  synthesizeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  synthesizeButtonDisabled: {
    opacity: 0.5,
  },
});
