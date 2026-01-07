import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TouchableOpacity, Modal, View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';

export default function TabLayout() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [customizeVisible, setCustomizeVisible] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();

  const HeaderButtons = () => (
    <View style={styles.headerButtons}>
      {/* Customize Button */}
      <TouchableOpacity onPress={() => setCustomizeVisible(true)} style={{ marginRight: 12 }}>
        <Ionicons name="color-palette" size={26} color={colors.primary} />
      </TouchableOpacity>

      {/* Hamburger Menu Button */}
      <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 16 }}>
        <Ionicons name="menu" size={28} color={colors.text} />
      </TouchableOpacity>

      {/* Hamburger Menu Modal */}
      <Modal visible={menuVisible} animationType="fade" transparent={true}>
        <TouchableOpacity 
          style={styles.menuOverlay} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                router.push('/settings');
              }}
            >
              <Ionicons name="settings-outline" size={24} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Settings</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Customize Modal */}
      <Modal visible={customizeVisible} animationType="slide" transparent={true}>
        <View style={styles.customizeOverlay}>
          <View style={[styles.customizeContainer, { backgroundColor: colors.cardBackground }]}>
            <View style={styles.customizeHeader}>
              <Text style={[styles.customizeTitle, { color: colors.text }]}>Customize</Text>
              <TouchableOpacity onPress={() => setCustomizeVisible(false)}>
                <Ionicons name="close" size={28} color={colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.customizeSubtitle, { color: colors.textSecondary }]}>
              Personalize your app experience
            </Text>

            {/* Customization options will go here */}
            <View style={styles.customizeContent}>
              <Text style={[styles.comingSoonText, { color: colors.textTertiary }]}>
                🎨 Icon Customization
              </Text>
              <Text style={[styles.comingSoonText, { color: colors.textTertiary }]}>
                Coming soon...
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );

  const HamburgerMenu = () => <HeaderButtons />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.tabBar,
          borderTopColor: colors.border,
          paddingBottom: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: colors.header,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        headerRight: () => <HamburgerMenu />,
      }}
    >
      <Tabs.Screen
        name="quests"
        options={{
          title: 'Quests',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="document-text" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="status"
        options={{
          title: 'Status',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Inventory',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="file-tray-full" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="storefront" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="powers"
        options={{
          title: 'Powers',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 16,
  },
  menuContainer: {
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 200,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  menuItemText: {
    fontSize: 16,
    fontWeight: '600',
  },
  customizeOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customizeContainer: {
    width: '90%',
    maxWidth: 500,
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  customizeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  customizeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  customizeSubtitle: {
    fontSize: 14,
    marginBottom: 24,
  },
  customizeContent: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    marginBottom: 8,
    fontStyle: 'italic',
  },
});