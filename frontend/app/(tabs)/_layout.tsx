import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TouchableOpacity, Modal, View, Text, StyleSheet, ScrollView, Dimensions, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useCustomization, STATUS_THEMES } from '../../contexts/CustomizationContext';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TabLayout() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [customizeVisible, setCustomizeVisible] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();
  const { 
    xpBarColor, goldIcon, apIcon, goldCustomImage, apCustomImage, statusTheme, 
    setXpBarColor, setGoldIcon, setApIcon, setGoldCustomImage, setApCustomImage, setStatusTheme 
  } = useCustomization();

  // Image picker function
  const pickImage = async (type: 'gold' | 'ap') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to select custom icons.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
        if (type === 'gold') {
          setGoldCustomImage(base64Image);
        } else {
          setApCustomImage(base64Image);
        }
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  // Clear custom image and revert to icon
  const clearCustomImage = (type: 'gold' | 'ap') => {
    if (type === 'gold') {
      setGoldCustomImage(null);
    } else {
      setApCustomImage(null);
    }
  };

  // Color options for XP bar
  const xpBarColors = [
    { name: 'Purple', value: '#8B5CF6' },
    { name: 'Blue', value: '#3B82F6' },
    { name: 'Green', value: '#10B981' },
    { name: 'Red', value: '#EF4444' },
    { name: 'Gold', value: '#F59E0B' },
    { name: 'Pink', value: '#EC4899' },
    { name: 'Cyan', value: '#06B6D4' },
  ];

  // Icon options
  const goldIconOptions = ['logo-bitcoin', 'cash', 'wallet', 'diamond', 'trophy', 'medal'];
  const apIconOptions = ['star', 'flash', 'flame', 'sparkles', 'diamond', 'nuclear'];

  // Mini theme preview component
  const ThemePreview = ({ theme, isSelected, onSelect }: { theme: typeof STATUS_THEMES[0], isSelected: boolean, onSelect: () => void }) => (
    <TouchableOpacity
      style={[
        styles.themeCard,
        { backgroundColor: theme.colors.cardBackground, borderColor: isSelected ? theme.colors.primary : theme.colors.cardBorder },
        isSelected && { borderWidth: 3 }
      ]}
      onPress={onSelect}
    >
      {/* Mini status preview */}
      <View style={[styles.themePreviewHeader, { backgroundColor: theme.colors.background }]}>
        <View style={[styles.themePreviewLevel, { backgroundColor: theme.colors.levelBadgeBg }]}>
          <Text style={[styles.themePreviewLevelText, { color: theme.colors.levelBadgeText }]}>5</Text>
        </View>
        <View style={styles.themePreviewBars}>
          <View style={[styles.themePreviewBar, { backgroundColor: theme.colors.xpBarBg }]}>
            <View style={[styles.themePreviewBarFill, { backgroundColor: theme.colors.xpBarFill, width: '60%' }]} />
          </View>
          <View style={[styles.themePreviewBar, { backgroundColor: theme.colors.statBarBg }]}>
            <View style={[styles.themePreviewBarFill, { backgroundColor: theme.colors.statBarFill, width: '80%' }]} />
          </View>
        </View>
      </View>
      
      {/* Theme info */}
      <View style={styles.themeInfo}>
        <Text style={[styles.themeName, { color: theme.colors.text }]}>{theme.name}</Text>
        {theme.anime && (
          <Text style={[styles.themeAnime, { color: theme.colors.primary }]}>{theme.anime}</Text>
        )}
        <Text style={[styles.themeDescription, { color: theme.colors.textSecondary }]} numberOfLines={2}>
          {theme.description}
        </Text>
      </View>
      
      {/* Selected indicator */}
      {isSelected && (
        <View style={[styles.selectedBadge, { backgroundColor: theme.colors.primary }]}>
          <Ionicons name="checkmark" size={16} color="#FFF" />
        </View>
      )}
    </TouchableOpacity>
  );

  const HamburgerMenu = () => (
    <>
      <TouchableOpacity onPress={() => setMenuVisible(true)} style={{ marginRight: 16 }}>
        <Ionicons name="menu" size={28} color={colors.text} />
      </TouchableOpacity>

      <Modal visible={menuVisible} animationType="fade" transparent={true}>
        <TouchableOpacity 
          style={styles.menuOverlay} 
          activeOpacity={1} 
          onPress={() => setMenuVisible(false)}
        >
          <View style={[styles.menuContainer, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            {/* Customize Option */}
            <TouchableOpacity 
              style={styles.menuItem}
              onPress={() => {
                setMenuVisible(false);
                setCustomizeVisible(true);
              }}
            >
              <Ionicons name="color-palette" size={24} color={colors.primary} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>Customize</Text>
            </TouchableOpacity>

            {/* Settings Option */}
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

            <ScrollView style={styles.customizeContent} showsVerticalScrollIndicator={false}>
              {/* Status Display Theme Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Status Display</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Choose an anime-inspired status screen theme
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.themeScrollView}
                  contentContainerStyle={styles.themeScrollContent}
                >
                  {STATUS_THEMES.map((theme) => (
                    <ThemePreview
                      key={theme.id}
                      theme={theme}
                      isSelected={statusTheme.id === theme.id}
                      onSelect={() => setStatusTheme(theme.id)}
                    />
                  ))}
                </ScrollView>
              </View>

              {/* XP Bar Color Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>XP Bar Color</Text>
                <View style={styles.colorGrid}>
                  {xpBarColors.map((color) => (
                    <TouchableOpacity
                      key={color.value}
                      style={[
                        styles.colorSwatch,
                        { backgroundColor: color.value },
                        xpBarColor === color.value && styles.colorSwatchSelected
                      ]}
                      onPress={() => setXpBarColor(color.value)}
                    >
                      {xpBarColor === color.value && (
                        <Ionicons name="checkmark" size={20} color="#FFF" />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
                {/* Preview */}
                <View style={styles.previewContainer}>
                  <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Preview:</Text>
                  <View style={styles.xpBarPreview}>
                    <View style={[styles.xpBarPreviewFill, { backgroundColor: xpBarColor }]} />
                  </View>
                </View>
              </View>

              {/* Gold Icon Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Gold Icon</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Choose a preset or pick from your gallery
                </Text>
                
                {/* Custom Image Preview & Picker */}
                <View style={styles.customImageRow}>
                  <TouchableOpacity 
                    style={[
                      styles.customImagePicker, 
                      { backgroundColor: colors.surface, borderColor: goldCustomImage ? '#F59E0B' : colors.border }
                    ]}
                    onPress={() => pickImage('gold')}
                  >
                    {goldCustomImage ? (
                      <Image source={{ uri: goldCustomImage }} style={styles.customImagePreview} />
                    ) : (
                      <View style={styles.customImagePlaceholder}>
                        <Ionicons name="image-outline" size={24} color="#F59E0B" />
                        <Text style={[styles.customImageText, { color: colors.textSecondary }]}>Gallery</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {goldCustomImage && (
                    <TouchableOpacity 
                      style={styles.clearImageButton}
                      onPress={() => clearCustomImage('gold')}
                    >
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Preset Icons */}
                <Text style={[styles.presetLabel, { color: colors.textSecondary }]}>Or choose a preset:</Text>
                <View style={styles.iconGrid}>
                  {goldIconOptions.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconButton,
                        { backgroundColor: colors.surface },
                        goldIcon === icon && !goldCustomImage && styles.iconButtonSelected
                      ]}
                      onPress={() => setGoldIcon(icon)}
                    >
                      <Ionicons name={icon as any} size={24} color="#F59E0B" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* AP Icon Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Ability Points Icon</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Choose a preset or pick from your gallery
                </Text>
                
                {/* Custom Image Preview & Picker */}
                <View style={styles.customImageRow}>
                  <TouchableOpacity 
                    style={[
                      styles.customImagePicker, 
                      { backgroundColor: colors.surface, borderColor: apCustomImage ? '#8B5CF6' : colors.border }
                    ]}
                    onPress={() => pickImage('ap')}
                  >
                    {apCustomImage ? (
                      <Image source={{ uri: apCustomImage }} style={styles.customImagePreview} />
                    ) : (
                      <View style={styles.customImagePlaceholder}>
                        <Ionicons name="image-outline" size={24} color="#8B5CF6" />
                        <Text style={[styles.customImageText, { color: colors.textSecondary }]}>Gallery</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                  {apCustomImage && (
                    <TouchableOpacity 
                      style={styles.clearImageButton}
                      onPress={() => clearCustomImage('ap')}
                    >
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>

                {/* Preset Icons */}
                <Text style={[styles.presetLabel, { color: colors.textSecondary }]}>Or choose a preset:</Text>
                <View style={styles.iconGrid}>
                  {apIconOptions.map((icon) => (
                    <TouchableOpacity
                      key={icon}
                      style={[
                        styles.iconButton,
                        { backgroundColor: colors.surface },
                        apIcon === icon && !apCustomImage && styles.iconButtonSelected
                      ]}
                      onPress={() => setApIcon(icon)}
                    >
                      <Ionicons name={icon as any} size={24} color="#8B5CF6" />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </>
  );

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
          backgroundColor: statusTheme.colors.cardBackground,
          borderTopColor: statusTheme.colors.cardBorder,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarActiveTintColor: statusTheme.colors.primary,
        tabBarInactiveTintColor: statusTheme.colors.textSecondary,
        headerStyle: {
          backgroundColor: statusTheme.colors.background,
        },
        headerTintColor: statusTheme.colors.text,
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
    flex: 1,
    paddingVertical: 8,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  // Theme selector styles
  themeScrollView: {
    marginHorizontal: -24,
  },
  themeScrollContent: {
    paddingHorizontal: 24,
    gap: 12,
  },
  themeCard: {
    width: 160,
    borderRadius: 12,
    borderWidth: 2,
    overflow: 'hidden',
  },
  themePreviewHeader: {
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  themePreviewLevel: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  themePreviewLevelText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  themePreviewBars: {
    flex: 1,
    gap: 4,
  },
  themePreviewBar: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  themePreviewBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  themeInfo: {
    padding: 10,
  },
  themeName: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  themeAnime: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  themeDescription: {
    fontSize: 10,
    lineHeight: 13,
  },
  selectedBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorSwatch: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorSwatchSelected: {
    borderColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  previewContainer: {
    marginTop: 16,
  },
  previewLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  xpBarPreview: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    overflow: 'hidden',
  },
  xpBarPreviewFill: {
    height: '100%',
    width: '70%',
    borderRadius: 6,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconButton: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconButtonSelected: {
    borderColor: '#8B5CF6',
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },
  comingSoonText: {
    fontSize: 16,
    marginBottom: 8,
    fontStyle: 'italic',
  },
});