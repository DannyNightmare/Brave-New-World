import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, ActivityIndicator, Image, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
const API_URL = 'https://liferealm-rpg.preview.emergentagent.com';

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
}

export default function PowersScreen() {
  const { user, refreshUser } = useUser();
  const [powers, setPowers] = useState<PowerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [powerActionModalVisible, setPowerActionModalVisible] = useState(false);
  const [categoryActionModalVisible, setCategoryActionModalVisible] = useState(false);
  const [categoryManagerVisible, setCategoryManagerVisible] = useState(false);
  const [editingPower, setEditingPower] = useState<PowerItem | null>(null);
  const [selectedPower, setSelectedPower] = useState<PowerItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
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
    try {
      const response = await fetch(`${API_URL}/api/powers/${powerId}/levelup`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // Refresh powers and user data after level up
        await fetchPowers();
        await refreshUser();
        
        // If this was the max level and has next tier, show unlock message
        const updatedPower = powers.find(p => p.id === powerId);
        if (updatedPower && updatedPower.current_level + 1 >= updatedPower.max_level && nextTierAbility) {
          Alert.alert(
            '🎉 Power Maxed Out!',
            `${powerName} has reached MAX level!\n\n✨ ${nextTierAbility} has been unlocked and added to your powers!`,
            [{ text: 'Awesome!', style: 'default' }]
          );
        }
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

  const handleDeletePower = async () => {
    if (!selectedPower) {
      console.log('No power selected');
      return;
    }

    console.log('Attempting to delete power:', selectedPower.id, selectedPower.name);

    Alert.alert(
      'Delete Power',
      `Are you sure you want to delete "${selectedPower.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              console.log('Calling DELETE endpoint:', `${API_URL}/api/powers/${selectedPower.id}`);
              const response = await fetch(`${API_URL}/api/powers/${selectedPower.id}`, {
                method: 'DELETE',
              });

              console.log('Delete response status:', response.status);
              const responseText = await response.text();
              console.log('Delete response body:', responseText);

              if (response.ok) {
                await fetchPowers();
                setPowerActionModalVisible(false);
                setSelectedPower(null);
                Alert.alert('Success', 'Power deleted successfully!');
              } else {
                Alert.alert('Error', `Failed to delete power: ${responseText}`);
              }
            } catch (error) {
              console.error('Failed to delete power:', error);
              Alert.alert('Error', 'Failed to delete power: ' + error);
            }
          },
        },
      ]
    );
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

  const handleDeleteCategory = () => {
    if (!selectedCategory) {
      console.log('No category selected');
      return;
    }

    console.log('Attempting to delete category:', selectedCategory);

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${selectedCategory}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            console.log('Deleting category from state:', selectedCategory);
            const newCategories = { ...userCategories };
            delete newCategories[selectedCategory];
            setUserCategories(newCategories);
            setCategoryActionModalVisible(false);
            setSelectedCategory('');
            console.log('Category deleted, new categories:', Object.keys(newCategories));
            Alert.alert('Success', 'Category deleted!');
          },
        },
      ]
    );
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
          <ActivityIndicator size="large" color="#8B5CF6" />
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
                <Ionicons name="filing" size={16} color="#8B5CF6" />
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

              {/* Powers under this category */}
              {categoryPowers.length === 0 ? (
                <View style={styles.emptyCategoryContainer}>
                  <Text style={styles.emptyCategoryText}>No abilities in this category yet</Text>
                </View>
              ) : null}
              {categoryPowers.map((power) => {
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
                      <View style={styles.abilityNameRow}>
                        <Text style={styles.abilityName}>{power.name}</Text>
                        <View style={styles.levelBadge}>
                          <Text style={styles.levelBadgeText}>Lv.{power.current_level}</Text>
                        </View>
                      </View>
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

                    {/* Level Badge or + Button */}
                    <View style={styles.abilityActionSection}>
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
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
                  <Ionicons name="add-circle" size={32} color="#8B5CF6" />
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
                        <Ionicons name="folder" size={20} color="#8B5CF6" />
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
                  <Ionicons name="add-circle" size={32} color="#8B5CF6" />
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
                <Text style={styles.completeButtonText}>Complete - Save to Shop</Text>
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
            <TouchableOpacity style={styles.actionButton} onPress={handleEditPower}>
              <Ionicons name="create" size={24} color="#3B82F6" />
              <Text style={styles.actionButtonText}>Edit Power</Text>
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
  headerBadges: {
    flexDirection: 'row',
    gap: 8,
  },
  apBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  apText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#F59E0B',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  categoryButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  countText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
  },
  categoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#8B5CF6',
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: 1,
    paddingHorizontal: 8,
  },
  abilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#374151',
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
    color: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
    borderRadius: 3,
  },
  xpCounter: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'right',
  },
  abilityActionSection: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelUpButtonSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#8B5CF6',
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
  categoryHeader: {
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
    backgroundColor: '#8B5CF6',
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
    color: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
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
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#8B5CF6',
    borderRadius: 8,
    padding: 10,
    marginTop: 12,
    gap: 8,
  },
  nextTierPreviewText: {
    fontSize: 12,
    color: '#8B5CF6',
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
    color: '#8B5CF6',
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
    backgroundColor: '#8B5CF6',
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
    backgroundColor: '#1F2937',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  subcategoryChipText: {
    fontSize: 12,
    color: '#A78BFA',
    fontWeight: '600',
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
  emptyCategoryContainer: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyCategoryText: {
    fontSize: 14,
    color: '#6B7280',
    fontStyle: 'italic',
  },
});