import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Notification {
  id: string;
  message: string;
  type: 'levelup' | 'power' | 'success' | 'info';
  duration?: number;
}

interface NotificationContextType {
  showNotification: (message: string, type?: Notification['type'], duration?: number) => void;
  showLevelUp: (oldLevel: number, newLevel: number, rewards?: string) => void;
  showPowerLevelUp: (powerName: string, oldLevel: number, newLevel: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const showNotification = useCallback((message: string, type: Notification['type'] = 'info', duration: number = 3000) => {
    const id = Date.now().toString();
    const notification: Notification = { id, message, type, duration };
    
    setNotifications(prev => [...prev, notification]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  const showLevelUp = useCallback((oldLevel: number, newLevel: number, rewards?: string) => {
    const message = `🎉 LEVEL UP! Level ${oldLevel} → ${newLevel} ↑${rewards ? '\n' + rewards : ''}`;
    showNotification(message, 'levelup', 4000);
  }, [showNotification]);

  const showPowerLevelUp = useCallback((powerName: string, oldLevel: number, newLevel: number) => {
    const message = `⚡ Power Upgraded!\n${powerName}\nLevel ${oldLevel} → ${newLevel} ↑`;
    showNotification(message, 'power', 3000);
  }, [showNotification]);

  return (
    <NotificationContext.Provider value={{ showNotification, showLevelUp, showPowerLevelUp }}>
      {children}
      <NotificationContainer notifications={notifications} />
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

const NotificationContainer: React.FC<{ notifications: Notification[] }> = ({ notifications }) => {
  return (
    <View style={styles.container} pointerEvents="box-none">
      {notifications.map((notification, index) => (
        <NotificationItem key={notification.id} notification={notification} index={index} />
      ))}
    </View>
  );
};

const NotificationItem: React.FC<{ notification: Notification; index: number }> = ({ notification, index }) => {
  const [slideAnim] = useState(new Animated.Value(-100));

  React.useEffect(() => {
    Animated.sequence([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.delay((notification.duration || 3000) - 500),
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const getIcon = () => {
    switch (notification.type) {
      case 'levelup':
        return <Ionicons name="trophy" size={24} color="#10B981" />;
      case 'power':
        return <Ionicons name="flash" size={24} color="#8B5CF6" />;
      case 'success':
        return <Ionicons name="checkmark-circle" size={24} color="#10B981" />;
      default:
        return <Ionicons name="information-circle" size={24} color="#3B82F6" />;
    }
  };

  return (
    <Animated.View
      style={[
        styles.notification,
        { 
          transform: [{ translateY: slideAnim }],
          top: 60 + (index * 100), // Stack notifications if multiple
        }
      ]}
    >
      {getIcon()}
      <Text style={styles.notificationText} selectable={false}>{notification.message}</Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  notification: {
    position: 'absolute',
    backgroundColor: '#000000',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 16,
    maxWidth: Dimensions.get('window').width - 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 1,
    borderColor: '#1F2937',
  },
  notificationText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
    lineHeight: 22,
  },
});
