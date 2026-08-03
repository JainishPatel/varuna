import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ROLES, PERMISSIONS, checkPermission, hashPassword, DEFAULT_USERS, DEFAULT_PASSWORD_MAP } from '../config/rbacConfig';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
  users: 'varuna_users',
  passwords: 'varuna_passwords',
  session: 'varuna_session',
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize: seed default users if needed, restore session
  useEffect(() => {
    async function init() {
      let storedUsers = null;
      try {
        storedUsers = JSON.parse(localStorage.getItem(STORAGE_KEYS.users));
      } catch (e) { /* ignore */ }

      if (!storedUsers || storedUsers.length === 0) {
        // Seed default users
        localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(DEFAULT_USERS));
        
        // Hash and store default passwords
        const passwordMap = {};
        for (const [username, password] of Object.entries(DEFAULT_PASSWORD_MAP)) {
          passwordMap[username] = await hashPassword(password);
        }
        localStorage.setItem(STORAGE_KEYS.passwords, JSON.stringify(passwordMap));
        setUsers(DEFAULT_USERS);
      } else {
        setUsers(storedUsers);
      }

      // Restore session
      try {
        const session = JSON.parse(localStorage.getItem(STORAGE_KEYS.session));
        if (session && session.username) {
          const allUsers = storedUsers || DEFAULT_USERS;
          const user = allUsers.find(u => u.username === session.username);
          if (user) {
            setCurrentUser(user);
          }
        }
      } catch (e) { /* ignore */ }

      setIsLoading(false);
    }
    init();
  }, []);

  // Persist users to localStorage whenever they change
  useEffect(() => {
    if (users.length > 0) {
      localStorage.setItem(STORAGE_KEYS.users, JSON.stringify(users));
    }
  }, [users]);

  const login = useCallback(async (username, password) => {
    const passwordsRaw = localStorage.getItem(STORAGE_KEYS.passwords);
    const passwords = passwordsRaw ? JSON.parse(passwordsRaw) : {};
    const hashedInput = await hashPassword(password);
    
    if (passwords[username] !== hashedInput) {
      throw new Error('Invalid username or password');
    }

    const user = users.find(u => u.username === username);
    if (!user) {
      throw new Error('User not found');
    }

    setCurrentUser(user);
    localStorage.setItem(STORAGE_KEYS.session, JSON.stringify({ username }));
    return user;
  }, [users]);

  const logout = useCallback(() => {
    setCurrentUser(null);
    localStorage.removeItem(STORAGE_KEYS.session);
  }, []);

  const register = useCallback(async (username, password, role, displayName) => {
    // Validate
    if (!username || !password || !role) throw new Error('All fields are required');
    if (users.find(u => u.username === username)) throw new Error('Username already exists');
    if (!ROLES[role]) throw new Error('Invalid role');

    const newUser = {
      id: Date.now().toString(),
      username,
      role,
      displayName: displayName || username,
      createdAt: new Date().toISOString(),
    };

    const hashedPassword = await hashPassword(password);
    
    // Update passwords
    const passwordsRaw = localStorage.getItem(STORAGE_KEYS.passwords);
    const passwords = passwordsRaw ? JSON.parse(passwordsRaw) : {};
    passwords[username] = hashedPassword;
    localStorage.setItem(STORAGE_KEYS.passwords, JSON.stringify(passwords));

    // Update users
    const newUsers = [...users, newUser];
    setUsers(newUsers);
    return newUser;
  }, [users]);

  const updateUserRole = useCallback((userId, newRole) => {
    if (!ROLES[newRole]) throw new Error('Invalid role');
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
  }, []);

  const deleteUser = useCallback((userId) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    
    // Don't allow deleting yourself
    if (currentUser && currentUser.id === userId) {
      throw new Error('Cannot delete your own account');
    }

    // Remove password
    const passwordsRaw = localStorage.getItem(STORAGE_KEYS.passwords);
    const passwords = passwordsRaw ? JSON.parse(passwordsRaw) : {};
    delete passwords[user.username];
    localStorage.setItem(STORAGE_KEYS.passwords, JSON.stringify(passwords));

    setUsers(prev => prev.filter(u => u.id !== userId));
  }, [users, currentUser]);

  const hasPermission = useCallback((permission) => {
    if (!currentUser) return false;
    return checkPermission(currentUser.role, permission);
  }, [currentUser]);

  const value = {
    currentUser,
    users,
    isLoading,
    login,
    logout,
    register,
    updateUserRole,
    deleteUser,
    hasPermission,
    ROLES,
    PERMISSIONS,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}

export default AuthContext;
