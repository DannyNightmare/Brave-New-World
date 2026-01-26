import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Modal, TextInput, Platform, TouchableWithoutFeedback, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { useCustomization } from '../../contexts/CustomizationContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AppBackground from '../../components/AppBackground';

const API_URL = 'https://questforge-25.preview.emergentagent.com';

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  stock?: number;
  category: string;
  image?: string;
  images?: string[];
  item_type: string;
  is_power?: boolean;
  power_category?: string;
  power_subcategory?: string;
  power_tier?: string;
  power_max_level?: number;
  next_tier_ability?: string;
  stat_boost?: { [key: string]: number };
}

// Shop Item Component with long press support
const ShopItemCard = ({ item, onLongPress, onPress, onPurchase }: { 
  item: ShopItem; 
  onLongPress: () => void;
  onPress: () => void; 
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
    <TouchableWithoutFeedback 
      onLongPress={onLongPress} 
      onPress={onPress}
      delayLongPress={800}
    >
      <View style={styles.itemCard}>
        <View style={[styles.itemIcon, { backgroundColor: getItemColor(item.item_type) + '20' }]}>
          {item.images && item.images.length > 0 ? (
            <>
              <Image source={{ uri: item.images[0] }} style={styles.itemImage} />
              {item.images.length > 1 && (
                <View style={styles.imageCountBadge}>
                  <Text style={styles.imageCountText} selectable={false}>{item.images.length}</Text>
                  <Ionicons name="images" size={12} color="#FFF" />
                </View>
              )}
            </>
          ) : item.image ? (
            <Image source={{ uri: item.image }} style={styles.itemImage} />
          ) : (
            <Ionicons name={getItemIcon(item.item_type) as any} size={32} color={getItemColor(item.item_type)} />
          )}
        </View>
        
        <View style={styles.itemInfo}>
          <Text style={styles.itemName} selectable={false}>{item.name}</Text>
          <Text style={styles.itemDescription} numberOfLines={2} ellipsizeMode="tail" selectable={false}>
            {item.description}
          </Text>
          
          {item.stat_boost && (
            <View style={styles.statBoosts}>
              {Object.entries(item.stat_boost).map(([stat, value]) => (
                <View key={stat} style={styles.statBoost}>
                  <Ionicons 
                    name={stat === 'strength' ? 'barbell' : stat === 'intelligence' ? 'bulb' : 'heart'} 
                    size={12} 
                    color="#10B981" 
                  />
                  <Text style={styles.statBoostText} selectable={false}>+{value} {stat}</Text>
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
          <Text style={styles.buyButtonText} selectable={false}>{item.price}</Text>
        </TouchableOpacity>
      </View>
    </TouchableWithoutFeedback>
  );
};

export default function ShopScreen() {
  const { user, refreshUser } = useUser();
  const { statusTheme } = useCustomization();
  const [items, setItems] = useState<ShopItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [powerCategoryModalVisible, setPowerCategoryModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ShopItem | null>(null);
  const [viewingItem, setViewingItem] = useState<ShopItem | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [editingItem, setEditingItem] = useState<ShopItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [existingPowerCategories, setExistingPowerCategories] = useState<string[]>([]);
  const [customPowerCategory, setCustomPowerCategory] = useState('');
  const [userCategories, setUserCategories] = useState<{[key: string]: string[]}>({});
  const [categoryActionModalVisible, setCategoryActionModalVisible] = useState(false);
  const [selectedCategoryForAction, setSelectedCategoryForAction] = useState('');
  const [renameCategoryModalVisible, setRenameCategoryModalVisible] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [customStats, setCustomStats] = useState<Array<{id: string, name: string}>>([]);
  const [statBoosts, setStatBoosts] = useState<{ [key: string]: number }>({});
  const [newItem, setNewItem] = useState({
    name: '',
    description: '',
    price: 50,
    stock: 1,
    category: 'general',
    images: [] as string[],
    is_power: false,
    power_category: '',
    power_subcategory: '',
    power_tier: 'Base',
    power_max_level: 5,
    next_tier_ability: '',
    item_type: 'weapon',
    // Consumable fields
    exp_amount: 0,
    gold_amount: 0,
    ap_amount: 0,
    is_synthesis_material: false,
  });

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (permissionResult.granted === false) {
      alert('Permission to access camera roll is required!');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      allowsMultipleSelection: true,
      quality: 0.5,
      base64: true,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const base64Images = result.assets
        .filter(asset => asset.base64)
        .map(asset => `data:image/${asset.uri.split('.').pop()};base64,${asset.base64}`);
      
      setNewItem({ ...newItem, images: [...newItem.images, ...base64Images] });
    }
  };

  const removeImage = (index: number) => {
    const updatedImages = newItem.images.filter((_, i) => i !== index);
    setNewItem({ ...newItem, images: updatedImages });
  };

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

  const fetchPowerCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/api/powers/categories/all`);
      const data = await response.json();
      setExistingPowerCategories(data.categories || []);
    } catch (error) {
      console.error('Failed to fetch power categories:', error);
    }
  };

  const fetchUserCategories = async () => {
    if (!user?.id) {
      console.log('No user ID, skipping category fetch');
      return;
    }
    try {
      console.log('Fetching user categories for:', user.id);
      const response = await fetch(`${API_URL}/api/users/${user.id}/categories`);
      const data = await response.json();
      console.log('User categories fetched:', data);
      setUserCategories(data || {});
    } catch (error) {
      console.error('Failed to fetch user categories:', error);
    }
  };

  const handleCategoryLongPress = (categoryName: string) => {
    setSelectedCategoryForAction(categoryName);
    setCategoryActionModalVisible(true);
  };

  const deleteCategory = async () => {
    if (!user?.id || !selectedCategoryForAction) return;
    
    setCategoryActionModalVisible(false);
    
    try {
      const newCategories = { ...userCategories };
      delete newCategories[selectedCategoryForAction];
      
      const response = await fetch(`${API_URL}/api/users/${user.id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategories),
      });
      
      if (response.ok) {
        setUserCategories(newCategories);
        if (selectedCategory === selectedCategoryForAction) {
          setSelectedCategory('all');
        }
        setTimeout(() => alert(`Category "${selectedCategoryForAction}" deleted successfully!`), 100);
        setSelectedCategoryForAction('');
      } else {
        alert('Failed to delete category');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  const openRenameModal = () => {
    setNewCategoryName(selectedCategoryForAction);
    setCategoryActionModalVisible(false);
    setRenameCategoryModalVisible(true);
  };

  const renameCategory = async () => {
    if (!user?.id || !selectedCategoryForAction || !newCategoryName.trim()) return;
    
    if (newCategoryName === selectedCategoryForAction) {
      setRenameCategoryModalVisible(false);
      return;
    }
    
    try {
      const newCategories = { ...userCategories };
      // Copy subcategories to new name
      newCategories[newCategoryName] = newCategories[selectedCategoryForAction] || [];
      // Delete old category
      delete newCategories[selectedCategoryForAction];
      
      const response = await fetch(`${API_URL}/api/users/${user.id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategories),
      });
      
      if (response.ok) {
        setUserCategories(newCategories);
        if (selectedCategory === selectedCategoryForAction) {
          setSelectedCategory(newCategoryName);
        }
        setTimeout(() => alert(`Category renamed to "${newCategoryName}" successfully!`), 100);
        setRenameCategoryModalVisible(false);
        setSelectedCategoryForAction('');
        setNewCategoryName('');
      } else {
        alert('Failed to rename category');
      }
    } catch (error) {
      console.error('Failed to rename category:', error);
      alert('Failed to rename category');
    }
  };

  const fetchCustomStats = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/${user.id}/stats`);
      if (response.ok) {
        const stats = await response.json();
        setCustomStats(stats.map((stat: any) => ({ id: stat.id, name: stat.name })));
      }
    } catch (error) {
      console.error('Failed to fetch custom stats:', error);
    }
  };

  useEffect(() => {
    fetchShopItems();
    fetchPowerCategories();
    if (user?.id) {
      fetchUserCategories();
      fetchCustomStats();
    }
  }, [user?.id]);

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
        image: selectedItem.image || '',
        images: selectedItem.images || [],
        is_power: selectedItem.is_power || false,
        power_category: selectedItem.power_category || '',
        power_subcategory: selectedItem.power_subcategory || '',
        power_tier: selectedItem.power_tier || 'Base',
        power_max_level: selectedItem.power_max_level || 5,
        next_tier_ability: selectedItem.next_tier_ability || '',
        item_type: selectedItem.item_type,
        strength_boost: selectedItem.stat_boost?.strength || 0,
        intelligence_boost: selectedItem.stat_boost?.intelligence || 0,
        vitality_boost: selectedItem.stat_boost?.vitality || 0,
        // Consumable fields
        exp_amount: 0,
        gold_amount: 0,
        ap_amount: 0,
        is_synthesis_material: false,
      });
      setActionModalVisible(false);
      setEditModalVisible(true);
    }
  };

  const handlePowerCategorySelect = (category: string) => {
    setNewItem({ ...newItem, is_power: true, power_category: category });
    setPowerCategoryModalVisible(false);
  };

  const handleAddPowerToggle = () => {
    if (!newItem.is_power) {
      // User is checking the "Add to Powers" checkbox
      setPowerCategoryModalVisible(true);
    } else {
      // User is unchecking, clear the power category
      setNewItem({ ...newItem, is_power: false, power_category: '' });
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

    if (newItem.is_power && !newItem.power_category) {
      Alert.alert('Error', 'Please select a power category');
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
        is_power: newItem.is_power,
        power_category: newItem.power_category || null,
        power_subcategory: newItem.power_subcategory || null,
        power_tier: newItem.power_tier || null,
        power_max_level: newItem.power_max_level || null,
        next_tier_ability: newItem.next_tier_ability || null,
        // Consumable fields
        exp_amount: newItem.exp_amount || null,
        gold_amount: newItem.gold_amount || null,
        ap_amount: newItem.ap_amount || null,
        is_synthesis_material: newItem.is_synthesis_material || false,
      };

      if (newItem.image) {
        payload.image = newItem.image;
      }

      if (newItem.images && newItem.images.length > 0) {
        payload.images = newItem.images;
      }

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
          image: '',
          images: [] as string[],
          is_power: false,
          power_category: '',
          power_subcategory: '',
          power_tier: 'Base',
          power_max_level: 5,
          next_tier_ability: '',
          item_type: 'weapon',
          strength_boost: 0,
          intelligence_boost: 0,
          vitality_boost: 0,
          // Consumable fields
          exp_amount: 0,
          gold_amount: 0,
          ap_amount: 0,
          is_synthesis_material: false,
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

    if (newItem.is_power && !newItem.power_category) {
      Alert.alert('Error', 'Please select a power category');
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
        is_power: newItem.is_power,
        power_category: newItem.power_category || null,
        power_subcategory: newItem.power_subcategory || null,
        power_tier: newItem.power_tier || null,
        power_max_level: newItem.power_max_level || null,
        next_tier_ability: newItem.next_tier_ability || null,
        // Consumable fields
        exp_amount: newItem.exp_amount || null,
        gold_amount: newItem.gold_amount || null,
        ap_amount: newItem.ap_amount || null,
        is_synthesis_material: newItem.is_synthesis_material || false,
      };

      if (newItem.image) {
        payload.image = newItem.image;
      }

      if (newItem.images && newItem.images.length > 0) {
        payload.images = newItem.images;
      }

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
          image: '',
          images: [] as string[],
          is_power: false,
          power_category: '',
          power_subcategory: '',
          power_tier: 'Base',
          power_max_level: 5,
          next_tier_ability: '',
          item_type: 'weapon',
          strength_boost: 0,
          intelligence_boost: 0,
          vitality_boost: 0,
          // Consumable fields
          exp_amount: 0,
          gold_amount: 0,
          ap_amount: 0,
          is_synthesis_material: false,
        });
        setModalVisible(false);
        fetchShopItems();
        fetchPowerCategories(); // Refresh power categories
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

  // Get unique categories from items + user-created categories
  const itemCategories = Array.from(new Set(items.map(item => item.category || 'general')));
  const userCategoryKeys = Object.keys(userCategories);
  const categories = ['all', ...itemCategories, ...userCategoryKeys];
  console.log('[Shop] Item categories:', itemCategories);
  console.log('[Shop] User category keys:', userCategoryKeys);
  console.log('[Shop] Final categories:', categories);
  
  // Filter items based on category and search query
  const filteredItems = items.filter(item => {
    const matchesCategory = selectedCategory === 'all' || (item.category || 'general') === selectedCategory;
    const matchesSearch = searchQuery.trim() === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

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
    <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]} edges={['bottom']}>
      <AppBackground>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.subtitle, { color: statusTheme.colors.textSecondary }]}>Purchase items and upgrades</Text>
          </View>
          <View style={styles.goldDisplay}>
            <Ionicons name="logo-bitcoin" size={24} color={statusTheme.colors.goldColor} />
            <Text style={[styles.goldText, { color: statusTheme.colors.text }]}>{user?.gold || 0}</Text>
          </View>
        </View>

        {/* Search Input */}
        <View style={[styles.searchContainer, { backgroundColor: statusTheme.colors.cardBackground, borderColor: statusTheme.colors.cardBorder }]}>
          <Ionicons name="search" size={20} color={statusTheme.colors.textSecondary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: statusTheme.colors.text }]}
            placeholder="Search items..."
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

        {/* Category Filter Tabs */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.categoryTabs}
          contentContainerStyle={styles.categoryTabsContent}
        >
          {categories.map(category => {
            const isUserCategory = userCategoryKeys.includes(category);
            return (
              <TouchableOpacity
                key={category}
                style={[
                  styles.categoryTab,
                  { backgroundColor: statusTheme.colors.cardBackground, borderColor: statusTheme.colors.cardBorder },
                  selectedCategory === category && [styles.categoryTabSelected, { backgroundColor: statusTheme.colors.primary, borderColor: statusTheme.colors.primary }],
                ]}
                onPress={() => setSelectedCategory(category)}
                onLongPress={isUserCategory ? () => handleCategoryLongPress(category) : undefined}
              >
                <Text style={[
                  styles.categoryTabText,
                  { color: statusTheme.colors.textSecondary },
                  selectedCategory === category && [styles.categoryTabTextSelected, { color: '#FFF' }]
                ]}>
                  {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Sub-categories display */}
        {selectedCategory !== 'all' && userCategories[selectedCategory] && userCategories[selectedCategory].length > 0 && (
          <View style={styles.subCategoriesSection}>
            <Text style={[styles.subCategoriesTitle, { color: statusTheme.colors.textSecondary }]}>Sub-categories:</Text>
            <View style={styles.subCategoriesChips}>
              {userCategories[selectedCategory].map((subCat, idx) => (
                <View key={idx} style={[styles.subCategoryChip, { backgroundColor: statusTheme.colors.cardBackground }]}>
                  <Text style={[styles.subCategoryChipText, { color: statusTheme.colors.text }]}>{subCat}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {filteredItems.map(item => (
          <ShopItemCard
            key={item.id}
            item={item}
            onPress={() => {
              setViewingItem(item);
              setCurrentImageIndex(0);
              setDetailModalVisible(true);
            }}
            onLongPress={() => handleItemLongPress(item)}
            onPurchase={() => purchaseItem(item)}
          />
        ))}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: statusTheme.colors.primary }]} 
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

              {/* Existing Categories Selection */}
              {categories.length > 1 && (
                <>
                  <Text style={styles.label}>Or Select Existing Category</Text>
                  <View style={styles.existingCategoriesContainer}>
                    {categories.filter(cat => cat !== 'all').map(category => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.existingCategoryChip,
                          newItem.category === category && styles.existingCategoryChipSelected,
                        ]}
                        onPress={() => setNewItem({ ...newItem, category: category })}
                      >
                        <Text style={[
                          styles.existingCategoryChipText,
                          newItem.category === category && styles.existingCategoryChipTextSelected
                        ]}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Image Picker */}
              <Text style={styles.label}>Item Image (optional)</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={24} color="#8B5CF6" />
                <Text style={styles.imagePickerText}>
                  {newItem.images.length > 0 || newItem.image ? 'Add More Images' : 'Select Images'}
                </Text>
              </TouchableOpacity>
              {/* Show all images */}
              {newItem.images.length > 0 && (
                <View style={styles.imagesPreviewContainer}>
                  <Text style={styles.label}>Selected Images ({newItem.images.length})</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesPreviewScroll}>
                    {newItem.images.map((imageUri, index) => (
                      <View key={index} style={styles.imagePreview}>
                        <Image source={{ uri: imageUri }} style={styles.previewImage} />
                        <TouchableOpacity 
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        >
                          <Ionicons name="close-circle" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
              {/* Legacy single image support */}
              {newItem.image && newItem.images.length === 0 && (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: newItem.image }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => setNewItem({ ...newItem, image: '', images: [] })}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}

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
              {/* Item Type Selector */}
              <Text style={styles.label}>Item Type</Text>
              <View style={styles.itemTypeContainer}>
                {['weapon', 'armor', 'potion', 'accessory', 'exp', 'gold', 'ability_points', 'synthesis_material'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.itemTypeOption,
                      newItem.item_type === type && styles.itemTypeOptionSelected,
                    ]}
                    onPress={() => setNewItem({ ...newItem, item_type: type })}
                  >
                    <Text style={[
                      styles.itemTypeOptionText,
                      newItem.item_type === type && styles.itemTypeOptionTextSelected
                    ]}>
                      {type === 'ability_points' ? 'AP' : type === 'synthesis_material' ? 'Synthesis' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Consumable Fields - Show based on item type */}
              {newItem.item_type === 'exp' && (
                <>
                  <Text style={styles.label}>EXP Amount</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="100"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.exp_amount)}
                    onChangeText={(text) => setNewItem({ ...newItem, exp_amount: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </>
              )}

              {newItem.item_type === 'gold' && (
                <>
                  <Text style={styles.label}>Gold Amount</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="500"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.gold_amount)}
                    onChangeText={(text) => setNewItem({ ...newItem, gold_amount: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </>
              )}

              {newItem.item_type === 'ability_points' && (
                <>
                  <Text style={styles.label}>Ability Points Amount</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="5"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.ap_amount)}
                    onChangeText={(text) => setNewItem({ ...newItem, ap_amount: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </>
              )}

              {newItem.item_type === 'synthesis_material' && (
                <View style={styles.synthesisNote}>
                  <Ionicons name="flask" size={20} color="#8B5CF6" />
                  <Text style={styles.synthesisNoteText}>
                    This item can be combined with other synthesis materials in the Synthesis page
                  </Text>
                </View>
              )}

              <Text style={styles.label}>Stat Boosts</Text>
              {customStats.length === 0 ? (
                <View style={styles.noStatsNotice}>
                  <Ionicons name="information-circle" size={24} color="#F59E0B" />
                  <Text style={styles.noStatsText}>
                    No custom stats found. Please create custom stats in the Status page first to add stat boosts to items.
                  </Text>
                </View>
              ) : (
                <View style={styles.attributeContainer}>
                  {customStats.map((stat) => (
                    <View key={stat.id} style={styles.attributeRow}>
                      <Ionicons name="pulse" size={20} color="#8B5CF6" />
                      <Text style={styles.attributeLabel}>{stat.name}</Text>
                      <TextInput
                        style={styles.attributeInput}
                        placeholder="0"
                        placeholderTextColor="#6B7280"
                        value={String(statBoosts[stat.name] || 0)}
                        onChangeText={(text) => setStatBoosts({ ...statBoosts, [stat.name]: parseInt(text) || 0 })}
                        keyboardType="numeric"
                      />
                    </View>
                  ))}
                </View>
              )}

              {/* Add to Powers Checkbox */}
              <TouchableOpacity 
                style={styles.powerCheckboxContainer} 
                onPress={handleAddPowerToggle}
              >
                <View style={[styles.checkbox, newItem.is_power && styles.checkboxChecked]}>
                  {newItem.is_power && <Ionicons name="checkmark" size={18} color="#FFF" />}
                </View>
                <Text style={styles.checkboxLabel}>Add to Powers</Text>
              </TouchableOpacity>
              {newItem.is_power && newItem.power_category && (
                <View style={styles.selectedCategoryBadge}>
                  <Text style={styles.selectedCategoryText}>Category: {newItem.power_category}</Text>
                </View>
              )}

              {/* Category and Subcategory - Only show if is_power is checked */}
              {newItem.is_power && (
                <>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.categoryDropdownContainer}>
                    {Object.keys(userCategories).length === 0 ? (
                      <Text style={styles.noCategoriesText}>No categories yet. Create categories in Powers page.</Text>
                    ) : (
                      <View style={styles.categoryOptionsContainer}>
                        {Object.keys(userCategories).map((category) => (
                          <TouchableOpacity
                            key={category}
                            style={[
                              styles.categoryOption,
                              newItem.power_category === category && styles.categoryOptionSelected,
                            ]}
                            onPress={() => setNewItem({ ...newItem, power_category: category })}
                          >
                            <Text style={[
                              styles.categoryOptionText,
                              newItem.power_category === category && styles.categoryOptionTextSelected
                            ]}>
                              {category}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Subcategory dropdown - Only show if selected category has subcategories */}
                  {newItem.power_category && userCategories[newItem.power_category]?.length > 0 && (
                    <>
                      <Text style={styles.label}>Subcategory (Optional)</Text>
                      <View style={styles.subcategoryOptionsContainer}>
                        {userCategories[newItem.power_category].map((subcat) => (
                          <TouchableOpacity
                            key={subcat}
                            style={[
                              styles.subcategoryOption,
                              newItem.power_subcategory === subcat && styles.subcategoryOptionSelected,
                            ]}
                            onPress={() => setNewItem({ ...newItem, power_subcategory: subcat })}
                          >
                            <Text style={[
                              styles.subcategoryOptionText,
                              newItem.power_subcategory === subcat && styles.subcategoryOptionTextSelected
                            ]}>
                              {subcat}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}

                  <Text style={styles.label}>Max Level</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="5"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.power_max_level)}
                    onChangeText={(text) => setNewItem({ ...newItem, power_max_level: parseInt(text) || 5 })}
                    keyboardType="numeric"
                  />

                  <Text style={styles.label}>Next Tier Ability (Optional)</Text>
                  <Text style={styles.helperText}>What ability unlocks when this is maxed?</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Enhanced Strength, Peak Human Agility"
                    placeholderTextColor="#6B7280"
                    value={newItem.next_tier_ability}
                    onChangeText={(text) => setNewItem({ ...newItem, next_tier_ability: text })}
                  />
                </>
              )}

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

              {/* Existing Categories Selection */}
              {categories.length > 1 && (
                <>
                  <Text style={styles.label}>Or Select Existing Category</Text>
                  <View style={styles.existingCategoriesContainer}>
                    {categories.filter(cat => cat !== 'all').map(category => (
                      <TouchableOpacity
                        key={category}
                        style={[
                          styles.existingCategoryChip,
                          newItem.category === category && styles.existingCategoryChipSelected,
                        ]}
                        onPress={() => setNewItem({ ...newItem, category: category })}
                      >
                        <Text style={[
                          styles.existingCategoryChipText,
                          newItem.category === category && styles.existingCategoryChipTextSelected
                        ]}>
                          {category.charAt(0).toUpperCase() + category.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </>
              )}

              {/* Image Picker */}
              <Text style={styles.label}>Item Image (optional)</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
                <Ionicons name="image-outline" size={24} color="#8B5CF6" />
                <Text style={styles.imagePickerText}>
                  {newItem.images.length > 0 || newItem.image ? 'Add More Images' : 'Select Images'}
                </Text>
              </TouchableOpacity>
              {/* Show all images */}
              {newItem.images.length > 0 && (
                <View style={styles.imagesPreviewContainer}>
                  <Text style={styles.label}>Selected Images ({newItem.images.length})</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesPreviewScroll}>
                    {newItem.images.map((imageUri, index) => (
                      <View key={index} style={styles.imagePreview}>
                        <Image source={{ uri: imageUri }} style={styles.previewImage} />
                        <TouchableOpacity 
                          style={styles.removeImageButton}
                          onPress={() => removeImage(index)}
                        >
                          <Ionicons name="close-circle" size={20} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
              {/* Legacy single image support */}
              {newItem.image && newItem.images.length === 0 && (
                <View style={styles.imagePreview}>
                  <Image source={{ uri: newItem.image }} style={styles.previewImage} />
                  <TouchableOpacity 
                    style={styles.removeImageButton}
                    onPress={() => setNewItem({ ...newItem, image: '', images: [] })}
                  >
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              )}

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
              {/* Item Type Selector */}
              <Text style={styles.label}>Item Type</Text>
              <View style={styles.itemTypeContainer}>
                {['weapon', 'armor', 'potion', 'accessory', 'exp', 'gold', 'ability_points', 'synthesis_material'].map((type) => (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.itemTypeOption,
                      newItem.item_type === type && styles.itemTypeOptionSelected,
                    ]}
                    onPress={() => setNewItem({ ...newItem, item_type: type })}
                  >
                    <Text style={[
                      styles.itemTypeOptionText,
                      newItem.item_type === type && styles.itemTypeOptionTextSelected
                    ]}>
                      {type === 'ability_points' ? 'AP' : type === 'synthesis_material' ? 'Synthesis' : type.charAt(0).toUpperCase() + type.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Consumable Fields - Show based on item type */}
              {newItem.item_type === 'exp' && (
                <>
                  <Text style={styles.label}>EXP Amount</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="100"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.exp_amount)}
                    onChangeText={(text) => setNewItem({ ...newItem, exp_amount: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </>
              )}

              {newItem.item_type === 'gold' && (
                <>
                  <Text style={styles.label}>Gold Amount</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="500"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.gold_amount)}
                    onChangeText={(text) => setNewItem({ ...newItem, gold_amount: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </>
              )}

              {newItem.item_type === 'ability_points' && (
                <>
                  <Text style={styles.label}>Ability Points Amount</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="5"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.ap_amount)}
                    onChangeText={(text) => setNewItem({ ...newItem, ap_amount: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </>
              )}

              {newItem.item_type === 'synthesis_material' && (
                <View style={styles.synthesisNote}>
                  <Ionicons name="flask" size={20} color="#8B5CF6" />
                  <Text style={styles.synthesisNoteText}>
                    This item can be combined with other synthesis materials in the Synthesis page
                  </Text>
                </View>
              )}

              <Text style={styles.label}>Stat Boosts</Text>
              {customStats.length === 0 ? (
                <View style={styles.noStatsNotice}>
                  <Ionicons name="information-circle" size={24} color="#F59E0B" />
                  <Text style={styles.noStatsText}>
                    No custom stats found. Please create custom stats in the Status page first to add stat boosts to items.
                  </Text>
                </View>
              ) : (
                <View style={styles.attributeContainer}>
                  {customStats.map((stat) => (
                    <View key={stat.id} style={styles.attributeRow}>
                      <Ionicons name="pulse" size={20} color="#8B5CF6" />
                      <Text style={styles.attributeLabel}>{stat.name}</Text>
                      <TextInput
                        style={styles.attributeInput}
                        placeholder="0"
                        placeholderTextColor="#6B7280"
                        value={String(statBoosts[stat.name] || 0)}
                        onChangeText={(text) => setStatBoosts({ ...statBoosts, [stat.name]: parseInt(text) || 0 })}
                        keyboardType="numeric"
                      />
                    </View>
                  ))}
                </View>
              )}

              {/* Add to Powers Checkbox */}
              <TouchableOpacity 
                style={styles.powerCheckboxContainer} 
                onPress={handleAddPowerToggle}
              >
                <View style={[styles.checkbox, newItem.is_power && styles.checkboxChecked]}>
                  {newItem.is_power && <Ionicons name="checkmark" size={18} color="#FFF" />}
                </View>
                <Text style={styles.checkboxLabel}>Add to Powers</Text>
              </TouchableOpacity>
              {newItem.is_power && newItem.power_category && (
                <View style={styles.selectedCategoryBadge}>
                  <Text style={styles.selectedCategoryText}>Category: {newItem.power_category}</Text>
                </View>
              )}

              {/* Category and Subcategory - Only show if is_power is checked */}
              {newItem.is_power && (
                <>
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.categoryDropdownContainer}>
                    {Object.keys(userCategories).length === 0 ? (
                      <Text style={styles.noCategoriesText}>No categories yet. Create categories in Powers page.</Text>
                    ) : (
                      <View style={styles.categoryOptionsContainer}>
                        {Object.keys(userCategories).map((category) => (
                          <TouchableOpacity
                            key={category}
                            style={[
                              styles.categoryOption,
                              newItem.power_category === category && styles.categoryOptionSelected,
                            ]}
                            onPress={() => setNewItem({ ...newItem, power_category: category })}
                          >
                            <Text style={[
                              styles.categoryOptionText,
                              newItem.power_category === category && styles.categoryOptionTextSelected
                            ]}>
                              {category}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>

                  {/* Subcategory dropdown - Only show if selected category has subcategories */}
                  {newItem.power_category && userCategories[newItem.power_category]?.length > 0 && (
                    <>
                      <Text style={styles.label}>Subcategory (Optional)</Text>
                      <View style={styles.subcategoryOptionsContainer}>
                        {userCategories[newItem.power_category].map((subcat) => (
                          <TouchableOpacity
                            key={subcat}
                            style={[
                              styles.subcategoryOption,
                              newItem.power_subcategory === subcat && styles.subcategoryOptionSelected,
                            ]}
                            onPress={() => setNewItem({ ...newItem, power_subcategory: subcat })}
                          >
                            <Text style={[
                              styles.subcategoryOptionText,
                              newItem.power_subcategory === subcat && styles.subcategoryOptionTextSelected
                            ]}>
                              {subcat}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </>
                  )}

                  <Text style={styles.label}>Max Level</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="5"
                    placeholderTextColor="#6B7280"
                    value={String(newItem.power_max_level)}
                    onChangeText={(text) => setNewItem({ ...newItem, power_max_level: parseInt(text) || 5 })}
                    keyboardType="numeric"
                  />

                  <Text style={styles.label}>Next Tier Ability (Optional)</Text>
                  <Text style={styles.helperText}>What ability unlocks when this is maxed?</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g., Enhanced Strength, Peak Human Agility"
                    placeholderTextColor="#6B7280"
                    value={newItem.next_tier_ability}
                    onChangeText={(text) => setNewItem({ ...newItem, next_tier_ability: text })}
                  />
                </>
              )}

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

      {/* Item Detail Modal */}
      <Modal visible={detailModalVisible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.detailModalContainer} edges={['top']}>
          <View style={styles.detailModalHeader}>
            <TouchableOpacity onPress={() => setDetailModalVisible(false)}>
              <Ionicons name="close" size={32} color="#F9FAFB" />
            </TouchableOpacity>
          </View>

          {/* Fixed Image Section - Top Half with Swipeable Gallery */}
          <View style={styles.detailImageContainer}>
            {viewingItem?.images && viewingItem.images.length > 0 ? (
              <ScrollView 
                horizontal 
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                style={styles.imageGallery}
                onScroll={(event) => {
                  const slideSize = event.nativeEvent.layoutMeasurement.width;
                  const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
                  setCurrentImageIndex(index);
                }}
                scrollEventThrottle={16}
              >
                {viewingItem.images.map((imageUri, index) => (
                  <View key={index} style={styles.galleryImageContainer}>
                    <Image source={{ uri: imageUri }} style={styles.detailImage} resizeMode="contain" />
                  </View>
                ))}
              </ScrollView>
            ) : viewingItem?.image ? (
              <Image source={{ uri: viewingItem.image }} style={styles.detailImage} resizeMode="contain" />
            ) : (
              <View style={styles.detailImagePlaceholder}>
                <Ionicons name="image-outline" size={80} color="#4B5563" />
                <Text style={styles.detailImagePlaceholderText}>No image available</Text>
              </View>
            )}
            {/* Image indicator dots */}
            {viewingItem?.images && viewingItem.images.length > 1 && (
              <View style={styles.imageIndicatorContainer}>
                {viewingItem.images.map((_, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.imageIndicatorDot,
                      index === currentImageIndex && styles.imageIndicatorDotActive
                    ]} 
                  />
                ))}
              </View>
            )}
          </View>

          {/* Scrollable Description Section - Bottom Half */}
          <ScrollView style={styles.detailDescriptionScroll} contentContainerStyle={styles.detailDescriptionContainer}>
            <Text style={styles.detailItemName}>{viewingItem?.name}</Text>
            
            <View style={styles.detailPriceRow}>
              <View style={styles.detailPriceTag}>
                <Ionicons name="logo-bitcoin" size={20} color="#FCD34D" />
                <Text style={styles.detailPrice}>{viewingItem?.price}</Text>
              </View>
              {viewingItem?.stock !== undefined && viewingItem.stock > 0 && (
                <Text style={styles.detailStock}>Stock: {viewingItem.stock}</Text>
              )}
            </View>

            {viewingItem?.category && (
              <View style={styles.detailCategoryTag}>
                <Text style={styles.detailCategoryText}>{viewingItem.category}</Text>
              </View>
            )}

            <Text style={styles.detailDescriptionTitle}>Description</Text>
            <Text style={styles.detailDescription}>
              {viewingItem?.description || 'No description available'}
            </Text>

            {viewingItem?.stat_boost && Object.keys(viewingItem.stat_boost).length > 0 && (
              <>
                <Text style={styles.detailStatsTitle}>Stat Boosts</Text>
                <View style={styles.detailStatsList}>
                  {Object.entries(viewingItem.stat_boost).map(([stat, value]) => (
                    <View key={stat} style={styles.detailStatItem}>
                      <Ionicons 
                        name={stat === 'strength' ? 'barbell' : stat === 'intelligence' ? 'bulb' : 'heart'} 
                        size={20} 
                        color="#10B981" 
                      />
                      <Text style={styles.detailStatText}>
                        +{value} {stat.charAt(0).toUpperCase() + stat.slice(1)}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            <TouchableOpacity 
              style={styles.detailBuyButton}
              onPress={() => {
                setDetailModalVisible(false);
                if (viewingItem) purchaseItem(viewingItem);
              }}
            >
              <Ionicons name="cart" size={20} color="#FFF" />
              <Text style={styles.detailBuyButtonText}>Purchase Item</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Power Category Selection Modal */}
      <Modal visible={powerCategoryModalVisible} animationType="slide" transparent={true}>
        <TouchableWithoutFeedback onPress={() => setPowerCategoryModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.powerCategoryModalContent}>
                <Text style={styles.modalTitle}>Select Power Category</Text>
                <Text style={styles.label}>Choose where this ability should appear</Text>

                {/* Existing Categories */}
                {existingPowerCategories.length > 0 && (
                  <>
                    <Text style={styles.label}>Existing Categories</Text>
                    <View style={styles.powerCategoriesGrid}>
                      {existingPowerCategories.map((category) => (
                        <TouchableOpacity
                          key={category}
                          style={styles.powerCategoryButton}
                          onPress={() => handlePowerCategorySelect(category)}
                        >
                          <Text style={styles.powerCategoryButtonText}>{category}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                {/* Custom Category Input */}
                <Text style={styles.label}>Or Create New Category</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g., Physical Abilities, Mental Powers"
                  placeholderTextColor="#6B7280"
                  value={customPowerCategory}
                  onChangeText={setCustomPowerCategory}
                />

                <TouchableOpacity
                  style={[styles.createButton, !customPowerCategory.trim() && styles.createButtonDisabled]}
                  onPress={() => {
                    if (customPowerCategory.trim()) {
                      handlePowerCategorySelect(customPowerCategory.trim());
                      setCustomPowerCategory('');
                    }
                  }}
                  disabled={!customPowerCategory.trim()}
                >
                  <Text style={styles.createButtonText}>Create & Select</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setPowerCategoryModalVisible(false);
                    setNewItem({ ...newItem, is_power: false });
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Category Action Modal */}
      <Modal
        visible={categoryActionModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCategoryActionModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setCategoryActionModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.actionModalContent}>
                <Text style={styles.actionModalTitle}>Manage Category</Text>
                <Text style={styles.actionModalSubtitle}>{selectedCategoryForAction}</Text>
                
                <TouchableOpacity style={styles.actionButton} onPress={openRenameModal}>
                  <Ionicons name="pencil" size={20} color="#3B82F6" />
                  <Text style={[styles.actionButtonText, { color: '#3B82F6' }]}>Rename Category</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionButton} onPress={deleteCategory}>
                  <Ionicons name="trash" size={20} color="#EF4444" />
                  <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete Category</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={styles.cancelButton} 
                  onPress={() => setCategoryActionModalVisible(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Rename Category Modal */}
      <Modal
        visible={renameCategoryModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRenameCategoryModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setRenameCategoryModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.renameModalContent}>
                <Text style={styles.actionModalTitle}>Rename Category</Text>
                <Text style={styles.label}>New Category Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter new name"
                  placeholderTextColor="#6B7280"
                  value={newCategoryName}
                  onChangeText={setNewCategoryName}
                  autoFocus
                />
                
                <View style={styles.renameButtonContainer}>
                  <TouchableOpacity 
                    style={styles.cancelButtonSmall} 
                    onPress={() => setRenameCategoryModalVisible(false)}
                  >
                    <Text style={styles.cancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.saveButtonSmall} 
                    onPress={renameCategory}
                  >
                    <Text style={styles.saveButtonText}>Rename</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      </AppBackground>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#111827',
  },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
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
    overflow: 'hidden',
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
  categoryTabs: {
    marginBottom: 20,
  },
  categoryTabsContent: {
    paddingHorizontal: 0,
  },
  categoryTab: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  categoryTabSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  categoryTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  categoryTabTextSelected: {
    color: '#FFF',
  },
  existingCategoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  existingCategoryChip: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  existingCategoryChipSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  existingCategoryChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  existingCategoryChipTextSelected: {
    color: '#FFF',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#4B5563',
    gap: 12,
  },
  imagePickerText: {
    fontSize: 16,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  imagePreview: {
    position: 'relative',
    alignSelf: 'center',
    marginBottom: 16,
    marginRight: 12,
  },
  imagesPreviewContainer: {
    marginBottom: 16,
  },
  imagesPreviewScroll: {
    marginTop: 8,
  },
  previewImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#1F2937',
    borderRadius: 12,
  },
  itemImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  imageCountBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  imageCountText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  detailModalContainer: {
    flex: 1,
    backgroundColor: '#111827',
  },
  detailModalHeader: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  detailImageContainer: {
    height: '40%',
    backgroundColor: '#1F2937',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  detailImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailImagePlaceholderText: {
    color: '#6B7280',
    fontSize: 16,
    marginTop: 12,
  },
  imageGallery: {
    width: '100%',
    height: '100%',
  },
  galleryImageContainer: {
    width: Dimensions.get('window').width,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicatorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    marginHorizontal: 4,
  },
  imageIndicatorDotActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  detailDescriptionScroll: {
    flex: 1,
  },
  detailDescriptionContainer: {
    padding: 24,
    paddingBottom: 40,
  },
  detailItemName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 16,
  },
  detailPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  detailPriceTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  detailPrice: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FCD34D',
  },
  detailStock: {
    fontSize: 14,
    color: '#9CA3AF',
  },
  detailCategoryTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginBottom: 24,
  },
  detailCategoryText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  detailDescriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  detailDescription: {
    fontSize: 16,
    color: '#D1D5DB',
    lineHeight: 24,
    marginBottom: 24,
  },
  detailStatsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  detailStatsList: {
    marginBottom: 24,
  },
  detailStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  detailStatText: {
    fontSize: 16,
    color: '#10B981',
    fontWeight: '600',
  },
  detailBuyButton: {
    backgroundColor: '#8B5CF6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  detailBuyButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
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
  powerCheckboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  checkboxChecked: {
    backgroundColor: '#8B5CF6',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#F9FAFB',
    fontWeight: '600',
  },
  selectedCategoryBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  selectedCategoryText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  powerCategoryModalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxHeight: '80%',
  },
  powerCategoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  powerCategoryButton: {
    backgroundColor: '#374151',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    minWidth: 120,
    alignItems: 'center',
  },
  powerCategoryButtonText: {
    color: '#F9FAFB',
    fontSize: 14,
    fontWeight: '600',
  },
  createButtonDisabled: {
    backgroundColor: '#4B5563',
    opacity: 0.5,
  },
  powerTierContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  tierOption: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4B5563',
    minWidth: 100,
    alignItems: 'center',
  },
  tierOptionSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  tierOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  tierOptionTextSelected: {
    color: '#FFF',
  },
  categoryDropdownContainer: {
    marginBottom: 16,
  },
  noCategoriesText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
  categoryOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4B5563',
    minWidth: 100,
    alignItems: 'center',
  },
  categoryOptionSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  categoryOptionTextSelected: {
    color: '#FFF',
  },
  subcategoryOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  subcategoryOption: {
    backgroundColor: '#2D3748',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#4A5568',
    minWidth: 80,
    alignItems: 'center',
  },
  subcategoryOptionSelected: {
    backgroundColor: '#6B46C1',
    borderColor: '#6B46C1',
  },
  subcategoryOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#A0AEC0',
  },
  subcategoryOptionTextSelected: {
    color: '#FFF',
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 8,
    marginTop: -8,
  },
  categoryDropdownContainer: {
    marginBottom: 16,
  },
  noCategoriesText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    padding: 16,
    backgroundColor: '#374151',
    borderRadius: 12,
    fontStyle: 'italic',
  },
  categoryOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryOption: {
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4B5563',
    minWidth: 100,
    alignItems: 'center',
  },
  categoryOptionSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  categoryOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  categoryOptionTextSelected: {
    color: '#FFF',
  },
  subcategoryOptionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  subcategoryOption: {
    backgroundColor: '#374151',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4B5563',
    minWidth: 80,
    alignItems: 'center',
  },
  subcategoryOptionSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  subcategoryOptionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  subcategoryOptionTextSelected: {
    color: '#FFF',
  },
  itemTypeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  itemTypeOption: {
    flex: 1,
    minWidth: '45%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#4B5563',
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  itemTypeOptionSelected: {
    borderColor: '#8B5CF6',
    backgroundColor: '#1F2937',
  },
  itemTypeOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'capitalize',
  },
  itemTypeOptionTextSelected: {
    color: '#8B5CF6',
  },
  synthesisNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    gap: 12,
  },
  synthesisNoteText: {
    flex: 1,
    fontSize: 14,
    color: '#D1D5DB',
    lineHeight: 20,
  },
  actionModalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  actionModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 8,
    textAlign: 'center',
  },
  actionModalSubtitle: {
    fontSize: 16,
    color: '#8B5CF6',
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
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#4B5563',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  renameModalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    width: '85%',
    maxWidth: 400,
  },
  renameButtonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  cancelButtonSmall: {
    flex: 1,
    backgroundColor: '#4B5563',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonSmall: {
    flex: 1,
    backgroundColor: '#8B5CF6',
    padding: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  noStatsNotice: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  noStatsText: {
    fontSize: 14,
    color: '#92400E',
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});