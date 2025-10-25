import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

interface InventoryItem {
  id: string;
  item_name: string;
  item_description: string;
  item_type: string;
  stat_boost?: { [key: string]: number };
}

export default function InventoryScreen() {
  const { user } = useUser();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_URL}/api/inventory/${user.id}`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, [user?.id]);

  const getItemIcon = (type: string) => {
    switch (type) {
      case 'weapon': return 'flash';
      case 'armor': return 'shield';
      case 'potion': return 'flask';
      case 'accessory': return 'diamond';
      default: return 'cube';
    }
  };

  const getItemColor = (type: string) => {
    switch (type) {
      case 'weapon': return '#EF4444';
      case 'armor': return '#3B82F6';
      case 'potion': return '#10B981';
      case 'accessory': return '#8B5CF6';
      default: return '#6B7280';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Inventory</Text>
            <Text style={styles.subtitle}>{items.length} items</Text>
          </View>
        </View>

        {items.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color="#374151" />
            <Text style={styles.emptyText}>No items yet!</Text>
            <Text style={styles.emptySubtext}>Visit the shop to purchase items</Text>
          </View>
        ) : (
          items.map(item => (
            <View key={item.id} style={styles.itemCard}>
              <View style={[styles.itemIcon, { backgroundColor: getItemColor(item.item_type) + '20' }]}>
                <Ionicons name={getItemIcon(item.item_type) as any} size={32} color={getItemColor(item.item_type)} />
              </View>
              
              <View style={styles.itemInfo}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.item_name}</Text>
                  <View style={[styles.typeBadge, { backgroundColor: getItemColor(item.item_type) + '20' }]}>
                    <Text style={[styles.typeText, { color: getItemColor(item.item_type) }]}>
                      {item.item_type}
                    </Text>
                  </View>
                </View>
                <Text style={styles.itemDescription}>{item.item_description}</Text>
                
                {item.stat_boost && (
                  <View style={styles.statBoosts}>
                    {Object.entries(item.stat_boost).map(([stat, value]) => (
                      <View key={stat} style={styles.statBoost}>
                        <Ionicons 
                          name={stat === 'strength' ? 'barbell' : stat === 'intelligence' ? 'bulb' : 'heart'} 
                          size={12} 
                          color="#10B981" 
                        />
                        <Text style={styles.statBoostText}>+{value} {stat}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#6B7280',
    marginTop: 8,
  },
  itemCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#374151',
  },
  itemIcon: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemInfo: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    flex: 1,
  },
  typeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  itemDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  statBoosts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statBoost: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  statBoostText: {
    fontSize: 11,
    color: '#10B981',
    fontWeight: '600',
  },
});