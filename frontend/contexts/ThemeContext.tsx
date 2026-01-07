import React, { createContext, useContext, useState, ReactNode } from 'react';

interface ThemeContextType {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  colors: {
    background: string;
    cardBackground: string;
    text: string;
    textSecondary: string;
    border: string;
    primary: string;
    tabBar: string;
    header: string;
  };
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const colors = isDarkMode
    ? {
        // Premium Dark Mode - "Midnight Ascension" Theme
        background: '#0B0D17',              // Deep space black
        surface: '#13151F',                 // Elevated surface
        cardBackground: '#1A1D2E',          // Rich dark blue-grey cards
        cardElevated: '#22263A',            // Hover/elevated state
        
        text: '#F8F9FA',                    // Pure white text
        textSecondary: '#A8B2C1',           // Cool grey secondary
        textTertiary: '#6C7A8C',            // Muted text
        
        border: '#2A3347',                  // Subtle borders
        borderAccent: '#3D4968',            // Prominent borders
        
        // Primary - Ethereal Purple (power & mystique)
        primary: '#8B5CF6',                 // Vibrant purple
        primaryLight: '#A78BFA',            // Light purple
        primaryDark: '#7C3AED',             // Deep purple
        
        // Secondary - Cyan Glow (magic & energy)
        secondary: '#06B6D4',               // Bright cyan
        secondaryLight: '#22D3EE',          // Light cyan
        secondaryDark: '#0891B2',           // Deep cyan
        
        // Accent - Gold (achievement & reward)
        accent: '#F59E0B',                  // Rich gold
        accentLight: '#FBBF24',             // Light gold
        accentDark: '#D97706',              // Deep gold
        
        // Status colors
        success: '#10B981',                 // Emerald green
        successLight: '#34D399',
        warning: '#F59E0B',                 // Amber
        warningLight: '#FBBF24',
        danger: '#EF4444',                  // Red
        dangerLight: '#F87171',
        info: '#3B82F6',                    // Blue
        infoLight: '#60A5FA',
        
        // UI Elements
        tabBar: '#13151F',
        tabBarBorder: '#2A3347',
        header: '#0B0D17',
        shadow: 'rgba(0, 0, 0, 0.5)',
        
        // Special effects
        glow: '#A78BFA',                    // Purple glow
        glowCyan: '#22D3EE',                // Cyan glow
        glowGold: '#FBBF24',                // Gold glow
        overlay: 'rgba(11, 13, 23, 0.85)',
        
        // Glass morphism
        glass: 'rgba(26, 29, 46, 0.7)',
        glassBorder: 'rgba(168, 178, 193, 0.1)',
      }
    : {
        // Premium Light Mode - "Dawn Ascension" Theme
        background: '#F8F9FC',              // Soft off-white
        surface: '#FFFFFF',                 // Pure white surface
        cardBackground: '#FFFFFF',          // White cards
        cardElevated: '#F3F4F8',            // Slight tint for elevation
        
        text: '#0F172A',                    // Deep navy text
        textSecondary: '#475569',           // Cool grey secondary
        textTertiary: '#94A3B8',            // Light grey
        
        border: '#E2E8F0',                  // Subtle borders
        borderAccent: '#CBD5E1',            // Prominent borders
        
        // Primary - Royal Purple (power & mystique)
        primary: '#7C3AED',                 // Deep purple
        primaryLight: '#8B5CF6',            // Medium purple
        primaryDark: '#6D28D9',             // Dark purple
        
        // Secondary - Ocean Cyan (magic & energy)
        secondary: '#0891B2',               // Deep cyan
        secondaryLight: '#06B6D4',          // Medium cyan
        secondaryDark: '#0E7490',           // Darker cyan
        
        // Accent - Sunset Gold (achievement & reward)
        accent: '#D97706',                  // Deep gold
        accentLight: '#F59E0B',             // Medium gold
        accentDark: '#B45309',              // Dark gold
        
        // Status colors
        success: '#059669',                 // Deep green
        successLight: '#10B981',
        warning: '#D97706',                 // Deep amber
        warningLight: '#F59E0B',
        danger: '#DC2626',                  // Deep red
        dangerLight: '#EF4444',
        info: '#2563EB',                    // Deep blue
        infoLight: '#3B82F6',
        
        // UI Elements
        tabBar: '#FFFFFF',
        tabBarBorder: '#E2E8F0',
        header: '#FFFFFF',
        shadow: 'rgba(15, 23, 42, 0.1)',
        
        // Special effects
        glow: '#8B5CF6',                    // Purple glow
        glowCyan: '#06B6D4',                // Cyan glow
        glowGold: '#F59E0B',                // Gold glow
        overlay: 'rgba(248, 249, 252, 0.85)',
        
        // Glass morphism
        glass: 'rgba(255, 255, 255, 0.7)',
        glassBorder: 'rgba(71, 85, 105, 0.1)',
      };

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleDarkMode, colors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
