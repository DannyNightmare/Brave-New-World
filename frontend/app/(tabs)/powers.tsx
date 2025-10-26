import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Pressable, ActivityIndicator, Image, Modal, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

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
  const { user } = useUser();
  const [powers, setPowers] = useState<PowerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingPower, setEditingPower] = useState<PowerItem | null>(null);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    max_level: 5,
    sub_abilities: [] as string[],
    newSubAbility: '',
  });

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

  const levelUpPower = async (powerId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/powers/${powerId}/levelup`, {
        method: 'POST',
      });
      
      if (response.ok) {
        // Refresh powers after level up
        await fetchPowers();
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
    setEditingPower(power);
    setEditForm({
      name: power.name,
      description: power.description,
      max_level: power.max_level,
      sub_abilities: power.sub_abilities || [],
      newSubAbility: '',
    });
    setEditModalVisible(true);
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

  const categories = Object.keys(groupedPowers).sort();

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </SafeAreaView>
    );
  }

  if (powers.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          <Text style={styles.subtitle}>Your abilities and skills</Text>
          
          <View style={styles.placeholder}>
            <Ionicons name="flash-off" size={48} color="#6B7280" />
            <Text style={styles.placeholderText}>No powers yet!</Text>
            <Text style={styles.placeholderSubtext}>Purchase items marked as "Add to Powers" from the Shop</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.subtitle}>Your abilities and skills</Text>
          <View style={styles.countBadge}>
            <Ionicons name="flash" size={16} color="#8B5CF6" />
            <Text style={styles.countText}>{powers.length}</Text>
          </View>
        </View>

        {categories.map((category) => {
          const isExpanded = expandedCategories.includes(category);
          const categoryPowers = groupedPowers[category];
          
          return (
            <View key={category} style={styles.categorySection}>
              <TouchableOpacity
                style={styles.categoryHeader}
                onPress={() => toggleCategory(category)}
              >
                <View style={styles.categoryTitleContainer}>
                  <Ionicons 
                    name={isExpanded ? "chevron-down" : "chevron-forward"} 
                    size={24} 
                    color="#8B5CF6" 
                  />
                  <Text style={styles.categoryTitle}>{category}</Text>
                  <View style={styles.categoryCountBadge}>
                    <Text style={styles.categoryCountText}>{categoryPowers.length}</Text>
                  </View>
                </View>
              </TouchableOpacity>

              {isExpanded && (
                <View style={styles.powersList}>
                  {categoryPowers.map((power) => {
                    const isMaxLevel = power.current_level >= power.max_level;
                    
                    return (
                      <Pressable 
                        key={power.id}
                        onLongPress={() => handlePowerLongPress(power)}
                        style={({ pressed }) => [
                          styles.powerCard,
                          pressed && styles.powerCardPressed
                        ]}
                      >
                        <View style={styles.powerCardHeader}>
                          {power.image ? (
                            <Image source={{ uri: power.image }} style={styles.powerImage} />
                          ) : (
                            <View style={styles.powerIconPlaceholder}>
                              <Ionicons name="flash" size={32} color="#8B5CF6" />
                            </View>
                          )}
                          
                          <View style={styles.powerInfo}>
                            <View style={styles.powerNameRow}>
                              <Text style={styles.powerName}>{power.name}</Text>
                              {isMaxLevel && (
                                <View style={styles.maxBadge}>
                                  <Text style={styles.maxBadgeText}>MAX</Text>
                                </View>
                              )}
                            </View>
                            <View style={styles.powerTierRow}>
                              <Text style={styles.powerTierText}>{power.power_tier}</Text>
                              <Text style={styles.powerLevelText}>
                                LvL {power.current_level}/{power.max_level}
                              </Text>
                            </View>
                            <Text style={styles.powerDescription} numberOfLines={2}>
                              {power.description}
                            </Text>
                          </View>
                        </View>

                        {/* Sub-abilities display */}
                        {power.sub_abilities && power.sub_abilities.length > 0 && (
                          <View style={styles.subAbilitiesContainer}>
                            <Text style={styles.subAbilitiesTitle}>Perks:</Text>
                            {power.sub_abilities.map((subAbility, idx) => (
                              <View key={idx} style={styles.subAbilityItem}>
                                <Ionicons name="checkmark-circle" size={14} color="#10B981" />
                                <Text style={styles.subAbilityText}>{subAbility}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {power.stat_boost && Object.keys(power.stat_boost).length > 0 && (
                          <View style={styles.statBoosts}>
                            {Object.entries(power.stat_boost).map(([stat, value]) => (
                              <View key={stat} style={styles.statBoost}>
                                <Ionicons 
                                  name={stat === 'strength' ? 'barbell' : stat === 'intelligence' ? 'bulb' : 'heart'} 
                                  size={14} 
                                  color="#10B981" 
                                />
                                <Text style={styles.statBoostText}>+{value} {stat}</Text>
                              </View>
                            ))}
                          </View>
                        )}

                        {/* Level Up Button */}
                        {!isMaxLevel && (
                          <TouchableOpacity 
                            style={styles.levelUpButton}
                            onPress={() => levelUpPower(power.id)}
                          >
                            <Ionicons name="arrow-up-circle" size={20} color="#FFF" />
                            <Text style={styles.levelUpButtonText}>Level Up</Text>
                          </TouchableOpacity>
                        )}

                        {/* Next Tier Ability Notification */}
                        {isMaxLevel && power.next_tier_ability && (
                          <View style={styles.nextTierNotification}>
                            <Ionicons name="lock-open" size={20} color="#10B981" />
                            <View style={styles.nextTierContent}>
                              <Text style={styles.nextTierLabel}>Ready to Unlock:</Text>
                              <Text style={styles.nextTierAbility}>{power.next_tier_ability}</Text>
                              <Text style={styles.nextTierHint}>Find this item in the Shop to upgrade!</Text>
                            </View>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
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
  powerCardHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  powerImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
  },
  powerIconPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#374151',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  powerInfo: {
    flex: 1,
  },
  powerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  powerName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginRight: 8,
  },
  maxBadge: {
    backgroundColor: '#EF4444',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  maxBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  powerTierRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 8,
  },
  powerTierText: {
    fontSize: 12,
    color: '#8B5CF6',
    fontWeight: '600',
  },
  powerLevelText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  powerDescription: {
    fontSize: 13,
    color: '#9CA3AF',
    lineHeight: 18,
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
});