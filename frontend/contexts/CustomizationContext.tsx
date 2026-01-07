import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface CustomizationContextType {
  xpBarColor: string;
  goldIcon: string;
  apIcon: string;
  setXpBarColor: (color: string) => void;
  setGoldIcon: (icon: string) => void;
  setApIcon: (icon: string) => void;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

export const CustomizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [xpBarColor, setXpBarColorState] = useState('#8B5CF6'); // Default purple
  const [goldIcon, setGoldIconState] = useState('logo-bitcoin'); // Default coin
  const [apIcon, setApIconState] = useState('star'); // Default star

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedXpColor = await AsyncStorage.getItem('xpBarColor');
      const savedGoldIcon = await AsyncStorage.getItem('goldIcon');
      const savedApIcon = await AsyncStorage.getItem('apIcon');

      if (savedXpColor) setXpBarColorState(savedXpColor);
      if (savedGoldIcon) setGoldIconState(savedGoldIcon);
      if (savedApIcon) setApIconState(savedApIcon);
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
    try {
      await AsyncStorage.setItem('goldIcon', icon);
    } catch (error) {
      console.error('Failed to save gold icon:', error);
    }
  };

  const setApIcon = async (icon: string) => {
    setApIconState(icon);
    try {
      await AsyncStorage.setItem('apIcon', icon);
    } catch (error) {
      console.error('Failed to save AP icon:', error);
    }
  };

  return (
    <CustomizationContext.Provider
      value={{
        xpBarColor,
        goldIcon,
        apIcon,
        setXpBarColor,
        setGoldIcon,
        setApIcon,
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
