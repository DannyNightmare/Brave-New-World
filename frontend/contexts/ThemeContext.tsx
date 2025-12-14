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
        // Solo Leveling System Theme - Dark Mode
        background: '#0A0E27',           // Deep navy/black background
        cardBackground: '#151B3D',       // Dark blue cards with depth
        text: '#E5E7EB',                 // Silver/white text
        textSecondary: '#9CA3AF',        // Gray secondary text
        border: '#00D4FF',               // Bright cyan borders (System glow)
        primary: '#00E5FF',              // Electric cyan accent (iconic Solo Leveling blue)
        secondary: '#7C3AED',            // Purple for secondary accents
        tabBar: '#0D1117',               // Very dark bar
        header: '#0A0E27',               // Match background
        glow: '#00F0FF',                 // Bright cyan for glowing effects
        success: '#10B981',              // Keep green for success
        warning: '#F59E0B',              // Keep orange for warnings
        danger: '#EF4444',               // Keep red for danger
      }
    : {
        // Light Mode (keeping your previous light theme)
        background: '#F0F4F8',
        cardBackground: '#FFFFFF',
        text: '#1A202C',
        textSecondary: '#4A5568',
        border: '#CBD5E0',
        primary: '#00D4FF',              // Use cyan in light mode too
        secondary: '#6B46C1',
        tabBar: '#FFFFFF',
        header: '#FFFFFF',
        glow: '#00D4FF',
        success: '#10B981',
        warning: '#F59E0B',
        danger: '#EF4444',
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
