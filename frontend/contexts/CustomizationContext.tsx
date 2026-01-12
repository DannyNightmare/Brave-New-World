import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Status Display Theme definitions
export interface StatusTheme {
  id: string;
  name: string;
  description: string;
  anime?: string;
  colors: {
    background: string;
    cardBackground: string;
    cardBorder: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
    xpBarBg: string;
    xpBarFill: string;
    statBarBg: string;
    statBarFill: string;
    levelBadgeBg: string;
    levelBadgeText: string;
    goldColor: string;
    apColor: string;
  };
  effects: {
    glowEnabled: boolean;
    glowColor?: string;
    borderStyle: 'solid' | 'double' | 'glow' | 'none';
    cornerStyle: 'rounded' | 'sharp' | 'hexagonal' | 'clipped';
  };
  fonts: {
    headerStyle: 'bold' | 'light' | 'futuristic' | 'fantasy';
  };
}

// Predefined themes inspired by various anime status screens
export const STATUS_THEMES: StatusTheme[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Your current custom design',
    colors: {
      background: '#111827',
      cardBackground: '#1F2937',
      cardBorder: '#374151',
      primary: '#8B5CF6',
      secondary: '#6366F1',
      accent: '#10B981',
      text: '#F9FAFB',
      textSecondary: '#9CA3AF',
      xpBarBg: 'rgba(139, 92, 246, 0.2)',
      xpBarFill: '#8B5CF6',
      statBarBg: 'rgba(255, 255, 255, 0.1)',
      statBarFill: '#3B82F6',
      levelBadgeBg: '#8B5CF6',
      levelBadgeText: '#FFFFFF',
      goldColor: '#F59E0B',
      apColor: '#8B5CF6',
    },
    effects: {
      glowEnabled: false,
      borderStyle: 'solid',
      cornerStyle: 'rounded',
    },
    fonts: {
      headerStyle: 'bold',
    },
  },
  {
    id: 'solo-leveling',
    name: 'Shadow Monarch',
    description: 'Dark blue interface with glowing effects',
    anime: 'Solo Leveling',
    colors: {
      background: '#0a0e1a',
      cardBackground: '#0f172a',
      cardBorder: '#1e3a5f',
      primary: '#3b82f6',
      secondary: '#1d4ed8',
      accent: '#06b6d4',
      text: '#e2e8f0',
      textSecondary: '#64748b',
      xpBarBg: 'rgba(59, 130, 246, 0.15)',
      xpBarFill: '#3b82f6',
      statBarBg: 'rgba(6, 182, 212, 0.15)',
      statBarFill: '#06b6d4',
      levelBadgeBg: '#1d4ed8',
      levelBadgeText: '#e2e8f0',
      goldColor: '#fbbf24',
      apColor: '#3b82f6',
    },
    effects: {
      glowEnabled: true,
      glowColor: '#3b82f6',
      borderStyle: 'glow',
      cornerStyle: 'sharp',
    },
    fonts: {
      headerStyle: 'futuristic',
    },
  },
  {
    id: 'sword-art',
    name: 'Aincrad',
    description: 'Clean white and orange gaming UI',
    anime: 'Sword Art Online',
    colors: {
      background: '#1a1a2e',
      cardBackground: '#16213e',
      cardBorder: '#e94560',
      primary: '#e94560',
      secondary: '#ff6b6b',
      accent: '#feca57',
      text: '#ffffff',
      textSecondary: '#a0a0a0',
      xpBarBg: 'rgba(233, 69, 96, 0.2)',
      xpBarFill: '#e94560',
      statBarBg: 'rgba(254, 202, 87, 0.15)',
      statBarFill: '#feca57',
      levelBadgeBg: '#e94560',
      levelBadgeText: '#ffffff',
      goldColor: '#feca57',
      apColor: '#ff6b6b',
    },
    effects: {
      glowEnabled: true,
      glowColor: '#e94560',
      borderStyle: 'double',
      cornerStyle: 'clipped',
    },
    fonts: {
      headerStyle: 'futuristic',
    },
  },
  {
    id: 'slime',
    name: 'Great Sage',
    description: 'Elegant blue holographic display',
    anime: 'That Time I Got Reincarnated as a Slime',
    colors: {
      background: '#0c1929',
      cardBackground: '#0f2744',
      cardBorder: '#2dd4bf',
      primary: '#2dd4bf',
      secondary: '#14b8a6',
      accent: '#a78bfa',
      text: '#f0fdfa',
      textSecondary: '#5eead4',
      xpBarBg: 'rgba(45, 212, 191, 0.15)',
      xpBarFill: '#2dd4bf',
      statBarBg: 'rgba(167, 139, 250, 0.15)',
      statBarFill: '#a78bfa',
      levelBadgeBg: '#0d9488',
      levelBadgeText: '#f0fdfa',
      goldColor: '#fbbf24',
      apColor: '#2dd4bf',
    },
    effects: {
      glowEnabled: true,
      glowColor: '#2dd4bf',
      borderStyle: 'glow',
      cornerStyle: 'rounded',
    },
    fonts: {
      headerStyle: 'light',
    },
  },
  {
    id: 'overlord',
    name: 'Nazarick',
    description: 'Dark gothic with gold accents',
    anime: 'Overlord',
    colors: {
      background: '#0d0d0d',
      cardBackground: '#1a1a1a',
      cardBorder: '#d4af37',
      primary: '#d4af37',
      secondary: '#b8860b',
      accent: '#8b0000',
      text: '#f5f5dc',
      textSecondary: '#808080',
      xpBarBg: 'rgba(212, 175, 55, 0.15)',
      xpBarFill: '#d4af37',
      statBarBg: 'rgba(139, 0, 0, 0.2)',
      statBarFill: '#8b0000',
      levelBadgeBg: '#8b0000',
      levelBadgeText: '#d4af37',
      goldColor: '#d4af37',
      apColor: '#8b0000',
    },
    effects: {
      glowEnabled: true,
      glowColor: '#d4af37',
      borderStyle: 'double',
      cornerStyle: 'sharp',
    },
    fonts: {
      headerStyle: 'fantasy',
    },
  },
  {
    id: 'shield-hero',
    name: 'Cardinal',
    description: 'Green and amber RPG interface',
    anime: 'Rising of the Shield Hero',
    colors: {
      background: '#1a2f1a',
      cardBackground: '#1e3a1e',
      cardBorder: '#4ade80',
      primary: '#4ade80',
      secondary: '#22c55e',
      accent: '#fbbf24',
      text: '#ecfdf5',
      textSecondary: '#86efac',
      xpBarBg: 'rgba(74, 222, 128, 0.15)',
      xpBarFill: '#4ade80',
      statBarBg: 'rgba(251, 191, 36, 0.15)',
      statBarFill: '#fbbf24',
      levelBadgeBg: '#15803d',
      levelBadgeText: '#ecfdf5',
      goldColor: '#fbbf24',
      apColor: '#4ade80',
    },
    effects: {
      glowEnabled: false,
      borderStyle: 'solid',
      cornerStyle: 'rounded',
    },
    fonts: {
      headerStyle: 'fantasy',
    },
  },
  {
    id: 'demon-slayer',
    name: 'Hashira',
    description: 'Traditional Japanese style with vibrant colors',
    anime: 'Demon Slayer',
    colors: {
      background: '#1c1c1c',
      cardBackground: '#2d2d2d',
      cardBorder: '#ff6b9d',
      primary: '#ff6b9d',
      secondary: '#c084fc',
      accent: '#38bdf8',
      text: '#fafafa',
      textSecondary: '#a1a1aa',
      xpBarBg: 'rgba(255, 107, 157, 0.2)',
      xpBarFill: '#ff6b9d',
      statBarBg: 'rgba(56, 189, 248, 0.15)',
      statBarFill: '#38bdf8',
      levelBadgeBg: '#be185d',
      levelBadgeText: '#fafafa',
      goldColor: '#fbbf24',
      apColor: '#c084fc',
    },
    effects: {
      glowEnabled: true,
      glowColor: '#ff6b9d',
      borderStyle: 'solid',
      cornerStyle: 'rounded',
    },
    fonts: {
      headerStyle: 'bold',
    },
  },
  {
    id: 'jujutsu',
    name: 'Cursed Energy',
    description: 'Dark purple with cursed energy vibes',
    anime: 'Jujutsu Kaisen',
    colors: {
      background: '#0f0a19',
      cardBackground: '#1a1025',
      cardBorder: '#7c3aed',
      primary: '#7c3aed',
      secondary: '#a855f7',
      accent: '#f43f5e',
      text: '#f5f3ff',
      textSecondary: '#a78bfa',
      xpBarBg: 'rgba(124, 58, 237, 0.2)',
      xpBarFill: '#7c3aed',
      statBarBg: 'rgba(244, 63, 94, 0.15)',
      statBarFill: '#f43f5e',
      levelBadgeBg: '#5b21b6',
      levelBadgeText: '#f5f3ff',
      goldColor: '#fbbf24',
      apColor: '#a855f7',
    },
    effects: {
      glowEnabled: true,
      glowColor: '#7c3aed',
      borderStyle: 'glow',
      cornerStyle: 'hexagonal',
    },
    fonts: {
      headerStyle: 'bold',
    },
  },
  {
    id: 'cyberpunk',
    name: 'Night City',
    description: 'Neon cyberpunk aesthetic',
    anime: 'Cyberpunk: Edgerunners',
    colors: {
      background: '#0a0a0f',
      cardBackground: '#12121a',
      cardBorder: '#00ffff',
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#ffff00',
      text: '#ffffff',
      textSecondary: '#00ffff',
      xpBarBg: 'rgba(0, 255, 255, 0.15)',
      xpBarFill: '#00ffff',
      statBarBg: 'rgba(255, 0, 255, 0.15)',
      statBarFill: '#ff00ff',
      levelBadgeBg: '#ff00ff',
      levelBadgeText: '#ffffff',
      goldColor: '#ffff00',
      apColor: '#00ffff',
    },
    effects: {
      glowEnabled: true,
      glowColor: '#00ffff',
      borderStyle: 'glow',
      cornerStyle: 'clipped',
    },
    fonts: {
      headerStyle: 'futuristic',
    },
  },
  {
    id: 'dragon-ball',
    name: 'Scouter',
    description: 'Orange and blue power level display',
    anime: 'Dragon Ball Z',
    colors: {
      background: '#0f1419',
      cardBackground: '#1a2634',
      cardBorder: '#f97316',
      primary: '#f97316',
      secondary: '#fb923c',
      accent: '#3b82f6',
      text: '#fff7ed',
      textSecondary: '#fdba74',
      xpBarBg: 'rgba(249, 115, 22, 0.2)',
      xpBarFill: '#f97316',
      statBarBg: 'rgba(59, 130, 246, 0.15)',
      statBarFill: '#3b82f6',
      levelBadgeBg: '#ea580c',
      levelBadgeText: '#fff7ed',
      goldColor: '#fbbf24',
      apColor: '#f97316',
    },
    effects: {
      glowEnabled: true,
      glowColor: '#f97316',
      borderStyle: 'solid',
      cornerStyle: 'rounded',
    },
    fonts: {
      headerStyle: 'bold',
    },
  },
];

interface CustomizationContextType {
  xpBarColor: string;
  goldIcon: string;
  apIcon: string;
  goldCustomImage: string | null;
  apCustomImage: string | null;
  statusTheme: StatusTheme;
  backgroundType: 'theme' | 'color' | 'image' | 'gif';
  backgroundColor: string;
  backgroundImage: string | null;
  setXpBarColor: (color: string) => void;
  setGoldIcon: (icon: string) => void;
  setApIcon: (icon: string) => void;
  setGoldCustomImage: (image: string | null) => void;
  setApCustomImage: (image: string | null) => void;
  setStatusTheme: (themeId: string) => void;
  setBackgroundType: (type: 'theme' | 'color' | 'image' | 'gif') => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundImage: (image: string | null) => void;
  getThemeById: (id: string) => StatusTheme;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

export const CustomizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [xpBarColor, setXpBarColorState] = useState('#8B5CF6'); // Default purple
  const [goldIcon, setGoldIconState] = useState('logo-bitcoin'); // Default coin
  const [apIcon, setApIconState] = useState('star'); // Default star
  const [goldCustomImage, setGoldCustomImageState] = useState<string | null>(null);
  const [apCustomImage, setApCustomImageState] = useState<string | null>(null);
  const [statusTheme, setStatusThemeState] = useState<StatusTheme>(STATUS_THEMES[0]);
  const [backgroundType, setBackgroundTypeState] = useState<'theme' | 'color' | 'image' | 'gif'>('theme');
  const [backgroundColor, setBackgroundColorState] = useState('#111827');
  const [backgroundImage, setBackgroundImageState] = useState<string | null>(null);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedXpColor = await AsyncStorage.getItem('xpBarColor');
      const savedGoldIcon = await AsyncStorage.getItem('goldIcon');
      const savedApIcon = await AsyncStorage.getItem('apIcon');
      const savedGoldCustomImage = await AsyncStorage.getItem('goldCustomImage');
      const savedApCustomImage = await AsyncStorage.getItem('apCustomImage');
      const savedThemeId = await AsyncStorage.getItem('statusThemeId');

      if (savedXpColor) setXpBarColorState(savedXpColor);
      if (savedGoldIcon) setGoldIconState(savedGoldIcon);
      if (savedApIcon) setApIconState(savedApIcon);
      if (savedGoldCustomImage) setGoldCustomImageState(savedGoldCustomImage);
      if (savedApCustomImage) setApCustomImageState(savedApCustomImage);
      if (savedThemeId) {
        const theme = STATUS_THEMES.find(t => t.id === savedThemeId);
        if (theme) setStatusThemeState(theme);
      }
    } catch (error) {
      console.error('Failed to load customization preferences:', error);
    }
  };

  const setXpBarColor = async (color: string) => {
    setXpBarColorState(color);
    try {
      await AsyncStorage.setItem('xpBarColor', color);
    } catch (error) {
      console.error('Failed to save XP bar color:', error);
    }
  };

  const setGoldIcon = async (icon: string) => {
    setGoldIconState(icon);
    setGoldCustomImageState(null); // Clear custom image when selecting an icon
    try {
      await AsyncStorage.setItem('goldIcon', icon);
      await AsyncStorage.removeItem('goldCustomImage');
    } catch (error) {
      console.error('Failed to save gold icon:', error);
    }
  };

  const setApIcon = async (icon: string) => {
    setApIconState(icon);
    setApCustomImageState(null); // Clear custom image when selecting an icon
    try {
      await AsyncStorage.setItem('apIcon', icon);
      await AsyncStorage.removeItem('apCustomImage');
    } catch (error) {
      console.error('Failed to save AP icon:', error);
    }
  };

  const setGoldCustomImage = async (image: string | null) => {
    setGoldCustomImageState(image);
    try {
      if (image) {
        await AsyncStorage.setItem('goldCustomImage', image);
      } else {
        await AsyncStorage.removeItem('goldCustomImage');
      }
    } catch (error) {
      console.error('Failed to save gold custom image:', error);
    }
  };

  const setApCustomImage = async (image: string | null) => {
    setApCustomImageState(image);
    try {
      if (image) {
        await AsyncStorage.setItem('apCustomImage', image);
      } else {
        await AsyncStorage.removeItem('apCustomImage');
      }
    } catch (error) {
      console.error('Failed to save AP custom image:', error);
    }
  };

  const setStatusTheme = async (themeId: string) => {
    const theme = STATUS_THEMES.find(t => t.id === themeId);
    if (theme) {
      setStatusThemeState(theme);
      try {
        await AsyncStorage.setItem('statusThemeId', themeId);
      } catch (error) {
        console.error('Failed to save status theme:', error);
      }
    }
  };

  const getThemeById = (id: string): StatusTheme => {
    return STATUS_THEMES.find(t => t.id === id) || STATUS_THEMES[0];
  };

  return (
    <CustomizationContext.Provider
      value={{
        xpBarColor,
        goldIcon,
        apIcon,
        goldCustomImage,
        apCustomImage,
        statusTheme,
        setXpBarColor,
        setGoldIcon,
        setApIcon,
        setGoldCustomImage,
        setApCustomImage,
        setStatusTheme,
        getThemeById,
      }}
    >
      {children}
    </CustomizationContext.Provider>
  );
};

export const useCustomization = () => {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error('useCustomization must be used within CustomizationProvider');
  }
  return context;
};
