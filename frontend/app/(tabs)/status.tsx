import React from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUser } from '../../contexts/UserContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';

export default function StatusScreen() {
  const { user, loading } = useUser();
  const { colors } = useTheme();

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Level Card */}
        <View style={[styles.card, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
          <View style={styles.levelHeader}>
            <Text style={[styles.levelText, { color: colors.primary }]}>Level {user.level}</Text>
            <View style={[styles.goldContainer, { backgroundColor: colors.border }]}>
              <Ionicons name="logo-bitcoin" size={20} color="#FCD34D" />
              <Text style={styles.goldText}>{user.gold}</Text>
            </View>
          </View>
          
          <View style={styles.xpContainer}>
            <Text style={[styles.xpLabel, { color: colors.textSecondary }]}>XP: {user.xp} / {xpForNextLevel}</Text>
            <View style={[styles.xpBar, { backgroundColor: colors.border }]}>
              <View style={[styles.xpFill, { width: `${xpPercentage}%`, backgroundColor: colors.primary }]} />
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
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 24,
  },
  card: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
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
  },
  goldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginBottom: 8,
  },
  xpBar: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpFill: {
    height: '100%',
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