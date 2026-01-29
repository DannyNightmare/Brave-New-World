import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Popup Style definitions
export interface PopupStyle {
  id: string;
  name: string;
  description: string;
  preview: string;
  styles: {
    overlayColor: string;
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    headerBg: string;
    headerTextColor: string;
    bodyBg: string;
    bodyTextColor: string;
    buttonBg: string;
    buttonTextColor: string;
    shadowColor: string;
    shadowOpacity: number;
    glowEnabled: boolean;
    glowColor: string;
    animation: 'fade' | 'slide' | 'scale' | 'none';
  };
}

// Predefined popup styles - includes anime-inspired themes
export const POPUP_STYLES: PopupStyle[] = [
  {
    id: 'default',
    name: 'Classic Dark',
    description: 'Clean dark modal with rounded corners',
    preview: '🌑',
    styles: {
      overlayColor: 'rgba(0, 0, 0, 0.7)',
      backgroundColor: '#1F2937',
      borderColor: '#374151',
      borderWidth: 1,
      borderRadius: 16,
      headerBg: '#111827',
      headerTextColor: '#F9FAFB',
      bodyBg: '#1F2937',
      bodyTextColor: '#D1D5DB',
      buttonBg: '#8B5CF6',
      buttonTextColor: '#FFFFFF',
      shadowColor: '#000000',
      shadowOpacity: 0.5,
      glowEnabled: false,
      glowColor: '#8B5CF6',
      animation: 'fade',
    },
  },
  // ===== ANIME-INSPIRED STYLES =====
  {
    id: 'sao-system',
    name: 'SAO System UI',
    description: 'Sword Art Online holographic interface',
    preview: '⚔️',
    styles: {
      overlayColor: 'rgba(0, 8, 20, 0.9)',
      backgroundColor: 'rgba(0, 30, 60, 0.95)',
      borderColor: '#00d4ff',
      borderWidth: 2,
      borderRadius: 4,
      headerBg: 'rgba(0, 50, 80, 0.9)',
      headerTextColor: '#00ffff',
      bodyBg: 'rgba(0, 30, 60, 0.95)',
      bodyTextColor: '#b0e0ff',
      buttonBg: '#00a8cc',
      buttonTextColor: '#ffffff',
      shadowColor: '#00d4ff',
      shadowOpacity: 0.8,
      glowEnabled: true,
      glowColor: '#00d4ff',
      animation: 'scale',
    },
  },
  {
    id: 'shield-hero',
    name: 'Shield Hero',
    description: 'Rise of the Shield Hero fantasy parchment',
    preview: '🛡️',
    styles: {
      overlayColor: 'rgba(20, 15, 5, 0.85)',
      backgroundColor: '#2a2318',
      borderColor: '#c9a227',
      borderWidth: 3,
      borderRadius: 8,
      headerBg: '#3d3425',
      headerTextColor: '#ffd700',
      bodyBg: '#2a2318',
      bodyTextColor: '#e8dcc8',
      buttonBg: '#228b22',
      buttonTextColor: '#ffffff',
      shadowColor: '#c9a227',
      shadowOpacity: 0.6,
      glowEnabled: true,
      glowColor: '#228b22',
      animation: 'slide',
    },
  },
  {
    id: 'solo-leveling',
    name: 'Solo Leveling',
    description: 'System notification from Solo Leveling',
    preview: '👤',
    styles: {
      overlayColor: 'rgba(5, 0, 15, 0.95)',
      backgroundColor: '#0a0015',
      borderColor: '#6b21a8',
      borderWidth: 2,
      borderRadius: 0,
      headerBg: '#1a0030',
      headerTextColor: '#a855f7',
      bodyBg: '#0a0015',
      bodyTextColor: '#c4b5fd',
      buttonBg: '#7c3aed',
      buttonTextColor: '#ffffff',
      shadowColor: '#a855f7',
      shadowOpacity: 0.9,
      glowEnabled: true,
      glowColor: '#a855f7',
      animation: 'scale',
    },
  },
  {
    id: 'demon-slayer',
    name: 'Demon Slayer',
    description: 'Traditional Japanese water breathing style',
    preview: '🌊',
    styles: {
      overlayColor: 'rgba(0, 10, 20, 0.9)',
      backgroundColor: '#0a1628',
      borderColor: '#38bdf8',
      borderWidth: 2,
      borderRadius: 12,
      headerBg: '#0c4a6e',
      headerTextColor: '#7dd3fc',
      bodyBg: '#0a1628',
      bodyTextColor: '#bae6fd',
      buttonBg: '#0284c7',
      buttonTextColor: '#ffffff',
      shadowColor: '#38bdf8',
      shadowOpacity: 0.7,
      glowEnabled: true,
      glowColor: '#38bdf8',
      animation: 'fade',
    },
  },
  {
    id: 'my-hero',
    name: 'My Hero Academia',
    description: 'Plus Ultra! Hero license style',
    preview: '💥',
    styles: {
      overlayColor: 'rgba(10, 0, 0, 0.85)',
      backgroundColor: '#1a0a0a',
      borderColor: '#ef4444',
      borderWidth: 3,
      borderRadius: 16,
      headerBg: '#450a0a',
      headerTextColor: '#fca5a5',
      bodyBg: '#1a0a0a',
      bodyTextColor: '#fecaca',
      buttonBg: '#22c55e',
      buttonTextColor: '#ffffff',
      shadowColor: '#ef4444',
      shadowOpacity: 0.6,
      glowEnabled: true,
      glowColor: '#22c55e',
      animation: 'scale',
    },
  },
  {
    id: 'attack-titan',
    name: 'Attack on Titan',
    description: 'Survey Corps military report style',
    preview: '🦅',
    styles: {
      overlayColor: 'rgba(15, 15, 10, 0.9)',
      backgroundColor: '#1c1c14',
      borderColor: '#78716c',
      borderWidth: 2,
      borderRadius: 2,
      headerBg: '#292524',
      headerTextColor: '#d6d3d1',
      bodyBg: '#1c1c14',
      bodyTextColor: '#a8a29e',
      buttonBg: '#065f46',
      buttonTextColor: '#ffffff',
      shadowColor: '#78716c',
      shadowOpacity: 0.5,
      glowEnabled: false,
      glowColor: '#78716c',
      animation: 'fade',
    },
  },
  {
    id: 'dragon-ball',
    name: 'Dragon Ball Z',
    description: 'Saiyan power level scanner',
    preview: '🔥',
    styles: {
      overlayColor: 'rgba(20, 10, 0, 0.9)',
      backgroundColor: '#1a0f00',
      borderColor: '#f97316',
      borderWidth: 2,
      borderRadius: 8,
      headerBg: '#431407',
      headerTextColor: '#fdba74',
      bodyBg: '#1a0f00',
      bodyTextColor: '#fed7aa',
      buttonBg: '#ea580c',
      buttonTextColor: '#ffffff',
      shadowColor: '#f97316',
      shadowOpacity: 0.8,
      glowEnabled: true,
      glowColor: '#fbbf24',
      animation: 'scale',
    },
  },
  {
    id: 'naruto-scroll',
    name: 'Naruto Scroll',
    description: 'Hidden Leaf Village mission scroll',
    preview: '🍥',
    styles: {
      overlayColor: 'rgba(15, 10, 0, 0.85)',
      backgroundColor: '#1f1a0a',
      borderColor: '#f97316',
      borderWidth: 2,
      borderRadius: 6,
      headerBg: '#3d2800',
      headerTextColor: '#fb923c',
      bodyBg: '#1f1a0a',
      bodyTextColor: '#fcd9b6',
      buttonBg: '#ea580c',
      buttonTextColor: '#000000',
      shadowColor: '#f97316',
      shadowOpacity: 0.5,
      glowEnabled: false,
      glowColor: '#f97316',
      animation: 'slide',
    },
  },
  {
    id: 'one-punch',
    name: 'One Punch Man',
    description: 'Hero Association rank notification',
    preview: '👊',
    styles: {
      overlayColor: 'rgba(20, 15, 0, 0.85)',
      backgroundColor: '#1a1500',
      borderColor: '#fbbf24',
      borderWidth: 3,
      borderRadius: 0,
      headerBg: '#422006',
      headerTextColor: '#fde047',
      bodyBg: '#1a1500',
      bodyTextColor: '#fef08a',
      buttonBg: '#dc2626',
      buttonTextColor: '#ffffff',
      shadowColor: '#fbbf24',
      shadowOpacity: 0.6,
      glowEnabled: true,
      glowColor: '#fbbf24',
      animation: 'scale',
    },
  },
  {
    id: 'jujutsu-kaisen',
    name: 'Jujutsu Kaisen',
    description: 'Cursed energy domain expansion',
    preview: '👁️',
    styles: {
      overlayColor: 'rgba(5, 0, 10, 0.95)',
      backgroundColor: '#050010',
      borderColor: '#dc2626',
      borderWidth: 2,
      borderRadius: 4,
      headerBg: '#1a0010',
      headerTextColor: '#f87171',
      bodyBg: '#050010',
      bodyTextColor: '#fca5a5',
      buttonBg: '#1e40af',
      buttonTextColor: '#ffffff',
      shadowColor: '#dc2626',
      shadowOpacity: 0.8,
      glowEnabled: true,
      glowColor: '#dc2626',
      animation: 'scale',
    },
  },
  {
    id: 'overlord',
    name: 'Overlord',
    description: 'Great Tomb of Nazarick system',
    preview: '💀',
    styles: {
      overlayColor: 'rgba(10, 0, 5, 0.95)',
      backgroundColor: '#0f0008',
      borderColor: '#b91c1c',
      borderWidth: 2,
      borderRadius: 6,
      headerBg: '#1f0010',
      headerTextColor: '#fca5a5',
      bodyBg: '#0f0008',
      bodyTextColor: '#fecaca',
      buttonBg: '#7f1d1d',
      buttonTextColor: '#fef2f2',
      shadowColor: '#b91c1c',
      shadowOpacity: 0.7,
      glowEnabled: true,
      glowColor: '#991b1b',
      animation: 'fade',
    },
  },
  {
    id: 're-zero',
    name: 'Re:Zero',
    description: 'Witch of Envy dark fantasy',
    preview: '🦋',
    styles: {
      overlayColor: 'rgba(10, 0, 20, 0.9)',
      backgroundColor: '#0f001a',
      borderColor: '#a855f7',
      borderWidth: 1,
      borderRadius: 16,
      headerBg: '#1e0030',
      headerTextColor: '#d8b4fe',
      bodyBg: '#0f001a',
      bodyTextColor: '#e9d5ff',
      buttonBg: '#7e22ce',
      buttonTextColor: '#ffffff',
      shadowColor: '#a855f7',
      shadowOpacity: 0.6,
      glowEnabled: true,
      glowColor: '#c084fc',
      animation: 'fade',
    },
  },
  {
    id: 'konosuba',
    name: 'KonoSuba',
    description: 'Adventurer Guild quest board',
    preview: '🎭',
    styles: {
      overlayColor: 'rgba(15, 10, 5, 0.85)',
      backgroundColor: '#1a1408',
      borderColor: '#a3834a',
      borderWidth: 2,
      borderRadius: 10,
      headerBg: '#2d2410',
      headerTextColor: '#e7c896',
      bodyBg: '#1a1408',
      bodyTextColor: '#d4bc94',
      buttonBg: '#2563eb',
      buttonTextColor: '#ffffff',
      shadowColor: '#a3834a',
      shadowOpacity: 0.4,
      glowEnabled: false,
      glowColor: '#a3834a',
      animation: 'slide',
    },
  },
  {
    id: 'goblin-slayer',
    name: 'Goblin Slayer',
    description: 'Guild quest completion notice',
    preview: '⚔️',
    styles: {
      overlayColor: 'rgba(10, 10, 8, 0.9)',
      backgroundColor: '#141410',
      borderColor: '#737373',
      borderWidth: 1,
      borderRadius: 4,
      headerBg: '#262620',
      headerTextColor: '#a3a3a3',
      bodyBg: '#141410',
      bodyTextColor: '#d4d4d4',
      buttonBg: '#525252',
      buttonTextColor: '#ffffff',
      shadowColor: '#737373',
      shadowOpacity: 0.5,
      glowEnabled: false,
      glowColor: '#737373',
      animation: 'fade',
    },
  },
  // ===== ORIGINAL STYLES =====
  {
    id: 'neon-cyber',
    name: 'Neon Cyber',
    description: 'Cyberpunk-style with neon glow effects',
    preview: '💜',
    styles: {
      overlayColor: 'rgba(10, 0, 20, 0.9)',
      backgroundColor: '#0a0014',
      borderColor: '#ff00ff',
      borderWidth: 2,
      borderRadius: 4,
      headerBg: '#1a0028',
      headerTextColor: '#ff00ff',
      bodyBg: '#0a0014',
      bodyTextColor: '#e0b0ff',
      buttonBg: '#ff00ff',
      buttonTextColor: '#000000',
      shadowColor: '#ff00ff',
      shadowOpacity: 0.8,
      glowEnabled: true,
      glowColor: '#ff00ff',
      animation: 'scale',
    },
  },
  {
    id: 'royal-gold',
    name: 'Royal Gold',
    description: 'Elegant gold and black royal design',
    preview: '👑',
    styles: {
      overlayColor: 'rgba(20, 15, 0, 0.85)',
      backgroundColor: '#1a1400',
      borderColor: '#FFD700',
      borderWidth: 2,
      borderRadius: 12,
      headerBg: '#3d2e00',
      headerTextColor: '#FFD700',
      bodyBg: '#1a1400',
      bodyTextColor: '#f5e6a3',
      buttonBg: '#FFD700',
      buttonTextColor: '#1a1400',
      shadowColor: '#FFD700',
      shadowOpacity: 0.4,
      glowEnabled: true,
      glowColor: '#FFD700',
      animation: 'slide',
    },
  },
  {
    id: 'sakura-pink',
    name: 'Sakura Bloom',
    description: 'Soft pink cherry blossom theme',
    preview: '🌸',
    styles: {
      overlayColor: 'rgba(20, 5, 10, 0.85)',
      backgroundColor: '#1f0a14',
      borderColor: '#ff69b4',
      borderWidth: 1,
      borderRadius: 24,
      headerBg: '#2d1020',
      headerTextColor: '#ff69b4',
      bodyBg: '#1f0a14',
      bodyTextColor: '#ffb6c1',
      buttonBg: '#ff69b4',
      buttonTextColor: '#1f0a14',
      shadowColor: '#ff69b4',
      shadowOpacity: 0.5,
      glowEnabled: true,
      glowColor: '#ff69b4',
      animation: 'scale',
    },
  },
];

// Status Page Layout definitions
export interface StatusLayout {
  id: string;
  name: string;
  description: string;
  preview: string;
  layout: {
    headerStyle: 'banner' | 'compact' | 'centered' | 'minimal' | 'split';
    statsDisplay: 'cards' | 'list' | 'grid' | 'bars' | 'circular';
    avatarPosition: 'top' | 'left' | 'hidden' | 'background';
    avatarSize: 'small' | 'medium' | 'large' | 'fullWidth';
    showLevel: 'badge' | 'large' | 'inline' | 'hidden';
    hpMpStyle: 'bars' | 'circular' | 'numeric' | 'minimal';
    statsColumns: 1 | 2 | 3;
    cardStyle: 'elevated' | 'flat' | 'outlined' | 'glass';
    spacing: 'compact' | 'normal' | 'relaxed';
  };
}

// Animation Style definitions for popup animations
export interface AnimationStyle {
  id: string;
  name: string;
  description: string;
  preview: string;
}

// Predefined Animation Styles
export const ANIMATION_STYLES: AnimationStyle[] = [
  {
    id: 'burst',
    name: 'Epic Burst',
    description: 'Flash, rings, and sparkles explosion',
    preview: '💥',
  },
  {
    id: 'fade',
    name: 'Smooth Fade',
    description: 'Simple elegant fade in',
    preview: '🌟',
  },
  {
    id: 'slide-up',
    name: 'Slide Up',
    description: 'Slides up from bottom with bounce',
    preview: '⬆️',
  },
  {
    id: 'scale-bounce',
    name: 'Scale Bounce',
    description: 'Pops in with bouncy scaling',
    preview: '🎈',
  },
  {
    id: 'spiral',
    name: 'Spiral Entry',
    description: 'Spins in with rotation effect',
    preview: '🌀',
  },
  {
    id: 'glitch',
    name: 'Digital Glitch',
    description: 'Cyberpunk-style glitch effect',
    preview: '📺',
  },
  {
    id: 'none',
    name: 'No Animation',
    description: 'Instant appearance, no effects',
    preview: '⏹️',
  },
];

// Predefined Status Page Layouts
export const STATUS_LAYOUTS: StatusLayout[] = [
  {
    id: 'default',
    name: 'Classic RPG',
    description: 'Traditional RPG character sheet layout',
    preview: '📋',
    layout: {
      headerStyle: 'banner',
      statsDisplay: 'cards',
      avatarPosition: 'top',
      avatarSize: 'medium',
      showLevel: 'badge',
      hpMpStyle: 'bars',
      statsColumns: 2,
      cardStyle: 'elevated',
      spacing: 'normal',
    },
  },
  {
    id: 'minimal',
    name: 'Minimal Clean',
    description: 'Clean and simple with focus on essentials',
    preview: '✨',
    layout: {
      headerStyle: 'minimal',
      statsDisplay: 'list',
      avatarPosition: 'left',
      avatarSize: 'small',
      showLevel: 'inline',
      hpMpStyle: 'minimal',
      statsColumns: 1,
      cardStyle: 'flat',
      spacing: 'compact',
    },
  },
  {
    id: 'gaming-hud',
    name: 'Gaming HUD',
    description: 'Video game heads-up display style',
    preview: '🎮',
    layout: {
      headerStyle: 'compact',
      statsDisplay: 'bars',
      avatarPosition: 'left',
      avatarSize: 'small',
      showLevel: 'large',
      hpMpStyle: 'bars',
      statsColumns: 1,
      cardStyle: 'glass',
      spacing: 'compact',
    },
  },
  {
    id: 'character-sheet',
    name: 'Character Sheet',
    description: 'D&D-inspired detailed character sheet',
    preview: '📜',
    layout: {
      headerStyle: 'centered',
      statsDisplay: 'grid',
      avatarPosition: 'top',
      avatarSize: 'large',
      showLevel: 'badge',
      hpMpStyle: 'bars',
      statsColumns: 3,
      cardStyle: 'outlined',
      spacing: 'relaxed',
    },
  },
  {
    id: 'profile-card',
    name: 'Profile Card',
    description: 'Social media style profile presentation',
    preview: '👤',
    layout: {
      headerStyle: 'banner',
      statsDisplay: 'grid',
      avatarPosition: 'top',
      avatarSize: 'large',
      showLevel: 'badge',
      hpMpStyle: 'circular',
      statsColumns: 2,
      cardStyle: 'elevated',
      spacing: 'normal',
    },
  },
  {
    id: 'dashboard',
    name: 'Dashboard',
    description: 'Analytics-style dashboard with metrics',
    preview: '📊',
    layout: {
      headerStyle: 'compact',
      statsDisplay: 'cards',
      avatarPosition: 'left',
      avatarSize: 'small',
      showLevel: 'large',
      hpMpStyle: 'numeric',
      statsColumns: 2,
      cardStyle: 'elevated',
      spacing: 'normal',
    },
  },
  {
    id: 'retro-pixel',
    name: 'Retro Pixel',
    description: '8-bit retro gaming inspired layout',
    preview: '👾',
    layout: {
      headerStyle: 'compact',
      statsDisplay: 'bars',
      avatarPosition: 'left',
      avatarSize: 'small',
      showLevel: 'badge',
      hpMpStyle: 'bars',
      statsColumns: 1,
      cardStyle: 'flat',
      spacing: 'compact',
    },
  },
  {
    id: 'hero-showcase',
    name: 'Hero Showcase',
    description: 'Large avatar with stats below',
    preview: '🦸',
    layout: {
      headerStyle: 'centered',
      statsDisplay: 'cards',
      avatarPosition: 'background',
      avatarSize: 'fullWidth',
      showLevel: 'large',
      hpMpStyle: 'bars',
      statsColumns: 2,
      cardStyle: 'glass',
      spacing: 'relaxed',
    },
  },
  {
    id: 'compact-mobile',
    name: 'Compact Mobile',
    description: 'Optimized for small screens',
    preview: '📱',
    layout: {
      headerStyle: 'compact',
      statsDisplay: 'list',
      avatarPosition: 'hidden',
      avatarSize: 'small',
      showLevel: 'inline',
      hpMpStyle: 'minimal',
      statsColumns: 1,
      cardStyle: 'flat',
      spacing: 'compact',
    },
  },
  {
    id: 'stats-focus',
    name: 'Stats Focus',
    description: 'Emphasizes stats and progression',
    preview: '📈',
    layout: {
      headerStyle: 'minimal',
      statsDisplay: 'bars',
      avatarPosition: 'hidden',
      avatarSize: 'small',
      showLevel: 'large',
      hpMpStyle: 'bars',
      statsColumns: 1,
      cardStyle: 'outlined',
      spacing: 'normal',
    },
  },
];

// Status Display Theme definitions
export interface StatusTheme {
  id: string;
  name: string;
  description: string;
  anime?: string;
  colors: {
    background: string;
    cardBackground: string;
    cardBorder: string;
    primary: string;
    secondary: string;
    accent: string;
    text: string;
    textSecondary: string;
    xpBarBg: string;
    xpBarFill: string;
    statBarBg: string;
    statBarFill: string;
    levelBadgeBg: string;
    levelBadgeText: string;
    goldColor: string;
    apColor: string;
  };
  effects: {
    glowEnabled: boolean;
    glowColor?: string;
    borderStyle: 'solid' | 'double' | 'glow' | 'none';
    cornerStyle: 'rounded' | 'sharp' | 'hexagonal' | 'clipped';
  };
  fonts: {
    headerStyle: 'bold' | 'light' | 'futuristic' | 'fantasy';
  };
}

// Predefined themes inspired by various anime status screens
export const STATUS_THEMES: StatusTheme[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Your current custom design',
    colors: {
      background: '#111827',
      cardBackground: '#1F2937',
      cardBorder: '#374151',
      primary: '#8B5CF6',
      secondary: '#6366F1',
      accent: '#10B981',
      text: '#F9FAFB',
      textSecondary: '#9CA3AF',
      xpBarBg: 'rgba(139, 92, 246, 0.2)',
      xpBarFill: '#8B5CF6',
      statBarBg: 'rgba(255, 255, 255, 0.1)',
      statBarFill: '#3B82F6',
      levelBadgeBg: '#8B5CF6',
      levelBadgeText: '#FFFFFF',
      goldColor: '#F59E0B',
      apColor: '#8B5CF6',
    },
    effects: {
      glowEnabled: false,
      borderStyle: 'solid',
      cornerStyle: 'rounded',
    },
    fonts: {
      headerStyle: 'bold',
    },
  },
  {
    id: 'solo-leveling',
    name: 'Shadow Monarch',
    description: 'Dark blue interface with glowing effects',
    anime: 'Solo Leveling',
    colors: {
      background: '#0a0e1a',
      cardBackground: '#0f172a',
      cardBorder: '#1e3a5f',
      primary: '#3b82f6',
      secondary: '#1d4ed8',
      accent: '#06b6d4',
      text: '#e2e8f0',
      textSecondary: '#64748b',
      xpBarBg: 'rgba(59, 130, 246, 0.15)',
      xpBarFill: '#3b82f6',
      statBarBg: 'rgba(6, 182, 212, 0.15)',
      statBarFill: '#06b6d4',
      levelBadgeBg: '#1d4ed8',
      levelBadgeText: '#e2e8f0',
      goldColor: '#fbbf24',
      apColor: '#3b82f6',
    },
    effects: {
      glowEnabled: true,
      glowColor: '#3b82f6',
      borderStyle: 'glow',
      cornerStyle: 'sharp',
    },
    fonts: {
      headerStyle: 'futuristic',
    },
  },
  {
    id: 'sword-art',
    name: 'Aincrad',
    description: 'Clean white and orange gaming UI',
    anime: 'Sword Art Online',
    colors: {
      background: '#1a1a2e',
      cardBackground: '#16213e',
      cardBorder: '#e94560',
      primary: '#e94560',
      secondary: '#ff6b6b',
      accent: '#feca57',
      text: '#ffffff',
      textSecondary: '#a0a0a0',
      xpBarBg: 'rgba(233, 69, 96, 0.2)',
      xpBarFill: '#e94560',
      statBarBg: 'rgba(254, 202, 87, 0.15)',
      statBarFill: '#feca57',
      levelBadgeBg: '#e94560',
      levelBadgeText: '#ffffff',
      goldColor: '#feca57',
      apColor: '#ff6b6b',
    },
    effects: {
      glowEnabled: true,
      glowColor: '#e94560',
      borderStyle: 'double',
      cornerStyle: 'clipped',
    },
    fonts: {
      headerStyle: 'futuristic',
    },
  },
  {
    id: 'slime',
    name: 'Great Sage',
    description: 'Elegant blue holographic display',
    anime: 'That Time I Got Reincarnated as a Slime',
    colors: {
      background: '#0c1929',
      cardBackground: '#0f2744',
      cardBorder: '#2dd4bf',
      primary: '#2dd4bf',
      secondary: '#14b8a6',
      accent: '#a78bfa',
      text: '#f0fdfa',
      textSecondary: '#5eead4',
      xpBarBg: 'rgba(45, 212, 191, 0.15)',
      xpBarFill: '#2dd4bf',
      statBarBg: 'rgba(167, 139, 250, 0.15)',
      statBarFill: '#a78bfa',
      levelBadgeBg: '#0d9488',
      levelBadgeText: '#f0fdfa',
      goldColor: '#fbbf24',
      apColor: '#2dd4bf',
    },
    effects: {
      glowEnabled: true,
      glowColor: '#2dd4bf',
      borderStyle: 'glow',
      cornerStyle: 'rounded',
    },
    fonts: {
      headerStyle: 'light',
    },
  },
  {
    id: 'overlord',
    name: 'Nazarick',
    description: 'Dark gothic with gold accents',
    anime: 'Overlord',
    colors: {
      background: '#0d0d0d',
      cardBackground: '#1a1a1a',
      cardBorder: '#d4af37',
      primary: '#d4af37',
      secondary: '#b8860b',
      accent: '#8b0000',
      text: '#f5f5dc',
      textSecondary: '#808080',
      xpBarBg: 'rgba(212, 175, 55, 0.15)',
      xpBarFill: '#d4af37',
      statBarBg: 'rgba(139, 0, 0, 0.2)',
      statBarFill: '#8b0000',
      levelBadgeBg: '#8b0000',
      levelBadgeText: '#d4af37',
      goldColor: '#d4af37',
      apColor: '#8b0000',
    },
    effects: {
      glowEnabled: true,
      glowColor: '#d4af37',
      borderStyle: 'double',
      cornerStyle: 'sharp',
    },
    fonts: {
      headerStyle: 'fantasy',
    },
  },
  {
    id: 'shield-hero',
    name: 'Cardinal',
    description: 'Green and amber RPG interface',
    anime: 'Rising of the Shield Hero',
    colors: {
      background: '#1a2f1a',
      cardBackground: '#1e3a1e',
      cardBorder: '#4ade80',
      primary: '#4ade80',
      secondary: '#22c55e',
      accent: '#fbbf24',
      text: '#ecfdf5',
      textSecondary: '#86efac',
      xpBarBg: 'rgba(74, 222, 128, 0.15)',
      xpBarFill: '#4ade80',
      statBarBg: 'rgba(251, 191, 36, 0.15)',
      statBarFill: '#fbbf24',
      levelBadgeBg: '#15803d',
      levelBadgeText: '#ecfdf5',
      goldColor: '#fbbf24',
      apColor: '#4ade80',
    },
    effects: {
      glowEnabled: false,
      borderStyle: 'solid',
      cornerStyle: 'rounded',
    },
    fonts: {
      headerStyle: 'fantasy',
    },
  },
  {
    id: 'demon-slayer',
    name: 'Hashira',
    description: 'Traditional Japanese style with vibrant colors',
    anime: 'Demon Slayer',
    colors: {
      background: '#1c1c1c',
      cardBackground: '#2d2d2d',
      cardBorder: '#ff6b9d',
      primary: '#ff6b9d',
      secondary: '#c084fc',
      accent: '#38bdf8',
      text: '#fafafa',
      textSecondary: '#a1a1aa',
      xpBarBg: 'rgba(255, 107, 157, 0.2)',
      xpBarFill: '#ff6b9d',
      statBarBg: 'rgba(56, 189, 248, 0.15)',
      statBarFill: '#38bdf8',
      levelBadgeBg: '#be185d',
      levelBadgeText: '#fafafa',
      goldColor: '#fbbf24',
      apColor: '#c084fc',
    },
    effects: {
      glowEnabled: true,
      glowColor: '#ff6b9d',
      borderStyle: 'solid',
      cornerStyle: 'rounded',
    },
    fonts: {
      headerStyle: 'bold',
    },
  },
  {
    id: 'jujutsu',
    name: 'Cursed Energy',
    description: 'Dark purple with cursed energy vibes',
    anime: 'Jujutsu Kaisen',
    colors: {
      background: '#0f0a19',
      cardBackground: '#1a1025',
      cardBorder: '#7c3aed',
      primary: '#7c3aed',
      secondary: '#a855f7',
      accent: '#f43f5e',
      text: '#f5f3ff',
      textSecondary: '#a78bfa',
      xpBarBg: 'rgba(124, 58, 237, 0.2)',
      xpBarFill: '#7c3aed',
      statBarBg: 'rgba(244, 63, 94, 0.15)',
      statBarFill: '#f43f5e',
      levelBadgeBg: '#5b21b6',
      levelBadgeText: '#f5f3ff',
      goldColor: '#fbbf24',
      apColor: '#a855f7',
    },
    effects: {
      glowEnabled: true,
      glowColor: '#7c3aed',
      borderStyle: 'glow',
      cornerStyle: 'hexagonal',
    },
    fonts: {
      headerStyle: 'bold',
    },
  },
  {
    id: 'cyberpunk',
    name: 'Night City',
    description: 'Neon cyberpunk aesthetic',
    anime: 'Cyberpunk: Edgerunners',
    colors: {
      background: '#0a0a0f',
      cardBackground: '#12121a',
      cardBorder: '#00ffff',
      primary: '#00ffff',
      secondary: '#ff00ff',
      accent: '#ffff00',
      text: '#ffffff',
      textSecondary: '#00ffff',
      xpBarBg: 'rgba(0, 255, 255, 0.15)',
      xpBarFill: '#00ffff',
      statBarBg: 'rgba(255, 0, 255, 0.15)',
      statBarFill: '#ff00ff',
      levelBadgeBg: '#ff00ff',
      levelBadgeText: '#ffffff',
      goldColor: '#ffff00',
      apColor: '#00ffff',
    },
    effects: {
      glowEnabled: true,
      glowColor: '#00ffff',
      borderStyle: 'glow',
      cornerStyle: 'clipped',
    },
    fonts: {
      headerStyle: 'futuristic',
    },
  },
  {
    id: 'dragon-ball',
    name: 'Scouter',
    description: 'Orange and blue power level display',
    anime: 'Dragon Ball Z',
    colors: {
      background: '#0f1419',
      cardBackground: '#1a2634',
      cardBorder: '#f97316',
      primary: '#f97316',
      secondary: '#fb923c',
      accent: '#3b82f6',
      text: '#fff7ed',
      textSecondary: '#fdba74',
      xpBarBg: 'rgba(249, 115, 22, 0.2)',
      xpBarFill: '#f97316',
      statBarBg: 'rgba(59, 130, 246, 0.15)',
      statBarFill: '#3b82f6',
      levelBadgeBg: '#ea580c',
      levelBadgeText: '#fff7ed',
      goldColor: '#fbbf24',
      apColor: '#f97316',
    },
    effects: {
      glowEnabled: true,
      glowColor: '#f97316',
      borderStyle: 'solid',
      cornerStyle: 'rounded',
    },
    fonts: {
      headerStyle: 'bold',
    },
  },
];

interface CustomizationContextType {
  xpBarColor: string;
  goldIcon: string;
  apIcon: string;
  goldCustomImage: string | null;
  apCustomImage: string | null;
  statusTheme: StatusTheme;
  backgroundType: 'theme' | 'color' | 'image' | 'gif';
  backgroundColor: string;
  backgroundImage: string | null;
  popupStyle: PopupStyle;
  setXpBarColor: (color: string) => void;
  setGoldIcon: (icon: string) => void;
  setApIcon: (icon: string) => void;
  setGoldCustomImage: (image: string | null) => void;
  setApCustomImage: (image: string | null) => void;
  setStatusTheme: (themeId: string) => void;
  setBackgroundType: (type: 'theme' | 'color' | 'image' | 'gif') => void;
  setBackgroundColor: (color: string) => void;
  setBackgroundImage: (image: string | null) => void;
  setPopupStyle: (styleId: string) => void;
  setStatusLayout: (layoutId: string) => void;
  setAnimationStyle: (styleId: string) => void;
  getThemeById: (id: string) => StatusTheme;
  getPopupStyleById: (id: string) => PopupStyle;
  getStatusLayoutById: (id: string) => StatusLayout;
  getAnimationStyleById: (id: string) => AnimationStyle;
  statusLayout: StatusLayout;
  animationStyle: AnimationStyle;
}

const CustomizationContext = createContext<CustomizationContextType | undefined>(undefined);

export const CustomizationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [xpBarColor, setXpBarColorState] = useState('#8B5CF6'); // Default purple
  const [goldIcon, setGoldIconState] = useState('logo-bitcoin'); // Default coin
  const [apIcon, setApIconState] = useState('star'); // Default star
  const [goldCustomImage, setGoldCustomImageState] = useState<string | null>(null);
  const [apCustomImage, setApCustomImageState] = useState<string | null>(null);
  const [statusTheme, setStatusThemeState] = useState<StatusTheme>(STATUS_THEMES[0]);
  const [backgroundType, setBackgroundTypeState] = useState<'theme' | 'color' | 'image' | 'gif'>('theme');
  const [backgroundColor, setBackgroundColorState] = useState('#111827');
  const [backgroundImage, setBackgroundImageState] = useState<string | null>(null);
  const [popupStyle, setPopupStyleState] = useState<PopupStyle>(POPUP_STYLES[0]);
  const [statusLayout, setStatusLayoutState] = useState<StatusLayout>(STATUS_LAYOUTS[0]);
  const [animationStyle, setAnimationStyleState] = useState<AnimationStyle>(ANIMATION_STYLES[0]);

  // Load preferences on mount
  useEffect(() => {
    loadPreferences();
  }, []);

  const loadPreferences = async () => {
    try {
      const savedXpColor = await AsyncStorage.getItem('xpBarColor');
      const savedGoldIcon = await AsyncStorage.getItem('goldIcon');
      const savedApIcon = await AsyncStorage.getItem('apIcon');
      const savedGoldCustomImage = await AsyncStorage.getItem('goldCustomImage');
      const savedApCustomImage = await AsyncStorage.getItem('apCustomImage');
      const savedThemeId = await AsyncStorage.getItem('statusThemeId');
      const savedBackgroundType = await AsyncStorage.getItem('backgroundType');
      const savedBackgroundColor = await AsyncStorage.getItem('backgroundColor');
      const savedBackgroundImage = await AsyncStorage.getItem('backgroundImage');
      const savedPopupStyleId = await AsyncStorage.getItem('popupStyleId');
      const savedStatusLayoutId = await AsyncStorage.getItem('statusLayoutId');
      const savedAnimationStyleId = await AsyncStorage.getItem('animationStyleId');

      if (savedXpColor) setXpBarColorState(savedXpColor);
      if (savedGoldIcon) setGoldIconState(savedGoldIcon);
      if (savedApIcon) setApIconState(savedApIcon);
      if (savedGoldCustomImage) setGoldCustomImageState(savedGoldCustomImage);
      if (savedApCustomImage) setApCustomImageState(savedApCustomImage);
      if (savedThemeId) {
        const theme = STATUS_THEMES.find(t => t.id === savedThemeId);
        if (theme) setStatusThemeState(theme);
      }
      if (savedBackgroundType) setBackgroundTypeState(savedBackgroundType as 'theme' | 'color' | 'image' | 'gif');
      if (savedBackgroundColor) setBackgroundColorState(savedBackgroundColor);
      if (savedBackgroundImage) setBackgroundImageState(savedBackgroundImage);
      if (savedPopupStyleId) {
        const style = POPUP_STYLES.find(s => s.id === savedPopupStyleId);
        if (style) setPopupStyleState(style);
      }
      if (savedStatusLayoutId) {
        const layout = STATUS_LAYOUTS.find(l => l.id === savedStatusLayoutId);
        if (layout) setStatusLayoutState(layout);
      }
      if (savedAnimationStyleId) {
        const anim = ANIMATION_STYLES.find(a => a.id === savedAnimationStyleId);
        if (anim) setAnimationStyleState(anim);
      }
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
    setGoldCustomImageState(null); // Clear custom image when selecting an icon
    try {
      await AsyncStorage.setItem('goldIcon', icon);
      await AsyncStorage.removeItem('goldCustomImage');
    } catch (error) {
      console.error('Failed to save gold icon:', error);
    }
  };

  const setApIcon = async (icon: string) => {
    setApIconState(icon);
    setApCustomImageState(null); // Clear custom image when selecting an icon
    try {
      await AsyncStorage.setItem('apIcon', icon);
      await AsyncStorage.removeItem('apCustomImage');
    } catch (error) {
      console.error('Failed to save AP icon:', error);
    }
  };

  const setGoldCustomImage = async (image: string | null) => {
    setGoldCustomImageState(image);
    try {
      if (image) {
        await AsyncStorage.setItem('goldCustomImage', image);
      } else {
        await AsyncStorage.removeItem('goldCustomImage');
      }
    } catch (error) {
      console.error('Failed to save gold custom image:', error);
    }
  };

  const setApCustomImage = async (image: string | null) => {
    setApCustomImageState(image);
    try {
      if (image) {
        await AsyncStorage.setItem('apCustomImage', image);
      } else {
        await AsyncStorage.removeItem('apCustomImage');
      }
    } catch (error) {
      console.error('Failed to save AP custom image:', error);
    }
  };

  const setStatusTheme = async (themeId: string) => {
    const theme = STATUS_THEMES.find(t => t.id === themeId);
    if (theme) {
      setStatusThemeState(theme);
      try {
        await AsyncStorage.setItem('statusThemeId', themeId);
      } catch (error) {
        console.error('Failed to save status theme:', error);
      }
    }
  };

  const setBackgroundType = async (type: 'theme' | 'color' | 'image' | 'gif') => {
    setBackgroundTypeState(type);
    try {
      await AsyncStorage.setItem('backgroundType', type);
    } catch (error) {
      console.error('Failed to save background type:', error);
    }
  };

  const setBackgroundColor = async (color: string) => {
    setBackgroundColorState(color);
    try {
      await AsyncStorage.setItem('backgroundColor', color);
    } catch (error) {
      console.error('Failed to save background color:', error);
    }
  };

  const setBackgroundImage = async (image: string | null) => {
    setBackgroundImageState(image);
    try {
      if (image) {
        await AsyncStorage.setItem('backgroundImage', image);
      } else {
        await AsyncStorage.removeItem('backgroundImage');
      }
    } catch (error) {
      console.error('Failed to save background image:', error);
    }
  };

  const setPopupStyle = async (styleId: string) => {
    const style = POPUP_STYLES.find(s => s.id === styleId);
    if (style) {
      setPopupStyleState(style);
      try {
        await AsyncStorage.setItem('popupStyleId', styleId);
      } catch (error) {
        console.error('Failed to save popup style:', error);
      }
    }
  };

  const setStatusLayout = async (layoutId: string) => {
    const layout = STATUS_LAYOUTS.find(l => l.id === layoutId);
    if (layout) {
      setStatusLayoutState(layout);
      try {
        await AsyncStorage.setItem('statusLayoutId', layoutId);
      } catch (error) {
        console.error('Failed to save status layout:', error);
      }
    }
  };

  const setAnimationStyle = async (styleId: string) => {
    const anim = ANIMATION_STYLES.find(a => a.id === styleId);
    if (anim) {
      setAnimationStyleState(anim);
      try {
        await AsyncStorage.setItem('animationStyleId', styleId);
      } catch (error) {
        console.error('Failed to save animation style:', error);
      }
    }
  };

  const getThemeById = (id: string): StatusTheme => {
    return STATUS_THEMES.find(t => t.id === id) || STATUS_THEMES[0];
  };

  const getPopupStyleById = (id: string): PopupStyle => {
    return POPUP_STYLES.find(s => s.id === id) || POPUP_STYLES[0];
  };

  const getStatusLayoutById = (id: string): StatusLayout => {
    return STATUS_LAYOUTS.find(l => l.id === id) || STATUS_LAYOUTS[0];
  };

  const getAnimationStyleById = (id: string): AnimationStyle => {
    return ANIMATION_STYLES.find(a => a.id === id) || ANIMATION_STYLES[0];
  };

  return (
    <CustomizationContext.Provider
      value={{
        xpBarColor,
        goldIcon,
        apIcon,
        goldCustomImage,
        apCustomImage,
        statusTheme,
        backgroundType,
        backgroundColor,
        backgroundImage,
        popupStyle,
        statusLayout,
        animationStyle,
        setXpBarColor,
        setGoldIcon,
        setApIcon,
        setGoldCustomImage,
        setApCustomImage,
        setStatusTheme,
        setBackgroundType,
        setBackgroundColor,
        setBackgroundImage,
        setPopupStyle,
        setStatusLayout,
        setAnimationStyle,
        getThemeById,
        getPopupStyleById,
        getStatusLayoutById,
        getAnimationStyleById,
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
