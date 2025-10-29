import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import Constants from 'expo-constants';

const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL || '';

export default function SettingsScreen() {
  const router = useRouter();
  const { isDarkMode, toggleDarkMode, colors } = useTheme();
  const { user, refreshUser } = useUser();
  const [autoSave, setAutoSave] = useState(true);
  const [resetModalVisible, setResetModalVisible] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  const handleFactoryReset = () => {
    setResetModalVisible(true);
  };

  const confirmFactoryReset = async () => {
    setIsResetting(true);
    
    try {
      if (!user?.id) {
        Alert.alert('Error', 'User not found. Please restart the app.');
        setIsResetting(false);
        return;
      }
      
      // Delete all quests
      const questsResponse = await fetch(`${API_URL}/api/quests/${user.id}`);
      if (questsResponse.ok) {
        const quests = await questsResponse.json();
        for (const quest of quests) {
          await fetch(`${API_URL}/api/quests/${quest.id}`, { method: 'DELETE' });
        }
      }
      
      // Delete all inventory items
      const inventoryResponse = await fetch(`${API_URL}/api/inventory/${user.id}`);
      if (inventoryResponse.ok) {
        const inventory = await inventoryResponse.json();
        for (const item of inventory) {
          await fetch(`${API_URL}/api/inventory/${item.id}`, { method: 'DELETE' });
        }
      }
      
      // Delete all powers
      const powersResponse = await fetch(`${API_URL}/api/powers/${user.id}`);
      if (powersResponse.ok) {
        const powers = await powersResponse.json();
        for (const power of powers) {
          await fetch(`${API_URL}/api/powers/${power.id}`, { method: 'DELETE' });
        }
      }
      
      // Clear all shop items
      await fetch(`${API_URL}/api/shop/clear-all`, { method: 'DELETE' });
      
      // Reset user stats to default
      await fetch(`${API_URL}/api/users/${user.id}/reset`, {
        method: 'POST',
      });
      
      // Refresh user data
      await refreshUser();
      
      setIsResetting(false);
      setResetModalVisible(false);
      
      Alert.alert(
        '✅ Reset Complete', 
        'All your data has been reset to default values:\n\n• Level: 1\n• XP: 0\n• Gold: 100\n• AP: 5\n• All Stats: 10\n• Powers: Cleared\n\nYour app has been refreshed!',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          }
        ]
      );
    } catch (error) {
      console.error('Factory reset failed:', error);
      setIsResetting(false);
      setResetModalVisible(false);
      Alert.alert('Error', 'Failed to reset data. Please try again or contact support.');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Settings</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Appearance</Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="moon-outline" size={24} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>Dark Mode</Text>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={toggleDarkMode}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Data Management</Text>
          
          <View style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="save-outline" size={24} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>Auto Save</Text>
            </View>
            <Switch
              value={autoSave}
              onValueChange={setAutoSave}
              trackColor={{ false: '#D1D5DB', true: colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          <TouchableOpacity 
            style={[styles.settingItem, styles.dangerItem, { backgroundColor: colors.cardBackground, borderColor: '#EF4444' }]}
            onPress={handleFactoryReset}
          >
            <View style={styles.settingLeft}>
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
              <Text style={[styles.settingText, { color: '#EF4444' }]}>Factory Reset</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Account</Text>
          
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="person-outline" size={24} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>Profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="notifications-outline" size={24} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>General</Text>
          
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="language-outline" size={24} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>Language</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>About</Text>
          
          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="information-circle-outline" size={24} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>About App</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          <TouchableOpacity style={[styles.settingItem, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.settingLeft}>
              <Ionicons name="help-circle-outline" size={24} color={colors.primary} />
              <Text style={[styles.settingText, { color: colors.text }]}>Help & Support</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        <View style={styles.versionContainer}>
          <Text style={[styles.versionText, { color: colors.textSecondary }]}>Version 1.0.0</Text>
        </View>
      </ScrollView>

      {/* Factory Reset Confirmation Modal */}
      <Modal visible={resetModalVisible} animationType="fade" transparent={true}>
        <View style={styles.resetModalOverlay}>
          <View style={[styles.resetModalContent, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <View style={styles.resetModalHeader}>
              <Ionicons name="warning" size={48} color="#EF4444" />
              <Text style={[styles.resetModalTitle, { color: colors.text }]}>Factory Reset</Text>
            </View>

            <Text style={[styles.resetModalText, { color: colors.text }]}>
              This will permanently delete ALL your data:
            </Text>

            <View style={styles.resetList}>
              <Text style={[styles.resetListItem, { color: colors.textSecondary }]}>• All Quests</Text>
              <Text style={[styles.resetListItem, { color: colors.textSecondary }]}>• All Inventory Items</Text>
              <Text style={[styles.resetListItem, { color: colors.textSecondary }]}>• All Shop Items</Text>
              <Text style={[styles.resetListItem, { color: colors.textSecondary }]}>• Player Level (reset to 1)</Text>
              <Text style={[styles.resetListItem, { color: colors.textSecondary }]}>• Experience Points (reset to 0)</Text>
              <Text style={[styles.resetListItem, { color: colors.textSecondary }]}>• Gold (reset to 100)</Text>
              <Text style={[styles.resetListItem, { color: colors.textSecondary }]}>• All Stats (reset to 10)</Text>
            </View>

            <Text style={[styles.resetWarning, { color: '#EF4444' }]}>
              This action CANNOT be undone!
            </Text>

            <Text style={[styles.resetQuestion, { color: colors.text }]}>
              Are you absolutely sure?
            </Text>

            <View style={styles.resetButtonContainer}>
              <TouchableOpacity 
                style={[styles.resetCancelButton, { backgroundColor: colors.border }]}
                onPress={() => setResetModalVisible(false)}
                disabled={isResetting}
              >
                <Text style={[styles.resetCancelText, { color: colors.text }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.resetConfirmButton, isResetting && styles.resetButtonDisabled]}
                onPress={confirmFactoryReset}
                disabled={isResetting}
              >
                {isResetting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.resetConfirmText}>Yes, Reset Everything</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 44,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  dangerItem: {
    borderWidth: 2,
  },
  versionContainer: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  versionText: {
    fontSize: 14,
  },
  resetModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resetModalContent: {
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 500,
    borderWidth: 2,
  },
  resetModalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },
  resetModalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 12,
  },
  resetModalText: {
    fontSize: 16,
    marginBottom: 16,
    fontWeight: '600',
  },
  resetList: {
    marginBottom: 20,
    paddingLeft: 8,
  },
  resetListItem: {
    fontSize: 14,
    marginBottom: 8,
    lineHeight: 20,
  },
  resetWarning: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  resetQuestion: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  resetButtonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  resetCancelButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
  resetConfirmButton: {
    flex: 1,
    backgroundColor: '#EF4444',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetConfirmText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
