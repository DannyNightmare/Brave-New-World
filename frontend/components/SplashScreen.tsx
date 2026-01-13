import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  withRepeat,
  withSpring,
  Easing,
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { useCustomization } from '../contexts/CustomizationContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface SplashScreenProps {
  onAnimationComplete: () => void;
}

// Particle component for floating effects
const Particle = ({ delay, startX, startY, color }: { delay: number; startX: number; startY: number; color: string }) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const scale = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 500 }),
      withTiming(0.3, { duration: 1500 }),
      withTiming(0, { duration: 500 })
    ));
    translateY.value = withDelay(delay, withTiming(-100 - Math.random() * 50, { duration: 2500, easing: Easing.out(Easing.cubic) }));
    translateX.value = withDelay(delay, withTiming((Math.random() - 0.5) * 60, { duration: 2500 }));
    scale.value = withDelay(delay, withSequence(
      withTiming(1, { duration: 500 }),
      withTiming(0.2, { duration: 2000 })
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        styles.particle,
        { left: startX, top: startY, backgroundColor: color },
        animatedStyle,
      ]}
    />
  );
};

// Magic Rune component
const MagicRune = ({ index, totalRunes, color }: { index: number; totalRunes: number; color: string }) => {
  const rotation = useSharedValue(0);
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0);

  const angle = (index / totalRunes) * 2 * Math.PI;
  const radius = 100;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius;

  useEffect(() => {
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 500 }));
    scale.value = withDelay(index * 100, withSpring(1, { damping: 10 }));
    rotation.value = withDelay(index * 100, withRepeat(
      withTiming(360, { duration: 3000, easing: Easing.linear }),
      -1,
      false
    ));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: x },
      { translateY: y },
      { scale: scale.value },
      { rotate: `${rotation.value}deg` },
    ],
  }));

  const runeSymbols = ['◇', '◈', '✧', '⬡', '⬢', '✦', '⟡', '⌘'];

  return (
    <Animated.Text style={[styles.rune, { color }, animatedStyle]}>
      {runeSymbols[index % runeSymbols.length]}
    </Animated.Text>
  );
};

export const SplashScreen: React.FC<SplashScreenProps> = ({ onAnimationComplete }) => {
  const { statusTheme } = useCustomization();
  const primaryColor = statusTheme?.colors?.primary || '#8B5CF6';
  const accentColor = statusTheme?.colors?.accent || '#10B981';
  
  const [typedText, setTypedText] = useState('');
  const [showSubtext, setShowSubtext] = useState(false);
  
  // Animation values
  const circleScale = useSharedValue(0);
  const circleRotation = useSharedValue(0);
  const circleOpacity = useSharedValue(0);
  const innerCircleScale = useSharedValue(0);
  const glowOpacity = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const titleScale = useSharedValue(0.8);
  const fadeOut = useSharedValue(1);

  const fullText = "PROJECT BEYONDER";
  const subText = "Welcome Player";

  useEffect(() => {
    // Start circle animations
    circleOpacity.value = withTiming(1, { duration: 500 });
    circleScale.value = withSpring(1, { damping: 12, stiffness: 100 });
    circleRotation.value = withRepeat(
      withTiming(360, { duration: 8000, easing: Easing.linear }),
      -1,
      false
    );

    // Inner circle
    innerCircleScale.value = withDelay(300, withSpring(1, { damping: 10 }));

    // Glow pulse
    glowOpacity.value = withDelay(500, withRepeat(
      withSequence(
        withTiming(1, { duration: 1000 }),
        withTiming(0.3, { duration: 1000 })
      ),
      -1,
      true
    ));

    // Title animation
    titleOpacity.value = withDelay(800, withTiming(1, { duration: 600 }));
    titleScale.value = withDelay(800, withSpring(1, { damping: 10 }));

    // Typing effect
    let currentIndex = 0;
    const typingInterval = setInterval(() => {
      if (currentIndex <= fullText.length) {
        setTypedText(fullText.slice(0, currentIndex));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setShowSubtext(true);
      }
    }, 100);

    // Fade out and complete
    const timeout = setTimeout(() => {
      fadeOut.value = withTiming(0, { duration: 500 }, (finished) => {
        if (finished) {
          runOnJS(onAnimationComplete)();
        }
      });
    }, 3500);

    return () => {
      clearInterval(typingInterval);
      clearTimeout(timeout);
    };
  }, []);

  // Animated styles
  const outerCircleStyle = useAnimatedStyle(() => ({
    opacity: circleOpacity.value,
    transform: [
      { scale: circleScale.value },
      { rotate: `${circleRotation.value}deg` },
    ],
  }));

  const innerCircleStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: innerCircleScale.value },
      { rotate: `${-circleRotation.value * 0.5}deg` },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ scale: titleScale.value }],
  }));

  const containerStyle = useAnimatedStyle(() => ({
    opacity: fadeOut.value,
  }));

  // Generate particles
  const particles = Array.from({ length: 20 }, (_, i) => ({
    id: i,
    delay: Math.random() * 1000 + 500,
    startX: SCREEN_WIDTH / 2 - 5 + (Math.random() - 0.5) * 150,
    startY: SCREEN_HEIGHT / 2 + 50,
    color: i % 2 === 0 ? primaryColor : accentColor,
  }));

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* Background gradient effect */}
      <View style={styles.backgroundGradient} />
      
      {/* Particles */}
      {particles.map((particle) => (
        <Particle
          key={particle.id}
          delay={particle.delay}
          startX={particle.startX}
          startY={particle.startY}
          color={particle.color}
        />
      ))}

      {/* Magic Circle Container */}
      <View style={styles.circleContainer}>
        {/* Glow effect */}
        <Animated.View style={[styles.glow, { backgroundColor: primaryColor }, glowStyle]} />
        
        {/* Outer magic circle */}
        <Animated.View style={[styles.outerCircle, { borderColor: primaryColor }, outerCircleStyle]}>
          {/* Runes around the circle */}
          {Array.from({ length: 8 }, (_, i) => (
            <MagicRune key={i} index={i} totalRunes={8} color={primaryColor} />
          ))}
        </Animated.View>

        {/* Inner magic circle */}
        <Animated.View style={[styles.innerCircle, { borderColor: accentColor }, innerCircleStyle]}>
          <View style={[styles.centerOrb, { backgroundColor: primaryColor }]}>
            <View style={[styles.centerOrbInner, { backgroundColor: accentColor }]} />
          </View>
        </Animated.View>
      </View>

      {/* Title */}
      <Animated.View style={[styles.titleContainer, titleStyle]}>
        <Text style={[styles.title, { color: primaryColor }]}>{typedText}</Text>
        <View style={styles.cursor} />
      </Animated.View>

      {/* Subtext */}
      {showSubtext && (
        <Animated.Text style={[styles.subtext, { color: accentColor }]}>
          {subText}
        </Animated.Text>
      )}

      {/* Bottom decorative line */}
      <Animated.View style={[styles.bottomLine, { backgroundColor: primaryColor }, glowStyle]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundGradient: {
    position: 'absolute',
    width: SCREEN_WIDTH * 2,
    height: SCREEN_HEIGHT * 2,
    backgroundColor: 'radial-gradient(circle, rgba(139,92,246,0.1) 0%, rgba(10,10,15,1) 70%)',
  },
  circleContainer: {
    width: 250,
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.2,
  },
  outerCircle: {
    position: 'absolute',
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 2,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerCircle: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerOrb: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  centerOrbInner: {
    width: 30,
    height: 30,
    borderRadius: 15,
  },
  rune: {
    position: 'absolute',
    fontSize: 24,
    fontWeight: 'bold',
  },
  particle: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 6,
    textShadowColor: 'rgba(139, 92, 246, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 20,
  },
  cursor: {
    width: 3,
    height: 32,
    backgroundColor: '#8B5CF6',
    marginLeft: 4,
  },
  subtext: {
    fontSize: 14,
    letterSpacing: 4,
    marginTop: 16,
    opacity: 0.8,
  },
  bottomLine: {
    position: 'absolute',
    bottom: 100,
    width: 100,
    height: 2,
    borderRadius: 1,
  },
});

export default SplashScreen;
