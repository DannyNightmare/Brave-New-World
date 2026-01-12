import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SwirlingBackgroundProps {
  intensity?: 'subtle' | 'medium' | 'strong';
  style?: any;
  color?: string; // Primary theme color
}

// Helper to convert hex to rgba
const hexToRgba = (hex: string, alpha: number): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(139, 92, 246, ${alpha})`; // Default purple
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const SwirlingBackground: React.FC<SwirlingBackgroundProps> = ({ 
  intensity = 'medium',
  style,
  color = '#8B5CF6' // Default purple
}) => {
  // Generate themed colors based on input color
  const themeColors = useMemo(() => ({
    primary: color,
    primaryFaded1: hexToRgba(color, 0.15),
    primaryFaded2: hexToRgba(color, 0.1),
    primaryFaded3: hexToRgba(color, 0.08),
    primaryFaded4: hexToRgba(color, 0.2),
    primaryFaded5: hexToRgba(color, 0.18),
    primaryFaded6: hexToRgba(color, 0.12),
    primaryGlow: hexToRgba(color, 0.3),
    primaryGlowFaded: hexToRgba(color, 0.15),
  }), [color]);

  // Animation values for multiple rotating layers
  const rotate1 = useSharedValue(0);
  const rotate2 = useSharedValue(0);
  const rotate3 = useSharedValue(0);
  const rotate4 = useSharedValue(0);
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const opacity1 = useSharedValue(0.3);
  const opacity2 = useSharedValue(0.4);

  useEffect(() => {
    // Layer 1 - Slow clockwise rotation
    rotate1.value = withRepeat(
      withTiming(360, {
        duration: 40000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Layer 2 - Medium counter-clockwise rotation
    rotate2.value = withRepeat(
      withTiming(-360, {
        duration: 30000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Layer 3 - Fast clockwise rotation
    rotate3.value = withRepeat(
      withTiming(360, {
        duration: 25000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Layer 4 - Very slow counter-clockwise
    rotate4.value = withRepeat(
      withTiming(-360, {
        duration: 50000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Pulsing scale animation
    scale1.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 3000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    scale2.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        withTiming(1.15, { duration: 4000, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    // Pulsing opacity
    opacity1.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 2500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.3, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );

    opacity2.value = withRepeat(
      withSequence(
        withTiming(0.4, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
        withTiming(0.6, { duration: 3500, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle1 = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotate1.value}deg` },
      { scale: scale1.value },
    ],
    opacity: opacity1.value,
  }));

  const animatedStyle2 = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotate2.value}deg` },
      { scale: scale2.value },
    ],
    opacity: opacity2.value,
  }));

  const animatedStyle3 = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotate3.value}deg` },
      { scale: scale1.value * 0.9 },
    ],
    opacity: opacity1.value * 0.8,
  }));

  const animatedStyle4 = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rotate4.value}deg` },
      { scale: scale2.value * 1.1 },
    ],
    opacity: opacity2.value * 0.6,
  }));

  const getSize = () => {
    switch (intensity) {
      case 'subtle':
        return { width: width * 1.2, height: width * 1.2 };
      case 'strong':
        return { width: width * 2, height: width * 2 };
      default:
        return { width: width * 1.5, height: width * 1.5 };
    }
  };

  const size = getSize();

  return (
    <View style={[styles.container, style]}>
      {/* Base gradient background */}
      <LinearGradient
        colors={['#0B0D17', '#1A1D2E', '#13151F', '#0B0D17']}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Swirling layer 1 - Outermost */}
      <Animated.View style={[styles.circle, animatedStyle1, size]}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.15)', 'rgba(6, 182, 212, 0.1)', 'transparent', 'transparent']}
          style={styles.gradientCircle}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
      </Animated.View>

      {/* Swirling layer 2 */}
      <Animated.View style={[styles.circle, animatedStyle2, size]}>
        <LinearGradient
          colors={['transparent', 'rgba(34, 211, 238, 0.12)', 'rgba(139, 92, 246, 0.08)', 'transparent']}
          style={styles.gradientCircle}
          start={{ x: 1, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>

      {/* Swirling layer 3 */}
      <Animated.View style={[styles.circle, animatedStyle3, { width: size.width * 0.8, height: size.height * 0.8 }]}>
        <LinearGradient
          colors={['rgba(124, 58, 237, 0.2)', 'transparent', 'rgba(6, 182, 212, 0.15)', 'transparent']}
          style={styles.gradientCircle}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
      </Animated.View>

      {/* Swirling layer 4 - Innermost */}
      <Animated.View style={[styles.circle, animatedStyle4, { width: size.width * 0.6, height: size.height * 0.6 }]}>
        <LinearGradient
          colors={['transparent', 'rgba(167, 139, 250, 0.18)', 'transparent', 'rgba(34, 211, 238, 0.12)']}
          style={styles.gradientCircle}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
        />
      </Animated.View>

      {/* Center glow */}
      <View style={styles.centerGlow}>
        <LinearGradient
          colors={['rgba(139, 92, 246, 0.3)', 'rgba(124, 58, 237, 0.15)', 'transparent']}
          style={styles.glowCircle}
          start={{ x: 0.5, y: 0.5 }}
          end={{ x: 1, y: 1 }}
        />
      </View>

      {/* Subtle particle effects */}
      <View style={styles.particles}>
        {[...Array(12)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.particle,
              {
                left: `${(i * 30 + 10) % 100}%`,
                top: `${(i * 40 + 20) % 100}%`,
                opacity: 0.1 + (i * 0.03),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    backgroundColor: '#0B0D17',
  },
  circle: {
    position: 'absolute',
    borderRadius: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradientCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  centerGlow: {
    position: 'absolute',
    width: width * 0.4,
    height: width * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glowCircle: {
    width: '100%',
    height: '100%',
    borderRadius: 9999,
  },
  particles: {
    ...StyleSheet.absoluteFillObject,
  },
  particle: {
    position: 'absolute',
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#8B5CF6',
  },
});
