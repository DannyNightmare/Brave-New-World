import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';

export default function StatusScreen() {
  const { user, loading } = useUser();
  const { colors } = useTheme();
  const [profileImage, setProfileImage] = useState<string | null>(null);

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
              <Ionicons name="logo-bitcoin" size={40} color="#FCD34D" />
              <Text style={styles.goldAmount}>{user.gold}</Text>
              <Text style={styles.goldLabel}>Gold</Text>
            </View>
          </View>
        </View>

        {/* Stats Card */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Character Stats</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons name="barbell" size={24} color="#EF4444" />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Strength</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{user.strength}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="bulb" size={24} color="#3B82F6" />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Intelligence</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{user.intelligence}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="heart" size={24} color="#10B981" />
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Vitality</Text>
              <Text style={[styles.statValue, { color: colors.text }]}>{user.vitality}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
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
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
});