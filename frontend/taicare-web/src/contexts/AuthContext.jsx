import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

const tokenKey = 'taicare_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Fetch full profile (includes alert_preferences_configured)
  const fetchProfile = useCallback(async (id) => {
    try {
      const { data } = await api.get(`/users/${id}`);
      return data;
    } catch {
      return null;
    }
  }, []);

  // On startup, restore user from token and fetch full profile
  useEffect(() => {
    const token = localStorage.getItem(tokenKey);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Set minimal user first so app can render
        setUser({ _id: payload.sub, role: payload.role });
        // Then hydrate with full profile
        fetchProfile(payload.sub).then((profile) => {
          if (profile) setUser(profile);
        });
      } catch {
        localStorage.removeItem(tokenKey);
      }
    }
  }, [fetchProfile]);

  // Login
  async function login({ email, password }) {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await fetch(`${API}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error en login');
    }
    const { user: loginUser } = await res.json();
    setUser(loginUser);
    // Hydrate with full profile to get alert_preferences_configured etc.
    const profile = await fetchProfile(loginUser._id || loginUser.sub);
    if (profile) setUser(profile);
  }

  // Register
  async function register({ name, email, password, role = 'paciente' }) {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
    const res = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Error en registro');
    }
    // auto-login tras registro
    await login({ email, password });
  }

  function logout() {
    localStorage.removeItem(tokenKey);
    setUser(null);
  }

  // Allow updating the in-context user (e.g., after saving preferences)
  function updateUserProfile(patch) {
    setUser((prev) => ({ ...prev, ...patch }));
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, setUser, updateUserProfile }}>
      {children}
    </AuthContext.Provider>
  );
}
