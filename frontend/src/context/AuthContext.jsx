import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const cleanupAuth = () => {
      localStorage.removeItem('token');
      setToken(null);
      setUser(null);
    };

    if (token) {
      try {
        const cleanToken = token.replace(/^["']|["']$/g, '');
        const decoded = jwtDecode(cleanToken);
        const isExpired = decoded.exp && decoded.exp * 1000 < Date.now();
        if (isExpired) {
          cleanupAuth();
        } else {
          setUser({ 
            email: decoded.sub, 
            role: decoded.role || 'employee',
            org_id: decoded.org_id || null 
          });
        }
      } catch (error) {
        console.error("Failed to parse token:", error);
        cleanupAuth();
      }
    }
    setLoading(false);
  }, [token]);

  const handleLogin = React.useCallback((newToken) => {
    setLoading(true);
    localStorage.setItem('token', newToken);
    setToken(newToken);
  }, []);

  const handleLogout = React.useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, loading, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);