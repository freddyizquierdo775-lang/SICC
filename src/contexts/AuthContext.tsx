
import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, RoleLevel } from '../types/auth';

interface AuthContextType {
  profile: UserProfile | null;
  loading: boolean;
  hasPermission: (level: RoleLevel) => boolean;
  checkCustomPermission: (key: keyof UserProfile['custom_permissions']) => any;
  switchUser: (userId: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      const savedUserId = localStorage.getItem('mock_user_id') || 'user_cajero_1';
      try {
        setLoading(true);
        console.log('Fetching profile for:', savedUserId);
        const response = await fetch('/api/auth/profile', {
          headers: {
            'x-user-id': savedUserId
          }
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Profile loaded:', data.nickname);
          setProfile(data);
        } else {
          console.error('Profile fetch failed with status:', response.status);
          // Si falla el gerente, intentar volver al cajero por defecto para no romper la app
          if (savedUserId !== 'user_cajero_1') {
            localStorage.setItem('mock_user_id', 'user_cajero_1');
            window.location.reload();
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const switchUser = (userId: string) => {
    localStorage.setItem('mock_user_id', userId);
    window.location.reload(); // Recargar para aplicar el nuevo perfil
  };

  const hasPermission = (requiredLevel: RoleLevel) => {
    if (!profile) return false;
    return profile.role_level >= requiredLevel;
  };

  const checkCustomPermission = (key: keyof UserProfile['custom_permissions']) => {
    return profile?.custom_permissions?.[key];
  };

  return (
    <AuthContext.Provider value={{ profile, loading, hasPermission, checkCustomPermission, switchUser }}>
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
