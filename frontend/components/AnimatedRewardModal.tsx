import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withDelay,
  Easing,
  runOnJS
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { SwirlingBackground } from './SwirlingBackground';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface RewardModalProps {
  visible: boolean;
  onClose: () => void;
  questName: string;
  rewards: {
    xp?: number;
    oldGold?: number;
    newGold?: number;
    goldGained?: number;
    oldLevel?: number;
    newLevel?: number;
    apGained?: number;
    statBoosts?: { [key: string]: number };
    itemReward?: string;
  };
}

const AnimatedNumber: React.FC<{ value: number; duration?: number; delay?: number }> = ({ 
  value, 
  duration = 1000,
  delay = 0 
}) => {
  // Safety check: if value is NaN, undefined, or null, default to 0
  const safeValue = (value === undefined || value === null || isNaN(value)) ? 0 : value;
  const [displayValue, setDisplayValue] = useState(safeValue);

  useEffect(() => {
    // For immediate display (duration 0), just set the value directly
    if (duration === 0) {
      setDisplayValue(safeValue);
      return;
    }
    
    const timeout = setTimeout(() => {
      const startTime = Date.now();
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function for smooth animation
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const currentValue = Math.floor(easeOutQuart * safeValue);
        
        setDisplayValue(isNaN(currentValue) ? 0 : currentValue);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      animate();
    }, delay);

    return () => clearTimeout(timeout);
  }, [safeValue, duration, delay]);

  return <Text style={styles.animatedNumber}>{displayValue}</Text>;
};

export const AnimatedRewardModal: React.FC<RewardModalProps> = ({
  visible,
  onClose,
  questName,
  rewards
}) => {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const slideY = useSharedValue(50);

  useEffect(() => {
    if (visible) {
      // Reset values
      scale.value = 0;
      opacity.value = 0;
      slideY.value = 50;
      
      // Animate in
      opacity.value = withTiming(1, { duration: 200 });
      scale.value = withSpring(1, {
        damping: 15,
        stiffness: 150,
      });
      slideY.value = withSpring(0, {
        damping: 20,
        stiffness: 90,
      });
    }
  }, [visible]);

  const containerStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: slideY.value }
    ],
    opacity: opacity.value,
  }));

  const hasLevelUp = rewards.newLevel && rewards.oldLevel && rewards.newLevel > rewards.oldLevel;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Swirling Solo Leveling background */}
        <SwirlingBackground intensity="medium" />
        
        <Animated.View style={[styles.modalContainer, containerStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <Ionicons name="trophy" size={32} color="#10B981" />
            <Text style={styles.title}>Quest Complete!</Text>
          </View>

          {/* Quest Name */}
          <Text style={styles.questName}>{questName}</Text>

          <View style={styles.divider} />

          {/* Scrollable Rewards Section */}
          <ScrollView 
            style={styles.scrollContainer}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
          >
            {/* Rewards Section */}
            <View style={styles.rewardsContainer}>
              {/* Level Up - First if applicable */}
              {hasLevelUp && (
                <>
                  <View style={styles.levelUpBanner}>
                    <Text style={styles.levelUpText}>🎉 LEVEL UP! 🎉</Text>
                  </View>
                  <View style={styles.rewardRow}>
                    <Ionicons name="trending-up" size={24} color="#10B981" />
                    <Text style={styles.rewardLabel}>Level</Text>
                    <View style={styles.rewardValue}>
                      <AnimatedNumber value={rewards.oldLevel!} duration={0} delay={0} />
                      <Ionicons name="arrow-forward" size={16} color="#6B7280" style={{ marginHorizontal: 8 }} />
                      <AnimatedNumber value={rewards.newLevel!} duration={1000} delay={200} />
                    </View>
                  </View>
                  <View style={styles.rowDivider} />
                </>
              )}

              {/* Gold Reward - Second */}
              {rewards.goldGained && rewards.oldGold !== undefined && rewards.newGold !== undefined && (
                <>
                  <View style={styles.rewardRow}>
                    <Ionicons name="logo-bitcoin" size={24} color="#F59E0B" />
                    <Text style={styles.rewardLabel}>Gold</Text>
                    <View style={styles.rewardValue}>
                      <AnimatedNumber value={rewards.oldGold} duration={0} delay={0} />
                      <Ionicons name="arrow-forward" size={16} color="#6B7280" style={{ marginHorizontal: 8 }} />
                      <AnimatedNumber value={rewards.newGold} duration={1000} delay={hasLevelUp ? 400 : 200} />
                    </View>
                  </View>
                  <View style={styles.rowDivider} />
                </>
              )}

              {/* XP Reward */}
              {rewards.xp && (
                <>
                  <View style={styles.rewardRow}>
                    <Ionicons name="flash" size={24} color="#8B5CF6" />
                    <Text style={styles.rewardLabel}>Experience</Text>
                    <View style={styles.rewardValue}>
                      <Text style={styles.plus}>+</Text>
                      <AnimatedNumber value={rewards.xp} duration={800} delay={hasLevelUp ? 600 : 400} />
                      <Text style={styles.unit}>XP</Text>
                    </View>
                  </View>
                  <View style={styles.rowDivider} />
                </>
              )}

              {/* AP Gained - if level up */}
              {rewards.apGained && (
                <>
                  <View style={styles.rewardRow}>
                    <Ionicons name="star" size={24} color="#F59E0B" />
                    <Text style={styles.rewardLabel}>Ability Points</Text>
                    <View style={styles.rewardValue}>
                      <Text style={styles.plus}>+</Text>
                      <AnimatedNumber value={rewards.apGained} duration={800} delay={800} />
                    </View>
                  </View>
                  <View style={styles.rowDivider} />
                </>
              )}

              {/* Stat Boosts - Each on its own line */}
              {rewards.statBoosts && Object.entries(rewards.statBoosts).map(([stat, value], index) => (
                <React.Fragment key={stat}>
                  <View style={styles.rewardRow}>
                    <Ionicons name="pulse" size={24} color="#3B82F6" />
                    <Text style={styles.rewardLabel}>
                      {stat.charAt(0).toUpperCase() + stat.slice(1)}
                    </Text>
                    <View style={styles.rewardValue}>
                      <Text style={styles.plus}>+</Text>
                      <AnimatedNumber value={value} duration={600} delay={1000 + index * 100} />
                    </View>
                  </View>
                  {index < Object.keys(rewards.statBoosts).length - 1 && (
                    <View style={styles.rowDivider} />
                  )}
                </React.Fragment>
              ))}

              {/* Item Reward - Last */}
              {rewards.itemReward && (
                <>
                  {rewards.statBoosts && Object.keys(rewards.statBoosts).length > 0 && (
                    <View style={styles.rowDivider} />
                  )}
                  <View style={styles.rewardRow}>
                    <Ionicons name="gift" size={24} color="#EC4899" />
                    <Text style={styles.rewardLabel}>Item Reward</Text>
                    <Text style={styles.itemName}>{rewards.itemReward}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Scroll Hint */}
            <Text style={styles.scrollHint}>Scroll down to accept</Text>

            {/* Accept Button - Inside ScrollView so user can scroll to it */}
            <TouchableOpacity style={styles.acceptButton} onPress={onClose}>
              <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>Accept</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: '#1F2937',
    borderRadius: 20,
    padding: 24,
    paddingBottom: 16,
    width: '90%',
    maxWidth: 400,
    maxHeight: SCREEN_HEIGHT * 0.8,
    borderWidth: 2,
    borderColor: '#374151',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
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
    color: '#FFFFFF',
  },
  questName: {
    fontSize: 18,
    color: '#10B981',
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
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
  rewardsContainer: {
    gap: 8,
  },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 12,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#374151',
    marginVertical: 2,
  },
  rewardLabel: {
    flex: 1,
    fontSize: 16,
    color: '#D1D5DB',
    fontWeight: '500',
  },
  rewardValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  animatedNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    minWidth: 30,
    textAlign: 'center',
  },
  plus: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
    marginRight: 4,
  },
  unit: {
    fontSize: 14,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  levelUpBanner: {
    alignItems: 'center',
    backgroundColor: '#065F46',
    borderRadius: 8,
    paddingVertical: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  levelUpText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#10B981',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EC4899',
  },
  scrollHint: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
    fontStyle: 'italic',
  },
  acceptButton: {
    backgroundColor: '#10B981',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  acceptButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
