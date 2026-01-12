import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

const API_URL = 'https://quest-limitless.preview.emergentagent.com';

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

interface UserContextType {
  user: User | null;
  loading: boolean;
  refreshUser: () => Promise<void>;
  createUser: (username: string) => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

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

  return (
    <UserContext.Provider value={{ user, loading, refreshUser, createUser }}>
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
