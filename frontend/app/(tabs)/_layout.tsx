import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { TouchableOpacity, Modal, View, Text, StyleSheet, ScrollView, Dimensions, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../contexts/ThemeContext';
import { useCustomization, STATUS_THEMES, POPUP_STYLES, STATUS_LAYOUTS, ANIMATION_STYLES } from '../../contexts/CustomizationContext';
import * as ImagePicker from 'expo-image-picker';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function TabLayout() {
  const [menuVisible, setMenuVisible] = useState(false);
  const [customizeVisible, setCustomizeVisible] = useState(false);
  const router = useRouter();
  const { colors } = useTheme();
  const { 
    xpBarColor, goldIcon, apIcon, goldCustomImage, apCustomImage, statusTheme,
    backgroundType, backgroundColor, backgroundImage, popupStyle, statusLayout, animationStyle,
    setXpBarColor, setGoldIcon, setApIcon, setGoldCustomImage, setApCustomImage, setStatusTheme,
    setBackgroundType, setBackgroundColor, setBackgroundImage, setPopupStyle, setStatusLayout, setAnimationStyle
  } = useCustomization();

  // Image picker function
  const pickImage = async (type: 'gold' | 'ap' | 'background') => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow access to your photo library to select custom icons.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: type === 'background' ? ImagePicker.MediaTypeOptions.All : ImagePicker.MediaTypeOptions.Images,
        allowsEditing: type !== 'background',
        aspect: type === 'background' ? undefined : [1, 1],
        quality: type === 'background' ? 0.8 : 0.5,
        base64: true,
      });

      if (!result.canceled && result.assets[0].base64) {
        const mimeType = result.assets[0].mimeType || 'image/jpeg';
        const base64Image = `data:${mimeType};base64,${result.assets[0].base64}`;
        if (type === 'gold') {
          setGoldCustomImage(base64Image);
        } else if (type === 'ap') {
          setApCustomImage(base64Image);
        } else if (type === 'background') {
          setBackgroundImage(base64Image);
          setBackgroundType(mimeType.includes('gif') ? 'gif' : 'image');
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

  // Background color options
  const backgroundColors = [
    { name: 'Dark Gray', value: '#111827' },
    { name: 'Deep Black', value: '#0a0a0a' },
    { name: 'Navy', value: '#0a0e1a' },
    { name: 'Dark Purple', value: '#0f0a19' },
    { name: 'Dark Green', value: '#0a1a0a' },
    { name: 'Dark Red', value: '#1a0a0a' },
    { name: 'Midnight Blue', value: '#0c1929' },
    { name: 'Charcoal', value: '#1c1c1c' },
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
      <Modal visible={customizeVisible} animationType="slide" transparent={false}>
        <View style={[styles.customizeOverlay, { backgroundColor: colors.cardBackground }]}>
          <View style={styles.customizeContainer}>
            <View style={styles.customizeHeader}>
              <Text style={[styles.customizeTitle, { color: colors.text }]}>Customize</Text>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setCustomizeVisible(false)}
              >
                <Ionicons name="close-circle" size={36} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.customizeSubtitle, { color: colors.textSecondary }]}>
              Personalize your app experience
            </Text>

            <ScrollView 
              style={styles.customizeContent} 
              showsVerticalScrollIndicator={true}
              contentContainerStyle={styles.customizeScrollContent}
            >
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

              {/* App Background Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>App Background</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Customize your app background with color, image, or GIF
                </Text>

                {/* Background Type Selector */}
                <View style={styles.bgTypeSelector}>
                  <TouchableOpacity
                    style={[
                      styles.bgTypeButton,
                      { backgroundColor: backgroundType === 'theme' ? statusTheme.colors.primary : colors.surface }
                    ]}
                    onPress={() => {
                      setBackgroundType('theme');
                      setBackgroundImage(null);
                    }}
                  >
                    <Ionicons name="color-palette" size={18} color={backgroundType === 'theme' ? '#FFF' : colors.textSecondary} />
                    <Text style={[styles.bgTypeText, { color: backgroundType === 'theme' ? '#FFF' : colors.textSecondary }]}>Theme</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.bgTypeButton,
                      { backgroundColor: backgroundType === 'color' ? statusTheme.colors.primary : colors.surface }
                    ]}
                    onPress={() => {
                      setBackgroundType('color');
                      setBackgroundImage(null);
                    }}
                  >
                    <Ionicons name="color-fill" size={18} color={backgroundType === 'color' ? '#FFF' : colors.textSecondary} />
                    <Text style={[styles.bgTypeText, { color: backgroundType === 'color' ? '#FFF' : colors.textSecondary }]}>Color</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.bgTypeButton,
                      { backgroundColor: (backgroundType === 'image' || backgroundType === 'gif') ? statusTheme.colors.primary : colors.surface }
                    ]}
                    onPress={() => pickImage('background')}
                  >
                    <Ionicons name="image" size={18} color={(backgroundType === 'image' || backgroundType === 'gif') ? '#FFF' : colors.textSecondary} />
                    <Text style={[styles.bgTypeText, { color: (backgroundType === 'image' || backgroundType === 'gif') ? '#FFF' : colors.textSecondary }]}>Image/GIF</Text>
                  </TouchableOpacity>
                </View>

                {/* Color Selection (shown when 'color' is selected) */}
                {backgroundType === 'color' && (
                  <View style={styles.bgColorGrid}>
                    {backgroundColors.map((color) => (
                      <TouchableOpacity
                        key={color.value}
                        style={[
                          styles.bgColorSwatch,
                          { backgroundColor: color.value, borderColor: backgroundColor === color.value ? statusTheme.colors.primary : 'transparent' }
                        ]}
                        onPress={() => setBackgroundColor(color.value)}
                      >
                        {backgroundColor === color.value && (
                          <Ionicons name="checkmark" size={16} color="#FFF" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}

                {/* Image/GIF Preview */}
                {(backgroundType === 'image' || backgroundType === 'gif') && backgroundImage && (
                  <View style={styles.bgImagePreviewContainer}>
                    <Image source={{ uri: backgroundImage }} style={styles.bgImagePreview} />
                    <TouchableOpacity
                      style={styles.bgImageRemove}
                      onPress={() => {
                        setBackgroundImage(null);
                        setBackgroundType('theme');
                      }}
                    >
                      <Ionicons name="close-circle" size={24} color="#EF4444" />
                    </TouchableOpacity>
                    <Text style={[styles.bgImageLabel, { color: colors.textSecondary }]}>
                      {backgroundType === 'gif' ? 'GIF' : 'Image'} selected
                    </Text>
                  </View>
                )}

                {/* Background Preview */}
                <View style={styles.bgPreviewContainer}>
                  <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Preview:</Text>
                  <View style={[
                    styles.bgPreview,
                    { 
                      backgroundColor: backgroundType === 'theme' 
                        ? statusTheme.colors.background 
                        : backgroundType === 'color' 
                          ? backgroundColor 
                          : '#111827'
                    }
                  ]}>
                    {(backgroundType === 'image' || backgroundType === 'gif') && backgroundImage && (
                      <Image source={{ uri: backgroundImage }} style={styles.bgPreviewImage} />
                    )}
                    <View style={[styles.bgPreviewCard, { backgroundColor: statusTheme.colors.cardBackground }]}>
                      <Text style={[styles.bgPreviewText, { color: statusTheme.colors.text }]}>Sample Card</Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Popup Window Style Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Popup Window Style</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Customize modal windows for Quests & Powers
                </Text>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.popupStyleScroll}
                  contentContainerStyle={styles.popupStyleScrollContent}
                >
                  {POPUP_STYLES.map((style) => (
                    <TouchableOpacity
                      key={style.id}
                      style={[
                        styles.popupStyleCard,
                        { 
                          backgroundColor: style.styles.backgroundColor,
                          borderColor: popupStyle.id === style.id ? style.styles.borderColor : 'transparent',
                          borderWidth: 2,
                        }
                      ]}
                      onPress={() => setPopupStyle(style.id)}
                    >
                      <View style={[
                        styles.popupStylePreview,
                        { 
                          backgroundColor: style.styles.headerBg,
                          borderColor: style.styles.borderColor,
                          borderWidth: style.styles.borderWidth,
                          borderRadius: style.styles.borderRadius / 2,
                        }
                      ]}>
                        <Text style={styles.popupStyleEmoji}>{style.preview}</Text>
                      </View>
                      <Text style={[styles.popupStyleName, { color: style.styles.headerTextColor }]}>
                        {style.name}
                      </Text>
                      <Text style={[styles.popupStyleDesc, { color: style.styles.bodyTextColor }]} numberOfLines={2}>
                        {style.description}
                      </Text>
                      {popupStyle.id === style.id && (
                        <View style={[styles.popupStyleSelected, { backgroundColor: style.styles.borderColor }]}>
                          <Ionicons name="checkmark" size={12} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Selected Popup Preview */}
                <View style={styles.popupPreviewContainer}>
                  <Text style={[styles.previewLabel, { color: colors.textSecondary }]}>Preview:</Text>
                  <View style={[
                    styles.popupPreview,
                    {
                      backgroundColor: popupStyle.styles.overlayColor,
                    }
                  ]}>
                    <View style={[
                      styles.popupPreviewModal,
                      {
                        backgroundColor: popupStyle.styles.backgroundColor,
                        borderColor: popupStyle.styles.borderColor,
                        borderWidth: popupStyle.styles.borderWidth,
                        borderRadius: popupStyle.styles.borderRadius,
                        shadowColor: popupStyle.styles.glowEnabled ? popupStyle.styles.glowColor : 'transparent',
                        shadowOpacity: popupStyle.styles.glowEnabled ? 0.8 : 0,
                        shadowRadius: 10,
                      }
                    ]}>
                      <View style={[styles.popupPreviewHeader, { backgroundColor: popupStyle.styles.headerBg }]}>
                        <Text style={[styles.popupPreviewTitle, { color: popupStyle.styles.headerTextColor }]}>
                          Create Quest
                        </Text>
                      </View>
                      <View style={styles.popupPreviewBody}>
                        <Text style={[styles.popupPreviewBodyText, { color: popupStyle.styles.bodyTextColor }]}>
                          Sample content...
                        </Text>
                      </View>
                      <View style={[styles.popupPreviewButton, { backgroundColor: popupStyle.styles.buttonBg }]}>
                        <Text style={[styles.popupPreviewButtonText, { color: popupStyle.styles.buttonTextColor }]}>
                          Save
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>

              {/* Status Page Layout Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Status Page Layout</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Choose how your Status page is displayed
                </Text>
                
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.popupStyleScroll}
                  contentContainerStyle={styles.popupStyleScrollContent}
                >
                  {STATUS_LAYOUTS.map((layout) => (
                    <TouchableOpacity
                      key={layout.id}
                      style={[
                        styles.layoutCard,
                        { 
                          backgroundColor: colors.surface,
                          borderColor: statusLayout.id === layout.id ? statusTheme.colors.primary : colors.border,
                          borderWidth: 2,
                        }
                      ]}
                      onPress={() => setStatusLayout(layout.id)}
                    >
                      <View style={[
                        styles.layoutPreview,
                        { backgroundColor: colors.cardBackground }
                      ]}>
                        <Text style={styles.layoutEmoji}>{layout.preview}</Text>
                        {/* Mini layout visualization */}
                        <View style={styles.layoutMiniPreview}>
                          {layout.layout.avatarPosition !== 'hidden' && (
                            <View style={[
                              styles.miniAvatar,
                              layout.layout.avatarSize === 'large' && styles.miniAvatarLarge,
                              { backgroundColor: statusTheme.colors.primary + '40' }
                            ]} />
                          )}
                          <View style={styles.miniStats}>
                            {[1, 2, 3].slice(0, layout.layout.statsColumns).map((_, i) => (
                              <View 
                                key={i} 
                                style={[
                                  styles.miniStatBar,
                                  { backgroundColor: statusTheme.colors.primary + '60' }
                                ]} 
                              />
                            ))}
                          </View>
                        </View>
                      </View>
                      <Text style={[styles.layoutName, { color: colors.text }]}>
                        {layout.name}
                      </Text>
                      <Text style={[styles.layoutDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                        {layout.description}
                      </Text>
                      {statusLayout.id === layout.id && (
                        <View style={[styles.popupStyleSelected, { backgroundColor: statusTheme.colors.primary }]}>
                          <Ionicons name="checkmark" size={12} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>

              {/* Animation Style Section */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Popup Animation</Text>
                <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
                  Choose how quest completion popups animate
                </Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.animationScrollView}
                  contentContainerStyle={styles.animationScrollContent}
                >
                  {ANIMATION_STYLES.map((anim) => (
                    <TouchableOpacity
                      key={anim.id}
                      style={[
                        styles.animationCard,
                        { 
                          backgroundColor: colors.surface,
                          borderColor: animationStyle.id === anim.id ? statusTheme.colors.primary : colors.border,
                          borderWidth: 2,
                        }
                      ]}
                      onPress={() => setAnimationStyle(anim.id)}
                    >
                      <View style={[
                        styles.animationPreview,
                        { backgroundColor: colors.cardBackground }
                      ]}>
                        <Text style={styles.animationEmoji}>{anim.preview}</Text>
                      </View>
                      <Text style={[styles.animationName, { color: colors.text }]}>
                        {anim.name}
                      </Text>
                      <Text style={[styles.animationDesc, { color: colors.textSecondary }]} numberOfLines={2}>
                        {anim.description}
                      </Text>
                      {animationStyle.id === anim.id && (
                        <View style={[styles.animationSelected, { backgroundColor: statusTheme.colors.primary }]}>
                          <Ionicons name="checkmark" size={12} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
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
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  customizeContainer: {
    flex: 1,
    width: '100%',
    borderRadius: 0,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
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
  closeButton: {
    padding: 4,
  },
  customizeSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  customizeContent: {
    flex: 1,
  },
  customizeScrollContent: {
    paddingBottom: 40,
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
  customImageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  customImagePicker: {
    width: 70,
    height: 70,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    overflow: 'hidden',
  },
  customImagePreview: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  customImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  customImageText: {
    fontSize: 10,
    marginTop: 4,
  },
  clearImageButton: {
    marginLeft: 12,
    padding: 4,
  },
  presetLabel: {
    fontSize: 12,
    marginBottom: 8,
    marginTop: 4,
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
  // Background customization styles
  bgTypeSelector: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  bgTypeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  bgTypeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  bgColorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  bgColorSwatch: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
  },
  bgImagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  bgImagePreview: {
    width: 120,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  bgImageRemove: {
    position: 'absolute',
    top: -8,
    right: '35%',
  },
  bgImageLabel: {
    fontSize: 12,
  },
  bgPreviewContainer: {
    marginTop: 8,
  },
  bgPreview: {
    height: 100,
    borderRadius: 12,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bgPreviewImage: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  bgPreviewCard: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  bgPreviewText: {
    fontSize: 14,
    fontWeight: '600',
  },
  // Popup Style customization styles
  popupStyleScroll: {
    marginVertical: 12,
  },
  popupStyleScrollContent: {
    paddingRight: 20,
    gap: 12,
  },
  popupStyleCard: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  popupStylePreview: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  popupStyleEmoji: {
    fontSize: 28,
  },
  popupStyleName: {
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  popupStyleDesc: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
  popupStyleSelected: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Status Layout styles
  layoutCard: {
    width: 140,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  layoutPreview: {
    width: 80,
    height: 70,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    overflow: 'hidden',
  },
  layoutEmoji: {
    fontSize: 24,
    marginBottom: 4,
  },
  layoutMiniPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
  },
  miniAvatar: {
    width: 16,
    height: 16,
    borderRadius: 8,
  },
  miniAvatarLarge: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  miniStats: {
    flex: 1,
    gap: 3,
  },
  miniStatBar: {
    height: 4,
    borderRadius: 2,
    width: '100%',
  },
  layoutName: {
    fontSize: 11,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  layoutDesc: {
    fontSize: 9,
    textAlign: 'center',
    lineHeight: 12,
  },
  popupPreviewContainer: {
    marginTop: 12,
  },
  popupPreview: {
    height: 150,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  popupPreviewModal: {
    width: '80%',
    padding: 0,
    overflow: 'hidden',
  },
  popupPreviewHeader: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  popupPreviewTitle: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  popupPreviewBody: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  popupPreviewBodyText: {
    fontSize: 10,
  },
  popupPreviewButton: {
    marginHorizontal: 12,
    marginBottom: 12,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  popupPreviewButtonText: {
    fontSize: 10,
    fontWeight: '600',
  },
});