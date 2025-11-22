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
        background: '#111827',
        cardBackground: '#1F2937',
        text: '#F9FAFB',
        textSecondary: '#9CA3AF',
        border: '#374151',
        primary: '#8B5CF6',
        tabBar: '#1F2937',
        header: '#111827',
      }
    : {
        background: '#F0F4F8',        // Soft blue-gray background
        cardBackground: '#FFFFFF',    // Pure white cards for contrast
        text: '#1A202C',              // Dark blue-gray text
        textSecondary: '#4A5568',     // Medium gray for secondary text
        border: '#CBD5E0',            // Light blue-gray borders
        primary: '#6B46C1',           // Deeper purple for better contrast in light mode
        tabBar: '#FFFFFF',            // White tab bar
        header: '#FFFFFF',            // White header
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
