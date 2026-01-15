import React from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useCustomization, PopupStyle } from '../contexts/CustomizationContext';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown, ZoomIn, ZoomOut } from 'react-native-reanimated';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

interface StyledModalProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  showCloseButton?: boolean;
  maxHeight?: number;
}

export const StyledModal: React.FC<StyledModalProps> = ({
  visible,
  onClose,
  title,
  children,
  showCloseButton = true,
  maxHeight = SCREEN_HEIGHT * 0.85,
}) => {
  const { popupStyle } = useCustomization();
  const ps = popupStyle.styles;

  const getAnimationProps = () => {
    switch (ps.animation) {
      case 'slide':
        return { entering: SlideInDown.duration(300), exiting: SlideOutDown.duration(200) };
      case 'scale':
        return { entering: ZoomIn.duration(300), exiting: ZoomOut.duration(200) };
      case 'fade':
      default:
        return { entering: FadeIn.duration(300), exiting: FadeOut.duration(200) };
    }
  };

  const animProps = getAnimationProps();

  return (
    <Modal visible={visible} animationType="none" transparent={true} onRequestClose={onClose}>
      <TouchableOpacity 
        style={[styles.overlay, { backgroundColor: ps.overlayColor }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <Animated.View
          {...animProps}
          style={[
            styles.modalContainer,
            {
              backgroundColor: ps.backgroundColor,
              borderColor: ps.borderColor,
              borderWidth: ps.borderWidth,
              borderRadius: ps.borderRadius,
              maxHeight,
              shadowColor: ps.glowEnabled ? ps.glowColor : '#000',
              shadowOpacity: ps.glowEnabled ? ps.shadowOpacity : 0.3,
              shadowRadius: ps.glowEnabled ? 15 : 5,
              shadowOffset: { width: 0, height: ps.glowEnabled ? 0 : 4 },
              elevation: ps.glowEnabled ? 20 : 10,
            }
          ]}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            {/* Header */}
            <View style={[styles.header, { backgroundColor: ps.headerBg }]}>
              <Text style={[styles.title, { color: ps.headerTextColor }]}>{title}</Text>
              {showCloseButton && (
                <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                  <Ionicons name="close" size={24} color={ps.headerTextColor} />
                </TouchableOpacity>
              )}
            </View>

            {/* Glow line under header if enabled */}
            {ps.glowEnabled && (
              <View style={[styles.glowLine, { backgroundColor: ps.glowColor }]} />
            )}

            {/* Body */}
            <ScrollView 
              style={[styles.body, { backgroundColor: ps.bodyBg }]}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
            >
              {children}
            </ScrollView>
          </TouchableOpacity>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

// Styled Button component that uses popup style colors
interface StyledButtonProps {
  onPress: () => void;
  title: string;
  variant?: 'primary' | 'secondary' | 'danger';
  disabled?: boolean;
}

export const StyledButton: React.FC<StyledButtonProps> = ({
  onPress,
  title,
  variant = 'primary',
  disabled = false,
}) => {
  const { popupStyle } = useCustomization();
  const ps = popupStyle.styles;

  const getButtonColors = () => {
    switch (variant) {
      case 'secondary':
        return { bg: 'transparent', text: ps.bodyTextColor, border: ps.borderColor };
      case 'danger':
        return { bg: '#EF4444', text: '#FFFFFF', border: '#EF4444' };
      default:
        return { bg: ps.buttonBg, text: ps.buttonTextColor, border: ps.buttonBg };
    }
  };

  const colors = getButtonColors();

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: colors.bg,
          borderColor: colors.border,
          borderWidth: variant === 'secondary' ? 1 : 0,
          opacity: disabled ? 0.5 : 1,
        }
      ]}
      onPress={onPress}
      disabled={disabled}
    >
      <Text style={[styles.buttonText, { color: colors.text }]}>{title}</Text>
    </TouchableOpacity>
  );
};

// Styled Input component
interface StyledInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address';
}

export const StyledInput: React.FC<StyledInputProps> = ({
  value,
  onChangeText,
  placeholder,
  multiline = false,
  keyboardType = 'default',
}) => {
  const { popupStyle } = useCustomization();
  const ps = popupStyle.styles;

  return (
    <View style={[
      styles.inputContainer,
      {
        backgroundColor: ps.bodyBg,
        borderColor: ps.borderColor,
      }
    ]}>
      {/* Input would be a TextInput but we'll use Text for preview */}
    </View>
  );
};

// Styled Label component
interface StyledLabelProps {
  text: string;
}

export const StyledLabel: React.FC<StyledLabelProps> = ({ text }) => {
  const { popupStyle } = useCustomization();
  const ps = popupStyle.styles;

  return (
    <Text style={[styles.label, { color: ps.bodyTextColor }]}>{text}</Text>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
  },
  closeButton: {
    padding: 4,
  },
  glowLine: {
    height: 2,
    opacity: 0.6,
  },
  body: {
    maxHeight: SCREEN_HEIGHT * 0.6,
  },
  bodyContent: {
    padding: 20,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  inputContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 4,
  },
});

export default StyledModal;
