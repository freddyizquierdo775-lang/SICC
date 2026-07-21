
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, RoleLevel } from '../types/auth';
import Login from '../pages/Login';

interface AuthContextType {
  profile: UserProfile | null;
  loading: boolean;
  hasPermission: (level: RoleLevel) => boolean;
  checkCustomPermission: (key: keyof UserProfile['custom_permissions']) => any;
  switchUser: (userId: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      const savedUserId = localStorage.getItem('mock_user_id');
      
      // If no saved user, show login
      if (!savedUserId) {
        setLoading(false);
        setIsAuthenticated(false);
        return;
      }

      try {
        setLoading(true);
        const response = await fetch('/api/auth/profile', {
          headers: { 'x-user-id': savedUserId }
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.error) {
            // Invalid profile, clear and show login
            localStorage.removeItem('mock_user_id');
            setIsAuthenticated(false);
            setLoading(false);
            return;
          }
          setProfile(data);
          setIsAuthenticated(true);
        } else {
          // Fallback: try stored session
          const stored = localStorage.getItem('siscc_user');
          if (stored) {
            try {
              setProfile(JSON.parse(stored));
              setIsAuthenticated(true);
            } catch {
              setIsAuthenticated(false);
            }
          } else {
            setIsAuthenticated(false);
          }
        }
      } catch (error) {
        // Server down? Try stored session
        const stored = localStorage.getItem('siscc_user');
        if (stored) {
          try {
            setProfile(JSON.parse(stored));
            setIsAuthenticated(true);
          } catch {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const switchUser = (userId: string) => {
    localStorage.setItem('mock_user_id', userId);
    window.location.reload();
  };

  const logout = () => {
    localStorage.removeItem('mock_user_id');
    localStorage.removeItem('siscc_user');
    setProfile(null);
    setIsAuthenticated(false);
  };

  const hasPermission = (requiredLevel: RoleLevel) => {
    if (!profile) return false;
    return profile.role_level >= requiredLevel;
  };

  const checkCustomPermission = (key: keyof UserProfile['custom_permissions']) => {
    return profile?.custom_permissions?.[key];
  };

  // Show login screen if not authenticated
  if (!loading && !isAuthenticated) {
    return <Login />;
  }

  return (
    <AuthContext.Provider value={{ profile, loading, hasPermission, checkCustomPermission, switchUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
