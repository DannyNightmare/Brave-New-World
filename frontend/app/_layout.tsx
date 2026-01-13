import React, { useState, useEffect } from 'react';
import { Stack } from 'expo-router';
import { UserProvider } from '../contexts/UserContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { CustomizationProvider } from '../contexts/CustomizationContext';
import SplashScreen from '../components/SplashScreen';
import * as ExpoSplashScreen from 'expo-splash-screen';

// Prevent the native splash screen from auto-hiding
ExpoSplashScreen.preventAutoHideAsync().catch(() => {});

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    // Hide the native splash screen once our custom one is ready
    ExpoSplashScreen.hideAsync().catch(() => {});
  }, []);

  const handleAnimationComplete = () => {
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onAnimationComplete={handleAnimationComplete} />;
  }

  return (
    <NotificationProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" />
      </Stack>
    </NotificationProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <UserProvider>
        <CustomizationProvider>
          <AppContent />
        </CustomizationProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
