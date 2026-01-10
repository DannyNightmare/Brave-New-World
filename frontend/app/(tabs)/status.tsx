import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCustomization, StatusTheme } from '../../contexts/CustomizationContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence,
  withSpring,
  Easing 
} from 'react-native-reanimated';

const API_URL = 'https://levelup-quest-7.preview.emergentagent.com';

export default function StatusScreen() {
  const { user, loading } = useUser();
  const { colors } = useTheme();
  const { xpBarColor, goldIcon, apIcon, goldCustomImage, apCustomImage, statusTheme } = useCustomization();
  const styles = getStyles(statusTheme);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [localGoldIcon, setLocalGoldIcon] = useState<string | null>(null);
  const [addStatModalVisible, setAddStatModalVisible] = useState(false);
  const [customStats, setCustomStats] = useState<Array<{id: string, name: string, color: string, current: number, max: number, icon?: string}>>([]);
  const [newStat, setNewStat] = useState({
    name: '',
    color: '#8B5CF6',
    current: 0,
    max: 100,
    icon: '',
  });

  // Fetch custom stats from backend
  useEffect(() => {
    if (user?.id) {
      fetchCustomStats();
    }
  }, [user?.id]);

  const fetchCustomStats = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/${user.id}/stats`);
      if (response.ok) {
        const stats = await response.json();
        setCustomStats(stats);
      }
    } catch (error) {
      console.error('Failed to fetch custom stats:', error);
    }
  };

  if (loading || !user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const xpForNextLevel = user.level * 100;
  const xpPercentage = (user.xp / xpForNextLevel) * 100;

  // Animation values
  const xpProgress = useSharedValue(0);

  // Animate XP bar on load
  useEffect(() => {
    xpProgress.value = withSpring(xpPercentage, {
      damping: 15,
      stiffness: 80,
    });
  }, [xpPercentage]);

  const xpBarAnimatedStyle = useAnimatedStyle(() => ({
    width: `${xpProgress.value}%`,
  }));

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to select an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      // Convert to base64
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setProfileImage(base64data);
      };
      reader.readAsDataURL(blob);
    }
  };

  const pickGoldIcon = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to select an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setLocalGoldIcon(base64data);
      };
      reader.readAsDataURL(blob);
    }
  };

  const pickStatIcon = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'We need camera roll permissions to select an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      const response = await fetch(uri);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        setNewStat({ ...newStat, icon: base64data });
      };
      reader.readAsDataURL(blob);
    }
  };

  const addCustomStat = async () => {
    if (!newStat.name.trim()) {
      Alert.alert('Error', 'Please enter a stat name');
      return;
    }

    if (!user?.id) return;

    try {
      const response = await fetch(`${API_URL}/api/users/${user.id}/stats`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: user.id,
          name: newStat.name,
          color: newStat.color,
          current: newStat.current,
          max: newStat.max,
          icon: newStat.icon,
        }),
      });

      if (response.ok) {
        const stat = await response.json();
        setCustomStats([...customStats, stat]);
        setNewStat({ name: '', color: '#8B5CF6', current: 0, max: 100, icon: '' });
        setAddStatModalVisible(false);
        Alert.alert('Success', 'Custom stat added!');
      } else {
        Alert.alert('Error', 'Failed to add custom stat');
      }
    } catch (error) {
      console.error('Failed to add custom stat:', error);
      Alert.alert('Error', 'Failed to add custom stat');
    }
  };

  const colorOptions = [
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Yellow', value: '#FCD34D' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Orange', value: '#F97316' },
    { name: 'Cyan', value: '#06B6D4' },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* STATUS Title - Centered */}
        <Text style={styles.title}>STATUS</Text>

        {/* XP Bar Section */}
        <View style={styles.xpSection}>
          <View style={styles.xpBarContainer}>
            <View style={styles.xpBar}>
              <Animated.View style={[styles.xpFill, xpBarAnimatedStyle, { backgroundColor: xpBarColor }]} />
            </View>
          </View>
          <Text style={styles.xpCounter}>{user.xp} / {xpForNextLevel} XP</Text>
        </View>

        {/* Profile and Gold Section */}
        <View style={styles.profileGoldSection}>
          {/* Profile Image - Left */}
          <TouchableOpacity style={styles.profileImageContainer} onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileImage} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Ionicons name="person" size={60} color="#6B7280" />
                <Text style={styles.profilePlaceholderText}>Tap to add</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Level and Gold - Right */}
          <View style={styles.levelGoldSection}>
            {/* Level Number on top, label underneath */}
            <Text style={styles.levelNumber}>{user.level}</Text>
            <Text style={styles.levelLabel}>Level</Text>
            
            {/* Gold with coin icon */}
            <View style={styles.currencyRow}>
              <Ionicons name={goldIcon as any} size={20} color="#F59E0B" />
              <Text style={styles.currencyValue}>{user.gold}</Text>
            </View>
            
            {/* AP with star icon */}
            <View style={styles.currencyRow}>
              <Ionicons name={apIcon as any} size={20} color="#8B5CF6" />
              <Text style={styles.currencyValue}>{user.ability_points || 0}</Text>
            </View>
          </View>
        </View>

        {/* Stats Title - Centered */}
        <View style={styles.statsHeader}>
          <Text style={styles.statsTitle}>STATS</Text>
          <TouchableOpacity 
            style={styles.addStatButton}
            onPress={() => setAddStatModalVisible(true)}
          >
            <Ionicons name="add-circle" size={20} color="#8B5CF6" />
            <Text style={styles.addStatButtonText}>Add Stat</Text>
          </TouchableOpacity>
        </View>

        {/* Custom Stats Display */}
        {customStats.map((stat) => {
          const percentage = (stat.current / stat.max) * 100;
          return (
            <View key={stat.id} style={styles.customStatRow}>
              <View style={styles.statNameRow}>
                {stat.icon ? (
                  <Image source={{ uri: stat.icon }} style={styles.statIcon} />
                ) : (
                  <View style={styles.statIconPlaceholder} />
                )}
                <View style={styles.statNameContainer}>
                  <Text style={styles.customStatName}>{stat.name}</Text>
                  <Text style={styles.statLevel}>Lv. {stat.level || 1}</Text>
                </View>
              </View>
              <View style={styles.customStatBarContainer}>
                <View style={styles.customStatBar}>
                  <View 
                    style={[
                      styles.customStatBarFill, 
                      { width: `${percentage}%`, backgroundColor: stat.color }
                    ]} 
                  />
                </View>
                <Text style={styles.customStatCounter}>
                  {stat.current} / {stat.max}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Add Stat Modal */}
      <Modal visible={addStatModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Custom Stat</Text>

            <Text style={styles.label}>Stat Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., Endurance, Charisma"
              placeholderTextColor="#6B7280"
              value={newStat.name}
              onChangeText={(text) => setNewStat({ ...newStat, name: text })}
            />

            <Text style={styles.label}>Stat Icon (Optional)</Text>
            <TouchableOpacity style={styles.iconPickerButton} onPress={pickStatIcon}>
              {newStat.icon ? (
                <Image source={{ uri: newStat.icon }} style={styles.iconPreview} />
              ) : (
                <View style={styles.iconPlaceholder}>
                  <Ionicons name="image" size={24} color="#6B7280" />
                  <Text style={styles.iconPlaceholderText}>Tap to add icon</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.label}>Bar Gauge Color</Text>
            <View style={styles.colorGrid}>
              {colorOptions.map((colorOption) => (
                <TouchableOpacity
                  key={colorOption.value}
                  style={[
                    styles.colorOption,
                    { backgroundColor: colorOption.value },
                    newStat.color === colorOption.value && styles.colorOptionSelected
                  ]}
                  onPress={() => setNewStat({ ...newStat, color: colorOption.value })}
                >
                  {newStat.color === colorOption.value && (
                    <Ionicons name="checkmark" size={24} color="#FFF" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity style={styles.createButton} onPress={addCustomStat}>
              <Text style={styles.createButtonText}>Add Stat</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelButton} 
              onPress={() => setAddStatModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const getStyles = (theme: StatusTheme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: theme.colors.primary,
    letterSpacing: 2,
  },
  xpSection: {
    marginBottom: 32,
  },
  xpBarContainer: {
    marginBottom: 8,
  },
  xpBar: {
    height: 6,
    backgroundColor: theme.colors.xpBarBg,
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: theme.colors.xpBarFill,
    borderRadius: 3,
  },
  xpCounter: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  profileGoldSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 32,
  },
  profileImageContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    overflow: 'hidden',
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 3,
    borderColor: theme.colors.primary,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
  },
  profilePlaceholderText: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    marginTop: 4,
  },
  levelGoldSection: {
    alignItems: 'flex-end',
  },
  levelNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.primary,
    textAlign: 'right',
  },
  levelLabel: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginTop: -8,
    marginBottom: 8,
    textAlign: 'right',
  },
  currencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  currencyValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  currencyIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  statsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: theme.colors.primary,
    letterSpacing: 2,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  addStatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: theme.colors.primary,
    gap: 6,
  },
  addStatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  customStatRow: {
    marginBottom: 20,
  },
  statNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  statIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    marginRight: 8,
  },
  statIconPlaceholder: {
    width: 24,
    height: 24,
    marginRight: 8,
  },
  statNameContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  customStatName: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
  },
  statLevel: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: theme.colors.xpBarBg,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  customStatBarContainer: {
    marginBottom: 4,
  },
  customStatBar: {
    height: 8,
    backgroundColor: theme.colors.statBarBg,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  customStatBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  customStatCounter: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  colorOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorOptionSelected: {
    borderWidth: 3,
    borderColor: '#FFF',
  },
  iconPickerButton: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  iconPreview: {
    width: 60,
    height: 60,
    borderRadius: 12,
  },
  iconPlaceholder: {
    alignItems: 'center',
  },
  iconPlaceholderText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginTop: 8,
  },
  createButton: {
    backgroundColor: theme.colors.primary,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  createButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: theme.colors.cardBackground,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  cancelButtonText: {
    color: theme.colors.textSecondary,
    fontSize: 16,
    fontWeight: '600',
  },
});