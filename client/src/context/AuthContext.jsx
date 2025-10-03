// client/src/context/AuthContext.jsx

import React, { createContext, useState, useEffect, useCallback } from "react"; 
export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadRequestCount, setUnreadRequestCount] = useState(0);
  const [onlineUsers, setOnlineUsers] = useState([]);


  useEffect(() => {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) setUser(JSON.parse(storedUser));
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  const login = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setUnreadCount(0);
    setUnreadRequestCount(0);
  };

  const fetchUnreadCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/conversations', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        const total = data.data.reduce((acc, convo) => acc + (convo.unreadCounts[user.id] || 0), 0);
        setUnreadCount(total);
      }
    } catch (error) {
      console.error("Failed to fetch unread count", error);
    }
  }, [user]); 

  const fetchUnreadRequestCount = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch('/api/swaps/me', { credentials: 'include' });
      const data = await res.json();
      if (data.success) {
        const total = data.data.filter(swap => 
          swap.receiver._id === user.id && swap.status === 'pending' && !swap.isRead
        ).length;
        setUnreadRequestCount(total);
      }
    } catch (error) {
      console.error("Failed to fetch unread request count", error);
    }
  }, [user]); 

  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      fetchUnreadRequestCount();
    }
  }, [user, fetchUnreadCount, fetchUnreadRequestCount]);

  return (
    <AuthContext.Provider value={{ 
      user, login, logout, loading, 
      unreadCount, fetchUnreadCount, 
      unreadRequestCount, fetchUnreadRequestCount,
      onlineUsers, setOnlineUsers 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};