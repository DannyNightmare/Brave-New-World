import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Platform, TouchableWithoutFeedback } from 'react-native';
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
  category: string;
  item_type: string;
  stat_boost?: { [key: string]: number };
}

// Shop Item Component with long press support
const ShopItemCard = ({ item, onLongPress, onPurchase }: { 
  item: ShopItem; 
  onLongPress: () => void; 
  onPurchase: () => void; 
}) => {
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

  return (
    <TouchableWithoutFeedback onLongPress={onLongPress} delayLongPress={800}>
      <View style={styles.itemCard}>
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
          style={styles.buyButton}
          onPress={onPurchase}
        >
          <Ionicons name="logo-bitcoin" size={16} color="#FFF" />
          <Text style={styles.buyButtonText}>{item.price}</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default function ShopScreen() {
  const { user, refreshUser } = useUser();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: 50,
    stock: 1,
    category: 'general',
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

  const handleItemLongPress = (item: ShopItem) => {
    setSelectedItem(item);
    setActionModalVisible(true);
  };

  const handleEdit = () => {
    if (selectedItem) {
      setEditingItem(selectedItem);
      setNewItem({
        name: selectedItem.name,
        description: selectedItem.description,
        price: selectedItem.price,
        stock: selectedItem.stock || 1,
        category: selectedItem.category || 'general',
        item_type: selectedItem.item_type,
        strength_boost: selectedItem.stat_boost?.strength || 0,
        intelligence_boost: selectedItem.stat_boost?.intelligence || 0,
        vitality_boost: selectedItem.stat_boost?.vitality || 0,
      });
      setActionModalVisible(false);
      setEditModalVisible(true);
    }
  };

  const handleDelete = () => {
    if (selectedItem) {
      deleteShopItem(selectedItem);
      setActionModalVisible(false);
    }
  };

  const deleteShopItem = async (item: ShopItem) => {
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
  };

  const updateItem = async () => {
    if (!editingItem || !newItem.name.trim()) {
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
        category: newItem.category,
        item_type: newItem.item_type,
      };

      if (Object.keys(stat_boost).length > 0) {
        payload.stat_boost = stat_boost;
      }

      const response = await fetch(`${API_URL}/api/shop/${editingItem.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      
      if (response.ok) {
        setNewItem({
          name: '',
          description: '',
          price: 50,
          stock: 1,
          category: 'general',
          item_type: 'weapon',
          strength_boost: 0,
          intelligence_boost: 0,
          vitality_boost: 0,
        });
        setEditingItem(null);
        setEditModalVisible(false);
        fetchShopItems();
        Alert.alert('Success', 'Item updated');
      }
    } catch (error) {
      console.error('Failed to update item:', error);
      Alert.alert('Error', 'Failed to update item');
    }
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
        category: newItem.category,
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
          category: 'general',
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

  // Get unique categories from items
  const categories = ['all', ...Array.from(new Set(items.map(item => item.category || 'general')))];
  
  // Filter items based on selected category
  const filteredItems = selectedCategory === 'all' 
    ? items 
    : items.filter(item => (item.category || 'general') === selectedCategory);

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

        {/* Category Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoryTabs}
          contentContainerStyle={styles.categoryTabsContent}
        >
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryTab,
                selectedCategory === category && styles.categoryTabSelected,
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryTabText,
                selectedCategory === category && styles.categoryTabTextSelected
              ]}>
                {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredItems.map(item => (
          <ShopItemCard
            key={item.id}
            item={item}
            onLongPress={() => handleItemLongPress(item)}
            onPurchase={() => purchaseItem(item)}
          />
        ))}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={styles.fab} 
        onPress={() => setModalVisible(true)}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Create Item Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create Shop Item</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Item name *"
                placeholderTextColor="#6B7280"
                value={newItem.name}
                onChangeText={(text) => setNewItem({ ...newItem, name: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                placeholderTextColor="#6B7280"
                value={newItem.description}
                onChangeText={(text) => setNewItem({ ...newItem, description: text })}
                multiline
                numberOfLines={3}
              />
              <TextInput
                style={styles.input}
                placeholder="Category (e.g., weapons, armor, consumables)"
                placeholderTextColor="#6B7280"
                value={newItem.category}
                onChangeText={(text) => setNewItem({ ...newItem, category: text })}
              />

              <Text style={styles.label}>Item Details</Text>
              <View style={styles.rewardRow}>
                <View style={styles.rewardInput}>
                  <Text style={styles.rewardLabel}>Price</Text>
                  <TextInput
                    style={styles.numberInput}
                    placeholder="50"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.price)}
                    onChangeText={(text) => setNewItem({ ...newItem, price: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.rewardInput}>
                  <Text style={styles.rewardLabel}>Stock</Text>
                  <TextInput
                    style={styles.numberInput}
                    placeholder="1"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.stock)}
                    onChangeText={(text) => setNewItem({ ...newItem, stock: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Item Type</Text>
              <View style={styles.itemTypeSelector}>
                {['weapon', 'armor', 'potion', 'accessory'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      newItem.item_type === type && styles.typeOptionSelected,
                    ]}
                    onPress={() => setNewItem({ ...newItem, item_type: type })}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      newItem.item_type === type && styles.typeOptionTextSelected
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Stat Boosts</Text>
              <View style={styles.attributeContainer}>
                <View style={styles.attributeRow}>
                  <Ionicons name="barbell" size={20} color="#EF4444" />
                  <Text style={styles.attributeLabel}>Strength</Text>
                  <TextInput
                    style={styles.attributeInput}
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.strength_boost)}
                    onChangeText={(text) => setNewItem({ ...newItem, strength_boost: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.attributeRow}>
                  <Ionicons name="bulb" size={20} color="#3B82F6" />
                  <Text style={styles.attributeLabel}>Intelligence</Text>
                  <TextInput
                    style={styles.attributeInput}
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.intelligence_boost)}
                    onChangeText={(text) => setNewItem({ ...newItem, intelligence_boost: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.attributeRow}>
                  <Ionicons name="heart" size={20} color="#10B981" />
                  <Text style={styles.attributeLabel}>Vitality</Text>
                  <TextInput
                    style={styles.attributeInput}
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.vitality_boost)}
                    onChangeText={(text) => setNewItem({ ...newItem, vitality_boost: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.createButton} onPress={createItem}>
                <Text style={styles.createButtonText}>Create Item</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Edit Item Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Edit Item</Text>
                <TouchableOpacity onPress={() => {
                  setEditModalVisible(false);
                  setEditingItem(null);
                }}>
                  <Ionicons name="close" size={28} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Item name *"
                placeholderTextColor="#6B7280"
                value={newItem.name}
                onChangeText={(text) => setNewItem({ ...newItem, name: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                placeholderTextColor="#6B7280"
                value={newItem.description}
                onChangeText={(text) => setNewItem({ ...newItem, description: text })}
                multiline
                numberOfLines={3}
              />
              <TextInput
                style={styles.input}
                placeholder="Category (e.g., weapons, armor, consumables)"
                placeholderTextColor="#6B7280"
                value={newItem.category}
                onChangeText={(text) => setNewItem({ ...newItem, category: text })}
              />

              <Text style={styles.label}>Item Details</Text>
              <View style={styles.rewardRow}>
                <View style={styles.rewardInput}>
                  <Text style={styles.rewardLabel}>Price</Text>
                  <TextInput
                    style={styles.numberInput}
                    placeholder="50"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.price)}
                    onChangeText={(text) => setNewItem({ ...newItem, price: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.rewardInput}>
                  <Text style={styles.rewardLabel}>Stock</Text>
                  <TextInput
                    style={styles.numberInput}
                    placeholder="1"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.stock)}
                    onChangeText={(text) => setNewItem({ ...newItem, stock: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Item Type</Text>
              <View style={styles.itemTypeSelector}>
                {['weapon', 'armor', 'potion', 'accessory'].map(type => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.typeOption,
                      newItem.item_type === type && styles.typeOptionSelected,
                    ]}
                    onPress={() => setNewItem({ ...newItem, item_type: type })}
                  >
                    <Text style={[
                      styles.typeOptionText,
                      newItem.item_type === type && styles.typeOptionTextSelected
                    ]}>
                      {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Stat Boosts</Text>
              <View style={styles.attributeContainer}>
                <View style={styles.attributeRow}>
                  <Ionicons name="barbell" size={20} color="#EF4444" />
                  <Text style={styles.attributeLabel}>Strength</Text>
                  <TextInput
                    style={styles.attributeInput}
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.strength_boost)}
                    onChangeText={(text) => setNewItem({ ...newItem, strength_boost: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.attributeRow}>
                  <Ionicons name="bulb" size={20} color="#3B82F6" />
                  <Text style={styles.attributeLabel}>Intelligence</Text>
                  <TextInput
                    style={styles.attributeInput}
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.intelligence_boost)}
                    onChangeText={(text) => setNewItem({ ...newItem, intelligence_boost: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.attributeRow}>
                  <Ionicons name="heart" size={20} color="#10B981" />
                  <Text style={styles.attributeLabel}>Vitality</Text>
                  <TextInput
                    style={styles.attributeInput}
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.vitality_boost)}
                    onChangeText={(text) => setNewItem({ ...newItem, vitality_boost: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.createButton} onPress={updateItem}>
                <Text style={styles.createButtonText}>Update Item</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Action Selection Modal */}
      <Modal visible={actionModalVisible} animationType="fade" transparent={true}>
        <TouchableWithoutFeedback onPress={() => setActionModalVisible(false)}>
          <View style={styles.actionModalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.actionModalContent}>
                <Text style={styles.actionModalTitle}>{selectedItem?.name}</Text>
                <Text style={styles.actionModalSubtitle}>Choose an action</Text>
                
                <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
                  <Ionicons name="create-outline" size={24} color="#8B5CF6" />
                  <Text style={styles.actionButtonText}>Edit Item</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={[styles.actionButton, styles.deleteButton]} onPress={handleDelete}>
                  <Ionicons name="trash-outline" size={24} color="#EF4444" />
                  <Text style={[styles.actionButtonText, styles.deleteButtonText]}>Delete Item</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.cancelButton} onPress={() => setActionModalVisible(false)}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  deleteIcon: {
    padding: 4,
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
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 600,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F9FAFB',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 12,
  },
  rewardRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  rewardInput: {
    flex: 1,
  },
  rewardLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  numberInput: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#4B5563',
    textAlign: 'center',
  },
  itemTypeSelector: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  typeOption: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4B5563',
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  typeOptionSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#1F2937',
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'capitalize',
  },
  typeOptionTextSelected: {
    color: '#8B5CF6',
  },
  attributeContainer: {
    marginBottom: 24,
  },
  attributeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  attributeLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
    marginLeft: 12,
  },
  attributeInput: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    color: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#4B5563',
    width: 60,
    textAlign: 'center',
  },
  createButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionModalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#374151',
  },
  actionModalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 8,
    textAlign: 'center',
  },
  actionModalSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
    textAlign: 'center',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  deleteButton: {
    backgroundColor: '#7F1D1D',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginLeft: 12,
  },
  deleteButtonText: {
    color: '#FCA5A5',
  },
  cancelButton: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
});