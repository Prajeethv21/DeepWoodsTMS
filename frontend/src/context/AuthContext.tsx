import React, { createContext, useState, useEffect } from 'react';
import authService from '../services/authService';

export interface AuthUser {
  email: string;
  name: string;
  picture?: string;
  isAdmin: boolean;
}

export interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  authError: string | null;
  error: string | null; // alias for authError
  login: (emailOrToken: string) => Promise<AuthUser | null>;
  logout: () => void;
  setAuthError: React.Dispatch<React.SetStateAction<string | null>>;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Native JWT decoder to extract profile name and email without dependencies
  const decodeGoogleToken = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        window.atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (err) {
      console.error("Failed to decode Google GSI credential token: ", err);
      return null;
    }
  };

  // Attempt login check - accepts either a plain email string or a Google JWT credential token
  const login = async (emailOrToken: string): Promise<AuthUser | null> => {
    setLoading(true);
    setAuthError(null);
    try {
      let email = emailOrToken;
      let name = null;
      let picture = null;

      if (emailOrToken && !emailOrToken.includes('@') && emailOrToken.includes('.') && emailOrToken.split('.').length === 3) {
        const payload = decodeGoogleToken(emailOrToken);
        if (payload && payload.email) {
          email = payload.email;
          name = payload.name;
          picture = payload.picture;
        }
      }

      if (!email || !email.includes('@')) {
        throw new Error("Please enter a valid email address.");
      }

      const response = await authService.validateUser(email);
      
      if (response && response.authenticated) {
        const sessionUser: AuthUser = {
          email: response.email,
          name: response.name || name || email.split('@')[0],
          picture: picture || undefined,
          isAdmin: response.isAdmin
        };
        setUser(sessionUser);
        localStorage.setItem('deepwoods_email', sessionUser.email);
        localStorage.setItem('deepwoods_name', sessionUser.name);
        return sessionUser;
      } else {
        setUser(null);
        setAuthError("Email not recognised in team configuration.");
        return null;
      }
    } catch (err: any) {
      console.error("Login verification failed: ", err);
      setAuthError(err.message || "Authentication failed. Please try again.");
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Logout simulator
  const logout = () => {
    localStorage.removeItem('deepwoods_email');
    localStorage.removeItem('deepwoods_name');
    setUser(null);
    setAuthError(null);
  };

  // Check saved email on load (simulating persistent cookie/state)
  useEffect(() => {
    const checkSavedSession = async () => {
      const savedEmail = localStorage.getItem('deepwoods_email');
      const savedName = localStorage.getItem('deepwoods_name');
      if (savedEmail) {
        try {
          const response = await authService.validateUser(savedEmail);
          if (response && response.authenticated) {
            setUser({
              email: response.email,
              name: response.name || savedName || 'User',
              isAdmin: response.isAdmin
            });
          } else {
            logout();
          }
        } catch (err) {
          console.error("Session refresh failed: ", err);
          logout();
        }
      }
      setLoading(false);
    };

    checkSavedSession();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, authError, error: authError, login, logout, setAuthError, searchQuery, setSearchQuery }}>
      {children}
    </AuthContext.Provider>
  );
};
