import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert, Modal, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { useTheme } from '../../contexts/ThemeContext';
import { useCustomization, StatusTheme, StatusLayout } from '../../contexts/CustomizationContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AppBackground from '../../components/AppBackground';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming, 
  withRepeat, 
  withSequence,
  withSpring,
  Easing 
} from 'react-native-reanimated';

const API_URL = 'https://rpg-life-game.preview.emergentagent.com';

export default function StatusScreen() {
  const { user, loading, refreshUser } = useUser();
  const { colors } = useTheme();
  const { xpBarColor, goldIcon, apIcon, goldCustomImage, apCustomImage, statusTheme, statusLayout } = useCustomization();
  const styles = getStyles(statusTheme, statusLayout);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [localGoldIcon, setLocalGoldIcon] = useState<string | null>(null);
  const [addStatModalVisible, setAddStatModalVisible] = useState(false);
  const [editStatusModalVisible, setEditStatusModalVisible] = useState(false);
  const [customStats, setCustomStats] = useState<Array<{id: string, name: string, color: string, current: number, max: number, icon?: string}>>([]);
  const [newStat, setNewStat] = useState({
    name: '',
    color: '#8B5CF6',
    current: 0,
    max: 100,
    icon: '',
  });
  const [statusEdit, setStatusEdit] = useState({
    hp: 100,
    max_hp: 100,
    mp: 50,
    max_mp: 50,
    player_class: 'Adventurer',
    title: 'Novice',
  });
  const [editStatModalVisible, setEditStatModalVisible] = useState(false);
  const [statActionModalVisible, setStatActionModalVisible] = useState(false);
  const [deleteConfirmModalVisible, setDeleteConfirmModalVisible] = useState(false);
  const [selectedStat, setSelectedStat] = useState<{id: string, name: string, color: string, current: number, max: number, icon?: string} | null>(null);
  const [editingStat, setEditingStat] = useState({
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
      // Initialize status edit values from user
      setStatusEdit({
        hp: user.hp || 100,
        max_hp: user.max_hp || 100,
        mp: user.mp || 50,
        max_mp: user.max_mp || 50,
        player_class: user.player_class || 'Adventurer',
        title: user.title || 'Novice',
      });
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

  const saveStatusUpdate = async () => {
    if (!user?.id) return;

    try {
      // Only send Class and Title - HP/MP are controlled by level ups
      const response = await fetch(`${API_URL}/api/users/${user.id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          player_class: statusEdit.player_class,
          title: statusEdit.title
        }),
      });

      if (response.ok) {
        await refreshUser();
        setEditStatusModalVisible(false);
        Alert.alert('Success', 'Status updated!');
      } else {
        Alert.alert('Error', 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update status:', error);
      Alert.alert('Error', 'Failed to update status');
    }
  };

  const openEditStatusModal = () => {
    setStatusEdit({
      hp: user?.hp || 100,
      max_hp: user?.max_hp || 100,
      mp: user?.mp || 50,
      max_mp: user?.max_mp || 50,
      player_class: user?.player_class || 'Adventurer',
      title: user?.title || 'Novice',
    });
    setEditStatusModalVisible(true);
  };

  const handleStatLongPress = (stat: typeof selectedStat) => {
    setSelectedStat(stat);
    setStatActionModalVisible(true);
  };

  const openEditStatModal = () => {
    if (!selectedStat) return;
    setEditingStat({
      name: selectedStat.name,
      color: selectedStat.color,
      current: selectedStat.current,
      max: selectedStat.max,
      icon: selectedStat.icon || '',
    });
    setStatActionModalVisible(false);
    setEditStatModalVisible(true);
  };

  const saveEditedStat = async () => {
    if (!user?.id || !selectedStat) return;

    try {
      const response = await fetch(`${API_URL}/api/users/${user.id}/stats/${selectedStat.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editingStat.name,
          color: editingStat.color,
          current: editingStat.current,
          max: editingStat.max,
          icon: editingStat.icon,
        }),
      });

      if (response.ok) {
        await fetchCustomStats();
        setEditStatModalVisible(false);
        setSelectedStat(null);
        Alert.alert('Success', 'Stat updated!');
      } else {
        Alert.alert('Error', 'Failed to update stat');
      }
    } catch (error) {
      console.error('Failed to update stat:', error);
      Alert.alert('Error', 'Failed to update stat');
    }
  };

  const deleteStat = async () => {
    if (!user?.id || !selectedStat) return;
    // Show confirmation modal instead of Alert (better for web)
    setStatActionModalVisible(false);
    setDeleteConfirmModalVisible(true);
  };

  const confirmDeleteStat = async () => {
    if (!user?.id || !selectedStat) return;
    
    try {
      const response = await fetch(`${API_URL}/api/users/${user.id}/stats/${selectedStat.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setCustomStats(customStats.filter(s => s.id !== selectedStat.id));
        setDeleteConfirmModalVisible(false);
        setSelectedStat(null);
        Alert.alert('Success', 'Stat deleted!');
      } else {
        Alert.alert('Error', 'Failed to delete stat');
      }
    } catch (error) {
      console.error('Failed to delete stat:', error);
      Alert.alert('Error', 'Failed to delete stat');
    }
  };

  const pickEditStatIcon = async () => {
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
        setEditingStat({ ...editingStat, icon: base64data });
      };
      reader.readAsDataURL(blob);
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

  // Render HP/MP based on layout style
  const renderHpMp = () => {
    const hpPercent = ((user.hp || 100) / (user.max_hp || 100)) * 100;
    const mpPercent = ((user.mp || 50) / (user.max_mp || 50)) * 100;
    
    if (statusLayout.layout.hpMpStyle === 'circular') {
      return (
        <View style={styles.circularHpMpContainer}>
          <View style={styles.circularStatItem}>
            <View style={[styles.circularStatOuter, { borderColor: '#EF4444' }]}>
              <View style={[styles.circularStatInner, { backgroundColor: statusTheme.colors.cardBackground }]}>
                <Ionicons name="heart" size={20} color="#EF4444" />
                <Text style={styles.circularStatValue}>{user.hp || 100}</Text>
              </View>
            </View>
            <Text style={styles.circularStatLabel}>HP</Text>
          </View>
          <View style={styles.circularStatItem}>
            <View style={[styles.circularStatOuter, { borderColor: '#3B82F6' }]}>
              <View style={[styles.circularStatInner, { backgroundColor: statusTheme.colors.cardBackground }]}>
                <Ionicons name="water" size={20} color="#3B82F6" />
                <Text style={styles.circularStatValue}>{user.mp || 50}</Text>
              </View>
            </View>
            <Text style={styles.circularStatLabel}>MP</Text>
          </View>
        </View>
      );
    } else if (statusLayout.layout.hpMpStyle === 'numeric') {
      return (
        <View style={styles.numericHpMpContainer}>
          <View style={styles.numericStatItem}>
            <Ionicons name="heart" size={24} color="#EF4444" />
            <Text style={styles.numericStatValue}>{user.hp || 100}<Text style={styles.numericStatMax}>/{user.max_hp || 100}</Text></Text>
          </View>
          <View style={styles.numericStatItem}>
            <Ionicons name="water" size={24} color="#3B82F6" />
            <Text style={styles.numericStatValue}>{user.mp || 50}<Text style={styles.numericStatMax}>/{user.max_mp || 50}</Text></Text>
          </View>
        </View>
      );
    } else if (statusLayout.layout.hpMpStyle === 'minimal') {
      return (
        <View style={styles.minimalHpMpContainer}>
          <View style={styles.minimalStatRow}>
            <Text style={styles.minimalStatLabel}>HP</Text>
            <View style={styles.minimalBar}>
              <View style={[styles.minimalBarFill, { width: `${hpPercent}%`, backgroundColor: '#EF4444' }]} />
            </View>
            <Text style={styles.minimalStatText}>{user.hp || 100}</Text>
          </View>
          <View style={styles.minimalStatRow}>
            <Text style={styles.minimalStatLabel}>MP</Text>
            <View style={styles.minimalBar}>
              <View style={[styles.minimalBarFill, { width: `${mpPercent}%`, backgroundColor: '#3B82F6' }]} />
            </View>
            <Text style={styles.minimalStatText}>{user.mp || 50}</Text>
          </View>
        </View>
      );
    }
    
    // Default bars style
    return (
      <TouchableOpacity style={styles.hpMpSection} onPress={openEditStatusModal}>
        <View style={styles.statBarRow}>
          <View style={styles.statBarLabelContainer}>
            <Ionicons name="heart" size={18} color="#EF4444" />
            <Text style={styles.statBarLabel}>HP</Text>
          </View>
          <View style={styles.statBarWrapper}>
            <View style={styles.hpBar}>
              <View style={[styles.hpBarFill, { width: `${hpPercent}%` }]} />
            </View>
            <Text style={styles.statBarCounter}>{user.hp || 100} / {user.max_hp || 100}</Text>
          </View>
        </View>
        <View style={styles.statBarRow}>
          <View style={styles.statBarLabelContainer}>
            <Ionicons name="water" size={18} color="#3B82F6" />
            <Text style={styles.statBarLabel}>MP</Text>
          </View>
          <View style={styles.statBarWrapper}>
            <View style={styles.mpBar}>
              <View style={[styles.mpBarFill, { width: `${mpPercent}%` }]} />
            </View>
            <Text style={styles.statBarCounter}>{user.mp || 50} / {user.max_mp || 50}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Render Level display based on layout
  const renderLevelDisplay = () => {
    if (statusLayout.layout.showLevel === 'large') {
      return (
        <View style={styles.largeLevelContainer}>
          <Text style={styles.largeLevelLabel}>LEVEL</Text>
          <Text style={styles.largeLevelValue}>{user.level}</Text>
        </View>
      );
    } else if (statusLayout.layout.showLevel === 'inline') {
      return (
        <View style={styles.inlineLevelContainer}>
          <Text style={styles.inlineLevelText}>Lv.{user.level}</Text>
        </View>
      );
    }
    return null; // Badge style is handled in profile section
  };

  // Render Profile, Level, Gold, AP section based on layout
  const renderProfileSection = () => {
    const layoutId = statusLayout.id;
    
    // Dashboard layout - Horizontal metrics bar
    if (layoutId === 'dashboard') {
      return (
        <View style={styles.dashboardContainer}>
          <View style={styles.dashboardRow}>
            <View style={styles.dashboardMetric}>
              <Ionicons name="trending-up" size={24} color={statusTheme.colors.primary} />
              <Text style={styles.dashboardValue}>{user.level}</Text>
              <Text style={styles.dashboardLabel}>LEVEL</Text>
            </View>
            <View style={styles.dashboardDivider} />
            <View style={styles.dashboardMetric}>
              {goldCustomImage ? (
                <Image source={{ uri: goldCustomImage }} style={styles.dashboardIcon} />
              ) : (
                <Ionicons name={goldIcon as any} size={24} color={statusTheme.colors.goldColor} />
              )}
              <Text style={styles.dashboardValue}>{user.gold}</Text>
              <Text style={styles.dashboardLabel}>GOLD</Text>
            </View>
            <View style={styles.dashboardDivider} />
            <View style={styles.dashboardMetric}>
              {apCustomImage ? (
                <Image source={{ uri: apCustomImage }} style={styles.dashboardIcon} />
              ) : (
                <Ionicons name={apIcon as any} size={24} color={statusTheme.colors.apColor} />
              )}
              <Text style={styles.dashboardValue}>{user.ability_points || 0}</Text>
              <Text style={styles.dashboardLabel}>AP</Text>
            </View>
          </View>
        </View>
      );
    }
    
    // Minimal layout - Inline compact row
    if (layoutId === 'minimal' || layoutId === 'compact-mobile') {
      return (
        <View style={styles.minimalProfileContainer}>
          <View style={styles.minimalRow}>
            <Text style={styles.minimalLevelBadge}>Lv.{user.level}</Text>
            <View style={styles.minimalCurrencies}>
              <View style={styles.minimalCurrency}>
                {goldCustomImage ? (
                  <Image source={{ uri: goldCustomImage }} style={styles.minimalIcon} />
                ) : (
                  <Ionicons name={goldIcon as any} size={16} color={statusTheme.colors.goldColor} />
                )}
                <Text style={styles.minimalCurrencyText}>{user.gold}</Text>
              </View>
              <View style={styles.minimalCurrency}>
                {apCustomImage ? (
                  <Image source={{ uri: apCustomImage }} style={styles.minimalIcon} />
                ) : (
                  <Ionicons name={apIcon as any} size={16} color={statusTheme.colors.apColor} />
                )}
                <Text style={styles.minimalCurrencyText}>{user.ability_points || 0}</Text>
              </View>
            </View>
          </View>
        </View>
      );
    }
    
    // Gaming HUD layout - Side panel style
    if (layoutId === 'gaming-hud') {
      return (
        <View style={styles.hudContainer}>
          <View style={styles.hudLeftPanel}>
            <TouchableOpacity style={styles.hudAvatar} onPress={pickImage}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.hudAvatarImage} />
              ) : (
                <Ionicons name="person" size={32} color="#6B7280" />
              )}
            </TouchableOpacity>
            <View style={styles.hudLevelBadge}>
              <Text style={styles.hudLevelText}>{user.level}</Text>
            </View>
          </View>
          <View style={styles.hudRightPanel}>
            <View style={styles.hudCurrencyRow}>
              {goldCustomImage ? (
                <Image source={{ uri: goldCustomImage }} style={styles.hudIcon} />
              ) : (
                <Ionicons name={goldIcon as any} size={20} color={statusTheme.colors.goldColor} />
              )}
              <Text style={styles.hudCurrencyValue}>{user.gold}</Text>
            </View>
            <View style={styles.hudCurrencyRow}>
              {apCustomImage ? (
                <Image source={{ uri: apCustomImage }} style={styles.hudIcon} />
              ) : (
                <Ionicons name={apIcon as any} size={20} color={statusTheme.colors.apColor} />
              )}
              <Text style={styles.hudCurrencyValue}>{user.ability_points || 0}</Text>
            </View>
          </View>
        </View>
      );
    }
    
    // Profile Card layout - Large centered avatar
    if (layoutId === 'profile-card' || layoutId === 'hero-showcase') {
      return (
        <View style={styles.profileCardContainer}>
          <TouchableOpacity style={styles.profileCardAvatar} onPress={pickImage}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.profileCardAvatarImage} />
            ) : (
              <View style={styles.profileCardPlaceholder}>
                <Ionicons name="person" size={80} color="#6B7280" />
              </View>
            )}
            <View style={styles.profileCardLevelBadge}>
              <Text style={styles.profileCardLevelText}>Lv.{user.level}</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.profileCardName}>{user.username}</Text>
          <View style={styles.profileCardCurrencies}>
            <View style={styles.profileCardCurrency}>
              {goldCustomImage ? (
                <Image source={{ uri: goldCustomImage }} style={styles.profileCardIcon} />
              ) : (
                <Ionicons name={goldIcon as any} size={28} color={statusTheme.colors.goldColor} />
              )}
              <Text style={styles.profileCardCurrencyValue}>{user.gold}</Text>
              <Text style={styles.profileCardCurrencyLabel}>Gold</Text>
            </View>
            <View style={styles.profileCardDivider} />
            <View style={styles.profileCardCurrency}>
              {apCustomImage ? (
                <Image source={{ uri: apCustomImage }} style={styles.profileCardIcon} />
              ) : (
                <Ionicons name={apIcon as any} size={28} color={statusTheme.colors.apColor} />
              )}
              <Text style={styles.profileCardCurrencyValue}>{user.ability_points || 0}</Text>
              <Text style={styles.profileCardCurrencyLabel}>AP</Text>
            </View>
          </View>
        </View>
      );
    }
    
    // Character Sheet layout - D&D style boxes
    if (layoutId === 'character-sheet') {
      return (
        <View style={styles.sheetContainer}>
          <View style={styles.sheetRow}>
            <View style={styles.sheetBox}>
              <Text style={styles.sheetBoxLabel}>LEVEL</Text>
              <Text style={styles.sheetBoxValue}>{user.level}</Text>
            </View>
            <View style={styles.sheetBox}>
              <Text style={styles.sheetBoxLabel}>GOLD</Text>
              <View style={styles.sheetBoxRow}>
                {goldCustomImage ? (
                  <Image source={{ uri: goldCustomImage }} style={styles.sheetIcon} />
                ) : (
                  <Ionicons name={goldIcon as any} size={18} color={statusTheme.colors.goldColor} />
                )}
                <Text style={styles.sheetBoxValue}>{user.gold}</Text>
              </View>
            </View>
            <View style={styles.sheetBox}>
              <Text style={styles.sheetBoxLabel}>AP</Text>
              <View style={styles.sheetBoxRow}>
                {apCustomImage ? (
                  <Image source={{ uri: apCustomImage }} style={styles.sheetIcon} />
                ) : (
                  <Ionicons name={apIcon as any} size={18} color={statusTheme.colors.apColor} />
                )}
                <Text style={styles.sheetBoxValue}>{user.ability_points || 0}</Text>
              </View>
            </View>
          </View>
        </View>
      );
    }
    
    // Retro Pixel layout - 8-bit style
    if (layoutId === 'retro-pixel') {
      return (
        <View style={styles.retroContainer}>
          <View style={styles.retroRow}>
            <View style={styles.retroItem}>
              <Text style={styles.retroLabel}>LVL</Text>
              <Text style={styles.retroValue}>{user.level}</Text>
            </View>
            <View style={styles.retroItem}>
              <Text style={styles.retroLabel}>GOLD</Text>
              <Text style={styles.retroValue}>{user.gold}</Text>
            </View>
            <View style={styles.retroItem}>
              <Text style={styles.retroLabel}>AP</Text>
              <Text style={styles.retroValue}>{user.ability_points || 0}</Text>
            </View>
          </View>
        </View>
      );
    }
    
    // Default/Classic RPG layout
    return (
      <View style={styles.profileGoldSection}>
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
        <View style={styles.levelGoldSection}>
          <Text style={styles.levelNumber}>{user.level}</Text>
          <Text style={styles.levelLabel}>Level</Text>
          <View style={styles.currencyRow}>
            {goldCustomImage ? (
              <Image source={{ uri: goldCustomImage }} style={styles.currencyIcon} />
            ) : (
              <Ionicons name={goldIcon as any} size={20} color={statusTheme.colors.goldColor} />
            )}
            <Text style={styles.currencyValue}>{user.gold}</Text>
          </View>
          <View style={styles.currencyRow}>
            {apCustomImage ? (
              <Image source={{ uri: apCustomImage }} style={styles.currencyIcon} />
            ) : (
              <Ionicons name={apIcon as any} size={20} color={statusTheme.colors.apColor} />
            )}
            <Text style={styles.currencyValue}>{user.ability_points || 0}</Text>
          </View>
        </View>
      </View>
    );
  };

  // Render Stats section based on layout
  const renderStatsSection = () => {
    const layoutId = statusLayout.id;
    const columns = statusLayout.layout.statsColumns;
    
    // Stats header (add button)
    const statsHeader = (
      <View style={[
        styles.statsHeader,
        layoutId === 'minimal' && styles.statsHeaderMinimal,
      ]}>
        <Text style={[
          styles.statsTitle,
          layoutId === 'minimal' && styles.statsTitleMinimal,
        ]}>STATS</Text>
        <TouchableOpacity 
          style={styles.addStatButton}
          onPress={() => setAddStatModalVisible(true)}
        >
          <Ionicons name="add-circle" size={20} color={statusTheme.colors.primary} />
          {layoutId !== 'minimal' && layoutId !== 'compact-mobile' && (
            <Text style={styles.addStatButtonText}>Add Stat</Text>
          )}
        </TouchableOpacity>
      </View>
    );

    // Grid layout for stats
    if (statusLayout.layout.statsDisplay === 'grid' && columns > 1) {
      const rows = [];
      for (let i = 0; i < customStats.length; i += columns) {
        rows.push(customStats.slice(i, i + columns));
      }
      
      return (
        <>
          {statsHeader}
          <View style={styles.statsGridContainer}>
            {rows.map((row, rowIndex) => (
              <View key={rowIndex} style={styles.statsGridRow}>
                {row.map((stat) => {
                  const percentage = (stat.current / stat.max) * 100;
                  return (
                    <Pressable
                      key={stat.id}
                      onLongPress={() => handleStatLongPress(stat)}
                      style={[styles.statsGridItem, { flex: 1 / columns }]}
                    >
                      <Text style={styles.gridStatName}>{stat.name}</Text>
                      <View style={[styles.gridStatBar, { backgroundColor: stat.color + '30' }]}>
                        <View style={[styles.gridStatFill, { width: `${percentage}%`, backgroundColor: stat.color }]} />
                      </View>
                      <Text style={styles.gridStatValue}>{stat.current}/{stat.max}</Text>
                    </Pressable>
                  );
                })}
                {/* Fill empty spaces in last row */}
                {row.length < columns && [...Array(columns - row.length)].map((_, i) => (
                  <View key={`empty-${i}`} style={{ flex: 1 / columns }} />
                ))}
              </View>
            ))}
          </View>
        </>
      );
    }
    
    // List layout - compact vertical
    if (statusLayout.layout.statsDisplay === 'list') {
      return (
        <>
          {statsHeader}
          <View style={styles.statsListContainer}>
            {customStats.map((stat) => {
              const percentage = (stat.current / stat.max) * 100;
              return (
                <Pressable
                  key={stat.id}
                  onLongPress={() => handleStatLongPress(stat)}
                  style={styles.statsListItem}
                >
                  <View style={styles.listStatHeader}>
                    <Text style={[styles.listStatName, { color: stat.color }]}>{stat.name}</Text>
                    <Text style={styles.listStatValue}>{stat.current}/{stat.max}</Text>
                  </View>
                  <View style={styles.listStatBar}>
                    <View style={[styles.listStatFill, { width: `${percentage}%`, backgroundColor: stat.color }]} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      );
    }
    
    // Bars layout - horizontal full-width bars
    if (statusLayout.layout.statsDisplay === 'bars') {
      return (
        <>
          {statsHeader}
          <View style={styles.statsBarsContainer}>
            {customStats.map((stat) => {
              const percentage = (stat.current / stat.max) * 100;
              return (
                <Pressable
                  key={stat.id}
                  onLongPress={() => handleStatLongPress(stat)}
                  style={styles.barsStatItem}
                >
                  <View style={styles.barsStatLabelRow}>
                    <View style={[styles.barsStatDot, { backgroundColor: stat.color }]} />
                    <Text style={styles.barsStatName}>{stat.name}</Text>
                    <Text style={styles.barsStatValue}>{stat.current}</Text>
                  </View>
                  <View style={styles.barsStatBarContainer}>
                    <View style={[styles.barsStatBar, { backgroundColor: stat.color + '20' }]}>
                      <View style={[styles.barsStatFill, { width: `${percentage}%`, backgroundColor: stat.color }]} />
                    </View>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </>
      );
    }
    
    // Default cards layout
    return (
      <>
        {statsHeader}
        {customStats.map((stat) => {
          const percentage = (stat.current / stat.max) * 100;
          return (
            <Pressable
              key={stat.id}
              onLongPress={() => handleStatLongPress(stat)}
              style={styles.statItem}
            >
              <View style={styles.statHeader}>
                <Text style={[styles.statName, { color: stat.color }]}>{stat.name}</Text>
                <Text style={styles.statValue}>{stat.current} / {stat.max}</Text>
              </View>
              <View style={[styles.statBar, { backgroundColor: stat.color + '20' }]}>
                <View style={[styles.statFill, { width: `${percentage}%`, backgroundColor: stat.color }]} />
              </View>
              <Text style={styles.longPressHint}>Hold to edit</Text>
            </Pressable>
          );
        })}
      </>
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: 'transparent' }]} edges={['bottom']}>
      <AppBackground>
        <ScrollView style={styles.scrollView} contentContainerStyle={[
          styles.content,
          statusLayout.layout.spacing === 'compact' && styles.contentCompact,
          statusLayout.layout.spacing === 'relaxed' && styles.contentRelaxed,
        ]}>
          {/* STATUS Title - Only show for certain layouts */}
          {statusLayout.layout.headerStyle !== 'minimal' && (
            <Text style={[
              styles.title,
              statusLayout.layout.headerStyle === 'centered' && styles.titleCentered,
              statusLayout.layout.headerStyle === 'compact' && styles.titleCompact,
            ]}>STATUS</Text>
          )}

          {/* Large Level Display for certain layouts */}
          {statusLayout.layout.showLevel === 'large' && renderLevelDisplay()}

        {/* XP Bar Section */}
        <View style={[
          styles.xpSection,
          statusLayout.layout.headerStyle === 'compact' && styles.xpSectionCompact,
        ]}>
          <View style={styles.xpBarContainer}>
            <View style={styles.xpBar}>
              <Animated.View style={[styles.xpFill, xpBarAnimatedStyle, { backgroundColor: xpBarColor }]} />
            </View>
          </View>
          <Text style={styles.xpCounter}>{user.xp} / {xpForNextLevel} XP</Text>
        </View>

        {/* Class and Title Section - Hidden in minimal/compact */}
        {statusLayout.layout.headerStyle !== 'minimal' && (
          <TouchableOpacity style={[
            styles.classTitleSection,
            statusLayout.layout.cardStyle === 'flat' && styles.cardFlat,
            statusLayout.layout.cardStyle === 'outlined' && styles.cardOutlined,
            statusLayout.layout.cardStyle === 'glass' && styles.cardGlass,
          ]} onPress={openEditStatusModal}>
            <View style={styles.classTitleRow}>
              <View style={styles.classTitleItem}>
                <Text style={styles.classTitleLabel}>CLASS</Text>
                <Text style={styles.classTitleValue}>{user.player_class || 'Adventurer'}</Text>
              </View>
              <View style={styles.classTitleDivider} />
              <View style={styles.classTitleItem}>
                <Text style={styles.classTitleLabel}>TITLE</Text>
                <Text style={styles.classTitleValue}>{user.title || 'Novice'}</Text>
              </View>
              <Ionicons name="create-outline" size={20} color={statusTheme.colors.textSecondary} style={styles.editIcon} />
            </View>
          </TouchableOpacity>
        )}

        {/* HP and MP - Rendered based on layout style */}
        {renderHpMp()}

        {/* Profile, Level, Gold, AP Section - Layout dependent */}
        {renderProfileSection()}

        {/* Stats Section - Layout dependent */}
        {renderStatsSection()}
          const percentage = (stat.current / stat.max) * 100;
          return (
            <Pressable 
              key={stat.id} 
              style={({ pressed }) => [
                styles.customStatRow,
                pressed && styles.customStatRowPressed
              ]}
              onLongPress={() => handleStatLongPress(stat)}
              delayLongPress={500}
            >
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
              <Text style={styles.longPressHint}>Hold to edit</Text>
            </Pressable>
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

      {/* Edit Status Modal */}
      <Modal visible={editStatusModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Edit Status</Text>

              <Text style={styles.label}>Class</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Warrior, Mage, Archer"
                placeholderTextColor="#6B7280"
                value={statusEdit.player_class}
                onChangeText={(text) => setStatusEdit({ ...statusEdit, player_class: text })}
              />

              <Text style={styles.label}>Title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Dragon Slayer, Champion"
                placeholderTextColor="#6B7280"
                value={statusEdit.title}
                onChangeText={(text) => setStatusEdit({ ...statusEdit, title: text })}
              />

              <View style={styles.divider} />

              <View style={styles.hpMpInfoBox}>
                <Ionicons name="information-circle" size={20} color="#60A5FA" />
                <Text style={styles.hpMpInfoText}>
                  HP and MP increase automatically when you level up (+10 HP, +5 MP per level).
                </Text>
              </View>

              <TouchableOpacity style={styles.createButton} onPress={saveStatusUpdate}>
                <Text style={styles.createButtonText}>Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setEditStatusModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Stat Action Modal (Edit/Delete) */}
      <Modal visible={statActionModalVisible} animationType="fade" transparent={true}>
        <TouchableOpacity 
          style={styles.actionModalOverlay}
          activeOpacity={1}
          onPress={() => setStatActionModalVisible(false)}
        >
          <View style={styles.actionModalContent}>
            <Text style={styles.actionModalTitle}>{selectedStat?.name}</Text>
            <Text style={styles.actionModalSubtitle}>What would you like to do?</Text>
            
            <TouchableOpacity style={styles.actionButton} onPress={openEditStatModal}>
              <Ionicons name="create-outline" size={24} color={statusTheme.colors.primary} />
              <Text style={[styles.actionButtonText, { color: statusTheme.colors.primary }]}>Edit Stat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={[styles.actionButton, styles.deleteActionButton]} onPress={deleteStat}>
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
              <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Delete Stat</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelActionButton} 
              onPress={() => setStatActionModalVisible(false)}
            >
              <Text style={styles.cancelActionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal visible={deleteConfirmModalVisible} animationType="fade" transparent={true}>
        <TouchableOpacity 
          style={styles.actionModalOverlay}
          activeOpacity={1}
          onPress={() => setDeleteConfirmModalVisible(false)}
        >
          <View style={styles.actionModalContent}>
            <Ionicons name="warning" size={48} color="#EF4444" style={{ marginBottom: 16 }} />
            <Text style={styles.actionModalTitle}>Delete Stat?</Text>
            <Text style={[styles.actionModalSubtitle, { textAlign: 'center', marginBottom: 20 }]}>
              Are you sure you want to delete "{selectedStat?.name}"? This action cannot be undone.
            </Text>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteActionButton, { marginBottom: 8 }]} 
              onPress={confirmDeleteStat}
            >
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
              <Text style={[styles.actionButtonText, { color: '#EF4444' }]}>Yes, Delete</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cancelActionButton} 
              onPress={() => {
                setDeleteConfirmModalVisible(false);
                setStatActionModalVisible(true);
              }}
            >
              <Text style={styles.cancelActionButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Edit Stat Modal */}
      <Modal visible={editStatModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>Edit Stat</Text>

              <Text style={styles.label}>Stat Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Endurance, Charisma"
                placeholderTextColor="#6B7280"
                value={editingStat.name}
                onChangeText={(text) => setEditingStat({ ...editingStat, name: text })}
              />

              <Text style={styles.label}>Stat Icon (Optional)</Text>
              <TouchableOpacity style={styles.iconPickerButton} onPress={pickEditStatIcon}>
                {editingStat.icon ? (
                  <Image source={{ uri: editingStat.icon }} style={styles.iconPreview} />
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
                      editingStat.color === colorOption.value && styles.colorOptionSelected
                    ]}
                    onPress={() => setEditingStat({ ...editingStat, color: colorOption.value })}
                  >
                    {editingStat.color === colorOption.value && (
                      <Ionicons name="checkmark" size={24} color="#FFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>Current / Max Values</Text>
              <View style={styles.statValueRow}>
                <View style={styles.statValueInput}>
                  <Text style={styles.statValueLabel}>Current</Text>
                  <TextInput
                    style={styles.statValueField}
                    keyboardType="numeric"
                    value={String(editingStat.current)}
                    onChangeText={(text) => setEditingStat({ ...editingStat, current: parseInt(text) || 0 })}
                  />
                </View>
                <Text style={styles.statValueDivider}>/</Text>
                <View style={styles.statValueInput}>
                  <Text style={styles.statValueLabel}>Max</Text>
                  <TextInput
                    style={styles.statValueField}
                    keyboardType="numeric"
                    value={String(editingStat.max)}
                    onChangeText={(text) => setEditingStat({ ...editingStat, max: parseInt(text) || 100 })}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.createButton} onPress={saveEditedStat}>
                <Text style={styles.createButtonText}>Save Changes</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => {
                  setEditStatModalVisible(false);
                  setSelectedStat(null);
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
      </AppBackground>
    </SafeAreaView>
  );
}

const getStyles = (theme: StatusTheme, layout: StatusLayout) => StyleSheet.create({
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
  contentCompact: {
    padding: 12,
  },
  contentRelaxed: {
    padding: 28,
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
  titleCentered: {
    textAlign: 'center',
    fontSize: 28,
  },
  titleCompact: {
    fontSize: 20,
    marginBottom: 12,
  },
  // Card style variants
  cardFlat: {
    backgroundColor: 'transparent',
    borderWidth: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  cardOutlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: theme.colors.cardBorder,
  },
  cardGlass: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  // Large level display
  largeLevelContainer: {
    alignItems: 'center',
    marginBottom: 20,
    padding: 16,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  largeLevelLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    letterSpacing: 2,
  },
  largeLevelValue: {
    fontSize: 48,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  inlineLevelContainer: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginBottom: 12,
  },
  inlineLevelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  // Circular HP/MP styles
  circularHpMpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
  },
  circularStatItem: {
    alignItems: 'center',
  },
  circularStatOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  circularStatInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circularStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginTop: 2,
  },
  circularStatLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.textSecondary,
  },
  // Numeric HP/MP styles
  numericHpMpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    padding: 16,
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
  },
  numericStatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  numericStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  numericStatMax: {
    fontSize: 16,
    fontWeight: 'normal',
    color: theme.colors.textSecondary,
  },
  // Minimal HP/MP styles
  minimalHpMpContainer: {
    marginBottom: 16,
    gap: 8,
  },
  minimalStatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  minimalStatLabel: {
    width: 24,
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
  },
  minimalBar: {
    flex: 1,
    height: 8,
    backgroundColor: theme.colors.statBarBg,
    borderRadius: 4,
    overflow: 'hidden',
  },
  minimalBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  minimalStatText: {
    width: 40,
    fontSize: 12,
    color: theme.colors.text,
    textAlign: 'right',
  },
  xpSection: {
    marginBottom: 32,
  },
  xpSectionCompact: {
    marginBottom: 16,
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
  classTitleSection: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  classTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  classTitleItem: {
    flex: 1,
    alignItems: 'center',
  },
  classTitleLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  classTitleValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  classTitleDivider: {
    width: 1,
    height: 40,
    backgroundColor: theme.colors.cardBorder,
    marginHorizontal: 16,
  },
  editIcon: {
    position: 'absolute',
    right: 0,
    top: 0,
  },
  hpMpSection: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  statBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statBarLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 60,
    gap: 6,
  },
  statBarLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  statBarWrapper: {
    flex: 1,
  },
  hpBar: {
    height: 12,
    backgroundColor: '#3F1D1D',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 2,
  },
  hpBarFill: {
    height: '100%',
    backgroundColor: '#EF4444',
    borderRadius: 6,
  },
  mpBar: {
    height: 12,
    backgroundColor: '#1D2D3F',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 2,
  },
  mpBarFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  statBarCounter: {
    fontSize: 10,
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
  divider: {
    height: 1,
    backgroundColor: theme.colors.cardBorder,
    marginVertical: 16,
  },
  hpMpInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(96, 165, 250, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(96, 165, 250, 0.3)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 20,
    gap: 10,
  },
  hpMpInfoText: {
    flex: 1,
    fontSize: 13,
    color: '#93C5FD',
    lineHeight: 18,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 12,
    marginTop: 8,
  },
  statInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  statInputContainer: {
    flex: 1,
  },
  statInputLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  statInput: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  statInputDivider: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
  // Stat edit/delete styles
  customStatRowPressed: {
    opacity: 0.7,
    backgroundColor: theme.colors.cardBorder,
  },
  longPressHint: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    opacity: 0.6,
  },
  actionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionModalContent: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    padding: 24,
    width: '80%',
    maxWidth: 320,
    alignItems: 'center',
  },
  actionModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 4,
  },
  actionModalSubtitle: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    marginBottom: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    gap: 12,
  },
  deleteActionButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelActionButton: {
    paddingVertical: 12,
    marginTop: 8,
  },
  cancelActionButtonText: {
    fontSize: 16,
    color: theme.colors.textSecondary,
  },
  statValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    gap: 12,
  },
  statValueInput: {
    flex: 1,
  },
  statValueLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
    marginBottom: 4,
    textAlign: 'center',
  },
  statValueField: {
    backgroundColor: theme.colors.background,
    borderRadius: 12,
    padding: 12,
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  statValueDivider: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    marginTop: 16,
  },
  // ============ LAYOUT-SPECIFIC STYLES ============
  // Dashboard layout
  dashboardContainer: {
    marginBottom: 20,
  },
  dashboardRow: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  dashboardMetric: {
    alignItems: 'center',
    flex: 1,
  },
  dashboardValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginVertical: 4,
  },
  dashboardLabel: {
    fontSize: 11,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
  },
  dashboardIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
  },
  dashboardDivider: {
    width: 1,
    height: 50,
    backgroundColor: theme.colors.cardBorder,
  },
  // Minimal layout
  minimalProfileContainer: {
    marginBottom: 16,
  },
  minimalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  minimalLevelBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    overflow: 'hidden',
  },
  minimalCurrencies: {
    flexDirection: 'row',
    gap: 16,
  },
  minimalCurrency: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  minimalCurrencyText: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
  },
  minimalIcon: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  // Gaming HUD layout
  hudContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    gap: 16,
  },
  hudLeftPanel: {
    alignItems: 'center',
  },
  hudAvatar: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: theme.colors.primary,
  },
  hudAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 6,
  },
  hudLevelBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: -12,
  },
  hudLevelText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  hudRightPanel: {
    flex: 1,
    justifyContent: 'center',
    gap: 8,
  },
  hudCurrencyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 8,
  },
  hudIcon: {
    width: 20,
    height: 20,
    borderRadius: 4,
  },
  hudCurrencyValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  // Profile Card layout
  profileCardContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  profileCardAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: theme.colors.cardBackground,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: theme.colors.primary,
    marginBottom: 8,
    position: 'relative',
  },
  profileCardAvatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 56,
  },
  profileCardPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileCardLevelBadge: {
    position: 'absolute',
    bottom: -8,
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  profileCardLevelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileCardName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 16,
  },
  profileCardCurrencies: {
    flexDirection: 'row',
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 16,
    padding: 16,
    gap: 24,
  },
  profileCardCurrency: {
    alignItems: 'center',
    flex: 1,
  },
  profileCardIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    marginBottom: 4,
  },
  profileCardCurrencyValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  profileCardCurrencyLabel: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  profileCardDivider: {
    width: 1,
    height: '100%',
    backgroundColor: theme.colors.cardBorder,
  },
  // Character Sheet layout
  sheetContainer: {
    marginBottom: 20,
  },
  sheetRow: {
    flexDirection: 'row',
    gap: 12,
  },
  sheetBox: {
    flex: 1,
    backgroundColor: theme.colors.cardBackground,
    borderWidth: 2,
    borderColor: theme.colors.cardBorder,
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
  },
  sheetBoxLabel: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    letterSpacing: 1,
    marginBottom: 4,
  },
  sheetBoxValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  sheetBoxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  sheetIcon: {
    width: 18,
    height: 18,
    borderRadius: 4,
  },
  // Retro Pixel layout
  retroContainer: {
    marginBottom: 20,
    backgroundColor: '#000',
    borderWidth: 4,
    borderColor: theme.colors.primary,
    padding: 12,
  },
  retroRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  retroItem: {
    alignItems: 'center',
  },
  retroLabel: {
    fontSize: 12,
    fontWeight: 'bold',
    color: theme.colors.textSecondary,
    fontFamily: 'monospace',
  },
  retroValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.primary,
    fontFamily: 'monospace',
  },
  // Stats layouts
  statsHeaderMinimal: {
    marginBottom: 8,
  },
  statsTitleMinimal: {
    fontSize: 14,
  },
  // Grid stats
  statsGridContainer: {
    gap: 12,
  },
  statsGridRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statsGridItem: {
    backgroundColor: theme.colors.cardBackground,
    borderRadius: 12,
    padding: 12,
    minWidth: 0,
  },
  gridStatName: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 8,
  },
  gridStatBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  gridStatFill: {
    height: '100%',
    borderRadius: 4,
  },
  gridStatValue: {
    fontSize: 10,
    color: theme.colors.textSecondary,
    textAlign: 'right',
  },
  // List stats
  statsListContainer: {
    gap: 8,
  },
  statsListItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  listStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  listStatName: {
    fontSize: 14,
    fontWeight: '600',
  },
  listStatValue: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  listStatBar: {
    height: 4,
    backgroundColor: theme.colors.statBarBg,
    borderRadius: 2,
    overflow: 'hidden',
  },
  listStatFill: {
    height: '100%',
    borderRadius: 2,
  },
  // Bars stats
  statsBarsContainer: {
    gap: 16,
  },
  barsStatItem: {
    
  },
  barsStatLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 8,
  },
  barsStatDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  barsStatName: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: theme.colors.text,
  },
  barsStatValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  barsStatBarContainer: {
    
  },
  barsStatBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barsStatFill: {
    height: '100%',
    borderRadius: 6,
  },
});