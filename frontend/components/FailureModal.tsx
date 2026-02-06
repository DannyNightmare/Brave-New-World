import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withSequence,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useCustomization } from '../contexts/CustomizationContext';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface FailedQuest {
  id: string;
  title: string;
  xp_demerit: number;
  gold_demerit: number;
  ap_demerit: number;
  attribute_demerits: { [key: string]: number };
}

interface TotalDemerits {
  xp: number;
  gold: number;
  ap: number;
  attributes: { [key: string]: number };
}

interface FailureModalProps {
  visible: boolean;
  onClose: () => void;
  failedQuests: FailedQuest[];
  totalDemerits: TotalDemerits;
}

export const FailureModal: React.FC<FailureModalProps> = ({
  visible,
  onClose,
  failedQuests,
  totalDemerits,
}) => {
  const { statusTheme, popupStyle } = useCustomization();
  
  // Animation values
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const slideY = useSharedValue(50);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      // Reset animations
      scale.value = 0;
      opacity.value = 0;
      slideY.value = 50;
      shakeX.value = 0;
      
      // Play warning animation - shake effect
      shakeX.value = withSequence(
        withDelay(300, withTiming(-10, { duration: 50 })),
        withTiming(10, { duration: 50 }),
        withTiming(-8, { duration: 50 }),
        withTiming(8, { duration: 50 }),
        withTiming(-5, { duration: 50 }),
        withTiming(5, { duration: 50 }),
        withTiming(0, { duration: 50 })
      );
      
      // Main modal entrance
      opacity.value = withTiming(1, { duration: 300 });
      scale.value = withSpring(1, { damping: 12, stiffness: 180, mass: 0.8 });
      slideY.value = withSpring(0, { damping: 15, stiffness: 100 });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: slideY.value },
      { translateX: shakeX.value },
    ],
    opacity: opacity.value,
  }));

  // Check if there are any demerits to show
  const hasDemerits = totalDemerits.xp > 0 || 
    totalDemerits.gold > 0 || 
    totalDemerits.ap > 0 || 
    Object.keys(totalDemerits.attributes).length > 0;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.modalContainer, containerStyle]}>
          {/* Header - Warning Style */}
          <View style={styles.header}>
            <Ionicons name="warning" size={36} color="#EF4444" />
            <Text style={styles.title}>QUEST FAILURE</Text>
          </View>

          <Text style={styles.subtitle}>
            You missed {failedQuests.length} deadline{failedQuests.length > 1 ? 's' : ''}!
          </Text>

          <View style={styles.divider} />

          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Failed Quests List */}
            <Text style={styles.sectionTitle}>Failed Quests</Text>
            {failedQuests.map((quest, index) => (
              <View key={quest.id} style={styles.questItem}>
                <View style={styles.questHeader}>
                  <Ionicons name="close-circle" size={20} color="#EF4444" />
                  <Text style={styles.questTitle}>{quest.title}</Text>
                </View>
                <View style={styles.questDemerits}>
                  {quest.xp_demerit > 0 && (
                    <View style={styles.demeritBadge}>
                      <Text style={styles.demeritText}>-{quest.xp_demerit} XP</Text>
                    </View>
                  )}
                  {quest.gold_demerit > 0 && (
                    <View style={styles.demeritBadge}>
                      <Text style={styles.demeritText}>-{quest.gold_demerit} Gold</Text>
                    </View>
                  )}
                  {quest.ap_demerit > 0 && (
                    <View style={styles.demeritBadge}>
                      <Text style={styles.demeritText}>-{quest.ap_demerit} AP</Text>
                    </View>
                  )}
                  {quest.attribute_demerits && Object.entries(quest.attribute_demerits).map(([attr, value]) => (
                    <View key={attr} style={styles.demeritBadge}>
                      <Text style={styles.demeritText}>-{value} {attr}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ))}

            {/* Total Demerits Summary */}
            {hasDemerits && (
              <>
                <View style={styles.totalDivider} />
                <Text style={styles.sectionTitle}>Total Penalties</Text>
                <View style={styles.totalContainer}>
                  {totalDemerits.xp > 0 && (
                    <View style={styles.totalRow}>
                      <Ionicons name="flash" size={24} color="#EF4444" />
                      <Text style={styles.totalLabel}>Experience Lost</Text>
                      <Text style={styles.totalValue}>-{totalDemerits.xp} XP</Text>
                    </View>
                  )}
                  {totalDemerits.gold > 0 && (
                    <View style={styles.totalRow}>
                      <Ionicons name="logo-bitcoin" size={24} color="#EF4444" />
                      <Text style={styles.totalLabel}>Gold Lost</Text>
                      <Text style={styles.totalValue}>-{totalDemerits.gold}</Text>
                    </View>
                  )}
                  {totalDemerits.ap > 0 && (
                    <View style={styles.totalRow}>
                      <Ionicons name="star" size={24} color="#EF4444" />
                      <Text style={styles.totalLabel}>AP Lost</Text>
                      <Text style={styles.totalValue}>-{totalDemerits.ap}</Text>
                    </View>
                  )}
                  {Object.entries(totalDemerits.attributes).map(([attr, value]) => (
                    <View key={attr} style={styles.totalRow}>
                      <Ionicons name="trending-down" size={24} color="#EF4444" />
                      <Text style={styles.totalLabel}>{attr} Lost</Text>
                      <Text style={styles.totalValue}>-{value}</Text>
                    </View>
                  ))}
                </View>
              </>
            )}

            {/* Motivational Message */}
            <View style={styles.messageContainer}>
              <Text style={styles.messageText}>
                💪 Don't give up! Complete your quests on time to avoid future penalties.
              </Text>
            </View>

            {/* Dismiss Button */}
            <TouchableOpacity style={styles.dismissButton} onPress={onClose}>
              <Ionicons name="checkmark-circle" size={24} color="#FFF" />
              <Text style={styles.dismissButtonText}>Understood</Text>
            </TouchableOpacity>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    paddingBottom: 16,
    width: '95%',
    maxWidth: 420,
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderWidth: 2,
    borderColor: '#EF4444',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  subtitle: {
    fontSize: 16,
    color: '#F87171',
    textAlign: 'center',
    marginBottom: 16,
  },
  divider: {
    height: 1,
    backgroundColor: '#374151',
    marginBottom: 12,
  },
  scrollContainer: {
    flexGrow: 0,
    flexShrink: 1,
  },
  scrollContent: {
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#D1D5DB',
    marginBottom: 12,
    marginTop: 4,
  },
  questItem: {
    backgroundColor: '#374151',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
  },
  questHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  questTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F9FAFB',
    flex: 1,
  },
  questDemerits: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  demeritBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  demeritText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F87171',
  },
  totalDivider: {
    height: 1,
    backgroundColor: '#4B5563',
    marginVertical: 16,
  },
  totalContainer: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
    padding: 16,
    gap: 12,
    borderWidth: 1,
    borderColor: '#EF444450',
  },
  totalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  totalLabel: {
    flex: 1,
    fontSize: 15,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  messageContainer: {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#8B5CF650',
  },
  messageText: {
    fontSize: 14,
    color: '#C4B5FD',
    textAlign: 'center',
    lineHeight: 20,
  },
  dismissButton: {
    backgroundColor: '#6B7280',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dismissButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
