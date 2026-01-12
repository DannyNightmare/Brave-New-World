import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert, Pressable, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useNotification } from '../../contexts/NotificationContext';
import { useCustomization, StatusTheme } from '../../contexts/CustomizationContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence,
  withSpring,
  Easing,
  FadeIn,
  SlideInRight
} from 'react-native-reanimated';
import { AnimatedRewardModal } from '../../components/AnimatedRewardModal';

const API_URL = 'https://quest-limitless.preview.emergentagent.com';

interface CustomStat {
  id: string;
  name: string;
  color: string;
  current: number;
  max: number;
  icon: string;
}

interface Quest {
  id: string;
  title: string;
  description: string;
  difficulty: string;
  xp_reward: number;
  gold_reward: number;
  item_reward?: string;
  attribute_rewards?: { [key: string]: number };
  completed: boolean;
  repeat_frequency?: string; // 'none', 'daily', 'weekly', 'monthly', 'limitless'
  last_completed?: string; // ISO date string
}

export default function QuestsScreen() {
  const { user, refreshUser } = useUser();
  const { colors } = useTheme();
  const { showNotification } = useNotification();
  const { statusTheme, backgroundType, backgroundColor, backgroundImage } = useCustomization();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [customStats, setCustomStats] = useState<CustomStat[]>([]);
  const [statRewards, setStatRewards] = useState<{ [key: string]: number }>({});
  const [shopItems, setShopItems] = useState<Array<{id: string, name: string, category: string}>>([]);
  const [itemCategories, setItemCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [newQuest, setNewQuest] = useState({ 
    title: '', 
    description: '', 
    xp_reward: 50,
    gold_reward: 10,
    ap_reward: 0,
    item_reward: '',
    repeat_frequency: 'none',
  });

  // Reward modal state
  const [rewardModalVisible, setRewardModalVisible] = useState(false);
  const [rewardData, setRewardData] = useState<any>(null);

  // Long-press action menu state
  const [actionMenuVisible, setActionMenuVisible] = useState(false);
  const [selectedQuest, setSelectedQuest] = useState<Quest | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const fetchQuests = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_URL}/api/quests/${user.id}`);
      const data = await response.json();
      setQuests(data);
    } catch (error) {
      console.error('Failed to fetch quests:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomStats = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_URL}/api/users/${user.id}/stats`);
      const data = await response.json();
      setCustomStats(data);
      // Initialize stat rewards to 0 for each custom stat
      const initialRewards: { [key: string]: number } = {};
      data.forEach((stat: CustomStat) => {
        initialRewards[stat.name] = 0;
      });
      setStatRewards(initialRewards);
    } catch (error) {
      console.error('Failed to fetch custom stats:', error);
    }
  };

  const fetchShopItems = async () => {
    try {
      const response = await fetch(`${API_URL}/api/shop`);
      const data = await response.json();
      const items = data.map((item: any) => ({ 
        id: item.id, 
        name: item.name,
        category: item.category || 'general'
      }));
      setShopItems(items);
      
      // Extract unique categories
      const categories = [...new Set(items.map((item: any) => item.category))];
      setItemCategories(['All', ...categories]);
      
      // Set default to 'All'
      if (!selectedCategory) {
        setSelectedCategory('All');
      }
    } catch (error) {
      console.error('Failed to fetch shop items:', error);
    }
  };

  useEffect(() => {
    fetchQuests();
    fetchCustomStats();
    fetchShopItems();
  }, [user?.id]);

  // Refresh shop items whenever the modal is opened
  useEffect(() => {
    if (modalVisible) {
      fetchShopItems();
    }
  }, [modalVisible]);

  const createQuest = async () => {
    if (!user?.id || !newQuest.title.trim()) {
      Alert.alert('Error', 'Please enter a quest title');
      return;
    }

    try {
      // Build attribute rewards from custom stats
      const attribute_rewards: { [key: string]: number } = {};
      Object.entries(statRewards).forEach(([statName, value]) => {
        if (value > 0) {
          attribute_rewards[statName] = value;
        }
      });

      const payload: any = {
        user_id: user.id,
        title: newQuest.title,
        description: newQuest.description,
        xp_reward: newQuest.xp_reward,
        gold_reward: newQuest.gold_reward,
        ap_reward: newQuest.ap_reward,
        repeat_frequency: newQuest.repeat_frequency,
      };

      if (newQuest.item_reward.trim()) {
        payload.item_reward = newQuest.item_reward;
      }

      if (Object.keys(attribute_rewards).length > 0) {
        payload.attribute_rewards = attribute_rewards;
      }

      const response = await fetch(`${API_URL}/api/quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      await response.json();
      resetForm();
      setModalVisible(false);
      fetchQuests();
    } catch (error) {
      console.error('Failed to create quest:', error);
      Alert.alert('Error', 'Failed to create quest');
    }
  };

  const completeQuest = async (questId: string) => {
    try {
      // Store old user values before completing quest - ensure they are valid numbers
      const oldGold = typeof user?.gold === 'number' ? user.gold : 0;
      const oldLevel = typeof user?.level === 'number' ? user.level : 1;
      
      const response = await fetch(`${API_URL}/api/quests/${questId}/complete`, {
        method: 'POST',
      });
      const result = await response.json();
      
      // Find the quest name before refreshing
      const quest = quests.find(q => q.id === questId);
      const questName = quest?.title || 'Quest';
      
      // Refresh user data
      await refreshUser();
      fetchQuests();
      
      // Calculate new gold from old gold + reward - ensure valid numbers
      const goldReward = typeof result.gold_reward === 'number' ? result.gold_reward : 0;
      const newGold = oldGold + goldReward;
      
      // Prepare reward data for animated modal - ensure all numbers are valid
      const rewards = {
        xp: typeof result.xp_reward === 'number' ? result.xp_reward : 0,
        oldGold: oldGold,
        newGold: newGold,
        goldGained: goldReward,
        oldLevel: typeof result.old_level === 'number' ? result.old_level : oldLevel,
        newLevel: result.levels_gained ? (result.old_level || oldLevel) + result.levels_gained : undefined,
        apGained: (result.levels_gained ? result.levels_gained * 2 : 0) + (result.quest?.ap_reward || 0),
        questApReward: result.quest?.ap_reward,
        statBoosts: result.quest?.attribute_rewards,
        itemReward: result.item_reward,
      };
      
      setRewardData({ questName, rewards });
      setRewardModalVisible(true);
      
    } catch (error) {
      console.error('Failed to complete quest:', error);
      Alert.alert('Error', 'Failed to complete quest');
    }
  };

  const deleteQuest = async (questId: string) => {
    try {
      await fetch(`${API_URL}/api/quests/${questId}`, { method: 'DELETE' });
      fetchQuests();
    } catch (error) {
      console.error('Failed to delete quest:', error);
    }
  };

  // Long-press handler to show action menu
  const handleLongPress = (quest: Quest) => {
    setSelectedQuest(quest);
    setActionMenuVisible(true);
  };

  // Open edit modal with quest data
  const openEditModal = () => {
    if (!selectedQuest) return;
    
    setNewQuest({
      title: selectedQuest.title,
      description: selectedQuest.description || '',
      xp_reward: selectedQuest.xp_reward,
      gold_reward: selectedQuest.gold_reward,
      ap_reward: (selectedQuest as any).ap_reward || 0,
      item_reward: selectedQuest.item_reward || '',
      repeat_frequency: selectedQuest.repeat_frequency || 'none',
    });
    
    // Set stat rewards if they exist
    if (selectedQuest.attribute_rewards) {
      setStatRewards(selectedQuest.attribute_rewards);
    }
    
    setIsEditing(true);
    setActionMenuVisible(false);
    setModalVisible(true);
  };

  // Confirm and delete quest
  const confirmDelete = () => {
    if (!selectedQuest) return;
    
    Alert.alert(
      'Delete Quest',
      `Are you sure you want to delete "${selectedQuest.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: () => {
            deleteQuest(selectedQuest.id);
            setActionMenuVisible(false);
            setSelectedQuest(null);
          }
        }
      ]
    );
  };

  // Update existing quest
  const updateQuest = async () => {
    if (!selectedQuest || !user?.id || !newQuest.title.trim()) {
      Alert.alert('Error', 'Please enter a quest title');
      return;
    }

    try {
      const attribute_rewards: { [key: string]: number } = {};
      Object.entries(statRewards).forEach(([statName, value]) => {
        if (value > 0) {
          attribute_rewards[statName] = value;
        }
      });

      const payload: any = {
        user_id: user.id,
        title: newQuest.title,
        description: newQuest.description,
        xp_reward: newQuest.xp_reward,
        gold_reward: newQuest.gold_reward,
        ap_reward: newQuest.ap_reward,
        repeat_frequency: newQuest.repeat_frequency,
      };

      if (newQuest.item_reward.trim()) {
        payload.item_reward = newQuest.item_reward;
      }

      if (Object.keys(attribute_rewards).length > 0) {
        payload.attribute_rewards = attribute_rewards;
      }

      const response = await fetch(`${API_URL}/api/quests/${selectedQuest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        resetForm();
        setModalVisible(false);
        setIsEditing(false);
        setSelectedQuest(null);
        fetchQuests();
        Alert.alert('Success', 'Quest updated!');
      } else {
        Alert.alert('Error', 'Failed to update quest');
      }
    } catch (error) {
      console.error('Failed to update quest:', error);
      Alert.alert('Error', 'Failed to update quest');
    }
  };

  // Reset form to defaults
  const resetForm = () => {
    setNewQuest({
      title: '',
      description: '',
      xp_reward: 50,
      gold_reward: 10,
      ap_reward: 0,
      item_reward: '',
      repeat_frequency: 'none',
    });
    const resetRewards: { [key: string]: number } = {};
    customStats.forEach((stat) => {
      resetRewards[stat.name] = 0;
    });
    setStatRewards(resetRewards);
  };

  // Handle modal close
  const handleModalClose = () => {
    setModalVisible(false);
    setIsEditing(false);
    setSelectedQuest(null);
    resetForm();
  };

  const activeQuests = quests.filter(q => !q.completed);
  // Only show completed quests that have a repeat frequency (daily, weekly, monthly)
  const completedQuests = quests.filter(q => q.completed && q.repeat_frequency && q.repeat_frequency !== 'none');

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#10B981';
      case 'medium': return '#F59E0B';
      case 'hard': return '#EF4444';
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
    <SafeAreaView style={[styles.container, { backgroundColor: statusTheme.colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={[styles.subtitle, { color: statusTheme.colors.textSecondary }]}>{activeQuests.length} active</Text>
          </View>
        </View>

        {activeQuests.length === 0 && completedQuests.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={64} color={statusTheme.colors.cardBorder} />
            <Text style={[styles.emptyText, { color: statusTheme.colors.textSecondary }]}>No quests yet!</Text>
            <Text style={[styles.emptySubtext, { color: statusTheme.colors.textSecondary }]}>Tap + to create your first quest</Text>
          </View>
        )}

        {activeQuests.map(quest => (
          <Pressable 
            key={quest.id} 
            style={({ pressed }) => [
              styles.questCard,
              { backgroundColor: statusTheme.colors.cardBackground, borderColor: statusTheme.colors.cardBorder },
              pressed && [styles.questCardPressed, { backgroundColor: statusTheme.colors.cardBorder, borderColor: statusTheme.colors.primary }]
            ]}
            onLongPress={() => handleLongPress(quest)}
            delayLongPress={500}
          >
            <View style={styles.questHeader}>
              <View style={styles.questTitleRow}>
                <Text style={[styles.questTitle, { color: statusTheme.colors.text }]}>{quest.title}</Text>
                {quest.repeat_frequency === 'limitless' && (
                  <View style={[styles.limitlessBadge, { backgroundColor: statusTheme.colors.accent + '20', borderColor: statusTheme.colors.accent }]}>
                    <Ionicons name="infinite" size={16} color={statusTheme.colors.accent} />
                  </View>
                )}
              </View>
            </View>
            {quest.description && <Text style={[styles.questDescription, { color: statusTheme.colors.textSecondary }]}>{quest.description}</Text>}
            
            <View style={styles.questFooter}>
              <View style={styles.rewardsContainer}>
                <View style={[styles.difficultyBadge, { backgroundColor: getDifficultyColor(quest.difficulty) + '20' }]}>
                  <Text style={[styles.difficultyText, { color: getDifficultyColor(quest.difficulty) }]}>
                    {quest.difficulty}
                  </Text>
                </View>
                <View style={styles.reward}>
                  <Text style={styles.rewardText}>{quest.xp_reward} XP</Text>
                </View>
                <View style={styles.reward}>
                  <Ionicons name="logo-bitcoin" size={14} color={statusTheme.colors.goldColor} />
                  <Text style={[styles.rewardText, { color: statusTheme.colors.text }]}>{quest.gold_reward}</Text>
                </View>
              </View>
              
              <TouchableOpacity style={[styles.completeButton, { backgroundColor: statusTheme.colors.accent }]} onPress={() => completeQuest(quest.id)}>
                <Text style={styles.completeButtonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        ))}

        {completedQuests.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: statusTheme.colors.textSecondary }]}>Completed</Text>
            {completedQuests.map(quest => (
              <View key={quest.id} style={[styles.questCard, styles.completedCard, { backgroundColor: statusTheme.colors.cardBackground, borderColor: statusTheme.colors.cardBorder }]}>
                <View style={styles.questHeader}>
                  <Text style={[styles.questTitle, styles.completedText, { color: statusTheme.colors.text }]}>{quest.title}</Text>
                  <Ionicons name="checkmark-circle" size={24} color={statusTheme.colors.accent} />
                </View>
                {quest.description && <Text style={[styles.questDescription, styles.completedText, { color: statusTheme.colors.textSecondary }]}>{quest.description}</Text>}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: statusTheme.colors.primary }]} 
        onPress={() => {
          setIsEditing(false);
          setSelectedQuest(null);
          resetForm();
          setModalVisible(true);
        }}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      {/* Action Menu Modal (Long Press) */}
      <Modal visible={actionMenuVisible} animationType="fade" transparent={true}>
        <TouchableOpacity 
          style={styles.actionMenuOverlay} 
          activeOpacity={1} 
          onPress={() => setActionMenuVisible(false)}
        >
          <View style={[styles.actionMenuContainer, { backgroundColor: statusTheme.colors.cardBackground, borderColor: statusTheme.colors.cardBorder }]}>
            <Text style={[styles.actionMenuTitle, { color: statusTheme.colors.text }]}>{selectedQuest?.title}</Text>
            <View style={[styles.actionMenuDivider, { backgroundColor: statusTheme.colors.cardBorder }]} />
            
            <TouchableOpacity style={styles.actionMenuItem} onPress={openEditModal}>
              <Ionicons name="pencil" size={24} color={statusTheme.colors.primary} />
              <Text style={[styles.actionMenuItemText, { color: statusTheme.colors.text }]}>Edit Quest</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionMenuItem} onPress={confirmDelete}>
              <Ionicons name="trash" size={24} color="#EF4444" />
              <Text style={[styles.actionMenuItemText, { color: '#EF4444' }]}>Delete Quest</Text>
            </TouchableOpacity>
            
            <View style={[styles.actionMenuDivider, { backgroundColor: statusTheme.colors.cardBorder }]} />
            
            <TouchableOpacity 
              style={styles.actionMenuCancel} 
              onPress={() => setActionMenuVisible(false)}
            >
              <Text style={styles.actionMenuCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalScrollView}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{isEditing ? 'Edit Quest' : 'Create Quest'}</Text>
                <TouchableOpacity onPress={handleModalClose}>
                  <Ionicons name="close" size={28} color="#9CA3AF" />
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Quest name *"
                placeholderTextColor="#6B7280"
                value={newQuest.title}
                onChangeText={(text) => setNewQuest({ ...newQuest, title: text })}
              />

              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Description"
                placeholderTextColor="#6B7280"
                value={newQuest.description}
                onChangeText={(text) => setNewQuest({ ...newQuest, description: text })}
                multiline
                numberOfLines={3}
              />

              <Text style={styles.label}>Rewards</Text>
              <View style={styles.rewardRow}>
                <View style={styles.rewardInput}>
                  <Text style={styles.rewardLabel}>XP</Text>
                  <TextInput
                    style={styles.numberInput}
                    placeholder="50"
                    placeholderTextColor="#6B7280"
                    value={String(newQuest.xp_reward)}
                    onChangeText={(text) => setNewQuest({ ...newQuest, xp_reward: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.rewardInput}>
                  <Text style={styles.rewardLabel}>Gold</Text>
                  <TextInput
                    style={styles.numberInput}
                    placeholder="10"
                    placeholderTextColor="#6B7280"
                    value={String(newQuest.gold_reward)}
                    onChangeText={(text) => setNewQuest({ ...newQuest, gold_reward: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
                <View style={styles.rewardInput}>
                  <Text style={styles.rewardLabel}>AP</Text>
                  <TextInput
                    style={styles.numberInput}
                    placeholder="0"
                    placeholderTextColor="#6B7280"
                    value={String(newQuest.ap_reward)}
                    onChangeText={(text) => setNewQuest({ ...newQuest, ap_reward: parseInt(text) || 0 })}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <Text style={styles.label}>Item Reward (Optional)</Text>
              {shopItems.length === 0 ? (
                <Text style={styles.noItemsText}>
                  No shop items available. Create items in the Shop page first.
                </Text>
              ) : (
                <View style={styles.itemRewardContainer}>
                  {/* Category Selector */}
                  <TouchableOpacity
                    style={styles.categoryDropdown}
                    onPress={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                  >
                    <Ionicons name="grid" size={20} color="#8B5CF6" />
                    <Text style={styles.categoryDropdownText}>
                      {selectedCategory || 'Select Category'}
                    </Text>
                    <Ionicons 
                      name={categoryDropdownOpen ? "chevron-up" : "chevron-down"} 
                      size={20} 
                      color="#8B5CF6" 
                    />
                  </TouchableOpacity>

                  {/* Category Dropdown */}
                  {categoryDropdownOpen && (
                    <View style={styles.categoryList}>
                      {itemCategories.map((category) => (
                        <TouchableOpacity
                          key={category}
                          style={[
                            styles.categoryItem,
                            selectedCategory === category && styles.categoryItemSelected
                          ]}
                          onPress={() => {
                            setSelectedCategory(category);
                            setCategoryDropdownOpen(false);
                          }}
                        >
                          <Text style={[
                            styles.categoryItemText,
                            selectedCategory === category && styles.categoryItemTextSelected
                          ]}>
                            {category}
                          </Text>
                          {selectedCategory === category && (
                            <Ionicons name="checkmark" size={20} color="#8B5CF6" />
                          )}
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Item List */}
                  <Text style={styles.itemListLabel}>Select Item:</Text>
                  <ScrollView style={styles.itemList} nestedScrollEnabled>
                    <TouchableOpacity
                      style={[
                        styles.itemRow,
                        newQuest.item_reward === '' && styles.itemRowSelected
                      ]}
                      onPress={() => setNewQuest({ ...newQuest, item_reward: '' })}
                    >
                      <Ionicons name="close-circle" size={20} color="#9CA3AF" />
                      <Text style={[
                        styles.itemRowText,
                        newQuest.item_reward === '' && styles.itemRowTextSelected
                      ]}>
                        No Item
                      </Text>
                    </TouchableOpacity>

                    {shopItems
                      .filter(item => selectedCategory === 'All' || item.category === selectedCategory)
                      .map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.itemRow,
                            newQuest.item_reward === item.name && styles.itemRowSelected
                          ]}
                          onPress={() => setNewQuest({ ...newQuest, item_reward: item.name })}
                        >
                          <Ionicons name="gift" size={20} color="#8B5CF6" />
                          <Text style={[
                            styles.itemRowText,
                            newQuest.item_reward === item.name && styles.itemRowTextSelected
                          ]}>
                            {item.name}
                          </Text>
                          {newQuest.item_reward === item.name && (
                            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                          )}
                        </TouchableOpacity>
                      ))}
                  </ScrollView>
                </View>
              )}

              {/* Repeat Frequency Selector */}
              <Text style={styles.label}>Repeat Frequency</Text>
              <View style={styles.repeatContainer}>
                {[
                  { value: 'none', label: 'One Time', icon: 'flash' },
                  { value: 'daily', label: 'Daily', icon: 'today' },
                  { value: 'weekly', label: 'Weekly', icon: 'calendar' },
                  { value: 'monthly', label: 'Monthly', icon: 'calendar-outline' },
                  { value: 'limitless', label: 'Limitless', icon: 'infinite' },
                ].map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.repeatOption,
                      newQuest.repeat_frequency === option.value && styles.repeatOptionSelected,
                    ]}
                    onPress={() => setNewQuest({ ...newQuest, repeat_frequency: option.value })}
                  >
                    <Ionicons 
                      name={option.icon as any} 
                      size={20} 
                      color={newQuest.repeat_frequency === option.value ? '#FFF' : '#9CA3AF'} 
                    />
                    <Text style={[
                      styles.repeatOptionText,
                      newQuest.repeat_frequency === option.value && styles.repeatOptionTextSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Dynamic Custom Stats Rewards */}
              {customStats.length > 0 && (
                <>
                  <Text style={styles.label}>Stat Rewards</Text>
                  <View style={styles.attributeContainer}>
                    {customStats.map((stat) => (
                      <View key={stat.id} style={styles.attributeRow}>
                        <Ionicons name={stat.icon as any} size={20} color={stat.color} />
                        <Text style={styles.attributeLabel}>{stat.name}</Text>
                        <TextInput
                          style={styles.attributeInput}
                          placeholder="0"
                          placeholderTextColor="#6B7280"
                          value={String(statRewards[stat.name] || 0)}
                          onChangeText={(text) => setStatRewards({ ...statRewards, [stat.name]: parseInt(text) || 0 })}
                          keyboardType="numeric"
                        />
                      </View>
                    ))}
                  </View>
                </>
              )}
              {customStats.length === 0 && (
                <Text style={styles.noStatsText}>
                  No custom stats created yet. Add stats in the Status page to use them as quest rewards.
                </Text>
              )}

              <TouchableOpacity 
                style={[styles.createButton, isEditing && styles.editButton]} 
                onPress={isEditing ? updateQuest : createQuest}
              >
                <Ionicons 
                  name={isEditing ? "checkmark" : "add"} 
                  size={20} 
                  color="#FFF" 
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.createButtonText}>
                  {isEditing ? 'Save Changes' : 'Create Quest'}
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </Modal>

      {/* Animated Reward Modal */}
      {rewardData && (
        <AnimatedRewardModal
          visible={rewardModalVisible}
          onClose={() => setRewardModalVisible(false)}
          questName={rewardData.questName}
          rewards={rewardData.rewards}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
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
  questCard: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#374151',
  },
  questCardPressed: {
    backgroundColor: '#374151',
    borderColor: '#8B5CF6',
    transform: [{ scale: 0.98 }],
  },
  completedCard: {
    opacity: 0.6,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  questTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    flexShrink: 1,
  },
  limitlessBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  completedText: {
    textDecorationLine: 'line-through',
    color: '#9CA3AF',
  },
  questDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  questFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rewardsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  difficultyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  reward: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rewardText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  completeButtonText: {
    color: '#FFF',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#9CA3AF',
    marginTop: 16,
    marginBottom: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  itemRewardContainer: {
    marginBottom: 16,
  },
  categoryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1F2937',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
  },
  categoryDropdownText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
    marginLeft: 8,
  },
  categoryList: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    marginBottom: 12,
    maxHeight: 200,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
  },
  categoryItemSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
  },
  categoryItemText: {
    fontSize: 15,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  categoryItemTextSelected: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  itemListLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  itemList: {
    backgroundColor: '#1F2937',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#374151',
    maxHeight: 200,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#374151',
    gap: 12,
  },
  itemRowSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  itemRowText: {
    flex: 1,
    fontSize: 15,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  itemRowTextSelected: {
    color: '#8B5CF6',
    fontWeight: '600',
  },
  noItemsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 12,
  },
  modalScrollView: {
    flex: 1,
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 500,
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
  difficultySelector: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  difficultyOption: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    backgroundColor: '#374151',
  },
  difficultyOptionSelected: {
    backgroundColor: '#1F2937',
  },
  difficultyOptionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9CA3AF',
    textTransform: 'capitalize',
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
  noStatsText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
    marginVertical: 8,
  },
  repeatContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  repeatOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#374151',
    gap: 6,
  },
  repeatOptionSelected: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  repeatOptionText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  repeatOptionTextSelected: {
    color: '#FFF',
  },
  editButton: {
    backgroundColor: '#10B981',
  },
  // Action Menu Styles
  actionMenuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  actionMenuContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 20,
    width: '100%',
    maxWidth: 320,
    borderWidth: 1,
    borderColor: '#374151',
  },
  actionMenuTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    textAlign: 'center',
    marginBottom: 12,
  },
  actionMenuDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 12,
  },
  actionMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 16,
    borderRadius: 12,
  },
  actionMenuItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
  },
  actionMenuCancel: {
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#374151',
  },
  actionMenuCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
  },
});