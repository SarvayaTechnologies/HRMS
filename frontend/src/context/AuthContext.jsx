import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; 

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      if (token) {
        try {
          // Remove any stray quotes from token
          const cleanToken = token.replace(/^["']|["']$/g, '');
          const decoded = jwtDecode(cleanToken);
          // Check expiration
          const isExpired = decoded.exp && decoded.exp * 1000 < Date.now();
          if (isExpired) {
            console.error("Token expired");
            logout();
          } else {
            setUser({ 
              email: decoded.sub, 
              role: decoded.role || 'employee',
              org_id: decoded.org_id || null 
            });
          }
        } catch (error) {
          console.error("Failed to parse token:", token, error);
          logout();
        }
      }
      setLoading(false);
    };

    initializeAuth();
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
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, loading, login: handleLogin, logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);