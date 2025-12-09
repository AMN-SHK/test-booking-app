import { useState, useCallback, useEffect, type ReactNode } from 'react';
import type { UserDTO } from '../../types/auth';
import { setAuthToken } from '../../api/client';
import { AuthContext, type AuthContextType } from './authTypes';

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<UserDTO | null>(null);
  const [token, setToken] = useState<string | null>(null);

  const isAuthenticated = !!token && !!user;

  // Login - store token and user
  const login = useCallback((newToken: string, newUser: UserDTO) => {
    setToken(newToken);
    setUser(newUser);
    setAuthToken(newToken);
  }, []);

  // Logout - clear everything
  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    setAuthToken(null);
  }, []);

  // Listen for auth:logout events (from axios interceptor)
  useEffect(() => {
    const handleLogout = () => {
      logout();
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => {
      window.removeEventListener('auth:logout', handleLogout);
    };
  }, [logout]);

  const value: AuthContextType = {
    user,
    token,
    isAuthenticated,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
