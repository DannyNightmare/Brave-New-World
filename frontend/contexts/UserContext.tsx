import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_URL = 'https://demerit-system-1.preview.emergentagent.com';

interface User {
  id: string;
  username: string;
  level: number;
  xp: number;
  gold: number;
  strength: number;
  intelligence: number;
  vitality: number;
  ability_points: number;
}

interface FailedQuest {
  id: string;
  title: string;
  xp_demerit: number;
  gold_demerit: number;
  ap_demerit: number;
  attribute_demerits: { [key: string]: number };
}

interface TotalDemerits {
  xp: number;
  gold: number;
  ap: number;
  attributes: { [key: string]: number };
}

interface FailureData {
  failedQuests: FailedQuest[];
  totalDemerits: TotalDemerits;
}

interface UserContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  createUser: (username: string) => Promise<void>;
  failureData: FailureData | null;
  showFailureModal: boolean;
  dismissFailureModal: () => void;
  checkQuestFailures: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [failureData, setFailureData] = useState<FailureData | null>(null);
  const [showFailureModal, setShowFailureModal] = useState(false);
  const [hasCheckedFailures, setHasCheckedFailures] = useState(false);

  const createUser = async (username: string) => {
    try {
      const response = await fetch(`${API_URL}/api/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const refreshUser = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_URL}/api/users/${user.id}`);
      const data = await response.json();
      setUser(data);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  // Check for quest failures and apply demerits
  const checkQuestFailures = async () => {
    if (!user?.id) return;
    try {
      const response = await fetch(`${API_URL}/api/quests/${user.id}/check-failures`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await response.json();
      
      if (data.failed_quests && data.failed_quests.length > 0) {
        setFailureData({
          failedQuests: data.failed_quests,
          totalDemerits: data.total_demerits,
        });
        setShowFailureModal(true);
        // Refresh user data after demerits have been applied
        await refreshUser();
      }
    } catch (error) {
      console.error('Failed to check quest failures:', error);
    }
  };

  const dismissFailureModal = () => {
    setShowFailureModal(false);
    setFailureData(null);
  };

  useEffect(() => {
    // Auto-create a demo user for MVP
    const initUser = async () => {
      try {
        const response = await fetch(`${API_URL}/api/users`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'Hero' }),
        });
        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Failed to init user:', error);
      } finally {
        setLoading(false);
      }
    };
    initUser();
  }, []);

  // Check for quest failures once user is loaded (only once per session)
  useEffect(() => {
    if (user?.id && !hasCheckedFailures) {
      setHasCheckedFailures(true);
      // Delay the check slightly to allow the app to fully load
      const timer = setTimeout(() => {
        checkQuestFailures();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user?.id, hasCheckedFailures]);

  return (
    <UserContext.Provider value={{ 
      user, 
      loading, 
      refreshUser, 
      createUser,
      failureData,
      showFailureModal,
      dismissFailureModal,
      checkQuestFailures,
    }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
