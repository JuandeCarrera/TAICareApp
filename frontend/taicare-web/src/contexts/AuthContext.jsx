import { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

const API = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const tokenKey = 'taicare_token';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Al arrancar, si hay token valida y extraem user
  useEffect(() => {
    const token = localStorage.getItem(tokenKey);
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser({ _id: payload.sub, role: payload.role });
      } catch {
        localStorage.removeItem(tokenKey);
      }
    }
  }, []);

  // Login
  async function login({ email, password }) {
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
    const { user } = await res.json();
    setUser(user);
  }

  // Register
  async function register({ name, email, password, role = 'paciente' }) {
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

  return (
    <AuthContext.Provider value={{ user, login, register, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
