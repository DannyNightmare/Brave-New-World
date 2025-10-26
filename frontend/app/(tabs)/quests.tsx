import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

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
}

export default function QuestsScreen() {
  const { user, refreshUser } = useUser();
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [newQuest, setNewQuest] = useState({ 
    title: '', 
    description: '', 
    xp_reward: 50,
    gold_reward: 10,
    item_reward: '',
    strength_reward: 0,
    intelligence_reward: 0,
    vitality_reward: 0,
  });

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

  useEffect(() => {
    fetchQuests();
  }, [user?.id]);

  const createQuest = async () => {
    if (!user?.id || !newQuest.title.trim()) {
      Alert.alert('Error', 'Please enter a quest title');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/quests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          title: newQuest.title,
          description: newQuest.description,
          difficulty: newQuest.difficulty,
        }),
      });
      await response.json();
      setNewQuest({ title: '', description: '', difficulty: 'easy' });
      setModalVisible(false);
      fetchQuests();
    } catch (error) {
      console.error('Failed to create quest:', error);
      Alert.alert('Error', 'Failed to create quest');
    }
  };

  const completeQuest = async (questId: string) => {
    try {
      const response = await fetch(`${API_URL}/api/quests/${questId}/complete`, {
        method: 'POST',
      });
      await response.json();
      await refreshUser();
      fetchQuests();
      Alert.alert('Quest Complete!', 'You earned XP and gold!');
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

  const activeQuests = quests.filter(q => !q.completed);
  const completedQuests = quests.filter(q => q.completed);

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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Quests</Text>
            <Text style={styles.subtitle}>{activeQuests.length} active</Text>
          </View>
          <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
            <Ionicons name="add" size={24} color="#FFF" />
          </TouchableOpacity>
        </View>

        {activeQuests.length === 0 && completedQuests.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="map-outline" size={64} color="#374151" />
            <Text style={styles.emptyText}>No quests yet!</Text>
            <Text style={styles.emptySubtext}>Tap + to create your first quest</Text>
          </View>
        )}

        {activeQuests.map(quest => (
          <View key={quest.id} style={styles.questCard}>
            <View style={styles.questHeader}>
              <Text style={styles.questTitle}>{quest.title}</Text>
              <TouchableOpacity onPress={() => deleteQuest(quest.id)}>
                <Ionicons name="close-circle" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {quest.description && <Text style={styles.questDescription}>{quest.description}</Text>}
            
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
                  <Ionicons name="logo-bitcoin" size={14} color="#FCD34D" />
                  <Text style={styles.rewardText}>{quest.gold_reward}</Text>
                </View>
              </View>
              
              <TouchableOpacity style={styles.completeButton} onPress={() => completeQuest(quest.id)}>
                <Text style={styles.completeButtonText}>Complete</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {completedQuests.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Completed</Text>
            {completedQuests.map(quest => (
              <View key={quest.id} style={[styles.questCard, styles.completedCard]}>
                <View style={styles.questHeader}>
                  <Text style={[styles.questTitle, styles.completedText]}>{quest.title}</Text>
                  <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                </View>
                {quest.description && <Text style={[styles.questDescription, styles.completedText]}>{quest.description}</Text>}
              </View>
            ))}
          </>
        )}
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Create Quest</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color="#9CA3AF" />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Quest title"
              placeholderTextColor="#6B7280"
              value={newQuest.title}
              onChangeText={(text) => setNewQuest({ ...newQuest, title: text })}
            />

            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Description (optional)"
              placeholderTextColor="#6B7280"
              value={newQuest.description}
              onChangeText={(text) => setNewQuest({ ...newQuest, description: text })}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Difficulty</Text>
            <View style={styles.difficultySelector}>
              {['easy', 'medium', 'hard'].map(diff => (
                <TouchableOpacity
                  key={diff}
                  style={[
                    styles.difficultyOption,
                    newQuest.difficulty === diff && styles.difficultyOptionSelected,
                    { borderColor: getDifficultyColor(diff) }
                  ]}
                  onPress={() => setNewQuest({ ...newQuest, difficulty: diff })}
                >
                  <Text style={[
                    styles.difficultyOptionText,
                    newQuest.difficulty === diff && { color: getDifficultyColor(diff) }
                  ]}>
                    {diff}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.createButton} onPress={createQuest}>
              <Text style={styles.createButtonText}>Create Quest</Text>
            </TouchableOpacity>
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
  addButton: {
    backgroundColor: '#8B5CF6',
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
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
  completedCard: {
    opacity: 0.6,
  },
  questHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  questTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#F9FAFB',
    flex: 1,
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
  modalContent: {
    backgroundColor: '#1F2937',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    minHeight: 400,
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
});