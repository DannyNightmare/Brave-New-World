import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { useCustomization } from '../contexts/CustomizationContext';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface AppBackgroundProps {
  children: React.ReactNode;
}

export const AppBackground: React.FC<AppBackgroundProps> = ({ children }) => {
  const { backgroundType, backgroundColor, backgroundImage, statusTheme } = useCustomization();

  // Determine the background color based on type
  const getBgColor = () => {
    switch (backgroundType) {
      case 'theme':
        return statusTheme.colors.background;
      case 'color':
        return backgroundColor;
      case 'image':
      case 'gif':
        return 'transparent'; // Let the image show through
      default:
        return statusTheme.colors.background;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: getBgColor() }]}>
      {/* Background Image/GIF */}
      {(backgroundType === 'image' || backgroundType === 'gif') && backgroundImage && (
        <Image
          source={{ uri: backgroundImage }}
          style={styles.backgroundImage}
          resizeMode="cover"
        />
      )}
      
      {/* Content */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  backgroundImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT,
    zIndex: 0,
  },
  content: {
    flex: 1,
    zIndex: 1,
  },
});

export default AppBackground;
