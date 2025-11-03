import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert, Modal, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function StatusScreen() {
  const { user, loading } = useUser();
  const { colors } = useTheme();
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [goldIcon, setGoldIcon] = useState<string | null>(null);
  const [addStatModalVisible, setAddStatModalVisible] = useState(false);
  const [customStats, setCustomStats] = useState<Array<{id: string, name: string, color: string, value: number, maxValue: number, icon?: string}>>([]);
  const [newStat, setNewStat] = useState({
    name: '',
    color: '#8B5CF6',
    value: 0,
    maxValue: 100,
    icon: '',
  });

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
        setGoldIcon(base64data);
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

  const addCustomStat = () => {
    if (!newStat.name.trim()) {
      Alert.alert('Error', 'Please enter a stat name');
      return;
    }

    const stat = {
      id: Date.now().toString(),
      name: newStat.name,
      color: newStat.color,
      value: newStat.value,
      maxValue: newStat.maxValue,
      icon: newStat.icon,
    };

    setCustomStats([...customStats, stat]);
    setNewStat({ name: '', color: '#8B5CF6', value: 0, maxValue: 100, icon: '' });
    setAddStatModalVisible(false);
    Alert.alert('Success', 'Custom stat added!');
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
              <View style={[styles.xpFill, { width: `${xpPercentage}%` }]} />
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
            {/* Level */}
            <View style={styles.levelContainer}>
              <Text style={styles.levelLabel}>Level</Text>
              <Text style={styles.levelNumber}>{user.level}</Text>
            </View>
            
            {/* Gold */}
            <View style={styles.goldContainer}>
              <TouchableOpacity onPress={pickGoldIcon}>
                {goldIcon ? (
                  <Image source={{ uri: goldIcon }} style={styles.goldIconImage} />
                ) : (
                  <Ionicons name="logo-bitcoin" size={40} color="#FCD34D" />
                )}
              </TouchableOpacity>
              <Text style={styles.goldAmount}>{user.gold}</Text>
              <Text style={styles.goldLabel}>Gold</Text>
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
          const percentage = (stat.value / stat.maxValue) * 100;
          return (
            <View key={stat.id} style={styles.customStatRow}>
              <View style={styles.statNameRow}>
                {stat.icon ? (
                  <Image source={{ uri: stat.icon }} style={styles.statIcon} />
                ) : (
                  <View style={styles.statIconPlaceholder} />
                )}
                <Text style={styles.customStatName}>{stat.name}</Text>
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
                  {stat.value} / {stat.maxValue}
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
    color: '#8B5CF6',
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
    backgroundColor: '#374151',
    borderRadius: 3,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#FCD34D',
    borderRadius: 3,
  },
  xpCounter: {
    fontSize: 12,
    color: '#9CA3AF',
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
    backgroundColor: '#1F2937',
    borderWidth: 3,
    borderColor: '#8B5CF6',
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
    backgroundColor: '#374151',
  },
  profilePlaceholderText: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 4,
  },
  levelGoldSection: {
    alignItems: 'center',
  },
  levelContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  levelLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  levelNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  goldContainer: {
    alignItems: 'center',
  },
  goldAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FCD34D',
    marginTop: 8,
  },
  goldLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  statsTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#8B5CF6',
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
    backgroundColor: '#1F2937',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    gap: 6,
  },
  addStatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  customStatRow: {
    marginBottom: 20,
  },
  customStatName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    marginBottom: 8,
  },
  customStatBarContainer: {
    marginBottom: 4,
  },
  customStatBar: {
    height: 8,
    backgroundColor: '#374151',
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
    color: '#9CA3AF',
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 20,
    textAlign: 'center',
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
  createButton: {
    backgroundColor: '#8B5CF6',
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