import { createContext, useState, useEffect, useCallback } from 'react';
import api from '../api/axios';

export const AuthContext = createContext();

const tokenKey = 'taicare_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch full profile (includes alert_preferences_configured)
  const fetchProfile = useCallback(async (id) => {
    try {
      const { data } = await api.get(`/users/${id}`);
      return data;
    } catch {
      return null;
    }
  }, []);

  // On startup, restore user from /auth/me
  useEffect(() => {
    async function restoreSession() {
      try {
        const { data } = await api.get('/auth/me');
        setUser(data);
      } catch (err) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    restoreSession();
  }, []);

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
      {loading ? (
        <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', color: '#fff' }}>
          Cargando sesión...
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}
