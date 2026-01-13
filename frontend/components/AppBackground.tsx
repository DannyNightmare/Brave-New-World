import React, { useMemo } from 'react';
import { View, ImageBackground, StyleSheet, Platform, KeyboardAvoidingView } from 'react-native';
import { useCustomization } from '../contexts/CustomizationContext';

interface AppBackgroundProps {
  children: React.ReactNode;
  style?: any;
}

export const AppBackground: React.FC<AppBackgroundProps> = ({ children, style }) => {
  const { backgroundType, backgroundColor, backgroundImage, statusTheme } = useCustomization();

  // Memoize the background color calculation
  const bgColor = useMemo(() => {
    switch (backgroundType) {
      case 'theme':
        return statusTheme.colors.background;
      case 'color':
        return backgroundColor;
      case 'image':
      case 'gif':
        return 'transparent';
      default:
        return statusTheme.colors.background;
    }
  }, [backgroundType, backgroundColor, statusTheme.colors.background]);

  const hasBackgroundImage = (backgroundType === 'image' || backgroundType === 'gif') && backgroundImage;

  if (hasBackgroundImage) {
    return (
      <ImageBackground 
        source={{ uri: backgroundImage }} 
        style={[styles.container, style]}
        resizeMode="cover"
      >
        <View style={styles.backgroundOverlay}>
          <KeyboardAvoidingView 
            style={styles.keyboardView}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
          >
            {children}
          </KeyboardAvoidingView>
        </View>
      </ImageBackground>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: bgColor }, style]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        {children}
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  keyboardView: {
    flex: 1,
  },
});

export default AppBackground;
