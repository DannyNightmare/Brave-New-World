import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
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
  image?: string;
  stat_boost?: { [key: string]: number };
}

export default function PowersScreen() {
  const { user } = useUser();
  const [powers, setPowers] = useState<PowerItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);

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
                      <View key={power.id} style={styles.powerCard}>
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
                      </View>
                    );
                  })}
                </View>
              )}
            </View>
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
});