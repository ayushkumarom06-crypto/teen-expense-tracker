import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(localStorage.getItem('pennywise_token')));

  useEffect(() => {
    if (!localStorage.getItem('pennywise_token')) return;
    api('/auth/me').then(({ user: profile }) => setUser(profile)).catch(() => {
      localStorage.removeItem('pennywise_token');
    }).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const expire = () => { localStorage.removeItem('pennywise_token'); setUser(null); };
    window.addEventListener('session-expired', expire);
    return () => window.removeEventListener('session-expired', expire);
  }, []);

  async function login(email, password) {
    const result = await api('/auth/login', { method: 'POST', body: { email, password } });
    localStorage.setItem('pennywise_token', result.token);
    setUser(result.user);
  }

  async function register(fullName, email, password) {
    await api('/auth/register', { method: 'POST', body: { fullName, email, password } });
    await login(email, password);
  }

  function logout() {
    localStorage.removeItem('pennywise_token');
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, setUser, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}