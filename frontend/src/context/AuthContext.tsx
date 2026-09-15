import React, { createContext, useContext, useState } from "react";

export interface User {
  id?: string;
  name: string;
  email: string;
  avatar: string;
  walletAddress: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (userData: User, token?: string) => void;
  logout: () => void;
  loginDemo: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_USER: User = {
  name: "Dương Minh Trí",
  email: "minhtri.sol@gmail.com",
  avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
  walletAddress: "8xG7p9...41eF",
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const savedUser = localStorage.getItem("solana_tickets_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem("solana_tickets_token") || null;
  });

  const login = (userData: User, authToken?: string) => {
    setUser(userData);
    localStorage.setItem("solana_tickets_user", JSON.stringify(userData));
    if (authToken) {
      setToken(authToken);
      localStorage.setItem("solana_tickets_token", authToken);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("solana_tickets_user");
    localStorage.removeItem("solana_tickets_token");
  };

  const loginDemo = () => {
    login(DEMO_USER, "demo_jwt_token_solana_tickets");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loginDemo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
