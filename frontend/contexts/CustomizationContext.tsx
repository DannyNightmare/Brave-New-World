import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Popup Style definitions
export interface PopupStyle {
  id: string;
  name: string;
  description: string;
  preview: string;
  styles: {
    overlayColor: string;
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    headerBg: string;
    headerTextColor: string;
    bodyBg: string;
    bodyTextColor: string;
    buttonBg: string;
    buttonTextColor: string;
    shadowColor: string;
    shadowOpacity: number;
    glowEnabled: boolean;
    glowColor: string;
    animation: 'fade' | 'slide' | 'scale' | 'none';
  };
}

// Predefined popup styles
export const POPUP_STYLES: PopupStyle[] = [
  {
    id: 'default',
    name: 'Classic Dark',
    description: 'Clean dark modal with rounded corners',
    preview: '🌑',
    styles: {
      overlayColor: 'rgba(0, 0, 0, 0.7)',
      backgroundColor: '#1F2937',
      borderColor: '#374151',
      borderWidth: 1,
      borderRadius: 16,
      headerBg: '#111827',
      headerTextColor: '#F9FAFB',
      bodyBg: '#1F2937',
      bodyTextColor: '#D1D5DB',
      buttonBg: '#8B5CF6',
      buttonTextColor: '#FFFFFF',
      shadowColor: '#000000',
      shadowOpacity: 0.5,
      glowEnabled: false,
      glowColor: '#8B5CF6',
      animation: 'fade',
    },
  },
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    description: 'Cyberpunk-style with neon glow effects',
    preview: '💜',
    styles: {
      overlayColor: 'rgba(10, 0, 20, 0.9)',
      backgroundColor: '#0a0014',
      borderColor: '#ff00ff',
      borderWidth: 2,
      borderRadius: 4,
      headerBg: '#1a0028',
      headerTextColor: '#ff00ff',
      bodyBg: '#0a0014',
      bodyTextColor: '#e0b0ff',
      buttonBg: '#ff00ff',
      buttonTextColor: '#000000',
      shadowColor: '#ff00ff',
      shadowOpacity: 0.8,
      glowEnabled: true,
      glowColor: '#ff00ff',
      animation: 'scale',
    },
  },
  {
    id: 'royal-gold',
    name: 'Royal Gold',
    description: 'Elegant gold and black royal design',
    preview: '👑',
    styles: {
      overlayColor: 'rgba(20, 15, 0, 0.85)',
      backgroundColor: '#1a1400',
      borderColor: '#FFD700',
      borderWidth: 2,
      borderRadius: 12,
      headerBg: 'linear-gradient(180deg, #3d2e00 0%, #1a1400 100%)',
      headerTextColor: '#FFD700',
      bodyBg: '#1a1400',
      bodyTextColor: '#f5e6a3',
      buttonBg: '#FFD700',
      buttonTextColor: '#1a1400',
      shadowColor: '#FFD700',
      shadowOpacity: 0.4,
      glowEnabled: true,
      glowColor: '#FFD700',
      animation: 'slide',
    },
  },
  {
    id: 'ice-crystal',
    name: 'Ice Crystal',
    description: 'Cool blue frozen crystal aesthetic',
    preview: '❄️',
    styles: {
      overlayColor: 'rgba(0, 10, 20, 0.85)',
      backgroundColor: '#0a1929',
      borderColor: '#00d4ff',
      borderWidth: 1,
      borderRadius: 20,
      headerBg: '#0d2137',
      headerTextColor: '#00d4ff',
      bodyBg: '#0a1929',
      bodyTextColor: '#b3e5fc',
      buttonBg: '#00d4ff',
      buttonTextColor: '#0a1929',
      shadowColor: '#00d4ff',
      shadowOpacity: 0.6,
      glowEnabled: true,
      glowColor: '#00d4ff',
      animation: 'scale',
    },
  },
  {
    id: 'blood-crimson',
    name: 'Blood Crimson',
    description: 'Dark red vampiric style',
    preview: '🩸',
    styles: {
      overlayColor: 'rgba(20, 0, 0, 0.9)',
      backgroundColor: '#1a0000',
      borderColor: '#dc143c',
      borderWidth: 2,
      borderRadius: 8,
      headerBg: '#2d0a0a',
      headerTextColor: '#ff4444',
      bodyBg: '#1a0000',
      bodyTextColor: '#ffaaaa',
      buttonBg: '#dc143c',
      buttonTextColor: '#ffffff',
      shadowColor: '#dc143c',
      shadowOpacity: 0.7,
      glowEnabled: true,
      glowColor: '#dc143c',
      animation: 'fade',
    },
  },
  {
    id: 'forest-nature',
    name: 'Forest Nature',
    description: 'Earthy green natural design',
    preview: '🌿',
    styles: {
      overlayColor: 'rgba(0, 15, 0, 0.85)',
      backgroundColor: '#0d1f0d',
      borderColor: '#22c55e',
      borderWidth: 1,
      borderRadius: 16,
      headerBg: '#143d14',
      headerTextColor: '#22c55e',
      bodyBg: '#0d1f0d',
      bodyTextColor: '#a7f3d0',
      buttonBg: '#22c55e',
      buttonTextColor: '#0d1f0d',
      shadowColor: '#22c55e',
      shadowOpacity: 0.5,
      glowEnabled: false,
      glowColor: '#22c55e',
      animation: 'slide',
    },
  },
  {
    id: 'void-dark',
    name: 'Void Dark',
    description: 'Pure black minimalist void',
    preview: '🕳️',
    styles: {
      overlayColor: 'rgba(0, 0, 0, 0.95)',
      backgroundColor: '#000000',
      borderColor: '#333333',
      borderWidth: 1,
      borderRadius: 0,
      headerBg: '#0a0a0a',
      headerTextColor: '#ffffff',
      bodyBg: '#000000',
      bodyTextColor: '#888888',
      buttonBg: '#333333',
      buttonTextColor: '#ffffff',
      shadowColor: '#000000',
      shadowOpacity: 0,
      glowEnabled: false,
      glowColor: '#333333',
      animation: 'fade',
    },
  },
  {
    id: 'sakura-pink',
    name: 'Sakura Bloom',
    description: 'Soft pink cherry blossom theme',
    preview: '🌸',
    styles: {
      overlayColor: 'rgba(20, 5, 10, 0.85)',
      backgroundColor: '#1f0a14',
      borderColor: '#ff69b4',
      borderWidth: 1,
      borderRadius: 24,
      headerBg: '#2d1020',
      headerTextColor: '#ff69b4',
      bodyBg: '#1f0a14',
      bodyTextColor: '#ffb6c1',
      buttonBg: '#ff69b4',
      buttonTextColor: '#1f0a14',
      shadowColor: '#ff69b4',
      shadowOpacity: 0.5,
      glowEnabled: true,
      glowColor: '#ff69b4',
      animation: 'scale',
    },
  },
];

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
  popupStyle: PopupStyle;
  setXpBarColor: (color: string) => void;
  setGoldIcon: (icon: string) => void;
  setApIcon: (icon: string) => void;
  setGoldCustomImage: (image: string | null) => void;
  setApCustomImage: (image: string | null) => void;
  setStatusTheme: (themeId: string) => void;
  setBackgroundType: (type: 'theme' | 'color' | 'image' | 'gif') => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundImage: (image: string | null) => void;
  setPopupStyle: (styleId: string) => void;
  getThemeById: (id: string) => StatusTheme;
  getPopupStyleById: (id: string) => PopupStyle;
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
  const [popupStyle, setPopupStyleState] = useState<PopupStyle>(POPUP_STYLES[0]);

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
      const savedBackgroundType = await AsyncStorage.getItem('backgroundType');
      const savedBackgroundColor = await AsyncStorage.getItem('backgroundColor');
      const savedBackgroundImage = await AsyncStorage.getItem('backgroundImage');
      const savedPopupStyleId = await AsyncStorage.getItem('popupStyleId');

      if (savedXpColor) setXpBarColorState(savedXpColor);
      if (savedGoldIcon) setGoldIconState(savedGoldIcon);
      if (savedApIcon) setApIconState(savedApIcon);
      if (savedGoldCustomImage) setGoldCustomImageState(savedGoldCustomImage);
      if (savedApCustomImage) setApCustomImageState(savedApCustomImage);
      if (savedThemeId) {
        const theme = STATUS_THEMES.find(t => t.id === savedThemeId);
        if (theme) setStatusThemeState(theme);
      }
      if (savedBackgroundType) setBackgroundTypeState(savedBackgroundType as 'theme' | 'color' | 'image' | 'gif');
      if (savedBackgroundColor) setBackgroundColorState(savedBackgroundColor);
      if (savedBackgroundImage) setBackgroundImageState(savedBackgroundImage);
      if (savedPopupStyleId) {
        const style = POPUP_STYLES.find(s => s.id === savedPopupStyleId);
        if (style) setPopupStyleState(style);
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

  const setBackgroundType = async (type: 'theme' | 'color' | 'image' | 'gif') => {
    setBackgroundTypeState(type);
    try {
      await AsyncStorage.setItem('backgroundType', type);
    } catch (error) {
      console.error('Failed to save background type:', error);
    }
  };

  const setBackgroundColor = async (color: string) => {
    setBackgroundColorState(color);
    try {
      await AsyncStorage.setItem('backgroundColor', color);
    } catch (error) {
      console.error('Failed to save background color:', error);
    }
  };

  const setBackgroundImage = async (image: string | null) => {
    setBackgroundImageState(image);
    try {
      if (image) {
        await AsyncStorage.setItem('backgroundImage', image);
      } else {
        await AsyncStorage.removeItem('backgroundImage');
      }
    } catch (error) {
      console.error('Failed to save background image:', error);
    }
  };

  const setPopupStyle = async (styleId: string) => {
    const style = POPUP_STYLES.find(s => s.id === styleId);
    if (style) {
      setPopupStyleState(style);
      try {
        await AsyncStorage.setItem('popupStyleId', styleId);
      } catch (error) {
        console.error('Failed to save popup style:', error);
      }
    }
  };

  const getThemeById = (id: string): StatusTheme => {
    return STATUS_THEMES.find(t => t.id === id) || STATUS_THEMES[0];
  };

  const getPopupStyleById = (id: string): PopupStyle => {
    return POPUP_STYLES.find(s => s.id === id) || POPUP_STYLES[0];
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
        backgroundType,
        backgroundColor,
        backgroundImage,
        popupStyle,
        setXpBarColor,
        setGoldIcon,
        setApIcon,
        setGoldCustomImage,
        setApCustomImage,
        setStatusTheme,
        setBackgroundType,
        setBackgroundColor,
        setBackgroundImage,
        setPopupStyle,
        getThemeById,
        getPopupStyleById,
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
