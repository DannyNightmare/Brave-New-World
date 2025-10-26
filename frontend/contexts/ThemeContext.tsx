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
        background: '#FFFFFF',
        cardBackground: '#F3F4F6',
        text: '#111827',
        textSecondary: '#6B7280',
        border: '#E5E7EB',
        primary: '#8B5CF6',
        tabBar: '#F9FAFB',
        header: '#FFFFFF',
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
