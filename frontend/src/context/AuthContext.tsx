import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import {
  type AuthUser,
  getToken,
  getStoredUser,
  saveSession,
  clearSession,
} from "@/api/auth.api";
import {
  canAccess,
  resolvePermissions,
  PERMISSIONS,
} from "@/lib/permissions";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isAuthenticated: boolean;
  permissions: string[];
  can: (permission: string) => boolean;
  isAdminStaff: boolean;
  login: (user: AuthUser, token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

function normalizeUser(userData: AuthUser): AuthUser {
  return {
    ...userData,
    permissions: resolvePermissions(userData.role, userData.permissions),
  };
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const stored = getStoredUser();
    return stored ? normalizeUser(stored) : null;
  });
  const [token, setToken] = useState<string | null>(() => getToken());

  const login = useCallback((userData: AuthUser, authToken: string) => {
    const normalized = normalizeUser(userData);
    setUser(normalized);
    setToken(authToken);
    saveSession(authToken, normalized);
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    clearSession();
  }, []);

  const permissions = useMemo(
    () => resolvePermissions(user?.role, user?.permissions),
    [user],
  );

  const can = useCallback(
    (permission: string) => canAccess(user, permission),
    [user],
  );

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthenticated: !!user && !!token,
      permissions,
      can,
      isAdminStaff: can(PERMISSIONS.ADMIN_ACCESS),
      login,
      logout,
    }),
    [user, token, permissions, can, login, logout],
  );

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
};
