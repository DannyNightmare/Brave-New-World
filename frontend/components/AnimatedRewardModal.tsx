import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Dimensions, ScrollView } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  withDelay,
  withSequence,
  withRepeat,
  Easing,
  interpolate,
  runOnJS
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useCustomization, StatusTheme } from '../contexts/CustomizationContext';

const { height: SCREEN_HEIGHT, width: SCREEN_WIDTH } = Dimensions.get('window');

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
  const { statusTheme, popupStyle } = useCustomization();
  
  // Main container animations
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const slideY = useSharedValue(50);
  const rotation = useSharedValue(0);
  
  // Flash/burst effect animations
  const flashOpacity = useSharedValue(0);
  const burstScale = useSharedValue(0);
  const burstOpacity = useSharedValue(0);
  
  // Ring/ripple animations
  const ring1Scale = useSharedValue(0);
  const ring1Opacity = useSharedValue(0);
  const ring2Scale = useSharedValue(0);
  const ring2Opacity = useSharedValue(0);
  const ring3Scale = useSharedValue(0);
  const ring3Opacity = useSharedValue(0);
  
  // Sparkle animations
  const sparkleRotation = useSharedValue(0);
  const sparkleOpacity = useSharedValue(0);

  // Get popup-style specific title
  const getThemeTitle = () => {
    switch (popupStyle.id) {
      case 'sao-system': return '《QUEST CLEARED》';
      case 'shield-hero': return '— QUEST COMPLETE —';
      case 'solo-leveling': return '[QUEST CLEARED]';
      case 'demon-slayer': return '— MISSION SUCCESS —';
      case 'my-hero': return 'PLUS ULTRA!';
      case 'attack-titan': return 'MISSION REPORT';
      case 'dragon-ball': return 'POWER LEVEL UP!';
      case 'naruto-scroll': return '任務完了';
      case 'one-punch': return 'RANK UPDATE';
      case 'jujutsu-kaisen': return '— EXORCISM COMPLETE —';
      case 'overlord': return '【VICTORY】';
      case 're-zero': return '— CHECKPOINT —';
      case 'konosuba': return '☆ QUEST COMPLETE ☆';
      case 'goblin-slayer': return 'QUEST REPORT';
      default: return 'Quest Complete!';
    }
  };

  // Get popup-style specific button text
  const getButtonText = () => {
    switch (popupStyle.id) {
      case 'sao-system': return '《OK》';
      case 'shield-hero': return 'Continue';
      case 'solo-leveling': return '[CONFIRM]';
      case 'demon-slayer': return 'Proceed';
      case 'my-hero': return 'GO BEYOND!';
      case 'attack-titan': return 'Acknowledged';
      case 'dragon-ball': return 'ALRIGHT!';
      case 'naruto-scroll': return '了解';
      case 'one-punch': return 'OK';
      case 'jujutsu-kaisen': return 'Confirm';
      case 'overlord': return 'Understood';
      case 're-zero': return 'Continue';
      case 'konosuba': return 'Yay!';
      case 'goblin-slayer': return 'Next';
      default: return 'Accept';
    }
  };

  useEffect(() => {
    if (visible) {
      // Reset all animation values
      scale.value = 0;
      opacity.value = 0;
      slideY.value = 50;
      rotation.value = -5;
      flashOpacity.value = 0;
      burstScale.value = 0;
      burstOpacity.value = 0;
      ring1Scale.value = 0.5;
      ring1Opacity.value = 0;
      ring2Scale.value = 0.5;
      ring2Opacity.value = 0;
      ring3Scale.value = 0.5;
      ring3Opacity.value = 0;
      sparkleRotation.value = 0;
      sparkleOpacity.value = 0;
      
      // Step 1: Flash effect (bright burst)
      flashOpacity.value = withSequence(
        withTiming(0.8, { duration: 100 }),
        withTiming(0, { duration: 300 })
      );
      
      // Step 2: Burst/explosion effect
      burstOpacity.value = withSequence(
        withTiming(1, { duration: 100 }),
        withDelay(200, withTiming(0, { duration: 400 }))
      );
      burstScale.value = withTiming(3, { duration: 600, easing: Easing.out(Easing.cubic) });
      
      // Step 3: Expanding rings (ripple effect)
      ring1Opacity.value = withSequence(
        withDelay(50, withTiming(0.8, { duration: 100 })),
        withDelay(200, withTiming(0, { duration: 400 }))
      );
      ring1Scale.value = withDelay(50, withTiming(2.5, { duration: 600, easing: Easing.out(Easing.cubic) }));
      
      ring2Opacity.value = withSequence(
        withDelay(150, withTiming(0.6, { duration: 100 })),
        withDelay(200, withTiming(0, { duration: 400 }))
      );
      ring2Scale.value = withDelay(150, withTiming(3, { duration: 700, easing: Easing.out(Easing.cubic) }));
      
      ring3Opacity.value = withSequence(
        withDelay(250, withTiming(0.4, { duration: 100 })),
        withDelay(200, withTiming(0, { duration: 400 }))
      );
      ring3Scale.value = withDelay(250, withTiming(3.5, { duration: 800, easing: Easing.out(Easing.cubic) }));
      
      // Step 4: Sparkle rotation
      sparkleOpacity.value = withSequence(
        withDelay(100, withTiming(1, { duration: 200 })),
        withDelay(600, withTiming(0, { duration: 300 }))
      );
      sparkleRotation.value = withDelay(100, withTiming(180, { duration: 800, easing: Easing.out(Easing.cubic) }));
      
      // Step 5: Main modal entrance (with slight bounce and rotation)
      opacity.value = withDelay(150, withTiming(1, { duration: 300 }));
      scale.value = withDelay(150, withSpring(1, {
        damping: 12,
        stiffness: 180,
        mass: 0.8,
      }));
      slideY.value = withDelay(150, withSpring(0, {
        damping: 15,
        stiffness: 100,
      }));
      rotation.value = withDelay(150, withSpring(0, {
        damping: 15,
        stiffness: 120,
      }));
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

  // Dynamic styles based on selected popup style
  const themedStyles = {
    overlay: {
      backgroundColor: popupStyle.styles.overlayColor,
    },
    modalContainer: {
      backgroundColor: popupStyle.styles.backgroundColor,
      borderColor: popupStyle.styles.borderColor,
      borderWidth: popupStyle.styles.borderWidth,
      borderRadius: popupStyle.styles.borderRadius,
    },
    glowEffect: popupStyle.styles.glowEnabled ? {
      shadowColor: popupStyle.styles.glowColor,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: popupStyle.styles.shadowOpacity,
      shadowRadius: 20,
      elevation: 20,
    } : {},
    header: {
      backgroundColor: popupStyle.styles.headerBg,
    },
    title: {
      color: popupStyle.styles.headerTextColor,
    },
    questName: {
      color: popupStyle.styles.headerTextColor,
    },
    divider: {
      backgroundColor: popupStyle.styles.borderColor + '40',
    },
    body: {
      backgroundColor: popupStyle.styles.bodyBg,
    },
    rewardLabel: {
      color: popupStyle.styles.bodyTextColor + 'AA',
    },
    animatedNumber: {
      color: popupStyle.styles.headerTextColor,
    },
    levelUpBanner: {
      backgroundColor: popupStyle.styles.buttonBg + '30',
      borderColor: popupStyle.styles.buttonBg,
    },
    levelUpText: {
      color: popupStyle.styles.buttonBg,
    },
    acceptButton: {
      backgroundColor: popupStyle.styles.buttonBg,
    },
    acceptButtonText: {
      color: popupStyle.styles.buttonTextColor,
    },
    scrollHint: {
      color: popupStyle.styles.bodyTextColor + '80',
    },
    bodyText: {
      color: popupStyle.styles.bodyTextColor,
    },
  };

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, themedStyles.overlay]}>
        <Animated.View style={[
          styles.modalContainer, 
          themedStyles.modalContainer,
          themedStyles.glowEffect,
          containerStyle
        ]}>
          {/* Header */}
          <View style={[styles.header, themedStyles.header]}>
            <Ionicons name="trophy" size={32} color={popupStyle.styles.headerTextColor} />
            <Text style={[styles.title, themedStyles.title]}>{getThemeTitle()}</Text>
          </View>

          {/* Quest Name */}
          <Text style={[styles.questName, themedStyles.questName]}>{questName}</Text>

          <View style={[styles.divider, themedStyles.divider]} />

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
                  <View style={[styles.levelUpBanner, themedStyles.levelUpBanner]}>
                    <Text style={[styles.levelUpText, themedStyles.levelUpText]}>🎉 LEVEL UP! 🎉</Text>
                  </View>
                  <View style={styles.rewardRow}>
                    <Ionicons name="trending-up" size={24} color={popupStyle.styles.buttonBg} />
                    <Text style={[styles.rewardLabel, themedStyles.rewardLabel]}>Level</Text>
                    <View style={styles.rewardValue}>
                      <AnimatedNumber value={rewards.oldLevel!} duration={0} delay={0} />
                      <Ionicons name="arrow-forward" size={16} color={popupStyle.styles.bodyTextColor} style={{ marginHorizontal: 8 }} />
                      <AnimatedNumber value={rewards.newLevel!} duration={1000} delay={200} />
                    </View>
                  </View>
                  <View style={[styles.rowDivider, themedStyles.divider]} />
                </>
              )}

              {/* Gold Reward - Second */}
              {rewards.goldGained && rewards.oldGold !== undefined && rewards.newGold !== undefined && (
                <>
                  <View style={styles.rewardRow}>
                    <Ionicons name="logo-bitcoin" size={24} color="#FCD34D" />
                    <Text style={[styles.rewardLabel, themedStyles.rewardLabel]}>Gold</Text>
                    <View style={styles.rewardValue}>
                      <AnimatedNumber value={rewards.oldGold} duration={0} delay={0} />
                      <Ionicons name="arrow-forward" size={16} color={popupStyle.styles.bodyTextColor} style={{ marginHorizontal: 8 }} />
                      <AnimatedNumber value={rewards.newGold} duration={1000} delay={hasLevelUp ? 400 : 200} />
                    </View>
                  </View>
                  <View style={[styles.rowDivider, themedStyles.divider]} />
                </>
              )}

              {/* XP Reward */}
              {rewards.xp && (
                <>
                  <View style={styles.rewardRow}>
                    <Ionicons name="flash" size={24} color={statusTheme.colors.primary} />
                    <Text style={[styles.rewardLabel, themedStyles.rewardLabel]}>Experience</Text>
                    <View style={styles.rewardValue}>
                      <Text style={[styles.plus, { color: statusTheme.colors.accent }]}>+</Text>
                      <AnimatedNumber value={rewards.xp} duration={800} delay={hasLevelUp ? 600 : 400} />
                      <Text style={[styles.unit, { color: statusTheme.colors.textSecondary }]}>XP</Text>
                    </View>
                  </View>
                  <View style={[styles.rowDivider, themedStyles.divider]} />
                </>
              )}

              {/* AP Gained - if level up */}
              {rewards.apGained && (
                <>
                  <View style={styles.rewardRow}>
                    <Ionicons name="star" size={24} color={statusTheme.colors.apColor} />
                    <Text style={[styles.rewardLabel, themedStyles.rewardLabel]}>Ability Points</Text>
                    <View style={styles.rewardValue}>
                      <Text style={[styles.plus, { color: statusTheme.colors.accent }]}>+</Text>
                      <AnimatedNumber value={rewards.apGained} duration={800} delay={800} />
                    </View>
                  </View>
                  <View style={[styles.rowDivider, themedStyles.divider]} />
                </>
              )}

              {/* Stat Boosts - Each on its own line */}
              {rewards.statBoosts && Object.entries(rewards.statBoosts).map(([stat, value], index) => (
                <React.Fragment key={stat}>
                  <View style={styles.rewardRow}>
                    <Ionicons name="pulse" size={24} color={popupStyle.styles.buttonBg} />
                    <Text style={[styles.rewardLabel, themedStyles.rewardLabel]}>
                      {stat.charAt(0).toUpperCase() + stat.slice(1)}
                    </Text>
                    <View style={styles.rewardValue}>
                      <Text style={[styles.plus, { color: popupStyle.styles.buttonBg }]}>+</Text>
                      <AnimatedNumber value={value} duration={600} delay={1000 + index * 100} />
                    </View>
                  </View>
                  {index < Object.keys(rewards.statBoosts).length - 1 && (
                    <View style={[styles.rowDivider, themedStyles.divider]} />
                  )}
                </React.Fragment>
              ))}

              {/* Item Reward - Last */}
              {rewards.itemReward && (
                <>
                  {rewards.statBoosts && Object.keys(rewards.statBoosts).length > 0 && (
                    <View style={[styles.rowDivider, themedStyles.divider]} />
                  )}
                  <View style={styles.rewardRow}>
                    <Ionicons name="gift" size={24} color={popupStyle.styles.buttonBg} />
                    <Text style={[styles.rewardLabel, themedStyles.rewardLabel]}>Item Reward</Text>
                    <Text style={[styles.itemName, { color: popupStyle.styles.headerTextColor }]}>{rewards.itemReward}</Text>
                  </View>
                </>
              )}
            </View>

            {/* Scroll Hint */}
            <Text style={[styles.scrollHint, themedStyles.scrollHint]}>Scroll down to {getButtonText().toLowerCase()}</Text>

            {/* Accept Button - Inside ScrollView so user can scroll to it */}
            <TouchableOpacity style={[styles.acceptButton, themedStyles.acceptButton]} onPress={onClose}>
              <Ionicons name="checkmark-circle" size={24} color={popupStyle.styles.buttonTextColor} />
              <Text style={[styles.acceptButtonText, themedStyles.acceptButtonText]}>{getButtonText()}</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
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
