import { Stack } from 'expo-router';
import { UserProvider } from '../contexts/UserContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { NotificationProvider } from '../contexts/NotificationContext';
import { CustomizationProvider } from '../contexts/CustomizationContext';

export default function RootLayout() {
  return (
    <ThemeProvider>
      <UserProvider>
        <CustomizationProvider>
          <NotificationProvider>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="settings" />
            </Stack>
          </NotificationProvider>
        </CustomizationProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
