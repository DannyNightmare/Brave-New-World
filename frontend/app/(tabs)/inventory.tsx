import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useCustomization } from '../../contexts/CustomizationContext';
import { Ionicons } from '@expo/vector-icons';

const API_URL = 'https://levelup-quest-7.preview.emergentagent.com';

interface InventoryItem {
  id: string;
  item_name: string;
  item_description: string;
  item_type: string;
  stat_boost?: { [key: string]: number };
  exp_amount?: number;
  gold_amount?: number;
  ap_amount?: number;
  is_synthesis_material?: boolean;
}

export default function InventoryScreen() {
  const { user, refreshUser } = useUser();
  const { showNotification, showLevelUp } = useNotification();
  const { statusTheme } = useCustomization();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

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

  const useItem = async (item: InventoryItem) => {
    if (!user?.id) return;

    // Check if item is consumable
    const isConsumable = item.item_type === 'exp' || item.item_type === 'gold' || item.item_type === 'ability_points';
    
    if (!isConsumable) {
      alert('This item cannot be used');
      return;
    }

    // Store old level before using item
    const oldLevel = user.level;

    try {
      const response = await fetch(`${API_URL}/api/inventory/${item.id}/use`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id }),
      });

      if (response.ok) {
        const result = await response.json();
        
        // Refresh user data to update AP/Gold/EXP on other pages
        await refreshUser();
        
        // Show success notification with what was gained
        let message = '';
        const rewards: string[] = [];
        if (result.exp_gained) rewards.push(`+${result.exp_gained} EXP`);
        if (result.gold_gained) rewards.push(`+${result.gold_gained} Gold`);
        if (result.ap_gained) rewards.push(`+${result.ap_gained} AP`);
        
        if (rewards.length > 0) {
          message = rewards.join(' • ');
          showNotification(`✨ ${item.item_name} used!\n${message}`, 'success', 3000);
        }
        
        // Check if user leveled up and show level up notification
        if (result.level_up && result.new_level) {
          showLevelUp(oldLevel, result.new_level);
        }
        
        // Refresh inventory to remove used item
        fetchInventory();
      } else {
        alert('Failed to use item');
      }
    } catch (error) {
      console.error('Failed to use item:', error);
      alert('Failed to use item');
    }
  };

  // Filter items based on search query
  const filteredItems = items.filter(item => {
    if (searchQuery.trim() === '') return true;
    return item.item_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
           item.item_description.toLowerCase().includes(searchQuery.toLowerCase());
  });

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
      <SafeAreaView style={[styles.container, { backgroundColor: statusTheme.colors.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={statusTheme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: statusTheme.colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.subtitle, { color: statusTheme.colors.textSecondary }]}>{filteredItems.length} items</Text>
          </View>
        </View>

        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: statusTheme.colors.cardBackground, borderColor: statusTheme.colors.cardBorder }]}>
          <Ionicons name="search" size={20} color={statusTheme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: statusTheme.colors.text }]}
            placeholder="Search inventory..."
            placeholderTextColor={statusTheme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color={statusTheme.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={statusTheme.colors.cardBorder} />
            <Text style={[styles.emptyText, { color: statusTheme.colors.textSecondary }]}>No items yet!</Text>
            <Text style={[styles.emptySubtext, { color: statusTheme.colors.textSecondary }]}>Visit the shop to purchase items</Text>
          </View>
        ) : (
          filteredItems.map(item => {
            const isConsumable = item.item_type === 'exp' || item.item_type === 'gold' || item.item_type === 'ability_points';
            
            return (
              <View key={item.id} style={[styles.itemCard, { backgroundColor: statusTheme.colors.cardBackground, borderColor: statusTheme.colors.cardBorder }]}>
                <View style={[styles.itemIcon, { backgroundColor: getItemColor(item.item_type) + '20' }]}>
                  <Ionicons name={getItemIcon(item.item_type) as any} size={32} color={getItemColor(item.item_type)} />
                </View>
                
                <View style={styles.itemInfo}>
                  <View style={styles.itemHeader}>
                    <Text style={[styles.itemName, { color: statusTheme.colors.text }]}>{item.item_name}</Text>
                    <View style={[styles.typeBadge, { backgroundColor: getItemColor(item.item_type) + '20' }]}>
                      <Text style={[styles.typeText, { color: getItemColor(item.item_type) }]}>
                        {item.item_type}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.itemDescription, { color: statusTheme.colors.textSecondary }]} numberOfLines={2} ellipsizeMode="tail">
                    {item.item_description}
                  </Text>
                  
                  {/* Show consumable amount */}
                  {item.exp_amount && (
                    <Text style={[styles.consumableAmount, { color: statusTheme.colors.primary }]}>+{item.exp_amount} EXP</Text>
                  )}
                  {item.gold_amount && (
                    <Text style={[styles.consumableAmount, { color: statusTheme.colors.goldColor }]}>+{item.gold_amount} Gold</Text>
                  )}
                  {item.ap_amount && (
                    <Text style={[styles.consumableAmount, { color: statusTheme.colors.apColor }]}>+{item.ap_amount} AP</Text>
                  )}
                  
                  {item.stat_boost && (
                    <View style={styles.statBoosts}>
                      {Object.entries(item.stat_boost).map(([stat, value]) => (
                        <View key={stat} style={[styles.statBoost, { backgroundColor: statusTheme.colors.cardBorder }]}>
                          <Ionicons 
                            name={stat === 'strength' ? 'barbell' : stat === 'intelligence' ? 'bulb' : 'heart'} 
                            size={12} 
                            color={statusTheme.colors.accent} 
                          />
                          <Text style={[styles.statBoostText, { color: statusTheme.colors.accent }]}>+{value} {stat}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Use button for consumable items */}
                {isConsumable && (
                  <TouchableOpacity 
                    style={[styles.useButton, { backgroundColor: statusTheme.colors.accent }]}
                    onPress={() => useItem(item)}
                  >
                    <Text style={styles.useButtonText}>Use</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#F9FAFB',
    paddingVertical: 12,
  },
  clearButton: {
    padding: 4,
  },
  useButton: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginLeft: 12,
  },
  useButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  consumableAmount: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
    marginTop: 4,
  },
});