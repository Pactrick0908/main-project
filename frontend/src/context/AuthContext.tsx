import React, { createContext, useContext, useState, useCallback } from "react";
import { googleLogout } from "@react-oauth/google";
import {
  type AuthUser,
  getToken,
  getStoredUser,
  saveSession,
  clearSession,
  clearGoogleIdentity,
  isCustomerRole,
  getStaffRole,
  type StaffRole,
} from "@/api/auth.api";

// ─── Types ───────────────────────────────────────────────────────────────────

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isCustomer: boolean;
  staffRole: StaffRole | null;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

// ─── Context ─────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ─── Provider ────────────────────────────────────────────────────────────────

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());
  const [token, setToken] = useState<string | null>(() => getToken());

  const login = useCallback((userData: AuthUser, authToken: string) => {
    setUser(userData);
    setToken(authToken);
    saveSession(authToken, userData);
  }, []);

  const logout = useCallback(() => {
    const email = user?.email;
    try {
      googleLogout();
    } catch {
      /* ignore */
    }
    clearGoogleIdentity(email);
    setUser(null);
    setToken(null);
    clearSession();
  }, [user?.email]);

  const isAuthenticated = !!user && !!token;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated,
        isCustomer: isAuthenticated && isCustomerRole(user?.role ?? "customer"),
        staffRole: isAuthenticated ? getStaffRole(user?.role) : null,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ────────────────────────────────────────────────────────────────────

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};
