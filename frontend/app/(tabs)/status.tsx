import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { Ionicons } from '@expo/vector-icons';

export default function StatusScreen() {
  const { user, loading } = useUser();

  if (loading || !user) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#8B5CF6" />
        </View>
      </SafeAreaView>
    );
  }

  const xpForNextLevel = user.level * 100;
  const xpPercentage = (user.xp / xpForNextLevel) * 100;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Level Card */}
        <View style={styles.card}>
          <View style={styles.levelHeader}>
            <Text style={styles.levelText}>Level {user.level}</Text>
            <View style={styles.goldContainer}>
              <Ionicons name="logo-bitcoin" size={20} color="#FCD34D" />
              <Text style={styles.goldText}>{user.gold}</Text>
            </View>
          </View>
          
          <View style={styles.xpContainer}>
            <Text style={styles.xpLabel}>XP: {user.xp} / {xpForNextLevel}</Text>
            <View style={styles.xpBar}>
              <View style={[styles.xpFill, { width: `${xpPercentage}%` }]} />
            </View>
          </View>
        </View>

        {/* Stats Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Character Stats</Text>
          
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <Ionicons name="barbell" size={24} color="#EF4444" />
              <Text style={styles.statLabel}>Strength</Text>
              <Text style={styles.statValue}>{user.strength}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="bulb" size={24} color="#3B82F6" />
              <Text style={styles.statLabel}>Intelligence</Text>
              <Text style={styles.statValue}>{user.intelligence}</Text>
            </View>
            
            <View style={styles.statItem}>
              <Ionicons name="heart" size={24} color="#10B981" />
              <Text style={styles.statLabel}>Vitality</Text>
              <Text style={styles.statValue}>{user.vitality}</Text>
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
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginBottom: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#9CA3AF',
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#1F2937',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#374151',
  },
  levelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  levelText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#8B5CF6',
  },
  goldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#374151',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  goldText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FCD34D',
    marginLeft: 6,
  },
  xpContainer: {
    marginTop: 8,
  },
  xpLabel: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 8,
  },
  xpBar: {
    height: 12,
    backgroundColor: '#374151',
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
    backgroundColor: '#8B5CF6',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#F9FAFB',
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
    color: '#9CA3AF',
    marginTop: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#F9FAFB',
    marginTop: 4,
  },
});