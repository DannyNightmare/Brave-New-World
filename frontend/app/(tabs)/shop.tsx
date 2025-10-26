import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Pressable, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock?: number;
  item_type: string;
  stat_boost?: { [key: string]: number };
}

export default function ShopScreen() {
  const { user, refreshUser } = useUser();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: 50,
    stock: 1,
    item_type: 'weapon',
    strength_boost: 0,
    intelligence_boost: 0,
    vitality_boost: 0,
  });

  const fetchShopItems = async () => {
    try {
      const response = await fetch(`${API_URL}/api/shop`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch shop items:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShopItems();
  }, []);

  const deleteShopItem = async (item: ShopItem) => {
    Alert.alert(
      'Delete Item',
      `Are you sure you want to delete "${item.name}" from the shop?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await fetch(`${API_URL}/api/shop/${item.id}`, {
                method: 'DELETE',
              });
              fetchShopItems();
              Alert.alert('Success', 'Item removed from shop');
            } catch (error) {
              console.error('Failed to delete item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const createItem = async () => {
    if (!newItem.name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    try {
      const stat_boost: { [key: string]: number } = {};
      if (newItem.strength_boost > 0) stat_boost.strength = newItem.strength_boost;
      if (newItem.intelligence_boost > 0) stat_boost.intelligence = newItem.intelligence_boost;
      if (newItem.vitality_boost > 0) stat_boost.vitality = newItem.vitality_boost;

      const payload: any = {
        name: newItem.name,
        description: newItem.description,
        price: newItem.price,
        stock: newItem.stock,
        item_type: newItem.item_type,
      };

      if (Object.keys(stat_boost).length > 0) {
        payload.stat_boost = stat_boost;
      }

      const response = await fetch(`${API_URL}/api/shop`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        setNewItem({
          name: '',
          description: '',
          price: 50,
          stock: 1,
          item_type: 'weapon',
          strength_boost: 0,
          intelligence_boost: 0,
          vitality_boost: 0,
        });
        setModalVisible(false);
        fetchShopItems();
        Alert.alert('Success', 'Item added to shop');
      }
    } catch (error) {
      console.error('Failed to create item:', error);
      Alert.alert('Error', 'Failed to create item');
    }
  };

  const purchaseItem = async (item: ShopItem) => {
    if (!user?.id) return;

    if (user.gold < item.price) {
      Alert.alert('Not Enough Gold', `You need ${item.price} gold but only have ${user.gold}`);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/shop/purchase`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, item_id: item.id }),
      });
      
      if (response.ok) {
        await refreshUser();
        Alert.alert('Purchase Successful!', `You bought ${item.name}`);
      } else {
        const error = await response.json();
        Alert.alert('Purchase Failed', error.detail || 'Something went wrong');
      }
    } catch (error) {
      console.error('Failed to purchase item:', error);
      Alert.alert('Error', 'Failed to complete purchase');
    }
  };

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
            <Text style={styles.subtitle}>Purchase items and upgrades</Text>
          </View>
          <View style={styles.goldDisplay}>
            <Ionicons name="logo-bitcoin" size={24} color="#FCD34D" />
            <Text style={styles.goldText}>{user?.gold || 0}</Text>
          </View>
        </View>

        {items.map(item => {
          const canAfford = (user?.gold || 0) >= item.price;
          return (
            <Pressable
              key={item.id}
              style={styles.itemCard}
              onLongPress={() => deleteShopItem(item)}
              delayLongPress={500}
            >
              <View style={[styles.itemIcon, { backgroundColor: getItemColor(item.item_type) + '20' }]}>
                <Ionicons name={getItemIcon(item.item_type) as any} size={32} color={getItemColor(item.item_type)} />
              </View>
              
              <View style={styles.itemInfo}>
                <Text style={styles.itemName}>{item.name}</Text>
                <Text style={styles.itemDescription}>{item.description}</Text>
                
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
              
              <TouchableOpacity 
                style={[styles.buyButton, !canAfford && styles.buyButtonDisabled]}
                onPress={() => purchaseItem(item)}
                disabled={!canAfford}
              >
                <Ionicons name="logo-bitcoin" size={16} color={canAfford ? "#FFF" : "#6B7280"} />
                <Text style={[styles.buyButtonText, !canAfford && styles.buyButtonTextDisabled]}>
                  {item.price}
                </Text>
              </TouchableOpacity>
            </Pressable>
          );
        })}
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
  goldDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  goldText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FCD34D',
    marginLeft: 8,
  },
  itemCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
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
  itemName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 4,
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
  buyButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 4,
  },
  buyButtonDisabled: {
    backgroundColor: '#374151',
  },
  buyButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buyButtonTextDisabled: {
    color: '#6B7280',
  },
});