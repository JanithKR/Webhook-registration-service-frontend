import { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types';
import { local, session, cookies } from '../utils/storage';
import type { ReactNode } from 'react';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User, remember?: boolean) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    //  localStorage — check remembered session first
    const savedToken = local.get<string>('token');
    const savedUser = local.get<User>('user');

    //  sessionStorage — check tab session next
    const sessionToken = session.get<string>('token');
    const sessionUser = session.get<User>('user');

    //  cookieStorage — check cookie last
    const cookieToken = cookies.get('token');

    if (savedToken && savedUser) {
      // Remembered login (localStorage)
      setToken(savedToken);
      setUser(savedUser);
      console.log('🔑 Restored session from localStorage');
    } else if (sessionToken && sessionUser) {
      // Tab session login (sessionStorage)
      setToken(sessionToken);
      setUser(sessionUser);
      console.log('🔑 Restored session from sessionStorage');
    } else if (cookieToken) {
      // Cookie login — user data stored in cookie too
      const cookieUser = cookies.get('user');
      if (cookieUser) {
        try {
          setToken(cookieToken);
          setUser(JSON.parse(cookieUser));
          console.log('🔑 Restored session from cookie');
        } catch {
          console.error('Failed to parse cookie user');
        }
      }
    }
  }, []);

  const login = (token: string, user: User, remember: boolean = true) => {
    setToken(token);
    setUser(user);

    if (remember) {
      //  localStorage — stays until logout
      local.set('token', token);
      local.set('user', user);
      console.log('💾 Saved to localStorage');
    } else {
      //  sessionStorage — cleared when tab closes
      session.set('token', token);
      session.set('user', user);
      console.log('💾 Saved to sessionStorage');
    }

    //  cookieStorage — always set cookie (expires in 7 days)
    cookies.set('token', token, 7);
    cookies.set('user', JSON.stringify(user), 7);
    console.log('🍪 Saved to cookies');
  };

  const logout = () => {
    setToken(null);
    setUser(null);

    //  Clear all three storages on logout
    local.remove('token');
    local.remove('user');
    session.remove('token');
    session.remove('user');
    cookies.remove('token');
    cookies.remove('user');
    console.log('🚪 Logged out — all storage cleared');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};