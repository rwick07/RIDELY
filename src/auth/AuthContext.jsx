import { createContext, useState, useEffect } from 'react';
import { getCurrentUser, getFullCurrentUser, logout as authLogout } from './authService';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = getFullCurrentUser() || getCurrentUser();
    return saved ? saved : null;
  });

  useEffect(() => {
    if (user?.email) {
      const full = getFullCurrentUser();
      if (
        full &&
        (full.phone !== user.phone ||
          full.createdAt !== user.createdAt ||
          full.name !== user.name ||
          full.email !== user.email)
      ) {
        setUser(full);
      }
    }
  }, []);

  const login = (payload) => setUser(payload);
  const logout = () => {
    authLogout();
    setUser(null);
  };
  const updateUser = (payload) => {
    setUser((prev) => ({ ...prev, ...payload }));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};
