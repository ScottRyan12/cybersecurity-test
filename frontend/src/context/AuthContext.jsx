import { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../utils/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('ongwaeh_token');
    if (token) {
      api.get('/auth/me')
        .then(data => setUser(data.user))
        .catch(() => localStorage.removeItem('ongwaeh_token'))
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (loginStr, password) => {
    const data = await api.post('/auth/login', { login: loginStr, password });
    localStorage.setItem('ongwaeh_token', data.token);
    setUser(data.user);
    return data;
  };

  const register = async (username, email, password, full_name) => {
    const data = await api.post('/auth/register', { username, email, password, full_name });
    localStorage.setItem('ongwaeh_token', data.token);
    setUser(data.user);
    return data;
  };

  const logout = () => {
    localStorage.removeItem('ongwaeh_token');
    setUser(null);
  };

  const updateUser = async (updates) => {
    const data = await api.put('/auth/me', updates);
    setUser(data.user);
    return data;
  };

  if (loading) {
    return (
      <div className="loading-page">
        <div className="spinner" />
        <span>Loading...</span>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
