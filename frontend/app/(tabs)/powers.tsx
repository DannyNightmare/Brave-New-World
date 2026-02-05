import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, ActivityIndicator, Image, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useCustomization, StatusTheme } from '../../contexts/CustomizationContext';
import { Ionicons } from '@expo/vector-icons';
import AppBackground from '../../components/AppBackground';
const API_URL = 'https://rpg-life-game.preview.emergentagent.com';

interface PowerItem {
  id: string;
  name: string;
  description: string;
  power_category: string;
  power_tier: string;
  current_level: number;
  max_level: number;
  next_tier_ability?: string;
  sub_abilities?: string[];
  image?: string;
  stat_boost?: { [key: string]: number };
  evolved_from?: string;
  evolved_abilities?: string[];
  evolved_ability_names?: { name: string; tier: string; category: string }[];
  is_evolved?: boolean;
}

interface ShopItem {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  is_power?: boolean;
  power_category?: string;
  power_subcategory?: string;
  power_tier?: string;
  power_max_level?: number;
}

export default function PowersScreen() {
  const { user, refreshUser } = useUser();
  const { colors } = useTheme();
  const { } = useNotification();
  const { statusTheme } = useCustomization();
  const styles = getStyles(statusTheme);
  const [powers, setPowers] = useState<PowerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [powerActionModalVisible, setPowerActionModalVisible] = useState(false);
  const [categoryActionModalVisible, setCategoryActionModalVisible] = useState(false);
  const [categoryManagerVisible, setCategoryManagerVisible] = useState(false);
  const [evolveModalVisible, setEvolveModalVisible] = useState(false);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [editingPower, setEditingPower] = useState<PowerItem | null>(null);
  const [selectedPower, setSelectedPower] = useState<PowerItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  
  // Evolution selection state
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [loadingShopItems, setLoadingShopItems] = useState(false);
  const [selectedEvolveCategory, setSelectedEvolveCategory] = useState<string | null>(null);
  const [selectedEvolveSubcategory, setSelectedEvolveSubcategory] = useState<string | null>(null);
  
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    max_level: 5,
    sub_abilities: [] as string[],
    newSubAbility: '',
  });
  const [evolveForm, setEvolveForm] = useState({
    name: '',
    description: '',
    power_tier: 'Enhanced',
    max_level: 5,
    sub_abilities: [] as string[],
    newSubAbility: '',
  });
  const [categoryForm, setCategoryForm] = useState({
    name: '',
    subcategories: [] as string[],
    newSubcategory: '',
  });
  const [userCategories, setUserCategories] = useState<{[key: string]: string[]}>({});

  // Fetch shop items for evolution selection
  const fetchShopItems = async () => {
    setLoadingShopItems(true);
    try {
      const response = await fetch(`${API_URL}/api/shop`);
      const data = await response.json();
      // Filter only power items
      const powerItems = data.filter((item: ShopItem) => item.is_power === true);
      setShopItems(powerItems);
    } catch (error) {
      console.error('Failed to fetch shop items:', error);
    } finally {
      setLoadingShopItems(false);
    }
  };

  // Get unique categories from shop items
  const getShopCategories = () => {
    const categories = new Set<string>();
    shopItems.forEach(item => {
      if (item.power_category) {
        categories.add(item.power_category);
      }
    });
    return Array.from(categories);
  };

  // Get subcategories for a category
  const getShopSubcategories = (category: string) => {
    const subcategories = new Set<string>();
    shopItems.forEach(item => {
      if (item.power_category === category && item.power_subcategory) {
        subcategories.add(item.power_subcategory);
      }
    });
    return Array.from(subcategories);
  };

  // Get items for a category/subcategory
  const getItemsForSelection = () => {
    return shopItems.filter(item => {
      if (selectedEvolveCategory && item.power_category !== selectedEvolveCategory) {
        return false;
      }
      if (selectedEvolveSubcategory && item.power_subcategory !== selectedEvolveSubcategory) {
        return false;
      }
      // Don't show the selected power itself
      if (selectedPower && item.name === selectedPower.name) {
        return false;
      }
      return true;
    });
  };

  const fetchPowers = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${API_URL}/api/powers/${user.id}`);
      const data = await response.json();
      setPowers(data);
    } catch (error) {
      console.error('Failed to fetch powers:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserCategories = async () => {
    if (!user?.id) {
      console.log('[Powers] No user ID, skipping category fetch');
      return;
    }
    
    try {
      console.log('[Powers] Fetching user categories for:', user.id);
      const response = await fetch(`${API_URL}/api/users/${user.id}/categories`);
      const data = await response.json();
      console.log('[Powers] Fetched user categories:', data);
      setUserCategories(data || {});
    } catch (error) {
      console.error('[Powers] Failed to fetch user categories:', error);
    }
  };

  const levelUpPower = async (powerId: string, powerName: string, nextTierAbility?: string) => {
    // Get current level before updating
    const currentPower = powers.find(p => p.id === powerId);
    const oldLevel = currentPower?.current_level || 0;
    
    try {
      const response = await fetch(`${API_URL}/api/powers/${powerId}/levelup`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // Refresh powers and user data after level up
        await fetchPowers();
        await refreshUser();
        
        // Level up is now silent - no popup notification
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to level up power');
      }
    } catch (error) {
      console.error('Failed to level up power:', error);
      alert('Failed to level up power');
    }
  };

  const handlePowerLongPress = (power: PowerItem) => {
    console.log('=== POWER LONG PRESS TRIGGERED ===');
    console.log('Power:', power.name, power.id);
    setSelectedPower(power);
    console.log('Selected power set, opening modal...');
    setPowerActionModalVisible(true);
    console.log('Modal visibility set to true');
  };

  const handleCategoryLongPress = (category: string) => {
    console.log('=== CATEGORY LONG PRESS TRIGGERED ===');
    console.log('Category:', category);
    setSelectedCategory(category);
    console.log('Selected category set, opening modal...');
    setCategoryActionModalVisible(true);
    console.log('Modal visibility set to true');
  };

  const handleEditPower = () => {
    if (selectedPower) {
      setEditingPower(selectedPower);
      setEditForm({
        name: selectedPower.name,
        description: selectedPower.description,
        max_level: selectedPower.max_level,
        sub_abilities: selectedPower.sub_abilities || [],
        newSubAbility: '',
      });
      setPowerActionModalVisible(false);
      setEditModalVisible(true);
    }
  };

  const handleAddEvolution = () => {
    if (selectedPower) {
      // Fetch shop items and open the evolution modal
      fetchShopItems();
      setSelectedEvolveCategory(null);
      setSelectedEvolveSubcategory(null);
      setPowerActionModalVisible(false);
      setEvolveModalVisible(true);
    }
  };

  const getAvailableEvolutions = () => {
    // Get powers that are not yet linked as evolutions and are not the selected power
    if (!selectedPower) return [];
    return powers.filter(p => 
      p.id !== selectedPower.id && 
      !p.evolved_from && 
      !p.is_evolved &&
      !selectedPower.evolved_abilities?.includes(p.id)
    );
  };

  // Link evolution from a shop item (by name)
  const linkEvolutionFromShop = async (shopItem: ShopItem) => {
    if (!selectedPower) return;

    try {
      const response = await fetch(`${API_URL}/api/powers/${selectedPower.id}/link-evolution-by-name`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          evolved_power_name: shopItem.name,
          evolved_power_tier: shopItem.power_tier || 'Basic',
          evolved_power_category: shopItem.power_category || selectedPower.power_category,
        }),
      });

      if (response.ok) {
        await fetchPowers();
        setEvolveModalVisible(false);
        setSelectedPower(null);
        Alert.alert('Success', `"${shopItem.name}" linked as evolution!`);
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to link evolution');
      }
    } catch (error) {
      console.error('Failed to link evolution:', error);
      Alert.alert('Error', 'Failed to link evolution');
    }
  };

  const linkEvolution = async (evolvedPowerId: string) => {
    if (!selectedPower) return;

    try {
      const response = await fetch(`${API_URL}/api/powers/${selectedPower.id}/link-evolution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evolved_power_id: evolvedPowerId }),
      });

      if (response.ok) {
        await fetchPowers();
        setEvolveModalVisible(false);
        setSelectedPower(null);
        Alert.alert('Success', 'Evolution linked successfully!');
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to link evolution');
      }
    } catch (error) {
      console.error('Failed to link evolution:', error);
      Alert.alert('Error', 'Failed to link evolution');
    }
  };

  const unlinkEvolution = async (parentId: string, evolvedId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/powers/${parentId}/unlink-evolution`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evolved_power_id: evolvedId }),
      });

      if (response.ok) {
        await fetchPowers();
        Alert.alert('Success', 'Evolution unlinked successfully!');
      } else {
        const error = await response.json();
        Alert.alert('Error', error.detail || 'Failed to unlink evolution');
      }
    } catch (error) {
      console.error('Failed to unlink evolution:', error);
      Alert.alert('Error', 'Failed to unlink evolution');
    }
  };

  // Get evolved abilities for a power (show all linked, parent max status determines lock state)
  const getEvolvedAbilities = (parentPower: PowerItem) => {
    const evolvedPowers: PowerItem[] = [];
    
    // Check powers linked by ID (evolved_abilities)
    if (parentPower.evolved_abilities && parentPower.evolved_abilities.length > 0) {
      const linkedById = powers.filter(p => parentPower.evolved_abilities?.includes(p.id));
      evolvedPowers.push(...linkedById);
    }
    
    // Check powers linked by name (evolved_ability_names from Shop)
    if (parentPower.evolved_ability_names && parentPower.evolved_ability_names.length > 0) {
      const evolvedNames = parentPower.evolved_ability_names.map(e => e.name);
      const linkedByName = powers.filter(p => evolvedNames.includes(p.name) && !evolvedPowers.find(ep => ep.id === p.id));
      evolvedPowers.push(...linkedByName);
    }
    
    return evolvedPowers;
  };

  // Check if a power is locked (is evolved and parent not maxed)
  const isPowerLocked = (power: PowerItem): boolean => {
    // Find parent power that has this power as evolution
    const parentPower = powers.find(p => {
      // Check evolved_abilities (by ID)
      if (p.evolved_abilities?.includes(power.id)) return true;
      // Check evolved_ability_names (by name)
      if (p.evolved_ability_names?.some(e => e.name === power.name)) return true;
      return false;
    });
    
    if (!parentPower) return false;
    
    // Locked if parent is not at max level
    return parentPower.current_level < parentPower.max_level;
  };
  
  // Check if power has evolutions linked (either by ID or by name)
  const hasEvolutions = (power: PowerItem): boolean => {
    return (power.evolved_abilities && power.evolved_abilities.length > 0) ||
           (power.evolved_ability_names && power.evolved_ability_names.length > 0);
  };
  
  // Get total evolution count
  const getEvolutionCount = (power: PowerItem): number => {
    let count = 0;
    if (power.evolved_abilities) count += power.evolved_abilities.length;
    if (power.evolved_ability_names) count += power.evolved_ability_names.length;
    return count;
  };

  const handleDeletePower = async () => {
    if (!selectedPower) {
      console.log('No power selected');
      return;
    }
    
    // Close action modal and show delete confirmation
    setPowerActionModalVisible(false);
    setDeleteConfirmVisible(true);
  };

  const confirmDeletePower = async () => {
    if (!selectedPower) return;
    
    try {
      console.log('Calling DELETE endpoint:', `${API_URL}/api/powers/${selectedPower.id}`);
      const response = await fetch(`${API_URL}/api/powers/${selectedPower.id}`, {
        method: 'DELETE',
      });

      console.log('Delete response status:', response.status);

      if (response.ok) {
        await fetchPowers();
        setDeleteConfirmVisible(false);
        setSelectedPower(null);
      } else {
        const responseText = await response.text();
        console.error('Delete failed:', responseText);
      }
    } catch (error) {
      console.error('Failed to delete power:', error);
    }
  };

  const handleEditCategory = () => {
    if (selectedCategory) {
      setCategoryForm({
        name: selectedCategory,
        subcategories: userCategories[selectedCategory] || [],
        newSubcategory: '',
      });
      setCategoryActionModalVisible(false);
    }
  };

  const handleDeleteCategory = async () => {
    console.log('=== DELETE CATEGORY BUTTON PRESSED ===');
    if (!selectedCategory) {
      console.log('No category selected');
      return;
    }

    console.log('Attempting to delete category:', selectedCategory);
    
    // Close action modal and proceed directly to deletion
    setCategoryActionModalVisible(false);
    
    console.log('Deleting category from state:', selectedCategory);
    const categoryToDelete = selectedCategory;
    const newCategories = { ...userCategories };
    delete newCategories[categoryToDelete];
    
    // Save to backend
    try {
      const response = await fetch(`${API_URL}/api/users/${user?.id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCategories),
      });
      
      if (response.ok) {
        setUserCategories(newCategories);
        setSelectedCategory('');
        console.log('Category deleted successfully, new categories:', Object.keys(newCategories));
        // Show success via simple alert
        setTimeout(() => {
          alert(`Category "${categoryToDelete}" deleted successfully!`);
        }, 100);
      } else {
        console.error('Failed to delete category from server');
        alert('Failed to delete category from server');
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
      alert('Failed to delete category');
    }
  };

  const addSubAbility = () => {
    if (editForm.newSubAbility.trim()) {
      setEditForm({
        ...editForm,
        sub_abilities: [...editForm.sub_abilities, editForm.newSubAbility.trim()],
        newSubAbility: '',
      });
    }
  };

  const saveUserCategories = async () => {
    if (!user?.id) return;

    try {
      const response = await fetch(`${API_URL}/api/users/${user.id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userCategories),
      });

      if (response.ok) {
        setCategoryManagerVisible(false);
        // Refresh categories to show them immediately
        await fetchUserCategories();
        Alert.alert('Success', 'Categories saved! They are now visible on the Powers page.');
      } else {
        Alert.alert('Error', 'Failed to save categories');
      }
    } catch (error) {
      console.error('Failed to save categories:', error);
      Alert.alert('Error', 'Failed to save categories');
    }
  };

  const removeSubAbility = (index: number) => {
    setEditForm({
      ...editForm,
      sub_abilities: editForm.sub_abilities.filter((_, i) => i !== index),
    });
  };

  const savePowerEdit = async () => {
    if (!editingPower) return;

    try {
      const response = await fetch(`${API_URL}/api/powers/${editingPower.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editForm.name,
          description: editForm.description,
          max_level: editForm.max_level,
          sub_abilities: editForm.sub_abilities,
        }),
      });

      if (response.ok) {
        await fetchPowers();
        setEditModalVisible(false);
        setEditingPower(null);
        Alert.alert('Success', 'Power updated successfully!');
      } else {
        Alert.alert('Error', 'Failed to update power');
      }
    } catch (error) {
      console.error('Failed to update power:', error);
      Alert.alert('Error', 'Failed to update power');
    }
  };

  useEffect(() => {
    fetchPowers();
    fetchUserCategories();
  }, [user]);

  const toggleCategory = (category: string) => {
    if (expandedCategories.includes(category)) {
      setExpandedCategories(expandedCategories.filter(c => c !== category));
    } else {
      setExpandedCategories([...expandedCategories, category]);
    }
  };

  // Group powers by category
  const groupedPowers = powers.reduce((acc, power) => {
    const category = power.power_category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(power);
    return acc;
  }, {} as { [key: string]: PowerItem[] });

  // Combine categories from powers and user-created categories
  const powerCategories = Object.keys(groupedPowers);
  const userCreatedCategories = Object.keys(userCategories);
  const allCategories = [...new Set([...powerCategories, ...userCreatedCategories])];
  const categories = allCategories.sort();

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={statusTheme.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  // Render content based on powers state
  const renderContent = () => {
    if (powers.length === 0) {
      return (
        <>
          <View style={styles.header}>
            <View style={styles.headerBadges}>
              <View style={styles.apBadge}>
                <Ionicons name="diamond" size={16} color="#F59E0B" />
                <Text style={styles.apText}>{user?.ability_points || 0} AP</Text>
              </View>
              <TouchableOpacity 
                style={styles.categoryButton}
                onPress={() => setCategoryManagerVisible(true)}
              >
                <Ionicons name="filing" size={16} color={statusTheme.colors.primary} />
                <Text style={styles.categoryButtonText}>Categories</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.placeholder}>
            <Ionicons name="flash-off" size={48} color="#6B7280" />
            <Text style={styles.placeholderText}>No powers yet!</Text>
            <Text style={styles.placeholderSubtext}>Purchase items marked as "Add to Powers" from the Shop</Text>
          </View>
        </>
      );
    }

    return (
      <>
        <View style={styles.header}>
          <View style={styles.headerBadges}>
            <View style={styles.apBadge}>
              <Ionicons name="diamond" size={16} color="#F59E0B" />
              <Text style={styles.apText}>{user?.ability_points || 0} AP</Text>
            </View>
            <TouchableOpacity 
              style={styles.categoryButton}
              onPress={() => setCategoryManagerVisible(true)}
            >
              <Ionicons name="filing" size={16} color="#8B5CF6" />
              <Text style={styles.categoryButtonText}>Categories</Text>
            </TouchableOpacity>
          </View>
        </View>

        {categories.map((category) => {
          const categoryPowers = groupedPowers[category] || [];
          const categorySubcategories = userCategories[category] || [];
          
          // Group powers by subcategory
          const powersWithSubcategory: { [key: string]: PowerItem[] } = {};
          const powersWithoutSubcategory: PowerItem[] = [];
          
          categoryPowers.forEach((power) => {
            console.log(`Power: ${power.name}, Subcategory: ${power.power_subcategory}`);
            if (power.power_subcategory) {
              if (!powersWithSubcategory[power.power_subcategory]) {
                powersWithSubcategory[power.power_subcategory] = [];
              }
              powersWithSubcategory[power.power_subcategory].push(power);
            } else {
              powersWithoutSubcategory.push(power);
            }
          });
          
          console.log(`Category: ${category}, Powers with subcategories:`, Object.keys(powersWithSubcategory));
          console.log(`Category: ${category}, Powers without subcategories: ${powersWithoutSubcategory.length}`);
          
          return (
            <View key={category} style={styles.categoryContainer}>
              {/* Category Header - Centered with lines */}
              <Pressable
                onLongPress={() => handleCategoryLongPress(category)}
                style={styles.categoryHeader}
              >
                <View style={styles.categoryHeaderLine} />
                <Text style={styles.categoryTitle}>{category}</Text>
                <View style={styles.categoryHeaderLine} />
              </Pressable>

              {/* Show empty state if no powers */}
              {categoryPowers.length === 0 ? (
                <View style={styles.emptyCategoryContainer}>
                  <Text style={styles.emptyCategoryText}>No abilities in this category yet</Text>
                </View>
              ) : (
                <>
                  {/* Display powers without subcategory first - filter out evolved powers */}
                  {powersWithoutSubcategory
                    .filter((power) => !power.is_evolved) // Hide evolved powers from main list
                    .map((power) => {
                    const isMaxLevel = power.current_level >= power.max_level;
                    const progress = (power.current_level / power.max_level) * 100;
                    const evolvedAbilities = getEvolvedAbilities(power);
                    
                    return (
                      <React.Fragment key={power.id}>
                        <Pressable
                          onLongPress={() => handlePowerLongPress(power)}
                          style={({ pressed }) => [
                            styles.abilityRow,
                            pressed && styles.abilityRowPressed
                          ]}
                        >
                          {/* Ability Name */}
                          <View style={styles.abilityNameSection}>
                            <Text style={styles.abilityName}>{power.name}</Text>
                            {hasEvolutions(power) && (
                              <View style={styles.hasEvolutionBadge}>
                                <Ionicons name="git-branch" size={10} color="#10B981" />
                                <Text style={styles.hasEvolutionText}>{getEvolutionCount(power)}</Text>
                              </View>
                            )}
                          </View>

                          {/* Progress Bar and Counter */}
                          <View style={styles.abilityProgressSection}>
                            <View style={styles.progressBarSmall}>
                              <View 
                                style={[styles.progressBarFillSmall, { width: `${progress}%` }]} 
                              />
                            </View>
                            <Text style={styles.xpCounter}>
                              {power.current_level} / {power.max_level}
                            </Text>
                          </View>

                          {/* Level Badge and Action Button */}
                          <View style={styles.abilityActionSection}>
                            <View style={styles.levelBadge}>
                              <Text style={styles.levelBadgeText}>Lv.{power.current_level}</Text>
                            </View>
                            {isMaxLevel ? (
                              <View style={styles.maxBadgeSmall}>
                                <Text style={styles.maxBadgeSmallText}>MAX</Text>
                              </View>
                            ) : (
                              <TouchableOpacity
                                style={[
                                  styles.levelUpButtonSmall,
                                  (user?.ability_points || 0) < 1 && styles.levelUpButtonSmallDisabled
                                ]}
                                onPress={() => levelUpPower(power.id, power.name, power.next_tier_ability)}
                                disabled={(user?.ability_points || 0) < 1}
                              >
                                <Ionicons name="add" size={20} color="#FFF" />
                              </TouchableOpacity>
                            )}
                          </View>
                        </Pressable>
                        
                        {/* Show evolved abilities underneath - greyed out if parent not maxed */}
                        {evolvedAbilities.length > 0 && evolvedAbilities.map((evolvedPower) => {
                          const evolvedProgress = (evolvedPower.current_level / evolvedPower.max_level) * 100;
                          const evolvedIsMax = evolvedPower.current_level >= evolvedPower.max_level;
                          const isLocked = !isMaxLevel; // Locked until parent is maxed
                          
                          return (
                            <View key={evolvedPower.id} style={isLocked ? styles.lockedEvolution : undefined}>
                              <View style={styles.evolvedPowerIndicator}>
                                <View style={[styles.evolutionLine, isLocked && styles.lockedEvolutionLine]} />
                                <View style={[styles.evolvedBadge, isLocked && styles.lockedBadge]}>
                                  {isLocked ? (
                                    <>
                                      <Ionicons name="lock-closed" size={10} color="#6B7280" />
                                      <Text style={styles.lockedBadgeText}>Locked</Text>
                                    </>
                                  ) : (
                                    <>
                                      <Ionicons name="arrow-up" size={10} color={statusTheme.colors.primary} />
                                      <Text style={styles.evolvedBadgeText}>Evolved</Text>
                                    </>
                                  )}
                                </View>
                              </View>
                              <Pressable
                                onLongPress={isLocked ? undefined : () => handlePowerLongPress(evolvedPower)}
                                style={({ pressed }) => [
                                  styles.abilityRow,
                                  styles.evolvedAbilityRow,
                                  isLocked && styles.lockedAbilityRow,
                                  !isLocked && pressed && styles.abilityRowPressed
                                ]}
                              >
                                <View style={styles.abilityNameSection}>
                                  <Text style={[styles.abilityName, isLocked && styles.lockedText]}>{evolvedPower.name}</Text>
                                </View>
                                <View style={styles.abilityProgressSection}>
                                  <View style={[styles.progressBarSmall, isLocked && styles.lockedProgressBar]}>
                                    <View style={[styles.progressBarFillSmall, isLocked && styles.lockedProgressFill, { width: `${evolvedProgress}%` }]} />
                                  </View>
                                  <Text style={[styles.xpCounter, isLocked && styles.lockedText]}>{evolvedPower.current_level} / {evolvedPower.max_level}</Text>
                                </View>
                                <View style={styles.abilityActionSection}>
                                  <View style={[styles.levelBadge, isLocked && styles.lockedLevelBadge]}>
                                    <Text style={[styles.levelBadgeText, isLocked && styles.lockedText]}>Lv.{evolvedPower.current_level}</Text>
                                  </View>
                                  {isLocked ? (
                                    <View style={styles.lockedIconContainer}>
                                      <Ionicons name="lock-closed" size={18} color="#6B7280" />
                                    </View>
                                  ) : evolvedIsMax ? (
                                    <View style={styles.maxBadgeSmall}>
                                      <Text style={styles.maxBadgeSmallText}>MAX</Text>
                                    </View>
                                  ) : (
                                    <TouchableOpacity
                                      style={[styles.levelUpButtonSmall, (user?.ability_points || 0) < 1 && styles.levelUpButtonSmallDisabled]}
                                      onPress={() => levelUpPower(evolvedPower.id, evolvedPower.name, evolvedPower.next_tier_ability)}
                                      disabled={(user?.ability_points || 0) < 1}
                                    >
                                      <Ionicons name="add" size={20} color="#FFF" />
                                    </TouchableOpacity>
                                  )}
                                </View>
                              </Pressable>
                            </View>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}

                  {/* Display subcategories and their powers */}
                  {Object.keys(powersWithSubcategory).sort().map((subcategory) => {
                    const subcategoryPowers = powersWithSubcategory[subcategory];
                    
                    return (
                      <View key={subcategory} style={styles.subcategorySection}>
                        {/* Subcategory Header */}
                        <Text style={styles.subcategoryTitle}>{subcategory}</Text>
                        
                        {/* Powers in this subcategory */}
                        {subcategoryPowers.map((power) => {
                const isMaxLevel = power.current_level >= power.max_level;
                const progress = (power.current_level / power.max_level) * 100;
                
                return (
                  <Pressable
                    key={power.id}
                    onLongPress={() => handlePowerLongPress(power)}
                    style={({ pressed }) => [
                      styles.abilityRow,
                      pressed && styles.abilityRowPressed
                    ]}
                  >
                    {/* Ability Name */}
                    <View style={styles.abilityNameSection}>
                      <Text style={styles.abilityName}>{power.name}</Text>
                    </View>

                    {/* Progress Bar and Counter */}
                    <View style={styles.abilityProgressSection}>
                      <View style={styles.progressBarSmall}>
                        <View 
                          style={[styles.progressBarFillSmall, { width: `${progress}%` }]} 
                        />
                      </View>
                      <Text style={styles.xpCounter}>
                        {power.current_level} / {power.max_level}
                      </Text>
                    </View>

                    {/* Level Badge and Action Button */}
                    <View style={styles.abilityActionSection}>
                      <View style={styles.levelBadge}>
                        <Text style={styles.levelBadgeText}>Lv.{power.current_level}</Text>
                      </View>
                      {isMaxLevel ? (
                        <View style={styles.maxBadgeSmall}>
                          <Text style={styles.maxBadgeSmallText}>MAX</Text>
                        </View>
                      ) : (
                        <TouchableOpacity
                          style={[
                            styles.levelUpButtonSmall,
                            (user?.ability_points || 0) < 1 && styles.levelUpButtonSmallDisabled
                          ]}
                          onPress={() => levelUpPower(power.id, power.name, power.next_tier_ability)}
                          disabled={(user?.ability_points || 0) < 1}
                        >
                          <Ionicons name="add" size={20} color="#FFF" />
                        </TouchableOpacity>
                      )}
                    </View>
                  </Pressable>
                );
              })}
                      </View>
                    );
                  })}
                </>
              )}
            </View>
          );
        })}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <AppBackground>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {renderContent()}
        </ScrollView>

      {/* Edit Power Modal */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.editModalContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Edit Power</Text>

              <Text style={styles.label}>Name</Text>
              <TextInput
                style={styles.input}
                value={editForm.name}
                onChangeText={(text) => setEditForm({ ...editForm, name: text })}
                placeholder="Power name"
                placeholderTextColor="#6B7280"
              />

              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.description}
                onChangeText={(text) => setEditForm({ ...editForm, description: text })}
                placeholder="Power description"
                placeholderTextColor="#6B7280"
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Max Level</Text>
              <TextInput
                style={styles.input}
                value={String(editForm.max_level)}
                onChangeText={(text) => setEditForm({ ...editForm, max_level: parseInt(text) || 5 })}
                placeholder="5"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
              />

              <Text style={styles.label}>Sub-Abilities / Perks</Text>
              {editForm.sub_abilities.map((subAbility, index) => (
                <View key={index} style={styles.subAbilityEditItem}>
                  <Text style={styles.subAbilityEditText}>{subAbility}</Text>
                  <TouchableOpacity onPress={() => removeSubAbility(index)}>
                    <Ionicons name="close-circle" size={24} color="#EF4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <View style={styles.addSubAbilityContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={editForm.newSubAbility}
                  onChangeText={(text) => setEditForm({ ...editForm, newSubAbility: text })}
                  placeholder="Add a perk (e.g., Enhanced Reflexes)"
                  placeholderTextColor="#6B7280"
                />
                <TouchableOpacity style={styles.addButton} onPress={addSubAbility}>
                  <Ionicons name="add-circle" size={32} color={statusTheme.colors.primary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.saveButton} onPress={savePowerEdit}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setEditModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Category Manager Modal */}
      <Modal visible={categoryManagerVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.categoryManagerContent}>
            <ScrollView>
              <Text style={styles.modalTitle}>Manage Categories</Text>
              <Text style={styles.helperText}>Organize your powers with custom categories and subcategories</Text>

              {/* Display existing categories */}
              {Object.keys(userCategories).length > 0 && (
                <>
                  <Text style={styles.label}>Your Categories</Text>
                  {Object.entries(userCategories).map(([category, subcategories]) => (
                    <Pressable
                      key={category}
                      onLongPress={() => handleCategoryLongPress(category)}
                      style={({ pressed }) => [
                        styles.categoryItem,
                        pressed && styles.categoryItemPressed
                      ]}
                    >
                      <View style={styles.categoryItemHeader}>
                        <Ionicons name="folder" size={20} color={statusTheme.colors.primary} />
                        <Text style={styles.categoryItemName}>{category}</Text>
                      </View>
                      {subcategories && subcategories.length > 0 && (
                        <View style={styles.subcategoriesList}>
                          {subcategories.map((sub, idx) => (
                            <View key={idx} style={styles.subcategoryChip}>
                              <Text style={styles.subcategoryChipText}>{sub}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                    </Pressable>
                  ))}
                </>
              )}

              {/* Add new category */}
              <Text style={styles.label}>Create New Category</Text>
              <TextInput
                style={styles.input}
                placeholder="Category name (e.g., Physical Abilities)"
                placeholderTextColor="#6B7280"
                value={categoryForm.name}
                onChangeText={(text) => setCategoryForm({ ...categoryForm, name: text })}
              />

              {/* Subcategories */}
              {categoryForm.subcategories.length > 0 && (
                <>
                  <Text style={styles.label}>Subcategories</Text>
                  <View style={styles.subcategoriesEditList}>
                    {categoryForm.subcategories.map((sub, index) => (
                      <View key={index} style={styles.subAbilityEditItem}>
                        <Text style={styles.subAbilityEditText}>{sub}</Text>
                        <TouchableOpacity onPress={() => {
                          setCategoryForm({
                            ...categoryForm,
                            subcategories: categoryForm.subcategories.filter((_, i) => i !== index)
                          });
                        }}>
                          <Ionicons name="close-circle" size={24} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                </>
              )}

              <View style={styles.addSubAbilityContainer}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="Add subcategory (optional)"
                  placeholderTextColor="#6B7280"
                  value={categoryForm.newSubcategory}
                  onChangeText={(text) => setCategoryForm({ ...categoryForm, newSubcategory: text })}
                />
                <TouchableOpacity 
                  style={styles.addButton} 
                  onPress={() => {
                    if (categoryForm.newSubcategory.trim()) {
                      setCategoryForm({
                        ...categoryForm,
                        subcategories: [...categoryForm.subcategories, categoryForm.newSubcategory.trim()],
                        newSubcategory: '',
                      });
                    }
                  }}
                >
                  <Ionicons name="add-circle" size={32} color={statusTheme.colors.primary} />
                </TouchableOpacity>
              </View>

              <TouchableOpacity 
                style={[styles.saveButton, !categoryForm.name.trim() && styles.createButtonDisabled]}
                disabled={!categoryForm.name.trim()}
                onPress={() => {
                  if (categoryForm.name.trim()) {
                    setUserCategories({
                      ...userCategories,
                      [categoryForm.name.trim()]: categoryForm.subcategories
                    });
                    setCategoryForm({ name: '', subcategories: [], newSubcategory: '' });
                    Alert.alert('Success', 'Category created!');
                  }
                }}
              >
                <Text style={styles.saveButtonText}>Add Category</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.completeButton, Object.keys(userCategories).length === 0 && styles.createButtonDisabled]}
                disabled={Object.keys(userCategories).length === 0}
                onPress={saveUserCategories}
              >
                <Ionicons name="checkmark-done" size={20} color="#FFF" />
                <Text style={styles.completeButtonText}>Complete - Save Categories</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setCategoryManagerVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Power Action Modal */}
      <Modal visible={powerActionModalVisible} animationType="fade" transparent={true}>
        <TouchableOpacity 
          style={styles.actionModalOverlay}
          activeOpacity={1}
          onPress={() => setPowerActionModalVisible(false)}
        >
          <View style={styles.actionModalContent}>
            <Text style={styles.actionModalTitle}>
              {selectedPower?.name}
            </Text>
            {selectedPower && selectedPower.current_level >= selectedPower.max_level && (
              <View style={styles.maxedBadge}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={styles.maxedBadgeText}>MAXED OUT</Text>
              </View>
            )}
            <TouchableOpacity style={styles.actionButton} onPress={handleEditPower}>
              <Ionicons name="create" size={24} color="#3B82F6" />
              <Text style={styles.actionButtonText}>Edit Power</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[
                styles.actionButton, 
                styles.evolveActionButton
              ]} 
              onPress={handleAddEvolution}
            >
              <Ionicons name="arrow-up-circle" size={24} color="#10B981" />
              <Text style={[
                styles.actionButtonText, 
                styles.evolveActionButtonText
              ]}>
                Add Evolution
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.deleteActionButton]} onPress={handleDeletePower}>
              <Ionicons name="trash" size={24} color="#EF4444" />
              <Text style={[styles.actionButtonText, styles.deleteActionButtonText]}>Delete Power</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelActionButton} onPress={() => setPowerActionModalVisible(false)}>
              <Text style={styles.cancelActionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteConfirmVisible} animationType="fade" transparent={true}>
        <View style={styles.actionModalOverlay}>
          <View style={styles.deleteConfirmContent}>
            <Ionicons name="warning" size={48} color="#EF4444" style={{ marginBottom: 16 }} />
            <Text style={styles.deleteConfirmTitle}>Delete Power</Text>
            <Text style={styles.deleteConfirmText}>
              Are you sure you want to delete "{selectedPower?.name}"?
            </Text>
            <Text style={styles.deleteConfirmSubtext}>
              This action cannot be undone.
            </Text>
            <View style={styles.deleteConfirmButtons}>
              <TouchableOpacity 
                style={styles.deleteConfirmCancelBtn} 
                onPress={() => {
                  setDeleteConfirmVisible(false);
                  setSelectedPower(null);
                }}
              >
                <Text style={styles.deleteConfirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.deleteConfirmDeleteBtn} 
                onPress={confirmDeletePower}
              >
                <Ionicons name="trash" size={20} color="#FFFFFF" />
                <Text style={styles.deleteConfirmDeleteText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Evolution Link Modal - Category Browser */}
      <Modal visible={evolveModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.evolveModalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add Evolution</Text>
              <TouchableOpacity onPress={() => {
                setEvolveModalVisible(false);
                setSelectedEvolveCategory(null);
                setSelectedEvolveSubcategory(null);
              }}>
                <Ionicons name="close" size={28} color={statusTheme.colors.text} />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.evolveDescription}>
              Select an ability from the Shop to link as an evolution for "{selectedPower?.name}".
            </Text>

            {loadingShopItems ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={statusTheme.colors.primary} />
                <Text style={styles.loadingText}>Loading abilities...</Text>
              </View>
            ) : (
              <>
                {/* Category Selection */}
                <Text style={styles.evolveSubtitle}>Categories:</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  <TouchableOpacity
                    style={[
                      styles.categoryChip,
                      !selectedEvolveCategory && styles.categoryChipSelected
                    ]}
                    onPress={() => {
                      setSelectedEvolveCategory(null);
                      setSelectedEvolveSubcategory(null);
                    }}
                  >
                    <Text style={[
                      styles.categoryChipText,
                      !selectedEvolveCategory && styles.categoryChipTextSelected
                    ]}>All</Text>
                  </TouchableOpacity>
                  {getShopCategories().map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.categoryChip,
                        selectedEvolveCategory === cat && styles.categoryChipSelected
                      ]}
                      onPress={() => {
                        setSelectedEvolveCategory(cat);
                        setSelectedEvolveSubcategory(null);
                      }}
                    >
                      <Text style={[
                        styles.categoryChipText,
                        selectedEvolveCategory === cat && styles.categoryChipTextSelected
                      ]}>{cat}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Subcategory Selection (if category selected and has subcategories) */}
                {selectedEvolveCategory && getShopSubcategories(selectedEvolveCategory).length > 0 && (
                  <>
                    <Text style={styles.evolveSubtitle}>Subcategories:</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                      <TouchableOpacity
                        style={[
                          styles.subcategoryChip,
                          !selectedEvolveSubcategory && styles.subcategoryChipSelected
                        ]}
                        onPress={() => setSelectedEvolveSubcategory(null)}
                      >
                        <Text style={[
                          styles.subcategoryChipText,
                          !selectedEvolveSubcategory && styles.subcategoryChipTextSelected
                        ]}>All</Text>
                      </TouchableOpacity>
                      {getShopSubcategories(selectedEvolveCategory).map((subcat) => (
                        <TouchableOpacity
                          key={subcat}
                          style={[
                            styles.subcategoryChip,
                            selectedEvolveSubcategory === subcat && styles.subcategoryChipSelected
                          ]}
                          onPress={() => setSelectedEvolveSubcategory(subcat)}
                        >
                          <Text style={[
                            styles.subcategoryChipText,
                            selectedEvolveSubcategory === subcat && styles.subcategoryChipTextSelected
                          ]}>{subcat}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </>
                )}

                {/* Abilities List */}
                <Text style={styles.evolveSubtitle}>Available Abilities:</Text>
                <ScrollView style={styles.evolveList}>
                  {getItemsForSelection().length === 0 ? (
                    <View style={styles.emptyEvolveState}>
                      <Ionicons name="information-circle" size={48} color={statusTheme.colors.textSecondary} />
                      <Text style={styles.emptyEvolveText}>No abilities found.</Text>
                      <Text style={styles.emptyEvolveSubtext}>Create abilities in the Shop first.</Text>
                    </View>
                  ) : (
                    getItemsForSelection().map((item) => (
                      <TouchableOpacity 
                        key={item.id} 
                        style={styles.evolveItem}
                        onPress={() => linkEvolutionFromShop(item)}
                      >
                        <View style={styles.evolveItemInfo}>
                          <Text style={styles.evolveItemName}>{item.name}</Text>
                          <Text style={styles.evolveItemTier}>{item.power_tier || 'Basic'}</Text>
                          {item.power_subcategory && (
                            <Text style={styles.evolveItemSubcat}>{item.power_subcategory}</Text>
                          )}
                        </View>
                        <View style={styles.evolveItemAction}>
                          <Ionicons name="add-circle" size={24} color={statusTheme.colors.primary} />
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </ScrollView>
              </>
            )}

            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => {
                setEvolveModalVisible(false);
                setSelectedEvolveCategory(null);
                setSelectedEvolveSubcategory(null);
              }}
            >
              <Text style={styles.closeButtonText}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Category Action Modal */}
      <Modal visible={categoryActionModalVisible} animationType="fade" transparent={true}>
        <TouchableOpacity 
          style={styles.actionModalOverlay}
          activeOpacity={1}
          onPress={() => setCategoryActionModalVisible(false)}
        >
          <View style={styles.actionModalContent}>
            <Text style={styles.actionModalTitle}>
              {selectedCategory}
            </Text>
            <TouchableOpacity style={styles.actionButton} onPress={handleEditCategory}>
              <Ionicons name="create" size={24} color="#3B82F6" />
              <Text style={styles.actionButtonText}>Edit Category</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.actionButton, styles.deleteActionButton]} onPress={handleDeleteCategory}>
              <Ionicons name="trash" size={24} color="#EF4444" />
              <Text style={[styles.actionButtonText, styles.deleteActionButtonText]}>Delete Category</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.cancelActionButton} onPress={() => setCategoryActionModalVisible(false)}>
              <Text style={styles.cancelActionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
      </AppBackground>
    </SafeAreaView>
  );
}

const getStyles = (theme: StatusTheme) => StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  apBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.goldColor,
  },
  apText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.goldColor,
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  countText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  categoryContainer: {
    marginBottom: 32,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 16,
    gap: 16,
  },
  categoryHeaderLine: {
    flex: 1,
    height: 1,
    backgroundColor: theme.colors.primary,
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 8,
  },
  abilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
    marginBottom: 8,
  },
  abilityRowPressed: {
    opacity: 0.7,
  },
  abilityNameSection: {
    flex: 2,
  },
  abilityNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  abilityName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#F9FAFB',
    flex: 1,
  },
  levelBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  levelBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#FFF',
  },
  abilityTier: {
    fontSize: 11,
    color: theme.colors.primary,
    marginTop: 2,
  },
  abilityProgressSection: {
    flex: 2,
    marginHorizontal: 12,
  },
  progressBarSmall: {
    height: 6,
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFillSmall: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 3,
  },
  xpCounter: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  abilityActionSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  levelUpButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelUpButtonSmallDisabled: {
    backgroundColor: '#6B7280',
    opacity: 0.6,
  },
  maxBadgeSmall: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  maxBadgeSmallText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  placeholder: {
    backgroundColor: '#1F2937',
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#374151',
    borderStyle: 'dashed',
  },
  placeholderText: {
    color: '#9CA3AF',
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  placeholderSubtext: {
    color: '#6B7280',
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  categorySection: {
    marginBottom: 16,
  },
  categoryManagerHeader: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  categoryTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    flex: 1,
    marginLeft: 8,
  },
  categoryCountBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryCountText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFF',
  },
  powersList: {
    marginTop: 8,
    paddingLeft: 8,
  },
  powerCard: {
    backgroundColor: '#1F2937',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
  },
  powerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  powerNameContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  powerNameWrapper: {
    flex: 1,
  },
  powerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  powerTierText: {
    fontSize: 11,
    color: theme.colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  levelBadgeContainer: {
    alignItems: 'flex-end',
  },
  levelNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  maxBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  maxBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  progressBarContainer: {
    marginBottom: 12,
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: '#374151',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: theme.colors.primary,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 11,
    color: '#9CA3AF',
    textAlign: 'right',
    fontWeight: '600',
  },
  powerDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  statBoostText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  levelUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 12,
    gap: 8,
  },
  levelUpButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  levelUpButtonDisabled: {
    backgroundColor: '#6B7280',
    opacity: 0.6,
  },
  nextTierNotification: {
    flexDirection: 'row',
    backgroundColor: '#064E3B',
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 12,
  },
  nextTierContent: {
    flex: 1,
  },
  nextTierLabel: {
    fontSize: 11,
    color: '#6EE7B7',
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  nextTierAbility: {
    fontSize: 15,
    color: '#10B981',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  nextTierHint: {
    fontSize: 11,
    color: '#6EE7B7',
    fontStyle: 'italic',
  },
  nextTierPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  nextTierPreviewText: {
    fontSize: 12,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  powerCardPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  subAbilitiesContainer: {
    backgroundColor: '#374151',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  subAbilitiesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  subAbilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  subAbilityText: {
    fontSize: 13,
    color: '#D1D5DB',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editModalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxHeight: '85%',
    width: '90%',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 12,
    color: '#F9FAFB',
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  subAbilityEditItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#374151',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  subAbilityEditText: {
    flex: 1,
    color: '#F9FAFB',
    fontSize: 14,
  },
  addSubAbilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    padding: 4,
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  cancelButtonText: {
    color: '#9CA3AF',
    fontSize: 16,
    fontWeight: '600',
  },
  completeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    padding: 16,
    borderRadius: 12,
    marginTop: 10,
    gap: 8,
  },
  completeButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  categoryManagerContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    maxHeight: '85%',
    width: '90%',
  },
  categoryItem: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#4B5563',
  },
  categoryItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  categoryItemName: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F9FAFB',
  },
  subcategoriesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  subcategoryChip: {
    backgroundColor: theme.colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
  },
  subcategoryChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  subcategoryChipText: {
    fontSize: 13,
    color: theme.colors.text,
    fontWeight: '500',
  },
  subcategoryChipTextSelected: {
    color: '#FFFFFF',
  },
  categoryScroll: {
    marginBottom: 12,
  },
  categoryChip: {
    backgroundColor: theme.colors.cardBackground,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: theme.colors.border,
    marginRight: 10,
  },
  categoryChipSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  categoryChipText: {
    fontSize: 14,
    color: theme.colors.text,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  evolveItemSubcat: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    marginTop: 2,
  },
  loadingText: {
    color: theme.colors.textSecondary,
    marginTop: 12,
    fontSize: 14,
  },
  subcategoriesEditList: {
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  createButtonDisabled: {
    backgroundColor: '#4B5563',
    opacity: 0.5,
  },
  categoryItemPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 400,
  },
  actionModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 20,
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
    color: '#F9FAFB',
  },
  deleteActionButton: {
    backgroundColor: '#7F1D1D',
  },
  deleteActionButtonText: {
    color: '#FCA5A5',
  },
  cancelActionButton: {
    backgroundColor: '#374151',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  cancelActionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  // Delete Confirmation Modal styles
  deleteConfirmContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    width: '85%',
    maxWidth: 350,
    alignItems: 'center',
  },
  deleteConfirmTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 12,
  },
  deleteConfirmText: {
    fontSize: 16,
    color: '#D1D5DB',
    textAlign: 'center',
    marginBottom: 8,
  },
  deleteConfirmSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
    marginBottom: 24,
  },
  deleteConfirmButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  deleteConfirmCancelBtn: {
    flex: 1,
    backgroundColor: '#374151',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  deleteConfirmCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D1D5DB',
  },
  deleteConfirmDeleteBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  deleteConfirmDeleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Evolution styles
  evolveActionButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  evolveActionButtonText: {
    color: '#10B981',
  },
  disabledButton: {
    opacity: 0.5,
    backgroundColor: 'rgba(107, 114, 128, 0.1)',
  },
  disabledButtonText: {
    color: '#6B7280',
  },
  maxedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
    gap: 4,
  },
  maxedBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFD700',
  },
  evolveModalContent: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  evolveDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  evolveSubtitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  evolveList: {
    flex: 1,
    marginBottom: 16,
  },
  evolveItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    padding: 16,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: theme.colors.cardBorder,
  },
  evolveItemInfo: {
    flex: 1,
  },
  evolveItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  evolveItemTier: {
    fontSize: 12,
    color: theme.colors.primary,
    marginTop: 2,
  },
  evolveItemAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  evolveItemActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  emptyEvolveState: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyEvolveText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    marginTop: 12,
  },
  emptyEvolveSubtext: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  linkedEvolveList: {
    maxHeight: 120,
    marginBottom: 16,
  },
  linkedEvolveItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  unlinkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unlinkButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#EF4444',
  },
  closeButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
  },
  // Evolved power display styles
  evolvedPowerIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 20,
    marginTop: -8,
    marginBottom: 8,
  },
  evolutionLine: {
    width: 2,
    height: 30,
    backgroundColor: theme.colors.primary,
    marginRight: 12,
  },
  evolvedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary + '20',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 4,
  },
  evolvedBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: theme.colors.primary,
    textTransform: 'uppercase',
  },
  evolvedAbilityRow: {
    marginLeft: 20,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    backgroundColor: theme.colors.primary + '10',
  },
  // Locked evolution styles
  lockedEvolution: {
    opacity: 0.6,
  },
  lockedEvolutionLine: {
    backgroundColor: '#4B5563',
  },
  lockedBadge: {
    backgroundColor: 'rgba(107, 114, 128, 0.2)',
    borderColor: '#4B5563',
  },
  lockedBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#6B7280',
  },
  lockedAbilityRow: {
    marginLeft: 20,
    borderLeftWidth: 3,
    borderLeftColor: '#4B5563',
    backgroundColor: 'rgba(75, 85, 99, 0.15)',
  },
  lockedText: {
    color: '#6B7280',
  },
  lockedProgressBar: {
    backgroundColor: '#374151',
  },
  lockedProgressFill: {
    backgroundColor: '#4B5563',
  },
  lockedLevelBadge: {
    backgroundColor: '#374151',
    borderColor: '#4B5563',
  },
  lockedIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
  },
  hasEvolutionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
    gap: 3,
  },
  hasEvolutionText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#10B981',
  },
  emptyCategoryContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyCategoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
  subcategorySection: {
    marginTop: 16,
    marginBottom: 16,
  },
  subcategoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.primary,
    marginBottom: 12,
    paddingLeft: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});